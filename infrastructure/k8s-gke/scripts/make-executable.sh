#!/bin/bash

# make-scripts-executable.sh - Make all scripts executable
chmod +x /Users/nguyenvo/Desktop/Project/Ticket\ Booking/infrastructure/k8s-gke/scripts/*.sh

echo "All scripts are now executable!"
echo ""
echo "Available scripts:"
echo "  setup-all.sh           - Complete initial setup"
echo "  deploy-data-cluster.sh - Deploy data services"
echo "  deploy-apps-cluster.sh - Deploy application services"
echo "  deploy-queue-service.sh - Deploy queue service (optional)"
echo "  get-endpoints.sh       - Get service endpoints and info"
echo "  teardown-all.sh        - Complete teardown"