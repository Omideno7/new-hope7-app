-- New Hope 7 v5.0.2 — Community modules candidate migration.
-- PREVIEW CANDIDATE ONLY. Do not apply to Production without explicit approval.

create extension if not exists pgcrypto;

-- =========================================================
-- User profile
-- =========================================================
create table if not exists public.nh7_user_profiles_v502 (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  photo_path text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.nh7_user_profiles_v502 enable row level security;

drop policy if exists nh7_profile_read_own_v502 on public.nh7_user_profiles_v502;
create policy nh7_profile_read_own_v502 on public.nh7_user_profiles_v502
for select to authenticated using (user_id=auth.uid());

drop policy if exists nh7_profile_insert_own_v502 on public.nh7_user_profiles_v502;
create policy nh7_profile_insert_own_v502 on public.nh7_user_profiles_v502
for insert to authenticated with check (user_id=auth.uid());

drop policy if exists nh7_profile_update_own_v502 on public.nh7_user_profiles_v502;
create policy nh7_profile_update_own_v502 on public.nh7_user_profiles_v502
for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

-- Private profile photo bucket. First folder segment must equal auth.uid().
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
  'nh7-profile-photos-v502',
  'nh7-profile-photos-v502',
  false,
  5242880,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
on conflict (id) do update set
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists nh7_profile_photo_read_own_v502 on storage.objects;
create policy nh7_profile_photo_read_own_v502 on storage.objects
for select to authenticated
using (
  bucket_id='nh7-profile-photos-v502'
  and (storage.foldername(name))[1]=auth.uid()::text
);

drop policy if exists nh7_profile_photo_insert_own_v502 on storage.objects;
create policy nh7_profile_photo_insert_own_v502 on storage.objects
for insert to authenticated
with check (
  bucket_id='nh7-profile-photos-v502'
  and (storage.foldername(name))[1]=auth.uid()::text
);

drop policy if exists nh7_profile_photo_update_own_v502 on storage.objects;
create policy nh7_profile_photo_update_own_v502 on storage.objects
for update to authenticated
using (
  bucket_id='nh7-profile-photos-v502'
  and (storage.foldername(name))[1]=auth.uid()::text
)
with check (
  bucket_id='nh7-profile-photos-v502'
  and (storage.foldername(name))[1]=auth.uid()::text
);

drop policy if exists nh7_profile_photo_delete_own_v502 on storage.objects;
create policy nh7_profile_photo_delete_own_v502 on storage.objects
for delete to authenticated
using (
  bucket_id='nh7-profile-photos-v502'
  and (storage.foldername(name))[1]=auth.uid()::text
);

-- =========================================================
-- Testimonies: moderated before public display.
-- =========================================================
create table if not exists public.nh7_testimonies_v502 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default '',
  testimony_text text not null check (char_length(testimony_text) between 10 and 6000),
  language text not null default 'en' check (language in ('fa','en','hr')),
  show_name boolean not null default true,
  consent_public boolean not null default false,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
create index if not exists nh7_testimonies_v502_status_created_idx
on public.nh7_testimonies_v502(status,created_at desc);
alter table public.nh7_testimonies_v502 enable row level security;

drop policy if exists nh7_testimony_public_approved_v502 on public.nh7_testimonies_v502;
create policy nh7_testimony_public_approved_v502 on public.nh7_testimonies_v502
for select to anon,authenticated
using (status='approved' and consent_public=true);

drop policy if exists nh7_testimony_read_own_v502 on public.nh7_testimonies_v502;
create policy nh7_testimony_read_own_v502 on public.nh7_testimonies_v502
for select to authenticated
using (user_id=auth.uid());

drop policy if exists nh7_testimony_insert_own_v502 on public.nh7_testimonies_v502;
create policy nh7_testimony_insert_own_v502 on public.nh7_testimonies_v502
for insert to authenticated
with check (
  user_id=auth.uid()
  and status='pending'
  and consent_public=true
);

-- Users cannot self-approve or edit approved testimony.
drop policy if exists nh7_testimony_update_own_pending_v502 on public.nh7_testimonies_v502;
create policy nh7_testimony_update_own_pending_v502 on public.nh7_testimonies_v502
for update to authenticated
using (user_id=auth.uid() and status='pending')
with check (user_id=auth.uid() and status='pending');

-- =========================================================
-- Prayer requests: strictly private.
-- =========================================================
create table if not exists public.nh7_prayer_requests_v502 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  requester_name text not null check (char_length(requester_name) between 1 and 160),
  request_text text not null check (char_length(request_text) between 2 and 6000),
  status text not null default 'new' check (status in ('new','praying','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists nh7_prayer_requests_v502_status_created_idx
on public.nh7_prayer_requests_v502(status,created_at desc);
alter table public.nh7_prayer_requests_v502 enable row level security;

-- A user can create and see only their own prayer request.
drop policy if exists nh7_prayer_insert_own_v502 on public.nh7_prayer_requests_v502;
create policy nh7_prayer_insert_own_v502 on public.nh7_prayer_requests_v502
for insert to authenticated
with check (user_id=auth.uid() and status='new');

drop policy if exists nh7_prayer_read_own_v502 on public.nh7_prayer_requests_v502;
create policy nh7_prayer_read_own_v502 on public.nh7_prayer_requests_v502
for select to authenticated
using (user_id=auth.uid());

-- No direct UPDATE/DELETE policy for normal users.

-- =========================================================
-- RBAC permissions for Prayer Servants / testimony reviewers.
-- Depends on v3.5.0 RBAC already present in Production.
-- =========================================================
insert into private.nh7_admin_permission_catalog_v350
(permission_key,module_key,action_key,label_fa,label_en,label_hr,is_assignable,is_enabled,sort_order)
values
('prayer_requests.view','prayer_requests','view','مشاهده درخواست‌های دعا','View prayer requests','Pregled molitvenih zahtjeva',true,true,510),
('prayer_requests.manage','prayer_requests','manage','مدیریت وضعیت درخواست دعا','Manage prayer request status','Upravljanje statusom molitvenih zahtjeva',true,true,520),
('prayer_requests.export','prayer_requests','export','خروجی PDF درخواست‌های دعا','Export prayer requests PDF','PDF izvoz molitvenih zahtjeva',true,true,530),
('testimonies.review','testimonies','review','بررسی و انتشار شهادت‌ها','Review and publish testimonies','Pregled i objava svjedočanstava',true,true,540)
on conflict(permission_key) do update set
 module_key=excluded.module_key,
 action_key=excluded.action_key,
 label_fa=excluded.label_fa,
 label_en=excluded.label_en,
 label_hr=excluded.label_hr,
 is_assignable=excluded.is_assignable,
 is_enabled=excluded.is_enabled,
 sort_order=excluded.sort_order;

-- Ensure manage/export imply prayer view when owner assigns them.
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

  if trim(coalesce(p_email,''))='' then
    raise exception 'Account email is required' using errcode='22023';
  end if;

  select u.* into v_target
  from auth.users u
  where lower(u.email)=lower(trim(p_email))
  order by u.created_at
  limit 1;

  if v_target.id is null then raise exception 'No existing account was found for this email' using errcode='P0002'; end if;
  if v_target.email_confirmed_at is null then raise exception 'The account email must be confirmed before admin access is granted' using errcode='42501'; end if;
  if v_target.banned_until is not null and v_target.banned_until>now() then raise exception 'A banned account cannot receive admin access' using errcode='42501'; end if;
  if exists(select 1 from private.nh7_admin_members_v350 m where m.user_id=v_target.id and m.role='owner') then
    raise exception 'The owner account cannot be changed here' using errcode='42501';
  end if;

  if v_permissions && array['registrations.review','registrations.delete','registrations.cleanup']::text[]
     and not ('registrations.view'=any(v_permissions)) then
    v_permissions:=array_append(v_permissions,'registrations.view');
  end if;
  if v_permissions && array['prayer_requests.manage','prayer_requests.export']::text[]
     and not ('prayer_requests.view'=any(v_permissions)) then
    v_permissions:=array_append(v_permissions,'prayer_requests.view');
  end if;

  select coalesce(array_agg(distinct x order by x),array[]::text[])
  into v_permissions from unnest(v_permissions) x;

  select array_agg(x order by x) into v_invalid
  from unnest(v_permissions) x
  where not exists(
    select 1 from private.nh7_admin_permission_catalog_v350 c
    where c.permission_key=x and c.is_assignable and c.is_enabled
  );
  if coalesce(cardinality(v_invalid),0)>0 then
    raise exception 'Unsupported permissions: %',array_to_string(v_invalid,', ') using errcode='22023';
  end if;
  if v_active and cardinality(v_permissions)=0 then
    raise exception 'At least one permission is required for an active delegated admin' using errcode='22023';
  end if;

  insert into private.nh7_admin_members_v350(user_id,email,display_name,role,is_active,created_by,updated_at)
  values(v_target.id,lower(v_target.email),left(trim(coalesce(p_display_name,'')),120),'delegate',v_active,v_actor,now())
  on conflict(user_id) do update set
    email=excluded.email,
    display_name=excluded.display_name,
    role='delegate',
    is_active=excluded.is_active,
    updated_at=now();

  delete from private.nh7_admin_permission_grants_v350 g where g.user_id=v_target.id;
  insert into private.nh7_admin_permission_grants_v350(user_id,permission_key,granted_by)
  select v_target.id,x,v_actor from unnest(v_permissions) x;

  insert into private.nh7_admin_audit_log_v350(actor_user_id,action,target_user_id,details)
  values(v_actor,'admin.permissions.set',v_target.id,jsonb_build_object('active',v_active,'permissions',to_jsonb(v_permissions)));

  return jsonb_build_object('user_id',v_target.id,'email',lower(v_target.email),'display_name',left(trim(coalesce(p_display_name,'')),120),'is_active',v_active,'permissions',to_jsonb(v_permissions));
end;
$$;

-- Prayer Servant feed (security-definer + explicit permission).
create or replace function public.nh7_prayer_servant_feed_v502(
  p_status text default 'active',
  p_limit integer default 500
)
returns table(
  id uuid,
  requester_name text,
  request_text text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path=''
as $$
begin
  perform private.nh7_admin_require_permission_v350('prayer_requests.view');
  return query
  select p.id,p.requester_name,p.request_text,p.status,p.created_at,p.updated_at
  from public.nh7_prayer_requests_v502 p
  where case
    when lower(coalesce(p_status,'active'))='all' then true
    when lower(coalesce(p_status,'active'))='active' then p.status in ('new','praying')
    else p.status=lower(p_status)
  end
  order by case p.status when 'new' then 0 when 'praying' then 1 else 2 end,p.created_at asc
  limit greatest(1,least(coalesce(p_limit,500),2000));
end;
$$;

create or replace function public.nh7_prayer_servant_set_status_v502(
  p_id uuid,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare v_status text:=lower(trim(coalesce(p_status,''))); v_changed boolean:=false;
begin
  perform private.nh7_admin_require_permission_v350('prayer_requests.manage');
  if v_status not in ('new','praying','completed') then
    raise exception 'Unsupported prayer status' using errcode='22023';
  end if;
  update public.nh7_prayer_requests_v502
  set status=v_status,updated_at=now(),completed_at=case when v_status='completed' then now() else null end
  where id=p_id returning true into v_changed;
  return coalesce(v_changed,false);
end;
$$;

create or replace function public.nh7_prayer_servant_export_v502(
  p_status text default 'active',
  p_limit integer default 2000
)
returns table(
  id uuid,
  requester_name text,
  request_text text,
  status text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path=''
as $$
begin
  perform private.nh7_admin_require_permission_v350('prayer_requests.export');
  return query
  select p.id,p.requester_name,p.request_text,p.status,p.created_at
  from public.nh7_prayer_requests_v502 p
  where case
    when lower(coalesce(p_status,'active'))='all' then true
    when lower(coalesce(p_status,'active'))='active' then p.status in ('new','praying')
    else p.status=lower(p_status)
  end
  order by p.created_at asc
  limit greatest(1,least(coalesce(p_limit,2000),5000));
end;
$$;

-- Testimony review feed and moderation.
create or replace function public.nh7_admin_testimony_feed_v502(
  p_status text default 'pending',
  p_limit integer default 500
)
returns table(
  id uuid,
  display_name text,
  testimony_text text,
  language text,
  show_name boolean,
  status text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path=''
as $$
begin
  perform private.nh7_admin_require_permission_v350('testimonies.review');
  return query
  select t.id,t.display_name,t.testimony_text,t.language,t.show_name,t.status,t.created_at
  from public.nh7_testimonies_v502 t
  where lower(coalesce(p_status,'pending'))='all' or t.status=lower(p_status)
  order by t.created_at desc
  limit greatest(1,least(coalesce(p_limit,500),2000));
end;
$$;

create or replace function public.nh7_admin_testimony_review_v502(
  p_id uuid,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare v_status text:=lower(trim(coalesce(p_status,''))); v_changed boolean:=false;
begin
  perform private.nh7_admin_require_permission_v350('testimonies.review');
  if v_status not in ('approved','rejected','pending') then
    raise exception 'Unsupported testimony status' using errcode='22023';
  end if;
  update public.nh7_testimonies_v502
  set status=v_status,updated_at=now(),published_at=case when v_status='approved' then now() else null end
  where id=p_id returning true into v_changed;
  return coalesce(v_changed,false);
end;
$$;

revoke all on function public.nh7_prayer_servant_feed_v502(text,integer) from public,anon,authenticated,service_role;
revoke all on function public.nh7_prayer_servant_set_status_v502(uuid,text) from public,anon,authenticated,service_role;
revoke all on function public.nh7_prayer_servant_export_v502(text,integer) from public,anon,authenticated,service_role;
revoke all on function public.nh7_admin_testimony_feed_v502(text,integer) from public,anon,authenticated,service_role;
revoke all on function public.nh7_admin_testimony_review_v502(uuid,text) from public,anon,authenticated,service_role;

grant execute on function public.nh7_prayer_servant_feed_v502(text,integer) to authenticated;
grant execute on function public.nh7_prayer_servant_set_status_v502(uuid,text) to authenticated;
grant execute on function public.nh7_prayer_servant_export_v502(text,integer) to authenticated;
grant execute on function public.nh7_admin_testimony_feed_v502(text,integer) to authenticated;
grant execute on function public.nh7_admin_testimony_review_v502(uuid,text) to authenticated;
