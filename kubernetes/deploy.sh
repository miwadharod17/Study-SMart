#!/bin/bash

# Study Smart Kubernetes Deployment Script
# Deploy all services to Kubernetes

set -e

NAMESPACE="study-smart"
KUBE_DIR="kubernetes"

echo "🚀 Study Smart Kubernetes Deployment"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

function step() {
    echo -e "${BLUE}▶ $1${NC}"
}

function success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Step 1: Verify Kubernetes
step "Verifying Kubernetes cluster..."
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Kubernetes not found. Please start Docker Desktop, Minikube, or K3s"
    exit 1
fi
success "Kubernetes cluster is running"
echo ""

# Step 2: Create Namespace
step "Creating namespace '$NAMESPACE'..."
kubectl apply -f "$KUBE_DIR/namespaces/study-smart.yaml"
success "Namespace created"
echo ""

# Step 3: ConfigMaps
step "Applying ConfigMaps..."
kubectl apply -f "$KUBE_DIR/configmaps/" --namespace=$NAMESPACE
success "ConfigMaps applied"
echo ""

# Step 4: Secrets
step "Applying Secrets..."
kubectl apply -f "$KUBE_DIR/secrets/" --namespace=$NAMESPACE
success "Secrets applied"
echo ""

# Step 5: Storage
step "Setting up Storage..."
kubectl apply -f "$KUBE_DIR/storage/" --namespace=$NAMESPACE
success "Storage configured"
echo ""

# Step 6: PostgreSQL
step "Deploying PostgreSQL..."
kubectl apply -f "$KUBE_DIR/deployments/postgres-deployment.yaml"
kubectl apply -f "$KUBE_DIR/services/postgres-service.yaml"
echo "  ⏳ Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s 2>/dev/null || echo "  ℹ️  PostgreSQL startup continuing..."
success "PostgreSQL deployed"
echo ""

# Step 7: Microservices
step "Deploying Microservices..."
for service in crud forum payment; do
    echo "  📦 Deploying $service-service..."
    kubectl apply -f "$KUBE_DIR/deployments/${service}-deployment.yaml"
    kubectl apply -f "$KUBE_DIR/services/${service}-service.yaml"
done
success "Microservices deployed"
echo ""

# Step 8: Wait for all services
step "Waiting for services to be ready..."
for service in crud forum payment; do
    echo "  ⏳ Waiting for $service-service..."
    kubectl wait --for=condition=available --timeout=300s deployment/$service-service -n $NAMESPACE 2>/dev/null || echo "  ℹ️  $service-service startup continuing..."
done
success "Services ready"
echo ""

# Step 9: Ingress
step "Setting up Ingress..."
kubectl apply -f "$KUBE_DIR/ingress/ingress.yaml"
success "Ingress configured"
echo ""

# Step 10: HPA
step "Setting up Horizontal Pod Autoscaling..."
kubectl apply -f "$KUBE_DIR/hpa/" --namespace=$NAMESPACE
success "HPA configured"
echo ""

# Step 11: Show Status
echo -e "${BLUE}═════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Deployment Status${NC}"
echo -e "${BLUE}═════════════════════════════════════════${NC}"
echo ""

echo "Pods:"
kubectl get pods -n $NAMESPACE
echo ""

echo "Services:"
kubectl get svc -n $NAMESPACE
echo ""

echo "Deployments:"
kubectl get deployments -n $NAMESPACE
echo ""

echo "Ingress:"
kubectl get ingress -n $NAMESPACE
echo ""

# Step 12: Next Steps
echo -e "${BLUE}═════════════════════════════════════════${NC}"
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo -e "${BLUE}═════════════════════════════════════════${NC}"
echo ""
echo "1. Setup port forwarding (choose one):"
echo "   ${YELLOW}kubectl port-forward -n $NAMESPACE svc/api-gateway 8080:80${NC}"
echo ""
echo "2. Test routes:"
echo "   ${YELLOW}bash kubernetes/test-routes.sh${NC}"
echo ""
echo "3. View logs:"
echo "   ${YELLOW}kubectl logs -f -n $NAMESPACE -l app=crud-service${NC}"
echo ""
echo "4. Access services (after port-forward):"
echo "   ${YELLOW}curl http://localhost:8080/api/books${NC}"
echo ""
success "Deployment complete!"
