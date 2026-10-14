-- REVIEW ONLY disable/rollback after a separately approved future activation.
-- Retain every Inbox/receipt/campaign/preferences/subscription/ledger row and UID fence.
begin;
drop trigger if exists nh7_notifications_registration_wave4 on public.registrations;
drop trigger if exists nh7_notifications_prayer_wave4 on public.nh7_prayer_requests_v502;
drop trigger if exists nh7_notifications_qa_wave4 on public.qa_questions;
drop trigger if exists nh7_notifications_assignment_wave4 on public.school_assignments;
drop trigger if exists nh7_notifications_testimony_wave4 on public.nh7_testimonies_v502;
revoke execute on function public.nh7_notification_campaign_preview_wave4(jsonb) from authenticated;
-- Stop the approved event invocation/provider dispatch externally; do not delete claims.
-- DO NOT restore a legacy snapshot/RLS that exposes new Admin-targeted UID rows.
commit;
