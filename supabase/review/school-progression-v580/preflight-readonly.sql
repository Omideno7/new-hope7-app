-- READ ONLY. Review exact live definitions, dependencies, constraints and ACL before activation.
select current_setting('server_version_num');
select p.oid::regprocedure,p.prosecdef,p.proconfig,md5(pg_get_functiondef(p.oid)),p.proacl
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname in('public','private') and (p.proname like '%school%' or p.proname like '%assignment%' or p.proname like '%certificate%' or p.proname in('nh7_admin_is_owner_v350','nh7_admin_my_access_v350')) order by 1;
select c.conrelid::regclass,c.conname,pg_get_constraintdef(c.oid) from pg_constraint c where c.conrelid in('public.school_progress'::regclass,'public.school_assignments'::regclass,'public.school_exam_attempts'::regclass);
select tablename,policyname,roles,cmd,qual,with_check from pg_policies where schemaname='public' and tablename in('school_progress','school_assignments','school_exam_attempts','school_certificates');
select 'unbound progress' finding,count(*) from public.school_progress where user_id is null
union all select 'unbound assignments',count(*) from public.school_assignments where user_id is null
union all select 'unbound attempts',count(*) from public.school_exam_attempts where user_id is null;
-- Reconcile all legacy report/completion/certificate callers before activating any new cycle.
-- Never dump student answer/content rows into this public repository.
select schemaname,tablename,indexname,indexdef from pg_indexes where schemaname='public' and tablename in('school_progress','school_assignments','school_exam_attempts') order by tablename,indexname;
select tgrelid::regclass,tgname,pg_get_triggerdef(oid) from pg_trigger where tgrelid in('public.school_progress'::regclass,'public.school_assignments'::regclass,'public.school_exam_attempts'::regclass) and not tgisinternal;
-- A standalone unique(email,lesson) index or OID-dependent report caller must be
-- explicitly reconciled before approval; never remove an unknown index automatically.
