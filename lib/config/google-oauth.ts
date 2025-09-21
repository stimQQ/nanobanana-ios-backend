// Google OAuth Configuration
export const googleOAuthConfig = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '85523758539-mmka868bo5486mpmssjmlsm1o3l061q1.apps.googleusercontent.com',

  // Allowed origins for Google OAuth
  // These must be configured in Google Cloud Console
  allowedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://localhost:3000',
    'https://nanobanana-ios-nextjs-backend.vercel.app',
    'https://nanobanana.app',
    'https://nanobanana.vercel.app',
  ],

  // OAuth scopes
  scope: 'openid email profile',

  // Response type
  responseType: 'id_token',
};

// Helper to validate origin
export function isValidOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return googleOAuthConfig.allowedOrigins.includes(origin);
}