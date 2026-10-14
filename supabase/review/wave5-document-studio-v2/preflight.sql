-- REVIEW ONLY metadata queries; not executed against Production in Wave5.
select to_regprocedure('private.nh7_admin_is_owner_v350()'),to_regprocedure('public.nh7_admin_my_access_v350()'),to_regprocedure('public.nh7_admin_library_save_item_v224(jsonb)');
select table_schema,table_name,column_name,data_type from information_schema.columns where (table_schema='public' and table_name in('school_student_identities','school_certificates','nh7_library_items')) or (table_schema='storage' and table_name='objects') order by 1,2,3;
select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid),p.prosecdef,p.proconfig,pg_get_functiondef(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname in('nh7_admin_is_owner_v350','nh7_admin_my_access_v350','nh7_admin_library_save_item_v224','nh7_library_authorize_v230');
select schemaname,tablename,policyname,roles,cmd,qual,with_check from pg_policies where tablename in('school_certificates','nh7_library_items','objects');
-- Verify absence/no collision of all proposed v2 tables/functions, exact current file
-- upload/owner_id/read/write contracts, immutable-new-item semantics, actor and
-- recipient account deletion behavior before separate approval. Do not guess/backfill.
