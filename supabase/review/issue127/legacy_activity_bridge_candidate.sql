-- New Hope 7 — Issue #127 legacy School activity bridge
-- REVIEW CANDIDATE ONLY. DO NOT APPLY DIRECTLY TO PRODUCTION.
-- Depends on student_identity_candidate.sql.
-- Purpose: preserve real historical School users that predate canonical registrations.

-- Read-only Production audit on 2026-10-07 found four Auth users with School
-- progress/assignment/exam history but no registration row of any type. None
-- matched the obvious test/qa/demo naming heuristic. They must not be orphaned
-- when School transitions from email identity to auth user_id.

-- 1) Add provenance so Admin can distinguish canonical registration identities
-- from identities recovered from real legacy School activity.
alter table public.school_student_identities
  add column if not exists identity_source text not null default 'approved_registration';

alter table public.school_student_identities
  drop constraint if exists school_student_identity_source_v127;
alter table public.school_student_identities
  add constraint school_student_identity_source_v127
  check (identity_source in ('approved_registration','legacy_activity','admin_created'));

-- Existing rows created from approved registrations retain the default source.

-- 2) Recover authenticated legacy students that have actual School activity but
-- no approved registration identity. This is idempotent by unique user_id.
with activity as (
  select lower(trim(user_email)) email,max(nullif(trim(user_name),'')) display_name
  from (
    select user_email,user_name from public.school_progress
    union all
    select user_email,user_name from public.school_assignments
    union all
    select user_email,user_name from public.school_exam_attempts
  ) x
  where coalesce(trim(user_email),'')<>''
  group by lower(trim(user_email))
), legacy as (
  select u.id user_id,a.email,a.display_name
  from activity a
  join auth.users u on lower(trim(u.email))=a.email
  where not exists(
    select 1 from public.school_student_identities i where i.user_id=u.id
  )
)
insert into public.school_student_identities(
  user_id,source_registration_id,registration_email,display_name,identity_source
)
select user_id,null,email,display_name,'legacy_activity'
from legacy
on conflict(user_id) do nothing;

-- 3) Backfill durable Auth user IDs directly from Auth email for every historical
-- activity row. This also covers legacy students even if identity review later
-- chooses to archive an identity. No email/history row is deleted or rewritten.
update public.school_progress p
set user_id=u.id
from auth.users u
where p.user_id is null
  and lower(trim(p.user_email))=lower(trim(u.email));

update public.school_assignments a
set user_id=u.id
from auth.users u
where a.user_id is null
  and lower(trim(a.user_email))=lower(trim(u.email));

update public.school_exam_attempts a
set user_id=u.id
from auth.users u
where a.user_id is null
  and lower(trim(a.user_email))=lower(trim(u.email));

-- Certificates can be student-linked or general ministry credentials. Bind only
-- when an identity exists; preserve the certificate's original user_email snapshot.
update public.school_certificates c
set recipient_user_id=i.user_id,
    student_code=coalesce(c.student_code,i.student_code)
from public.school_student_identities i
where (c.recipient_user_id is null or c.student_code is null)
  and lower(trim(c.user_email))=lower(trim(i.registration_email));

-- Deployment-time coverage checks.
select identity_source,count(*)::bigint
from public.school_student_identities
group by identity_source
order by identity_source;

select
  count(*) filter(where user_id is null)::bigint as progress_without_user_id
from public.school_progress;
select
  count(*) filter(where user_id is null)::bigint as assignments_without_user_id
from public.school_assignments;
select
  count(*) filter(where user_id is null)::bigint as exam_attempts_without_user_id
from public.school_exam_attempts;
