-- New Hope 7 v5.0.3 — rejected testimony hard delete support.
-- Prepared for isolated QA. DO NOT apply to Production before approval.
begin;

drop policy if exists nh7_testimony_private_admin_delete_v503 on storage.objects;
create policy nh7_testimony_private_admin_delete_v503
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'nh7-testimony-submissions-v502'
  and coalesce(public.nh7_admin_has_permission_v395('community.testimony.review'), false)
);

create or replace function public.nh7_owner_testimony_delete_rejected_v503(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_catalog'
as $function$
declare
  v_row public.nh7_testimonies_v502;
begin
  if not coalesce(public.nh7_admin_has_permission_v395('community.testimony.review'), false) then
    raise exception 'not authorized';
  end if;

  select * into v_row
  from public.nh7_testimonies_v502
  where id = p_id
  for update;

  if v_row.id is null then
    raise exception 'testimony not found';
  end if;

  if v_row.status <> 'rejected' then
    raise exception 'only rejected testimony can be permanently deleted';
  end if;

  delete from public.nh7_testimonies_v502 where id = p_id;

  return jsonb_build_object(
    'id', v_row.id,
    'deleted', true,
    'audio_submission_path', coalesce(v_row.audio_submission_path, ''),
    'audio_public_path', coalesce(v_row.audio_public_path, '')
  );
end;
$function$;

revoke all on function public.nh7_owner_testimony_delete_rejected_v503(uuid) from public;
revoke all on function public.nh7_owner_testimony_delete_rejected_v503(uuid) from anon;
grant execute on function public.nh7_owner_testimony_delete_rejected_v503(uuid) to authenticated;
grant execute on function public.nh7_owner_testimony_delete_rejected_v503(uuid) to service_role;

commit;
