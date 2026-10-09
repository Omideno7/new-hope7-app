CREATE OR REPLACE FUNCTION public.nh7_admin_student_academic_center_v542(p_inactive_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_catalog'
AS $function$
declare
  v_days integer:=greatest(1,least(coalesce(p_inactive_days,30),365));
  v_base jsonb;
  v_status jsonb;
  v_rows jsonb;
begin
  if not coalesce(public.nh7_is_admin(),false) then
    raise exception 'Admin access required';
  end if;

  v_base:=public.nh7_admin_student_academic_center_v541(v_days);
  v_status:=public.nh7_admin_student_exam_status_v543();

  with b as (
    select r,lower(trim(r->>'email')) email
    from jsonb_array_elements(coalesce(v_base->'rows','[]'::jsonb)) r
  ),
  s as (
    select r,lower(trim(r->>'email')) email
    from jsonb_array_elements(coalesce(v_status->'rows','[]'::jsonb)) r
  ),
  m as (
    select b.r || coalesce(s.r,'{}'::jsonb) merged
    from b left join s using(email)
  ),
  c as (
    select merged,
      case
        when coalesce((merged->>'graduated')::boolean,false) then 'graduated'
        when coalesce((merged->>'course_completed')::boolean,false) then 'completed'
        when coalesce((merged->>'in_church_roster')::boolean,false)
             and not coalesce((merged->>'app_account_exists')::boolean,false)
             and not coalesce((merged->>'app_activity_seen')::boolean,false) then 'member_no_app'
        when coalesce((merged->>'app_account_exists')::boolean,false)
             and not coalesce((merged->>'school_registered')::boolean,false) then 'app_no_school'
        when coalesce((merged->>'school_registered')::boolean,false)
             and not coalesce((merged->>'started_school')::boolean,false) then 'registered_never_started'
        when coalesce(nullif(merged->>'revision_assignments','')::integer,0)>0 then 'needs_revision'
        when coalesce(nullif(merged->>'final_exam_attempts','')::integer,0)>0
             and not coalesce((merged->>'final_exam_passed')::boolean,false) then 'final_exam_failed'
        when coalesce(nullif(merged->>'unresolved_failed_class_exams','')::integer,0)>0 then 'class_exam_failed'
        when coalesce((merged->>'school_registered')::boolean,false)
             and coalesce(nullif(merged->>'days_since_activity','')::integer,-1)>=v_days then 'inactive'
        when coalesce((merged->>'school_registered')::boolean,false) then 'in_progress'
        else 'known_user'
      end academic_status_code
    from m
  )
  select coalesce(jsonb_agg(
    merged || jsonb_build_object('academic_status_code',academic_status_code)
    order by coalesce(merged->>'display_name',merged->>'email')
  ),'[]'::jsonb)
  into v_rows
  from c;

  return jsonb_build_object(
    'summary',coalesce(v_base->'summary','{}'::jsonb),
    'rows',v_rows,
    'generated_at',now(),
    'version','5.4.3-hotfix'
  );
end;
$function$;
notify pgrst,'reload schema';
