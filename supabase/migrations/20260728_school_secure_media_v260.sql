-- New Hope 7 secure school audio/video infrastructure v2.6.0
create extension if not exists pgcrypto with schema extensions;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
  'nh7-school-media','nh7-school-media',false,null,
  array[
    'video/mp4','video/quicktime','video/webm','video/x-matroska','video/x-msvideo',
    'video/mpeg','video/ogg','video/x-m4v','video/3gpp','application/octet-stream',
    'text/vtt','application/x-subrip','text/plain','image/jpeg','image/png','image/webp'
  ]
)
on conflict(id) do update set
  public=false,
  file_size_limit=null,
  allowed_mime_types=excluded.allowed_mime_types;

create table if not exists public.nh7_school_videos_v260(
  id uuid primary key default gen_random_uuid(),
  title_fa text not null default '',
  title_en text not null default '',
  title_hr text not null default '',
  description_fa text not null default '',
  description_en text not null default '',
  description_hr text not null default '',
  topic text not null default '',
  storage_path text not null,
  file_name text not null default '',
  mime_type text not null default 'video/mp4',
  file_size bigint not null default 0,
  duration_seconds integer not null default 0,
  poster_path text not null default '',
  subtitle_en_path text not null default '',
  subtitle_hr_path text not null default '',
  sort_order integer not null default 100,
  is_published boolean not null default true,
  is_active boolean not null default true,
  created_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nh7_school_video_path_safe check(storage_path<>'' and position('..' in storage_path)=0)
);

