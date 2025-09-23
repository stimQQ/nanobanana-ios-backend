import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, corsHeaders } from '@/lib/middleware/auth';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function GET(_request: NextRequest) {
  console.log('📡 [API/GENERATIONS] GET request received:', {
    url: _request.url,
    timestamp: new Date().toISOString()
  });

  return withAuth(_request, async (req: AuthenticatedRequest) => {
    const user = req.user!;
    const { searchParams } = new URL(req.url);

    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status'); // 'completed', 'processing', 'failed'

    console.log('🔍 [API/GENERATIONS] Query params:', {
      userId: user.id,
      limit,
      offset,
      status,
      userEmail: user.email
    });

    let query = supabaseAdmin
      .from('image_generations')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
      console.log('🔍 [API/GENERATIONS] Filtering by status:', status);
    }

    console.log('📤 [API/GENERATIONS] Executing database query...');
    const { data: generations, error, count } = await query;

    if (error) {
      console.error('❌ [API/GENERATIONS] Database error:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details
      });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch generation history' },
        { status: 500, headers: corsHeaders() }
      );
    }

    console.log('✅ [API/GENERATIONS] Database query successful:', {
      count,
      generationsReturned: generations?.length || 0,
      firstGeneration: generations?.[0] ? {
        id: generations[0].id,
        status: generations[0].status,
        hasOutputUrl: !!generations[0].output_image_url,
        outputUrlPreview: generations[0].output_image_url?.substring(0, 100),
        createdAt: generations[0].created_at
      } : 'No generations found',
      allGenerationIds: generations?.map(g => g.id)
    });

    // Log details of each generation for debugging
    generations?.forEach((gen, idx) => {
      console.log(`📸 [API/GENERATIONS] Generation ${idx + 1}:`, {
        id: gen.id,
        status: gen.status,
        hasUrl: !!gen.output_image_url,
        urlType: gen.output_image_url ?
          (gen.output_image_url.startsWith('data:') ? 'data-url' :
           gen.output_image_url.startsWith('http') ? 'http-url' : 'other') : 'none',
        creditsUsed: gen.credits_used,
        createdAt: gen.created_at
      });
    });

    const response = {
      success: true,
      generations,
      total: count,
      limit,
      offset,
    };

    console.log('📤 [API/GENERATIONS] Sending response:', {
      success: true,
      totalCount: count,
      generationsInResponse: generations?.length || 0
    });

    return NextResponse.json(response, { headers: corsHeaders() });
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