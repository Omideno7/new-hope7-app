-- New Hope 7 v2.5.1 — unified account-ID access for ministers library and visual media

create table if not exists public.nh7_minister_access_v251 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null default '',
  library_all boolean not null default false,
  media_all boolean not null default false,
  library_collection_ids uuid[] not null default '{}'::uuid[],
  library_item_ids uuid[] not null default '{}'::uuid[],
  video_ids uuid[] not null default '{}'::uuid[],
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

alter table public.nh7_minister_access_v251 enable row level security;
revoke all on public.nh7_minister_access_v251 from anon, authenticated;

create index if not exists nh7_minister_access_v251_email_idx on public.nh7_minister_access_v251(lower(user_email));
create index if not exists nh7_minister_access_v251_active_idx on public.nh7_minister_access_v251(user_id) where revoked_at is null;

create or replace function public.nh7_minister_grant_active_v251(p_user_id uuid)
returns boolean
language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.nh7_minister_access_v251 g
    where g.user_id=p_user_id
      and g.revoked_at is null
      and (g.expires_at is null or g.expires_at>now())
  );
$$;

create or replace function public.nh7_minister_library_allowed_v251(p_user_id uuid,p_item_id uuid)
returns boolean
language plpgsql stable security definer set search_path=public as $$
declare v_item public.nh7_library_items; v_grant public.nh7_minister_access_v251;
begin
  if coalesce(public.nh7_is_admin(),false) then return true; end if;
  if p_user_id is null then return false; end if;
  select * into v_item from public.nh7_library_items where id=p_item_id and is_active and is_published;
  if not found or v_item.audience<>'ministers' then return false; end if;
  select * into v_grant from public.nh7_minister_access_v251 g
  where g.user_id=p_user_id and g.revoked_at is null and (g.expires_at is null or g.expires_at>now()) limit 1;
  if not found then return false; end if;
  return v_grant.library_all
    or p_item_id=any(v_grant.library_item_ids)
    or (v_item.collection_id is not null and v_item.collection_id=any(v_grant.library_collection_ids));
end;$$;

create or replace function public.nh7_minister_media_allowed_v251(p_user_id uuid,p_video_id uuid)
returns boolean
language plpgsql stable security definer set search_path=public as $$
declare v_grant public.nh7_minister_access_v251;
begin
  if coalesce(public.nh7_is_admin(),false) then return true; end if;
  if p_user_id is null then return false; end if;
  select * into v_grant from public.nh7_minister_access_v251 g
  where g.user_id=p_user_id and g.revoked_at is null and (g.expires_at is null or g.expires_at>now()) limit 1;
  if not found then return false; end if;
  if v_grant.media_all then return true; end if;
  if p_video_id is null then return coalesce(array_length(v_grant.video_ids,1),0)>0; end if;
  return p_video_id=any(v_grant.video_ids);
end;$$;

create or replace function public.nh7_minister_access_summary_v251()
returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare v public.nh7_minister_access_v251;
begin
  if auth.uid() is null then return jsonb_build_object('authenticated',false,'library',false,'media',false); end if;
  if coalesce(public.nh7_is_admin(),false) then return jsonb_build_object('authenticated',true,'library',true,'media',true,'admin',true); end if;
  select * into v from public.nh7_minister_access_v251 g
  where g.user_id=auth.uid() and g.revoked_at is null and (g.expires_at is null or g.expires_at>now()) limit 1;
  if not found then return jsonb_build_object('authenticated',true,'library',false,'media',false,'admin',false); end if;
  return jsonb_build_object(
    'authenticated',true,
    'library',v.library_all or coalesce(array_length(v.library_collection_ids,1),0)>0 or coalesce(array_length(v.library_item_ids,1),0)>0,
    'media',v.media_all or coalesce(array_length(v.video_ids,1),0)>0,
    'library_all',v.library_all,
    'media_all',v.media_all,
    'expires_at',v.expires_at,
    'admin',false
  );
end;$$;

grant execute on function public.nh7_minister_grant_active_v251(uuid) to authenticated,service_role;
grant execute on function public.nh7_minister_library_allowed_v251(uuid,uuid) to authenticated,service_role;
grant execute on function public.nh7_minister_media_allowed_v251(uuid,uuid) to authenticated,service_role;
grant execute on function public.nh7_minister_access_summary_v251() to authenticated;

