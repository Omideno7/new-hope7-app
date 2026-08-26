-- New Hope 7 v3.9.5 — RBAC-aware Admin list functions.
create or replace function public.nh7_admin_has_permission_v395(p_permission text)
returns boolean language plpgsql stable security definer set search_path=public,private,pg_catalog as $$
begin
  if auth.role()<>'authenticated' or auth.uid() is null then return false; end if;
  if coalesce(public.nh7_is_admin(),false) then return true; end if;
  return exists(
    select 1 from private.nh7_admin_members_v350 m
    where m.user_id=auth.uid() and m.is_active
      and (m.role='owner' or exists(select 1 from private.nh7_admin_permission_grants_v350 g where g.user_id=m.user_id and g.permission_key=trim(coalesce(p_permission,''))))
  );
end;$$;
revoke all on function public.nh7_admin_has_permission_v395(text) from public,anon;
grant execute on function public.nh7_admin_has_permission_v395(text) to authenticated;

create or replace function public.nh7_admin_content_access_dashboard_v395()
returns jsonb language plpgsql stable security definer set search_path=public,private,pg_catalog as $$
declare v_users jsonb; v_items jsonb; v_grants jsonb;
begin
  if not public.nh7_admin_has_permission_v395('registrations.view') then raise exception 'Admin access required'; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.display_name,x.email),'[]'::jsonb) into v_users
  from (
    select u.id user_id,lower(u.email) email,coalesce(nullif(trim(concat_ws(' ',r.payload->>'firstName',r.payload->>'lastName')),''),lower(u.email)) display_name,r.id registration_id,lower(coalesce(r.status,'')) registration_status
    from auth.users u join lateral (
      select rr.id,rr.status,rr.payload from public.registrations rr
      where lower(trim(coalesce(rr.type,'')))='school' and lower(trim(coalesce(rr.status,''))) in ('approved','active')
        and lower(trim(coalesce(rr.payload->>'email',rr.payload->>'user_email','')))=lower(trim(coalesce(u.email,'')))
        and public.nh7_school_registration_payload_error_v351(lower(trim(coalesce(u.email,''))),rr.payload) is null
      order by rr.updated_at desc,rr.created_at desc limit 1
    ) r on true
    where u.deleted_at is null and coalesce(u.email,'')<>'' limit 2000
  ) x;
  select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'collection_id',i.collection_id,'title_fa',i.title_fa,'title_en',i.title_en,'title_hr',i.title_hr,'file_name',i.file_name,'reader_available',(i.reader_status='ready' and i.reader_mode in ('text','both'))) order by i.sort_order,i.created_at desc),'[]'::jsonb) into v_items
  from public.nh7_library_items i where i.is_active and i.audience='ministers' and i.resource_type='library';
  select coalesce(jsonb_agg(to_jsonb(g) order by g.created_at desc),'[]'::jsonb) into v_grants from public.nh7_account_content_grants_v251 g where g.revoked_at is null and (g.expires_at is null or g.expires_at>now());
  return jsonb_build_object('users',v_users,'items',v_items,'grants',v_grants,'version','3.9.5');
end;$$;
revoke all on function public.nh7_admin_content_access_dashboard_v395() from public,anon;
grant execute on function public.nh7_admin_content_access_dashboard_v395() to authenticated;

create or replace function public.nh7_admin_account_directory_v395(p_search text default '',p_test_only boolean default false)
returns jsonb language plpgsql stable security definer set search_path=public,private,pg_catalog as $$
declare v_q text:=lower(trim(coalesce(p_search,''))); v_accounts jsonb; v_orphans jsonb;
begin
  if not public.nh7_admin_has_permission_v395('registrations.view') then raise exception 'Admin access required'; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into v_accounts
  from (
    select u.id user_id,lower(coalesce(u.email,'')) email,u.created_at,u.last_sign_in_at,u.email_confirmed_at,
      coalesce(nullif(trim(concat_ws(' ',r.payload->>'firstName',r.payload->>'lastName')),''),nullif(trim(coalesce(u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name')),''),lower(coalesce(u.email,''))) display_name,
      r.id registration_id,lower(coalesce(r.status,'')) registration_status,
      (r.id is not null and public.nh7_school_registration_payload_error_v351(lower(coalesce(u.email,'')),r.payload) is null) registration_complete,
      (r.id is not null and lower(coalesce(r.status,'')) in ('approved','active') and public.nh7_school_registration_payload_error_v351(lower(coalesce(u.email,'')),r.payload) is null) registration_approved_complete,
      (lower(coalesce(u.email,'')) ~ '(^|[+._-])(test|qa|demo|dummy|sample)([+._@-]|$)' or coalesce((u.raw_user_meta_data->>'is_test')::boolean,false) or coalesce((r.payload->>'is_test')::boolean,false)) is_test
    from auth.users u left join lateral (
      select rr.id,rr.status,rr.payload from public.registrations rr
      where lower(trim(coalesce(rr.type,'')))='school' and lower(trim(coalesce(rr.payload->>'email',rr.payload->>'user_email','')))=lower(coalesce(u.email,''))
      order by case when lower(coalesce(rr.status,'')) in ('approved','active') then 0 else 1 end,rr.updated_at desc,rr.created_at desc limit 1
    ) r on true where u.deleted_at is null and coalesce(u.email,'')<>''
  ) x
  where (v_q='' or lower(x.email||' '||x.display_name||' '||x.user_id::text) like '%'||v_q||'%') and (not p_test_only or x.is_test);
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into v_orphans
  from (
    select r.id registration_id,lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email',''))) email,lower(coalesce(r.status,'')) registration_status,r.created_at,
      coalesce(nullif(trim(concat_ws(' ',r.payload->>'firstName',r.payload->>'lastName')),''),lower(trim(coalesce(r.payload->>'email','')))) display_name,
      (public.nh7_school_registration_payload_error_v351(lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email',''))),r.payload) is null) registration_complete,
      (lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email',''))) ~ '(^|[+._-])(test|qa|demo|dummy|sample)([+._@-]|$)' or coalesce((r.payload->>'is_test')::boolean,false)) is_test
    from public.registrations r where lower(trim(coalesce(r.type,'')))='school' and not exists(select 1 from auth.users u where lower(coalesce(u.email,''))=lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email',''))))
  ) x where (v_q='' or lower(x.email||' '||x.display_name) like '%'||v_q||'%') and (not p_test_only or x.is_test);
  return jsonb_build_object('accounts',v_accounts,'registration_orphans',v_orphans,'version','3.9.5');
end;$$;
revoke all on function public.nh7_admin_account_directory_v395(text,boolean) from public,anon;
grant execute on function public.nh7_admin_account_directory_v395(text,boolean) to authenticated;
