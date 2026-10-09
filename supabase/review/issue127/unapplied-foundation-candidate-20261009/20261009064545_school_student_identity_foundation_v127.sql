-- New Hope 7 — Student Identity Foundation v127
-- Backend foundation only. No Multi-course/Course Studio schema and no public credential verifier.
-- Existing School rows are preserved; compatibility columns are nullable and email columns remain.

DO $preflight$
DECLARE
  v_bad bigint;
BEGIN
  if to_regclass('public.school_student_identities') is not null
     or to_regclass('public.school_student_code_seq') is not null then
    raise exception 'student_identity_foundation_already_present';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema='public'
      and ((table_name='school_progress' and column_name='user_id')
        or (table_name='school_assignments' and column_name='user_id')
        or (table_name='school_exam_attempts' and column_name='user_id')
        or (table_name='school_certificates' and column_name in ('recipient_user_id','student_code')))
  ) then
    raise exception 'student_identity_partial_compatibility_columns_present';
  end if;

  if to_regprocedure('public.nh7_school_path_state_v351()') is null
     or to_regprocedure('public.nh7_admin_student_academic_center_v542(integer)') is null
     or to_regprocedure('public.nh7_admin_student_profile_v451(text)') is null
     or to_regprocedure('public.nh7_is_admin()') is null then
    raise exception 'student_identity_base_dependencies_missing';
  end if;

  if not exists (
    select 1 from storage.buckets
    where id='nh7-document-assets' and public=false
  ) then
    raise exception 'student_identity_private_image_bucket_missing';
  end if;

  select count(*) into v_bad
  from public.registrations r
  where r.type='school' and r.status='approved'
    and coalesce(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')),'')='';
  if v_bad<>0 then raise exception 'approved_school_registration_missing_email: %',v_bad; end if;

  with regs as (
    select lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email',''))) email
    from public.registrations r
    where r.type='school' and r.status='approved'
  )
  select count(*)-count(distinct email) into v_bad from regs;
  if v_bad<>0 then raise exception 'duplicate_approved_school_registration_email: %',v_bad; end if;

  select count(*) into v_bad
  from public.registrations r
  left join auth.users u
    on lower(trim(u.email))=lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))
  where r.type='school' and r.status='approved' and u.id is null;
  if v_bad<>0 then raise exception 'approved_school_registration_missing_auth: %',v_bad; end if;

  with regs as (
    select u.id user_id
    from public.registrations r
    join auth.users u
      on lower(trim(u.email))=lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))
    where r.type='school' and r.status='approved'
  ), dup as (
    select user_id from regs group by user_id having count(*)>1
  )
  select count(*) into v_bad from dup;
  if v_bad<>0 then raise exception 'duplicate_approved_school_auth_binding: %',v_bad; end if;

  with activity as (
    select lower(trim(user_email)) email from public.school_progress
    union
    select lower(trim(user_email)) from public.school_assignments
    union
    select lower(trim(user_email)) from public.school_exam_attempts
  )
  select count(*) into v_bad
  from activity a
  left join auth.users u on lower(trim(u.email))=a.email
  where coalesce(a.email,'')<>'' and u.id is null;
  if v_bad<>0 then raise exception 'school_activity_missing_auth: %',v_bad; end if;
END;
$preflight$;

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
  identity_source text not null default 'approved_registration',
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_student_code_format_v127
    check (student_code ~ '^NH7-[0-9]{4,}$'),
  constraint school_student_identity_source_v127
    check (identity_source in ('approved_registration','legacy_activity','admin_created'))
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
-- Current 2026-10-09 read-only preflight found 298 approved School registrations,
-- 298 distinct emails, 298 matching Auth users, and zero duplicate user bindings.
-- Re-run preflight immediately before apply.
with source as (
  select
    r.id as registration_id,
    r.created_at,
    u.id as user_id,
    lower(trim(u.email)) as auth_email,
    lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email',''))) as registration_email,
    nullif(trim(concat_ws(' ',r.payload->>'firstName',r.payload->>'lastName')),'') as display_name
  from public.registrations r
  join auth.users u
    on lower(trim(u.email))=lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))
  where r.type='school'
    and r.status='approved'
    and coalesce(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')),'')<>''
), ordered as (
  select * from source order by created_at, registration_id
)
insert into public.school_student_identities(
  user_id, source_registration_id, registration_email, display_name, identity_source
)
select user_id, registration_id, registration_email, display_name, 'approved_registration'
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

  v_email:=lower(trim(coalesce(new.payload->>'email',new.payload->>'user_email','')));
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
    user_id, source_registration_id, registration_email, display_name, identity_source
  ) values (
    v_user_id,new.id,v_email,v_name,'approved_registration'
  )
  on conflict(user_id) do update set
    source_registration_id=coalesce(public.school_student_identities.source_registration_id,excluded.source_registration_id),
    registration_email=case
      when public.school_student_identities.identity_source='legacy_activity' then excluded.registration_email
      else public.school_student_identities.registration_email
    end,
    display_name=coalesce(nullif(public.school_student_identities.display_name,''),excluded.display_name),
    identity_source='approved_registration',
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
left join auth.users u on u.id=i.user_id
where (c.recipient_user_id is null or c.student_code is null)
  and (
    lower(trim(c.user_email))=lower(trim(i.registration_email))
    or lower(trim(c.user_email))=lower(trim(coalesce(u.email,'')))
  );

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
order by user_id
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
left join auth.users u on u.id=i.user_id
where (c.recipient_user_id is null or c.student_code is null)
  and (
    lower(trim(c.user_email))=lower(trim(i.registration_email))
    or lower(trim(c.user_email))=lower(trim(coalesce(u.email,'')))
  );

