-- Migration Phase 12 (Universal & Safe): Payment Settings & Pricing Tables with Full RLS Policies

-- ==============================================================================
-- 1. APP_SETTINGS (Safely create table and add any missing columns)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  id TEXT PRIMARY KEY DEFAULT 'global'
);

ALTER TABLE public.app_settings 
  ADD COLUMN IF NOT EXISTS one_time_pass_price_usd NUMERIC(10, 2) DEFAULT 9.99,
  ADD COLUMN IF NOT EXISTS subscription_price_usd NUMERIC(10, 2) DEFAULT 19.99,
  ADD COLUMN IF NOT EXISTS yearly_subscription_price_usd NUMERIC(10, 2) DEFAULT 99.99,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

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

-- Seed / update default app_settings
INSERT INTO public.app_settings (id, one_time_pass_price_usd, subscription_price_usd, yearly_subscription_price_usd)
VALUES ('global', 9.99, 19.99, 99.99)
ON CONFLICT (id) DO UPDATE SET
  yearly_subscription_price_usd = COALESCE(public.app_settings.yearly_subscription_price_usd, 99.99);


-- ==============================================================================
-- 2. PRICING_PLANS (Safely create table and add any missing columns)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id TEXT PRIMARY KEY DEFAULT 'global'
);

ALTER TABLE public.pricing_plans 
  ADD COLUMN IF NOT EXISTS one_time_pass_price_usd NUMERIC(10, 2) DEFAULT 9.99,
  ADD COLUMN IF NOT EXISTS subscription_price_usd NUMERIC(10, 2) DEFAULT 19.99,
  ADD COLUMN IF NOT EXISTS yearly_subscription_price_usd NUMERIC(10, 2) DEFAULT 99.99,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

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

-- Seed / update default pricing_plans
INSERT INTO public.pricing_plans (id, one_time_pass_price_usd, subscription_price_usd, yearly_subscription_price_usd)
VALUES ('global', 9.99, 19.99, 99.99)
ON CONFLICT (id) DO UPDATE SET
  yearly_subscription_price_usd = COALESCE(public.pricing_plans.yearly_subscription_price_usd, 99.99);


-- ==============================================================================
-- 3. PAYMENT_SETTINGS (Dynamic Gateways for Allpay & Paddle)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id TEXT PRIMARY KEY DEFAULT 'global'
);

ALTER TABLE public.payment_settings 
  ADD COLUMN IF NOT EXISTS active_gateway TEXT DEFAULT 'allpay',
  ADD COLUMN IF NOT EXISTS paddle_environment TEXT DEFAULT 'sandbox',
  ADD COLUMN IF NOT EXISTS paddle_client_token TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS paddle_api_key TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS paddle_price_onetime TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS paddle_price_monthly TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS paddle_price_yearly TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS allpay_store_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS allpay_secret_key TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS allpay_product_onetime TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS allpay_product_monthly TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS allpay_product_yearly TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

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
