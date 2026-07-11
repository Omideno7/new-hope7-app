-- New Hope 7 / OmideNo7 v1.7.0 Dynamic Platform
-- Run once in Supabase SQL Editor before publishing v1.7.0.
-- Idempotent: safe to run again.

create extension if not exists pgcrypto;

create or replace function public.nh7_admin_is_admin_v170()
returns boolean
language sql stable security definer set search_path=public
as $$
  select lower(coalesce(auth.jwt()->>'email','')) = 'omideno7church@gmail.com';
$$;
grant execute on function public.nh7_admin_is_admin_v170() to authenticated;

-- Per-user Inbox read/delete receipts. A global message is not physically deleted for everyone;
-- this table remembers that one user/device deleted it.
create table if not exists public.notification_inbox_receipts (
  user_key text not null,
  message_id text not null,
  device_id text,
  user_email text,
  read_at timestamptz,
  deleted_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(user_key,message_id)
);
alter table public.notification_inbox_receipts enable row level security;

create or replace function public.nh7_request_user_key()
returns text language sql stable as $$
  select lower(
    case
      when coalesce((current_setting('request.headers',true)::json->>'x-user-email'),'') <> ''
        then 'email:'||(current_setting('request.headers',true)::json->>'x-user-email')
      else 'device:'||coalesce((current_setting('request.headers',true)::json->>'x-device-id'),'unknown')
    end
  );
$$;

drop policy if exists "receipt own select" on public.notification_inbox_receipts;
create policy "receipt own select" on public.notification_inbox_receipts for select
using (user_key=public.nh7_request_user_key() or public.nh7_admin_is_admin_v170());
drop policy if exists "receipt own insert" on public.notification_inbox_receipts;
create policy "receipt own insert" on public.notification_inbox_receipts for insert
with check (user_key=public.nh7_request_user_key() or public.nh7_admin_is_admin_v170());
drop policy if exists "receipt own update" on public.notification_inbox_receipts;
create policy "receipt own update" on public.notification_inbox_receipts for update
using (user_key=public.nh7_request_user_key() or public.nh7_admin_is_admin_v170())
with check (user_key=public.nh7_request_user_key() or public.nh7_admin_is_admin_v170());
grant select,insert,update on public.notification_inbox_receipts to anon,authenticated;

