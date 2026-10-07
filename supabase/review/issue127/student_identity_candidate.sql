-- New Hope 7 — Issue #127 / Wave 1
-- REVIEW CANDIDATE ONLY. DO NOT APPLY TO PRODUCTION FROM THIS FILE.
-- When approved, generate a real migration using the Supabase CLI workflow.
-- Additive compatibility design: no progress/assignment/exam/certificate deletion.

-- ---------------------------------------------------------------------------
-- 0. Student-code sequence
-- ---------------------------------------------------------------------------
create sequence if not exists public.school_student_code_seq
  as bigint
  start with 1001
  increment by 1
  minvalue 1001
  no maxvalue
  cache 1;

revoke all on sequence public.school_student_code_seq from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 1. Durable Student Identity
-- ---------------------------------------------------------------------------
create table if not exists public.school_student_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  student_code text not null unique
    default ('NH7-' || lpad(nextval('public.school_student_code_seq')::text, 4, '0')),
  source_registration_id uuid unique references public.registrations(id) on delete set null,
  registration_email text not null,
  display_name text,
  photo_path text,
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_student_code_format_v127
    check (student_code ~ '^NH7-[0-9]{4,}$')
);

create index if not exists school_student_identities_registration_email_idx_v127
  on public.school_student_identities (lower(registration_email));
create index if not exists school_student_identities_status_idx_v127
  on public.school_student_identities (status);

alter table public.school_student_identities enable row level security;
revoke all on public.school_student_identities from public, anon, authenticated;

-- No direct table grants are required by the client. Access is through narrowly
-- scoped RPCs below. service_role/postgres retain server-side administration.

-- ---------------------------------------------------------------------------
-- 2. Existing-student idempotent backfill
-- ---------------------------------------------------------------------------
-- Current 2026-10-07 read-only preflight found 293 approved School registrations,
-- 293 distinct emails, and 293 matching Auth users. Re-run preflight before apply.
with source as (
  select
    r.id as registration_id,
    r.created_at,
    u.id as user_id,
    lower(trim(u.email)) as auth_email,
    lower(trim(r.payload->>'email')) as registration_email,
    nullif(trim(concat_ws(' ',r.payload->>'firstName',r.payload->>'lastName')),'') as display_name
  from public.registrations r
  join auth.users u
    on lower(trim(u.email))=lower(trim(r.payload->>'email'))
  where r.type='school'
    and r.status='approved'
    and coalesce(trim(r.payload->>'email'),'')<>''
), ordered as (
  select * from source order by created_at, registration_id
)
insert into public.school_student_identities(
  user_id, source_registration_id, registration_email, display_name
)
select user_id, registration_id, registration_email, display_name
from ordered
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- 3. New/updated approved registrations: create identity exactly once
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;

create or replace function private.nh7_sync_student_identity_v127()
returns trigger
language plpgsql
security definer
set search_path=public,private
as $$
declare
  v_email text;
  v_user_id uuid;
  v_name text;
begin
  if new.type<>'school' or new.status<>'approved' then
    return new;
  end if;

  v_email:=lower(trim(coalesce(new.payload->>'email','')));
  if v_email='' then return new; end if;

  select u.id into v_user_id
  from auth.users u
  where lower(trim(u.email))=v_email
  limit 1;

  if v_user_id is null then
    -- Auth may not be visible yet during a race; no code is allocated without
    -- a stable user identity. A later sync/backfill safely catches the row.
    return new;
  end if;

  v_name:=nullif(trim(concat_ws(' ',new.payload->>'firstName',new.payload->>'lastName')),'');

  insert into public.school_student_identities(
    user_id, source_registration_id, registration_email, display_name
  ) values (
    v_user_id,new.id,v_email,v_name
  )
  on conflict(user_id) do update set
    source_registration_id=coalesce(public.school_student_identities.source_registration_id,excluded.source_registration_id),
    display_name=coalesce(nullif(public.school_student_identities.display_name,''),excluded.display_name),
    updated_at=now();

  return new;
end;
$$;

revoke all on function private.nh7_sync_student_identity_v127() from public, anon, authenticated;

drop trigger if exists nh7_registration_student_identity_v127 on public.registrations;
create trigger nh7_registration_student_identity_v127
after insert or update of status,payload,type on public.registrations
for each row execute function private.nh7_sync_student_identity_v127();

-- ---------------------------------------------------------------------------
-- 4. Caller-safe RPC
-- ---------------------------------------------------------------------------
create or replace function public.nh7_my_student_identity_v127()
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_uid uuid:=auth.uid();
  v_row public.school_student_identities;
begin
  if v_uid is null then raise exception 'login_required'; end if;

  select * into v_row
  from public.school_student_identities i
  where i.user_id=v_uid
    and i.status='active'
  limit 1;

  if not found then
    return jsonb_build_object('ok',true,'student',null);
  end if;

  return jsonb_build_object(
    'ok',true,
    'student',jsonb_build_object(
      'student_code',v_row.student_code,
      'display_name',v_row.display_name,
      'has_photo',coalesce(v_row.photo_path,'')<>''
    )
  );
end;
$$;

revoke all on function public.nh7_my_student_identity_v127() from public, anon, authenticated;
grant execute on function public.nh7_my_student_identity_v127() to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Admin identity search
-- ---------------------------------------------------------------------------
create or replace function public.nh7_admin_student_identity_search_v127(
  p_query text default '',
  p_limit integer default 100
)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_q text:=lower(trim(coalesce(p_query,'')));
  v_limit integer:=greatest(1,least(coalesce(p_limit,100),250));
