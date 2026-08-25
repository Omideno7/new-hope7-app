-- New Hope 7 QA v3.7.3
-- Require completion of each School audio before its assignment, and require
-- all audios + all assignments before the final exam. New RPC names keep this
-- isolated from production clients until the QA branch is approved.

create or replace function public.nh7_school_gate_for_email_v373(
  p_user_email text,
  p_course_code text default 'foundation_school',
  p_lesson_code text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = 'public','pg_catalog'
as $$
declare
  v_email text := lower(trim(coalesce(p_user_email,'')));
  v_course text := coalesce(nullif(trim(coalesce(p_course_code,'')),''),'foundation_school');
  v_only_lesson text := nullif(trim(coalesce(p_lesson_code,'')),'');
  v_rows jsonb := '[]'::jsonb;
  v_missing_audio jsonb := '[]'::jsonb;
  v_missing_assignment jsonb := '[]'::jsonb;
  v_total integer := 0;
  v_audio_done integer := 0;
  v_assignment_done integer := 0;
  v_audio boolean;
  v_assignment boolean;
  v_assignment_status text;
  v_assignment_score integer;
  r record;
begin
  if v_email='' then raise exception 'login_required'; end if;

  for r in
    select l.lesson_code,l.lesson_order,
           coalesce(nullif(l.content_data#>>'{course,code}',''),'foundation_school') as course_code,
           coalesce(l.content_data#>>'{translations,fa,class_title}',l.lesson_code) as title_fa,
           coalesce(l.content_data#>>'{translations,en,class_title}',l.lesson_code) as title_en,
           coalesce(l.content_data#>>'{translations,hr,class_title}',l.lesson_code) as title_hr
    from public.school_lessons l
    where l.is_active
      and coalesce(nullif(l.content_data#>>'{course,code}',''),'foundation_school')=v_course
      and (v_only_lesson is null or l.lesson_code=v_only_lesson)
    order by l.lesson_order,l.lesson_code
  loop
    v_total:=v_total+1;
    select exists(
      select 1 from public.nh7_audio_sessions s
      where lower(trim(coalesce(s.user_email,'')))=v_email
        and s.media_type='school'
        and s.media_id=r.lesson_code
        and s.completed=true
        and (s.duration_seconds<=0 or greatest(s.max_position_seconds,s.listened_seconds)>=floor(s.duration_seconds*.90))
    ) into v_audio;

    select coalesce(a.status,''),coalesce(a.score_percent,0),
           (length(trim(coalesce(a.answer_text,'')))>=40
            and lower(trim(coalesce(a.status,''))) not in ('rejected','deleted','removed'))
      into v_assignment_status,v_assignment_score,v_assignment
    from public.school_assignments a
    where lower(trim(a.user_email))=v_email and a.lesson_code=r.lesson_code
    limit 1;

    v_assignment:=coalesce(v_assignment,false);
    v_assignment_status:=coalesce(v_assignment_status,'');
    v_assignment_score:=coalesce(v_assignment_score,0);
    if v_audio then v_audio_done:=v_audio_done+1; else v_missing_audio:=v_missing_audio||jsonb_build_array(r.lesson_code); end if;
    if v_assignment then v_assignment_done:=v_assignment_done+1; else v_missing_assignment:=v_missing_assignment||jsonb_build_array(r.lesson_code); end if;

    v_rows:=v_rows||jsonb_build_array(jsonb_build_object(
      'lesson_code',r.lesson_code,'lesson_order',r.lesson_order,'course_code',r.course_code,
      'title_fa',r.title_fa,'title_en',r.title_en,'title_hr',r.title_hr,
      'audio_complete',v_audio,'assignment_complete',v_assignment,
      'assignment_status',v_assignment_status,'assignment_score',v_assignment_score
    ));
  end loop;

  return jsonb_build_object(
    'ok',true,'course_code',v_course,'lesson_code',v_only_lesson,'total_lessons',v_total,
    'audio_completed',v_audio_done,'assignments_completed',v_assignment_done,
    'all_audio_complete',(v_total>0 and v_audio_done=v_total),
    'all_assignments_complete',(v_total>0 and v_assignment_done=v_total),
    'ready_for_exam',(v_total>0 and v_audio_done=v_total and v_assignment_done=v_total),
    'missing_audio',v_missing_audio,'missing_assignments',v_missing_assignment,'lessons',v_rows
  );
end;
$$;
revoke all on function public.nh7_school_gate_for_email_v373(text,text,text) from public,anon,authenticated;

create or replace function public.nh7_school_gate_status_v373(
  p_course_code text default 'foundation_school',p_lesson_code text default null
)
returns jsonb language plpgsql stable security definer
set search_path='public','pg_catalog'
as $$
declare v_email text:=lower(trim(coalesce(auth.jwt()->>'email','')));
begin
  if auth.uid() is null or v_email='' then raise exception 'login_required'; end if;
  if not public.nh7_school_access_approved_v230(auth.uid(),v_email,'') then raise exception 'school_approval_required'; end if;
  return public.nh7_school_gate_for_email_v373(v_email,p_course_code,p_lesson_code);
end;
$$;
revoke all on function public.nh7_school_gate_status_v373(text,text) from public,anon;
grant execute on function public.nh7_school_gate_status_v373(text,text) to authenticated;

create or replace function public.nh7_submit_school_assignment_v373(
  p_course_code text,p_lesson_code text,p_answer_text text,
  p_language text default 'en',p_user_name text default ''
)
returns public.school_assignments language plpgsql security definer
set search_path='public','pg_catalog'
as $$
declare
  v_email text:=lower(trim(coalesce(auth.jwt()->>'email','')));
  v_gate jsonb;v_answer text:=trim(coalesce(p_answer_text,''));
begin
  if auth.uid() is null or v_email='' then raise exception 'login_required'; end if;
  if not public.nh7_school_access_approved_v230(auth.uid(),v_email,'') then raise exception 'school_approval_required'; end if;
  if length(v_answer)<40 or length(regexp_replace(v_answer,'\s+','','g'))<30 then raise exception 'assignment_answer_too_short'; end if;
  v_gate:=public.nh7_school_gate_for_email_v373(v_email,coalesce(nullif(trim(coalesce(p_course_code,'')),''),'foundation_school'),p_lesson_code);
  if coalesce((v_gate->>'total_lessons')::integer,0)<>1 then raise exception 'lesson_not_found'; end if;
  if coalesce((v_gate->>'all_audio_complete')::boolean,false) is not true then raise exception 'audio_completion_required'; end if;
  return public.nh7_submit_school_assignment(p_course_code,p_lesson_code,v_answer,p_language,p_user_name);
end;
$$;
revoke all on function public.nh7_submit_school_assignment_v373(text,text,text,text,text) from public,anon;
grant execute on function public.nh7_submit_school_assignment_v373(text,text,text,text,text) to authenticated;

create or replace function public.nh7_school_exam_session_v373(
  p_course_code text default null,p_lesson_code text default null
)
returns jsonb language plpgsql stable security definer
set search_path='public','pg_catalog'
as $$
declare
  v_email text:=lower(trim(coalesce(auth.jwt()->>'email','')));
  v_course text:=coalesce(nullif(trim(coalesce(p_course_code,'')),''),'foundation_school');
  v_gate jsonb;v_result jsonb;v_exam jsonb;
begin
  if auth.uid() is null or v_email='' then raise exception 'login_required'; end if;
  if not public.nh7_school_access_approved_v230(auth.uid(),v_email,'') then raise exception 'school_approval_required'; end if;
  v_gate:=public.nh7_school_gate_for_email_v373(v_email,v_course,null);
  select to_jsonb(e)-'questions' into v_exam from public.school_exams e
   where e.is_active and e.exam_scope='course' and e.course_code=v_course
   order by e.sort_order,e.created_at limit 1;
  if v_exam is null then return jsonb_build_object('ok',true,'allowed',false,'reason','exam_not_found','exam',null,'gate',v_gate); end if;
  if coalesce((v_gate->>'all_audio_complete')::boolean,false) is not true then return jsonb_build_object('ok',true,'allowed',false,'reason','audio_completion_required','exam',v_exam,'gate',v_gate); end if;
  if coalesce((v_gate->>'all_assignments_complete')::boolean,false) is not true then return jsonb_build_object('ok',true,'allowed',false,'reason','assignments_required','exam',v_exam,'gate',v_gate); end if;
  v_result:=public.nh7_school_exam_session_v340(v_course,p_lesson_code);
  return coalesce(v_result,'{}'::jsonb)||jsonb_build_object('allowed',true,'reason','','gate',v_gate);
end;
$$;
revoke all on function public.nh7_school_exam_session_v373(text,text) from public,anon;
grant execute on function public.nh7_school_exam_session_v373(text,text) to authenticated;

create or replace function public.nh7_submit_school_exam_v373(p_exam_id uuid,p_answers jsonb)
returns jsonb language plpgsql security definer
set search_path='public','pg_catalog'
as $$
declare
  v_email text:=lower(trim(coalesce(auth.jwt()->>'email','')));
  v_course text;v_gate jsonb;
begin
  if auth.uid() is null or v_email='' then raise exception 'login_required'; end if;
  if not public.nh7_school_access_approved_v230(auth.uid(),v_email,'') then raise exception 'school_approval_required'; end if;
  select coalesce(nullif(trim(e.course_code),''),'foundation_school') into v_course
    from public.school_exams e where e.id=p_exam_id and e.is_active and e.exam_scope='course';
  if v_course is null then raise exception 'exam_not_found'; end if;
  v_gate:=public.nh7_school_gate_for_email_v373(v_email,v_course,null);
  if coalesce((v_gate->>'all_audio_complete')::boolean,false) is not true then raise exception 'audio_completion_required'; end if;
  if coalesce((v_gate->>'all_assignments_complete')::boolean,false) is not true then raise exception 'assignments_required'; end if;
  return public.nh7_submit_school_exam_v340(p_exam_id,p_answers);
end;
$$;
revoke all on function public.nh7_submit_school_exam_v373(uuid,jsonb) from public,anon;
grant execute on function public.nh7_submit_school_exam_v373(uuid,jsonb) to authenticated;
