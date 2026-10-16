-- REVIEW ONLY companion to the exact Wave5 candidate + Library boundary. No Production execution.
-- Assemble atomically with assemble.py. Default capability is OFF. No legacy record is rewritten.
create table if not exists private.nh7_document_control_wave75(
 singleton boolean primary key default true check(singleton), enabled boolean not null default false,
 changed_at timestamptz not null default now()
);
insert into private.nh7_document_control_wave75(singleton,enabled) values(true,false) on conflict(singleton) do nothing;
alter table private.nh7_document_control_wave75 enable row level security;
revoke all on private.nh7_document_control_wave75 from public,anon,authenticated,service_role;
create table if not exists private.nh7_document_events_wave75(
 id uuid primary key default gen_random_uuid(),document_id uuid not null references public.nh7_official_documents_v2(id),
 event text not null check(event in('issued','revoked','expiry')),actor uuid not null,occurred_at timestamptz not null default now(),reason text
);
alter table private.nh7_document_events_wave75 enable row level security;
revoke all on private.nh7_document_events_wave75 from public,anon,authenticated,service_role;
create or replace function private.nh7_document_admin_v2() returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not coalesce(private.nh7_admin_is_owner_v350(),false) then raise exception 'Admin access required' using errcode='42501';end if;
 if not coalesce((select enabled from private.nh7_document_control_wave75 where singleton),false) then raise exception 'Document issuance inactive' using errcode='42501';end if;
end $$;
create or replace function public.nh7_document_capabilities_v2() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not coalesce(private.nh7_admin_is_owner_v350(),false) then raise exception 'Admin access required' using errcode='42501';end if;
 return jsonb_build_object('schema_version',2,'issuance_contract',75,'owner_uid',auth.uid(),
 'mutations',coalesce((select enabled from private.nh7_document_control_wave75 where singleton),false),
 'automatic_delivery',true,'minimal_verification',true,'expiry',true,'library_publication',false);
end $$;
-- Preserve and reuse exact Wave5 bodies, inaccessible to clients. Never rename an existing wrapper on repeat.
do $$begin
 if to_regprocedure('private.nh7_document_issue_wave5(uuid,integer,uuid,uuid)') is null then
  alter function public.nh7_document_issue_v2(uuid,integer,uuid,uuid) set schema private;
  alter function private.nh7_document_issue_v2(uuid,integer,uuid,uuid) rename to nh7_document_issue_wave5;
 end if;
 if to_regprocedure('private.nh7_document_verify_wave5(uuid)') is null then
  alter function public.nh7_document_verify_v2(uuid) set schema private;
  alter function private.nh7_document_verify_v2(uuid) rename to nh7_document_verify_wave5;
 end if;
