-- New Hope 7 v3.4.8 auth/registration integrity hotfix.
-- Keep the public RPC signature used by existing web/Play clients, but remove
-- the legacy direct-INSERT merge path that could mutate an approved record.

drop trigger if exists trg_nh7_registration_merge_insert_v331 on public.registrations;
drop function if exists public.nh7_registration_merge_insert_v331();

revoke insert on table public.registrations from public, anon, authenticated;

revoke execute on function public.nh7_submit_registration_v3(text,text,text,text,jsonb) from public;
grant execute on function public.nh7_submit_registration_v3(text,text,text,text,jsonb) to anon, authenticated, service_role;

create or replace function public.nh7_guard_approved_registration_update_v348()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_old_email text := lower(trim(coalesce(old.payload->>'email',old.payload->>'user_email','')));
  v_jwt_email text := lower(trim(coalesce(auth.jwt()->>'email','')));
begin
  if lower(coalesce(old.status,'')) = 'approved'
     and not public.nh7_is_admin()
     and (
       auth.role() <> 'authenticated'
       or v_jwt_email = ''
       or v_jwt_email <> v_old_email
     ) then
    raise exception 'Approved registration requires the matching authenticated account';
  end if;
  return new;
end;
$$;

revoke all on function public.nh7_guard_approved_registration_update_v348() from public, anon, authenticated;

drop trigger if exists trg_nh7_guard_approved_registration_update_v348 on public.registrations;
create trigger trg_nh7_guard_approved_registration_update_v348
before update on public.registrations
for each row execute function public.nh7_guard_approved_registration_update_v348();
