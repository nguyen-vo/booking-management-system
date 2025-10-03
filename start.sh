#!/bin/sh
# curl -fsSL https://elastic.co/start-local | sh
# if ! docker network ls | grep -q ticket_booking_network; then
#     echo "Creating ticket_booking_network..."
#     docker network create ticket_booking_network --driver bridge
# fi
echo "Starting Elasticsearch..."
elastic-start-local/start.sh

echo "Starting main services..."
docker compose -f docker-compose.yml up -d --build
