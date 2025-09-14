# GKE Ticket Booking System Infrastructure

## Architecture Overview

### Clusters
- **ticket-booking-apps**: Application services cluster
  - booking-management-service
  - search-service
  - queue-service (optional)
  - NGINX Ingress Controller
- **ticket-booking-data**: Data services cluster
  - PostgreSQL
  - Redis (read, write, queue instances)
  - Kafka (with topic creation)

### External Services
- **Google Pub/Sub**: Event-driven communication
- **Google Artifact Registry**: Container images
- **Google Cloud Load Balancer**: External access

## Prerequisites
- Google Cloud Project with $300 credit
- gcloud CLI installed and configured
- kubectl installed
- Docker installed

## Quick Start

### 1. Setup (15-20 minutes)
```bash
# Clone and navigate
cd infrastructure/k8s-gke/scripts
chmod +x *.sh

# Setup everything
./setup-all.sh
```

### 2. Deploy Services (10-15 minutes)
```bash
# Deploy data services first
./deploy-data-cluster.sh

# Deploy application services
./deploy-apps-cluster.sh

# Optional: Deploy queue service
./deploy-queue-service.sh
```

### 3. Get Access URLs
```bash
./get-endpoints.sh
```

### 4. Teardown (5-10 minutes)
```bash
./teardown-all.sh
```

## Manual Step-by-Step Guide

### Phase 1: Initial Setup (15-20 minutes)

1. **Set Environment Variables**
```bash
export PROJECT_ID="your-project-id"
export REGION="us-east1"
export CLUSTER_APPS="ticket-booking-apps"
export CLUSTER_DATA="ticket-booking-data"
```

2. **Enable APIs**
```bash
gcloud services enable container.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable pubsub.googleapis.com
```

3. **Create Artifact Registry**
```bash
gcloud artifacts repositories create ticket-booking-repo \
    --repository-format=docker \
    --location=$REGION
```

4. **Create Pub/Sub Topic**
```bash
gcloud pubsub topics create reservation-confirmed
gcloud pubsub subscriptions create queue-service-sub \
    --topic=reservation-confirmed \
    --ack-deadline=60
```

### Phase 2: Create Clusters (10-15 minutes)

1. **Create Data Cluster**
```bash
gcloud container clusters create $CLUSTER_DATA \
    --zone=$REGION-b \
    --num-nodes=2 \
    --machine-type=e2-standard-2 \
    --enable-autoscaling \
    --min-nodes=1 \
    --max-nodes=4 \
    --node-labels=cluster-type=data
```

2. **Create Apps Cluster**
```bash
gcloud container clusters create $CLUSTER_APPS \
    --zone=$REGION-b \
    --num-nodes=2 \
    --machine-type=e2-standard-2 \
    --enable-autoscaling \
    --min-nodes=1 \
    --max-nodes=6 \
    --node-labels=cluster-type=apps
```

### Phase 3: Deploy Services (15-20 minutes)

See deployment scripts for detailed steps.

## Directory Structure
```
infrastructure/k8s-gke/
├── README.md
├── manifests/
│   ├── data-cluster/
│   ├── apps-cluster/
│   └── shared/
└── scripts/
    ├── setup-all.sh
    ├── deploy-data-cluster.sh
    ├── deploy-apps-cluster.sh
    ├── deploy-queue-service.sh
    ├── teardown-all.sh
    └── get-endpoints.sh
```

## Cost Estimation
- **Data Cluster**: ~$120-150/month
- **Apps Cluster**: ~$100-130/month
- **Pub/Sub**: ~$5-10/month
- **Load Balancer**: ~$20/month
- **Total**: ~$245-310/month (within $300 budget)

## Troubleshooting

### Common Issues
1. **Cluster creation timeout**: Increase timeout or retry
2. **Pod stuck in Pending**: Check node resources
3. **ImagePullBackOff**: Verify Artifact Registry permissions

### Useful Commands
```bash
# Check cluster status
kubectl get nodes
kubectl get pods --all-namespaces

# Check services
kubectl get svc --all-namespaces

# View logs
kubectl logs -f deployment/booking-management-service
```

## Security Notes
- Service accounts have minimal required permissions
- No external database access (cluster-internal only)
- NGINX Ingress handles TLS termination
- Pub/Sub uses IAM authentication