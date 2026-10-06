-- New Hope 7 — Profile persistence v502 candidate
-- Feature branch only. DO NOT apply to Production until QA/approval.
-- Purpose: persist display name + avatar path across logout/login and devices.

begin;

create table if not exists public.nh7_user_profiles_v502 (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  original_photo_path text not null default '',
  photo_path text not null default '',
  photo_position_x double precision not null default 0,
  photo_position_y double precision not null default 0,
  photo_zoom double precision not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nh7_user_profiles_v502_display_name_len check (char_length(display_name) <= 120),
  constraint nh7_user_profiles_v502_photo_path_len check (char_length(photo_path) <= 512),
  constraint nh7_user_profiles_v502_original_photo_path_len check (char_length(original_photo_path) <= 512),
  constraint nh7_user_profiles_v502_zoom_range check (photo_zoom between 0.25 and 8)
);

alter table public.nh7_user_profiles_v502 enable row level security;

grant select, insert, update, delete on table public.nh7_user_profiles_v502 to authenticated;
revoke all on table public.nh7_user_profiles_v502 from anon;

drop policy if exists nh7_profile_select_own_v502 on public.nh7_user_profiles_v502;
create policy nh7_profile_select_own_v502
on public.nh7_user_profiles_v502
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists nh7_profile_insert_own_v502 on public.nh7_user_profiles_v502;
create policy nh7_profile_insert_own_v502
on public.nh7_user_profiles_v502
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists nh7_profile_update_own_v502 on public.nh7_user_profiles_v502;
create policy nh7_profile_update_own_v502
on public.nh7_user_profiles_v502
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists nh7_profile_delete_own_v502 on public.nh7_user_profiles_v502;
create policy nh7_profile_delete_own_v502
on public.nh7_user_profiles_v502
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Bucket metadata may be created by SQL; object mutations remain Storage API-only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'nh7-profile-photos-v502',
  'nh7-profile-photos-v502',
  false,
  5242880,
  array['image/jpeg','image/png','image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Each authenticated user can access only objects in their own UUID folder.
drop policy if exists nh7_profile_photo_select_own_v502 on storage.objects;
create policy nh7_profile_photo_select_own_v502
on storage.objects
for select
to authenticated
using (
  bucket_id = 'nh7-profile-photos-v502'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists nh7_profile_photo_insert_own_v502 on storage.objects;
create policy nh7_profile_photo_insert_own_v502
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'nh7-profile-photos-v502'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists nh7_profile_photo_update_own_v502 on storage.objects;
create policy nh7_profile_photo_update_own_v502
on storage.objects
for update
to authenticated
using (
  bucket_id = 'nh7-profile-photos-v502'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'nh7-profile-photos-v502'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists nh7_profile_photo_delete_own_v502 on storage.objects;
create policy nh7_profile_photo_delete_own_v502
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'nh7-profile-photos-v502'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

commit;
