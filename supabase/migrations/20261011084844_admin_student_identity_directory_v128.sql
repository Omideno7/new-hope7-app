-- New Hope 7 — lightweight Admin Student Identity directory for Approved/search UI.
-- Read-only: no student, registration, School, exam, or progress mutation.
create or replace function public.nh7_admin_student_identity_directory_v128()
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $function$
begin
  if not coalesce(public.nh7_is_admin(),false) then
    raise exception 'Admin access required';
  end if;

  return jsonb_build_object(
    'ok',true,
    'rows',coalesce((
      select jsonb_agg(jsonb_build_object(
        'student_code',i.student_code,
        'display_name',coalesce(i.display_name,''),
        'registration_email',lower(i.registration_email),
        'current_email',coalesce(lower(u.email),lower(i.registration_email))
      ) order by coalesce(i.display_name,i.registration_email),i.student_code)
      from public.school_student_identities i
      left join auth.users u on u.id=i.user_id
      where i.status='active'
    ),'[]'::jsonb)
  );
end;
$function$;

revoke all on function public.nh7_admin_student_identity_directory_v128() from public,anon,authenticated;
grant execute on function public.nh7_admin_student_identity_directory_v128() to authenticated,service_role;