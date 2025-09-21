import Stripe from 'stripe';
import { SubscriptionTier } from '@/lib/types/database';

// Initialize Stripe with the secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Stripe Price IDs for each subscription plan
// These should be created in your Stripe Dashboard and the IDs added here
export const STRIPE_PRICE_IDS: Record<Exclude<SubscriptionTier, 'free'>, string> = {
  basic: process.env.STRIPE_PRICE_ID_BASIC || 'price_basic_placeholder',
  pro: process.env.STRIPE_PRICE_ID_PRO || 'price_pro_placeholder',
  premium: process.env.STRIPE_PRICE_ID_PREMIUM || 'price_premium_placeholder',
};

// Stripe Product IDs for each subscription plan
export const STRIPE_PRODUCT_IDS: Record<Exclude<SubscriptionTier, 'free'>, string> = {
  basic: process.env.STRIPE_PRODUCT_ID_BASIC || 'prod_basic_placeholder',
  pro: process.env.STRIPE_PRODUCT_ID_PRO || 'prod_pro_placeholder',
  premium: process.env.STRIPE_PRODUCT_ID_PREMIUM || 'prod_premium_placeholder',
};

// Map Stripe Price IDs back to subscription tiers
export const getPlanFromPriceId = (priceId: string): SubscriptionTier | null => {
  const entries = Object.entries(STRIPE_PRICE_IDS) as [Exclude<SubscriptionTier, 'free'>, string][];
  const found = entries.find(([_, id]) => id === priceId);
  return found ? found[0] : null;
};

// Map Stripe Product IDs back to subscription tiers
export const getPlanFromProductId = (productId: string): SubscriptionTier | null => {
  const entries = Object.entries(STRIPE_PRODUCT_IDS) as [Exclude<SubscriptionTier, 'free'>, string][];
  const found = entries.find(([_, id]) => id === productId);
  return found ? found[0] : null;
};

// Webhook event types we handle
export const STRIPE_WEBHOOK_EVENTS = {
  CHECKOUT_COMPLETED: 'checkout.session.completed',
  PAYMENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_FAILED: 'payment_intent.payment_failed',
  SUBSCRIPTION_CREATED: 'customer.subscription.created',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_FAILED: 'invoice.payment_failed',
} as const;

// Stripe configuration options
export const STRIPE_CONFIG = {
  success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscription`,
  payment_method_types: ['card'] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
  mode: 'subscription' as const,
  billing_address_collection: 'auto' as const,
  allow_promotion_codes: true,
};

// Helper to create product metadata
export const createProductMetadata = (tier: SubscriptionTier, credits: number, images: number) => ({
  tier,
  credits: credits.toString(),
  images: images.toString(),
  platform: 'web',
});