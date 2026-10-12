-- New Hope 7 — Issue #127 / Admin Course Studio
-- REVIEW CANDIDATE ONLY. DO NOT APPLY DIRECTLY TO PRODUCTION.
-- Depends on multi_course_candidate.sql.
-- Admin operations are server-authorized and additive; courses/stages/lessons are
-- archived/deactivated rather than hard-deleted from the studio.

create schema if not exists private;
revoke all on schema private from public;

create or replace function private.nh7_course_code_normalize_v127(p_value text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(trim(coalesce(p_value,'')),'[^a-zA-Z0-9_]+','_','g'))
$$;
revoke all on function private.nh7_course_code_normalize_v127(text) from public,anon,authenticated;

-- ---------------------------------------------------------------------------
-- 1. Admin snapshot: one RPC for Course Studio
-- ---------------------------------------------------------------------------
create or replace function public.nh7_admin_course_studio_snapshot_v127()
returns jsonb
language plpgsql
stable
security definer
set search_path=public,private
as $$
begin
  if not coalesce(public.nh7_is_admin(),false) then raise exception 'Admin access required'; end if;

  return jsonb_build_object(
    'ok',true,
    'courses',coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'course_code',c.course_code,
          'course_order',c.course_order,
          'title_fa',c.title_fa,'title_en',c.title_en,'title_hr',c.title_hr,
          'description_fa',c.description_fa,'description_en',c.description_en,'description_hr',c.description_hr,
          'cover_url',c.cover_url,
          'is_active',c.is_active,
          'publish_state',c.publish_state,
          'requires_manual_grant',c.requires_manual_grant,
          'certificate_template_code',c.certificate_template_code,
          'settings',c.settings,
          'stage_count',(select count(*) from public.school_course_stages s where s.course_code=c.course_code),
          'active_stage_count',(select count(*) from public.school_course_stages s where s.course_code=c.course_code and s.is_active),
          'lesson_count',(select count(*) from public.school_lessons l where l.course_code=c.course_code),
          'active_lesson_count',(select count(*) from public.school_lessons l where l.course_code=c.course_code and l.is_active),
          'grant_count',(select count(*) from public.school_course_access_grants g where g.course_code=c.course_code and g.status='granted' and g.revoked_at is null),
          'prerequisites',coalesce((select jsonb_agg(p.prerequisite_course_code order by p.prerequisite_course_code) from public.school_course_prerequisites p where p.course_code=c.course_code),'[]'::jsonb),
          'stages',coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'stage_code',s.stage_code,
                'stage_order',s.stage_order,
                'title_fa',s.title_fa,'title_en',s.title_en,'title_hr',s.title_hr,
                'is_active',s.is_active,
                'settings',s.settings,
                'lessons',coalesce((
                  select jsonb_agg(
                    jsonb_build_object(
                      'lesson_code',l.lesson_code,
                      'lesson_order',sl.lesson_order,
                      'global_lesson_order',l.lesson_order,
                      'is_active',l.is_active,
                      'publish_state',l.publish_state,
                      'content_data',l.content_data
                    ) order by sl.lesson_order,l.lesson_code
                  )
                  from public.school_course_stage_lessons sl
                  join public.school_lessons l on l.lesson_code=sl.lesson_code
                  where sl.course_code=s.course_code and sl.stage_code=s.stage_code
                ),'[]'::jsonb)
              ) order by s.stage_order,s.stage_code
            )
            from public.school_course_stages s
            where s.course_code=c.course_code
          ),'[]'::jsonb)
        ) order by c.course_order,c.course_code
      )
      from public.school_courses c
    ),'[]'::jsonb)
  );
