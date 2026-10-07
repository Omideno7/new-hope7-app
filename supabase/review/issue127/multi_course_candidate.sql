-- New Hope 7 — Issue #127 / Multi-Course School foundation
-- REVIEW CANDIDATE ONLY. DO NOT APPLY DIRECTLY TO PRODUCTION.
-- Goal: preserve the current Foundation School while making Course/Stage/Lesson
-- relationships explicit enough for future 15+ lesson courses.

-- ---------------------------------------------------------------------------
-- 1. Make existing content/course relationships explicit
-- ---------------------------------------------------------------------------
alter table public.school_lessons
  add column if not exists course_code text;

update public.school_lessons l
set course_code=coalesce(
  nullif(trim(l.content_data#>>'{course,code}'),''),
  nullif(trim(l.content_data->>'course_code'),''),
  'foundation_school'
)
where coalesce(trim(l.course_code),'')='';

alter table public.school_progress
  add column if not exists course_code text;

update public.school_progress p
set course_code=coalesce(l.course_code,'foundation_school')
from public.school_lessons l
where p.course_code is null
  and l.lesson_code=p.lesson_code;

-- Legacy course-level progress rows use `course:<course_code>` rather than a
-- regular lesson record. Preserve those records explicitly.
update public.school_progress p
set course_code=substring(p.lesson_code from 8)
where p.course_code is null
  and p.lesson_code like 'course:%';

-- Assignment already has course_code; normalize only empty legacy values.
update public.school_assignments a
set course_code=coalesce(l.course_code,'foundation_school')
from public.school_lessons l
where coalesce(trim(a.course_code),'')=''
  and l.lesson_code=a.lesson_code;

-- Exam definitions/attempts already carry course_code but old rows may be empty.
update public.school_exams e
set course_code=l.course_code
from public.school_lessons l
where coalesce(trim(e.course_code),'')=''
  and e.exam_scope='lesson'
  and l.lesson_code=e.lesson_code;

update public.school_exam_attempts a
set course_code=e.course_code
from public.school_exams e
where coalesce(trim(a.course_code),'')=''
  and e.id=a.exam_id
  and coalesce(trim(e.course_code),'')<>'';

create index if not exists school_lessons_course_order_idx_v127
  on public.school_lessons(course_code,lesson_order) where is_active=true;
create index if not exists school_progress_user_course_idx_v127
  on public.school_progress(user_id,course_code,lesson_code);
create index if not exists school_assignments_user_course_idx_v127
  on public.school_assignments(user_id,course_code,lesson_code);
create index if not exists school_exam_attempts_user_course_idx_v127
  on public.school_exam_attempts(user_id,course_code,submitted_at desc);

-- Add FKs as NOT VALID for a staged compatibility migration; validate them only
-- after preflight proves there are no orphan course codes.
alter table public.school_lessons
  drop constraint if exists school_lessons_course_code_fkey_v127;
alter table public.school_lessons
  add constraint school_lessons_course_code_fkey_v127
  foreign key(course_code) references public.school_courses(course_code) not valid;

-- ---------------------------------------------------------------------------
-- 2. Course configuration: no Foundation behavior change by default
-- ---------------------------------------------------------------------------
alter table public.school_courses
  add column if not exists cover_url text,
  add column if not exists requires_manual_grant boolean not null default false,
  add column if not exists certificate_template_code text,
  add column if not exists settings jsonb not null default '{}'::jsonb;

-- Foundation stays open to approved School students exactly as today.
update public.school_courses
set requires_manual_grant=false
where course_code='foundation_school';

-- ---------------------------------------------------------------------------
-- 3. Generic stages: one stage may contain one or more lessons
-- ---------------------------------------------------------------------------
-- This preserves Foundation Class 4 (two lessons) without hard-coding a special
-- case and supports future courses where every stage has one lesson.
create table if not exists public.school_course_stages (
  id uuid primary key default gen_random_uuid(),
  course_code text not null references public.school_courses(course_code) on delete cascade,
  stage_code text not null,
  stage_order integer not null,
  title_fa text not null default '',
  title_en text not null default '',
  title_hr text not null default '',
  is_active boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_code,stage_code),
  unique(course_code,stage_order)
);

create table if not exists public.school_course_stage_lessons (
  course_code text not null,
  stage_code text not null,
  lesson_code text not null references public.school_lessons(lesson_code) on delete cascade,
  lesson_order integer not null default 1,
  created_at timestamptz not null default now(),
  primary key(course_code,stage_code,lesson_code),
  foreign key(course_code,stage_code)
    references public.school_course_stages(course_code,stage_code) on delete cascade
);

alter table public.school_course_stages enable row level security;
alter table public.school_course_stage_lessons enable row level security;
revoke all on public.school_course_stages from public,anon,authenticated;
revoke all on public.school_course_stage_lessons from public,anon,authenticated;

-- Idempotent Foundation mapping: seven learning stages, eight actual lessons.
insert into public.school_course_stages(course_code,stage_code,stage_order,title_fa,title_en,title_hr)
values
 ('foundation_school','class_01',1,'کلاس ۱','Class 1','Razred 1'),
 ('foundation_school','class_02',2,'کلاس ۲','Class 2','Razred 2'),
 ('foundation_school','class_03',3,'کلاس ۳','Class 3','Razred 3'),
 ('foundation_school','class_04',4,'کلاس ۴','Class 4','Razred 4'),
 ('foundation_school','class_05',5,'کلاس ۵','Class 5','Razred 5'),
 ('foundation_school','class_06',6,'کلاس ۶','Class 6','Razred 6'),
 ('foundation_school','class_07',7,'کلاس ۷','Class 7','Razred 7')
on conflict(course_code,stage_code) do nothing;

insert into public.school_course_stage_lessons(course_code,stage_code,lesson_code,lesson_order)
values
 ('foundation_school','class_01','class_01_new_creation',1),
 ('foundation_school','class_02','class_02_holy_spirit',1),
 ('foundation_school','class_03','class_03_christian_doctrine',1),
 ('foundation_school','class_04','class_04a_evangelism',1),
 ('foundation_school','class_04','class_04b_cell_ministry',2),
 ('foundation_school','class_05','class_05_character_prosperity',1),
 ('foundation_school','class_06','class_06_local_assembly',1),
 ('foundation_school','class_07','class_07_mobile_technology',1)
on conflict(course_code,stage_code,lesson_code) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Prerequisites + explicit ministry grants
-- ---------------------------------------------------------------------------
create table if not exists public.school_course_prerequisites (
  course_code text not null references public.school_courses(course_code) on delete cascade,
  prerequisite_course_code text not null references public.school_courses(course_code) on delete restrict,
  created_at timestamptz not null default now(),
  primary key(course_code,prerequisite_course_code),
  check(course_code<>prerequisite_course_code)
);

create table if not exists public.school_course_access_grants (
  id uuid primary key default gen_random_uuid(),
  course_code text not null references public.school_courses(course_code) on delete cascade,
  user_id uuid not null,
  status text not null default 'granted' check(status in ('granted','revoked')),
  granted_by uuid,
  reason text not null default '',
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(course_code,user_id)
);

create index if not exists school_course_access_grants_user_idx_v127
  on public.school_course_access_grants(user_id,course_code,status);

alter table public.school_course_prerequisites enable row level security;
alter table public.school_course_access_grants enable row level security;
revoke all on public.school_course_prerequisites from public,anon,authenticated;
revoke all on public.school_course_access_grants from public,anon,authenticated;

-- ---------------------------------------------------------------------------
-- 5. Server-side completion/access helpers
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;

create or replace function private.nh7_course_passed_v127(
  p_user_id uuid,
  p_course_code text
)
returns boolean
language plpgsql
stable
security definer
set search_path=public,auth,private
as $$
declare
  v_email text;
  v_course text:=trim(coalesce(p_course_code,''));
  v_passed boolean:=false;
begin
  if p_user_id is null or v_course='' then return false; end if;
  select lower(trim(u.email)) into v_email from auth.users u where u.id=p_user_id;
  if v_email is null then return false; end if;

  select exists(
    select 1
    from public.school_exam_attempts a
    join public.school_exams e on e.id=a.exam_id
    where e.exam_scope='course'
      and e.course_code=v_course
      and a.passed=true
      and (
        a.user_id=p_user_id
        or (a.user_id is null and lower(trim(a.user_email))=v_email)
      )
  ) or exists(
    select 1
    from public.school_progress p
    where p.course_code=v_course
      and p.lesson_code='course:'||v_course
      and coalesce(p.exam_passed,false)=true
      and (
        p.user_id=p_user_id
        or (p.user_id is null and lower(trim(p.user_email))=v_email)
      )
  ) into v_passed;

  return coalesce(v_passed,false);
end;
$$;
revoke all on function private.nh7_course_passed_v127(uuid,text) from public,anon,authenticated;

create or replace function private.nh7_course_access_state_v127(
  p_user_id uuid,
  p_course_code text
)
returns jsonb
language plpgsql
stable
security definer
set search_path=public,private,auth
as $$
declare
  v_course public.school_courses;
  v_email text;
  v_approved boolean:=false;
  v_prereq_total integer:=0;
  v_prereq_passed integer:=0;
  v_granted boolean:=false;
begin
  if p_user_id is null then return jsonb_build_object('can_open',false,'reason','login_required'); end if;
  select * into v_course from public.school_courses c
   where c.course_code=trim(coalesce(p_course_code,'')) limit 1;
  if not found or not v_course.is_active or v_course.publish_state<>'published' then
    return jsonb_build_object('can_open',false,'reason','course_unavailable');
  end if;

  select lower(trim(u.email)) into v_email from auth.users u where u.id=p_user_id;
  if v_email is null then return jsonb_build_object('can_open',false,'reason','account_missing'); end if;

  v_approved:=public.nh7_school_access_approved_v230(p_user_id,v_email,'');
  if not v_approved then return jsonb_build_object('can_open',false,'reason','school_approval_required'); end if;

  select count(*)::integer,
         count(*) filter(where private.nh7_course_passed_v127(p_user_id,p.prerequisite_course_code))::integer
  into v_prereq_total,v_prereq_passed
  from public.school_course_prerequisites p
  where p.course_code=v_course.course_code;

  if v_prereq_passed<v_prereq_total then
    return jsonb_build_object(
      'can_open',false,'reason','prerequisite_required',
      'prerequisites_total',v_prereq_total,
      'prerequisites_passed',v_prereq_passed,
      'manual_grant_required',v_course.requires_manual_grant
    );
  end if;

  if v_course.requires_manual_grant then
    select exists(
      select 1 from public.school_course_access_grants g
      where g.course_code=v_course.course_code
        and g.user_id=p_user_id
        and g.status='granted'
        and g.revoked_at is null
    ) into v_granted;
    if not v_granted then
      return jsonb_build_object(
        'can_open',false,'reason','ministry_grant_required',
        'prerequisites_total',v_prereq_total,
        'prerequisites_passed',v_prereq_passed,
        'manual_grant_required',true
      );
    end if;
  else
    v_granted:=true;
  end if;

  return jsonb_build_object(
    'can_open',true,'reason','ok',
    'prerequisites_total',v_prereq_total,
    'prerequisites_passed',v_prereq_passed,
    'manual_grant_required',v_course.requires_manual_grant,
    'manual_grant_ok',v_granted
  );
end;
$$;
revoke all on function private.nh7_course_access_state_v127(uuid,text) from public,anon,authenticated;

-- ---------------------------------------------------------------------------
-- 6. Caller-safe course catalog
-- ---------------------------------------------------------------------------
create or replace function public.nh7_my_school_courses_v127()
returns jsonb
language plpgsql
stable
security definer
set search_path=public,private
as $$
declare
  v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'login_required'; end if;

  return jsonb_build_object('ok',true,'courses',coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'course_code',c.course_code,
        'course_order',c.course_order,
        'title_fa',c.title_fa,'title_en',c.title_en,'title_hr',c.title_hr,
        'description_fa',c.description_fa,'description_en',c.description_en,'description_hr',c.description_hr,
        'cover_url',c.cover_url,
        'stage_count',(select count(*) from public.school_course_stages s where s.course_code=c.course_code and s.is_active),
        'lesson_count',(select count(*) from public.school_lessons l where l.course_code=c.course_code and l.is_active),
        'passed',private.nh7_course_passed_v127(v_uid,c.course_code),
        'access',private.nh7_course_access_state_v127(v_uid,c.course_code)
      ) order by c.course_order,c.course_code
    )
    from public.school_courses c
    where c.is_active=true and c.publish_state='published'
  ),'[]'::jsonb));
