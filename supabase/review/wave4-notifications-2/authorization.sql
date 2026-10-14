-- REVIEW ONLY continuation, after candidate.sql. Fresh UID/grant/subscription proof.
create function public.nh7_notification_status_wave4(p_key text) returns text language sql stable security definer set search_path='' as $$select case when status='sending' then 'unknown' else status end from public.notification_dispatch_log where wave4_key=p_key$$;
revoke all on function public.nh7_notification_status_wave4(text) from public,anon,authenticated;
create function public.nh7_notification_authorize_wave4(p_uid uuid,p_type text,p_subscription text,p_language text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users u where u.id=p_uid and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until<=now()))
 and (p_type='campaign' and not coalesce((private.nh7_notification_access_wave4(p_uid)->>'is_admin')::boolean,false) and exists(select 1 from public.registrations r join auth.users u on u.id=p_uid where r.status='approved' and lower(trim(r.payload->>'email'))=lower(u.email)) or private.nh7_notification_event_allowed_wave4(p_uid,p_type))
 and coalesce((select language from private.nh7_notification_preferences_wave4 where user_id=p_uid),(select case when r.language in ('fa','en','hr') then r.language end from public.registrations r join auth.users u on u.id=p_uid where lower(trim(r.payload->>'email'))=lower(u.email) order by r.created_at desc limit 1),'en')=p_language
 and (p_subscription='account' or exists(select 1 from private.nh7_notification_subscriptions_wave4 s where s.subscription_id::text=p_subscription and s.user_id=p_uid and s.active and s.revoked_at is null));
$$;
revoke all on function public.nh7_notification_authorize_wave4(uuid,text,text,text) from public,anon,authenticated;
-- Called only by Edge after JWT verification and provider ownership proof (for active=true).
create function public.nh7_notification_subscription_wave4(p_uid uuid,p_subscription uuid,p_active boolean) returns boolean language plpgsql security definer set search_path='' as $$
begin
 if not p_active then update private.nh7_notification_subscriptions_wave4 set active=false,revoked_at=now() where user_id=p_uid and subscription_id=p_subscription;return true;end if;
 insert into private.nh7_notification_subscriptions_wave4 values(p_subscription,p_uid,true,now(),null) on conflict(subscription_id) do update set user_id=excluded.user_id,active=true,verified_at=now(),revoked_at=null;return true;
end $$;
revoke all on function public.nh7_notification_subscription_wave4(uuid,uuid,boolean) from public,anon,authenticated;
-- RLS wrapper exposes only CURRENT caller permission, no other UID information.
create function public.nh7_notification_inbox_allowed_wave4(p_uid uuid,p_type text) returns boolean language sql stable security definer set search_path='' as $$select p_uid=auth.uid() and private.nh7_notification_event_allowed_wave4(auth.uid(),p_type)$$;
revoke all on function public.nh7_notification_inbox_allowed_wave4(uuid,text) from public;
grant execute on function public.nh7_notification_inbox_allowed_wave4(uuid,text) to anon,authenticated;
-- New rows only. Preserve every legacy row/receipt and legacy policy.
create policy nh7_notification_uid_read_wave4 on public.notification_inbox as restrictive for select to anon,authenticated using
 (recipient_uid is null or coalesce(public.nh7_is_admin(),false) or recipient_uid=auth.uid() and (category not like 'admin_event_%' or public.nh7_notification_inbox_allowed_wave4(auth.uid(),replace(category,'admin_event_',''))));
