# Wave 6.6 — Live Supabase Metadata Manifest

Captured **2026-10-15** from Supabase project `gpzcwffxnddhaeaogdyo` using read-only metadata queries and Security/Performance Advisor reads. **No Production mutation, DDL, migration, Auth-setting change, provider change, user-data mutation, deployment, or paid feature activation occurred.**

This manifest is the live baseline for Wave 6.6. The repository is public, so full live routine bodies are intentionally not published. The function matrices expose exact signatures, current EXECUTE ACLs, live definition/body fingerprints, body length, `search_path` configuration and authorization/write markers. Those markers are hints only; do not classify or revoke from a function name or marker alone. Cross-check exact signature + live fingerprint + repository source/caller evidence. If an individual function body/caller fact still cannot be proven, mark only that row `BLOCKED_LIVE_BODY` / `BLOCKED_LIVE_FACT`.

## Security Advisor baseline

- `security_definer_view`: **4 ERROR**
- `anon_security_definer_function_executable`: **32 WARN**
- `authenticated_security_definer_function_executable`: **236 WARN**
- `extension_in_public`: **1 WARN** (`pg_net`)
- `auth_leaked_password_protection`: **1 WARN**
- `rls_enabled_no_policy`: **29 INFO**

Therefore the dashboard totals are **4 Problems / 270 Warnings / 29 Suggestions/Info**.

Live function census confirms exactly **32** SECURITY DEFINER functions executable by `anon`, **236** executable by `authenticated`, union **236**, with all 32 anon rows also executable by authenticated.

Function matrices:

- `docs/qa/wave6_6-live-security/function-matrix-001-060.psv`
- `docs/qa/wave6_6-live-security/function-matrix-061-120.psv`
- `docs/qa/wave6_6-live-security/function-matrix-121-180.psv`
- `docs/qa/wave6_6-live-security/function-matrix-181-236.psv`

**No blanket REVOKE is allowed.** Intentional public verification/registration/recovery/social endpoints may legitimately retain exposure. Admin/internal endpoints may be candidates only after exact body/caller proof and compatibility review.

## Four live Library SECURITY DEFINER views

All four views are owned by `postgres` and have `reloptions = null`; they are therefore not configured as `security_invoker` views. Two pairs are definition-identical.

### `public.nh7_library_items_v224`
### `public.nh7_library_items_v251`

Live definition MD5 for both: `4c965d6f56977723b947abde52c5bf1a`

Exact ordered columns/types:

1. `id uuid`
2. `title_fa text`
3. `title_en text`
4. `title_hr text`
5. `description_fa text`
6. `description_en text`
7. `description_hr text`
8. `audience text`
9. `resource_type text`
10. `apocrypha_book text`
11. `mime_type text`
12. `file_name text`
13. `file_size bigint`
14. `cover_url text`
15. `sort_order integer`
16. `created_at timestamptz`
17. `updated_at timestamptz`
18. `reader_mode text`
19. `reader_language text`
20. `reader_text jsonb`
21. `reader_status text`
22. `reader_page_count integer`
23. `reader_updated_at timestamptz`
24. `reader_available boolean`
25. `collection_id uuid`

Exact live definition:

```sql
SELECT id,
    title_fa,
    title_en,
    title_hr,
    description_fa,
    description_en,
    description_hr,
    audience,
    resource_type,
    apocrypha_book,
    mime_type,
    file_name,
    file_size,
    cover_url,
    sort_order,
    created_at,
    updated_at,
    reader_mode,
    reader_language,
    '{}'::jsonb AS reader_text,
    reader_status,
    reader_page_count,
    reader_updated_at,
    reader_status = 'ready'::text
      AND (reader_mode = ANY (ARRAY['text'::text, 'both'::text])) AS reader_available,
    collection_id
FROM nh7_library_items i
WHERE is_published
  AND is_active
  AND (
    COALESCE(nh7_is_admin(), false)
    OR auth.uid() IS NOT NULL
      AND (
        audience = 'ministers'::text
        AND nh7_content_access_active_v251(auth.uid(), 'library_item'::text, id)
        OR audience <> 'ministers'::text
        AND nh7_school_access_approved_v230(
          auth.uid(),
          COALESCE(auth.jwt() ->> 'email'::text, ''::text),
          ''::text
        )
      )
  );
```

### `public.nh7_library_collections_public_v251`
### `public.nh7_library_collections_public_v322`

Live definition MD5 for both: `3a0b0f1a2c53dbbaa90d3b33b15c32d4`

Exact ordered columns/types:

1. `id uuid`
2. `slug text`
3. `title_fa text`
4. `title_en text`
5. `title_hr text`
6. `description_fa text`
7. `description_en text`
8. `description_hr text`
9. `icon text`
10. `audience text`
11. `sort_order integer`
12. `item_count integer`

Exact live definition:

```sql
SELECT c.id,
    c.slug,
    c.title_fa,
    c.title_en,
    c.title_hr,
    c.description_fa,
    c.description_en,
    c.description_hr,
    c.icon,
    c.audience,
    c.sort_order,
    count(i.id)::integer AS item_count
FROM nh7_library_collections_v322 c
LEFT JOIN nh7_library_items i
  ON i.collection_id = c.id
 AND i.resource_type = 'library'::text
 AND i.is_active
 AND i.is_published
 AND i.audience = c.audience
 AND (
   c.audience <> 'ministers'::text
   OR COALESCE(nh7_is_admin(), false)
   OR nh7_content_access_active_v251(auth.uid(), 'library_item'::text, i.id)
 )
WHERE c.is_active
  AND (
    COALESCE(nh7_is_admin(), false)
    OR auth.uid() IS NOT NULL
      AND (
        c.audience = 'ministers'::text
        AND nh7_content_access_active_v251(auth.uid(), 'library_collection'::text, c.id)
        OR c.audience <> 'ministers'::text
        AND nh7_school_access_approved_v230(
          auth.uid(),
          COALESCE(auth.jwt() ->> 'email'::text, ''::text),
          ''::text
        )
      )
  )
GROUP BY c.id
ORDER BY c.audience, c.sort_order, c.created_at;
```

