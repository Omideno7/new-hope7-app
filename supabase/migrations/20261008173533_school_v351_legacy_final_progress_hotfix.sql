create or replace function public.nh7_school_final_exam_session_v351(p_course_code text default 'foundation_school')
returns jsonb
language plpgsql
stable security definer
set search_path to 'public'
as $function$
declare
  v_email text := lower(trim(coalesce(auth.jwt()->>'email','')));
  v_course text := coalesce(nullif(trim(p_course_code),''),'foundation_school');
  v_cutoff timestamptz := '2026-09-17 22:54:58.329357+00'::timestamptz;
  v_anchor integer := 0;
  v_legacy_graduate boolean := false;
  v_course_passed boolean := false;
  v_passed_classes integer := 0;
  v_exam public.school_exams;
  v_attempts integer := 0;
  v_attempt_no integer := 1;
  v_total integer := 0;
  v_take integer := 0;
  v_questions jsonb := '[]'::jsonb;
  v_passed boolean := false;
  v_remaining integer := 0;
  v_ready boolean := false;
  v_base jsonb := '{}'::jsonb;
begin
  if auth.uid() is null or v_email='' then raise exception 'login_required'; end if;
  if not public.nh7_school_access_approved_v230(auth.uid(),v_email,'') then raise exception 'school_approval_required'; end if;

  select coalesce(completed_through_class,0),coalesce(is_legacy_graduate,false)
    into v_anchor,v_legacy_graduate
  from public.school_legacy_progress_v542
  where user_email=v_email;
  v_anchor:=coalesce(v_anchor,0);
  v_legacy_graduate:=coalesce(v_legacy_graduate,false);

  select exists(
    select 1 from public.school_exam_attempts a join public.school_exams e on e.id=a.exam_id
    where lower(a.user_email)=v_email and a.passed=true and e.exam_scope='course' and e.course_code=v_course
  ) or exists(
    select 1 from public.school_progress p join public.school_exams e on e.id=p.exam_id
    where lower(p.user_email)=v_email and p.lesson_code='course:'||v_course and coalesce(p.exam_passed,false)=true
      and e.exam_scope='course' and e.course_code=v_course
  ) into v_course_passed;

  if v_course_passed or v_legacy_graduate then
    return jsonb_build_object(
      'ok',true,'exam',null,'attempts_used',0,'attempt_number',1,'passed_already',true,'remaining_attempts',0,
      'ready',false,'passed_classes',7,'required_classes',7,'legacy_course_passed',true,'graduated',true,
      'legacy_completed_through_class',greatest(v_anchor,7),'path_version','v351-hotfix1'
    );
  end if;

  with classes(class_no,class_key) as (
    values (1,'class_01'),(2,'class_02'),(3,'class_03'),(4,'class_04'),(5,'class_05'),(6,'class_06'),(7,'class_07')
  )
  select count(*)::integer into v_passed_classes
  from classes c
  where c.class_no<=v_anchor
     or exists(
       select 1 from public.school_exam_attempts a join public.school_exams e on e.id=a.exam_id
       where lower(a.user_email)=v_email and a.passed=true and a.submitted_at>=v_cutoff and e.is_active=true
         and e.exam_scope='class' and e.course_code=v_course and e.lesson_code='class_exam:'||c.class_key
     );

  if v_passed_classes=7 then
    select e.* into v_exam
    from public.school_exams e
    where e.is_active=true and e.exam_scope='course' and e.course_code=v_course and e.lesson_code='course:'||v_course
    order by e.require_assignments_before_exam desc,e.created_at desc
    limit 1;

    if found then
      select count(*)::integer,coalesce(bool_or(a.passed),false)
        into v_attempts,v_passed
      from public.school_exam_attempts a
      where a.exam_id=v_exam.id and lower(a.user_email)=v_email;

      v_attempt_no:=v_attempts+1;
      v_total:=jsonb_array_length(coalesce(v_exam.questions,'[]'::jsonb));
      v_take:=case when v_exam.questions_per_attempt>0 then least(v_exam.questions_per_attempt,v_total) else v_total end;

      with raw as (
        select q,ord::integer as qid
        from jsonb_array_elements(coalesce(v_exam.questions,'[]'::jsonb)) with ordinality as x(q,ord)
      ), ordered as (
        select q,qid,row_number() over(
          order by case when v_exam.shuffle_questions
            then md5(v_exam.id::text||'|'||v_email||'|'||v_attempt_no::text||'|'||qid::text)
            else lpad(qid::text,12,'0') end
        ) as rn
        from raw
      )
      select coalesce(jsonb_agg((q-'correct') || jsonb_build_object('_nh7_qid',qid) order by rn),'[]'::jsonb)
        into v_questions
      from ordered where rn<=v_take;

      v_remaining:=case when v_passed then 0 else greatest(0,v_exam.max_attempts-v_attempts) end;
      v_ready:=not v_passed and v_remaining>0;
      v_base:=jsonb_build_object(
        'ok',true,'attempts_used',v_attempts,'attempt_number',v_attempt_no,'passed_already',v_passed,
        'remaining_attempts',v_remaining,
        'exam',(to_jsonb(v_exam)-'questions') || jsonb_build_object(
          'questions',v_questions,'shuffle_questions',false,'questions_per_attempt',v_take,
          '_nh7_secure_server_scoring',true,'_nh7_attempt_number',v_attempt_no
        )
      );
    else
      v_base:=jsonb_build_object('ok',true,'exam',null,'passed_already',false,'remaining_attempts',0);
    end if;
  else
    v_base:=jsonb_build_object('ok',true,'exam',null,'passed_already',false,'remaining_attempts',0);
  end if;

  return v_base || jsonb_build_object(
    'ready',v_ready,'passed_classes',v_passed_classes,'required_classes',7,
    'legacy_course_passed',false,'graduated',false,'legacy_completed_through_class',v_anchor,
    'path_version','v351-hotfix1'
  );
end;
$function$;