-- Resolver is current-UID + current category permission; returns no body to unauthorized callers.
create function public.nh7_notification_resolve_wave4(p_intent jsonb) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_route text:=p_intent->>'route';v_p jsonb:=coalesce(p_intent->'params','{}'::jsonb);v_id uuid;v_type text;v_table text;v_row jsonb;
begin
 if auth.uid() is null or p_intent->>'version'<>'4' or octet_length(p_intent::text)>2048 or p_intent ?| array['url','href','html'] or p_intent::text ~* '(javascript:|https?://|<|>)' then return '{"allowed":false}'::jsonb;end if;
 if p_intent ? 'recipient_uid' and p_intent->>'recipient_uid'<>auth.uid()::text then return '{"allowed":false}'::jsonb;end if;
 if exists(select 1 from jsonb_object_keys(p_intent) k where k not in ('version','route','params','recipient_uid','event_id')) then return '{"allowed":false}'::jsonb;end if;
 if v_route='admin' then
  v_type:=v_p->>'section';if v_type in ('overview','messages') then
   if not private.nh7_admin_is_owner_v350() then return '{"allowed":false}'::jsonb;end if;
  else
   if not private.nh7_notification_event_allowed_wave4(auth.uid(),v_type) then return '{"allowed":false}'::jsonb;end if;
   v_id:=(v_p->>'id')::uuid;
   v_table:=case v_type when 'registration' then 'registrations' when 'prayer' then 'nh7_prayer_requests_v502' when 'qa' then 'qa_questions' when 'assignment' then 'school_assignments' when 'testimony' then 'nh7_testimonies_v502' end;
   execute format('select to_jsonb(t) from public.%I t where id=$1',v_table) into v_row using v_id;
   if v_row is null then return '{"allowed":false}'::jsonb;end if;
  end if;
 elsif v_route='audio' and v_p ? 'item_id' then
  select to_jsonb(s) into v_row from public.sermons s where s.id=(v_p->>'item_id')::uuid and s.is_published;
  if v_row is null then return '{"allowed":false}'::jsonb;end if;
 elsif v_route='school' then
  if not public.nh7_school_access_approved_v230(auth.uid(),'','') then return '{"allowed":false}'::jsonb;end if;
  if v_p ? 'course' and v_p->>'course'<>'foundation_school' then return '{"allowed":false}'::jsonb;end if;
  if v_p ? 'lesson' then
   if not exists(select 1 from public.school_lessons l where l.code=v_p->>'lesson' and l.is_active) then return '{"allowed":false}'::jsonb;end if;
   -- Reuse EXACT existing read-only stage authority, never compute/alter progression.
   if not coalesce((public.nh7_school_class_exam_session_v351(substring(v_p->>'lesson' from '^class_0[1-7]'))->>'class_unlocked')::boolean,false) then return '{"allowed":false}'::jsonb;end if;
  end if;
 elsif v_route='plans' then
  if not exists(select 1 from public.spiritual_plan_progress p where p.user_id=auth.uid() and p.plan_id=v_p->>'plan' and p.day_number=(v_p->>'day')::integer) then return '{"allowed":false}'::jsonb;end if;
 elsif v_route not in ('home','inbox','settings','meetings','daily','bible','plans','audio') then return '{"allowed":false}'::jsonb;
 end if;
 return jsonb_build_object('allowed',true,'intent',p_intent,'record',case when v_route='admin' then jsonb_build_object('id',v_id,'summary',coalesce(v_row->>'request_text',v_row->>'question_text',v_row->>'answer_text',v_row->>'note_text',v_row->>'title',v_row->'payload'->>'firstName','')) else null end);
exception when others then return '{"allowed":false}'::jsonb;
end $$;
revoke all on function public.nh7_notification_resolve_wave4(jsonb) from public,anon,authenticated;
revoke all on function public.nh7_notification_resolve_wave4(jsonb) from public,anon;
grant execute on function public.nh7_notification_resolve_wave4(jsonb) to authenticated;
-- Service worker uses the EXISTING queue; only typed Wave4 rows, max50 per invocation.
create function public.nh7_notification_pending_events_wave4() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(e)),'[]'::jsonb) from (select id,event_type,wave4_source_id,wave4_revision from public.admin_notification_events where status='pending' and wave4_source_id is not null order by created_at limit 50) e;
$$;
revoke all on function public.nh7_notification_pending_events_wave4() from public,anon,authenticated;
create function public.nh7_notification_event_finish_wave4(p_id uuid,p_state text) returns void language sql security definer set search_path='' as $$
 update public.admin_notification_events set status=p_state,sent_at=now() where id=p_id and wave4_source_id is not null;
$$;
revoke all on function public.nh7_notification_event_finish_wave4(uuid,text) from public,anon,authenticated;
