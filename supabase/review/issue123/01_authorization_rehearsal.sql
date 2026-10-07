-- REVIEW / LOCAL REHEARSAL ONLY, NOT a deployment-ready Production migration.
-- Outside supabase/migrations deliberately. Unknown legacy schema/ACL/Edge bodies
-- must first be inventoried. Empty adapters are intentional, fail-closed blockers.
-- This transaction ALWAYS rolls back. Do not replace ROLLBACK before separate approval.
BEGIN;
DO $$ BEGIN
 IF current_setting('nh7.review_environment',true) IS DISTINCT FROM 'local-fixture' THEN
  RAISE EXCEPTION 'ISSUE123_REVIEW_ONLY: use an isolated local fixture; Production is forbidden';
 END IF;
END $$;
-- Use a new isolated schema, leaving v350 private helpers unchanged. No new authority is derived from email,
-- p_user_id, user_metadata, client roles, saved codes or cached approval.
CREATE SCHEMA nh7_ministers_security_v123;
REVOKE ALL ON SCHEMA nh7_ministers_security_v123 FROM PUBLIC,anon;
-- Replace these empty adapters ONLY after validating the actual legacy grant,
-- collection and object-path schemas in a reviewed follow-up. Preserve grants.
CREATE VIEW nh7_ministers_security_v123.nh7_library_grants_adapter_v123 AS
 SELECT NULL::uuid AS user_id,NULL::text AS scope,NULL::uuid AS resource_id,
        NULL::timestamptz AS expires_at,false AS active WHERE false;
CREATE VIEW nh7_ministers_security_v123.nh7_library_admin_adapter_v123 AS
 SELECT NULL::uuid AS user_id,false AS active WHERE false;
CREATE VIEW nh7_ministers_security_v123.nh7_library_objects_adapter_v123 AS
 SELECT NULL::text AS bucket_id,NULL::text AS object_name,NULL::uuid AS item_id WHERE false;
REVOKE ALL ON nh7_ministers_security_v123.nh7_library_grants_adapter_v123,
 nh7_ministers_security_v123.nh7_library_admin_adapter_v123,nh7_ministers_security_v123.nh7_library_objects_adapter_v123 FROM PUBLIC,anon,authenticated;

CREATE FUNCTION nh7_ministers_security_v123.nh7_ministers_can_read_v123(p_item_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.nh7_library_items i
  WHERE i.id=p_item_id AND i.audience='ministers' AND i.is_active AND i.is_published
   AND (EXISTS (SELECT 1 FROM nh7_ministers_security_v123.nh7_library_admin_adapter_v123 a
                WHERE a.user_id=auth.uid() AND a.active)
    OR EXISTS (SELECT 1 FROM nh7_ministers_security_v123.nh7_library_grants_adapter_v123 g
      WHERE g.user_id=auth.uid() AND g.active
       AND (g.expires_at IS NULL OR g.expires_at>statement_timestamp())
       AND ((g.scope='library_all' AND g.resource_id IS NULL)
        OR (g.scope='library_item' AND g.resource_id=i.id)
        OR (g.scope='library_collection' AND g.resource_id=i.collection_id))))
 );
$$;
REVOKE ALL ON FUNCTION nh7_ministers_security_v123.nh7_ministers_can_read_v123(uuid) FROM PUBLIC,anon;
GRANT USAGE ON SCHEMA nh7_ministers_security_v123 TO authenticated;
GRANT EXECUTE ON FUNCTION nh7_ministers_security_v123.nh7_ministers_can_read_v123(uuid) TO authenticated;
-- Owner must be trusted/non-login. The definer only exposes a boolean and a
-- restricted reader payload after an explicit UID predicate; RLS alone cannot
-- secure definer/service-role endpoints. Old endpoints are not replaced here.
ALTER TABLE public.nh7_library_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY nh7_library_ministers_fence_v123 ON public.nh7_library_items
 AS RESTRICTIVE FOR SELECT TO authenticated
 USING (audience='public' OR nh7_ministers_security_v123.nh7_ministers_can_read_v123(id));
