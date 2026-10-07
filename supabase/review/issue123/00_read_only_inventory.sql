-- Issue #123. READ ONLY. Run only with separately authorized metadata access.
-- Does not fetch books, reader text, grant holders, credentials or object names.
-- Review results privately; policy expressions may identify users. Publish sanitized findings only.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SELECT current_setting('server_version') AS postgres_version;
SELECT n.nspname AS schema_name,c.relname,c.relkind,c.relrowsecurity,c.relforcerowsecurity,
       pg_get_userbyid(c.relowner) AS owner,c.reloptions,
       has_table_privilege('anon',c.oid,'SELECT') AS anon_select,
       has_table_privilege('authenticated',c.oid,'SELECT') AS authenticated_select
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname IN ('public','private','storage')
 AND (c.relname ~ '^nh7_.*(library|content_access)' OR (n.nspname='storage' AND c.relname IN ('objects','buckets')))
ORDER BY 1,2;
SELECT table_schema,table_name,column_name,data_type,is_nullable
FROM information_schema.columns
WHERE table_schema IN ('public','private') AND table_name ~ '^nh7_.*(library|content_access)'
ORDER BY 1,2,ordinal_position;
SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
FROM pg_policies WHERE (schemaname IN ('public','private') AND tablename ~ '^nh7_.*(library|content_access)')
 OR (schemaname='storage' AND tablename='objects') ORDER BY 1,2,3;
SELECT n.nspname AS schema_name,p.proname,pg_get_function_identity_arguments(p.oid) AS arguments,
       pg_get_function_result(p.oid) AS result,p.prosecdef,p.provolatile,p.proconfig,
       pg_get_userbyid(p.proowner) AS owner,p.proacl,
       has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute,
       has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute,
       md5(pg_get_functiondef(p.oid)) AS definition_hash,
       pg_get_functiondef(p.oid) LIKE '%auth.uid%' AS mentions_uid
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname IN ('public','private') AND p.prokind='f'
 AND (p.proname ~ '^nh7_.*(library|content_access)' OR p.proname IN ('nh7_is_admin','nh7_admin_is_admin','nh7_admin_is_owner_v350','nh7_admin_has_permission_v350','nh7_admin_books_review_v362','nh7_admin_engagement_analytics_v223'))
ORDER BY 1,2,3;
-- Dependency graph: inspect referenced base tables; absence of a dependency can
-- mean dynamic SQL, not absence of a bypass. Full definitions need private review.
SELECT DISTINCT pn.nspname AS function_schema,p.proname,tn.nspname AS table_schema,c.relname
FROM pg_proc p JOIN pg_namespace pn ON pn.oid=p.pronamespace
JOIN pg_depend d ON d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.refclassid='pg_class'::regclass
JOIN pg_class c ON c.oid=d.refobjid JOIN pg_namespace tn ON tn.oid=c.relnamespace
WHERE (p.proname ~ '^nh7_.*(library|content_access)' OR p.proname IN ('nh7_admin_books_review_v362','nh7_admin_engagement_analytics_v223')) ORDER BY 1,2,3,4;
SELECT n.nspname AS schema_name,c.relname,pg_get_viewdef(c.oid,true) AS view_definition
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE c.relkind IN ('v','m') AND n.nspname='public' AND c.relname ~ '^nh7_.*library';
SELECT id,public,file_size_limit,allowed_mime_types FROM storage.buckets WHERE id='nh7-library';
-- Missing names are blockers, not permission to install guessed definitions.
SELECT name,to_regprocedure(name) IS NOT NULL AS available
FROM (VALUES ('public.nh7_library_catalog_v396()'),
 ('public.nh7_admin_content_access_dashboard_v395()'),
 ('public.nh7_library_claim_code_redeem_v433(text)'),
 ('private.nh7_admin_is_owner_v350()')) expected(name);
ROLLBACK;
