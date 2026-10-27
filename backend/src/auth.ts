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

export type AdminVerificationResult = 
  | { authorized: true; user: any; profile: any }
  | { authorized: false; status: 401 | 403; error: string };

/**
 * Verifies that the requester has a valid Supabase session AND an 'admin' role in the profiles table.
 */
export async function verifyAdminUser(
  env: { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }, 
  authHeader?: string
): Promise<AdminVerificationResult> {
  const user = await verifyUserSession(env, authHeader);
  if (!user) {
    return { authorized: false, status: 401, error: 'Unauthorized: Missing or invalid authorization token' };
  }

  const supabase = getSupabaseClient(env);
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    console.error('Admin verification profile lookup failed:', error);
    return { authorized: false, status: 403, error: 'Forbidden: Profile not found' };
  }

  if (profile.role !== 'admin') {
    return { authorized: false, status: 403, error: 'Forbidden: Admin privilege required' };
  }

  return { authorized: true, user, profile };
}

/**
 * Constant-time comparison of two ASCII strings to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verifies HMAC-SHA256 signature for Paddle Billing webhooks using the native Web Crypto API.
 * Header format: ts=1671552777;h1=0a9c79e43681...
 */
export async function verifyPaddleWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  secretKey?: string
): Promise<boolean> {
  if (!secretKey) {
    console.warn('[Paddle Webhook] PADDLE_WEBHOOK_SECRET is not configured.');
    return false;
  }
  if (!signatureHeader) {
    return false;
  }

  const parts = signatureHeader.split(';').map(p => p.trim());
  let ts = '';
  const hashes: string[] = [];

  for (const part of parts) {
    const [k, v] = part.split('=');
    if (k === 'ts') ts = v;
    if (k === 'h1' && v) hashes.push(v);
  }

  if (!ts || hashes.length === 0) {
    return false;
  }

  // Enforce 5-minute replay attack window
  const tsNum = parseInt(ts, 10);
  const now = Math.floor(Date.now() / 1000);
  if (isNaN(tsNum) || Math.abs(now - tsNum) > 300) {
    console.warn('[Paddle Webhook] Signature timestamp expired or invalid:', ts);
    return false;
  }

  const signedPayload = `${ts}:${rawBody}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(signedPayload));
  const expectedHash = Array.from(new Uint8Array(sigBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return hashes.some(h => timingSafeEqual(h.toLowerCase(), expectedHash.toLowerCase()));
}

