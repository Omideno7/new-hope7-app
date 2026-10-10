-- New Hope 7 — Multi-course Wave 2A / Course Code Bridge v200
-- Additive bridge only: make course ownership explicit on lessons + progress while
-- preserving the current Foundation School runtime and installed-app compatibility.

do $preflight$
declare
  v_bad_lessons bigint;
  v_bad_progress bigint;
begin
  if to_regclass('public.school_courses') is null
     or to_regclass('public.school_lessons') is null
     or to_regclass('public.school_progress') is null
     or to_regclass('public.school_exams') is null then
    raise exception 'Wave 2A requires current School core tables';
  end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='school_lessons' and column_name='course_code')
     or exists(select 1 from information_schema.columns where table_schema='public' and table_name='school_progress' and column_name='course_code') then
    raise exception 'Wave 2A baseline drifted or is partially applied';
  end if;
  select count(*) into v_bad_lessons
  from public.school_lessons l
  where not exists(
    select 1 from public.school_courses c
    where c.course_code=coalesce(nullif(trim(l.content_data#>>'{course,code}'),''),nullif(trim(l.content_data->>'course_code'),''),'foundation_school')
  );
  select count(*) into v_bad_progress
  from public.school_progress p
  where not (
    exists(
      select 1 from public.school_lessons l
      join public.school_courses c on c.course_code=coalesce(nullif(trim(l.content_data#>>'{course,code}'),''),nullif(trim(l.content_data->>'course_code'),''),'foundation_school')
      where l.lesson_code=p.lesson_code
    )
    or exists(
      select 1 from public.school_exams e
      join public.school_courses c on c.course_code=e.course_code
      where e.id=p.exam_id and coalesce(trim(e.course_code),'')<>''
    )
    or (p.lesson_code like 'course:%' and exists(select 1 from public.school_courses c where c.course_code=substring(p.lesson_code from 8)))
  );
  if v_bad_lessons<>0 or v_bad_progress<>0 then
    raise exception 'Wave 2A unmappable School rows: lessons=%, progress=%',v_bad_lessons,v_bad_progress;
  end if;
end
$preflight$;

alter table public.school_lessons add column course_code text;
update public.school_lessons l
set course_code=coalesce(nullif(trim(l.content_data#>>'{course,code}'),''),nullif(trim(l.content_data->>'course_code'),''),'foundation_school');
alter table public.school_lessons
  alter column course_code set default 'foundation_school',
  alter column course_code set not null;
alter table public.school_lessons
  add constraint school_lessons_course_code_fkey_v200
  foreign key(course_code) references public.school_courses(course_code) not valid;
alter table public.school_lessons validate constraint school_lessons_course_code_fkey_v200;
create index school_lessons_course_order_idx_v200
  on public.school_lessons(course_code,lesson_order) where is_active=true;

alter table public.school_progress add column course_code text;
update public.school_progress p set course_code=l.course_code
from public.school_lessons l where p.course_code is null and l.lesson_code=p.lesson_code;
update public.school_progress p set course_code=e.course_code
from public.school_exams e where p.course_code is null and p.exam_id=e.id and coalesce(trim(e.course_code),'')<>'';
update public.school_progress p set course_code=substring(p.lesson_code from 8)
where p.course_code is null and p.lesson_code like 'course:%';

create schema if not exists private;
revoke all on schema private from public;
create or replace function private.nh7_school_progress_course_code_guard_v200()
returns trigger
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_course text:=nullif(trim(coalesce(new.course_code,'')),'');
begin
  if v_course is null and new.exam_id is not null then
    select nullif(trim(e.course_code),'') into v_course from public.school_exams e where e.id=new.exam_id;
  end if;
  if v_course is null and new.lesson_code like 'course:%' then
    v_course:=nullif(substring(new.lesson_code from 8),'');
  end if;
  if v_course is null then
    select nullif(trim(l.course_code),'') into v_course from public.school_lessons l where l.lesson_code=new.lesson_code;
  end if;
  if v_course is null or not exists(select 1 from public.school_courses c where c.course_code=v_course) then
    raise exception 'invalid_school_course_code';
  end if;
  new.course_code:=v_course;
  return new;
end;
$function$;
revoke all on function private.nh7_school_progress_course_code_guard_v200() from public,anon,authenticated,service_role;
drop trigger if exists nh7_school_progress_course_code_guard_v200 on public.school_progress;
create trigger nh7_school_progress_course_code_guard_v200
before insert or update of lesson_code,exam_id,course_code
on public.school_progress
for each row execute function private.nh7_school_progress_course_code_guard_v200();
alter table public.school_progress alter column course_code set not null;
alter table public.school_progress
  add constraint school_progress_course_code_fkey_v200
  foreign key(course_code) references public.school_courses(course_code) not valid;
alter table public.school_progress validate constraint school_progress_course_code_fkey_v200;
create index school_progress_user_course_lesson_idx_v200
  on public.school_progress(user_id,course_code,lesson_code);

do $postflight$
declare
  v_bad_lessons bigint;
  v_bad_progress bigint;
  v_cfg text[];
begin
  select count(*) into v_bad_lessons
  from public.school_lessons l left join public.school_courses c on c.course_code=l.course_code
  where l.course_code is null or c.course_code is null;
  select count(*) into v_bad_progress
  from public.school_progress p left join public.school_courses c on c.course_code=p.course_code
  where p.course_code is null or c.course_code is null;
  if v_bad_lessons<>0 or v_bad_progress<>0 then
    raise exception 'Wave 2A course coverage postflight failed: lessons=%, progress=%',v_bad_lessons,v_bad_progress;
  end if;
  if not exists(select 1 from pg_trigger where tgrelid='public.school_progress'::regclass and tgname='nh7_school_progress_course_code_guard_v200' and not tgisinternal) then
    raise exception 'Wave 2A progress compatibility trigger missing';
  end if;
  select coalesce(p.proconfig,'{}'::text[]) into v_cfg
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='private' and p.proname='nh7_school_progress_course_code_guard_v200' limit 1;
  if not ('search_path=""'=any(v_cfg)) then
    raise exception 'Wave 2A trigger function search_path is not pinned empty: %',v_cfg;
  end if;
  if has_function_privilege('anon','private.nh7_school_progress_course_code_guard_v200()','execute')
     or has_function_privilege('authenticated','private.nh7_school_progress_course_code_guard_v200()','execute') then
    raise exception 'Wave 2A private trigger function leaked execute privilege';
  end if;
end
$postflight$;

notify pgrst, 'reload schema';