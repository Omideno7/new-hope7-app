-- New Hope 7 — exact rollback for Library dashboard query proposal
-- Restores the Production function bodies observed before the proposal.

CREATE OR REPLACE FUNCTION public.nh7_admin_library_dashboard_v222()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_result jsonb;
begin
  if not public.nh7_is_admin() then raise exception 'Admin access required'; end if;
  select jsonb_build_object(
    'items',coalesce((select jsonb_agg(to_jsonb(x)) from (
      select i.*,coalesce((select count(*) from public.nh7_library_access_log l where l.item_id=i.id),0) access_count,
        (select max(accessed_at) from public.nh7_library_access_log l where l.item_id=i.id) last_accessed_at
      from public.nh7_library_items i where i.is_active order by i.audience,i.sort_order,i.created_at desc
    ) x),'[]'::jsonb),
    'codes',coalesce((select jsonb_agg(to_jsonb(x)) from (
      select id,label,is_active,expires_at,max_uses,use_count,created_at,updated_at
      from public.nh7_library_access_codes order by created_at desc
    ) x),'[]'::jsonb)
  ) into v_result;
  return v_result;
end;$function$;

CREATE OR REPLACE FUNCTION public.nh7_admin_library_dashboard_v224()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_result jsonb;
begin
  if not public.nh7_is_admin() then raise exception 'Admin access required'; end if;
  select jsonb_build_object(
    'items',coalesce((select jsonb_agg(to_jsonb(x)) from (
      select i.*,coalesce((select count(*) from public.nh7_library_access_log l where l.item_id=i.id),0) access_count,
        (select max(accessed_at) from public.nh7_library_access_log l where l.item_id=i.id) last_accessed_at
      from public.nh7_library_items i
      order by i.resource_type,i.audience,i.sort_order,i.created_at desc
    ) x),'[]'::jsonb),
    'codes',coalesce((select jsonb_agg(to_jsonb(x)) from (
      select id,label,is_active,expires_at,max_uses,use_count,created_at,updated_at
      from public.nh7_library_access_codes order by created_at desc
    ) x),'[]'::jsonb)
  ) into v_result;
  return v_result;
end;$function$;
