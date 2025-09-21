import { SignJWT, jwtVerify } from 'jose';
import { User } from '@/lib/types/database';
import { supabaseAdmin } from '@/lib/supabase/client';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export interface JWTPayload {
  userId: string;
  appleId: string;
  email?: string;
  exp?: number;
}

export async function signJWT(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);

  return token;
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Validate and extract our custom payload structure
    if (payload && typeof payload === 'object' && 'userId' in payload && 'appleId' in payload) {
      return {
        userId: payload.userId as string,
        appleId: payload.appleId as string,
        email: payload.email as string | undefined,
        exp: payload.exp as number | undefined,
      };
    }

    return null;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export async function getUserFromToken(token: string): Promise<User | null> {
  const payload = await verifyJWT(token);
  if (!payload) return null;

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', payload.userId)
    .single();

  if (error || !user) return null;
  return user as User;
}

export async function validateAppleIdToken(idToken: string): Promise<any> {
  // In production, you would validate the Apple ID token here
  // This involves:
  // 1. Fetching Apple's public keys
  // 2. Verifying the JWT signature
  // 3. Validating the token claims

  // For now, we'll decode the token without verification
  // In production, use a library like 'apple-signin-auth' or implement proper validation

  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    // Basic validation
    if (!payload.sub) {
      throw new Error('Invalid token: missing subject');
    }

    return {
      sub: payload.sub, // Apple User ID
      email: payload.email,
      email_verified: payload.email_verified,
      is_private_email: payload.is_private_email,
      real_user_status: payload.real_user_status,
    };
  } catch (error) {
    console.error('Apple ID token validation failed:', error);
    throw new Error('Invalid Apple ID token');
  }
}

export function extractBearerToken(authorization?: string): string | null {
  if (!authorization) return null;

  const parts = authorization.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}