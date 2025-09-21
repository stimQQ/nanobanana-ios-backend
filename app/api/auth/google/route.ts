import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { signJWT } from '@/lib/utils/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// CORS headers for Google OAuth
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const { credential, name, email, picture } = await request.json();

    if (!credential) {
      return NextResponse.json(
        { error: 'Google credential is required' },
        { status: 400 }
      );
    }

    // Check if user exists by google_id or email
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .or(`google_id.eq.${email},email.eq.${email}`)
      .single();

    let user;
    let isNewUser = false;

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existingUser) {
      // Update existing user
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          google_id: existingUser.google_id || email,
          name: name || existingUser.name,
          display_name: name || existingUser.display_name,
          avatar_url: picture || existingUser.avatar_url,
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) throw updateError;
      user = updatedUser;
    } else {
      // Create new user with initial credits
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          google_id: email, // Store Google identifier
          email,
          name: name,
          display_name: name,
          avatar_url: picture,
          credits: 10, // Initial free credits
          free_attempts: 10, // Initial free attempts
          subscription_plan: 'free', // Use subscription_plan not subscription_tier
          language_code: 'en',
          created_at: new Date().toISOString(),
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) throw createError;
      user = newUser;
      isNewUser = true; // Mark as new user
    }

    // Generate JWT token using our auth utility
    const token = await signJWT({
      userId: user.id,
      appleId: user.apple_id || user.google_id, // Use google_id if apple_id is null
      email: user.email,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.display_name || user.name,
        avatar_url: user.avatar_url,
        credits: user.credits,
        subscription_plan: user.subscription_plan,
        free_attempts: user.free_attempts,
      },
      isNewUser, // Include flag for new user
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Google auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}