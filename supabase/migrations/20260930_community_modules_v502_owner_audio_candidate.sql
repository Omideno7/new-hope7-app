-- New Hope 7 v5.0.2 — Community modules candidate (owner-only prayer + audio testimonies).
-- PREVIEW CANDIDATE ONLY. DO NOT APPLY TO PRODUCTION WITHOUT EXPLICIT APPROVAL.
-- Release hardening: no Realtime subscription, trigger-driven polling, or background
-- refresh is introduced by this migration. Client/Admin reads are bounded and
-- event/on-demand driven; indexes below support the expected feed/ownership paths.

create extension if not exists pgcrypto;

-- =========================================================
-- User profile
-- =========================================================
create table if not exists public.nh7_user_profiles_v502 (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  original_photo_path text not null default '',
  photo_path text not null default '',
  photo_position_x numeric(8,3) not null default 0,
  photo_position_y numeric(8,3) not null default 0,
  photo_zoom numeric(6,3) not null default 1 check (photo_zoom between 1 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.nh7_user_profiles_v502 enable row level security;

drop policy if exists nh7_profile_read_own_v502 on public.nh7_user_profiles_v502;
create policy nh7_profile_read_own_v502 on public.nh7_user_profiles_v502
for select to authenticated using (user_id=(select auth.uid()));

drop policy if exists nh7_profile_insert_own_v502 on public.nh7_user_profiles_v502;
create policy nh7_profile_insert_own_v502 on public.nh7_user_profiles_v502
for insert to authenticated with check (user_id=(select auth.uid()));

drop policy if exists nh7_profile_update_own_v502 on public.nh7_user_profiles_v502;
create policy nh7_profile_update_own_v502 on public.nh7_user_profiles_v502
for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('nh7-profile-photos-v502','nh7-profile-photos-v502',false,5242880,
array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists nh7_profile_photo_read_own_v502 on storage.objects;
create policy nh7_profile_photo_read_own_v502 on storage.objects
for select to authenticated using (
  bucket_id='nh7-profile-photos-v502' and (storage.foldername(name))[1]=(select auth.uid())::text
);
drop policy if exists nh7_profile_photo_insert_own_v502 on storage.objects;
create policy nh7_profile_photo_insert_own_v502 on storage.objects
for insert to authenticated with check (
  bucket_id='nh7-profile-photos-v502' and (storage.foldername(name))[1]=(select auth.uid())::text
);
drop policy if exists nh7_profile_photo_update_own_v502 on storage.objects;
create policy nh7_profile_photo_update_own_v502 on storage.objects
for update to authenticated using (
  bucket_id='nh7-profile-photos-v502' and (storage.foldername(name))[1]=(select auth.uid())::text
) with check (
  bucket_id='nh7-profile-photos-v502' and (storage.foldername(name))[1]=(select auth.uid())::text
);
drop policy if exists nh7_profile_photo_delete_own_v502 on storage.objects;
create policy nh7_profile_photo_delete_own_v502 on storage.objects
for delete to authenticated using (
  bucket_id='nh7-profile-photos-v502' and (storage.foldername(name))[1]=(select auth.uid())::text
);

-- =========================================================
-- Storage owner authorization bridge
-- =========================================================
-- Storage RLS executes under the authenticated caller, while the canonical
-- owner helper intentionally remains private/postgres-only. This narrow bridge
-- exposes only a boolean owner check and is executable by authenticated users.
create or replace function public.nh7_storage_owner_check_v502()
returns boolean
language sql
stable
security definer
set search_path=''
as $
  select private.nh7_admin_is_owner_v350();
$;

revoke all on function public.nh7_storage_owner_check_v502() from public,anon,authenticated,service_role;
grant execute on function public.nh7_storage_owner_check_v502() to authenticated;

-- =========================================================
-- Audio testimonies
-- Pending audio stays private. Only approved audio is copied to public bucket.
-- =========================================================
create table if not exists public.nh7_testimonies_v502 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 180),
  display_name text not null default '',
  testimony_type text not null default 'other'
    check (testimony_type in ('healing','answered_prayer','salvation','provision','other')),
  note_text text not null default '',
  language text not null default 'en' check (language in ('fa','en','hr')),
  show_name boolean not null default true,
  consent_public boolean not null default false,
  consent_health_public boolean not null default false,
  audio_submission_path text not null,
  audio_mime_type text not null default '',
  audio_duration_seconds integer not null default 0 check (audio_duration_seconds>=0),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  published_audio_path text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
create index if not exists nh7_testimonies_v502_status_created_idx
on public.nh7_testimonies_v502(status,created_at desc);
create index if not exists nh7_testimonies_v502_user_created_idx
on public.nh7_testimonies_v502(user_id,created_at desc);
create index if not exists nh7_testimonies_v502_public_language_idx
on public.nh7_testimonies_v502(language,published_at desc)
where status='approved' and consent_public=true and published_audio_path<>'';
alter table public.nh7_testimonies_v502 enable row level security;

drop policy if exists nh7_testimony_public_approved_v502 on public.nh7_testimonies_v502;

drop policy if exists nh7_testimony_read_own_v502 on public.nh7_testimonies_v502;
create policy nh7_testimony_read_own_v502 on public.nh7_testimonies_v502
for select to authenticated using (user_id=(select auth.uid()));

drop policy if exists nh7_testimony_insert_own_v502 on public.nh7_testimonies_v502;
create policy nh7_testimony_insert_own_v502 on public.nh7_testimonies_v502
for insert to authenticated with check (
  user_id=(select auth.uid())
  and status='pending'
  and published_audio_path=''
  and audio_submission_path like (select auth.uid())::text || '/%'
  and consent_public=true
  and (
    testimony_type<>'healing'
    or consent_health_public=true
  )
);

drop policy if exists nh7_testimony_update_own_pending_v502 on public.nh7_testimonies_v502;
create policy nh7_testimony_update_own_pending_v502 on public.nh7_testimonies_v502
for update to authenticated
using (user_id=(select auth.uid()) and status='pending')
with check (
  user_id=(select auth.uid())
  and status='pending'
  and published_audio_path=''
  and audio_submission_path like (select auth.uid())::text || '/%'
);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('nh7-testimony-submissions-v502','nh7-testimony-submissions-v502',false,62914560,
array['audio/mpeg','audio/mp4','audio/aac','audio/x-m4a','audio/wav','audio/webm','video/mp4'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('nh7-testimony-published-v502','nh7-testimony-published-v502',true,62914560,
array['audio/mpeg','audio/mp4','audio/aac','audio/x-m4a','audio/wav','audio/webm','video/mp4'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

-- User may upload/read/delete only their own pending submission files.
drop policy if exists nh7_testimony_submission_insert_own_v502 on storage.objects;
create policy nh7_testimony_submission_insert_own_v502 on storage.objects
for insert to authenticated with check (
  bucket_id='nh7-testimony-submissions-v502'
  and (storage.foldername(name))[1]=(select auth.uid())::text
);
drop policy if exists nh7_testimony_submission_read_own_or_owner_v502 on storage.objects;
create policy nh7_testimony_submission_read_own_or_owner_v502 on storage.objects
for select to authenticated using (
  bucket_id='nh7-testimony-submissions-v502'
  and (
    (storage.foldername(name))[1]=(select auth.uid())::text
    or (select public.nh7_storage_owner_check_v502())
  )
);
drop policy if exists nh7_testimony_submission_delete_own_or_owner_v502 on storage.objects;
create policy nh7_testimony_submission_delete_own_or_owner_v502 on storage.objects
for delete to authenticated using (
  bucket_id='nh7-testimony-submissions-v502'
  and (
    (storage.foldername(name))[1]=(select auth.uid())::text
    or (select public.nh7_storage_owner_check_v502())
  )
);

-- Only the owner can publish or remove approved testimony audio.
drop policy if exists nh7_testimony_published_owner_insert_v502 on storage.objects;
create policy nh7_testimony_published_owner_insert_v502 on storage.objects
for insert to authenticated with check (
  bucket_id='nh7-testimony-published-v502'
  and (select public.nh7_storage_owner_check_v502())
);
drop policy if exists nh7_testimony_published_owner_update_v502 on storage.objects;
create policy nh7_testimony_published_owner_update_v502 on storage.objects
for update to authenticated using (
  bucket_id='nh7-testimony-published-v502'
  and (select public.nh7_storage_owner_check_v502())
) with check (
  bucket_id='nh7-testimony-published-v502'
  and (select public.nh7_storage_owner_check_v502())
);
drop policy if exists nh7_testimony_published_owner_delete_v502 on storage.objects;
create policy nh7_testimony_published_owner_delete_v502 on storage.objects
for delete to authenticated using (
  bucket_id='nh7-testimony-published-v502'
  and (select public.nh7_storage_owner_check_v502())
);

-- =========================================================
-- Prayer requests: name + detailed request only. Owner-only admin feed.
-- =========================================================
create table if not exists public.nh7_prayer_requests_v502 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  requester_name text not null check (char_length(requester_name) between 1 and 160),
  request_text text not null check (char_length(request_text) between 20 and 6000),
  status text not null default 'new' check (status in ('new','praying','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists nh7_prayer_requests_v502_status_created_idx
on public.nh7_prayer_requests_v502(status,created_at desc);
create index if not exists nh7_prayer_requests_v502_user_created_idx
on public.nh7_prayer_requests_v502(user_id,created_at desc);
alter table public.nh7_prayer_requests_v502 enable row level security;

drop policy if exists nh7_prayer_insert_own_v502 on public.nh7_prayer_requests_v502;
create policy nh7_prayer_insert_own_v502 on public.nh7_prayer_requests_v502
for insert to authenticated with check (user_id=(select auth.uid()) and status='new');

drop policy if exists nh7_prayer_read_own_v502 on public.nh7_prayer_requests_v502;
create policy nh7_prayer_read_own_v502 on public.nh7_prayer_requests_v502
for select to authenticated using (user_id=(select auth.uid()));

-- =========================================================
-- Safe public testimony feed.
-- Only publication-safe fields are returned; private submission paths,
-- user IDs and health-consent metadata are never exposed.
-- =========================================================
create or replace function public.nh7_public_testimony_feed_v502(
  p_language text default null,
  p_limit integer default 30
)
returns table(
  id uuid,
  title text,
  display_name text,
  testimony_type text,
  note_text text,
  language text,
  audio_duration_seconds integer,
  published_audio_path text,
  published_at timestamptz
)
language sql
stable
security definer
set search_path=''
as $$
  select
    t.id,
    t.title,
    case when t.show_name then t.display_name else '' end as display_name,
    t.testimony_type,
    t.note_text,
    t.language,
    t.audio_duration_seconds,
    t.published_audio_path,
    t.published_at
  from public.nh7_testimonies_v502 t
  where t.status='approved'
    and t.consent_public=true
    and nullif(trim(t.published_audio_path),'') is not null
    and (
      nullif(trim(coalesce(p_language,'')),'') is null
      or t.language=lower(trim(p_language))
    )
  order by t.published_at desc nulls last, t.created_at desc
  limit greatest(1,least(coalesce(p_limit,30),100));
$$;

-- =========================================================
-- Owner-only admin RPCs. No Prayer Servant/delegated panel.
-- =========================================================
create or replace function public.nh7_owner_prayer_feed_v502(
  p_status text default 'active',
  p_limit integer default 200
)
returns table(
  id uuid,
  requester_name text,
  request_text text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql stable security definer set search_path=''
as $$
begin
  perform private.nh7_admin_require_owner_v350();
  return query
  select p.id,p.requester_name,p.request_text,p.status,p.created_at,p.updated_at
  from public.nh7_prayer_requests_v502 p
  where case
    when lower(coalesce(p_status,'active'))='all' then true
    when lower(coalesce(p_status,'active'))='active' then p.status in ('new','praying')
    else p.status=lower(p_status)
  end
  order by case p.status when 'new' then 0 when 'praying' then 1 else 2 end,p.created_at asc
  limit greatest(1,least(coalesce(p_limit,200),500));
end;
$$;

create or replace function public.nh7_owner_prayer_set_status_v502(
  p_id uuid,
  p_status text
)
returns boolean
language plpgsql security definer set search_path=''
as $$
declare v_status text:=lower(trim(coalesce(p_status,''))); v_changed boolean:=false;
begin
  perform private.nh7_admin_require_owner_v350();
  if v_status not in ('new','praying','completed') then
    raise exception 'Unsupported prayer status' using errcode='22023';
  end if;
  update public.nh7_prayer_requests_v502
  set status=v_status,updated_at=now(),completed_at=case when v_status='completed' then now() else null end
  where id=p_id and status='pending' returning true into v_changed;
  return coalesce(v_changed,false);
end;
$$;

create or replace function public.nh7_owner_prayer_export_v502(
  p_status text default 'active',
  p_limit integer default 2000
)
returns table(
  id uuid,
  requester_name text,
  request_text text,
  status text,
  created_at timestamptz
)
language plpgsql stable security definer set search_path=''
as $$
begin
  perform private.nh7_admin_require_owner_v350();
  return query
  select p.id,p.requester_name,p.request_text,p.status,p.created_at
  from public.nh7_prayer_requests_v502 p
  where case
    when lower(coalesce(p_status,'active'))='all' then true
    when lower(coalesce(p_status,'active'))='active' then p.status in ('new','praying')
    else p.status=lower(p_status)
  end
  order by p.created_at asc
  limit greatest(1,least(coalesce(p_limit,2000),5000));
end;
$$;

create or replace function public.nh7_owner_testimony_feed_v502(
  p_status text default 'pending',
  p_limit integer default 100
)
returns table(
  id uuid,
  user_id uuid,
  title text,
  display_name text,
  testimony_type text,
  note_text text,
  language text,
  show_name boolean,
  consent_public boolean,
  consent_health_public boolean,
  audio_submission_path text,
  audio_mime_type text,
  audio_duration_seconds integer,
  status text,
  published_audio_path text,
  created_at timestamptz
)
language plpgsql stable security definer set search_path=''
as $$
begin
  perform private.nh7_admin_require_owner_v350();
  return query
  select t.id,t.user_id,t.title,t.display_name,t.testimony_type,t.note_text,t.language,
         t.show_name,t.consent_public,t.consent_health_public,t.audio_submission_path,
         t.audio_mime_type,t.audio_duration_seconds,t.status,t.published_audio_path,t.created_at
  from public.nh7_testimonies_v502 t
  where lower(coalesce(p_status,'pending'))='all' or t.status=lower(p_status)
  order by t.created_at desc
  limit greatest(1,least(coalesce(p_limit,100),500));
end;
$$;

create or replace function public.nh7_owner_testimony_publish_v502(
  p_id uuid,
  p_published_audio_path text
)
returns boolean
language plpgsql security definer set search_path=''
as $$
declare v_changed boolean:=false;
begin
  perform private.nh7_admin_require_owner_v350();
  if trim(coalesce(p_published_audio_path,''))='' or trim(p_published_audio_path) not like 'approved/%' then
    raise exception 'A valid approved audio path is required' using errcode='22023';
  end if;
  if not exists(
    select 1 from storage.objects o
    where o.bucket_id='nh7-testimony-published-v502'
      and o.name=trim(p_published_audio_path)
  ) then
    raise exception 'Published testimony audio object was not found' using errcode='P0002';
  end if;
  update public.nh7_testimonies_v502
  set status='approved',
      audio_submission_path='',
      published_audio_path=trim(p_published_audio_path),
      published_at=now(),
      updated_at=now()
  where id=p_id and status='pending' and consent_public=true
    and (testimony_type<>'healing' or consent_health_public=true)
  returning true into v_changed;
  return coalesce(v_changed,false);
end;
$$;

create or replace function public.nh7_owner_testimony_reject_v502(p_id uuid)
returns boolean
language plpgsql security definer set search_path=''
as $$
declare v_changed boolean:=false;
begin
  perform private.nh7_admin_require_owner_v350();
  update public.nh7_testimonies_v502
  set status='rejected',audio_submission_path='',published_audio_path='',published_at=null,updated_at=now()
  where id=p_id returning true into v_changed;
  return coalesce(v_changed,false);
end;
$$;

-- Explicit Data API grants (required as Supabase no longer guarantees automatic exposure for new tables).
revoke all on table public.nh7_user_profiles_v502 from anon,authenticated;
revoke all on table public.nh7_testimonies_v502 from anon,authenticated;
revoke all on table public.nh7_prayer_requests_v502 from anon,authenticated;

grant select,insert,update on table public.nh7_user_profiles_v502 to authenticated;
grant select,insert,update on table public.nh7_testimonies_v502 to authenticated;
grant select,insert on table public.nh7_prayer_requests_v502 to authenticated;

revoke all on function public.nh7_public_testimony_feed_v502(text,integer) from public,anon,authenticated,service_role;
grant execute on function public.nh7_public_testimony_feed_v502(text,integer) to anon,authenticated;

revoke all on function public.nh7_owner_prayer_feed_v502(text,integer) from public,anon,authenticated,service_role;
revoke all on function public.nh7_owner_prayer_set_status_v502(uuid,text) from public,anon,authenticated,service_role;
revoke all on function public.nh7_owner_prayer_export_v502(text,integer) from public,anon,authenticated,service_role;
revoke all on function public.nh7_owner_testimony_feed_v502(text,integer) from public,anon,authenticated,service_role;
revoke all on function public.nh7_owner_testimony_publish_v502(uuid,text) from public,anon,authenticated,service_role;
revoke all on function public.nh7_owner_testimony_reject_v502(uuid) from public,anon,authenticated,service_role;

grant execute on function public.nh7_owner_prayer_feed_v502(text,integer) to authenticated;
grant execute on function public.nh7_owner_prayer_set_status_v502(uuid,text) to authenticated;
grant execute on function public.nh7_owner_prayer_export_v502(text,integer) to authenticated;
grant execute on function public.nh7_owner_testimony_feed_v502(text,integer) to authenticated;
grant execute on function public.nh7_owner_testimony_publish_v502(uuid,text) to authenticated;
grant execute on function public.nh7_owner_testimony_reject_v502(uuid) to authenticated;
