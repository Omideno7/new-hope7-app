-- New Hope 7 v2.5.1 — unified account-ID access for ministers library and visual media.
-- Additive migration: current public/library/media interfaces remain intact until the v2.5.1 client is promoted.

create table if not exists public.nh7_account_content_grants_v251 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null default '',
  scope text not null,
  resource_id uuid null,
  expires_at timestamptz null,
  revoked_at timestamptz null,
  note text not null default '',
  granted_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nh7_account_content_scope_v251 check (
    scope in ('library_all','library_collection','library_item','media_all','video_item')
  ),
  constraint nh7_account_content_resource_v251 check (
    (scope in ('library_all','media_all') and resource_id is null)
    or (scope in ('library_collection','library_item','video_item') and resource_id is not null)
  )
);

create unique index if not exists nh7_account_content_grants_v251_unique
  on public.nh7_account_content_grants_v251(user_id,scope,coalesce(resource_id,'00000000-0000-0000-0000-000000000000'::uuid));
create index if not exists nh7_account_content_grants_v251_user_active
  on public.nh7_account_content_grants_v251(user_id,revoked_at,expires_at);

alter table public.nh7_account_content_grants_v251 enable row level security;
revoke all on public.nh7_account_content_grants_v251 from anon,authenticated;

create or replace function public.nh7_content_access_active_v251(
  p_user_id uuid,
  p_scope text,
  p_resource_id uuid default null
)
returns boolean
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_collection uuid;
begin
  if p_user_id is null then return false; end if;

  if p_scope='library_item' then
    select i.collection_id into v_collection
      from public.nh7_library_items i where i.id=p_resource_id;
    return exists(
      select 1 from public.nh7_account_content_grants_v251 g
      where g.user_id=p_user_id
        and g.revoked_at is null
        and (g.expires_at is null or g.expires_at>now())
        and (
          g.scope='library_all'
          or (g.scope='library_item' and g.resource_id=p_resource_id)
          or (g.scope='library_collection' and v_collection is not null and g.resource_id=v_collection)
        )
    );
  elsif p_scope='library_collection' then
    return exists(
      select 1 from public.nh7_account_content_grants_v251 g
      where g.user_id=p_user_id
        and g.revoked_at is null
        and (g.expires_at is null or g.expires_at>now())
        and (
          g.scope='library_all'
          or (g.scope='library_collection' and g.resource_id=p_resource_id)
          or (g.scope='library_item' and exists(
            select 1 from public.nh7_library_items i
            where i.id=g.resource_id and i.collection_id=p_resource_id
          ))
        )
    );
  elsif p_scope='video_item' then
    return exists(
      select 1 from public.nh7_account_content_grants_v251 g
      where g.user_id=p_user_id
        and g.revoked_at is null
        and (g.expires_at is null or g.expires_at>now())
        and (g.scope='media_all' or (g.scope='video_item' and g.resource_id=p_resource_id))
    );
  elsif p_scope='media_all' then
    return exists(
      select 1 from public.nh7_account_content_grants_v251 g
      where g.user_id=p_user_id
        and g.revoked_at is null
        and (g.expires_at is null or g.expires_at>now())
        and g.scope in ('media_all','video_item')
    );
  elsif p_scope='library_all' then
    return exists(
      select 1 from public.nh7_account_content_grants_v251 g
      where g.user_id=p_user_id
        and g.revoked_at is null
        and (g.expires_at is null or g.expires_at>now())
        and g.scope in ('library_all','library_collection','library_item')
    );
  end if;
  return false;
end;
$$;
revoke all on function public.nh7_content_access_active_v251(uuid,text,uuid) from public;
grant execute on function public.nh7_content_access_active_v251(uuid,text,uuid) to authenticated,service_role;

create or replace function public.nh7_my_content_access_v251()
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_user uuid:=auth.uid();
  v_email text:=lower(trim(coalesce(auth.jwt()->>'email','')));
  v_library boolean:=false;
  v_media boolean:=false;
  v_grants jsonb:='[]'::jsonb;
