-- Supabase Database Schema for KDP Smart Assembler
-- Run this in the SQL Editor of your Supabase Dashboard

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (User Subscription Statuses)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  subscription_status text default 'free' check (subscription_status in ('free', 'pro')),
  subscription_expires_at timestamptz, -- NULL if expired or lifetime
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on Profiles
alter table public.profiles enable row level security;

-- RLS Policies for Profiles
create policy "Allow public read for own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Allow profile updates only by system backend"
  on public.profiles for update
  using (false); -- Disabled for client apps. Only backend service_role key can update.

-- 2. Projects Passes Table (One-Time project licenses)
create table public.projects_passes (
  project_id text primary key, -- client-generated unique project token
  user_id uuid references auth.users on delete set null, -- optional (if user is authenticated)
  email text not null, -- email used at payment checkout
  amount_paid numeric not null,
  status text default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable RLS on Project Passes
alter table public.projects_passes enable row level security;

-- RLS Policies for Project Passes
create policy "Allow read project passes if owner or matches project"
  on public.projects_passes for select
  using (auth.uid() = user_id or user_id is null); -- Allows guest access if token is verified by project ID

-- 3. Payments Table (Transaction logging for audit trail)
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  transaction_id text unique not null,
  user_id uuid references auth.users on delete set null,
  project_id text,
  email text,
  provider text not null check (provider in ('paypal', 'allpay')),
  amount numeric not null,
  currency text default 'USD' not null,
  status text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable RLS on Payments
alter table public.payments enable row level security;

-- RLS Policies for Payments
create policy "Allow select payments for own user"
  on public.payments for select
  using (auth.uid() = user_id);

-- 4. Trigger to automatically create profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, subscription_status)
  values (new.id, new.email, 'free');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
