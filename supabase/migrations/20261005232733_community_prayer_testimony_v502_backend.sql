-- New Hope 7 community backend v502
-- Additive migration only: prayer requests, testimony submissions, storage buckets,
-- least-privilege RLS, public feed, and admin/prayer-servant review RPCs.

create table if not exists public.nh7_prayer_requests_v502 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  requester_name text not null default '',
  request_text text not null,
  language text not null default '',
  status text not null default 'new' check (status in ('new','praying','completed')),
  admin_note text not null default '',
  prayed_at timestamptz,
  completed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nh7_prayer_request_text_v502 check (length(trim(request_text)) between 1 and 10000)
);

create index if not exists nh7_prayer_requests_v502_user_created_idx
  on public.nh7_prayer_requests_v502(user_id, created_at desc);
create index if not exists nh7_prayer_requests_v502_status_created_idx
  on public.nh7_prayer_requests_v502(status, created_at desc);

create table if not exists public.nh7_testimonies_v502 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  display_name text not null default '',
  testimony_type text not null default '',
  note_text text not null default '',
  language text not null default '',
  show_name boolean not null default true,
  consent_public boolean not null default false,
  consent_health_public boolean not null default false,
  audio_submission_path text not null default '',
  audio_mime_type text not null default '',
  audio_duration_seconds numeric not null default 0,
  audio_public_path text not null default '',
  status text not null default 'pending' check (status in ('pending','published','rejected')),
  admin_note text not null default '',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nh7_testimony_content_v502 check (
    length(trim(title)) > 0 or length(trim(note_text)) > 0 or length(trim(audio_submission_path)) > 0
  )
);

create index if not exists nh7_testimonies_v502_user_created_idx
  on public.nh7_testimonies_v502(user_id, created_at desc);
create index if not exists nh7_testimonies_v502_status_created_idx
  on public.nh7_testimonies_v502(status, created_at desc);
create index if not exists nh7_testimonies_v502_public_feed_idx
  on public.nh7_testimonies_v502(status, language, published_at desc)
  where status='published' and consent_public=true;

create or replace function public.nh7_touch_updated_at_v502()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

 drop trigger if exists nh7_prayer_touch_updated_v502 on public.nh7_prayer_requests_v502;
create trigger nh7_prayer_touch_updated_v502
before update on public.nh7_prayer_requests_v502
for each row execute function public.nh7_touch_updated_at_v502();

 drop trigger if exists nh7_testimony_touch_updated_v502 on public.nh7_testimonies_v502;
create trigger nh7_testimony_touch_updated_v502
before update on public.nh7_testimonies_v502
for each row execute function public.nh7_touch_updated_at_v502();

-- Reuse the existing admin permission system. Owner automatically has all enabled permissions.
insert into private.nh7_admin_permission_catalog_v350
(permission_key,module_key,action_key,label_fa,label_en,label_hr,is_assignable,is_enabled,sort_order)
values
('community.prayer.view','community_prayer','view','مشاهده درخواست‌های دعا','View prayer requests','Pregled molitvenih zahtjeva',true,true,510),
('community.prayer.manage','community_prayer','manage','مدیریت وضعیت درخواست‌های دعا','Manage prayer requests','Upravljanje molitvenim zahtjevima',true,true,520),
('community.testimony.review','community_testimony','review','بررسی و انتشار شهادت‌ها','Review and publish testimonies','Pregled i objava svjedočanstava',true,true,530)
on conflict (permission_key) do update set
 module_key=excluded.module_key,
 action_key=excluded.action_key,
 label_fa=excluded.label_fa,
 label_en=excluded.label_en,
 label_hr=excluded.label_hr,
 is_assignable=excluded.is_assignable,
 is_enabled=excluded.is_enabled,
 sort_order=excluded.sort_order;

alter table public.nh7_prayer_requests_v502 enable row level security;
alter table public.nh7_testimonies_v502 enable row level security;

-- Remove only policies owned by this v502 module so reruns remain safe.
drop policy if exists nh7_prayer_insert_own_v502 on public.nh7_prayer_requests_v502;
drop policy if exists nh7_prayer_select_own_v502 on public.nh7_prayer_requests_v502;
drop policy if exists nh7_prayer_admin_select_v502 on public.nh7_prayer_requests_v502;
drop policy if exists nh7_testimony_insert_own_v502 on public.nh7_testimonies_v502;
drop policy if exists nh7_testimony_select_own_v502 on public.nh7_testimonies_v502;
drop policy if exists nh7_testimony_admin_select_v502 on public.nh7_testimonies_v502;

create policy nh7_prayer_insert_own_v502
on public.nh7_prayer_requests_v502
for insert to authenticated
with check (
  user_id = auth.uid()
  and status = 'new'
  and length(trim(request_text)) > 0
);

create policy nh7_prayer_select_own_v502
on public.nh7_prayer_requests_v502
for select to authenticated
using (user_id = auth.uid());

create policy nh7_prayer_admin_select_v502
on public.nh7_prayer_requests_v502
for select to authenticated
using (coalesce(public.nh7_admin_has_permission_v395('community.prayer.view'),false));