begin
  if auth.role()<>'authenticated' or v_user is null then
    return jsonb_build_object('authenticated',false,'library_any',false,'media_any',false,'grants','[]'::jsonb);
  end if;
  if coalesce(public.nh7_is_admin(),false) then
    return jsonb_build_object('authenticated',true,'admin',true,'user_id',v_user,'email',v_email,'library_any',true,'media_any',true,'grants','[]'::jsonb);
  end if;

  select exists(
    select 1 from public.nh7_account_content_grants_v251 g
    where g.user_id=v_user and g.revoked_at is null and (g.expires_at is null or g.expires_at>now())
      and g.scope like 'library_%'
  ), exists(
    select 1 from public.nh7_account_content_grants_v251 g
    where g.user_id=v_user and g.revoked_at is null and (g.expires_at is null or g.expires_at>now())
      and g.scope in ('media_all','video_item')
  ) into v_library,v_media;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',g.id,'scope',g.scope,'resource_id',g.resource_id,'expires_at',g.expires_at,'note',g.note
  ) order by g.created_at),'[]'::jsonb)
  into v_grants
  from public.nh7_account_content_grants_v251 g
  where g.user_id=v_user and g.revoked_at is null and (g.expires_at is null or g.expires_at>now());

  return jsonb_build_object(
    'authenticated',true,'admin',false,'user_id',v_user,'email',v_email,
    'library_any',v_library,'media_any',v_media,'grants',v_grants
  );
end;
$$;
revoke all on function public.nh7_my_content_access_v251() from public;
grant execute on function public.nh7_my_content_access_v251() to authenticated;

-- v2.5.1 app-only catalogue views. These do not alter the currently promoted v224/v322 interfaces.
create or replace view public.nh7_library_items_v251 as
select
  i.id,i.title_fa,i.title_en,i.title_hr,
  i.description_fa,i.description_en,i.description_hr,
  i.audience,i.resource_type,i.apocrypha_book,i.mime_type,
  i.file_name,i.file_size,i.cover_url,i.sort_order,i.created_at,i.updated_at,
  i.reader_mode,i.reader_language,'{}'::jsonb as reader_text,i.reader_status,
  i.reader_page_count,i.reader_updated_at,
  (i.reader_status='ready' and i.reader_mode in ('text','both')) as reader_available,
  i.collection_id
from public.nh7_library_items i
where i.is_published and i.is_active
  and (
    coalesce(public.nh7_is_admin(),false)
    or (
      auth.uid() is not null
      and (
        (i.audience='ministers' and public.nh7_content_access_active_v251(auth.uid(),'library_item',i.id))
        or (i.audience<>'ministers' and public.nh7_school_access_approved_v230(auth.uid(),coalesce(auth.jwt()->>'email',''),'') )
      )
    )
  );

revoke all on public.nh7_library_items_v251 from anon;
grant select on public.nh7_library_items_v251 to authenticated;

create or replace view public.nh7_library_collections_public_v251 as
select
  c.id,c.slug,c.title_fa,c.title_en,c.title_hr,
  c.description_fa,c.description_en,c.description_hr,
  c.icon,c.audience,c.sort_order,
  count(i.id)::integer as item_count
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
      auth.uid() is not null
      and (
        (c.audience='ministers' and public.nh7_content_access_active_v251(auth.uid(),'library_collection',c.id))
        or (c.audience<>'ministers' and public.nh7_school_access_approved_v230(auth.uid(),coalesce(auth.jwt()->>'email',''),'') )
      )
    )
  )
group by c.id
order by c.audience,c.sort_order,c.created_at;

revoke all on public.nh7_library_collections_public_v251 from anon;
grant select on public.nh7_library_collections_public_v251 to authenticated;

