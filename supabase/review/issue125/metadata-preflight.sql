-- REVIEW ONLY: read-only metadata inspection. No grants, rows, policies or functions are changed.
BEGIN READ ONLY;
SELECT p.oid::regprocedure AS signature,
       pg_get_function_arguments(p.oid) AS arguments,
       p.prosecdef AS security_definer,
       p.proconfig AS function_settings,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN (
  'nh7_library_catalog_v396', 'nh7_library_reader_access_v250',
  'nh7_library_reader_access_v321', 'nh7_library_reader_access_v372',
  'nh7_library_authorize_v230', 'nh7_library_authorize_v251',
  'nh7_content_access_active_v251'
)
ORDER BY p.proname;
SELECT id, public FROM storage.buckets WHERE id='nh7-library';
ROLLBACK;
