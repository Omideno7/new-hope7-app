-- New Hope 7 — School Activity User ID Bridge v128
-- Additive Wave 1B only: attach durable Auth user_id values to existing School
-- progress, assignment, and exam-attempt rows while preserving all legacy email
-- columns, existing RLS policies, existing RPC contracts, and historical records.
--
-- Supabase CLI note (2026-10-09): local CLI 2.106.0 `migration new` was attempted
-- with --agent no / --yes, but again stalled during local profile initialization.
-- No credential was guessed or created. The CLI still created this canonical migration file before the stalled process
-- was terminated. No credential was guessed or created. Production apply will be
-- reconciled to the version actually recorded by Supabase.

-- ---------------------------------------------------------------------------
-- 0. Fail-closed preflight
-- ---------------------------------------------------------------------------
do $preflight$
declare
  v_existing_columns bigint;
  v_blank bigint;
  v_unmatched bigint;
  v_duplicate_auth bigint;
begin
  if to_regnamespace('private') is null then
    raise exception 'private schema is required';
  end if;

  if to_regclass('public.school_student_identities') is null
     or to_regprocedure('public.nh7_my_student_identity_v127()') is null then
    raise exception 'student identity core v127 is required before Wave 1B';
  end if;

  select count(*) into v_existing_columns
  from information_schema.columns
  where table_schema='public'
    and table_name in ('school_progress','school_assignments','school_exam_attempts')
    and column_name='user_id';

  if v_existing_columns<>0 then
    raise exception 'Wave 1B expects zero pre-existing activity user_id columns; found %',v_existing_columns;
  end if;

  if to_regprocedure('private.nh7_school_activity_user_id_guard_v128()') is not null then
    raise exception 'Wave 1B guard function already exists or was partially applied';
  end if;

  with activity as (
    select user_email from public.school_progress
    union all select user_email from public.school_assignments
    union all select user_email from public.school_exam_attempts
  )
  select count(*) into v_blank
  from activity
  where coalesce(trim(user_email),'')='';

  with activity as (
    select user_email from public.school_progress
    union all select user_email from public.school_assignments
    union all select user_email from public.school_exam_attempts
  )
  select count(*) into v_unmatched
  from activity a
  where coalesce(trim(a.user_email),'')<>''
    and not exists (
      select 1 from auth.users u
      where lower(trim(u.email))=lower(trim(a.user_email))
    );

  with activity_emails as (
    select distinct lower(trim(user_email)) as email
    from (
      select user_email from public.school_progress
      union all select user_email from public.school_assignments
      union all select user_email from public.school_exam_attempts
    ) a
    where coalesce(trim(user_email),'')<>''
  ), dup as (
    select ae.email
    from activity_emails ae
    join auth.users u on lower(trim(u.email))=ae.email
    group by ae.email
    having count(*)>1
  )
  select count(*) into v_duplicate_auth from dup;

  if v_blank<>0 or v_unmatched<>0 or v_duplicate_auth<>0 then
    raise exception 'Wave 1B preflight failed: blank_email=%, unmatched_auth=%, duplicate_auth_email=%',
      v_blank,v_unmatched,v_duplicate_auth;
  end if;
end
$preflight$;

-- ---------------------------------------------------------------------------
-- 1. Nullable durable Auth user IDs — no legacy identity columns removed
-- ---------------------------------------------------------------------------
alter table public.school_progress add column user_id uuid;
alter table public.school_assignments add column user_id uuid;
alter table public.school_exam_attempts add column user_id uuid;

create index school_progress_user_id_idx_v128
  on public.school_progress(user_id);
create index school_assignments_user_id_idx_v128
  on public.school_assignments(user_id);
create index school_exam_attempts_user_id_idx_v128
  on public.school_exam_attempts(user_id);

-- ---------------------------------------------------------------------------
-- 2. Historical backfill from the canonical Auth user record
-- ---------------------------------------------------------------------------
update public.school_progress p
set user_id=u.id
from auth.users u
where p.user_id is null
  and lower(trim(p.user_email))=lower(trim(u.email));

