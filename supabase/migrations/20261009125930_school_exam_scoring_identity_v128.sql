-- New Hope 7 — School Exam Scoring Identity v128
-- Wave 1H-B1: make assignment scoring / exam recalculation durable-user-id first.
-- No existing School rows, RLS policies, certificates, Storage objects, or submit RPCs are changed here.

do $preflight$
declare
  v_def text;
  v_bad bigint;
begin
  if to_regprocedure('public.nh7_assignment_score_for_user(text,text)') is null
     or to_regprocedure('public.nh7_recalculate_exam_scores(text,text)') is null
     or to_regprocedure('public.nh7_assignment_recalculate_trigger()') is null then
    raise exception 'Wave 1H-B1 scoring baseline is missing';
  end if;

  if to_regprocedure('private.nh7_assignment_score_for_identity_v128(uuid,text,text)') is not null
     or to_regprocedure('private.nh7_recalculate_exam_scores_identity_v128(uuid,text,text)') is not null then
    raise exception 'Wave 1H-B1 is already or partially applied';
  end if;

  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='nh7_assignment_recalculate_trigger'
  limit 1;
  if v_def not ilike '%public.nh7_recalculate_exam_scores%'
     or v_def ilike '%private.nh7_recalculate_exam_scores_identity_v128%' then
    raise exception 'Assignment recalculation trigger baseline drifted';
  end if;

  select count(*) into v_bad from (
    select user_id,lesson_code from public.school_assignments
    where user_id is not null group by user_id,lesson_code having count(*)>1
    union all
    select user_id,lesson_code from public.school_progress
    where user_id is not null group by user_id,lesson_code having count(*)>1
    union all
    select user_id,exam_id::text||':'||attempt_number::text from public.school_exam_attempts
    where user_id is not null group by user_id,exam_id,attempt_number having count(*)>1
  ) d;
  if v_bad<>0 then raise exception 'Wave 1H-B1 duplicate durable identity groups=%',v_bad; end if;

  select count(*) into v_bad from (
    select user_id from public.school_assignments
    union all select user_id from public.school_progress
    union all select user_id from public.school_exam_attempts
  ) x where user_id is null;
  if v_bad<>0 then raise exception 'Wave 1H-B1 expected current School activity fully bound; null user_id rows=%',v_bad; end if;
end
$preflight$;

