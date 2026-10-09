-- New Hope 7 — School Exam Read Identity v351
-- Wave 1H-A: make active School exam/path read sessions durable-user-id first.
-- No table rows, RLS policies, Storage objects, scoring rules, or submit functions are changed.

-- 0. Fail-closed baseline.
do $preflight$
declare
  v_def text;
  v_nulls bigint;
begin
  if to_regprocedure('public.nh7_school_path_state_v351()') is null
     or to_regprocedure('public.nh7_school_exam_session_v340(text,text)') is null
     or to_regprocedure('public.nh7_school_class_exam_session_v351(text)') is null
     or to_regprocedure('public.nh7_school_final_exam_session_v351(text)') is null then
    raise exception 'Wave 1H-A required School RPC baseline is missing';
  end if;

  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='nh7_school_exam_session_v340' limit 1;
  if v_def not ilike '%lower(a.user_email)=v_email%'
     or v_def ilike '%a.user_id=v_uid%' then
    raise exception 'Wave 1H-A exam-session baseline drifted or partially applied';
  end if;

  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='nh7_school_class_exam_session_v351' limit 1;
  if v_def not ilike '%lower(a.user_email)=v_email%'
     or v_def ilike '%a.user_id=v_uid%' then
    raise exception 'Wave 1H-A class-session baseline drifted or partially applied';
  end if;

  if not has_function_privilege('anon','public.nh7_school_path_state_v351()','EXECUTE')
     or not has_function_privilege('anon','public.nh7_school_class_exam_session_v351(text)','EXECUTE')
     or not has_function_privilege('anon','public.nh7_school_final_exam_session_v351(text)','EXECUTE')
     or has_function_privilege('anon','public.nh7_school_exam_session_v340(text,text)','EXECUTE') then
    raise exception 'Wave 1H-A ACL baseline drifted';
  end if;

  if not has_function_privilege('authenticated','public.nh7_school_path_state_v351()','EXECUTE')
     or not has_function_privilege('authenticated','public.nh7_school_exam_session_v340(text,text)','EXECUTE')
     or not has_function_privilege('authenticated','public.nh7_school_class_exam_session_v351(text)','EXECUTE')
     or not has_function_privilege('authenticated','public.nh7_school_final_exam_session_v351(text)','EXECUTE') then
    raise exception 'Wave 1H-A authenticated ACL baseline drifted';
  end if;

  select count(*) into v_nulls from (
    select user_id from public.school_progress
    union all select user_id from public.school_assignments
    union all select user_id from public.school_exam_attempts
  ) s where user_id is null;
  if v_nulls<>0 then
    raise exception 'Wave 1H-A current School activity coverage expected fully bound rows; null user_id rows=%',v_nulls;
  end if;
end
$preflight$;

-- 1. Base exam session: durable user_id owns attempt history; email is unbound fallback only.
create or replace function public.nh7_school_exam_session_v340(
  p_course_code text default null,
  p_lesson_code text default null
)
returns jsonb
language plpgsql
stable security definer
set search_path=''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_email text := lower(trim(coalesce((select auth.jwt())->>'email','')));
  v_seed_email text := '';
  v_course text := trim(coalesce(p_course_code,''));
  v_lesson text := trim(coalesce(p_lesson_code,''));
  v_exam public.school_exams;
  v_attempts integer := 0;
  v_attempt_no integer := 1;
  v_total integer := 0;
  v_take integer := 0;
  v_questions jsonb := '[]'::jsonb;
  v_passed boolean := false;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  if not public.nh7_school_access_approved_v230(v_uid,'','') then
    raise exception 'school_approval_required';
  end if;

  select lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))
    into v_seed_email
  from public.school_student_identities i
  left join public.registrations r on r.id=i.source_registration_id
  where i.user_id=v_uid and i.status='active'
  limit 1;
  v_seed_email:=coalesce(nullif(v_seed_email,''),nullif(v_email,''),v_uid::text);

  if v_course<>'' then
    select * into v_exam
    from public.school_exams e
    where e.is_active and e.exam_scope='course' and e.course_code=v_course
    order by e.sort_order,e.created_at
    limit 1;
  elsif v_lesson<>'' then
    select * into v_exam
    from public.school_exams e
    where e.is_active and e.exam_scope<>'course' and e.lesson_code=v_lesson
    order by e.sort_order,e.created_at
    limit 1;
  else
    raise exception 'exam_scope_required';
  end if;

  if not found then return jsonb_build_object('ok',true,'exam',null); end if;

  select count(*)::integer,coalesce(bool_or(a.passed),false)
    into v_attempts,v_passed
  from public.school_exam_attempts a
  where a.exam_id=v_exam.id
    and (
      a.user_id=v_uid
      or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email)
    );

  v_attempt_no:=v_attempts+1;
  v_total:=jsonb_array_length(coalesce(v_exam.questions,'[]'::jsonb));
  v_take:=case when v_exam.questions_per_attempt>0 then least(v_exam.questions_per_attempt,v_total) else v_total end;

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
  )
  select coalesce(jsonb_agg((q-'correct') || jsonb_build_object('_nh7_qid',qid) order by rn),'[]'::jsonb)
    into v_questions
  from ordered
  where rn<=v_take;

  return jsonb_build_object(
    'ok',true,
    'attempts_used',v_attempts,
    'attempt_number',v_attempt_no,
    'passed_already',v_passed,
    'remaining_attempts',case when v_passed then 0 else greatest(0,v_exam.max_attempts-v_attempts) end,
    'exam',(to_jsonb(v_exam)-'questions') || jsonb_build_object(
      'questions',v_questions,
      'shuffle_questions',false,
      'questions_per_attempt',v_take,
      '_nh7_secure_server_scoring',true,
      '_nh7_attempt_number',v_attempt_no
    )
  );
