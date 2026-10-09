-- New Hope 7 Production reliability / IO hardening.
-- 1) Support the Inbox receipt snapshot query by user_key + newest update.
-- 2) Support the legacy Admin Inbox top-100 newest-message query.
-- 3) Preserve the legacy v224 Library dashboard contract while excluding the
--    multi-megabyte reader_text payload that list/edit screens do not consume.
-- No user rows, Library reader bodies, Storage objects, grants, or progress data are changed.

create index if not exists notification_inbox_receipts_user_updated_v420_idx
  on public.notification_inbox_receipts (user_key, updated_at desc)
  include (message_id, read_at, deleted_at);

create index if not exists notification_inbox_delivered_v420_idx
  on public.notification_inbox (delivered_at desc);

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
    'items', coalesce((
      select jsonb_agg(
        (to_jsonb(i) - 'reader_text') || jsonb_build_object(
          'access_count', coalesce(a.access_count, 0::bigint),
          'last_accessed_at', a.last_accessed_at
        )
        order by i.resource_type, i.audience, i.sort_order, i.created_at desc
      )
      from public.nh7_library_items i
      left join access_stats a on a.item_id = i.id
    ), '[]'::jsonb),
    'codes', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.created_at desc)
      from (
        select id, label, is_active, expires_at, max_uses, use_count, created_at, updated_at
        from public.nh7_library_access_codes
      ) x
    ), '[]'::jsonb)
  )
  into v_result;

  return v_result;
end;
$function$;

-- Preserve the existing v224 execution boundary explicitly.
revoke execute on function public.nh7_admin_library_dashboard_v224() from public;
revoke execute on function public.nh7_admin_library_dashboard_v224() from anon;
grant execute on function public.nh7_admin_library_dashboard_v224() to authenticated;
grant execute on function public.nh7_admin_library_dashboard_v224() to service_role;
