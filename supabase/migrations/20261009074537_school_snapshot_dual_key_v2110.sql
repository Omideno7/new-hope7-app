-- New Hope 7 — School Snapshot Dual-Key v2110
-- Wave 1E only: harden the active my-school snapshot RPC so durable Auth user_id
-- is the primary identity key, with legacy email fallback only for unbound rows.
-- The JSON contract remains exactly: { progress: [...], assignments: [...] }.

-- ---------------------------------------------------------------------------
-- 0. Fail-closed preflight against the known legacy snapshot implementation
-- ---------------------------------------------------------------------------
do $preflight$
declare
  v_def text;
  v_null_ids bigint;
begin
  if to_regprocedure('public.nh7_get_my_school_snapshot_v2110()') is null then
    raise exception 'nh7_get_my_school_snapshot_v2110() is required';
  end if;

  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='nh7_get_my_school_snapshot_v2110'
  limit 1;

  if v_def not ilike '%school_progress%'
     or v_def not ilike '%school_assignments%'
     or v_def not ilike '%user_email%'
     or v_def ilike '%p.user_id%'
     or v_def ilike '%a.user_id%' then
    raise exception 'snapshot RPC baseline drifted or Wave 1E is partially applied';
  end if;

  if has_function_privilege('anon','public.nh7_get_my_school_snapshot_v2110()','EXECUTE')
     or has_function_privilege('public','public.nh7_get_my_school_snapshot_v2110()','EXECUTE')
     or not has_function_privilege('authenticated','public.nh7_get_my_school_snapshot_v2110()','EXECUTE') then
    raise exception 'snapshot RPC ACL baseline is unexpected';
  end if;

  select count(*) into v_null_ids
  from (
    select user_id from public.school_progress
    union all select user_id from public.school_assignments
  ) x
  where user_id is null;

  if v_null_ids<>0 then
    raise exception 'Wave 1E expected current progress/assignment rows to be bound; null user_id rows=%',v_null_ids;
  end if;
end
$preflight$;

-- ---------------------------------------------------------------------------
-- 1. In-place RPC replacement — same name, arguments, return type, JSON shape
-- ---------------------------------------------------------------------------
create or replace function public.nh7_get_my_school_snapshot_v2110()
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_uid uuid:=(select auth.uid());
  v_email text:=lower(trim(coalesce((select auth.jwt())->>'email','')));
  v_progress jsonb;
  v_assignments jsonb;
begin
  if v_uid is null then
    raise exception 'Login required';
  end if;

  select coalesce(jsonb_agg(to_jsonb(p) order by p.updated_at desc),'[]'::jsonb)
  into v_progress
  from public.school_progress p
  where p.user_id=v_uid
     or (
       p.user_id is null
       and v_email<>''
       and lower(trim(p.user_email))=v_email
     );

  select coalesce(jsonb_agg(to_jsonb(a) order by a.updated_at desc),'[]'::jsonb)
  into v_assignments
  from public.school_assignments a
  where a.user_id=v_uid
     or (
       a.user_id is null
       and v_email<>''
       and lower(trim(a.user_email))=v_email
     );

  return jsonb_build_object(
    'progress',coalesce(v_progress,'[]'::jsonb),
    'assignments',coalesce(v_assignments,'[]'::jsonb)
  );
end;
$function$;

revoke all on function public.nh7_get_my_school_snapshot_v2110()
  from public, anon, authenticated;
grant execute on function public.nh7_get_my_school_snapshot_v2110()
  to authenticated;

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
  where n.nspname='public' and p.proname='nh7_get_my_school_snapshot_v2110'
  limit 1;

  if v_def not ilike '%p.user_id=v_uid%'
     or v_def not ilike '%a.user_id=v_uid%'
     or v_def not ilike '%p.user_id is null%'
     or v_def not ilike '%a.user_id is null%'
     or v_def not ilike '%jsonb_build_object(%progress%'
     or v_def not ilike '%assignments%' then
    raise exception 'Wave 1E snapshot definition postflight failed';
  end if;

  if not ('search_path=""'=any(v_config)) then
    raise exception 'Wave 1E snapshot search_path is not pinned empty: %',v_config;
  end if;

  if has_function_privilege('anon','public.nh7_get_my_school_snapshot_v2110()','EXECUTE')
     or has_function_privilege('public','public.nh7_get_my_school_snapshot_v2110()','EXECUTE')
     or not has_function_privilege('authenticated','public.nh7_get_my_school_snapshot_v2110()','EXECUTE') then
    raise exception 'Wave 1E snapshot ACL postflight failed';
  end if;
end
$postflight$;

notify pgrst, 'reload schema';
