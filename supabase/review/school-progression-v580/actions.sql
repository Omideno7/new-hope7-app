-- Review-only current-identity cycle operations. No implicit restart or issuance.
create function private.nh7_school_summary_v580(p_uid uuid,p_course text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare b jsonb; p jsonb; a jsonb; passed boolean; current_stage integer; anchor integer:=0; legacy_graduate boolean:=false;
begin
 b:=private.nh7_school_budget_v580(p_uid,p_course);
 if (b->>'cycle')::integer=0 then
  select coalesce(max(l.completed_through_class),0),coalesce(bool_or(l.is_legacy_graduate),false) into anchor,legacy_graduate from public.school_legacy_progress_v542 l join auth.users u on u.id=p_uid left join public.school_student_identities i on i.user_id=u.id and i.status='active' left join public.registrations r on r.id=i.source_registration_id where lower(trim(l.user_email))=lower(trim(coalesce(nullif(r.payload->>'email',''),u.email)));
 end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.updated_at desc),'[]'::jsonb) into p from private.nh7_school_progress_active_v580 x where private.nh7_school_activity_owner_v580(x.user_id,x.user_email)=p_uid and (x.lesson_code='course:'||p_course or exists(select 1 from public.school_lessons l where l.lesson_code=x.lesson_code and l.course_code=p_course));
 select coalesce(jsonb_agg(to_jsonb(x) order by x.updated_at desc),'[]'::jsonb) into a from private.nh7_school_assignments_active_v580 x where private.nh7_school_activity_owner_v580(x.user_id,x.user_email)=p_uid and x.course_code=p_course;
 select exists(select 1 from private.nh7_school_attempts_active_v580 x join public.school_exams e on e.id=x.exam_id where private.nh7_school_activity_owner_v580(x.user_id,x.user_email)=p_uid and e.course_code=p_course and e.exam_scope='course' and x.passed) into passed;
 select coalesce(min(s.stage_order),8) into current_stage from public.school_course_stages s where s.course_code=p_course and s.is_active and s.stage_order>anchor and not exists(select 1 from private.nh7_school_attempts_active_v580 x join public.school_exams e on e.id=x.exam_id where private.nh7_school_activity_owner_v580(x.user_id,x.user_email)=p_uid and e.course_code=p_course and e.lesson_code='class_exam:'||s.stage_code and x.passed);
 return b||jsonb_build_object('user_id',p_uid,'course_code',p_course,'progress',p,'assignments',a,'current_stage',greatest(current_stage,(b->>'repair_stage')::integer),'completed',passed or legacy_graduate or (b->>'admin_override')::boolean,'completion_source',case when (b->>'admin_override')::boolean then 'ADMIN_OVERRIDE' when legacy_graduate then 'LEGACY_PRESERVED' when passed then 'EXAM' else null end,'access_state',case when passed or legacy_graduate or (b->>'admin_override')::boolean then 'COMPLETED' when (b->>'remaining_attempts')::integer=0 then 'RESTART_REQUIRED' else 'IN_PROGRESS' end);
end $$;
revoke all on function private.nh7_school_summary_v580(uuid,text) from public,anon,authenticated;

