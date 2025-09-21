#!/bin/bash

# API Test Script for NanoBanana Backend
# This script tests the API endpoints locally

BASE_URL="${1:-http://localhost:3000}"
echo "Testing API at: $BASE_URL"
echo "================================"
echo ""

# Test health endpoint
echo "1. Testing Health Endpoint..."
curl -s "$BASE_URL/api/health" | python3 -m json.tool
echo ""

# Test Apple auth (will fail without valid token, but should return proper error)
echo "2. Testing Auth Endpoint (expected to fail with invalid token)..."
curl -s -X POST "$BASE_URL/api/auth/apple" \
  -H "Content-Type: application/json" \
  -d '{"apple_id_token": "test-token"}' | python3 -m json.tool
echo ""

echo "================================"
echo "Basic API test complete!"
echo ""
echo "To test authenticated endpoints:"
echo "1. First authenticate with a valid Apple ID token"
echo "2. Use the returned JWT token in Authorization header"
echo "3. Example: curl -H 'Authorization: Bearer YOUR_TOKEN' $BASE_URL/api/user/profile"
echo ""