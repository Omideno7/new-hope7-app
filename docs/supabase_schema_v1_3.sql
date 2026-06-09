
-- New Hope 7 App v1.3 Supabase foundation
-- Run this file in Supabase Dashboard -> SQL Editor -> New query -> Run.

create extension if not exists pgcrypto;

create or replace function public.nh7_device_id()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.headers', true)::json ->> 'x-device-id', ''),
    'unknown'
  );
$$;


create or replace function public.nh7_request_email()
returns text
language sql
stable
as $$
  select lower(coalesce(
    nullif(current_setting('request.headers', true)::json ->> 'x-user-email', ''),
    ''
  ));
$$;

create or replace function public.nh7_is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email','') in ('omideno7church@gmail.com');
$$;

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  type text not null check (type in ('school','meeting','general')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  language text default 'en',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_verses (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  ref text not null,
  language text default 'en',
  created_at timestamptz not null default now(),
  unique(device_id, ref)
);

create table if not exists public.user_notes (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  note_key text not null,
  content text not null default '',
  language text default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(device_id, note_key)
);

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  progress_key text not null,
  value jsonb not null default '{}'::jsonb,
  language text default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(device_id, progress_key)
);

alter table public.registrations enable row level security;
alter table public.saved_verses enable row level security;
alter table public.user_notes enable row level security;
alter table public.user_progress enable row level security;

drop policy if exists "registrations insert own" on public.registrations;
drop policy if exists "registrations select own or admin" on public.registrations;
drop policy if exists "registrations update admin" on public.registrations;
create policy "registrations insert own" on public.registrations for insert to anon, authenticated with check (device_id = public.nh7_device_id());
create policy "registrations select own or admin" on public.registrations for select to anon, authenticated using (
  device_id = public.nh7_device_id()
  or lower(coalesce(payload ->> 'email','')) = public.nh7_request_email()
  or public.nh7_is_admin()
);
create policy "registrations update admin" on public.registrations for update to authenticated using (public.nh7_is_admin()) with check (public.nh7_is_admin());

drop policy if exists "saved verses own all" on public.saved_verses;
create policy "saved verses own all" on public.saved_verses for all to anon, authenticated using (device_id = public.nh7_device_id()) with check (device_id = public.nh7_device_id());

drop policy if exists "user notes own all" on public.user_notes;
create policy "user notes own all" on public.user_notes for all to anon, authenticated using (device_id = public.nh7_device_id()) with check (device_id = public.nh7_device_id());

drop policy if exists "user progress own all" on public.user_progress;
create policy "user progress own all" on public.user_progress for all to anon, authenticated using (device_id = public.nh7_device_id()) with check (device_id = public.nh7_device_id());