end $$;
revoke all on function private.nh7_document_issue_wave5(uuid,integer,uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function private.nh7_document_verify_wave5(uuid) from public,anon,authenticated,service_role;
create or replace function private.nh7_document_immutable_wave75() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='DELETE' then raise exception 'Issued history cannot be deleted';end if;
 if (to_jsonb(NEW)-array['status','revoked_at','revoked_by','revocation_reason','expires_at','recipient_user_id']) is distinct from (to_jsonb(OLD)-array['status','revoked_at','revoked_by','revocation_reason','expires_at','recipient_user_id']) then raise exception 'Issued identity and definition are immutable';end if;
 if NEW.recipient_user_id is distinct from OLD.recipient_user_id then
  if not(OLD.recipient_user_id is not null and NEW.recipient_user_id is null and not exists(select 1 from auth.users where id=OLD.recipient_user_id)) then raise exception 'Recipient identity is immutable';end if;
 end if;
 if (to_jsonb(NEW)-'recipient_user_id') is distinct from (to_jsonb(OLD)-'recipient_user_id') then
  perform private.nh7_document_admin_v2();
  if OLD.status='revoked' and (NEW.status,NEW.revoked_at,NEW.revoked_by,NEW.revocation_reason) is distinct from (OLD.status,OLD.revoked_at,OLD.revoked_by,OLD.revocation_reason) then raise exception 'Revocation is permanent';end if;
  if OLD.expires_at is not null and (NEW.expires_at is null or NEW.expires_at>OLD.expires_at) then raise exception 'Expiry cannot be extended';end if;
 end if;
 return NEW;
end $$;
drop trigger if exists nh7_document_immutable_wave75 on public.nh7_official_documents_v2;
create trigger nh7_document_immutable_wave75 before update or delete on public.nh7_official_documents_v2 for each row execute function private.nh7_document_immutable_wave75();
create or replace function public.nh7_document_issue_v2(p_id uuid,p_revision integer,p_request_id uuid,p_prepare_token uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.nh7_document_drafts_v2;receipt jsonb;v_id uuid;
begin
 perform private.nh7_document_admin_v2();
 select * into r from public.nh7_document_drafts_v2 where id=p_id for update;
 if r.id is null or r.created_by<>auth.uid() or p_revision is null or p_request_id is null or p_prepare_token is null or r.revision<>p_revision or r.request_id is distinct from p_request_id or r.prepare_token is distinct from p_prepare_token then raise exception 'Exact confirmed request required' using errcode='40001';end if;
 receipt:=private.nh7_document_issue_wave5(p_id,p_revision,p_request_id,p_prepare_token);v_id:=(receipt->>'id')::uuid;
 -- One transaction with issuance: failed delivery cannot leave a claimed successful issue.
 if nullif(receipt->>'recipient_user_id','') is not null then
  insert into public.nh7_document_deliveries_v2(document_id,recipient_user_id,delivered_by)
  values(v_id,(receipt->>'recipient_user_id')::uuid,auth.uid()) on conflict(document_id) do nothing;
 end if;
 if not exists(select 1 from private.nh7_document_events_wave75 where document_id=v_id and event='issued') then
  insert into private.nh7_document_events_wave75(document_id,event,actor) values(v_id,'issued',auth.uid());
 end if;
 return receipt||jsonb_build_object('issuance_contract',75,'request_id',p_request_id,'archive_delivered',nullif(receipt->>'recipient_user_id','') is not null);
end $$;
create or replace function public.nh7_document_expire_v2(p_id uuid,p_expires_at timestamptz,p_reason text default '') returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.nh7_official_documents_v2;
begin
 perform private.nh7_document_admin_v2();
 if p_expires_at is null or length(coalesce(p_reason,''))>2000 then raise exception 'Expiry and bounded reason required';end if;
 select * into r from public.nh7_official_documents_v2 where id=p_id for update;
 if r.id is null or r.status<>'issued' then raise exception 'Issued record required';end if;
 if r.expires_at is not null and p_expires_at>=r.expires_at then return to_jsonb(r);end if;
 update public.nh7_official_documents_v2 set expires_at=p_expires_at where id=p_id returning * into r;
 insert into private.nh7_document_events_wave75(document_id,event,actor,reason) values(r.id,'expiry',auth.uid(),left(coalesce(p_reason,''),2000));return to_jsonb(r);
end $$;
create or replace function private.nh7_document_revoke_event_wave75() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if NEW.status='revoked' and OLD.status<>'revoked' then
  insert into private.nh7_document_events_wave75(document_id,event,actor,reason) values(NEW.id,'revoked',auth.uid(),left(NEW.revocation_reason,2000));
 end if;return NEW;
end $$;
drop trigger if exists nh7_document_revoke_event_wave75 on public.nh7_official_documents_v2;
create trigger nh7_document_revoke_event_wave75 after update on public.nh7_official_documents_v2 for each row execute function private.nh7_document_revoke_event_wave75();
-- Minimal proof only, even for authenticated/owner callers. Full previews use current authorized archives.
-- The private baseline retains optional Library generic status semantics without exposing its body.
create or replace function public.nh7_document_verify_v2(p_token uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 result:=private.nh7_document_verify_wave5(p_token);
 return jsonb_strip_nulls(jsonb_build_object('status',result->'status','number',result->'number','resource',result->'resource'));
end $$;
-- Admin list reuses the existing owner-scoped/directory/resource query; only status metadata changes.
do $$begin
 if to_regprocedure('private.nh7_document_admin_list_wave5()') is null then
  alter function public.nh7_document_admin_list_v2() set schema private;
  alter function private.nh7_document_admin_list_v2() rename to nh7_document_admin_list_wave5;
 end if;
end $$;
revoke all on function private.nh7_document_admin_list_wave5() from public,anon,authenticated,service_role;
create or replace function public.nh7_document_admin_list_v2() returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;rows jsonb;
begin
 perform private.nh7_document_admin_v2();result:=private.nh7_document_admin_list_wave5();
 select coalesce(jsonb_agg(case when x->>'status'<>'revoked' and nullif(x->>'expires_at','')::timestamptz<=now() then jsonb_set(x,'{status}','"expired"') else x end),'[]'::jsonb) into rows from jsonb_array_elements(result->'issued') x;
 return jsonb_set(result,'{issued}',rows);
end $$;
-- Explicit bounded account search, replacing the first-200-only client directory. No keystroke polling.
create or replace function public.nh7_document_recipient_search_v2(p_query text default '',p_after uuid default null,p_limit integer default 100) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare rows jsonb;v_limit integer:=greatest(1,least(coalesce(p_limit,100),100));v_query text:=lower(trim(coalesce(p_query,'')));v_next uuid;
begin
 perform private.nh7_document_admin_v2();if length(v_query)>120 then raise exception 'Search text too long';end if;
 select coalesce(jsonb_agg(x order by x->>'user_id'),'[]'::jsonb) into rows from(
  select jsonb_build_object('user_id',u.id,'name',coalesce(nullif(u.raw_user_meta_data->>'full_name',''),nullif(u.raw_user_meta_data->>'name',''),'Recipient'),'email',u.email,'student_code',i.student_code) x
  from auth.users u left join lateral(select student_code from public.school_student_identities where user_id=u.id and status='active' order by student_code limit 1)i on true
  where (p_after is null or u.id>p_after) and (v_query='' or position(v_query in lower(coalesce(u.email,'')||' '||coalesce(u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name','')||' '||coalesce(i.student_code,'')))>0)
  order by u.id limit v_limit+1
 )s;
 if jsonb_array_length(rows)>v_limit then v_next:=(rows->(v_limit-1)->>'user_id')::uuid;rows:=rows-(v_limit);end if;
 return jsonb_build_object('items',rows,'next_cursor',v_next);
end $$;
