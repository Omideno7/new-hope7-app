-- New Hope 7 — School Access Identity Bridge v230
-- Wave 1F only: make stable Auth user_id / Student Identity the primary School approval key.
-- Current JWT email remains a legacy fallback for preapproved/unbound callers.
-- No table, row, RLS, Storage, certificate, or Student Code mutation occurs here.

-- ---------------------------------------------------------------------------
-- 0. Fail-closed preflight
-- ---------------------------------------------------------------------------
do $preflight$
declare
  v_def text;
  v_active bigint;
  v_valid_links bigint;
  v_dup bigint;
begin
  if to_regprocedure('public.nh7_school_access_approved_v230(uuid,text,text)') is null then
    raise exception 'nh7_school_access_approved_v230(uuid,text,text) is required';
  end if;
  if to_regclass('public.school_student_identities') is null then
    raise exception 'school_student_identities is required';
  end if;

  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='nh7_school_access_approved_v230'
  limit 1;

  if v_def not ilike '%registrations%'
     or v_def not ilike '%nh7_school_preapproved_v398%'
     or v_def ilike '%school_student_identities%' then
    raise exception 'School access approval baseline drifted or Wave 1F is partially applied';
  end if;

  if has_function_privilege('anon','public.nh7_school_access_approved_v230(uuid,text,text)','EXECUTE')
     or has_function_privilege('public','public.nh7_school_access_approved_v230(uuid,text,text)','EXECUTE')
     or not has_function_privilege('authenticated','public.nh7_school_access_approved_v230(uuid,text,text)','EXECUTE')
     or not has_function_privilege('service_role','public.nh7_school_access_approved_v230(uuid,text,text)','EXECUTE') then
    raise exception 'School access approval ACL baseline is unexpected';
  end if;

  select count(*) into v_active
  from public.school_student_identities i
  where i.status='active';

  select count(*) into v_valid_links
  from public.school_student_identities i
  join public.registrations r on r.id=i.source_registration_id
  where i.status='active'
    and lower(coalesce(r.type,''))='school'
    and lower(coalesce(r.status,''))='approved'
    and public.nh7_school_registration_payload_error_v351(
          lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email',''))),r.payload
        ) is null;

  select count(*) into v_dup
  from (
    select user_id from public.school_student_identities
    where status='active'
    group by user_id having count(*)>1
  ) d;

  if v_active=0 or v_valid_links<>v_active or v_dup<>0 then
    raise exception 'Student Identity approval baseline failed: active=%, valid_links=%, duplicate_users=%',
      v_active,v_valid_links,v_dup;
  end if;
end
$preflight$;

-- ---------------------------------------------------------------------------
-- 1. In-place access replacement — same function contract
-- ---------------------------------------------------------------------------
create or replace function public.nh7_school_access_approved_v230(
  p_user_id uuid default null,
  p_email text default '',
  p_device_id text default ''
)
returns boolean
language plpgsql
stable
security definer
set search_path=''
as $function$
declare
  v_jwt_role text:=coalesce((select auth.jwt())->>'role','anon');
  v_email text;
  v_user uuid;
begin
  if v_jwt_role not in ('service_role','authenticated') then
    return false;
  end if;

  if v_jwt_role='authenticated' then
    v_user:=(select auth.uid());
    v_email:=lower(trim(coalesce((select auth.jwt())->>'email','')));

    if v_user is null then
      return false;
    end if;
    if p_user_id is not null and p_user_id is distinct from v_user then
      return false;
    end if;
    if nullif(trim(coalesce(p_email,'')),'') is not null
       and lower(trim(p_email))<>v_email then
      return false;
    end if;
  else
    v_user:=p_user_id;
    v_email:=lower(trim(coalesce(p_email,'')));
  end if;

  -- Canonical path: durable Auth user_id -> active Student Identity -> approved
  -- source School registration. Account email changes do not break this path.
  if v_user is not null and exists(
    select 1
    from public.school_student_identities i
    join public.registrations r on r.id=i.source_registration_id
    where i.user_id=v_user
      and i.status='active'
      and lower(coalesce(r.type,''))='school'
      and lower(coalesce(r.status,''))='approved'
      and public.nh7_school_registration_payload_error_v351(
            lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email',''))),r.payload
          ) is null
  ) then
    return true;
  end if;

  -- Compatibility path for legacy/preapproved users that do not yet have a
  -- canonical Student Identity. This intentionally retains the old email rules.
  if v_email='' then
    return false;
  end if;

  if public.nh7_school_preapproved_v398(v_email) then
    return true;
  end if;

  return exists(
    select 1
    from public.registrations r
    where lower(coalesce(r.type,''))='school'
      and lower(coalesce(r.status,''))='approved'
      and lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))=v_email
      and public.nh7_school_registration_payload_error_v351(
            lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email',''))),r.payload
          ) is null
  );
end;
$function$;

revoke all on function public.nh7_school_access_approved_v230(uuid,text,text)
  from public, anon, authenticated, service_role;
grant execute on function public.nh7_school_access_approved_v230(uuid,text,text)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Fail-closed postflight
-- ---------------------------------------------------------------------------
do $postflight$
declare
  v_def text;
  v_config text[];
begin
  select pg_get_functiondef(p.oid),coalesce(p.proconfig,'{}'::text[])
    into v_def,v_config
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='nh7_school_access_approved_v230'
  limit 1;

  if v_def not ilike '%school_student_identities%'
     or v_def not ilike '%i.user_id=v_user%'
     or v_def not ilike '%nh7_school_preapproved_v398%'
     or v_def not ilike '%registrations%' then
    raise exception 'Wave 1F School access definition postflight failed';
  end if;

  if not ('search_path=""'=any(v_config)) then
    raise exception 'Wave 1F School access search_path is not pinned empty: %',v_config;
  end if;

  if has_function_privilege('anon','public.nh7_school_access_approved_v230(uuid,text,text)','EXECUTE')
     or has_function_privilege('public','public.nh7_school_access_approved_v230(uuid,text,text)','EXECUTE')
     or not has_function_privilege('authenticated','public.nh7_school_access_approved_v230(uuid,text,text)','EXECUTE')
     or not has_function_privilege('service_role','public.nh7_school_access_approved_v230(uuid,text,text)','EXECUTE') then
    raise exception 'Wave 1F School access ACL postflight failed';
  end if;
end
$postflight$;

notify pgrst, 'reload schema';
