import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, corsHeaders } from '@/lib/middleware/auth';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    const user = req.user!;
    const { searchParams } = new URL(req.url);

    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type'); // 'subscription', 'purchase', 'usage', 'refund', 'initial'

    let query = supabaseAdmin
      .from('credit_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq('transaction_type', type);
    }

    const { data: transactions, error, count } = await query;

    if (error) {
      console.error('Error fetching credit transactions:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch credit history' },
        { status: 500, headers: corsHeaders() }
      );
    }

    // Calculate summary statistics
    const summary = {
      current_balance: user.credits,
      free_attempts: user.free_attempts,
      total_earned: 0,
      total_spent: 0,
    };

    if (transactions) {
      transactions.forEach(tx => {
        if (tx.amount > 0) {
          summary.total_earned += tx.amount;
        } else {
          summary.total_spent += Math.abs(tx.amount);
        }
      });
    }

    return NextResponse.json(
      {
        success: true,
        transactions,
        summary,
        total: count,
        limit,
        offset,
      },
      { headers: corsHeaders() }
    );
  });
}