update public.school_assignments a
set user_id=u.id
from auth.users u
where a.user_id is null
  and lower(trim(a.user_email))=lower(trim(u.email));

update public.school_exam_attempts a
set user_id=u.id
from auth.users u
where a.user_id is null
  and lower(trim(a.user_email))=lower(trim(u.email));

-- ---------------------------------------------------------------------------
-- 3. Future-write guard
--    * INSERT: ignore any client-supplied user_id and resolve from Auth email.
--    * UPDATE: once a row has a user_id, keep that binding immutable even if the
--      legacy email snapshot changes later.
--    * Unmatched future legacy rows remain allowed with user_id NULL so existing
--      app behavior is never blocked; they can be reconciled separately.
-- ---------------------------------------------------------------------------
create or replace function private.nh7_school_activity_user_id_guard_v128()
returns trigger
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_resolved uuid;
begin
  if tg_op='UPDATE' then
    if old.user_id is not null then
      new.user_id:=old.user_id;
      return new;
    end if;
  end if;

  v_resolved:=null;
  if coalesce(trim(new.user_email),'')<>'' then
    select u.id into v_resolved
    from auth.users u
    where lower(trim(u.email))=lower(trim(new.user_email))
    limit 1;
  end if;

  -- Never trust a user_id supplied by the client. Resolve it server-side only.
  new.user_id:=v_resolved;
  return new;
end;
$function$;

revoke all on function private.nh7_school_activity_user_id_guard_v128()
  from public, anon, authenticated;

create trigger nh7_school_progress_user_id_guard_v128
before insert or update on public.school_progress
for each row execute function private.nh7_school_activity_user_id_guard_v128();

create trigger nh7_school_assignments_user_id_guard_v128
before insert or update on public.school_assignments
for each row execute function private.nh7_school_activity_user_id_guard_v128();

create trigger nh7_school_exam_attempts_user_id_guard_v128
before insert or update on public.school_exam_attempts
for each row execute function private.nh7_school_activity_user_id_guard_v128();

-- ---------------------------------------------------------------------------
-- 4. Fail-closed deployment-time postflight
-- ---------------------------------------------------------------------------
do $postflight$
declare
  v_progress_missing bigint;
  v_assignments_missing bigint;
  v_exams_missing bigint;
  v_mismatch bigint;
  v_trigger_count bigint;
begin
  select count(*) into v_progress_missing
  from public.school_progress where user_id is null;

  select count(*) into v_assignments_missing
  from public.school_assignments where user_id is null;

  select count(*) into v_exams_missing
  from public.school_exam_attempts where user_id is null;

  with activity as (
    select user_id,user_email from public.school_progress
    union all select user_id,user_email from public.school_assignments
    union all select user_id,user_email from public.school_exam_attempts
  )
  select count(*) into v_mismatch
  from activity a
  join auth.users u on lower(trim(u.email))=lower(trim(a.user_email))
  where a.user_id is distinct from u.id;

  select count(*) into v_trigger_count
  from pg_trigger t
  join pg_class c on c.oid=t.tgrelid
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public'
    and c.relname in ('school_progress','school_assignments','school_exam_attempts')
    and t.tgname in (
      'nh7_school_progress_user_id_guard_v128',
      'nh7_school_assignments_user_id_guard_v128',
      'nh7_school_exam_attempts_user_id_guard_v128'
    )
    and t.tgenabled='O'
    and not t.tgisinternal;

  if v_progress_missing<>0
     or v_assignments_missing<>0
     or v_exams_missing<>0
     or v_mismatch<>0
     or v_trigger_count<>3 then
    raise exception 'Wave 1B postflight failed: progress_null=%, assignments_null=%, exams_null=%, mismatch=%, active_triggers=%',
      v_progress_missing,v_assignments_missing,v_exams_missing,v_mismatch,v_trigger_count;
  end if;
end
$postflight$;

notify pgrst, 'reload schema';
