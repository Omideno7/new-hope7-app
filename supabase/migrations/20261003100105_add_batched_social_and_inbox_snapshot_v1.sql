
create or replace function public.nh7_sermon_social_batch_v444(
  p_sermon_ids uuid[],
  p_limit integer default 20
)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public','private','pg_catalog'
as $function$
declare
  v_uid uuid:=auth.uid();
  v_limit integer:=least(greatest(coalesce(p_limit,20),1),20);
  v_ids uuid[];
  v_admin boolean:=false;
  v_items jsonb:='[]'::jsonb;
begin
  if p_sermon_ids is null or cardinality(p_sermon_ids)=0 then
    return jsonb_build_object('ok',true,'items','[]'::jsonb);
  end if;

  select coalesce(array_agg(x.id),'{}'::uuid[])
  into v_ids
  from (
    select distinct u.id
    from unnest(p_sermon_ids[1:20]) as u(id)
    join public.sermons s on s.id=u.id and s.is_published=true
  ) x;

  if v_uid is not null then
    select exists(
      select 1 from private.nh7_admin_members_v350 m
      where m.user_id=v_uid and m.is_active=true
    ) into v_admin;
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'ok',true,
      'sermon_id',s.id,
      'like_count',coalesce(l.like_count,0),
      'liked',coalesce(l.liked,false),
      'signed_in',v_uid is not null,
      'is_admin',v_admin,
      'blessings',coalesce(b.blessings,'[]'::jsonb)
    )
    order by array_position(v_ids,s.id)
  ),'[]'::jsonb)
  into v_items
  from public.sermons s
  left join lateral (
    select
      count(*)::integer as like_count,
      coalesce(bool_or(x.user_id=v_uid),false) as liked
    from public.nh7_sermon_likes_v440 x
    where x.sermon_id=s.id
  ) l on true
  left join lateral (
    select coalesce(jsonb_agg(z.obj order by z.created_at desc),'[]'::jsonb) as blessings
    from (
      select b.created_at,
        jsonb_build_object(
          'id',b.id,
          'display_name',b.display_name,
          'blessing_text',b.blessing_text,
          'created_at',b.created_at,
          'can_delete',(v_uid is not null and (b.user_id=v_uid or v_admin))
        ) obj
      from public.nh7_sermon_blessings_v440 b
      where b.sermon_id=s.id and b.is_hidden=false
      order by b.created_at desc
      limit v_limit
    ) z
  ) b on true
  where s.id=any(v_ids);

  return jsonb_build_object('ok',true,'items',v_items);
end;
$function$;

grant execute on function public.nh7_sermon_social_batch_v444(uuid[],integer) to anon, authenticated;

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
    select n.id,n.title,n.body,n.category,n.language,n.delivered_at,n.read_at,n.admin_deleted_at
    from public.notification_inbox n
    where n.admin_deleted_at is null
      and v_device<>'unknown'
      and n.device_id=v_device

    union

    select n.id,n.title,n.body,n.category,n.language,n.delivered_at,n.read_at,n.admin_deleted_at
    from public.notification_inbox n
    where n.admin_deleted_at is null
      and v_email<>''
      and lower(n.user_email)=v_email

    union

    select n.id,n.title,n.body,n.category,n.language,n.delivered_at,n.read_at,n.admin_deleted_at
    from public.notification_inbox n
    where n.admin_deleted_at is null
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
