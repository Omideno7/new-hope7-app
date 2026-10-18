-- REVIEW ONLY. Disable capability; never restore removed public text.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.nh7_qa_remove_own_batch3a(uuid) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
-- Preserve hidden rows and minimal audit; do not resurrect question/answer content.
