-- REVIEW ONLY: disable V2 RPC access; preserve every table/row and legacy path.
-- Run only after explicit approval; no deployment automation executes this file.
begin;
revoke all on function public.nh7_document_capabilities_v2() from public,anon,authenticated;
revoke all on function public.nh7_document_recipients_v2() from public,anon,authenticated;
revoke all on function public.nh7_document_save_draft_v2(jsonb,integer) from public,anon,authenticated;
revoke all on function public.nh7_document_issue_v2(uuid,integer) from public,anon,authenticated;
revoke all on function public.nh7_document_reserve_number_v2(uuid,integer) from public,anon,authenticated;
revoke all on function public.nh7_document_admin_list_v2() from public,anon,authenticated;
revoke all on function public.nh7_document_revoke_v2(uuid,text) from public,anon,authenticated;
revoke all on function public.nh7_document_deliver_v2(uuid) from public,anon,authenticated;
revoke all on function public.nh7_document_delete_draft_v2(uuid) from public,anon,authenticated;
revoke all on function public.nh7_document_save_template_v2(text,jsonb) from public,anon,authenticated;
revoke all on function public.nh7_document_templates_v2() from public,anon,authenticated;
revoke all on function public.nh7_document_verify_v2(uuid) from public,anon,authenticated;
revoke all on function public.nh7_my_documents_v2() from public,anon,authenticated;
commit;
