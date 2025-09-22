#!/usr/bin/env node

/**
 * Stripe Integration Test
 * Verifies Stripe setup and configuration
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Stripe from 'stripe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

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

async function testStripe() {
  console.log('\n🚀 Testing Stripe Integration\n');

  // Check environment variables
  log('1. Checking environment variables...', 'blue');
  const envVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRICE_ID_BASIC',
    'STRIPE_PRICE_ID_PRO',
    'STRIPE_PRICE_ID_PREMIUM',
  ];

  let hasAll = true;
  for (const key of envVars) {
    if (process.env[key]) {
      log(`   ✅ ${key}: Set`, 'green');
    } else {
      log(`   ❌ ${key}: Missing`, 'red');
      hasAll = false;
    }
  }

  if (!hasAll) {
    log('\n⚠️  Missing environment variables!', 'red');
    return;
  }

  // Test Stripe connection
  log('\n2. Testing Stripe connection...', 'blue');
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const account = await stripe.accounts.retrieve();
    log(`   ✅ Connected to: ${account.email || account.id}`, 'green');
  } catch (error) {
    log(`   ❌ Connection failed: ${error.message}`, 'red');
    return;
  }

  // Verify prices
  log('\n3. Verifying prices...', 'blue');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const prices = {
    'Basic': process.env.STRIPE_PRICE_ID_BASIC,
    'Pro': process.env.STRIPE_PRICE_ID_PRO,
    'Premium': process.env.STRIPE_PRICE_ID_PREMIUM,
  };

  for (const [name, id] of Object.entries(prices)) {
    try {
      const price = await stripe.prices.retrieve(id);
      log(`   ✅ ${name}: $${price.unit_amount / 100}/month`, 'green');
    } catch (error) {
      log(`   ❌ ${name}: Invalid price ID`, 'red');
    }
  }

  // Check webhooks
  log('\n4. Checking webhooks...', 'blue');
  try {
    const endpoints = await stripe.webhookEndpoints.list({ limit: 10 });
    const prodUrl = 'https://doodle-to-illustration.vercel.app/api/stripe/webhook';
    const endpoint = endpoints.data.find(ep => ep.url === prodUrl);

    if (endpoint) {
      log(`   ✅ Webhook configured`, 'green');
      log(`   Events: ${endpoint.enabled_events.length} configured`, 'yellow');
    } else {
      log(`   ⚠️  Webhook not found for: ${prodUrl}`, 'yellow');
    }
  } catch (error) {
    log(`   ❌ Failed to check webhooks`, 'red');
  }

  log('\n✅ Test complete!\n', 'green');
}

testStripe().catch(console.error);