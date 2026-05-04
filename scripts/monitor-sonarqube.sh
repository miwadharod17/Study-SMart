#!/bin/bash
# Monitor SonarQube health and metrics

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SONAR_URL="${1:-http://localhost:9000}"

echo -e "${BLUE}📊 SonarQube Health Monitor${NC}"
echo "   URL: $SONAR_URL"
echo ""

# Check connectivity
echo -e "${YELLOW}🔗 Checking connectivity...${NC}"
if curl -s -f "$SONAR_URL/api/system/health" > /dev/null; then
    echo -e "   ${GREEN}✅ Connected${NC}"
else
    echo -e "   ${RED}❌ Connection failed${NC}"
    exit 1
fi

# System Health
echo ""
echo -e "${YELLOW}💊 System Health:${NC}"
HEALTH=$(curl -s "$SONAR_URL/api/system/health" | jq -r '.health')
echo "   Status: $HEALTH"

# System Info
echo ""
echo -e "${YELLOW}ℹ️  System Information:${NC}"
SYSTEM_INFO=$(curl -s "$SONAR_URL/api/system/info")
VERSION=$(echo "$SYSTEM_INFO" | jq -r '.version')
DATABASE=$(echo "$SYSTEM_INFO" | jq -r '.Database.version // "Unknown"')
echo "   SonarQube Version: $VERSION"
echo "   Database: $DATABASE"

# Project Count
echo ""
echo -e "${YELLOW}📁 Projects:${NC}"
PROJECT_COUNT=$(curl -s "$SONAR_URL/api/projects/search" | jq '.paging.total')
echo "   Total Projects: $PROJECT_COUNT"

# Quality Gates
echo ""
echo -e "${YELLOW}🎯 Quality Gates:${NC}"
QUALITY_GATES=$(curl -s "$SONAR_URL/api/qualitygates/list" | jq '.qualitygates | length')
echo "   Total Quality Gates: $QUALITY_GATES"

# Database Info
echo ""
echo -e "${YELLOW}🗄️  Database Status:${NC}"
DB_DRIVER=$(echo "$SYSTEM_INFO" | jq -r '.Database.name // "Unknown"')
echo "   Driver: $DB_DRIVER"

# Performance Metrics
echo ""
echo -e "${YELLOW}⚡ Performance:${NC}"
METRICS=$(curl -s "$SONAR_URL/api/system/metrics")
ISSUES=$(echo "$METRICS" | jq '.measures[] | select(.metric=="issues") | .value // "0"' | head -1)
COVERAGE=$(echo "$METRICS" | jq '.measures[] | select(.metric=="coverage") | .value // "0"' | head -1)
echo "   Issues: $ISSUES"
echo "   Coverage: $COVERAGE%"

# Disk Usage
echo ""
echo -e "${YELLOW}💾 Storage:${NC}"
DISK_FREE=$(echo "$SYSTEM_INFO" | jq -r '.ElasticSearch.".es.indices.segments.memory.percent // "Unknown"' 2>/dev/null || echo "N/A")
echo "   Disk: Check directly via Kubernetes"

echo ""
echo -e "${GREEN}✅ Health check complete${NC}"
echo ""
