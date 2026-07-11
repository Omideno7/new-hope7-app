-- New Hope 7 v1.7.0 Hotfix 5
-- Run once in Supabase SQL Editor.

alter table public.sermons
  add column if not exists duration_seconds integer;

alter table public.sermons
  alter column duration_minutes type numeric(10,2)
  using duration_minutes::numeric;

update public.sermons
set duration_seconds = round(duration_minutes * 60)::integer
where duration_seconds is null and duration_minutes is not null;

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
set search_path = public
as $$
declare
  v_jwt_email text := lower(trim(coalesce(auth.jwt()->>'email','')));
  v_email text := lower(trim(coalesce(nullif(v_jwt_email,''), p_email, '')));
  v_device text := coalesce(nullif(trim(p_device_id), ''), public.nh7_device_id());
begin
  return query
  with matches as (
    select r.*
    from public.registrations r
    where r.type = p_type
      and (
        (v_email <> '' and lower(trim(coalesce(r.payload ->> 'email', ''))) = v_email)
        or r.device_id = v_device
      )
    order by
      case when r.status = 'approved' then 0 else 1 end,
      r.updated_at desc,
      r.created_at desc
    limit 1
  )
  select
    coalesce(m.status, 'guest')::text,
    coalesce(m.status = 'approved', false),
    (m.id is not null),
    lower(coalesce(m.payload ->> 'email', v_email))::text,
    p_type::text,
    m.id,
    coalesce(m.payload, '{}'::jsonb)
  from (select 1) x
  left join matches m on true;
end;
$$;

grant execute on function public.nh7_registration_access_v2(text,text,text) to anon, authenticated;
