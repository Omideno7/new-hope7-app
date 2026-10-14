-- REVIEW ONLY disable mutations/admin helpers; preserve every issued row/token/archive and public verification.
begin;
revoke all on function public.nh7_document_library_prepare_v2(jsonb) from public,anon,authenticated,service_role;
revoke all on function public.nh7_document_library_plan_v2(uuid,uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function public.nh7_document_library_claim_v2(uuid,text) from public,anon,authenticated,service_role;
revoke all on function public.nh7_document_library_finish_v2(uuid,text) from public,anon,authenticated,service_role;
revoke all on function public.nh7_document_library_storage_owner_v2(text,uuid) from public,anon,authenticated,service_role;
revoke all on function public.nh7_document_library_status_v2(uuid) from public,anon,authenticated,service_role;
revoke all on function public.nh7_document_capabilities_v2() from public,anon,authenticated,service_role;
revoke all on function public.nh7_document_recipients_v2() from public,anon,authenticated,service_role;
revoke all on function public.nh7_document_save_draft_v2(jsonb,integer) from public,anon,authenticated,service_role;
revoke all on function public.nh7_document_prepare_v2(uuid,integer,uuid) from public,anon,authenticated,service_role;
revoke all on function public.nh7_document_issue_v2(uuid,integer,uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function public.nh7_document_admin_list_v2() from public,anon,authenticated,service_role;
revoke all on function public.nh7_document_revoke_v2(uuid,text) from public,anon,authenticated,service_role;
revoke all on function public.nh7_document_deliver_v2(uuid) from public,anon,authenticated,service_role;
revoke all on function public.nh7_document_save_template_v2(text,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.nh7_document_templates_v2() from public,anon,authenticated,service_role;
commit;
-- Also stop reviewed Library Edge invocation and remove the client capability flag.
-- No DELETE/DROP/TRUNCATE or rollback exposing private snapshots.
