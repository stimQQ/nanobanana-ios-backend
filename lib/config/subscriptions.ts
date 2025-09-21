import { SubscriptionPlan, SubscriptionTier } from '@/lib/types/database';

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    tier: 'free',
    price: 0,
    credits: 40,
    images: 10,
    name: 'Free',
    description: 'Get started with 10 free attempts and 40 credits',
    apple_product_id: '',
  },
  basic: {
    tier: 'basic',
    price: 9.9,
    credits: 800,
    images: 200,
    name: 'Basic',
    description: '800 credits, 200 image generations per month',
    apple_product_id: 'com.nanobanana.basic',
  },
  pro: {
    tier: 'pro',
    price: 29.9,
    credits: 3000,
    images: 750,
    name: 'Pro',
    description: '3000 credits, 750 image generations per month',
    apple_product_id: 'com.nanobanana.pro',
  },
  premium: {
    tier: 'premium',
    price: 59.9,
    credits: 8000,
    images: 2000,
    name: 'Premium',
    description: '8000 credits, 2000 image generations per month',
    apple_product_id: 'com.nanobanana.premium',
  },
};

export const CREDITS_PER_GENERATION = {
  'text-to-image': 1,
  'image-to-image': 2,
};

export const getSubscriptionPlan = (tier: SubscriptionTier): SubscriptionPlan => {
  return SUBSCRIPTION_PLANS[tier];
};

export const getSubscriptionByProductId = (productId: string): SubscriptionPlan | undefined => {
  return Object.values(SUBSCRIPTION_PLANS).find(plan => plan.apple_product_id === productId);
};