CREATE POLICY nh7_library_ministers_anon_fence_v123 ON public.nh7_library_items
 AS RESTRICTIVE FOR SELECT TO anon USING (audience='public');
CREATE POLICY nh7_library_ministers_allow_v123 ON public.nh7_library_items
 FOR SELECT TO authenticated USING (audience='ministers' AND nh7_ministers_security_v123.nh7_ministers_can_read_v123(id));
-- Existing permissive policies are neither deleted nor widened. Validate their
-- public/School behavior separately; these restrictions alone grant no access.
CREATE FUNCTION nh7_ministers_security_v123.nh7_ministers_can_read_object_v123(p_bucket text,p_name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL
  AND EXISTS (SELECT 1 FROM nh7_ministers_security_v123.nh7_library_objects_adapter_v123 m
              WHERE m.bucket_id=p_bucket AND m.object_name=p_name)
  AND NOT EXISTS (SELECT 1 FROM nh7_ministers_security_v123.nh7_library_objects_adapter_v123 m
    WHERE m.bucket_id=p_bucket AND m.object_name=p_name
     AND NOT nh7_ministers_security_v123.nh7_ministers_can_read_v123(m.item_id));
$$;
REVOKE ALL ON FUNCTION nh7_ministers_security_v123.nh7_ministers_can_read_object_v123(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION nh7_ministers_security_v123.nh7_ministers_can_read_object_v123(text,text) TO authenticated;
-- Storage map must include ALL objects in a dedicated private ministers bucket,
-- provisionally named nh7-ministers-private-v123. No bucket is created/moved here.
-- Public nh7-library/mixed buckets must not be made globally private blindly.
CREATE POLICY nh7_ministers_objects_fence_v123 ON storage.objects
 AS RESTRICTIVE FOR SELECT TO authenticated
 USING (bucket_id<>'nh7-ministers-private-v123' OR nh7_ministers_security_v123.nh7_ministers_can_read_object_v123(bucket_id,name));
CREATE POLICY nh7_ministers_objects_anon_fence_v123 ON storage.objects
 AS RESTRICTIVE FOR SELECT TO anon USING (bucket_id<>'nh7-ministers-private-v123');

CREATE POLICY nh7_ministers_objects_allow_v123 ON storage.objects
 FOR SELECT TO authenticated USING (bucket_id='nh7-ministers-private-v123'
 AND nh7_ministers_security_v123.nh7_ministers_can_read_object_v123(bucket_id,name));

CREATE FUNCTION public.nh7_ministers_catalog_v123()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object('items',coalesce(jsonb_agg(jsonb_build_object(
  'id',i.id,'collection_id',i.collection_id,'title_fa',i.title_fa,'title_en',i.title_en,
  'title_hr',i.title_hr,'audience',i.audience)), '[]'::jsonb))
 FROM public.nh7_library_items i WHERE nh7_ministers_security_v123.nh7_ministers_can_read_v123(i.id);
$$;
CREATE FUNCTION public.nh7_ministers_reader_v123(p_item_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce((SELECT jsonb_build_object('allowed',true,'item_id',i.id,
  'reader_text',i.reader_text) FROM public.nh7_library_items i
  WHERE i.id=p_item_id AND nh7_ministers_security_v123.nh7_ministers_can_read_v123(i.id)),
  jsonb_build_object('allowed',false,'code','content_access_required'));
$$;
REVOKE ALL ON FUNCTION public.nh7_ministers_catalog_v123(),
 public.nh7_ministers_reader_v123(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.nh7_ministers_catalog_v123(),
 public.nh7_ministers_reader_v123(uuid) TO authenticated;
-- Missing release work: verified adapters; every legacy view/RPC/definer/Edge
-- route; collection metadata fences; storage privacy and legacy URL containment;
-- user-JWT file delivery without signed bearer URLs; per-UID online-only clients.
-- No production security guarantee exists until those tasks and real JWT tests pass.
ROLLBACK;
