-- New Hope 7 v2.1.8 — targeted certificate text, password recovery support, and reliable message cleanup
-- Additive only. No users, messages, certificates, lessons, or app content are deleted automatically.
create extension if not exists pgcrypto;
create sequence if not exists public.school_certificate_number_seq start 1;

alter table public.school_certificates add column if not exists certificate_type text not null default 'school';
alter table public.school_certificates add column if not exists title_fa text default '';
alter table public.school_certificates add column if not exists title_en text default '';
alter table public.school_certificates add column if not exists title_hr text default '';
alter table public.school_certificates add column if not exists body_fa text default '';
alter table public.school_certificates add column if not exists body_en text default '';
alter table public.school_certificates add column if not exists body_hr text default '';
alter table public.school_certificates add column if not exists public_token uuid default gen_random_uuid();
update public.school_certificates set public_token=gen_random_uuid() where public_token is null;

-- Reliable bulk deletion for the admin message center. Returns the real deleted row count.
create or replace function public.nh7_admin_delete_inbox_messages_v218(p_ids text[])
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare v_count integer:=0;
begin
  if not coalesce(public.nh7_admin_is_admin_v170(),false) then
    raise exception 'Admin access required';
  end if;
  delete from public.notification_inbox
  where id::text = any(coalesce(p_ids,array[]::text[]));
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.nh7_admin_delete_inbox_messages_v218(text[]) from public, anon;
grant execute on function public.nh7_admin_delete_inbox_messages_v218(text[]) to authenticated;

-- Issue or reissue a school certificate while preserving admin-edited multilingual text.
create or replace function public.nh7_admin_issue_school_certificate_v218(
  p_user_email text,
  p_user_name text,
  p_course_code text default 'foundation_school',
  p_language text default 'fa',
  p_final_score numeric default null,
  p_title_fa text default '',
  p_title_en text default '',
  p_title_hr text default '',
  p_body_fa text default '',
  p_body_en text default '',
  p_body_hr text default '',
  p_approved_by text default 'Apostle Yuhana'
)
returns public.school_certificates
language plpgsql
security definer
set search_path=public
as $$
declare
  v_row public.school_certificates;
  v_lang text:=case when lower(coalesce(p_language,'fa')) in ('fa','en','hr') then lower(p_language) else 'fa' end;
  v_course text:=coalesce(nullif(trim(p_course_code),''),'foundation_school');
  v_number text;
begin
  if not coalesce(public.nh7_admin_is_admin_v170(),false) then raise exception 'Admin access required'; end if;
  if nullif(trim(coalesce(p_user_email,'')),'') is null then raise exception 'User email is required'; end if;
  if nullif(trim(coalesce(p_user_name,'')),'') is null then raise exception 'User name is required'; end if;

  select * into v_row
  from public.school_certificates
  where lower(user_email)=lower(trim(p_user_email))
    and course_code=v_course
    and coalesce(certificate_type,'school')='school'
  order by created_at desc
  limit 1;

  if found then
    update public.school_certificates set
      user_name=trim(p_user_name),status='approved',language=v_lang,certificate_type='school',
      final_score_percent=p_final_score,title_fa=coalesce(p_title_fa,''),title_en=coalesce(p_title_en,''),title_hr=coalesce(p_title_hr,''),
      body_fa=coalesce(p_body_fa,''),body_en=coalesce(p_body_en,''),body_hr=coalesce(p_body_hr,''),
      approved_by=coalesce(nullif(trim(p_approved_by),''),'Apostle Yuhana'),approved_at=now(),revoked_at=null,
      public_token=coalesce(public_token,gen_random_uuid()),updated_at=now()
    where id=v_row.id returning * into v_row;
  else
    v_number:='NH7-FS-'||extract(year from now())::int||'-'||lpad(nextval('public.school_certificate_number_seq')::text,5,'0');
    insert into public.school_certificates(
      user_email,user_name,course_code,certificate_number,status,language,certificate_type,final_score_percent,
      title_fa,title_en,title_hr,body_fa,body_en,body_hr,approved_by,approved_at,public_token,created_at,updated_at
    ) values (
      lower(trim(p_user_email)),trim(p_user_name),v_course,v_number,'approved',v_lang,'school',p_final_score,
      coalesce(p_title_fa,''),coalesce(p_title_en,''),coalesce(p_title_hr,''),
      coalesce(p_body_fa,''),coalesce(p_body_en,''),coalesce(p_body_hr,''),
      coalesce(nullif(trim(p_approved_by),''),'Apostle Yuhana'),now(),gen_random_uuid(),now(),now()
    ) returning * into v_row;
  end if;
  return v_row;
end;
$$;
revoke all on function public.nh7_admin_issue_school_certificate_v218(text,text,text,text,numeric,text,text,text,text,text,text,text) from public, anon;
grant execute on function public.nh7_admin_issue_school_certificate_v218(text,text,text,text,numeric,text,text,text,text,text,text,text) to authenticated;
