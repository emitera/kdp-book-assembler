-- ==============================================================================
-- BIRDY PAGES (KDP BOOK ASSEMBLER) - COMPLETE UNIFIED SUPABASE DATABASE SCHEMA
-- Single Source of Truth DDL with Hardened RLS, Anti-Escalation & Keep-Alive
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. HELPER FUNCTIONS
-- ==============================================================================

-- Fast, cached admin check function (bypasses RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- 2. TABLE: public.profiles
-- User roles, subscription status, generation credits, and lifetime access
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  subscription_status TEXT NOT NULL DEFAULT 'free' CHECK (subscription_status IN ('free', 'onetime', 'monthly', 'yearly', 'canceled', 'lifetime')),
  subscription_id TEXT,
  subscription_expires_at TIMESTAMPTZ,
  generation_credits INTEGER NOT NULL DEFAULT 0,
  has_lifetime_access BOOLEAN NOT NULL DEFAULT false,
  is_lifetime_free BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Select policy: User views their own profile; Admin views all
DROP POLICY IF EXISTS "Allow select profiles" ON public.profiles;
CREATE POLICY "Allow select profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- Update policy: Only Admin or backend service_role can update profiles
DROP POLICY IF EXISTS "Allow update profiles" ON public.profiles;
CREATE POLICY "Allow update profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- ==============================================================================
-- 3. TABLE: public.payment_settings (Paddle Exclusive MoR Settings)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  active_gateway TEXT NOT NULL DEFAULT 'paddle' CHECK (active_gateway IN ('paddle')),
  paddle_environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (paddle_environment IN ('sandbox', 'production')),
  paddle_client_token TEXT DEFAULT '',
  paddle_api_key TEXT DEFAULT '',
  paddle_price_onetime TEXT DEFAULT '',
  paddle_price_monthly TEXT DEFAULT '',
  paddle_price_yearly TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read payment settings" ON public.payment_settings;
CREATE POLICY "Public read payment settings"
  ON public.payment_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins update payment settings" ON public.payment_settings;
CREATE POLICY "Admins update payment settings"
  ON public.payment_settings FOR ALL
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- Seed default payment settings
INSERT INTO public.payment_settings (id, active_gateway, paddle_environment)
VALUES ('global', 'paddle', 'sandbox')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 4. TABLE: public.app_settings (Dynamic Application Pricing)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  one_time_pass_price_usd NUMERIC(10, 2) DEFAULT 9.99,
  subscription_price_usd NUMERIC(10, 2) DEFAULT 19.99,
  yearly_subscription_price_usd NUMERIC(10, 2) DEFAULT 99.99,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read app settings" ON public.app_settings;
CREATE POLICY "Public read app settings"
  ON public.app_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins update app settings" ON public.app_settings;
CREATE POLICY "Admins update app settings"
  ON public.app_settings FOR ALL
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- Seed default pricing
INSERT INTO public.app_settings (id, one_time_pass_price_usd, subscription_price_usd, yearly_subscription_price_usd)
VALUES ('global', 9.99, 19.99, 99.99)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 5. TABLE: public.desktop_licenses (Desktop Client Licensing & Hardware Binding)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.desktop_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  license_key TEXT UNIQUE NOT NULL,
  hardware_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.desktop_licenses ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_desktop_licenses_key ON public.desktop_licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_desktop_licenses_user ON public.desktop_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_desktop_licenses_hw ON public.desktop_licenses(hardware_id);

DROP POLICY IF EXISTS "Allow select desktop licenses" ON public.desktop_licenses;
CREATE POLICY "Allow select desktop licenses"
  ON public.desktop_licenses FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage desktop licenses" ON public.desktop_licenses;
CREATE POLICY "Admins manage desktop licenses"
  ON public.desktop_licenses FOR ALL
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- ==============================================================================
-- 6. TABLE: public.support_tickets (Support Inbox & Issue Tracker)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit support tickets" ON public.support_tickets;
CREATE POLICY "Anyone can submit support tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own support tickets" ON public.support_tickets;
CREATE POLICY "Users can view own support tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can update support tickets" ON public.support_tickets;
CREATE POLICY "Admins can update support tickets"
  ON public.support_tickets FOR UPDATE
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- ==============================================================================
-- 7. TABLE: public.healthcheck (Supabase Anti-Pause System)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.healthcheck (
  id TEXT PRIMARY KEY DEFAULT 'birdy_ping',
  last_ping TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  note TEXT
);

ALTER TABLE public.healthcheck ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read and ping healthcheck" ON public.healthcheck;
CREATE POLICY "Public read and ping healthcheck"
  ON public.healthcheck FOR ALL
  USING (true)
  WITH CHECK (true);

INSERT INTO public.healthcheck (id, note)
VALUES ('birdy_ping', 'Initial healthcheck seed')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 8. TRIGGER: Automatic New User Registration
-- Anti-Privilege Escalation: Role is ALWAYS 'user', never trusting client metadata
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    role, 
    subscription_status, 
    generation_credits, 
    has_lifetime_access, 
    is_lifetime_free
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, ''), 
    'user', -- Strictly 'user'! Prevents privilege escalation
    'free', 
    0, 
    false, 
    false
  )
  ON CONFLICT (id) DO UPDATE 
  SET email = EXCLUDED.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
