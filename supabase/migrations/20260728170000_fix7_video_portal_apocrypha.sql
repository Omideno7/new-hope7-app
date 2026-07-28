-- New Hope 7 Fix 7: independent secure video portal + dynamic Apocrypha catalogue
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.nh7_apocrypha_books_v270(
  id uuid primary key default gen_random_uuid(),
  book_code text not null unique,
  title_fa text not null default '',
  title_en text not null default '',
  title_hr text not null default '',
  description_fa text not null default '',
  description_en text not null default '',
  description_hr text not null default '',
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nh7_apocrypha_code_safe check(book_code ~ '^[a-z0-9_\-]{2,80}$')
);
alter table public.nh7_apocrypha_books_v270 enable row level security;
revoke all on public.nh7_apocrypha_books_v270 from anon,authenticated;

insert into public.nh7_apocrypha_books_v270(book_code,title_fa,title_en,title_hr,sort_order)
values
('tobit','طوبیت','Tobit','Tobija',10),
('judith','یهودیت','Judith','Judita',20),
('wisdom_of_solomon','حکمت سلیمان','Wisdom of Solomon','Knjiga Mudrosti',30),
('sirach','حکمت یشوع بن سیراخ','Sirach / Ecclesiasticus','Sirah',40),
('baruch','باروخ','Baruch','Baruh',50),
('letter_of_jeremiah','نامه ارمیا','Letter of Jeremiah','Jeremijino pismo',60),
('prayer_of_azariah','دعای عزریا','Prayer of Azariah','Molitva Azarijina',70),
('susanna','سوسنا','Susanna','Suzana',80),
('bel_and_the_dragon','بِل و اژدها','Bel and the Dragon','Bel i Zmaj',90),
('additions_to_esther','افزوده‌های استر','Additions to Esther','Dodaci Esteri',100),
('additions_to_daniel','افزوده‌های دانیال','Additions to Daniel','Dodaci Danielu',110),
('1_maccabees','اول مکابیان','1 Maccabees','1. Makabejcima',120),
('2_maccabees','دوم مکابیان','2 Maccabees','2. Makabejcima',130),
('3_maccabees','سوم مکابیان','3 Maccabees','3. Makabejcima',140),
('4_maccabees','چهارم مکابیان','4 Maccabees','4. Makabejcima',150),
('1_esdras','اول اِسدراس','1 Esdras','1. Ezra',160),
('2_esdras','دوم اِسدراس','2 Esdras','2. Ezra',170),
('prayer_of_manasseh','دعای منسی','Prayer of Manasseh','Molitva Manašeova',180),
('psalm_151','مزمور ۱۵۱','Psalm 151','Psalam 151',190),
('odes','سرودها','Odes','Ode',200),
('1_enoch','اول خنوخ','1 Enoch','1. Henokova',210),
('jubilees','یوبیل‌ها','Jubilees','Knjiga Jubileja',220),
('1_meqabyan','اول مِقابیان','1 Meqabyan','1. Meqabyan',230),
('2_meqabyan','دوم مِقابیان','2 Meqabyan','2. Meqabyan',240),
('3_meqabyan','سوم مِقابیان','3 Meqabyan','3. Meqabyan',250)
on conflict(book_code) do update set title_fa=excluded.title_fa,title_en=excluded.title_en,title_hr=excluded.title_hr,sort_order=excluded.sort_order,updated_at=now();

create or replace function public.nh7_admin_apocrypha_dashboard_v270()
returns jsonb language plpgsql security definer set search_path=public as $$
declare v jsonb;
begin
  if not public.nh7_is_admin() then raise exception 'Admin access required'; end if;
  select coalesce(jsonb_agg(to_jsonb(b) order by b.sort_order,b.created_at),'[]'::jsonb) into v
  from public.nh7_apocrypha_books_v270 b where b.is_active;
  return jsonb_build_object('books',v);
end;$$;

