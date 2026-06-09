
-- New Hope 7 App v1.3 Supabase foundation
-- Run this file in Supabase Dashboard -> SQL Editor -> New query -> Run.

create extension if not exists pgcrypto;

create or replace function public.nh7_device_id()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.headers', true)::json ->> 'x-device-id', ''),
    'unknown'
  );
$$;

create or replace function public.nh7_is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email','') in ('omideno7church@gmail.com');
$$;

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  type text not null check (type in ('school','meeting','general')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  language text default 'en',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_verses (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  ref text not null,
  language text default 'en',
  created_at timestamptz not null default now(),
  unique(device_id, ref)
);

create table if not exists public.user_notes (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  note_key text not null,
  content text not null default '',
  language text default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(device_id, note_key)
);

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  progress_key text not null,
  value jsonb not null default '{}'::jsonb,
  language text default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(device_id, progress_key)
);

alter table public.registrations enable row level security;
alter table public.saved_verses enable row level security;
alter table public.user_notes enable row level security;
alter table public.user_progress enable row level security;

drop policy if exists "registrations insert own" on public.registrations;
drop policy if exists "registrations select own or admin" on public.registrations;
drop policy if exists "registrations update admin" on public.registrations;
create policy "registrations insert own" on public.registrations for insert to anon, authenticated with check (device_id = public.nh7_device_id());
create policy "registrations select own or admin" on public.registrations for select to anon, authenticated using (device_id = public.nh7_device_id() or public.nh7_is_admin());
create policy "registrations update admin" on public.registrations for update to authenticated using (public.nh7_is_admin()) with check (public.nh7_is_admin());

drop policy if exists "saved verses own all" on public.saved_verses;
create policy "saved verses own all" on public.saved_verses for all to anon, authenticated using (device_id = public.nh7_device_id()) with check (device_id = public.nh7_device_id());

drop policy if exists "user notes own all" on public.user_notes;
create policy "user notes own all" on public.user_notes for all to anon, authenticated using (device_id = public.nh7_device_id()) with check (device_id = public.nh7_device_id());

drop policy if exists "user progress own all" on public.user_progress;
create policy "user progress own all" on public.user_progress for all to anon, authenticated using (device_id = public.nh7_device_id()) with check (device_id = public.nh7_device_id());