create or replace function public.nh7_library_authorize_v251(
  p_item_id uuid,
  p_device_id text default '',
  p_user_id uuid default null,
  p_user_email text default ''
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
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

  select * into v_item from public.nh7_library_items
  where id=p_item_id and is_active and is_published;
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
    'file_name',v_item.file_name,'mime_type',v_item.mime_type,
    'audience',v_item.audience,'resource_type',v_item.resource_type,
    'apocrypha_book',v_item.apocrypha_book,'grant_active',true
  );
end;
$$;
revoke all on function public.nh7_library_authorize_v251(uuid,text,uuid,text) from public;
grant execute on function public.nh7_library_authorize_v251(uuid,text,uuid,text) to authenticated,service_role;

create or replace function public.nh7_video_portal_authorize_v251(
  p_device_id text default '',
  p_user_id uuid default null,
  p_user_email text default ''
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
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
end;
$$;
revoke all on function public.nh7_video_portal_authorize_v251(text,uuid,text) from public;
grant execute on function public.nh7_video_portal_authorize_v251(text,uuid,text) to authenticated,service_role;

create or replace function public.nh7_video_authorize_v251(
  p_video_id uuid,
  p_device_id text default '',
  p_user_id uuid default null,
  p_user_email text default ''
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
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
  select * into v_video from public.nh7_school_videos_v260
  where id=p_video_id and is_active and is_published;
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
end;
$$;
revoke all on function public.nh7_video_authorize_v251(uuid,text,uuid,text) from public;
grant execute on function public.nh7_video_authorize_v251(uuid,text,uuid,text) to authenticated,service_role;

create or replace function public.nh7_admin_content_access_dashboard_v251()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_users jsonb;
  v_grants jsonb;
  v_collections jsonb;
  v_items jsonb;
  v_videos jsonb;
begin
  if not public.nh7_is_admin() then raise exception 'Admin access required'; end if;

  select coalesce(jsonb_agg(to_jsonb(x) order by x.display_name,x.email),'[]'::jsonb) into v_users
  from (
    select u.id as user_id,lower(coalesce(u.email,'')) as email,
      coalesce(
        nullif(trim(concat_ws(' ',r.payload->>'firstName',r.payload->>'lastName')),''),
        nullif(trim(coalesce(r.payload->>'fullName',r.payload->>'name')),''),
        lower(coalesce(u.email,''))
      ) as display_name,
      u.created_at
    from auth.users u
    left join lateral (
      select rr.payload from public.registrations rr
      where lower(trim(coalesce(rr.payload->>'email','')))=lower(coalesce(u.email,''))
      order by rr.updated_at desc,rr.created_at desc limit 1
    ) r on true
    where coalesce(u.email,'')<>''
    order by u.created_at desc
    limit 2000
  ) x;

  select coalesce(jsonb_agg(to_jsonb(g) order by g.created_at desc),'[]'::jsonb) into v_grants
  from public.nh7_account_content_grants_v251 g;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',c.id,'slug',c.slug,'title_fa',c.title_fa,'title_en',c.title_en,'title_hr',c.title_hr
  ) order by c.sort_order,c.created_at),'[]'::jsonb) into v_collections
  from public.nh7_library_collections_v322 c
  where c.is_active and c.audience='ministers';

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',i.id,'collection_id',i.collection_id,'title_fa',i.title_fa,'title_en',i.title_en,'title_hr',i.title_hr,
    'file_name',i.file_name
  ) order by i.sort_order,i.created_at desc),'[]'::jsonb) into v_items
  from public.nh7_library_items i
  where i.is_active and i.audience='ministers' and i.resource_type='library';

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',v.id,'title_fa',v.title_fa,'title_en',v.title_en,'title_hr',v.title_hr,'file_name',v.file_name,'topic',v.topic
  ) order by v.sort_order,v.created_at desc),'[]'::jsonb) into v_videos
  from public.nh7_school_videos_v260 v where v.is_active;

  return jsonb_build_object('users',v_users,'grants',v_grants,'collections',v_collections,'items',v_items,'videos',v_videos);
end;
$$;
revoke all on function public.nh7_admin_content_access_dashboard_v251() from public;
grant execute on function public.nh7_admin_content_access_dashboard_v251() to authenticated;

