-- Preserve deployed report bodies rather than reconstruct unknown live definitions.
-- Only School fields of cycle-managed students are overlaid. No extra client requests.
create function private.nh7_school_report_v580(p_uid uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare s jsonb; attempts jsonb; progress jsonb; assignments jsonb; counts jsonb; last_activity timestamptz; unresolved integer;
begin
 s:=private.nh7_school_summary_v580(p_uid,'foundation_school');
 select coalesce(jsonb_agg(to_jsonb(x) order by x.updated_at desc),'[]') into progress from private.nh7_school_progress_active_v580 x where private.nh7_school_activity_owner_v580(x.user_id,x.user_email)=p_uid;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.updated_at desc),'[]') into assignments from private.nh7_school_assignments_active_v580 x where private.nh7_school_activity_owner_v580(x.user_id,x.user_email)=p_uid;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.submitted_at desc),'[]') into attempts from private.nh7_school_attempts_active_v580 x where private.nh7_school_activity_owner_v580(x.user_id,x.user_email)=p_uid;
 select jsonb_build_object('progress_rows',count(*),'completed_lessons',count(*) filter(where p.completed_at is not null or p.progress_percent>=100)) into counts from private.nh7_school_progress_active_v580 p where private.nh7_school_activity_owner_v580(p.user_id,p.user_email)=p_uid and p.lesson_code not like 'course:%';
 select counts||jsonb_build_object('assignment_rows',count(*),'approved_assignments',count(*) filter(where status='approved'),'revision_assignments',count(*) filter(where status='needs_revision'),'pending_assignments',count(*) filter(where status='submitted'),'assignment_average',avg(score_percent)) into counts from private.nh7_school_assignments_active_v580 where private.nh7_school_activity_owner_v580(user_id,user_email)=p_uid;
 select counts||jsonb_build_object('exam_attempts',count(*),'passed_attempts',count(*) filter(where passed),'failed_attempts',count(*) filter(where not passed),'best_final_score',max(final_score_percent),'final_exam_attempts',count(*) filter(where lesson_code='course:foundation_school')) into counts from private.nh7_school_attempts_active_v580 where private.nh7_school_activity_owner_v580(user_id,user_email)=p_uid;
 select max(t) into last_activity from (select updated_at t from private.nh7_school_progress_active_v580 where private.nh7_school_activity_owner_v580(user_id,user_email)=p_uid union all select updated_at from private.nh7_school_assignments_active_v580 where private.nh7_school_activity_owner_v580(user_id,user_email)=p_uid union all select submitted_at from private.nh7_school_attempts_active_v580 where private.nh7_school_activity_owner_v580(user_id,user_email)=p_uid) x;
 select count(*) into unresolved from public.school_exams e where e.exam_scope='class' and e.course_code='foundation_school' and exists(select 1 from private.nh7_school_attempts_active_v580 x where private.nh7_school_activity_owner_v580(x.user_id,x.user_email)=p_uid and x.exam_id=e.id and not x.passed) and not exists(select 1 from private.nh7_school_attempts_active_v580 x where private.nh7_school_activity_owner_v580(x.user_id,x.user_email)=p_uid and x.exam_id=e.id and x.passed);
 counts:=counts||jsonb_build_object('last_school_activity',last_activity,'days_since_activity',case when last_activity is not null then floor(extract(epoch from(now()-last_activity))/86400)::integer else null end,'unresolved_failed_class_exams',unresolved);
 return jsonb_build_object('progress',progress,'assignments',assignments,'attempts',attempts,'summary',counts,'cycle_state',s);
end $$;
revoke all on function private.nh7_school_report_v580(uuid) from public,anon,authenticated;

-- Rename inside the transaction: retain exact baseline bodies and search_path.
-- Required endpoints must exist; preflight/transaction abort rather than guessing.
do $install$
declare n text; args text;
begin
 foreach n in array array['nh7_admin_student_profile_v238','nh7_admin_student_profile_v451','nh7_admin_student_profile_v452','nh7_admin_student_academic_center_v543'] loop
  args:=case when n='nh7_admin_student_academic_center_v543' then 'integer' else 'text' end;
  if to_regprocedure('public.'||n||'('||args||')') is null then raise exception 'School report prerequisite missing: %',n;end if;
  if (select prorettype from pg_proc where oid=to_regprocedure('public.'||n||'('||args||')'))<>'jsonb'::regtype then raise exception 'School report contract drift: %',n;end if;
  execute format('alter function public.%I(%s) set schema private',n,args);
  execute format('alter function private.%I(%s) rename to %I',n,args,n||'_before580');
  execute format('revoke all on function private.%I(%s) from public,anon,authenticated,service_role',n||'_before580',args);
 end loop;
end $install$;

