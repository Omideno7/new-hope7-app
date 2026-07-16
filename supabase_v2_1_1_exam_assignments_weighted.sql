-- New Hope 7 v2.1.1 - Dynamic course exam, assignments and weighted final grade
-- Run once in Supabase SQL Editor BEFORE uploading the changed web files.
-- Safe additive migration: existing lessons, users, progress and exams are preserved.
create extension if not exists pgcrypto;

-- Existing course-exam upgrade columns.
alter table public.school_exams add column if not exists exam_scope text not null default 'lesson';
alter table public.school_exams add column if not exists course_code text;
alter table public.school_exams add column if not exists intro_fa text default '';
alter table public.school_exams add column if not exists intro_en text default '';
alter table public.school_exams add column if not exists intro_hr text default '';
alter table public.school_exams add column if not exists pass_message_fa text default '';
alter table public.school_exams add column if not exists pass_message_en text default '';
alter table public.school_exams add column if not exists pass_message_hr text default '';
alter table public.school_exams add column if not exists fail_message_fa text default '';
alter table public.school_exams add column if not exists fail_message_en text default '';
alter table public.school_exams add column if not exists fail_message_hr text default '';
alter table public.school_exams add column if not exists duration_minutes integer not null default 0;
alter table public.school_exams add column if not exists shuffle_questions boolean not null default false;
alter table public.school_exams add column if not exists show_answers text not null default 'after_submit';
alter table public.school_exams add column if not exists require_course_completion boolean not null default false;

-- v2.1.1 weighted assessment and random-attempt settings.
alter table public.school_exams add column if not exists exam_weight integer not null default 70;
alter table public.school_exams add column if not exists assignment_weight integer not null default 30;
alter table public.school_exams add column if not exists questions_per_attempt integer not null default 0;
alter table public.school_exams add column if not exists require_assignments_before_exam boolean not null default false;

update public.school_exams
set course_code=coalesce(course_code,'foundation_school'),
    exam_scope=coalesce(nullif(exam_scope,''),'lesson'),
    exam_weight=coalesce(exam_weight,70),
    assignment_weight=coalesce(assignment_weight,30),
    questions_per_attempt=coalesce(questions_per_attempt,0)
where course_code is null or exam_scope is null or exam_scope='' or exam_weight is null or assignment_weight is null or questions_per_attempt is null;

create index if not exists school_exams_course_idx on public.school_exams(course_code,exam_scope,is_active,sort_order);

-- Each official assignment is stored separately from personal notes.
create table if not exists public.school_assignments (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  user_name text default '',
  course_code text not null default 'foundation_school',
  lesson_code text not null,
  answer_text text not null default '',
  language text not null default 'en',
  status text not null default 'submitted',
  score_percent integer not null default 100,
  admin_feedback text default '',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_email,lesson_code)
);
create index if not exists school_assignments_user_idx on public.school_assignments(lower(user_email),course_code,updated_at desc);
create index if not exists school_assignments_status_idx on public.school_assignments(status,updated_at desc);

alter table public.school_assignments enable row level security;
drop policy if exists "school assignments own or admin read" on public.school_assignments;
create policy "school assignments own or admin read" on public.school_assignments for select to authenticated
using (
  lower(user_email)=lower(coalesce(auth.jwt()->>'email',''))
  or coalesce((select public.nh7_admin_is_admin_v170()),false)
);
drop policy if exists "school assignments admin all" on public.school_assignments;
create policy "school assignments admin all" on public.school_assignments for all to authenticated
using (coalesce((select public.nh7_admin_is_admin_v170()),false))
with check (coalesce((select public.nh7_admin_is_admin_v170()),false));

grant select on public.school_assignments to authenticated;
grant insert,update,delete on public.school_assignments to authenticated;

-- Students submit through this RPC so they cannot forge an approved status or grade.
create or replace function public.nh7_submit_school_assignment(
  p_course_code text,
  p_lesson_code text,
  p_answer_text text,
  p_language text default 'en',
  p_user_name text default ''
)
returns public.school_assignments
language plpgsql
security definer
set search_path=public
as $$
declare
  v_email text := lower(coalesce(auth.jwt()->>'email',''));
  v_row public.school_assignments;
