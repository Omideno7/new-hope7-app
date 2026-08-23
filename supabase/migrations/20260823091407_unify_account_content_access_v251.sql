-- New Hope 7 v2.5.1 — final unification of ministers access on one Account-ID grant system.
-- This migration intentionally keeps legacy RPC signatures for compatibility, but passwords/codes are ignored.

-- Remove the abandoned parallel grant model created during RC development.
drop function if exists public.nh7_admin_minister_access_revoke_v251(uuid);
drop function if exists public.nh7_admin_minister_access_save_v251(uuid,boolean,boolean,uuid[],uuid[],uuid[],timestamptz);
drop function if exists public.nh7_admin_minister_access_dashboard_v251();
drop function if exists public.nh7_minister_access_summary_v251();
drop function if exists public.nh7_minister_media_allowed_v251(uuid,uuid);
drop function if exists public.nh7_minister_library_allowed_v251(uuid,uuid);
drop function if exists public.nh7_minister_grant_active_v251(uuid);
drop table if exists public.nh7_minister_access_v251;

-- Keep the historical catalogue interfaces working, but source them from the unified v251 views.
create or replace view public.nh7_library_items_v224 as
select * from public.nh7_library_items_v251;
revoke all on public.nh7_library_items_v224 from anon;
grant select on public.nh7_library_items_v224 to authenticated;

create or replace view public.nh7_library_collections_public_v322 as
select * from public.nh7_library_collections_public_v251;
revoke all on public.nh7_library_collections_public_v322 from anon;
grant select on public.nh7_library_collections_public_v322 to authenticated;

create or replace function public.nh7_library_catalog_v341()
returns table(
  id uuid,title_fa text,title_en text,title_hr text,
  description_fa text,description_en text,description_hr text,
  audience text,resource_type text,apocrypha_book text,mime_type text,
  file_name text,file_size bigint,cover_url text,sort_order integer,
  created_at timestamptz,updated_at timestamptz,reader_mode text,
  reader_language text,reader_text jsonb,reader_status text,
  reader_page_count integer,reader_updated_at timestamptz,
  reader_available boolean,collection_id uuid
)
language sql stable security definer set search_path=public as $$
  select * from public.nh7_library_items_v251
  order by resource_type,audience,sort_order,created_at desc;
$$;
revoke all on function public.nh7_library_catalog_v341() from public,anon;
grant execute on function public.nh7_library_catalog_v341() to authenticated;

create or replace function public.nh7_library_collections_catalog_v341()
returns table(
  id uuid,slug text,title_fa text,title_en text,title_hr text,
  description_fa text,description_en text,description_hr text,
  icon text,audience text,sort_order integer,item_count integer
)
language sql stable security definer set search_path=public as $$
  select * from public.nh7_library_collections_public_v251
  order by audience,sort_order;
$$;
revoke all on function public.nh7_library_collections_catalog_v341() from public,anon;
grant execute on function public.nh7_library_collections_catalog_v341() to authenticated;

-- Legacy library authorization signature retained for old clients; p_code is deliberately ignored.
create or replace function public.nh7_library_authorize_v230(
  p_item_id uuid,
  p_code text default '',
  p_device_id text default '',
  p_user_id uuid default null,
  p_user_email text default ''
)
returns jsonb
language sql security definer set search_path=public as $$
  select public.nh7_library_authorize_v251(
    p_item_id,
    p_device_id,
    coalesce(p_user_id,auth.uid()),
    p_user_email
  );
$$;
revoke all on function public.nh7_library_authorize_v230(uuid,text,text,uuid,text) from public,anon;
grant execute on function public.nh7_library_authorize_v230(uuid,text,text,uuid,text) to authenticated,service_role;

-- Legacy visual-media signatures retained for old clients; p_code is deliberately ignored.
create or replace function public.nh7_video_portal_authorize_v270(
  p_code text default '',
  p_device_id text default '',
  p_user_id uuid default null,
  p_user_email text default ''
)
returns jsonb
language sql security definer set search_path=public as $$
  select public.nh7_video_portal_authorize_v251(
    p_device_id,
    coalesce(p_user_id,auth.uid()),
    p_user_email
  );
$$;
revoke all on function public.nh7_video_portal_authorize_v270(text,text,uuid,text) from public,anon;
grant execute on function public.nh7_video_portal_authorize_v270(text,text,uuid,text) to authenticated,service_role;

create or replace function public.nh7_video_authorize_v270(
  p_video_id uuid,
  p_code text default '',
  p_device_id text default '',
  p_user_id uuid default null,
  p_user_email text default ''
)
returns jsonb
language sql security definer set search_path=public as $$
  select public.nh7_video_authorize_v251(
    p_video_id,
    p_device_id,
    coalesce(p_user_id,auth.uid()),
    p_user_email
  );
$$;
revoke all on function public.nh7_video_authorize_v270(uuid,text,text,uuid,text) from public,anon;
grant execute on function public.nh7_video_authorize_v270(uuid,text,text,uuid,text) to authenticated,service_role;

-- Retire password/code creation from all client roles. Historical empty tables remain only for schema compatibility.
revoke execute on function public.nh7_admin_library_create_code_v222(text,text,timestamptz,integer) from public,anon,authenticated;
revoke execute on function public.nh7_admin_library_disable_code_v222(uuid) from public,anon,authenticated;
revoke execute on function public.nh7_admin_school_video_create_code_v260(text,text,timestamptz,uuid) from public,anon,authenticated;
revoke execute on function public.nh7_admin_school_video_create_person_code_v317(text,text,text,text,timestamptz,uuid) from public,anon,authenticated;
revoke execute on function public.nh7_admin_school_video_disable_code_v260(uuid) from public,anon,authenticated;

-- Test-only legacy records are intentionally removed; the new system starts with explicit Account-ID grants only.
delete from public.nh7_school_video_grants_v260;
delete from public.nh7_school_video_codes_v260;
delete from public.nh7_library_user_grants_v230;
delete from public.nh7_library_access_codes_v222;
