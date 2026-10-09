-- New Hope 7 — REVIEW / REHEARSAL ONLY
-- Date: 2026-10-09
-- Purpose: reduce stale Library QA SECURITY DEFINER attack surface.
-- This file intentionally ends with ROLLBACK and is NOT a Production migration.

begin;

-- Historical QA RPCs currently expose EXECUTE through PUBLIC.
-- Keep authenticated/service_role access so an authorized Admin QA path, if still needed,
-- is not broken; only remove unauthenticated/public execution capability.
revoke execute on function public.nh7_qa_library_catalog_v363() from public;
revoke execute on function public.nh7_qa_library_catalog_v363() from anon;

grant execute on function public.nh7_qa_library_catalog_v363() to authenticated;
grant execute on function public.nh7_qa_library_catalog_v363() to service_role;

revoke execute on function public.nh7_qa_library_reader_access_v363(uuid, text) from public;
revoke execute on function public.nh7_qa_library_reader_access_v363(uuid, text) from anon;

grant execute on function public.nh7_qa_library_reader_access_v363(uuid, text) to authenticated;
grant execute on function public.nh7_qa_library_reader_access_v363(uuid, text) to service_role;

-- Expected rehearsal state inside this transaction:
select p.proname,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_exec,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_exec,
       has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_exec,
       has_function_privilege('public', p.oid, 'EXECUTE') as public_exec
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('nh7_qa_library_catalog_v363','nh7_qa_library_reader_access_v363')
order by p.proname;

-- Do not persist from this review file.
rollback;