-- Dynamic sermon categories
create table if not exists public.sermon_categories (
  id uuid primary key default gen_random_uuid(),
  name_fa text not null,
  name_en text,
  name_hr text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sermons (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.sermon_categories(id) on delete set null,
  title_fa text not null,
  title_en text,
  title_hr text,
  description_fa text,
  description_en text,
  description_hr text,
  audio_url text,
  youtube_url text,
  cover_url text,
  duration_minutes integer,
  published_at timestamptz default now(),
  sort_order integer not null default 100,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sermon_categories enable row level security;
alter table public.sermons enable row level security;

drop policy if exists "public read active sermon categories" on public.sermon_categories;
create policy "public read active sermon categories" on public.sermon_categories for select using (is_active or public.nh7_admin_is_admin_v170());
drop policy if exists "admin manage sermon categories" on public.sermon_categories;
create policy "admin manage sermon categories" on public.sermon_categories for all to authenticated
using (public.nh7_admin_is_admin_v170()) with check (public.nh7_admin_is_admin_v170());

drop policy if exists "public read published sermons" on public.sermons;
create policy "public read published sermons" on public.sermons for select using (is_published or public.nh7_admin_is_admin_v170());
drop policy if exists "admin manage sermons" on public.sermons;
create policy "admin manage sermons" on public.sermons for all to authenticated
using (public.nh7_admin_is_admin_v170()) with check (public.nh7_admin_is_admin_v170());

grant select on public.sermon_categories,public.sermons to anon,authenticated;
grant insert,update,delete on public.sermon_categories,public.sermons to authenticated;

-- Dynamic notification schedules and trilingual content.
create table if not exists public.notification_schedules (
  key text primary key,
  time_value time not null,
  timezone_mode text not null default 'local',
  days_of_week integer[] not null default array[0,1,2,3,4,5,6],
  title_fa text not null,
  body_fa text not null,
  title_en text not null,
  body_en text not null,
  title_hr text not null,
  body_hr text not null,
  target_route text default 'home',
  is_active boolean not null default true,
  sort_order integer not null default 100,
  updated_at timestamptz not null default now()
);
alter table public.notification_schedules enable row level security;
drop policy if exists "public read notification schedules" on public.notification_schedules;
create policy "public read notification schedules" on public.notification_schedules for select using (true);
drop policy if exists "admin manage notification schedules" on public.notification_schedules;
create policy "admin manage notification schedules" on public.notification_schedules for all to authenticated
using (public.nh7_admin_is_admin_v170()) with check (public.nh7_admin_is_admin_v170());
grant select on public.notification_schedules to anon,authenticated;
grant insert,update,delete on public.notification_schedules to authenticated;

insert into public.notification_schedules(key,time_value,timezone_mode,days_of_week,title_fa,body_fa,title_en,body_en,title_hr,body_hr,target_route,sort_order)
values
('daily_word','07:00','local',array[0,1,2,3,4,5,6],'کلام روزانه آماده است','امروز کلام خدا را دریافت کن و روزت را با ایمان شروع کن.','Daily Word is ready','Receive God’s Word today and start your day in faith.','Dnevna Riječ je spremna','Primi Božju Riječ danas i započni dan u vjeri.','daily',10),
('faith','12:00','local',array[0,1,2,3,4,5,6],'اعلان ایمان آماده است','وقت اعلان ایمان است؛ کلام را با دهانت اعلام کن.','Faith proclamation is ready','It is time for your faith proclamation; speak the Word.','Proglas vjere je spreman','Vrijeme je za proglas vjere; izgovori Riječ.','daily',20),
('daily_juice','17:00','local',array[0,1,2,3,4,5,6],'آب حیات روزانه آماده است','چند دقیقه برای تقویت روح خود وقت بگذار.','Daily Juice is ready','Take a few minutes to strengthen your spirit.','Dnevni sok je spreman','Odvoji nekoliko minuta za svoj duh.','daily',30),
('gratitude','21:00','local',array[0,1,2,3,4,5,6],'یادآوری شکرگزاری','امروز را با شکرگزاری به پایان برسان.','Gratitude reminder','End today with thanksgiving.','Podsjetnik zahvalnosti','Završi dan zahvalnošću.','daily',40),
('morning_meeting','04:55','Europe/Zagreb',array[0,1,2,3,4,5,6],'یادآوری دعای صبحگاهی','جلسه دعای صبحگاهی پنج دقیقه دیگر آغاز می‌شود.','Morning prayer reminder','The morning prayer meeting starts in five minutes.','Podsjetnik jutarnje molitve','Jutarnji molitveni sastanak počinje za pet minuta.','meetings',50),
('sunday_service','19:55','Europe/Zagreb',array[0],'یادآوری جلسه یکشنبه','جلسه کلیسای یکشنبه پنج دقیقه دیگر آغاز می‌شود.','Sunday service reminder','Sunday church service starts in five minutes.','Podsjetnik nedjeljne službe','Nedjeljna crkvena služba počinje za pet minuta.','meetings',60)
on conflict(key) do nothing;

-- Ensure the existing audio bucket can hold sermons and covers.
insert into storage.buckets(id,name,public)
values('church-audio','church-audio',true)
on conflict(id) do update set public=true;

drop policy if exists "public read church audio" on storage.objects;
create policy "public read church audio" on storage.objects for select using (bucket_id='church-audio');
drop policy if exists "admin upload church audio" on storage.objects;
create policy "admin upload church audio" on storage.objects for insert to authenticated
with check (bucket_id='church-audio' and public.nh7_admin_is_admin_v170());
drop policy if exists "admin update church audio" on storage.objects;
create policy "admin update church audio" on storage.objects for update to authenticated
using (bucket_id='church-audio' and public.nh7_admin_is_admin_v170())
with check (bucket_id='church-audio' and public.nh7_admin_is_admin_v170());
drop policy if exists "admin delete church audio" on storage.objects;
create policy "admin delete church audio" on storage.objects for delete to authenticated
using (bucket_id='church-audio' and public.nh7_admin_is_admin_v170());

-- Helpful starter category.
insert into public.sermon_categories(name_fa,name_en,name_hr,sort_order)
select 'تعالیم و موعظه‌ها','Teachings and Sermons','Pouke i propovijedi',10
where not exists(select 1 from public.sermon_categories);
