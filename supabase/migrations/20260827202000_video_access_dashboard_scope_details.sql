create or replace function public.nh7_admin_school_media_dashboard_v260()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_result jsonb;
begin
  if not public.nh7_is_admin() then raise exception 'Admin access required'; end if;

  select jsonb_build_object(
    'videos',coalesce((
      select jsonb_agg(to_jsonb(v) order by v.sort_order,v.created_at desc)
      from public.nh7_school_videos_v260 v where v.is_active
    ),'[]'::jsonb),
    'codes',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',c.id,
        'label',c.label,
        'video_id',c.video_id,
        'video_ids',case
          when exists(select 1 from public.nh7_school_video_code_items_v392 i where i.code_id=c.id)
            then coalesce((select jsonb_agg(i.video_id order by i.created_at) from public.nh7_school_video_code_items_v392 i where i.code_id=c.id),'[]'::jsonb)
          when c.video_id is not null then jsonb_build_array(c.video_id)
          else '[]'::jsonb
        end,
        'video_count',case
          when exists(select 1 from public.nh7_school_video_code_items_v392 i where i.code_id=c.id)
            then (select count(*) from public.nh7_school_video_code_items_v392 i where i.code_id=c.id)
          when c.video_id is not null then 1
          else 0
        end,
        'scope_mode',case
          when exists(select 1 from public.nh7_school_video_code_items_v392 i where i.code_id=c.id) then 'selected'
          when c.video_id is not null then 'single'
          else 'all'
        end,
        'is_active',c.is_active,
        'expires_at',c.expires_at,
        'use_count',c.use_count,
        'created_at',c.created_at,
        'updated_at',c.updated_at,
        'target_email',c.target_email,
        'target_name',c.target_name,
        'bound_user_email',g.user_email,
        'bound_device_id',g.device_id,
        'granted_at',g.granted_at,
        'last_used_at',g.last_used_at,
        'grant_revoked_at',g.revoked_at
      ) order by c.created_at desc)
      from public.nh7_school_video_codes_v260 c
      left join public.nh7_school_video_grants_v260 g on g.code_id=c.id
    ),'[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$function$;

revoke all on function public.nh7_admin_school_media_dashboard_v260() from public, anon;
grant execute on function public.nh7_admin_school_media_dashboard_v260() to authenticated;
