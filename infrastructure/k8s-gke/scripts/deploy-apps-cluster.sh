#!/bin/bash

# deploy-apps-cluster.sh - Deploy application services to GKE
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${PROJECT_ID:-"ticket-booking-471523"}
REGION=${REGION:-"us-east1"}
ZONE=${ZONE:-"us-east1-b"}
CLUSTER_APPS="ticket-booking-apps"
CLUSTER_DATA="ticket-booking-data"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if [ -z "$PROJECT_ID" ]; then
        print_error "PROJECT_ID is not set"
        exit 1
    fi
    
    # Check if both clusters exist
    if ! gcloud container clusters describe $CLUSTER_APPS --zone=$ZONE &> /dev/null; then
        print_error "Apps cluster does not exist. Run setup-all.sh first."
        exit 1
    fi
    
    if ! gcloud container clusters describe $CLUSTER_DATA --zone=$ZONE &> /dev/null; then
        print_error "Data cluster does not exist. Run setup-all.sh first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

connect_to_cluster() {
    print_status "Connecting to apps cluster..."
    gcloud container clusters get-credentials $CLUSTER_APPS --zone=$ZONE --project=$PROJECT_ID
    print_success "Connected to apps cluster"
}

install_nginx_ingress() {
    print_status "Installing NGINX Ingress Controller..."
    
    # Add NGINX Ingress Helm repository
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx 2>/dev/null || true
    helm repo update
    
    # Install NGINX Ingress Controller
    if ! helm list -n ingress-nginx | grep -q nginx-ingress; then
        kubectl create namespace ingress-nginx --dry-run=client -o yaml | kubectl apply -f -
        
        helm install nginx-ingress ingress-nginx/ingress-nginx \
            --namespace ingress-nginx \
            --set controller.service.type=LoadBalancer \
            --set controller.service.annotations."cloud\.google\.com/load-balancer-type"="External" \
            --set controller.config.proxy-read-timeout="3600" \
            --set controller.config.proxy-send-timeout="3600"
        
        print_status "Waiting for NGINX Ingress Controller to be ready..."
        kubectl wait --namespace ingress-nginx \
            --for=condition=ready pod \
            --selector=app.kubernetes.io/component=controller \
            --timeout=300s
    else
        print_warning "NGINX Ingress Controller already installed"
    fi
    
    print_success "NGINX Ingress Controller ready"
}

