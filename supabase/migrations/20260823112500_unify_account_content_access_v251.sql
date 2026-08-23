-- New Hope 7 v2.5.1 corrective migration
-- One source of truth: nh7_account_content_grants_v251 / nh7_content_access_active_v251.

-- Legacy/current library catalog is kept compatible but now uses the unified account-ID grant table.
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
    or (
      auth.uid() is not null and (
        (i.audience='ministers' and public.nh7_content_access_active_v251(auth.uid(),'library_item',i.id))
        or (i.audience<>'ministers' and public.nh7_school_access_approved_v230(auth.uid(),coalesce(auth.jwt()->>'email',''),'') )
      )
    )
  );
revoke all on public.nh7_library_items_v224 from anon;
grant select on public.nh7_library_items_v224 to authenticated;

create or replace view public.nh7_library_collections_public_v322 as
select c.id,c.slug,c.title_fa,c.title_en,c.title_hr,c.description_fa,c.description_en,c.description_hr,
       c.icon,c.audience,c.sort_order,count(i.id)::integer as item_count
from public.nh7_library_collections_v322 c
left join public.nh7_library_items i
  on i.collection_id=c.id
 and i.resource_type='library'
 and i.is_active and i.is_published
 and i.audience=c.audience
 and (
   c.audience<>'ministers'
   or coalesce(public.nh7_is_admin(),false)
   or public.nh7_content_access_active_v251(auth.uid(),'library_item',i.id)
 )
where c.is_active
  and (
    coalesce(public.nh7_is_admin(),false)
    or (
      auth.uid() is not null and (
        (c.audience='ministers' and public.nh7_content_access_active_v251(auth.uid(),'library_collection',c.id))
        or (c.audience<>'ministers' and public.nh7_school_access_approved_v230(auth.uid(),coalesce(auth.jwt()->>'email',''),'') )
      )
    )
  )
group by c.id
order by c.audience,c.sort_order,c.created_at;
revoke all on public.nh7_library_collections_public_v322 from anon;
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
    or (i.audience='ministers' and public.nh7_content_access_active_v251(auth.uid(),'library_item',i.id))
    or (i.audience<>'ministers' and public.nh7_school_access_approved_v230(auth.uid(),coalesce(auth.jwt()->>'email',''),'') )
  )
  order by i.resource_type,i.audience,i.sort_order,i.created_at desc;
end;$$;
revoke all on function public.nh7_library_catalog_v341() from public;
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
    and (i.audience<>'ministers' or coalesce(public.nh7_is_admin(),false) or public.nh7_content_access_active_v251(auth.uid(),'library_item',i.id))
  where c.is_active and (
    coalesce(public.nh7_is_admin(),false)
    or (c.audience='ministers' and public.nh7_content_access_active_v251(auth.uid(),'library_collection',c.id))
    or (c.audience<>'ministers' and public.nh7_school_access_approved_v230(auth.uid(),coalesce(auth.jwt()->>'email',''),'') )
  )
  group by c.id order by c.audience,c.sort_order,c.created_at;
end;$$;
revoke all on function public.nh7_library_collections_catalog_v341() from public;
grant execute on function public.nh7_library_collections_catalog_v341() to authenticated;

-- Keep the historical function signature for older installed clients, but ignore p_code entirely.
create or replace function public.nh7_library_authorize_v230(p_item_id uuid,p_code text default '',p_device_id text default '',p_user_id uuid default null,p_user_email text default '')
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare
  v_item public.nh7_library_items;
  v_user uuid:=coalesce(p_user_id,auth.uid());
  v_email text:=lower(trim(coalesce(nullif(p_user_email,''),auth.jwt()->>'email','')));
