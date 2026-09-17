-- New Hope 7 — School Path v3.5.0 final-source fix
-- QA/production-candidate patch. Does not modify existing exam rows.
-- Keeps the final exam on the same canonical source rule used to build class exams:
-- prefer the active course exam that requires assignment approval, then the earliest created row.

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
begin
  if auth.uid() is null or v_email='' then
    raise exception 'login_required';
  end if;
  if not public.nh7_school_access_approved_v230(auth.uid(),v_email,'') then
    raise exception 'school_approval_required';
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
      v_take:=case
        when v_exam.questions_per_attempt>0 then least(v_exam.questions_per_attempt,v_total)
        else v_total
      end;

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
    'required_classes',7
  );
end;
$$;

revoke all on function public.nh7_school_final_exam_session_v350(text) from public;
grant execute on function public.nh7_school_final_exam_session_v350(text) to authenticated;
