-- New Hope 7 v3.5.5
-- Fail closed: a public email account must carry a complete School registration
-- packet before auth.users can be created. Legacy admin feed no longer synthesizes
-- needs_completion rows from Auth-only accounts.

create or replace function public.nh7_require_complete_school_signup_auth_v355()
returns trigger
language plpgsql
security definer
set search_path='public','pg_catalog'
as $$
declare
  v_packet jsonb;
  v_error text;
  v_provider text;
  v_email text;
begin
  v_provider := lower(trim(coalesce(new.raw_app_meta_data->>'provider','email')));
  if v_provider <> 'email' then
    raise exception using errcode='23514', message='NH7_COMPLETE_REGISTRATION_REQUIRED: use the complete New Hope 7 registration form';
  end if;

  v_email := lower(trim(coalesce(new.email,'')));
  v_packet := new.raw_user_meta_data->'school_registration';

  if v_email='' or jsonb_typeof(v_packet)<>'object'
     or nullif(trim(coalesce(new.raw_user_meta_data->>'nh7_registration_version','')),'') is null then
    raise exception using errcode='23514', message='NH7_COMPLETE_REGISTRATION_REQUIRED: complete every required field before creating an account';
  end if;

  v_error := public.nh7_school_registration_payload_error_v351(v_email,v_packet);
  if v_error is not null then
    raise exception using errcode='23514', message='NH7_COMPLETE_REGISTRATION_REQUIRED:'||v_error;
  end if;
  return new;
end;
$$;

revoke all on function public.nh7_require_complete_school_signup_auth_v355() from public, anon, authenticated;

drop trigger if exists nh7_auth_require_complete_school_signup_v355 on auth.users;
create trigger nh7_auth_require_complete_school_signup_v355
before insert on auth.users
for each row execute function public.nh7_require_complete_school_signup_auth_v355();

create or replace function public.nh7_admin_registration_feed_v3(
  p_limit integer default 500,
  p_offset integer default 0
)
returns setof public.registrations
language plpgsql
security definer
set search_path='public','pg_catalog'
as $$
begin
  if not public.nh7_is_admin() then
    raise exception 'Admin access required';
  end if;
  return query
  select r.*
  from public.registrations r
  order by r.created_at desc
  limit greatest(1,least(coalesce(p_limit,500),2000))
  offset greatest(coalesce(p_offset,0),0);
end;
$$;

create or replace function public.nh7_recover_auth_orphans_v352()
returns integer
language plpgsql
security definer
set search_path='public','auth','pg_catalog'
as $$
begin
  return 0;
end;
$$;