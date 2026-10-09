-- New Hope 7 — School Exam Submit Identity v128
-- Wave 1H-B2: make active exam submission durable Auth user_id first while
-- preserving the current RPC names, answer validation, scoring and JSON contract.
-- No existing School rows, tables, RLS policies, certificates, Storage objects,
-- assignment-submit RPCs or exam read/session RPCs are changed here.

do $preflight$
declare
  v_def text;
  v_bad bigint;
begin
  if to_regprocedure('public.nh7_submit_school_exam_v340(uuid,jsonb)') is null
     or to_regprocedure('public.nh7_submit_school_class_exam_v351(text,uuid,jsonb)') is null
     or to_regprocedure('public.nh7_submit_school_final_exam_v351(uuid,jsonb,text)') is null
     or to_regprocedure('private.nh7_assignment_score_for_identity_v128(uuid,text,text)') is null
     or to_regprocedure('private.nh7_recalculate_exam_scores_identity_v128(uuid,text,text)') is null then
    raise exception 'Wave 1H-B2 baseline is missing';
  end if;

  select pg_get_functiondef('public.nh7_submit_school_exam_v340(uuid,jsonb)'::regprocedure)
    into v_def;
  if v_def not ilike '%lower(a.user_email)=v_email%'
     or v_def not ilike '%public.nh7_assignment_score_for_user%'
     or v_def ilike '%private.nh7_assignment_score_for_identity_v128%' then
    raise exception 'Wave 1H-B2 core submit baseline drifted or is partially applied';
  end if;

  select count(*) into v_bad
  from (
    select user_id,exam_id,attempt_number
    from public.school_exam_attempts
    where user_id is not null
    group by user_id,exam_id,attempt_number
    having count(*)>1
  ) d;
  if v_bad<>0 then
    raise exception 'Wave 1H-B2 duplicate durable exam attempt groups=%',v_bad;
  end if;

  select count(*) into v_bad
  from (
    select user_id from public.school_progress
    union all select user_id from public.school_assignments
    union all select user_id from public.school_exam_attempts
  ) x
  where user_id is null;
  if v_bad<>0 then
    raise exception 'Wave 1H-B2 expected current School activity fully bound; null user_id rows=%',v_bad;
  end if;
end
$preflight$;