create or replace function public.nh7_school_path_state_v352()
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_base jsonb;
  v_identity jsonb;
begin
  if auth.uid() is null then raise exception 'login_required'; end if;
  v_base:=coalesce(public.nh7_school_path_state_v351(),'{}'::jsonb);
  v_identity:=coalesce(public.nh7_my_student_identity_v127()->'student','null'::jsonb);
  return v_base || jsonb_build_object('student_identity',v_identity);
end;
$$;
revoke all on function public.nh7_school_path_state_v352() from public,anon,authenticated;
grant execute on function public.nh7_school_path_state_v352() to authenticated;

-- Preserve the current optimized batch Academic Center and inject Student Identity
-- into its rows server-side. This avoids one identity request per visible student.
create or replace function public.nh7_admin_student_academic_center_v543(
  p_inactive_days integer default 30
)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_base jsonb;
  v_rows jsonb;
begin
  if not coalesce(public.nh7_is_admin(),false) then
    raise exception 'Admin access required';
  end if;

  v_base:=coalesce(public.nh7_admin_student_academic_center_v542(p_inactive_days),'{}'::jsonb);

  select coalesce(jsonb_agg(
    r || jsonb_build_object(
      'student_code',i.student_code,
      'student_user_id',i.user_id,
      'student_has_photo',coalesce(i.photo_path,'')<>'',
      'student_identity_status',i.status
    )
  ),'[]'::jsonb)
  into v_rows
  from jsonb_array_elements(coalesce(v_base->'rows','[]'::jsonb)) r
  left join lateral (
    select i.*
    from public.school_student_identities i
    left join auth.users u on u.id=i.user_id
    where lower(trim(i.registration_email))=lower(trim(r->>'email'))
       or lower(trim(coalesce(u.email,'')))=lower(trim(r->>'email'))
    order by (lower(trim(coalesce(u.email,'')))=lower(trim(r->>'email'))) desc,
             i.created_at asc
    limit 1
  ) i on true;

  return jsonb_set(v_base,'{rows}',coalesce(v_rows,'[]'::jsonb),true)
         || jsonb_build_object('identity_version','127');
end;
$$;
revoke all on function public.nh7_admin_student_academic_center_v543(integer) from public,anon,authenticated;
grant execute on function public.nh7_admin_student_academic_center_v543(integer) to authenticated;

-- Add identity to one existing student profile without changing academic calculations.
create or replace function public.nh7_admin_student_profile_v452(p_email text)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_email text:=lower(trim(coalesce(p_email,'')));
  v_base jsonb;
  v_identity jsonb:='null'::jsonb;
begin
  if not coalesce(public.nh7_is_admin(),false) then
    raise exception 'Admin access required';
  end if;
  if v_email='' then raise exception 'email_required'; end if;

  v_base:=coalesce(public.nh7_admin_student_profile_v451(v_email),'{}'::jsonb);

  select jsonb_build_object(
    'student_code',i.student_code,
    'user_id',i.user_id,
    'registration_email',i.registration_email,
    'current_email',coalesce(lower(u.email),i.registration_email),
    'display_name',i.display_name,
    'photo_path',i.photo_path,
    'has_photo',coalesce(i.photo_path,'')<>'',
    'status',i.status
  )
  into v_identity
  from public.school_student_identities i
  left join auth.users u on u.id=i.user_id
  where lower(i.registration_email)=v_email
     or lower(coalesce(u.email,''))=v_email
  order by (lower(coalesce(u.email,''))=v_email) desc
  limit 1;

  return v_base || jsonb_build_object('student_identity',coalesce(v_identity,'null'::jsonb));
