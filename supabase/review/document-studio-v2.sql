-- REVIEW ONLY. Never applied to Production by CI or development. Additive, idempotent Studio V2.
-- Preconditions: existing public.nh7_is_admin(), school_student_identities,
-- school_certificates recipient_user_id/student_code. Existing tables/RPCs untouched.
begin;
create table if not exists public.nh7_document_drafts_v2(
 id uuid primary key,created_by uuid not null,definition jsonb not null,
 revision integer not null default 1,status text not null default 'draft' check(status in('draft','issued')),
 issued_id uuid,reserved_certificate_number text unique,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create sequence if not exists public.nh7_document_numbers_v2;
create table if not exists public.nh7_official_documents_v2(
 id uuid primary key default gen_random_uuid(),draft_id uuid not null unique references public.nh7_document_drafts_v2(id),
 public_token uuid not null unique default gen_random_uuid(),certificate_number text not null unique,
 recipient_user_id uuid references auth.users(id) on delete set null,recipient_name text not null,recipient_email text,student_code text,
 definition jsonb not null,status text not null default 'issued' check(status in('issued','revoked')),
 issued_at timestamptz not null default now(),issued_by uuid not null,
 revoked_at timestamptz,revoked_by uuid,revocation_reason text,
 replaces uuid references public.nh7_official_documents_v2(id),expires_at timestamptz
);
create table if not exists public.nh7_document_deliveries_v2(
 document_id uuid primary key references public.nh7_official_documents_v2(id),
 recipient_user_id uuid not null references auth.users(id) on delete cascade,delivered_at timestamptz not null default now(),delivered_by uuid not null
);
create table if not exists public.nh7_document_design_templates_v2(
 id uuid primary key default gen_random_uuid(),name text not null,definition jsonb not null,created_by uuid not null,created_at timestamptz not null default now()
);
create index if not exists nh7_documents_recipient_v2 on public.nh7_official_documents_v2(recipient_user_id);
alter table public.nh7_document_drafts_v2 enable row level security;
alter table public.nh7_official_documents_v2 enable row level security;
alter table public.nh7_document_deliveries_v2 enable row level security;
alter table public.nh7_document_design_templates_v2 enable row level security;
-- Audit actor UUIDs intentionally have no auth.users FK: preserve history without blocking account deletion.
-- Recipient account deletion detaches the certificate and removes its archive delivery only.
-- No direct client table policies/grants. Only narrowly scoped security-definer RPCs.
revoke all on public.nh7_document_drafts_v2,public.nh7_official_documents_v2,public.nh7_document_deliveries_v2,public.nh7_document_design_templates_v2 from public,anon,authenticated;
revoke all on sequence public.nh7_document_numbers_v2 from public,anon,authenticated;
create schema if not exists private;
create or replace function private.nh7_document_admin_v2() returns void language plpgsql security definer set search_path='' as $$
begin if auth.uid() is null or not coalesce(public.nh7_is_admin(),false) then raise exception 'Admin access required' using errcode='42501';end if;end $$;
revoke all on function private.nh7_document_admin_v2() from public,anon,authenticated;
create or replace function private.nh7_document_validate_v2(d jsonb) returns void language plpgsql security definer set search_path='' as $$
declare e jsonb;s text;v text;w numeric;h numeric;
begin
 if d is null or d->>'design_schema_version' is distinct from '2' or jsonb_typeof(d->'elements') is distinct from 'array' or jsonb_array_length(d->'elements')>100 or octet_length(d::text)>3000000 then raise exception 'Invalid document definition';end if;
 if coalesce(d->>'language','') not in('fa','en','hr') or coalesce(d->>'orientation','') not in('portrait','landscape') or jsonb_typeof(d->'recipient') is distinct from 'object' or jsonb_typeof(d->'contents') is distinct from 'object' then raise exception 'Invalid document structure';end if;
 if coalesce(d->>'type','') not in('water_baptism','course_completion','foundation_school','ministry_training','participation','membership','active_membership','ministry_service','volunteer','conference','leadership','graduation','official_letter','custom_certificate','custom_document') then raise exception 'Invalid document type';end if;
 for v in select x from unnest(array['background','secondary','ink','accent']) x loop if coalesce(d#>>array['theme',v],'')!~'^#[0-9a-fA-F]{3,8}$' then raise exception 'Invalid theme';end if;end loop;
 if jsonb_typeof(d#>'{theme,gradient}') is distinct from 'boolean' then raise exception 'Invalid background mode';end if;
 if (select count(*) from jsonb_array_elements(d->'elements'))<>(select count(distinct x->>'id') from jsonb_array_elements(d->'elements') x) then raise exception 'Duplicate element IDs';end if;
 w:=case when d->>'orientation'='landscape' then 297 else 210 end;h:=case when d->>'orientation'='landscape' then 210 else 297 end;
 for e in select value from jsonb_array_elements(d->'elements') loop
  for v in select x from unnest(array['x','y','width','height','fontSize','rotation','opacity','borderWidth','radius','padding','lineHeight','letterSpacing','focalX','focalY','zoom']) x loop if jsonb_typeof(e->v) is distinct from 'number' then raise exception 'Geometry must be numeric';end if;end loop;
  if jsonb_typeof(e->'visible') is distinct from 'boolean' or jsonb_typeof(e->'locked') is distinct from 'boolean' then raise exception 'Invalid element flags';end if;
  if e->>'type' in('title','recipient','number','qr') and coalesce(e->>'binding','')<>(case e->>'type' when 'title' then 'title' when 'recipient' then 'recipient' when 'number' then 'number' else 'qr' end) then raise exception 'Invalid protected binding';end if;
  if coalesce(e->>'type','') not in('title','subtitle','recipient','body','text','number','student','date','church','contact','photo','logo','qr','verification','signature','signer','role','seal','watermark','line','frame','shape','background','footer') then raise exception 'Invalid element type';end if;
  if (e->>'width')::numeric<=0 or (e->>'height')::numeric<=0 or (e->>'opacity')::numeric not between 0 and 1 then raise exception 'Invalid dimensions';end if;
  if (e->>'fontSize')::numeric not between 1 and 150 or (e->>'lineHeight')::numeric not between 0.5 and 5 or (e->>'zoom')::numeric not between 0.1 and 10 or (e->>'focalX')::numeric not between 0 and 100 or (e->>'focalY')::numeric not between 0 and 100 or (e->>'padding')::numeric<0 or (e->>'borderWidth')::numeric<0 or coalesce(e->>'align','') not in('left','center','right','justify') or coalesce(e->>'fit','') not in('cover','contain') then raise exception 'Invalid style ranges';end if;
  if coalesce(e->>'font','')<>'' and e->>'font' not in('Vazirmatn','Noto Naskh Arabic','Amiri','Markazi Text','Inter','Lora') then raise exception 'Unsupported font';end if;
  for v in select x from unnest(array[e->>'color',e->>'background',e->>'borderColor']) x loop if coalesce(v,'')!~'^(#[0-9a-fA-F]{3,8}|transparent)$' then raise exception 'Invalid style color';end if;end loop;
 end loop;
 for s in select value from jsonb_each_text(coalesce(d->'assets','{}')) union all select d#>>'{recipient,photo}' union all select x->>'src' from jsonb_array_elements(d->'elements') x loop
  if coalesce(s,'')<>'' and not(s~'^data:image/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$' or (s~'^assets/[a-zA-Z0-9_/.-]+\.(png|jpg|jpeg|webp)$' and s not like '%..%') or s~'^https://gpzcwffxnddhaeaogdyo\.supabase\.co/storage/v1/object/public/(nh7-public-document-assets/|church-audio/documents/)[a-zA-Z0-9_./%-]+(\?[a-zA-Z0-9_=.&%-]+)?$') then raise exception 'Use uploaded images or approved public document assets';end if;
 end loop;
end $$;
revoke all on function private.nh7_document_validate_v2(jsonb) from public,anon,authenticated;
-- Public projection is an allow-list, never the Admin/private draft object.
create or replace function private.nh7_document_pick_v2(o jsonb,keys text[]) returns jsonb language sql immutable set search_path='' as $$
 select coalesce(jsonb_object_agg(k,v),'{}'::jsonb) from jsonb_each(o) x(k,v) where k=any(keys);
$$;
revoke all on function private.nh7_document_pick_v2(jsonb,text[]) from public,anon,authenticated;
create or replace function private.nh7_document_public_v2(d jsonb) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
 'design_schema_version',2,'language',d->'language','orientation',d->'orientation','type',d->'type','template',d->'template','status',d->'status',
 'page',private.nh7_document_pick_v2(d->'page',array['width','height']),
 'theme',private.nh7_document_pick_v2(d->'theme',array['background','secondary','gradient','ink','accent']),
 'contents',jsonb_build_object(d->>'language',private.nh7_document_pick_v2(d#>array['contents',d->>'language'],array['title','subtitle','body','footer'])),
 'church',private.nh7_document_pick_v2(d->'church',array['name','address','phone','email','website']),
 'assets',(select coalesce(jsonb_object_agg(k,v),'{}'::jsonb) from jsonb_each(d->'assets') kv(k,v) where k in('logo','signature','seal','background') and exists(select 1 from jsonb_array_elements(d->'elements') x where (x->>'visible')::boolean and x->>'binding'=k)),
 'signer',d->'signer','role',d->'role','issueDate',d->'issueDate',
 'verification',private.nh7_document_pick_v2(d->'verification',array['number','token','code']),
 'recipient',jsonb_build_object('name',d#>'{recipient,name}','studentId',case when exists(select 1 from jsonb_array_elements(d->'elements') x where x->>'binding'='studentId' and (x->>'visible')::boolean) then d#>'{recipient,studentId}' else '""'::jsonb end,'photo',case when exists(select 1 from jsonb_array_elements(d->'elements') x where x->>'binding'='photo' and (x->>'visible')::boolean) then d#>'{recipient,photo}' else '""'::jsonb end),
 'elements',(select coalesce(jsonb_agg(private.nh7_document_pick_v2(e,array['id','type','x','y','width','height','binding','font','fontSize','fontWeight','italic','underline','color','background','borderColor','borderWidth','radius','rotation','opacity','visible','locked','align','lineHeight','letterSpacing','padding','fit','focalX','focalY','zoom','frame','shadow','dashed','src'])||jsonb_build_object('text',jsonb_build_object(d->>'language',e#>array['text',d->>'language']))),'[]'::jsonb) from jsonb_array_elements(d->'elements') e where (e->>'visible')::boolean));
$$;
revoke all on function private.nh7_document_public_v2(jsonb) from public,anon,authenticated;
create or replace function public.nh7_document_capabilities_v2() returns jsonb language plpgsql security definer set search_path='' as $$
begin perform private.nh7_document_admin_v2();return jsonb_build_object('schema_version',2,'owner_uid',auth.uid(),'mutations',true);end $$;
create or replace function public.nh7_document_recipients_v2() returns jsonb language plpgsql security definer set search_path='' as $$
begin perform private.nh7_document_admin_v2();return coalesce((select jsonb_agg(jsonb_build_object('user_id',u.id,'name',coalesce(nullif(u.raw_user_meta_data->>'full_name',''),nullif(u.raw_user_meta_data->>'name',''),i.student_code,u.email),'email',u.email,'student_code',i.student_code)) from auth.users u left join public.school_student_identities i on i.user_id=u.id and i.status='active'),'[]');end $$;
create or replace function public.nh7_document_save_draft_v2(p_document jsonb,p_revision integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.nh7_document_drafts_v2;v_id uuid;
begin perform private.nh7_document_admin_v2();perform private.nh7_document_validate_v2(p_document);v_id:=(p_document->>'id')::uuid;
 perform pg_advisory_xact_lock(hashtextextended(v_id::text,0));
 select * into r from public.nh7_document_drafts_v2 where id=v_id for update;
 if r.id is not null and (r.status<>'draft' or r.revision<>p_revision) then raise exception 'Draft changed or already issued; reload before saving';end if;
 if coalesce(p_document->>'status','draft')<>'draft' then raise exception 'Issued state cannot become a draft';end if;
 insert into public.nh7_document_drafts_v2(id,created_by,definition,revision) values(v_id,auth.uid(),p_document,1)
 on conflict(id) do update set definition=excluded.definition,revision=nh7_document_drafts_v2.revision+1,updated_at=now() returning * into r;
 return jsonb_build_object('id',r.id,'revision',r.revision,'definition',r.definition);end $$;
create or replace function public.nh7_document_reserve_number_v2(p_id uuid,p_revision integer) returns text language plpgsql security definer set search_path='' as $$
declare r public.nh7_document_drafts_v2;v_number text;
begin perform private.nh7_document_admin_v2();select * into r from public.nh7_document_drafts_v2 where id=p_id for update;
 if r.id is null or r.status<>'draft' or r.revision<>p_revision then raise exception 'Draft changed; reload';end if;
 v_number:=coalesce(r.reserved_certificate_number,'NH7-D-'||to_char(now(),'YYYY')||'-'||lpad(nextval('public.nh7_document_numbers_v2')::text,6,'0'));
 update public.nh7_document_drafts_v2 set reserved_certificate_number=v_number where id=p_id;return v_number;end $$;
create or replace function public.nh7_document_issue_v2(p_id uuid,p_revision integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.nh7_document_drafts_v2;o public.nh7_official_documents_v2;d jsonb;e jsonb;v_uid uuid;v_code text;v_email text;v_number text;v_token uuid:=gen_random_uuid();w numeric;h numeric;bw numeric;bh numeric;
begin perform private.nh7_document_admin_v2();select * into r from public.nh7_document_drafts_v2 where id=p_id for update;
 if r.id is null then raise exception 'Draft not found';end if;
 if r.status='issued' then select * into o from public.nh7_official_documents_v2 where draft_id=p_id;return to_jsonb(o);end if;
 if r.revision<>p_revision then raise exception 'Draft revision mismatch';end if;
 d:=r.definition;perform private.nh7_document_validate_v2(d);
 if coalesce(trim(d#>>'{recipient,name}'),'')='' or coalesce(trim(d#>>array['contents',d->>'language','title']),'')='' or coalesce(trim(d->>'signer'),'')='' then raise exception 'Recipient, title and signer are required';end if;
 v_uid:=nullif(d#>>'{recipient,userId}','')::uuid;
 if v_uid is not null then select email into v_email from auth.users where id=v_uid;if not found then raise exception 'Recipient account not found';end if;select student_code into v_code from public.school_student_identities where user_id=v_uid and status='active';else v_email:=left(d#>>'{recipient,email}',320);end if;
 if d->>'type'='foundation_school' and not exists(select 1 from public.school_certificates c where c.recipient_user_id=v_uid and c.course_code='foundation_school' and c.status='approved' and c.revoked_at is null) then raise exception 'An existing approved School certificate is required; use the School issuance workflow first';end if;
 if d->>'type' in('foundation_school','course_completion','ministry_training','leadership','graduation') and v_code is null then raise exception 'Canonical Student ID is required';end if;
 for e in select value from jsonb_array_elements(d->'elements') where coalesce((value->>'visible')::boolean,true) loop
  w:=case when d->>'orientation'='landscape' then 297 else 210 end;h:=case when d->>'orientation'='landscape' then 210 else 297 end;
  bw:=abs((e->>'width')::numeric*cos(radians((e->>'rotation')::numeric)))+abs((e->>'height')::numeric*sin(radians((e->>'rotation')::numeric)));
  bh:=abs((e->>'width')::numeric*sin(radians((e->>'rotation')::numeric)))+abs((e->>'height')::numeric*cos(radians((e->>'rotation')::numeric)));
  if (e->>'x')::numeric+((e->>'width')::numeric-bw)/2<0 or (e->>'y')::numeric+((e->>'height')::numeric-bh)/2<0 or (e->>'x')::numeric+((e->>'width')::numeric+bw)/2>w or (e->>'y')::numeric+((e->>'height')::numeric+bh)/2>h then raise exception 'Element outside page';end if;
  if e->>'type'='qr' and ((e->>'width')::numeric<>(e->>'height')::numeric or (e->>'width')::numeric not between 15 and 60 or (e->>'opacity')::numeric<>1) then raise exception 'Invalid verification QR';end if;
 end loop;
 for v_number in select x from unnest(array['title','recipient','number','qr']) x loop if not exists(select 1 from jsonb_array_elements(d->'elements') x where x->>'type'=v_number and (x->>'visible')::boolean) then raise exception 'Missing protected element';end if;end loop;
 v_number:=coalesce(r.reserved_certificate_number,'NH7-D-'||to_char(now(),'YYYY')||'-'||lpad(nextval('public.nh7_document_numbers_v2')::text,6,'0'));
 d:=jsonb_set(d,'{recipient,studentId}',to_jsonb(coalesce(v_code,'')));d:=jsonb_set(d,'{verification}',jsonb_build_object('number',v_number,'token',v_token,'code',upper(substr(replace(v_token::text,'-',''),1,12))));d:=jsonb_set(d,'{status}','"issued"');
 insert into public.nh7_official_documents_v2(draft_id,certificate_number,public_token,recipient_user_id,recipient_name,recipient_email,student_code,definition,issued_by,replaces)
 values(p_id,v_number,v_token,v_uid,d#>>'{recipient,name}',v_email,v_code,private.nh7_document_public_v2(d),auth.uid(),nullif(d->>'replaces','')::uuid) returning * into o;
 update public.nh7_document_drafts_v2 set status='issued',issued_id=o.id where id=p_id;return to_jsonb(o);end $$;
create or replace function public.nh7_document_admin_list_v2() returns jsonb language plpgsql security definer set search_path='' as $$
begin perform private.nh7_document_admin_v2();return jsonb_build_object('drafts',coalesce((select jsonb_agg(to_jsonb(d) order by updated_at desc) from public.nh7_document_drafts_v2 d where status='draft'),'[]'),'issued',coalesce((select jsonb_agg(to_jsonb(d) order by issued_at desc) from public.nh7_official_documents_v2 d),'[]'),'legacy',coalesce((select jsonb_agg(jsonb_build_object('id',id,'legacy',true,'recipient_name',user_name,'recipient_user_id',recipient_user_id,'course_code',course_code,'certificate_number',certificate_number,'student_code',student_code,'public_token',public_token,'status',case when revoked_at is not null then 'revoked' else status end,'issue_date',issue_date,'certificate_type',certificate_type,'language',language)) from public.school_certificates),'[]'));end $$;
create or replace function public.nh7_document_revoke_v2(p_id uuid,p_reason text default '') returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.nh7_official_documents_v2;
begin perform private.nh7_document_admin_v2();update public.nh7_official_documents_v2 set status='revoked',revoked_at=coalesce(revoked_at,now()),revoked_by=coalesce(revoked_by,auth.uid()),revocation_reason=case when status='revoked' then revocation_reason else left(p_reason,2000) end where id=p_id returning * into r;if r.id is null then raise exception 'Document not found';end if;return to_jsonb(r);end $$;
create or replace function public.nh7_document_deliver_v2(p_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.nh7_official_documents_v2;
begin perform private.nh7_document_admin_v2();select * into r from public.nh7_official_documents_v2 where id=p_id for update;if r.status<>'issued' or r.recipient_user_id is null then raise exception 'Issued document with canonical recipient account required';end if;
 insert into public.nh7_document_deliveries_v2(document_id,recipient_user_id,delivered_by) values(r.id,r.recipient_user_id,auth.uid()) on conflict(document_id) do nothing;return jsonb_build_object('delivered',true,'id',r.id);end $$;
create or replace function public.nh7_document_delete_draft_v2(p_id uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin perform private.nh7_document_admin_v2();delete from public.nh7_document_drafts_v2 where id=p_id and status='draft';return found;end $$;
create or replace function public.nh7_document_save_template_v2(p_name text,p_definition jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin perform private.nh7_document_admin_v2();perform private.nh7_document_validate_v2(p_definition);
 if coalesce(p_definition#>>'{recipient,name}','')<>'' or coalesce(p_definition#>>'{recipient,photo}','')<>'' or coalesce(p_definition#>>'{verification,token}','')<>'' or coalesce(p_definition#>>'{recipient,userId}','')<>'' or coalesce(p_definition#>>'{recipient,email}','')<>'' or coalesce(p_definition#>>'{recipient,studentId}','')<>'' or coalesce(p_definition#>>'{verification,number}','')<>'' or coalesce(p_definition#>>'{verification,code}','')<>'' or nullif(p_definition->>'replaces','') is not null or p_definition->>'status' is distinct from 'draft' or exists(select 1 from jsonb_array_elements(p_definition->'elements') x where x->>'type'='photo' and coalesce(x->>'src','')<>'') then raise exception 'Template must have no recipient/issued identity';end if;
 insert into public.nh7_document_design_templates_v2(name,definition,created_by) values(left(p_name,120),p_definition,auth.uid()) returning id into v_id;return v_id;end $$;
create or replace function public.nh7_document_templates_v2() returns jsonb language plpgsql security definer set search_path='' as $$
begin perform private.nh7_document_admin_v2();return coalesce((select jsonb_agg(to_jsonb(t)) from public.nh7_document_design_templates_v2 t),'[]');end $$;
create or replace function public.nh7_document_verify_v2(p_token uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare r public.nh7_official_documents_v2;
begin select * into r from public.nh7_official_documents_v2 where public_token=p_token;
 if r.id is null then return jsonb_build_object('found',false,'status','not_found');end if;
 if r.status='revoked' then return jsonb_build_object('found',true,'status','revoked','number',r.certificate_number,'issued_at',r.issued_at);end if;
 if r.expires_at is not null and r.expires_at<now() then return jsonb_build_object('found',true,'status','expired','number',r.certificate_number);end if;
 return jsonb_build_object('found',true,'status','valid','number',r.certificate_number,'issued_at',r.issued_at,'document',r.definition);end $$;
create or replace function public.nh7_my_documents_v2() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin if auth.uid() is null then raise exception 'Sign in required' using errcode='42501';end if;
 return jsonb_build_object('documents',coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'status',case when d.status='revoked' then 'revoked' when d.expires_at<now() then 'expired' else d.status end,'number',d.certificate_number,'issued_at',d.issued_at,'public_token',d.public_token,'document',jsonb_set(d.definition,'{status}',to_jsonb(case when d.status='revoked' then 'revoked' when d.expires_at<now() then 'expired' else d.status end)))) from public.nh7_document_deliveries_v2 x join public.nh7_official_documents_v2 d on d.id=x.document_id where x.recipient_user_id=auth.uid() and d.recipient_user_id=auth.uid()),'[]'),'legacy',coalesce((select jsonb_agg(jsonb_build_object('legacy',true,'number',c.certificate_number,'status',case when c.revoked_at is not null then 'revoked' else c.status end,'issue_date',c.issue_date,'type',c.certificate_type,'public_token',c.public_token)) from public.school_certificates c where c.recipient_user_id=auth.uid()),'[]'));end $$;
-- Exact ACLs: all mutations/admin reads require a real caller UID AND nh7_is_admin.
revoke all on function public.nh7_document_capabilities_v2() from public,anon,authenticated;
grant execute on function public.nh7_document_capabilities_v2() to authenticated;
revoke all on function public.nh7_document_recipients_v2() from public,anon,authenticated;
grant execute on function public.nh7_document_recipients_v2() to authenticated;
revoke all on function public.nh7_document_save_draft_v2(jsonb,integer) from public,anon,authenticated;
grant execute on function public.nh7_document_save_draft_v2(jsonb,integer) to authenticated;
revoke all on function public.nh7_document_issue_v2(uuid,integer) from public,anon,authenticated;
grant execute on function public.nh7_document_issue_v2(uuid,integer) to authenticated;
revoke all on function public.nh7_document_reserve_number_v2(uuid,integer) from public,anon,authenticated;
grant execute on function public.nh7_document_reserve_number_v2(uuid,integer) to authenticated;
revoke all on function public.nh7_document_admin_list_v2() from public,anon,authenticated;
grant execute on function public.nh7_document_admin_list_v2() to authenticated;
revoke all on function public.nh7_document_revoke_v2(uuid,text) from public,anon,authenticated;
grant execute on function public.nh7_document_revoke_v2(uuid,text) to authenticated;
revoke all on function public.nh7_document_deliver_v2(uuid) from public,anon,authenticated;
grant execute on function public.nh7_document_deliver_v2(uuid) to authenticated;
revoke all on function public.nh7_document_delete_draft_v2(uuid) from public,anon,authenticated;
grant execute on function public.nh7_document_delete_draft_v2(uuid) to authenticated;
revoke all on function public.nh7_document_save_template_v2(text,jsonb) from public,anon,authenticated;
grant execute on function public.nh7_document_save_template_v2(text,jsonb) to authenticated;
revoke all on function public.nh7_document_templates_v2() from public,anon,authenticated;
grant execute on function public.nh7_document_templates_v2() to authenticated;
revoke all on function public.nh7_document_verify_v2(uuid) from public,anon,authenticated;
grant execute on function public.nh7_document_verify_v2(uuid) to authenticated;
revoke all on function public.nh7_my_documents_v2() from public,anon,authenticated;
grant execute on function public.nh7_my_documents_v2() to authenticated;
grant execute on function public.nh7_document_verify_v2(uuid) to anon;
commit;
-- No deployment here. See docs/DOCUMENT_STUDIO_V2_BACKEND_REVIEW.md for rollback.