begin
  if auth.role() not in ('service_role','authenticated') or v_user is null or v_email='' then
    return jsonb_build_object('allowed',false,'code','login_required');
  end if;
  if auth.role()='authenticated' and auth.uid() is distinct from v_user then
    return jsonb_build_object('allowed',false,'code','identity_mismatch');
  end if;
  select * into v_item from public.nh7_library_items where id=p_item_id and is_active and is_published;
  if not found then return jsonb_build_object('allowed',false,'code','not_found'); end if;
  if v_item.audience='ministers' then
    if not coalesce(public.nh7_is_admin(),false)
       and not public.nh7_content_access_active_v251(v_user,'library_item',v_item.id) then
      return jsonb_build_object('allowed',false,'code','content_access_required');
    end if;
  elsif not coalesce(public.nh7_is_admin(),false)
        and not public.nh7_school_access_approved_v230(v_user,v_email,p_device_id) then
    return jsonb_build_object('allowed',false,'code','school_approval_required');
  end if;
  insert into public.nh7_library_access_log(code_id,item_id,user_email,device_id,accessed_at)
  values(null,v_item.id,v_email,left(coalesce(p_device_id,''),160),now());
  return jsonb_build_object(
    'allowed',true,'storage_path',v_item.storage_path,
    'title_fa',v_item.title_fa,'title_en',v_item.title_en,'title_hr',v_item.title_hr,
    'file_name',v_item.file_name,'mime_type',v_item.mime_type,'audience',v_item.audience,
    'resource_type',v_item.resource_type,'apocrypha_book',v_item.apocrypha_book,
    'grant_active',true,'new_redemption',false
  );
end;$$;
revoke all on function public.nh7_library_authorize_v230(uuid,text,text,uuid,text) from public;
grant execute on function public.nh7_library_authorize_v230(uuid,text,text,uuid,text) to authenticated,service_role;

-- Legacy video RPC signatures are preserved only for installed-client compatibility; p_code is ignored.
create or replace function public.nh7_video_portal_authorize_v270(p_code text default '',p_device_id text default '',p_user_id uuid default null,p_user_email text default '')
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare
  v_user uuid:=coalesce(p_user_id,auth.uid());
  v_email text:=lower(trim(coalesce(nullif(p_user_email,''),auth.jwt()->>'email','')));
  v_device text:=left(trim(coalesce(p_device_id,'')),160);
  v_catalog jsonb;
begin
  if auth.role() not in ('service_role','authenticated') or v_user is null or v_email='' then
    return jsonb_build_object('allowed',false,'code','login_required');
  end if;
  if auth.role()='authenticated' and auth.uid() is distinct from v_user then
    return jsonb_build_object('allowed',false,'code','identity_mismatch');
  end if;
  if not coalesce(public.nh7_is_admin(),false)
     and not public.nh7_content_access_active_v251(v_user,'media_all',null) then
    return jsonb_build_object('allowed',false,'code','content_access_required');
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
  where v.is_active and v.is_published
    and (coalesce(public.nh7_is_admin(),false) or public.nh7_content_access_active_v251(v_user,'video_item',v.id));
  return jsonb_build_object('allowed',true,'catalog',v_catalog,'watermark_email',v_email,'watermark_device',right(v_device,8));
end;$$;
revoke all on function public.nh7_video_portal_authorize_v270(text,text,uuid,text) from public;
grant execute on function public.nh7_video_portal_authorize_v270(text,text,uuid,text) to authenticated,service_role;

create or replace function public.nh7_video_authorize_v270(p_video_id uuid,p_code text default '',p_device_id text default '',p_user_id uuid default null,p_user_email text default '')
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare
  v_user uuid:=coalesce(p_user_id,auth.uid());
  v_email text:=lower(trim(coalesce(nullif(p_user_email,''),auth.jwt()->>'email','')));
  v_device text:=left(trim(coalesce(p_device_id,'')),160);
  v_video public.nh7_school_videos_v260;
