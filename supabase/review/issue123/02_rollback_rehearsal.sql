-- REVIEW ONLY. Candidate 01 always rolls back, so it has no deployed changes to undo.
-- Never automatically restore a known data-exposure path to solve compatibility.
-- This illustrates emergency policy neutralization on an isolated fixture ONLY.
-- It preserves policies, files, rows and grants; exact baseline must be reviewed.
BEGIN;
DO $$ BEGIN
 IF current_setting('nh7.review_environment',true) IS DISTINCT FROM 'local-fixture' THEN
  RAISE EXCEPTION 'ISSUE123_REVIEW_ONLY: rollback rehearsal is not Production approval';
 END IF;
END $$;
ALTER POLICY nh7_library_ministers_fence_v123 ON public.nh7_library_items USING (true);
ALTER POLICY nh7_library_ministers_anon_fence_v123 ON public.nh7_library_items USING (true);
ALTER POLICY nh7_ministers_objects_fence_v123 ON storage.objects USING (true);
ALTER POLICY nh7_ministers_objects_anon_fence_v123 ON storage.objects USING (true);
ALTER POLICY nh7_library_ministers_allow_v123 ON public.nh7_library_items USING (false);
ALTER POLICY nh7_ministers_objects_allow_v123 ON storage.objects USING (false);
-- Safe recovery preference: fix adapters/RPC compatibility while retaining deny;
-- pause the restricted feature rather than re-expose objects or make buckets public.
-- New RPCs remain default-deny, old RPC signatures/grants are unchanged.
ROLLBACK;
