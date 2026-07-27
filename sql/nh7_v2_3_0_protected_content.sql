-- New Hope 7 v2.3.0
-- Protected audio/library access + account-bound ministers codes
-- IMPORTANT ORDER:
-- 1) Upload the v2.3.0 app files and deploy nh7-protected-content-v230.
-- 2) Run this SQL once in Supabase SQL Editor.

begin;

create extension if not exists pgcrypto;

-- A ministers code is redeemed once for an authenticated account. Reopening
-- protected documents does not consume another use from the same account.
create table if not exists public.nh7_library_code_grants (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.nh7_library_access_codes(id) on delete cascade,
  user_id uuid not null,
  user_email text not null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(code_id,user_id)
);

create index if not exists nh7_library_code_grants_user_idx
  on public.nh7_library_code_grants(user_id,revoked_at);

-- Optional item restrictions. When a code has no rows here it remains valid
-- for all ministers items. When mappings exist, it works only for mapped items.
create table if not exists public.nh7_library_code_items (
  code_id uuid not null references public.nh7_library_access_codes(id) on delete cascade,
  item_id uuid not null references public.nh7_library_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(code_id,item_id)
);

alter table public.nh7_library_code_grants enable row level security;
alter table public.nh7_library_code_items enable row level security;

drop policy if exists "NH7 admin manage library code grants" on public.nh7_library_code_grants;
create policy "NH7 admin manage library code grants"
  on public.nh7_library_code_grants
  for all to authenticated
  using (public.nh7_is_admin())
  with check (public.nh7_is_admin());

drop policy if exists "NH7 admin manage library code items" on public.nh7_library_code_items;
create policy "NH7 admin manage library code items"
  on public.nh7_library_code_items
  for all to authenticated
  using (public.nh7_is_admin())
  with check (public.nh7_is_admin());

-- Server-authoritative school approval. A device id or typed email is not
-- enough: the caller must have a valid authenticated Supabase account.
create or replace function public.nh7_my_protected_access_v230()
returns jsonb
language plpgsql
stable
security definer
set search_path='public'
as $$
declare
  v_email text := lower(trim(coalesce(auth.jwt()->>'email','')));
  v_uid uuid := auth.uid();
  v_status text := 'guest';
  v_registration_id uuid;
begin
  if auth.role()<>'authenticated' or v_uid is null or v_email='' then
    return jsonb_build_object(
      'allowed',false,
      'status','login_required',
      'email',v_email
    );
  end if;

  select r.status,r.id
    into v_status,v_registration_id
  from public.registrations r
  where r.type='school'
    and lower(trim(coalesce(r.payload->>'email','')))=v_email
  order by
    case r.status when 'approved' then 0 when 'pending' then 1 else 2 end,
    r.updated_at desc nulls last,
    r.created_at desc nulls last
  limit 1;

  v_status:=coalesce(v_status,'not_registered');
  return jsonb_build_object(
    'allowed',v_status='approved',
    'status',v_status,
    'email',v_email,
    'user_id',v_uid,
    'registration_id',v_registration_id
  );
end;
$$;

create or replace function public.nh7_has_protected_access_v230()
returns boolean
language sql
stable
security definer
set search_path='public'
as $$
  select coalesce((public.nh7_my_protected_access_v230()->>'allowed')::boolean,false)
$$;

revoke all on function public.nh7_my_protected_access_v230() from public;
revoke all on function public.nh7_has_protected_access_v230() from public;
grant execute on function public.nh7_my_protected_access_v230() to authenticated;
grant execute on function public.nh7_has_protected_access_v230() to authenticated;

-- Secure library authorization with account-bound code redemption.
create or replace function public.nh7_library_authorize_v230(
  p_item_id uuid,
  p_code text default ''
)
returns jsonb
language plpgsql
security definer
set search_path='public'
as $$
declare
  v_item public.nh7_library_items;
  v_code public.nh7_library_access_codes;
  v_email text := lower(trim(coalesce(auth.jwt()->>'email','')));
  v_uid uuid := auth.uid();
  v_access jsonb;
  v_grant public.nh7_library_code_grants;
  v_new_grant_count integer := 0;
  v_has_item_rules boolean := false;
