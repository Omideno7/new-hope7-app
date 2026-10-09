-- New Hope 7 — School Email Fallback Fence v128
-- Wave 1D security hardening only: durable user_id remains the primary ownership
-- key; legacy email matching is allowed only for rows that do not yet have user_id.
-- This closes an email-reuse edge case without changing data, schema, grants, or RPCs.

-- ---------------------------------------------------------------------------
-- 0. Fail-closed preflight
-- ---------------------------------------------------------------------------
do $preflight$
declare
  v_policy_count bigint;
  v_dual bigint;
  v_fenced bigint;
  v_null_ids bigint;
begin
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
    raise exception 'Wave 1D expected exactly 5 target policies; found %',v_policy_count;
  end if;

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
    and (coalesce(qual,'') ilike '%user_id%' or coalesce(with_check,'') ilike '%user_id%')
    and (coalesce(qual,'') ilike '%user_email%' or coalesce(with_check,'') ilike '%user_email%');

  if v_dual<>5 then
    raise exception 'Wave 1D requires the Wave 1C dual-key baseline on all 5 policies; found %',v_dual;
  end if;

  select count(*) into v_fenced
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
    and (coalesce(qual,'') ilike '%user_id IS NULL%' or coalesce(with_check,'') ilike '%user_id IS NULL%');

  if v_fenced<>0 then
    raise exception 'Wave 1D appears partially or already applied; fenced policies=%',v_fenced;
  end if;

  select count(*) into v_null_ids
  from (
    select user_id from public.school_progress
    union all select user_id from public.school_assignments
    union all select user_id from public.school_exam_attempts
  ) x
  where user_id is null;

  if v_null_ids<>0 then
    raise exception 'Wave 1D expected zero existing unbound School activity rows; found %',v_null_ids;
  end if;
end
$preflight$;

-- ---------------------------------------------------------------------------
-- 1. Read ownership: email fallback only for unbound legacy rows
-- ---------------------------------------------------------------------------
alter policy "school assignments own or admin read"
on public.school_assignments
to authenticated
using (
  user_id = (select auth.uid())
  or (
    user_id is null
    and lower(user_email) = lower(coalesce((select auth.jwt()) ->> 'email',''))
  )
  or coalesce((select public.nh7_admin_is_admin_v170()),false)
);

alter policy "school exam attempts own or admin read"
on public.school_exam_attempts
to authenticated
using (
  user_id = (select auth.uid())
  or (
    user_id is null
    and lower(user_email) = lower(coalesce((select auth.jwt()) ->> 'email',''))
  )
  or coalesce((select public.nh7_admin_is_admin_v170()),false)
);

alter policy "NH7 school progress own or admin select"
on public.school_progress
to authenticated
using (
  user_id = (select auth.uid())
  or (
    user_id is null
    and lower(user_email) = lower(coalesce((select auth.jwt()) ->> 'email',''))
  )
  or coalesce((select public.nh7_is_admin()),false)
);

-- ---------------------------------------------------------------------------
-- 2. Progress writes: preserve all previous lesson/exam safety restrictions
-- ---------------------------------------------------------------------------
alter policy "NH7 school progress safe lesson insert v340"
on public.school_progress
to authenticated
with check (
  coalesce((select public.nh7_is_admin()),false)
  or (
    (
      user_id = (select auth.uid())
      or (
        user_id is null
        and lower(user_email) = lower(coalesce((select auth.jwt()) ->> 'email',''))
      )
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
  or (
    user_id is null
    and lower(user_email) = lower(coalesce((select auth.jwt()) ->> 'email',''))
  )
  or coalesce((select public.nh7_is_admin()),false)
)
with check (
  coalesce((select public.nh7_is_admin()),false)
  or (
    (
      user_id = (select auth.uid())
      or (
        user_id is null
        and lower(user_email) = lower(coalesce((select auth.jwt()) ->> 'email',''))
      )
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
-- 3. Fail-closed postflight
-- ---------------------------------------------------------------------------
do $postflight$
declare
  v_fenced bigint;
  v_dual bigint;
  v_restrictions bigint;
  v_roles bigint;
begin
  select count(*) into v_fenced
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
    and (coalesce(qual,'') ilike '%user_id IS NULL%' or coalesce(with_check,'') ilike '%user_id IS NULL%');

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
    and (coalesce(qual,'') ilike '%auth.uid%' or coalesce(with_check,'') ilike '%auth.uid%')
    and (coalesce(qual,'') ilike '%user_email%' or coalesce(with_check,'') ilike '%user_email%');

  select count(*) into v_restrictions
  from pg_policies
  where schemaname='public' and tablename='school_progress'
    and policyname in ('NH7 school progress safe lesson insert v340','NH7 school progress safe lesson update v340')
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

  if v_fenced<>5 or v_dual<>5 or v_restrictions<>2 or v_roles<>5 then
    raise exception 'Wave 1D postflight failed: fenced=%, dual=%, restricted_progress=%, authenticated_roles=%',
      v_fenced,v_dual,v_restrictions,v_roles;
  end if;
end
$postflight$;

notify pgrst, 'reload schema';
