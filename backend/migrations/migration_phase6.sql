-- Migration Phase 6: User Roles & Lifetime Free Access

-- 1. Add role and is_lifetime_free columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user',
ADD COLUMN IF NOT EXISTS is_lifetime_free boolean DEFAULT false;

-- 2. Update automatic signup trigger function to include default columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, subscription_status, role, is_lifetime_free)
  VALUES (new.id, new.email, 'free', 'user', false)
  ON CONFLICT (id) DO UPDATE 
  SET email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Set Admin Access for the SaaS Owner
-- Replace 'your-email@domain.com' with your actual registered email address in Supabase!
-- UPDATE public.profiles SET role = 'admin', is_lifetime_free = true WHERE email = 'your-email@domain.com';
