-- Rollback for New Hope 7 Profile persistence v502 candidate.
-- Candidate only; use only if the matching migration has been applied in a QA/test environment.

begin;

drop policy if exists nh7_profile_photo_delete_own_v502 on storage.objects;
drop policy if exists nh7_profile_photo_update_own_v502 on storage.objects;
drop policy if exists nh7_profile_photo_insert_own_v502 on storage.objects;
drop policy if exists nh7_profile_photo_select_own_v502 on storage.objects;

drop policy if exists nh7_profile_delete_own_v502 on public.nh7_user_profiles_v502;
drop policy if exists nh7_profile_update_own_v502 on public.nh7_user_profiles_v502;
drop policy if exists nh7_profile_insert_own_v502 on public.nh7_user_profiles_v502;
drop policy if exists nh7_profile_select_own_v502 on public.nh7_user_profiles_v502;

drop table if exists public.nh7_user_profiles_v502;

-- Only remove the bucket when it is empty. Never delete Storage object metadata directly.
delete from storage.buckets b
where b.id='nh7-profile-photos-v502'
  and not exists (
    select 1 from storage.objects o where o.bucket_id=b.id
  );

commit;
