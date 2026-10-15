-- REVIEW ONLY. Not a migration. Preflight/Store adoption/owner approval required; no existing rows rewritten.
create schema if not exists private;
create or replace function private.nh7_phone_wave65(p text) returns text
language sql immutable set search_path='' as $$
 select regexp_replace(translate(trim(coalesce(p,'')),'۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩','01234567890123456789'),'[[:space:]()\-]','','g');
$$;
create or replace function private.nh7_human_wave65(p text) returns boolean
language sql immutable set search_path='' as $$
 select length(trim(coalesce(p,''))) between 1 and 8000
 and trim(p) ~ '[[:alnum:]]' and trim(p) !~ '^([^[:space:]])\1+$';
$$;
create or replace function private.nh7_registration_error_wave65(p_email text,p jsonb) returns text
language plpgsql stable set search_path='' as $$
declare k text; v text; e text:=lower(trim(coalesce(p_email,''))); phone text; d date;
begin
 if p is null or jsonb_typeof(p)<>'object' then return 'REG_REQUIRED:packet'; end if;
 if e<>lower(trim(coalesce(p->>'email',''))) or e !~ '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,24}$'
 or split_part(e,'@',1) ~ '^\.|\.$|\.\.' or split_part(e,'@',2) ~ '^[-.]|[-.]$|\.\.|\.-|-\.' then return 'REG_EMAIL';end if;
 if split_part(e,'@',2) = any(array['gmil.com','gmai.com','gmal.com','gmail.co','gmail.con','gmail.om','gmail.cmo','gmailcom','hotmial.com','hotmai.com','hotmail.con','hotmail.co','hotmailcom','yaho.com','yahoo.con','yahoo.co','yahoocom','outlok.com','outloo.com','outlook.con','outlook.co','outlookcom']) then return 'REG_EMAIL_TYPO';end if;
 foreach k in array array['firstName','lastName','city','country','spiritualAge','testimony','howFound'] loop
  if not private.nh7_human_wave65(p->>k) then return 'REG_REQUIRED:'||k;end if;
 end loop;
 foreach k in array array['churchMember','waterBaptism','salvationPrayer','eventsInterest'] loop
  if coalesce(p->>k,'') not in ('yes','no') then return 'REG_OPTION_INVALID:'||k;end if;
 end loop;
 if p->>'churchMember'='yes' and (not private.nh7_human_wave65(p->>'churchName') or not private.nh7_human_wave65(p->>'pastorName')) then return 'REG_REQUIRED:churchName';end if;
 phone:=private.nh7_phone_wave65(p->>'phone');
 if phone !~ '^\+[1-9][0-9]{7,14}$' or phone ~ '^\+([0-9])\1+$' then return 'REG_PHONE_E164';end if;
 v:=p->>'birthDate';if coalesce(v,'') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then return 'REG_BIRTHDATE';end if;
 begin d:=v::date;exception when others then return 'REG_BIRTHDATE';end;
 if d>current_date or to_char(d,'YYYY-MM-DD')<>v then return 'REG_BIRTHDATE';end if;
 return null;
