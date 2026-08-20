-- New Hope 7 v2.4.0.241 — fasting types and privacy-preserving plan analytics for admins.
-- This migration intentionally exposes progress totals only; private reflections,
-- fasting purposes, and Scripture notes remain visible only to their owner.

alter table public.fasting_journeys
  drop constraint if exists fasting_journeys_type_valid;

alter table public.fasting_journeys
  add constraint fasting_journeys_type_valid
  check (fasting_type in (
    'partial', 'daniel', 'sunrise', 'one_meal',
    'liquid', 'water', 'media', 'custom'
  )) not valid;

alter table public.fasting_journeys
  validate constraint fasting_journeys_type_valid;

create or replace function public.nh7_admin_spiritual_plan_activity_v241(p_email text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_result jsonb;
begin
  if not public.nh7_is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select u.id
    into v_user_id
  from auth.users as u
  where lower(trim(coalesce(u.email, ''))) = lower(trim(coalesce(p_email, '')))
  order by u.created_at asc
  limit 1;

  if v_user_id is null then
    return jsonb_build_object(
      'found', false,
      'summary', jsonb_build_object(
        'active_plans', 0,
        'completed_plans', 0,
        'completed_days', 0,
        'fasting_journeys', 0,
        'completed_fasts', 0,
        'prayer_minutes', 0,
        'last_activity_at', null
      ),
      'plans', '[]'::jsonb,
      'fasting', '[]'::jsonb
    );
  end if;

  with plan_rows as (
    select
      p.plan_id,
      min(p.started_at) as started_at,
      max(p.updated_at) as last_activity_at,
      count(*) filter (where p.status = 'completed')::integer as completed_days,
      case p.plan_id
        when 'prayer-30' then 30
        when 'grace-14' then 14
        when 'fasting-7' then 7
        when 'obedience-10' then 10
        when 'salvation-10' then 10
        when 'mind-renewal-14' then 14
        else greatest(max(p.day_number)::integer, 1)
      end as total_days,
      max(p.completed_at) filter (where p.status = 'completed') as latest_completed_day_at
    from public.spiritual_plan_progress as p
    where p.user_id = v_user_id
    group by p.plan_id
  ),
  plan_rollup as (
    select
      plan_id,
      started_at,
      last_activity_at,
      completed_days,
      total_days,
      completed_days >= total_days as completed,
      case when completed_days >= total_days then latest_completed_day_at else null end as completed_at
    from plan_rows
  ),
  fasting_rollup as (
    select
      j.id,
      j.fasting_type,
      j.start_date,
      j.end_date,
      j.status,
      j.completed_at,
      greatest(j.updated_at, max(l.updated_at)) as last_activity_at,
      count(l.id) filter (where l.completed)::integer as completed_days,
      coalesce(sum(l.prayer_minutes), 0)::integer as prayer_minutes
    from public.fasting_journeys as j
    left join public.fasting_daily_logs as l
      on l.journey_id = j.id
     and l.user_id = j.user_id
    where j.user_id = v_user_id
    group by j.id
  ),
  activity_times as (
    select last_activity_at as occurred_at from plan_rollup
    union all
    select last_activity_at as occurred_at from fasting_rollup
  )
  select jsonb_build_object(
    'found', true,
    'summary', jsonb_build_object(
      'active_plans', coalesce((select count(*) from plan_rollup where not completed), 0),
      'completed_plans', coalesce((select count(*) from plan_rollup where completed), 0),
      'completed_days', coalesce((select sum(completed_days) from plan_rollup), 0),
      'fasting_journeys', coalesce((select count(*) from fasting_rollup), 0),
      'completed_fasts', coalesce((select count(*) from fasting_rollup where status = 'completed'), 0),
      'prayer_minutes', coalesce((select sum(prayer_minutes) from fasting_rollup), 0),
      'last_activity_at', (select max(occurred_at) from activity_times)
    ),
    'plans', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'plan_id', plan_id,
          'started_at', started_at,
          'last_activity_at', last_activity_at,
          'completed_days', completed_days,
          'total_days', total_days,
          'completed', completed,
          'completed_at', completed_at,
          'percent', least(100, round((completed_days::numeric / nullif(total_days, 0)) * 100))::integer
        )
        order by last_activity_at desc
      )
      from plan_rollup
    ), '[]'::jsonb),
    'fasting', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', id,
          'fasting_type', fasting_type,
          'start_date', start_date,
          'end_date', end_date,
          'status', status,
          'completed_at', completed_at,
          'last_activity_at', last_activity_at,
          'completed_days', completed_days,
          'prayer_minutes', prayer_minutes
        )
        order by start_date desc, last_activity_at desc
      )
      from fasting_rollup
    ), '[]'::jsonb)
  )
  into v_result;

  return v_result;
end;
$$;

revoke all on function public.nh7_admin_spiritual_plan_activity_v241(text) from public;
revoke all on function public.nh7_admin_spiritual_plan_activity_v241(text) from anon;
grant execute on function public.nh7_admin_spiritual_plan_activity_v241(text) to authenticated;

comment on function public.nh7_admin_spiritual_plan_activity_v241(text) is
  'Admin-only aggregate spiritual-plan and fasting usage by account email. Private user text is excluded.';
