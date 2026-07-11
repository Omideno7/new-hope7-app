-- New Hope 7 v1.8.0 Hotfix 5
-- Separate course/program management for the dynamic school.
create extension if not exists pgcrypto;

create table if not exists public.school_courses (
  id uuid primary key default gen_random_uuid(),
  course_code text not null unique,
  course_order integer not null default 100,
  title_fa text not null default '',
  title_en text not null default '',
  title_hr text not null default '',
  description_fa text not null default '',
  description_en text not null default '',
  description_hr text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists school_courses_order_idx
  on public.school_courses(course_order);

alter table public.school_courses enable row level security;

drop policy if exists "public read active school courses" on public.school_courses;
create policy "public read active school courses"
  on public.school_courses for select to anon, authenticated
  using (is_active or coalesce((select public.nh7_admin_is_admin_v170()), false));

drop policy if exists "admin manage school courses" on public.school_courses;
create policy "admin manage school courses"
  on public.school_courses for all to authenticated
  using (coalesce((select public.nh7_admin_is_admin_v170()), false))
  with check (coalesce((select public.nh7_admin_is_admin_v170()), false));

grant select on public.school_courses to anon, authenticated;
grant insert, update, delete on public.school_courses to authenticated;

insert into public.school_courses
  (course_code, course_order, title_fa, title_en, title_hr, is_active)
values
  ('foundation_school', 1, 'مدرسه بنیادی مسیحی', 'Christian Foundation School', 'Škola kršćanskih temelja', true)
on conflict (course_code) do update set
  course_order = excluded.course_order,
  title_fa = excluded.title_fa,
  title_en = excluded.title_en,
  title_hr = excluded.title_hr,
  is_active = true,
  updated_at = now();

notify pgrst, 'reload schema';
select to_regclass('public.school_courses') is not null as school_courses_ready;
