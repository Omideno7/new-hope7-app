-- New Hope 7 v2.1.7 — Targeted admin fixes only
-- Safe additive migration. No app content, users, lessons, sermons, or attempts are deleted.
create extension if not exists pgcrypto;

-- Certificate fields for manual ministry/calling certificates and public verification.
alter table public.school_certificates add column if not exists certificate_type text not null default 'school';
alter table public.school_certificates add column if not exists title_fa text default '';
alter table public.school_certificates add column if not exists title_en text default '';
alter table public.school_certificates add column if not exists title_hr text default '';
alter table public.school_certificates add column if not exists designation_fa text default '';
alter table public.school_certificates add column if not exists designation_en text default '';
alter table public.school_certificates add column if not exists designation_hr text default '';
alter table public.school_certificates add column if not exists body_fa text default '';
alter table public.school_certificates add column if not exists body_en text default '';
alter table public.school_certificates add column if not exists body_hr text default '';
alter table public.school_certificates add column if not exists public_token uuid default gen_random_uuid();
alter table public.school_certificates add column if not exists inbox_sent_at timestamptz;
update public.school_certificates set public_token=gen_random_uuid() where public_token is null;
create unique index if not exists school_certificates_public_token_uidx on public.school_certificates(public_token);

create or replace function public.nh7_admin_issue_certificate_v217(
  p_user_email text,
  p_user_name text,
  p_certificate_type text default 'ministry_service',
  p_language text default 'fa',
  p_title_fa text default '',
  p_title_en text default '',
  p_title_hr text default '',
  p_designation_fa text default '',
  p_designation_en text default '',
  p_designation_hr text default '',
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
  v_type text := lower(coalesce(nullif(trim(p_certificate_type),''),'custom'));
  v_lang text := case when lower(coalesce(p_language,'fa')) in ('fa','en','hr') then lower(p_language) else 'fa' end;
  v_code text;
  v_prefix text;
  v_number text;
begin
  if not coalesce(public.nh7_admin_is_admin_v170(), false) then raise exception 'Admin access required'; end if;
  if nullif(trim(coalesce(p_user_email,'')),'') is null then raise exception 'User email is required'; end if;
  if nullif(trim(coalesce(p_user_name,'')),'') is null then raise exception 'User name is required'; end if;
  v_prefix := case v_type when 'ministry_service' then 'SVC' when 'calling' then 'CALL' when 'participation' then 'PART' else 'CERT' end;
  v_code := v_type || ':' || replace(gen_random_uuid()::text,'-','');
  v_number := 'NH7-' || v_prefix || '-' || extract(year from now())::int || '-' || lpad(nextval('public.school_certificate_number_seq')::text,5,'0');
  insert into public.school_certificates(
    user_email,user_name,course_code,certificate_number,status,language,certificate_type,
    title_fa,title_en,title_hr,designation_fa,designation_en,designation_hr,
    body_fa,body_en,body_hr,approved_by,approved_at,public_token,created_at,updated_at
  ) values (
    lower(trim(p_user_email)),trim(p_user_name),v_code,v_number,'approved',v_lang,v_type,
    coalesce(p_title_fa,''),coalesce(p_title_en,''),coalesce(p_title_hr,''),
    coalesce(p_designation_fa,''),coalesce(p_designation_en,''),coalesce(p_designation_hr,''),
    coalesce(p_body_fa,''),coalesce(p_body_en,''),coalesce(p_body_hr,''),
    coalesce(nullif(trim(p_approved_by),''),'Apostle Yuhana'),now(),gen_random_uuid(),now(),now()
  ) returning * into v_row;
  return v_row;
end;
$$;
revoke all on function public.nh7_admin_issue_certificate_v217(text,text,text,text,text,text,text,text,text,text,text,text,text,text) from public, anon;
grant execute on function public.nh7_admin_issue_certificate_v217(text,text,text,text,text,text,text,text,text,text,text,text,text,text) to authenticated;

create or replace function public.nh7_public_certificate_lookup(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path=public
as $$
  select jsonb_build_object(
    'certificate_number',c.certificate_number,'certificate_type',c.certificate_type,
    'user_name',c.user_name,'course_code',c.course_code,'language',c.language,
    'title_fa',c.title_fa,'title_en',c.title_en,'title_hr',c.title_hr,
    'designation_fa',c.designation_fa,'designation_en',c.designation_en,'designation_hr',c.designation_hr,
    'body_fa',c.body_fa,'body_en',c.body_en,'body_hr',c.body_hr,
    'final_score_percent',c.final_score_percent,'approved_by',c.approved_by,
    'approved_at',c.approved_at,'created_at',c.created_at,'status',c.status
  )
  from public.school_certificates c
  where c.public_token=p_token and c.status='approved' and c.revoked_at is null
  limit 1
$$;
revoke all on function public.nh7_public_certificate_lookup(uuid) from public;
grant execute on function public.nh7_public_certificate_lookup(uuid) to anon, authenticated;

-- Assignment score calculator. Class 4A and 4B are treated as one assignment unit,
-- matching the current app logic. Missing / revision-required assignments count as zero.
create or replace function public.nh7_assignment_unit_key(p_lesson_code text)
returns text language sql immutable as $$
  select case
    when lower(coalesce(p_lesson_code,'')) ~ '^class_[0-9]+[a-z]?_' then regexp_replace(lower(p_lesson_code),'^(class_[0-9]+)[a-z]?_.*$','\1')
    else lower(coalesce(p_lesson_code,''))
  end
$$;

create or replace function public.nh7_assignment_score_for_user(p_user_email text,p_course_code text)
returns table(score_percent integer,completed_count integer,total_count integer)
language sql stable security definer set search_path=public as $$
with expected as (
  select l.lesson_code, public.nh7_assignment_unit_key(l.lesson_code) as unit_key
  from public.school_lessons l
  where l.is_active is not false
    and coalesce(nullif(l.content_data #>> '{course,code}',''),'foundation_school')=coalesce(nullif(p_course_code,''),'foundation_school')
    and (
      length(trim(coalesce(l.content_data #>> '{translations,fa,assignment_question}','')))>0 or
      length(trim(coalesce(l.content_data #>> '{translations,en,assignment_question}','')))>0 or
      length(trim(coalesce(l.content_data #>> '{translations,hr,assignment_question}','')))>0
    )
), per_lesson as (
  select e.unit_key,e.lesson_code,
    case when lower(coalesce(a.status,'')) in ('submitted','approved') then greatest(0,least(100,coalesce(a.score_percent,0))) else 0 end as lesson_score,
    case when lower(coalesce(a.status,'')) in ('submitted','approved') then 1 else 0 end as lesson_complete
  from expected e
  left join public.school_assignments a
    on lower(a.user_email)=lower(trim(p_user_email)) and a.lesson_code=e.lesson_code
), per_unit as (
  select unit_key,round(avg(lesson_score))::integer as unit_score,min(lesson_complete)::integer as unit_complete
  from per_lesson group by unit_key
)
select coalesce(round(avg(unit_score))::integer,100),coalesce(sum(unit_complete),0)::integer,count(*)::integer from per_unit
$$;
revoke all on function public.nh7_assignment_score_for_user(text,text) from public, anon;
grant execute on function public.nh7_assignment_score_for_user(text,text) to authenticated;

create or replace function public.nh7_recalculate_exam_scores(p_user_email text,p_course_code text default 'foundation_school')
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  v_course text:=coalesce(nullif(p_course_code,''),'foundation_school');
  v_score integer:=100; v_completed integer:=0; v_total integer:=0;
  a record; v_objective integer; v_final integer; v_any_pass boolean;
  v_exam_weight integer; v_assignment_weight integer; v_passing_score integer;
  v_best_id uuid; v_best_user_name text; v_best_exam_id uuid; v_best_final integer;
  v_best_objective integer; v_best_assignment integer; v_best_submitted timestamptz;
begin
  select s.score_percent,s.completed_count,s.total_count into v_score,v_completed,v_total
  from public.nh7_assignment_score_for_user(p_user_email,v_course) s;

  for a in
    select * from public.school_exam_attempts
    where lower(user_email)=lower(trim(p_user_email))
      and (course_code=v_course or lesson_code='course:'||v_course)
  loop
    select coalesce(exam_weight,70),coalesce(assignment_weight,30),coalesce(passing_score,70)
      into v_exam_weight,v_assignment_weight,v_passing_score
    from public.school_exams where id=a.exam_id;
    if not found then
      v_exam_weight:=70; v_assignment_weight:=30; v_passing_score:=70;
    end if;

    v_objective:=case
      when coalesce(a.total_questions,0)>0
        then round(coalesce(a.correct_count,0)::numeric*100/greatest(1,a.total_questions))::integer
      else coalesce(a.objective_score_percent,0)
    end;
    v_final:=round((v_objective*v_exam_weight+v_score*v_assignment_weight)::numeric/
                   greatest(1,v_exam_weight+v_assignment_weight))::integer;

    update public.school_exam_attempts
    set objective_score_percent=v_objective,
        assignment_score_percent=v_score,
        assignment_completed_count=v_completed,
        assignment_total_count=v_total,
        final_score_percent=v_final,
        score_percent=v_final,
        passed=(v_final>=v_passing_score)
    where id=a.id;
  end loop;

  select exists(
    select 1 from public.school_exam_attempts
    where lower(user_email)=lower(trim(p_user_email))
      and (course_code=v_course or lesson_code='course:'||v_course)
      and passed=true
  ) into v_any_pass;

  select id,user_name,exam_id,final_score_percent,objective_score_percent,
         assignment_score_percent,submitted_at
    into v_best_id,v_best_user_name,v_best_exam_id,v_best_final,
         v_best_objective,v_best_assignment,v_best_submitted
  from public.school_exam_attempts
  where lower(user_email)=lower(trim(p_user_email))
    and (course_code=v_course or lesson_code='course:'||v_course)
  order by final_score_percent desc,submitted_at desc
  limit 1;

  if found then
    insert into public.school_progress(
      user_email,user_name,lesson_code,progress_percent,completed_at,exam_id,exam_score,
      objective_score_percent,assignment_score_percent,final_score_percent,
      exam_passed,exam_attempted_at,updated_at
    )
    values(
      lower(trim(p_user_email)),coalesce(v_best_user_name,''),'course:'||v_course,
      case when v_any_pass then 100 else v_best_final end,
      case when v_any_pass then now() else null end,
      v_best_exam_id,v_best_final,v_best_objective,v_best_assignment,v_best_final,
      v_any_pass,v_best_submitted,now()
    )
    on conflict(user_email,lesson_code) do update set
      user_name=excluded.user_name,
      progress_percent=excluded.progress_percent,
      completed_at=case when excluded.exam_passed
                        then coalesce(public.school_progress.completed_at,excluded.completed_at)
                        else null end,
      exam_id=excluded.exam_id,
      exam_score=excluded.exam_score,
      objective_score_percent=excluded.objective_score_percent,
      assignment_score_percent=excluded.assignment_score_percent,
      final_score_percent=excluded.final_score_percent,
      exam_passed=excluded.exam_passed,
      exam_attempted_at=excluded.exam_attempted_at,
      updated_at=now();
  end if;
end;
$$;
revoke all on function public.nh7_recalculate_exam_scores(text,text) from public, anon;
grant execute on function public.nh7_recalculate_exam_scores(text,text) to authenticated;

create or replace function public.nh7_assignment_recalculate_trigger()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='DELETE' then
    perform public.nh7_recalculate_exam_scores(old.user_email,coalesce(nullif(old.course_code,''),'foundation_school'));
    return old;
  end if;
  perform public.nh7_recalculate_exam_scores(new.user_email,coalesce(nullif(new.course_code,''),'foundation_school'));
  if tg_op='UPDATE' and (lower(old.user_email)<>lower(new.user_email) or old.course_code<>new.course_code) then
    perform public.nh7_recalculate_exam_scores(old.user_email,coalesce(nullif(old.course_code,''),'foundation_school'));
  end if;
  return new;
end;
$$;
drop trigger if exists nh7_school_assignment_recalculate on public.school_assignments;
create trigger nh7_school_assignment_recalculate after insert or update or delete on public.school_assignments
for each row execute function public.nh7_assignment_recalculate_trigger();

-- Backfill existing attempts so assignments completed after an exam are included now.
do $$ declare r record; begin
  for r in select distinct lower(user_email) user_email,coalesce(nullif(course_code,''),'foundation_school') course_code from public.school_exam_attempts loop
    perform public.nh7_recalculate_exam_scores(r.user_email,r.course_code);
  end loop;
end $$;

notify pgrst,'reload schema';
