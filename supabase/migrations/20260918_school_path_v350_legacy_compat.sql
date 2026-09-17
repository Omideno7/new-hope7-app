-- New Hope 7 — School Path v3.5.0 backward compatibility + auth hardening
-- Preserves graduates who passed the pre-v3.5 course final.
-- Removes deprecated auth.role() dependency from the v3.5 class-session gate.

create or replace function public.nh7_school_class_exam_session_v350(p_class_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_email text := lower(trim(coalesce(auth.jwt()->>'email','')));
  v_key text := lower(trim(coalesce(p_class_key,'')));
  v_lessons text[];
  v_prev text := null;
  v_prev_passed boolean := true;
  v_incomplete integer := 0;
  v_assignment_total integer := 0;
  v_assignment_approved integer := 0;
  v_last_failed timestamptz := null;
  v_passed boolean := false;
  v_base jsonb := '{}'::jsonb;
  v_ready boolean := false;
  v_repeat boolean := false;
  v_legacy_course_passed boolean := false;
begin
  if auth.uid() is null or v_email='' then
    raise exception 'login_required';
  end if;
  if not public.nh7_school_access_approved_v230(auth.uid(),v_email,'') then
    raise exception 'school_approval_required';
  end if;

  case v_key
    when 'class_01' then v_lessons:=array['class_01_new_creation']; v_prev:=null;
    when 'class_02' then v_lessons:=array['class_02_holy_spirit']; v_prev:='class_01';
    when 'class_03' then v_lessons:=array['class_03_christian_doctrine']; v_prev:='class_02';
    when 'class_04' then v_lessons:=array['class_04a_evangelism','class_04b_cell_ministry']; v_prev:='class_03';
    when 'class_05' then v_lessons:=array['class_05_character_prosperity']; v_prev:='class_04';
    when 'class_06' then v_lessons:=array['class_06_local_assembly']; v_prev:='class_05';
    when 'class_07' then v_lessons:=array['class_07_mobile_technology']; v_prev:='class_06';
    else raise exception 'invalid_class_key';
  end case;

  select exists(
    select 1
    from public.school_progress p
    where lower(p.user_email)=v_email
      and p.lesson_code='course:foundation_school'
      and coalesce(p.exam_passed,false)=true
  ) or exists(
    select 1
    from public.school_exam_attempts a
    join public.school_exams e on e.id=a.exam_id
    where lower(a.user_email)=v_email
      and a.passed=true
      and e.exam_scope='course'
      and e.course_code='foundation_school'
  )
  into v_legacy_course_passed;

  select count(*)::integer
  into v_assignment_total
  from public.school_lessons l
  where l.is_active=true
    and l.lesson_code=any(v_lessons)
    and length(trim(coalesce(
      nullif(l.content_data#>>'{translations,en,assignment_question}',''),
      nullif(l.content_data#>>'{translations,fa,assignment_question}',''),
      nullif(l.content_data#>>'{translations,hr,assignment_question}',''),
      ''
    )))>0;

  if v_legacy_course_passed then
    return jsonb_build_object(
      'ok',true,
      'exam',null,
      'attempts_used',0,
      'attempt_number',1,
      'passed_already',true,
      'remaining_attempts',0,
      'class_key',v_key,
      'class_unlocked',true,
      'lessons_total',coalesce(array_length(v_lessons,1),0),
      'lessons_completed',coalesce(array_length(v_lessons,1),0),
      'lessons_complete',true,
      'assignments_total',v_assignment_total,
      'assignments_approved_count',v_assignment_total,
      'assignments_approved',true,
      'repeat_required',false,
      'ready',false,
      'week_days',7,
      'last_failed_at',null,
      'legacy_course_passed',true
    );
  end if;

  if v_prev is not null then
    select exists(
      select 1
      from public.school_exam_attempts a
      join public.school_exams e on e.id=a.exam_id
      where lower(a.user_email)=v_email
        and a.passed=true
        and e.is_active=true
        and e.exam_scope='class'
        and e.course_code='foundation_school'
        and e.lesson_code='class_exam:'||v_prev
    ) into v_prev_passed;
  end if;

  select exists(
    select 1
    from public.school_exam_attempts a
    join public.school_exams e on e.id=a.exam_id
    where lower(a.user_email)=v_email
      and a.passed=true
      and e.is_active=true
      and e.exam_scope='class'
      and e.course_code='foundation_school'
      and e.lesson_code='class_exam:'||v_key
  ) into v_passed;

  if not v_passed then
    select max(a.submitted_at)
    into v_last_failed
    from public.school_exam_attempts a
    join public.school_exams e on e.id=a.exam_id
    where lower(a.user_email)=v_email
      and a.passed=false
      and e.is_active=true
      and e.exam_scope='class'
      and e.course_code='foundation_school'
      and e.lesson_code='class_exam:'||v_key;
  end if;

  select count(*)::integer
  into v_incomplete
  from unnest(v_lessons) as x(code)
  where not exists(
    select 1
    from public.school_progress p
    where lower(p.user_email)=v_email
      and p.lesson_code=x.code
      and (p.completed_at is not null or p.progress_percent>=100)
      and (v_last_failed is null or p.updated_at>v_last_failed)
  );

  select count(distinct a.lesson_code)::integer
  into v_assignment_approved
  from public.school_assignments a
  where lower(a.user_email)=v_email
    and a.lesson_code=any(v_lessons)
    and lower(coalesce(a.status,''))='approved';

  select public.nh7_school_exam_session_v340(null,'class_exam:'||v_key)
  into v_base;
  v_base:=coalesce(v_base,'{}'::jsonb);

  v_repeat := v_last_failed is not null and not v_passed and v_incomplete>0;
  v_ready := v_prev_passed
             and not v_passed
             and v_incomplete=0
             and v_assignment_approved>=v_assignment_total
             and coalesce((v_base->>'remaining_attempts')::integer,0)>0
             and jsonb_typeof(v_base->'exam')='object';

  if not v_ready and jsonb_typeof(v_base->'exam')='object' then
    v_base:=jsonb_set(v_base,'{exam,questions}','[]'::jsonb,true);
  end if;

  return v_base || jsonb_build_object(
    'class_key',v_key,
    'class_unlocked',v_prev_passed,
    'lessons_total',coalesce(array_length(v_lessons,1),0),
    'lessons_completed',coalesce(array_length(v_lessons,1),0)-v_incomplete,
    'lessons_complete',v_incomplete=0,
    'assignments_total',v_assignment_total,
    'assignments_approved_count',v_assignment_approved,
    'assignments_approved',v_assignment_approved>=v_assignment_total,
    'repeat_required',v_repeat,
    'ready',v_ready,
    'week_days',7,
    'last_failed_at',v_last_failed,
    'passed_already',v_passed,
    'legacy_course_passed',false
  );
end;
$$;

create or replace function public.nh7_school_final_exam_session_v350(
  p_course_code text default 'foundation_school'
)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_email text := lower(trim(coalesce(auth.jwt()->>'email','')));
  v_course text := coalesce(nullif(trim(p_course_code),''),'foundation_school');
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
  v_legacy_course_passed boolean := false;
begin
  if auth.uid() is null or v_email='' then
    raise exception 'login_required';
  end if;
  if not public.nh7_school_access_approved_v230(auth.uid(),v_email,'') then
    raise exception 'school_approval_required';
  end if;

  select exists(
    select 1
    from public.school_progress p
    where lower(p.user_email)=v_email
      and p.lesson_code='course:'||v_course
      and coalesce(p.exam_passed,false)=true
  ) or exists(
    select 1
    from public.school_exam_attempts a
    join public.school_exams e on e.id=a.exam_id
    where lower(a.user_email)=v_email
      and a.passed=true
      and e.exam_scope='course'
      and e.course_code=v_course
  )
  into v_legacy_course_passed;

  if v_legacy_course_passed then
    return jsonb_build_object(
      'ok',true,
      'exam',null,
      'attempts_used',0,
      'attempt_number',1,
      'passed_already',true,
      'remaining_attempts',0,
      'ready',false,
      'passed_classes',7,
      'required_classes',7,
      'legacy_course_passed',true
    );
  end if;

  with keys(k) as (
    values ('class_01'),('class_02'),('class_03'),('class_04'),('class_05'),('class_06'),('class_07')
  )
  select count(*)::integer
  into v_passed_classes
  from keys
  where exists(
    select 1
    from public.school_exam_attempts a
    join public.school_exams e on e.id=a.exam_id
    where lower(a.user_email)=v_email
      and a.passed=true
      and e.is_active=true
      and e.exam_scope='class'
      and e.course_code=v_course
      and e.lesson_code='class_exam:'||keys.k
  );

  if v_passed_classes=7 then
    select e.*
    into v_exam
    from public.school_exams e
    where e.is_active=true
      and e.exam_scope='course'
      and e.course_code=v_course
    order by e.require_assignments_before_exam desc,e.created_at asc
    limit 1;

    if found then
      select count(*)::integer,coalesce(bool_or(a.passed),false)
      into v_attempts,v_passed
      from public.school_exam_attempts a
      where a.exam_id=v_exam.id
        and lower(a.user_email)=v_email;

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
      select coalesce(
        jsonb_agg((q-'correct') || jsonb_build_object('_nh7_qid',qid) order by rn),
        '[]'::jsonb
      )
      into v_questions
      from ordered
      where rn<=v_take;

      v_remaining:=case when v_passed then 0 else greatest(0,v_exam.max_attempts-v_attempts) end;
      v_ready:=not v_passed and v_remaining>0;

      v_base:=jsonb_build_object(
        'ok',true,
        'attempts_used',v_attempts,
        'attempt_number',v_attempt_no,
        'passed_already',v_passed,
        'remaining_attempts',v_remaining,
        'exam',(to_jsonb(v_exam)-'questions') || jsonb_build_object(
          'questions',v_questions,
          'shuffle_questions',false,
          'questions_per_attempt',v_take,
          '_nh7_secure_server_scoring',true,
          '_nh7_attempt_number',v_attempt_no
        )
      );
    else
      v_base:=jsonb_build_object('ok',true,'exam',null,'passed_already',false,'remaining_attempts',0);
    end if;
  else
    v_base:=jsonb_build_object('ok',true,'exam',null,'passed_already',false,'remaining_attempts',0);
  end if;

  return v_base || jsonb_build_object(
    'ready',v_ready,
    'passed_classes',v_passed_classes,
    'required_classes',7,
    'legacy_course_passed',false
  );
end;
$$;

revoke all on function public.nh7_school_class_exam_session_v350(text) from public;
revoke all on function public.nh7_school_final_exam_session_v350(text) from public;
grant execute on function public.nh7_school_class_exam_session_v350(text) to authenticated;
grant execute on function public.nh7_school_final_exam_session_v350(text) to authenticated;