create or replace function private.nh7_assignment_score_for_identity_v128(
  p_user_id uuid,
  p_user_email text,
  p_course_code text
)
returns table(score_percent integer,completed_count integer,total_count integer)
language sql
stable
security definer
set search_path=''
as $function$
with expected as (
  select l.lesson_code,public.nh7_assignment_unit_key(l.lesson_code) as unit_key
  from public.school_lessons l
  where l.is_active is not false
    and coalesce(nullif(l.content_data #>> '{course,code}',''),'foundation_school')=coalesce(nullif(p_course_code,''),'foundation_school')
    and (
      length(trim(coalesce(l.content_data #>> '{translations,fa,assignment_question}','')))>0 or
      length(trim(coalesce(l.content_data #>> '{translations,en,assignment_question}','')))>0 or
      length(trim(coalesce(l.content_data #>> '{translations,hr,assignment_question}','')))>0
    )
), per_lesson as (
  select e.unit_key,e.lesson_code,
    case when lower(coalesce(a.status,''))='approved' then greatest(0,least(100,coalesce(a.score_percent,0))) else 0 end as lesson_score,
    case when lower(coalesce(a.status,''))='approved' then 1 else 0 end as lesson_complete
  from expected e
  left join public.school_assignments a
    on a.lesson_code=e.lesson_code
   and (
     (p_user_id is not null and a.user_id=p_user_id)
     or (
       a.user_id is null
       and coalesce(trim(p_user_email),'')<>''
       and lower(trim(a.user_email))=lower(trim(p_user_email))
     )
   )
), per_unit as (
  select unit_key,round(avg(lesson_score))::integer as unit_score,min(lesson_complete)::integer as unit_complete
  from per_lesson group by unit_key
)
select coalesce(round(avg(unit_score))::integer,100),
       coalesce(sum(unit_complete),0)::integer,
       count(*)::integer
from per_unit
$function$;

revoke all on function private.nh7_assignment_score_for_identity_v128(uuid,text,text)
  from public,anon,authenticated,service_role;
grant execute on function private.nh7_assignment_score_for_identity_v128(uuid,text,text)
  to service_role;

create or replace function private.nh7_recalculate_exam_scores_identity_v128(
  p_user_id uuid,
  p_user_email text,
  p_course_code text default 'foundation_school'
)
returns void
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_email text:=lower(trim(coalesce(p_user_email,'')));
  v_write_email text:=v_email;
  v_course text:=coalesce(nullif(trim(p_course_code),''),'foundation_school');
  v_score integer:=100;
  v_completed integer:=0;
  v_total integer:=0;
  v_attempt public.school_exam_attempts%rowtype;
  v_objective integer;
  v_final integer;
  v_any_pass boolean;
  v_exam_weight integer;
  v_assignment_weight integer;
  v_passing_score integer;
  v_best_user_name text;
  v_best_exam_id uuid;
  v_best_final integer;
  v_best_objective integer;
  v_best_assignment integer;
  v_best_submitted timestamptz;
begin
  if p_user_id is null and v_email='' then
    return;
  end if;

  if p_user_id is not null then
    select lower(trim(u.email)) into v_write_email
    from auth.users u where u.id=p_user_id limit 1;
    v_write_email:=coalesce(nullif(v_write_email,''),v_email);
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('nh7-exam-recalc|'||coalesce(p_user_id::text,v_email)||'|'||v_course,0)
  );

  select s.score_percent,s.completed_count,s.total_count
    into v_score,v_completed,v_total
  from private.nh7_assignment_score_for_identity_v128(p_user_id,v_email,v_course) s;
  v_score:=coalesce(v_score,100);
  v_completed:=coalesce(v_completed,0);
  v_total:=coalesce(v_total,0);

  for v_attempt in
    select sea.*
    from public.school_exam_attempts sea
    join public.school_exams se on se.id=sea.exam_id
    where (
      (p_user_id is not null and sea.user_id=p_user_id)
      or (
        sea.user_id is null and v_email<>''
        and lower(trim(sea.user_email))=v_email
      )
    )
      and se.exam_scope='course'
      and se.course_code=v_course
  loop
    select coalesce(exam_weight,70),coalesce(assignment_weight,30),coalesce(passing_score,70)
      into v_exam_weight,v_assignment_weight,v_passing_score
    from public.school_exams where id=v_attempt.exam_id;

    if not found then
      v_exam_weight:=70; v_assignment_weight:=30; v_passing_score:=70;
    end if;

    v_objective:=case
      when coalesce(v_attempt.total_questions,0)>0
        then round(coalesce(v_attempt.correct_count,0)::numeric*100/greatest(1,v_attempt.total_questions))::integer
      else coalesce(v_attempt.objective_score_percent,0)
    end;
    v_final:=round(
      (v_objective*v_exam_weight+v_score*v_assignment_weight)::numeric /
      greatest(1,v_exam_weight+v_assignment_weight)
    )::integer;

    update public.school_exam_attempts
       set objective_score_percent=v_objective,
           assignment_score_percent=v_score,
           assignment_completed_count=v_completed,
           assignment_total_count=v_total,
           final_score_percent=v_final,
           score_percent=v_final,
           passed=(v_final>=v_passing_score)
     where id=v_attempt.id;
  end loop;

  select exists(
    select 1
    from public.school_exam_attempts sea
    join public.school_exams se on se.id=sea.exam_id
    where (
      (p_user_id is not null and sea.user_id=p_user_id)
      or (sea.user_id is null and v_email<>'' and lower(trim(sea.user_email))=v_email)
    )
      and se.exam_scope='course'
      and se.course_code=v_course
      and sea.passed=true
  ) into v_any_pass;

  select sea.user_name,sea.exam_id,sea.final_score_percent,sea.objective_score_percent,
         sea.assignment_score_percent,sea.submitted_at
    into v_best_user_name,v_best_exam_id,v_best_final,v_best_objective,v_best_assignment,v_best_submitted
  from public.school_exam_attempts sea
  join public.school_exams se on se.id=sea.exam_id
  where (
    (p_user_id is not null and sea.user_id=p_user_id)
    or (sea.user_id is null and v_email<>'' and lower(trim(sea.user_email))=v_email)
  )
    and se.exam_scope='course'
    and se.course_code=v_course
  order by sea.final_score_percent desc,sea.submitted_at desc
  limit 1;

  if found then
    if p_user_id is not null then
      update public.school_progress p
         set user_name=coalesce(v_best_user_name,''),
             progress_percent=case when v_any_pass then 100 else v_best_final end,
             completed_at=case when v_any_pass then coalesce(p.completed_at,now()) else null end,
             exam_id=v_best_exam_id,
             exam_score=v_best_final,
             objective_score_percent=v_best_objective,
             assignment_score_percent=v_best_assignment,
             final_score_percent=v_best_final,
             exam_passed=v_any_pass,
             exam_attempted_at=v_best_submitted,
             updated_at=now()
       where p.user_id=p_user_id
         and p.lesson_code='course:'||v_course;
    else
      update public.school_progress p
         set user_name=coalesce(v_best_user_name,''),
             progress_percent=case when v_any_pass then 100 else v_best_final end,
             completed_at=case when v_any_pass then coalesce(p.completed_at,now()) else null end,
             exam_id=v_best_exam_id,
             exam_score=v_best_final,
             objective_score_percent=v_best_objective,
             assignment_score_percent=v_best_assignment,
             final_score_percent=v_best_final,
             exam_passed=v_any_pass,
             exam_attempted_at=v_best_submitted,
             updated_at=now()
       where lower(trim(p.user_email))=v_email
         and p.lesson_code='course:'||v_course;
    end if;

    if not found then
      insert into public.school_progress(
        user_email,user_name,lesson_code,progress_percent,completed_at,exam_id,exam_score,
        objective_score_percent,assignment_score_percent,final_score_percent,
        exam_passed,exam_attempted_at,updated_at
      ) values(
        v_write_email,coalesce(v_best_user_name,''),'course:'||v_course,
        case when v_any_pass then 100 else v_best_final end,
        case when v_any_pass then now() else null end,
        v_best_exam_id,v_best_final,v_best_objective,v_best_assignment,v_best_final,
        v_any_pass,v_best_submitted,now()
      );
    end if;
  else
    -- Fail-conservative: no course exam attempts means no score row mutation.
    -- The legacy helper remains available for historical cleanup paths; this wave
    -- intentionally performs no destructive School-data operation.
    null;
  end if;
end;
$function$;

revoke all on function private.nh7_recalculate_exam_scores_identity_v128(uuid,text,text)
  from public,anon,authenticated,service_role;
grant execute on function private.nh7_recalculate_exam_scores_identity_v128(uuid,text,text)
  to service_role;

create or replace function public.nh7_assignment_recalculate_trigger()
returns trigger
language plpgsql
security definer
set search_path=''
as $function$
begin
  if tg_op='DELETE' then
    perform private.nh7_recalculate_exam_scores_identity_v128(
      old.user_id,old.user_email,coalesce(nullif(old.course_code,''),'foundation_school')
    );
    return old;
  end if;

  perform private.nh7_recalculate_exam_scores_identity_v128(
    new.user_id,new.user_email,coalesce(nullif(new.course_code,''),'foundation_school')
  );

  if tg_op='UPDATE' and (
    old.user_id is distinct from new.user_id
    or lower(trim(old.user_email))<>lower(trim(new.user_email))
    or coalesce(old.course_code,'')<>coalesce(new.course_code,'')
  ) then
    perform private.nh7_recalculate_exam_scores_identity_v128(
      old.user_id,old.user_email,coalesce(nullif(old.course_code,''),'foundation_school')
    );
  end if;
  return new;
end;
$function$;

revoke all on function public.nh7_assignment_recalculate_trigger()
  from public,anon,authenticated,service_role;
grant execute on function public.nh7_assignment_recalculate_trigger()
  to service_role;

do $postflight$
declare
  v_def text;
  v_cfg text[];
begin
  select pg_get_functiondef('private.nh7_assignment_score_for_identity_v128(uuid,text,text)'::regprocedure)
    into v_def;
  if v_def not ilike '%a.user_id=p_user_id%'
     or v_def not ilike '%a.user_id is null%' then
    raise exception 'Wave 1H-B1 assignment score postflight failed';
  end if;

  select pg_get_functiondef(p.oid),coalesce(p.proconfig,'{}'::text[])
    into v_def,v_cfg
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='private' and p.proname='nh7_recalculate_exam_scores_identity_v128'
  limit 1;
  if v_def not ilike '%sea.user_id=p_user_id%'
     or v_def not ilike '%p.user_id=p_user_id%'
     or v_def not ilike '%auth.users%'
     or not ('search_path=""'=any(v_cfg)) then
    raise exception 'Wave 1H-B1 recalculation postflight failed';
  end if;

  select pg_get_functiondef(p.oid),coalesce(p.proconfig,'{}'::text[])
    into v_def,v_cfg
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='nh7_assignment_recalculate_trigger'
  limit 1;
  if v_def not ilike '%private.nh7_recalculate_exam_scores_identity_v128%'
     or v_def ilike '%public.nh7_recalculate_exam_scores(%'
     or not ('search_path=""'=any(v_cfg)) then
    raise exception 'Wave 1H-B1 assignment trigger postflight failed';
  end if;

  if has_function_privilege('anon','private.nh7_assignment_score_for_identity_v128(uuid,text,text)','EXECUTE')
     or has_function_privilege('authenticated','private.nh7_assignment_score_for_identity_v128(uuid,text,text)','EXECUTE')
     or has_function_privilege('anon','private.nh7_recalculate_exam_scores_identity_v128(uuid,text,text)','EXECUTE')
     or has_function_privilege('authenticated','private.nh7_recalculate_exam_scores_identity_v128(uuid,text,text)','EXECUTE') then
    raise exception 'Wave 1H-B1 private helper ACL postflight failed';
  end if;
end
$postflight$;

notify pgrst,'reload schema';
