create or replace function public.nh7_owner_community_storage_orphans_v507()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public','private','storage','pg_catalog'
as $function$
declare
  v_private jsonb := '[]'::jsonb;
  v_public jsonb := '[]'::jsonb;
  v_private_bytes bigint := 0;
  v_public_bytes bigint := 0;
begin
  if not coalesce(public.nh7_admin_has_permission_v395('community.testimony.review'),false) then
    raise exception 'not authorized';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('path',o.name,'bytes',coalesce((o.metadata->>'size')::bigint,0)) order by o.created_at),'[]'::jsonb),
         coalesce(sum(coalesce((o.metadata->>'size')::bigint,0)),0)
    into v_private,v_private_bytes
  from storage.objects o
  where o.bucket_id='nh7-testimony-submissions-v502'
    and not exists (
      select 1 from public.nh7_testimonies_v502 t
      where nullif(trim(t.audio_submission_path),'')=o.name
    );

  select coalesce(jsonb_agg(jsonb_build_object('path',o.name,'bytes',coalesce((o.metadata->>'size')::bigint,0)) order by o.created_at),'[]'::jsonb),
         coalesce(sum(coalesce((o.metadata->>'size')::bigint,0)),0)
    into v_public,v_public_bytes
  from storage.objects o
  where o.bucket_id='nh7-testimony-published-v502'
    and not exists (
      select 1 from public.nh7_testimonies_v502 t
      where nullif(trim(t.audio_public_path),'')=o.name
    );

  return jsonb_build_object(
    'private',v_private,
    'public',v_public,
    'private_count',jsonb_array_length(v_private),
    'public_count',jsonb_array_length(v_public),
    'private_bytes',v_private_bytes,
    'public_bytes',v_public_bytes,
    'total_count',jsonb_array_length(v_private)+jsonb_array_length(v_public),
    'total_bytes',v_private_bytes+v_public_bytes
  );
end;
$function$;

revoke all on function public.nh7_owner_community_storage_orphans_v507() from public;
revoke all on function public.nh7_owner_community_storage_orphans_v507() from anon;
grant execute on function public.nh7_owner_community_storage_orphans_v507() to authenticated;