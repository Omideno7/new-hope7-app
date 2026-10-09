-- New Hope 7 — School Progress Identity Save v340
-- Wave 1G only: save lesson progress by durable Auth user_id first.
-- Existing user_email snapshots remain for compatibility; no table/RLS/data migration occurs.

do $preflight$
declare
  v_def text;
  v_dup bigint;
begin
  if to_regprocedure('public.nh7_school_progress_save_v340(text,integer,timestamp with time zone)') is null then
    raise exception 'nh7_school_progress_save_v340 is required';
  end if;

  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='nh7_school_progress_save_v340' limit 1;

  if v_def not ilike '%on conflict(user_email,lesson_code)%'
     or v_def ilike '%p.user_id=v_uid%' then
    raise exception 'School progress save baseline drifted or Wave 1G partially applied';
  end if;

  select count(*) into v_dup
  from (
    select user_id,lesson_code
    from public.school_progress
    where user_id is not null
    group by user_id,lesson_code
    having count(*)>1
  ) d;
  if v_dup<>0 then raise exception 'duplicate user_id/lesson progress groups: %',v_dup; end if;

  if has_function_privilege('anon','public.nh7_school_progress_save_v340(text,integer,timestamp with time zone)','EXECUTE')
     or has_function_privilege('public','public.nh7_school_progress_save_v340(text,integer,timestamp with time zone)','EXECUTE')
     or not has_function_privilege('authenticated','public.nh7_school_progress_save_v340(text,integer,timestamp with time zone)','EXECUTE')
     or not has_function_privilege('service_role','public.nh7_school_progress_save_v340(text,integer,timestamp with time zone)','EXECUTE') then
    raise exception 'School progress save ACL baseline unexpected';
  end if;
end
$preflight$;

create or replace function public.nh7_school_progress_save_v340(
  p_lesson_code text,
  p_progress_percent integer default null,
  p_completed_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_uid uuid:=(select auth.uid());
  v_email text:=lower(trim(coalesce((select auth.jwt())->>'email','')));
  v_name text:=trim(coalesce((select auth.jwt())->'user_metadata'->>'full_name',(select auth.jwt())->'user_metadata'->>'name',''));
  v_code text:=trim(coalesce(p_lesson_code,''));
  v_progress integer:=least(100,greatest(0,coalesce(p_progress_percent,0)));
  v_row public.school_progress;
begin
  if v_uid is null or v_email='' then
    raise exception 'login_required';
  end if;
  if not public.nh7_school_access_approved_v230(v_uid,v_email,'') then
    raise exception 'school_approval_required';
  end if;
  if v_code='' or v_code like 'course:%' then
    raise exception 'invalid_lesson';
  end if;
  if not exists(select 1 from public.school_lessons l where l.lesson_code=v_code and l.is_active) then
    raise exception 'lesson_not_found';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('nh7-progress|'||v_uid::text||'|'||v_code,0));

  update public.school_progress p
     set user_name=case when v_name<>'' then v_name else p.user_name end,
         progress_percent=greatest(p.progress_percent,v_progress),
         completed_at=coalesce(p.completed_at,p_completed_at),
         updated_at=now()
   where p.user_id=v_uid
     and p.lesson_code=v_code
  returning p.* into v_row;

  if not found then
    insert into public.school_progress(
      user_email,user_name,lesson_code,progress_percent,completed_at,updated_at
    ) values(
      v_email,v_name,v_code,v_progress,p_completed_at,now()
    )
    returning * into v_row;
  end if;

  return jsonb_build_object(
    'ok',true,
    'lesson_code',v_row.lesson_code,
    'progress_percent',v_row.progress_percent,
    'completed_at',v_row.completed_at,
    'updated_at',v_row.updated_at
  );
end;
$function$;

revoke all on function public.nh7_school_progress_save_v340(text,integer,timestamp with time zone)
  from public,anon,authenticated,service_role;
grant execute on function public.nh7_school_progress_save_v340(text,integer,timestamp with time zone)
  to authenticated,service_role;

do $postflight$
declare
  v_def text;
  v_config text[];
begin
  select pg_get_functiondef(p.oid),coalesce(p.proconfig,'{}'::text[])
    into v_def,v_config
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='nh7_school_progress_save_v340' limit 1;

  if v_def not ilike '%p.user_id=v_uid%'
     or v_def not ilike '%pg_advisory_xact_lock%'
     or v_def ilike '%on conflict(user_email,lesson_code)%' then
    raise exception 'Wave 1G progress definition postflight failed';
  end if;
  if not ('search_path=""'=any(v_config)) then
    raise exception 'Wave 1G progress search_path not pinned empty: %',v_config;
  end if;
  if has_function_privilege('anon','public.nh7_school_progress_save_v340(text,integer,timestamp with time zone)','EXECUTE')
     or has_function_privilege('public','public.nh7_school_progress_save_v340(text,integer,timestamp with time zone)','EXECUTE')
     or not has_function_privilege('authenticated','public.nh7_school_progress_save_v340(text,integer,timestamp with time zone)','EXECUTE')
     or not has_function_privilege('service_role','public.nh7_school_progress_save_v340(text,integer,timestamp with time zone)','EXECUTE') then
    raise exception 'Wave 1G progress ACL postflight failed';
  end if;
end
$postflight$;

notify pgrst,'reload schema';