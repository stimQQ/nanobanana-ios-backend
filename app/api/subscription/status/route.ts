import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, corsHeaders } from '@/lib/middleware/auth';
import { supabaseAdmin } from '@/lib/supabase/client';
import { SUBSCRIPTION_PLANS } from '@/lib/config/subscriptions';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    const user = req.user!;

    // Get user's current subscription
    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned", which is fine
      console.error('Error fetching subscription:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch subscription status' },
        { status: 500, headers: corsHeaders() }
      );
    }

    // Get subscription plan details
    const plan = SUBSCRIPTION_PLANS[user.subscription_tier];

    return NextResponse.json(
      {
        success: true,
        subscription_tier: user.subscription_tier,
        subscription_expires_at: user.subscription_expires_at,
        current_credits: user.credits,
        free_attempts: user.free_attempts,
        plan_details: plan,
        active_subscription: subscription || null,
        available_plans: Object.values(SUBSCRIPTION_PLANS).filter(p => p.tier !== 'free'),
      },
      { headers: corsHeaders() }
    );
  });
}