-- REVIEW ONLY. NOT a Supabase migration; NOT applied. No user-row backfill.
-- Preflight/approval required: existing campaign/event/dispatch columns, status CHECKs,
-- snapshot function definition and provider registry absence must match README.
create table private.nh7_notification_preferences_wave4 (
 user_id uuid primary key references auth.users(id) on delete cascade, language text not null check(language in ('fa','en','hr')), updated_at timestamptz not null default now()
);
create table private.nh7_notification_subscriptions_wave4 (
 subscription_id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade, active boolean not null default true,
 verified_at timestamptz not null, revoked_at timestamptz
);
create index nh7_notification_subscription_owner_wave4 on private.nh7_notification_subscriptions_wave4(user_id) where active;
alter table private.nh7_notification_preferences_wave4 enable row level security;
alter table private.nh7_notification_subscriptions_wave4 enable row level security;
revoke all on private.nh7_notification_preferences_wave4,private.nh7_notification_subscriptions_wave4 from public,anon,authenticated;
-- Extend canonical campaign/history, event queue and dispatch ledger. No parallel Inbox/history.
alter table public.nh7_admin_campaigns_v360 add column wave4_request jsonb, add column wave4_recipients jsonb,
 add column wave4_preview_token uuid, add column wave4_expires_at timestamptz, add column wave4_result jsonb;
alter table public.admin_notification_events add column wave4_source_id uuid, add column wave4_revision integer,
 add column wave4_created_at timestamptz;
create unique index nh7_notification_event_unique_wave4 on public.admin_notification_events(event_type,wave4_source_id,wave4_revision) where wave4_source_id is not null;
alter table public.notification_dispatch_log add column wave4_key text, add column wave4_payload jsonb, add column wave4_result jsonb;
create unique index nh7_notification_dispatch_unique_wave4 on public.notification_dispatch_log(wave4_key) where wave4_key is not null;
alter table public.notification_inbox add column recipient_uid uuid, add column intent jsonb;
create index nh7_notification_inbox_uid_wave4 on public.notification_inbox(recipient_uid,delivered_at desc) where recipient_uid is not null;

create function private.nh7_notification_access_wave4(p_uid uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('is_admin',coalesce(m.is_active and (m.role='owner' or exists(select 1 from private.nh7_admin_permission_grants_v350 g join private.nh7_admin_permission_catalog_v350 c on c.permission_key=g.permission_key and c.is_enabled where g.user_id=u.id)),false),'is_owner',coalesce(m.is_active and m.role='owner',false),
 'permissions',coalesce((select jsonb_agg(g.permission_key order by g.permission_key) from private.nh7_admin_permission_grants_v350 g join private.nh7_admin_permission_catalog_v350 c on c.permission_key=g.permission_key and c.is_enabled where g.user_id=u.id),'[]'::jsonb))
 from auth.users u left join private.nh7_admin_members_v350 m on m.user_id=u.id
 where u.id=p_uid and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until<=now());
$$;
revoke all on function private.nh7_notification_access_wave4(uuid) from public,anon,authenticated;
create function private.nh7_notification_event_allowed_wave4(p_uid uuid,p_type text) returns boolean language sql stable security definer set search_path='' as $$
 select p_type in ('registration','prayer','qa','assignment','testimony') and coalesce(
 (private.nh7_notification_access_wave4(p_uid)->>'is_owner')::boolean or
 p_type='registration' and (private.nh7_notification_access_wave4(p_uid)->>'is_admin')::boolean and
 (private.nh7_notification_access_wave4(p_uid)->'permissions') ? 'registrations.view',false);
$$;
revoke all on function private.nh7_notification_event_allowed_wave4(uuid,text) from public,anon,authenticated;
create function public.nh7_notification_access_wave4(p_uid uuid) returns jsonb language sql stable security definer set search_path='' as $$select private.nh7_notification_access_wave4(p_uid)$$;
revoke all on function public.nh7_notification_access_wave4(uuid) from public,anon,authenticated;
create function public.nh7_notification_preference_wave4(p_language text) returns boolean language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from auth.users u where u.id=auth.uid() and (u.banned_until is null or u.banned_until<=now())) or p_language not in ('fa','en','hr') then raise exception 'denied';end if;
 insert into private.nh7_notification_preferences_wave4 values(auth.uid(),p_language,now()) on conflict(user_id) do update set language=excluded.language,updated_at=now() where private.nh7_notification_preferences_wave4.language is distinct from excluded.language;
 return true;
