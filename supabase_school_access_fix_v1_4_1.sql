-- OmideNo7 v1.4.1 School Access Fix
-- Run in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Purpose: make approved school/meeting access readable by the app even if the user's device cache/device_id changed.

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

-- Keep duplicates synchronized: if one request for the same email/type is approved, all duplicates become approved.
create or replace function public.nh7_registrations_keep_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  v_email := lower(trim(coalesce(new.payload ->> 'email', '')));

  if v_email <> '' then
    if exists (
      select 1
      from public.registrations r
      where r.type = new.type
        and lower(trim(coalesce(r.payload ->> 'email', ''))) = v_email
        and r.status = 'approved'
    ) then
      new.status := 'approved';
      new.updated_at := now();
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_nh7_registrations_keep_approved on public.registrations;
create trigger trg_nh7_registrations_keep_approved
before insert on public.registrations
for each row
execute function public.nh7_registrations_keep_approved();

create or replace function public.nh7_registrations_sync_duplicate_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  v_email := lower(trim(coalesce(new.payload ->> 'email', '')));

  if v_email <> '' and new.status = 'approved' then
    update public.registrations r
    set status = 'approved',
        updated_at = now()
    where r.id <> new.id
      and r.type = new.type
      and lower(trim(coalesce(r.payload ->> 'email', ''))) = v_email
      and r.status is distinct from 'approved';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_nh7_registrations_sync_duplicate_status on public.registrations;
create trigger trg_nh7_registrations_sync_duplicate_status
after update of status on public.registrations
for each row
when (old.status is distinct from new.status)
execute function public.nh7_registrations_sync_duplicate_status();

-- RPC used by the app. SECURITY DEFINER bypasses RLS safely and returns only status for the matching email/device/type.
create or replace function public.nh7_registration_status(
  p_type text,
  p_email text default '',
  p_device_id text default ''
)
returns table(
  status text,
  approved boolean,
  found boolean,
  email text,
  type text,
  registration_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_device text := coalesce(nullif(trim(p_device_id), ''), public.nh7_device_id());
begin
  return query
  with matches as (
    select r.*
    from public.registrations r
    where r.type = p_type
      and (
        r.device_id = v_device
        or (v_email <> '' and lower(trim(coalesce(r.payload ->> 'email', ''))) = v_email)
      )
    order by
      case when r.status = 'approved' then 0 else 1 end,
      r.updated_at desc,
      r.created_at desc
    limit 1
  )
  select
    coalesce(m.status, 'guest')::text as status,
    coalesce(m.status = 'approved', false) as approved,
    (m.id is not null) as found,
    lower(coalesce(m.payload ->> 'email', v_email))::text as email,
    p_type::text as type,
    m.id as registration_id
  from (select 1) x
  left join matches m on true;
end;
$$;

grant execute on function public.nh7_registration_status(text, text, text) to anon, authenticated;

-- Fix current data: if any duplicate for same email/type is approved, approve all duplicates.
update public.registrations r
set status = 'approved',
    updated_at = now()
where lower(trim(coalesce(r.payload ->> 'email', ''))) <> ''
  and exists (
    select 1
    from public.registrations a
    where a.type = r.type
      and lower(trim(coalesce(a.payload ->> 'email', ''))) = lower(trim(coalesce(r.payload ->> 'email', '')))
      and a.status = 'approved'
  );

-- Optional: keep all school registrations approved during the current closed test.
-- If you want this, remove the -- from the next 4 lines and Run again.
-- update public.registrations
-- set status = 'approved', updated_at = now()
-- where type = 'school'
--   and status is distinct from 'approved';
