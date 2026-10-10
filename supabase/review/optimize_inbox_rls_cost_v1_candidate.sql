-- REVIEW ONLY. Not an active migration.
-- Candidate cost optimizations after production performance audit on 2026-10-10.
-- Preserve behavior; reduce per-row auth evaluation and improve case-insensitive Inbox lookup.

create index if not exists notification_inbox_lower_email_delivered_cost_v1
  on public.notification_inbox (lower(user_email), delivered_at desc)
  where admin_deleted_at is null and user_email is not null;

create index if not exists school_assignments_lower_email_lesson_cost_v1
  on public.school_assignments (lower(user_email), lesson_code);

create index if not exists school_progress_lower_email_lesson_cost_v1
  on public.school_progress (lower(user_email), lesson_code);

-- InitPlan-safe account policies: same authorization semantics, auth JWT evaluated once per statement.
alter policy "NH7 account notes own" on public.nh7_account_notes
using ((lower(user_email)=lower(coalesce((select auth.jwt()->>'email'),''))) or coalesce((select public.nh7_is_admin()),false))
with check ((lower(user_email)=lower(coalesce((select auth.jwt()->>'email'),''))) or coalesce((select public.nh7_is_admin()),false));

alter policy "NH7 account progress own" on public.nh7_account_progress
using ((lower(user_email)=lower(coalesce((select auth.jwt()->>'email'),''))) or coalesce((select public.nh7_is_admin()),false))
with check ((lower(user_email)=lower(coalesce((select auth.jwt()->>'email'),''))) or coalesce((select public.nh7_is_admin()),false));

alter policy "NH7 account saved verses own" on public.nh7_account_saved_verses
using ((lower(user_email)=lower(coalesce((select auth.jwt()->>'email'),''))) or coalesce((select public.nh7_is_admin()),false))
with check ((lower(user_email)=lower(coalesce((select auth.jwt()->>'email'),''))) or coalesce((select public.nh7_is_admin()),false));

-- Community ownership policies: same user_id ownership, auth.uid evaluated once.
alter policy nh7_prayer_insert_own_v502 on public.nh7_prayer_requests_v502
with check ((user_id=(select auth.uid())) and status='new' and length(trim(request_text))>0);
alter policy nh7_prayer_select_own_v502 on public.nh7_prayer_requests_v502
using (user_id=(select auth.uid()));
alter policy nh7_testimony_insert_own_v502 on public.nh7_testimonies_v502
with check ((user_id=(select auth.uid())) and status='pending');
alter policy nh7_testimony_select_own_v502 on public.nh7_testimonies_v502
using (user_id=(select auth.uid()));

-- Do not activate this file until exact policy equivalence and EXPLAIN plans are reviewed.