create or replace function public.nh7_admin_apocrypha_save_v270(p_item jsonb)
returns public.nh7_apocrypha_books_v270 language plpgsql security definer set search_path=public as $$
declare v_id uuid;v_code text;v_row public.nh7_apocrypha_books_v270;
begin
  if not public.nh7_is_admin() then raise exception 'Admin access required'; end if;
  v_id:=nullif(p_item->>'id','')::uuid;
  v_code:=trim(both '_' from regexp_replace(lower(trim(coalesce(p_item->>'book_code',''))),'[^a-z0-9_\-]+','_','g'));
  if length(v_code)<2 then raise exception 'Book code is required'; end if;
  if coalesce(trim(p_item->>'title_fa'),'')='' and coalesce(trim(p_item->>'title_en'),'')='' and coalesce(trim(p_item->>'title_hr'),'')='' then raise exception 'At least one title is required'; end if;
  if v_id is null then
    insert into public.nh7_apocrypha_books_v270(book_code,title_fa,title_en,title_hr,description_fa,description_en,description_hr,sort_order,is_active,created_by)
    values(v_code,coalesce(p_item->>'title_fa',''),coalesce(p_item->>'title_en',''),coalesce(p_item->>'title_hr',''),coalesce(p_item->>'description_fa',''),coalesce(p_item->>'description_en',''),coalesce(p_item->>'description_hr',''),coalesce(nullif(p_item->>'sort_order','')::integer,100),true,lower(coalesce(auth.jwt()->>'email','')))
    on conflict(book_code) do update set title_fa=excluded.title_fa,title_en=excluded.title_en,title_hr=excluded.title_hr,description_fa=excluded.description_fa,description_en=excluded.description_en,description_hr=excluded.description_hr,sort_order=excluded.sort_order,is_active=true,updated_at=now()
    returning * into v_row;
  else
    update public.nh7_apocrypha_books_v270 set book_code=v_code,title_fa=coalesce(p_item->>'title_fa',title_fa),title_en=coalesce(p_item->>'title_en',title_en),title_hr=coalesce(p_item->>'title_hr',title_hr),description_fa=coalesce(p_item->>'description_fa',description_fa),description_en=coalesce(p_item->>'description_en',description_en),description_hr=coalesce(p_item->>'description_hr',description_hr),sort_order=coalesce(nullif(p_item->>'sort_order','')::integer,sort_order),is_active=true,updated_at=now() where id=v_id returning * into v_row;
  end if;
  if v_row.id is null then raise exception 'Apocrypha book was not saved'; end if;
  return v_row;
end;$$;

