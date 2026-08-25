-- New Hope 7 v3.8.0 QA integration backend
-- Isolated/versioned functions for minister entitlements, School audio/assignment
-- gates, recovery eligibility, and owner-only account administration.

create extension if not exists pgcrypto;

create table if not exists public.nh7_content_entitlements_v380 (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  content_scope text not null check (content_scope in ('minister_hub','library_item','booklet','book','collection')),
  content_id text not null default '*',
  content_title text not null default '',
  active boolean not null default true,
  granted_by uuid null references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz null,
  notes text not null default '',
  updated_at timestamptz not null default now()
);
create unique index if not exists nh7_content_entitlements_v380_unique
  on public.nh7_content_entitlements_v380 (lower(user_email),content_scope,content_id);
create index if not exists nh7_content_entitlements_v380_email_idx
  on public.nh7_content_entitlements_v380 (lower(user_email)) where active;
alter table public.nh7_content_entitlements_v380 enable row level security;
revoke all on public.nh7_content_entitlements_v380 from public, anon, authenticated;

create table if not exists public.nh7_school_audio_progress_v380 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  lesson_code text not null,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  listened_seconds integer not null default 0 check (listened_seconds >= 0),
  max_position_seconds integer not null default 0 check (max_position_seconds >= 0),
  completed_at timestamptz null,
  last_event_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id,lesson_code)
);
create index if not exists nh7_school_audio_progress_v380_email_idx
  on public.nh7_school_audio_progress_v380 (lower(user_email),lesson_code);
alter table public.nh7_school_audio_progress_v380 enable row level security;
revoke all on public.nh7_school_audio_progress_v380 from public, anon, authenticated;

