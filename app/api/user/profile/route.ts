import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, corsHeaders } from '@/lib/middleware/auth';

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function GET(_request: NextRequest) {
  return withAuth(_request, async (req: AuthenticatedRequest) => {
    const user = req.user!;

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          apple_id: user.apple_id,
          email: user.email,
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          credits: user.credits,
          free_attempts: user.free_attempts,
          subscription_tier: user.subscription_tier,
          subscription_expires_at: user.subscription_expires_at,
          language_code: user.language_code,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      },
      { headers: corsHeaders() }
    );
  });
}

export async function PUT(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    const user = req.user!;
    const body = await req.json();

    const { display_name, language_code } = body;

    const updateData: any = {};
    if (display_name !== undefined) {
      updateData.display_name = display_name;
    }
    if (language_code !== undefined) {
      updateData.language_code = language_code;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data to update' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const { supabaseAdmin } = await import('@/lib/supabase/client');
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' },
        { status: 500, headers: corsHeaders() }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: updatedUser,
      },
      { headers: corsHeaders() }
    );
  });
}