end $$;
revoke all on function public.nh7_notification_preference_wave4(text) from public,anon,authenticated;
create function public.nh7_notification_accounts_wave4() returns jsonb language sql stable security definer set search_path='' as $$
 with users as (
 select u.id user_id,lower(u.email) email,
 coalesce(p.language,(select case when r.language in ('fa','en','hr') then r.language end from public.registrations r where lower(trim(r.payload->>'email'))=lower(u.email) order by r.created_at desc limit 1),'') language,
 exists(select 1 from public.registrations r where r.status='approved' and lower(trim(r.payload->>'email'))=lower(u.email)) approved,
 coalesce((private.nh7_notification_access_wave4(u.id)->>'is_admin')::boolean,false) is_admin,
 coalesce((select jsonb_agg(s.subscription_id::text order by s.subscription_id) from private.nh7_notification_subscriptions_wave4 s where s.user_id=u.id and s.active and s.revoked_at is null),'[]'::jsonb) subscriptions
 from auth.users u left join private.nh7_notification_preferences_wave4 p on p.user_id=u.id
 where u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until<=now())
 ) select coalesce(jsonb_agg(to_jsonb(users)||'{"active":true}'::jsonb order by user_id),'[]'::jsonb) from users;
$$;
revoke all on function public.nh7_notification_accounts_wave4() from public,anon,authenticated;

