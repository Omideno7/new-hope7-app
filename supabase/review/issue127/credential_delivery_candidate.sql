-- New Hope 7 — Issue #127 / Verifiable Credential Delivery
-- REVIEW CANDIDATE ONLY. DO NOT APPLY DIRECTLY TO PRODUCTION.
-- Extends the existing school_certificates system; does not create a second
-- credential registry.

-- ---------------------------------------------------------------------------
-- 1. Additive credential/inbox identity fields
-- ---------------------------------------------------------------------------
alter table public.school_certificates
  add column if not exists recipient_user_id uuid,
  add column if not exists student_code text,
  add column if not exists recipient_photo_path text,
  add column if not exists expiry_date date,
  add column if not exists replaced_by_id uuid,
  add column if not exists revocation_reason text not null default '',
  add column if not exists issued_by_user_id uuid,
  add column if not exists pdf_path text;

create unique index if not exists school_certificates_certificate_number_uq_v127
  on public.school_certificates(certificate_number)
  where certificate_number is not null and trim(certificate_number)<>'';
create unique index if not exists school_certificates_public_token_uq_v127
  on public.school_certificates(public_token)
  where public_token is not null;
create index if not exists school_certificates_recipient_user_idx_v127
  on public.school_certificates(recipient_user_id,created_at desc);

alter table public.notification_inbox
  add column if not exists recipient_user_id uuid,
  add column if not exists action_data jsonb not null default '{}'::jsonb;
create index if not exists notification_inbox_recipient_user_idx_v127
  on public.notification_inbox(recipient_user_id,delivered_at desc)
  where admin_deleted_at is null;

-- Dedicated private PDF bucket. The final migration should create/update this
-- through the Supabase Storage/CLI workflow rather than relying on public URLs.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('nh7-credentials','nh7-credentials',false,20971520,array['application/pdf']::text[])
on conflict(id) do update set
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- 2. Private credential-PDF Storage policies
-- Path: credentials/<recipient_user_id>/<certificate_id>.pdf
-- ---------------------------------------------------------------------------
drop policy if exists "nh7 credential pdf select own v127" on storage.objects;
create policy "nh7 credential pdf select own v127"
on storage.objects for select to authenticated
using(
  bucket_id='nh7-credentials'
  and (storage.foldername(name))[1]='credentials'
  and (storage.foldername(name))[2]=(select auth.uid())::text
);

-- End users do not directly INSERT/UPDATE credential PDFs. Generation/upload is
-- Admin/server controlled. Existing Admin storage policy/authorized server flow
-- must be extended for this bucket at deployment review.

