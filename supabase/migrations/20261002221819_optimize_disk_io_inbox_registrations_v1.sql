
create index if not exists notification_inbox_device_delivered_io_v1
  on public.notification_inbox (device_id, delivered_at desc)
  where admin_deleted_at is null and device_id is not null;

create index if not exists notification_inbox_email_delivered_io_v1
  on public.notification_inbox (user_email, delivered_at desc)
  where admin_deleted_at is null and user_email is not null;

create index if not exists notification_inbox_global_language_delivered_io_v1
  on public.notification_inbox (language, delivered_at desc)
  where admin_deleted_at is null and device_id is null and user_email is null;

create index if not exists registrations_type_status_updated_io_v1
  on public.registrations (type, status, updated_at desc);
