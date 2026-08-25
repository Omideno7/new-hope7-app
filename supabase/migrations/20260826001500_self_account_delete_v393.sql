-- New Hope 7 v3.9.3
-- Secure self-service account deletion. The client must reauthenticate the
-- current password, then confirm the exact account email and the word DELETE.

create or replace function private.nh7_delete_account_core_v393(
  p_user_id uuid,
  p_email text,
  p_actor_user_id uuid,
  p_actor_email text,
  p_self_service boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, extensions, pg_catalog
as $$
declare
  v_email text := lower(trim(coalesce(p_email,'')));
  v_devices text[] := array[]::text[];
  v_counts jsonb := '{}'::jsonb;
  v_n integer := 0;
begin
  if p_user_id is null or v_email='' then
    raise exception 'Account identity is required';
  end if;

  select coalesce(array_agg(distinct d) filter(where d<>''),array[]::text[])
    into v_devices
  from (
    select trim(coalesce(r.device_id,'')) d
      from public.registrations r
      where lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))=v_email
    union all
    select trim(coalesce(r.payload->>'device_id',''))
      from public.registrations r
      where lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))=v_email
  ) x;

  delete from public.nh7_content_entitlements_v380 where lower(trim(user_email))=v_email;
  get diagnostics v_n=row_count; v_counts:=v_counts||jsonb_build_object('content_entitlements',v_n);

  delete from public.nh7_school_audio_progress_v380 where user_id=p_user_id or lower(trim(user_email))=v_email;
  get diagnostics v_n=row_count; v_counts:=v_counts||jsonb_build_object('school_audio_progress',v_n);

  delete from public.nh7_admin_account_actions_v380 where lower(trim(target_email))=v_email;
  get diagnostics v_n=row_count; v_counts:=v_counts||jsonb_build_object('account_actions',v_n);

  delete from public.nh7_account_content_grants_v251 where user_id=p_user_id or lower(trim(user_email))=v_email;
  get diagnostics v_n=row_count; v_counts:=v_counts||jsonb_build_object('content_grants',v_n);

  delete from public.nh7_account_verse_marks_v230 where user_id=p_user_id or lower(trim(user_email))=v_email;
  get diagnostics v_n=row_count; v_counts:=v_counts||jsonb_build_object('verse_marks',v_n);

  delete from public.nh7_library_user_grants_v230 where user_id=p_user_id or lower(trim(user_email))=v_email;
  get diagnostics v_n=row_count; v_counts:=v_counts||jsonb_build_object('library_grants',v_n);

  delete from public.nh7_school_video_grants_v260 where user_id=p_user_id or lower(trim(user_email))=v_email;
  get diagnostics v_n=row_count; v_counts:=v_counts||jsonb_build_object('video_grants',v_n);

  -- Personal codes cascade to v3.9.2 code-item selections and bound grants.
  delete from public.nh7_school_video_codes_v260 where lower(trim(coalesce(target_email,'')))=v_email;
  get diagnostics v_n=row_count; v_counts:=v_counts||jsonb_build_object('personal_video_codes',v_n);

  delete from public.fasting_daily_logs where user_id=p_user_id;
  get diagnostics v_n=row_count; v_counts:=v_counts||jsonb_build_object('fasting_logs',v_n);

  delete from public.fasting_journeys where user_id=p_user_id;
  get diagnostics v_n=row_count; v_counts:=v_counts||jsonb_build_object('fasting_journeys',v_n);

  delete from public.spiritual_plan_progress where user_id=p_user_id;
  get diagnostics v_n=row_count; v_counts:=v_counts||jsonb_build_object('plan_progress',v_n);

  delete from public.nh7_app_presence_daily_v360 where user_id=p_user_id or lower(trim(user_email))=v_email;
  get diagnostics v_n=row_count; v_counts:=v_counts||jsonb_build_object('presence',v_n);

  delete from public.nh7_account_notes where lower(trim(user_email))=v_email;
  get diagnostics v_n=row_count; v_counts:=v_counts||jsonb_build_object('account_notes',v_n);

  delete from public.nh7_account_progress where lower(trim(user_email))=v_email;
  get diagnostics v_n=row_count; v_counts:=v_counts||jsonb_build_object('account_progress',v_n);

  delete from public.nh7_account_saved_verses where lower(trim(user_email))=v_email;
  get diagnostics v_n=row_count; v_counts:=v_counts||jsonb_build_object('saved_verses',v_n);

  delete from public.nh7_app_activity_daily where lower(trim(user_email))=v_email;
  delete from public.nh7_audio_sessions where lower(trim(user_email))=v_email;
  delete from public.nh7_content_activity_daily where lower(trim(user_email))=v_email;
  delete from public.nh7_legacy_auth_claim_audit where lower(trim(user_email))=v_email;
  delete from public.nh7_library_access_log where lower(trim(user_email))=v_email;

  delete from public.notification_inbox
    where lower(trim(coalesce(user_email,'')))=v_email
       or (cardinality(v_devices)>0 and device_id=any(v_devices));
  get diagnostics v_n=row_count; v_counts:=v_counts||jsonb_build_object('inbox_messages',v_n);

  delete from public.notification_inbox_receipts
    where lower(trim(coalesce(user_email,'')))=v_email
       or (cardinality(v_devices)>0 and device_id=any(v_devices));

  delete from public.school_assignments where lower(trim(user_email))=v_email;
  get diagnostics v_n=row_count; v_counts:=v_counts||jsonb_build_object('assignments',v_n);

  delete from public.school_certificates where lower(trim(user_email))=v_email;
  get diagnostics v_n=row_count; v_counts:=v_counts||jsonb_build_object('certificates',v_n);

  delete from public.school_exam_attempts where lower(trim(user_email))=v_email;
  get diagnostics v_n=row_count; v_counts:=v_counts||jsonb_build_object('exam_attempts',v_n);

  delete from public.school_progress where lower(trim(user_email))=v_email;
  get diagnostics v_n=row_count; v_counts:=v_counts||jsonb_build_object('school_progress',v_n);

  delete from public.qa_questions
    where lower(trim(coalesce(author_email,'')))=v_email
       or (cardinality(v_devices)>0 and device_id=any(v_devices));

  delete from public.nh7_admin_email_log where lower(trim(coalesce(recipient_email,'')))=v_email;

  if cardinality(v_devices)>0 then
    delete from public.saved_verses where device_id=any(v_devices);
    delete from public.user_notes where device_id=any(v_devices);
    delete from public.user_progress where device_id=any(v_devices);
  end if;

  delete from public.registrations
    where lower(trim(coalesce(payload->>'email',payload->>'user_email','')))=v_email;
  get diagnostics v_n=row_count; v_counts:=v_counts||jsonb_build_object('registrations',v_n);

  delete from private.nh7_admin_audit_log_v350 where target_user_id=p_user_id;
  delete from auth.sessions where user_id=p_user_id;
  delete from auth.users where id=p_user_id;
  get diagnostics v_n=row_count;
  if v_n<>1 then raise exception 'Auth account deletion failed'; end if;
  v_counts:=v_counts||jsonb_build_object('auth_users',v_n,'self_service',p_self_service);

  insert into private.nh7_account_deletion_audit_v372(
    actor_user_id,actor_email,target_email_hash,deletion_mode,deleted_counts
  ) values (
    p_actor_user_id,
    lower(trim(coalesce(p_actor_email,''))),
    encode(digest(v_email,'sha256'),'hex'),
    'full_account',
    v_counts
  );

  return jsonb_build_object('ok',true,'mode','full_account','deleted',true,'counts',v_counts,'version','3.9.3');
