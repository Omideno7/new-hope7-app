-- New Hope 7 — Private Student Photo v127
-- Additive opt-in photo backend only. Reuses existing private nh7-document-assets bucket.
-- Exact path contract: student-photos/<auth.uid()>/profile.(jpg|jpeg|png|webp)
-- No certificate, Course Studio, multi-course, or public photo exposure is added.

do $preflight$
declare
  v_public boolean;
  v_mimes text[];
  v_partial bigint;
begin
  select b.public,b.allowed_mime_types into v_public,v_mimes
  from storage.buckets b where b.id='nh7-document-assets';
  if not found or v_public then
    raise exception 'nh7-document-assets private bucket is required';
  end if;
  if not (array['image/jpeg','image/png','image/webp']::text[] <@ coalesce(v_mimes,'{}'::text[])) then
    raise exception 'required student photo mime types are not allowed by bucket';
  end if;
  if to_regprocedure('public.nh7_my_student_identity_v127()') is null then
    raise exception 'Student Identity v127 RPC is required';
  end if;
  if to_regprocedure('public.nh7_set_my_student_photo_v127(text)') is not null then
    raise exception 'student photo setter already exists';
  end if;

  select count(*) into v_partial
  from pg_policies
  where schemaname='storage' and tablename='objects'
    and policyname in ('nh7 student photo select own v127','nh7 student photo insert own v127','nh7 student photo update own v127','nh7 student photo delete own v127');
  if v_partial<>0 then raise exception 'student photo Storage policies partially exist: %',v_partial; end if;

  if exists(select 1 from storage.objects where bucket_id='nh7-document-assets' and name like 'student-photos/%')
     or exists(select 1 from public.school_student_identities where coalesce(photo_path,'')<>'') then
    raise exception 'student photo data already exists; manual review required';
  end if;
end
$preflight$;

create policy "nh7 student photo select own v127"
on storage.objects for select to authenticated
using (
  bucket_id='nh7-document-assets'
  and storage.foldername(name)=array['student-photos',(select auth.uid())::text]
  and storage.filename(name)=any(array['profile.jpg','profile.jpeg','profile.png','profile.webp']::text[])
  and owner_id=(select auth.uid())::text
  and jsonb_typeof(public.nh7_my_student_identity_v127()->'student')='object'
);

create policy "nh7 student photo insert own v127"
on storage.objects for insert to authenticated
with check (
  bucket_id='nh7-document-assets'
  and storage.foldername(name)=array['student-photos',(select auth.uid())::text]
  and storage.filename(name)=any(array['profile.jpg','profile.jpeg','profile.png','profile.webp']::text[])
  and owner_id=(select auth.uid())::text
  and jsonb_typeof(public.nh7_my_student_identity_v127()->'student')='object'
);

create policy "nh7 student photo update own v127"
on storage.objects for update to authenticated
using (
  bucket_id='nh7-document-assets'
  and storage.foldername(name)=array['student-photos',(select auth.uid())::text]
  and storage.filename(name)=any(array['profile.jpg','profile.jpeg','profile.png','profile.webp']::text[])
  and owner_id=(select auth.uid())::text
  and jsonb_typeof(public.nh7_my_student_identity_v127()->'student')='object'
)
with check (
  bucket_id='nh7-document-assets'
  and storage.foldername(name)=array['student-photos',(select auth.uid())::text]
  and storage.filename(name)=any(array['profile.jpg','profile.jpeg','profile.png','profile.webp']::text[])
  and owner_id=(select auth.uid())::text
  and jsonb_typeof(public.nh7_my_student_identity_v127()->'student')='object'
);

create policy "nh7 student photo delete own v127"
on storage.objects for delete to authenticated
using (
  bucket_id='nh7-document-assets'
  and storage.foldername(name)=array['student-photos',(select auth.uid())::text]
  and storage.filename(name)=any(array['profile.jpg','profile.jpeg','profile.png','profile.webp']::text[])
  and owner_id=(select auth.uid())::text
  and jsonb_typeof(public.nh7_my_student_identity_v127()->'student')='object'
);

create or replace function public.nh7_set_my_student_photo_v127(p_photo_path text)
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_uid uuid:=(select auth.uid());
  v_path text:=trim(coalesce(p_photo_path,''));
  v_size bigint;
  v_mime text;
begin
  if v_uid is null then raise exception 'login_required'; end if;

  if not exists(select 1 from public.school_student_identities i where i.user_id=v_uid and i.status='active') then
    raise exception 'student_identity_required';
  end if;

  if v_path<>'' and v_path !~ ('^student-photos/'||v_uid::text||'/profile\.(jpg|jpeg|png|webp)$') then
    raise exception 'invalid_student_photo_path';
  end if;

  if v_path<>'' then
    select nullif(o.metadata->>'size','')::bigint,lower(coalesce(o.metadata->>'mimetype',''))
      into v_size,v_mime
    from storage.objects o
    where o.bucket_id='nh7-document-assets' and o.name=v_path and o.owner_id=v_uid::text
    limit 1;
    if not found then raise exception 'student_photo_not_found'; end if;
    if v_size is null or v_size<1 or v_size>5*1024*1024 then raise exception 'student_photo_size_invalid'; end if;
    if v_mime not in ('image/jpeg','image/png','image/webp') then raise exception 'student_photo_mime_invalid'; end if;
  end if;

  update public.school_student_identities i
     set photo_path=nullif(v_path,''),updated_at=now()
   where i.user_id=v_uid and i.status='active';

  return jsonb_build_object('ok',true,'has_photo',v_path<>'');
end;
$function$;

revoke all on function public.nh7_set_my_student_photo_v127(text) from public,anon,authenticated,service_role;
grant execute on function public.nh7_set_my_student_photo_v127(text) to authenticated;

do $postflight$
declare
  v_policy_count bigint;
  v_config text[];
begin
  select count(*) into v_policy_count
  from pg_policies
  where schemaname='storage' and tablename='objects'
    and policyname in ('nh7 student photo select own v127','nh7 student photo insert own v127','nh7 student photo update own v127','nh7 student photo delete own v127');
  if v_policy_count<>4 then raise exception 'student photo policy count failed: %',v_policy_count; end if;

  select coalesce(p.proconfig,'{}'::text[]) into v_config
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='nh7_set_my_student_photo_v127' limit 1;
  if not ('search_path=""'=any(v_config)) then raise exception 'student photo setter search_path not pinned empty: %',v_config; end if;
  if has_function_privilege('anon','public.nh7_set_my_student_photo_v127(text)','EXECUTE')
     or has_function_privilege('public','public.nh7_set_my_student_photo_v127(text)','EXECUTE')
     or has_function_privilege('service_role','public.nh7_set_my_student_photo_v127(text)','EXECUTE')
     or not has_function_privilege('authenticated','public.nh7_set_my_student_photo_v127(text)','EXECUTE') then
    raise exception 'student photo setter ACL postflight failed';
  end if;
end
$postflight$;

notify pgrst,'reload schema';