do $nh7$
declare
  v_sql text;
  v_progress_fence text := 'and (v_last_failed is null or p.updated_at>v_last_failed)';
  v_assignment_fence text := 'and (v_last_failed is null or coalesce(a.reviewed_at,a.updated_at,a.submitted_at)>v_last_failed)';
  v_old_completion text := E'and not exists(\n          select 1 from public.school_progress p\n          where p.lesson_code=l.lesson_code\n            and (\n              p.user_id=v_uid\n              or (p.user_id is null and v_email<>\'\' and lower(trim(p.user_email))=v_email)\n            )\n            and (p.completed_at is not null or p.progress_percent>=100)\n        );';
  v_new_completion text := E'and not (\n          exists(\n            select 1 from public.school_progress p\n            where p.lesson_code=l.lesson_code\n              and (\n                p.user_id=v_uid\n                or (p.user_id is null and v_email<>\'\' and lower(trim(p.user_email))=v_email)\n              )\n              and (p.completed_at is not null or p.progress_percent>=100)\n          )\n          or (\n            v_course=\'foundation_school\'\n            and coalesce(v_exam.require_assignments_before_exam,false)=true\n            and exists(\n              select 1 from public.school_assignments a\n              where a.lesson_code=l.lesson_code\n                and (\n                  a.user_id=v_uid\n                  or (a.user_id is null and v_email<>\'\' and lower(trim(a.user_email))=v_email)\n                )\n                and lower(coalesce(a.status,\'\'))=\'approved\'\n            )\n          )\n        );';
begin
  select pg_get_functiondef(p.oid) into v_sql
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname='nh7_school_class_exam_session_v351'
    and pg_get_function_identity_arguments(p.oid)='p_class_key text';

  if v_sql is null then
    raise exception 'nh7_school_class_exam_session_v351 definition not found';
  end if;
  if (length(v_sql)-length(replace(v_sql,v_progress_fence,'')))/length(v_progress_fence) <> 1 then
    raise exception 'unexpected class progress repeat fence shape';
  end if;
  if (length(v_sql)-length(replace(v_sql,v_assignment_fence,'')))/length(v_assignment_fence) <> 1 then
    raise exception 'unexpected class assignment repeat fence shape';
  end if;
  if (length(v_sql)-length(replace(v_sql,'v351-hotfix1','')))/length('v351-hotfix1') <> 3 then
    raise exception 'unexpected class path version marker count';
  end if;

  v_sql := replace(v_sql,v_progress_fence,'');
  v_sql := replace(v_sql,v_assignment_fence,'');
  v_sql := replace(v_sql,'v351-hotfix1','v351-hotfix2');
  execute v_sql;

  select pg_get_functiondef(p.oid) into v_sql
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname='nh7_submit_school_exam_v340'
    and pg_get_function_identity_arguments(p.oid)='p_exam_id uuid, p_answers jsonb';

  if v_sql is null then
    raise exception 'nh7_submit_school_exam_v340 definition not found';
  end if;
  if (length(v_sql)-length(replace(v_sql,v_old_completion,'')))/length(v_old_completion) <> 1 then
    raise exception 'unexpected final completion guard shape';
  end if;

  v_sql := replace(v_sql,v_old_completion,v_new_completion);
  execute v_sql;

  revoke execute on function public.nh7_school_class_exam_session_v351(text) from public, anon;
  grant execute on function public.nh7_school_class_exam_session_v351(text) to authenticated, service_role;
  revoke execute on function public.nh7_submit_school_exam_v340(uuid,jsonb) from public, anon;
  grant execute on function public.nh7_submit_school_exam_v340(uuid,jsonb) to authenticated, service_role;
end
$nh7$;