end;
$$;

revoke all on function private.nh7_delete_account_core_v393(uuid,text,uuid,text,boolean) from public, anon, authenticated;

create or replace function public.nh7_delete_my_account_v393(
  p_confirmation_email text,
  p_confirmation_phrase text
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_jwt_email text := lower(trim(coalesce(auth.jwt()->>'email','')));
  v_owner_email text := lower(trim(coalesce(nullif(current_setting('app.settings.nh7_admin_email',true),''),'omideno7church@gmail.com')));
begin
  if auth.role()<>'authenticated' or v_user_id is null then
    raise exception 'Sign in is required';
  end if;

  select lower(trim(coalesce(email,'')))
    into v_email
  from auth.users
  where id=v_user_id and deleted_at is null and email_confirmed_at is not null
  for update;

  if not found or v_email='' then raise exception 'Confirmed account not found'; end if;
  if v_jwt_email='' or v_jwt_email<>v_email then raise exception 'Account identity mismatch'; end if;
  if lower(trim(coalesce(p_confirmation_email,'')))<>v_email then raise exception 'Confirmation email mismatch'; end if;
  if upper(trim(coalesce(p_confirmation_phrase,'')))<>'DELETE' then raise exception 'Type DELETE to confirm'; end if;
  if v_email=v_owner_email then raise exception 'Owner account cannot be self-deleted'; end if;
  if exists(select 1 from private.nh7_admin_members_v350 m where m.user_id=v_user_id) then
    raise exception 'Admin accounts must be removed through the owner administration panel';
  end if;

  return private.nh7_delete_account_core_v393(v_user_id,v_email,v_user_id,v_email,true);
end;
$$;

revoke all on function public.nh7_delete_my_account_v393(text,text) from public, anon;
grant execute on function public.nh7_delete_my_account_v393(text,text) to authenticated;

comment on function public.nh7_delete_my_account_v393(text,text) is
'Permanently deletes the currently authenticated non-admin account and associated New Hope 7 data after email and DELETE confirmation. The client must reauthenticate the password before invoking this RPC.';
