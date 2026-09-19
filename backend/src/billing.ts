import { getSupabaseClient } from './db';

interface CheckoutParams {
  email: string;
  userId?: string;
  projectId?: string;
  type: 'subscription' | 'subscription_monthly' | 'subscription_yearly' | 'project_pass';
  provider: 'paddle' | 'paypal';
  amount: number;
}

/**
 * Mocks or invokes the payment provider API to create a checkout link (Paddle MoR exclusive).
 */
export async function createCheckoutSession(env: any, params: CheckoutParams) {
  const { provider, amount, type, userId, projectId, email } = params;

  // Metadata payload passed to payment gateway to retrieve in webhook
  const customId = JSON.stringify({
    userId,
    projectId,
    type,
    email
  });

  const supabase = getSupabaseClient(env);

  // Paddle Billing Integration (Merchant of Record)
  try {
    const { data: pSettings } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('id', 'global')
      .single();

    const isSandbox = pSettings?.paddle_environment === 'sandbox';
    const paddleApiUrl = isSandbox 
      ? 'https://sandbox-api.paddle.com' 
      : 'https://api.paddle.com';
    const apiKey = pSettings?.paddle_api_key;

    let priceId = pSettings?.paddle_price_onetime;
    if (type === 'subscription_monthly' || type === 'subscription') {
      priceId = pSettings?.paddle_price_monthly;
    } else if (type === 'subscription_yearly') {
      priceId = pSettings?.paddle_price_yearly;
    }

    if (apiKey && priceId) {
      const txResponse = await fetch(`${paddleApiUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [{ price_id: priceId, quantity: 1 }],
          customer_email: email,
          custom_data: {
            userId: userId || '',
            projectId: projectId || '',
            type: type,
            email: email
          },
          checkout: {
            success_url: `${env.FRONTEND_URL || 'https://birdypages.io'}?payment=success&projectId=${projectId || ''}`
          }
        })
      });

      if (txResponse.ok) {
        const txData: any = await txResponse.json();
        const checkoutUrl = txData.data?.checkout?.url;
        if (checkoutUrl) {
          return { checkoutUrl, transactionId: txData.data?.id };
        }
      }
    }

    // Fallback checkout simulation if keys aren't configured yet
    const checkoutQuery = new URLSearchParams({
      provider: 'paddle',
      amount: amount.toString(),
      type: type,
      customId: customId
    });
    return {
      checkoutUrl: `http://localhost:3000/api/simulate-payment?${checkoutQuery.toString()}`,
      simulated: true
    };
  } catch (err: any) {
    console.error('Paddle Checkout Error:', err);
    return {
      checkoutUrl: `http://localhost:3000/api/simulate-payment?provider=paddle&amount=${amount}&customId=${encodeURIComponent(customId)}`,
      simulated: true
    };
  }
}

/**
 * Handles payment completion webhook notifications.
 * Records transaction logs and activates paid roles in Supabase.
 */
export async function handlePaymentWebhook(env: any, provider: 'paddle' | 'paypal', data: any) {
  const supabase = getSupabaseClient(env);

  let transactionId = data.id || `TX_${Date.now()}`;
  let status = 'COMPLETED';
  let amount = 0;
  let customIdStr = '';

  const eventType = data.event_type || data.alert_name || '';

  if (eventType === 'transaction.completed' || eventType === 'subscription.created') {
    status = 'COMPLETED';
    const txData = data.data || data;
    transactionId = txData.id || transactionId;
    amount = parseFloat(txData.details?.totals?.total || '0') / 100 || 0;
    customIdStr = JSON.stringify(txData.custom_data || {});
  } else if (eventType === 'subscription.canceled' || eventType === 'subscription.past_due') {
    status = 'CANCELLED';
    const txData = data.data || data;
    customIdStr = JSON.stringify(txData.custom_data || {});
  }

  if (!customIdStr || customIdStr === '{}') {
    return { status: 'acknowledged' };
  }

  try {
    const metadata = JSON.parse(customIdStr);
    const { userId, projectId, type, email } = metadata;

    // 1. Log transaction into payments table
    await supabase.from('payments').insert({
      transaction_id: transactionId,
      user_id: userId || null,
      project_id: projectId || null,
      email: email,
      provider: 'paddle',
      amount: amount,
      status: status
    });

    // 2. Deactivate if cancelled
    if (status === 'CANCELLED' && userId) {
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'free',
          subscription_expires_at: null
        })
        .eq('id', userId);

      return { status: 'deactivated', userId };
    }

    // 3. Activate features if completed
    if (status === 'COMPLETED') {
      if ((type === 'subscription' || type === 'subscription_monthly' || type === 'subscription_yearly') && userId) {
        const expirationDate = new Date();
        if (type === 'subscription_yearly') {
          expirationDate.setDate(expirationDate.getDate() + 365);
        } else {
          expirationDate.setDate(expirationDate.getDate() + 30);
        }

        await supabase
          .from('profiles')
          .update({
            subscription_status: type === 'subscription_yearly' ? 'yearly' : 'monthly',
            subscription_expires_at: expirationDate.toISOString()
          })
          .eq('id', userId);
      } else if (type === 'project_pass' && projectId) {
        await supabase
          .from('projects_passes')
          .insert({
            project_id: projectId,
            user_id: userId || null,
            email: email,
            amount_paid: amount,
            status: 'active'
          });
      }
    }

    return { status: 'success', type, projectId, userId };
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return { error: err.message };
  }
}