-- ---------------------------------------------------------------------------
-- 3. Generic official credential issue RPC
-- ---------------------------------------------------------------------------
create or replace function public.nh7_admin_issue_credential_v127(
  p_recipient_user_id uuid,
  p_recipient_name text,
  p_certificate_type text,
  p_language text default 'fa',
  p_course_code text default null,
  p_title_fa text default '',
  p_title_en text default '',
  p_title_hr text default '',
  p_body_fa text default '',
  p_body_en text default '',
  p_body_hr text default '',
  p_issue_date date default current_date,
  p_expiry_date date default null,
  p_place text default '',
  p_minister text default '',
  p_witness text default '',
  p_template_code text default '',
  p_theme_code text default 'official_letterhead',
  p_church_info jsonb default '{}'::jsonb,
  p_issue_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_admin uuid:=auth.uid();
  v_type text:=lower(regexp_replace(trim(coalesce(p_certificate_type,'credential')),'[^a-zA-Z0-9_]+','_','g'));
  v_lang text:=case when lower(coalesce(p_language,'fa')) in ('fa','en','hr') then lower(p_language) else 'fa' end;
  v_email text;
  v_name text:=trim(coalesce(p_recipient_name,''));
  v_student_code text;
  v_photo_path text;
  v_number text;
  v_prefix text;
  v_row public.school_certificates;
begin
  if not coalesce(public.nh7_is_admin(),false) then raise exception 'Admin access required'; end if;
  if p_recipient_user_id is null then raise exception 'recipient_user_id_required'; end if;

  select lower(trim(u.email)) into v_email from auth.users u where u.id=p_recipient_user_id;
  if v_email is null then raise exception 'recipient_account_not_found'; end if;

  select i.student_code,i.photo_path,coalesce(nullif(v_name,''),nullif(i.display_name,''))
  into v_student_code,v_photo_path,v_name
  from public.school_student_identities i
  where i.user_id=p_recipient_user_id and i.status='active'
  limit 1;

  if v_name='' then
    select coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'),''),split_part(u.email,'@',1))
      into v_name from auth.users u where u.id=p_recipient_user_id;
  end if;
  if v_name='' then raise exception 'recipient_name_required'; end if;

  v_prefix:=case v_type
    when 'school' then 'SCH'
    when 'course_completion' then 'CRS'
    when 'water_baptism' then 'BAP'
    when 'ordination' then 'ORD'
    when 'commissioning' then 'COM'
    when 'leadership' then 'LDR'
    else 'CERT' end;
  v_number:='NH7-'||v_prefix||'-'||extract(year from coalesce(p_issue_date,current_date))::int||'-'||lpad(nextval('public.school_certificate_number_seq')::text,5,'0');

  insert into public.school_certificates(
    user_email,user_name,course_code,certificate_number,status,language,certificate_type,
    title_fa,title_en,title_hr,body_fa,body_en,body_hr,
    approved_by,approved_at,public_token,issue_date,expiry_date,place,minister,witness,
    template_code,theme_code,church_info,issue_note,
    recipient_user_id,student_code,recipient_photo_path,issued_by_user_id,
    metadata,created_at,updated_at
  ) values(
    v_email,v_name,coalesce(nullif(trim(coalesce(p_course_code,'')),''),'credential:'||v_type||':'||replace(gen_random_uuid()::text,'-','')),
    v_number,'issued',v_lang,v_type,
    coalesce(p_title_fa,''),coalesce(p_title_en,''),coalesce(p_title_hr,''),
    coalesce(p_body_fa,''),coalesce(p_body_en,''),coalesce(p_body_hr,''),
    coalesce(nullif(trim(p_minister),''),'New Hope 7'),now(),gen_random_uuid(),coalesce(p_issue_date,current_date),p_expiry_date,
    coalesce(p_place,''),coalesce(p_minister,''),coalesce(p_witness,''),
    coalesce(p_template_code,''),coalesce(p_theme_code,'official_letterhead'),coalesce(p_church_info,'{}'::jsonb),coalesce(p_issue_note,''),
    p_recipient_user_id,v_student_code,v_photo_path,v_admin,
    jsonb_build_object('student_linked',v_student_code is not null,'issued_via','credential_studio_v127'),now(),now()
  ) returning * into v_row;

  return jsonb_build_object(
    'ok',true,
    'credential_id',v_row.id,
    'certificate_number',v_row.certificate_number,
    'public_token',v_row.public_token,
    'recipient_user_id',v_row.recipient_user_id,
    'student_code',v_row.student_code,
    'has_photo',coalesce(v_row.recipient_photo_path,'')<>''
  );
end;
$$;
revoke all on function public.nh7_admin_issue_credential_v127(uuid,text,text,text,text,text,text,text,text,text,text,date,date,text,text,text,text,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.nh7_admin_issue_credential_v127(uuid,text,text,text,text,text,text,text,text,text,text,date,date,text,text,text,text,text,jsonb,text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Revoke / replace lifecycle
-- ---------------------------------------------------------------------------
create or replace function public.nh7_admin_revoke_credential_v127(
  p_credential_id uuid,
  p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
begin
  if not coalesce(public.nh7_is_admin(),false) then raise exception 'Admin access required'; end if;
  update public.school_certificates
     set status='revoked',revoked_at=now(),revocation_reason=coalesce(p_reason,''),updated_at=now()
   where id=p_credential_id;
  if not found then raise exception 'credential_not_found'; end if;
  return jsonb_build_object('ok',true,'credential_id',p_credential_id,'status','revoked');
end;
$$;
revoke all on function public.nh7_admin_revoke_credential_v127(uuid,text) from public,anon,authenticated;
grant execute on function public.nh7_admin_revoke_credential_v127(uuid,text) to authenticated;

create or replace function public.nh7_admin_mark_credential_replaced_v127(
  p_old_credential_id uuid,
  p_new_credential_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
begin
  if not coalesce(public.nh7_is_admin(),false) then raise exception 'Admin access required'; end if;
  if p_old_credential_id=p_new_credential_id then raise exception 'replacement_must_differ'; end if;
  if not exists(select 1 from public.school_certificates c where c.id=p_new_credential_id) then raise exception 'replacement_credential_not_found'; end if;
  update public.school_certificates
     set status='replaced',replaced_by_id=p_new_credential_id,updated_at=now()
   where id=p_old_credential_id;
  if not found then raise exception 'credential_not_found'; end if;
  return jsonb_build_object('ok',true,'credential_id',p_old_credential_id,'status','replaced','replaced_by_id',p_new_credential_id);
end;
$$;
revoke all on function public.nh7_admin_mark_credential_replaced_v127(uuid,uuid) from public,anon,authenticated;
grant execute on function public.nh7_admin_mark_credential_replaced_v127(uuid,uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Minimal public verification — no recipient profile data
-- ---------------------------------------------------------------------------
create or replace function public.nh7_public_credential_verify_v127(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path=public
as $$
  select case when c.id is null then
    jsonb_build_object('ok',true,'verification_status','not_found')
  else jsonb_build_object(
    'ok',true,
    'verification_status',case
      when c.revoked_at is not null or lower(coalesce(c.status,''))='revoked' then 'revoked'
      when lower(coalesce(c.status,''))='replaced' then 'replaced'
      when lower(coalesce(c.status,'')) in ('approved','issued','active') then 'valid'
      else 'not_active' end,
    'certificate_number',c.certificate_number,
    'credential_type',c.certificate_type,
    'issue_date',coalesce(c.issue_date,c.approved_at::date,c.created_at::date),
    'expiry_date',c.expiry_date,
    'issuer',coalesce(nullif(c.church_info->>'name',''),'New Hope 7'),
    'document_version',c.document_version
  ) end
  from (select 1) x
  left join public.school_certificates c on c.public_token=p_token
  limit 1
$$;
revoke all on function public.nh7_public_credential_verify_v127(uuid) from public,anon,authenticated;
grant execute on function public.nh7_public_credential_verify_v127(uuid) to anon,authenticated;

-- ---------------------------------------------------------------------------
-- 6. Deliver an issued credential to the correct app Inbox
-- ---------------------------------------------------------------------------
create or replace function public.nh7_admin_send_credential_to_app_v127(
  p_credential_id uuid,
  p_title text default null,
  p_body text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_c public.school_certificates;
  v_id uuid:=gen_random_uuid();
  v_title text;
  v_body text;
begin
  if not coalesce(public.nh7_is_admin(),false) then raise exception 'Admin access required'; end if;
  select * into v_c from public.school_certificates c where c.id=p_credential_id limit 1;
  if not found then raise exception 'credential_not_found'; end if;
  if v_c.recipient_user_id is null then raise exception 'credential_recipient_user_missing'; end if;
  if lower(coalesce(v_c.status,'')) not in ('approved','issued','active') then raise exception 'credential_not_active'; end if;

  v_title:=coalesce(nullif(trim(coalesce(p_title,'')),''),case v_c.language when 'fa' then 'مدرک شما آماده است' when 'hr' then 'Vaš certifikat je spreman' else 'Your credential is ready' end);
  v_body:=coalesce(nullif(trim(coalesce(p_body,'')),''),case v_c.language when 'fa' then 'مدرک رسمی شما صادر شده و در اپ New Hope 7 آماده مشاهده و دریافت است.' when 'hr' then 'Vaš službeni dokument je izdan i spreman je za pregled i preuzimanje u aplikaciji New Hope 7.' else 'Your official credential has been issued and is ready to view and download in New Hope 7.' end);

  insert into public.notification_inbox(
    id,recipient_user_id,user_email,device_id,title,body,category,language,delivered_at,dedupe_key,action_data
  ) values(
    v_id,v_c.recipient_user_id,v_c.user_email,null,v_title,v_body,'credential',v_c.language,now(),
    'credential-v127:'||v_c.id::text||':'||v_c.document_version::text,
    jsonb_build_object(
      'action','open_credential',
      'credential_id',v_c.id,
      'certificate_number',v_c.certificate_number
    )
  )
  on conflict(dedupe_key) where dedupe_key is not null do nothing;

  update public.school_certificates set inbox_sent_at=coalesce(inbox_sent_at,now()),updated_at=now() where id=v_c.id;
  return jsonb_build_object('ok',true,'credential_id',v_c.id,'inbox_message_id',v_id,'sent',true);
end;
$$;
revoke all on function public.nh7_admin_send_credential_to_app_v127(uuid,text,text) from public,anon,authenticated;
grant execute on function public.nh7_admin_send_credential_to_app_v127(uuid,text,text) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Own credential list for Inbox / Documents screen
-- ---------------------------------------------------------------------------
create or replace function public.nh7_my_credentials_v127()
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'login_required'; end if;
  return jsonb_build_object('ok',true,'credentials',coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',c.id,
      'certificate_number',c.certificate_number,
      'certificate_type',c.certificate_type,
      'course_code',c.course_code,
      'language',c.language,
      'title_fa',c.title_fa,'title_en',c.title_en,'title_hr',c.title_hr,
      'issue_date',c.issue_date,
      'expiry_date',c.expiry_date,
      'status',c.status,
      'student_code',c.student_code,
      'has_photo',coalesce(c.recipient_photo_path,'')<>'',
      'has_pdf',coalesce(c.pdf_path,'')<>'',
      'public_token',c.public_token,
      'document_version',c.document_version
    ) order by c.issue_date desc nulls last,c.created_at desc)
    from public.school_certificates c
    where c.recipient_user_id=v_uid
  ),'[]'::jsonb));
end;
$$;
revoke all on function public.nh7_my_credentials_v127() from public,anon,authenticated;
grant execute on function public.nh7_my_credentials_v127() to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Inbox snapshot wrapper adds action_data only for messages already permitted
-- by the current v419 identity/device/email rules.
-- ---------------------------------------------------------------------------
create or replace function public.nh7_inbox_snapshot_v420(
  p_language text default 'en',
  p_message_limit integer default 200,
  p_receipt_limit integer default 500
)
returns jsonb
language plpgsql
stable
security definer
set search_path=public,pg_catalog
as $$
declare
  v_base jsonb:=public.nh7_inbox_snapshot_v419(p_language,p_message_limit,p_receipt_limit);
  v_ids uuid[];
  v_messages jsonb;
begin
  select coalesce(array_agg((m->>'id')::uuid),'{}'::uuid[]) into v_ids
  from jsonb_array_elements(coalesce(v_base->'messages','[]'::jsonb)) m
  where coalesce(m->>'id','')<>'';

  select coalesce(jsonb_agg(
    m || jsonb_build_object('action_data',coalesce(n.action_data,'{}'::jsonb))
    order by coalesce((m->>'delivered_at')::timestamptz,'epoch'::timestamptz) desc
  ),'[]'::jsonb)
  into v_messages
  from jsonb_array_elements(coalesce(v_base->'messages','[]'::jsonb)) m
  left join public.notification_inbox n on n.id=(m->>'id')::uuid and n.id=any(v_ids);

  return jsonb_set(v_base,'{messages}',coalesce(v_messages,'[]'::jsonb),true) || jsonb_build_object('snapshot_version','420');
end;
$$;
revoke all on function public.nh7_inbox_snapshot_v420(text,integer,integer) from public,anon,authenticated;
grant execute on function public.nh7_inbox_snapshot_v420(text,integer,integer) to anon,authenticated;

-- IMPORTANT: PDF generation/rendering remains a separate client/Admin render step.
-- The final implementation stores only a private object path in pdf_path, never a
-- public URL. User download resolves through authenticated Storage access or a
-- short-lived server-authorized signed URL.
