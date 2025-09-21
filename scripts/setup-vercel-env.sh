#!/bin/bash

# Setup Vercel Environment Variables via CLI
# This script configures environment variables in Vercel without using @secretname

set -e

echo "🔧 Setting up Vercel Environment Variables..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
    echo -e "${RED}Error: .env.production file not found${NC}"
    echo "Please create .env.production with your production values first."
    exit 1
fi

# Load environment variables from .env.production
echo "Loading environment variables from .env.production..."
set -a
source .env.production
set +a

# Function to add environment variable to Vercel
add_vercel_env() {
    local key=$1
    local value=$2
    local env_type=${3:-"production preview development"}

    if [ -z "$value" ]; then
        echo -e "${YELLOW}⚠ Skipping $key (empty value)${NC}"
        return
    fi

    echo -n "Adding $key... "

    # Remove existing variable if it exists
    vercel env rm "$key" production 2>/dev/null || true
    vercel env rm "$key" preview 2>/dev/null || true
    vercel env rm "$key" development 2>/dev/null || true

    # Add the variable for specified environments
    for env in $env_type; do
        echo "$value" | vercel env add "$key" "$env" 2>/dev/null || {
            echo -e "${RED}Failed to add $key for $env${NC}"
            return 1
        }
    done

    echo -e "${GREEN}✓${NC}"
}

# Link to Vercel project if not already linked
if [ ! -f ".vercel/project.json" ]; then
    echo -e "${BLUE}Linking to Vercel project...${NC}"
    vercel link
fi

echo ""
echo -e "${BLUE}Setting up environment variables in Vercel...${NC}"
echo ""

# Add all required environment variables
add_vercel_env "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL"
add_vercel_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
add_vercel_env "SUPABASE_SERVICE_KEY" "$SUPABASE_SERVICE_KEY"
add_vercel_env "JWT_SECRET" "$JWT_SECRET"
add_vercel_env "APPLE_CLIENT_ID" "$APPLE_CLIENT_ID"
add_vercel_env "APPLE_TEAM_ID" "$APPLE_TEAM_ID"
add_vercel_env "APPLE_KEY_ID" "$APPLE_KEY_ID"
add_vercel_env "APPLE_PRIVATE_KEY" "$APPLE_PRIVATE_KEY"
add_vercel_env "APICORE_API_KEY" "$APICORE_API_KEY"
add_vercel_env "APICORE_BASE_URL" "${APICORE_BASE_URL:-https://api.apicore.ai}"
add_vercel_env "NODE_ENV" "production" "production"
add_vercel_env "NODE_ENV" "development" "preview development"

echo ""
echo -e "${GREEN}✅ Environment variables setup complete!${NC}"
echo ""
echo "You can verify the environment variables in your Vercel dashboard:"
echo "https://vercel.com/dashboard/project/settings/environment-variables"
echo ""
echo "To deploy your project, run:"
echo "  npm run deploy:vercel"