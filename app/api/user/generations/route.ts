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
    const status = searchParams.get('status'); // 'completed', 'processing', 'failed'

    let query = supabaseAdmin
      .from('image_generations')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: generations, error, count } = await query;

    if (error) {
      console.error('Error fetching generations:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch generation history' },
        { status: 500, headers: corsHeaders() }
      );
    }

    return NextResponse.json(
      {
        success: true,
        generations,
        total: count,
        limit,
        offset,
      },
      { headers: corsHeaders() }
    );
  });
}

export async function DELETE(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    const user = req.user!;
    const { searchParams } = new URL(req.url);
    const generationId = searchParams.get('id');

    if (!generationId) {
      return NextResponse.json(
        { success: false, error: 'Generation ID is required' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Verify ownership and delete
    const { error } = await supabaseAdmin
      .from('image_generations')
      .delete()
      .eq('id', generationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting generation:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete generation' },
        { status: 500, headers: corsHeaders() }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Generation deleted successfully' },
      { headers: corsHeaders() }
    );
  });
}