-- New Hope 7 v2.3.0
-- Protected media/catalogues, account-bound minister grants, and Bible batch marks.
-- Idempotent. Upload web/Edge files first; run this migration last.

create extension if not exists pgcrypto;

-- -------------------------------------------------------------------------
-- 1) Bible batch state, synchronized per authenticated account
-- -------------------------------------------------------------------------
create table if not exists public.nh7_account_verse_marks_v230 (
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null default '',
  verse_key text not null,
  verse_ref text not null default '',
  verse_text text not null default '',
  saved boolean not null default false,
  highlight_color text not null default '',
  note text not null default '',
  language text not null default 'en' check (language in ('fa','en','hr')),
  batch_id text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, verse_key)
);
create index if not exists nh7_verse_marks_email_idx
  on public.nh7_account_verse_marks_v230(lower(user_email),updated_at desc);
create index if not exists nh7_verse_marks_batch_idx
  on public.nh7_account_verse_marks_v230(batch_id) where batch_id<>'';

alter table public.nh7_account_verse_marks_v230 enable row level security;
drop policy if exists "NH7 users read own verse marks v230" on public.nh7_account_verse_marks_v230;
create policy "NH7 users read own verse marks v230"
  on public.nh7_account_verse_marks_v230 for select to authenticated
  using (auth.uid()=user_id);
drop policy if exists "NH7 users insert own verse marks v230" on public.nh7_account_verse_marks_v230;
create policy "NH7 users insert own verse marks v230"
  on public.nh7_account_verse_marks_v230 for insert to authenticated
  with check (auth.uid()=user_id and lower(user_email)=lower(coalesce(auth.jwt()->>'email','')));
drop policy if exists "NH7 users update own verse marks v230" on public.nh7_account_verse_marks_v230;
create policy "NH7 users update own verse marks v230"
  on public.nh7_account_verse_marks_v230 for update to authenticated
  using (auth.uid()=user_id)
  with check (auth.uid()=user_id and lower(user_email)=lower(coalesce(auth.jwt()->>'email','')));
drop policy if exists "NH7 users delete own verse marks v230" on public.nh7_account_verse_marks_v230;
create policy "NH7 users delete own verse marks v230"
  on public.nh7_account_verse_marks_v230 for delete to authenticated
  using (auth.uid()=user_id);
grant select,insert,update,delete on public.nh7_account_verse_marks_v230 to authenticated;

-- -------------------------------------------------------------------------
-- 2) School approval based on a verified account identity
-- -------------------------------------------------------------------------
create or replace function public.nh7_school_access_approved_v230(
  p_user_id uuid default null,
  p_email text default '',
  p_device_id text default ''
) returns boolean
language plpgsql stable security definer set search_path=public as $$
declare
  v_email text:=lower(trim(coalesce(nullif(p_email,''),auth.jwt()->>'email','')));
  v_device text:=trim(coalesce(p_device_id,''));
  v_user uuid:=coalesce(p_user_id,auth.uid());
begin
  if v_user is null or v_email='' then return false; end if;
  if auth.role() not in ('service_role','authenticated') then return false; end if;
  if auth.role()='authenticated' and auth.uid() is distinct from v_user then return false; end if;

  return exists(
    select 1
    from public.registrations r
    where lower(coalesce(r.type,''))='school'
      and lower(coalesce(r.status,''))='approved'
      and (
        lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))=v_email
        or (v_device<>'' and coalesce(r.device_id,r.payload->>'device_id','')=v_device)
      )
  );
end;
$$;
revoke all on function public.nh7_school_access_approved_v230(uuid,text,text) from public,anon;
grant execute on function public.nh7_school_access_approved_v230(uuid,text,text) to authenticated,service_role;

-- -------------------------------------------------------------------------
-- 3) A minister code is redeemed once and becomes an account-bound grant
-- -------------------------------------------------------------------------
create table if not exists public.nh7_library_user_grants_v230 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  code_id uuid not null references public.nh7_library_access_codes(id) on delete restrict,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,code_id)
);
create index if not exists nh7_library_grants_user_idx
  on public.nh7_library_user_grants_v230(user_id,revoked_at,expires_at);

alter table public.nh7_library_user_grants_v230 enable row level security;
drop policy if exists "NH7 users read own library grants v230" on public.nh7_library_user_grants_v230;
create policy "NH7 users read own library grants v230"
  on public.nh7_library_user_grants_v230 for select to authenticated
  using (auth.uid()=user_id);
drop policy if exists "NH7 admins manage library grants v230" on public.nh7_library_user_grants_v230;
create policy "NH7 admins manage library grants v230"
  on public.nh7_library_user_grants_v230 for all to authenticated
  using (coalesce(public.nh7_is_admin(),false))
  with check (coalesce(public.nh7_is_admin(),false));
grant select on public.nh7_library_user_grants_v230 to authenticated;

create or replace function public.nh7_library_authorize_v230(
  p_item_id uuid,
  p_code text default '',
  p_device_id text default '',
  p_user_id uuid default null,
  p_user_email text default ''
) returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  v_item public.nh7_library_items;
  v_code public.nh7_library_access_codes;
  v_user uuid:=coalesce(p_user_id,auth.uid());
  v_email text:=lower(trim(coalesce(nullif(p_user_email,''),auth.jwt()->>'email','')));
  v_grant public.nh7_library_user_grants_v230;
  v_new_redemption boolean:=false;