create table if not exists public.nh7_admin_account_actions_v380 (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid null references auth.users(id) on delete set null,
  actor_email text not null default '',
  target_email text not null,
  action text not null,
  reason text not null default '',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.nh7_admin_account_actions_v380 enable row level security;
revoke all on public.nh7_admin_account_actions_v380 from public, anon, authenticated;

create or replace function public.nh7_v380_is_owner()
returns boolean
language plpgsql
stable
security definer
set search_path='public','pg_catalog'
as $$
declare
  v_email text := lower(trim(coalesce(auth.jwt()->>'email','')));
  v_configured text := lower(trim(coalesce(nullif(current_setting('app.settings.nh7_admin_email',true),''),'omideno7church@gmail.com')));
begin
  if auth.uid() is null or v_email='' then return false; end if;
  return v_email=v_configured and coalesce(public.nh7_is_admin(),false);
exception when others then
  return false;
end;
$$;
revoke all on function public.nh7_v380_is_owner() from public,anon,authenticated;

create or replace function public.nh7_admin_completed_users_v380(
  p_search text default '',
  p_test_only boolean default false,
  p_limit integer default 250
)
returns table(
  user_id uuid,
  email text,
  full_name text,
  registration_status text,
  registered_at timestamptz,
  auth_created_at timestamptz,
  is_test boolean
)
language plpgsql
stable
security definer
set search_path='public','auth','pg_catalog'
as $$
begin
  if not public.nh7_v380_is_owner() then raise exception 'owner_required'; end if;
  return query
  with approved as (
    select distinct on (lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email',''))))
      lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email',''))) as e,
      coalesce(nullif(trim(coalesce(r.payload->>'firstName','')),''),nullif(trim(coalesce(r.payload->>'first_name','')),''),'') as fn,
      coalesce(nullif(trim(coalesce(r.payload->>'lastName','')),''),nullif(trim(coalesce(r.payload->>'last_name','')),''),'') as ln,
      lower(trim(coalesce(r.status,''))) as st,
      r.created_at
    from public.registrations r
    where lower(trim(coalesce(r.type,'')))='school'
      and lower(trim(coalesce(r.status,''))) in ('approved','active')
      and lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))<>''
    order by lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email',''))),r.updated_at desc nulls last,r.created_at desc
  )
  select u.id,
    lower(trim(u.email)) as email,
    trim(coalesce(nullif(a.fn||' '||a.ln,' '),u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name','')) as full_name,
    a.st,
    a.created_at,
    u.created_at,
    (
      lower(coalesce(u.email,'')) ~ '(^|[+._-])(test|demo|qa|sample|dummy)([+._@-]|$)'
      or coalesce((u.raw_user_meta_data->>'is_test')::boolean,false)
      or coalesce((u.raw_app_meta_data->>'is_test')::boolean,false)
    ) as is_test
  from auth.users u
  join approved a on a.e=lower(trim(u.email))
  where (
    trim(coalesce(p_search,''))=''
    or lower(coalesce(u.email,'')) like '%'||lower(trim(p_search))||'%'
    or lower(trim(coalesce(a.fn,'')||' '||coalesce(a.ln,''))) like '%'||lower(trim(p_search))||'%'
  )
  and (
    not coalesce(p_test_only,false)
    or lower(coalesce(u.email,'')) ~ '(^|[+._-])(test|demo|qa|sample|dummy)([+._@-]|$)'
    or coalesce((u.raw_user_meta_data->>'is_test')::boolean,false)
    or coalesce((u.raw_app_meta_data->>'is_test')::boolean,false)
  )
  order by u.created_at desc
  limit greatest(1,least(coalesce(p_limit,250),500));
end;
$$;
revoke all on function public.nh7_admin_completed_users_v380(text,boolean,integer) from public,anon;
grant execute on function public.nh7_admin_completed_users_v380(text,boolean,integer) to authenticated;

create or replace function public.nh7_owner_set_content_access_v380(
  p_user_email text,
  p_content_scope text,
  p_content_id text default '*',
  p_content_title text default '',
  p_active boolean default true,
  p_notes text default ''
)
returns jsonb
language plpgsql
security definer
set search_path='public','auth','pg_catalog'
as $$
declare
  v_email text := lower(trim(coalesce(p_user_email,'')));
  v_scope text := lower(trim(coalesce(p_content_scope,'')));
  v_id text := trim(coalesce(nullif(p_content_id,''),'*'));
begin
  if not public.nh7_v380_is_owner() then raise exception 'owner_required'; end if;
  if v_email='' or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then raise exception 'invalid_email'; end if;
  if v_scope not in ('minister_hub','library_item','booklet','book','collection') then raise exception 'invalid_scope'; end if;
  if not exists(
    select 1 from public.registrations r
    where lower(trim(coalesce(r.type,'')))='school'
      and lower(trim(coalesce(r.status,''))) in ('approved','active')
      and lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))=v_email
  ) then raise exception 'approved_complete_registration_required'; end if;
  insert into public.nh7_content_entitlements_v380(
    user_email,content_scope,content_id,content_title,active,granted_by,granted_at,notes,updated_at
  ) values(
    v_email,v_scope,v_id,trim(coalesce(p_content_title,'')),coalesce(p_active,true),auth.uid(),now(),left(coalesce(p_notes,''),1000),now()
  )
  on conflict (lower(user_email),content_scope,content_id) do update set
    content_title=excluded.content_title,
    active=excluded.active,
    granted_by=excluded.granted_by,
    granted_at=now(),
    notes=excluded.notes,
    updated_at=now();
  insert into public.nh7_admin_account_actions_v380(actor_id,actor_email,target_email,action,details)
  values(auth.uid(),lower(coalesce(auth.jwt()->>'email','')),v_email,
    case when coalesce(p_active,true) then 'grant_content_access' else 'revoke_content_access' end,
    jsonb_build_object('scope',v_scope,'content_id',v_id,'title',coalesce(p_content_title,'')));
  return jsonb_build_object('ok',true,'email',v_email,'scope',v_scope,'content_id',v_id,'active',coalesce(p_active,true));