create function private.nh7_school_override_v580(p_target uuid,p_course text,p_cycle integer,p_action text,p_reason text,p_request uuid,p_confirm boolean,p_stage integer default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); before_state jsonb; after_state jsonb; input jsonb; old_event private.nh7_school_admin_audit_v580;
begin
 if actor is null then raise exception 'login_required' using errcode='42501';end if;
 if p_target is null or p_request is null or p_confirm is distinct from true or length(trim(coalesce(p_reason,''))) not between 3 and 2000 then raise exception 'confirmation_reason_request_required';end if;
 if p_course<>'foundation_school' then raise exception 'unsupported_school_course';end if;
 if p_action='student_restart' then
  if p_target<>actor then raise exception 'permission_denied' using errcode='42501';end if;
  if not public.nh7_school_access_approved_v230(actor,'','') then raise exception 'school_approval_required';end if;
 elsif not coalesce(private.nh7_admin_is_owner_v350(),false) then raise exception 'owner_required' using errcode='42501';end if;
 if not exists(select 1 from public.school_student_identities where user_id=p_target and status='active') then raise exception 'student_not_found';end if;
 input:=jsonb_build_object('target',p_target,'course',p_course,'cycle',p_cycle,'action',p_action,'reason',trim(p_reason),'stage',p_stage);
 perform private.nh7_school_ensure_cycle_v580(p_target,p_course);
 select * into old_event from private.nh7_school_admin_audit_v580 where actor_user_id=actor and request_id=p_request;
 if found then
  if old_event.input<>input then raise exception 'request_id_reused';end if;
  return jsonb_build_object('ok',true,'audit_id',old_event.id,'state',old_event.after_state,'replayed',true);
 end if;
 if private.nh7_school_cycle_v580(p_target,p_course)<>p_cycle then raise exception 'school_cycle_changed';end if;
 before_state:=private.nh7_school_summary_v580(p_target,p_course);
 if p_action='student_restart' and before_state->>'access_state'<>'RESTART_REQUIRED' then raise exception 'restart_not_required';end if;
 case p_action
  when 'grant_extra_attempt' then update private.nh7_school_cycles_v580 set extra_attempts=extra_attempts+1 where user_id=p_target and course_code=p_course and cycle=p_cycle;
  when 'reset_attempt_allowance' then update private.nh7_school_cycles_v580 set reset_failed_baseline=(before_state->>'failed_total')::integer,extra_attempts=0 where user_id=p_target and course_code=p_course and cycle=p_cycle;
  when 'admin_pass' then update private.nh7_school_cycles_v580 set admin_pass=true where user_id=p_target and course_code=p_course and cycle=p_cycle;
  when 'repair_stage' then
   if p_stage is null or p_stage not between 1 and 7 then raise exception 'invalid_stage';end if;
   update private.nh7_school_cycles_v580 set repair_stage=greatest(repair_stage,p_stage) where user_id=p_target and course_code=p_course and cycle=p_cycle;
  when 'admin_restart','student_restart' then
   update private.nh7_school_cycles_v580 set ended_at=now() where user_id=p_target and course_code=p_course and cycle=p_cycle;
   insert into private.nh7_school_cycles_v580(user_id,course_code,cycle) values(p_target,p_course,p_cycle+1);
  else raise exception 'invalid_school_action';
 end case;
 after_state:=private.nh7_school_summary_v580(p_target,p_course);
 insert into private.nh7_school_admin_audit_v580(request_id,target_user_id,actor_user_id,course_code,cycle,action,reason,before_state,after_state,input)
 values(p_request,p_target,actor,p_course,p_cycle,p_action,trim(p_reason),before_state,after_state,input) returning * into old_event;
 return jsonb_build_object('ok',true,'audit_id',old_event.id,'state',after_state,'replayed',false);
end $$;
revoke all on function private.nh7_school_override_v580(uuid,text,integer,text,text,uuid,boolean,integer) from public,anon,authenticated;

create function public.nh7_admin_school_state_v580(p_email text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare uid uuid; history jsonb; audits jsonb;
begin
 if auth.uid() is null or not coalesce(private.nh7_admin_is_owner_v350(),false) then raise exception 'owner_required' using errcode='42501';end if;
 select u.id into uid from auth.users u join public.school_student_identities i on i.user_id=u.id and i.status='active' where lower(trim(u.email))=lower(trim(p_email));
 if uid is null then raise exception 'student_not_found';end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.cycle desc),'[]'::jsonb) into history from (select * from private.nh7_school_cycles_v580 where user_id=uid and course_code='foundation_school' order by cycle desc limit 50) x;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into audits from (select * from private.nh7_school_admin_audit_v580 where target_user_id=uid order by created_at desc limit 50) x;
 return jsonb_build_object('contract',580,'can_manage',true,'state',private.nh7_school_summary_v580(uid,'foundation_school'),'cycles',history,'audit',audits);
end $$;
revoke all on function public.nh7_admin_school_state_v580(text) from public,anon,authenticated;
grant execute on function public.nh7_admin_school_state_v580(text) to authenticated;

