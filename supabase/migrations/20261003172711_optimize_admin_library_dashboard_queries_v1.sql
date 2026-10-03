-- New Hope 7 — Library Admin dashboard query optimization
-- Supabase migration history version: 20261003172711
-- Applied to Production on 2026-10-03 after read-only equivalence checks.
-- Replaces correlated per-item access-log scans with one grouped aggregate.
-- No user data, RLS policy, grant, table, or index is changed.

-- Goal: preserve JSON output while replacing per-item correlated access-log scans
-- with one grouped pass over nh7_library_access_log.

create or replace function public.nh7_admin_library_dashboard_v222()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_result jsonb;
begin
  if not public.nh7_is_admin() then
    raise exception 'Admin access required';
  end if;

  with access_stats as (
    select
      item_id,
      count(*)::bigint as access_count,
      max(accessed_at) as last_accessed_at
    from public.nh7_library_access_log
    group by item_id
  )
  select jsonb_build_object(
    'items',coalesce((
      select jsonb_agg(to_jsonb(x))
      from (
        select
          i.*,
          coalesce(a.access_count,0::bigint) as access_count,
          a.last_accessed_at
        from public.nh7_library_items i
        left join access_stats a on a.item_id=i.id
        where i.is_active
        order by i.audience,i.sort_order,i.created_at desc
      ) x
    ),'[]'::jsonb),
    'codes',coalesce((
      select jsonb_agg(to_jsonb(x))
      from (
        select id,label,is_active,expires_at,max_uses,use_count,created_at,updated_at
        from public.nh7_library_access_codes
        order by created_at desc
      ) x
    ),'[]'::jsonb)
  )
  into v_result;

  return v_result;
end;
$function$;

create or replace function public.nh7_admin_library_dashboard_v224()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_result jsonb;
begin
  if not public.nh7_is_admin() then
    raise exception 'Admin access required';
  end if;

  with access_stats as (
    select
      item_id,
      count(*)::bigint as access_count,
      max(accessed_at) as last_accessed_at
    from public.nh7_library_access_log
    group by item_id
  )
  select jsonb_build_object(
    'items',coalesce((
      select jsonb_agg(to_jsonb(x))
      from (
        select
          i.*,
          coalesce(a.access_count,0::bigint) as access_count,
          a.last_accessed_at
        from public.nh7_library_items i
        left join access_stats a on a.item_id=i.id
        order by i.resource_type,i.audience,i.sort_order,i.created_at desc
      ) x
    ),'[]'::jsonb),
    'codes',coalesce((
      select jsonb_agg(to_jsonb(x))
      from (
        select id,label,is_active,expires_at,max_uses,use_count,created_at,updated_at
        from public.nh7_library_access_codes
        order by created_at desc
      ) x
    ),'[]'::jsonb)
  )
  into v_result;

  return v_result;
end;
$function$;

--
