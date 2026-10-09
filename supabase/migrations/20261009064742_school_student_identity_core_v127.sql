-- New Hope 7 — School Student Identity Core v127
-- Additive foundation only: Student Code allocation, existing-student backfill,
-- registration sync, caller-safe identity RPC, and owner-admin search RPC.
-- This migration intentionally does NOT alter School progress, assignments,
-- exam attempts, certificates, Storage, or credential-verification behavior.
--
-- Supabase CLI note (2026-10-09): local CLI 2.106.0 `migration new` was attempted
-- repeatedly but blocked during local profile initialization because the Mac has no
-- ~/.supabase/profile. No credential was guessed or created. The canonical 14-digit
-- UTC timestamp in this filename was generated from the system clock as a documented
-- fallback after the CLI diagnostic.

-- ---------------------------------------------------------------------------
-- 0. Fail-closed preflight against the live-compatible baseline
-- ---------------------------------------------------------------------------
do $preflight$
declare
  v_blank bigint;
  v_duplicate bigint;
  v_unmatched bigint;
begin
  if to_regnamespace('private') is null then
    raise exception 'private schema is required';
  end if;

  if to_regclass('public.school_student_identities') is not null
     or to_regclass('public.school_student_code_seq') is not null
     or to_regprocedure('public.nh7_my_student_identity_v127()') is not null
     or to_regprocedure('public.nh7_admin_student_identity_search_v127(text,integer)') is not null then
    raise exception 'school student identity v127 already exists or is partially applied';
  end if;

  select count(*) into v_blank
  from public.registrations r
  where r.type='school'
    and r.status='approved'
    and trim(coalesce(r.payload->>'email',r.payload->>'user_email',''))='';

  select count(*) into v_duplicate
  from (
    select lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email',''))) as email
    from public.registrations r
    where r.type='school' and r.status='approved'
    group by lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))
    having count(*)>1
  ) d;

  select count(*) into v_unmatched
  from public.registrations r
  where r.type='school'
    and r.status='approved'
    and trim(coalesce(r.payload->>'email',r.payload->>'user_email',''))<>''
    and not exists (
      select 1
      from auth.users u
      where lower(trim(u.email))=lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))
    );

  if v_blank<>0 or v_duplicate<>0 or v_unmatched<>0 then
    raise exception 'student identity preflight failed: blank=%, duplicate=%, unmatched_auth=%',
      v_blank,v_duplicate,v_unmatched;
  end if;
end
$preflight$;

-- ---------------------------------------------------------------------------
-- 1. Canonical Student Code allocator
-- ---------------------------------------------------------------------------
create sequence public.school_student_code_seq
  as bigint
  start with 1001
  increment by 1
  minvalue 1001
  no maxvalue
  cache 1;

revoke all on sequence public.school_student_code_seq from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Durable Student Identity
-- ---------------------------------------------------------------------------
create table public.school_student_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  student_code text not null unique
    default ('NH7-' || lpad(nextval('public.school_student_code_seq'::regclass)::text,4,'0')),
  source_registration_id uuid unique references public.registrations(id) on delete set null,
  registration_email text not null,
  display_name text,
  photo_path text,
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_student_code_format_v127
    check (student_code ~ '^NH7-[0-9]{4,}$'),
  constraint school_student_identity_email_v127
    check (length(trim(registration_email))>0)
);

create index school_student_identities_registration_email_idx_v127
  on public.school_student_identities (lower(registration_email));
create index school_student_identities_status_idx_v127
  on public.school_student_identities (status);

alter table public.school_student_identities enable row level security;
revoke all on table public.school_student_identities from public, anon, authenticated;

-- No anon/authenticated direct table policy is created. Client access is RPC-only.

-- ---------------------------------------------------------------------------
-- 3. Existing approved students — deterministic, idempotent initial allocation
-- ---------------------------------------------------------------------------
with source as (
  select
    r.id as registration_id,
    r.created_at,
    u.id as user_id,
    lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email',''))) as registration_email,
    nullif(trim(concat_ws(' ',r.payload->>'firstName',r.payload->>'lastName')),'') as display_name
  from public.registrations r
  join auth.users u
    on lower(trim(u.email))=lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))
  where r.type='school'
    and r.status='approved'
    and trim(coalesce(r.payload->>'email',r.payload->>'user_email',''))<>''
), ordered as (
  select * from source order by created_at,registration_id
)
insert into public.school_student_identities(
  user_id,source_registration_id,registration_email,display_name
)
select user_id,registration_id,registration_email,display_name
from ordered
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Student Code is immutable after allocation
-- ---------------------------------------------------------------------------
create or replace function private.nh7_student_identity_guard_v127()
returns trigger
language plpgsql
security definer
set search_path=''
as $function$
begin
  if new.student_code is distinct from old.student_code then
    raise exception 'student_code_is_immutable';
  end if;
  return new;
end;
$function$;

revoke all on function private.nh7_student_identity_guard_v127() from public, anon, authenticated;

create trigger nh7_student_identity_guard_v127
before update on public.school_student_identities
for each row execute function private.nh7_student_identity_guard_v127();

