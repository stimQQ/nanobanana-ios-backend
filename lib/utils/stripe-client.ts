import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

export interface CreateCheckoutSessionParams {
  tier: 'basic' | 'pro' | 'premium';
  successUrl?: string;
  cancelUrl?: string;
}

export const createCheckoutSession = async (
  params: CreateCheckoutSessionParams,
  token: string
): Promise<{ sessionId?: string; error?: string }> => {
  try {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!data.success) {
      return { error: data.error || 'Failed to create checkout session' };
    }

    return { sessionId: data.sessionId };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return { error: 'Failed to create checkout session' };
  }
};

export const redirectToCheckout = async (sessionId: string) => {
  const stripe = await getStripe();

  if (!stripe) {
    console.error('Stripe not loaded');
    return { error: 'Payment system not available' };
  }

  const { error } = await stripe.redirectToCheckout({ sessionId });

  if (error) {
    console.error('Error redirecting to checkout:', error);
    return { error: error.message };
  }

  return { success: true };
};

export const getSubscriptionStatus = async (token: string) => {
  try {
    const response = await fetch('/api/stripe/manage-subscription', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return { success: false, error: 'Failed to get subscription status' };
  }
};

export const cancelSubscription = async (token: string) => {
  try {
    const response = await fetch('/api/stripe/manage-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'cancel' }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return { success: false, error: 'Failed to cancel subscription' };
  }
};

export const resumeSubscription = async (token: string) => {
  try {
    const response = await fetch('/api/stripe/manage-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'resume' }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error resuming subscription:', error);
    return { success: false, error: 'Failed to resume subscription' };
  }
};

export const openBillingPortal = async (token: string) => {
  try {
    const response = await fetch('/api/stripe/manage-subscription', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success && data.portal_url) {
      window.location.href = data.portal_url;
      return { success: true };
    }

    return { success: false, error: data.error || 'Failed to open billing portal' };
  } catch (error) {
    console.error('Error opening billing portal:', error);
    return { success: false, error: 'Failed to open billing portal' };
  }
};