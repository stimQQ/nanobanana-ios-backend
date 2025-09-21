#!/usr/bin/env node

/**
 * Script to set up Stripe products and prices for subscription plans
 * Run this script after setting up your Stripe account and API keys
 *
 * Usage: node scripts/setup-stripe-products.js
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Basic Plan',
    description: '800 credits, 200 image generations per month',
    price: 990, // $9.90 in cents
    metadata: {
      tier: 'basic',
      credits: '800',
      images: '200',
    },
  },
  pro: {
    name: 'Pro Plan',
    description: '3000 credits, 750 image generations per month',
    price: 2990, // $29.90 in cents
    metadata: {
      tier: 'pro',
      credits: '3000',
      images: '750',
    },
  },
  premium: {
    name: 'Premium Plan',
    description: '8000 credits, 2000 image generations per month',
    price: 5990, // $59.90 in cents
    metadata: {
      tier: 'premium',
      credits: '8000',
      images: '2000',
    },
  },
};

async function setupStripeProducts() {
  console.log('🚀 Setting up Stripe products and prices...\n');

  const results = {
    products: {},
    prices: {},
  };

  for (const [tier, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
    try {
      console.log(`Creating ${tier} plan...`);

      // Check if product already exists
      const existingProducts = await stripe.products.list({
        limit: 100,
      });

      let product = existingProducts.data.find(
        (p) => p.metadata.tier === tier && p.active
      );

      if (!product) {
        // Create product
        product = await stripe.products.create({
          name: plan.name,
          description: plan.description,
          metadata: plan.metadata,
        });
        console.log(`✅ Created product: ${product.id}`);
      } else {
        console.log(`ℹ️  Product already exists: ${product.id}`);
      }

      results.products[tier] = product.id;

      // Check if price already exists
      const existingPrices = await stripe.prices.list({
        product: product.id,
        limit: 100,
      });

      let price = existingPrices.data.find(
        (p) => p.unit_amount === plan.price && p.active && p.recurring
      );

      if (!price) {
        // Create price
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: plan.price,
          currency: 'usd',
          recurring: {
            interval: 'month',
            interval_count: 1,
          },
          metadata: plan.metadata,
        });
        console.log(`✅ Created price: ${price.id}`);
      } else {
        console.log(`ℹ️  Price already exists: ${price.id}`);
      }

      results.prices[tier] = price.id;
      console.log('');

    } catch (error) {
      console.error(`❌ Error setting up ${tier} plan:`, error.message);
    }
  }

  // Display results
  console.log('\n📋 Setup Complete!\n');
  console.log('Add these values to your .env.local file:\n');
  console.log('# Stripe Product IDs');
  Object.entries(results.products).forEach(([tier, id]) => {
    console.log(`STRIPE_PRODUCT_ID_${tier.toUpperCase()}=${id}`);
  });
  console.log('\n# Stripe Price IDs');
  Object.entries(results.prices).forEach(([tier, id]) => {
    console.log(`STRIPE_PRICE_ID_${tier.toUpperCase()}=${id}`);
  });

  // Create webhook endpoint
  console.log('\n\n🔔 Setting up webhook endpoint...\n');

  try {
    const webhookEndpoint = await stripe.webhookEndpoints.create({
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/api/stripe/webhook`,
      enabled_events: [
        'checkout.session.completed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.paid',
        'invoice.payment_failed',
      ],
    });

    console.log('✅ Webhook endpoint created:', webhookEndpoint.url);
    console.log('\n📋 Add this to your .env.local file:');
    console.log(`STRIPE_WEBHOOK_SECRET=${webhookEndpoint.secret}`);
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Webhook endpoint already exists');
    } else {
      console.error('❌ Error creating webhook endpoint:', error.message);
      console.log('\nYou can manually create a webhook endpoint in the Stripe Dashboard:');
      console.log('1. Go to https://dashboard.stripe.com/webhooks');
      console.log('2. Click "Add endpoint"');
      console.log(`3. Enter URL: ${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/api/stripe/webhook`);
      console.log('4. Select the events listed above');
      console.log('5. Copy the signing secret and add it to .env.local as STRIPE_WEBHOOK_SECRET');
    }
  }

  console.log('\n✅ Stripe setup complete!');
}

// Run the setup
setupStripeProducts().catch(console.error);