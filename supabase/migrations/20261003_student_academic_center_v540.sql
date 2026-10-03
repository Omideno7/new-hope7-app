-- New Hope 7 v5.4.0 — Student Academic Center
-- Additive and low-cost: one small admin-only member registry + aggregate read RPCs.
-- No existing school/user rows are modified or deleted.

create extension if not exists pgcrypto;

create table if not exists public.church_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null default '',
  email text not null default '',
  email_normalized text generated always as (nullif(lower(trim(email)),'')) stored,
  phone text not null default '',
  member_status text not null default 'active'
    check (member_status in ('active','inactive','visitor','left')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(email_normalized)
);

create index if not exists church_members_status_idx
  on public.church_members(member_status, updated_at desc);

alter table public.church_members enable row level security;

drop policy if exists "church members admin read" on public.church_members;
create policy "church members admin read"
on public.church_members for select to authenticated
using (coalesce((select public.nh7_is_admin()),false));

drop policy if exists "church members admin manage" on public.church_members;
create policy "church members admin manage"
on public.church_members for all to authenticated
using (coalesce((select public.nh7_is_admin()),false))
with check (coalesce((select public.nh7_is_admin()),false));

grant select,insert,update,delete on public.church_members to authenticated;

create or replace function public.nh7_admin_upsert_church_members_v540(p_members jsonb)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  v_item jsonb;
  v_email text;
  v_count integer:=0;
begin
  if not coalesce(public.nh7_is_admin(),false) then
    raise exception 'Admin access required';
  end if;
  if jsonb_typeof(coalesce(p_members,'[]'::jsonb))<>'array' then
    raise exception 'Members must be a JSON array';
  end if;

  for v_item in select value from jsonb_array_elements(coalesce(p_members,'[]'::jsonb))
  loop
    v_email:=lower(trim(coalesce(v_item->>'email','')));
    if v_email='' then
      continue;
    end if;
    insert into public.church_members(full_name,email,phone,member_status,notes,updated_at)
    values(
      trim(coalesce(v_item->>'full_name',v_item->>'name','')),
      v_email,
      trim(coalesce(v_item->>'phone','')),
      case lower(trim(coalesce(v_item->>'member_status','active')))
        when 'inactive' then 'inactive'
        when 'visitor' then 'visitor'
        when 'left' then 'left'
        else 'active'
      end,
      trim(coalesce(v_item->>'notes','')),
      now()
    )
    on conflict(email_normalized) do update set
      full_name=case when excluded.full_name<>'' then excluded.full_name else church_members.full_name end,
      email=excluded.email,
      phone=case when excluded.phone<>'' then excluded.phone else church_members.phone end,
      member_status=excluded.member_status,
      notes=case when excluded.notes<>'' then excluded.notes else church_members.notes end,
      updated_at=now();
    v_count:=v_count+1;
  end loop;
  return jsonb_build_object('ok',true,'processed',v_count);
end;
$$;

revoke all on function public.nh7_admin_upsert_church_members_v540(jsonb) from public,anon;
grant execute on function public.nh7_admin_upsert_church_members_v540(jsonb) to authenticated;

