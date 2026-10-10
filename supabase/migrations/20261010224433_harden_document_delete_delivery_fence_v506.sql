-- New Hope 7 — strengthen permanent document deletion delivery fence v506
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
  if pg_catalog.coalesce(v_row.user_email,'')<>'' and exists(
    select 1
    from public.notification_inbox n
    where pg_catalog.lower(pg_catalog.coalesce(n.user_email,''))=pg_catalog.lower(v_row.user_email)
      and n.category='certificate'
      and pg_catalog.coalesce(n.body,'') ilike '%'||v_row.certificate_number||'%'
  ) then
    raise exception 'documents with an existing Inbox delivery cannot be permanently deleted';
  end if;

  delete from public.school_certificates where id=p_id;
  return found;
end;
$function$;

revoke all on function public.nh7_admin_delete_document_v505(uuid) from public,anon;
grant execute on function public.nh7_admin_delete_document_v505(uuid) to authenticated,service_role;

notify pgrst,'reload schema';