Do **not** convert these four views to `security_invoker` blindly. Their current predicates delegate to privileged/UID-aware functions while base-table grants/RLS may not support equivalent direct execution. Wave 6.6 must prove an exact-projection compatible replacement path before proposing activation.

## Live `pg_net`

- Extension: `pg_net`
- Version: `0.20.3`
- Owner: `supabase_admin`
- Schema: `public`
- `extrelocatable = false`

Therefore **do not propose `ALTER EXTENSION ... SET SCHEMA` or any blind schema move**. The advisor warning may remain. Only exact unused privilege/dependency hardening may be proposed after caller/dependency proof.

## Exact 29 Security Advisor RLS/no-policy findings

The authoritative Advisor list is:

1. `nh7_library_recovery_20260906.before_state`
2. `nh7_library_recovery_20260906.chunks`
3. `nh7_library_recovery_20260906.sources`
4. `nh7_library_recovery_20260906.targets`
5. `private.nh7_admin_audit_log_v350`
6. `private.nh7_admin_members_v350`
7. `private.nh7_admin_permission_catalog_v350`
8. `private.nh7_admin_permission_grants_v350`
9. `public._nh7_book_master_stage_14_21`
10. `public.nh7_account_content_grants_v251`
11. `public.nh7_admin_account_actions_v380`
12. `public.nh7_apocrypha_books_v270`
13. `public.nh7_content_entitlements_v380`
14. `public.nh7_legacy_auth_claim_audit`
15. `public.nh7_library_claim_codes_v433`
16. `public.nh7_library_import_history_v434`
17. `public.nh7_notification_runtime_secret`
18. `public.nh7_school_audio_progress_v380`
19. `public.nh7_school_video_code_items_v392`
20. `public.nh7_school_video_codes_v260`
21. `public.nh7_school_video_grants_v260`
22. `public.nh7_school_videos_v260`
23. `public.nh7_sermon_blessings_v440`
24. `public.nh7_sermon_likes_v440`
25. `public.notification_dispatch_log`
26. `public.notification_schedule`
27. `public.school_course_stage_lessons`
28. `public.school_course_stages`
29. `public.school_student_identities`

A broader raw SQL census can show system-schema RLS/no-policy objects in `auth`, `storage`, and `realtime`; that raw count was 53. **Do not substitute 53 for the Security Advisor’s user-facing 29.** For this wave, classify the 29 Advisor findings. Do not create permissive policies merely to clear a lint; intentional deny-all is a valid disposition.

## Registration live reality

`public.nh7_submit_registration_v3(p_type text, p_email text, p_device_id text, p_language text, p_payload jsonb)` is live as SECURITY DEFINER with EXECUTE for `anon`, `authenticated`, `service_role` and owner. Live definition MD5 is `9eb6681032fa0175ca25b03e0dfbb038`; body MD5 is `a035469ecfe7f6304e18af2de1edb9aa`.

Read-only inspection confirmed Production still uses the pre-Wave-6.5 contract: the anonymous path is device-bound, email validation is basic, and existing identity fallback compares DOB digits plus the last 8 phone digits. Therefore **the Wave 6.5 strict international/E.164 phone and stronger server validation are not live**. Any activation plan must preserve existing Store clients through an explicit compatibility sequence; do not unexpectedly flip strict server validation before client adoption.

## No-added-cost Auth rule

Leaked-password protection remains an Advisor warning and is plan-dependent. Do not require a paid plan or paid provider. Wave 6.6 may recommend free/current-plan settings and source hardening only. Turnstile remains disabled until separately approved/configured; no SMS OTP/KYC/paid provider.

## Performance Advisor appendix baseline

Read-only Performance Advisor snapshot (appendix only; no DDL in Wave 6.6):

- 21 unindexed foreign keys
- 6 Auth RLS initplan warnings
- 19 unused indexes
- 26 multiple permissive policy warnings
- 4 duplicate-index warnings
- 1 Auth DB connection-strategy info

Do not fix performance findings in this wave unless the task explicitly calls for a review-only proposal; no Production performance DDL.

## Classification/activation rules

1. Never classify solely from a function name.
2. Never classify solely from the boolean markers in the function matrices.
3. Prefer exact live fingerprint + matching repository body + repository/runtime caller evidence.
4. Intentional public endpoints may retain `anon`/`authenticated` EXECUTE.
5. Admin/internal/helper endpoints may have client EXECUTE revoked only with exact caller/replacement proof.
6. Unknown or mismatched exact body/caller evidence blocks only that specific row; use `BLOCKED_LIVE_BODY` / `BLOCKED_LIVE_FACT`, not a blanket wave blocker.
7. No blanket grant rewrite.
8. No live SQL, migration, Auth setting, deployment or user mutation in Wave 6.6.
9. Produce activation and rollback SQL/plans under the review-only Wave 6.6 path only.
10. Stop before Wave 7.
