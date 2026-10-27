import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createCheckoutSession, handlePaymentWebhook } from './billing';
import { generateProJWT, verifyUserSession, verifyAdminUser, verifyPaddleWebhookSignature } from './auth';
import { getSupabaseClient } from './db';

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  JWT_SECRET: string;
  FRONTEND_URL?: string;
  RESEND_API_KEY?: string;
  SUPPORT_EMAIL?: string;
  PADDLE_API_KEY?: string;
  PADDLE_VENDOR_ID?: string;
  PADDLE_WEBHOOK_SECRET?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for frontend requests
app.use('/*', cors({
  origin: (origin) => {
    const allowed = [
      'https://birdypages.io',
      'https://www.birdypages.io',
      'https://kdp-smart-assembler.pages.dev',
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    if (allowed.includes(origin) || !origin) {
      return origin;
    }
    // Check if it's a Cloudflare Pages preview deployment
    if (origin.endsWith('.kdp-smart-assembler.pages.dev')) {
      return origin;
    }
    return 'https://birdypages.io';
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-paddle-signature', 'Paddle-Signature', 'paddle-signature'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600
}));

app.get('/', (c) => c.text('Birdy Pages Backend API Running (Paddle MoR Exclusive)'));

// ==============================================================================
// RATE LIMITER & HELPER FUNCTIONS
// ==============================================================================

interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * In-memory sliding window rate limiter for edge workers
 */
function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  if (!record || record.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (record.count >= limit) {
    return true;
  }
  record.count++;
  return false;
}

/**
 * Generate Cryptographic License Key Format: BIRDY-XXXX-XXXX-XXXX
 */
function generateLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars (0, O, 1, I)
  const getRandomBlock = (len: number) => {
    let result = '';
    const randomBytes = new Uint8Array(len);
    crypto.getRandomValues(randomBytes);
    for (let i = 0; i < len; i++) {
      result += chars[randomBytes[i] % chars.length];
    }
    return result;
  };
  return `BIRDY-${getRandomBlock(4)}-${getRandomBlock(4)}-${getRandomBlock(4)}`;
}

/**
 * Send Transactional Email via Resend API
 */
async function sendResendEmail(
  env: Bindings,
  to: string,
  subject: string,
  html: string,
  replyTo?: string
) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Resend] RESEND_API_KEY is not configured. Email not dispatched.');
    return false;
  }
  try {
    const fromEmail = env.SUPPORT_EMAIL || 'support@birdypages.io';
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `Birdy Pages <${fromEmail}>`,
        to: [to],
        reply_to: replyTo,
        subject,
        html
      })
    });
    return res.ok;
  } catch (err) {
    console.error('[Resend] Error dispatching email:', err);
    return false;
  }
}

/**
 * Helper to send email notification to support@birdypages.io
 */
