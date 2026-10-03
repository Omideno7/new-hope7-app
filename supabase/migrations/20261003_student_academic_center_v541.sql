-- New Hope 7 v5.4.1 — Student Academic Center app-activity enrichment
-- Read-only enrichment only. No new analytics are recorded.

create or replace function public.nh7_admin_student_academic_center_v541(
  p_inactive_days integer default 30
)
returns jsonb
language plpgsql
stable
security definer
set search_path=public,auth,pg_catalog
as $$
declare
  v_base jsonb;
  v_rows jsonb;
  v_summary jsonb;
begin
  if not coalesce(public.nh7_is_admin(),false) then
    raise exception 'Admin access required';
  end if;

  v_base:=public.nh7_admin_student_academic_center_v540(p_inactive_days);

  with activity as (
    select lower(trim(user_email)) email,
           max(last_opened_at) last_app_activity
    from public.nh7_app_activity_daily
    where coalesce(trim(user_email),'')<>''
    group by lower(trim(user_email))
  ),
  enriched as (
    select
      r,
      a.last_app_activity,
      (a.last_app_activity is not null) app_activity_seen,
      coalesce((r->>'app_account_exists')::boolean,false) app_account_exists,
      coalesce((r->>'school_registered')::boolean,false) school_registered,
      coalesce((r->>'in_church_roster')::boolean,false) in_church_roster
    from jsonb_array_elements(coalesce(v_base->'rows','[]'::jsonb)) r
    left join activity a on a.email=lower(trim(r->>'email'))
  )
  select
    coalesce(
      jsonb_agg(
        r || jsonb_build_object(
          'app_activity_seen',app_activity_seen,
          'last_app_activity',last_app_activity,
          'app_used_no_school',(app_activity_seen and not school_registered),
          'account_without_identified_activity',(app_account_exists and not app_activity_seen),
          'member_without_known_app',(in_church_roster and not app_account_exists and not app_activity_seen)
        )
        order by coalesce(r->>'display_name',r->>'email')
      ),
      '[]'::jsonb
    ),
    coalesce(v_base->'summary','{}'::jsonb) || jsonb_build_object(
      'app_activity_users',count(*) filter(where app_activity_seen),
      'app_used_no_school',count(*) filter(where app_activity_seen and not school_registered),
      'app_account_no_activity',count(*) filter(where app_account_exists and not app_activity_seen),
      'member_without_known_app',count(*) filter(where in_church_roster and not app_account_exists and not app_activity_seen)
    )
  into v_rows,v_summary
  from enriched;

  return jsonb_build_object(
    'summary',v_summary,
    'rows',v_rows,
    'generated_at',now(),
    'version','5.4.1'
  );
end;
$$;

revoke all on function public.nh7_admin_student_academic_center_v541(integer) from public,anon;
grant execute on function public.nh7_admin_student_academic_center_v541(integer) to authenticated;

notify pgrst,'reload schema';
