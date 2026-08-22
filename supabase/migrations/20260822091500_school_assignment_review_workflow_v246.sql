-- New Hope 7 v2.4.6 — professional school assignment review workflow
-- RC ONLY until explicitly released. Do not apply to production before QA approval.

begin;

-- New homework is ungraded until an administrator reviews it.
alter table public.school_assignments
  alter column score_percent set default 0;

create or replace function public.nh7_submit_school_assignment(
  p_course_code text,
  p_lesson_code text,
  p_answer_text text,
  p_language text default 'en'::text,
  p_user_name text default ''::text
)
returns public.school_assignments
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_email text := lower(trim(coalesce(auth.jwt()->>'email','')));
  v_existing public.school_assignments;
  v_row public.school_assignments;
begin
  if v_email='' then
    raise exception 'Login required';
  end if;
  if trim(coalesce(p_lesson_code,''))='' then
    raise exception 'Lesson code is required';
  end if;
  if length(trim(coalesce(p_answer_text,'')))<10 then
    raise exception 'Assignment answer is too short';
  end if;

  select * into v_existing
  from public.school_assignments
  where lower(user_email)=v_email
    and lesson_code=trim(p_lesson_code)
  for update;

  -- Approved work is locked. An admin can delete it if a true restart is required.
  if found and lower(coalesce(v_existing.status,''))='approved' then
    raise exception 'assignment_already_approved';
  end if;

  insert into public.school_assignments(
    user_email,user_name,course_code,lesson_code,answer_text,language,
    status,score_percent,admin_feedback,submitted_at,reviewed_at,updated_at
  )
  values(
    v_email,
    coalesce(p_user_name,''),
    coalesce(nullif(trim(p_course_code),''),'foundation_school'),
    trim(p_lesson_code),
    trim(p_answer_text),
    case when lower(coalesce(p_language,'en')) in ('fa','en','hr')
      then lower(p_language) else 'en' end,
    'submitted',0,'',now(),null,now()
  )
  on conflict(user_email,lesson_code) do update set
    user_name=excluded.user_name,
    course_code=excluded.course_code,
    answer_text=excluded.answer_text,
    language=excluded.language,
    status='submitted',
    score_percent=0,
    admin_feedback='',
    submitted_at=now(),
    reviewed_at=null,
    updated_at=now()
  returning * into v_row;

  perform public.nh7_recalculate_exam_scores(v_row.user_email,v_row.course_code);
  return v_row;
end;
$function$;

create or replace function public.nh7_admin_review_school_assignment(
  p_id uuid,
  p_status text,
  p_score integer,
  p_feedback text default ''::text
)
returns public.school_assignments
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_row public.school_assignments;
  v_status text := lower(coalesce(p_status,''));
  v_score integer := greatest(0,least(100,coalesce(p_score,0)));
begin
  if not coalesce(public.nh7_admin_is_admin_v170(), false) then
    raise exception 'Admin access required';
  end if;
  if v_status not in ('approved','needs_revision','submitted') then
    raise exception 'Invalid assignment status';
  end if;

  update public.school_assignments
  set status=v_status,
      score_percent=v_score,
      admin_feedback=coalesce(p_feedback,''),
      reviewed_at=case when v_status in ('approved','needs_revision') then now() else null end,
      updated_at=now()
  where id=p_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Assignment not found';
  end if;

  perform public.nh7_recalculate_exam_scores(v_row.user_email,v_row.course_code);
  return v_row;
end;
$function$;

-- Only admin-approved assignments count toward course/final exam scoring.
create or replace function public.nh7_assignment_score_for_user(
  p_user_email text,
  p_course_code text
)
returns table(score_percent integer, completed_count integer, total_count integer)
language sql
stable
security definer
set search_path to 'public'
as $function$
with expected as (
  select l.lesson_code, public.nh7_assignment_unit_key(l.lesson_code) as unit_key
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
    case when lower(coalesce(a.status,''))='approved'
      then greatest(0,least(100,coalesce(a.score_percent,0))) else 0 end as lesson_score,
    case when lower(coalesce(a.status,''))='approved' then 1 else 0 end as lesson_complete
  from expected e
  left join public.school_assignments a
    on lower(a.user_email)=lower(trim(p_user_email)) and a.lesson_code=e.lesson_code
), per_unit as (
  select unit_key,
         round(avg(lesson_score))::integer as unit_score,
         min(lesson_complete)::integer as unit_complete
  from per_lesson
  group by unit_key
)
select coalesce(round(avg(unit_score))::integer,100),
       coalesce(sum(unit_complete),0)::integer,
       count(*)::integer
from per_unit
$function$;

-- Hard-delete one submission so the student can start that assignment again.
create or replace function public.nh7_admin_delete_school_assignment(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_row public.school_assignments;
begin
  if not coalesce(public.nh7_admin_is_admin_v170(), false) then
    raise exception 'Admin access required';
  end if;

  select * into v_row
  from public.school_assignments
  where id=p_id
  for update;

  if v_row.id is null then
    return false;
  end if;

  delete from public.school_assignments where id=p_id;
  perform public.nh7_recalculate_exam_scores(v_row.user_email,v_row.course_code);
  return true;
end;
$function$;

grant execute on function public.nh7_submit_school_assignment(text,text,text,text,text) to authenticated;
grant execute on function public.nh7_admin_review_school_assignment(uuid,text,integer,text) to authenticated;
grant execute on function public.nh7_admin_delete_school_assignment(uuid) to authenticated;
grant execute on function public.nh7_assignment_score_for_user(text,text) to authenticated;

-- Three attempts are the standard for every active school exam.
alter table public.school_exams
  alter column max_attempts set default 3;

update public.school_exams
set max_attempts=3,
    updated_at=now()
where is_active is not false
  and coalesce(max_attempts,0)<>3;

commit;
