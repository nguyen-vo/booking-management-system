#!/bin/bash

# get-endpoints.sh - Get service endpoints and useful information
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

print_header() {
    echo ""
    echo "================================"
    echo "$1"
    echo "================================"
}

get_external_endpoints() {
    print_header "EXTERNAL ENDPOINTS"
    
    # Connect to apps cluster
    gcloud container clusters get-credentials $CLUSTER_APPS --zone=$ZONE --project=$PROJECT_ID &> /dev/null
    
    # Get load balancer IP
    EXTERNAL_IP=$(kubectl get svc nginx-ingress-ingress-nginx-controller -n ingress-nginx --template="{{range .status.loadBalancer.ingress}}{{.ip}}{{end}}" 2>/dev/null || echo "")
    
    if [ -n "$EXTERNAL_IP" ]; then
        print_success "Load Balancer IP: $EXTERNAL_IP"
        echo ""
        echo "🌐 API Endpoints:"
        echo "   Search Service:    http://$EXTERNAL_IP/search"
        echo "   Booking Service:   http://$EXTERNAL_IP/booking"
        echo "   Queue Service:     http://$EXTERNAL_IP/queue"
        echo "   WebSocket:         ws://$EXTERNAL_IP/ws"
        echo ""
        echo "🔍 Health Check URLs:"
        echo "   Search Health:     http://$EXTERNAL_IP/search/health"
        echo "   Booking Health:    http://$EXTERNAL_IP/booking/health"
        echo "   Queue Health:      http://$EXTERNAL_IP/queue/health"
        echo ""
        echo "📝 Example API Calls:"
        echo "   curl http://$EXTERNAL_IP/search/health"
        echo "   curl http://$EXTERNAL_IP/booking/health"
        echo "   curl http://$EXTERNAL_IP/queue/health"
    else
        print_warning "Load Balancer IP not found or still provisioning..."
        print_status "Run this script again in a few minutes."
    fi
}

get_cluster_info() {
    print_header "CLUSTER INFORMATION"
    
    # Apps Cluster Info
    print_status "Apps Cluster ($CLUSTER_APPS):"
    gcloud container clusters get-credentials $CLUSTER_APPS --zone=$ZONE --project=$PROJECT_ID &> /dev/null
    
    echo "📊 Cluster Status:"
    kubectl get nodes --no-headers | while read line; do
        echo "   $line"
    done
    
    echo ""
    echo "🚀 Application Pods:"
    kubectl get pods -n app-services --no-headers | while read line; do
        echo "   $line"
    done
    
    echo ""
    echo "📈 Horizontal Pod Autoscalers:"
    kubectl get hpa -n app-services --no-headers | while read line; do
        echo "   $line"
    done
    
    echo ""
    # Data Cluster Info
    print_status "Data Cluster ($CLUSTER_DATA):"
    gcloud container clusters get-credentials $CLUSTER_DATA --zone=$ZONE --project=$PROJECT_ID &> /dev/null
    
    echo "📊 Cluster Status:"
    kubectl get nodes --no-headers | while read line; do
        echo "   $line"
    done
    
    echo ""
    echo "💾 Data Service Pods:"
    kubectl get pods -n data-services --no-headers | while read line; do
        echo "   $line"
    done
}

get_service_details() {
    print_header "SERVICE DETAILS"
    
    # Apps Cluster Services
    gcloud container clusters get-credentials $CLUSTER_APPS --zone=$ZONE --project=$PROJECT_ID &> /dev/null
    print_status "Application Services:"
    kubectl get services -n app-services
    
    echo ""
    # Data Cluster Services  
    gcloud container clusters get-credentials $CLUSTER_DATA --zone=$ZONE --project=$PROJECT_ID &> /dev/null
    print_status "Data Services:"
    kubectl get services -n data-services
}

get_storage_info() {
    print_header "STORAGE INFORMATION"
    
    gcloud container clusters get-credentials $CLUSTER_DATA --zone=$ZONE --project=$PROJECT_ID &> /dev/null
    
    print_status "Persistent Volume Claims:"
    kubectl get pvc -n data-services
    
    echo ""
    print_status "Persistent Volumes:"
    kubectl get pv
}

get_monitoring_info() {
    print_header "MONITORING & LOGS"
    
    echo "📊 Google Cloud Console Links:"
    echo "   GKE Clusters:      https://console.cloud.google.com/kubernetes/list?project=$PROJECT_ID"
    echo "   Load Balancers:    https://console.cloud.google.com/net-services/loadbalancing/list/loadBalancers?project=$PROJECT_ID"
    echo "   Artifact Registry: https://console.cloud.google.com/artifacts?project=$PROJECT_ID"
    echo "   Pub/Sub Topics:    https://console.cloud.google.com/cloudpubsub/topic/list?project=$PROJECT_ID"
    echo ""
    echo "📝 Useful kubectl commands:"
    echo "   kubectl logs -f deployment/search-service -n app-services"
    echo "   kubectl logs -f deployment/booking-management-service -n app-services"
    echo "   kubectl logs -f deployment/postgres-db -n data-services"
    echo "   kubectl get events --sort-by=.metadata.creationTimestamp -n app-services"
    echo "   kubectl top pods -n app-services"
    echo "   kubectl top nodes"
}

get_troubleshooting_info() {
    print_header "TROUBLESHOOTING"
    
    echo "🔧 Common Issues & Solutions:"
    echo ""
    echo "1. Pod stuck in Pending:"
    echo "   kubectl describe pod <pod-name> -n <namespace>"
    echo "   kubectl get events --sort-by=.metadata.creationTimestamp -n <namespace>"
    echo ""
    echo "2. ImagePullBackOff:"
    echo "   gcloud auth configure-docker $REGION-docker.pkg.dev"
    echo "   Check if image exists in Artifact Registry"
    echo ""
    echo "3. Service not accessible:"
    echo "   kubectl get ingress -n app-services"
    echo "   kubectl logs -f deployment/nginx-ingress-controller -n ingress-nginx"
    echo ""
    echo "4. Database connection issues:"
    echo "   kubectl exec -it deployment/postgres-db -n data-services -- psql -U postgres -d ticket_booking"
    echo ""
    echo "5. Check resource usage:"
    echo "   kubectl top pods --all-namespaces"
    echo "   kubectl top nodes"
}

main() {
    if [ -z "$PROJECT_ID" ]; then
        print_error "PROJECT_ID is not set"
        echo "Please run: export PROJECT_ID=your-project-id"
        exit 1
    fi
    
    print_status "Getting endpoint information for project: $PROJECT_ID"
    
    get_external_endpoints
    get_cluster_info
    get_service_details
    get_storage_info
    get_monitoring_info
    get_troubleshooting_info
    
    print_header "SUMMARY"
    print_success "Infrastructure is ready!"
    print_status "Save this information for future reference."
    print_status "To tear down everything, run: './teardown-all.sh'"
}

# Run main function
main "$@"