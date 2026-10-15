-- REVIEW ONLY. Superset source inventory MUST be reconciled with deployed schema/FKs/JSON identity paths first.
create schema if not exists private;
create table private.nh7_delete_jobs_wave65 (
 request_id uuid primary key,actor_id uuid not null,target_id uuid not null,email_hash text not null check(email_hash ~ '^[a-f0-9]{64}$'),
 stage text not null default 'authorized' check(stage in ('authorized','storage','database','auth','verified')),
 created_at timestamptz not null default now(),counts jsonb not null default '{}',
 unique(target_id)
);
alter table private.nh7_delete_jobs_wave65 enable row level security;
revoke all on private.nh7_delete_jobs_wave65 from public,anon,authenticated;
create table private.nh7_delete_scope_wave65 (
 table_name text primary key,uid_keys text[] not null,email_keys text[] not null,json_keys text[] not null,
 policy text not null check(policy in ('purge','exception')), approved boolean not null default false
);
alter table private.nh7_delete_scope_wave65 enable row level security;
revoke all on private.nh7_delete_scope_wave65 from public,anon,authenticated;
-- Source identity-coverage.json is a discovery superset, NOT authority to set approved=true.
-- Before activation: import exact reviewed deployed keys, classify ALL identity/JSON/FK paths and immutable history;
-- missing/unapproved scope or policy exception with active PII MUST block full-purge success.
create or replace function private.nh7_delete_match_wave65(row_data jsonb,p_uid uuid,p_email text,uid_keys text[],email_keys text[],json_keys text[]) returns boolean
language plpgsql immutable set search_path='' as $$
declare doc jsonb:=row_data; k text; u text; seen boolean:=false; matches boolean:=false;
begin
 foreach k in array json_keys loop doc:=doc||coalesce(row_data->k,'{}'::jsonb);end loop;
 foreach k in array uid_keys loop
  u:=nullif(doc->>k,'');if u is not null then seen:=true;if u<>p_uid::text then return false;end if;matches:=true;end if;
 end loop;
 if seen then return matches;end if;
 foreach k in array email_keys loop if lower(trim(coalesce(doc->>k,'')))=p_email then return true;end if;end loop;
 -- Never match a device identifier. Exclusively-owned legacy data needs a separately approved identity linkage.
 return false;
end;$$;
-- Retained/shared rows may reference the target while belonging to someone else: block/redact, never purge B.
create or replace function private.nh7_delete_reference_wave65(row_data jsonb,p_uid uuid,p_email text,uid_keys text[],email_keys text[],json_keys text[]) returns boolean
language plpgsql immutable set search_path='' as $$
declare doc jsonb:=row_data;k text;
begin
 foreach k in array json_keys loop doc:=doc||coalesce(row_data->k,'{}'::jsonb);end loop;
 foreach k in array uid_keys loop if doc->>k=p_uid::text then return true;end if;end loop;
 foreach k in array email_keys loop if lower(trim(coalesce(doc->>k,'')))=p_email then return true;end if;end loop;
 return false;