create policy nh7_testimony_insert_own_v502
on public.nh7_testimonies_v502
for insert to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
);

create policy nh7_testimony_select_own_v502
on public.nh7_testimonies_v502
for select to authenticated
using (user_id = auth.uid());

create policy nh7_testimony_admin_select_v502
on public.nh7_testimonies_v502
for select to authenticated
using (coalesce(public.nh7_admin_has_permission_v395('community.testimony.review'),false));

revoke all on public.nh7_prayer_requests_v502 from anon;
revoke all on public.nh7_testimonies_v502 from anon;
grant select, insert on public.nh7_prayer_requests_v502 to authenticated;
grant select, insert on public.nh7_testimonies_v502 to authenticated;

-- Storage: private raw submissions + public approved audio.
insert into storage.buckets (id,name,public,file_size_limit)
values ('nh7-testimony-submissions-v502','nh7-testimony-submissions-v502',false,52428800)
on conflict (id) do update set public=false, file_size_limit=excluded.file_size_limit;

insert into storage.buckets (id,name,public,file_size_limit)
values ('nh7-testimony-published-v502','nh7-testimony-published-v502',true,52428800)
on conflict (id) do update set public=true, file_size_limit=excluded.file_size_limit;

-- Storage policies. Client path is <auth.uid()>/<uuid>.<ext>.
drop policy if exists nh7_testimony_private_insert_own_v502 on storage.objects;
drop policy if exists nh7_testimony_private_select_own_v502 on storage.objects;
drop policy if exists nh7_testimony_private_delete_own_v502 on storage.objects;
drop policy if exists nh7_testimony_private_admin_select_v502 on storage.objects;
drop policy if exists nh7_testimony_public_admin_insert_v502 on storage.objects;
drop policy if exists nh7_testimony_public_admin_update_v502 on storage.objects;
drop policy if exists nh7_testimony_public_admin_delete_v502 on storage.objects;

