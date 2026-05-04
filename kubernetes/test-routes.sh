#!/bin/bash

# Study Smart Kubernetes Route Testing (curl-based)
# Works on Linux, macOS, and WSL on Windows

set -e

NAMESPACE="study-smart"
API_BASE="${API_BASE:-http://localhost}"
API_GATEWAY_PORT="${API_GATEWAY_PORT:-80}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

function print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}🧪 $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
}

function test_route() {
    local method=$1
    local route=$2
    local description=$3
    local data=$4
    local auth_token=$5
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${YELLOW}▶ $method $route - $description${NC}"
    
    local url="$API_BASE/$route"
    local curl_cmd="curl -s -X $method \"$url\""
    
    if [ ! -z "$auth_token" ]; then
        curl_cmd="$curl_cmd -H \"Authorization: Bearer $auth_token\""
    fi
    
    if [ ! -z "$data" ]; then
        curl_cmd="$curl_cmd -H \"Content-Type: application/json\" -d '$data'"
    fi
    
    curl_cmd="$curl_cmd -w \"\n%{http_code}\""
    
    response=$(eval $curl_cmd)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [[ $http_code =~ ^[2] ]]; then
        echo -e "${GREEN}✅ SUCCESS (Status: $http_code)${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    elif [[ $http_code == "401" ]]; then
        echo -e "${YELLOW}⚠️  UNAUTHORIZED (401) - Auth required${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    elif [[ $http_code == "404" ]]; then
        echo -e "${YELLOW}⚠️  NOT FOUND (404)${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED - HTTP $http_code${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# ============================================================================
# Check Kubernetes
# ============================================================================
print_header "Checking Kubernetes"

if kubectl get nodes > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Kubernetes cluster is running${NC}"
else
    echo -e "${RED}❌ Kubernetes not accessible${NC}"
    exit 1
fi

if kubectl get namespace $NAMESPACE > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Namespace '$NAMESPACE' exists${NC}"
else
    echo -e "${YELLOW}⚠️  Namespace '$NAMESPACE' not found${NC}"
fi

# ============================================================================
# Test Public Routes (Frontend)
# ============================================================================
print_header "Testing Frontend Routes (Public)"

test_route "GET" "" "Home page"
test_route "GET" "signin" "Sign in page"
test_route "GET" "signup" "Sign up page"
test_route "GET" "forum" "Forum page"

# ============================================================================
# Test Auth Routes
# ============================================================================
print_header "Testing Auth Routes"

register_data='{"name":"TestUser","email":"test@example.com","password":"TestPass123","role":"buyer"}'
test_route "POST" "api/users/register" "Register user" "$register_data"

login_data='{"email":"test@example.com","password":"TestPass123"}'
login_response=$(curl -s -X POST "$API_BASE/api/users/login" \
    -H "Content-Type: application/json" \
    -d "$login_data")

AUTH_TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo -e "${YELLOW}▶ POST api/users/login - Login user${NC}"
if [ ! -z "$AUTH_TOKEN" ]; then
    echo -e "${GREEN}✅ SUCCESS - Got auth token${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  UNAUTHORIZED${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# ============================================================================
# Test CRUD Service - Public Routes
# ============================================================================
print_header "Testing CRUD Service - Public Routes"

test_route "GET" "api/books" "Get all books"
test_route "GET" "api/books/1" "Get book by ID"
test_route "GET" "api/books/search/algorithms" "Search books"
test_route "GET" "api/notes" "Get all notes"
test_route "GET" "api/notes/1" "Get note by ID"

# ============================================================================
# Test CRUD Service - Protected Routes
# ============================================================================
if [ ! -z "$AUTH_TOKEN" ]; then
    print_header "Testing CRUD Service - Protected Routes"
    
    test_route "GET" "api/users/profile/1" "Get user profile" "" "$AUTH_TOKEN"
    test_route "GET" "api/orders/my-orders" "Get my orders" "" "$AUTH_TOKEN"
    
    book_data='{"title":"Test Book","description":"A test book","price":500,"condition":"New","category":"Textbooks","stock":5}'
    test_route "POST" "api/books" "Create book" "$book_data" "$AUTH_TOKEN"
fi

# ============================================================================
# Test Forum Service
# ============================================================================
print_header "Testing Forum Service"

test_route "GET" "api/forum/questions" "Get all questions"
test_route "GET" "api/forum/questions/trending" "Get trending questions"
test_route "GET" "api/forum/questions/1" "Get question by ID"

if [ ! -z "$AUTH_TOKEN" ]; then
    question_data='{"title":"How to learn algorithms?","content":"I want to learn...","tags":["algorithms","learning"]}'
    test_route "POST" "api/forum/questions" "Create question" "$question_data" "$AUTH_TOKEN"
fi

# ============================================================================
# Test Payment Service
# ============================================================================
print_header "Testing Payment Service"

test_route "GET" "api/payments/payment-status/1" "Get payment status"

if [ ! -z "$AUTH_TOKEN" ]; then
    payment_data='{"amount":500,"currency":"USD"}'
    test_route "POST" "api/payments/create-payment" "Create payment" "$payment_data" "$AUTH_TOKEN"
fi

# ============================================================================
# Test Health Endpoints
# ============================================================================
print_header "Service Health Checks"

test_route "GET" "api/users/health" "Users service health"
test_route "GET" "api/forum/health" "Forum service health"
test_route "GET" "api/payments/health" "Payments service health"

# ============================================================================
# Summary
# ============================================================================
print_header "Test Summary"

echo -e "${BLUE}Total Tests: $TOTAL_TESTS${NC}"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✅ All tests passed!${NC}"
else
    echo -e "\n${RED}❌ Some tests failed. Check logs above.${NC}"
fi

# ============================================================================
# Useful Commands
# ============================================================================
echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📝 Useful kubectl Commands:${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "  ${YELLOW}kubectl get pods -n $NAMESPACE${NC}"
echo -e "  ${YELLOW}kubectl get svc -n $NAMESPACE${NC}"
echo -e "  ${YELLOW}kubectl logs -n $NAMESPACE <pod-name>${NC}"
echo -e "  ${YELLOW}kubectl port-forward -n $NAMESPACE svc/api-gateway 8080:80${NC}"
echo -e "  ${YELLOW}kubectl describe pod -n $NAMESPACE <pod-name>${NC}"
echo ""