end;$$;
create or replace function private.nh7_registration_before_wave65() returns trigger
language plpgsql security definer set search_path='' as $$
declare e text; err text; u auth.users%rowtype; actor uuid:=auth.uid();k text;
begin
 if new.type<>'school' then return new;end if;
 e:=lower(trim(coalesce(new.payload->>'email','')));
 err:=private.nh7_registration_error_wave65(e,new.payload);
 if err is not null then raise exception using errcode='23514',message=err;end if;
 -- Trusted atomic Auth AFTER INSERT nesting is distinct from an anonymous RPC (depth 1).
 if actor is null and not (tg_op='INSERT' and pg_trigger_depth()>1 and coalesce(current_setting('role',true),'') not in ('anon','authenticated')) then raise exception 'REG_AUTH_REQUIRED';end if;
 select * into u from auth.users where lower(email)=e;
 if u.id is null then raise exception 'REG_AUTH_REQUIRED';end if;
 if actor is not null and actor<>u.id and not private.nh7_admin_is_owner_v350() and not public.nh7_is_admin() then raise exception 'REG_EMAIL_IDENTITY';end if;
 if tg_op='INSERT' and exists(select 1 from public.registrations r where r.type='school' and lower(r.payload->>'email')=e) then raise exception 'REG_DUPLICATE';end if;
 if new.status='approved' and (tg_op='INSERT' or old.status is distinct from 'approved') and not private.nh7_admin_is_owner_v350() and not public.nh7_is_admin() then raise exception 'REG_APPROVAL_PERMISSION';end if;
 if new.status='approved' and u.email_confirmed_at is null then raise exception 'REG_EMAIL_CONFIRMATION_REQUIRED';end if;
 if tg_op='UPDATE' and (lower(coalesce(old.payload->>'email',''))<>e or coalesce(old.payload->>'auth_user_id',u.id::text)<>u.id::text) then raise exception 'REG_IDENTITY_IMMUTABLE';end if;
 foreach k in array array['firstName','lastName','city','country','spiritualAge','testimony','howFound','churchName','pastorName'] loop if new.payload ? k then new.payload:=jsonb_set(new.payload,array[k],to_jsonb(trim(new.payload->>k)));end if;end loop;
 new.payload:=new.payload||jsonb_build_object('email',e,'auth_user_id',u.id::text,'status',new.status,'kind','school','device_id',new.device_id,'phone',private.nh7_phone_wave65(new.payload->>'phone'));
 return new;
end;$$;
-- Install only after actual column/function/trigger preflight; all existing v348/v355/v356 gates remain.
create trigger nh7_registration_strict_wave65 before insert or update on public.registrations for each row execute function private.nh7_registration_before_wave65();
create or replace function private.nh7_auth_signup_before_wave65() returns trigger
language plpgsql security definer set search_path='' as $$
declare err text;
begin
 err:=private.nh7_registration_error_wave65(new.email,new.raw_user_meta_data->'school_registration');
 if err is not null then raise exception using errcode='23514',message=err;end if;
 new.raw_user_meta_data:=jsonb_set(new.raw_user_meta_data,'{school_registration,phone}',to_jsonb(private.nh7_phone_wave65(new.raw_user_meta_data->'school_registration'->>'phone')));
 return new;
end;$$;
create trigger nh7_auth_signup_strict_wave65 before insert on auth.users for each row execute function private.nh7_auth_signup_before_wave65();
create or replace function public.nh7_submit_registration_wave65(p_type text,p_email text,p_device_id text,p_language text,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); e text; err text; r public.registrations%rowtype;
begin
 select lower(email) into e from auth.users where id=uid;
 if uid is null or e is null or lower(trim(p_email))<>e then raise exception 'REG_EMAIL_IDENTITY';end if;
 if p_type<>'school' or coalesce(trim(p_device_id),'')='' then raise exception 'REG_REQUIRED:device';end if;
 err:=private.nh7_registration_error_wave65(e,p_payload);if err is not null then raise exception using errcode='23514',message=err;end if;
 perform pg_advisory_xact_lock(hashtextextended(e,65));
 select * into r from public.registrations where type='school' and lower(payload->>'email')=e order by created_at desc limit 1 for update;
 if r.id is not null and r.status in ('pending','approved') then return jsonb_build_object('registration_id',r.id,'status',r.status);end if;
 if r.id is null then
  insert into public.registrations(type,device_id,status,language,payload) values('school',p_device_id,'pending',case when p_language in ('fa','en','hr') then p_language else 'en' end,p_payload) returning * into r;
 else
  update public.registrations set payload=p_payload,status='pending',updated_at=now() where id=r.id returning * into r;
 end if;
 return jsonb_build_object('registration_id',r.id,'status',r.status);
end;$$;
revoke all on function private.nh7_phone_wave65(text),private.nh7_human_wave65(text),private.nh7_registration_error_wave65(text,jsonb),private.nh7_registration_before_wave65(),private.nh7_auth_signup_before_wave65() from public,anon,authenticated;
revoke all on function public.nh7_submit_registration_wave65(text,text,text,text,jsonb) from public,anon;
grant execute on function public.nh7_submit_registration_wave65(text,text,text,text,jsonb) to authenticated;
