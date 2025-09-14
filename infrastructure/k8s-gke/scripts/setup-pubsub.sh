#!/bin/bash

set -e

PROJECT_ID=${PROJECT_ID:-"ticket-booking-471523"}
TOPIC_NAME="reservation-confirmed"
SUBSCRIPTION_NAME="queue-service-sub"

echo "🚀 Setting up Google PubSub for project: $PROJECT_ID"

# Create PubSub topic
echo "📝 Creating PubSub topic: $TOPIC_NAME"
gcloud pubsub topics create $TOPIC_NAME \
  --project=$PROJECT_ID \
  --quiet || echo "Topic $TOPIC_NAME already exists"

# Create subscription with pull configuration
echo "📬 Creating PubSub subscription: $SUBSCRIPTION_NAME"
gcloud pubsub subscriptions create $SUBSCRIPTION_NAME \
  --topic=$TOPIC_NAME \
  --project=$PROJECT_ID \
  --ack-deadline=60 \
  --retain-acked-messages \
  --message-retention-duration=7d \
  --quiet || echo "Subscription $SUBSCRIPTION_NAME already exists"

# Create service accounts
echo "👤 Creating service accounts..."

# Booking service account (for publishing)
gcloud iam service-accounts create booking-service \
  --display-name="Booking Service Account" \
  --project=$PROJECT_ID \
  --quiet || echo "Booking service account already exists"

# Queue service account (for subscribing)
gcloud iam service-accounts create queue-service \
  --display-name="Queue Service Account" \
  --project=$PROJECT_ID \
  --quiet || echo "Queue service account already exists"

# Grant PubSub permissions
echo "🔐 Setting up IAM permissions..."

# Booking service - can publish to topics
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:booking-service@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/pubsub.publisher" \
  --quiet

# Queue service - can pull from subscriptions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:queue-service@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/pubsub.subscriber" \
  --quiet
echo "✅ PubSub setup completed!"
echo "📊 Topic: $TOPIC_NAME"
echo "📬 Subscription: $SUBSCRIPTION_NAME"
echo "🔐 Service accounts configured:"
echo "   - booking-service: Publisher permissions"
echo "   - queue-service: Subscriber permissions"