-- OmideNo7 Admin v1.6.4-admin5
-- Ensures admin panel can insert personal messages into users' in-app Inbox.
-- Safe to run more than once.

create table if not exists public.notification_inbox (
  id uuid primary key default gen_random_uuid(),
  device_id text,
  user_email text,
  title text not null,
  body text not null,
  category text default 'app',
  language text default 'fa',
  delivered_at timestamptz default now(),
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table public.notification_inbox enable row level security;

drop policy if exists "insert notification inbox" on public.notification_inbox;
create policy "insert notification inbox" on public.notification_inbox
for insert with check (true);

drop policy if exists "read own notification inbox" on public.notification_inbox;
create policy "read own notification inbox" on public.notification_inbox
for select using (true);
