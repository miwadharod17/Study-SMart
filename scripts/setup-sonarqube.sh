#!/bin/bash
# Setup SonarQube for local development

set -e

echo "🔧 Setting up SonarQube for Study-Smart..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

# Create sonarqube directory if it doesn't exist
if [ ! -d "sonarqube" ]; then
    echo -e "${YELLOW}📁 Creating sonarqube directory...${NC}"
    mkdir -p sonarqube
fi

# Start SonarQube
echo -e "${YELLOW}🚀 Starting SonarQube services...${NC}"
cd sonarqube
docker-compose up -d

# Wait for SonarQube to be ready
echo -e "${YELLOW}⏳ Waiting for SonarQube to be ready...${NC}"
TIMEOUT=120
ELAPSED=0
INTERVAL=5

while [ $ELAPSED -lt $TIMEOUT ]; do
    if curl -s -f http://localhost:9000/api/system/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ SonarQube is ready!${NC}"
        break
    fi
    echo "   Waiting... ($ELAPSED/$TIMEOUT seconds)"
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    echo -e "${RED}❌ SonarQube failed to start${NC}"
    docker-compose logs sonarqube
    exit 1
fi

cd ..

# Generate default token
echo -e "${YELLOW}🔐 Generating SonarQube token...${NC}"

SONAR_URL="http://localhost:9000"
SONAR_USER="admin"
SONAR_PASSWORD="admin"

# Create token via API
TOKEN=$(curl -s -X POST "$SONAR_URL/api/user_tokens/generate" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "name=jenkins-token" \
  -d "login=$SONAR_USER" \
  -u "$SONAR_USER:$SONAR_PASSWORD" | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Could not auto-generate token. Generate manually:${NC}"
    echo "   1. Go to http://localhost:9000"
    echo "   2. Login with admin/admin"
    echo "   3. Go to User → My Account → Security → Tokens"
    echo "   4. Generate token named 'jenkins-token'"
else
    echo -e "${GREEN}✅ Token generated: ${NC}$TOKEN"
    echo -e "${YELLOW}💾 Add this to Jenkins credentials:${NC}"
    echo "   ID: sonarqube-token"
    echo "   Secret: $TOKEN"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "🌐 Access SonarQube at: ${YELLOW}http://localhost:9000${NC}"
echo "   Username: ${YELLOW}admin${NC}"
echo "   Password: ${YELLOW}admin${NC}"
echo ""
echo "⚠️  ${RED}Change default password immediately!${NC}"
echo ""
echo "📚 Next steps:"
echo "   1. Update Jenkins with SonarQube server URL"
echo "   2. Add authentication token to Jenkins credentials"
echo "   3. Configure quality gate rules in SonarQube"
echo "   4. Update Jenkinsfile SONAR_HOST_URL if needed"
echo ""