async function sendSupportEmail(
  env: Bindings,
  ticket: { email: string; subject: string; category: string; message: string; userId?: string | null; ticketId?: string }
) {
  const supportEmail = env.SUPPORT_EMAIL || 'support@birdypages.io';
  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #6366f1; padding-bottom: 12px; margin-bottom: 16px;">
        <h2 style="color: #4f46e5; margin: 0; font-size: 20px;">Birdy Pages Support Request</h2>
        <span style="font-size: 12px; color: #64748b;">Ticket ID: ${ticket.ticketId || 'N/A'}</span>
      </div>
      <table style="width: 100%; font-size: 14px; margin-bottom: 20px; border-collapse: collapse;">
        <tr>
          <td style="font-weight: bold; width: 130px; color: #475569; padding: 6px 0;">From Email:</td>
          <td style="padding: 6px 0;"><a href="mailto:${ticket.email}" style="color: #4f46e5; font-weight: 600;">${ticket.email}</a></td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #475569; padding: 6px 0;">User ID:</td>
          <td style="padding: 6px 0;">${ticket.userId || 'Guest (Not authenticated)'}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #475569; padding: 6px 0;">Category:</td>
          <td style="padding: 6px 0;"><span style="background: #eef2ff; color: #4338ca; padding: 3px 8px; border-radius: 6px; font-weight: 600; font-size: 12px;">${ticket.category.toUpperCase()}</span></td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #475569; padding: 6px 0;">Subject:</td>
          <td style="padding: 6px 0; font-weight: 600;">${ticket.subject}</td>
        </tr>
      </table>
      <div style="background: #f8fafc; border-left: 4px solid #6366f1; padding: 16px; border-radius: 8px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #334155;">${ticket.message}</div>
      <div style="margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 12px;">
        Birdy Pages Automated Support Notification • ${new Date().toUTCString()}
      </div>
    </div>
  `;

  await sendResendEmail(
    env,
    supportEmail,
    `[Support - ${ticket.category.toUpperCase()}] ${ticket.subject}`,
    emailHtml,
    ticket.email
  );
}

// ==============================================================================
// 1. PADDLE WEBHOOK ROUTE (Merchant of Record)
// ==============================================================================
/**
 * Paddle Webhook Endpoint (transaction.completed, subscription.created, etc.)
 * POST /api/webhooks/paddle
 */
app.post('/api/webhooks/paddle', async (c) => {
  const supabase = getSupabaseClient(c.env);

  try {
    const rawBody = await c.req.text();
    const signatureHeader = c.req.header('paddle-signature') || c.req.header('Paddle-Signature') || c.req.header('x-paddle-signature');

    // Strict HMAC-SHA256 signature verification if secret configured
    if (c.env.PADDLE_WEBHOOK_SECRET) {
      const isValid = await verifyPaddleWebhookSignature(rawBody, signatureHeader, c.env.PADDLE_WEBHOOK_SECRET);
      if (!isValid) {
        console.error('[Paddle Webhook] Rejected: Invalid or expired webhook signature');
        return c.json({ error: 'Unauthorized: Invalid webhook signature' }, 401);
      }
    } else {
      console.warn('[Paddle Webhook] PADDLE_WEBHOOK_SECRET is not configured on this environment.');
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return c.json({ error: 'Invalid JSON payload' }, 400);
    }

    const eventType = event.event_type || event.alert_name;
    console.log(`[Paddle Webhook] Received event: ${eventType}`);

    if (eventType === 'transaction.completed' || eventType === 'subscription.created') {
      const data = event.data || event;
      const customerEmail = data.customer?.email || data.user_email || data.customer_email;
      const customData = data.custom_data || {};
      let userId = customData.userId || customData.user_id;

      // Lookup user if userId not provided in customData
      if (!userId && customerEmail) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .ilike('email', customerEmail)
          .maybeSingle();
        userId = profile?.id;
      }

      // Generate BIRDY-XXXX-XXXX-XXXX Desktop License Key
      const licenseKey = generateLicenseKey();

      if (userId) {
        // Record license in database
        await supabase.from('desktop_licenses').insert({
          user_id: userId,
          license_key: licenseKey,
          status: 'active',
          expires_at: null
        });

        // Update profile subscription status
        await supabase
          .from('profiles')
          .update({
            subscription_status: customData.plan_type || 'monthly',
            has_lifetime_access: customData.plan_type === 'lifetime',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
      }

      // Send License Key Email to Customer via Resend
      if (customerEmail) {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #4f46e5; text-align: center; margin-top: 0;">Welcome to Birdy Pages Desktop & Pro! 🚀</h2>
            <p style="color: #334155; font-size: 15px;">Thank you for your purchase. Here is your official license key for Birdy Pages:</p>
            <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0; border: 1px solid #cbd5e1;">
              <span style="font-size: 24px; font-family: monospace; font-weight: bold; letter-spacing: 2px; color: #1e293b;">${licenseKey}</span>
            </div>
            <p style="color: #64748b; font-size: 14px; line-height: 1.5;">
              Enter this key in the Birdy Pages Desktop app or Web version to activate all Pro features, local AI upscaling, and unlimited zero-crop book generation.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-bottom: 0;">
              Questions? Reach us anytime at ${c.env.SUPPORT_EMAIL || 'support@birdypages.io'}
            </p>
          </div>
        `;

        await sendResendEmail(
          c.env,
          customerEmail,
          'Your Birdy Pages License Key 🔑',
          emailHtml
        );
      }

      return c.json({ success: true, license_key: licenseKey });
    }

    if (eventType === 'subscription.canceled') {
      const data = event.data || event;
      const customerEmail = data.customer?.email || data.user_email;
      if (customerEmail) {
        await supabase
          .from('profiles')
          .update({ subscription_status: 'canceled', updated_at: new Date().toISOString() })
          .ilike('email', customerEmail);
      }
      return c.json({ success: true, message: 'Subscription canceled' });
    }

    return c.json({ received: true });
  } catch (err: any) {
    console.error('[Paddle Webhook Error]', err);
    return c.json({ error: 'Webhook processing failed', details: err.message }, 500);
  }
});

