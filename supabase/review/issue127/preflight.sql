-- New Hope 7 — Issue #127 Production preflight
-- READ ONLY. Safe to run before migration review/deployment.

-- 1) Registration/Auth coverage and duplicates.
with r as (
  select
    id,
    status,
    lower(nullif(trim(coalesce(payload->>'email',payload->>'user_email','')),'')) as email
  from public.registrations
  where type='school'
)
select
  count(*) as school_registrations,
  count(*) filter (where status='approved') as approved_registrations,
  count(distinct email) as distinct_emails,
  count(*)-count(distinct email) as duplicate_email_rows,
  count(*) filter (where u.id is not null) as matched_auth_users,
  count(*) filter (where u.id is null) as unmatched_auth_users
from r
left join auth.users u on lower(u.email)=r.email;

-- 2) Existing School row-count preservation baseline.
select 'school_progress' as object,count(*)::bigint as rows from public.school_progress
union all select 'school_assignments',count(*) from public.school_assignments
union all select 'school_exam_attempts',count(*) from public.school_exam_attempts
union all select 'school_certificates',count(*) from public.school_certificates
order by object;

-- 3) Detect email identities referenced by School activity but absent from approved registration/Auth mapping.
with identities as (
  select distinct lower(trim(u.email)) email
  from public.registrations r
  join auth.users u on lower(trim(u.email))=lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))
  where r.type='school' and r.status='approved'
), activity as (
  select lower(trim(user_email)) email from public.school_progress
  union
  select lower(trim(user_email)) from public.school_assignments
  union
  select lower(trim(user_email)) from public.school_exam_attempts
  union
  select lower(trim(user_email)) from public.school_certificates
)
select count(*) as activity_emails_without_approved_identity
from activity a
where coalesce(a.email,'')<>''
  and not exists(select 1 from identities i where i.email=a.email);

-- 4) Existing certificate public-token integrity.
select
  count(*) as certificate_rows,
  count(*) filter (where public_token is null) as missing_public_token,
  count(*)-count(distinct public_token) filter (where public_token is not null) as duplicate_public_token_rows,
  count(*) filter (where certificate_number is null or trim(certificate_number)='') as missing_certificate_number
from public.school_certificates;

-- 5) Current public verifier signature; review its projection before cutover.
select
  p.proname,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname in ('nh7_public_certificate_lookup','nh7_public_certificate_verify_v127');
