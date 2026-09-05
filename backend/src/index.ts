import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createCheckoutSession, handlePaymentWebhook } from './billing';
import { generateProJWT, verifyUserSession } from './auth';
import { getSupabaseClient } from './db';

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  JWT_SECRET: string;
  PAYPAL_CLIENT_ID: string;
  PAYPAL_CLIENT_SECRET: string;
  PAYPAL_LIVE_MODE?: string;
  FRONTEND_URL?: string;
  RESEND_API_KEY?: string;
  SUPPORT_EMAIL?: string;
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
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600
}));

app.get('/', (c) => c.text('KDP Smart Assembler Backend API Running'));

/**
 * Creates checkout session and generates checkout redirection link.
 * POST /api/create-checkout
 */
app.post('/api/create-checkout', async (c) => {
  try {
    const body = await c.req.json();
    const { email, userId, projectId, type, provider, amount } = body;

    if (!email || !type || !provider || !amount) {
      return c.json({ error: 'Missing required checkout parameters' }, 400);
    }

    if (type === 'project_pass' && !projectId) {
      return c.json({ error: 'Project ID is required for a project pass' }, 400);
    }

    if (type === 'subscription' && !userId) {
      return c.json({ error: 'User ID is required for subscriptions' }, 400);
    }

    const session = await createCheckoutSession(c.env, {
      email,
      userId,
      projectId,
      type,
      provider,
      amount: parseFloat(amount)
    });

    return c.json(session);
  } catch (err: any) {
    return c.json({ error: err.message || 'Checkout session failed' }, 500);
  }
});

/**
 * PayPal webhook notification listener
 * POST /api/webhook/paypal
 */
app.post('/api/webhook/paypal', async (c) => {
  try {
    const data = await c.req.json();
    const result = await handlePaymentWebhook(c.env, 'paypal', data);
    return c.json(result);
  } catch (err: any) {
    console.error('PayPal webhook error:', err);
    return c.json({ error: err.message }, 500);
  }
});

/**
 * Allpay webhook notification listener
 * POST /api/webhook/allpay
 */
app.post('/api/webhook/allpay', async (c) => {
  try {
    // Allpay sends parameters as urlencoded body (application/x-www-form-urlencoded)
    const data = await c.req.parseBody();
    const result = await handlePaymentWebhook(c.env, 'allpay', data);
    return c.json(result);
  } catch (err: any) {
    console.error('Allpay webhook error:', err);
    return c.json({ error: err.message }, 500);
  }
});

/**
 * Checks payments DB and issues custom JWT to grant Pro generation access.
 * POST /api/get-token
 */
app.post('/api/get-token', async (c) => {
  try {
    const body = await c.req.json();
    const { projectId, userId } = body;
    const authHeader = c.req.header('Authorization');
    const supabase = getSupabaseClient(c.env);

    // Option A: Verify subscription status (requires User authentication)
    if (userId) {
      const user = await verifyUserSession(c.env, authHeader);
      if (!user || user.id !== userId) {
        return c.json({ error: 'Unauthorized: Invalid user session' }, 401);
      }

      // Query profiles table for active subscription
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_expires_at, email')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        return c.json({ error: 'Profile not found' }, 404);
      }

      const isSubbed = profile.subscription_status === 'pro';
      const isNotExpired = !profile.subscription_expires_at || 
                           new Date(profile.subscription_expires_at) > new Date();

      if (isSubbed && isNotExpired) {
        const token = await generateProJWT(c.env, {
          userId: user.id,
          email: profile.email || user.email || '',
          type: 'subscription'
        });
        return c.json({ token });
      }

      return c.json({ error: 'Pro subscription required' }, 403);
    }

    // Option B: Verify single-project pass (allows guests/anonymous tokens)
    if (projectId) {
      const { data: projectPass, error } = await supabase
        .from('projects_passes')
        .select('project_id, email, status')
        .eq('project_id', projectId)
        .eq('status', 'active')
        .single();

      if (error || !projectPass) {
        return c.json({ error: 'No active project pass found' }, 403);
      }

      const token = await generateProJWT(c.env, {
        projectId: projectPass.project_id,
        email: projectPass.email,
        type: 'project_pass'
      });

      return c.json({ token });
    }

    return c.json({ error: 'Missing projectId or userId' }, 400);
  } catch (err: any) {
    return c.json({ error: err.message || 'Token generation failed' }, 500);
  }
});

/**
 * Developer Simulator Endpoint
 * Triggers successful webhook call and redirects to frontend dashboard.
 * GET /api/simulate-payment
 */