end;
$$;
revoke all on function public.nh7_admin_student_profile_v452(text) from public,anon,authenticated;
grant execute on function public.nh7_admin_student_profile_v452(text) to authenticated;

-- Compatibility design note:
-- The client may temporarily fall back from v352 -> v351 and v543 -> v542 while
-- staged backend deployment is being validated. No fallback may manufacture a
-- Student Code client-side; absence is shown as unavailable until server identity exists.

drop policy if exists "nh7 student photo select own v127" on storage.objects;
create policy "nh7 student photo select own v127"
on storage.objects for select to authenticated
using (
  bucket_id='nh7-document-assets'
  and (storage.foldername(name))[1]='student-photos'
  and (storage.foldername(name))[2]=(select auth.uid())::text
);

-- Caller may upload only under their own stable user-id folder.
drop policy if exists "nh7 student photo insert own v127" on storage.objects;
create policy "nh7 student photo insert own v127"
on storage.objects for insert to authenticated
with check (
  bucket_id='nh7-document-assets'
  and (storage.foldername(name))[1]='student-photos'
  and (storage.foldername(name))[2]=(select auth.uid())::text
);

-- Upsert/replace requires SELECT + INSERT + UPDATE in Supabase Storage.
drop policy if exists "nh7 student photo update own v127" on storage.objects;
create policy "nh7 student photo update own v127"
on storage.objects for update to authenticated
using (
  bucket_id='nh7-document-assets'
  and (storage.foldername(name))[1]='student-photos'
  and (storage.foldername(name))[2]=(select auth.uid())::text
)
with check (
  bucket_id='nh7-document-assets'
  and (storage.foldername(name))[1]='student-photos'
  and (storage.foldername(name))[2]=(select auth.uid())::text
);

drop policy if exists "nh7 student photo delete own v127" on storage.objects;
create policy "nh7 student photo delete own v127"
on storage.objects for delete to authenticated
using (
  bucket_id='nh7-document-assets'
  and (storage.foldername(name))[1]='student-photos'
  and (storage.foldername(name))[2]=(select auth.uid())::text
);

