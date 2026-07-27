import { SignJWT } from 'jose';
import { getSupabaseClient } from './db';

/**
 * Signs a custom JWT token that the frontend uses to verify Pro status.
 * Uses 'jose' which runs on Cloudflare Workers native Web Crypto API.
 */
export async function generateProJWT(
  env: { JWT_SECRET: string }, 
  payload: { 
    userId?: string; 
    projectId?: string; 
    email: string; 
    type: 'subscription' | 'project_pass';
  }
) {
  const secret = new TextEncoder().encode(env.JWT_SECRET || 'temporary-dev-jwt-secret-key-987654321');
  
  // Set expiration: 1 day for one-time passes, 30 days for subscriptions
  const expiration = payload.type === 'project_pass' ? '24h' : '30d';

  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(secret);

  return jwt;
}

/**
 * Verifies a user's Supabase authentication token.
 * Calls Supabase auth to get the verified user profile.
 */
export async function verifyUserSession(
  env: { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }, 
  authHeader?: string
) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const supabase = getSupabaseClient(env);

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    console.error('Session validation failed:', error);
    return null;
  }

  return user;
}
