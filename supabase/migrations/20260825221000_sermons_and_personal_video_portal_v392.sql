create table if not exists public.nh7_school_video_code_items_v392 (
  code_id uuid not null references public.nh7_school_video_codes_v260(id) on delete cascade,
  video_id uuid not null references public.nh7_school_videos_v260(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (code_id, video_id)
);

alter table public.nh7_school_video_code_items_v392 enable row level security;
revoke all on public.nh7_school_video_code_items_v392 from public, anon, authenticated;

create or replace function public.nh7_sermon_catalog_v392()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_email text := lower(trim(coalesce(auth.jwt()->>'email','')));
  v_categories jsonb;
  v_sermons jsonb;
begin
  if auth.role() <> 'authenticated' or v_user is null or v_email = '' then
    return jsonb_build_object('allowed',false,'code','login_required');
  end if;
  if not coalesce(public.nh7_is_admin(),false)
     and not public.nh7_school_access_approved_v230(v_user,v_email,'') then
    return jsonb_build_object('allowed',false,'code','school_approval_required');
  end if;

  select coalesce(jsonb_agg(to_jsonb(c) order by c.sort_order,c.name_fa),'[]'::jsonb)
    into v_categories
  from public.sermon_categories c
  where c.is_active;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',s.id,'category_id',s.category_id,
    'title_fa',s.title_fa,'title_en',s.title_en,'title_hr',s.title_hr,
    'description_fa',s.description_fa,'description_en',s.description_en,'description_hr',s.description_hr,
    'audio_url',s.audio_url,'youtube_url',s.youtube_url,'cover_url',s.cover_url,
    'duration_minutes',s.duration_minutes,'duration_seconds',s.duration_seconds,
    'published_at',s.published_at,'sort_order',s.sort_order,'is_published',s.is_published,
    'created_at',s.created_at,'updated_at',s.updated_at
  ) order by s.sort_order,s.published_at desc,s.created_at desc),'[]'::jsonb)
    into v_sermons
  from public.sermons s
  where s.is_published;

  return jsonb_build_object(
    'allowed',true,
    'categories',v_categories,
    'sermons',v_sermons,
    'category_count',jsonb_array_length(v_categories),
    'sermon_count',jsonb_array_length(v_sermons),
    'generated_at',now()
  );
end;
$$;

revoke all on function public.nh7_sermon_catalog_v392() from public, anon;
grant execute on function public.nh7_sermon_catalog_v392() to authenticated;

create or replace function public.nh7_admin_school_video_create_person_code_v392(
  p_label text,
  p_plain_code text,
  p_target_email text,
  p_target_name text default '',
  p_expires_at timestamptz default null,
  p_video_ids uuid[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
  v_hash text;
  v_email text := lower(trim(coalesce(p_target_email,'')));
  v_name text := trim(coalesce(p_target_name,''));
  v_ids uuid[];
  v_count integer := 0;
begin
  if not public.nh7_is_admin() then raise exception 'Admin access required'; end if;
  if length(trim(coalesce(p_plain_code,''))) < 6 then raise exception 'Code must be at least 6 characters'; end if;
  if position('@' in v_email) <= 1 then raise exception 'Select an approved school student'; end if;
  if not exists (
    select 1 from public.registrations r
    where lower(coalesce(r.type,''))='school'
      and lower(coalesce(r.status,''))='approved'
      and lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))=v_email
  ) then raise exception 'Selected student is not approved for school'; end if;

  select coalesce(array_agg(distinct x order by x),'{}'::uuid[]) into v_ids
  from unnest(coalesce(p_video_ids,'{}'::uuid[])) x where x is not null;
  v_count := coalesce(array_length(v_ids,1),0);
  if exists (
    select 1 from unnest(v_ids) x
    where not exists (select 1 from public.nh7_school_videos_v260 v where v.id=x and v.is_active and v.is_published)
  ) then raise exception 'One or more selected videos were not found'; end if;

  v_hash := encode(extensions.digest(convert_to(lower(trim(p_plain_code)),'UTF8'),'sha256'::text),'hex');
  insert into public.nh7_school_video_codes_v260(
    label,code_hash,video_id,is_active,expires_at,created_by,target_email,target_name
  ) values (
    coalesce(nullif(trim(p_label),''),v_name,v_email),v_hash,
    case when v_count=1 then v_ids[1] else null end,true,p_expires_at,
    lower(coalesce(auth.jwt()->>'email','')),v_email,v_name
  ) returning id into v_id;

  if v_count>0 then
    insert into public.nh7_school_video_code_items_v392(code_id,video_id)
    select v_id,x from unnest(v_ids) x on conflict do nothing;
  end if;

  return jsonb_build_object('id',v_id,'video_count',v_count,'target_email',v_email);
end;
$$;

revoke all on function public.nh7_admin_school_video_create_person_code_v392(text,text,text,text,timestamptz,uuid[]) from public, anon;
grant execute on function public.nh7_admin_school_video_create_person_code_v392(text,text,text,text,timestamptz,uuid[]) to authenticated;
grant execute on function public.nh7_admin_school_video_create_person_code_v317(text,text,text,text,timestamptz,uuid) to authenticated;
grant execute on function public.nh7_admin_school_video_disable_code_v260(uuid) to authenticated;

