create index if not exists notification_inbox_lower_email_delivered_cost_v1
  on public.notification_inbox (lower(user_email), delivered_at desc)
  where admin_deleted_at is null and user_email is not null;
