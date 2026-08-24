-- New Hope 7 v3.5.6: make complete School signup atomic.
-- A validated Auth signup and its pending School registration now succeed or fail together.
-- This prevents an Auth-only orphan from ever being created by a network/RPC failure.

create or replace function public.nh7_create_school_registration_from_auth_v356()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'pg_catalog'
as $$
declare
  v_packet jsonb;
  v_email text;
  v_device text;
  v_language text;
  v_payload jsonb;
begin
  v_email := lower(trim(coalesce(new.email,'')));
  v_packet := new.raw_user_meta_data->'school_registration';

  -- The BEFORE INSERT v355 trigger has already validated this packet. Keep an
  -- explicit guard here so this function is safe even if trigger order changes.
  if v_email='' or jsonb_typeof(v_packet)<>'object' then
    raise exception using
      errcode='23514',
      message='NH7_COMPLETE_REGISTRATION_REQUIRED: atomic school registration packet is missing';
  end if;

  if public.nh7_school_registration_payload_error_v351(v_email,v_packet) is not null then
    raise exception using
      errcode='23514',
      message='NH7_COMPLETE_REGISTRATION_REQUIRED: atomic school registration packet is invalid';
  end if;

  v_device := coalesce(
    nullif(trim(coalesce(v_packet->>'device_id','')),''),
    'auth_' || new.id::text
  );
  v_language := coalesce(nullif(trim(coalesce(new.raw_user_meta_data->>'language','')),''),'en');

  v_payload := coalesce(v_packet,'{}'::jsonb) || jsonb_build_object(
    'email', v_email,
    'device_id', v_device,
    'kind', 'school',
    'status', 'pending',
    'submittedAt', coalesce(nullif(v_packet->>'submittedAt',''), now()::text)
  );

  -- Idempotent by School/email: if a legitimate complete row already exists,
  -- do not create a duplicate. Otherwise create the pending row inside the same
  -- transaction as auth.users. The registrations validation trigger and admin
  -- notification trigger both run normally.
  if not exists (
    select 1
    from public.registrations r
    where lower(trim(coalesce(r.type,'')))='school'
      and lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))=v_email
  ) then
    insert into public.registrations(device_id,type,status,language,payload,created_at,updated_at)
    values(v_device,'school','pending',v_language,v_payload,now(),now());
  end if;

  return new;
end;
$$;

revoke all on function public.nh7_create_school_registration_from_auth_v356() from public, anon, authenticated;

drop trigger if exists nh7_auth_create_school_registration_v356 on auth.users;
create trigger nh7_auth_create_school_registration_v356
after insert on auth.users
for each row execute function public.nh7_create_school_registration_from_auth_v356();