// ==============================================================================
// 2. DESKTOP BRIDGE: CLIENT LICENSE VALIDATION ENDPOINT
// ==============================================================================
/**
 * Desktop App License Validation
 * POST /api/desktop/validate-license
 */
app.post('/api/desktop/validate-license', async (c) => {
  const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
  if (isRateLimited(`license:${clientIp}`, 30, 60_000)) {
    return c.json({ valid: false, error: 'RATE_LIMIT_EXCEEDED', message: 'Too many license validation requests. Please wait a minute.' }, 429);
  }

  const supabase = getSupabaseClient(c.env);
  const body = await c.req.json<{ license_key: string; hardware_id: string }>();

  if (!body.license_key || !body.hardware_id) {
    return c.json({ error: 'license_key and hardware_id are required' }, 400);
  }

  const { data: license, error } = await supabase
    .from('desktop_licenses')
    .select('*, profiles:user_id(email, subscription_status)')
    .eq('license_key', body.license_key.trim().toUpperCase())
    .maybeSingle();

  if (error || !license) {
    return c.json({ valid: false, error: 'INVALID_KEY', message: 'License key not found' }, 404);
  }

  if (license.status === 'revoked') {
    return c.json({ valid: false, error: 'REVOKED', message: 'License has been revoked' }, 403);
  }

  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    return c.json({ valid: false, error: 'EXPIRED', message: 'License has expired' }, 403);
  }

  // Device Binding: Bind hardware_id if unassigned, or verify device match
  if (!license.hardware_id) {
    await supabase
      .from('desktop_licenses')
      .update({ hardware_id: body.hardware_id, updated_at: new Date().toISOString() })
      .eq('id', license.id);
  } else if (license.hardware_id !== body.hardware_id) {
    return c.json({
      valid: false,
      error: 'DEVICE_MISMATCH',
      message: 'License is bound to another computer hardware ID',
    }, 403);
  }

  return c.json({
    valid: true,
    license_id: license.id,
    user_email: (license.profiles as any)?.email,
    plan: (license.profiles as any)?.subscription_status || 'desktop_pro',
    expires_at: license.expires_at
  });
});

// ==============================================================================
// ADMIN AUTHORIZATION MIDDLEWARE
// Strictly requires valid Supabase session AND 'admin' role in profiles table
// ==============================================================================
app.use('/api/admin/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const result = await verifyAdminUser(c.env, authHeader);
  if (!result.authorized) {
    return c.json({ error: result.error }, result.status as any);
  }
  await next();
});

// ==============================================================================
// 3. ADMIN CRM: DESKTOP LICENSES MANAGEMENT
// ==============================================================================

/**
 * Admin API: Fetch All Desktop Licenses
 * GET /api/admin/licenses
 */
app.get('/api/admin/licenses', async (c) => {
  try {
    const supabase = getSupabaseClient(c.env);
    const userId = c.req.query('user_id');

    let query = supabase
      .from('desktop_licenses')
      .select('*, profiles:user_id(id, email, subscription_status)')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: licenses, error } = await query;
    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ licenses: licenses || [] });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch licenses' }, 500);
  }
});

/**
 * Admin API: Manually Generate Free License for a User
 * POST /api/admin/generate-license
 */
