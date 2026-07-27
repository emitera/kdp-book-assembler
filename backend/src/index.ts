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
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for frontend requests
app.use('/*', cors({
  origin: '*', // Allow all origins for dev simplicity
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
 * Admin API: Fetch all registered users
 * GET /api/admin/users
 */
app.get('/api/admin/users', async (c) => {
  try {
    const supabase = getSupabaseClient(c.env);
    
    // Fetch all user profiles from Supabase
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email, subscription_status, role, is_lifetime_free, created_at')
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
      .select('id, email, subscription_status, role, is_lifetime_free')
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
      .select('id, email, subscription_status, role, is_lifetime_free')
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
      .select('id, email, subscription_status, role, is_lifetime_free')
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
 * Admin API: Update dynamic app pricing
 * POST /api/admin/update-pricing
 */
app.post('/api/admin/update-pricing', async (c) => {
  try {
    const body = await c.req.json();
    const { oneTimePassPriceUsd, subscriptionPriceUsd, yearlySubscriptionPriceUsd } = body;

    const supabase = getSupabaseClient(c.env);
    const { data: updated, error } = await supabase
      .from('app_settings')
      .upsert({
        id: 'global',
        one_time_pass_price_usd: parseFloat(oneTimePassPriceUsd),
        subscription_price_usd: parseFloat(subscriptionPriceUsd),
        yearly_subscription_price_usd: parseFloat(yearlySubscriptionPriceUsd),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true, settings: updated });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to update pricing' }, 500);
  }
});

export default app;