create or replace function public.nh7_submit_school_exam_v340(
  p_exam_id uuid,
  p_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_email text := lower(trim(coalesce((select auth.jwt())->>'email','')));
  v_write_email text := '';
  v_seed_email text := '';
  v_name text := trim(coalesce((select auth.jwt())->'user_metadata'->>'full_name',(select auth.jwt())->'user_metadata'->>'name',''));
  v_exam public.school_exams;
  v_course text := '';
  v_attempts integer := 0;
  v_attempt_no integer := 1;
  v_total_all integer := 0;
  v_take integer := 0;
  v_expected integer := 0;
  v_submitted integer := 0;
  v_distinct integer := 0;
  v_extra integer := 0;
  v_missing integer := 0;
  v_bad_options integer := 0;
  v_correct integer := 0;
  v_objective integer := 0;
  v_assignment integer := 100;
  v_assignment_completed integer := 0;
  v_assignment_total integer := 0;
  v_final integer := 0;
  v_passed boolean := false;
  v_incomplete integer := 0;
  v_safe_answers jsonb := '[]'::jsonb;
  v_attempt_id uuid;
  v_attempt public.school_exam_attempts;
begin
  if v_uid is null then
    raise exception 'login_required';
  end if;
  if not public.nh7_school_access_approved_v230(v_uid,'','') then
    raise exception 'school_approval_required';
  end if;
  if p_exam_id is null or jsonb_typeof(coalesce(p_answers,'null'::jsonb))<>'array' then
    raise exception 'invalid_exam_submission';
  end if;

  select lower(trim(u.email)) into v_write_email
  from auth.users u where u.id=v_uid limit 1;
  v_write_email:=coalesce(nullif(v_write_email,''),nullif(v_email,''));
  if coalesce(v_write_email,'')='' then raise exception 'login_required'; end if;

  select lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))
    into v_seed_email
  from public.school_student_identities i
  left join public.registrations r on r.id=i.source_registration_id
  where i.user_id=v_uid and i.status='active'
  limit 1;
  v_seed_email:=coalesce(nullif(v_seed_email,''),nullif(v_email,''),v_uid::text);

  perform pg_advisory_xact_lock(hashtextextended('nh7-exam|'||p_exam_id::text||'|'||v_uid::text,0));

  select * into v_exam
  from public.school_exams
  where id=p_exam_id and is_active
  for share;
  if not found then raise exception 'exam_not_found'; end if;

  select count(*)::integer into v_attempts
  from public.school_exam_attempts a
  where a.exam_id=v_exam.id
    and (
      a.user_id=v_uid
      or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email)
    );

  if exists(
    select 1 from public.school_exam_attempts a
    where a.exam_id=v_exam.id and a.passed=true
      and (
        a.user_id=v_uid
        or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email)
      )
  ) then
    raise exception 'exam_already_passed';
  end if;
  if v_attempts>=v_exam.max_attempts then raise exception 'max_attempts_reached'; end if;
  v_attempt_no:=v_attempts+1;

  if v_exam.exam_scope='course' then
    v_course:=coalesce(nullif(trim(v_exam.course_code),''),'foundation_school');
    select s.score_percent,s.completed_count,s.total_count
      into v_assignment,v_assignment_completed,v_assignment_total
    from private.nh7_assignment_score_for_identity_v128(v_uid,v_email,v_course) s;
    v_assignment:=coalesce(v_assignment,100);
    v_assignment_completed:=coalesce(v_assignment_completed,0);
    v_assignment_total:=coalesce(v_assignment_total,0);

    if v_exam.require_assignments_before_exam and v_assignment_completed<v_assignment_total then
      raise exception 'assignments_required';
    end if;

    if v_exam.require_course_completion then
      select count(*)::integer into v_incomplete
      from public.school_lessons l
      where l.is_active
        and coalesce(nullif(l.content_data#>>'{course,code}',''),'foundation_school')=v_course
        and not exists(
          select 1 from public.school_progress p
          where p.lesson_code=l.lesson_code
            and (
              p.user_id=v_uid
              or (p.user_id is null and v_email<>'' and lower(trim(p.user_email))=v_email)
            )
            and (p.completed_at is not null or p.progress_percent>=100)
        );
      if v_incomplete>0 then raise exception 'course_completion_required'; end if;
    end if;
  end if;

  v_total_all:=jsonb_array_length(coalesce(v_exam.questions,'[]'::jsonb));
  v_take:=case when v_exam.questions_per_attempt>0 then least(v_exam.questions_per_attempt,v_total_all) else v_total_all end;

  with raw as (
    select q,ord::integer as qid
    from jsonb_array_elements(coalesce(v_exam.questions,'[]'::jsonb)) with ordinality as x(q,ord)
  ), ordered as (
    select q,qid,row_number() over(
      order by case when v_exam.shuffle_questions
        then md5(v_exam.id::text||'|'||v_seed_email||'|'||v_attempt_no::text||'|'||qid::text)
        else lpad(qid::text,12,'0') end
    ) as rn
    from raw
  ), expected as (
    select q,qid from ordered where rn<=v_take
  ), submitted as (
    select (a->>'question_id')::integer as qid,(a->>'selected')::integer as selected
    from jsonb_array_elements(p_answers) a
  ), joined as (
    select e.q,e.qid,s.selected
    from expected e left join submitted s on s.qid=e.qid
  )
  select
    (select count(*)::integer from expected),
    (select count(*)::integer from submitted),
    (select count(distinct qid)::integer from submitted),
    (select count(*)::integer from submitted s left join expected e on e.qid=s.qid where e.qid is null),
    (select count(*)::integer from expected e left join submitted s on s.qid=e.qid where s.qid is null),
    (select count(*)::integer from joined j where j.selected is null or j.selected<0 or j.selected>=jsonb_array_length(coalesce(j.q->'options','[]'::jsonb))),
    (select count(*)::integer from joined j where j.selected=(j.q->>'correct')::integer),
    (select coalesce(jsonb_agg(jsonb_build_object(
      'question_id',j.qid,
      'question_number',coalesce((j.q->>'number')::integer,j.qid),
      'selected',j.selected
    ) order by j.qid),'[]'::jsonb) from joined j)
  into v_expected,v_submitted,v_distinct,v_extra,v_missing,v_bad_options,v_correct,v_safe_answers;

  if v_expected=0 or v_submitted<>v_expected or v_distinct<>v_expected or v_extra>0 or v_missing>0 or v_bad_options>0 then
    raise exception 'invalid_answers';
  end if;

  v_objective:=round(v_correct::numeric*100/greatest(1,v_expected))::integer;
  if v_exam.exam_scope='course' then
    v_final:=round((v_objective*v_exam.exam_weight + v_assignment*v_exam.assignment_weight)::numeric /
      greatest(1,v_exam.exam_weight+v_exam.assignment_weight))::integer;
  else
    v_final:=v_objective;
  end if;
  v_passed:=v_final>=v_exam.passing_score;

  insert into public.school_exam_attempts(
    user_id,exam_id,user_email,user_name,course_code,lesson_code,attempt_number,
    correct_count,total_questions,objective_score_percent,assignment_score_percent,final_score_percent,
    assignment_completed_count,assignment_total_count,score_percent,passed,answers,submitted_at
  ) values(
    v_uid,v_exam.id,v_write_email,v_name,coalesce(v_exam.course_code,''),v_exam.lesson_code,v_attempt_no,
    v_correct,v_expected,v_objective,v_assignment,v_final,
    v_assignment_completed,v_assignment_total,v_final,v_passed,v_safe_answers,now()
  ) returning id into v_attempt_id;

  if v_exam.exam_scope='course' then
    perform private.nh7_recalculate_exam_scores_identity_v128(v_uid,v_email,v_course);
  else
    update public.school_progress p
       set user_name=case when v_name<>'' then v_name else p.user_name end,
           progress_percent=greatest(p.progress_percent,case when v_passed then 100 else 0 end),
           completed_at=case when v_passed then coalesce(p.completed_at,now()) else p.completed_at end,
           exam_id=v_exam.id,
           exam_score=v_final,
           objective_score_percent=v_objective,
           assignment_score_percent=100,
           final_score_percent=v_final,
           exam_passed=v_passed,
           exam_attempted_at=now(),
           updated_at=now()
     where p.user_id=v_uid and p.lesson_code=v_exam.lesson_code;

    if not found then
      insert into public.school_progress(
        user_id,user_email,user_name,lesson_code,progress_percent,completed_at,exam_id,exam_score,
        objective_score_percent,assignment_score_percent,final_score_percent,exam_passed,exam_attempted_at,updated_at
      ) values(
        v_uid,v_write_email,v_name,v_exam.lesson_code,case when v_passed then 100 else 0 end,
        case when v_passed then now() else null end,v_exam.id,v_final,v_objective,100,v_final,v_passed,now(),now()
      );
    end if;
  end if;

  select * into v_attempt from public.school_exam_attempts where id=v_attempt_id;
  return jsonb_build_object(
    'ok',true,'attempt_id',v_attempt.id,'attempt_number',v_attempt.attempt_number,
    'correct_count',v_attempt.correct_count,'total_questions',v_attempt.total_questions,
    'objective_score_percent',v_attempt.objective_score_percent,
    'assignment_score_percent',v_attempt.assignment_score_percent,
    'final_score_percent',v_attempt.final_score_percent,'score_percent',v_attempt.score_percent,
    'passed',v_attempt.passed,
    'exam_weight',v_exam.exam_weight,'assignment_weight',v_exam.assignment_weight,
    'passing_score',v_exam.passing_score
  );
end;
$function$;

revoke all on function public.nh7_submit_school_exam_v340(uuid,jsonb)
  from public,anon,authenticated,service_role;
grant execute on function public.nh7_submit_school_exam_v340(uuid,jsonb)
  to authenticated,service_role;

create or replace function public.nh7_submit_school_class_exam_v351(
  p_class_key text,
  p_exam_id uuid,
  p_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_state jsonb;
  v_expected uuid;
begin
  if (select auth.uid()) is null then raise exception 'login_required'; end if;
  v_state:=public.nh7_school_class_exam_session_v351(p_class_key);
  if not coalesce((v_state->>'class_unlocked')::boolean,false) then raise exception 'previous_class_required'; end if;
  if coalesce((v_state->>'passed_already')::boolean,false) then raise exception 'exam_already_passed'; end if;
  if not coalesce((v_state->>'lessons_complete')::boolean,false) then raise exception 'class_lessons_required'; end if;
  if not coalesce((v_state->>'assignments_approved')::boolean,false) then raise exception 'class_assignments_required'; end if;
  if not coalesce((v_state->>'ready')::boolean,false) then raise exception 'class_exam_not_ready'; end if;
  v_expected:=nullif(v_state#>>'{exam,id}','')::uuid;
  if v_expected is null or v_expected<>p_exam_id then raise exception 'invalid_exam_id'; end if;
  return public.nh7_submit_school_exam_v340(p_exam_id,p_answers);
end;
$function$;

revoke all on function public.nh7_submit_school_class_exam_v351(text,uuid,jsonb)
  from public,anon,authenticated,service_role;
grant execute on function public.nh7_submit_school_class_exam_v351(text,uuid,jsonb)
  to authenticated,service_role;

create or replace function public.nh7_submit_school_final_exam_v351(
  p_exam_id uuid,
  p_answers jsonb,
  p_course_code text default 'foundation_school'
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_state jsonb;
  v_expected uuid;
begin
  if (select auth.uid()) is null then raise exception 'login_required'; end if;
  v_state:=public.nh7_school_final_exam_session_v351(p_course_code);
  if coalesce((v_state->>'passed_classes')::integer,0)<coalesce((v_state->>'required_classes')::integer,7) then
    raise exception 'class_exams_required';
  end if;
  if not coalesce((v_state->>'ready')::boolean,false) then raise exception 'final_exam_not_ready'; end if;
  v_expected:=nullif(v_state#>>'{exam,id}','')::uuid;
  if v_expected is null or v_expected<>p_exam_id then raise exception 'invalid_exam_id'; end if;
  return public.nh7_submit_school_exam_v340(p_exam_id,p_answers);
end;
$function$;

revoke all on function public.nh7_submit_school_final_exam_v351(uuid,jsonb,text)
  from public,anon,authenticated,service_role;
grant execute on function public.nh7_submit_school_final_exam_v351(uuid,jsonb,text)
  to authenticated,service_role;

do $postflight$
declare
  v_def text;
  v_cfg text[];
begin
  select pg_get_functiondef(p.oid),coalesce(p.proconfig,'{}'::text[])
    into v_def,v_cfg
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='nh7_submit_school_exam_v340'
  limit 1;

  if v_def not ilike '%a.user_id=v_uid%'
     or v_def not ilike '%p.user_id=v_uid%'
     or v_def not ilike '%private.nh7_assignment_score_for_identity_v128%'
     or v_def not ilike '%private.nh7_recalculate_exam_scores_identity_v128%'
     or v_def not ilike '%v_seed_email%'
     or v_def ilike '%public.nh7_assignment_score_for_user(v_email%'
     or v_def ilike '%on conflict(user_email,lesson_code)%'
     or not ('search_path=""'=any(v_cfg)) then
    raise exception 'Wave 1H-B2 core submit postflight failed';
  end if;

  if has_function_privilege('anon','public.nh7_submit_school_exam_v340(uuid,jsonb)','EXECUTE')
     or has_function_privilege('public','public.nh7_submit_school_exam_v340(uuid,jsonb)','EXECUTE')
     or not has_function_privilege('authenticated','public.nh7_submit_school_exam_v340(uuid,jsonb)','EXECUTE') then
    raise exception 'Wave 1H-B2 core submit ACL postflight failed';
  end if;

  select pg_get_functiondef(p.oid),coalesce(p.proconfig,'{}'::text[])
    into v_def,v_cfg
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='nh7_submit_school_class_exam_v351'
  limit 1;
  if not ('search_path=""'=any(v_cfg))
     or has_function_privilege('anon','public.nh7_submit_school_class_exam_v351(text,uuid,jsonb)','EXECUTE')
     or has_function_privilege('public','public.nh7_submit_school_class_exam_v351(text,uuid,jsonb)','EXECUTE') then
    raise exception 'Wave 1H-B2 class wrapper postflight failed';
  end if;

  select pg_get_functiondef(p.oid),coalesce(p.proconfig,'{}'::text[])
    into v_def,v_cfg
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='nh7_submit_school_final_exam_v351'
  limit 1;
  if not ('search_path=""'=any(v_cfg))
     or has_function_privilege('anon','public.nh7_submit_school_final_exam_v351(uuid,jsonb,text)','EXECUTE')
     or has_function_privilege('public','public.nh7_submit_school_final_exam_v351(uuid,jsonb,text)','EXECUTE') then
    raise exception 'Wave 1H-B2 final wrapper postflight failed';
  end if;
end
$postflight$;

notify pgrst,'reload schema';