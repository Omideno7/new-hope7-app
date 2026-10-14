-- REVIEW ONLY after candidate.sql. Requires separately reviewed Edge storage attestation.
-- Existing nh7-library bucket/RLS and nh7_admin_library_save_item_v224 stay unchanged.
begin;
create table if not exists private.nh7_document_library_versions_v2(
 id uuid primary key default gen_random_uuid(),created_by uuid not null,draft_id uuid not null,definition jsonb not null,metadata jsonb not null,authoring jsonb not null,request_key text not null unique,request jsonb not null,
 library_id uuid not null unique default gen_random_uuid(),public_token uuid not null unique default gen_random_uuid(),number text not null unique,
 prepare_token uuid not null default gen_random_uuid(),storage_path text not null unique,
 status text not null default 'prepared' check(status in('prepared','publishing','published','unknown')),
 sha256 text,parent uuid references private.nh7_document_library_versions_v2(id),expires_at timestamptz not null default now()+interval '15 minutes',created_at timestamptz not null default now()
);
alter table private.nh7_document_library_versions_v2 enable row level security;
revoke all on private.nh7_document_library_versions_v2 from public,anon,authenticated;
create or replace function public.nh7_document_library_prepare_v2(p_plan jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r private.nh7_document_library_versions_v2;v_id uuid:=gen_random_uuid();v_token uuid:=gen_random_uuid();v_number text;d jsonb:=p_plan->'snapshot';k text;
begin perform private.nh7_document_admin_v2();perform private.nh7_document_validate_v2(d);perform private.nh7_document_validate_v2(p_plan->'authoring');perform private.nh7_document_geometry_v2(d,true);
 if d->>'type' not in ('official_letter','custom_document') or exists(select 1 from jsonb_each_text(d->'recipient') where coalesce(value,'')<>'') or d->>'status'<>'draft' or coalesce(trim(d->>'signer'),'')='' or coalesce(trim(d#>>'{church,name}'),'')='' then raise exception 'Personal documents cannot be Library resources';end if;
 for k in select x from unnest(array['title_fa','title_en','title_hr','description_fa','description_en','description_hr'])x loop if coalesce(trim(p_plan#>>array['metadata',k]),'')='' then raise exception 'Three language metadata required';end if;end loop;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||(p_plan->>'draft_id'),0));
 select * into r from private.nh7_document_library_versions_v2 where request_key=md5(auth.uid()::text||p_plan::text);
 if r.id is not null then if r.created_by<>auth.uid() or r.request is distinct from p_plan then raise exception 'Request identity conflict';end if;return jsonb_build_object('id',r.id,'prepare_token',r.prepare_token,'storage_path',r.storage_path,'snapshot',r.definition,'status',r.status);end if;
 if position(auth.uid()::text in (p_plan->'snapshot')::text)>0 or position(auth.uid()::text in (p_plan->'metadata')::text)>0 then raise exception 'Private UID cannot be public';end if;
 if nullif(p_plan->>'parent','') is not null and not exists(select 1 from private.nh7_document_library_versions_v2 v where v.id=(p_plan->>'parent')::uuid and v.created_by=auth.uid() and v.status='published') then raise exception 'Invalid resource revision parent';end if;
 v_number:='NH7-R-'||to_char(now(),'YYYY')||'-'||lpad(nextval('public.nh7_document_numbers_v2')::text,6,'0');
 d:=jsonb_set(d,'{verification}',jsonb_build_object('token',v_token,'number',v_number,'code',upper(substr(replace(v_token::text,'-',''),1,12))));d:=jsonb_set(d,'{status}','"issued"');
 insert into private.nh7_document_library_versions_v2(id,created_by,draft_id,definition,metadata,authoring,request_key,request,public_token,number,storage_path,parent) values(v_id,auth.uid(),(p_plan->>'draft_id')::uuid,private.nh7_document_public_v2(d),private.nh7_document_pick_v2(p_plan->'metadata',array['title_fa','title_en','title_hr','description_fa','description_en','description_hr']),p_plan->'authoring',md5(auth.uid()::text||p_plan::text),p_plan,v_token,v_number,'documents/studio-v2/'||auth.uid()::text||'/'||v_id::text||'.pdf',nullif(p_plan->>'parent','')::uuid) returning * into r;
 return jsonb_build_object('id',r.id,'prepare_token',r.prepare_token,'storage_path',r.storage_path,'snapshot',r.definition);
end $$;
revoke all on function public.nh7_document_library_prepare_v2(jsonb) from public,anon,authenticated;
grant execute on function public.nh7_document_library_prepare_v2(jsonb) to authenticated;
-- Service only; Edge must first verify JWT/current owner and exact storage bytes/ownership.
create or replace function public.nh7_document_library_plan_v2(p_id uuid,p_uid uuid,p_prepare_token uuid) returns jsonb language sql stable security definer set search_path='' as $$select to_jsonb(r)||jsonb_build_object('snapshot',r.definition,'published',r.status='published') from private.nh7_document_library_versions_v2 r where r.id=p_id and r.created_by=p_uid and r.prepare_token=p_prepare_token$$;
revoke all on function public.nh7_document_library_plan_v2(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.nh7_document_library_plan_v2(uuid,uuid,uuid) to service_role;
create or replace function public.nh7_document_library_claim_v2(p_id uuid,p_hash text) returns boolean language plpgsql security definer set search_path='' as $$begin update private.nh7_document_library_versions_v2 set status='publishing',sha256=p_hash where id=p_id and status='prepared' and expires_at>now() and p_hash~'^[0-9a-f]{64}$';return found;end $$;
revoke all on function public.nh7_document_library_claim_v2(uuid,text) from public,anon,authenticated;
grant execute on function public.nh7_document_library_claim_v2(uuid,text) to service_role;
create or replace function public.nh7_document_library_finish_v2(p_id uuid,p_status text) returns void language plpgsql security definer set search_path='' as $$begin if p_status not in ('published','unknown') then raise exception 'Invalid state';end if;update private.nh7_document_library_versions_v2 set status=p_status where id=p_id and status='publishing';end $$;
revoke all on function public.nh7_document_library_finish_v2(uuid,text) from public,anon,authenticated;
grant execute on function public.nh7_document_library_finish_v2(uuid,text) to service_role;
create or replace function public.nh7_document_library_storage_owner_v2(p_path text,p_uid uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from storage.objects where bucket_id='nh7-library' and name=p_path and owner_id=p_uid::text)$$;
revoke all on function public.nh7_document_library_storage_owner_v2(text,uuid) from public,anon,authenticated;
grant execute on function public.nh7_document_library_storage_owner_v2(text,uuid) to service_role;
create or replace function public.nh7_document_library_status_v2(p_id uuid) returns text language sql stable security definer set search_path='' as $$select case when status='publishing' then 'unknown' else status end from private.nh7_document_library_versions_v2 where id=p_id$$;
revoke all on function public.nh7_document_library_status_v2(uuid) from public,anon,authenticated;
grant execute on function public.nh7_document_library_status_v2(uuid) to service_role;
-- Owner archive retains complete private authoring; resources never become a UID recipient delivery.
create or replace function public.nh7_document_admin_list_v2() returns jsonb language plpgsql security definer set search_path='' as $$begin perform private.nh7_document_admin_v2();return jsonb_build_object('drafts',coalesce((select jsonb_agg(to_jsonb(d)) from(select * from public.nh7_document_drafts_v2 where created_by=auth.uid() and status='draft' order by updated_at desc limit 100)d),'[]'),'issued',coalesce((select jsonb_agg(to_jsonb(d)||jsonb_build_object('authoring',jsonb_set(r.prepared,'{status}',to_jsonb(d.status)))) from(select * from public.nh7_official_documents_v2 order by issued_at desc limit 100)d join public.nh7_document_drafts_v2 r on r.id=d.draft_id),'[]'),'legacy',coalesce((select jsonb_agg(jsonb_build_object('id',id,'legacy',true,'recipient_name',user_name,'recipient_user_id',recipient_user_id,'certificate_number',certificate_number,'student_code',student_code,'public_token',public_token,'status',case when revoked_at is not null then 'revoked' else status end,'issue_date',issue_date,'certificate_type',certificate_type,'language',language)) from(select * from public.school_certificates order by issue_date desc limit 100)c),'[]'),'resources',coalesce((select jsonb_agg(jsonb_build_object('id',v.id,'library',true,'definition',v.definition,'authoring',v.authoring,'status',v.status,'certificate_number',v.number,'public_token',v.public_token)) from(select * from private.nh7_document_library_versions_v2 where created_by=auth.uid() and status in('published','unknown') order by created_at desc limit 100)v),'[]'));end $$;
-- New V2 tokens only; never alter original certificate verifier/token routes.
create or replace function public.nh7_document_verify_v2(p_token uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$declare r public.nh7_official_documents_v2;l private.nh7_document_library_versions_v2;begin select * into r from public.nh7_official_documents_v2 where public_token=p_token;if r.id is null then select * into l from private.nh7_document_library_versions_v2 where public_token=p_token and status='published';if l.id is null then return '{"status":"not_found"}'::jsonb;end if;return jsonb_build_object('status','valid','number',l.number,'resource','library');end if;if r.status='revoked' then return jsonb_build_object('status','revoked','number',r.certificate_number);end if;if r.expires_at is not null and r.expires_at<=now() then return jsonb_build_object('status','expired','number',r.certificate_number);end if;return jsonb_build_object('status','valid','number',r.certificate_number,'document',r.definition);end $$;
commit;
