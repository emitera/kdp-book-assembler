-- Migration Phase 8: Support Ticket System & Dynamic Pricing Settings

-- 1. Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Security for support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit support tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view support tickets"
  ON public.support_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2. Create app_settings table for dynamic price configuration
CREATE TABLE IF NOT EXISTS public.app_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  one_time_pass_price_usd NUMERIC(10, 2) DEFAULT 9.99,
  subscription_price_usd NUMERIC(10, 2) DEFAULT 19.99,
  yearly_subscription_price_usd NUMERIC(10, 2) DEFAULT 99.99,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Security for app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read app settings"
  ON public.app_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins update app settings"
  ON public.app_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seed default pricing row
INSERT INTO public.app_settings (id, one_time_pass_price_usd, subscription_price_usd, yearly_subscription_price_usd)
VALUES ('global', 9.99, 19.99, 99.99)
ON CONFLICT (id) DO NOTHING;
