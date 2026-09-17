-- New Hope 7 — School Path v3.5.0 production candidate
-- ADDITIVE ONLY. Prepared for QA; do not apply to production until approved.
-- Keeps all existing lessons, audio, assignments, progress, attempts and final exams.

-- 1) Build seven class exams from the already-published 50-question final bank.
--    Class 4 combines the existing 4A + 4B question sections.
with source_exam as (
  select e.*
  from public.school_exams e
  where e.is_active = true
    and e.exam_scope = 'course'
    and e.course_code = 'foundation_school'
  order by e.require_assignments_before_exam desc, e.created_at asc
  limit 1
), class_defs(class_key, sort_order, q_from, q_to, title_fa, title_en, title_hr) as (
  values
    ('class_01',1, 1, 7,'آزمون کلاس ۱','Class 1 Exam','Ispit razreda 1'),
    ('class_02',2, 8,14,'آزمون کلاس ۲','Class 2 Exam','Ispit razreda 2'),
    ('class_03',3,15,20,'آزمون کلاس ۳','Class 3 Exam','Ispit razreda 3'),
    ('class_04',4,21,32,'آزمون کلاس ۴','Class 4 Exam','Ispit razreda 4'),
    ('class_05',5,33,39,'آزمون کلاس ۵','Class 5 Exam','Ispit razreda 5'),
    ('class_06',6,40,44,'آزمون کلاس ۶','Class 6 Exam','Ispit razreda 6'),
    ('class_07',7,45,50,'آزمون کلاس ۷','Class 7 Exam','Ispit razreda 7')
)
insert into public.school_exams(
  lesson_code,title_fa,title_en,title_hr,passing_score,max_attempts,sort_order,questions,is_active,
  exam_scope,course_code,intro_fa,intro_en,intro_hr,pass_message_fa,pass_message_en,pass_message_hr,
  fail_message_fa,fail_message_en,fail_message_hr,duration_minutes,shuffle_questions,show_answers,
  require_course_completion,exam_weight,assignment_weight,questions_per_attempt,require_assignments_before_exam
)
select
  'class_exam:'||d.class_key,
  d.title_fa,d.title_en,d.title_hr,
  s.passing_score,s.max_attempts,d.sort_order,
  (
    select coalesce(jsonb_agg(x.q order by x.ord),'[]'::jsonb)
    from jsonb_array_elements(s.questions) with ordinality as x(q,ord)
    where x.ord between d.q_from and d.q_to
  ),
  true,'class','foundation_school',
  'پس از تکمیل درس‌های این کلاس و تأیید تکالیف توسط ادمین، به همه سؤال‌ها پاسخ دهید.',
  'After completing this class and receiving admin approval for its assignments, answer every question.',
  'Nakon dovršetka ovog razreda i odobrenja zadataka od administratora odgovorite na sva pitanja.',
  'تبریک! این کلاس را با موفقیت گذراندید.',
  'Congratulations! You passed this class.',
  'Čestitamo! Položili ste ovaj razred.',
  'این تلاش قبول نشد. درس‌های این کلاس را از ابتدا مرور و دوباره تکمیل کنید، سپس دوباره امتحان بدهید.',
  'This attempt did not pass. Repeat this class from the beginning, complete its lessons again, then retake the exam.',
  'Ovaj pokušaj nije bio dovoljan. Ponovite razred od početka, ponovno dovršite lekcije i zatim ponovno pristupite ispitu.',
  0,false,'after_submit',false,100,0,0,true
from source_exam s
cross join class_defs d
where not exists (
  select 1 from public.school_exams e
  where e.exam_scope='class'
    and e.course_code='foundation_school'
    and e.lesson_code='class_exam:'||d.class_key
);

-- 2) Secure server-side state for one class.
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
begin
  if auth.role()<>'authenticated' or auth.uid() is null or v_email='' then
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

  -- On the first cycle, normal completion is enough.
  -- After a failed class exam, every lesson must be completed again AFTER that failed attempt.
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

  -- Only lessons that actually contain an assignment question are counted.
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

  -- Do not expose questions before the gate is satisfied.
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
    'last_failed_at',v_last_failed
  );
end;
$$;

