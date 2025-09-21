#!/usr/bin/env node

/**
 * Test script for Stripe integration
 * Verifies that all Stripe endpoints and configurations are working
 *
 * Usage: node scripts/test-stripe-integration.js
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_TOKEN = 'test-jwt-token'; // You'll need a real token for testing

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const protocol = url.protocol === 'https:' ? https : http;

    const req = protocol.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ status: res.statusCode, data: json });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      }
    );

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testStripeIntegration() {
  log('\n🧪 Testing Stripe Integration\n', 'blue');

  // Test 1: Check environment variables
  log('1. Checking environment variables...', 'yellow');
  const requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ];

  let envVarsOk = true;
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      log(`   ✅ ${envVar} is set`, 'green');
    } else {
      log(`   ❌ ${envVar} is missing`, 'red');
      envVarsOk = false;
    }
  }

  if (!envVarsOk) {
    log('\n❌ Missing required environment variables. Please check your .env.local file', 'red');
    return;
  }

  // Test 2: Test Stripe library initialization
  log('\n2. Testing Stripe library initialization...', 'yellow');
  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const account = await stripe.accounts.retrieve();
    log(`   ✅ Connected to Stripe account: ${account.email || account.id}`, 'green');
  } catch (error) {
    log(`   ❌ Failed to connect to Stripe: ${error.message}`, 'red');
    return;
  }

  // Test 3: Test checkout session endpoint
  log('\n3. Testing checkout session endpoint...', 'yellow');
  try {
    const response = await makeRequest('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
      body: {
        tier: 'basic',
      },
    });

    if (response.status === 401) {
      log('   ⚠️  Authentication required (expected for test token)', 'yellow');
      log('      The endpoint is accessible but requires valid authentication', 'yellow');
    } else if (response.status === 200) {
      log('   ✅ Checkout session endpoint is working', 'green');
    } else {
      log(`   ❌ Unexpected response: ${response.status}`, 'red');
      console.log(response.data);
    }
  } catch (error) {
    log(`   ❌ Failed to test checkout endpoint: ${error.message}`, 'red');
  }

  // Test 4: Test webhook endpoint
  log('\n4. Testing webhook endpoint...', 'yellow');
  try {
    const response = await makeRequest('/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test-signature',
      },
      body: {},
    });

    if (response.status === 400) {
      log('   ✅ Webhook endpoint is accessible (signature verification working)', 'green');
    } else {
      log(`   ⚠️  Unexpected response: ${response.status}`, 'yellow');
    }
  } catch (error) {
    log(`   ❌ Failed to test webhook endpoint: ${error.message}`, 'red');
  }

  // Test 5: Test manage subscription endpoint
  log('\n5. Testing manage subscription endpoint...', 'yellow');
  try {
    const response = await makeRequest('/api/stripe/manage-subscription', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    });

    if (response.status === 401) {
      log('   ⚠️  Authentication required (expected for test token)', 'yellow');
      log('      The endpoint is accessible but requires valid authentication', 'yellow');
    } else if (response.status === 200) {
      log('   ✅ Manage subscription endpoint is working', 'green');
    } else {
      log(`   ❌ Unexpected response: ${response.status}`, 'red');
    }
  } catch (error) {
    log(`   ❌ Failed to test manage subscription endpoint: ${error.message}`, 'red');
  }

  // Test 6: Check Stripe products and prices
  log('\n6. Checking Stripe products and prices...', 'yellow');
  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const products = await stripe.products.list({ limit: 100, active: true });
    const prices = await stripe.prices.list({ limit: 100, active: true });

    const tiers = ['basic', 'pro', 'premium'];
    for (const tier of tiers) {
      const product = products.data.find(p => p.metadata.tier === tier);
      if (product) {
        const price = prices.data.find(p => p.product === product.id && p.recurring);
        if (price) {
          log(`   ✅ ${tier}: Product ${product.id}, Price ${price.id} ($${price.unit_amount / 100}/mo)`, 'green');
        } else {
          log(`   ⚠️  ${tier}: Product found but no recurring price`, 'yellow');
        }
      } else {
        log(`   ⚠️  ${tier}: Product not found in Stripe`, 'yellow');
      }
    }
  } catch (error) {
    log(`   ❌ Failed to check Stripe products: ${error.message}`, 'red');
  }

  log('\n✅ Stripe integration tests complete!', 'green');
  log('\nNext steps:', 'blue');
  log('1. Run the database migration: psql $DATABASE_URL < scripts/add-stripe-columns.sql');
  log('2. Set up Stripe products: node scripts/setup-stripe-products.js');
  log('3. Update .env.local with the generated Price IDs and Webhook Secret');
  log('4. Test with a real user token for full functionality');
}

// Run tests
testStripeIntegration().catch(console.error);