begin
  if v_email='' then raise exception 'Login required'; end if;
  if length(trim(coalesce(p_answer_text,''))) < 10 then raise exception 'Assignment answer is too short'; end if;

  insert into public.school_assignments(
    user_email,user_name,course_code,lesson_code,answer_text,language,
    status,score_percent,admin_feedback,submitted_at,reviewed_at,updated_at
  ) values (
    v_email,coalesce(p_user_name,''),coalesce(nullif(p_course_code,''),'foundation_school'),
    p_lesson_code,trim(p_answer_text),coalesce(nullif(p_language,''),'en'),
    'submitted',100,'',now(),null,now()
  )
  on conflict(user_email,lesson_code) do update set
    user_name=excluded.user_name,
    course_code=excluded.course_code,
    answer_text=excluded.answer_text,
    language=excluded.language,
    status='submitted',
    score_percent=100,
    admin_feedback='',
    submitted_at=now(),
    reviewed_at=null,
    updated_at=now()
  returning * into v_row;

  return v_row;
end;
$$;
revoke all on function public.nh7_submit_school_assignment(text,text,text,text,text) from public;
grant execute on function public.nh7_submit_school_assignment(text,text,text,text,text) to authenticated;

-- Attempts preserve both component scores and the final weighted score.
create table if not exists public.school_exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.school_exams(id) on delete cascade,
  user_email text not null,
  user_name text default '',
  course_code text default '',
  lesson_code text default '',
  attempt_number integer not null default 1,
  correct_count integer not null default 0,
  total_questions integer not null default 0,
  score_percent integer not null default 0,
  passed boolean not null default false,
  answers jsonb not null default '[]'::jsonb,
  started_at timestamptz,
  submitted_at timestamptz not null default now(),
  duration_seconds integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.school_exam_attempts add column if not exists objective_score_percent integer not null default 0;
alter table public.school_exam_attempts add column if not exists assignment_score_percent integer not null default 0;
alter table public.school_exam_attempts add column if not exists final_score_percent integer not null default 0;
alter table public.school_exam_attempts add column if not exists assignment_completed_count integer not null default 0;
alter table public.school_exam_attempts add column if not exists assignment_total_count integer not null default 0;
create index if not exists school_exam_attempts_user_idx on public.school_exam_attempts(lower(user_email),submitted_at desc);
create index if not exists school_exam_attempts_exam_idx on public.school_exam_attempts(exam_id,submitted_at desc);

alter table public.school_exam_attempts enable row level security;
drop policy if exists "school exam attempts own read" on public.school_exam_attempts;
drop policy if exists "school exam attempts admin read" on public.school_exam_attempts;
drop policy if exists "school exam attempts own or admin read" on public.school_exam_attempts;
create policy "school exam attempts own or admin read" on public.school_exam_attempts for select to authenticated
using (
  lower(user_email)=lower(coalesce(auth.jwt()->>'email',''))
  or coalesce((select public.nh7_admin_is_admin_v170()),false)
);
drop policy if exists "school exam attempts own insert" on public.school_exam_attempts;
create policy "school exam attempts own insert" on public.school_exam_attempts for insert to authenticated
with check (lower(user_email)=lower(coalesce(auth.jwt()->>'email','')));
drop policy if exists "school exam attempts admin delete" on public.school_exam_attempts;
create policy "school exam attempts admin delete" on public.school_exam_attempts for delete to authenticated
using (coalesce((select public.nh7_admin_is_admin_v170()),false));
grant select,insert on public.school_exam_attempts to authenticated;
grant delete on public.school_exam_attempts to authenticated;

-- Preserve component scores in the student's course summary.
alter table public.school_progress add column if not exists objective_score_percent integer;
alter table public.school_progress add column if not exists assignment_score_percent integer;
alter table public.school_progress add column if not exists final_score_percent integer;

notify pgrst, 'reload schema';
select to_regclass('public.school_assignments') is not null as assignments_ready,
       to_regclass('public.school_exam_attempts') is not null as attempts_ready;