create or replace function public.nh7_admin_content_access_grant_v251(
  p_user_id uuid,
  p_scope text,
  p_resource_id uuid default null,
  p_expires_at timestamptz default null,
  p_note text default ''
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_email text;
  v_id uuid;
begin
  if not public.nh7_is_admin() then raise exception 'Admin access required'; end if;
  if p_scope not in ('library_all','library_collection','library_item','media_all','video_item') then raise exception 'Invalid access scope'; end if;
  select lower(coalesce(email,'')) into v_email from auth.users where id=p_user_id;
  if coalesce(v_email,'')='' then raise exception 'Account not found'; end if;
  if p_scope in ('library_all','media_all') and p_resource_id is not null then raise exception 'Resource must be empty for all-access grants'; end if;
  if p_scope in ('library_collection','library_item','video_item') and p_resource_id is null then raise exception 'Select a resource'; end if;
  if p_scope='library_collection' and not exists(select 1 from public.nh7_library_collections_v322 where id=p_resource_id and is_active and audience='ministers') then raise exception 'Minister collection not found'; end if;
  if p_scope='library_item' and not exists(select 1 from public.nh7_library_items where id=p_resource_id and is_active and audience='ministers' and resource_type='library') then raise exception 'Minister library item not found'; end if;
  if p_scope='video_item' and not exists(select 1 from public.nh7_school_videos_v260 where id=p_resource_id and is_active) then raise exception 'Video not found'; end if;

  select id into v_id from public.nh7_account_content_grants_v251
  where user_id=p_user_id and scope=p_scope and resource_id is not distinct from p_resource_id
  limit 1;
  if v_id is null then
    insert into public.nh7_account_content_grants_v251(user_id,user_email,scope,resource_id,expires_at,note,granted_by)
    values(p_user_id,v_email,p_scope,p_resource_id,p_expires_at,left(coalesce(p_note,''),500),lower(coalesce(auth.jwt()->>'email','')))
    returning id into v_id;
  else
    update public.nh7_account_content_grants_v251
    set user_email=v_email,expires_at=p_expires_at,revoked_at=null,note=left(coalesce(p_note,''),500),
        granted_by=lower(coalesce(auth.jwt()->>'email','')),updated_at=now()
    where id=v_id;
  end if;
  return v_id;
end;
$$;
revoke all on function public.nh7_admin_content_access_grant_v251(uuid,text,uuid,timestamptz,text) from public;
grant execute on function public.nh7_admin_content_access_grant_v251(uuid,text,uuid,timestamptz,text) to authenticated;

create or replace function public.nh7_admin_content_access_revoke_v251(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
begin
  if not public.nh7_is_admin() then raise exception 'Admin access required'; end if;
  update public.nh7_account_content_grants_v251 set revoked_at=now(),updated_at=now() where id=p_id and revoked_at is null;
  return found;
end;
$$;
revoke all on function public.nh7_admin_content_access_revoke_v251(uuid) from public;
grant execute on function public.nh7_admin_content_access_revoke_v251(uuid) to authenticated;

-- No real users have legacy password grants. Remove test credentials/grants and disable creation of new password codes.
delete from public.nh7_library_user_grants_v230;
delete from public.nh7_library_access_codes;
delete from public.nh7_school_video_grants_v260;
delete from public.nh7_school_video_codes_v260;

revoke execute on function public.nh7_admin_library_create_code_v222(text,text,timestamptz,integer) from public,authenticated;
revoke execute on function public.nh7_admin_library_disable_code_v222(uuid) from public,authenticated;
revoke execute on function public.nh7_admin_school_video_create_code_v260(text,text,timestamptz,uuid) from public,authenticated;
revoke execute on function public.nh7_admin_school_video_create_person_code_v317(text,text,text,text,timestamptz,uuid) from public,authenticated;
revoke execute on function public.nh7_admin_school_video_disable_code_v260(uuid) from public,authenticated;