-- 3) Secure submit wrapper for class exams. It re-checks every gate server-side.
create or replace function public.nh7_submit_school_class_exam_v350(
  p_class_key text,
  p_exam_id uuid,
  p_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_state jsonb;
  v_expected uuid;
begin
  v_state:=public.nh7_school_class_exam_session_v350(p_class_key);
  if not coalesce((v_state->>'class_unlocked')::boolean,false) then raise exception 'previous_class_required'; end if;
  if coalesce((v_state->>'passed_already')::boolean,false) then raise exception 'exam_already_passed'; end if;
  if not coalesce((v_state->>'lessons_complete')::boolean,false) then raise exception 'class_lessons_required'; end if;
  if not coalesce((v_state->>'assignments_approved')::boolean,false) then raise exception 'class_assignments_required'; end if;
  if not coalesce((v_state->>'ready')::boolean,false) then raise exception 'class_exam_not_ready'; end if;
  v_expected:=nullif(v_state#>>'{exam,id}','')::uuid;
  if v_expected is null or v_expected<>p_exam_id then raise exception 'invalid_exam_id'; end if;
  return public.nh7_submit_school_exam_v340(p_exam_id,p_answers);
end;
$$;

-- 4) Final-exam gate: all seven class exams must be passed first.
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
  v_base jsonb := '{}'::jsonb;
  v_ready boolean := false;
begin
  if auth.role()<>'authenticated' or auth.uid() is null or v_email='' then raise exception 'login_required'; end if;
  if not public.nh7_school_access_approved_v230(auth.uid(),v_email,'') then raise exception 'school_approval_required'; end if;

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
    select public.nh7_school_exam_session_v340(v_course,null) into v_base;
    v_base:=coalesce(v_base,'{}'::jsonb);
    v_ready:=jsonb_typeof(v_base->'exam')='object'
             and not coalesce((v_base->>'passed_already')::boolean,false)
             and coalesce((v_base->>'remaining_attempts')::integer,0)>0;
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

create or replace function public.nh7_submit_school_final_exam_v350(
  p_exam_id uuid,
  p_answers jsonb,
  p_course_code text default 'foundation_school'
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_state jsonb;
  v_expected uuid;
begin
  v_state:=public.nh7_school_final_exam_session_v350(p_course_code);
  if coalesce((v_state->>'passed_classes')::integer,0)<coalesce((v_state->>'required_classes')::integer,7) then
    raise exception 'class_exams_required';
  end if;
  if not coalesce((v_state->>'ready')::boolean,false) then raise exception 'final_exam_not_ready'; end if;
  v_expected:=nullif(v_state#>>'{exam,id}','')::uuid;
  if v_expected is null or v_expected<>p_exam_id then raise exception 'invalid_exam_id'; end if;
  return public.nh7_submit_school_exam_v340(p_exam_id,p_answers);
end;
$$;

-- 5) One network call for the School dashboard.
create or replace function public.nh7_school_path_state_v350()
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
begin
  return jsonb_build_object(
    'classes',jsonb_build_array(
      public.nh7_school_class_exam_session_v350('class_01'),
      public.nh7_school_class_exam_session_v350('class_02'),
      public.nh7_school_class_exam_session_v350('class_03'),
      public.nh7_school_class_exam_session_v350('class_04'),
      public.nh7_school_class_exam_session_v350('class_05'),
      public.nh7_school_class_exam_session_v350('class_06'),
      public.nh7_school_class_exam_session_v350('class_07')
    ),
    'final',public.nh7_school_final_exam_session_v350('foundation_school')
  );
end;
$$;

revoke all on function public.nh7_school_class_exam_session_v350(text) from public;
revoke all on function public.nh7_submit_school_class_exam_v350(text,uuid,jsonb) from public;
revoke all on function public.nh7_school_final_exam_session_v350(text) from public;
revoke all on function public.nh7_submit_school_final_exam_v350(uuid,jsonb,text) from public;
revoke all on function public.nh7_school_path_state_v350() from public;

grant execute on function public.nh7_school_class_exam_session_v350(text) to authenticated;
grant execute on function public.nh7_submit_school_class_exam_v350(text,uuid,jsonb) to authenticated;
grant execute on function public.nh7_school_final_exam_session_v350(text) to authenticated;
grant execute on function public.nh7_submit_school_final_exam_v350(uuid,jsonb,text) to authenticated;
grant execute on function public.nh7_school_path_state_v350() to authenticated;
