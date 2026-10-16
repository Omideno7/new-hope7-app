-- REVIEW ONLY operator capture. Not run by this task. Results may contain private metadata: do not publish.
begin transaction read only;
select current_database(),version();
select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) signature,
 p.prosecdef,p.proconfig,p.proacl,pg_get_userbyid(p.proowner) owner,md5(pg_get_functiondef(p.oid)) definition_md5
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where (n.nspname='private' and p.proname='nh7_admin_is_owner_v350')
 or (n.nspname='public' and p.proname in('nh7_admin_my_access_v350','nh7_document_capabilities_v2','nh7_document_verify_v2','nh7_my_documents_v2'))
 or p.proname like 'nh7_document_%v2' or p.proname like 'nh7_document_%wave75'
order by 1,2,3;
select table_schema,table_name,column_name,data_type,udt_name,is_nullable,column_default,ordinal_position
from information_schema.columns where (table_schema='public' and table_name in('school_student_identities','school_certificates','nh7_document_drafts_v2','nh7_official_documents_v2','nh7_document_deliveries_v2','nh7_document_design_templates_v2'))
 or (table_schema='private' and table_name in('nh7_document_control_wave75','nh7_document_events_wave75')) order by 1,2,ordinal_position;
select n.nspname,c.relname,c.relkind,c.relrowsecurity,c.relforcerowsecurity,c.relacl,pg_get_userbyid(c.relowner) owner
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where c.relname like 'nh7_document_%' or c.relname='nh7_official_documents_v2' order by 1,2;
select schemaname,tablename,policyname,roles,cmd,qual,with_check from pg_policies
where tablename like 'nh7_document_%' or tablename='nh7_official_documents_v2';
select conrelid::regclass,conname,pg_get_constraintdef(oid) from pg_constraint
where conrelid in(select oid from pg_class where relname in('school_student_identities','school_certificates','nh7_official_documents_v2','nh7_document_drafts_v2','nh7_document_deliveries_v2'));
select tgrelid::regclass,tgname,pg_get_triggerdef(oid) from pg_trigger where not tgisinternal
and tgrelid in(select oid from pg_class where relname like 'nh7_document_%' or relname='nh7_official_documents_v2');
select defaclrole::regrole,defaclnamespace::regnamespace,defaclobjtype,defaclacl from pg_default_acl;
-- Optional external asset/Library support ONLY; core inline/local assets do not need a new bucket/policy.
select table_schema,table_name,column_name,udt_name from information_schema.columns
where table_schema='storage' and table_name in('objects','buckets');
select schemaname,tablename,policyname,roles,cmd,qual,with_check from pg_policies where schemaname='storage';
rollback;
