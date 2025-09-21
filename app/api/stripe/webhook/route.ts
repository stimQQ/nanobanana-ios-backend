import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_WEBHOOK_EVENTS, getPlanFromPriceId } from '@/lib/config/stripe';
import { SUBSCRIPTION_PLANS } from '@/lib/config/subscriptions';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Disable body parsing, we need raw body for signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    console.error('Missing Stripe signature');
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 400 }
    );
  }

  console.log('Processing webhook event:', event.type);

  try {
    switch (event.type) {
      case STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED: {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case STRIPE_WEBHOOK_EVENTS.SUBSCRIPTION_CREATED:
      case STRIPE_WEBHOOK_EVENTS.SUBSCRIPTION_UPDATED: {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription, event.type);
        break;
      }

      case STRIPE_WEBHOOK_EVENTS.SUBSCRIPTION_DELETED: {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case STRIPE_WEBHOOK_EVENTS.INVOICE_PAID: {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case STRIPE_WEBHOOK_EVENTS.INVOICE_FAILED: {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout.session.completed:', session.id);

  const userId = session.metadata?.supabase_user_id;
  const tier = session.metadata?.subscription_tier;

  if (!userId || !tier) {
    console.error('Missing metadata in session:', { userId, tier });
    return;
  }

  const plan = SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS];
  if (!plan) {
    console.error('Invalid subscription tier:', tier);
    return;
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

  // Calculate expiration date
  const expiresAt = new Date((subscription as any).current_period_end * 1000);

  // Create subscription record in database
  const subscriptionData = {
    id: uuidv4(),
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: subscription.items.data[0].price.id,
    payment_provider: 'stripe',
    tier,
    price: plan.price,
    credits_per_month: plan.credits,
    images_per_month: plan.images,
    status: 'completed',
    purchased_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
    auto_renew: !subscription.cancel_at_period_end,
    created_at: new Date().toISOString(),
  };

  const { error: subError } = await supabase
    .from('subscriptions')
    .insert(subscriptionData);

  if (subError) {
    console.error('Error creating subscription:', subError);
    throw subError;
  }

  // Update user's subscription status and add credits
  const { error: userError } = await supabase
    .from('users')
    .update({
      subscription_tier: tier,
      subscription_expires_at: expiresAt.toISOString(),
      credits: plan.credits,
      stripe_customer_id: session.customer as string,
    })
    .eq('id', userId);

  if (userError) {
    console.error('Error updating user:', userError);
    throw userError;
  }

  // Create credit transaction
  const { error: txError } = await supabase
    .from('credit_transactions')
    .insert({
      id: uuidv4(),
      user_id: userId,
      amount: plan.credits,
      transaction_type: 'subscription',
      description: `${plan.name} subscription via Stripe`,
      related_id: subscriptionData.id,
      balance_after: plan.credits,
      created_at: new Date().toISOString(),
    });

  if (txError) {
    console.error('Error creating credit transaction:', txError);
  }

  // Create payment history record
  const { error: paymentError } = await supabase
    .from('payment_history')
    .insert({
      id: uuidv4(),
      user_id: userId,
      subscription_id: subscriptionData.id,
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string,
      payment_provider: 'stripe',
      amount: plan.price,
      currency: session.currency || 'usd',
      status: 'completed',
      created_at: new Date().toISOString(),
    });

  if (paymentError) {
    console.error('Error creating payment history:', paymentError);
  }

  console.log('Successfully processed checkout for user:', userId);
}

async function handleSubscriptionChange(
  subscription: Stripe.Subscription,
  eventType: string
) {
  console.log(`Processing ${eventType}:`, subscription.id);

  const userId = subscription.metadata?.supabase_user_id;
  if (!userId) {
    console.error('Missing user ID in subscription metadata');
    return;
  }

  const priceId = subscription.items.data[0].price.id;
  const tier = getPlanFromPriceId(priceId);

  if (!tier) {
    console.error('Unknown price ID:', priceId);
    return;
  }

  const plan = SUBSCRIPTION_PLANS[tier];
  const expiresAt = new Date((subscription as any).current_period_end * 1000);

  // Update existing subscription or create new one
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (existingSub) {
    // Update existing subscription
    await supabase
      .from('subscriptions')
      .update({
        tier,
        price: plan.price,
        credits_per_month: plan.credits,
        images_per_month: plan.images,
        expires_at: expiresAt.toISOString(),
        auto_renew: !subscription.cancel_at_period_end,
        status: subscription.status === 'active' ? 'completed' : 'pending',
      })
      .eq('id', existingSub.id);
  } else if (eventType === STRIPE_WEBHOOK_EVENTS.SUBSCRIPTION_CREATED) {
    // Create new subscription record
    await supabase
      .from('subscriptions')
      .insert({
        id: uuidv4(),
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        payment_provider: 'stripe',
        tier,
        price: plan.price,
        credits_per_month: plan.credits,
        images_per_month: plan.images,
        status: subscription.status === 'active' ? 'completed' : 'pending',
        purchased_at: new Date(subscription.created * 1000).toISOString(),
        expires_at: expiresAt.toISOString(),
        auto_renew: !subscription.cancel_at_period_end,
        created_at: new Date().toISOString(),
      });
  }

  // Update user subscription status
  if (subscription.status === 'active') {
    await supabase
      .from('users')
      .update({
        subscription_tier: tier,
        subscription_expires_at: expiresAt.toISOString(),
      })
      .eq('id', userId);
  }

  console.log(`Successfully processed ${eventType} for user:`, userId);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing subscription.deleted:', subscription.id);

  const userId = subscription.metadata?.supabase_user_id;
  if (!userId) {
    console.error('Missing user ID in subscription metadata');
    return;
  }

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      auto_renew: false,
    })
    .eq('stripe_subscription_id', subscription.id);

  // Check if subscription has expired
  const now = new Date();
  const expiresAt = new Date((subscription as any).current_period_end * 1000);

  if (now >= expiresAt) {
    // Reset user to free tier
    await supabase
      .from('users')
      .update({
        subscription_tier: 'free',
        subscription_expires_at: null,
      })
      .eq('id', userId);

    console.log('User reverted to free tier:', userId);
  }

  console.log('Successfully processed subscription deletion for user:', userId);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('Processing invoice.paid:', invoice.id);

  if (!(invoice as any).subscription) {
    console.log('Invoice not related to a subscription, skipping');
    return;
  }

  // Get subscription
  const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
  const userId = subscription.metadata?.supabase_user_id;

  if (!userId) {
    console.error('Missing user ID in subscription metadata');
    return;
  }

  // Check if this is a renewal (not the first payment)
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!existingSub) {
    console.log('Subscription not found, likely handled by checkout.completed');
    return;
  }

  // This is a renewal, add credits to user
  const plan = SUBSCRIPTION_PLANS[existingSub.tier as keyof typeof SUBSCRIPTION_PLANS];

  // Get current user credits
  const { data: user } = await supabase
    .from('users')
    .select('credits')
    .eq('id', userId)
    .single();

  const newCredits = (user?.credits || 0) + plan.credits;

  // Update user credits and extend subscription
  const expiresAt = new Date((subscription as any).current_period_end * 1000);

  await supabase
    .from('users')
    .update({
      credits: newCredits,
      subscription_expires_at: expiresAt.toISOString(),
    })
    .eq('id', userId);

  // Update subscription expiration
  await supabase
    .from('subscriptions')
    .update({
      expires_at: expiresAt.toISOString(),
    })
    .eq('id', existingSub.id);

  // Create credit transaction for renewal
  await supabase
    .from('credit_transactions')
    .insert({
      id: uuidv4(),
      user_id: userId,
      amount: plan.credits,
      transaction_type: 'subscription',
      description: `${plan.name} subscription renewal via Stripe`,
      related_id: existingSub.id,
      balance_after: newCredits,
      created_at: new Date().toISOString(),
    });

  // Create payment history record
  await supabase
    .from('payment_history')
    .insert({
      id: uuidv4(),
      user_id: userId,
      subscription_id: existingSub.id,
      stripe_payment_intent_id: (invoice as any).payment_intent as string,
      payment_provider: 'stripe',
      amount: ((invoice as any).amount_paid / 100), // Convert from cents
      currency: (invoice as any).currency,
      status: 'completed',
      created_at: new Date().toISOString(),
    });

  console.log('Successfully processed invoice payment for user:', userId);
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  console.log('Processing invoice.payment_failed:', invoice.id);

  if (!(invoice as any).subscription) {
    console.log('Invoice not related to a subscription, skipping');
    return;
  }

  // Get subscription
  const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
  const userId = subscription.metadata?.supabase_user_id;

  if (!userId) {
    console.error('Missing user ID in subscription metadata');
    return;
  }

  // Create failed payment record
  await supabase
    .from('payment_history')
    .insert({
      id: uuidv4(),
      user_id: userId,
      stripe_payment_intent_id: (invoice as any).payment_intent as string,
      payment_provider: 'stripe',
      amount: (invoice.amount_due / 100), // Convert from cents
      currency: (invoice as any).currency,
      status: 'failed',
      created_at: new Date().toISOString(),
    });

  console.log('Payment failed for user:', userId);
}