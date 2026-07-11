-- OmideNo7 Admin v1.6.4-admin4
-- Purpose: fix registration cleanup in the Admin Panel.
-- Run once in Supabase -> SQL Editor -> New query -> Run.
-- It does NOT change the public Google Play app. It only gives the logged-in admin safe tools to:
-- 1) delete one registration request,
-- 2) sync duplicate approved statuses,
-- 3) remove duplicate registrations with the same email/type while keeping the best row.

create extension if not exists pgcrypto;

create or replace function public.nh7_admin_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) in ('omideno7church@gmail.com');
$$;

grant execute on function public.nh7_admin_is_admin() to authenticated;

create or replace function public.nh7_admin_delete_registration(p_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer := 0;
begin
  if not public.nh7_admin_is_admin() then
    raise exception 'Only OmideNo7 admin can delete registration requests';
  end if;

  delete from public.registrations
  where id = p_id;

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

grant execute on function public.nh7_admin_delete_registration(uuid) to authenticated;

create or replace function public.nh7_admin_sync_duplicate_registration_statuses()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer := 0;
begin
  if not public.nh7_admin_is_admin() then
    raise exception 'Only OmideNo7 admin can sync registration statuses';
  end if;

  with approved_keys as (
    select distinct
      r.type,
      lower(trim(coalesce(r.payload ->> 'email', ''))) as email_key
    from public.registrations r
    where r.status = 'approved'
      and lower(trim(coalesce(r.payload ->> 'email', ''))) <> ''
  )
  update public.registrations r
  set status = 'approved',
      updated_at = now()
  from approved_keys k
  where r.type = k.type
    and lower(trim(coalesce(r.payload ->> 'email', ''))) = k.email_key
    and r.status is distinct from 'approved';

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

grant execute on function public.nh7_admin_sync_duplicate_registration_statuses() to authenticated;

create or replace function public.nh7_admin_cleanup_registration_duplicates(
  p_email text default null,
  p_type text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer := 0;
begin
  if not public.nh7_admin_is_admin() then
    raise exception 'Only OmideNo7 admin can clean duplicate registrations';
  end if;

  -- First make sure pending duplicates become approved if one duplicate is already approved.
  perform public.nh7_admin_sync_duplicate_registration_statuses();

  with ranked as (
    select
      r.id,
      row_number() over (
        partition by r.type, lower(trim(coalesce(r.payload ->> 'email', '')))
        order by
          case when r.status = 'approved' then 0 when r.status = 'pending' then 1 else 2 end,
          r.updated_at desc nulls last,
          r.created_at desc nulls last,
          r.id desc
      ) as rn,
      lower(trim(coalesce(r.payload ->> 'email', ''))) as email_key
    from public.registrations r
    where lower(trim(coalesce(r.payload ->> 'email', ''))) <> ''
      and (p_email is null or lower(trim(coalesce(r.payload ->> 'email', ''))) = lower(trim(p_email)))
      and (p_type is null or r.type = p_type)
  ), deleted as (
    delete from public.registrations r
    using ranked x
    where r.id = x.id
      and x.rn > 1
    returning r.id
  )
  select count(*) into v_deleted from deleted;

  return v_deleted;
end;
$$;

grant execute on function public.nh7_admin_cleanup_registration_duplicates(text, text) to authenticated;

-- Optional RLS policies for admin REST delete/update if your table has RLS enabled.
-- These are intentionally narrow and only allow the OmideNo7 admin email.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='registrations') then
    begin
      create policy "Admin can delete registrations"
      on public.registrations
      for delete
      to authenticated
      using (public.nh7_admin_is_admin());
    exception when duplicate_object then null;
    end;

    begin
      create policy "Admin can update registrations"
      on public.registrations
      for update
      to authenticated
      using (public.nh7_admin_is_admin())
      with check (public.nh7_admin_is_admin());
    exception when duplicate_object then null;
    end;
  end if;
end $$;
