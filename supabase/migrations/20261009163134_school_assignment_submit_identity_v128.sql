-- New Hope 7 — School Assignment Submit Identity v128
-- Wave 1I: make the active assignment-submit RPC durable Auth user_id first.
-- Preserve the existing RPC signature/return type and historical email snapshot.
-- No tables, RLS, Storage, certificates, exam-read/submit RPCs or legacy
-- versioned assignment wrappers are changed here.

do $preflight$
declare
  v_def text;
  v_bad bigint;
begin
  if to_regprocedure('public.nh7_submit_school_assignment(text,text,text,text,text)') is null
     or to_regprocedure('private.nh7_recalculate_exam_scores_identity_v128(uuid,text,text)') is null then
    raise exception 'Wave 1I baseline is missing';
  end if;

  select pg_get_functiondef('public.nh7_submit_school_assignment(text,text,text,text,text)'::regprocedure)
    into v_def;
  if v_def not ilike '%where lower(user_email)=v_email%'
     or v_def not ilike '%on conflict(user_email,lesson_code)%'
     or v_def not ilike '%public.nh7_recalculate_exam_scores%'
     or v_def ilike '%private.nh7_recalculate_exam_scores_identity_v128%' then
    raise exception 'Wave 1I assignment submit baseline drifted or is partially applied';
  end if;

  select count(*) into v_bad
  from (
    select user_id,lesson_code
    from public.school_assignments
    where user_id is not null
    group by user_id,lesson_code
    having count(*)>1
  ) d;
  if v_bad<>0 then
    raise exception 'Wave 1I duplicate durable assignment groups=%',v_bad;
  end if;

  select count(*) into v_bad from public.school_assignments where user_id is null;
  if v_bad<>0 then
    raise exception 'Wave 1I expected current assignments fully bound; null user_id rows=%',v_bad;
  end if;
end
$preflight$;

create or replace function public.nh7_submit_school_assignment(
  p_course_code text,
  p_lesson_code text,
  p_answer_text text,
  p_language text default 'en',
  p_user_name text default ''
)
returns public.school_assignments
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_email text := lower(trim(coalesce((select auth.jwt())->>'email','')));
  v_write_email text := '';
  v_course text := coalesce(nullif(trim(p_course_code),''),'foundation_school');
  v_lesson text := trim(coalesce(p_lesson_code,''));
  v_answer text := trim(coalesce(p_answer_text,''));
  v_existing public.school_assignments;
  v_row public.school_assignments;
begin
  if v_uid is null then raise exception 'Login required'; end if;
  if not public.nh7_school_access_approved_v230(v_uid,'','') then
    raise exception 'school_approval_required';
  end if;
  if v_lesson='' then raise exception 'Lesson code is required'; end if;
  if length(v_answer)<10 then raise exception 'Assignment answer is too short'; end if;

  select lower(trim(u.email)) into v_write_email
  from auth.users u where u.id=v_uid limit 1;
  v_write_email:=coalesce(nullif(v_write_email,''),nullif(v_email,''));
  if coalesce(v_write_email,'')='' then raise exception 'Login required'; end if;

  select * into v_existing
  from public.school_assignments a
  where a.lesson_code=v_lesson
    and (
      a.user_id=v_uid
      or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email)
    )
  order by case when a.user_id=v_uid then 0 else 1 end,a.updated_at desc
  limit 1
  for update;

  if found and lower(coalesce(v_existing.status,''))='approved' then
    raise exception 'assignment_already_approved';
  end if;

  if found then
    update public.school_assignments a
       set user_name=coalesce(p_user_name,''),
           course_code=v_course,
           answer_text=v_answer,
           language=case when lower(coalesce(p_language,'en')) in ('fa','en','hr') then lower(p_language) else 'en' end,
           status='submitted',
           score_percent=0,
           admin_feedback='',
           submitted_at=now(),
           reviewed_at=null,
           updated_at=now()
     where a.id=v_existing.id
     returning * into v_row;
  else
    insert into public.school_assignments(
      user_id,user_email,user_name,course_code,lesson_code,answer_text,language,
      status,score_percent,admin_feedback,submitted_at,reviewed_at,updated_at
    ) values(
      v_uid,v_write_email,coalesce(p_user_name,''),v_course,v_lesson,v_answer,
      case when lower(coalesce(p_language,'en')) in ('fa','en','hr') then lower(p_language) else 'en' end,
      'submitted',0,'',now(),null,now()
    )
    returning * into v_row;
  end if;

  perform private.nh7_recalculate_exam_scores_identity_v128(v_uid,v_email,v_course);
  return v_row;
end;
$function$;

revoke all on function public.nh7_submit_school_assignment(text,text,text,text,text)
  from public,anon,authenticated,service_role;
grant execute on function public.nh7_submit_school_assignment(text,text,text,text,text)
  to authenticated,service_role;

do $postflight$
declare
  v_def text;
  v_cfg text[];
begin
  select pg_get_functiondef(p.oid),coalesce(p.proconfig,'{}'::text[])
    into v_def,v_cfg
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='nh7_submit_school_assignment'
  limit 1;

  if v_def not ilike '%a.user_id=v_uid%'
     or v_def not ilike '%where a.id=v_existing.id%'
     or v_def not ilike '%private.nh7_recalculate_exam_scores_identity_v128%'
     or v_def ilike '%on conflict(user_email,lesson_code)%'
     or not ('search_path=""'=any(v_cfg)) then
    raise exception 'Wave 1I assignment submit postflight failed';
  end if;

  if has_function_privilege('anon','public.nh7_submit_school_assignment(text,text,text,text,text)','EXECUTE')
     or has_function_privilege('public','public.nh7_submit_school_assignment(text,text,text,text,text)','EXECUTE')
     or not has_function_privilege('authenticated','public.nh7_submit_school_assignment(text,text,text,text,text)','EXECUTE')
     or not has_function_privilege('service_role','public.nh7_submit_school_assignment(text,text,text,text,text)','EXECUTE') then
    raise exception 'Wave 1I assignment submit ACL postflight failed';
  end if;
end
$postflight$;

notify pgrst,'reload schema';