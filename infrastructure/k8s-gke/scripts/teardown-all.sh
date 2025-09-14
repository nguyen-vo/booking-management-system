#!/bin/bash

# teardown-all.sh - Complete teardown script for ticket booking system
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

confirm_teardown() {
    print_warning "This will DELETE ALL resources including:"
    echo "  - GKE Clusters ($CLUSTER_APPS, $CLUSTER_DATA)"
    echo "  - Artifact Registry ($REPO_NAME)"
    echo "  - Pub/Sub Topic and Subscription"
    echo "  - Load Balancers"
    echo "  - Persistent Disks"
    echo "  - All data will be PERMANENTLY LOST"
    echo ""
    print_warning "This action cannot be undone!"
    echo ""
    read -p "Are you sure you want to proceed? Type 'DELETE' to confirm: " confirmation
    
    if [ "$confirmation" != "DELETE" ]; then
        print_status "Teardown cancelled"
        exit 0
    fi
}

delete_gke_clusters() {
    print_status "Deleting GKE clusters..."
    
    # Delete apps cluster
    if gcloud container clusters describe $CLUSTER_APPS --zone=$ZONE &> /dev/null; then
        print_status "Deleting apps cluster..."
        gcloud container clusters delete $CLUSTER_APPS --zone=$ZONE --quiet
        print_success "Apps cluster deleted"
    else
        print_warning "Apps cluster not found"
    fi
    
    # Delete data cluster
    if gcloud container clusters describe $CLUSTER_DATA --zone=$ZONE &> /dev/null; then
        print_status "Deleting data cluster..."
        gcloud container clusters delete $CLUSTER_DATA --zone=$ZONE --quiet
        print_success "Data cluster deleted"
    else
        print_warning "Data cluster not found"
    fi
}

delete_load_balancers() {
    print_status "Deleting load balancers..."
    
    # List and delete forwarding rules
    print_status "Checking for forwarding rules..."
    FORWARDING_RULES=$(gcloud compute forwarding-rules list --filter="description~'ticket-booking'" --format="value(name)" 2>/dev/null || true)
    for rule in $FORWARDING_RULES; do
        if [ -n "$rule" ]; then
            print_status "Deleting forwarding rule: $rule"
            gcloud compute forwarding-rules delete $rule --global --quiet 2>/dev/null || \
            gcloud compute forwarding-rules delete $rule --region=$REGION --quiet 2>/dev/null || true
        fi
    done
    
    # List and delete target pools
    print_status "Checking for target pools..."
    TARGET_POOLS=$(gcloud compute target-pools list --filter="description~'ticket-booking'" --format="value(name)" 2>/dev/null || true)
    for pool in $TARGET_POOLS; do
        if [ -n "$pool" ]; then
            print_status "Deleting target pool: $pool"
            gcloud compute target-pools delete $pool --region=$REGION --quiet 2>/dev/null || true
        fi
    done
    
    print_success "Load balancers cleaned up"
}

delete_persistent_disks() {
    print_status "Deleting persistent disks..."
    
    # List and delete disks that might be left over
    DISKS=$(gcloud compute disks list --filter="zone:$ZONE AND (name~'postgres' OR name~'kafka')" --format="value(name)" 2>/dev/null || true)
    for disk in $DISKS; do
        if [ -n "$disk" ]; then
            print_status "Deleting disk: $disk"
            gcloud compute disks delete $disk --zone=$ZONE --quiet 2>/dev/null || true
        fi
    done
    
    print_success "Persistent disks cleaned up"
}

delete_artifact_registry() {
    print_status "Deleting Artifact Registry..."
    
    if gcloud artifacts repositories describe $REPO_NAME --location=$REGION &> /dev/null; then
        gcloud artifacts repositories delete $REPO_NAME --location=$REGION --quiet
        print_success "Artifact Registry deleted"
    else
        print_warning "Artifact Registry not found"
    fi
}


cleanup_firewall_rules() {
    print_status "Cleaning up firewall rules..."
    
    # List and delete GKE-related firewall rules
    FIREWALL_RULES=$(gcloud compute firewall-rules list --filter="name~'gke-$CLUSTER_APPS' OR name~'gke-$CLUSTER_DATA'" --format="value(name)" 2>/dev/null || true)
    for rule in $FIREWALL_RULES; do
        if [ -n "$rule" ]; then
            print_status "Deleting firewall rule: $rule"
            gcloud compute firewall-rules delete $rule --quiet 2>/dev/null || true
        fi
    done
    
    print_success "Firewall rules cleaned up"
}

verify_cleanup() {
    print_status "Verifying cleanup..."
    
    # Check if clusters are gone
    if gcloud container clusters describe $CLUSTER_APPS --zone=$ZONE &> /dev/null; then
        print_warning "Apps cluster still exists"
    fi
    
    if gcloud container clusters describe $CLUSTER_DATA --zone=$ZONE &> /dev/null; then
        print_warning "Data cluster still exists"
    fi
    
    # Check if artifact registry is gone
    if gcloud artifacts repositories describe $REPO_NAME --location=$REGION &> /dev/null; then
        print_warning "Artifact Registry still exists"
    fi
    
    # Check remaining compute resources
    echo ""
    print_status "Remaining compute resources:"
    gcloud compute instances list --filter="zone:$ZONE" 2>/dev/null || true
    echo ""
    print_status "Remaining disks:"
    gcloud compute disks list --filter="zone:$ZONE" 2>/dev/null || true
    echo ""
    print_status "Remaining load balancers:"
    gcloud compute forwarding-rules list 2>/dev/null || true
    
    print_success "Cleanup verification completed"
}

main() {
    print_status "Starting complete teardown for Ticket Booking System"
    print_status "Project ID: $PROJECT_ID"
    print_status "Region: $REGION"
    print_status "Zone: $ZONE"
    
    if [ -z "$PROJECT_ID" ]; then
        print_error "PROJECT_ID is not set"
        exit 1
    fi
    
    confirm_teardown
    
    print_status "Beginning teardown process..."
    
    delete_gke_clusters
    delete_load_balancers
    delete_persistent_disks
    delete_artifact_registry
    cleanup_firewall_rules
    verify_cleanup
    
    print_success "Teardown completed successfully!"
    print_status "All resources have been deleted."
    print_status "You can now use this setup in a new GCP project."
}

# Handle script interruption
trap 'print_error "Teardown interrupted"; exit 1' INT TERM

# Run main function
main "$@"