app.post('/api/admin/generate-license', async (c) => {
  try {
    const supabase = getSupabaseClient(c.env);
    const body = await c.req.json<{ user_id: string; expires_at?: string; send_email?: boolean }>();

    if (!body.user_id) {
      return c.json({ error: 'user_id is required' }, 400);
    }

    const licenseKey = generateLicenseKey();

    const { data: license, error } = await supabase
      .from('desktop_licenses')
      .insert({
        user_id: body.user_id,
        license_key: licenseKey,
        status: 'active',
        expires_at: body.expires_at || null
      })
      .select()
      .single();

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    // Optional: Send email notification to user
    if (body.send_email) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', body.user_id)
        .single();

      if (userProfile?.email) {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h2 style="color: #4f46e5;">Birdy Pages Desktop License Issued 🔑</h2>
            <p>Your administrator has granted you a free license for Birdy Pages Desktop:</p>
            <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 22px; font-family: monospace; font-weight: bold; letter-spacing: 2px;">${licenseKey}</span>
            </div>
            <p style="color: #64748b; font-size: 14px;">Enter this license key in Birdy Pages to unlock full Pro capabilities.</p>
          </div>
        `;
        await sendResendEmail(c.env, userProfile.email, 'Your Birdy Pages Desktop License 🔑', emailHtml);
      }
    }

    return c.json({ success: true, license });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to generate license' }, 500);
  }
});

/**
 * Admin API: Revoke a Desktop License
 * POST /api/admin/revoke-license
 */
app.post('/api/admin/revoke-license', async (c) => {
  try {
    const supabase = getSupabaseClient(c.env);
    const body = await c.req.json<{ license_id: string }>();

    if (!body.license_id) {
      return c.json({ error: 'license_id is required' }, 400);
    }

    const { data: license, error } = await supabase
      .from('desktop_licenses')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('id', body.license_id)
      .select()
      .single();

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true, license });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to revoke license' }, 500);
  }
});

// ==============================================================================
// 4. CORE CHECKOUT & SUPPORT ROUTES
// ==============================================================================

/**
 * Creates checkout session (Paddle sole provider)
 * POST /api/create-checkout
 */
app.post('/api/create-checkout', async (c) => {
  try {
    const body = await c.req.json();
    const { email, userId, projectId, type, provider, amount } = body;

    if (!email || !type || !amount) {
      return c.json({ error: 'Missing required checkout parameters' }, 400);
    }

    const session = await createCheckoutSession(c.env, {
      email,
      userId,
      projectId,
      type,
      provider: provider || 'paddle',
      amount: parseFloat(amount)
    });

    return c.json(session);
  } catch (err: any) {
    return c.json({ error: err.message || 'Checkout session failed' }, 500);
  }
});

/**
 * Public API: Submit Support Ticket and send email to support
 * POST /api/support/ticket
 */
app.post('/api/support/ticket', async (c) => {
  try {
    const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    if (isRateLimited(`ticket:${clientIp}`, 5, 10 * 60_000)) {
      return c.json({ error: 'Too many support tickets submitted. Please wait 10 minutes before submitting again.' }, 429);
    }

    const body = await c.req.json();
    const { email, subject, category, message, userId } = body;

    if (!email || !subject || !message) {
      return c.json({ error: 'Email, subject, and message are required' }, 400);
    }

    const supabase = getSupabaseClient(c.env);

    // 1. Insert into support_tickets table
    const { data: ticket, error: insertError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userId || null,
        email,
        subject,
        category: category || 'general',
        message,
        status: 'open'
      })
      .select()
      .single();

    if (insertError) {
      console.warn('Supabase support_tickets insert error:', insertError.message);
    }

    // 2. Dispatch real email to support@birdypages.io
    await sendSupportEmail(c.env, {
      email,
      subject,
      category: category || 'general',
      message,
      userId,
      ticketId: ticket?.id
    });

    return c.json({ success: true, ticketId: ticket?.id });
  } catch (err: any) {
    console.error('Support ticket error:', err);
    return c.json({ error: err.message || 'Failed to submit support ticket' }, 500);
  }
});

/**
 * Admin API: Get Support Tickets
 * GET /api/admin/support-tickets
 */
app.get('/api/admin/support-tickets', async (c) => {
  try {
    const supabase = getSupabaseClient(c.env);
    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ tickets: tickets || [] });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch support tickets' }, 500);
  }
});

/**
 * Admin API: Update Support Ticket Status
 * POST /api/admin/update-ticket-status
 */
app.post('/api/admin/update-ticket-status', async (c) => {
  try {
    const body = await c.req.json();
    const { ticketId, status, adminNotes } = body;

    if (!ticketId || !status) {
      return c.json({ error: 'Missing ticketId or status' }, 400);
    }

    const supabase = getSupabaseClient(c.env);
    const updatePayload: any = { status, updated_at: new Date().toISOString() };
    if (adminNotes !== undefined) updatePayload.admin_notes = adminNotes;

    const { data: updated, error } = await supabase
      .from('support_tickets')
      .update(updatePayload)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true, ticket: updated });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to update ticket status' }, 500);
  }
});

// ==============================================================================
// 5. ADMIN CRM: USER & CREDITS MANAGEMENT
// ==============================================================================

/**
 * Admin API: Fetch all registered users
 * GET /api/admin/users
 */
app.get('/api/admin/users', async (c) => {
  try {
    const supabase = getSupabaseClient(c.env);
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email, subscription_status, subscription_expires_at, role, is_lifetime_free, generation_credits, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ users: users || [] });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch users' }, 500);
  }
});

/**
 * Admin API: Create New User (Auth + Profile)
 * POST /api/admin/create-user
 */
app.post('/api/admin/create-user', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, role, subscriptionStatus, isLifetimeFree, generationCredits } = body;

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const supabase = getSupabaseClient(c.env);

    // Create auth account via Supabase Admin Auth API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError || !authData.user) {
      return c.json({ error: authError?.message || 'Failed to create user in Auth' }, 400);
    }

    const userId = authData.user.id;

    // Upsert the profile record
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email,
        role: role || 'user',
        subscription_status: subscriptionStatus || 'free',
        is_lifetime_free: Boolean(isLifetimeFree),
        generation_credits: Math.max(0, parseInt(String(generationCredits), 10) || 0),
        updated_at: new Date().toISOString()
      })
      .select('id, email, subscription_status, subscription_expires_at, role, is_lifetime_free, generation_credits')
      .single();

    if (profileError) {
      return c.json({ error: profileError.message }, 500);
    }

    return c.json({ success: true, user: profile });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to create user' }, 500);
  }
});

/**
 * Admin API: Update User Generation Credits (Refund Policy +1, +5, -1)
 * POST /api/admin/update-user-credits
 */
app.post('/api/admin/update-user-credits', async (c) => {
  try {
    const body = await c.req.json();
    const { userId, credits, delta } = body;

    if (!userId) {
      return c.json({ error: 'Missing userId' }, 400);
    }

    const supabase = getSupabaseClient(c.env);

    let finalCredits = credits;
    if (typeof delta === 'number') {
      const { data: current } = await supabase
        .from('profiles')
        .select('generation_credits')
        .eq('id', userId)
        .single();
      finalCredits = Math.max(0, (current?.generation_credits || 0) + delta);
    }

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({ generation_credits: Math.max(0, parseInt(String(finalCredits), 10) || 0) })
      .eq('id', userId)
      .select('id, email, subscription_status, subscription_expires_at, role, is_lifetime_free, generation_credits')
      .single();

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true, profile: updatedProfile });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to update user credits' }, 500);
  }
});

/**
 * Admin API: Update User Subscription Plan
 * POST /api/admin/update-user-plan
 */
app.post('/api/admin/update-user-plan', async (c) => {
  try {
    const body = await c.req.json();
    const { userId, plan, expiresAt } = body;

    if (!userId || !plan) {
      return c.json({ error: 'Missing userId or plan' }, 400);
    }

    const supabase = getSupabaseClient(c.env);
    const updatePayload: any = {
      subscription_status: plan
    };
    if (expiresAt !== undefined) {
      updatePayload.subscription_expires_at = expiresAt;
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select('id, email, subscription_status, subscription_expires_at, role, is_lifetime_free, generation_credits')
      .single();

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true, profile: updated });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to update user plan' }, 500);
  }
});

/**
 * Admin API: Cancel User Subscription
 * POST /api/admin/cancel-subscription
 */
app.post('/api/admin/cancel-subscription', async (c) => {
  try {
    const body = await c.req.json();
    const { userId } = body;

    if (!userId) {
      return c.json({ error: 'Missing userId' }, 400);
    }

    const supabase = getSupabaseClient(c.env);

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'canceled',
        subscription_expires_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, email, subscription_status, subscription_expires_at, role, is_lifetime_free, generation_credits')
      .single();

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true, profile: updated, message: 'Subscription canceled successfully' });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to cancel subscription' }, 500);
  }
});

/**
 * Admin API: Toggle Lifetime Free Access
 * POST /api/admin/toggle-lifetime
 */
app.post('/api/admin/toggle-lifetime', async (c) => {
  try {
    const body = await c.req.json();
    const { userId, isLifetimeFree } = body;

    if (!userId || typeof isLifetimeFree !== 'boolean') {
      return c.json({ error: 'Missing userId or isLifetimeFree status' }, 400);
    }

    const supabase = getSupabaseClient(c.env);

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({ is_lifetime_free: isLifetimeFree })
      .eq('id', userId)
      .select('id, email, subscription_status, subscription_expires_at, role, is_lifetime_free, generation_credits')
      .single();

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true, profile: updatedProfile });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to update lifetime status' }, 500);
  }
});

/**
 * Admin API: Update User Role
 * POST /api/admin/update-user-role
 */
app.post('/api/admin/update-user-role', async (c) => {
  try {
    const body = await c.req.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return c.json({ error: 'Missing userId or role' }, 400);
    }

    const supabase = getSupabaseClient(c.env);
    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select('id, email, subscription_status, subscription_expires_at, role, is_lifetime_free, generation_credits')
      .single();

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true, profile: updated });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to update user role' }, 500);
  }
});

/**
 * Admin API: Delete User
 * POST /api/admin/delete-user
 */
app.post('/api/admin/delete-user', async (c) => {
  try {
    const body = await c.req.json();
    const { userId } = body;

    if (!userId) {
      return c.json({ error: 'Missing userId' }, 400);
    }

    const supabase = getSupabaseClient(c.env);

    await supabase.from('profiles').delete().eq('id', userId);
    await supabase.auth.admin.deleteUser(userId);

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to delete user' }, 500);
  }
});

// ==============================================================================
// 6. PRICING & PADDLE PAYMENT SETTINGS APIS
// ==============================================================================

/**
 * Public API: Fetch dynamic app pricing
 * GET /api/settings
 */
app.get('/api/settings', async (c) => {
  try {
    const supabase = getSupabaseClient(c.env);
    const { data: settings } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 'global')
      .single();

    return c.json({
      one_time_pass_price_usd: settings?.one_time_pass_price_usd ?? 9.99,
      subscription_price_usd: settings?.subscription_price_usd ?? 19.99,
      yearly_subscription_price_usd: settings?.yearly_subscription_price_usd ?? 99.99
    });
  } catch (err: any) {
    return c.json({ one_time_pass_price_usd: 9.99, subscription_price_usd: 19.99, yearly_subscription_price_usd: 99.99 });
  }
});

/**
 * Public API: Fetch dynamic payment gateway settings (Paddle Exclusive)
 * GET /api/payment-settings
 */
app.get('/api/payment-settings', async (c) => {
  try {
    const supabase = getSupabaseClient(c.env);
    const { data: settings, error } = await supabase
      .from('payment_settings')
      .select('active_gateway, paddle_environment, paddle_client_token, paddle_price_onetime, paddle_price_monthly, paddle_price_yearly')
      .eq('id', 'global')
      .single();

    if (error) {
      return c.json({
        active_gateway: 'paddle',
        paddle_environment: 'sandbox',
        paddle_client_token: '',
        paddle_price_onetime: '',
        paddle_price_monthly: '',
        paddle_price_yearly: ''
      });
    }

    return c.json(settings || {
      active_gateway: 'paddle',
      paddle_environment: 'sandbox'
    });
  } catch (err: any) {
    console.error('Error in /api/payment-settings:', err);
    return c.json({ active_gateway: 'paddle', paddle_environment: 'sandbox' });
  }
});

/**
 * Admin API: Fetch full dynamic payment settings
 * GET /api/admin/payment-settings
 */
app.get('/api/admin/payment-settings', async (c) => {
  try {
    const supabase = getSupabaseClient(c.env);
    const { data: settings, error } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('id', 'global')
      .single();

    if (error) {
      return c.json({
        active_gateway: 'paddle',
        paddle_environment: 'sandbox',
        paddle_client_token: '',
        paddle_api_key: '',
        paddle_price_onetime: '',
        paddle_price_monthly: '',
        paddle_price_yearly: ''
      });
    }

    // Mask paddle_api_key to avoid leaking plaintext in admin network requests
    const maskedSettings = { ...settings };
    if (maskedSettings.paddle_api_key && maskedSettings.paddle_api_key.length > 8) {
      maskedSettings.paddle_api_key = `${maskedSettings.paddle_api_key.slice(0, 4)}••••••••${maskedSettings.paddle_api_key.slice(-4)}`;
    }

    return c.json(maskedSettings);
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch payment settings' }, 500);
  }
});

/**
 * Admin API: Update payment settings (Paddle MoR)
 * POST /api/admin/update-payment-settings
 */
app.post('/api/admin/update-payment-settings', async (c) => {
  try {
    const body = await c.req.json();
    const {
      paddle_environment,
      paddle_client_token,
      paddle_api_key,
      paddle_price_onetime,
      paddle_price_monthly,
      paddle_price_yearly
    } = body;

    const supabase = getSupabaseClient(c.env);
    const payload: any = {
      id: 'global',
      active_gateway: 'paddle',
      paddle_environment: paddle_environment || 'sandbox',
      paddle_client_token: paddle_client_token ?? '',
      paddle_price_onetime: paddle_price_onetime ?? '',
      paddle_price_monthly: paddle_price_monthly ?? '',
      paddle_price_yearly: paddle_price_yearly ?? '',
      updated_at: new Date().toISOString()
    };

    // Only update paddle_api_key if a new unmasked string is provided
    if (paddle_api_key && !paddle_api_key.includes('••••')) {
      payload.paddle_api_key = paddle_api_key;
    } else if (paddle_api_key === '') {
      payload.paddle_api_key = '';
    }

    const { data: updated, error } = await supabase
      .from('payment_settings')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      return c.json({ error: error.message || 'Database error updating payment settings' }, 500);
    }

    return c.json({ success: true, settings: updated });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to update payment settings' }, 500);
  }
});

/**
 * Admin API: Update dynamic app pricing
 * POST /api/admin/update-pricing
 */
app.post('/api/admin/update-pricing', async (c) => {
  try {
    const body = await c.req.json();
    const { oneTimePassPriceUsd, subscriptionPriceUsd, yearlySubscriptionPriceUsd } = body;

    const supabase = getSupabaseClient(c.env);
    const pricingPayload = {
      id: 'global',
      one_time_pass_price_usd: parseFloat(oneTimePassPriceUsd),
      subscription_price_usd: parseFloat(subscriptionPriceUsd),
      yearly_subscription_price_usd: parseFloat(yearlySubscriptionPriceUsd),
      updated_at: new Date().toISOString()
    };

    const { data: updated, error } = await supabase
      .from('app_settings')
      .upsert(pricingPayload)
      .select()
      .single();

    if (error) {
      return c.json({ error: error.message || 'Failed to update pricing' }, 500);
    }

    return c.json({ success: true, settings: updated });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to update pricing on server' }, 500);
  }
});

export default app;
