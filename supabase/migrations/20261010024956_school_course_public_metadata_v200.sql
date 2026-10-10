-- New Hope 7 — Multi-course Wave 2B / Public Course Metadata v200
-- Additive metadata only. `school_courses` is already readable for active courses,
-- so this wave adds only fields intentionally safe to expose to authenticated/anon readers.
-- Generic/private settings are deliberately excluded from this public table.

-- ---------------------------------------------------------------------------
-- 0. Fail-closed preflight
-- ---------------------------------------------------------------------------
do $preflight$
declare
  v_rows bigint;
  v_foundation bigint;
  v_rls boolean;
begin
  if to_regclass('public.school_courses') is null then
    raise exception 'Wave 2B requires public.school_courses';
  end if;

  if exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='school_courses'
      and column_name in ('cover_url','requires_manual_grant','certificate_template_code','settings')
  ) then
    raise exception 'Wave 2B baseline drifted, partially applied, or contains unreviewed settings';
  end if;

  select count(*) into v_rows from public.school_courses;
  select count(*) into v_foundation
  from public.school_courses
  where course_code='foundation_school' and is_active=true;
  select c.relrowsecurity into v_rls
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname='school_courses';

  if v_rows<1 or v_foundation<>1 or not coalesce(v_rls,false) then
    raise exception 'Wave 2B course baseline failed: rows=%, foundation=%, rls=%',v_rows,v_foundation,v_rls;
  end if;
end
$preflight$;

-- ---------------------------------------------------------------------------
-- 1. Public-safe course metadata only
-- ---------------------------------------------------------------------------
alter table public.school_courses
  add column cover_url text,
  add column requires_manual_grant boolean not null default false,
  add column certificate_template_code text;

comment on column public.school_courses.cover_url is
  'Public-safe course cover image URL/reference. Do not store secrets or signed private URLs.';
comment on column public.school_courses.requires_manual_grant is
  'Public-safe enrollment policy flag. false preserves current Foundation School access behavior.';
comment on column public.school_courses.certificate_template_code is
  'Public-safe certificate template identifier; nullable until a course template is configured.';

-- Preserve the current Foundation School behavior explicitly.
update public.school_courses
set requires_manual_grant=false
where course_code='foundation_school';

-- ---------------------------------------------------------------------------
-- 2. Fail-closed postflight
-- ---------------------------------------------------------------------------
do $postflight$
declare
  v_missing bigint;
  v_bad_foundation bigint;
  v_settings bigint;
begin
  select count(*) into v_missing
  from (values ('cover_url'),('requires_manual_grant'),('certificate_template_code')) x(column_name)
  where not exists(
    select 1 from information_schema.columns c
    where c.table_schema='public' and c.table_name='school_courses' and c.column_name=x.column_name
  );

  select count(*) into v_bad_foundation
  from public.school_courses
  where course_code='foundation_school'
    and requires_manual_grant is distinct from false;

  select count(*) into v_settings
  from information_schema.columns
  where table_schema='public' and table_name='school_courses' and column_name='settings';

  if v_missing<>0 or v_bad_foundation<>0 or v_settings<>0 then
    raise exception 'Wave 2B postflight failed: missing=%, bad_foundation=%, public_settings=%',
      v_missing,v_bad_foundation,v_settings;
  end if;
end
$postflight$;

notify pgrst, 'reload schema';