-- Catalogs now enforce minister grants server-side; ungranted users do not receive minister titles or metadata.
create or replace view public.nh7_library_items_v224 as
select i.id,i.title_fa,i.title_en,i.title_hr,i.description_fa,i.description_en,i.description_hr,
       i.audience,i.resource_type,i.apocrypha_book,i.mime_type,i.file_name,i.file_size,i.cover_url,
       i.sort_order,i.created_at,i.updated_at,i.reader_mode,i.reader_language,'{}'::jsonb as reader_text,
       i.reader_status,i.reader_page_count,i.reader_updated_at,
       (i.reader_status='ready' and i.reader_mode in ('text','both')) as reader_available,
       i.collection_id
from public.nh7_library_items i
where i.is_published and i.is_active
  and (
    coalesce(public.nh7_is_admin(),false)
    or (i.audience<>'ministers' and auth.uid() is not null and public.nh7_school_access_approved_v230(auth.uid(),coalesce(auth.jwt()->>'email',''),'') )
    or (i.audience='ministers' and auth.uid() is not null and public.nh7_minister_library_allowed_v251(auth.uid(),i.id))
  );

grant select on public.nh7_library_items_v224 to authenticated;

create or replace view public.nh7_library_collections_public_v322 as
select c.id,c.slug,c.title_fa,c.title_en,c.title_hr,c.description_fa,c.description_en,c.description_hr,
       c.icon,c.audience,c.sort_order,count(i.id)::integer as item_count
from public.nh7_library_collections_v322 c
left join public.nh7_library_items i
  on i.collection_id=c.id and i.resource_type='library' and i.is_active and i.is_published and i.audience=c.audience
where c.is_active
  and (
    coalesce(public.nh7_is_admin(),false)
    or (c.audience<>'ministers' and auth.uid() is not null and public.nh7_school_access_approved_v230(auth.uid(),coalesce(auth.jwt()->>'email',''),'') )
    or (c.audience='ministers' and auth.uid() is not null and exists(
      select 1 from public.nh7_library_items li
      where li.collection_id=c.id and li.audience='ministers' and li.is_active and li.is_published
        and public.nh7_minister_library_allowed_v251(auth.uid(),li.id)
    ))
  )
group by c.id
order by c.audience,c.sort_order,c.created_at;

grant select on public.nh7_library_collections_public_v322 to authenticated;

create or replace function public.nh7_library_catalog_v341()
returns table(id uuid,title_fa text,title_en text,title_hr text,description_fa text,description_en text,description_hr text,audience text,resource_type text,apocrypha_book text,mime_type text,file_name text,file_size bigint,cover_url text,sort_order integer,created_at timestamptz,updated_at timestamptz,reader_mode text,reader_language text,reader_text jsonb,reader_status text,reader_page_count integer,reader_updated_at timestamptz,reader_available boolean,collection_id uuid)
language plpgsql stable security definer set search_path=public as $$
begin
  if auth.role()<>'authenticated' or auth.uid() is null then raise exception 'login_required'; end if;
  return query
  select i.id,i.title_fa,i.title_en,i.title_hr,i.description_fa,i.description_en,i.description_hr,
         i.audience,i.resource_type,i.apocrypha_book,i.mime_type,i.file_name,i.file_size,i.cover_url,
         i.sort_order,i.created_at,i.updated_at,i.reader_mode,i.reader_language,'{}'::jsonb,i.reader_status,
         i.reader_page_count,i.reader_updated_at,(i.reader_status='ready' and i.reader_mode in ('text','both')),i.collection_id
  from public.nh7_library_items i
  where i.is_published and i.is_active and (
    coalesce(public.nh7_is_admin(),false)
    or (i.audience<>'ministers' and public.nh7_school_access_approved_v230(auth.uid(),coalesce(auth.jwt()->>'email',''),'') )
    or (i.audience='ministers' and public.nh7_minister_library_allowed_v251(auth.uid(),i.id))
  )
  order by i.resource_type,i.audience,i.sort_order,i.created_at desc;
end;$$;

grant execute on function public.nh7_library_catalog_v341() to authenticated;

