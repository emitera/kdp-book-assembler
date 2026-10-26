-- ==============================================================================
-- BIRDY PAGES: Supabase Keep-Alive Healthcheck Table & Policies
-- Purpose: Prevent Supabase project auto-pause by maintaining active ping records
-- ==============================================================================

create table if not exists public.healthcheck (
  id text primary key default 'birdy_ping',
  last_ping timestamptz default timezone('utc'::text, now()) not null,
  ping_count bigint default 1,
  note text default 'Automated keep-alive ping to prevent Supabase auto-pause'
);

-- Enable Row Level Security (RLS)
alter table public.healthcheck enable row level security;

-- Public RLS Policies for ping service / cron jobs
create policy "Allow select healthcheck" on public.healthcheck for select using (true);
create policy "Allow insert healthcheck" on public.healthcheck for insert with check (true);
create policy "Allow update healthcheck" on public.healthcheck for update using (true) with check (true);

-- Initial ping record insertion / upsert
insert into public.healthcheck (id, last_ping, note)
values ('birdy_ping', now(), 'Initial keep-alive ping record')
on conflict (id) do update set last_ping = now(), ping_count = public.healthcheck.ping_count + 1;
