#!/bin/bash

# setup-all.sh - Complete setup script for ticket booking system
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
APPS_CLUSTER_NAME="ticket-booking-apps"
DATA_CLUSTER_NAME="ticket-booking-data"
REPO_NAME="ticket-booking-repo"

echo "🚀 Starting complete setup for project: $PROJECT_ID"

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
    
    # Check if PROJECT_ID is set
    if [ -z "$PROJECT_ID" ]; then
        print_error "PROJECT_ID is not set. Please set it:"
        echo "export PROJECT_ID=your-project-id"
        exit 1
    fi
    
    # Check if gcloud is installed and authenticated
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed"
        exit 1
    fi
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed"
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

setup_gcp_project() {
    print_status "Setting up GCP project..."
    
    # Set the project
    gcloud config set project $PROJECT_ID
    
    # Enable required APIs
    print_status "Enabling required APIs..."
    gcloud services enable container.googleapis.com
    gcloud services enable artifactregistry.googleapis.com
    gcloud services enable pubsub.googleapis.com
    gcloud services enable compute.googleapis.com
    
    print_success "GCP project setup completed"
}

create_artifact_registry() {
    print_status "Creating Artifact Registry..."
    
    # Create repository if it doesn't exist
    if ! gcloud artifacts repositories describe $REPO_NAME --location=$REGION &> /dev/null; then
        gcloud artifacts repositories create $REPO_NAME \
            --repository-format=docker \
            --location=$REGION \
            --description="Docker repository for ticket booking services"
        print_success "Artifact Registry created"
    else
        print_warning "Artifact Registry already exists"
    fi
    
    # Configure Docker authentication
    gcloud auth configure-docker $REGION-docker.pkg.dev
}

create_pubsub_resources() {
    print_status "Creating Pub/Sub resources..."
    ./setup-pubsub.sh
    print_status "Creating Pub/Sub resources completed"
}

create_gke_clusters() {
    print_status "Creating GKE clusters..."
    
    # Create data cluster
    if ! gcloud container clusters describe $DATA_CLUSTER_NAME --zone=$ZONE &> /dev/null; then
        print_status "Creating data cluster..."
        gcloud container clusters create $DATA_CLUSTER_NAME \
            --zone=$ZONE \
            --num-nodes=2 \
            --machine-type=e2-standard-2 \
            --enable-autoscaling \
            --min-nodes=1 \
            --max-nodes=4 \
            --node-labels=cluster-type=data \
            --enable-autorepair \
            --enable-autoupgrade \
            --disk-size=20GB \
            --disk-type=pd-standard
        print_success "Data cluster created"
    else
        print_warning "Data cluster already exists"
    fi
    
    # Create apps cluster
    if ! gcloud container clusters describe $APPS_CLUSTER_NAME --zone=$ZONE &> /dev/null; then
        print_status "Creating apps cluster..."
        gcloud container clusters create $APPS_CLUSTER_NAME \
            --zone=$ZONE \
            --num-nodes=2 \
            --machine-type=e2-standard-2 \
            --enable-autoscaling \
            --min-nodes=1 \
            --max-nodes=6 \
            --node-labels=cluster-type=apps \
            --enable-autorepair \
            --enable-autoupgrade \
            --disk-size=20GB \
            --disk-type=pd-standard
        print_success "Apps cluster created"
    else
        print_warning "Apps cluster already exists"
    fi
}

build_and_push_images() {
    ./build-push-image.sh
}

update_manifests() {
    print_status "Updating Kubernetes manifests with project-specific values..."
    cd "$(dirname "$0")"
    cd infrastructure/k8s-gke
    # Update PROJECT_ID in all manifest files
    find ./manifests -name "*.yaml" -type f -exec sed -i '' "s/PROJECT_ID/$PROJECT_ID/g" {} \;
    
    # Get data cluster endpoint
    DATA_CLUSTER_ENDPOINT=$(gcloud container clusters describe $DATA_CLUSTER_NAME --zone=$ZONE --format="value(endpoint)")
    
    # Update DATA_CLUSTER_ENDPOINT in app manifests
    find ./manifests/apps-cluster -name "*.yaml" -type f -exec sed -i '' "s/DATA_CLUSTER_ENDPOINT/$DATA_CLUSTER_ENDPOINT/g" {} \;

    print_success "Manifests updated"
}

setup_workload_identity() {
    print_status "Setting up Workload Identity for apps cluster..."
    ./setup-workload-identity.sh
    print_success "Workload Identity setup completed"
}

main() {
    print_status "Starting complete setup for Ticket Booking System"
    print_status "Project ID: $PROJECT_ID"
    print_status "Region: $REGION"
    print_status "Zone: $ZONE"
    
    # check_prerequisites
    setup_gcp_project
    create_artifact_registry
    create_pubsub_resources
    create_gke_clusters
    build_and_push_images
    update_manifests
    
    print_success "Setup completed successfully!"
    print_status "Next steps:"
    echo "1. Run './deploy-data-cluster.sh' to deploy data services"
    echo "2. Run './deploy-apps-cluster.sh' to deploy application services"
    echo "3. Run './get-endpoints.sh' to get service URLs"
}

# Handle script interruption
trap 'print_error "Setup interrupted"; exit 1' INT TERM

# Run main function
main "$@"