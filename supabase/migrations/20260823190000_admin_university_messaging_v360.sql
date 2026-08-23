-- New Hope 7 v3.6.0 — isolated admin university/messaging backend.
-- Prepared on RC branch. Do not apply to production until RC approval.

create table if not exists public.nh7_admin_campaigns_v360 (
  id uuid primary key default gen_random_uuid(),
  audience text not null default 'all' check (audience in ('all','students','selected')),
  channels text[] not null default array['push','inbox']::text[],
  title_fa text not null default '',
  body_fa text not null default '',
  title_en text not null default '',
  body_en text not null default '',
  title_hr text not null default '',
  body_hr text not null default '',
  target_user_ids uuid[] not null default '{}'::uuid[],
  target_emails text[] not null default '{}'::text[],
  target_route text not null default 'home',
  recipient_count integer not null default 0,
  status text not null default 'draft' check (status in ('draft','sending','sent','partial','failed')),
  onesignal_id text not null default '',
  error_message text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.nh7_admin_campaigns_v360 enable row level security;
revoke all on public.nh7_admin_campaigns_v360 from anon, authenticated;
grant select,insert,update,delete on public.nh7_admin_campaigns_v360 to authenticated;
drop policy if exists "NH7 v360 campaigns admin" on public.nh7_admin_campaigns_v360;
create policy "NH7 v360 campaigns admin" on public.nh7_admin_campaigns_v360
for all to authenticated
using (coalesce(public.nh7_is_admin(),false))
with check (coalesce(public.nh7_is_admin(),false));

create table if not exists public.nh7_app_presence_daily_v360 (
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null default '',
  activity_date date not null default current_date,
  active_seconds integer not null default 0 check (active_seconds between 0 and 86400),
  heartbeat_count integer not null default 0,
  last_seen_at timestamptz not null default now(),
  primary key(user_id,activity_date)
);
alter table public.nh7_app_presence_daily_v360 enable row level security;
revoke all on public.nh7_app_presence_daily_v360 from anon, authenticated;
grant select on public.nh7_app_presence_daily_v360 to authenticated;

drop policy if exists "NH7 v360 presence own read" on public.nh7_app_presence_daily_v360;
create policy "NH7 v360 presence own read" on public.nh7_app_presence_daily_v360
for select to authenticated
using (user_id=auth.uid() or coalesce(public.nh7_is_admin(),false));

create or replace function public.nh7_track_app_presence_v360(p_seconds integer default 60)
returns void
language plpgsql
security definer
set search_path='public','auth','pg_catalog'
as $$
declare
  v_uid uuid:=auth.uid();
  v_email text:=lower(trim(coalesce(auth.jwt()->>'email','')));
  v_seconds integer:=greatest(1,least(coalesce(p_seconds,60),90));
begin
  if v_uid is null or auth.role()<>'authenticated' then raise exception 'Authentication required'; end if;
  insert into public.nh7_app_presence_daily_v360(user_id,user_email,activity_date,active_seconds,heartbeat_count,last_seen_at)
  values(v_uid,v_email,current_date,v_seconds,1,now())
  on conflict(user_id,activity_date) do update set
    user_email=excluded.user_email,
    active_seconds=least(86400,public.nh7_app_presence_daily_v360.active_seconds+excluded.active_seconds),
    heartbeat_count=public.nh7_app_presence_daily_v360.heartbeat_count+1,
    last_seen_at=now();
end;
$$;
revoke all on function public.nh7_track_app_presence_v360(integer) from public,anon;
grant execute on function public.nh7_track_app_presence_v360(integer) to authenticated;

create or replace function public.nh7_admin_user_directory_v360()
returns table(user_id uuid,email text,full_name text,language text,email_confirmed boolean,last_sign_in_at timestamptz)
language sql
stable
security definer
set search_path='public','auth','pg_catalog'
as $$
  select u.id,
         lower(trim(coalesce(u.email,''))),
         trim(coalesce(u.raw_user_meta_data->>'full_name','')),
         case when lower(coalesce(u.raw_user_meta_data->>'language','')) in ('fa','en','hr') then lower(u.raw_user_meta_data->>'language') else 'en' end,
         u.email_confirmed_at is not null,
         u.last_sign_in_at
  from auth.users u
  where coalesce(public.nh7_is_admin(),false)
    and coalesce(trim(u.email),'')<>''
  order by lower(trim(u.email));
$$;
revoke all on function public.nh7_admin_user_directory_v360() from public,anon;
grant execute on function public.nh7_admin_user_directory_v360() to authenticated;

create or replace function public.nh7_admin_send_inbox_v360(
  p_user_email text,
  p_title text,
  p_body text,
  p_language text default 'fa',
  p_category text default 'admin_message'
)
returns uuid
language plpgsql
security definer
set search_path='public','auth','pg_catalog'
as $$
declare
  v_id uuid:=gen_random_uuid();
  v_email text:=lower(trim(coalesce(p_user_email,'')));
  v_lang text:=case when lower(coalesce(p_language,'fa')) in ('fa','en','hr') then lower(p_language) else 'fa' end;
begin
  if not coalesce(public.nh7_is_admin(),false) then raise exception 'Admin access required'; end if;
  if v_email='' or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Valid email is required'; end if;
  if nullif(trim(coalesce(p_title,'')),'') is null or nullif(trim(coalesce(p_body,'')),'') is null then raise exception 'Title and body are required'; end if;
  insert into public.notification_inbox(id,user_email,device_id,title,body,category,language,delivered_at,dedupe_key)
  values(v_id,v_email,null,trim(p_title),trim(p_body),coalesce(nullif(trim(p_category),''),'admin_message'),v_lang,now(),
    'admin-v360:'||v_email||':'||extract(epoch from clock_timestamp())::bigint||':'||substr(md5(p_title||p_body),1,10));
  return v_id;
end;
$$;
revoke all on function public.nh7_admin_send_inbox_v360(text,text,text,text,text) from public,anon;
grant execute on function public.nh7_admin_send_inbox_v360(text,text,text,text,text) to authenticated;

create or replace function public.nh7_admin_student_activity_v360(p_email text)
returns jsonb
language plpgsql
stable
security definer
set search_path='public','auth','pg_catalog'
as $$
declare
  v_email text:=lower(trim(coalesce(p_email,'')));
  v_base jsonb;
  v_presence jsonb;
begin
  if not coalesce(public.nh7_is_admin(),false) then raise exception 'Admin access required'; end if;
  v_base:=coalesce(public.nh7_admin_student_activity_v235(v_email),'{}'::jsonb);
  select jsonb_build_object(
    'active_seconds',coalesce(sum(p.active_seconds),0),
    'active_days',count(*) filter(where p.active_seconds>0),
    'last_seen_at',max(p.last_seen_at)
  ) into v_presence
  from public.nh7_app_presence_daily_v360 p
  where lower(p.user_email)=v_email;
  return v_base||jsonb_build_object('presence',coalesce(v_presence,'{}'::jsonb));
end;
$$;
revoke all on function public.nh7_admin_student_activity_v360(text) from public,anon;
grant execute on function public.nh7_admin_student_activity_v360(text) to authenticated;

create index if not exists nh7_admin_campaigns_v360_created_idx on public.nh7_admin_campaigns_v360(created_at desc);
create index if not exists nh7_app_presence_v360_email_idx on public.nh7_app_presence_daily_v360(lower(user_email),activity_date desc);
