-- KriptoDanik AI · Free/Pro + billing foundation
create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text default '',
  username text default '',
  plan text not null default 'free' check (plan in ('free','pro')),
  pro_until timestamptz null,
  free_until timestamptz null,
  stripe_customer_id text null,
  stripe_subscription_id text null,
  blocked boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz null
);

-- Safe migrations for an already-created users table.
alter table public.users add column if not exists stripe_customer_id text null;
alter table public.users add column if not exists stripe_subscription_id text null;
alter table public.users add column if not exists free_until timestamptz null;
alter table public.users add column if not exists is_admin boolean not null default false;

create index if not exists users_plan_idx on public.users(plan);
create index if not exists users_created_idx on public.users(created_at desc);
create index if not exists users_last_seen_idx on public.users(last_seen_at desc);
create index if not exists users_stripe_subscription_idx on public.users(stripe_subscription_id);
create index if not exists users_free_until_idx on public.users(free_until);

alter table public.users disable row level security;

-- The service-role key is used only by Vercel serverless functions.
-- Do not put SUPABASE_SERVICE_ROLE_KEY in browser JavaScript.
-- Billing also requires STRIPE_SECRET_KEY in Vercel environment variables.
