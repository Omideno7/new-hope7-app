-- New Hope 7 — Prayer reply delivery + guarded test-document deletion v505
-- Additive/backward-compatible: existing Store clients and existing data paths remain valid.

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
  v_note text := pg_catalog.btrim(pg_catalog.coalesce(p_admin_note,''));
  v_dedupe text;
begin
  if not pg_catalog.coalesce(public.nh7_admin_has_permission_v395('community.prayer.manage'),false) then
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
         completed_at=case when p_status='completed' then pg_catalog.coalesce(completed_at,pg_catalog.now()) when p_status<>'completed' then null else completed_at end
   where id=p_id
   returning * into v_row;

  select pg_catalog.lower(u.email) into v_email
  from auth.users u
  where u.id=v_row.user_id
  limit 1;

  if pg_catalog.coalesce(v_email,'')<>'' then
    v_lang:=case when pg_catalog.lower(pg_catalog.coalesce(v_row.language,'')) in ('fa','en','hr') then pg_catalog.lower(v_row.language) else 'fa' end;
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

create or replace function public.nh7_admin_delete_document_v505(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_row public.school_certificates;
begin
  if not pg_catalog.coalesce(public.nh7_is_admin(),false) then
    raise exception 'Admin access required';
  end if;

  select * into v_row
  from public.school_certificates c
  where c.id=p_id
  for update;
  if v_row.id is null then raise exception 'document not found'; end if;
  if pg_catalog.lower(pg_catalog.coalesce(v_row.status,''))<>'revoked' then
    raise exception 'revoke document before permanent deletion';
  end if;
  if pg_catalog.lower(pg_catalog.coalesce(v_row.certificate_type,'')) in ('school','school_completion') then
    raise exception 'school certificates cannot be permanently deleted';
  end if;
  if v_row.inbox_sent_at is not null then
    raise exception 'documents already delivered to a user cannot be permanently deleted';
  end if;

  delete from public.school_certificates where id=p_id;
  return found;
end;
$function$;

revoke all on function public.nh7_admin_delete_document_v505(uuid) from public,anon;
grant execute on function public.nh7_admin_delete_document_v505(uuid) to authenticated,service_role;

notify pgrst,'reload schema';