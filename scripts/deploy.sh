#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting deployment for Study-SMart...${NC}"

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ .env.production file not found!${NC}"
    exit 1
fi

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker is required but not installed.${NC}" >&2; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo -e "${YELLOW}⚠️  kubectl not found. Will use docker-compose.${NC}"; USE_K8S=false; }

# Build Docker images
echo -e "${GREEN}📦 Building Docker images...${NC}"
docker build -t study-smart-frontend:latest ./frontend
docker build -t study-smart-payment:latest ./backend/services/payment-service
docker build -t study-smart-forum:latest ./backend/services/forum-service
docker build -t study-smart-crud:latest ./backend/services/crud-service

# Push to registry if specified
if [ -n "$DOCKER_REGISTRY" ]; then
    echo -e "${GREEN}📤 Pushing images to $DOCKER_REGISTRY...${NC}"
    docker tag study-smart-frontend:latest $DOCKER_REGISTRY/studysmart-frontend:latest
    docker tag study-smart-payment:latest $DOCKER_REGISTRY/studysmart-payment:latest
    docker tag study-smart-forum:latest $DOCKER_REGISTRY/studysmart-forum:latest
    docker tag study-smart-crud:latest $DOCKER_REGISTRY/studysmart-crud:latest
    
    docker push $DOCKER_REGISTRY/studysmart-frontend:latest
    docker push $DOCKER_REGISTRY/studysmart-payment:latest
    docker push $DOCKER_REGISTRY/studysmart-forum:latest
    docker push $DOCKER_REGISTRY/studysmart-crud:latest
fi

# Deploy to Kubernetes or Docker Compose
if [ "$USE_K8S" = true ]; then
    echo -e "${GREEN}☸️  Deploying to Kubernetes...${NC}"
    kubectl apply -f kubernetes/namespaces/
    kubectl apply -f kubernetes/configmaps/
    kubectl apply -f kubernetes/secrets/
    kubectl apply -f kubernetes/deployments/
    kubectl apply -f kubernetes/services/
    kubectl apply -f kubernetes/ingress/
    
    # Wait for deployments to be ready
    kubectl wait --for=condition=available --timeout=300s deployment/payment-service -n study-smart
    kubectl wait --for=condition=available --timeout=300s deployment/forum-service -n study-smart
    kubectl wait --for=condition=available --timeout=300s deployment/crud-service -n study-smart
    kubectl wait --for=condition=available --timeout=300s deployment/frontend -n study-smart
else
    echo -e "${GREEN}🐳 Deploying with Docker Compose...${NC}"
    docker-compose -f docker-compose.yml up -d --build
    
    # Wait for services to be healthy
    sleep 10
fi

# Run database migrations
echo -e "${GREEN}🗄️  Running database migrations...${NC}"
docker exec study_smart_postgres psql -U $DB_USER -d $DB_NAME -f /docker-entrypoint-initdb.d/001_create_users.sql
docker exec study_smart_postgres psql -U $DB_USER -d $DB_NAME -f /docker-entrypoint-initdb.d/002_create_books.sql
docker exec study_smart_postgres psql -U $DB_USER -d $DB_NAME -f /docker-entrypoint-initdb.d/003_create_orders.sql
docker exec study_smart_postgres psql -U $DB_USER -d $DB_NAME -f /docker-entrypoint-initdb.d/004_create_forum.sql
docker exec study_smart_postgres psql -U $DB_USER -d $DB_NAME -f /docker-entrypoint-initdb.d/005_create_payments.sql

# Health check
echo -e "${GREEN}🏥 Running health checks...${NC}"
sleep 5

if curl -f http://localhost/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API Gateway is healthy${NC}"
else
    echo -e "${RED}❌ API Gateway health check failed${NC}"
    exit 1
fi

if curl -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Prometheus is healthy${NC}"
else
    echo -e "${RED}❌ Prometheus health check failed${NC}"
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}📊 Grafana: http://localhost:3000 (admin/$GRAFANA_PASSWORD)${NC}"
echo -e "${GREEN}📈 Prometheus: http://localhost:9090${NC}"
