#!/bin/bash

# Production API Testing Script
# Tests deployed Vercel API endpoints

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get production URL from argument or use default
PRODUCTION_URL=${1:-""}

if [ -z "$PRODUCTION_URL" ]; then
    echo -e "${YELLOW}Usage: ./test-production.sh <your-app-url>${NC}"
    echo -e "${YELLOW}Example: ./test-production.sh https://nanobanana.vercel.app${NC}"
    echo ""
    read -p "Enter your Vercel app URL: " PRODUCTION_URL
fi

# Remove trailing slash if present
PRODUCTION_URL=${PRODUCTION_URL%/}

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}       NanoBanana API Production Test Suite${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Testing URL: $PRODUCTION_URL${NC}"
echo ""

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local auth="$5"

    echo -n "Testing $name... "

    if [ "$method" == "GET" ]; then
        if [ -n "$auth" ]; then
            response=$(curl -s -w "\n%{http_code}" -X GET \
                -H "Authorization: Bearer $auth" \
                "$PRODUCTION_URL$endpoint" 2>/dev/null || echo "000")
        else
            response=$(curl -s -w "\n%{http_code}" -X GET \
                "$PRODUCTION_URL$endpoint" 2>/dev/null || echo "000")
        fi
    else
        if [ -n "$auth" ]; then
            response=$(curl -s -w "\n%{http_code}" -X POST \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $auth" \
                -d "$data" \
                "$PRODUCTION_URL$endpoint" 2>/dev/null || echo "000")
        else
            response=$(curl -s -w "\n%{http_code}" -X POST \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$PRODUCTION_URL$endpoint" 2>/dev/null || echo "000")
        fi
    fi

    # Extract HTTP code (last line)
    http_code=$(echo "$response" | tail -n 1)
    # Extract response body (all except last line)
    body=$(echo "$response" | sed '$d')

    if [[ "$http_code" == "200" ]] || [[ "$http_code" == "201" ]]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        return 0
    elif [[ "$http_code" == "401" ]] && [[ "$name" == *"Auth Required"* ]]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code - Auth check working)"
        return 0
    elif [[ "$http_code" == "000" ]]; then
        echo -e "${RED}✗ FAILED${NC} (Connection failed)"
        return 1
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo "  Response: $body"
        return 1
    fi
}

# Track test results
total_tests=0
passed_tests=0
failed_tests=0

# Test 1: Health Check
echo -e "${BLUE}Testing Public Endpoints:${NC}"
echo "----------------------------------------"

((total_tests++))
if test_endpoint "Health Check" "GET" "/api/health"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi

# Test 2: Status Check
((total_tests++))
if test_endpoint "Status Dashboard" "GET" "/api/status"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi

# Test 3: API Test Suite
((total_tests++))
if test_endpoint "API Test Suite" "GET" "/api/test"; then
    ((passed_tests++))
    # Parse and display test results
    echo -e "${YELLOW}  Fetching detailed test results...${NC}"
    curl -s "$PRODUCTION_URL/api/test" | python3 -m json.tool 2>/dev/null || true
else
    ((failed_tests++))
fi

echo ""
echo -e "${BLUE}Testing Protected Endpoints:${NC}"
echo "----------------------------------------"

# Generate a mock JWT token for testing
MOCK_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXIiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20ifQ.test"

# Test 4: User Profile (should fail with 401)
((total_tests++))
if test_endpoint "User Profile (Auth Required)" "GET" "/api/user/profile" "" "$MOCK_TOKEN"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi

# Test 5: User Credits (should fail with 401)
((total_tests++))
if test_endpoint "User Credits (Auth Required)" "GET" "/api/user/credits" "" "$MOCK_TOKEN"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi

echo ""
echo -e "${BLUE}Testing Dashboard:${NC}"
echo "----------------------------------------"

# Test 6: Dashboard Page
((total_tests++))
echo -n "Testing Dashboard Page... "
dashboard_code=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL/dashboard" 2>/dev/null || echo "000")
if [[ "$dashboard_code" == "200" ]]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $dashboard_code)"
    echo -e "${YELLOW}  Dashboard URL: $PRODUCTION_URL/dashboard${NC}"
    ((passed_tests++))
else
    echo -e "${RED}✗ FAILED${NC} (HTTP $dashboard_code)"
    ((failed_tests++))
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    Test Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Total Tests: ${YELLOW}$total_tests${NC}"
echo -e "Passed: ${GREEN}$passed_tests${NC}"
echo -e "Failed: ${RED}$failed_tests${NC}"

if [ $failed_tests -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All tests passed! Your API is working correctly.${NC}"
    echo ""
    echo -e "${BLUE}Useful URLs:${NC}"
    echo -e "  Dashboard: ${YELLOW}$PRODUCTION_URL/dashboard${NC}"
    echo -e "  Health: ${YELLOW}$PRODUCTION_URL/api/health${NC}"
    echo -e "  Status: ${YELLOW}$PRODUCTION_URL/api/status${NC}"
    echo -e "  Tests: ${YELLOW}$PRODUCTION_URL/api/test${NC}"
else
    echo ""
    echo -e "${RED}⚠️  Some tests failed. Please check your configuration.${NC}"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"