-- Q&A / پرسش و پاسخ - added in v1.3.1
create table if not exists public.qa_questions (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  question_text text not null,
  answer_text text,
  status text not null default 'pending' check (status in ('pending','answered','hidden')),
  language text default 'en',
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.qa_questions enable row level security;

drop policy if exists "qa insert own" on public.qa_questions;
drop policy if exists "qa select own answered or admin" on public.qa_questions;
drop policy if exists "qa update admin" on public.qa_questions;

create policy "qa insert own" on public.qa_questions
for insert to anon, authenticated
with check (device_id = public.nh7_device_id());

create policy "qa select own answered or admin" on public.qa_questions
for select to anon, authenticated
using (device_id = public.nh7_device_id() or status = 'answered' or public.nh7_is_admin());

create policy "qa update admin" on public.qa_questions
for update to authenticated
using (public.nh7_is_admin())
with check (public.nh7_is_admin());

-- Church meeting details - added in v1.3.2
-- Admin can change meeting link/code in Supabase without uploading a new app version.
create table if not exists public.meeting_settings (
  id text primary key default 'active',
  provider text default 'FreeConferenceCall',
  meeting_url text,
  phone_number text,
  access_code text,
  security_code text,
  extra_info text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meeting_settings enable row level security;

drop policy if exists "meeting settings select approved or admin" on public.meeting_settings;
drop policy if exists "meeting settings admin insert" on public.meeting_settings;
drop policy if exists "meeting settings admin update" on public.meeting_settings;

create policy "meeting settings select approved or admin" on public.meeting_settings
for select to anon, authenticated
using (
  public.nh7_is_admin()
  or exists (
    select 1 from public.registrations r
    where (r.device_id = public.nh7_device_id() or lower(coalesce(r.payload ->> 'email','')) = public.nh7_request_email())
      and r.type = 'meeting'
      and r.status = 'approved'
  )
);

create policy "meeting settings admin insert" on public.meeting_settings
for insert to authenticated
with check (public.nh7_is_admin());

create policy "meeting settings admin update" on public.meeting_settings
for update to authenticated
using (public.nh7_is_admin())
with check (public.nh7_is_admin());

insert into public.meeting_settings (id, provider, meeting_url, phone_number, access_code, security_code, extra_info)
values ('active', 'FreeConferenceCall', 'https://fccdl.in/i/omideno7church', '', '', '789987', 'پس از تأیید ثبت‌نام توسط ادمین، روی لینک جلسه کلیک کنید و هنگام ورود کد امنیتی را وارد کنید.')
on conflict (id) do update set
  provider = excluded.provider,
  meeting_url = coalesce(nullif(public.meeting_settings.meeting_url,''), excluded.meeting_url),
  security_code = coalesce(nullif(public.meeting_settings.security_code,''), excluded.security_code),
  extra_info = coalesce(nullif(public.meeting_settings.extra_info,''), excluded.extra_info),
  updated_at = now();


-- Notification inbox for New Hope 7 v1.3.7
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

-- Optional global notification schedule rows for admin/backend automation
create table if not exists public.notification_schedule (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  title_fa text not null,
  body_fa text not null,
  title_en text not null,
  body_en text not null,
  title_hr text not null,
  body_hr text not null,
  send_time text not null,
  timezone_mode text not null default 'user_local',
  category text not null default 'daily',
  enabled boolean default true,
  created_at timestamptz default now()
);

insert into public.notification_schedule (key,title_fa,body_fa,title_en,body_en,title_hr,body_hr,send_time,timezone_mode,category)
values
('daily_word','کلام روزانه آماده است','امروز کلام خدا را دریافت کن و روزت را با ایمان شروع کن.','Daily Word is ready','Receive God’s Word today and start your day in faith.','Dnevna Riječ je spremna','Primi Božju Riječ danas i započni dan u vjeri.','07:00','user_local','daily_word'),
('faith','اعلان ایمان آماده است','وقت اعلان ایمان است؛ کلام را با دهانت اعلام کن.','Faith proclamation is ready','It is time for your faith proclamation; speak the Word.','Proglas vjere je spreman','Vrijeme je za proglas vjere; izgovori Riječ.','12:00','user_local','faith'),
('daily_juice','آبمیوه روزانه آماده است','آبمیوه روزانه امروز آماده است؛ چند دقیقه برای تقویت روح خود وقت بگذار.','Daily Juice is ready','Today’s Daily Juice is ready; take a few minutes to strengthen your spirit.','Dnevni sok je spreman','Današnji Daily Juice je spreman; odvoji nekoliko minuta za svoj duh.','17:00','user_local','daily_juice'),
('gratitude','یادآوری شکرگزاری','امروز را با شکرگزاری به پایان برسان و نیکویی خدا را به یاد آور.','Gratitude reminder','End today with thanksgiving and remember God’s goodness.','Podsjetnik zahvalnosti','Završi dan zahvalnošću i sjeti se Božje dobrote.','21:00','user_local','gratitude'),
('morning_meeting','یادآوری جلسه دعای صبحگاهی','جلسه دعای صبحگاهی کلیسا ۵ دقیقه دیگر آغاز می‌شود.','Morning prayer meeting reminder','The morning prayer meeting starts in 5 minutes.','Podsjetnik za jutarnju molitvu','Jutarnji molitveni sastanak počinje za 5 minuta.','04:55','europe_zagreb','meeting'),
('sunday_service','یادآوری جلسه کلیسای یکشنبه','جلسه کلیسای یکشنبه آماده است. برای ورود به جلسه کلیک کن.','Sunday church meeting reminder','The Sunday church meeting is ready. Tap to join.','Podsjetnik za nedjeljni sastanak','Nedjeljni crkveni sastanak je spreman. Dodirni za ulazak.','20:00','europe_zagreb','meeting')
on conflict (key) do update set send_time=excluded.send_time, timezone_mode=excluded.timezone_mode, enabled=excluded.enabled;
