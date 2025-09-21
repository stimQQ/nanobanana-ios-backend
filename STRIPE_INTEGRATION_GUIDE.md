# Stripe Payment Integration Guide

## Overview

This Next.js application now supports dual payment methods:
- **Web Platform**: Credit card payments via Stripe
- **iOS Platform**: In-App Purchases via Apple Pay

Both payment methods update the same subscription status in the database, ensuring a unified experience across platforms.

## Features Implemented

### 1. Stripe Configuration
- **Location**: `/lib/config/stripe.ts`
- Stripe SDK initialization
- Price and Product ID mappings
- Webhook event constants
- Configuration options

### 2. API Endpoints

#### Create Checkout Session
- **Endpoint**: `/api/stripe/create-checkout-session`
- **Methods**: POST (create session), GET (retrieve session details)
- Creates Stripe checkout sessions for subscription purchases
- Validates user authentication and existing subscriptions
- Returns session ID for redirect to Stripe Checkout

#### Webhook Handler
- **Endpoint**: `/api/stripe/webhook`
- **Method**: POST
- Handles Stripe webhook events:
  - `checkout.session.completed` - Process successful payments
  - `customer.subscription.*` - Manage subscription lifecycle
  - `invoice.paid` - Process renewals
  - `invoice.payment_failed` - Handle failed payments
- Signature verification for security
- Updates database with subscription status

#### Manage Subscription
- **Endpoint**: `/api/stripe/manage-subscription`
- **Methods**: GET, POST, DELETE, PUT
- GET - Retrieve current subscription status
- POST - Cancel/resume subscription
- DELETE - Immediately cancel subscription
- PUT - Create billing portal session

### 3. Client Components

#### Subscription Plans Component
- **Location**: `/components/SubscriptionPlans.tsx`
- Displays available subscription tiers
- Handles Stripe checkout initiation
- Platform detection (web vs iOS)

#### Subscription Management Component
- **Location**: `/components/SubscriptionManagement.tsx`
- View current subscription details
- Cancel/resume subscription
- Access Stripe billing portal

#### Success Page
- **Location**: `/app/subscription/success/page.tsx`
- Post-payment success confirmation
- Display payment details
- Next steps guidance

### 4. Database Updates

New columns added to support Stripe:

```sql
-- Users table
stripe_customer_id TEXT UNIQUE

-- Subscriptions table
stripe_customer_id TEXT
stripe_subscription_id TEXT UNIQUE
stripe_price_id TEXT
payment_provider TEXT ('apple' or 'stripe')

-- Payment History table
stripe_payment_intent_id TEXT
stripe_session_id TEXT
payment_provider TEXT ('apple' or 'stripe')
```

## Setup Instructions

### 1. Create Stripe Account

1. Sign up at [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your API keys from Dashboard > Developers > API keys

### 2. Configure Environment Variables

Add to `.env.local`:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs (generated in step 3)
STRIPE_PRICE_ID_BASIC=price_xxx
STRIPE_PRICE_ID_PRO=price_xxx
STRIPE_PRICE_ID_PREMIUM=price_xxx
```

### 3. Set Up Stripe Products

Run the setup script:

```bash
node scripts/setup-stripe-products.js
```

This will:
- Create products for each subscription tier
- Set up recurring prices
- Create webhook endpoint
- Output Price IDs for your `.env.local`

### 4. Apply Database Migration

```bash
psql $DATABASE_URL < scripts/add-stripe-columns.sql
```

### 5. Configure Webhook (Production)

For production deployment:

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

### 6. Test the Integration

```bash
node scripts/test-stripe-integration.js
```

## Testing

### Test Cards (Development)

Use these test cards in Stripe's test mode:

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Authentication Required**: 4000 0025 0000 3155

Use any future expiry date and any 3-digit CVC.

### Testing Webhooks Locally

Use Stripe CLI for local webhook testing:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your account
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy the webhook signing secret and update .env.local
```

### Test Flow

1. **Create Subscription**:
   - Navigate to `/subscription`
   - Click "Subscribe with Card" on any plan
   - Complete Stripe checkout
   - Verify redirect to success page

2. **Verify Database Updates**:
   - Check user credits updated
   - Verify subscription record created
   - Confirm payment history recorded

3. **Manage Subscription**:
   - Navigate to account/subscription page
   - Test cancel/resume functionality
   - Access billing portal

## Platform Detection

The system automatically detects the platform:

```javascript
const isWebPlatform = !window.navigator.userAgent.match(/iPhone|iPad|iPod/i);
```

- **Web Users**: See "Subscribe with Card" → Stripe Checkout
- **iOS Users**: See "Subscribe with Apple Pay" → iOS IAP flow

## Security Considerations

1. **Webhook Signature Verification**: All webhook requests are verified using Stripe's signature
2. **Authentication**: All subscription endpoints require valid JWT authentication
3. **Environment Variables**: Sensitive keys stored in environment variables
4. **HTTPS Only**: Stripe requires HTTPS in production
5. **PCI Compliance**: Stripe handles all card data, maintaining PCI compliance

## Troubleshooting

### Common Issues

1. **Webhook Signature Verification Failed**
   - Ensure `STRIPE_WEBHOOK_SECRET` is correct
   - Check raw body parsing is disabled for webhook endpoint
   - Verify webhook endpoint URL matches Stripe configuration

2. **Checkout Session Creation Fails**
   - Verify Price IDs are set in environment variables
   - Check Stripe API key is valid
   - Ensure products exist in Stripe Dashboard

3. **Subscription Not Updating**
   - Check webhook events are being received
   - Verify database migrations applied
   - Check Supabase service role key has proper permissions

4. **Authentication Errors**
   - Ensure JWT token is being passed in Authorization header
   - Verify JWT_SECRET matches between services
   - Check token expiration

### Debug Mode

Enable detailed logging by setting:

```javascript
// In API routes
console.log('Webhook event:', event.type);
console.log('Session data:', session);
```

## Monitoring

### Stripe Dashboard

Monitor in real-time:
- Payments: Dashboard > Payments
- Subscriptions: Dashboard > Billing > Subscriptions
- Webhooks: Dashboard > Developers > Webhooks > View attempts

### Database Queries

Check subscription status:

```sql
-- View all active Stripe subscriptions
SELECT * FROM subscriptions
WHERE payment_provider = 'stripe'
AND status = 'completed'
AND expires_at > NOW();

-- Check user's payment history
SELECT * FROM payment_history
WHERE user_id = 'xxx'
AND payment_provider = 'stripe'
ORDER BY created_at DESC;
```

## Support

For issues or questions:
1. Check Stripe documentation: https://stripe.com/docs
2. Review webhook logs in Stripe Dashboard
3. Test with `scripts/test-stripe-integration.js`
4. Contact support with relevant error messages and logs

## Next Steps

1. Set up Stripe Tax for automatic tax calculation
2. Implement upgrade/downgrade flow
3. Add proration for plan changes
4. Set up customer portal customization
5. Implement usage-based billing (if needed)
6. Add invoice customization
7. Set up Stripe Radar for fraud prevention