create table if not exists public.nh7_school_video_codes_v260(
  id uuid primary key default gen_random_uuid(),
  label text not null default '',
  code_hash text not null unique,
  video_id uuid null references public.nh7_school_videos_v260(id) on delete cascade,
  is_active boolean not null default true,
  expires_at timestamptz null,
  use_count integer not null default 0,
  created_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nh7_school_video_grants_v260(
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null unique references public.nh7_school_video_codes_v260(id) on delete cascade,
  user_id uuid not null,
  user_email text not null,
  device_id text not null,
  first_video_id uuid null references public.nh7_school_videos_v260(id) on delete set null,
  granted_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  revoked_at timestamptz null,
  constraint nh7_video_device_required check(length(trim(device_id))>=8)
);

create index if not exists nh7_school_videos_order_idx
  on public.nh7_school_videos_v260(is_published,is_active,sort_order,created_at);
create index if not exists nh7_school_video_grants_user_idx
  on public.nh7_school_video_grants_v260(user_id,device_id);

alter table public.nh7_school_videos_v260 enable row level security;
alter table public.nh7_school_video_codes_v260 enable row level security;
alter table public.nh7_school_video_grants_v260 enable row level security;
revoke all on public.nh7_school_videos_v260 from anon,authenticated;
revoke all on public.nh7_school_video_codes_v260 from anon,authenticated;
revoke all on public.nh7_school_video_grants_v260 from anon,authenticated;

create or replace function public.nh7_admin_school_media_dashboard_v260()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare v_result jsonb;
begin
  if not public.nh7_is_admin() then raise exception 'Admin access required'; end if;
  select jsonb_build_object(
    'videos',coalesce((select jsonb_agg(to_jsonb(v) order by v.sort_order,v.created_at desc)
      from public.nh7_school_videos_v260 v where v.is_active),'[]'::jsonb),
    'codes',coalesce((select jsonb_agg(jsonb_build_object(
      'id',c.id,'label',c.label,'video_id',c.video_id,'is_active',c.is_active,
      'expires_at',c.expires_at,'use_count',c.use_count,'created_at',c.created_at,
      'updated_at',c.updated_at,'bound_user_email',g.user_email,
      'bound_device_id',g.device_id,'granted_at',g.granted_at,
      'last_used_at',g.last_used_at,'grant_revoked_at',g.revoked_at
    ) order by c.created_at desc)
    from public.nh7_school_video_codes_v260 c
    left join public.nh7_school_video_grants_v260 g on g.code_id=c.id),'[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

create or replace function public.nh7_admin_school_video_save_v260(p_item jsonb)
returns public.nh7_school_videos_v260
language plpgsql
security definer
set search_path=public
as $$
declare v_id uuid;v_row public.nh7_school_videos_v260;
begin
  if not public.nh7_is_admin() then raise exception 'Admin access required'; end if;
  v_id:=nullif(p_item->>'id','')::uuid;
  if nullif(trim(coalesce(p_item->>'storage_path','')),'') is null then
    raise exception 'Video storage path is required';
  end if;
  if v_id is null then
    insert into public.nh7_school_videos_v260(
      title_fa,title_en,title_hr,description_fa,description_en,description_hr,topic,
      storage_path,file_name,mime_type,file_size,duration_seconds,poster_path,
      subtitle_en_path,subtitle_hr_path,sort_order,is_published,is_active,created_by
    ) values(
      coalesce(p_item->>'title_fa',''),coalesce(p_item->>'title_en',''),coalesce(p_item->>'title_hr',''),
      coalesce(p_item->>'description_fa',''),coalesce(p_item->>'description_en',''),coalesce(p_item->>'description_hr',''),coalesce(p_item->>'topic',''),
      trim(p_item->>'storage_path'),coalesce(p_item->>'file_name',''),coalesce(p_item->>'mime_type','video/mp4'),
      coalesce(nullif(p_item->>'file_size','')::bigint,0),coalesce(nullif(p_item->>'duration_seconds','')::integer,0),
      coalesce(p_item->>'poster_path',''),coalesce(p_item->>'subtitle_en_path',''),coalesce(p_item->>'subtitle_hr_path',''),
      coalesce(nullif(p_item->>'sort_order','')::integer,100),coalesce((p_item->>'is_published')::boolean,true),true,
      lower(coalesce(auth.jwt()->>'email',''))
    ) returning * into v_row;
  else
    update public.nh7_school_videos_v260 set
      title_fa=coalesce(p_item->>'title_fa',title_fa),
      title_en=coalesce(p_item->>'title_en',title_en),
      title_hr=coalesce(p_item->>'title_hr',title_hr),
      description_fa=coalesce(p_item->>'description_fa',description_fa),
      description_en=coalesce(p_item->>'description_en',description_en),
      description_hr=coalesce(p_item->>'description_hr',description_hr),
      topic=coalesce(p_item->>'topic',topic),
      storage_path=coalesce(nullif(trim(p_item->>'storage_path'),''),storage_path),
      file_name=coalesce(p_item->>'file_name',file_name),
      mime_type=coalesce(p_item->>'mime_type',mime_type),
      file_size=coalesce(nullif(p_item->>'file_size','')::bigint,file_size),
      duration_seconds=coalesce(nullif(p_item->>'duration_seconds','')::integer,duration_seconds),
      poster_path=coalesce(p_item->>'poster_path',poster_path),
      subtitle_en_path=coalesce(p_item->>'subtitle_en_path',subtitle_en_path),
      subtitle_hr_path=coalesce(p_item->>'subtitle_hr_path',subtitle_hr_path),
      sort_order=coalesce(nullif(p_item->>'sort_order','')::integer,sort_order),
      is_published=coalesce((p_item->>'is_published')::boolean,is_published),
      updated_at=now()
    where id=v_id and is_active returning * into v_row;
  end if;
  if v_row.id is null then raise exception 'Video was not saved'; end if;
  return v_row;
end;
$$;

create or replace function public.nh7_admin_school_video_delete_v260(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare v public.nh7_school_videos_v260;
begin
  if not public.nh7_is_admin() then raise exception 'Admin access required'; end if;
  delete from public.nh7_school_videos_v260 where id=p_id returning * into v;
  if v.id is null then raise exception 'Video not found'; end if;
  return jsonb_build_object('storage_path',v.storage_path,'poster_path',v.poster_path,
    'subtitle_en_path',v.subtitle_en_path,'subtitle_hr_path',v.subtitle_hr_path);
end;
$$;

create or replace function public.nh7_admin_school_video_create_code_v260(
  p_label text,p_plain_code text,p_expires_at timestamptz default null,p_video_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path=public,extensions
as $$
declare v_id uuid;v_hash text;
begin
  if not public.nh7_is_admin() then raise exception 'Admin access required'; end if;
  if length(trim(coalesce(p_plain_code,'')))<6 then raise exception 'Code must be at least 6 characters'; end if;
  v_hash:=encode(extensions.digest(convert_to(lower(trim(p_plain_code)),'UTF8'),'sha256'::text),'hex');
  insert into public.nh7_school_video_codes_v260(label,code_hash,video_id,is_active,expires_at,created_by)
  values(coalesce(p_label,''),v_hash,p_video_id,true,p_expires_at,lower(coalesce(auth.jwt()->>'email','')))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.nh7_admin_school_video_disable_code_v260(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
begin
  if not public.nh7_is_admin() then raise exception 'Admin access required'; end if;
  update public.nh7_school_video_codes_v260 set is_active=false,updated_at=now() where id=p_id;
  update public.nh7_school_video_grants_v260 set revoked_at=coalesce(revoked_at,now()) where code_id=p_id;
  return found;
end;
$$;

create or replace function public.nh7_school_video_catalog_v260()
returns table(
  id uuid,title_fa text,title_en text,title_hr text,
  description_fa text,description_en text,description_hr text,
  topic text,file_name text,mime_type text,file_size bigint,duration_seconds integer,
  sort_order integer,has_subtitle_en boolean,has_subtitle_hr boolean
)
language sql
stable
security definer
set search_path=public
as $$
  select v.id,v.title_fa,v.title_en,v.title_hr,
         v.description_fa,v.description_en,v.description_hr,
         v.topic,v.file_name,v.mime_type,v.file_size,v.duration_seconds,v.sort_order,
         v.subtitle_en_path<>'',v.subtitle_hr_path<>''
  from public.nh7_school_videos_v260 v
  where auth.uid() is not null
    and public.nh7_school_access_approved_v230(auth.uid(),coalesce(auth.jwt()->>'email',''),'')
    and v.is_active and v.is_published
  order by v.sort_order,v.created_at desc;
$$;

create or replace function public.nh7_school_media_authorize_v260(
  p_kind text default 'audio',p_lesson_code text default '',p_video_id uuid default null,
  p_code text default '',p_device_id text default '',p_user_id uuid default null,p_user_email text default ''
)
returns jsonb
language plpgsql
security definer
set search_path=public,extensions
as $$
declare
  v_user uuid:=coalesce(p_user_id,auth.uid());
  v_email text:=lower(trim(coalesce(nullif(p_user_email,''),auth.jwt()->>'email','')));
  v_device text:=left(trim(coalesce(p_device_id,'')),160);
  v_lesson public.school_lessons;
  v_audio jsonb;
  v_path text;
  v_video public.nh7_school_videos_v260;
  v_code public.nh7_school_video_codes_v260;
  v_grant public.nh7_school_video_grants_v260;
  v_hash text;
begin
  if auth.role() not in ('service_role','authenticated') then return jsonb_build_object('allowed',false,'code','login_required'); end if;
  if v_user is null or v_email='' then return jsonb_build_object('allowed',false,'code','login_required'); end if;
  if auth.role()='authenticated' and auth.uid() is distinct from v_user then return jsonb_build_object('allowed',false,'code','identity_mismatch'); end if;
  if not public.nh7_school_access_approved_v230(v_user,v_email,v_device) then return jsonb_build_object('allowed',false,'code','school_approval_required'); end if;

  if lower(coalesce(p_kind,''))='audio' then
    select * into v_lesson from public.school_lessons where lesson_code=trim(p_lesson_code) and is_active limit 1;
    if not found then return jsonb_build_object('allowed',false,'code','lesson_not_found'); end if;
    v_audio:=coalesce(v_lesson.content_data->'audio','{}'::jsonb);
    v_path:=trim(coalesce(v_audio->>'storage_path',''));
    if v_path='' then
      v_path:=regexp_replace(coalesce(v_audio->>'src',''),'^.*/storage/v1/object/(public/|sign/)?church-audio/','','i');
      v_path:=split_part(v_path,'?',1);
    end if;
    if v_path='' or position('..' in v_path)>0 then return jsonb_build_object('allowed',false,'code','audio_path_missing'); end if;
    return jsonb_build_object('allowed',true,'kind','audio','bucket','church-audio','storage_path',v_path,
      'file_name',coalesce(v_audio->>'fileName',v_audio->>'file_name',''),
      'mime_type',coalesce(v_audio->>'mime_type','audio/mpeg'),
      'duration_seconds',coalesce(nullif(v_audio->>'duration_seconds','')::integer,0),
      'lesson_code',v_lesson.lesson_code);
  end if;

  select * into v_video from public.nh7_school_videos_v260 where id=p_video_id and is_active and is_published;
  if not found then return jsonb_build_object('allowed',false,'code','video_not_found'); end if;
  if length(trim(coalesce(p_code,'')))<6 then return jsonb_build_object('allowed',false,'code','code_required'); end if;
  if length(v_device)<8 then return jsonb_build_object('allowed',false,'code','device_required'); end if;

  v_hash:=encode(extensions.digest(convert_to(lower(trim(p_code)),'UTF8'),'sha256'::text),'hex');
  select * into v_code from public.nh7_school_video_codes_v260 where code_hash=v_hash for update;
  if not found or not v_code.is_active then return jsonb_build_object('allowed',false,'code','invalid_code'); end if;
  if v_code.expires_at is not null and v_code.expires_at<=now() then return jsonb_build_object('allowed',false,'code','expired'); end if;
  if v_code.video_id is not null and v_code.video_id<>v_video.id then return jsonb_build_object('allowed',false,'code','code_not_for_video'); end if;

  select * into v_grant from public.nh7_school_video_grants_v260 where code_id=v_code.id for update;
  if not found then
    insert into public.nh7_school_video_grants_v260(code_id,user_id,user_email,device_id,first_video_id)
    values(v_code.id,v_user,v_email,v_device,v_video.id) returning * into v_grant;
    update public.nh7_school_video_codes_v260 set use_count=use_count+1,updated_at=now() where id=v_code.id;
  else
    if v_grant.revoked_at is not null then return jsonb_build_object('allowed',false,'code','grant_revoked'); end if;
    if v_grant.user_id<>v_user or lower(v_grant.user_email)<>v_email or v_grant.device_id<>v_device then
      return jsonb_build_object('allowed',false,'code','device_bound_elsewhere');
    end if;
    update public.nh7_school_video_grants_v260 set last_used_at=now() where id=v_grant.id;
  end if;

  return jsonb_build_object('allowed',true,'kind','video','bucket','nh7-school-media','storage_path',v_video.storage_path,
    'file_name',v_video.file_name,'mime_type',v_video.mime_type,'duration_seconds',v_video.duration_seconds,
    'title_fa',v_video.title_fa,'title_en',v_video.title_en,'title_hr',v_video.title_hr,
    'subtitle_en_path',v_video.subtitle_en_path,'subtitle_hr_path',v_video.subtitle_hr_path,
    'watermark_email',v_email,'watermark_device',right(v_device,8));
end;
$$;

grant execute on function public.nh7_admin_school_media_dashboard_v260() to authenticated;
grant execute on function public.nh7_admin_school_video_save_v260(jsonb) to authenticated;
grant execute on function public.nh7_admin_school_video_delete_v260(uuid) to authenticated;
grant execute on function public.nh7_admin_school_video_create_code_v260(text,text,timestamptz,uuid) to authenticated;
grant execute on function public.nh7_admin_school_video_disable_code_v260(uuid) to authenticated;
grant execute on function public.nh7_school_video_catalog_v260() to authenticated;
grant execute on function public.nh7_school_media_authorize_v260(text,text,uuid,text,text,uuid,text) to authenticated,service_role;

drop policy if exists "nh7 admin school media insert" on storage.objects;
drop policy if exists "nh7 admin school media update" on storage.objects;
drop policy if exists "nh7 admin school media delete" on storage.objects;
drop policy if exists "nh7 admin school media select" on storage.objects;
create policy "nh7 admin school media insert" on storage.objects for insert to authenticated
  with check(bucket_id in ('nh7-school-media','church-audio') and public.nh7_is_admin());
create policy "nh7 admin school media update" on storage.objects for update to authenticated
  using(bucket_id in ('nh7-school-media','church-audio') and public.nh7_is_admin())
  with check(bucket_id in ('nh7-school-media','church-audio') and public.nh7_is_admin());
create policy "nh7 admin school media delete" on storage.objects for delete to authenticated
  using(bucket_id in ('nh7-school-media','church-audio') and public.nh7_is_admin());
create policy "nh7 admin school media select" on storage.objects for select to authenticated
  using(bucket_id in ('nh7-school-media','church-audio') and public.nh7_is_admin());
