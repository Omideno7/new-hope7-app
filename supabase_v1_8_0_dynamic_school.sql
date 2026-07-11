-- New Hope 7 v1.8.0 - Dynamic School Phase 1
-- Safe and idempotent. Existing school JSON remains as offline fallback.
create extension if not exists pgcrypto;

create table if not exists public.school_lessons (
  id uuid primary key default gen_random_uuid(),
  lesson_code text not null unique,
  lesson_order integer not null default 100,
  content_data jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists school_lessons_order_idx on public.school_lessons(lesson_order);
alter table public.school_lessons enable row level security;

drop policy if exists "public read active school lessons" on public.school_lessons;
create policy "public read active school lessons" on public.school_lessons
for select using (is_active or public.nh7_admin_is_admin_v170());

drop policy if exists "admin manage school lessons" on public.school_lessons;
create policy "admin manage school lessons" on public.school_lessons
for all to authenticated
using (public.nh7_admin_is_admin_v170())
with check (public.nh7_admin_is_admin_v170());

grant select on public.school_lessons to anon,authenticated;
grant insert,update,delete on public.school_lessons to authenticated;