-- ---------------------------------------------------------------------------
-- 5. Approved registration sync — never rebind an existing code to another user
-- ---------------------------------------------------------------------------
create or replace function private.nh7_sync_student_identity_v127()
returns trigger
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_email text;
  v_user_id uuid;
  v_name text;
  v_identity_id uuid;
begin
  if new.type<>'school' or new.status<>'approved' then
    return new;
  end if;

  v_email:=lower(trim(coalesce(new.payload->>'email',new.payload->>'user_email','')));
  if v_email='' then
    return new;
  end if;

  select u.id into v_user_id
  from auth.users u
  where lower(trim(u.email))=v_email
  limit 1;

  -- Auth can arrive slightly after a registration change. In that race we do not
  -- allocate an unbound code; a later registration update/sync can create it safely.
  if v_user_id is null then
    return new;
  end if;

  v_name:=nullif(trim(concat_ws(' ',new.payload->>'firstName',new.payload->>'lastName')),'');

  -- If this registration already owns an identity, preserve that binding and code.
  select i.id into v_identity_id
  from public.school_student_identities i
  where i.source_registration_id=new.id
  limit 1;

  if v_identity_id is not null then
    update public.school_student_identities i
       set display_name=case
             when nullif(trim(coalesce(i.display_name,'')),'') is null then v_name
             else i.display_name
           end,
           updated_at=now()
     where i.id=v_identity_id;
    return new;
  end if;

  -- If this Auth user already has an identity, reuse it and attach the registration
  -- only when the identity did not already retain an earlier source registration.
  update public.school_student_identities i
     set source_registration_id=coalesce(i.source_registration_id,new.id),
         display_name=case
           when nullif(trim(coalesce(i.display_name,'')),'') is null then v_name
           else i.display_name
         end,
         updated_at=now()
   where i.user_id=v_user_id
   returning i.id into v_identity_id;

  if v_identity_id is not null then
    return new;
  end if;

  insert into public.school_student_identities(
    user_id,source_registration_id,registration_email,display_name
  ) values (
    v_user_id,new.id,v_email,v_name
  );

  return new;
end;
$function$;

revoke all on function private.nh7_sync_student_identity_v127() from public, anon, authenticated;

create trigger nh7_registration_student_identity_v127
after insert or update of status,payload,type on public.registrations
for each row execute function private.nh7_sync_student_identity_v127();

-- ---------------------------------------------------------------------------
-- 6. Caller-safe RPC — only the authenticated caller's own identity
-- ---------------------------------------------------------------------------
create or replace function public.nh7_my_student_identity_v127()
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $function$
declare
  v_uid uuid:=(select auth.uid());
  v_row public.school_student_identities;
begin
  if v_uid is null then
    raise exception 'login_required';
  end if;

  select i.* into v_row
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
      'photo_path',coalesce(v_row.photo_path,''),
      'has_photo',coalesce(v_row.photo_path,'')<>''
    )
  );
end;
$function$;

revoke all on function public.nh7_my_student_identity_v127() from public, anon, authenticated;
grant execute on function public.nh7_my_student_identity_v127() to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Owner-admin identity search — no photo path is returned
-- ---------------------------------------------------------------------------
create or replace function public.nh7_admin_student_identity_search_v127(
  p_query text default '',
  p_limit integer default 100
)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $function$
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
      select jsonb_agg(s.row_data order by s.sort_name,s.student_code)
      from (
        select
          coalesce(i.display_name,i.registration_email) as sort_name,
          i.student_code,
          jsonb_build_object(
            'student_code',i.student_code,
            'display_name',coalesce(i.display_name,''),
            'registration_email',i.registration_email,
            'current_email',coalesce(lower(u.email),i.registration_email),
            'user_id',i.user_id,
            'has_photo',coalesce(i.photo_path,'')<>'',
            'status',i.status,
            'created_at',i.created_at
          ) as row_data
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
$function$;

revoke all on function public.nh7_admin_student_identity_search_v127(text,integer) from public, anon, authenticated;
grant execute on function public.nh7_admin_student_identity_search_v127(text,integer) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Fail-closed postflight assertions
-- ---------------------------------------------------------------------------
do $postflight$
declare
  v_approved bigint;
  v_identities bigint;
  v_distinct_users bigint;
  v_distinct_codes bigint;
  v_bad_codes bigint;
begin
  select count(*) into v_approved
  from public.registrations r
  where r.type='school' and r.status='approved';

  select count(*),count(distinct user_id),count(distinct student_code),
         count(*) filter(where student_code !~ '^NH7-[0-9]{4,}$')
    into v_identities,v_distinct_users,v_distinct_codes,v_bad_codes
  from public.school_student_identities;

  if v_identities<>v_approved
     or v_distinct_users<>v_identities
     or v_distinct_codes<>v_identities
     or v_bad_codes<>0 then
    raise exception 'student identity postflight failed: approved=%, identities=%, users=%, codes=%, bad_codes=%',
      v_approved,v_identities,v_distinct_users,v_distinct_codes,v_bad_codes;
  end if;
end
$postflight$;

notify pgrst, 'reload schema';
