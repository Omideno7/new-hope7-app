-- REVIEW ONLY rollback of new enforcement; no deleted data can be restored by this script.
-- First disable client/worker flags, stop new jobs and inspect in-flight stages. Do not undo completed UUID tombstones.
drop trigger if exists nh7_registration_strict_wave65 on public.registrations;
drop trigger if exists nh7_auth_signup_strict_wave65 on auth.users;
revoke execute on function public.nh7_submit_registration_wave65(text,text,text,text,jsonb) from authenticated;
revoke execute on function public.nh7_full_delete_prepare_wave65(uuid,uuid,uuid,text,text,text),public.nh7_full_delete_database_wave65(uuid),public.nh7_full_delete_stage_wave65(uuid,text) from service_role;
-- Restore FOUR captured original view definitions and per-function/view ACLs from approved preflight export.
-- Do NOT grant broadly, disable base RLS, clear caches, undo completed deletions, or recreate users from logs.
-- Keep write fences/jobs for already-deleted UIDs. Resolve incomplete jobs manually against their immutable UUID.
