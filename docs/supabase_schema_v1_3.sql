
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


-- Q&A / پرسش و پاسخ - added in v1.3.1
create table if not exists public.qa_questions (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  question_text text not null,
  answer_text text,
  status text not null default 'pending' check (status in ('pending','answered','hidden')),
  language text default 'en',
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.qa_questions enable row level security;

drop policy if exists "qa insert own" on public.qa_questions;
drop policy if exists "qa select own answered or admin" on public.qa_questions;
drop policy if exists "qa update admin" on public.qa_questions;

create policy "qa insert own" on public.qa_questions
for insert to anon, authenticated
with check (device_id = public.nh7_device_id());

create policy "qa select own answered or admin" on public.qa_questions
for select to anon, authenticated
using (device_id = public.nh7_device_id() or status = 'answered' or public.nh7_is_admin());

create policy "qa update admin" on public.qa_questions
for update to authenticated
using (public.nh7_is_admin())
with check (public.nh7_is_admin());

-- Church meeting details - added in v1.3.2
-- Admin can change meeting link/code in Supabase without uploading a new app version.
create table if not exists public.meeting_settings (
  id text primary key default 'active',
  provider text default 'FreeConferenceCall',
  meeting_url text,
  phone_number text,
  access_code text,
  security_code text,
  extra_info text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meeting_settings enable row level security;

drop policy if exists "meeting settings select approved or admin" on public.meeting_settings;
drop policy if exists "meeting settings admin insert" on public.meeting_settings;
drop policy if exists "meeting settings admin update" on public.meeting_settings;

create policy "meeting settings select approved or admin" on public.meeting_settings
for select to anon, authenticated
using (
  public.nh7_is_admin()
  or exists (
    select 1 from public.registrations r
    where r.device_id = public.nh7_device_id()
      and r.type = 'meeting'
      and r.status = 'approved'
  )
);

create policy "meeting settings admin insert" on public.meeting_settings
for insert to authenticated
with check (public.nh7_is_admin());

create policy "meeting settings admin update" on public.meeting_settings
for update to authenticated
using (public.nh7_is_admin())
with check (public.nh7_is_admin());

insert into public.meeting_settings (id, provider, meeting_url, phone_number, access_code, security_code, extra_info)
values ('active', 'FreeConferenceCall', '', '', '', '', '')
on conflict (id) do nothing;