create function public.nh7_admin_school_action_v580(p_target uuid,p_cycle integer,p_action text,p_reason text,p_request uuid,p_confirm boolean,p_stage integer default null)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not coalesce(private.nh7_admin_is_owner_v350(),false) then raise exception 'owner_required' using errcode='42501';end if;
 if p_action not in('grant_extra_attempt','reset_attempt_allowance','admin_pass','repair_stage','admin_restart') then raise exception 'invalid_admin_action';end if;
 return private.nh7_school_override_v580(p_target,'foundation_school',p_cycle,p_action,p_reason,p_request,p_confirm,p_stage);
end $$;
revoke all on function public.nh7_admin_school_action_v580(uuid,integer,text,text,uuid,boolean,integer) from public,anon,authenticated;
grant execute on function public.nh7_admin_school_action_v580(uuid,integer,text,text,uuid,boolean,integer) to authenticated;

create function public.nh7_school_restart_v580(p_cycle integer,p_request uuid,p_confirm boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 return private.nh7_school_override_v580(auth.uid(),'foundation_school',p_cycle,'student_restart','Student confirmed School restart',p_request,p_confirm,null);
end $$;
revoke all on function public.nh7_school_restart_v580(integer,uuid,boolean) from public,anon,authenticated;
grant execute on function public.nh7_school_restart_v580(integer,uuid,boolean) to authenticated;

create function public.nh7_school_submit_v580(p_exam_id uuid,p_answers jsonb,p_cycle integer,p_request uuid,p_class_key text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); e public.school_exams; s jsonb; b jsonb; result jsonb; payload jsonb; prior private.nh7_school_receipts_v580; course text; final_exam boolean;
begin
 if uid is null or not public.nh7_school_access_approved_v230(uid,'','') then raise exception 'school_approval_required' using errcode='42501';end if;
 if p_request is null or p_exam_id is null or jsonb_typeof(p_answers)<>'array' then raise exception 'invalid_exam_submission';end if;
 select * into e from public.school_exams where id=p_exam_id and is_active;
 if not found then raise exception 'exam_not_found';end if;
 course:=coalesce(nullif(e.course_code,''),'foundation_school');
 perform private.nh7_school_ensure_cycle_v580(uid,course);
 if private.nh7_school_cycle_v580(uid,course)<>p_cycle then raise exception 'school_cycle_changed';end if;
 payload:=jsonb_build_object('exam',p_exam_id,'cycle',p_cycle,'class',p_class_key,'answers',p_answers);
 select * into prior from private.nh7_school_receipts_v580 where user_id=uid and request_id=p_request;
 if found then
  if prior.input<>payload or prior.action<>'exam_submit' then raise exception 'request_id_reused';end if;
  return prior.receipt||jsonb_build_object('replayed',true);
 end if;
 final_exam:=e.exam_scope='course' and course='foundation_school' and e.lesson_code='course:foundation_school';
 if final_exam then
  s:=public.nh7_school_final_exam_session_v351(course);
  if not coalesce((s->>'ready')::boolean,false) or nullif(s#>>'{exam,id}','')::uuid is distinct from p_exam_id then raise exception 'final_exam_not_ready';end if;
 elsif e.exam_scope='class' then
  if p_class_key is null or e.lesson_code<>'class_exam:'||p_class_key then raise exception 'invalid_class_key';end if;
  s:=public.nh7_school_class_exam_session_v351(p_class_key);
  if not coalesce((s->>'ready')::boolean,false) or nullif(s#>>'{exam,id}','')::uuid is distinct from p_exam_id then raise exception 'class_exam_not_ready';end if;
 else
  -- A lesson quiz cannot substitute for another course/class/final examination.
  if e.exam_scope not in('lesson','course') then raise exception 'unsupported_exam_scope';end if;
  -- Lesson quizzes do not bypass class/assignment gates: class advancement is still checked separately.
  if exists(select 1 from public.school_course_stage_lessons sl where sl.course_code=course and sl.lesson_code=e.lesson_code) then
   select public.nh7_school_class_exam_session_v351(sl.stage_code) into s from public.school_course_stage_lessons sl where sl.course_code=course and sl.lesson_code=e.lesson_code;
   if not coalesce((s->>'class_unlocked')::boolean,false) then raise exception 'previous_class_required';end if;
  end if;
 end if;
 insert into private.nh7_school_receipts_v580(user_id,request_id,course_code,cycle,action,input,receipt) values(uid,p_request,course,p_cycle,'exam_pending',payload,'{}');
 result:=private.nh7_school_grade_v580(p_exam_id,p_answers,p_cycle);
 result:=result||jsonb_build_object('school_cycle',p_cycle,'submission_id',p_request,'replayed',false);
 update private.nh7_school_receipts_v580 set action='exam_submit',receipt=result,failed_final=final_exam and not (result->>'passed')::boolean,attempt_id=(result->>'attempt_id')::uuid where user_id=uid and request_id=p_request;
 b:=private.nh7_school_budget_v580(uid,course);
 result:=result||jsonb_build_object('budget',b,'access_state',case when (result->>'passed')::boolean and final_exam then 'COMPLETED' when final_exam and (b->>'remaining_attempts')::integer=0 then 'RESTART_REQUIRED' else 'RETRY_ALLOWED' end);
 update private.nh7_school_receipts_v580 set receipt=result where user_id=uid and request_id=p_request;
 return result;
end $$;
revoke all on function public.nh7_school_submit_v580(uuid,jsonb,integer,uuid,text) from public,anon,authenticated;
grant execute on function public.nh7_school_submit_v580(uuid,jsonb,integer,uuid,text) to authenticated;

create function public.nh7_school_progress_save_cycle_v580(p_lesson_code text,p_progress_percent integer,p_completed_at timestamptz,p_cycle integer)
returns jsonb language plpgsql security definer set search_path='' as $$
begin return private.nh7_school_progress_v580(p_lesson_code,p_progress_percent,p_completed_at,p_cycle);end $$;
revoke all on function public.nh7_school_progress_save_cycle_v580(text,integer,timestamptz,integer) from public,anon,authenticated;
grant execute on function public.nh7_school_progress_save_cycle_v580(text,integer,timestamptz,integer) to authenticated;

create function public.nh7_school_assignment_submit_cycle_v580(p_course_code text,p_lesson_code text,p_answer_text text,p_language text,p_user_name text,p_cycle integer)
returns public.school_assignments language plpgsql security definer set search_path='' as $$
begin return private.nh7_school_assignment_v580(p_course_code,p_lesson_code,p_answer_text,p_language,p_user_name,p_cycle);end $$;
revoke all on function public.nh7_school_assignment_submit_cycle_v580(text,text,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.nh7_school_assignment_submit_cycle_v580(text,text,text,text,text,integer) to authenticated;

create function public.nh7_admin_school_history_v580(p_target uuid,p_cycle integer,p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare attempts jsonb; progress jsonb; assignments jsonb;
begin
 if auth.uid() is null or not coalesce(private.nh7_admin_is_owner_v350(),false) then raise exception 'owner_required' using errcode='42501';end if;
 if p_cycle<0 or p_offset<0 then raise exception 'invalid_history_page';end if;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into attempts from (select * from public.school_exam_attempts where private.nh7_school_activity_owner_v580(user_id,user_email)=p_target and school_cycle=p_cycle order by submitted_at desc,id limit 100 offset p_offset) x;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into progress from public.school_progress x where private.nh7_school_activity_owner_v580(user_id,user_email)=p_target and school_cycle=p_cycle;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into assignments from public.school_assignments x where private.nh7_school_activity_owner_v580(user_id,user_email)=p_target and school_cycle=p_cycle;
 return jsonb_build_object('cycle',p_cycle,'attempts',attempts,'progress',progress,'assignments',assignments,'offset',p_offset,'page_size',100);
end $$;
revoke all on function public.nh7_admin_school_history_v580(uuid,integer,integer) from public,anon,authenticated;
grant execute on function public.nh7_admin_school_history_v580(uuid,integer,integer) to authenticated;
