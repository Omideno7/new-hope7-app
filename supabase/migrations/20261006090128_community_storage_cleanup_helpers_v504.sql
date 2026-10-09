begin;

create or replace function public.nh7_owner_testimony_mark_private_released_v504(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path='public','private','pg_catalog'
as $function$
declare v_path text;
begin
  if not coalesce(public.nh7_admin_has_permission_v395('community.testimony.review'),false) then
    raise exception 'not authorized';
  end if;
  update public.nh7_testimonies_v502
     set audio_submission_path=''
   where id=p_id and status='published' and length(trim(coalesce(audio_public_path,'')))>0
   returning audio_public_path into v_path;
  if not found then raise exception 'published testimony not found'; end if;
  return jsonb_build_object('ok',true,'id',p_id,'audio_public_path',coalesce(v_path,''));
end;
$function$;
revoke all on function public.nh7_owner_testimony_mark_private_released_v504(uuid) from public, anon;
grant execute on function public.nh7_owner_testimony_mark_private_released_v504(uuid) to authenticated, service_role;

create or replace function public.nh7_admin_sermon_blessings_purge_hidden_v504()
returns jsonb
language plpgsql
security definer
set search_path='public','private','pg_catalog'
as $function$
declare v_uid uuid:=auth.uid(); v_count bigint:=0;
begin
  if v_uid is null or not exists(
    select 1 from private.nh7_admin_members_v350 m where m.user_id=v_uid and m.is_active=true
  ) then raise exception 'admin_required'; end if;
  with deleted as (
    delete from public.nh7_sermon_blessings_v440 where is_hidden=true returning 1
  ) select count(*) into v_count from deleted;
  return jsonb_build_object('ok',true,'deleted',v_count);
end;
$function$;
revoke all on function public.nh7_admin_sermon_blessings_purge_hidden_v504() from public, anon;
grant execute on function public.nh7_admin_sermon_blessings_purge_hidden_v504() to authenticated, service_role;

notify pgrst, 'reload schema';
commit;