#!/bin/bash

# Vercel Deployment Script
# This script handles the deployment to Vercel without using @secretname

set -e

echo "🚀 Starting Vercel Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI not found. Installing...${NC}"
    npm i -g vercel@latest
fi

# Navigate to nextjs-backend directory
cd "$(dirname "$0")/.."

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}Warning: .env.production file not found${NC}"
    echo "Creating .env.production from .env.local template..."
    cp .env.local .env.production
    echo -e "${RED}Please update .env.production with production values${NC}"
    exit 1
fi

# Function to check if environment variable is set
check_env() {
    if [ -z "${!1}" ]; then
        echo -e "${RED}Error: $1 is not set in .env.production${NC}"
        return 1
    fi
    return 0
}

# Load environment variables from .env.production
export $(cat .env.production | grep -v '^#' | xargs)

# Verify required environment variables
echo "Checking environment variables..."
required_vars=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_KEY"
    "JWT_SECRET"
    "APPLE_CLIENT_ID"
    "APPLE_TEAM_ID"
    "APPLE_KEY_ID"
    "APICORE_API_KEY"
)

all_vars_set=true
for var in "${required_vars[@]}"; do
    if ! check_env "$var"; then
        all_vars_set=false
    fi
done

if [ "$all_vars_set" = false ]; then
    echo -e "${RED}Please set all required environment variables in .env.production${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All environment variables are set${NC}"

# Build the project
echo "Building Next.js project..."
npm run build

# Deploy to Vercel
echo "Deploying to Vercel..."

# Check if this is the first deployment
if [ ! -f ".vercel/project.json" ]; then
    echo "First deployment detected. Linking to Vercel project..."
    vercel link
fi

# Deploy with environment variables
vercel deploy --prod \
  -e NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -e SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_KEY" \
  -e JWT_SECRET="$JWT_SECRET" \
  -e APPLE_CLIENT_ID="$APPLE_CLIENT_ID" \
  -e APPLE_TEAM_ID="$APPLE_TEAM_ID" \
  -e APPLE_KEY_ID="$APPLE_KEY_ID" \
  -e APPLE_PRIVATE_KEY="$APPLE_PRIVATE_KEY" \
  -e APICORE_API_KEY="$APICORE_API_KEY" \
  -e APICORE_BASE_URL="${APICORE_BASE_URL:-https://api.apicore.ai}" \
  -e NODE_ENV="production"

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Visit your Vercel dashboard to see the deployment"
echo "2. Test the API endpoints using the provided test script"
echo "3. Configure custom domain if needed"