end;$$;
create or replace function public.nh7_full_delete_prepare_wave65(p_request_id uuid,p_actor_id uuid,p_target_user_id uuid,p_email text,p_email_hash text,p_phrase text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare job private.nh7_delete_jobs_wave65%rowtype; allowed boolean;
begin
 if p_phrase<>'DELETE' then raise exception 'DELETE_CONFIRMATION';end if;
 select * into job from private.nh7_delete_jobs_wave65 where request_id=p_request_id for update;
 if job.request_id is not null then
  if job.actor_id<>p_actor_id or job.target_id<>p_target_user_id or job.email_hash<>p_email_hash then raise exception 'DELETE_IDEMPOTENCY_TARGET';end if;
  return to_jsonb(job);
 end if;
 if not exists(select 1 from auth.users where id=p_actor_id and email_confirmed_at is not null) then raise exception 'DELETE_ACTOR';end if;
 allowed:=p_actor_id=p_target_user_id or exists(select 1 from private.nh7_admin_members_v350 where user_id=p_actor_id and role='owner' and is_active);
 if not allowed then raise exception 'DELETE_PERMISSION';end if;
 if exists(select 1 from private.nh7_admin_members_v350 where user_id=p_target_user_id and is_active) then raise exception 'DELETE_PROTECTED_ADMIN';end if;
 if not exists(select 1 from auth.users where id=p_target_user_id and lower(email)=lower(trim(p_email))) then raise exception 'DELETE_TARGET';end if;
 if not exists(select 1 from private.nh7_delete_scope_wave65) or exists(select 1 from private.nh7_delete_scope_wave65 where not approved) then raise exception 'DELETE_PREFLIGHT_REQUIRED';end if;
 insert into private.nh7_delete_jobs_wave65(request_id,actor_id,target_id,email_hash) values(p_request_id,p_actor_id,p_target_user_id,p_email_hash) returning * into job;
 return to_jsonb(job);
end;$$;
create or replace function public.nh7_full_delete_database_wave65(p_request_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare job private.nh7_delete_jobs_wave65%rowtype; scope private.nh7_delete_scope_wave65%rowtype; e text; n bigint; v_counts jsonb:='{}'; relation regclass;
begin
 select * into job from private.nh7_delete_jobs_wave65 where request_id=p_request_id for update;
 if job.stage in ('database','auth','verified') then return to_jsonb(job);end if;
 if job.stage<>'storage' then raise exception 'DELETE_STORAGE_FIRST';end if;
 if exists(select 1 from private.nh7_admin_members_v350 where user_id=job.target_id and is_active) then raise exception 'DELETE_PROTECTED_ADMIN';end if;
 if job.actor_id<>job.target_id and not exists(select 1 from private.nh7_admin_members_v350 where user_id=job.actor_id and role='owner' and is_active) then raise exception 'DELETE_PERMISSION_REVOKED';end if;
 select lower(email) into e from auth.users where id=job.target_id for update;
 if e is null then raise exception 'DELETE_TARGET_MISSING';end if;
 -- No broad scans from a client. Owner-approved bounded server workflow only, after exact schema census/index review.
 for scope in select * from private.nh7_delete_scope_wave65 order by table_name loop
  if not scope.approved then raise exception 'DELETE_PREFLIGHT_REQUIRED';end if;
  relation:=to_regclass(scope.table_name);if relation is null then raise exception 'DELETE_SCHEMA_CHANGED';end if;
  execute format('select count(*) from %s r where private.%I(to_jsonb(r),$1,$2,$3,$4,$5)',relation,case when scope.policy='exception' then 'nh7_delete_reference_wave65' else 'nh7_delete_match_wave65' end)
   into n using job.target_id,e,scope.uid_keys,scope.email_keys,scope.json_keys;
  if scope.policy='exception' and n>0 then raise exception 'DELETE_RETENTION_APPROVAL_REQUIRED';end if;
  execute format('delete from %s r where private.nh7_delete_match_wave65(to_jsonb(r),$1,$2,$3,$4,$5)',relation)
   using job.target_id,e,scope.uid_keys,scope.email_keys,scope.json_keys;
  get diagnostics n=row_count;v_counts:=v_counts||jsonb_build_object(scope.table_name,n);
 end loop;
 update private.nh7_delete_jobs_wave65 set stage='database',counts=v_counts where request_id=p_request_id returning * into job;
 return to_jsonb(job);
end;$$;
-- All stage transitions must use exact job/actor/target. Worker is service-only; no client may update private jobs.
create or replace function public.nh7_full_delete_stage_wave65(p_request_id uuid,p_stage text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare job private.nh7_delete_jobs_wave65%rowtype;
begin
 select * into job from private.nh7_delete_jobs_wave65 where request_id=p_request_id for update;
 if not found then raise exception 'DELETE_JOB_MISSING';end if;
 if job.stage=p_stage then return to_jsonb(job);end if;
 if not ((job.stage='authorized' and p_stage='storage') or (job.stage='database' and p_stage='auth') or (job.stage='auth' and p_stage='verified')) then raise exception 'DELETE_STAGE_ORDER';end if;
 if p_stage in ('auth','verified') and exists(select 1 from auth.users where id=job.target_id) then raise exception 'DELETE_AUTH_REMAINS';end if;
 update private.nh7_delete_jobs_wave65 set stage=p_stage where request_id=p_request_id returning * into job;
 return to_jsonb(job);
end;$$;
revoke all on function private.nh7_delete_reference_wave65(jsonb,uuid,text,text[],text[],text[]) from public,anon,authenticated;
revoke all on function private.nh7_delete_match_wave65(jsonb,uuid,text,text[],text[],text[]) from public,anon,authenticated;
revoke all on function public.nh7_full_delete_prepare_wave65(uuid,uuid,uuid,text,text,text),public.nh7_full_delete_database_wave65(uuid),public.nh7_full_delete_stage_wave65(uuid,text) from public,anon,authenticated;
grant execute on function public.nh7_full_delete_prepare_wave65(uuid,uuid,uuid,text,text,text),public.nh7_full_delete_database_wave65(uuid),public.nh7_full_delete_stage_wave65(uuid,text) to service_role;

-- REVIEW ONLY write-fence primitive. Attach as BEFORE INSERT/UPDATE to each EXACT approved identity relation,
-- including Storage INSERT/UPDATE only after Storage API compatibility review. Never DELETE storage rows.
-- An old JWT must not recreate data after Auth deletion. This checks immutable UID tombstones, not email/device.
create or replace function private.nh7_delete_write_fence_wave65() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from private.nh7_delete_jobs_wave65 where target_id=auth.uid()) then raise exception 'ACCOUNT_DELETING';end if;
 return new;
end;$$;
revoke all on function private.nh7_delete_write_fence_wave65() from public,anon,authenticated;
-- Scope attachment is deliberately NOT generated from guessed live columns. Before worker activation, every
-- write path (RPC/definer/service/Storage) must pass concurrency tests; service writes need explicit target fencing.
