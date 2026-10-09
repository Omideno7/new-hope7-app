-- New Hope 7 — School Dual-Key Ownership v128
-- Wave 1C only: make durable Auth user_id the primary ownership key while
-- preserving the legacy email matcher as a backwards-compatible fallback.
-- No data rows, RPCs, grants, tables, certificates, or admin/delete policies change.

-- ---------------------------------------------------------------------------
-- 0. Fail-closed preflight
-- ---------------------------------------------------------------------------
do $preflight$
declare
  v_policy_count bigint;
  v_null_ids bigint;
  v_partial bigint;
  v_legacy_matchers bigint;
begin
  if to_regprocedure('private.nh7_school_activity_user_id_guard_v128()') is null then
    raise exception 'Wave 1B user_id guard is required before Wave 1C';
  end if;

  select count(*) into v_null_ids
  from (
    select user_id from public.school_progress
    union all select user_id from public.school_assignments
    union all select user_id from public.school_exam_attempts
  ) x
  where user_id is null;

  if v_null_ids<>0 then
    raise exception 'Wave 1C requires all existing School activity rows to have user_id; nulls=%',v_null_ids;
  end if;

  select count(*) into v_policy_count
  from pg_policies
  where schemaname='public'
    and (
      (tablename='school_progress' and policyname in (
        'NH7 school progress own or admin select',
        'NH7 school progress safe lesson insert v340',
        'NH7 school progress safe lesson update v340'
      ))
      or (tablename='school_assignments' and policyname='school assignments own or admin read')
      or (tablename='school_exam_attempts' and policyname='school exam attempts own or admin read')
    );

  if v_policy_count<>5 then
    raise exception 'Wave 1C expected exactly 5 target policies; found %',v_policy_count;
  end if;

  select count(*) into v_partial
  from pg_policies
  where schemaname='public'
    and (
      (tablename='school_progress' and policyname in (
        'NH7 school progress own or admin select',
        'NH7 school progress safe lesson insert v340',
        'NH7 school progress safe lesson update v340'
      ))
      or (tablename='school_assignments' and policyname='school assignments own or admin read')
      or (tablename='school_exam_attempts' and policyname='school exam attempts own or admin read')
    )
    and (coalesce(qual,'') ilike '%user_id%' or coalesce(with_check,'') ilike '%user_id%');

  if v_partial<>0 then
    raise exception 'Wave 1C target policies already contain user_id ownership or are partially applied: %',v_partial;
  end if;

  select count(*) into v_legacy_matchers
  from pg_policies
  where schemaname='public'
    and (
      (tablename='school_progress' and policyname in (
        'NH7 school progress own or admin select',
        'NH7 school progress safe lesson insert v340',
        'NH7 school progress safe lesson update v340'
      ))
      or (tablename='school_assignments' and policyname='school assignments own or admin read')
      or (tablename='school_exam_attempts' and policyname='school exam attempts own or admin read')
    )
    and (coalesce(qual,'') ilike '%user_email%' or coalesce(with_check,'') ilike '%user_email%');

  if v_legacy_matchers<>5 then
    raise exception 'Wave 1C refuses to replace policies unless all 5 still contain legacy email compatibility; found %',v_legacy_matchers;
  end if;
end
$preflight$;

-- ---------------------------------------------------------------------------
-- 1. Read ownership: durable user_id first, legacy email fallback second
-- ---------------------------------------------------------------------------
alter policy "school assignments own or admin read"
on public.school_assignments
to authenticated
using (
  user_id = (select auth.uid())
  or lower(user_email) = lower(coalesce((select auth.jwt()) ->> 'email',''))
  or coalesce((select public.nh7_admin_is_admin_v170()),false)
);

alter policy "school exam attempts own or admin read"
on public.school_exam_attempts
to authenticated
using (
  user_id = (select auth.uid())
  or lower(user_email) = lower(coalesce((select auth.jwt()) ->> 'email',''))
  or coalesce((select public.nh7_admin_is_admin_v170()),false)
);

alter policy "NH7 school progress own or admin select"
on public.school_progress
to authenticated
using (
  user_id = (select auth.uid())
  or lower(user_email) = lower(coalesce((select auth.jwt()) ->> 'email',''))
  or coalesce((select public.nh7_is_admin()),false)
);

