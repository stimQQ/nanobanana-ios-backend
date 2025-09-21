import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get environment variables with defaults for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

// Validate URL format for Supabase client
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Use a valid placeholder URL if the environment variable is not set
const validSupabaseUrl = isValidUrl(supabaseUrl) ? supabaseUrl : 'https://placeholder.supabase.co';

// Client for public operations
export const supabase = createClient(validSupabaseUrl, supabaseAnonKey);

// Admin client with service role key for server-side operations
export const supabaseAdmin = createClient(validSupabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Check if we're in production and missing required env vars
if (process.env.NODE_ENV === 'production' && validSupabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('Warning: Supabase environment variables are not properly configured');
}

export default supabase;