-- New Hope 7 v3.5.0 — owner/delegated-admin RBAC.
-- Legacy nh7_is_admin* helpers intentionally stay owner-only. Delegates can use
-- only the narrowly scoped RPCs defined in this migration.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.nh7_admin_members_v350 (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  role text not null default 'delegate' check (role in ('owner','delegate')),
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists nh7_admin_members_v350_email_key
  on private.nh7_admin_members_v350 (lower(email));
create unique index if not exists nh7_admin_members_v350_single_owner
  on private.nh7_admin_members_v350 (role) where role = 'owner';
create index if not exists nh7_admin_members_v350_created_by_idx
  on private.nh7_admin_members_v350 (created_by);

create table if not exists private.nh7_admin_permission_catalog_v350 (
  permission_key text primary key,
  module_key text not null,
  action_key text not null,
  label_fa text not null,
  label_en text not null,
  label_hr text not null,
  is_assignable boolean not null default true,
  is_enabled boolean not null default true,
  sort_order integer not null default 100
);

create table if not exists private.nh7_admin_permission_grants_v350 (
  user_id uuid not null references private.nh7_admin_members_v350(user_id) on delete cascade,
  permission_key text not null references private.nh7_admin_permission_catalog_v350(permission_key) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, permission_key)
);
create index if not exists nh7_admin_permission_grants_v350_permission_idx
  on private.nh7_admin_permission_grants_v350 (permission_key);
create index if not exists nh7_admin_permission_grants_v350_granted_by_idx
  on private.nh7_admin_permission_grants_v350 (granted_by);

create table if not exists private.nh7_admin_audit_log_v350 (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_user_id uuid references auth.users(id) on delete set null,
  target_record_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists nh7_admin_audit_log_v350_actor_idx
  on private.nh7_admin_audit_log_v350 (actor_user_id);
create index if not exists nh7_admin_audit_log_v350_target_idx
  on private.nh7_admin_audit_log_v350 (target_user_id);

alter table private.nh7_admin_members_v350 enable row level security;
alter table private.nh7_admin_permission_catalog_v350 enable row level security;
alter table private.nh7_admin_permission_grants_v350 enable row level security;
alter table private.nh7_admin_audit_log_v350 enable row level security;

revoke all on table private.nh7_admin_members_v350 from public, anon, authenticated;
revoke all on table private.nh7_admin_permission_catalog_v350 from public, anon, authenticated;
revoke all on table private.nh7_admin_permission_grants_v350 from public, anon, authenticated;
revoke all on table private.nh7_admin_audit_log_v350 from public, anon, authenticated;
revoke all on sequence private.nh7_admin_audit_log_v350_id_seq from public, anon, authenticated;

insert into private.nh7_admin_permission_catalog_v350
  (permission_key,module_key,action_key,label_fa,label_en,label_hr,is_assignable,is_enabled,sort_order)
values
  ('registrations.view','registrations','view','مشاهده درخواست‌های ثبت‌نام','View registration requests','Pregled zahtjeva za registraciju',true,true,10),
  ('registrations.review','registrations','review','تأیید یا رد درخواست‌ها','Approve or reject requests','Odobravanje ili odbijanje zahtjeva',true,true,20),
  ('registrations.delete','registrations','delete','حذف پروندهٔ درخواست','Delete registration records','Brisanje zapisa zahtjeva',true,true,30),
  ('registrations.cleanup','registrations','cleanup','پاک‌سازی درخواست‌های تکراری','Clean duplicate requests','Čišćenje duplikata zahtjeva',true,true,40),
  ('admins.manage','admins','manage','مدیریت ادمین‌ها','Manage administrators','Upravljanje administratorima',false,true,1000)
on conflict (permission_key) do update set
  module_key=excluded.module_key,
  action_key=excluded.action_key,
  label_fa=excluded.label_fa,
  label_en=excluded.label_en,
  label_hr=excluded.label_hr,
  is_assignable=excluded.is_assignable,
  is_enabled=excluded.is_enabled,
  sort_order=excluded.sort_order;

insert into private.nh7_admin_members_v350
  (user_id,email,display_name,role,is_active,created_by)
select u.id, lower(u.email), 'New Hope 7 Owner', 'owner', true, u.id
from auth.users u
where lower(u.email) = lower(coalesce(
  nullif(current_setting('app.settings.nh7_admin_email',true),''),
  'omideno7church@gmail.com'
))
order by u.created_at
limit 1
on conflict (user_id) do update set
  email=excluded.email,
  role='owner',
  is_active=true,
  updated_at=now();

create or replace function private.nh7_admin_is_owner_v350()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1
    from auth.users u
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
      and (u.banned_until is null or u.banned_until <= now())
      and (
        exists (
          select 1
          from private.nh7_admin_members_v350 m
          where m.user_id = u.id
            and m.role = 'owner'
            and m.is_active
        )
        or (
          public.nh7_is_admin()
          and lower(trim(coalesce(u.email,''))) = lower(trim(coalesce(
            nullif(current_setting('app.settings.nh7_admin_email',true),''),
            'omideno7church@gmail.com'
          )))
        )
      )
  );
