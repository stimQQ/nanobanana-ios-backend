import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: getCorsHeaders() });
  }

  // Clone the request headers
  const response = NextResponse.next();

  // Add CORS headers to all API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const corsHeaders = getCorsHeaders();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  // Add Cross-Origin-Opener-Policy for Google OAuth
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');

  return response;
}

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match all pages for Cross-Origin-Opener-Policy
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};