-- Store only an object path, never a public/signed URL, in Student Identity.
create or replace function public.nh7_set_my_student_photo_v127(p_photo_path text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_uid uuid:=auth.uid();
  v_path text:=trim(coalesce(p_photo_path,''));
  v_prefix text;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  v_prefix:='student-photos/'||v_uid::text||'/';

  if v_path<>'' and left(v_path,length(v_prefix))<>v_prefix then
    raise exception 'invalid_student_photo_path';
  end if;

  if not exists(
    select 1 from public.school_student_identities i
    where i.user_id=v_uid and i.status='active'
  ) then
    raise exception 'student_identity_required';
  end if;

  -- When setting a non-empty path, verify the object actually exists in the
  -- expected private bucket and belongs to this caller's folder.
  if v_path<>'' and not exists(
    select 1 from storage.objects o
    where o.bucket_id='nh7-document-assets' and o.name=v_path
  ) then
    raise exception 'student_photo_not_found';
  end if;

  update public.school_student_identities
  set photo_path=nullif(v_path,''),updated_at=now()
  where user_id=v_uid;

  return jsonb_build_object('ok',true,'has_photo',v_path<>'');
end;
$$;
revoke all on function public.nh7_set_my_student_photo_v127(text) from public,anon,authenticated;
grant execute on function public.nh7_set_my_student_photo_v127(text) to authenticated;

-- Own identity RPC v127 should expose only the caller's private path as needed
-- for authenticated rendering. The public certificate verifier never gets it.
create or replace function public.nh7_my_student_identity_v128()
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
  select * into v_row from public.school_student_identities i
  where i.user_id=v_uid and i.status='active' limit 1;
  if not found then return jsonb_build_object('ok',true,'student',null); end if;
  return jsonb_build_object('ok',true,'student',jsonb_build_object(
    'student_code',v_row.student_code,
    'display_name',v_row.display_name,
    'photo_path',v_row.photo_path,
    'has_photo',coalesce(v_row.photo_path,'')<>''
  ));
end;
$$;
revoke all on function public.nh7_my_student_identity_v128() from public,anon,authenticated;
grant execute on function public.nh7_my_student_identity_v128() to authenticated;

-- Public verification must never join/expose school_student_identities.photo_path.


-- Fail closed if any identity or compatibility invariant is incomplete.
DO $postflight$
DECLARE
  v_approved bigint;
  v_legacy bigint;
  v_identity bigint;
  v_unique_users bigint;
  v_unique_codes bigint;
  v_bad bigint;
BEGIN
  select count(*) into v_approved
  from public.registrations r
  where r.type='school' and r.status='approved';

  with approved as (
    select lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email',''))) email
    from public.registrations r
    where r.type='school' and r.status='approved'
  ), activity as (
    select lower(trim(user_email)) email from public.school_progress
    union
    select lower(trim(user_email)) from public.school_assignments
    union
    select lower(trim(user_email)) from public.school_exam_attempts
  )
  select count(*) into v_legacy
  from activity a
  join auth.users u on lower(trim(u.email))=a.email
  where coalesce(a.email,'')<>''
    and not exists(select 1 from approved r where r.email=a.email);

  select count(*),count(distinct user_id),count(distinct student_code)
    into v_identity,v_unique_users,v_unique_codes
  from public.school_student_identities;

  if v_identity<>v_approved+v_legacy
     or v_unique_users<>v_identity
     or v_unique_codes<>v_identity then
    raise exception 'student_identity_coverage_failed identities=% approved=% legacy=% users=% codes=%',
      v_identity,v_approved,v_legacy,v_unique_users,v_unique_codes;
  end if;

  select count(*) into v_bad from public.school_student_identities
  where identity_source='approved_registration';
  if v_bad<>v_approved then raise exception 'approved_identity_count_failed: % <> %',v_bad,v_approved; end if;

  select count(*) into v_bad from public.school_student_identities
  where identity_source='legacy_activity';
  if v_bad<>v_legacy then raise exception 'legacy_identity_count_failed: % <> %',v_bad,v_legacy; end if;

  select count(*) into v_bad from public.school_progress where user_id is null;
  if v_bad<>0 then raise exception 'progress_user_id_backfill_incomplete: %',v_bad; end if;
  select count(*) into v_bad from public.school_assignments where user_id is null;
  if v_bad<>0 then raise exception 'assignment_user_id_backfill_incomplete: %',v_bad; end if;
  select count(*) into v_bad from public.school_exam_attempts where user_id is null;
  if v_bad<>0 then raise exception 'exam_user_id_backfill_incomplete: %',v_bad; end if;

  select count(*) into v_bad
  from public.school_certificates c
  join auth.users u on lower(trim(u.email))=lower(trim(c.user_email))
  join public.school_student_identities i on i.user_id=u.id
  where c.recipient_user_id is null or c.student_code is null;
  if v_bad<>0 then raise exception 'student_certificate_identity_backfill_incomplete: %',v_bad; end if;

  if has_table_privilege('anon','public.school_student_identities','select')
     or has_table_privilege('authenticated','public.school_student_identities','select')
     or has_table_privilege('authenticated','public.school_student_identities','insert')
     or has_table_privilege('authenticated','public.school_student_identities','update') then
    raise exception 'student_identity_direct_table_privilege_exposed';
  end if;

  if has_function_privilege('anon','public.nh7_my_student_identity_v127()','execute')
     or not has_function_privilege('authenticated','public.nh7_my_student_identity_v127()','execute')
     or has_function_privilege('anon','public.nh7_my_student_identity_v128()','execute')
     or not has_function_privilege('authenticated','public.nh7_my_student_identity_v128()','execute')
     or has_function_privilege('anon','public.nh7_set_my_student_photo_v127(text)','execute')
     or not has_function_privilege('authenticated','public.nh7_set_my_student_photo_v127(text)','execute') then
    raise exception 'student_identity_rpc_acl_failed';
  end if;

  select count(*) into v_bad
  from pg_policies
  where schemaname='storage' and tablename='objects'
    and policyname in (
      'nh7 student photo select own v127',
      'nh7 student photo insert own v127',
      'nh7 student photo update own v127',
      'nh7 student photo delete own v127'
    );
  if v_bad<>4 then raise exception 'student_photo_policy_count_failed: %',v_bad; end if;

  if to_regprocedure('public.nh7_public_certificate_verify_v127(uuid)') is not null then
    raise exception 'public_certificate_verifier_out_of_scope';
  end if;
END;
$postflight$;

notify pgrst, 'reload schema';
