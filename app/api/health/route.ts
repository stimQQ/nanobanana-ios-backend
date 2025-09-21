import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { corsHeaders } from '@/lib/middleware/auth';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    const { error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1)
      .single();

    const dbStatus = !error ? 'healthy' : 'unhealthy';

    // Check environment variables
    const envVars = {
      supabase: !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.SUPABASE_SERVICE_ROLE_KEY
      ),
      apicore: !!process.env.APICORE_API_KEY,
      jwt: !!process.env.JWT_SECRET,
    };

    const allEnvVarsSet = Object.values(envVars).every(v => v);

    return NextResponse.json(
      {
        status: dbStatus === 'healthy' && allEnvVarsSet ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        checks: {
          database: dbStatus,
          environment: allEnvVarsSet ? 'configured' : 'incomplete',
          envDetails: envVars,
        },
      },
      { headers: corsHeaders() }
    );
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503, headers: corsHeaders() }
    );
  }
}