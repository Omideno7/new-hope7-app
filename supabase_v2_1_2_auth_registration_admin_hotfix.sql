-- New Hope 7 v2.1.2 urgent authentication / registration / admin hotfix
-- Safe and idempotent. Run once in Supabase SQL Editor.
-- Does not delete registrations, users, courses, lessons, assignments, or exam results.

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
  select lower(trim(coalesce(
    nullif(current_setting('request.headers', true)::json ->> 'x-user-email', ''),
    auth.jwt() ->> 'email',
    ''
  )));
$$;

create or replace function public.nh7_is_admin()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select lower(trim(coalesce(auth.jwt()->>'email','')))='omideno7church@gmail.com';
$$;

create or replace function public.nh7_admin_is_admin()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select public.nh7_is_admin();
$$;

grant execute on function public.nh7_is_admin() to anon, authenticated;
grant execute on function public.nh7_admin_is_admin() to authenticated;

create index if not exists registrations_type_status_created_idx
  on public.registrations(type,status,created_at desc);
create index if not exists registrations_payload_email_idx
  on public.registrations(lower(trim(coalesce(payload->>'email',''))));

alter table public.registrations enable row level security;

create or replace function public.nh7_registration_insert_status_allowed(
  p_type text,
  p_email text,
  p_status text
)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select
    p_status='pending'
    or (
      p_status='approved'
      and exists (
        select 1
        from public.registrations old
        where old.type=p_type
          and old.status='approved'
          and lower(trim(coalesce(old.payload->>'email','')))=lower(trim(coalesce(p_email,'')))
      )
    );
$$;

grant execute on function public.nh7_registration_insert_status_allowed(text,text,text) to anon, authenticated;

drop policy if exists "NH7 v2.1.2 submit registrations" on public.registrations;
create policy "NH7 v2.1.2 submit registrations"
on public.registrations
for insert
to anon, authenticated
with check (
  device_id=public.nh7_device_id()
  and type in ('school','meeting','general')
  and lower(trim(coalesce(payload->>'email','')))<>''
  and public.nh7_registration_insert_status_allowed(type,payload->>'email',status)
);

drop policy if exists "NH7 v2.1.2 read own registrations" on public.registrations;
create policy "NH7 v2.1.2 read own registrations"
on public.registrations
for select
to anon, authenticated
using (
  public.nh7_is_admin()
  or device_id=public.nh7_device_id()
  or (
    public.nh7_request_email()<>''
    and lower(trim(coalesce(payload->>'email','')))=public.nh7_request_email()
  )
);

drop policy if exists "NH7 v2.1.2 admin update registrations" on public.registrations;
create policy "NH7 v2.1.2 admin update registrations"
on public.registrations
for update
to authenticated
using (public.nh7_is_admin())
with check (public.nh7_is_admin());

drop policy if exists "NH7 v2.1.2 admin delete registrations" on public.registrations;
create policy "NH7 v2.1.2 admin delete registrations"
on public.registrations
for delete
to authenticated
using (public.nh7_is_admin());

-- App access lookup. Replaces the older function without changing its signature,
-- so the already-installed Google Play build can use the repair immediately.
create or replace function public.nh7_registration_access_v2(
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
  registration_id uuid,
  payload jsonb
)
language plpgsql
security definer
set search_path=public
as $$
declare
  v_jwt_email text:=lower(trim(coalesce(auth.jwt()->>'email','')));
  v_email text:=lower(trim(coalesce(nullif(v_jwt_email,''),nullif(p_email,''),'')));
  v_device text:=coalesce(nullif(trim(p_device_id),''),public.nh7_device_id());
