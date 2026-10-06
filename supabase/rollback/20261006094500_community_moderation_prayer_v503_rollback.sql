-- Rollback for New Hope 7 v5.0.3 rejected testimony hard delete support.
begin;

drop function if exists public.nh7_owner_testimony_delete_rejected_v503(uuid);
drop policy if exists nh7_testimony_private_admin_delete_v503 on storage.objects;

commit;