end;
$$;
revoke all on function public.nh7_owner_set_content_access_v380(text,text,text,text,boolean,text) from public,anon;
grant execute on function public.nh7_owner_set_content_access_v380(text,text,text,text,boolean,text) to authenticated;

create or replace function public.nh7_my_content_access_v380()
returns jsonb
language plpgsql
stable
security definer
set search_path='public','pg_catalog'
as $$
declare
  v_email text := lower(trim(coalesce(auth.jwt()->>'email','')));
  v_rows jsonb;
begin
  if auth.uid() is null or v_email='' then raise exception 'login_required'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'scope',e.content_scope,'content_id',e.content_id,'title',e.content_title,
    'expires_at',e.expires_at,'granted_at',e.granted_at
  ) order by e.content_scope,e.content_title,e.content_id),'[]'::jsonb)
  into v_rows
  from public.nh7_content_entitlements_v380 e
  where lower(e.user_email)=v_email and e.active
    and (e.expires_at is null or e.expires_at>now());
  return jsonb_build_object('ok',true,'email',v_email,'items',v_rows,
    'minister_hub',exists(select 1 from public.nh7_content_entitlements_v380 e where lower(e.user_email)=v_email and e.active and e.content_scope='minister_hub' and (e.expires_at is null or e.expires_at>now())));
end;
$$;
revoke all on function public.nh7_my_content_access_v380() from public,anon;
grant execute on function public.nh7_my_content_access_v380() to authenticated;

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
set search_path='public','pg_catalog'
as $$
declare
  v_email text := lower(trim(coalesce(auth.jwt()->>'email','')));
  v_lesson text := trim(coalesce(p_lesson_code,''));
  v_position integer := greatest(0,coalesce(p_position_seconds,0));
  v_duration integer := greatest(0,coalesce(p_duration_seconds,0));
  v_delta integer := greatest(0,least(coalesce(p_delta_seconds,0),20));
  v_row public.nh7_school_audio_progress_v380;
begin
  if auth.uid() is null or v_email='' then raise exception 'login_required'; end if;
  if not public.nh7_school_access_approved_v230(auth.uid(),v_email,'') then raise exception 'school_approval_required'; end if;
  if v_lesson='' or not exists(select 1 from public.school_lessons l where l.lesson_code=v_lesson and l.is_active) then raise exception 'invalid_lesson'; end if;
  if v_duration>0 then v_position:=least(v_position,v_duration); end if;
  insert into public.nh7_school_audio_progress_v380(
    user_id,user_email,lesson_code,duration_seconds,listened_seconds,max_position_seconds,last_event_at,updated_at
  ) values(
    auth.uid(),v_email,v_lesson,v_duration,v_delta,v_position,now(),now()
  )
  on conflict (user_id,lesson_code) do update set
    user_email=excluded.user_email,
    duration_seconds=greatest(public.nh7_school_audio_progress_v380.duration_seconds,excluded.duration_seconds),
    listened_seconds=least(
      greatest(public.nh7_school_audio_progress_v380.duration_seconds,excluded.duration_seconds),
      public.nh7_school_audio_progress_v380.listened_seconds+excluded.listened_seconds
    ),
    max_position_seconds=greatest(public.nh7_school_audio_progress_v380.max_position_seconds,excluded.max_position_seconds),
    last_event_at=now(),updated_at=now()
  returning * into v_row;
  if v_row.duration_seconds>0 and (
    (coalesce(p_ended,false) and v_row.max_position_seconds>=floor(v_row.duration_seconds*0.90))
    or (v_row.listened_seconds>=floor(v_row.duration_seconds*0.95) and v_row.max_position_seconds>=floor(v_row.duration_seconds*0.90))
  ) and v_row.completed_at is null then
    update public.nh7_school_audio_progress_v380 set completed_at=now(),updated_at=now()
    where id=v_row.id returning * into v_row;
  end if;
  return jsonb_build_object(
    'ok',true,'lesson_code',v_lesson,'duration_seconds',v_row.duration_seconds,
    'listened_seconds',v_row.listened_seconds,'max_position_seconds',v_row.max_position_seconds,
    'percent',case when v_row.duration_seconds>0 then least(100,round(v_row.listened_seconds::numeric*100/v_row.duration_seconds)) else 0 end,
    'completed',v_row.completed_at is not null,'completed_at',v_row.completed_at
  );