create or replace function public.nh7_library_collections_catalog_v341()
returns table(id uuid,slug text,title_fa text,title_en text,title_hr text,description_fa text,description_en text,description_hr text,icon text,audience text,sort_order integer,item_count integer)
language plpgsql stable security definer set search_path=public as $$
begin
  if auth.role()<>'authenticated' or auth.uid() is null then raise exception 'login_required'; end if;
  return query
  select c.id,c.slug,c.title_fa,c.title_en,c.title_hr,c.description_fa,c.description_en,c.description_hr,c.icon,c.audience,c.sort_order,
         count(i.id)::integer
  from public.nh7_library_collections_v322 c
  left join public.nh7_library_items i
    on i.collection_id=c.id and i.resource_type='library' and i.is_active and i.is_published and i.audience=c.audience
    and (i.audience<>'ministers' or public.nh7_minister_library_allowed_v251(auth.uid(),i.id))
  where c.is_active and (
    coalesce(public.nh7_is_admin(),false)
    or (c.audience<>'ministers' and public.nh7_school_access_approved_v230(auth.uid(),coalesce(auth.jwt()->>'email',''),'') )
    or (c.audience='ministers' and exists(
      select 1 from public.nh7_library_items li where li.collection_id=c.id and li.is_active and li.is_published and li.audience='ministers'
        and public.nh7_minister_library_allowed_v251(auth.uid(),li.id)
    ))
  )
  group by c.id order by c.audience,c.sort_order,c.created_at;
end;$$;

grant execute on function public.nh7_library_collections_catalog_v341() to authenticated;

-- Library authorization keeps its historical signature for compatibility, but codes are no longer consulted.
create or replace function public.nh7_library_authorize_v230(p_item_id uuid,p_code text default '',p_device_id text default '',p_user_id uuid default null,p_user_email text default '')
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare v_item public.nh7_library_items; v_user uuid:=coalesce(p_user_id,auth.uid()); v_email text:=lower(trim(coalesce(nullif(p_user_email,''),auth.jwt()->>'email','')));
begin
  if auth.role() not in ('service_role','authenticated') or v_user is null or v_email='' then return jsonb_build_object('allowed',false,'code','login_required'); end if;
  if auth.role()='authenticated' and auth.uid() is distinct from v_user then return jsonb_build_object('allowed',false,'code','identity_mismatch'); end if;
  select * into v_item from public.nh7_library_items where id=p_item_id and is_active and is_published;
  if not found then return jsonb_build_object('allowed',false,'code','not_found'); end if;
  if v_item.audience='ministers' then
    if not public.nh7_minister_library_allowed_v251(v_user,v_item.id) then return jsonb_build_object('allowed',false,'code','minister_access_required'); end if;
  elsif not coalesce(public.nh7_is_admin(),false) and not public.nh7_school_access_approved_v230(v_user,v_email,p_device_id) then
    return jsonb_build_object('allowed',false,'code','school_approval_required');
  end if;
  insert into public.nh7_library_access_log(code_id,item_id,user_email,device_id,accessed_at)
  values(null,v_item.id,v_email,left(coalesce(p_device_id,''),160),now());
  return jsonb_build_object('allowed',true,'storage_path',v_item.storage_path,'title_fa',v_item.title_fa,'title_en',v_item.title_en,'title_hr',v_item.title_hr,'file_name',v_item.file_name,'mime_type',v_item.mime_type,'audience',v_item.audience,'resource_type',v_item.resource_type,'apocrypha_book',v_item.apocrypha_book,'grant_active',true,'new_redemption',false);
end;$$;

grant execute on function public.nh7_library_authorize_v230(uuid,text,text,uuid,text) to authenticated,service_role;