begin
  v_access:=public.nh7_my_protected_access_v230();
  if not coalesce((v_access->>'allowed')::boolean,false) then
    return jsonb_build_object('allowed',false,'code',coalesce(v_access->>'status','school_approval_required'));
  end if;

  select * into v_item
  from public.nh7_library_items
  where id=p_item_id and is_active and is_published;

  if not found then
    return jsonb_build_object('allowed',false,'code','item_not_found');
  end if;

  if v_item.audience='ministers' then
    -- Reuse a previously redeemed, active account grant when no code is typed.
    if nullif(trim(coalesce(p_code,'')),'') is null then
      select g.* into v_grant
      from public.nh7_library_code_grants g
      join public.nh7_library_access_codes c on c.id=g.code_id
      where g.user_id=v_uid
        and g.revoked_at is null
        and (g.expires_at is null or g.expires_at>now())
        and c.is_active
        and (c.expires_at is null or c.expires_at>now())
        and (
          not exists(select 1 from public.nh7_library_code_items m where m.code_id=c.id)
          or exists(select 1 from public.nh7_library_code_items m where m.code_id=c.id and m.item_id=v_item.id)
        )
      order by g.granted_at desc
      limit 1;

      if not found then
        return jsonb_build_object('allowed',false,'code','code_required');
      end if;
    else
      select * into v_code
      from public.nh7_library_access_codes
      where code_hash=encode(digest(lower(trim(p_code)),'sha256'),'hex')
        and is_active
      for update;

      if not found then return jsonb_build_object('allowed',false,'code','invalid_code'); end if;
      if v_code.expires_at is not null and v_code.expires_at<=now() then
        return jsonb_build_object('allowed',false,'code','expired');
      end if;

      select exists(select 1 from public.nh7_library_code_items m where m.code_id=v_code.id)
        into v_has_item_rules;
      if v_has_item_rules and not exists(
        select 1 from public.nh7_library_code_items m
        where m.code_id=v_code.id and m.item_id=v_item.id
      ) then
        return jsonb_build_object('allowed',false,'code','code_not_allowed_for_item');
      end if;

      select * into v_grant
      from public.nh7_library_code_grants
      where code_id=v_code.id and user_id=v_uid and revoked_at is null
      limit 1;

      if not found then
        if v_code.max_uses is not null and v_code.use_count>=v_code.max_uses then
          return jsonb_build_object('allowed',false,'code','max_uses');
        end if;

        insert into public.nh7_library_code_grants(
          code_id,user_id,user_email,expires_at,granted_at,created_at,updated_at
        ) values(
          v_code.id,v_uid,v_email,v_code.expires_at,now(),now(),now()
        )
        on conflict(code_id,user_id) do update
          set revoked_at=null,
              expires_at=excluded.expires_at,
              user_email=excluded.user_email,
              updated_at=now()
        returning * into v_grant;

        get diagnostics v_new_grant_count = row_count;
        if v_new_grant_count>0 then
          update public.nh7_library_access_codes
          set use_count=use_count+1,updated_at=now()
          where id=v_code.id;
        end if;
      end if;
    end if;
  end if;

  insert into public.nh7_library_access_log(code_id,item_id,user_email,device_id,accessed_at)
  values(
    case when v_item.audience='ministers' then v_grant.code_id else null end,
    v_item.id,
    v_email,
    left(coalesce(current_setting('request.headers',true)::jsonb->>'x-device-id',''),160),
    now()
  );

  return jsonb_build_object(
    'allowed',true,
    'storage_path',v_item.storage_path,
    'title_fa',v_item.title_fa,
    'title_en',v_item.title_en,
    'title_hr',v_item.title_hr,
    'file_name',v_item.file_name,
    'mime_type',v_item.mime_type,
    'audience',v_item.audience,
    'resource_type',v_item.resource_type,
    'apocrypha_book',v_item.apocrypha_book
  );
