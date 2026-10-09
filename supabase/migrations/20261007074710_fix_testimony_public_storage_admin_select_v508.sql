drop policy if exists nh7_testimony_public_admin_select_v508 on storage.objects;
create policy nh7_testimony_public_admin_select_v508
on storage.objects
for select
to authenticated
using (
  bucket_id = 'nh7-testimony-published-v502'
  and coalesce(public.nh7_admin_has_permission_v395('community.testimony.review'), false)
);