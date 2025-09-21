import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, corsHeaders } from '@/lib/middleware/auth';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

// GET - Get all chat sessions for the current user
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    const user = req.user!;

    try {
      // Get all unique sessions for the user with their last message
      const { data: sessions, error } = await supabaseAdmin
        .from('chat_messages')
        .select('session_id, created_at, content, image_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading sessions:', error);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to load sessions'
          },
          { status: 500, headers: corsHeaders() }
        );
      }

      // Group messages by session
      const sessionMap = new Map();
      sessions?.forEach(msg => {
        if (!sessionMap.has(msg.session_id)) {
          sessionMap.set(msg.session_id, {
            session_id: msg.session_id,
            last_message_at: msg.created_at,
            last_content: msg.content || 'Generated image',
            has_image: !!msg.image_url,
            message_count: 1
          });
        } else {
          const session = sessionMap.get(msg.session_id);
          session.message_count++;
        }
      });

      const sessionList = Array.from(sessionMap.values())
        .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

      return NextResponse.json(
        {
          success: true,
          sessions: sessionList,
          total: sessionList.length
        },
        { status: 200, headers: corsHeaders() }
      );
    } catch (error) {
      console.error('Error in GET /api/chat/sessions:', error);
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

// POST - Get the user's persistent session (no longer creates new sessions)
export async function POST(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    const user = req.user!;

    try {
      // Get the user's persistent session ID
      let sessionId: string;

      try {
        const { data: persistentSessionId, error: sessionError } = await supabaseAdmin
          .rpc('get_or_create_session', { p_user_id: user.id });

        if (!sessionError && persistentSessionId) {
          sessionId = persistentSessionId;
        } else {
          throw sessionError || new Error('No session found');
        }
      } catch (rpcError) {
        console.error('RPC error, using fallback:', rpcError);

        // Fallback: Get the user's first session
        const { data: firstMessage } = await supabaseAdmin
          .from('chat_messages')
          .select('session_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (firstMessage && firstMessage.session_id) {
          sessionId = firstMessage.session_id;
        } else {
          // No messages exist, create the user's first persistent session
          sessionId = crypto.randomUUID();
        }
      }

      // Get the latest message in the session
      const { data: message } = await supabaseAdmin
        .from('chat_messages')
        .select()
        .eq('user_id', user.id)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return NextResponse.json(
        {
          success: true,
          session_id: sessionId,
          message,
          info: 'Using persistent session - all messages stay in one continuous conversation'
        },
        { status: 200, headers: corsHeaders() }
      );
    } catch (error) {
      console.error('Error in POST /api/chat/sessions:', error);
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