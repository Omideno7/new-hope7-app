-- REVIEW ONLY: exact current snapshot plus new-row UID/category fence and typed intent fields.
create or replace function public.nh7_inbox_snapshot_v419(
  p_language text default 'en',
  p_message_limit integer default 200,
  p_receipt_limit integer default 500
)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_lang text:=case when lower(trim(coalesce(p_language,''))) in ('fa','en','hr') then lower(trim(p_language)) else 'en' end;
  v_device text:=public.nh7_device_id();
  v_user_key text:=public.nh7_request_user_key();
  v_email text:='';
  v_message_limit integer:=least(greatest(coalesce(p_message_limit,200),1),300);
  v_receipt_limit integer:=least(greatest(coalesce(p_receipt_limit,500),1),1000);
  v_messages jsonb:='[]'::jsonb;
  v_receipts jsonb:='[]'::jsonb;
begin
  if v_user_key like 'email:%' then
    v_email:=substr(v_user_key,7);
  end if;

  with permitted as (
    select n.id,n.title,n.body,n.category,n.language,n.delivered_at,n.read_at,n.admin_deleted_at,n.recipient_uid,n.intent
    from public.notification_inbox n
    where n.admin_deleted_at is null
      and (n.recipient_uid is null or n.recipient_uid=auth.uid() and (n.category not like 'admin_event_%' or private.nh7_notification_event_allowed_wave4(auth.uid(),replace(n.category,'admin_event_',''))))
      and v_device<>'unknown'
      and n.device_id=v_device

    union

    select n.id,n.title,n.body,n.category,n.language,n.delivered_at,n.read_at,n.admin_deleted_at,n.recipient_uid,n.intent
    from public.notification_inbox n
    where n.admin_deleted_at is null
      and (n.recipient_uid is null or n.recipient_uid=auth.uid() and (n.category not like 'admin_event_%' or private.nh7_notification_event_allowed_wave4(auth.uid(),replace(n.category,'admin_event_',''))))
      and v_email<>''
      and lower(n.user_email)=v_email

    union

    select n.id,n.title,n.body,n.category,n.language,n.delivered_at,n.read_at,n.admin_deleted_at,n.recipient_uid,n.intent
    from public.notification_inbox n
    where n.admin_deleted_at is null
      and (n.recipient_uid is null or n.recipient_uid=auth.uid() and (n.category not like 'admin_event_%' or private.nh7_notification_event_allowed_wave4(auth.uid(),replace(n.category,'admin_event_',''))))
      and n.device_id is null
      and n.user_email is null
      and lower(coalesce(n.language,'en'))=v_lang
  ),
  limited as (
    select *
    from permitted
    order by delivered_at desc
    limit v_message_limit
  )
  select coalesce(jsonb_agg(to_jsonb(limited) order by delivered_at desc),'[]'::jsonb)
  into v_messages
  from limited;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'message_id',r.message_id,
      'read_at',r.read_at,
      'deleted_at',r.deleted_at
    )
    order by r.updated_at desc
  ),'[]'::jsonb)
  into v_receipts
  from (
    select message_id,read_at,deleted_at,updated_at
    from public.notification_inbox_receipts
    where user_key=v_user_key
    order by updated_at desc
    limit v_receipt_limit
  ) r;

  return jsonb_build_object(
    'ok',true,
    'user_key',v_user_key,
    'messages',v_messages,
    'receipts',v_receipts
  );
end;
$function$;

grant execute on function public.nh7_inbox_snapshot_v419(text,integer,integer) to anon, authenticated;
