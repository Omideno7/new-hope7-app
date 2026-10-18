-- REVIEW ONLY; disable new RPC access, preserve every saved row and existing system.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'Separate rollback approval required'; END $$;
REVOKE EXECUTE ON FUNCTION public.nh7_connect_catalog_b3b() FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.nh7_connect_detail_b3b(uuid) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.nh7_connect_admin_list_b3b() FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.nh7_connect_admin_save_b3b(jsonb) FROM PUBLIC,anon,authenticated;
ROLLBACK;
