#!/bin/bash

# Study Smart - Manual Route Testing with curl
# Use this file to test individual routes and endpoints

# Configuration
export API_BASE="${API_BASE:-http://localhost}"
export AUTH_TOKEN=""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Study Smart Kubernetes - Route Testing${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo "API Base URL: $API_BASE"
echo ""

# ============================================================================
# AUTH: Register and Login
# ============================================================================
echo -e "${BLUE}▶ AUTHENTICATION${NC}"
echo ""

echo "Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/api/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "TestPass123",
    "role": "buyer"
  }')

echo -e "${YELLOW}Response:${NC} $REGISTER_RESPONSE"
echo ""

echo "Testing user login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123"
  }')

echo -e "${YELLOW}Response:${NC} $LOGIN_RESPONSE"
AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4 || echo "")

if [ ! -z "$AUTH_TOKEN" ]; then
    echo -e "${GREEN}✅ Auth token obtained:${NC} ${AUTH_TOKEN:0:20}..."
else
    echo -e "${RED}❌ Failed to get auth token${NC}"
fi
echo ""

# ============================================================================
# BOOKS: Public Routes
# ============================================================================
echo -e "${BLUE}▶ BOOKS (PUBLIC)${NC}"
echo ""

echo "Getting all books..."
curl -s -X GET "$API_BASE/api/books" | jq '.' || echo "Failed"
echo ""

echo "Getting book by ID (1)..."
curl -s -X GET "$API_BASE/api/books/1" | jq '.' || echo "Failed"
echo ""

echo "Searching for books..."
curl -s -X GET "$API_BASE/api/books/search/algorithms" | jq '.' || echo "Failed"
echo ""

# ============================================================================
# BOOKS: Protected Routes (with Auth)
# ============================================================================
if [ ! -z "$AUTH_TOKEN" ]; then
    echo -e "${BLUE}▶ BOOKS (PROTECTED - WITH AUTH)${NC}"
    echo ""
    
    echo "Creating a new book listing..."
    curl -s -X POST "$API_BASE/api/books" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -d '{
        "title": "Introduction to Algorithms",
        "description": "Classic algorithms textbook",
        "price": 1500,
        "condition": "New",
        "category": "Textbooks",
        "stock": 10
      }' | jq '.' || echo "Failed"
    echo ""
fi

# ============================================================================
# FORUM: Public Routes
# ============================================================================
echo -e "${BLUE}▶ FORUM (PUBLIC)${NC}"
echo ""

echo "Getting all questions..."
curl -s -X GET "$API_BASE/api/forum/questions" | jq '.' || echo "Failed"
echo ""

echo "Getting trending questions..."
curl -s -X GET "$API_BASE/api/forum/questions/trending" | jq '.' || echo "Failed"
echo ""

echo "Getting question by ID (1)..."
curl -s -X GET "$API_BASE/api/forum/questions/1" | jq '.' || echo "Failed"
echo ""

# ============================================================================
# FORUM: Protected Routes (with Auth)
# ============================================================================
if [ ! -z "$AUTH_TOKEN" ]; then
    echo -e "${BLUE}▶ FORUM (PROTECTED - WITH AUTH)${NC}"
    echo ""
    
    echo "Creating a new question..."
    curl -s -X POST "$API_BASE/api/forum/questions" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -d '{
        "title": "How to prepare for semester exams?",
        "content": "I have exams coming up. What is the best study strategy?",
        "tags": ["study", "exams", "preparation"]
      }' | jq '.' || echo "Failed"
    echo ""
fi

# ============================================================================
# ORDERS: Protected Routes
# ============================================================================
if [ ! -z "$AUTH_TOKEN" ]; then
    echo -e "${BLUE}▶ ORDERS (PROTECTED)${NC}"
    echo ""
    
    echo "Getting my orders..."
    curl -s -X GET "$API_BASE/api/orders/my-orders" \
      -H "Authorization: Bearer $AUTH_TOKEN" | jq '.' || echo "Failed"
    echo ""
    
    echo "Creating an order..."
    curl -s -X POST "$API_BASE/api/orders" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -d '{
        "items": [
          {"bookId": 1, "quantity": 2}
        ],
        "totalAmount": 3000
      }' | jq '.' || echo "Failed"
    echo ""
fi

# ============================================================================
# PAYMENTS: Public & Protected Routes
# ============================================================================
echo -e "${BLUE}▶ PAYMENTS${NC}"
echo ""

echo "Checking payment status..."
curl -s -X GET "$API_BASE/api/payments/payment-status/1" | jq '.' || echo "Failed"
echo ""

if [ ! -z "$AUTH_TOKEN" ]; then
    echo "Creating payment..."
    curl -s -X POST "$API_BASE/api/payments/create-payment" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -d '{
        "amount": 5000,
        "currency": "INR"
      }' | jq '.' || echo "Failed"
    echo ""
fi

# ============================================================================
# NOTES: Public Routes
# ============================================================================
echo -e "${BLUE}▶ NOTES (PUBLIC)${NC}"
echo ""

echo "Getting all notes..."
curl -s -X GET "$API_BASE/api/notes" | jq '.' || echo "Failed"
echo ""

echo "Getting note by ID (1)..."
curl -s -X GET "$API_BASE/api/notes/1" | jq '.' || echo "Failed"
echo ""

# ============================================================================
# USERS: Protected Routes
# ============================================================================
if [ ! -z "$AUTH_TOKEN" ]; then
    echo -e "${BLUE}▶ USERS (PROTECTED)${NC}"
    echo ""
    
    echo "Getting user profile..."
    curl -s -X GET "$API_BASE/api/users/profile/1" \
      -H "Authorization: Bearer $AUTH_TOKEN" | jq '.' || echo "Failed"
    echo ""
fi

# ============================================================================
# Manual curl examples for reference
# ============================================================================
echo -e "${BLUE}═════════════════════════════════════════${NC}"
echo -e "${BLUE}📚 Manual Testing Examples${NC}"
echo -e "${BLUE}═════════════════════════════════════════${NC}"
echo ""
echo "Use these curl commands directly:"
echo ""
echo "1. Get all books:"
echo "   ${YELLOW}curl http://localhost/api/books | jq .${NC}"
echo ""
echo "2. Search books:"
echo "   ${YELLOW}curl http://localhost/api/books/search/mathematics${NC}"
echo ""
echo "3. Get all questions:"
echo "   ${YELLOW}curl http://localhost/api/forum/questions${NC}"
echo ""
echo "4. With authentication:"
echo "   ${YELLOW}curl -H 'Authorization: Bearer TOKEN' http://localhost/api/users/profile/1${NC}"
echo ""
echo "5. POST request (create book):"
echo "   ${YELLOW}curl -X POST http://localhost/api/books \\${NC}"
echo "   ${YELLOW}  -H 'Content-Type: application/json' \\${NC}"
echo "   ${YELLOW}  -H 'Authorization: Bearer TOKEN' \\${NC}"
echo "   ${YELLOW}  -d '{\"title\":\"Book\",\"price\":500,...}'${NC}"
echo ""
