import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/config/stripe';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get current subscription details
export async function GET(request: NextRequest) {
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

    // Get user's active subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('payment_provider', 'stripe')
      .eq('status', 'completed')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !subscription) {
      return NextResponse.json({
        success: true,
        subscription: null,
        message: 'No active Stripe subscription found',
      });
    }

    // Get Stripe subscription details if available
    let stripeSubscription = null;
    if (subscription.stripe_subscription_id) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripe_subscription_id
        );
      } catch (stripeError) {
        console.error('Error fetching Stripe subscription:', stripeError);
      }
    }

    return NextResponse.json({
      success: true,
      subscription: {
        ...subscription,
        stripe_details: stripeSubscription ? {
          status: stripeSubscription.status,
          cancel_at_period_end: stripeSubscription.cancel_at_period_end,
          current_period_end: new Date((stripeSubscription as any).current_period_end * 1000),
          cancel_at: (stripeSubscription as any).cancel_at
            ? new Date((stripeSubscription as any).cancel_at * 1000)
            : null,
        } : null,
      },
    });

  } catch (_error) {
    console.error('Error getting subscription:', _error);
    return NextResponse.json(
      {
        success: false,
        error: _error instanceof Error ? _error.message : 'Failed to get subscription'
      },
      { status: 500 }
    );
  }
}

// POST - Cancel subscription
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

    const body = await request.json();
    const { action } = body;

    if (action !== 'cancel' && action !== 'resume') {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "cancel" or "resume"' },
        { status: 400 }
      );
    }

    // Get user's active subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('payment_provider', 'stripe')
      .eq('status', 'completed')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !subscription || !subscription.stripe_subscription_id) {
      return NextResponse.json(
        { success: false, error: 'No active Stripe subscription found' },
        { status: 404 }
      );
    }

    // Cancel or resume the Stripe subscription
    let updatedSubscription;
    if (action === 'cancel') {
      // Cancel at period end (user keeps access until expiration)
      updatedSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        { cancel_at_period_end: true }
      );

      // Update database
      await supabase
        .from('subscriptions')
        .update({ auto_renew: false })
        .eq('id', subscription.id);

    } else if (action === 'resume') {
      // Resume subscription (remove cancellation)
      updatedSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        { cancel_at_period_end: false }
      );

      // Update database
      await supabase
        .from('subscriptions')
        .update({ auto_renew: true })
        .eq('id', subscription.id);
    }

    return NextResponse.json({
      success: true,
      message: action === 'cancel'
        ? 'Subscription will be cancelled at the end of the billing period'
        : 'Subscription resumed successfully',
      subscription: {
        ...subscription,
        auto_renew: action !== 'cancel',
        stripe_details: {
          status: updatedSubscription?.status,
          cancel_at_period_end: updatedSubscription?.cancel_at_period_end,
          current_period_end: updatedSubscription
            ? new Date((updatedSubscription as any).current_period_end * 1000)
            : null,
        },
      },
    });

  } catch (_error) {
    console.error('Error managing subscription:', _error);
    return NextResponse.json(
      {
        success: false,
        error: _error instanceof Error ? _error.message : 'Failed to manage subscription'
      },
      { status: 500 }
    );
  }
}

// DELETE - Immediately cancel subscription (with refund option)
export async function DELETE(request: NextRequest) {
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

    // Get user's active subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('payment_provider', 'stripe')
      .eq('status', 'completed')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !subscription || !subscription.stripe_subscription_id) {
      return NextResponse.json(
        { success: false, error: 'No active Stripe subscription found' },
        { status: 404 }
      );
    }

    // Cancel the subscription immediately
    await stripe.subscriptions.cancel(subscription.stripe_subscription_id);

    // Update database
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        auto_renew: false,
        expires_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    // Reset user to free tier
    await supabase
      .from('users')
      .update({
        subscription_tier: 'free',
        subscription_expires_at: null,
      })
      .eq('id', userId);

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled immediately',
    });

  } catch (_error) {
    console.error('Error cancelling subscription:', _error);
    return NextResponse.json(
      {
        success: false,
        error: _error instanceof Error ? _error.message : 'Failed to cancel subscription'
      },
      { status: 500 }
    );
  }
}

// PUT - Create customer portal session for billing management
export async function PUT(request: NextRequest) {
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

    // Get user's Stripe customer ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError || !user?.stripe_customer_id) {
      return NextResponse.json(
        { success: false, error: 'No Stripe customer found for this user' },
        { status: 404 }
      );
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscription`,
    });

    return NextResponse.json({
      success: true,
      portal_url: session.url,
    });

  } catch (_error) {
    console.error('Error creating portal session:', _error);
    return NextResponse.json(
      {
        success: false,
        error: _error instanceof Error ? _error.message : 'Failed to create portal session'
      },
      { status: 500 }
    );
  }
}