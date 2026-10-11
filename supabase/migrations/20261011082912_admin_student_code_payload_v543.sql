create or replace function public.nh7_admin_student_academic_center_v543(
  p_inactive_days integer default 30
)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_base jsonb;
  v_rows jsonb;
begin
  if not coalesce(public.nh7_is_admin(),false) then
    raise exception 'Admin access required';
  end if;

  v_base:=coalesce(public.nh7_admin_student_academic_center_v542(p_inactive_days),'{}'::jsonb);

  select coalesce(jsonb_agg(
    r || jsonb_build_object(
      'student_code',i.student_code,
      'student_user_id',i.user_id,
      'student_has_photo',coalesce(i.photo_path,'')<>'',
      'student_identity_status',i.status
    )
  ),'[]'::jsonb)
  into v_rows
  from jsonb_array_elements(coalesce(v_base->'rows','[]'::jsonb)) r
  left join lateral (
    select i.*
    from public.school_student_identities i
    left join auth.users u on u.id=i.user_id
    where lower(trim(i.registration_email))=lower(trim(r->>'email'))
       or lower(trim(coalesce(u.email,'')))=lower(trim(r->>'email'))
    order by (lower(trim(coalesce(u.email,'')))=lower(trim(r->>'email'))) desc,
             i.created_at asc
    limit 1
  ) i on true;

  return jsonb_set(v_base,'{rows}',coalesce(v_rows,'[]'::jsonb),true)
         || jsonb_build_object('identity_version','127');
end;
$$;

revoke all on function public.nh7_admin_student_academic_center_v543(integer) from public,anon,authenticated;
grant execute on function public.nh7_admin_student_academic_center_v543(integer) to authenticated,service_role;