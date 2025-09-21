# Stripe Payment Setup - Quick Start Guide

## ✅ What's Been Implemented

The Stripe payment integration is **fully implemented** and ready to use. All the code, components, and API endpoints are in place.

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your Stripe Keys

1. Create a free Stripe account at https://stripe.com
2. Go to https://dashboard.stripe.com/test/apikeys
3. Copy your test keys

### Step 2: Update Environment Variables

Edit `.env.local` and replace the placeholder values:

```env
# Replace these with your actual Stripe keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_[your_actual_key]
STRIPE_SECRET_KEY=sk_test_[your_actual_key]
```

### Step 3: Apply Database Changes

Run this command to add Stripe columns to your database:

```bash
psql $DATABASE_URL < scripts/add-stripe-columns.sql
```

### Step 4: Create Products in Stripe

Run this script to automatically create your subscription products:

```bash
node scripts/setup-stripe-products.js
```

This will output Price IDs. Add them to `.env.local`:

```env
STRIPE_PRICE_ID_BASIC=price_[generated_id]
STRIPE_PRICE_ID_PRO=price_[generated_id]
STRIPE_PRICE_ID_PREMIUM=price_[generated_id]
```

### Step 5: Set Up Webhooks

The script above will also provide a webhook secret. Add it to `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_[your_webhook_secret]
```

### Step 6: Restart Your Server

```bash
npm run dev
```

## 🎉 That's It!

Your Stripe integration is now active. Navigate to `/subscription` to see it in action.

## 📱 Platform Detection

The system automatically detects the platform:
- **Web users** → Stripe payment (credit card)
- **iOS users** → Apple Pay (in-app purchase)

## 🧪 Test Payment

Use Stripe's test card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC
- Any billing ZIP

## 📝 Features Available

- ✅ Subscription purchase via Stripe Checkout
- ✅ Automatic credit allocation on payment
- ✅ Subscription management (cancel/resume)
- ✅ Billing portal access
- ✅ Webhook handling for renewals
- ✅ Unified database for both Stripe and Apple Pay
- ✅ Platform-specific payment methods

## 🔧 Troubleshooting

If you encounter issues:

1. **Verify your setup:**
   ```bash
   node scripts/test-stripe-integration.js
   ```

2. **Check webhook logs:**
   Go to https://dashboard.stripe.com/test/webhooks

3. **Test locally with Stripe CLI:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

## 📚 Full Documentation

For detailed information, see `STRIPE_INTEGRATION_GUIDE.md`

## 💬 Support

- Stripe Documentation: https://stripe.com/docs
- Test your integration: `/subscription` page
- Check payment status: Stripe Dashboard