-- Visual media portal now uses only the signed-in account grant. Device ID remains only for watermarking.
create or replace function public.nh7_video_portal_authorize_v270(p_code text default '',p_device_id text default '',p_user_id uuid default null,p_user_email text default '')
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare v_user uuid:=coalesce(p_user_id,auth.uid()); v_email text:=lower(trim(coalesce(nullif(p_user_email,''),auth.jwt()->>'email',''))); v_device text:=left(trim(coalesce(p_device_id,'')),160); v_catalog jsonb;
begin
  if auth.role() not in ('service_role','authenticated') or v_user is null or v_email='' then return jsonb_build_object('allowed',false,'code','login_required'); end if;
  if auth.role()='authenticated' and auth.uid() is distinct from v_user then return jsonb_build_object('allowed',false,'code','identity_mismatch'); end if;
  if not public.nh7_minister_media_allowed_v251(v_user,null) then return jsonb_build_object('allowed',false,'code','minister_access_required'); end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',v.id,'title_fa',v.title_fa,'title_en',v.title_en,'title_hr',v.title_hr,'description_fa',v.description_fa,'description_en',v.description_en,'description_hr',v.description_hr,'topic',v.topic,'file_name',v.file_name,'mime_type',v.mime_type,'file_size',v.file_size,'duration_seconds',v.duration_seconds,'sort_order',v.sort_order,'has_subtitle_en',v.subtitle_en_path<>'','has_subtitle_hr',v.subtitle_hr_path<>'') order by v.sort_order,v.created_at desc),'[]'::jsonb)
  into v_catalog from public.nh7_school_videos_v260 v
  where v.is_active and v.is_published and public.nh7_minister_media_allowed_v251(v_user,v.id);
  return jsonb_build_object('allowed',true,'catalog',v_catalog,'watermark_email',v_email,'watermark_device',right(v_device,8));
end;$$;

create or replace function public.nh7_video_authorize_v270(p_video_id uuid,p_code text default '',p_device_id text default '',p_user_id uuid default null,p_user_email text default '')
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare v_user uuid:=coalesce(p_user_id,auth.uid()); v_email text:=lower(trim(coalesce(nullif(p_user_email,''),auth.jwt()->>'email',''))); v_device text:=left(trim(coalesce(p_device_id,'')),160); v_video public.nh7_school_videos_v260;
begin
  if auth.role() not in ('service_role','authenticated') or v_user is null or v_email='' then return jsonb_build_object('allowed',false,'code','login_required'); end if;
  if auth.role()='authenticated' and auth.uid() is distinct from v_user then return jsonb_build_object('allowed',false,'code','identity_mismatch'); end if;
  select * into v_video from public.nh7_school_videos_v260 where id=p_video_id and is_active and is_published;
  if not found then return jsonb_build_object('allowed',false,'code','video_not_found'); end if;
  if not public.nh7_minister_media_allowed_v251(v_user,v_video.id) then return jsonb_build_object('allowed',false,'code','minister_access_required'); end if;
  return jsonb_build_object('allowed',true,'kind','video','bucket','nh7-school-media','storage_path',v_video.storage_path,'file_name',v_video.file_name,'mime_type',v_video.mime_type,'duration_seconds',v_video.duration_seconds,'title_fa',v_video.title_fa,'title_en',v_video.title_en,'title_hr',v_video.title_hr,'subtitle_en_path',v_video.subtitle_en_path,'subtitle_hr_path',v_video.subtitle_hr_path,'watermark_email',v_email,'watermark_device',right(v_device,8));
end;$$;

grant execute on function public.nh7_video_portal_authorize_v270(text,text,uuid,text) to authenticated,service_role;
grant execute on function public.nh7_video_authorize_v270(uuid,text,text,uuid,text) to authenticated,service_role;

create or replace function public.nh7_admin_minister_access_dashboard_v251()
returns jsonb language plpgsql security definer set search_path=public as $$
declare v jsonb;
begin
  if not public.nh7_is_admin() then raise exception 'Admin access required'; end if;
  select jsonb_build_object(
    'users',coalesce((select jsonb_agg(jsonb_build_object(
      'id',u.id,'email',lower(u.email),'name',coalesce(nullif(trim(concat_ws(' ',r.payload->>'firstName',r.payload->>'lastName')),''),nullif(trim(coalesce(r.payload->>'fullName',r.payload->>'name')),''),nullif(trim(coalesce(u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name')),''),lower(u.email)),
      'school_approved',coalesce(lower(r.status)='approved',false)
    ) order by lower(u.email))
    from auth.users u
    left join lateral (
      select rr.* from public.registrations rr
      where lower(trim(coalesce(rr.payload->>'email','')))=lower(u.email)
      order by (lower(coalesce(rr.status,''))='approved') desc, rr.updated_at desc limit 1
    ) r on true
    where u.email is not null and coalesce(u.deleted_at,'infinity'::timestamptz)>now()),'[]'::jsonb),
    'grants',coalesce((select jsonb_agg(to_jsonb(g) order by g.updated_at desc) from public.nh7_minister_access_v251 g),'[]'::jsonb),
    'library_items',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'collection_id',i.collection_id,'title_fa',i.title_fa,'title_en',i.title_en,'title_hr',i.title_hr,'file_name',i.file_name) order by i.sort_order,i.created_at) from public.nh7_library_items i where i.audience='ministers' and i.resource_type='library' and i.is_active),'[]'::jsonb),
    'collections',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'title_fa',c.title_fa,'title_en',c.title_en,'title_hr',c.title_hr,'icon',c.icon) order by c.sort_order,c.created_at) from public.nh7_library_collections_v322 c where c.audience='ministers' and c.is_active),'[]'::jsonb),
    'videos',coalesce((select jsonb_agg(jsonb_build_object('id',vv.id,'title_fa',vv.title_fa,'title_en',vv.title_en,'title_hr',vv.title_hr,'topic',vv.topic,'file_name',vv.file_name) order by vv.sort_order,vv.created_at) from public.nh7_school_videos_v260 vv where vv.is_active),'[]'::jsonb)
  ) into v;
  return v;
