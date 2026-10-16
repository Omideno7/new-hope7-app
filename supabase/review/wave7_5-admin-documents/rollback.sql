-- REVIEW ONLY disable-first rollback. Apply only with separate owner approval; never automatic.
begin;
update private.nh7_document_control_wave75 set enabled=false,changed_at=now() where singleton;
revoke all on function public.nh7_document_save_draft_v2(jsonb,integer) from public,anon,authenticated,service_role;
revoke all on function public.nh7_document_prepare_v2(uuid,integer,uuid) from public,anon,authenticated,service_role;
revoke all on function public.nh7_document_issue_v2(uuid,integer,uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function public.nh7_document_revoke_v2(uuid,text) from public,anon,authenticated,service_role;
revoke all on function public.nh7_document_expire_v2(uuid,timestamptz,text) from public,anon,authenticated,service_role;
revoke all on function public.nh7_document_deliver_v2(uuid) from public,anon,authenticated,service_role;
revoke all on function public.nh7_document_save_template_v2(text,jsonb) from public,anon,authenticated,service_role;
-- Preserve all tables, immutable triggers, event history, tokens, numbers, parent links and delivery rows.
-- Keep minimal public verify and trusted auth.uid() My Documents available. Never restore full public bodies.
-- Do not rerun the Wave5 baseline after this package: it would restore older contracts.
commit;
