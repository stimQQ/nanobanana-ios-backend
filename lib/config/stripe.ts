import Stripe from 'stripe';
import { SubscriptionTier } from '@/lib/types/database';

// Lazy initialization of Stripe client
let stripeInstance: Stripe | null = null;

/**
 * Get the Stripe client instance.
 * Uses lazy initialization to avoid errors during build time.
 * @throws Error if STRIPE_SECRET_KEY is not set when Stripe is actually needed
 */
export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      // In development or build time, we might not have the key yet
      // This allows the build to succeed
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.warn('Warning: STRIPE_SECRET_KEY is not set. Stripe functionality will not work.');
        // Return a dummy instance for build time (will fail at runtime if actually used)
        throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
      }
      throw new Error('STRIPE_SECRET_KEY is required in production');
    }

    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-08-27.basil',
      typescript: true,
    });
  }

  return stripeInstance;
}

// For backward compatibility, export stripe as a getter
// This will throw an error if accessed without proper configuration
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const instance = getStripe();
    return instance[prop as keyof Stripe];
  }
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