-- REVIEW ONLY: exact signatures only. No global/public-schema blanket EXECUTE revocations.
-- Known trigger-only functions never need direct anonymous/authenticated invocation. Existing trigger invocation survives.
revoke execute on function public.nh7_create_school_registration_from_auth_v356() from public,anon,authenticated;
revoke execute on function public.nh7_require_complete_school_signup_auth_v355() from public,anon,authenticated;
-- All other matrix rows require deployed pg_get_functiondef/identity-arguments/ACL/caller preflight.
-- For approved Admin signatures: REVOKE EXECUTE ... FROM PUBLIC, anon; retain authenticated + INTERNAL UID check.
-- For approved private/internal/trigger signatures: REVOKE ... FROM PUBLIC, anon, authenticated; grant only exact server needs.
-- Do NOT revoke an intentional public verification/status/registration endpoint until its live replacement is accepted.
-- Do NOT rewrite unknown SECURITY DEFINER bodies/search_path. Resolve/qualify references then regression-test each exact body.
-- pg_net: no relocation. Extension is not assumed relocatable. net.http_* dependencies/grants must be captured first.
-- If no current anon/authenticated caller exists and owner approves, revoke exact net.http_* signatures from PUBLIC/anon/authenticated.
-- Keep service/internal trigger access, verify event pipelines and restore captured ACLs for rollback.