end;$$;

create or replace function public.nh7_admin_minister_access_save_v251(
  p_user_id uuid,
  p_library_all boolean default false,
  p_media_all boolean default false,
  p_library_collection_ids uuid[] default '{}'::uuid[],
  p_library_item_ids uuid[] default '{}'::uuid[],
  p_video_ids uuid[] default '{}'::uuid[],
  p_expires_at timestamptz default null
)
returns public.nh7_minister_access_v251 language plpgsql security definer set search_path=public as $$
declare v_email text; v_row public.nh7_minister_access_v251;
begin
  if not public.nh7_is_admin() then raise exception 'Admin access required'; end if;
  select lower(email) into v_email from auth.users where id=p_user_id and email is not null;
  if v_email is null then raise exception 'User account was not found'; end if;
  insert into public.nh7_minister_access_v251(user_id,user_email,library_all,media_all,library_collection_ids,library_item_ids,video_ids,expires_at,revoked_at,created_by,updated_at)
  values(p_user_id,v_email,coalesce(p_library_all,false),coalesce(p_media_all,false),coalesce(p_library_collection_ids,'{}'::uuid[]),coalesce(p_library_item_ids,'{}'::uuid[]),coalesce(p_video_ids,'{}'::uuid[]),p_expires_at,null,lower(coalesce(auth.jwt()->>'email','')),now())
  on conflict(user_id) do update set user_email=excluded.user_email,library_all=excluded.library_all,media_all=excluded.media_all,library_collection_ids=excluded.library_collection_ids,library_item_ids=excluded.library_item_ids,video_ids=excluded.video_ids,expires_at=excluded.expires_at,revoked_at=null,updated_at=now()
  returning * into v_row;
  return v_row;
end;$$;

create or replace function public.nh7_admin_minister_access_revoke_v251(p_user_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  if not public.nh7_is_admin() then raise exception 'Admin access required'; end if;
  update public.nh7_minister_access_v251 set revoked_at=now(),updated_at=now() where user_id=p_user_id and revoked_at is null;
  return found;
end;$$;

grant execute on function public.nh7_admin_minister_access_dashboard_v251() to authenticated;
grant execute on function public.nh7_admin_minister_access_save_v251(uuid,boolean,boolean,uuid[],uuid[],uuid[],timestamptz) to authenticated;
grant execute on function public.nh7_admin_minister_access_revoke_v251(uuid) to authenticated;

-- Password/code system is retired. Existing records were test-only and are removed.
delete from public.nh7_school_video_grants_v260;
delete from public.nh7_school_video_codes_v260;
delete from public.nh7_library_user_grants_v230;
delete from public.nh7_library_access_codes;

revoke execute on function public.nh7_admin_library_create_code_v222(text,text,timestamptz,integer) from authenticated;
revoke execute on function public.nh7_admin_library_disable_code_v222(uuid) from authenticated;
revoke execute on function public.nh7_admin_school_video_create_code_v260(text,text,timestamptz,uuid) from authenticated;
revoke execute on function public.nh7_admin_school_video_create_person_code_v317(text,text,text,text,timestamptz,uuid) from authenticated;
revoke execute on function public.nh7_admin_school_video_disable_code_v260(uuid) from authenticated;
