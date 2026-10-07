-- New Hope 7 — testimony Storage orphan cleanup fix
-- The Storage delete-many API first resolves visible objects. The admin already
-- had DELETE permission on the published testimony bucket, but no matching
-- SELECT policy, so DELETE returned HTTP 200 with [] and removed zero objects.

DROP POLICY IF EXISTS nh7_testimony_public_admin_select_v508 ON storage.objects;

CREATE POLICY nh7_testimony_public_admin_select_v508
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'nh7-testimony-published-v502'
  AND COALESCE(
    public.nh7_admin_has_permission_v395('community.testimony.review'),
    false
  )
);
