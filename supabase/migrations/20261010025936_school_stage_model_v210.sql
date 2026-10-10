-- New Hope 7 — Multi-course Wave 2C / Stage Model v210
-- Additive structure only: Course -> Stage -> Lesson. No runtime RPC/access-grant behavior.

do $preflight$
declare v_course bigint; v_lessons bigint; v_expected bigint;
begin
  if to_regclass('public.school_courses') is null or to_regclass('public.school_lessons') is null then raise exception 'Wave 2C requires current School course/lesson tables'; end if;
  if to_regclass('public.school_course_stages') is not null or to_regclass('public.school_course_stage_lessons') is not null then raise exception 'Wave 2C baseline drifted or is partially applied'; end if;
  select count(*) into v_course from public.school_courses where course_code='foundation_school' and is_active=true;
  select count(*) into v_lessons from public.school_lessons where course_code='foundation_school' and is_active=true;
  select count(*) into v_expected from (values ('class_01_new_creation'),('class_02_holy_spirit'),('class_03_christian_doctrine'),('class_04a_evangelism'),('class_04b_cell_ministry'),('class_05_character_prosperity'),('class_06_local_assembly'),('class_07_mobile_technology')) e(lesson_code)
  where exists(select 1 from public.school_lessons l where l.course_code='foundation_school' and l.lesson_code=e.lesson_code and l.is_active=true);
  if v_course<>1 or v_lessons<>8 or v_expected<>8 then raise exception 'Wave 2C Foundation baseline failed: course=%, active_lessons=%, expected_lessons=%',v_course,v_lessons,v_expected; end if;
end
$preflight$;

alter table public.school_lessons add constraint school_lessons_course_lesson_key_v210 unique(course_code,lesson_code);

create table public.school_course_stages (
  id uuid primary key default gen_random_uuid(),
  course_code text not null references public.school_courses(course_code) on delete cascade,
  stage_code text not null,
  stage_order integer not null check(stage_order>0),
  title_fa text not null default '', title_en text not null default '', title_hr text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint school_course_stages_code_key_v210 unique(course_code,stage_code),
  constraint school_course_stages_order_key_v210 unique(course_code,stage_order)
);
create table public.school_course_stage_lessons (
  course_code text not null, stage_code text not null, lesson_code text not null,
  lesson_order integer not null default 1 check(lesson_order>0), created_at timestamptz not null default now(),
  constraint school_course_stage_lessons_pkey_v210 primary key(course_code,stage_code,lesson_code),
  constraint school_course_stage_lessons_stage_order_key_v210 unique(course_code,stage_code,lesson_order),
  constraint school_course_stage_lessons_one_stage_key_v210 unique(course_code,lesson_code),
  constraint school_course_stage_lessons_stage_fkey_v210 foreign key(course_code,stage_code) references public.school_course_stages(course_code,stage_code) on delete cascade,
  constraint school_course_stage_lessons_lesson_fkey_v210 foreign key(course_code,lesson_code) references public.school_lessons(course_code,lesson_code) on delete cascade
);
alter table public.school_course_stages enable row level security;
alter table public.school_course_stage_lessons enable row level security;
revoke all on table public.school_course_stages from public,anon,authenticated;
revoke all on table public.school_course_stage_lessons from public,anon,authenticated;
create index school_course_stages_active_order_idx_v210 on public.school_course_stages(course_code,stage_order) where is_active=true;

insert into public.school_course_stages(course_code,stage_code,stage_order,title_fa,title_en,title_hr) values
 ('foundation_school','class_01',1,'کلاس ۱','Class 1','Razred 1'),('foundation_school','class_02',2,'کلاس ۲','Class 2','Razred 2'),('foundation_school','class_03',3,'کلاس ۳','Class 3','Razred 3'),('foundation_school','class_04',4,'کلاس ۴','Class 4','Razred 4'),('foundation_school','class_05',5,'کلاس ۵','Class 5','Razred 5'),('foundation_school','class_06',6,'کلاس ۶','Class 6','Razred 6'),('foundation_school','class_07',7,'کلاس ۷','Class 7','Razred 7');
insert into public.school_course_stage_lessons(course_code,stage_code,lesson_code,lesson_order) values
 ('foundation_school','class_01','class_01_new_creation',1),('foundation_school','class_02','class_02_holy_spirit',1),('foundation_school','class_03','class_03_christian_doctrine',1),('foundation_school','class_04','class_04a_evangelism',1),('foundation_school','class_04','class_04b_cell_ministry',2),('foundation_school','class_05','class_05_character_prosperity',1),('foundation_school','class_06','class_06_local_assembly',1),('foundation_school','class_07','class_07_mobile_technology',1);

do $postflight$
declare v_stages bigint; v_links bigint; v_unmapped bigint; v_class4 bigint;
begin
  select count(*) into v_stages from public.school_course_stages where course_code='foundation_school' and is_active=true;
  select count(*) into v_links from public.school_course_stage_lessons where course_code='foundation_school';
  select count(*) into v_unmapped from public.school_lessons l where l.course_code='foundation_school' and l.is_active=true and not exists(select 1 from public.school_course_stage_lessons sl where sl.course_code=l.course_code and sl.lesson_code=l.lesson_code);
  select count(*) into v_class4 from public.school_course_stage_lessons where course_code='foundation_school' and stage_code='class_04';
  if v_stages<>7 or v_links<>8 or v_unmapped<>0 or v_class4<>2 then raise exception 'Wave 2C mapping postflight failed: stages=%, links=%, unmapped=%, class4=%',v_stages,v_links,v_unmapped,v_class4; end if;
  if has_table_privilege('anon','public.school_course_stages','select') or has_table_privilege('authenticated','public.school_course_stages','select') or has_table_privilege('anon','public.school_course_stage_lessons','select') or has_table_privilege('authenticated','public.school_course_stage_lessons','select') then raise exception 'Wave 2C stage tables leaked direct read privileges'; end if;
end
$postflight$;

notify pgrst, 'reload schema';