end;
$function$;

-- 2. Class session: user_id-first activity reads; original registration email only for legacy anchor.
create or replace function public.nh7_school_class_exam_session_v351(p_class_key text)
returns jsonb
language plpgsql
stable security definer
set search_path=''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_email text := lower(trim(coalesce((select auth.jwt())->>'email','')));
  v_legacy_email text := '';
  v_key text := lower(trim(coalesce(p_class_key,'')));
  v_cutoff timestamptz := '2026-09-17 22:54:58.329357+00'::timestamptz;
  v_class_no integer := 0;
  v_lessons text[];
  v_prev text := null;
  v_prev_passed boolean := true;
  v_incomplete integer := 0;
  v_assignment_total integer := 0;
  v_assignment_approved integer := 0;
  v_last_failed timestamptz := null;
  v_passed boolean := false;
  v_course_passed boolean := false;
  v_base jsonb := '{}'::jsonb;
  v_ready boolean := false;
  v_repeat boolean := false;
  v_anchor integer := 0;
  v_legacy_graduate boolean := false;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  if not public.nh7_school_access_approved_v230(v_uid,'','') then raise exception 'school_approval_required'; end if;

  select lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))
    into v_legacy_email
  from public.school_student_identities i
  left join public.registrations r on r.id=i.source_registration_id
  where i.user_id=v_uid and i.status='active'
  limit 1;
  v_legacy_email:=coalesce(nullif(v_legacy_email,''),v_email);

  case v_key
    when 'class_01' then v_class_no:=1; v_lessons:=array['class_01_new_creation']; v_prev:=null;
    when 'class_02' then v_class_no:=2; v_lessons:=array['class_02_holy_spirit']; v_prev:='class_01';
    when 'class_03' then v_class_no:=3; v_lessons:=array['class_03_christian_doctrine']; v_prev:='class_02';
    when 'class_04' then v_class_no:=4; v_lessons:=array['class_04a_evangelism','class_04b_cell_ministry']; v_prev:='class_03';
    when 'class_05' then v_class_no:=5; v_lessons:=array['class_05_character_prosperity']; v_prev:='class_04';
    when 'class_06' then v_class_no:=6; v_lessons:=array['class_06_local_assembly']; v_prev:='class_05';
    when 'class_07' then v_class_no:=7; v_lessons:=array['class_07_mobile_technology']; v_prev:='class_06';
    else raise exception 'invalid_class_key';
  end case;

  select coalesce(completed_through_class,0),coalesce(is_legacy_graduate,false)
  into v_anchor,v_legacy_graduate
  from public.school_legacy_progress_v542 where lower(trim(user_email))=v_legacy_email;
  v_anchor:=coalesce(v_anchor,0);
  v_legacy_graduate:=coalesce(v_legacy_graduate,false);

  select exists(
    select 1 from public.school_exam_attempts a join public.school_exams e on e.id=a.exam_id
    where (a.user_id=v_uid or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email)) and a.passed=true and e.exam_scope='course' and e.course_code='foundation_school'
  ) or exists(
    select 1 from public.school_progress p join public.school_exams e on e.id=p.exam_id
    where (p.user_id=v_uid or (p.user_id is null and v_email<>'' and lower(trim(p.user_email))=v_email)) and p.lesson_code='course:foundation_school' and coalesce(p.exam_passed,false)=true
      and e.exam_scope='course' and e.course_code='foundation_school'
  ) into v_course_passed;

  select count(*)::integer into v_assignment_total
  from public.school_lessons l
  where l.is_active=true and l.lesson_code=any(v_lessons)
    and length(trim(coalesce(
      nullif(l.content_data#>>'{translations,en,assignment_question}',''),
      nullif(l.content_data#>>'{translations,fa,assignment_question}',''),
      nullif(l.content_data#>>'{translations,hr,assignment_question}',''),'')
    ))>0;

  if v_course_passed or v_legacy_graduate then
    return jsonb_build_object(
      'ok',true,'exam',null,'attempts_used',0,'attempt_number',1,'passed_already',true,'remaining_attempts',0,
      'class_key',v_key,'class_unlocked',true,'lessons_total',coalesce(array_length(v_lessons,1),0),
      'lessons_completed',coalesce(array_length(v_lessons,1),0),'lessons_complete',true,
      'assignments_total',v_assignment_total,'assignments_approved_count',v_assignment_total,'assignments_approved',true,
      'repeat_required',false,'ready',false,'week_days',7,'last_failed_at',null,
      'legacy_course_passed',true,'graduated',true,'legacy_class_completed',false,
      'legacy_completed_through_class',greatest(v_anchor,7),'path_version','v351-hotfix1'
    );
  end if;

  if v_class_no<=v_anchor then
    return jsonb_build_object(
      'ok',true,'exam',null,'attempts_used',0,'attempt_number',1,'passed_already',true,'remaining_attempts',0,
      'class_key',v_key,'class_unlocked',true,'lessons_total',coalesce(array_length(v_lessons,1),0),
      'lessons_completed',coalesce(array_length(v_lessons,1),0),'lessons_complete',true,
      'assignments_total',v_assignment_total,'assignments_approved_count',v_assignment_total,'assignments_approved',true,
      'repeat_required',false,'ready',false,'week_days',7,'last_failed_at',null,
      'legacy_course_passed',false,'graduated',false,'legacy_class_completed',true,
      'legacy_completed_through_class',v_anchor,'path_version','v351-hotfix1'
    );
  end if;

  if v_prev is not null then
    if v_class_no-1<=v_anchor then
      v_prev_passed:=true;
    else
      select exists(
        select 1 from public.school_exam_attempts a join public.school_exams e on e.id=a.exam_id
        where (a.user_id=v_uid or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email)) and a.passed=true and a.submitted_at>=v_cutoff and e.is_active=true
          and e.exam_scope='class' and e.course_code='foundation_school' and e.lesson_code='class_exam:'||v_prev
      ) into v_prev_passed;
    end if;
  end if;

  select exists(
    select 1 from public.school_exam_attempts a join public.school_exams e on e.id=a.exam_id
    where (a.user_id=v_uid or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email)) and a.passed=true and a.submitted_at>=v_cutoff and e.is_active=true
      and e.exam_scope='class' and e.course_code='foundation_school' and e.lesson_code='class_exam:'||v_key
  ) into v_passed;

  if not v_passed then
    select max(a.submitted_at) into v_last_failed
    from public.school_exam_attempts a join public.school_exams e on e.id=a.exam_id
    where (a.user_id=v_uid or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email)) and a.passed=false and a.submitted_at>=v_cutoff and e.is_active=true
      and e.exam_scope='class' and e.course_code='foundation_school' and e.lesson_code='class_exam:'||v_key;
  end if;

  select count(*)::integer into v_incomplete
  from unnest(v_lessons) as x(code)
  where not (
    exists(
      select 1 from public.school_progress p
      where (p.user_id=v_uid or (p.user_id is null and v_email<>'' and lower(trim(p.user_email))=v_email)) and p.lesson_code=x.code
        and (p.completed_at is not null or p.progress_percent>=100)
        and (v_last_failed is null or p.updated_at>v_last_failed)
    )
    or exists(
      select 1 from public.school_assignments a
      where (a.user_id=v_uid or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email)) and a.lesson_code=x.code and lower(coalesce(a.status,''))='approved'
        and (v_last_failed is null or coalesce(a.reviewed_at,a.updated_at,a.submitted_at)>v_last_failed)
    )
  );

  select count(distinct a.lesson_code)::integer into v_assignment_approved
  from public.school_assignments a
  where (a.user_id=v_uid or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email)) and a.lesson_code=any(v_lessons) and lower(coalesce(a.status,''))='approved';

  select public.nh7_school_exam_session_v340(null,'class_exam:'||v_key) into v_base;
  v_base:=coalesce(v_base,'{}'::jsonb);

  v_repeat := v_last_failed is not null and not v_passed and v_incomplete>0;
  v_ready := v_prev_passed and not v_passed and v_incomplete=0 and v_assignment_approved>=v_assignment_total
             and coalesce((v_base->>'remaining_attempts')::integer,0)>0 and jsonb_typeof(v_base->'exam')='object';

  if not v_ready and jsonb_typeof(v_base->'exam')='object' then
    v_base:=jsonb_set(v_base,'{exam,questions}','[]'::jsonb,true);
  end if;

  return v_base || jsonb_build_object(
    'class_key',v_key,'class_unlocked',v_prev_passed,'lessons_total',coalesce(array_length(v_lessons,1),0),
    'lessons_completed',coalesce(array_length(v_lessons,1),0)-v_incomplete,'lessons_complete',v_incomplete=0,
    'assignments_total',v_assignment_total,'assignments_approved_count',v_assignment_approved,
    'assignments_approved',v_assignment_approved>=v_assignment_total,'repeat_required',v_repeat,'ready',v_ready,
    'week_days',7,'last_failed_at',v_last_failed,'passed_already',v_passed,'legacy_course_passed',false,
    'graduated',false,'legacy_class_completed',false,'legacy_completed_through_class',v_anchor,'path_version','v351-hotfix1'
  );