create or replace function public.nh7_admin_apocrypha_disable_v270(p_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  if not public.nh7_is_admin() then raise exception 'Admin access required'; end if;
  update public.nh7_apocrypha_books_v270 set is_active=false,updated_at=now() where id=p_id;
  return found;
end;$$;

create or replace function public.nh7_apocrypha_catalog_v270()
returns table(id uuid,book_code text,title_fa text,title_en text,title_hr text,description_fa text,description_en text,description_hr text,sort_order integer,file_count bigint)
language sql stable security definer set search_path=public as $$
  select b.id,b.book_code,b.title_fa,b.title_en,b.title_hr,b.description_fa,b.description_en,b.description_hr,b.sort_order,count(i.id)::bigint
  from public.nh7_apocrypha_books_v270 b
  left join public.nh7_library_items i on i.is_active and i.is_published and i.resource_type='apocrypha' and lower(coalesce(i.apocrypha_book,''))=lower(b.book_code)
  where auth.uid() is not null and public.nh7_school_access_approved_v230(auth.uid(),coalesce(auth.jwt()->>'email',''),'') and b.is_active
  group by b.id order by b.sort_order,b.created_at;
$$;

grant execute on function public.nh7_admin_apocrypha_dashboard_v270() to authenticated;
grant execute on function public.nh7_admin_apocrypha_save_v270(jsonb) to authenticated;
grant execute on function public.nh7_admin_apocrypha_disable_v270(uuid) to authenticated;
grant execute on function public.nh7_apocrypha_catalog_v270() to authenticated;

create or replace function public.nh7_video_portal_authorize_v270(p_code text default '',p_device_id text default '',p_user_id uuid default null,p_user_email text default '')
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare v_user uuid:=coalesce(p_user_id,auth.uid());v_email text:=lower(trim(coalesce(nullif(p_user_email,''),auth.jwt()->>'email','')));v_device text:=left(trim(coalesce(p_device_id,'')),160);v_hash text;v_code public.nh7_school_video_codes_v260;v_grant public.nh7_school_video_grants_v260;v_catalog jsonb;
begin
  if auth.role() not in ('service_role','authenticated') or v_user is null or v_email='' then return jsonb_build_object('allowed',false,'code','login_required'); end if;
  if auth.role()='authenticated' and auth.uid() is distinct from v_user then return jsonb_build_object('allowed',false,'code','identity_mismatch'); end if;
  if length(trim(coalesce(p_code,'')))<6 then return jsonb_build_object('allowed',false,'code','code_required'); end if;
  if length(v_device)<8 then return jsonb_build_object('allowed',false,'code','device_required'); end if;
  v_hash:=encode(extensions.digest(convert_to(lower(trim(p_code)),'UTF8'),'sha256'::text),'hex');
  select * into v_code from public.nh7_school_video_codes_v260 where code_hash=v_hash for update;
  if not found or not v_code.is_active then return jsonb_build_object('allowed',false,'code','invalid_code'); end if;
  if v_code.expires_at is not null and v_code.expires_at<=now() then return jsonb_build_object('allowed',false,'code','expired'); end if;
  select * into v_grant from public.nh7_school_video_grants_v260 where code_id=v_code.id for update;
  if not found then
    insert into public.nh7_school_video_grants_v260(code_id,user_id,user_email,device_id,first_video_id) values(v_code.id,v_user,v_email,v_device,v_code.video_id) returning * into v_grant;
    update public.nh7_school_video_codes_v260 set use_count=use_count+1,updated_at=now() where id=v_code.id;
  else
    if v_grant.revoked_at is not null then return jsonb_build_object('allowed',false,'code','grant_revoked'); end if;
    if v_grant.user_id<>v_user or lower(v_grant.user_email)<>v_email or v_grant.device_id<>v_device then return jsonb_build_object('allowed',false,'code','device_bound_elsewhere'); end if;
    update public.nh7_school_video_grants_v260 set last_used_at=now() where id=v_grant.id;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',v.id,'title_fa',v.title_fa,'title_en',v.title_en,'title_hr',v.title_hr,'description_fa',v.description_fa,'description_en',v.description_en,'description_hr',v.description_hr,'topic',v.topic,'file_name',v.file_name,'mime_type',v.mime_type,'file_size',v.file_size,'duration_seconds',v.duration_seconds,'sort_order',v.sort_order,'has_subtitle_en',v.subtitle_en_path<>'','has_subtitle_hr',v.subtitle_hr_path<>'') order by v.sort_order,v.created_at desc),'[]'::jsonb) into v_catalog
  from public.nh7_school_videos_v260 v where v.is_active and v.is_published and (v_code.video_id is null or v.id=v_code.video_id);
  return jsonb_build_object('allowed',true,'catalog',v_catalog,'watermark_email',v_email,'watermark_device',right(v_device,8));
end;$$;

create or replace function public.nh7_video_authorize_v270(p_video_id uuid,p_code text default '',p_device_id text default '',p_user_id uuid default null,p_user_email text default '')
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare v_user uuid:=coalesce(p_user_id,auth.uid());v_email text:=lower(trim(coalesce(nullif(p_user_email,''),auth.jwt()->>'email','')));v_device text:=left(trim(coalesce(p_device_id,'')),160);v_hash text;v_code public.nh7_school_video_codes_v260;v_grant public.nh7_school_video_grants_v260;v_video public.nh7_school_videos_v260;
begin
  if auth.role() not in ('service_role','authenticated') or v_user is null or v_email='' then return jsonb_build_object('allowed',false,'code','login_required'); end if;
  if auth.role()='authenticated' and auth.uid() is distinct from v_user then return jsonb_build_object('allowed',false,'code','identity_mismatch'); end if;
  if length(trim(coalesce(p_code,'')))<6 then return jsonb_build_object('allowed',false,'code','code_required'); end if;
  if length(v_device)<8 then return jsonb_build_object('allowed',false,'code','device_required'); end if;
  select * into v_video from public.nh7_school_videos_v260 where id=p_video_id and is_active and is_published;
  if not found then return jsonb_build_object('allowed',false,'code','video_not_found'); end if;
  v_hash:=encode(extensions.digest(convert_to(lower(trim(p_code)),'UTF8'),'sha256'::text),'hex');
  select * into v_code from public.nh7_school_video_codes_v260 where code_hash=v_hash for update;
  if not found or not v_code.is_active then return jsonb_build_object('allowed',false,'code','invalid_code'); end if;
  if v_code.expires_at is not null and v_code.expires_at<=now() then return jsonb_build_object('allowed',false,'code','expired'); end if;
  if v_code.video_id is not null and v_code.video_id<>v_video.id then return jsonb_build_object('allowed',false,'code','code_not_for_video'); end if;
  select * into v_grant from public.nh7_school_video_grants_v260 where code_id=v_code.id for update;
  if not found then return jsonb_build_object('allowed',false,'code','portal_login_required'); end if;
  if v_grant.revoked_at is not null then return jsonb_build_object('allowed',false,'code','grant_revoked'); end if;
  if v_grant.user_id<>v_user or lower(v_grant.user_email)<>v_email or v_grant.device_id<>v_device then return jsonb_build_object('allowed',false,'code','device_bound_elsewhere'); end if;
  update public.nh7_school_video_grants_v260 set last_used_at=now() where id=v_grant.id;
  return jsonb_build_object('allowed',true,'kind','video','bucket','nh7-school-media','storage_path',v_video.storage_path,'file_name',v_video.file_name,'mime_type',v_video.mime_type,'duration_seconds',v_video.duration_seconds,'title_fa',v_video.title_fa,'title_en',v_video.title_en,'title_hr',v_video.title_hr,'subtitle_en_path',v_video.subtitle_en_path,'subtitle_hr_path',v_video.subtitle_hr_path,'watermark_email',v_email,'watermark_device',right(v_device,8));
end;$$;

grant execute on function public.nh7_video_portal_authorize_v270(text,text,uuid,text) to authenticated,service_role;
grant execute on function public.nh7_video_authorize_v270(uuid,text,text,uuid,text) to authenticated,service_role;
revoke all on function public.nh7_school_video_catalog_v260() from authenticated;
create unique index if not exists nh7_video_grants_code_unique_idx on public.nh7_school_video_grants_v260(code_id);