#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ID=${PROJECT_ID:-"ticket-booking-471523"}
REGION=${REGION:-"us-east1"}
ZONE=${ZONE:-"us-east1-b"}
REPO_NAME="ticket-booking-repo"

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

print_status "Building and pushing Docker images..."

# Navigate to project root
cd "$(dirname "$0")/../../../"

# Build and push search service
if [ -d "search-service" ]; then
    print_status "Building search-service..."
    docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/search-service:latest ./search-service
    docker push $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/search-service:latest
    print_success "Search service image pushed"
fi

# Build and push booking management service
if [ -d "booking-management-service" ]; then
    print_status "Building booking-management-service..."
    docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/booking-management-service:latest ./booking-management-service
    docker push $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/booking-management-service:latest
    print_success "Booking management service image pushed"
fi

# Build and push database seeder
if [ -d "database" ]; then
    print_status "Building database-seeder..."
    docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/database-seeder:latest ./database
    docker push $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/database-seeder:latest
    print_success "Database seeder image pushed"
fi

# Build queue service if it exists
if [ -d "queue-service" ]; then
    print_status "Building queue-service..."
    docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/queue-service:latest ./queue-service
    docker push $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/queue-service:latest
    print_success "Queue service image pushed"
else
    print_warning "Queue service directory not found, skipping..."
fi