begin
  if not coalesce(public.nh7_is_admin(),false) then
    raise exception 'Admin access required';
  end if;

  return jsonb_build_object(
    'ok',true,
    'rows',coalesce((
      select jsonb_agg(x order by x->>'display_name',x->>'registration_email')
      from (
        select jsonb_build_object(
          'student_code',i.student_code,
          'display_name',coalesce(i.display_name,''),
          'registration_email',i.registration_email,
          'current_email',coalesce(lower(u.email),i.registration_email),
          'user_id',i.user_id,
          'has_photo',coalesce(i.photo_path,'')<>'',
          'status',i.status,
          'created_at',i.created_at
        ) x
        from public.school_student_identities i
        left join auth.users u on u.id=i.user_id
        where v_q=''
           or lower(i.student_code) like '%'||v_q||'%'
           or lower(coalesce(i.display_name,'')) like '%'||v_q||'%'
           or lower(i.registration_email) like '%'||v_q||'%'
           or lower(coalesce(u.email,'')) like '%'||v_q||'%'
        order by coalesce(i.display_name,i.registration_email),i.student_code
        limit v_limit
      ) s
    ),'[]'::jsonb)
  );
end;
$$;

revoke all on function public.nh7_admin_student_identity_search_v127(text,integer) from public, anon, authenticated;
grant execute on function public.nh7_admin_student_identity_search_v127(text,integer) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Compatibility user_id columns: nullable first, no old data removed
-- ---------------------------------------------------------------------------
alter table public.school_progress add column if not exists user_id uuid;
alter table public.school_assignments add column if not exists user_id uuid;
alter table public.school_exam_attempts add column if not exists user_id uuid;
alter table public.school_certificates add column if not exists recipient_user_id uuid;
alter table public.school_certificates add column if not exists student_code text;

create index if not exists school_progress_user_id_idx_v127 on public.school_progress(user_id);
create index if not exists school_assignments_user_id_idx_v127 on public.school_assignments(user_id);
create index if not exists school_exam_attempts_user_id_idx_v127 on public.school_exam_attempts(user_id);
create index if not exists school_certificates_recipient_user_id_idx_v127 on public.school_certificates(recipient_user_id);
create index if not exists school_certificates_student_code_idx_v127 on public.school_certificates(student_code);

-- Backfill user references from the authoritative identity map; email columns remain.
update public.school_progress p
set user_id=i.user_id
from public.school_student_identities i
where p.user_id is null
  and lower(trim(p.user_email))=lower(trim(i.registration_email));

update public.school_assignments a
set user_id=i.user_id
from public.school_student_identities i
where a.user_id is null
  and lower(trim(a.user_email))=lower(trim(i.registration_email));

update public.school_exam_attempts a
set user_id=i.user_id
from public.school_student_identities i
where a.user_id is null
  and lower(trim(a.user_email))=lower(trim(i.registration_email));

update public.school_certificates c
set recipient_user_id=i.user_id,
    student_code=coalesce(c.student_code,i.student_code)
from public.school_student_identities i
where lower(trim(c.user_email))=lower(trim(i.registration_email))
  and (c.recipient_user_id is null or c.student_code is null);

-- ---------------------------------------------------------------------------
-- 7. Privacy-minimal public credential verifier
-- ---------------------------------------------------------------------------
-- Intentionally does NOT return recipient name, Student Code, email, user_id,
-- photo, score, body text, assignments/exams, PDF/storage paths or admin notes.
create or replace function public.nh7_public_certificate_verify_v127(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path=public
as $$
  select case
    when c.id is null then jsonb_build_object(
      'ok',true,
      'verification_status','not_found'
    )
    else jsonb_build_object(
      'ok',true,
      'verification_status',case
        when c.revoked_at is not null or lower(coalesce(c.status,''))='revoked' then 'revoked'
        when lower(coalesce(c.status,''))='replaced' then 'replaced'
        when lower(coalesce(c.status,'')) in ('approved','issued','active') then 'valid'
        else 'not_active'
      end,
      'certificate_number',c.certificate_number,
      'certificate_type',c.certificate_type,
      'issue_date',coalesce(c.issue_date,c.approved_at::date,c.created_at::date),
      'issuer',coalesce(nullif(c.church_info->>'name',''),'New Hope 7'),
      'document_version',c.document_version
    )
  end
  from (select 1) seed
  left join public.school_certificates c on c.public_token=p_token
  limit 1
$$;

revoke all on function public.nh7_public_certificate_verify_v127(uuid) from public, anon, authenticated;
grant execute on function public.nh7_public_certificate_verify_v127(uuid) to anon, authenticated;

-- IMPORTANT: Do not retire `nh7_public_certificate_lookup` until the public
-- verification page is switched to v127 and regression-tested. After cutover,
-- the legacy lookup must be restricted/replaced because it currently returns PII.

-- ---------------------------------------------------------------------------
-- 8. Deployment-time assertions (run before COMMIT in a staged migration)
-- ---------------------------------------------------------------------------
-- Expected after current backfill: all approved School/Auth users have identity.
-- These are SELECT-only assertions for review; the final migration should fail
-- closed if coverage differs unexpectedly.

select
  (select count(*) from public.registrations r where r.type='school' and r.status='approved') as approved_school_registrations,
  (select count(*) from public.school_student_identities) as student_identities,
  (select count(distinct user_id) from public.school_student_identities where user_id is not null) as distinct_identity_users,
  (select count(distinct student_code) from public.school_student_identities) as distinct_student_codes;

select
  count(*) filter (where user_id is null) as progress_without_user_id
from public.school_progress;

select
  count(*) filter (where user_id is null) as assignments_without_user_id
from public.school_assignments;

select
  count(*) filter (where user_id is null) as exam_attempts_without_user_id
from public.school_exam_attempts;
