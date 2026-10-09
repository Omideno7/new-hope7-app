
create or replace function public.nh7_track_audio_session_v222(
  p_session_id text,
  p_device_id text,
  p_user_email text,
  p_media_type text,
  p_media_id text,
  p_title text,
  p_topic text,
  p_source_group text,
  p_language text,
  p_duration_seconds integer,
  p_position_seconds integer,
  p_delta_seconds integer,
  p_event text default 'progress'::text,
  p_playback_rate numeric default 1,
  p_seek_count integer default 0,
  p_started_position_seconds integer default 0
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  return true;
end;
$function$;

create or replace function public.nh7_track_content_v223(
  p_content_type text,
  p_content_id text,
  p_title text default ''::text,
  p_language text default 'fa'::text,
  p_device_id text default ''::text,
  p_user_email text default ''::text,
  p_event text default 'open'::text,
  p_engaged_seconds integer default 0
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  return true;
end;
$function$;

create or replace function public.nh7_track_app_section_v222(
  p_section text,
  p_device_id text default ''::text,
  p_user_email text default ''::text
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  return true;
end;
$function$;

create or replace function public.nh7_school_record_audio_v380(
  p_lesson_code text,
  p_position_seconds integer,
  p_duration_seconds integer,
  p_delta_seconds integer default 0,
  p_ended boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
begin
  return jsonb_build_object(
    'ok', true,
    'lesson_code', trim(coalesce(p_lesson_code,'')),
    'tracking_disabled', true,
    'completed', false
  );
end;
$function$;

create or replace function public.nh7_library_reading_record_v490(
  p_item_id uuid,
  p_language text,
  p_total_sections integer,
  p_section integer,
  p_delta_seconds integer default 0,
  p_open boolean default false
)
returns jsonb
language plpgsql
set search_path to 'public'
as $function$
begin
  return jsonb_build_object(
    'ok', true,
    'item_id', p_item_id,
    'tracking_disabled', true
  );
end;
$function$;

create or replace function public.nh7_school_gate_for_email_v381(
  p_user_email text,
  p_course_code text default 'foundation_school'::text,
  p_lesson_code text default null::text
)
returns jsonb
language plpgsql
stable security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_email text:=lower(trim(coalesce(p_user_email,'')));
  v_course text:=coalesce(nullif(trim(coalesce(p_course_code,'')),''),'foundation_school');
  v_only_lesson text:=nullif(trim(coalesce(p_lesson_code,'')),'');
  v_rows jsonb:='[]'::jsonb;
  v_missing_assignment jsonb:='[]'::jsonb;
  v_total integer:=0;
  v_assignment_done integer:=0;
  v_assignment boolean;
  v_assignment_status text;
  v_assignment_score integer;
  r record;
begin
  if v_email='' then raise exception 'login_required'; end if;
  for r in
    select l.lesson_code,l.lesson_order,
      coalesce(nullif(l.content_data#>>'{course,code}',''),'foundation_school') course_code,
      coalesce(l.content_data#>>'{translations,fa,class_title}',l.lesson_code) title_fa,
      coalesce(l.content_data#>>'{translations,en,class_title}',l.lesson_code) title_en,
      coalesce(l.content_data#>>'{translations,hr,class_title}',l.lesson_code) title_hr
    from public.school_lessons l
    where l.is_active
      and coalesce(nullif(l.content_data#>>'{course,code}',''),'foundation_school')=v_course
      and (v_only_lesson is null or l.lesson_code=v_only_lesson)
    order by l.lesson_order,l.lesson_code
  loop
    v_total:=v_total+1;
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

    if v_assignment then
      v_assignment_done:=v_assignment_done+1;
    else
      v_missing_assignment:=v_missing_assignment||jsonb_build_array(r.lesson_code);
    end if;

    v_rows:=v_rows||jsonb_build_array(jsonb_build_object(
      'lesson_code',r.lesson_code,
      'lesson_order',r.lesson_order,
      'course_code',r.course_code,
      'title_fa',r.title_fa,
      'title_en',r.title_en,
      'title_hr',r.title_hr,
      'audio_complete',true,
      'assignment_complete',v_assignment,
      'assignment_status',v_assignment_status,
      'assignment_score',v_assignment_score
    ));
  end loop;

  return jsonb_build_object(
    'ok',true,
    'course_code',v_course,
    'lesson_code',v_only_lesson,
    'total_lessons',v_total,
    'audio_completed',v_total,
    'assignments_completed',v_assignment_done,
    'all_audio_complete',true,
    'all_assignments_complete',(v_total>0 and v_assignment_done=v_total),
    'ready_for_exam',(v_total>0 and v_assignment_done=v_total),
    'missing_audio','[]'::jsonb,
    'missing_assignments',v_missing_assignment,
    'lessons',v_rows,
    'version','3.8.2-no-audio-gate'
  );
end;
$function$;

create or replace function public.nh7_school_requirements_v380(
  p_course_code text default 'foundation_school'::text
)
returns jsonb
language plpgsql
stable security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_email text:=lower(trim(coalesce(auth.jwt()->>'email','')));
  v_course text:=coalesce(nullif(trim(p_course_code),''),'foundation_school');
  v_lessons integer:=0;
  v_lesson_done integer:=0;
  v_assignment integer:=100;
  v_assignment_done integer:=0;
  v_assignment_total integer:=0;
  v_rows jsonb:='[]'::jsonb;
begin
  if auth.uid() is null or v_email='' then raise exception 'login_required'; end if;
  if not public.nh7_school_access_approved_v230(auth.uid(),v_email,'') then
    raise exception 'school_approval_required';
  end if;

  with lessons as (
    select l.lesson_code,
      coalesce(
        l.content_data#>>'{translations,fa,lesson_title}',
        l.content_data#>>'{translations,en,lesson_title}',
        l.lesson_code
      ) title
    from public.school_lessons l
    where l.is_active
      and coalesce(nullif(l.content_data#>>'{course,code}',''),'foundation_school')=v_course
  ),
  status as (
    select l.lesson_code,l.title,
      exists(
        select 1
        from public.school_progress p
        where lower(p.user_email)=v_email
          and p.lesson_code=l.lesson_code
          and (p.completed_at is not null or p.progress_percent>=100)
      ) lesson_completed
    from lessons l
  )
  select count(*)::integer,
         count(*) filter(where lesson_completed)::integer,
         coalesce(jsonb_agg(jsonb_build_object(
           'lesson_code',lesson_code,
           'title',title,
           'lesson_completed',lesson_completed,
           'audio_completed',true,
           'listened_seconds',0,
           'duration_seconds',0
         ) order by lesson_code),'[]'::jsonb)
  into v_lessons,v_lesson_done,v_rows
  from status;

  select coalesce(s.score_percent,100),
         coalesce(s.completed_count,0),
         coalesce(s.total_count,0)
  into v_assignment,v_assignment_done,v_assignment_total
  from public.nh7_assignment_score_for_user(v_email,v_course) s;

  v_assignment:=coalesce(v_assignment,100);
  v_assignment_done:=coalesce(v_assignment_done,0);
  v_assignment_total:=coalesce(v_assignment_total,0);

  return jsonb_build_object(
    'ok',true,
    'course_code',v_course,
    'lesson_count',v_lessons,
    'lessons_completed',v_lesson_done,
    'audio_completed',v_lessons,
    'assignment_completed',v_assignment_done,
    'assignment_total',v_assignment_total,
    'assignment_score',v_assignment,
    'lessons',v_rows,
    'all_lessons_complete',v_lessons>0 and v_lesson_done=v_lessons,
    'all_audio_complete',true,
    'all_assignments_complete',v_assignment_done>=v_assignment_total,
    'exam_ready',v_lessons>0 and v_lesson_done=v_lessons and v_assignment_done>=v_assignment_total,
    'tracking_disabled',true
  );
end;
$function$;
