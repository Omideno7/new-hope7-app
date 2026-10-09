begin;

-- Backward-compatible public testimony feed: keep existing fields and add the legacy/client alias
-- expected by the currently published 2.5.0 app.
drop function if exists public.nh7_public_testimony_feed_v502(text, integer);
create function public.nh7_public_testimony_feed_v502(
  p_language text default '',
  p_limit integer default 50
)
returns table(
  id uuid,
  title text,
  display_name text,
  testimony_type text,
  note_text text,
  language text,
  show_name boolean,
  audio_public_path text,
  published_audio_path text,
  audio_url text,
  published_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path='public','pg_catalog'
as $function$
  select
    t.id,
    t.title,
    case when t.show_name then t.display_name else '' end,
    t.testimony_type,
    t.note_text,
    t.language,
    t.show_name,
    t.audio_public_path,
    t.audio_public_path,
    case when length(trim(t.audio_public_path)) > 0
      then 'https://gpzcwffxnddhaeaogdyo.supabase.co/storage/v1/object/public/nh7-testimony-published-v502/' || t.audio_public_path
      else '' end,
    t.published_at,
    t.created_at
  from public.nh7_testimonies_v502 t
  where t.status='published'
    and t.consent_public=true
    and (trim(coalesce(p_language,''))='' or t.language=trim(p_language))
    and (
      lower(trim(t.testimony_type)) not in ('healing','health','medical','شفا','درمان')
      or t.consent_health_public=true
    )
  order by coalesce(t.published_at,t.created_at) desc
  limit greatest(1,least(coalesce(p_limit,50),100));
$function$;
revoke all on function public.nh7_public_testimony_feed_v502(text,integer) from public;
grant execute on function public.nh7_public_testimony_feed_v502(text,integer) to anon, authenticated, service_role;

create or replace function public.nh7_owner_prayer_delete_v504(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path='public','private','pg_catalog'
as $function$
declare v_row public.nh7_prayer_requests_v502;
begin
  if not coalesce(public.nh7_admin_has_permission_v395('community.prayer.manage'),false) then
    raise exception 'not authorized';
  end if;
  select * into v_row from public.nh7_prayer_requests_v502 where id=p_id for update;
  if v_row.id is null then raise exception 'prayer request not found'; end if;
  delete from public.nh7_prayer_requests_v502 where id=p_id;
  return jsonb_build_object('ok',true,'deleted',true,'id',p_id);
end;
$function$;
revoke all on function public.nh7_owner_prayer_delete_v504(uuid) from public, anon;
grant execute on function public.nh7_owner_prayer_delete_v504(uuid) to authenticated, service_role;

create or replace function public.nh7_owner_testimony_delete_any_v504(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path='public','private','pg_catalog'
as $function$
declare v_row public.nh7_testimonies_v502;
begin
  if not coalesce(public.nh7_admin_has_permission_v395('community.testimony.review'),false) then
    raise exception 'not authorized';
  end if;
  select * into v_row from public.nh7_testimonies_v502 where id=p_id for update;
  if v_row.id is null then raise exception 'testimony not found'; end if;
  delete from public.nh7_testimonies_v502 where id=p_id;
  return jsonb_build_object(
    'ok',true,'deleted',true,'id',p_id,'status',v_row.status,
    'audio_submission_path',coalesce(v_row.audio_submission_path,''),
    'audio_public_path',coalesce(v_row.audio_public_path,'')
  );
end;
$function$;
revoke all on function public.nh7_owner_testimony_delete_any_v504(uuid) from public, anon;
grant execute on function public.nh7_owner_testimony_delete_any_v504(uuid) to authenticated, service_role;

create or replace function public.nh7_admin_sermon_blessing_hard_delete_v504(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path='public','private','pg_catalog'
as $function$
declare v_uid uuid:=auth.uid();
begin
  if v_uid is null or not exists(
    select 1 from private.nh7_admin_members_v350 m where m.user_id=v_uid and m.is_active=true
  ) then raise exception 'admin_required'; end if;
  if not exists(select 1 from public.nh7_sermon_blessings_v440 where id=p_id) then
    raise exception 'blessing_not_found';
  end if;
  delete from public.nh7_sermon_blessings_v440 where id=p_id;
  return jsonb_build_object('ok',true,'deleted',true,'id',p_id);
end;
$function$;
revoke all on function public.nh7_admin_sermon_blessing_hard_delete_v504(uuid) from public, anon;
grant execute on function public.nh7_admin_sermon_blessing_hard_delete_v504(uuid) to authenticated, service_role;

create or replace function public.nh7_owner_community_storage_stats_v504()
returns jsonb
language plpgsql
stable
security definer
set search_path='public','private','storage','pg_catalog'
as $function$
declare
  v_private_count bigint:=0; v_private_bytes bigint:=0;
  v_public_count bigint:=0; v_public_bytes bigint:=0;
  v_test_pending bigint:=0; v_test_published bigint:=0; v_test_rejected bigint:=0;
  v_prayers bigint:=0; v_bless_visible bigint:=0; v_bless_hidden bigint:=0;
begin
  if not (
    coalesce(public.nh7_admin_has_permission_v395('community.testimony.review'),false)
    or coalesce(public.nh7_admin_has_permission_v395('community.prayer.manage'),false)
  ) then raise exception 'not authorized'; end if;

  select count(*),coalesce(sum(coalesce((metadata->>'size')::bigint,0)),0)
    into v_private_count,v_private_bytes from storage.objects where bucket_id='nh7-testimony-submissions-v502';
  select count(*),coalesce(sum(coalesce((metadata->>'size')::bigint,0)),0)
    into v_public_count,v_public_bytes from storage.objects where bucket_id='nh7-testimony-published-v502';
  select count(*) filter(where status='pending'),count(*) filter(where status='published'),count(*) filter(where status='rejected')
    into v_test_pending,v_test_published,v_test_rejected from public.nh7_testimonies_v502;
  select count(*) into v_prayers from public.nh7_prayer_requests_v502;
  select count(*) filter(where is_hidden=false),count(*) filter(where is_hidden=true)
    into v_bless_visible,v_bless_hidden from public.nh7_sermon_blessings_v440;

  return jsonb_build_object(
    'testimony_private',jsonb_build_object('count',v_private_count,'bytes',v_private_bytes),
    'testimony_public',jsonb_build_object('count',v_public_count,'bytes',v_public_bytes),
    'testimonies',jsonb_build_object('pending',v_test_pending,'published',v_test_published,'rejected',v_test_rejected),
    'prayers',v_prayers,
    'blessings',jsonb_build_object('visible',v_bless_visible,'hidden',v_bless_hidden)
  );
end;
$function$;
revoke all on function public.nh7_owner_community_storage_stats_v504() from public, anon;
grant execute on function public.nh7_owner_community_storage_stats_v504() to authenticated, service_role;

notify pgrst, 'reload schema';
commit;