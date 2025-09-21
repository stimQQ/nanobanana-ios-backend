import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { signJWT } from '@/lib/utils/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Development/Testing endpoint - REMOVE IN PRODUCTION
export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' },
        { status: 403 }
      );
    }

    const { email = 'test@example.com', name = 'Test User' } = await request.json();

    // Check if user exists (using prefixed apple_id for dev users)
    const devUserId = `dev_${email}`;
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('apple_id', devUserId)
      .single();

    let user;

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existingUser) {
      // Update existing user
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) throw updateError;
      user = updatedUser;
    } else {
      // Create new test user with credits
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          apple_id: `dev_${email}`, // Prefix for dev users
          email,
          display_name: name,
          credits: 100, // Generous credits for testing
          free_attempts: 100, // Generous free attempts for testing
          subscription_tier: 'pro', // Pro plan for testing all features
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) throw createError;
      user = newUser;
    }

    // Generate JWT token using our auth utility
    const token = await signJWT({
      userId: user.id,
      appleId: user.apple_id,
      email: user.email,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.display_name,
        avatar_url: user.avatar_url,
        credits: user.credits,
        subscription_plan: user.subscription_tier,
      },
      message: 'Development login successful',
    });
  } catch (error: any) {
    console.error('Dev auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: error.message },
      { status: 500 }
    );
  }
}