end;
$$;
revoke all on function public.nh7_admin_course_studio_snapshot_v127() from public,anon,authenticated;
grant execute on function public.nh7_admin_course_studio_snapshot_v127() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Create/update/archive Course shell
-- ---------------------------------------------------------------------------
create or replace function public.nh7_admin_upsert_course_v127(
  p_course_code text,
  p_course_order integer default 100,
  p_title_fa text default '',
  p_title_en text default '',
  p_title_hr text default '',
  p_description_fa text default '',
  p_description_en text default '',
  p_description_hr text default '',
  p_publish_state text default 'draft',
  p_is_active boolean default true,
  p_requires_manual_grant boolean default false,
  p_cover_url text default null,
  p_certificate_template_code text default null,
  p_settings jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=public,private
as $$
declare
  v_code text:=private.nh7_course_code_normalize_v127(p_course_code);
  v_state text:=lower(trim(coalesce(p_publish_state,'draft')));
begin
  if not coalesce(public.nh7_is_admin(),false) then raise exception 'Admin access required'; end if;
  if v_code='' or v_code!~'^[a-z0-9][a-z0-9_]{2,63}$' then raise exception 'invalid_course_code'; end if;
  if trim(coalesce(p_title_fa,''))='' and trim(coalesce(p_title_en,''))='' and trim(coalesce(p_title_hr,''))='' then raise exception 'course_title_required'; end if;
  if v_state not in ('draft','published','archived') then raise exception 'invalid_publish_state'; end if;

  insert into public.school_courses(
    course_code,course_order,title_fa,title_en,title_hr,
    description_fa,description_en,description_hr,is_active,publish_state,
    cover_url,requires_manual_grant,certificate_template_code,settings,updated_at
  ) values(
    v_code,coalesce(p_course_order,100),coalesce(p_title_fa,''),coalesce(p_title_en,''),coalesce(p_title_hr,''),
    coalesce(p_description_fa,''),coalesce(p_description_en,''),coalesce(p_description_hr,''),coalesce(p_is_active,true),v_state,
    nullif(trim(coalesce(p_cover_url,'')),''),coalesce(p_requires_manual_grant,false),nullif(trim(coalesce(p_certificate_template_code,'')),''),coalesce(p_settings,'{}'::jsonb),now()
  )
  on conflict(course_code) do update set
    course_order=excluded.course_order,
    title_fa=excluded.title_fa,title_en=excluded.title_en,title_hr=excluded.title_hr,
    description_fa=excluded.description_fa,description_en=excluded.description_en,description_hr=excluded.description_hr,
    is_active=excluded.is_active,publish_state=excluded.publish_state,
    cover_url=excluded.cover_url,requires_manual_grant=excluded.requires_manual_grant,
    certificate_template_code=excluded.certificate_template_code,settings=excluded.settings,
    updated_at=now();

  return jsonb_build_object('ok',true,'course_code',v_code,'publish_state',v_state);
end;
$$;
revoke all on function public.nh7_admin_upsert_course_v127(text,integer,text,text,text,text,text,text,text,boolean,boolean,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.nh7_admin_upsert_course_v127(text,integer,text,text,text,text,text,text,text,boolean,boolean,text,text,jsonb) to authenticated;

-- Archive instead of delete so academic history and credentials keep referential meaning.
create or replace function public.nh7_admin_archive_course_v127(p_course_code text)
returns jsonb
language plpgsql
security definer
set search_path=public,private
as $$
declare v_code text:=private.nh7_course_code_normalize_v127(p_course_code);
begin
  if not coalesce(public.nh7_is_admin(),false) then raise exception 'Admin access required'; end if;
  if v_code='foundation_school' then raise exception 'foundation_course_cannot_be_archived_here'; end if;
  update public.school_courses set publish_state='archived',is_active=false,updated_at=now() where course_code=v_code;
  if not found then raise exception 'course_not_found'; end if;
  return jsonb_build_object('ok',true,'course_code',v_code,'archived',true);
end;
$$;
revoke all on function public.nh7_admin_archive_course_v127(text) from public,anon,authenticated;
grant execute on function public.nh7_admin_archive_course_v127(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Stage editor
-- ---------------------------------------------------------------------------
create or replace function public.nh7_admin_upsert_course_stage_v127(
  p_course_code text,
  p_stage_code text,
  p_stage_order integer,
  p_title_fa text default '',
  p_title_en text default '',
  p_title_hr text default '',
  p_is_active boolean default true,
  p_settings jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=public,private
as $$
declare
  v_course text:=private.nh7_course_code_normalize_v127(p_course_code);
  v_stage text:=private.nh7_course_code_normalize_v127(p_stage_code);
begin
  if not coalesce(public.nh7_is_admin(),false) then raise exception 'Admin access required'; end if;
  if not exists(select 1 from public.school_courses c where c.course_code=v_course) then raise exception 'course_not_found'; end if;
  if v_stage='' or v_stage!~'^[a-z0-9][a-z0-9_]{1,63}$' then raise exception 'invalid_stage_code'; end if;
  if coalesce(p_stage_order,0)<1 then raise exception 'invalid_stage_order'; end if;

  insert into public.school_course_stages(course_code,stage_code,stage_order,title_fa,title_en,title_hr,is_active,settings,updated_at)
  values(v_course,v_stage,p_stage_order,coalesce(p_title_fa,''),coalesce(p_title_en,''),coalesce(p_title_hr,''),coalesce(p_is_active,true),coalesce(p_settings,'{}'::jsonb),now())
  on conflict(course_code,stage_code) do update set
    stage_order=excluded.stage_order,title_fa=excluded.title_fa,title_en=excluded.title_en,title_hr=excluded.title_hr,
    is_active=excluded.is_active,settings=excluded.settings,updated_at=now();

  return jsonb_build_object('ok',true,'course_code',v_course,'stage_code',v_stage);
end;
$$;
revoke all on function public.nh7_admin_upsert_course_stage_v127(text,text,integer,text,text,text,boolean,jsonb) from public,anon,authenticated;
grant execute on function public.nh7_admin_upsert_course_stage_v127(text,text,integer,text,text,text,boolean,jsonb) to authenticated;

create or replace function public.nh7_admin_archive_course_stage_v127(p_course_code text,p_stage_code text)
returns jsonb
language plpgsql
security definer
set search_path=public,private
as $$
declare
  v_course text:=private.nh7_course_code_normalize_v127(p_course_code);
  v_stage text:=private.nh7_course_code_normalize_v127(p_stage_code);
begin
  if not coalesce(public.nh7_is_admin(),false) then raise exception 'Admin access required'; end if;
  update public.school_course_stages set is_active=false,updated_at=now()
    where course_code=v_course and stage_code=v_stage;
  if not found then raise exception 'stage_not_found'; end if;
  return jsonb_build_object('ok',true,'course_code',v_course,'stage_code',v_stage,'archived',true);
end;
$$;
revoke all on function public.nh7_admin_archive_course_stage_v127(text,text) from public,anon,authenticated;
grant execute on function public.nh7_admin_archive_course_stage_v127(text,text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Lesson editor + stage mapping
-- ---------------------------------------------------------------------------
create or replace function public.nh7_admin_upsert_course_lesson_v127(
  p_course_code text,
  p_stage_code text,
  p_lesson_code text,
  p_stage_lesson_order integer,
  p_global_lesson_order integer,
  p_content_data jsonb default '{}'::jsonb,
  p_publish_state text default 'draft',
  p_is_active boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path=public,private
as $$
declare
  v_course text:=private.nh7_course_code_normalize_v127(p_course_code);
  v_stage text:=private.nh7_course_code_normalize_v127(p_stage_code);
  v_lesson text:=private.nh7_course_code_normalize_v127(p_lesson_code);
  v_state text:=lower(trim(coalesce(p_publish_state,'draft')));
begin
  if not coalesce(public.nh7_is_admin(),false) then raise exception 'Admin access required'; end if;
  if not exists(select 1 from public.school_course_stages s where s.course_code=v_course and s.stage_code=v_stage) then raise exception 'stage_not_found'; end if;
  if v_lesson='' or v_lesson!~'^[a-z0-9][a-z0-9_]{2,95}$' then raise exception 'invalid_lesson_code'; end if;
  if v_state not in ('draft','published','archived') then raise exception 'invalid_publish_state'; end if;
  if coalesce(p_stage_lesson_order,0)<1 or coalesce(p_global_lesson_order,0)<1 then raise exception 'invalid_lesson_order'; end if;

  insert into public.school_lessons(lesson_code,lesson_order,content_data,is_active,publish_state,course_code,updated_at)
  values(v_lesson,p_global_lesson_order,coalesce(p_content_data,'{}'::jsonb),coalesce(p_is_active,true),v_state,v_course,now())
  on conflict(lesson_code) do update set
    lesson_order=excluded.lesson_order,content_data=excluded.content_data,is_active=excluded.is_active,
    publish_state=excluded.publish_state,course_code=excluded.course_code,updated_at=now();

  insert into public.school_course_stage_lessons(course_code,stage_code,lesson_code,lesson_order)
  values(v_course,v_stage,v_lesson,p_stage_lesson_order)
  on conflict(course_code,stage_code,lesson_code) do update set lesson_order=excluded.lesson_order;

  return jsonb_build_object('ok',true,'course_code',v_course,'stage_code',v_stage,'lesson_code',v_lesson);
end;
$$;
revoke all on function public.nh7_admin_upsert_course_lesson_v127(text,text,text,integer,integer,jsonb,text,boolean) from public,anon,authenticated;
grant execute on function public.nh7_admin_upsert_course_lesson_v127(text,text,text,integer,integer,jsonb,text,boolean) to authenticated;

create or replace function public.nh7_admin_archive_course_lesson_v127(p_lesson_code text)
returns jsonb
language plpgsql
security definer
set search_path=public,private
as $$
declare v_lesson text:=private.nh7_course_code_normalize_v127(p_lesson_code);
begin
  if not coalesce(public.nh7_is_admin(),false) then raise exception 'Admin access required'; end if;
  update public.school_lessons set is_active=false,publish_state='archived',updated_at=now() where lesson_code=v_lesson;
  if not found then raise exception 'lesson_not_found'; end if;
  return jsonb_build_object('ok',true,'lesson_code',v_lesson,'archived',true);
end;
$$;
revoke all on function public.nh7_admin_archive_course_lesson_v127(text) from public,anon,authenticated;
grant execute on function public.nh7_admin_archive_course_lesson_v127(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Prerequisite editor
-- ---------------------------------------------------------------------------
create or replace function public.nh7_admin_set_course_prerequisite_v127(
  p_course_code text,
  p_prerequisite_course_code text,
  p_required boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path=public,private
as $$
declare
  v_course text:=private.nh7_course_code_normalize_v127(p_course_code);
  v_pre text:=private.nh7_course_code_normalize_v127(p_prerequisite_course_code);
begin
  if not coalesce(public.nh7_is_admin(),false) then raise exception 'Admin access required'; end if;
  if v_course=v_pre then raise exception 'course_cannot_require_itself'; end if;
  if not exists(select 1 from public.school_courses c where c.course_code=v_course) then raise exception 'course_not_found'; end if;
  if not exists(select 1 from public.school_courses c where c.course_code=v_pre) then raise exception 'prerequisite_course_not_found'; end if;

  if coalesce(p_required,true) then
    insert into public.school_course_prerequisites(course_code,prerequisite_course_code)
    values(v_course,v_pre) on conflict do nothing;
  else
    delete from public.school_course_prerequisites
      where course_code=v_course and prerequisite_course_code=v_pre;
  end if;

  return jsonb_build_object('ok',true,'course_code',v_course,'prerequisite_course_code',v_pre,'required',coalesce(p_required,true));
end;
$$;
revoke all on function public.nh7_admin_set_course_prerequisite_v127(text,text,boolean) from public,anon,authenticated;
grant execute on function public.nh7_admin_set_course_prerequisite_v127(text,text,boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Admin manual-access lookup by Student Code / email / user id
-- ---------------------------------------------------------------------------
create or replace function public.nh7_admin_course_grants_v127(p_course_code text,p_query text default '')
returns jsonb
language plpgsql
stable
security definer
set search_path=public,private,auth
as $$
declare
  v_course text:=private.nh7_course_code_normalize_v127(p_course_code);
  v_q text:=lower(trim(coalesce(p_query,'')));
begin
  if not coalesce(public.nh7_is_admin(),false) then raise exception 'Admin access required'; end if;
  return jsonb_build_object('ok',true,'rows',coalesce((
    select jsonb_agg(jsonb_build_object(
      'user_id',i.user_id,
      'student_code',i.student_code,
      'display_name',i.display_name,
      'email',coalesce(lower(u.email),i.registration_email),
      'identity_source',i.identity_source,
      'prerequisite_passed',case when exists(select 1 from public.school_course_prerequisites p where p.course_code=v_course) then
        not exists(select 1 from public.school_course_prerequisites p where p.course_code=v_course and not private.nh7_course_passed_v127(i.user_id,p.prerequisite_course_code))
        else true end,
      'granted',coalesce(g.status='granted' and g.revoked_at is null,false),
      'grant_reason',coalesce(g.reason,''),
      'granted_at',g.granted_at
    ) order by coalesce(i.display_name,i.registration_email),i.student_code)
    from public.school_student_identities i
    left join auth.users u on u.id=i.user_id
    left join public.school_course_access_grants g on g.course_code=v_course and g.user_id=i.user_id
    where i.status='active'
      and (v_q='' or lower(i.student_code) like '%'||v_q||'%' or lower(coalesce(i.display_name,'')) like '%'||v_q||'%' or lower(i.registration_email) like '%'||v_q||'%' or lower(coalesce(u.email,'')) like '%'||v_q||'%' or i.user_id::text=v_q)
  ),'[]'::jsonb));
end;
$$;
revoke all on function public.nh7_admin_course_grants_v127(text,text) from public,anon,authenticated;
grant execute on function public.nh7_admin_course_grants_v127(text,text) to authenticated;

-- Note: prerequisite removal uses DELETE only on the relationship/config row.
-- It never deletes student progress, assignments, exams, identities or credentials.