create function private.nh7_school_profile_overlay_v580(p_base jsonb,p_email text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare uid uuid; s jsonb; old_school jsonb;
begin
 select u.id into uid from auth.users u join public.school_student_identities i on i.user_id=u.id and i.status='active' where lower(trim(u.email))=lower(trim(p_email));
 if uid is null then return p_base;end if;
 s:=private.nh7_school_report_v580(uid);old_school:=coalesce(p_base->'school','{}');
 -- Cycle zero remains legacy-compatible unless explicitly accepted by Admin.
 if (s#>>'{cycle_state,cycle}')::integer=0 and not (s#>>'{cycle_state,admin_override}')::boolean then
  return jsonb_set(p_base,'{school}',old_school||jsonb_build_object('cycle_state',s->'cycle_state'),true);
 end if;
 return jsonb_set(p_base,'{school}',old_school||s,true);
end $$;
revoke all on function private.nh7_school_profile_overlay_v580(jsonb,text) from public,anon,authenticated;

do $install$
declare n text;
begin
 foreach n in array array['nh7_admin_student_profile_v238','nh7_admin_student_profile_v451','nh7_admin_student_profile_v452'] loop
  execute format($ddl$create function public.%I(p_email text) returns jsonb language plpgsql stable security definer set search_path='' as $body$
   begin
    if auth.uid() is null or not coalesce(private.nh7_admin_is_owner_v350(),false) then raise exception 'owner_required' using errcode='42501';end if;
    return private.nh7_school_profile_overlay_v580(private.%I(p_email),p_email);
   end $body$$ddl$,n,n||'_before580');
  execute format('revoke all on function public.%I(text) from public,anon,authenticated',n);
  execute format('grant execute on function public.%I(text) to authenticated',n);
 end loop;
end $install$;

create function public.nh7_admin_student_academic_center_v543(p_inactive_days integer default 30)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare base jsonb; r jsonb; rows jsonb:='[]'; uid uuid; s jsonb; summary jsonb; status text; total integer;
begin
 if auth.uid() is null or not coalesce(private.nh7_admin_is_owner_v350(),false) then raise exception 'owner_required' using errcode='42501';end if;
 base:=private.nh7_admin_student_academic_center_v543_before580(p_inactive_days);
 for r in select value from jsonb_array_elements(coalesce(base->'rows','[]')) loop
  select u.id into uid from auth.users u join public.school_student_identities i on i.user_id=u.id and i.status='active' where lower(trim(u.email))=lower(trim(r->>'email'));
  if uid is not null then
   s:=private.nh7_school_report_v580(uid);
   r:=r||jsonb_build_object('school_cycle',s->'cycle_state');
   if (s#>>'{cycle_state,cycle}')::integer>0 or (s#>>'{cycle_state,admin_override}')::boolean then
    total:=coalesce((r->>'total_lessons')::integer,0);
    r:=r||(s->'summary')||jsonb_build_object('graduated',s#>'{cycle_state,completed}','course_completed',s#>'{cycle_state,completed}','final_exam_passed',s#>'{cycle_state,completed}','completion_source',s#>'{cycle_state,completion_source}','remaining_lessons',greatest(0,total-(s#>>'{summary,completed_lessons}')::integer),'progress_percent',case when total>0 then round(100.0*(s#>>'{summary,completed_lessons}')::integer/total,1) else 0 end,'started_school',jsonb_array_length(s->'progress')+jsonb_array_length(s->'assignments')+jsonb_array_length(s->'attempts')>0);
    status:=case when (s#>>'{cycle_state,completed}')::boolean then 'completed' when (s#>>'{summary,revision_assignments}')::integer>0 then 'needs_revision' when (s#>>'{summary,final_exam_attempts}')::integer>0 then 'final_exam_failed' when (s#>>'{summary,unresolved_failed_class_exams}')::integer>0 then 'class_exam_failed' when not (r->>'started_school')::boolean then 'registered_never_started' when coalesce((s#>>'{summary,days_since_activity}')::integer,-1)>=greatest(1,least(coalesce(p_inactive_days,30),365)) then 'inactive' else 'in_progress' end;
    r:=r||jsonb_build_object('academic_status_code',status,'status_code',status);
   end if;
  end if;
  rows:=rows||jsonb_build_array(r);
 end loop;
 summary:=coalesce(base->'summary','{}');
 select summary||jsonb_build_object('registered_never_started',count(*) filter(where value->>'status_code'='registered_never_started'),'in_progress',count(*) filter(where value->>'status_code'='in_progress'),'needs_revision',count(*) filter(where value->>'status_code'='needs_revision'),'exam_failed',count(*) filter(where value->>'status_code' in('final_exam_failed','exam_failed','class_exam_failed')),'passed',count(*) filter(where coalesce((value->>'graduated')::boolean,false) or value->>'status_code' in('passed','completed')),'completed',count(*) filter(where coalesce((value->>'course_completed')::boolean,false)),'inactive',count(*) filter(where value->>'academic_status_code'='inactive'),'pending_assignment_students',count(*) filter(where coalesce((value->>'pending_assignments')::integer,0)>0)) into summary from jsonb_array_elements(rows);
 return base||jsonb_build_object('rows',rows,'summary',summary,'school_cycle_contract',580);
end $$;
revoke all on function public.nh7_admin_student_academic_center_v543(integer) from public,anon,authenticated;
grant execute on function public.nh7_admin_student_academic_center_v543(integer) to authenticated;

-- Read-only completion adapter. Never issues or alters a certificate.
create function public.nh7_school_completion_v580()
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.nh7_school_access_approved_v230(auth.uid(),'','') then raise exception 'school_approval_required' using errcode='42501';end if;
 return private.nh7_school_summary_v580(auth.uid(),'foundation_school');
end $$;
revoke all on function public.nh7_school_completion_v580() from public,anon,authenticated;
grant execute on function public.nh7_school_completion_v580() to authenticated;