end;
$$;
revoke all on function public.nh7_school_record_audio_v380(text,integer,integer,integer,boolean) from public,anon;
grant execute on function public.nh7_school_record_audio_v380(text,integer,integer,integer,boolean) to authenticated;

create or replace function public.nh7_school_requirements_v380(p_course_code text default 'foundation_school')
returns jsonb
language plpgsql
stable
security definer
set search_path='public','pg_catalog'
as $$
declare
  v_email text := lower(trim(coalesce(auth.jwt()->>'email','')));
  v_course text := coalesce(nullif(trim(p_course_code),''),'foundation_school');
  v_lessons integer:=0; v_lesson_done integer:=0; v_audio_done integer:=0;
  v_assignment integer:=100; v_assignment_done integer:=0; v_assignment_total integer:=0;
  v_rows jsonb:='[]'::jsonb;
begin
  if auth.uid() is null or v_email='' then raise exception 'login_required'; end if;
  if not public.nh7_school_access_approved_v230(auth.uid(),v_email,'') then raise exception 'school_approval_required'; end if;
  with lessons as (
    select l.lesson_code,coalesce(l.content_data#>>'{translations,fa,lesson_title}',l.content_data#>>'{translations,en,lesson_title}',l.lesson_code) as title
    from public.school_lessons l
    where l.is_active and coalesce(nullif(l.content_data#>>'{course,code}',''),'foundation_school')=v_course
  ), status as (
    select l.lesson_code,l.title,
      exists(select 1 from public.school_progress p where lower(p.user_email)=v_email and p.lesson_code=l.lesson_code and (p.completed_at is not null or p.progress_percent>=100)) as lesson_completed,
      exists(select 1 from public.nh7_school_audio_progress_v380 a where a.user_id=auth.uid() and a.lesson_code=l.lesson_code and a.completed_at is not null) as audio_completed,
      coalesce((select a.listened_seconds from public.nh7_school_audio_progress_v380 a where a.user_id=auth.uid() and a.lesson_code=l.lesson_code),0) as listened_seconds,
      coalesce((select a.duration_seconds from public.nh7_school_audio_progress_v380 a where a.user_id=auth.uid() and a.lesson_code=l.lesson_code),0) as duration_seconds
    from lessons l
  )
  select count(*)::integer,
    count(*) filter(where lesson_completed)::integer,
    count(*) filter(where audio_completed)::integer,
    coalesce(jsonb_agg(jsonb_build_object('lesson_code',lesson_code,'title',title,'lesson_completed',lesson_completed,'audio_completed',audio_completed,'listened_seconds',listened_seconds,'duration_seconds',duration_seconds) order by lesson_code),'[]'::jsonb)
  into v_lessons,v_lesson_done,v_audio_done,v_rows from status;
  select coalesce(s.score_percent,100),coalesce(s.completed_count,0),coalesce(s.total_count,0)
  into v_assignment,v_assignment_done,v_assignment_total
  from public.nh7_assignment_score_for_user(v_email,v_course) s;
  v_assignment:=coalesce(v_assignment,100);v_assignment_done:=coalesce(v_assignment_done,0);v_assignment_total:=coalesce(v_assignment_total,0);
  return jsonb_build_object(
    'ok',true,'course_code',v_course,'lesson_count',v_lessons,'lessons_completed',v_lesson_done,
    'audio_completed',v_audio_done,'assignment_completed',v_assignment_done,'assignment_total',v_assignment_total,
    'assignment_score',v_assignment,'lessons',v_rows,
    'all_lessons_complete',v_lessons>0 and v_lesson_done=v_lessons,
    'all_audio_complete',v_lessons>0 and v_audio_done=v_lessons,
    'all_assignments_complete',v_assignment_done>=v_assignment_total,
    'exam_ready',v_lessons>0 and v_lesson_done=v_lessons and v_audio_done=v_lessons and v_assignment_done>=v_assignment_total
  );
end;
$$;
revoke all on function public.nh7_school_requirements_v380(text) from public,anon;
grant execute on function public.nh7_school_requirements_v380(text) to authenticated;

create or replace function public.nh7_school_exam_session_v380(p_course_code text default 'foundation_school')
returns jsonb
language plpgsql
stable
security definer
set search_path='public','pg_catalog'
as $$
declare v_req jsonb; v_base jsonb; v_block text:='';
begin
  v_req:=public.nh7_school_requirements_v380(p_course_code);
  v_base:=public.nh7_school_exam_session_v340(p_course_code,null);
  if not coalesce((v_req->>'all_lessons_complete')::boolean,false) then v_block:='lessons_required';
  elsif not coalesce((v_req->>'all_audio_complete')::boolean,false) then v_block:='audio_required';
  elsif not coalesce((v_req->>'all_assignments_complete')::boolean,false) then v_block:='assignments_required';
  end if;
  return coalesce(v_base,'{}'::jsonb)||jsonb_build_object('requirements',v_req,'blocked',v_block,'can_start',v_block='');
end;
$$;
revoke all on function public.nh7_school_exam_session_v380(text) from public,anon;
grant execute on function public.nh7_school_exam_session_v380(text) to authenticated;

create or replace function public.nh7_submit_school_exam_v380(p_exam_id uuid,p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path='public','pg_catalog'
as $$
declare v_exam public.school_exams; v_req jsonb;
begin
  select * into v_exam from public.school_exams where id=p_exam_id and is_active;
  if not found then raise exception 'exam_not_found'; end if;
  v_req:=public.nh7_school_requirements_v380(coalesce(nullif(v_exam.course_code,''),'foundation_school'));
  if not coalesce((v_req->>'all_lessons_complete')::boolean,false) then raise exception 'lessons_required'; end if;
  if not coalesce((v_req->>'all_audio_complete')::boolean,false) then raise exception 'audio_required'; end if;
  if not coalesce((v_req->>'all_assignments_complete')::boolean,false) then raise exception 'assignments_required'; end if;
  return public.nh7_submit_school_exam_v340(p_exam_id,p_answers);
end;
$$;
revoke all on function public.nh7_submit_school_exam_v380(uuid,jsonb) from public,anon;
grant execute on function public.nh7_submit_school_exam_v380(uuid,jsonb) to authenticated;

create or replace function public.nh7_recovery_eligibility_v380(p_email text)
returns jsonb
language plpgsql
stable
security definer
set search_path='public','auth','pg_catalog'
as $$
declare v_email text:=lower(trim(coalesce(p_email,''))); v_allowed boolean:=false;
begin
  if v_email='' or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    return jsonb_build_object('ok',true,'allowed',false);
  end if;
  select exists(
    select 1 from auth.users u
    where lower(trim(u.email))=v_email and u.email_confirmed_at is not null
  ) and exists(
    select 1 from public.registrations r
    where lower(trim(coalesce(r.type,'')))='school'
      and lower(trim(coalesce(r.status,''))) in ('approved','active')
      and lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))=v_email
      and public.nh7_school_registration_payload_error_v351(v_email,r.payload) is null
  ) into v_allowed;
  return jsonb_build_object('ok',true,'allowed',coalesce(v_allowed,false));
end;
$$;
revoke all on function public.nh7_recovery_eligibility_v380(text) from public;
grant execute on function public.nh7_recovery_eligibility_v380(text) to anon,authenticated;

create or replace function public.nh7_owner_account_action_v380(
  p_target_email text,
  p_action text,
  p_reason text default '',
  p_confirmation text default ''
)
returns jsonb
language plpgsql
security definer
set search_path='public','auth','pg_catalog'
as $$
declare
  v_email text:=lower(trim(coalesce(p_target_email,'')));
  v_action text:=lower(trim(coalesce(p_action,'')));
  v_actor text:=lower(trim(coalesce(auth.jwt()->>'email','')));
  v_uid uuid; v_rec record; v_deleted integer:=0; v_count integer;
begin
  if not public.nh7_v380_is_owner() then raise exception 'owner_required'; end if;
  if v_email='' or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then raise exception 'invalid_email'; end if;
  if v_email=v_actor then raise exception 'cannot_delete_current_owner'; end if;
  if v_action not in ('request_only','full_account') then raise exception 'invalid_action'; end if;
  if v_action='full_account' and trim(coalesce(p_confirmation,''))<>'DELETE '||v_email then raise exception 'confirmation_required'; end if;
  select id into v_uid from auth.users where lower(trim(email))=v_email limit 1;
  if v_action='request_only' then
    delete from public.registrations r
    where lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))=v_email;
    get diagnostics v_deleted=row_count;
    insert into public.nh7_admin_account_actions_v380(actor_id,actor_email,target_email,action,reason,details)
    values(auth.uid(),v_actor,v_email,v_action,left(coalesce(p_reason,''),1000),jsonb_build_object('registrations_deleted',v_deleted));
    return jsonb_build_object('ok',true,'action',v_action,'email',v_email,'registrations_deleted',v_deleted,'auth_deleted',false);
  end if;
  -- Delete rows linked by UUID first. Repeat passes tolerate FK ordering.
  if v_uid is not null then
    for v_count in 1..3 loop
      for v_rec in
        select c.table_schema,c.table_name,c.column_name
        from information_schema.columns c
        join information_schema.tables t on t.table_schema=c.table_schema and t.table_name=c.table_name and t.table_type='BASE TABLE'
        where c.table_schema='public' and c.column_name in ('user_id','auth_user_id','owner_id','student_id')
          and c.table_name not in ('nh7_admin_account_actions_v380')
      loop
        begin execute format('delete from %I.%I where %I=$1',v_rec.table_schema,v_rec.table_name,v_rec.column_name) using v_uid;
        exception when foreign_key_violation then null; when datatype_mismatch then null; when invalid_text_representation then null; end;
      end loop;
    end loop;
  end if;
  -- Delete all exact email-linked application rows.
  for v_count in 1..3 loop
    for v_rec in
      select c.table_schema,c.table_name,c.column_name
      from information_schema.columns c
      join information_schema.tables t on t.table_schema=c.table_schema and t.table_name=c.table_name and t.table_type='BASE TABLE'
      where c.table_schema='public' and c.column_name in ('user_email','email','student_email','target_email')
        and c.table_name not in ('nh7_admin_account_actions_v380')
    loop
      begin execute format('delete from %I.%I where lower(trim(coalesce(%I::text,'''')))=$1',v_rec.table_schema,v_rec.table_name,v_rec.column_name) using v_email;
      exception when foreign_key_violation then null; when datatype_mismatch then null; end;
    end loop;
  end loop;
  delete from public.registrations r where lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))=v_email;
  if v_uid is not null then delete from auth.users where id=v_uid; end if;
  insert into public.nh7_admin_account_actions_v380(actor_id,actor_email,target_email,action,reason,details)
  values(auth.uid(),v_actor,v_email,v_action,left(coalesce(p_reason,''),1000),jsonb_build_object('auth_user_id',v_uid));
  return jsonb_build_object('ok',true,'action',v_action,'email',v_email,'auth_deleted',v_uid is not null,'data_deleted',true);
end;
$$;
revoke all on function public.nh7_owner_account_action_v380(text,text,text,text) from public,anon;
grant execute on function public.nh7_owner_account_action_v380(text,text,text,text) to authenticated;

-- Explicit grants only; all privileged functions perform their own owner/access checks.