end;
$function$;
-- 3. Final session: user_id-first activity reads; original registration email preserves shuffle/legacy semantics.
create or replace function public.nh7_school_final_exam_session_v351(p_course_code text default 'foundation_school')
returns jsonb
language plpgsql
stable security definer
set search_path=''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_email text := lower(trim(coalesce((select auth.jwt())->>'email','')));
  v_legacy_email text := '';
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
  if v_uid is null then raise exception 'login_required'; end if;
  if not public.nh7_school_access_approved_v230(v_uid,'','') then raise exception 'school_approval_required'; end if;

  select lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))
    into v_legacy_email
  from public.school_student_identities i
  left join public.registrations r on r.id=i.source_registration_id
  where i.user_id=v_uid and i.status='active'
  limit 1;
  v_legacy_email:=coalesce(nullif(v_legacy_email,''),v_email);

  select coalesce(completed_through_class,0),coalesce(is_legacy_graduate,false)
    into v_anchor,v_legacy_graduate
  from public.school_legacy_progress_v542
  where lower(trim(user_email))=v_legacy_email;
  v_anchor:=coalesce(v_anchor,0);
  v_legacy_graduate:=coalesce(v_legacy_graduate,false);

  select exists(
    select 1 from public.school_exam_attempts a join public.school_exams e on e.id=a.exam_id
    where (a.user_id=v_uid or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email)) and a.passed=true and e.exam_scope='course' and e.course_code=v_course
  ) or exists(
    select 1 from public.school_progress p join public.school_exams e on e.id=p.exam_id
    where (p.user_id=v_uid or (p.user_id is null and v_email<>'' and lower(trim(p.user_email))=v_email)) and p.lesson_code='course:'||v_course and coalesce(p.exam_passed,false)=true
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
       where (a.user_id=v_uid or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email)) and a.passed=true and a.submitted_at>=v_cutoff and e.is_active=true
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
      where a.exam_id=v_exam.id and (a.user_id=v_uid or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email));

      v_attempt_no:=v_attempts+1;
      v_total:=jsonb_array_length(coalesce(v_exam.questions,'[]'::jsonb));
      v_take:=case when v_exam.questions_per_attempt>0 then least(v_exam.questions_per_attempt,v_total) else v_total end;

      with raw as (
        select q,ord::integer as qid
        from jsonb_array_elements(coalesce(v_exam.questions,'[]'::jsonb)) with ordinality as x(q,ord)
      ), ordered as (
        select q,qid,row_number() over(
          order by case when v_exam.shuffle_questions
            then md5(v_exam.id::text||'|'||v_legacy_email||'|'||v_attempt_no::text||'|'||qid::text)
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
-- 4. Path wrapper keeps the exact JSON contract and becomes authenticated-only.
create or replace function public.nh7_school_path_state_v351()
returns jsonb
language plpgsql
stable security definer
set search_path=''
as $function$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'login_required'; end if;
  if not public.nh7_school_access_approved_v230(v_uid,'','') then raise exception 'school_approval_required'; end if;

  return jsonb_build_object(
    'classes',jsonb_build_array(
      public.nh7_school_class_exam_session_v351('class_01'),
      public.nh7_school_class_exam_session_v351('class_02'),
      public.nh7_school_class_exam_session_v351('class_03'),
      public.nh7_school_class_exam_session_v351('class_04'),
      public.nh7_school_class_exam_session_v351('class_05'),
      public.nh7_school_class_exam_session_v351('class_06'),
      public.nh7_school_class_exam_session_v351('class_07')
    ),
    'final',public.nh7_school_final_exam_session_v351('foundation_school')
  );
end;
$function$;

-- 5. Narrow active RPC ACLs. service_role is retained for controlled server diagnostics.
revoke all on function public.nh7_school_exam_session_v340(text,text) from public,anon,authenticated,service_role;
grant execute on function public.nh7_school_exam_session_v340(text,text) to authenticated,service_role;
revoke all on function public.nh7_school_class_exam_session_v351(text) from public,anon,authenticated,service_role;
grant execute on function public.nh7_school_class_exam_session_v351(text) to authenticated,service_role;
revoke all on function public.nh7_school_final_exam_session_v351(text) from public,anon,authenticated,service_role;
grant execute on function public.nh7_school_final_exam_session_v351(text) to authenticated,service_role;
revoke all on function public.nh7_school_path_state_v351() from public,anon,authenticated,service_role;
grant execute on function public.nh7_school_path_state_v351() to authenticated,service_role;

-- 6. Fail-closed postflight.
do $postflight$
declare
  v_def text;
  v_config text[];
  v_name text;
begin
  foreach v_name in array array['nh7_school_exam_session_v340','nh7_school_class_exam_session_v351','nh7_school_final_exam_session_v351','nh7_school_path_state_v351'] loop
    select pg_get_functiondef(p.oid),coalesce(p.proconfig,'{}'::text[])
      into v_def,v_config
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname=v_name
    order by p.oid desc limit 1;
    if not ('search_path=""'=any(v_config)) then
      raise exception 'Wave 1H-A % search_path is not pinned empty: %',v_name,v_config;
    end if;
  end loop;

  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='nh7_school_exam_session_v340' limit 1;
  if v_def not ilike '%a.user_id=v_uid%'
     or v_def not ilike '%a.user_id is null%'
     or v_def not ilike '%v_seed_email%'
     or v_def not ilike '%_nh7_secure_server_scoring%' then
    raise exception 'Wave 1H-A base exam session postflight failed';
  end if;

  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='nh7_school_class_exam_session_v351' limit 1;
  if v_def not ilike '%a.user_id=v_uid%'
     or v_def not ilike '%p.user_id=v_uid%'
     or v_def not ilike '%source_registration_id%'
     or v_def not ilike '%path_version%v351-hotfix1%' then
    raise exception 'Wave 1H-A class session postflight failed';
  end if;

  if has_function_privilege('anon','public.nh7_school_path_state_v351()','EXECUTE')
     or has_function_privilege('anon','public.nh7_school_exam_session_v340(text,text)','EXECUTE')
     or has_function_privilege('anon','public.nh7_school_class_exam_session_v351(text)','EXECUTE')
     or has_function_privilege('anon','public.nh7_school_final_exam_session_v351(text)','EXECUTE')
     or not has_function_privilege('authenticated','public.nh7_school_path_state_v351()','EXECUTE')
     or not has_function_privilege('authenticated','public.nh7_school_exam_session_v340(text,text)','EXECUTE')
     or not has_function_privilege('authenticated','public.nh7_school_class_exam_session_v351(text)','EXECUTE')
     or not has_function_privilege('authenticated','public.nh7_school_final_exam_session_v351(text)','EXECUTE') then
    raise exception 'Wave 1H-A RPC ACL postflight failed';
  end if;
end
$postflight$;

notify pgrst,'reload schema';
