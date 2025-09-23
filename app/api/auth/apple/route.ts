import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { validateAppleIdToken, signJWT } from '@/lib/utils/auth';
import { AuthRequest, AuthResponse } from '@/lib/types/database';
import { corsHeaders } from '@/lib/middleware/auth';

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    const body: AuthRequest = await request.json();
    const { apple_id_token, user_info } = body;

    if (!apple_id_token) {
      return NextResponse.json(
        { success: false, error: 'Apple ID token is required' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Validate Apple ID token
    let appleUser;
    try {
      appleUser = await validateAppleIdToken(apple_id_token);
    } catch (_error) {
      return NextResponse.json(
        { success: false, error: 'Invalid Apple ID token' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const appleId = appleUser.sub;

    // Check if user exists
    const { data: existingUser, error: _findError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('apple_id', appleId)
      .single();

    let user;

    if (!existingUser) {
      // Create new user
      const newUserData = {
        apple_id: appleId,
        email: user_info?.email || appleUser.email,
        display_name: user_info?.display_name,
        credits: 40, // Initial credits
        free_attempts: 10, // Initial free attempts
        subscription_tier: 'free',
        language_code: 'en',
      };

      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert(newUserData)
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          { success: false, error: 'Failed to create user' },
          { status: 500, headers: corsHeaders() }
        );
      }

      user = newUser;

      // Add initial credit transaction
      await supabaseAdmin.from('credit_transactions').insert({
        user_id: user.id,
        amount: 40,
        transaction_type: 'initial',
        description: 'Welcome bonus credits',
        balance_after: 40,
      });
    } else {
      user = existingUser;

      // Update user info if provided
      if (user_info) {
        const updateData: any = {};
        if (user_info.email && !user.email) {
          updateData.email = user_info.email;
        }
        if (user_info.display_name && !user.display_name) {
          updateData.display_name = user_info.display_name;
        }

        if (Object.keys(updateData).length > 0) {
          await supabaseAdmin
            .from('users')
            .update(updateData)
            .eq('id', user.id);
        }
      }
    }

    // Generate JWT token
    const token = await signJWT({
      userId: user.id,
      appleId: user.apple_id,
      email: user.email,
    });

    const _language = request.headers.get('accept-language')?.split(',')[0].split('-')[0] || 'en';

    const response: AuthResponse = {
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
      token,
    };

    return NextResponse.json(response, { status: 200, headers: corsHeaders() });
  } catch (_error) {
    console.error('Authentication error:', _error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500, headers: corsHeaders() }
    );
  }
}