#!/bin/bash

# deploy-data-cluster-fixed.sh - Deploy data services with LoadBalancer
set -e

PROJECT_ID=${PROJECT_ID:-"ticket-booking-471523"}
REGION=${REGION:-"us-east1"}
ZONE=${ZONE:-"us-east1-b"}
CLUSTER_DATA="ticket-booking-data"

echo "🚀 Deploying data cluster with LoadBalancer services"

# Connect to data cluster
gcloud container clusters get-credentials $CLUSTER_DATA --zone=$ZONE --project=$PROJECT_ID

# Deploy all data services
echo "📁 Creating namespace..."
kubectl apply -f ../manifests/data-cluster/namespace.yaml

echo "🐘 Deploying PostgreSQL..."
kubectl apply -f ../manifests/data-cluster/postgres.yaml

echo "🔴 Deploying Redis services..."
kubectl apply -f ../manifests/data-cluster/redis.yaml

echo "🔍 Deploying Elasticsearch..."
kubectl apply -f ../manifests/data-cluster/elasticsearch.yaml

echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/postgres-db -n data-services
kubectl wait --for=condition=available --timeout=300s deployment/redis-read -n data-services
kubectl wait --for=condition=available --timeout=300s deployment/redis-write -n data-services
kubectl wait --for=condition=available --timeout=300s deployment/redis-queue -n data-services
kubectl wait --for=condition=available --timeout=300s deployment/elasticsearch -n data-services

echo "🌱 Seeding database..."
kubectl apply -f ../manifests/data-cluster/seeder.yaml
kubectl wait --for=condition=complete --timeout=600s job/database-seeder -n data-services

echo "✅ Data cluster deployed successfully!"
echo "📊 Services:"
echo "Verifying deployment..."
  
# Check pod status
echo ""
echo "Pod status:"
kubectl get pods -n data-services

echo ""
echo "Service status:"
kubectl get services -n data-services

echo ""
echo "PVC status:"
kubectl get pvc -n data-services

echo ""
echo "Job status:"
kubectl get jobs -n data-services

echo "Data cluster deployment completed!"