create or replace function public.nh7_video_portal_authorize_v392(
  p_code text default '',
  p_device_id text default '',
  p_user_id uuid default null,
  p_user_email text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user uuid := coalesce(p_user_id,auth.uid());
  v_email text := lower(trim(coalesce(nullif(p_user_email,''),auth.jwt()->>'email','')));
  v_device text := left(trim(coalesce(p_device_id,'')),160);
  v_hash text;
  v_code public.nh7_school_video_codes_v260;
  v_grant public.nh7_school_video_grants_v260;
  v_catalog jsonb;
  v_has_items boolean := false;
  v_has_account_limits boolean := false;
  v_first uuid;
begin
  if auth.role() not in ('service_role','authenticated') or v_user is null or v_email='' then
    return jsonb_build_object('allowed',false,'code','login_required');
  end if;
  if auth.role()='authenticated' and auth.uid() is distinct from v_user then
    return jsonb_build_object('allowed',false,'code','identity_mismatch');
  end if;
  if not coalesce(public.nh7_is_admin(),false)
     and not public.nh7_school_access_approved_v230(v_user,v_email,v_device) then
    return jsonb_build_object('allowed',false,'code','school_approval_required');
  end if;
  if length(trim(coalesce(p_code,'')))<6 then return jsonb_build_object('allowed',false,'code','code_required'); end if;
  if length(v_device)<8 then return jsonb_build_object('allowed',false,'code','device_required'); end if;

  v_hash := encode(extensions.digest(convert_to(lower(trim(p_code)),'UTF8'),'sha256'::text),'hex');
  select * into v_code from public.nh7_school_video_codes_v260 where code_hash=v_hash for update;
  if not found or not v_code.is_active then return jsonb_build_object('allowed',false,'code','invalid_code'); end if;
  if v_code.expires_at is not null and v_code.expires_at<=now() then return jsonb_build_object('allowed',false,'code','expired'); end if;
  if trim(coalesce(v_code.target_email,''))<>'' and lower(trim(v_code.target_email))<>v_email then
    return jsonb_build_object('allowed',false,'code','code_not_for_account');
  end if;

  select exists(select 1 from public.nh7_school_video_code_items_v392 i where i.code_id=v_code.id) into v_has_items;
  select exists(
    select 1 from public.nh7_account_content_grants_v251 g
    where g.user_id=v_user and g.revoked_at is null and (g.expires_at is null or g.expires_at>now())
      and g.scope in ('media_all','video_item')
  ) into v_has_account_limits;

  select * into v_grant from public.nh7_school_video_grants_v260 where code_id=v_code.id for update;
  if not found then
    select coalesce(v_code.video_id,(select i.video_id from public.nh7_school_video_code_items_v392 i where i.code_id=v_code.id order by i.created_at limit 1)) into v_first;
    insert into public.nh7_school_video_grants_v260(code_id,user_id,user_email,device_id,first_video_id)
    values(v_code.id,v_user,v_email,v_device,v_first) returning * into v_grant;
    update public.nh7_school_video_codes_v260 set use_count=use_count+1,updated_at=now() where id=v_code.id;
  else
    if v_grant.revoked_at is not null then return jsonb_build_object('allowed',false,'code','grant_revoked'); end if;
    if v_grant.user_id<>v_user or lower(v_grant.user_email)<>v_email or v_grant.device_id<>v_device then
      return jsonb_build_object('allowed',false,'code','device_bound_elsewhere');
    end if;
    update public.nh7_school_video_grants_v260 set last_used_at=now() where id=v_grant.id;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',v.id,'title_fa',v.title_fa,'title_en',v.title_en,'title_hr',v.title_hr,
    'description_fa',v.description_fa,'description_en',v.description_en,'description_hr',v.description_hr,
    'topic',v.topic,'file_name',v.file_name,'mime_type',v.mime_type,'file_size',v.file_size,
    'duration_seconds',v.duration_seconds,'sort_order',v.sort_order,
    'has_subtitle_en',v.subtitle_en_path<>'','has_subtitle_hr',v.subtitle_hr_path<>''
  ) order by v.sort_order,v.created_at desc),'[]'::jsonb)
  into v_catalog
  from public.nh7_school_videos_v260 v
  where v.is_active and v.is_published and (
    (v_has_items and exists(select 1 from public.nh7_school_video_code_items_v392 i where i.code_id=v_code.id and i.video_id=v.id))
    or (not v_has_items and v_code.video_id is not null and v.id=v_code.video_id)
    or (not v_has_items and v_code.video_id is null and (
      not v_has_account_limits or public.nh7_content_access_active_v251(v_user,'video_item',v.id)
    ))
  );

  return jsonb_build_object('allowed',true,'catalog',v_catalog,'watermark_email',v_email,
    'watermark_device',right(v_device,8),'code_id',v_code.id,'target_name',v_code.target_name);
end;
$$;