setup_data_cluster_connection() {
    print_status "Setting up connection to data cluster..."
    
    # Switch to data cluster to get external IPs
    print_status "Getting data cluster credentials..."
    gcloud container clusters get-credentials $CLUSTER_DATA --zone=$ZONE --project=$PROJECT_ID
    
    # Wait for and get external IPs for each service
    print_status "Getting external IPs from data cluster services..."
    
    # Wait for external IPs to be assigned
    print_status "Waiting for LoadBalancer IPs to be assigned..."
    for i in {1..30}; do
        POSTGRES_IP=$(kubectl get service postgres-db -n data-services -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
        REDIS_READ_IP=$(kubectl get service redis-read-service -n data-services -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
        REDIS_WRITE_IP=$(kubectl get service redis-write-service -n data-services -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
        REDIS_QUEUE_IP=$(kubectl get service redis-queue-service -n data-services -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
        ELASTICSEARCH_IP=$(kubectl get service elasticsearch -n data-services -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
        
        if [[ -n "$POSTGRES_IP" && -n "$REDIS_READ_IP" && -n "$REDIS_WRITE_IP" && -n "$REDIS_QUEUE_IP" && -n "$ELASTICSEARCH_IP" ]]; then
            break
        fi
        
        print_status "Waiting for external IPs... (attempt $i/30)"
        sleep 20
    done
    
    if [[ -z "$POSTGRES_IP" || -z "$REDIS_READ_IP" || -z "$REDIS_WRITE_IP" ]]; then
        print_error "Failed to get external IPs from data cluster services"
        exit 1
    fi
    
    print_success "External IPs obtained:"
    echo "   PostgreSQL: $POSTGRES_IP"
    echo "   Redis Read: $REDIS_READ_IP"
    echo "   Redis Write: $REDIS_WRITE_IP"
    echo "   Redis Queue: $REDIS_QUEUE_IP"
    echo "   Elasticsearch: $ELASTICSEARCH_IP"
    
    # Switch back to apps cluster
    print_status "Switching back to apps cluster..."
    gcloud container clusters get-credentials $CLUSTER_APPS --zone=$ZONE --project=$PROJECT_ID
    
    # Navigate to manifests directory
    cd "$(dirname "$0")/../manifests/apps-cluster"
    
    # Update data cluster service manifest with real IPs
    print_status "Creating data cluster service connections..."
    sed "s/POSTGRES_EXTERNAL_IP/$POSTGRES_IP/g" data-cluster-service.yaml | 
    sed "s/REDIS_READ_EXTERNAL_IP/$REDIS_READ_IP/g" | 
    sed "s/REDIS_WRITE_EXTERNAL_IP/$REDIS_WRITE_IP/g" | 
    sed "s/REDIS_QUEUE_EXTERNAL_IP/$REDIS_QUEUE_IP/g" | 
    sed "s/ELASTICSEARCH_EXTERNAL_IP/$ELASTICSEARCH_IP/g" > data-cluster-service-updated.yaml
    
    print_success "Data cluster connection configured"
}

deploy_app_services() {
    print_status "Deploying application services..."
    
    # Apply manifests in order
    print_status "Creating namespace..."
    kubectl apply -f namespace.yaml
    
    # Check if Workload Identity is enabled on the cluster
    echo "🔍 Checking Workload Identity status..."
    WI_STATUS=$(gcloud container clusters describe $CLUSTER_APPS --zone=$ZONE --format="value(workloadIdentityConfig.workloadPool)" 2>/dev/null || echo "")

    if [ -z "$WI_STATUS" ]; then
        echo "⚠️  Workload Identity is not enabled on cluster. Enabling it now..."
        gcloud container clusters update $CLUSTER_APPS \
            --zone=$ZONE \
            --workload-pool=$PROJECT_ID.svc.id.goog \
            --project=$PROJECT_ID
        
        echo "🔄 Updating node pool to use Workload Identity..."
        # Get the default node pool name
        NODE_POOL=$(gcloud container node-pools list --cluster=$CLUSTER_APPS --zone=$ZONE --format="value(name)" | head -n1)
        
        gcloud container node-pools update $NODE_POOL \
            --cluster=$CLUSTER_APPS \
            --zone=$ZONE \
            --workload-metadata=GKE_METADATA \
            --project=$PROJECT_ID
        
        echo "✅ Workload Identity enabled on cluster"
    else
        echo "✅ Workload Identity is already enabled on cluster"
    fi

    print_status "Creating service accounts..."
    kubectl apply -f service-accounts.yaml    

    # Queue service binding
    gcloud iam service-accounts add-iam-policy-binding \
    --role roles/iam.workloadIdentityUser \
    --member "serviceAccount:$PROJECT_ID.svc.id.goog[app-services/queue-service-account]" \
    queue-service@$PROJECT_ID.iam.gserviceaccount.com \
    --project=$PROJECT_ID \
    --quiet

    echo "✅ Queue service Workload Identity binding created"

    # Booking service binding
    gcloud iam service-accounts add-iam-policy-binding \
    --role roles/iam.workloadIdentityUser \
    --member "serviceAccount:$PROJECT_ID.svc.id.goog[app-services/booking-service-account]" \
    booking-service@$PROJECT_ID.iam.gserviceaccount.com \
    --project=$PROJECT_ID \
    --quiet

    echo "✅ Booking service Workload Identity binding created"


    print_status "Setting up data cluster connections..."
    kubectl apply -f data-cluster-service-updated.yaml
    
    print_status "Deploying search service..."
    kubectl apply -f search-service.yaml
    
    print_status "Deploying booking management service..."
    kubectl apply -f booking-management-service.yaml
    
    print_status "Setting up ingress..."
    kubectl apply -f ingress.yaml
    
    # Wait for services to be ready
    print_status "Waiting for search service to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/search-service -n app-services
    
    print_status "Waiting for booking management service to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/booking-management-service -n app-services
    
    print_success "Application services deployed successfully"
}

verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check pod status
    echo ""
    print_status "Pod status:"
    kubectl get pods -n app-services
    
    echo ""
    print_status "Service status:"
    kubectl get services -n app-services
    
    echo ""
    print_status "Ingress status:"
    kubectl get ingress -n app-services
    
    echo ""
    print_status "HPA status:"
    kubectl get hpa -n app-services
    
    # Get load balancer IP
    echo ""
    print_status "Getting load balancer IP..."
    EXTERNAL_IP=""
    while [ -z $EXTERNAL_IP ]; do
        echo "Waiting for external IP..."
        EXTERNAL_IP=$(kubectl get svc nginx-ingress-ingress-nginx-controller -n ingress-nginx --template="{{range .status.loadBalancer.ingress}}{{.ip}}{{end}}")
        [ -z "$EXTERNAL_IP" ] && sleep 10
    done
    
    echo ""
    print_success "Load Balancer IP: $EXTERNAL_IP"
    echo ""
    print_status "API Endpoints:"
    echo "  Search Service: http://$EXTERNAL_IP/api/search"
    echo "  Booking Service: http://$EXTERNAL_IP/api/booking"
    echo "  Queue Service: http://$EXTERNAL_IP/api/queue"
    echo "  WebSocket: ws://$EXTERNAL_IP/api/ws"

    print_success "Apps cluster deployment completed!"
}

main() {
    print_status "Starting apps cluster deployment"
    print_status "Project ID: $PROJECT_ID"
    print_status "Cluster: $CLUSTER_APPS"
    
    check_prerequisites
    connect_to_cluster
    
    # Check if Helm is installed for NGINX
    if ! command -v helm &> /dev/null; then
        print_warning "Helm not found. Installing NGINX Ingress manually..."
        # Use kubectl to install NGINX instead
        kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
        print_status "Waiting for NGINX Ingress Controller to be ready..."
        kubectl wait --namespace ingress-nginx \
            --for=condition=ready pod \
            --selector=app.kubernetes.io/component=controller \
            --timeout=300s
    else
        install_nginx_ingress
    fi
    
    setup_data_cluster_connection
    deploy_app_services
    verify_deployment
    
    print_success "Apps cluster deployment completed successfully!"
    print_status "Optional: Run './deploy-queue-service.sh' to deploy queue service"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"