-- ---------------------------------------------------------------------------
-- 2. Progress writes: preserve all existing lesson/exam safety restrictions
-- ---------------------------------------------------------------------------
alter policy "NH7 school progress safe lesson insert v340"
on public.school_progress
to authenticated
with check (
  coalesce((select public.nh7_is_admin()),false)
  or (
    (
      user_id = (select auth.uid())
      or lower(user_email) = lower(coalesce((select auth.jwt()) ->> 'email',''))
    )
    and lesson_code not like 'course:%'
    and exam_id is null
    and exam_score is null
    and exam_passed is null
    and exam_attempted_at is null
    and objective_score_percent is null
    and assignment_score_percent is null
    and final_score_percent is null
  )
);

alter policy "NH7 school progress safe lesson update v340"
on public.school_progress
to authenticated
using (
  user_id = (select auth.uid())
  or lower(user_email) = lower(coalesce((select auth.jwt()) ->> 'email',''))
  or coalesce((select public.nh7_is_admin()),false)
)
with check (
  coalesce((select public.nh7_is_admin()),false)
  or (
    (
      user_id = (select auth.uid())
      or lower(user_email) = lower(coalesce((select auth.jwt()) ->> 'email',''))
    )
    and lesson_code not like 'course:%'
    and exam_id is null
    and exam_score is null
    and exam_passed is null
    and exam_attempted_at is null
    and objective_score_percent is null
    and assignment_score_percent is null
    and final_score_percent is null
  )
);

-- ---------------------------------------------------------------------------
-- 3. Fail-closed postflight: dual-key + legacy compatibility + restrictions
-- ---------------------------------------------------------------------------
do $postflight$
declare
  v_dual bigint;
  v_legacy bigint;
  v_auth_uid bigint;
  v_restrictions bigint;
  v_roles bigint;
begin
  select count(*) into v_dual
  from pg_policies
  where schemaname='public'
    and (
      (tablename='school_progress' and policyname in (
        'NH7 school progress own or admin select',
        'NH7 school progress safe lesson insert v340',
        'NH7 school progress safe lesson update v340'
      ))
      or (tablename='school_assignments' and policyname='school assignments own or admin read')
      or (tablename='school_exam_attempts' and policyname='school exam attempts own or admin read')
    )
    and (coalesce(qual,'') ilike '%user_id%' or coalesce(with_check,'') ilike '%user_id%');

  select count(*) into v_legacy
  from pg_policies
  where schemaname='public'
    and (
      (tablename='school_progress' and policyname in (
        'NH7 school progress own or admin select',
        'NH7 school progress safe lesson insert v340',
        'NH7 school progress safe lesson update v340'
      ))
      or (tablename='school_assignments' and policyname='school assignments own or admin read')
      or (tablename='school_exam_attempts' and policyname='school exam attempts own or admin read')
    )
    and (coalesce(qual,'') ilike '%user_email%' or coalesce(with_check,'') ilike '%user_email%');

  select count(*) into v_auth_uid
  from pg_policies
  where schemaname='public'
    and (
      (tablename='school_progress' and policyname in (
        'NH7 school progress own or admin select',
        'NH7 school progress safe lesson insert v340',
        'NH7 school progress safe lesson update v340'
      ))
      or (tablename='school_assignments' and policyname='school assignments own or admin read')
      or (tablename='school_exam_attempts' and policyname='school exam attempts own or admin read')
    )
    and (coalesce(qual,'') ilike '%auth.uid%' or coalesce(with_check,'') ilike '%auth.uid%');

  select count(*) into v_restrictions
  from pg_policies
  where schemaname='public' and tablename='school_progress'
    and policyname in ('NH7 school progress safe lesson insert v340','NH7 school progress safe lesson update v340')
    and coalesce(with_check,'') ilike '%lesson_code%'
    and coalesce(with_check,'') ilike '%course:%'
    and coalesce(with_check,'') ilike '%exam_id%'
    and coalesce(with_check,'') ilike '%final_score_percent%';

  select count(*) into v_roles
  from pg_policies
  where schemaname='public'
    and (
      (tablename='school_progress' and policyname in (
        'NH7 school progress own or admin select',
        'NH7 school progress safe lesson insert v340',
        'NH7 school progress safe lesson update v340'
      ))
      or (tablename='school_assignments' and policyname='school assignments own or admin read')
      or (tablename='school_exam_attempts' and policyname='school exam attempts own or admin read')
    )
    and roles = array['authenticated'::name];

  if v_dual<>5 or v_legacy<>5 or v_auth_uid<>5 or v_restrictions<>2 or v_roles<>5 then
    raise exception 'Wave 1C postflight failed: dual=%, legacy=%, auth_uid=%, restricted_progress=%, authenticated_roles=%',
      v_dual,v_legacy,v_auth_uid,v_restrictions,v_roles;
  end if;
end
$postflight$;

notify pgrst, 'reload schema';
