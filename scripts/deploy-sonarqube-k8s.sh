#!/bin/bash
# Deploy SonarQube to Kubernetes

set -e

echo "🚀 Deploying SonarQube to Kubernetes..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check kubectl
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed${NC}"
    exit 1
fi

# Check namespace
NAMESPACE="study-smart"
if ! kubectl get namespace $NAMESPACE &> /dev/null; then
    echo -e "${YELLOW}📁 Creating namespace: $NAMESPACE${NC}"
    kubectl create namespace $NAMESPACE
fi

# Apply configurations in order
echo -e "${YELLOW}📦 Applying Kubernetes configurations...${NC}"

configs=(
    "kubernetes/configmaps/sonarqube-config.yaml"
    "kubernetes/secrets/sonarqube-secrets.yaml"
    "kubernetes/storage/sonarqube-pvc.yaml"
    "kubernetes/deployments/postgres-sonar-deployment.yaml"
    "kubernetes/deployments/sonarqube-deployment.yaml"
    "kubernetes/services/sonarqube-service.yaml"
    "kubernetes/ingress/sonarqube-ingress.yaml"
)

for config in "${configs[@]}"; do
    if [ -f "$config" ]; then
        echo -e "   ${YELLOW}→${NC} Applying $config"
        kubectl apply -f "$config"
    else
        echo -e "   ${RED}✗${NC} File not found: $config"
    fi
done

# Wait for PostgreSQL
echo ""
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
kubectl rollout status deployment/postgres-sonar -n $NAMESPACE --timeout=5m

# Wait for SonarQube
echo ""
echo -e "${YELLOW}⏳ Waiting for SonarQube to be ready...${NC}"
kubectl rollout status deployment/sonarqube -n $NAMESPACE --timeout=10m

echo ""
echo -e "${GREEN}✅ SonarQube deployed successfully!${NC}"
echo ""

# Get service information
echo "🔗 Service Information:"
SONAR_SERVICE=$(kubectl get svc sonarqube -n $NAMESPACE -o jsonpath='{.spec.clusterIP}:{.spec.ports[0].port}')
echo "   Internal: $SONAR_SERVICE"

# Check for ingress
if kubectl get ingress sonarqube-ingress -n $NAMESPACE &> /dev/null; then
    echo "   Ingress: http://sonarqube.studysmart.com"
fi

echo ""
echo "📊 Verify deployment:"
echo "   ${YELLOW}kubectl get pods -n $NAMESPACE -l app=sonarqube${NC}"
echo "   ${YELLOW}kubectl logs -f deployment/sonarqube -n $NAMESPACE${NC}"
echo ""
echo "🔑 Default credentials:"
echo "   Username: admin"
echo "   Password: Check kubernetes/secrets/sonarqube-secrets.yaml"
echo ""
