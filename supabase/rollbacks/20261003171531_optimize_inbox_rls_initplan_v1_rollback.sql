-- New Hope 7 — exact rollback for proposed Inbox RLS initPlan optimization
-- Restores the Production policy expressions observed before the proposal.

alter policy "notification inbox secure read"
on public.notification_inbox
using (
  (admin_deleted_at is null)
  and (
    ((device_id is null) and (user_email is null))
    or (device_id = public.nh7_device_id())
    or (
      (auth.role() = 'authenticated'::text)
      and (user_email is not null)
      and (lower(user_email) = lower(coalesce((auth.jwt() ->> 'email'::text), ''::text)))
    )
    or (
      (user_email is not null)
      and exists (
        select 1
        from public.registrations r
        where (r.device_id = public.nh7_device_id())
          and (r.status = 'approved'::text)
          and (
            lower(trim(both from coalesce((r.payload ->> 'email'::text), ''::text)))
            = lower(trim(both from notification_inbox.user_email))
          )
      )
    )
    or coalesce(public.nh7_is_admin(), false)
  )
);

alter policy "notification inbox secure self insert"
on public.notification_inbox
with check (
  (device_id is not null)
  and (device_id = public.nh7_device_id())
  and (admin_deleted_at is null)
  and (admin_deleted_by is null)
  and (
    (user_email is null)
    or (
      (auth.role() = 'authenticated'::text)
      and (lower(user_email) = lower(coalesce((auth.jwt() ->> 'email'::text), ''::text)))
    )
    or exists (
      select 1
      from public.registrations r
      where (r.device_id = public.nh7_device_id())
        and (r.status = 'approved'::text)
        and (
          lower(trim(both from coalesce((r.payload ->> 'email'::text), ''::text)))
          = lower(trim(both from notification_inbox.user_email))
        )
    )
  )
);

alter policy "receipt own insert"
on public.notification_inbox_receipts
with check (
  (user_key = public.nh7_request_user_key())
  or public.nh7_admin_is_admin_v170()
);

alter policy "receipt own select"
on public.notification_inbox_receipts
using (
  (user_key = public.nh7_request_user_key())
  or public.nh7_admin_is_admin_v170()
);

alter policy "receipt own update"
on public.notification_inbox_receipts
using (
  (user_key = public.nh7_request_user_key())
  or public.nh7_admin_is_admin_v170()
)
with check (
  (user_key = public.nh7_request_user_key())
  or public.nh7_admin_is_admin_v170()
);
