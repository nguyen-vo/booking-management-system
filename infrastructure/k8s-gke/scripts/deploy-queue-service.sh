#!/bin/bash

# deploy-queue-service.sh - Deploy queue service (optional)
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
    
    # Check if apps cluster exists
    if ! gcloud container clusters describe $CLUSTER_APPS --zone=$ZONE &> /dev/null; then
        print_error "Apps cluster does not exist. Run setup-all.sh first."
        exit 1
    fi
    
    # Check if queue service image exists
    if ! gcloud artifacts docker images describe $REGION-docker.pkg.dev/$PROJECT_ID/ticket-booking-repo/queue-service:latest &> /dev/null; then
        print_error "Queue service Docker image not found. Please build and push the image first."
        print_status "To build the image, run:"
        echo "cd queue-service"
        echo "docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/ticket-booking-repo/queue-service:latest ."
        echo "docker push $REGION-docker.pkg.dev/$PROJECT_ID/ticket-booking-repo/queue-service:latest"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

connect_to_cluster() {
    print_status "Connecting to apps cluster..."
    gcloud container clusters get-credentials $CLUSTER_APPS --zone=$ZONE --project=$PROJECT_ID
    print_success "Connected to apps cluster"
}

deploy_queue_service() {
    print_status "Deploying queue service..."
    
    # Navigate to manifests directory
    cd "$(dirname "$0")/../manifests/apps-cluster"
    
    # Deploy queue service
    kubectl apply -f queue-service.yaml
    
    # Wait for service to be ready
    print_status "Waiting for queue service to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/queue-service -n app-services
    
    print_success "Queue service deployed successfully"
}

update_ingress() {
    print_status "Updating ingress configuration..."
    
    # The ingress configuration already includes queue service routes
    # Just apply it again to ensure it's updated
    kubectl apply -f ingress.yaml
    
    print_success "Ingress configuration updated"
}

verify_deployment() {
    print_status "Verifying queue service deployment..."
    
    # Check pod status
    echo ""
    print_status "Queue service pod status:"
    kubectl get pods -l app=queue-service -n app-services
    
    echo ""
    print_status "Queue service details:"
    kubectl get deployment queue-service -n app-services
    kubectl get service queue-service -n app-services
    kubectl get hpa queue-service-hpa -n app-services
    
    # Get load balancer IP
    EXTERNAL_IP=$(kubectl get svc nginx-ingress-ingress-nginx-controller -n ingress-nginx --template="{{range .status.loadBalancer.ingress}}{{.ip}}{{end}}")
    
    if [ -n "$EXTERNAL_IP" ]; then
        echo ""
        print_success "Queue Service Endpoints:"
        echo "  HTTP API: http://$EXTERNAL_IP/queue"
        echo "  WebSocket: ws://$EXTERNAL_IP/ws"
        echo ""
        print_status "Test the queue service:"
        echo "  curl http://$EXTERNAL_IP/queue/health"
    fi
    
    print_success "Queue service deployment completed!"
}

main() {
    print_status "Starting queue service deployment"
    print_status "Project ID: $PROJECT_ID"
    print_status "Cluster: $CLUSTER_APPS"
    
    print_warning "This script deploys the queue service."
    print_warning "Make sure you have built and pushed the queue service Docker image."
    read -p "Do you want to continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled"
        exit 0
    fi
    
    check_prerequisites
    connect_to_cluster
    deploy_queue_service
    update_ingress
    verify_deployment
    
    print_success "Queue service deployment completed successfully!"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"