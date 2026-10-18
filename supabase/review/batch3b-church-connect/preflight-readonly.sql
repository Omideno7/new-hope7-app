-- Metadata only. Owner must run separately after approval; not executed by this task.
SELECT to_regprocedure('private.nh7_admin_is_owner_v350()') AS owner_helper,
       to_regprocedure('public.nh7_get_meeting_settings(text,text)') AS legacy_reader,
       to_regclass('public.meeting_settings') AS existing_settings,
       to_regclass('private.nh7_connect_items_b3b') AS proposed_table;
SELECT n.nspname,p.proname,pg_get_function_identity_arguments(p.oid),p.prosecdef,p.proacl,md5(pg_get_functiondef(p.oid))
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname IN ('public','private') AND p.proname IN ('nh7_admin_is_owner_v350','nh7_get_meeting_settings','nh7_connect_catalog_b3b','nh7_connect_detail_b3b','nh7_connect_admin_list_b3b','nh7_connect_admin_save_b3b');
