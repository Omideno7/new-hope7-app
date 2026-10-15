-- REVIEW ONLY. Not a migration or deployment. No approval to execute.
BEGIN;
DO $review$ BEGIN RAISE EXCEPTION 'WAVE66_REVIEW_ONLY; owner approval and fresh preflight required'; END $review$;
-- Exact old SELECT definitions and unchanged existing view ACLs (CREATE OR REPLACE retains ACL).
-- FIXTURE-SQL-BEGIN
CREATE OR REPLACE VIEW public.nh7_library_items_v224 AS
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
FROM nh7_library_items i
WHERE is_published
  AND is_active
  AND (
    COALESCE(nh7_is_admin(), false)
    OR auth.uid() IS NOT NULL
      AND (
        audience = 'ministers'::text
        AND nh7_content_access_active_v251(auth.uid(), 'library_item'::text, id)
        OR audience <> 'ministers'::text
        AND nh7_school_access_approved_v230(
          auth.uid(),
          COALESCE(auth.jwt() ->> 'email'::text, ''::text),
          ''::text
        )
      )
  );
ALTER VIEW public.nh7_library_items_v224 RESET (security_invoker,security_barrier);
CREATE OR REPLACE VIEW public.nh7_library_items_v251 AS
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
FROM nh7_library_items i
WHERE is_published
  AND is_active
  AND (
    COALESCE(nh7_is_admin(), false)
    OR auth.uid() IS NOT NULL
      AND (
        audience = 'ministers'::text
        AND nh7_content_access_active_v251(auth.uid(), 'library_item'::text, id)
        OR audience <> 'ministers'::text
        AND nh7_school_access_approved_v230(
          auth.uid(),
          COALESCE(auth.jwt() ->> 'email'::text, ''::text),
          ''::text
        )
      )
  );
ALTER VIEW public.nh7_library_items_v251 RESET (security_invoker,security_barrier);
CREATE OR REPLACE VIEW public.nh7_library_collections_public_v251 AS
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
FROM nh7_library_collections_v322 c
LEFT JOIN nh7_library_items i
  ON i.collection_id = c.id
 AND i.resource_type = 'library'::text
 AND i.is_active
 AND i.is_published
 AND i.audience = c.audience
 AND (
   c.audience <> 'ministers'::text
   OR COALESCE(nh7_is_admin(), false)
   OR nh7_content_access_active_v251(auth.uid(), 'library_item'::text, i.id)
 )
WHERE c.is_active
  AND (
    COALESCE(nh7_is_admin(), false)
    OR auth.uid() IS NOT NULL
      AND (
        c.audience = 'ministers'::text
        AND nh7_content_access_active_v251(auth.uid(), 'library_collection'::text, c.id)
        OR c.audience <> 'ministers'::text
        AND nh7_school_access_approved_v230(
          auth.uid(),
          COALESCE(auth.jwt() ->> 'email'::text, ''::text),
          ''::text
        )
      )
  )
GROUP BY c.id
ORDER BY c.audience, c.sort_order, c.created_at;
ALTER VIEW public.nh7_library_collections_public_v251 RESET (security_invoker,security_barrier);
CREATE OR REPLACE VIEW public.nh7_library_collections_public_v322 AS
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
FROM nh7_library_collections_v322 c
LEFT JOIN nh7_library_items i
  ON i.collection_id = c.id
 AND i.resource_type = 'library'::text
 AND i.is_active
 AND i.is_published
 AND i.audience = c.audience
 AND (
   c.audience <> 'ministers'::text
   OR COALESCE(nh7_is_admin(), false)
   OR nh7_content_access_active_v251(auth.uid(), 'library_item'::text, i.id)
 )
WHERE c.is_active
  AND (
    COALESCE(nh7_is_admin(), false)
    OR auth.uid() IS NOT NULL
      AND (
        c.audience = 'ministers'::text
        AND nh7_content_access_active_v251(auth.uid(), 'library_collection'::text, c.id)
        OR c.audience <> 'ministers'::text
        AND nh7_school_access_approved_v230(
          auth.uid(),
          COALESCE(auth.jwt() ->> 'email'::text, ''::text),
          ''::text
        )
      )
  )
GROUP BY c.id
ORDER BY c.audience, c.sort_order, c.created_at;
ALTER VIEW public.nh7_library_collections_public_v322 RESET (security_invoker,security_barrier);
DROP FUNCTION public.nh7_library_items_compat_wave66();
DROP FUNCTION public.nh7_library_collections_compat_wave66();
-- FIXTURE-SQL-END
ROLLBACK;
