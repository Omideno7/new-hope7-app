-- New Hope 7 — fix Prayer replies + safe revoked-document permanent deletion + public document assets v507
-- No existing prayer, document, School, exam, assignment, or progress row is deleted by this migration.

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
  'nh7-public-document-assets',
  'nh7-public-document-assets',
  true,
  15728640,
  array['image/jpeg','image/png','image/webp','image/gif']::text[]
)
on conflict (id) do update
set public=true,
    file_size_limit=excluded.file_size_limit,
    allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "NH7 admin manage public document assets" on storage.objects;
create policy "NH7 admin manage public document assets"
on storage.objects
for all
to authenticated
using (
  bucket_id='nh7-public-document-assets'
  and (select public.nh7_is_admin())
)
with check (
  bucket_id='nh7-public-document-assets'
  and (select public.nh7_is_admin())
);

create or replace function public.nh7_owner_prayer_reply_v505(
  p_id uuid,
  p_status text,
  p_admin_note text
)
returns public.nh7_prayer_requests_v502
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_row public.nh7_prayer_requests_v502;
  v_email text;
  v_lang text;
  v_title text;
  v_note text := pg_catalog.btrim(coalesce(p_admin_note,''));
  v_dedupe text;
begin
  if not coalesce(public.nh7_admin_has_permission_v395('community.prayer.manage'),false) then
    raise exception 'not authorized';
  end if;
  if p_status not in ('new','praying','completed') then
    raise exception 'invalid prayer status';
  end if;
  if v_note='' then
    raise exception 'prayer reply message is required';
  end if;

  select * into v_row
  from public.nh7_prayer_requests_v502 r
  where r.id=p_id
  for update;
  if v_row.id is null then raise exception 'prayer request not found'; end if;

  update public.nh7_prayer_requests_v502
     set status=p_status,
         admin_note=v_note,
         reviewed_by=(select auth.uid()),
         prayed_at=case when p_status='praying' and prayed_at is null then pg_catalog.now() else prayed_at end,
         completed_at=case when p_status='completed' then coalesce(completed_at,pg_catalog.now()) when p_status<>'completed' then null else completed_at end
   where id=p_id
   returning * into v_row;

  select pg_catalog.lower(u.email) into v_email
  from auth.users u
  where u.id=v_row.user_id
  limit 1;

  if coalesce(v_email,'')<>'' then
    v_lang:=case when pg_catalog.lower(coalesce(v_row.language,'')) in ('fa','en','hr') then pg_catalog.lower(v_row.language) else 'fa' end;
    v_title:=case v_lang
      when 'en' then 'Message from the prayer team'
      when 'hr' then 'Poruka molitvenog tima'
      else 'پیام تیم دعا'
    end;
    v_dedupe:='prayer-reply:'||p_id::text||':'||pg_catalog.md5(v_note);
    insert into public.notification_inbox(user_email,title,body,category,language,delivered_at,dedupe_key)
    values(v_email,v_title,v_note,'prayer_reply',v_lang,pg_catalog.now(),v_dedupe)
    on conflict (dedupe_key) do nothing;
  end if;

  return v_row;
end;
$function$;

revoke all on function public.nh7_owner_prayer_reply_v505(uuid,text,text) from public,anon;
grant execute on function public.nh7_owner_prayer_reply_v505(uuid,text,text) to authenticated,service_role;

create or replace function public.nh7_admin_delete_document_v507(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_row public.school_certificates;
  v_asset_urls jsonb := '[]'::jsonb;
  v_url text;
  v_deleted_inbox integer := 0;
begin
  if not coalesce(public.nh7_is_admin(),false) then
    raise exception 'Admin access required';
  end if;

  select * into v_row
  from public.school_certificates c
  where c.id=p_id
  for update;
  if v_row.id is null then raise exception 'document not found'; end if;
  if pg_catalog.lower(coalesce(v_row.status,''))<>'revoked' then
    raise exception 'revoke document before permanent deletion';
  end if;
  if pg_catalog.lower(coalesce(v_row.certificate_type,'')) in ('school','school_completion')
     or (coalesce(v_row.course_code,'')<>'' and v_row.course_code not like 'document:%') then
    raise exception 'school certificates cannot be permanently deleted';
  end if;

  foreach v_url in array array[v_row.photo_url,v_row.logo_url,v_row.signature_url] loop
    if coalesce(v_url,'')<>''
       and v_url like '%/storage/v1/object/public/%'
       and not exists(
         select 1 from public.school_certificates c2
         where c2.id<>p_id and to_jsonb(c2)::text like '%'||v_url||'%'
       )
       and not exists(
         select 1 from public.document_templates t
         where to_jsonb(t)::text like '%'||v_url||'%'
       ) then
      v_asset_urls:=v_asset_urls||jsonb_build_array(v_url);
    end if;
  end loop;

  if coalesce(v_row.user_email,'')<>'' and coalesce(v_row.certificate_number,'')<>'' then
    delete from public.notification_inbox_receipts r
    where r.message_id in (
      select n.id::text from public.notification_inbox n
      where pg_catalog.lower(coalesce(n.user_email,''))=pg_catalog.lower(v_row.user_email)
        and n.category='certificate'
        and coalesce(n.body,'') ilike '%'||v_row.certificate_number||'%'
    );

    delete from public.notification_inbox n
    where pg_catalog.lower(coalesce(n.user_email,''))=pg_catalog.lower(v_row.user_email)
      and n.category='certificate'
      and coalesce(n.body,'') ilike '%'||v_row.certificate_number||'%';
    get diagnostics v_deleted_inbox = row_count;
  end if;

  delete from public.school_certificates where id=p_id;

  return jsonb_build_object(
    'ok',true,
    'deleted_id',p_id,
    'certificate_number',v_row.certificate_number,
    'deleted_inbox_rows',v_deleted_inbox,
    'asset_urls',v_asset_urls
  );
end;
$function$;

revoke all on function public.nh7_admin_delete_document_v507(uuid) from public,anon;
grant execute on function public.nh7_admin_delete_document_v507(uuid) to authenticated,service_role;

create or replace function public.nh7_admin_delete_document_v505(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  perform public.nh7_admin_delete_document_v507(p_id);
  return true;
end;
$function$;

revoke all on function public.nh7_admin_delete_document_v505(uuid) from public,anon;
grant execute on function public.nh7_admin_delete_document_v505(uuid) to authenticated,service_role;

notify pgrst,'reload schema';