-- New Hope 7 — Inbox RLS initPlan optimization
-- Supabase migration history version: 20261003171531
-- Applied to Production on 2026-10-03 after read-only benchmarks and data-integrity checks.
-- This migration is idempotent and does not delete or rewrite user content.

-- Goal: preserve policy semantics while evaluating stable request/auth helpers once
-- per SQL statement instead of once per candidate row.

-- 1) notification_inbox SELECT policy
alter policy "notification inbox secure read"
on public.notification_inbox
using (
  admin_deleted_at is null
  and (
    (device_id is null and user_email is null)
    or device_id = (select public.nh7_device_id())
    or (
      (select auth.role()) = 'authenticated'::text
      and user_email is not null
      and lower(user_email) = lower(coalesce((select (auth.jwt() ->> 'email'::text)), ''::text))
    )
    or (
      user_email is not null
      and exists (
        select 1
        from public.registrations r
        where r.device_id = (select public.nh7_device_id())
          and r.status = 'approved'::text
          and lower(trim(both from coalesce((r.payload ->> 'email'::text), ''::text)))
              = lower(trim(both from notification_inbox.user_email))
      )
    )
    or coalesce((select public.nh7_is_admin()), false)
  )
);

-- 2) notification_inbox INSERT policy
alter policy "notification inbox secure self insert"
on public.notification_inbox
with check (
  device_id is not null
  and device_id = (select public.nh7_device_id())
  and admin_deleted_at is null
  and admin_deleted_by is null
  and (
    user_email is null
    or (
      (select auth.role()) = 'authenticated'::text
      and lower(user_email) = lower(coalesce((select (auth.jwt() ->> 'email'::text)), ''::text))
    )
    or exists (
      select 1
      from public.registrations r
      where r.device_id = (select public.nh7_device_id())
        and r.status = 'approved'::text
        and lower(trim(both from coalesce((r.payload ->> 'email'::text), ''::text)))
            = lower(trim(both from notification_inbox.user_email))
    )
  )
);

-- 3) Receipts policies. The existing helper reads auth/request headers and is
-- stable for the statement, so make it an initPlan instead of re-running per row.
alter policy "receipt own insert"
on public.notification_inbox_receipts
with check (
  user_key = (select public.nh7_request_user_key())
  or (select public.nh7_admin_is_admin_v170())
);

alter policy "receipt own select"
on public.notification_inbox_receipts
using (
  user_key = (select public.nh7_request_user_key())
  or (select public.nh7_admin_is_admin_v170())
);

alter policy "receipt own update"
on public.notification_inbox_receipts
using (
  user_key = (select public.nh7_request_user_key())
  or (select public.nh7_admin_is_admin_v170())
)
with check (
  user_key = (select public.nh7_request_user_key())
  or (select public.nh7_admin_is_admin_v170())
);

-- Verification after an explicitly approved Production apply:
