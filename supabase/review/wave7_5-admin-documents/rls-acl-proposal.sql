-- REVIEW ONLY. Exact signatures, no wildcard GRANT or direct client table access.
revoke all on function private.nh7_document_admin_v2() from public,anon,authenticated,service_role;
revoke all on function private.nh7_document_immutable_wave75() from public,anon,authenticated,service_role;
revoke all on function private.nh7_document_revoke_event_wave75() from public,anon,authenticated,service_role;
revoke all on function public.nh7_document_issue_v2(uuid,integer,uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.nh7_document_issue_v2(uuid,integer,uuid,uuid) to authenticated;
revoke all on function public.nh7_document_expire_v2(uuid,timestamptz,text) from public,anon,authenticated,service_role;
grant execute on function public.nh7_document_expire_v2(uuid,timestamptz,text) to authenticated;
revoke all on function public.nh7_document_verify_v2(uuid) from public,anon,authenticated,service_role;
grant execute on function public.nh7_document_verify_v2(uuid) to anon,authenticated;
revoke all on function public.nh7_document_capabilities_v2() from public,anon,authenticated,service_role;
grant execute on function public.nh7_document_capabilities_v2() to authenticated;
-- Wave5 exact existing RPC grants remain; their mutation/admin helper is now owner + server-gated.
-- No policies granting direct table reads/writes, no base/Storage grants or changes to current auth.
revoke all on public.nh7_document_drafts_v2,public.nh7_official_documents_v2,public.nh7_document_deliveries_v2,public.nh7_document_design_templates_v2 from service_role;
revoke all on sequence public.nh7_document_numbers_v2 from service_role;
revoke all on function public.nh7_document_admin_list_v2() from public,anon,authenticated,service_role;
grant execute on function public.nh7_document_admin_list_v2() to authenticated;
revoke all on function public.nh7_document_recipient_search_v2(text,uuid,integer) from public,anon,authenticated,service_role;
grant execute on function public.nh7_document_recipient_search_v2(text,uuid,integer) to authenticated;
