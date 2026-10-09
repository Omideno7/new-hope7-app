create or replace function public.nh7_school_class_exam_session_v351(p_class_key text)
returns jsonb
language plpgsql
stable security definer
set search_path to 'public'
as $function$
declare
  v_email text := lower(trim(coalesce(auth.jwt()->>'email','')));
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
  if auth.uid() is null or v_email='' then raise exception 'login_required'; end if;
  if not public.nh7_school_access_approved_v230(auth.uid(),v_email,'') then raise exception 'school_approval_required'; end if;

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
  from public.school_legacy_progress_v542 where user_email=v_email;
  v_anchor:=coalesce(v_anchor,0);
  v_legacy_graduate:=coalesce(v_legacy_graduate,false);

  select exists(
    select 1 from public.school_exam_attempts a join public.school_exams e on e.id=a.exam_id
    where lower(a.user_email)=v_email and a.passed=true and e.exam_scope='course' and e.course_code='foundation_school'
  ) or exists(
    select 1 from public.school_progress p join public.school_exams e on e.id=p.exam_id
    where lower(p.user_email)=v_email and p.lesson_code='course:foundation_school' and coalesce(p.exam_passed,false)=true
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
        where lower(a.user_email)=v_email and a.passed=true and a.submitted_at>=v_cutoff and e.is_active=true
          and e.exam_scope='class' and e.course_code='foundation_school' and e.lesson_code='class_exam:'||v_prev
      ) into v_prev_passed;
    end if;
  end if;

  select exists(
    select 1 from public.school_exam_attempts a join public.school_exams e on e.id=a.exam_id
    where lower(a.user_email)=v_email and a.passed=true and a.submitted_at>=v_cutoff and e.is_active=true
      and e.exam_scope='class' and e.course_code='foundation_school' and e.lesson_code='class_exam:'||v_key
  ) into v_passed;

  if not v_passed then
    select max(a.submitted_at) into v_last_failed
    from public.school_exam_attempts a join public.school_exams e on e.id=a.exam_id
    where lower(a.user_email)=v_email and a.passed=false and a.submitted_at>=v_cutoff and e.is_active=true
      and e.exam_scope='class' and e.course_code='foundation_school' and e.lesson_code='class_exam:'||v_key;
  end if;

  select count(*)::integer into v_incomplete
  from unnest(v_lessons) as x(code)
  where not (
    exists(
      select 1 from public.school_progress p
      where lower(p.user_email)=v_email and p.lesson_code=x.code
        and (p.completed_at is not null or p.progress_percent>=100)
        and (v_last_failed is null or p.updated_at>v_last_failed)
    )
    or exists(
      select 1 from public.school_assignments a
      where lower(a.user_email)=v_email and a.lesson_code=x.code and lower(coalesce(a.status,''))='approved'
        and (v_last_failed is null or coalesce(a.reviewed_at,a.updated_at,a.submitted_at)>v_last_failed)
    )
  );

  select count(distinct a.lesson_code)::integer into v_assignment_approved
  from public.school_assignments a
  where lower(a.user_email)=v_email and a.lesson_code=any(v_lessons) and lower(coalesce(a.status,''))='approved';

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