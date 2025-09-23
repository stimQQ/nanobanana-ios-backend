import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, corsHeaders } from '@/lib/middleware/auth';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

// GET - Load chat history for the current user
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    const user = req.user!;

    try {
      const { searchParams } = new URL(req.url);
      const sessionId = searchParams.get('session_id');
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');

      let query = supabaseAdmin
        .from('chat_messages')
        .select(`
          *,
          image_generations (
            id,
            status,
            output_image_url,
            error_message
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      // If session_id is provided, filter by it
      if (sessionId) {
        query = query.eq('session_id', sessionId);
      } else {
        // Always get or create the user's persistent session
        try {
          const { data: sessionData, error: sessionError } = await supabaseAdmin
            .rpc('get_or_create_session', { p_user_id: user.id });

          if (!sessionError && sessionData) {
            query = query.eq('session_id', sessionData);
          } else {
            throw sessionError || new Error('No session data');
          }
        } catch (rpcError) {
          console.error('RPC error, using fallback:', rpcError);
          // Fallback: Get the user's first (persistent) session
          const { data: firstMessage } = await supabaseAdmin
            .from('chat_messages')
            .select('session_id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })  // Get the FIRST session
            .limit(1)
            .single();

          if (firstMessage && firstMessage.session_id) {
            // Always use the existing persistent session
            query = query.eq('session_id', firstMessage.session_id);
          }
          // If no messages exist, continue without session filter
        }
      }

      const { data: messages, error } = await query;

      if (error) {
        console.error('Error loading messages:', error);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to load chat history'
          },
          { status: 500, headers: corsHeaders() }
        );
      }

      // Get current session ID - always use the persistent session
      let currentSessionId = messages?.[0]?.session_id;
      if (!currentSessionId && sessionId) {
        currentSessionId = sessionId;
      } else if (!currentSessionId) {
        // Get or create the user's persistent session
        try {
          const { data: persistentSessionId, error: sessionError } = await supabaseAdmin
            .rpc('get_or_create_session', { p_user_id: user.id });
          if (!sessionError && persistentSessionId) {
            currentSessionId = persistentSessionId;
          } else {
            throw sessionError || new Error('No session created');
          }
        } catch (rpcError) {
          console.error('RPC error, creating new persistent session:', rpcError);
          // Fallback: Create a new persistent session ID
          currentSessionId = crypto.randomUUID();
        }
      }

      return NextResponse.json(
        {
          success: true,
          messages: messages || [],
          session_id: currentSessionId,
          total: messages?.length || 0
        },
        { status: 200, headers: corsHeaders() }
      );
    } catch (error) {
      console.error('Error in GET /api/chat/messages:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error'
        },
        { status: 500, headers: corsHeaders() }
      );
    }
  });
}

// POST - Save a new chat message
export async function POST(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    const user = req.user!;

    try {
      const body = await req.json();
      const {
        message_type,
        content,
        prompt,
        image_url,
        input_images,
        generation_type,
        generation_id,
        credits_used,
        error_message,
        metadata,
        session_id
      } = body;

      // Validate required fields
      if (!message_type) {
        return NextResponse.json(
          {
            success: false,
            error: 'message_type is required'
          },
          { status: 400, headers: corsHeaders() }
        );
      }

      // Get or create persistent session ID
      let actualSessionId = session_id;
      if (!actualSessionId) {
        try {
          const { data: persistentSessionId, error: sessionError } = await supabaseAdmin
            .rpc('get_or_create_session', { p_user_id: user.id });

          if (!sessionError && persistentSessionId) {
            actualSessionId = persistentSessionId;
          } else {
            throw sessionError || new Error('No session created');
          }
        } catch (rpcError) {
          console.error('RPC error, using fallback session logic:', rpcError);

          // Fallback: Get the user's first (persistent) session or create one
          const { data: firstMessage } = await supabaseAdmin
            .from('chat_messages')
            .select('session_id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })  // Get the FIRST session
            .limit(1)
            .single();

          if (firstMessage && firstMessage.session_id) {
            // Always use the existing persistent session
            actualSessionId = firstMessage.session_id;
          } else {
            // No messages exist, create the user's first persistent session
            actualSessionId = crypto.randomUUID();
          }
        }
      }

      // Log what we're about to save
      console.log('💾 [CHAT API] Saving message:', {
        user_id: user.id,
        session_id: actualSessionId,
        message_type,
        hasImageUrl: !!image_url,
        imageUrlLength: image_url?.length,
        imageUrlPreview: image_url?.substring(0, 100),
        generation_id,
        timestamp: new Date().toISOString()
      });

      // Create the message record
      const { data: message, error } = await supabaseAdmin
        .from('chat_messages')
        .insert({
          user_id: user.id,
          session_id: actualSessionId,
          message_type,
          content,
          prompt,
          image_url,
          input_images,
          generation_type,
          generation_id,
          credits_used,
          error_message,
          metadata
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [CHAT API] Error saving message:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details
        });
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to save message'
          },
          { status: 500, headers: corsHeaders() }
        );
      }

      console.log('✅ [CHAT API] Message saved successfully:', {
        messageId: message?.id,
        hasImageUrl: !!message?.image_url,
        savedImageUrl: message?.image_url?.substring(0, 100)
      });

      return NextResponse.json(
        {
          success: true,
          message,
          session_id: actualSessionId
        },
        { status: 200, headers: corsHeaders() }
      );
    } catch (error) {
      console.error('Error in POST /api/chat/messages:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error'
        },
        { status: 500, headers: corsHeaders() }
      );
    }
  });
}

// DELETE - Clear chat history for the current session
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    const user = req.user!;

    try {
      const { searchParams } = new URL(req.url);
      const sessionId = searchParams.get('session_id');

      if (!sessionId) {
        return NextResponse.json(
          {
            success: false,
            error: 'session_id is required'
          },
          { status: 400, headers: corsHeaders() }
        );
      }

      // Delete messages for the specified session
      const { error } = await supabaseAdmin
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id)
        .eq('session_id', sessionId);

      if (error) {
        console.error('Error deleting messages:', error);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to clear chat history'
          },
          { status: 500, headers: corsHeaders() }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Chat history cleared successfully'
        },
        { status: 200, headers: corsHeaders() }
      );
    } catch (error) {
      console.error('Error in DELETE /api/chat/messages:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error'
        },
        { status: 500, headers: corsHeaders() }
      );
    }
  });
}