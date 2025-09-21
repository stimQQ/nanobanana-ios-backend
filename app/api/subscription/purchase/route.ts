import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, corsHeaders } from '@/lib/middleware/auth';
import { supabaseAdmin } from '@/lib/supabase/client';
import { SubscriptionRequest, SubscriptionResponse } from '@/lib/types/database';
import { getSubscriptionByProductId } from '@/lib/config/subscriptions';
import { addCredits } from '@/lib/utils/credits';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    const user = req.user!;

    try {
      const body: SubscriptionRequest = await req.json();
      const { tier, receipt_data, transaction_id } = body;

      if (!tier || !receipt_data || !transaction_id) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: corsHeaders() }
        );
      }

      // In production, validate the receipt with Apple's servers
      // For now, we'll trust the client-provided data
      // You would typically use the verifyReceipt endpoint from Apple

      // Get subscription plan details
      const plan = getSubscriptionByProductId(`com.nanobanana.${tier}`);

      if (!plan) {
        return NextResponse.json(
          { success: false, error: 'Invalid subscription tier' },
          { status: 400, headers: corsHeaders() }
        );
      }

      // Check if transaction already exists
      const { data: existingTransaction } = await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('apple_transaction_id', transaction_id)
        .single();

      if (existingTransaction) {
        return NextResponse.json(
          { success: false, error: 'Transaction already processed' },
          { status: 400, headers: corsHeaders() }
        );
      }

      // Calculate expiration date (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Create subscription record
      const { data: subscription, error: subscriptionError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: user.id,
          apple_transaction_id: transaction_id,
          tier: plan.tier,
          price: plan.price,
          credits_per_month: plan.credits,
          images_per_month: plan.images,
          status: 'completed',
          purchased_at: new Date(),
          expires_at: expiresAt,
          auto_renew: true,
        })
        .select()
        .single();

      if (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError);
        return NextResponse.json(
          { success: false, error: 'Failed to create subscription' },
          { status: 500, headers: corsHeaders() }
        );
      }

      // Update user subscription tier and expiration
      const { error: userUpdateError } = await supabaseAdmin
        .from('users')
        .update({
          subscription_tier: plan.tier,
          subscription_expires_at: expiresAt,
        })
        .eq('id', user.id);

      if (userUpdateError) {
        console.error('Error updating user subscription:', userUpdateError);
        // Rollback subscription creation
        await supabaseAdmin
          .from('subscriptions')
          .delete()
          .eq('id', subscription.id);

        return NextResponse.json(
          { success: false, error: 'Failed to update user subscription' },
          { status: 500, headers: corsHeaders() }
        );
      }

      // Add credits to user account
      const { success: creditsAdded, newBalance } = await addCredits(
        user.id,
        plan.credits,
        'subscription',
        `${plan.name} subscription activated`,
        subscription.id
      );

      if (!creditsAdded) {
        console.error('Failed to add credits for subscription');
      }

      // Record payment history
      await supabaseAdmin.from('payment_history').insert({
        user_id: user.id,
        subscription_id: subscription.id,
        apple_transaction_id: transaction_id,
        amount: plan.price,
        currency: 'USD',
        status: 'completed',
        receipt_data: receipt_data,
      });

      const response: SubscriptionResponse = {
        success: true,
        subscription: {
          id: subscription.id,
          user_id: subscription.user_id,
          apple_transaction_id: subscription.apple_transaction_id,
          tier: subscription.tier,
          price: subscription.price,
          credits_per_month: subscription.credits_per_month,
          images_per_month: subscription.images_per_month,
          status: subscription.status,
          purchased_at: subscription.purchased_at,
          expires_at: subscription.expires_at,
          auto_renew: subscription.auto_renew,
          created_at: subscription.created_at,
        },
        credits_added: plan.credits,
      };

      return NextResponse.json(response, { status: 200, headers: corsHeaders() });
    } catch (error) {
      console.error('Subscription error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to process subscription' },
        { status: 500, headers: corsHeaders() }
      );
    }
  });
}