-- Migration Phase 12: Payment Settings & Pricing Tables with Full RLS Policies

-- 1. Ensure app_settings exists and has robust RLS
CREATE TABLE IF NOT EXISTS public.app_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  one_time_pass_price_usd NUMERIC(10, 2) DEFAULT 9.99,
  subscription_price_usd NUMERIC(10, 2) DEFAULT 19.99,
  yearly_subscription_price_usd NUMERIC(10, 2) DEFAULT 99.99,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read app settings" ON public.app_settings;
CREATE POLICY "Public read app settings"
  ON public.app_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins update app settings" ON public.app_settings;
CREATE POLICY "Admins update app settings"
  ON public.app_settings FOR ALL
  USING (
    auth.role() = 'service_role' OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.role() = 'service_role' OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seed default app_settings
INSERT INTO public.app_settings (id, one_time_pass_price_usd, subscription_price_usd, yearly_subscription_price_usd)
VALUES ('global', 9.99, 19.99, 99.99)
ON CONFLICT (id) DO NOTHING;


-- 2. Create pricing_plans table (supporting both naming conventions)
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id TEXT PRIMARY KEY DEFAULT 'global',
  one_time_pass_price_usd NUMERIC(10, 2) DEFAULT 9.99,
  subscription_price_usd NUMERIC(10, 2) DEFAULT 19.99,
  yearly_subscription_price_usd NUMERIC(10, 2) DEFAULT 99.99,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read pricing plans" ON public.pricing_plans;
CREATE POLICY "Public read pricing plans"
  ON public.pricing_plans FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins update pricing plans" ON public.pricing_plans;
CREATE POLICY "Admins update pricing plans"
  ON public.pricing_plans FOR ALL
  USING (
    auth.role() = 'service_role' OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.role() = 'service_role' OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

INSERT INTO public.pricing_plans (id, one_time_pass_price_usd, subscription_price_usd, yearly_subscription_price_usd)
VALUES ('global', 9.99, 19.99, 99.99)
ON CONFLICT (id) DO NOTHING;


-- 3. Create payment_settings table for dynamic gateway configuration
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  active_gateway TEXT DEFAULT 'allpay', -- 'allpay' | 'paddle'
  
  -- Paddle Configuration
  paddle_environment TEXT DEFAULT 'sandbox', -- 'sandbox' | 'production'
  paddle_client_token TEXT DEFAULT '',
  paddle_api_key TEXT DEFAULT '',
  paddle_price_onetime TEXT DEFAULT '',
  paddle_price_monthly TEXT DEFAULT '',
  paddle_price_yearly TEXT DEFAULT '',
  
  -- Allpay Configuration
  allpay_store_id TEXT DEFAULT '',
  allpay_secret_key TEXT DEFAULT '',
  allpay_product_onetime TEXT DEFAULT '',
  allpay_product_monthly TEXT DEFAULT '',
  allpay_product_yearly TEXT DEFAULT '',
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read payment settings" ON public.payment_settings;
CREATE POLICY "Public read payment settings"
  ON public.payment_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins update payment settings" ON public.payment_settings;
CREATE POLICY "Admins update payment settings"
  ON public.payment_settings FOR ALL
  USING (
    auth.role() = 'service_role' OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.role() = 'service_role' OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seed default payment_settings
INSERT INTO public.payment_settings (id, active_gateway, paddle_environment)
VALUES ('global', 'allpay', 'sandbox')
ON CONFLICT (id) DO NOTHING;
