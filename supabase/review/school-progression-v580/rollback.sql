-- REVIEW ONLY. Emergency capability disable; preserve ALL cycles/receipts/audit/activity.
-- Do not execute without explicit approval. No DROP/DELETE/UPDATE or legacy all-history restore.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.nh7_school_submit_v580(uuid,jsonb,integer,uuid,text),public.nh7_school_restart_v580(integer,uuid,boolean),public.nh7_admin_school_action_v580(uuid,integer,text,text,uuid,boolean,integer),public.nh7_school_progress_save_cycle_v580(text,integer,timestamptz,integer),public.nh7_school_assignment_submit_cycle_v580(text,text,text,text,text,integer),public.nh7_school_progress_save_v340(text,integer,timestamptz),public.nh7_submit_school_assignment(text,text,text,text,text),public.nh7_admin_review_school_assignment(uuid,text,integer,text) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
-- Keep generation-aware reads deployed. Restore compatible clients/functions only after
-- reviewing active-cycle state and every legacy write path; never remove cycle uniqueness.