begin
  return query
  with matches as (
    select r.*
    from public.registrations r
    where r.type=p_type
      and (
        (v_email<>'' and lower(trim(coalesce(r.payload->>'email','')))=v_email)
        or (v_device<>'' and v_device<>'unknown' and r.device_id=v_device)
      )
    order by
      case r.status when 'approved' then 0 when 'pending' then 1 else 2 end,
      r.updated_at desc nulls last,
      r.created_at desc nulls last
    limit 1
  )
  select
    coalesce(m.status,'guest')::text,
    coalesce(m.status='approved',false),
    m.id is not null,
    lower(coalesce(m.payload->>'email',v_email,''))::text,
    p_type::text,
    m.id,
    coalesce(m.payload,'{}'::jsonb)
  from (select 1) x
  left join matches m on true;
end;
$$;

grant execute on function public.nh7_registration_access_v2(text,text,text) to anon, authenticated;

-- Reliable submit/update endpoint. Prevents silent loss when direct REST insert is blocked.
create or replace function public.nh7_submit_registration_v3(
  p_type text,
  p_email text,
  p_device_id text,
  p_language text default 'en',
  p_payload jsonb default '{}'::jsonb
)
returns table(registration_id uuid,status text,created boolean)
language plpgsql
security definer
set search_path=public
as $$
declare
  v_email text:=lower(trim(coalesce(p_email,p_payload->>'email','')));
  v_device text:=coalesce(nullif(trim(p_device_id),''),'unknown');
  v_id uuid;
  v_status text;
  v_created boolean:=false;
begin
  if p_type not in ('school','meeting','general') then raise exception 'Invalid registration type'; end if;
  if v_email='' or position('@' in v_email)<2 then raise exception 'Valid email is required'; end if;

  select r.id,r.status into v_id,v_status
  from public.registrations r
  where r.type=p_type
    and lower(trim(coalesce(r.payload->>'email','')))=v_email
  order by case r.status when 'approved' then 0 when 'pending' then 1 else 2 end,
           r.updated_at desc nulls last,r.created_at desc nulls last
  limit 1;

  if v_id is null then
    insert into public.registrations(device_id,type,status,language,payload,created_at,updated_at)
    values(v_device,p_type,'pending',coalesce(nullif(p_language,''),'en'),
           jsonb_set(coalesce(p_payload,'{}'::jsonb),'{email}',to_jsonb(v_email),true),now(),now())
    returning id,public.registrations.status into v_id,v_status;
    v_created:=true;
  else
    update public.registrations
    set device_id=case when v_device<>'unknown' then v_device else device_id end,
        language=coalesce(nullif(p_language,''),language),
        payload=jsonb_set(coalesce(p_payload,payload,'{}'::jsonb),'{email}',to_jsonb(v_email),true),
        status=case when status='approved' then 'approved' else 'pending' end,
        updated_at=now()
    where id=v_id
    returning public.registrations.status into v_status;
  end if;

  return query select v_id,v_status,v_created;
end;
$$;

grant execute on function public.nh7_submit_registration_v3(text,text,text,text,jsonb) to anon, authenticated;

-- Fast and RLS-independent feed for the authenticated admin panel.
create or replace function public.nh7_admin_registration_feed_v3(
  p_limit integer default 500,
  p_offset integer default 0
)
returns setof public.registrations
language plpgsql
security definer
set search_path=public
as $$
begin
  if not public.nh7_is_admin() then raise exception 'Admin access required'; end if;
  return query
  select r.* from public.registrations r
  order by r.created_at desc
  limit greatest(1,least(coalesce(p_limit,500),2000))
  offset greatest(coalesce(p_offset,0),0);
end;
$$;

grant execute on function public.nh7_admin_registration_feed_v3(integer,integer) to authenticated;

-- Synchronize existing approved duplicates without deleting any row.
with approved_keys as (
  select distinct type,lower(trim(coalesce(payload->>'email',''))) email_key
  from public.registrations
  where status='approved' and lower(trim(coalesce(payload->>'email','')))<>''
)
update public.registrations r
set status='approved',updated_at=now()
from approved_keys k
where r.type=k.type
  and lower(trim(coalesce(r.payload->>'email','')))=k.email_key
  and r.status is distinct from 'approved';