$$;

create or replace function private.nh7_admin_has_permission_v350(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and (
    private.nh7_admin_is_owner_v350()
    or exists (
      select 1
      from private.nh7_admin_members_v350 m
      join auth.users u on u.id = m.user_id
      join private.nh7_admin_permission_grants_v350 g on g.user_id = m.user_id
      join private.nh7_admin_permission_catalog_v350 c on c.permission_key = g.permission_key
      where m.user_id = auth.uid()
        and m.role = 'delegate'
        and m.is_active
        and u.email_confirmed_at is not null
        and (u.banned_until is null or u.banned_until <= now())
        and c.is_enabled
        and c.permission_key = p_permission
    )
  );
$$;

create or replace function private.nh7_admin_require_owner_v350()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.nh7_admin_is_owner_v350() then
    raise exception 'Owner access required' using errcode = '42501';
  end if;
end;
$$;

create or replace function private.nh7_admin_require_permission_v350(p_permission text)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.nh7_admin_has_permission_v350(p_permission) then
    raise exception 'Admin permission required: %', p_permission using errcode = '42501';
  end if;
end;
$$;

revoke all on function private.nh7_admin_is_owner_v350() from public, anon, authenticated;
revoke all on function private.nh7_admin_has_permission_v350(text) from public, anon, authenticated;
revoke all on function private.nh7_admin_require_owner_v350() from public, anon, authenticated;
revoke all on function private.nh7_admin_require_permission_v350(text) from public, anon, authenticated;

create or replace function public.nh7_admin_my_access_v350()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_owner boolean := private.nh7_admin_is_owner_v350();
  v_active boolean := false;
  v_email text := lower(coalesce(auth.jwt()->>'email',''));
  v_name text := '';
  v_permissions jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then
    return jsonb_build_object('is_admin',false,'is_owner',false,'permissions','[]'::jsonb);
  end if;

  select m.is_active, m.email, m.display_name
    into v_active, v_email, v_name
  from private.nh7_admin_members_v350 m
  where m.user_id = auth.uid();

  v_active := coalesce(v_active,false) or v_owner;
  if v_owner then
    select coalesce(jsonb_agg(c.permission_key order by c.sort_order),'[]'::jsonb)
      into v_permissions
    from private.nh7_admin_permission_catalog_v350 c
    where c.is_enabled;
  elsif v_active then
    select coalesce(jsonb_agg(g.permission_key order by c.sort_order),'[]'::jsonb)
      into v_permissions
    from private.nh7_admin_permission_grants_v350 g
    join private.nh7_admin_permission_catalog_v350 c on c.permission_key=g.permission_key
    where g.user_id=auth.uid() and c.is_enabled;
  end if;

  return jsonb_build_object(
    'is_admin', v_active and (v_owner or jsonb_array_length(v_permissions)>0),
    'is_owner', v_owner,
    'email', coalesce(v_email,''),
    'display_name', coalesce(v_name,''),
    'permissions', v_permissions
  );
end;
$$;

create or replace function public.nh7_admin_has_permission_v350(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.nh7_admin_has_permission_v350(p_permission);
$$;

create or replace function public.nh7_owner_permission_catalog_v350()
returns table(
  permission_key text,
  module_key text,
  action_key text,
  label_fa text,
  label_en text,
  label_hr text,
  sort_order integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.nh7_admin_require_owner_v350();
  return query
  select c.permission_key,c.module_key,c.action_key,c.label_fa,c.label_en,c.label_hr,c.sort_order
  from private.nh7_admin_permission_catalog_v350 c
  where c.is_assignable and c.is_enabled
  order by c.sort_order,c.permission_key;
end;
$$;

create or replace function public.nh7_owner_list_admins_v350()
returns table(
  user_id uuid,
  email text,
  display_name text,
  role text,
  is_active boolean,
  permissions text[],
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.nh7_admin_require_owner_v350();
  return query
  select m.user_id,m.email,m.display_name,m.role,m.is_active,
         coalesce(array_agg(g.permission_key order by c.sort_order)
           filter (where g.permission_key is not null),array[]::text[]),
         m.created_at,m.updated_at
  from private.nh7_admin_members_v350 m
  left join private.nh7_admin_permission_grants_v350 g on g.user_id=m.user_id
  left join private.nh7_admin_permission_catalog_v350 c on c.permission_key=g.permission_key
  group by m.user_id,m.email,m.display_name,m.role,m.is_active,m.created_at,m.updated_at
  order by case when m.role='owner' then 0 else 1 end,m.created_at,m.email;
end;
$$;

create or replace function public.nh7_owner_set_admin_permissions_v350(
  p_email text,
  p_display_name text default '',
  p_permissions text[] default array[]::text[],
  p_active boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_target auth.users%rowtype;
  v_permissions text[] := coalesce(p_permissions,array[]::text[]);
  v_invalid text[];
  v_active boolean := coalesce(p_active,true);
begin
  perform private.nh7_admin_require_owner_v350();

  if trim(coalesce(p_email,'')) = '' then
    raise exception 'Account email is required' using errcode = '22023';
  end if;

  select u.* into v_target
  from auth.users u
  where lower(u.email)=lower(trim(p_email))
  order by u.created_at
  limit 1;

  if v_target.id is null then
    raise exception 'No existing account was found for this email' using errcode = 'P0002';
  end if;
  if v_target.email_confirmed_at is null then
    raise exception 'The account email must be confirmed before admin access is granted' using errcode = '42501';
  end if;
  if v_target.banned_until is not null and v_target.banned_until > now() then
    raise exception 'A banned account cannot receive admin access' using errcode = '42501';
  end if;
  if public.nh7_is_admin() and lower(v_target.email)=lower(coalesce(auth.jwt()->>'email','')) then
    raise exception 'The owner account cannot be changed here' using errcode = '42501';
  end if;
  if exists (
    select 1 from private.nh7_admin_members_v350 m
    where m.user_id=v_target.id and m.role='owner'
  ) then
    raise exception 'The owner account cannot be changed here' using errcode = '42501';
  end if;

  -- Action permissions automatically include the read permission needed to render the section.
  if v_permissions && array['registrations.review','registrations.delete','registrations.cleanup']::text[]
     and not ('registrations.view'=any(v_permissions)) then
    v_permissions := array_append(v_permissions,'registrations.view');
  end if;
  select coalesce(array_agg(distinct x order by x),array[]::text[])
    into v_permissions
  from unnest(v_permissions) x;

  select array_agg(x order by x) into v_invalid
  from unnest(v_permissions) x
  where not exists (
    select 1 from private.nh7_admin_permission_catalog_v350 c
    where c.permission_key=x and c.is_assignable and c.is_enabled
  );
  if coalesce(cardinality(v_invalid),0)>0 then
    raise exception 'Unsupported permissions: %', array_to_string(v_invalid,', ') using errcode = '22023';
  end if;
  if v_active and cardinality(v_permissions)=0 then
    raise exception 'At least one permission is required for an active delegated admin' using errcode = '22023';
  end if;

  insert into private.nh7_admin_members_v350
    (user_id,email,display_name,role,is_active,created_by,updated_at)
  values
    (v_target.id,lower(v_target.email),left(trim(coalesce(p_display_name,'')),120),'delegate',v_active,v_actor,now())
  on conflict (user_id) do update set
    email=excluded.email,
    display_name=excluded.display_name,
    role='delegate',
    is_active=excluded.is_active,
    updated_at=now();

  delete from private.nh7_admin_permission_grants_v350 g where g.user_id=v_target.id;
  insert into private.nh7_admin_permission_grants_v350(user_id,permission_key,granted_by)
  select v_target.id,x,v_actor from unnest(v_permissions) x;

  insert into private.nh7_admin_audit_log_v350(actor_user_id,action,target_user_id,details)
  values(v_actor,'admin.permissions.set',v_target.id,
         jsonb_build_object('active',v_active,'permissions',to_jsonb(v_permissions)));

  return jsonb_build_object(
    'user_id',v_target.id,
    'email',lower(v_target.email),
    'display_name',left(trim(coalesce(p_display_name,'')),120),
    'is_active',v_active,
    'permissions',to_jsonb(v_permissions)
  );
end;
$$;

create or replace function public.nh7_owner_deactivate_admin_v350(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_changed boolean := false;
begin
  perform private.nh7_admin_require_owner_v350();
  update private.nh7_admin_members_v350
  set is_active=false,updated_at=now()
  where user_id=p_user_id and role='delegate' and is_active
  returning true into v_changed;
  if coalesce(v_changed,false) then
    insert into private.nh7_admin_audit_log_v350(actor_user_id,action,target_user_id)
    values(auth.uid(),'admin.deactivated',p_user_id);
  end if;
  return coalesce(v_changed,false);
end;
$$;

create or replace function public.nh7_admin_registration_feed_v350(
  p_limit integer default 500,
  p_offset integer default 0,
  p_status text default null,
  p_type text default null
)
returns table(
  id uuid,
  type text,
  status text,
  language text,
  payload jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.nh7_admin_require_permission_v350('registrations.view');
  return query
  select r.id,r.type,r.status,r.language,
         coalesce(r.payload,'{}'::jsonb) - array[
           'approvalEmailLastAttemptAt','approvalEmailLastError','approvalEmailProviderId',
           'approvalEmailSender','approvalEmailSentAt','device_id'
         ]::text[],
         r.created_at,r.updated_at
  from public.registrations r
  where (nullif(lower(trim(coalesce(p_status,''))),'') is null
         or lower(trim(p_status))='all'
         or lower(coalesce(r.status,''))=lower(trim(p_status)))
    and (nullif(lower(trim(coalesce(p_type,''))),'') is null
         or lower(coalesce(r.type,''))=lower(trim(p_type)))
  order by r.created_at desc
  limit greatest(1,least(coalesce(p_limit,500),2000))
  offset greatest(coalesce(p_offset,0),0);
end;
$$;

create or replace function public.nh7_admin_registration_review_v350(p_id uuid,p_status text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_status text;
  v_row public.registrations%rowtype;
  v_status text := lower(trim(coalesce(p_status,'')));
begin
  perform private.nh7_admin_require_permission_v350('registrations.review');
  if v_status not in ('pending','approved','rejected') then
    raise exception 'Unsupported registration status' using errcode = '22023';
  end if;
  select r.status into v_old_status from public.registrations r where r.id=p_id for update;
  if not found then raise exception 'Registration not found' using errcode = 'P0002'; end if;
  update public.registrations r
  set status=v_status,updated_at=now()
  where r.id=p_id
  returning r.* into v_row;
  insert into private.nh7_admin_audit_log_v350(actor_user_id,action,target_record_id,details)
  values(auth.uid(),'registration.status.changed',p_id::text,
         jsonb_build_object('old_status',v_old_status,'new_status',v_status,'type',v_row.type));
  -- The caller only needs success/failure. Never return the full row because it
  -- contains device identifiers and internal approval-email metadata.
  return true;
end;
$$;

create or replace function public.nh7_admin_registration_delete_v350(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type text;
  v_status text;
begin
  perform private.nh7_admin_require_permission_v350('registrations.delete');
  delete from public.registrations r
  where r.id=p_id
  returning r.type,r.status into v_type,v_status;
  if not found then return false; end if;
  insert into private.nh7_admin_audit_log_v350(actor_user_id,action,target_record_id,details)
  values(auth.uid(),'registration.deleted',p_id::text,
         jsonb_build_object('status',v_status,'type',v_type));
  return true;
end;
$$;

create or replace function public.nh7_admin_registration_cleanup_v350(
  p_email text default null,
  p_type text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer := 0;
begin
  perform private.nh7_admin_require_permission_v350('registrations.cleanup');
  with ranked as (
    select r.id,
           row_number() over (
             partition by lower(trim(coalesce(r.type,''))),
                          lower(coalesce(nullif(trim(r.payload->>'email'),''),nullif(trim(r.payload->>'user_email'),''),''))
             order by case when lower(coalesce(r.status,''))='approved' then 0 else 1 end,
                      coalesce(r.updated_at,r.created_at) desc nulls last,
                      r.created_at desc nulls last,r.id desc
           ) as rn
    from public.registrations r
    where lower(coalesce(nullif(trim(r.payload->>'email'),''),nullif(trim(r.payload->>'user_email'),''),''))<>''
      and (nullif(trim(coalesce(p_type,'')),'') is null or lower(trim(r.type))=lower(trim(p_type)))
      and (nullif(trim(coalesce(p_email,'')),'') is null
           or lower(coalesce(nullif(trim(r.payload->>'email'),''),nullif(trim(r.payload->>'user_email'),''),''))=lower(trim(p_email)))
  ), deleted as (
    delete from public.registrations r
    using ranked x
    where r.id=x.id and x.rn>1
    returning r.id
  )
  select count(*) into v_deleted from deleted;
  insert into private.nh7_admin_audit_log_v350(actor_user_id,action,details)
  values(auth.uid(),'registration.duplicates.cleaned',
         jsonb_build_object('deleted',v_deleted,'type',p_type,'email_filter_used',nullif(trim(coalesce(p_email,'')),'') is not null));
  return v_deleted;
end;
$$;

revoke all on function public.nh7_admin_my_access_v350() from public, anon, authenticated, service_role;
revoke all on function public.nh7_admin_has_permission_v350(text) from public, anon, authenticated, service_role;
revoke all on function public.nh7_owner_permission_catalog_v350() from public, anon, authenticated, service_role;
revoke all on function public.nh7_owner_list_admins_v350() from public, anon, authenticated, service_role;
revoke all on function public.nh7_owner_set_admin_permissions_v350(text,text,text[],boolean) from public, anon, authenticated, service_role;
revoke all on function public.nh7_owner_deactivate_admin_v350(uuid) from public, anon, authenticated, service_role;
revoke all on function public.nh7_admin_registration_feed_v350(integer,integer,text,text) from public, anon, authenticated, service_role;
revoke all on function public.nh7_admin_registration_review_v350(uuid,text) from public, anon, authenticated, service_role;
revoke all on function public.nh7_admin_registration_delete_v350(uuid) from public, anon, authenticated, service_role;
revoke all on function public.nh7_admin_registration_cleanup_v350(text,text) from public, anon, authenticated, service_role;

grant execute on function public.nh7_admin_my_access_v350() to authenticated;
grant execute on function public.nh7_admin_has_permission_v350(text) to authenticated;
grant execute on function public.nh7_owner_permission_catalog_v350() to authenticated;
grant execute on function public.nh7_owner_list_admins_v350() to authenticated;
grant execute on function public.nh7_owner_set_admin_permissions_v350(text,text,text[],boolean) to authenticated;
grant execute on function public.nh7_owner_deactivate_admin_v350(uuid) to authenticated;
grant execute on function public.nh7_admin_registration_feed_v350(integer,integer,text,text) to authenticated;
grant execute on function public.nh7_admin_registration_review_v350(uuid,text) to authenticated;
grant execute on function public.nh7_admin_registration_delete_v350(uuid) to authenticated;
grant execute on function public.nh7_admin_registration_cleanup_v350(text,text) to authenticated;