end;
$$;

revoke all on function public.nh7_library_authorize_v230(uuid,text) from public;
grant execute on function public.nh7_library_authorize_v230(uuid,text) to authenticated;

-- Admin can optionally restrict a code to selected items.
create or replace function public.nh7_admin_library_bind_code_v230(
  p_code_id uuid,
  p_item_id uuid,
  p_enabled boolean default true
)
returns boolean
language plpgsql
security definer
set search_path='public'
as $$
begin
  if not public.nh7_is_admin() then raise exception 'Admin access required'; end if;
  if p_enabled then
    insert into public.nh7_library_code_items(code_id,item_id)
    values(p_code_id,p_item_id)
    on conflict do nothing;
  else
    delete from public.nh7_library_code_items where code_id=p_code_id and item_id=p_item_id;
  end if;
  return true;
end;
$$;

revoke all on function public.nh7_admin_library_bind_code_v230(uuid,uuid,boolean) from public;
grant execute on function public.nh7_admin_library_bind_code_v230(uuid,uuid,boolean) to authenticated;

-- Remove anonymous metadata/file URL access. Admins remain able to manage data.
drop policy if exists "public read published sermons" on public.sermons;
drop policy if exists "NH7 approved users read sermons v230" on public.sermons;
create policy "NH7 approved users read sermons v230"
  on public.sermons for select to authenticated
  using (is_published and (public.nh7_has_protected_access_v230() or public.nh7_is_admin()));
revoke select on public.sermons from anon;
grant select on public.sermons to authenticated;

alter table public.audio_bible_books_v220 enable row level security;
alter table public.audio_bible_chapters_v220 enable row level security;

drop policy if exists "NH7 approved users read audio bible books v230" on public.audio_bible_books_v220;
create policy "NH7 approved users read audio bible books v230"
  on public.audio_bible_books_v220 for select to authenticated
  using (is_active and (public.nh7_has_protected_access_v230() or public.nh7_is_admin()));

drop policy if exists "NH7 admin manage audio bible books v230" on public.audio_bible_books_v220;
create policy "NH7 admin manage audio bible books v230"
  on public.audio_bible_books_v220 for all to authenticated
  using (public.nh7_is_admin()) with check (public.nh7_is_admin());

drop policy if exists "NH7 approved users read audio bible chapters v230" on public.audio_bible_chapters_v220;
create policy "NH7 approved users read audio bible chapters v230"
  on public.audio_bible_chapters_v220 for select to authenticated
  using (is_published and (public.nh7_has_protected_access_v230() or public.nh7_is_admin()));

drop policy if exists "NH7 admin manage audio bible chapters v230" on public.audio_bible_chapters_v220;
create policy "NH7 admin manage audio bible chapters v230"
  on public.audio_bible_chapters_v220 for all to authenticated
  using (public.nh7_is_admin()) with check (public.nh7_is_admin());

revoke select on public.audio_bible_books_v220 from anon;
revoke select on public.audio_bible_chapters_v220 from anon;
grant select on public.audio_bible_books_v220 to authenticated;
grant select on public.audio_bible_chapters_v220 to authenticated;

drop policy if exists "NH7 library catalog read" on public.nh7_library_items;
drop policy if exists "NH7 approved users read library catalog v230" on public.nh7_library_items;
create policy "NH7 approved users read library catalog v230"
  on public.nh7_library_items for select to authenticated
  using ((is_published and is_active and public.nh7_has_protected_access_v230()) or public.nh7_is_admin());

alter view public.nh7_library_items_v224 set (security_invoker=true);
revoke select on public.nh7_library_items from anon;
revoke select on public.nh7_library_items_v224 from anon;
grant select on public.nh7_library_items to authenticated;
grant select on public.nh7_library_items_v224 to authenticated;

-- Audio becomes private. The v2.3.0 Edge Function issues short-lived URLs only
-- after authenticated school approval.
update storage.buckets set public=false where id='church-audio';
drop policy if exists "public read church audio" on storage.objects;

commit;