app.get('/api/simulate-payment', async (c) => {
  try {
    const provider = c.req.query('provider') as 'paypal' | 'allpay';
    const amount = parseFloat(c.req.query('amount') || '0');
    const customId = c.req.query('customId') || '';

    if (!provider || !customId) {
      return c.text('Invalid simulator parameters', 400);
    }

    // Mock payment gateway callback object
    const mockPayload: any = provider === 'paypal' 
      ? {
          event_type: 'PAYMENT.CAPTURE.COMPLETED',
          resource: {
            id: `MOCK-PAYMENT-${Date.now()}`,
            status: 'COMPLETED',
            amount: { value: amount.toFixed(2) },
            custom_id: customId
          }
        }
      : {
          MerchantTradeNo: `MOCK-PAY-${Date.now()}`,
          RtnCode: '1',
          TradeAmt: amount.toString(),
          CustomField1: customId
        };

    const metadata = JSON.parse(customId);
    
    // Invoke handler directly
    await handlePaymentWebhook(c.env, provider, mockPayload);

    // Redirect back to frontend
    const frontUrl = c.env.FRONTEND_URL || 'http://localhost:5173';
    return c.redirect(`${frontUrl}?payment=success&projectId=${metadata.projectId || ''}`);
  } catch (err: any) {
    return c.text(`Simulator Error: ${err.message}`, 500);
  }
});

/**
 * Helper to send email notification to support@birdypages.io via Resend or HTTP dispatch
 */
async function sendSupportEmail(
  env: Bindings,
  ticket: { email: string; subject: string; category: string; message: string; userId?: string | null; ticketId?: string }
) {
  const supportEmail = env.SUPPORT_EMAIL || 'support@birdypages.io';
  const apiKey = env.RESEND_API_KEY;

  if (apiKey) {
    try {
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

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Birdy Pages Support <onboarding@resend.dev>',
          to: [supportEmail],
          reply_to: ticket.email,
          subject: `[Support - ${ticket.category.toUpperCase()}] ${ticket.subject}`,
          html: emailHtml
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('Resend API dispatch notice:', response.status, errorText);
      }
    } catch (e) {
      console.error('Resend dispatch error:', e);
    }
  } else {
    console.log(`[Support Ticket Received] To: ${supportEmail} | From: ${ticket.email} | Subject: ${ticket.subject} | Body: ${ticket.message}`);
  }
}

/**
 * Public API: Submit Support Ticket and send email to support
 * POST /api/support/ticket
 */
app.post('/api/support/ticket', async (c) => {
  try {
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

/**
 * Admin API: Fetch all registered users with generation credits and subscription metadata
 * GET /api/admin/users
 */
app.get('/api/admin/users', async (c) => {
  try {
    const supabase = getSupabaseClient(c.env);
    
    // Fetch all user profiles from Supabase
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
 * Admin API: Update User Generation Credits (Add, Subtract, Set)
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
 * Admin API: Update User Subscription Plan (Free, One-Time, Monthly, Yearly, Canceled)
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

    // 1. Update status in database to canceled
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

    // TODO: Phase 16 Gateway Subscription Cancellation API Call:
    // When Paddle / Allpay subscription IDs are stored in the user profile,
    // call Paddle API (DELETE https://api.paddle.com/subscriptions/{subscription_id})
    // or Allpay recurring cancellation endpoint to cancel recurring charges at the gateway level.

    return c.json({ success: true, profile: updated, message: 'Subscription canceled successfully' });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to cancel subscription' }, 500);
  }
});

/**
 * Admin API: Toggle Lifetime Free Access for a specific user
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
 * Admin API: Update User Subscription Status
 * POST /api/admin/update-user-subscription
 */
app.post('/api/admin/update-user-subscription', async (c) => {
  try {
    const body = await c.req.json();
    const { userId, subscriptionStatus } = body;

    if (!userId || !subscriptionStatus) {
      return c.json({ error: 'Missing userId or subscriptionStatus' }, 400);
    }

    const supabase = getSupabaseClient(c.env);
    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ subscription_status: subscriptionStatus })
      .eq('id', userId)
      .select('id, email, subscription_status, subscription_expires_at, role, is_lifetime_free, generation_credits')
      .single();

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true, profile: updated });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to update subscription status' }, 500);
  }
});

/**
 * Admin API: Create New User
 * POST /api/admin/create-user
 */
app.post('/api/admin/create-user', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, role, subscriptionStatus, isLifetimeFree } = body;

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const supabase = getSupabaseClient(c.env);

    // 1. Create auth user using Supabase Admin Auth API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError || !authData.user) {
      return c.json({ error: authError?.message || 'Failed to create user in Auth system' }, 500);
    }

    // 2. Upsert profile parameters
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email,
        role: role || 'user',
        subscription_status: subscriptionStatus || 'free',
        is_lifetime_free: !!isLifetimeFree
      })
      .select()
      .single();

    if (profileError) {
      return c.json({ error: profileError.message }, 500);
    }

    return c.json({ success: true, profile });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to create user' }, 500);
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

    // 1. Delete from profiles table
    await supabase.from('profiles').delete().eq('id', userId);

    // 2. Delete from auth.users via Admin API
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.warn('Auth user deletion warning:', deleteError);
    }

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to delete user' }, 500);
  }
});

