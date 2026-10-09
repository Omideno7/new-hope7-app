-- New Hope 7 — Issue #127 Student Identity photo storage
-- REVIEW CANDIDATE ONLY. DO NOT APPLY DIRECTLY TO PRODUCTION.
-- Reuses existing private image bucket: nh7-document-assets.
-- Path contract: student-photos/<auth.uid()>/profile.<ext>

-- Existing bucket is private and already constrained to image mime types.
-- Existing Admin ALL policy remains authoritative for credential rendering.

-- Caller may read only their own Student Identity photo objects.
drop policy if exists "nh7 student photo select own v127" on storage.objects;
create policy "nh7 student photo select own v127"
on storage.objects for select to authenticated
using (
  bucket_id='nh7-document-assets'
  and (storage.foldername(name))[1]='student-photos'
  and (storage.foldername(name))[2]=(select auth.uid())::text
);

-- Caller may upload only under their own stable user-id folder.
drop policy if exists "nh7 student photo insert own v127" on storage.objects;
create policy "nh7 student photo insert own v127"
on storage.objects for insert to authenticated
with check (
  bucket_id='nh7-document-assets'
  and (storage.foldername(name))[1]='student-photos'
  and (storage.foldername(name))[2]=(select auth.uid())::text
);

-- Upsert/replace requires SELECT + INSERT + UPDATE in Supabase Storage.
drop policy if exists "nh7 student photo update own v127" on storage.objects;
create policy "nh7 student photo update own v127"
on storage.objects for update to authenticated
using (
  bucket_id='nh7-document-assets'
  and (storage.foldername(name))[1]='student-photos'
  and (storage.foldername(name))[2]=(select auth.uid())::text
)
with check (
  bucket_id='nh7-document-assets'
  and (storage.foldername(name))[1]='student-photos'
  and (storage.foldername(name))[2]=(select auth.uid())::text
);

drop policy if exists "nh7 student photo delete own v127" on storage.objects;
create policy "nh7 student photo delete own v127"
on storage.objects for delete to authenticated
using (
  bucket_id='nh7-document-assets'
  and (storage.foldername(name))[1]='student-photos'
  and (storage.foldername(name))[2]=(select auth.uid())::text
);

-- Store only an object path, never a public/signed URL, in Student Identity.
create or replace function public.nh7_set_my_student_photo_v127(p_photo_path text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_uid uuid:=auth.uid();
  v_path text:=trim(coalesce(p_photo_path,''));
  v_prefix text;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  v_prefix:='student-photos/'||v_uid::text||'/';

  if v_path<>'' and left(v_path,length(v_prefix))<>v_prefix then
    raise exception 'invalid_student_photo_path';
  end if;

  if not exists(
    select 1 from public.school_student_identities i
    where i.user_id=v_uid and i.status='active'
  ) then
    raise exception 'student_identity_required';
  end if;

  -- When setting a non-empty path, verify the object actually exists in the
  -- expected private bucket and belongs to this caller's folder.
  if v_path<>'' and not exists(
    select 1 from storage.objects o
    where o.bucket_id='nh7-document-assets' and o.name=v_path
  ) then
    raise exception 'student_photo_not_found';
  end if;

  update public.school_student_identities
  set photo_path=nullif(v_path,''),updated_at=now()
  where user_id=v_uid;

  return jsonb_build_object('ok',true,'has_photo',v_path<>'');
end;
$$;
revoke all on function public.nh7_set_my_student_photo_v127(text) from public,anon,authenticated;
grant execute on function public.nh7_set_my_student_photo_v127(text) to authenticated;

-- Own identity RPC v127 should expose only the caller's private path as needed
-- for authenticated rendering. The public certificate verifier never gets it.
create or replace function public.nh7_my_student_identity_v128()
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_uid uuid:=auth.uid();
  v_row public.school_student_identities;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  select * into v_row from public.school_student_identities i
  where i.user_id=v_uid and i.status='active' limit 1;
  if not found then return jsonb_build_object('ok',true,'student',null); end if;
  return jsonb_build_object('ok',true,'student',jsonb_build_object(
    'student_code',v_row.student_code,
    'display_name',v_row.display_name,
    'photo_path',v_row.photo_path,
    'has_photo',coalesce(v_row.photo_path,'')<>''
  ));
end;
$$;
revoke all on function public.nh7_my_student_identity_v128() from public,anon,authenticated;
grant execute on function public.nh7_my_student_identity_v128() to authenticated;

-- Public verification must never join/expose school_student_identities.photo_path.