create policy nh7_testimony_private_insert_own_v502
on storage.objects for insert to authenticated
with check (
  bucket_id='nh7-testimony-submissions-v502'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy nh7_testimony_private_select_own_v502
on storage.objects for select to authenticated
using (
  bucket_id='nh7-testimony-submissions-v502'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy nh7_testimony_private_delete_own_v502
on storage.objects for delete to authenticated
using (
  bucket_id='nh7-testimony-submissions-v502'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy nh7_testimony_private_admin_select_v502
on storage.objects for select to authenticated
using (
  bucket_id='nh7-testimony-submissions-v502'
  and coalesce(public.nh7_admin_has_permission_v395('community.testimony.review'),false)
);

create policy nh7_testimony_public_admin_insert_v502
on storage.objects for insert to authenticated
with check (
  bucket_id='nh7-testimony-published-v502'
  and coalesce(public.nh7_admin_has_permission_v395('community.testimony.review'),false)
);

create policy nh7_testimony_public_admin_update_v502
on storage.objects for update to authenticated
using (
  bucket_id='nh7-testimony-published-v502'
  and coalesce(public.nh7_admin_has_permission_v395('community.testimony.review'),false)
)
with check (
  bucket_id='nh7-testimony-published-v502'
  and coalesce(public.nh7_admin_has_permission_v395('community.testimony.review'),false)
);

create policy nh7_testimony_public_admin_delete_v502
on storage.objects for delete to authenticated
using (
  bucket_id='nh7-testimony-published-v502'
  and coalesce(public.nh7_admin_has_permission_v395('community.testimony.review'),false)
);

-- Public testimony feed used by the released iOS/Android clients.
create or replace function public.nh7_public_testimony_feed_v502(
  p_language text default '',
  p_limit integer default 50
)
returns table(
  id uuid,
  title text,
  display_name text,
  testimony_type text,
  note_text text,
  language text,
  show_name boolean,
  audio_public_path text,
  audio_url text,
  published_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select
    t.id,
    t.title,
    case when t.show_name then t.display_name else '' end as display_name,
    t.testimony_type,
    t.note_text,
    t.language,
    t.show_name,
    t.audio_public_path,
    case when length(trim(t.audio_public_path)) > 0
      then 'https://gpzcwffxnddhaeaogdyo.supabase.co/storage/v1/object/public/nh7-testimony-published-v502/' || t.audio_public_path
      else '' end as audio_url,
    t.published_at,
    t.created_at
  from public.nh7_testimonies_v502 t
  where t.status='published'
    and t.consent_public=true
    and (trim(coalesce(p_language,''))='' or t.language=trim(p_language))
    and (
      lower(trim(t.testimony_type)) not in ('healing','health','medical','شفا','درمان')
      or t.consent_health_public=true
    )
  order by coalesce(t.published_at,t.created_at) desc
  limit greatest(1,least(coalesce(p_limit,50),100));
$$;

revoke all on function public.nh7_public_testimony_feed_v502(text,integer) from public;
grant execute on function public.nh7_public_testimony_feed_v502(text,integer) to anon, authenticated;

-- Admin/prayer-servant feed and actions.
create or replace function public.nh7_owner_prayer_feed_v502(
  p_status text default '',
  p_limit integer default 200
)
returns setof public.nh7_prayer_requests_v502
language plpgsql
stable
security definer
set search_path = public, private, pg_catalog
as $$
begin
  if not coalesce(public.nh7_admin_has_permission_v395('community.prayer.view'),false) then
    raise exception 'not authorized';
  end if;
  return query
    select * from public.nh7_prayer_requests_v502 r
    where trim(coalesce(p_status,''))='' or r.status=trim(p_status)
    order by r.created_at desc
    limit greatest(1,least(coalesce(p_limit,200),1000));
end;
$$;

create or replace function public.nh7_owner_prayer_set_status_v502(
  p_id uuid,
  p_status text,
  p_admin_note text default ''
)
returns public.nh7_prayer_requests_v502
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare v_row public.nh7_prayer_requests_v502;
begin
  if not coalesce(public.nh7_admin_has_permission_v395('community.prayer.manage'),false) then
    raise exception 'not authorized';
  end if;
  if p_status not in ('new','praying','completed') then
    raise exception 'invalid prayer status';
  end if;
  update public.nh7_prayer_requests_v502
     set status=p_status,
         admin_note=coalesce(p_admin_note,''),
         reviewed_by=auth.uid(),
         prayed_at=case when p_status='praying' and prayed_at is null then now() else prayed_at end,
         completed_at=case when p_status='completed' then coalesce(completed_at,now()) when p_status<>'completed' then null else completed_at end
   where id=p_id
   returning * into v_row;
  if v_row.id is null then raise exception 'prayer request not found'; end if;
  return v_row;
end;
$$;

create or replace function public.nh7_owner_testimony_feed_v502(
  p_status text default '',
  p_limit integer default 200
)
returns setof public.nh7_testimonies_v502
language plpgsql
stable
security definer
set search_path = public, private, pg_catalog
as $$
begin
  if not coalesce(public.nh7_admin_has_permission_v395('community.testimony.review'),false) then
    raise exception 'not authorized';
  end if;
  return query
    select * from public.nh7_testimonies_v502 t
    where trim(coalesce(p_status,''))='' or t.status=trim(p_status)
    order by t.created_at desc
    limit greatest(1,least(coalesce(p_limit,200),1000));
end;
$$;

create or replace function public.nh7_owner_testimony_publish_v502(
  p_id uuid,
  p_public_audio_path text default '',
  p_admin_note text default ''
)
returns public.nh7_testimonies_v502
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare v_row public.nh7_testimonies_v502;
begin
  if not coalesce(public.nh7_admin_has_permission_v395('community.testimony.review'),false) then
    raise exception 'not authorized';
  end if;
  select * into v_row from public.nh7_testimonies_v502 where id=p_id;
  if v_row.id is null then raise exception 'testimony not found'; end if;
  if not v_row.consent_public then raise exception 'public consent is required'; end if;
  if lower(trim(v_row.testimony_type)) in ('healing','health','medical','شفا','درمان')
     and not v_row.consent_health_public then
    raise exception 'health testimony public consent is required';
  end if;
  update public.nh7_testimonies_v502
     set status='published',
         audio_public_path=coalesce(p_public_audio_path,''),
         admin_note=coalesce(p_admin_note,''),
         reviewed_by=auth.uid(),
         reviewed_at=now(),
         published_at=now()
   where id=p_id
   returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.nh7_owner_testimony_reject_v502(
  p_id uuid,
  p_admin_note text default ''
)
returns public.nh7_testimonies_v502
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare v_row public.nh7_testimonies_v502;
begin
  if not coalesce(public.nh7_admin_has_permission_v395('community.testimony.review'),false) then
    raise exception 'not authorized';
  end if;
  update public.nh7_testimonies_v502
     set status='rejected',
         admin_note=coalesce(p_admin_note,''),
         reviewed_by=auth.uid(),
         reviewed_at=now(),
         published_at=null,
         audio_public_path=''
   where id=p_id
   returning * into v_row;
  if v_row.id is null then raise exception 'testimony not found'; end if;
  return v_row;
end;
$$;

revoke all on function public.nh7_owner_prayer_feed_v502(text,integer) from public;
revoke all on function public.nh7_owner_prayer_set_status_v502(uuid,text,text) from public;
revoke all on function public.nh7_owner_testimony_feed_v502(text,integer) from public;
revoke all on function public.nh7_owner_testimony_publish_v502(uuid,text,text) from public;
revoke all on function public.nh7_owner_testimony_reject_v502(uuid,text) from public;
grant execute on function public.nh7_owner_prayer_feed_v502(text,integer) to authenticated;
grant execute on function public.nh7_owner_prayer_set_status_v502(uuid,text,text) to authenticated;
grant execute on function public.nh7_owner_testimony_feed_v502(text,integer) to authenticated;
grant execute on function public.nh7_owner_testimony_publish_v502(uuid,text,text) to authenticated;
grant execute on function public.nh7_owner_testimony_reject_v502(uuid,text) to authenticated;
