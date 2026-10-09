-- New Hope 7 — Issue #127 identity integration wrappers
-- REVIEW CANDIDATE ONLY. DO NOT APPLY DIRECTLY TO PRODUCTION.
-- Depends on student_identity_candidate.sql.

-- Keep the School dashboard to one RPC: current path state + caller identity.
create or replace function public.nh7_school_path_state_v352()
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_base jsonb;
  v_identity jsonb;
begin
  if auth.uid() is null then raise exception 'login_required'; end if;
  v_base:=coalesce(public.nh7_school_path_state_v351(),'{}'::jsonb);
  v_identity:=coalesce(public.nh7_my_student_identity_v127()->'student','null'::jsonb);
  return v_base || jsonb_build_object('student_identity',v_identity);
end;
$$;
revoke all on function public.nh7_school_path_state_v352() from public,anon,authenticated;
grant execute on function public.nh7_school_path_state_v352() to authenticated;

-- Preserve the current optimized batch Academic Center and inject Student Identity
-- into its rows server-side. This avoids one identity request per visible student.
create or replace function public.nh7_admin_student_academic_center_v543(
  p_inactive_days integer default 30
)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
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
grant execute on function public.nh7_admin_student_academic_center_v543(integer) to authenticated;

-- Add identity to one existing student profile without changing academic calculations.
create or replace function public.nh7_admin_student_profile_v452(p_email text)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_email text:=lower(trim(coalesce(p_email,'')));
  v_base jsonb;
  v_identity jsonb:='null'::jsonb;
begin
  if not coalesce(public.nh7_is_admin(),false) then
    raise exception 'Admin access required';
  end if;
  if v_email='' then raise exception 'email_required'; end if;

  v_base:=coalesce(public.nh7_admin_student_profile_v451(v_email),'{}'::jsonb);

  select jsonb_build_object(
    'student_code',i.student_code,
    'user_id',i.user_id,
    'registration_email',i.registration_email,
    'current_email',coalesce(lower(u.email),i.registration_email),
    'display_name',i.display_name,
    'photo_path',i.photo_path,
    'has_photo',coalesce(i.photo_path,'')<>'',
    'status',i.status
  )
  into v_identity
  from public.school_student_identities i
  left join auth.users u on u.id=i.user_id
  where lower(i.registration_email)=v_email
     or lower(coalesce(u.email,''))=v_email
  order by (lower(coalesce(u.email,''))=v_email) desc
  limit 1;

  return v_base || jsonb_build_object('student_identity',coalesce(v_identity,'null'::jsonb));
end;
$$;
revoke all on function public.nh7_admin_student_profile_v452(text) from public,anon,authenticated;
grant execute on function public.nh7_admin_student_profile_v452(text) to authenticated;

-- Compatibility design note:
-- The client may temporarily fall back from v352 -> v351 and v543 -> v542 while
-- staged backend deployment is being validated. No fallback may manufacture a
-- Student Code client-side; absence is shown as unavailable until server identity exists.