create function public.nh7_notification_campaign_preview_wave4(p_request jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_id uuid:=(p_request->>'request_id')::uuid;v_token uuid;v_accounts jsonb;v_row public.nh7_admin_campaigns_v360;v_mode text:=p_request->>'mode';v_rec jsonb;v_l text;v_count integer;
begin
 if not coalesce(private.nh7_admin_is_owner_v350(),false) then raise exception 'denied';end if;
 if octet_length(p_request::text)>1048576 or not (p_request ?& array['request_id','mode','channels','target_route']) or exists(select 1 from jsonb_object_keys(p_request) k where k not in ('request_id','mode','segment','audience','channels','target_route','recipients','title_fa','body_fa','title_en','body_en','title_hr','body_hr')) then raise exception 'invalid_request';end if;
 if v_mode not in ('all','segment','single') or p_request->>'target_route' not in ('home','inbox','audio','settings','meetings','school') or jsonb_typeof(p_request->'channels')<>'array' or jsonb_array_length(p_request->'channels') not between 1 and 2 or exists(select 1 from jsonb_array_elements_text(p_request->'channels') x where x not in ('push','inbox')) then raise exception 'invalid_request';end if;
 if v_mode='segment' and p_request->>'segment' not in ('fa','en','hr') then raise exception 'invalid_segment';end if;
 if v_mode='single' and jsonb_array_length(p_request->'recipients')<>1 then raise exception 'invalid_single';end if;
 select coalesce(jsonb_agg(a||jsonb_build_object('language',case when a->>'language' in ('fa','en','hr') then a->>'language' else 'en' end,'language_fallback',a->>'language' not in ('fa','en','hr')) order by a->>'user_id'),'[]'::jsonb) into v_accounts
 from jsonb_array_elements(public.nh7_notification_accounts_wave4()) a
 where (a->>'approved')::boolean and not (a->>'is_admin')::boolean
 and (v_mode='all' or v_mode='segment' and (case when a->>'language' in ('fa','en','hr') then a->>'language' else 'en' end)=p_request->>'segment' or v_mode='single' and a->>'user_id'=p_request->'recipients'->0->>'user_id');
 v_count:=jsonb_array_length(v_accounts);if v_count not between 1 and 2000 then raise exception 'audience_empty_or_over_limit';end if;
 for v_rec in select * from jsonb_array_elements(v_accounts) loop v_l:=v_rec->>'language';if length(trim(coalesce(p_request->>('title_'||v_l),''))) not between 1 and 300 or length(trim(coalesce(p_request->>('body_'||v_l),''))) not between 1 and 20000 then raise exception 'missing_language_copy';end if;end loop;
 insert into public.nh7_admin_campaigns_v360(id,created_by,audience,channels,title_fa,body_fa,title_en,body_en,title_hr,body_hr,target_user_ids,target_emails,target_route,status,recipient_count,wave4_request,wave4_recipients,wave4_preview_token,wave4_expires_at)
 values(v_id,auth.uid(),case when v_mode='all' then 'all' else 'selected' end,array(select jsonb_array_elements_text(p_request->'channels')),coalesce(p_request->>'title_fa',''),coalesce(p_request->>'body_fa',''),coalesce(p_request->>'title_en',''),coalesce(p_request->>'body_en',''),coalesce(p_request->>'title_hr',''),coalesce(p_request->>'body_hr',''),array(select (a->>'user_id')::uuid from jsonb_array_elements(v_accounts) a),array(select a->>'email' from jsonb_array_elements(v_accounts) a),p_request->>'target_route','draft',v_count,p_request,v_accounts,gen_random_uuid(),now()+interval '10 minutes') on conflict(id) do nothing;
 select * into v_row from public.nh7_admin_campaigns_v360 where id=v_id for update;
 if v_row.created_by<>auth.uid() or v_row.wave4_request is distinct from p_request then raise exception 'request_identity_conflict';end if;
 -- Re-preview may refresh an UNSENT draft, never revive an executed/unknown campaign.
 if v_row.status='draft' then update public.nh7_admin_campaigns_v360 set wave4_recipients=v_accounts,wave4_expires_at=now()+interval '10 minutes' where id=v_id;else raise exception 'check_campaign_history';end if;
 v_token:=v_row.wave4_preview_token;
 return jsonb_build_object('version',4,'request_id',v_id,'preview_token',v_token,'recipients',v_accounts,'inbox_accounts',case when p_request->'channels' ? 'inbox' then v_count else 0 end,'push_devices',case when p_request->'channels' ? 'push' then (select coalesce(sum(jsonb_array_length(a->'subscriptions')),0) from jsonb_array_elements(v_accounts) a) else 0 end);
end $$;
revoke all on function public.nh7_notification_campaign_preview_wave4(jsonb) from public,anon,authenticated;
create function public.nh7_notification_preview_load_wave4(p_id uuid,p_actor uuid,p_token uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.nh7_admin_campaigns_v360;
begin
 select * into r from public.nh7_admin_campaigns_v360 where id=p_id and created_by=p_actor and wave4_preview_token=p_token for update;
 if not found then raise exception 'preview_missing';end if;
 return jsonb_build_object('request',r.wave4_request,'recipients',r.wave4_recipients,'expired',r.wave4_expires_at<now());
end $$;
revoke all on function public.nh7_notification_preview_load_wave4(uuid,uuid,uuid) from public,anon,authenticated;
create function public.nh7_notification_claim_wave4(p_key text,p_payload jsonb) returns boolean language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 if length(p_key)>500 or p_key not like 'nh7-v4:%' then raise exception 'invalid_claim';end if;
 insert into public.notification_dispatch_log(schedule_key,zagreb_date,language,status,claimed_at,wave4_key,wave4_payload)
 values(p_key,(now() at time zone 'Europe/Zagreb')::date,p_payload->>'language','sending',now(),p_key,p_payload) on conflict do nothing;
 get diagnostics n=row_count;return n=1;
end $$;
revoke all on function public.nh7_notification_claim_wave4(text,jsonb) from public,anon,authenticated;
create function public.nh7_notification_finish_wave4(p_key text,p_state text,p_result jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
 if p_state not in ('recorded','accepted','unknown','revoked','no_subscription') then raise exception 'invalid_state';end if;
 update public.notification_dispatch_log set status=p_state,wave4_result=p_result where wave4_key=p_key;
end $$;
revoke all on function public.nh7_notification_finish_wave4(text,text,jsonb) from public,anon,authenticated;
create function public.nh7_notification_inbox_wave4(p_key text,p_row jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.notification_dispatch_log where wave4_key=p_key and wave4_payload->>'channel'='inbox' and wave4_payload->>'user_id'=p_row->>'recipient_uid') then raise exception 'claim_required';end if;
 insert into public.notification_inbox(user_email,recipient_uid,title,body,language,category,intent,dedupe_key,delivered_at)
 values(p_row->>'user_email',(p_row->>'recipient_uid')::uuid,p_row->>'title',p_row->>'body',p_row->>'language',p_row->>'category',p_row->'intent',p_key,(p_row->>'delivered_at')::timestamptz) on conflict(dedupe_key) do nothing;
end $$;
revoke all on function public.nh7_notification_inbox_wave4(text,jsonb) from public,anon,authenticated;
create function public.nh7_notification_campaign_finish_wave4(p_id uuid,p_status text,p_results jsonb) returns void language sql security definer set search_path='' as $$
 update public.nh7_admin_campaigns_v360 set status=p_status,wave4_result=p_results,sent_at=now() where id=p_id;
$$;
revoke all on function public.nh7_notification_campaign_finish_wave4(uuid,text,jsonb) from public,anon,authenticated;
create function public.nh7_notification_event_source_wave4(p_type text,p_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_table text;v_exists boolean;v_revision integer;
begin
 v_table:=case p_type when 'registration' then 'registrations' when 'prayer' then 'nh7_prayer_requests_v502' when 'qa' then 'qa_questions' when 'assignment' then 'school_assignments' when 'testimony' then 'nh7_testimonies_v502' end;
 if v_table is null then raise exception 'invalid_event';end if;
 execute format('select true from public.%I t where id=$1',v_table) into v_exists using p_id;
 select max(wave4_revision) into v_revision from public.admin_notification_events where event_type=p_type and wave4_source_id=p_id;
 return jsonb_build_object('exists',coalesce(v_exists,false),'revision',coalesce(v_revision,1));
end $$;
revoke all on function public.nh7_notification_event_source_wave4(text,uuid) from public,anon,authenticated;

-- Only registration has a current delegable permission. Other events remain owner-only.
create function private.nh7_notification_enqueue_wave4() returns trigger language plpgsql security definer set search_path='' as $$
declare v_type text:=tg_argv[0];v_revision integer;v_changed boolean;
begin
 v_changed:=tg_op='INSERT';
 if tg_op='UPDATE' then v_changed:=to_jsonb(new)->>'status' is distinct from to_jsonb(old)->>'status';end if;
 if not v_changed then return new;end if;
 -- Serialize revisions of this one business row without touching the business data.
 perform pg_advisory_xact_lock(hashtextextended(v_type||':'||new.id::text,0));
 select coalesce(max(wave4_revision),0)+1 into v_revision from public.admin_notification_events where event_type=v_type and wave4_source_id=new.id;
 insert into public.admin_notification_events(event_type,status,title_fa,title_en,title_hr,body_fa,body_en,body_hr,wave4_source_id,wave4_revision,wave4_created_at)
 values(v_type,'pending','اعلان مدیر امید نو ۷','New Hope 7 — Admin','New Hope 7 — administracija','درخواست تازه برای بررسی آماده است.','A new request is ready for review.','Novi zahtjev spreman je za pregled.',new.id,v_revision,now()) on conflict do nothing;
 return new;
end $$;
revoke all on function private.nh7_notification_enqueue_wave4() from public,anon,authenticated;
-- Attach only AFTER preflight and explicit approval; no invocation/backfill of existing rows.
create trigger nh7_notifications_registration_wave4 after insert or update of status on public.registrations for each row execute function private.nh7_notification_enqueue_wave4('registration');
create trigger nh7_notifications_prayer_wave4 after insert or update of status on public.nh7_prayer_requests_v502 for each row execute function private.nh7_notification_enqueue_wave4('prayer');
create trigger nh7_notifications_qa_wave4 after insert or update of status on public.qa_questions for each row execute function private.nh7_notification_enqueue_wave4('qa');
create trigger nh7_notifications_assignment_wave4 after insert or update of status on public.school_assignments for each row execute function private.nh7_notification_enqueue_wave4('assignment');
create trigger nh7_notifications_testimony_wave4 after insert or update of status on public.nh7_testimonies_v502 for each row execute function private.nh7_notification_enqueue_wave4('testimony');
-- Explicit execute grants: personal preference/current-owner preview only for authenticated.
-- Only newly proposed helpers are revoked/granted; existing private functions untouched.
revoke all on function public.nh7_notification_preference_wave4(text),public.nh7_notification_campaign_preview_wave4(jsonb) from public,anon;
grant execute on function public.nh7_notification_preference_wave4(text),public.nh7_notification_campaign_preview_wave4(jsonb) to authenticated;
-- Service-only helper grants are generated in service-grants.sql; authenticated must not call them.
