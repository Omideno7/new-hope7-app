-- OmideNo7 v1.6.4 - Meeting settings read fix
-- Purpose: Admin can edit meeting link/security code, and approved users can always read the latest values.
-- Users see ONLY meeting link + security code + note. Phone/access code stay hidden.

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
  provider = coalesce(public.meeting_settings.provider, excluded.provider),
  phone_number = '',
  access_code = '',
  meeting_url = coalesce(nullif(public.meeting_settings.meeting_url,''), excluded.meeting_url),
  security_code = coalesce(nullif(public.meeting_settings.security_code,''), excluded.security_code),
  extra_info = coalesce(nullif(public.meeting_settings.extra_info,''), excluded.extra_info),
  updated_at = now();

update public.meeting_settings
set phone_number = '', access_code = '', updated_at = now()
where id = 'active';

-- Admin policies for editing from admin panel.
drop policy if exists "meeting settings select approved or admin" on public.meeting_settings;
drop policy if exists "meeting settings admin select" on public.meeting_settings;
drop policy if exists "meeting settings admin insert" on public.meeting_settings;
drop policy if exists "meeting settings admin update" on public.meeting_settings;

create policy "meeting settings admin select" on public.meeting_settings
for select to authenticated
using (public.nh7_is_admin());

create policy "meeting settings admin insert" on public.meeting_settings
for insert to authenticated
with check (public.nh7_is_admin());

create policy "meeting settings admin update" on public.meeting_settings
for update to authenticated
using (public.nh7_is_admin())
with check (public.nh7_is_admin());

-- Approved-user read path. This bypasses normal RLS safely, but only returns the public-facing meeting fields
-- and only when the same email/device has an approved school or meeting registration.
create or replace function public.nh7_get_meeting_settings(
  p_email text default null,
  p_device_id text default null
)
returns table (
  id text,
  provider text,
  meeting_url text,
  security_code text,
  extra_info text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_email, public.nh7_request_email(), '')));
  v_device text := trim(coalesce(p_device_id, public.nh7_device_id(), ''));
  v_allowed boolean := false;
begin
  select exists (
    select 1
    from public.registrations r
    where r.type in ('school','meeting')
      and r.status = 'approved'
      and (
        (v_device <> '' and r.device_id = v_device)
        or (v_email <> '' and lower(coalesce(r.payload ->> 'email','')) = v_email)
      )
  ) into v_allowed;

  if not v_allowed and public.nh7_is_admin() then
    v_allowed := true;
  end if;

  if not v_allowed then
    return;
  end if;

  return query
  select
    m.id,
    m.provider,
    m.meeting_url,
    m.security_code,
    m.extra_info,
    m.updated_at
  from public.meeting_settings m
  where m.id = 'active'
  limit 1;
end;
$$;

grant execute on function public.nh7_get_meeting_settings(text, text) to anon, authenticated;