begin
  if auth.role() not in ('service_role','authenticated') then
    return jsonb_build_object('allowed',false,'code','login_required');
  end if;
  if v_user is null or v_email='' then
    return jsonb_build_object('allowed',false,'code','login_required');
  end if;
  if auth.role()='authenticated' and auth.uid() is distinct from v_user then
    return jsonb_build_object('allowed',false,'code','identity_mismatch');
  end if;
  if not public.nh7_school_access_approved_v230(v_user,v_email,p_device_id) then
    return jsonb_build_object('allowed',false,'code','school_approval_required');
  end if;

  select * into v_item
  from public.nh7_library_items
  where id=p_item_id and is_active and is_published;
  if not found then return jsonb_build_object('allowed',false,'code','not_found'); end if;

  if v_item.audience='ministers' then
    select * into v_grant
    from public.nh7_library_user_grants_v230 g
    where g.user_id=v_user
      and g.revoked_at is null
      and (g.expires_at is null or g.expires_at>now())
    order by g.created_at desc limit 1;

    if not found then
      if nullif(lower(trim(coalesce(p_code,''))),'') is null then
        return jsonb_build_object('allowed',false,'code','code_required');
      end if;
      select * into v_code
      from public.nh7_library_access_codes
      where code_hash=encode(digest(lower(trim(p_code)),'sha256'),'hex')
        and is_active
      for update;
      if not found then return jsonb_build_object('allowed',false,'code','invalid_code'); end if;
      if v_code.expires_at is not null and v_code.expires_at<=now() then
        return jsonb_build_object('allowed',false,'code','expired');
      end if;
      if v_code.max_uses is not null and v_code.use_count>=v_code.max_uses then
        return jsonb_build_object('allowed',false,'code','max_uses');
      end if;

      insert into public.nh7_library_user_grants_v230(user_id,user_email,code_id,expires_at,revoked_at,created_at,updated_at)
      values(v_user,v_email,v_code.id,v_code.expires_at,null,now(),now())
      on conflict(user_id,code_id) do update set
        user_email=excluded.user_email,
        expires_at=excluded.expires_at,
        revoked_at=null,
        updated_at=now()
      returning * into v_grant;
      update public.nh7_library_access_codes
        set use_count=use_count+1,updated_at=now()
        where id=v_code.id;
      v_new_redemption:=true;
    end if;
  end if;

  insert into public.nh7_library_access_log(code_id,item_id,user_email,device_id,accessed_at)
  values(case when v_item.audience='ministers' then v_grant.code_id else null end,
         v_item.id,v_email,left(coalesce(p_device_id,''),160),now());

  return jsonb_build_object(
    'allowed',true,
    'storage_path',v_item.storage_path,
    'title_fa',v_item.title_fa,'title_en',v_item.title_en,'title_hr',v_item.title_hr,
    'file_name',v_item.file_name,'mime_type',v_item.mime_type,
    'audience',v_item.audience,'resource_type',v_item.resource_type,
    'apocrypha_book',v_item.apocrypha_book,
    'grant_active',v_item.audience<>'ministers' or v_grant.id is not null,
    'new_redemption',v_new_redemption
  );
end;
$$;
revoke all on function public.nh7_library_authorize_v230(uuid,text,text,uuid,text) from public,anon,authenticated;
grant execute on function public.nh7_library_authorize_v230(uuid,text,text,uuid,text) to service_role;

-- -------------------------------------------------------------------------
-- 4) Remove anonymous catalogue/file access. Edge Functions now return
--    short-lived signed URLs only after account + school approval.
-- -------------------------------------------------------------------------
drop policy if exists "public read published sermons" on public.sermons;
drop policy if exists "NH7 public read audio bible books" on public.audio_bible_books;
drop policy if exists "audio bible books public read" on public.audio_bible_books;
drop policy if exists "NH7 public read audio bible chapters" on public.audio_bible_chapters;
drop policy if exists "audio bible chapters public read" on public.audio_bible_chapters;
drop policy if exists "NH7 library catalog read" on public.nh7_library_items;

revoke select on public.sermons from anon;
revoke select on public.audio_bible_books,public.audio_bible_chapters from anon;
revoke select on public.nh7_library_items from anon;

-- Views must respect the caller's RLS instead of view-owner privileges.
do $$ begin
  execute 'alter view public.audio_bible_books_v220 set (security_invoker=true)';
exception when others then null; end $$;
do $$ begin
  execute 'alter view public.audio_bible_chapters_v220 set (security_invoker=true)';
exception when others then null; end $$;
do $$ begin
  execute 'alter view public.nh7_library_items_v222 set (security_invoker=true)';
exception when others then null; end $$;
do $$ begin
  execute 'alter view public.nh7_library_items_v224 set (security_invoker=true)';
exception when others then null; end $$;
revoke select on public.audio_bible_books_v220,public.audio_bible_chapters_v220 from anon;
revoke select on public.nh7_library_items_v222,public.nh7_library_items_v224 from anon;

update storage.buckets set public=false where id='church-audio';
drop policy if exists "public read church audio" on storage.objects;

notify pgrst,'reload schema';
