-- New Hope 7 v1.9.0 Internal - Exams, Progress, Publishing and Admin support
create extension if not exists pgcrypto;

create table if not exists public.school_exams (
  id uuid primary key default gen_random_uuid(),
  lesson_code text not null,
  title_fa text default '', title_en text default '', title_hr text default '',
  passing_score integer not null default 80 check (passing_score between 0 and 100),
  max_attempts integer not null default 3,
  sort_order integer not null default 1,
  questions jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists school_exams_lesson_idx on public.school_exams(lesson_code,is_active,sort_order);

create table if not exists public.school_progress (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  user_name text default '',
  lesson_code text not null,
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  completed_at timestamptz,
  exam_id uuid references public.school_exams(id) on delete set null,
  exam_score integer,
  exam_passed boolean,
  exam_attempted_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_email,lesson_code)
);
create index if not exists school_progress_email_idx on public.school_progress(lower(user_email));
create index if not exists school_progress_lesson_idx on public.school_progress(lesson_code,updated_at desc);

alter table public.school_exams enable row level security;
alter table public.school_progress enable row level security;

drop policy if exists "school exams read" on public.school_exams;
create policy "school exams read" on public.school_exams for select using (is_active = true or auth.role()='authenticated');
drop policy if exists "school exams admin all" on public.school_exams;
create policy "school exams admin all" on public.school_exams for all to authenticated using (true) with check (true);

drop policy if exists "school progress own read" on public.school_progress;
create policy "school progress own read" on public.school_progress for select to authenticated using (lower(user_email)=lower(coalesce(auth.jwt()->>'email','')));
drop policy if exists "school progress own insert" on public.school_progress;
create policy "school progress own insert" on public.school_progress for insert to authenticated with check (lower(user_email)=lower(coalesce(auth.jwt()->>'email','')));
drop policy if exists "school progress own update" on public.school_progress;
create policy "school progress own update" on public.school_progress for update to authenticated using (lower(user_email)=lower(coalesce(auth.jwt()->>'email',''))) with check (lower(user_email)=lower(coalesce(auth.jwt()->>'email','')));
-- Existing admin panel uses authenticated owner session. If a stricter owner policy exists, replace these broad policies later.
drop policy if exists "school progress admin read" on public.school_progress;
create policy "school progress admin read" on public.school_progress for select to authenticated using (true);
drop policy if exists "school progress admin delete" on public.school_progress;
create policy "school progress admin delete" on public.school_progress for delete to authenticated using (true);

alter table public.school_courses add column if not exists publish_state text not null default 'published';
alter table public.school_lessons add column if not exists publish_state text not null default 'published';
notify pgrst, 'reload schema';
select to_regclass('public.school_exams') is not null as exams_ready,
       to_regclass('public.school_progress') is not null as progress_ready;