/**
 * Public API: Fetch dynamic app pricing settings
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
 * Public API: Fetch dynamic payment gateway settings (for client checkout)
 * GET /api/payment-settings
 */
app.get('/api/payment-settings', async (c) => {
  try {
    const supabase = getSupabaseClient(c.env);
    const { data: settings, error } = await supabase
      .from('payment_settings')
      .select('active_gateway, paddle_environment, paddle_client_token, paddle_price_onetime, paddle_price_monthly, paddle_price_yearly, allpay_store_id, allpay_product_onetime, allpay_product_monthly, allpay_product_yearly')
      .eq('id', 'global')
      .single();

    if (error) {
      console.warn('Could not fetch payment_settings, returning defaults:', error.message);
      return c.json({
        active_gateway: 'allpay',
        paddle_environment: 'sandbox',
        paddle_client_token: '',
        paddle_price_onetime: '',
        paddle_price_monthly: '',
        paddle_price_yearly: '',
        allpay_store_id: '',
        allpay_product_onetime: '',
        allpay_product_monthly: '',
        allpay_product_yearly: ''
      });
    }

    return c.json(settings || {
      active_gateway: 'allpay',
      paddle_environment: 'sandbox'
    });
  } catch (err: any) {
    console.error('Error in /api/payment-settings:', err);
    return c.json({ active_gateway: 'allpay', paddle_environment: 'sandbox' });
  }
});

/**
 * Admin API: Fetch full dynamic payment gateway settings (including API keys)
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
      console.error('Error fetching admin payment settings:', error.message);
      return c.json({
        active_gateway: 'allpay',
        paddle_environment: 'sandbox',
        paddle_client_token: '',
        paddle_api_key: '',
        paddle_price_onetime: '',
        paddle_price_monthly: '',
        paddle_price_yearly: '',
        allpay_store_id: '',
        allpay_secret_key: '',
        allpay_product_onetime: '',
        allpay_product_monthly: '',
        allpay_product_yearly: ''
      });
    }

    return c.json(settings);
  } catch (err: any) {
    console.error('Admin payment settings fetch error:', err);
    return c.json({ error: err.message || 'Failed to fetch payment settings' }, 500);
  }
});

/**
 * Admin API: Update dynamic payment gateway settings
 * POST /api/admin/update-payment-settings
 */
app.post('/api/admin/update-payment-settings', async (c) => {
  try {
    const body = await c.req.json();
    const {
      active_gateway,
      paddle_environment,
      paddle_client_token,
      paddle_api_key,
      paddle_price_onetime,
      paddle_price_monthly,
      paddle_price_yearly,
      allpay_store_id,
      allpay_secret_key,
      allpay_product_onetime,
      allpay_product_monthly,
      allpay_product_yearly
    } = body;

    const supabase = getSupabaseClient(c.env);
    const payload = {
      id: 'global',
      active_gateway: active_gateway || 'allpay',
      paddle_environment: paddle_environment || 'sandbox',
      paddle_client_token: paddle_client_token ?? '',
      paddle_api_key: paddle_api_key ?? '',
      paddle_price_onetime: paddle_price_onetime ?? '',
      paddle_price_monthly: paddle_price_monthly ?? '',
      paddle_price_yearly: paddle_price_yearly ?? '',
      allpay_store_id: allpay_store_id ?? '',
      allpay_secret_key: allpay_secret_key ?? '',
      allpay_product_onetime: allpay_product_onetime ?? '',
      allpay_product_monthly: allpay_product_monthly ?? '',
      allpay_product_yearly: allpay_product_yearly ?? '',
      updated_at: new Date().toISOString()
    };

    const { data: updated, error } = await supabase
      .from('payment_settings')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating payment_settings:', error);
      return c.json({ error: error.message || 'Database error updating payment settings' }, 500);
    }

    return c.json({ success: true, settings: updated });
  } catch (err: any) {
    console.error('Server error updating payment settings:', err);
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

    // Update app_settings table
    const { data: updated, error } = await supabase
      .from('app_settings')
      .upsert(pricingPayload)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating app_settings:', error);
      // Fallback try pricing_plans table
      const { data: pUpdated, error: pError } = await supabase
        .from('pricing_plans')
        .upsert(pricingPayload)
        .select()
        .single();
      
      if (pError) {
        console.error('Supabase error updating pricing_plans fallback:', pError);
        return c.json({ error: error.message || pError.message || 'Failed to update pricing in database' }, 500);
      }
      return c.json({ success: true, settings: pUpdated });
    }

    // Also update pricing_plans if it exists for sync
    await supabase.from('pricing_plans').upsert(pricingPayload).catch(() => {});

    return c.json({ success: true, settings: updated });
  } catch (err: any) {
    console.error('Server exception updating pricing:', err);
    return c.json({ error: err.message || 'Failed to update pricing on server' }, 500);
  }
});

export default app;
