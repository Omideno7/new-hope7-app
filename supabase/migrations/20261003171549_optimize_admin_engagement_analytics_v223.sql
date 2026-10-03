-- New Hope 7 — Admin engagement analytics optimization
-- Supabase migration history version: 20261003171549
-- Applied to Production on 2026-10-03 after read-only benchmarks and data-integrity checks.
-- This migration is idempotent and does not delete or rewrite user content.

-- Keeps the same function name/signature and output schema.
--
-- Read-only benchmarks against current Production data:
--   current function: ~3150 ms isolated RPC call
--   current full SQL body: ~2327 ms
--   optimized full SQL body: ~278 ms
-- The optimized body removes duplicate work while preserving the same metrics.
--
-- Main changes:
-- 1. Materialize the 30-day content slice once and reuse it.
-- 2. Aggregate app sections once and reuse that aggregation.
-- 3. Pre-deduplicate listener keys per source before UNION.
-- 4. Count rows from the already-unique listener set instead of DISTINCT twice.
--
-- No tables, data, indexes, RLS policies, grants, or client contracts are changed.

create or replace function public.nh7_admin_engagement_analytics_v223(
  p_from date default (current_date - 29),
  p_to date default current_date,
  p_category text default ''::text,
  p_language text default ''::text
)
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

  with
  audio_valid as materialized (
    select *,
      least(30,greatest(10,ceil(greatest(duration_seconds,1)*.10)))::int as threshold
    from public.nh7_audio_sessions
    where last_event_at>=coalesce(p_from,current_date-29)::timestamptz
      and last_event_at<(coalesce(p_to,current_date)+1)::timestamptz
      and (coalesce(p_language,'')='' or language=p_language)
      and listened_seconds>=least(30,greatest(10,ceil(greatest(duration_seconds,1)*.10)))::int
  ),
  content_valid as materialized (
    select
      content_type,
      content_id,
      title,
      listener_key,
      open_count,
      engaged_seconds,
      completion_count
    from public.nh7_content_activity_daily
    where activity_date>=coalesce(p_from,current_date-29)
      and activity_date<=coalesce(p_to,current_date)
      and (coalesce(p_language,'')='' or language=p_language)
  ),
  app_sections as materialized (
    select
      section,
      sum(open_count)::bigint as open_count,
      count(distinct listener_key)::bigint as unique_users
    from public.nh7_app_activity_daily
    where activity_date>=coalesce(p_from,current_date-29)
      and activity_date<=coalesce(p_to,current_date)
    group by section
  ),
  audio_items as (
    select
      media_type as category,
      media_id as content_id,
      max(title) as title,
      count(distinct listener_key)::bigint as unique_users,
      count(*)::bigint as open_count,
      sum(listened_seconds)::bigint as total_seconds,
      round(
        100.0*avg(
          case
            when duration_seconds>0
             and max_position_seconds>=duration_seconds*.90
             and listened_seconds*least(greatest(max_playback_rate,1),2)>=duration_seconds*.75
            then 1 else 0
          end
        ),
        1
      ) as completion_rate,
      sum(
        case
          when duration_seconds>0
           and max_position_seconds>=duration_seconds*.85
           and listened_seconds*least(greatest(max_playback_rate,1),2)<duration_seconds*.50
          then 1 else 0
        end
      )::bigint as skipped,
      count(*)::numeric as engagement_score
    from audio_valid
    group by media_type,media_id
  ),
  content_items as (
    select
      content_type as category,
      content_id,
      max(title) as title,
      count(distinct listener_key)::bigint as unique_users,
      sum(open_count)::bigint as open_count,
      sum(engaged_seconds)::bigint as total_seconds,
      case
        when sum(open_count)>0
        then round(100.0*sum(completion_count)/sum(open_count),1)
        else 0
      end as completion_rate,
      0::bigint as skipped,
      sum(open_count)::numeric as engagement_score
    from content_valid
    where content_type<>'library_pdf'
    group by content_type,content_id
  ),
  library_items as (
    select
      'library'::text as category,
      l.item_id::text as content_id,
      max(coalesce(i.title_fa,i.title_en,i.title_hr,i.file_name)) as title,
      count(
        distinct coalesce(
          nullif(lower(l.user_email),''),
          'device:'||coalesce(l.device_id,'')
        )
      )::bigint as unique_users,
      count(*)::bigint as open_count,
      0::bigint as total_seconds,
      0::numeric as completion_rate,
      0::bigint as skipped,
      count(*)::numeric as engagement_score
    from public.nh7_library_access_log l
    join public.nh7_library_items i on i.id=l.item_id
    where l.accessed_at>=coalesce(p_from,current_date-29)::timestamptz
      and l.accessed_at<(coalesce(p_to,current_date)+1)::timestamptz
    group by l.item_id
  ),
  section_items as (
    select
      'app_section'::text as category,
      section::text as content_id,
      section::text as title,
      unique_users,
      open_count,
      0::bigint as total_seconds,
      0::numeric as completion_rate,
      0::bigint as skipped,
      open_count::numeric as engagement_score
    from app_sections
  ),
  all_items_raw as (
    select * from audio_items
    union all
    select * from content_items
    union all
    select * from library_items
    union all
    select * from section_items
  ),
  all_items as (
    select
      category,
      content_id,
      max(title) as title,
      max(unique_users)::bigint as unique_users,
      sum(open_count)::bigint as open_count,
      sum(total_seconds)::bigint as total_seconds,
      max(completion_rate) as completion_rate,
      sum(skipped)::bigint as skipped,
      sum(engagement_score) as engagement_score
    from all_items_raw
    where coalesce(p_category,'')='' or category=p_category
    group by category,content_id
  ),
  total_score as (
    select greatest(1,coalesce(sum(engagement_score),0)) as score
    from all_items
  ),
  ranked_items as (
    select *,
      round(
        100.0*engagement_score/(select score from total_score),
        1
      ) as percent
    from all_items
    order by engagement_score desc,total_seconds desc
    limit 150
  ),
  categories as (
    select
      category,
      sum(unique_users)::bigint as unique_users,
      sum(open_count)::bigint as open_count,
      sum(total_seconds)::bigint as total_seconds,
      round(
        100.0*sum(engagement_score)/(select score from total_score),
        1
      ) as percent
    from all_items
    group by category
    order by sum(engagement_score) desc
  ),
  sections as (
    select *,
      round(
        100.0*open_count/greatest(1,sum(open_count) over()),
        1
      ) as percent
    from app_sections
    order by open_count desc
    limit 80
  ),
  listeners as (
    select distinct listener_key from audio_valid
    union
    select distinct listener_key from content_valid
  )
  select jsonb_build_object(
    'summary',jsonb_build_object(
      'unique_users',(select count(*) from listeners),
      'total_opens',coalesce((select sum(open_count) from all_items),0),
      'total_listened_seconds',coalesce((select sum(total_seconds) from audio_items),0),
      'likely_skipped_sessions',coalesce((select sum(skipped) from audio_items),0)
    ),
    'items',coalesce((select jsonb_agg(to_jsonb(x)) from ranked_items x),'[]'::jsonb),
    'categories',coalesce((select jsonb_agg(to_jsonb(x)) from categories x),'[]'::jsonb),
    'sections',coalesce((select jsonb_agg(to_jsonb(x)) from sections x),'[]'::jsonb)
  )
  into v_result;

  return v_result;
end;
$function$;
