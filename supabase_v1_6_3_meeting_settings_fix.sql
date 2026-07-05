-- OmideNo7 v1.6.3 - Church Meeting Settings Fix
-- Shows only meeting link + security code to approved users.
-- School approval is enough for meeting access.

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
    select 1
    from public.registrations r
    where (r.device_id = public.nh7_device_id() or lower(coalesce(r.payload ->> 'email','')) = public.nh7_request_email())
      and r.type in ('school','meeting')
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
values (
  'active',
  'FreeConferenceCall',
  'https://fccdl.in/i/omideno7church',
  '',
  '',
  '789987',
  'جلسه دعا هر روز ساعت ۵ صبح به وقت کرواسی برگزار می‌شود. برای ورود، روی لینک جلسه بزنید و فقط کد امنیتی را وارد کنید.'
)
on conflict (id) do update set
  provider = excluded.provider,
  phone_number = '',
  access_code = '',
  meeting_url = coalesce(nullif(public.meeting_settings.meeting_url,''), excluded.meeting_url),
  security_code = coalesce(nullif(public.meeting_settings.security_code,''), excluded.security_code),
  extra_info = coalesce(nullif(public.meeting_settings.extra_info,''), excluded.extra_info),
  updated_at = now();

-- Clean old phone/access values for user-facing display.
update public.meeting_settings
set phone_number = '',
    access_code = '',
    updated_at = now()
where id = 'active';
