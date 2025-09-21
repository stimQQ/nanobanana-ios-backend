import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG, STRIPE_PRICE_IDS } from '@/lib/config/stripe';
import { SUBSCRIPTION_PLANS } from '@/lib/config/subscriptions';
import { createClient } from '@supabase/supabase-js';
import { SubscriptionTier } from '@/lib/types/database';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get authentication token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid authorization token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let userId: string;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      userId = decoded.userId;
    } catch (_error) {
      return NextResponse.json(
        { success: false, error: 'Invalid authorization token' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { tier, successUrl, cancelUrl } = body;

    // Validate tier
    if (!tier || tier === 'free' || !SUBSCRIPTION_PLANS[tier as SubscriptionTier]) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    const plan = SUBSCRIPTION_PLANS[tier as SubscriptionTier];
    const priceId = STRIPE_PRICE_IDS[tier as Exclude<SubscriptionTier, 'free'>];

    if (!priceId || priceId.includes('placeholder')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stripe price ID not configured for this plan. Please contact support.'
        },
        { status: 500 }
      );
    }

    // Get user data from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId = user.stripe_customer_id;

    if (!stripeCustomerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          supabase_user_id: userId,
          platform: 'web',
        },
      });

      stripeCustomerId = customer.id;

      // Update user with Stripe customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', userId);
    }

    // Check for existing active subscription
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .eq('payment_provider', 'stripe')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingSub) {
      return NextResponse.json(
        {
          success: false,
          error: 'You already have an active Stripe subscription. Please manage it from your account page.'
        },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: STRIPE_CONFIG.payment_method_types,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: STRIPE_CONFIG.mode,
      success_url: successUrl || STRIPE_CONFIG.success_url,
      cancel_url: cancelUrl || STRIPE_CONFIG.cancel_url,
      billing_address_collection: STRIPE_CONFIG.billing_address_collection,
      allow_promotion_codes: STRIPE_CONFIG.allow_promotion_codes,
      subscription_data: {
        metadata: {
          supabase_user_id: userId,
          subscription_tier: tier,
          credits: plan.credits.toString(),
          images: plan.images.toString(),
        },
      },
      metadata: {
        supabase_user_id: userId,
        subscription_tier: tier,
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      sessionUrl: session.url,
    });

  } catch (_error) {
    console.error('Error creating checkout session:', _error);
    return NextResponse.json(
      {
        success: false,
        error: _error instanceof Error ? _error.message : 'Failed to create checkout session'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve session details (for success page)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'subscription', 'customer'],
    });

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        status: session.status,
        customer_email: session.customer_details?.email,
        subscription_id: session.subscription,
        amount_total: session.amount_total,
        currency: session.currency,
      },
    });

  } catch (_error) {
    console.error('Error retrieving session:', _error);
    return NextResponse.json(
      {
        success: false,
        error: _error instanceof Error ? _error.message : 'Failed to retrieve session'
      },
      { status: 500 }
    );
  }
}