begin
  if auth.role() not in ('service_role','authenticated') or v_user is null or v_email='' then
    return jsonb_build_object('allowed',false,'code','login_required');
  end if;
  if auth.role()='authenticated' and auth.uid() is distinct from v_user then
    return jsonb_build_object('allowed',false,'code','identity_mismatch');
  end if;
  select * into v_video from public.nh7_school_videos_v260 where id=p_video_id and is_active and is_published;
  if not found then return jsonb_build_object('allowed',false,'code','video_not_found'); end if;
  if not coalesce(public.nh7_is_admin(),false)
     and not public.nh7_content_access_active_v251(v_user,'video_item',v_video.id) then
    return jsonb_build_object('allowed',false,'code','content_access_required');
  end if;
  return jsonb_build_object(
    'allowed',true,'kind','video','bucket','nh7-school-media','storage_path',v_video.storage_path,
    'file_name',v_video.file_name,'mime_type',v_video.mime_type,'duration_seconds',v_video.duration_seconds,
    'title_fa',v_video.title_fa,'title_en',v_video.title_en,'title_hr',v_video.title_hr,
    'subtitle_en_path',v_video.subtitle_en_path,'subtitle_hr_path',v_video.subtitle_hr_path,
    'watermark_email',v_email,'watermark_device',right(v_device,8)
  );
end;$$;
revoke all on function public.nh7_video_authorize_v270(uuid,text,text,uuid,text) from public;
grant execute on function public.nh7_video_authorize_v270(uuid,text,text,uuid,text) to authenticated,service_role;

create or replace function public.nh7_school_video_catalog_v260()
returns table(id uuid,title_fa text,title_en text,title_hr text,description_fa text,description_en text,description_hr text,topic text,file_name text,mime_type text,file_size bigint,duration_seconds integer,sort_order integer,has_subtitle_en boolean,has_subtitle_hr boolean)
language sql stable security definer set search_path=public as $$
  select v.id,v.title_fa,v.title_en,v.title_hr,v.description_fa,v.description_en,v.description_hr,
         v.topic,v.file_name,v.mime_type,v.file_size,v.duration_seconds,v.sort_order,
         v.subtitle_en_path<>'',v.subtitle_hr_path<>''
  from public.nh7_school_videos_v260 v
  where auth.uid() is not null
    and v.is_active and v.is_published
    and (coalesce(public.nh7_is_admin(),false) or public.nh7_content_access_active_v251(auth.uid(),'video_item',v.id))
  order by v.sort_order,v.created_at desc;
$$;
revoke all on function public.nh7_school_video_catalog_v260() from public;
grant execute on function public.nh7_school_video_catalog_v260() to authenticated;

-- Remove the accidental parallel grant model now that no function depends on it.
drop function if exists public.nh7_admin_minister_access_dashboard_v251();
drop function if exists public.nh7_admin_minister_access_save_v251(uuid,boolean,boolean,uuid[],uuid[],uuid[],timestamptz);
drop function if exists public.nh7_admin_minister_access_revoke_v251(uuid);
drop function if exists public.nh7_minister_access_summary_v251();
drop function if exists public.nh7_minister_grant_active_v251(uuid);
drop function if exists public.nh7_minister_library_allowed_v251(uuid,uuid);
drop function if exists public.nh7_minister_media_allowed_v251(uuid,uuid);
drop table if exists public.nh7_minister_access_v251;

-- Password creation remains disabled; old test rows were already removed by the preceding migration.
revoke execute on function public.nh7_admin_library_create_code_v222(text,text,timestamptz,integer) from authenticated;
revoke execute on function public.nh7_admin_library_disable_code_v222(uuid) from authenticated;
revoke execute on function public.nh7_admin_school_video_create_code_v260(text,text,timestamptz,uuid) from authenticated;
revoke execute on function public.nh7_admin_school_video_create_person_code_v317(text,text,text,text,timestamptz,uuid) from authenticated;
revoke execute on function public.nh7_admin_school_video_disable_code_v260(uuid) from authenticated;
