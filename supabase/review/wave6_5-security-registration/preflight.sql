-- READ ONLY. Run only with owner-approved read-only metadata access. No secrets/row bodies.
select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) as signature,p.prosecdef,p.proconfig,
 has_function_privilege('anon',p.oid,'execute') as anon_execute,
 has_function_privilege('authenticated',p.oid,'execute') as authenticated_execute,
 has_function_privilege('service_role',p.oid,'execute') as service_execute,
 pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where p.prosecdef and n.nspname in ('public','private') order by 1,2,3;
select n.nspname,c.relname,c.reloptions,c.relacl,pg_get_viewdef(c.oid,true) as definition
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where c.relname in ('nh7_library_items_v224','nh7_library_items_v251','nh7_library_collections_public_v251','nh7_library_collections_public_v322');
select table_schema,table_name,column_name,data_type,ordinal_position from information_schema.columns
where table_name in ('nh7_library_items_v224','nh7_library_items_v251','nh7_library_collections_public_v251','nh7_library_collections_public_v322') order by 1,2,5;
select n.nspname,c.relname,c.relacl,c.relrowsecurity,c.relforcerowsecurity,
 (select count(*) from pg_policy p where p.polrelid=c.oid) as policy_count
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where c.relrowsecurity and c.relkind in ('r','p') order by 1,2;
select * from pg_policies where schemaname in ('public','private','storage');
select e.extname,e.extrelocatable,n.nspname from pg_extension e join pg_namespace n on n.oid=e.extnamespace where e.extname in ('pg_net','pgcrypto');
select n.nspname,p.proname,p.proacl,pg_get_function_identity_arguments(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('net','public') and (n.nspname='net' or p.proname like '%http%');
select table_schema,table_name,column_name,data_type from information_schema.columns
where table_schema in ('public','private') and (column_name ~* '(user|email|owner|author|recipient|actor|target|device|profile|student)' or data_type in ('json','jsonb')) order by 1,2,3;
-- Also capture FK graph, nested JSON identity paths, Storage owner/path rules, triggers, current v372/v381/self-delete source,
-- Auth email confirmation/rates/password/CAPTCHA/redirect settings manually. Never print secret/provider values.
select conrelid::regclass,confrelid::regclass,pg_get_constraintdef(oid) from pg_constraint where contype='f';
select tgrelid::regclass,tgname,pg_get_triggerdef(oid) from pg_trigger where not tgisinternal;