revoke all on function public.nh7_video_portal_authorize_v392(text,text,uuid,text) from public, anon;
grant execute on function public.nh7_video_portal_authorize_v392(text,text,uuid,text) to authenticated;

create or replace function public.nh7_video_authorize_v392(
  p_video_id uuid,
  p_code text default '',
  p_device_id text default '',
  p_user_id uuid default null,
  p_user_email text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user uuid := coalesce(p_user_id,auth.uid());
  v_email text := lower(trim(coalesce(nullif(p_user_email,''),auth.jwt()->>'email','')));
  v_device text := left(trim(coalesce(p_device_id,'')),160);
  v_hash text;
  v_code public.nh7_school_video_codes_v260;
  v_grant public.nh7_school_video_grants_v260;
  v_video public.nh7_school_videos_v260;
  v_has_items boolean := false;
  v_has_account_limits boolean := false;
  v_allowed boolean := false;
begin
  if auth.role() not in ('service_role','authenticated') or v_user is null or v_email='' then
    return jsonb_build_object('allowed',false,'code','login_required');
  end if;
  if auth.role()='authenticated' and auth.uid() is distinct from v_user then return jsonb_build_object('allowed',false,'code','identity_mismatch'); end if;
  if not coalesce(public.nh7_is_admin(),false)
     and not public.nh7_school_access_approved_v230(v_user,v_email,v_device) then return jsonb_build_object('allowed',false,'code','school_approval_required'); end if;
  select * into v_video from public.nh7_school_videos_v260 where id=p_video_id and is_active and is_published;
  if not found then return jsonb_build_object('allowed',false,'code','video_not_found'); end if;
  if length(trim(coalesce(p_code,'')))<6 then return jsonb_build_object('allowed',false,'code','code_required'); end if;
  if length(v_device)<8 then return jsonb_build_object('allowed',false,'code','device_required'); end if;

  v_hash := encode(extensions.digest(convert_to(lower(trim(p_code)),'UTF8'),'sha256'::text),'hex');
  select * into v_code from public.nh7_school_video_codes_v260 where code_hash=v_hash for update;
  if not found or not v_code.is_active then return jsonb_build_object('allowed',false,'code','invalid_code'); end if;
  if v_code.expires_at is not null and v_code.expires_at<=now() then return jsonb_build_object('allowed',false,'code','expired'); end if;
  if trim(coalesce(v_code.target_email,''))<>'' and lower(trim(v_code.target_email))<>v_email then return jsonb_build_object('allowed',false,'code','code_not_for_account'); end if;

  select exists(select 1 from public.nh7_school_video_code_items_v392 i where i.code_id=v_code.id) into v_has_items;
  select exists(select 1 from public.nh7_account_content_grants_v251 g where g.user_id=v_user and g.revoked_at is null and (g.expires_at is null or g.expires_at>now()) and g.scope in ('media_all','video_item')) into v_has_account_limits;
  v_allowed :=
    (v_has_items and exists(select 1 from public.nh7_school_video_code_items_v392 i where i.code_id=v_code.id and i.video_id=v_video.id))
    or (not v_has_items and v_code.video_id is not null and v_code.video_id=v_video.id)
    or (not v_has_items and v_code.video_id is null and (not v_has_account_limits or public.nh7_content_access_active_v251(v_user,'video_item',v_video.id)));
  if not v_allowed then return jsonb_build_object('allowed',false,'code','code_not_for_video'); end if;

  select * into v_grant from public.nh7_school_video_grants_v260 where code_id=v_code.id for update;
  if not found then
    insert into public.nh7_school_video_grants_v260(code_id,user_id,user_email,device_id,first_video_id)
    values(v_code.id,v_user,v_email,v_device,v_video.id) returning * into v_grant;
    update public.nh7_school_video_codes_v260 set use_count=use_count+1,updated_at=now() where id=v_code.id;
  else
    if v_grant.revoked_at is not null then return jsonb_build_object('allowed',false,'code','grant_revoked'); end if;
    if v_grant.user_id<>v_user or lower(v_grant.user_email)<>v_email or v_grant.device_id<>v_device then return jsonb_build_object('allowed',false,'code','device_bound_elsewhere'); end if;
    update public.nh7_school_video_grants_v260 set last_used_at=now() where id=v_grant.id;
  end if;

  return jsonb_build_object('allowed',true,'kind','video','bucket','nh7-school-media','storage_path',v_video.storage_path,
    'file_name',v_video.file_name,'mime_type',v_video.mime_type,'duration_seconds',v_video.duration_seconds,
    'title_fa',v_video.title_fa,'title_en',v_video.title_en,'title_hr',v_video.title_hr,
    'subtitle_en_path',v_video.subtitle_en_path,'subtitle_hr_path',v_video.subtitle_hr_path,
    'watermark_email',v_email,'watermark_device',right(v_device,8));
end;
$$;

revoke all on function public.nh7_video_authorize_v392(uuid,text,text,uuid,text) from public, anon;
grant execute on function public.nh7_video_authorize_v392(uuid,text,text,uuid,text) to authenticated;
