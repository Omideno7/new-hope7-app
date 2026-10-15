-- REVIEW ONLY. Not a migration or deployment. No approval to execute.
BEGIN;
DO $review$ BEGIN RAISE EXCEPTION 'WAVE66_REVIEW_ONLY; owner approval and fresh preflight required'; END $review$;
-- Fingerprint checks below must pass again in the separately approved transaction.
DO $preflight$ BEGIN
IF current_user<>'postgres' OR current_setting('server_version_num')::integer<150000 THEN RAISE EXCEPTION 'WAVE66_OWNER_OR_POSTGRES_VERSION'; END IF;
IF (SELECT md5(pg_get_viewdef('public.nh7_library_items_v224'::regclass,true))) IS DISTINCT FROM '4c965d6f56977723b947abde52c5bf1a' THEN RAISE EXCEPTION 'WAVE66_VIEW_DRIFT: public.nh7_library_items_v224'; END IF;
IF (SELECT pg_get_userbyid(relowner)<>'postgres' OR reloptions IS NOT NULL FROM pg_class WHERE oid='public.nh7_library_items_v224'::regclass) THEN RAISE EXCEPTION 'WAVE66_OWNER_OPTIONS_DRIFT'; END IF;
IF (SELECT md5(pg_get_viewdef('public.nh7_library_items_v251'::regclass,true))) IS DISTINCT FROM '4c965d6f56977723b947abde52c5bf1a' THEN RAISE EXCEPTION 'WAVE66_VIEW_DRIFT: public.nh7_library_items_v251'; END IF;
IF (SELECT pg_get_userbyid(relowner)<>'postgres' OR reloptions IS NOT NULL FROM pg_class WHERE oid='public.nh7_library_items_v251'::regclass) THEN RAISE EXCEPTION 'WAVE66_OWNER_OPTIONS_DRIFT'; END IF;
IF (SELECT md5(pg_get_viewdef('public.nh7_library_collections_public_v251'::regclass,true))) IS DISTINCT FROM '3a0b0f1a2c53dbbaa90d3b33b15c32d4' THEN RAISE EXCEPTION 'WAVE66_VIEW_DRIFT: public.nh7_library_collections_public_v251'; END IF;
IF (SELECT pg_get_userbyid(relowner)<>'postgres' OR reloptions IS NOT NULL FROM pg_class WHERE oid='public.nh7_library_collections_public_v251'::regclass) THEN RAISE EXCEPTION 'WAVE66_OWNER_OPTIONS_DRIFT'; END IF;
IF (SELECT md5(pg_get_viewdef('public.nh7_library_collections_public_v322'::regclass,true))) IS DISTINCT FROM '3a0b0f1a2c53dbbaa90d3b33b15c32d4' THEN RAISE EXCEPTION 'WAVE66_VIEW_DRIFT: public.nh7_library_collections_public_v322'; END IF;
IF (SELECT pg_get_userbyid(relowner)<>'postgres' OR reloptions IS NOT NULL FROM pg_class WHERE oid='public.nh7_library_collections_public_v322'::regclass) THEN RAISE EXCEPTION 'WAVE66_OWNER_OPTIONS_DRIFT'; END IF;
IF (SELECT jsonb_agg(jsonb_build_array(attname,format_type(atttypid,atttypmod)) ORDER BY attnum) FROM pg_attribute WHERE attrelid='public.nh7_library_items_v224'::regclass AND attnum>0 AND NOT attisdropped) IS DISTINCT FROM '[["id", "uuid"], ["title_fa", "text"], ["title_en", "text"], ["title_hr", "text"], ["description_fa", "text"], ["description_en", "text"], ["description_hr", "text"], ["audience", "text"], ["resource_type", "text"], ["apocrypha_book", "text"], ["mime_type", "text"], ["file_name", "text"], ["file_size", "bigint"], ["cover_url", "text"], ["sort_order", "integer"], ["created_at", "timestamp with time zone"], ["updated_at", "timestamp with time zone"], ["reader_mode", "text"], ["reader_language", "text"], ["reader_text", "jsonb"], ["reader_status", "text"], ["reader_page_count", "integer"], ["reader_updated_at", "timestamp with time zone"], ["reader_available", "boolean"], ["collection_id", "uuid"]]'::jsonb THEN RAISE EXCEPTION 'WAVE66_COLUMN_DRIFT'; END IF;
IF (SELECT jsonb_agg(jsonb_build_array(attname,format_type(atttypid,atttypmod)) ORDER BY attnum) FROM pg_attribute WHERE attrelid='public.nh7_library_items_v251'::regclass AND attnum>0 AND NOT attisdropped) IS DISTINCT FROM '[["id", "uuid"], ["title_fa", "text"], ["title_en", "text"], ["title_hr", "text"], ["description_fa", "text"], ["description_en", "text"], ["description_hr", "text"], ["audience", "text"], ["resource_type", "text"], ["apocrypha_book", "text"], ["mime_type", "text"], ["file_name", "text"], ["file_size", "bigint"], ["cover_url", "text"], ["sort_order", "integer"], ["created_at", "timestamp with time zone"], ["updated_at", "timestamp with time zone"], ["reader_mode", "text"], ["reader_language", "text"], ["reader_text", "jsonb"], ["reader_status", "text"], ["reader_page_count", "integer"], ["reader_updated_at", "timestamp with time zone"], ["reader_available", "boolean"], ["collection_id", "uuid"]]'::jsonb THEN RAISE EXCEPTION 'WAVE66_COLUMN_DRIFT'; END IF;
IF (SELECT jsonb_agg(jsonb_build_array(attname,format_type(atttypid,atttypmod)) ORDER BY attnum) FROM pg_attribute WHERE attrelid='public.nh7_library_collections_public_v251'::regclass AND attnum>0 AND NOT attisdropped) IS DISTINCT FROM '[["id", "uuid"], ["slug", "text"], ["title_fa", "text"], ["title_en", "text"], ["title_hr", "text"], ["description_fa", "text"], ["description_en", "text"], ["description_hr", "text"], ["icon", "text"], ["audience", "text"], ["sort_order", "integer"], ["item_count", "integer"]]'::jsonb THEN RAISE EXCEPTION 'WAVE66_COLUMN_DRIFT'; END IF;
IF (SELECT jsonb_agg(jsonb_build_array(attname,format_type(atttypid,atttypmod)) ORDER BY attnum) FROM pg_attribute WHERE attrelid='public.nh7_library_collections_public_v322'::regclass AND attnum>0 AND NOT attisdropped) IS DISTINCT FROM '[["id", "uuid"], ["slug", "text"], ["title_fa", "text"], ["title_en", "text"], ["title_hr", "text"], ["description_fa", "text"], ["description_en", "text"], ["description_hr", "text"], ["icon", "text"], ["audience", "text"], ["sort_order", "integer"], ["item_count", "integer"]]'::jsonb THEN RAISE EXCEPTION 'WAVE66_COLUMN_DRIFT'; END IF;
IF to_regprocedure('public.nh7_library_items_compat_wave66()') IS NOT NULL OR to_regprocedure('public.nh7_library_collections_compat_wave66()') IS NOT NULL THEN RAISE EXCEPTION 'WAVE66_ADAPTER_EXISTS'; END IF;
END $preflight$;
-- FIXTURE-SQL-BEGIN
CREATE FUNCTION public.nh7_library_items_compat_wave66() RETURNS TABLE (
  id uuid,
  title_fa text,
  title_en text,
  title_hr text,
  description_fa text,
  description_en text,
  description_hr text,
  audience text,
  resource_type text,
  apocrypha_book text,
  mime_type text,
  file_name text,
  file_size bigint,
  cover_url text,
  sort_order integer,
  created_at timestamptz,
  updated_at timestamptz,
  reader_mode text,
  reader_language text,
  reader_text jsonb,
  reader_status text,
  reader_page_count integer,
  reader_updated_at timestamptz,
  reader_available boolean,
  collection_id uuid
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $body$
SELECT id,
    title_fa,
    title_en,
    title_hr,
    description_fa,
    description_en,
    description_hr,
    audience,
    resource_type,
    apocrypha_book,
    mime_type,
    file_name,
    file_size,
    cover_url,
    sort_order,
    created_at,
    updated_at,
    reader_mode,
    reader_language,
    '{}'::jsonb AS reader_text,
    reader_status,
    reader_page_count,
    reader_updated_at,
    reader_status = 'ready'::text
      AND (reader_mode = ANY (ARRAY['text'::text, 'both'::text])) AS reader_available,
    collection_id
FROM public.nh7_library_items i
WHERE is_published
  AND is_active
  AND (
    COALESCE(public.nh7_is_admin(), false)
    OR auth.uid() IS NOT NULL
      AND (
        audience = 'ministers'::text
        AND public.nh7_content_access_active_v251(auth.uid(), 'library_item'::text, id)
        OR audience <> 'ministers'::text
        AND public.nh7_school_access_approved_v230(
          auth.uid(),
          COALESCE(auth.jwt() ->> 'email'::text, ''::text),
          ''::text
        )
      )
  );
$body$;
REVOKE ALL ON FUNCTION public.nh7_library_items_compat_wave66() FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE VIEW public.nh7_library_items_v224 WITH (security_invoker=true,security_barrier=true) AS SELECT id, title_fa, title_en, title_hr, description_fa, description_en, description_hr, audience, resource_type, apocrypha_book, mime_type, file_name, file_size, cover_url, sort_order, created_at, updated_at, reader_mode, reader_language, reader_text, reader_status, reader_page_count, reader_updated_at, reader_available, collection_id FROM public.nh7_library_items_compat_wave66();
CREATE OR REPLACE VIEW public.nh7_library_items_v251 WITH (security_invoker=true,security_barrier=true) AS SELECT id, title_fa, title_en, title_hr, description_fa, description_en, description_hr, audience, resource_type, apocrypha_book, mime_type, file_name, file_size, cover_url, sort_order, created_at, updated_at, reader_mode, reader_language, reader_text, reader_status, reader_page_count, reader_updated_at, reader_available, collection_id FROM public.nh7_library_items_compat_wave66();
CREATE FUNCTION public.nh7_library_collections_compat_wave66() RETURNS TABLE (
  id uuid,
  slug text,
  title_fa text,
  title_en text,
  title_hr text,
  description_fa text,
  description_en text,
  description_hr text,
  icon text,
  audience text,
  sort_order integer,
  item_count integer
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $body$
SELECT c.id,
    c.slug,
    c.title_fa,
    c.title_en,
    c.title_hr,
    c.description_fa,
    c.description_en,
    c.description_hr,
    c.icon,
    c.audience,
    c.sort_order,
    count(i.id)::integer AS item_count
FROM public.nh7_library_collections_v322 c
LEFT JOIN public.nh7_library_items i
  ON i.collection_id = c.id
 AND i.resource_type = 'library'::text
 AND i.is_active
 AND i.is_published
 AND i.audience = c.audience
 AND (
   c.audience <> 'ministers'::text
   OR COALESCE(public.nh7_is_admin(), false)
   OR public.nh7_content_access_active_v251(auth.uid(), 'library_item'::text, i.id)
 )
WHERE c.is_active
  AND (
    COALESCE(public.nh7_is_admin(), false)
    OR auth.uid() IS NOT NULL
      AND (
        c.audience = 'ministers'::text
        AND public.nh7_content_access_active_v251(auth.uid(), 'library_collection'::text, c.id)
        OR c.audience <> 'ministers'::text
        AND public.nh7_school_access_approved_v230(
          auth.uid(),
          COALESCE(auth.jwt() ->> 'email'::text, ''::text),
          ''::text
        )
      )
  )
GROUP BY c.id
ORDER BY c.audience, c.sort_order, c.created_at;
$body$;
REVOKE ALL ON FUNCTION public.nh7_library_collections_compat_wave66() FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE VIEW public.nh7_library_collections_public_v251 WITH (security_invoker=true,security_barrier=true) AS SELECT id, slug, title_fa, title_en, title_hr, description_fa, description_en, description_hr, icon, audience, sort_order, item_count FROM public.nh7_library_collections_compat_wave66();
CREATE OR REPLACE VIEW public.nh7_library_collections_public_v322 WITH (security_invoker=true,security_barrier=true) AS SELECT id, slug, title_fa, title_en, title_hr, description_fa, description_en, description_hr, icon, audience, sort_order, item_count FROM public.nh7_library_collections_compat_wave66();
-- New helper EXECUTE limited to captured explicit view SELECT roles; no base-table/view grants.
DO $view_acl$ DECLARE g record; v text; fn text; BEGIN
  FOREACH v IN ARRAY ARRAY['public.nh7_library_items_v224','public.nh7_library_items_v251','public.nh7_library_collections_public_v251','public.nh7_library_collections_public_v322'] LOOP
    fn:=CASE WHEN v IN ('public.nh7_library_items_v224','public.nh7_library_items_v251') THEN 'public.nh7_library_items_compat_wave66()' ELSE 'public.nh7_library_collections_compat_wave66()' END;
    FOR g IN SELECT a.grantee,r.rolname FROM pg_class c CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a LEFT JOIN pg_roles r ON r.oid=a.grantee WHERE c.oid=v::regclass AND a.privilege_type='SELECT' AND a.grantee<>c.relowner LOOP
      IF g.grantee=0 THEN RAISE EXCEPTION 'WAVE66_PUBLIC_VIEW_ACL_REQUIRES_SEPARATE_REVIEW'; END IF;
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO %I',fn,g.rolname);
    END LOOP;
  END LOOP;
END $view_acl$;
-- Default privileges must not silently add an unapproved principal to either NEW adapter.
DO $new_acl$ BEGIN
 IF EXISTS (
  SELECT 1 FROM pg_proc p CROSS JOIN LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
  WHERE p.oid IN ('public.nh7_library_items_compat_wave66()'::regprocedure,'public.nh7_library_collections_compat_wave66()'::regprocedure)
    AND a.grantee<>p.proowner
    AND NOT EXISTS (
      SELECT 1 FROM pg_class c CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) v
      WHERE c.oid IN (CASE WHEN p.oid='public.nh7_library_items_compat_wave66()'::regprocedure THEN 'public.nh7_library_items_v224'::regclass ELSE 'public.nh7_library_collections_public_v251'::regclass END,
                      CASE WHEN p.oid='public.nh7_library_items_compat_wave66()'::regprocedure THEN 'public.nh7_library_items_v251'::regclass ELSE 'public.nh7_library_collections_public_v322'::regclass END)
        AND v.grantee=a.grantee AND v.privilege_type='SELECT'
    )
 ) THEN RAISE EXCEPTION 'WAVE66_UNEXPECTED_DEFAULT_FUNCTION_ACL'; END IF;
END $new_acl$;
-- FIXTURE-SQL-END
-- No COMMIT: this file cannot activate anything. Fresh ACL/dependency capture and owner-approved transaction required.
ROLLBACK;