end;
$$;
revoke all on function public.nh7_my_school_courses_v127() from public,anon,authenticated;
grant execute on function public.nh7_my_school_courses_v127() to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Admin grant/revoke RPCs
-- ---------------------------------------------------------------------------
create or replace function public.nh7_admin_set_course_access_v127(
  p_user_id uuid,
  p_course_code text,
  p_granted boolean,
  p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_admin uuid:=auth.uid();
  v_course text:=trim(coalesce(p_course_code,''));
begin
  if not coalesce(public.nh7_is_admin(),false) then raise exception 'Admin access required'; end if;
  if p_user_id is null then raise exception 'user_id_required'; end if;
  if not exists(select 1 from public.school_courses c where c.course_code=v_course) then raise exception 'course_not_found'; end if;

  insert into public.school_course_access_grants(course_code,user_id,status,granted_by,reason,granted_at,revoked_at,updated_at)
  values(v_course,p_user_id,case when p_granted then 'granted' else 'revoked' end,v_admin,coalesce(p_reason,''),now(),case when p_granted then null else now() end,now())
  on conflict(course_code,user_id) do update set
    status=excluded.status,
    granted_by=excluded.granted_by,
    reason=excluded.reason,
    granted_at=case when excluded.status='granted' then now() else public.school_course_access_grants.granted_at end,
    revoked_at=case when excluded.status='revoked' then now() else null end,
    updated_at=now();

  return jsonb_build_object('ok',true,'user_id',p_user_id,'course_code',v_course,'granted',p_granted);
end;
$$;
revoke all on function public.nh7_admin_set_course_access_v127(uuid,text,boolean,text) from public,anon,authenticated;
grant execute on function public.nh7_admin_set_course_access_v127(uuid,text,boolean,text) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Example advanced-course configuration (DOCUMENTATION ONLY)
-- ---------------------------------------------------------------------------
-- Do not insert the real 15-class course until its title/content is supplied.
-- Intended sequence when Admin creates it later:
--   course.requires_manual_grant = true
--   prerequisite row: advanced_course -> foundation_school
--   15 ordered stage rows
--   one or more ordered lessons under each stage
-- Access opens only when BOTH Foundation is passed and Admin grant is active.

-- Deployment-time assertions should confirm all existing Foundation lessons and
-- activity rows resolve to `foundation_school` before validating FKs or switching
-- any runtime to the generic course engine.
