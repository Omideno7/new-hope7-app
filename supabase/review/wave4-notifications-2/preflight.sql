-- REVIEW ONLY metadata reads. Not executed by this Wave or CI.
select table_schema,table_name,column_name,data_type,is_nullable from information_schema.columns
where (table_schema='public' and table_name in ('notification_inbox','notification_inbox_receipts','notification_dispatch_log','admin_notification_events','nh7_admin_campaigns_v360','registrations','sermons','school_lessons'))
 or (table_schema='private' and table_name like '%notification%') order by table_schema,table_name,ordinal_position;
select conrelid::regclass,conname,pg_get_constraintdef(oid) from pg_constraint where conrelid in
 ('public.notification_dispatch_log'::regclass,'public.admin_notification_events'::regclass,'public.nh7_admin_campaigns_v360'::regclass);
select schemaname,tablename,policyname,roles,qual,with_check from pg_policies where tablename in ('notification_inbox','notification_inbox_receipts');
select pg_get_functiondef('public.nh7_inbox_snapshot_v419(text,integer,integer)'::regprocedure);
select role,is_active,count(*) from private.nh7_admin_members_v350 group by role,is_active;
-- No emails, JWTs, secret values or private request content in preflight output.