create or replace function public.nh7_admin_delete_church_member_v540(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
begin
  if not coalesce(public.nh7_is_admin(),false) then
    raise exception 'Admin access required';
  end if;
  delete from public.church_members where id=p_id;
  return found;
end;
$$;

revoke all on function public.nh7_admin_delete_church_member_v540(uuid) from public,anon;
grant execute on function public.nh7_admin_delete_church_member_v540(uuid) to authenticated;

create or replace function public.nh7_admin_student_academic_center_v540(
  p_inactive_days integer default 30
)
returns jsonb
language plpgsql
stable
security definer
set search_path=public,auth,pg_catalog
as $$
declare
  v_days integer:=greatest(1,least(coalesce(p_inactive_days,30),365));
  v_rows jsonb;
  v_summary jsonb;
begin
  if not coalesce(public.nh7_is_admin(),false) then
    raise exception 'Admin access required';
  end if;

  with
  lesson_total as (
    select count(*)::integer total_lessons
    from public.school_lessons
    where is_active is true and coalesce(publish_state,'published')='published'
  ),
  school_reg as (
    select distinct on (lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email',''))))
      lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email',''))) email,
      r.id registration_id,
      r.created_at registered_at,
      r.language registration_language,
      coalesce(
        nullif(trim(coalesce(r.payload->>'fullName',r.payload->>'full_name',r.payload->>'name','')),''),
        nullif(trim(concat_ws(' ',r.payload->>'firstName',r.payload->>'lastName')),'')
      ) registration_name
    from public.registrations r
    where lower(trim(coalesce(r.type,'')))='school'
      and lower(trim(coalesce(r.status,''))) in ('approved','active')
      and lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))<>'' 
    order by lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email',''))),
             r.updated_at desc nulls last,r.created_at desc
  ),
  progress_agg as (
    select lower(trim(user_email)) email,
      count(*)::integer progress_rows,
      count(*) filter(where completed_at is not null or coalesce(progress_percent,0)>=100)::integer completed_lessons,
      max(updated_at) progress_last_at,
      max(coalesce(final_score_percent,exam_score)) best_progress_score
    from public.school_progress
    where coalesce(trim(user_email),'')<>''
    group by lower(trim(user_email))
  ),
  assignment_agg as (
    select lower(trim(user_email)) email,
      count(*)::integer assignment_rows,
      count(*) filter(where status='approved')::integer approved_assignments,
      count(*) filter(where status='needs_revision')::integer revision_assignments,
      count(*) filter(where status='submitted')::integer pending_assignments,
      round(avg(score_percent)::numeric,1) assignment_average,
      max(updated_at) assignment_last_at
    from public.school_assignments
    where coalesce(trim(user_email),'')<>''
    group by lower(trim(user_email))
  ),
  attempt_agg as (
    select lower(trim(user_email)) email,
      count(*)::integer exam_attempts,
      count(*) filter(where passed is true)::integer passed_attempts,
      count(*) filter(where passed is false)::integer failed_attempts,
      max(coalesce(final_score_percent,score_percent))::integer best_final_score,
      max(submitted_at) exam_last_at
    from public.school_exam_attempts
    where coalesce(trim(user_email),'')<>''
    group by lower(trim(user_email))
  ),
  accounts as (
    select lower(trim(u.email)) email,
      u.id user_id,u.created_at auth_created_at,u.last_sign_in_at,
      coalesce(
        nullif(trim(coalesce(u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name','')),''),
        lower(trim(u.email))
      ) auth_name,
      (
        lower(coalesce(u.email,'')) ~ '(^|[+._-])(test|qa|demo|dummy|sample)([+._@-]|$)'
        or lower(coalesce(u.raw_user_meta_data->>'is_test','false'))='true'
        or lower(coalesce(u.raw_app_meta_data->>'is_test','false'))='true'
      ) is_test
    from auth.users u
    where u.deleted_at is null and coalesce(trim(u.email),'')<>''
  ),
  roster as (
    select id member_id,email_normalized email,full_name member_name,phone,member_status
    from public.church_members
    where member_status in ('active','visitor')
      and email_normalized is not null
  ),
  identities as (
    select email from accounts
    union select email from school_reg
    union select email from roster
  ),
  base as (
    select i.email,
      a.user_id,
      r.member_id,
      coalesce(nullif(r.member_name,''),nullif(s.registration_name,''),nullif(a.auth_name,''),i.email) display_name,
      coalesce(r.phone,'') phone,
      coalesce(r.member_status,'') member_status,
      (r.member_id is not null) in_church_roster,
      (a.user_id is not null) app_account_exists,
      a.auth_created_at,
      a.last_sign_in_at,
      coalesce(a.is_test,false) is_test,
      (s.registration_id is not null) school_registered,
      s.registered_at,
      s.registration_language,
      coalesce(p.progress_rows,0) progress_rows,
      least((select total_lessons from lesson_total),coalesce(p.completed_lessons,0))::integer completed_lessons,
      greatest(0,(select total_lessons from lesson_total)-least((select total_lessons from lesson_total),coalesce(p.completed_lessons,0)))::integer remaining_lessons,
      (select total_lessons from lesson_total)::integer total_lessons,
      case when (select total_lessons from lesson_total)>0
        then round(100.0*least((select total_lessons from lesson_total),coalesce(p.completed_lessons,0))/(select total_lessons from lesson_total),1)
        else 0 end progress_percent,
      coalesce(g.assignment_rows,0) assignment_rows,
      coalesce(g.approved_assignments,0) approved_assignments,
      coalesce(g.revision_assignments,0) revision_assignments,
      coalesce(g.pending_assignments,0) pending_assignments,
      g.assignment_average,
      coalesce(e.exam_attempts,0) exam_attempts,
      coalesce(e.passed_attempts,0) passed_attempts,
      coalesce(e.failed_attempts,0) failed_attempts,
      e.best_final_score,
      nullif(greatest(
        coalesce(p.progress_last_at,'-infinity'::timestamptz),
        coalesce(g.assignment_last_at,'-infinity'::timestamptz),
        coalesce(e.exam_last_at,'-infinity'::timestamptz)
      ),'-infinity'::timestamptz) last_school_activity
    from identities i
    left join accounts a using(email)
    left join school_reg s using(email)
    left join roster r using(email)
    left join progress_agg p using(email)
    left join assignment_agg g using(email)
    left join attempt_agg e using(email)
  ),
  classified as (
    select b.*,
      (coalesce(b.progress_rows,0)>0 or coalesce(b.assignment_rows,0)>0 or coalesce(b.exam_attempts,0)>0) started_school,
      case when b.last_school_activity is null then null
           else floor(extract(epoch from (now()-b.last_school_activity))/86400)::integer end days_since_activity,
      case
        when b.in_church_roster and not b.app_account_exists then 'member_no_app'
        when b.app_account_exists and not b.school_registered then 'app_no_school'
        when b.school_registered
             and not (coalesce(b.progress_rows,0)>0 or coalesce(b.assignment_rows,0)>0 or coalesce(b.exam_attempts,0)>0)
          then 'registered_never_started'
        when b.revision_assignments>0 then 'needs_revision'
        when b.exam_attempts>0 and b.passed_attempts=0 then 'exam_failed'
        when b.total_lessons>0 and b.completed_lessons>=b.total_lessons and b.passed_attempts>0 then 'completed'
        when b.passed_attempts>0 then 'passed'
        when b.last_school_activity is not null
             and b.last_school_activity < now()-make_interval(days=>v_days)
          then 'inactive'
        when b.school_registered then 'in_progress'
        else 'known_user'
      end status_code
    from base b
  )
  select
    coalesce(jsonb_agg(to_jsonb(c) order by c.display_name,c.email),'[]'::jsonb),
    jsonb_build_object(
      'known_identities',count(*),
      'app_accounts',count(*) filter(where app_account_exists),
      'school_registered',count(*) filter(where school_registered),
      'app_without_school',count(*) filter(where app_account_exists and not school_registered),
      'church_roster',count(*) filter(where in_church_roster),
      'roster_without_app',count(*) filter(where in_church_roster and not app_account_exists),
      'registered_never_started',count(*) filter(where status_code='registered_never_started'),
      'in_progress',count(*) filter(where status_code='in_progress'),
      'needs_revision',count(*) filter(where status_code='needs_revision'),
      'exam_failed',count(*) filter(where status_code='exam_failed'),
      'passed',count(*) filter(where status_code in ('passed','completed')),
      'completed',count(*) filter(where status_code='completed'),
      'inactive',count(*) filter(where status_code='inactive'),
      'pending_assignment_students',count(*) filter(where pending_assignments>0),
      'active_lessons',(select total_lessons from lesson_total),
      'inactive_days',v_days
    )
  into v_rows,v_summary
  from classified c;

  return jsonb_build_object(
    'summary',coalesce(v_summary,'{}'::jsonb),
    'rows',coalesce(v_rows,'[]'::jsonb),
    'generated_at',now(),
    'version','5.4.0'
  );
end;
$$;

revoke all on function public.nh7_admin_student_academic_center_v540(integer) from public,anon;
grant execute on function public.nh7_admin_student_academic_center_v540(integer) to authenticated;

notify pgrst,'reload schema';
