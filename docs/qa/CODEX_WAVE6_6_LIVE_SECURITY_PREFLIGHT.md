# CODEX Wave 6.6 — Live Security Preflight & Safe Activation Plan

## Purpose

Convert Wave 6.5 from a source/fixture/review-only security package into a **Production-grounded, read-only preflight and activation plan** using the verified live metadata snapshot below.

This wave MUST NOT apply any SQL, migration, Auth setting, provider configuration, RLS/view/function change, deployment, deletion, backfill, user mutation, cache clear or release.

The output is an exact, reviewable decision package telling the owner which changes are safe to activate later, which must remain unchanged, what the rollback is, and what must still be verified first.

Accepted Wave 6.5 final develop before this task document:

`1ba57005b591fc0e8a7d9eae8573ee5e7297fa3c`

`main` baseline remains:

`15af811f78a17a0881c13171311e7ade6bc390f4`

---

# 1. Absolute safety boundaries

Work only on the existing `develop` branch.

Do NOT:

- create a branch or PR;
- modify or merge `main`;
- deploy Web/PWA/native/Store code;
- deploy Supabase/Edge Functions;
- apply migrations;
- execute DDL or DML against Production;
- change any live Auth setting;
- change CAPTCHA/provider configuration;
- enable any paid feature;
- send real email/SMS/push;
- mutate/delete/backfill/reset any real user data;
- clear caches;
- rotate keys/secrets;
- grant broader table/view access;
- disable RLS;
- move `pg_net`;
- blindly remove `SECURITY DEFINER`;
- blindly revoke `EXECUTE` from functions required by current clients;
- claim a live issue is fixed merely because proposed SQL exists.

This is a **read-only Production-grounded analysis wave**.

If any exact live fact is unavailable, classify it `BLOCKED_LIVE_FACT` rather than guessing.

---

# 2. Read first

Read completely before editing reports or review package:

- `AGENTS.md`
- `docs/DEVELOPMENT_WORKFLOW.md`
- `docs/qa/PRODUCT_COMPLETION_MASTER_AUDIT.md`
- `docs/qa/WAVE4_NOTIFICATIONS_REPORT.md`
- `docs/qa/WAVE5_DOCUMENT_STUDIO_REPORT.md`
- `docs/qa/WAVE6_USER_APP_COMPLETION_REPORT.md`
- `docs/qa/WAVE6_5_SECURITY_REGISTRATION_AUDIT.md`
- `docs/qa/WAVE6_5_SECURITY_REGISTRATION_REPORT.md`
- `docs/qa/WAVE6_5_SUPABASE_SECURITY_ADVISOR_TRIAGE.md`
- all files under `supabase/review/wave6_5-security-registration/`
- current active registration/Auth/delete/Library/Admin runtime modules and all relevant migrations.

Create and commit the Wave 6.6 audit before any follow-up proposal edits:

`docs/qa/WAVE6_6_LIVE_SECURITY_PREFLIGHT_AUDIT.md`

---

# 3. Verified live Supabase baseline

The following baseline was captured read-only from Supabase project `gpzcwffxnddhaeaogdyo` on 2026-10-15 around 19:34 UTC.

Treat this as the Production-grounding baseline for this wave. Do not replace it with repository assumptions.

## 3.1 Security Advisor exact counts

Security Advisor currently reports:

- **4 ERROR** — `security_definer_view`
- **270 WARN** total, consisting of:
  - **32** `anon_security_definer_function_executable`
  - **236** `authenticated_security_definer_function_executable`
  - **1** `extension_in_public` for `pg_net`
  - **1** `auth_leaked_password_protection` disabled
- **29 INFO** — `rls_enabled_no_policy`

Do not claim these counts will all become zero. Some warnings are expected to remain intentionally.

Official lint meanings must remain aligned with Supabase:

- `0010_security_definer_view`
- `0028_anon_security_definer_function_executable`
- `0029_authenticated_security_definer_function_executable`
- `0008_rls_enabled_no_policy`
- `0014_extension_in_public`

## 3.2 Four live Library views

Exact live target views:

1. `public.nh7_library_items_v224`
2. `public.nh7_library_items_v251`
3. `public.nh7_library_collections_public_v251`
4. `public.nh7_library_collections_public_v322`

All four are owned by `postgres` and currently have no `security_invoker` reloption.

Live fingerprints:

- `nh7_library_items_v224` definition MD5: `4c965d6f56977723b947abde52c5bf1a`
- `nh7_library_items_v251` definition MD5: `4c965d6f56977723b947abde52c5bf1a`
- `nh7_library_collections_public_v251` definition MD5: `3a0b0f1a2c53dbbaa90d3b33b15c32d4`
- `nh7_library_collections_public_v322` definition MD5: `3a0b0f1a2c53dbbaa90d3b33b15c32d4`

The two item views are currently identical to each other; the two collection views are currently identical to each other.

### Item view exact output shape

The current item projection has **25 columns**, in order:

`id, title_fa, title_en, title_hr, description_fa, description_en, description_hr, audience, resource_type, apocrypha_book, mime_type, file_name, file_size, cover_url, sort_order, created_at, updated_at, reader_mode, reader_language, reader_text, reader_status, reader_page_count, reader_updated_at, reader_available, collection_id`

The live definition filters published/active rows and performs authorization using current functions including:

- `nh7_is_admin()`
- `auth.uid()`
- `nh7_content_access_active_v251(...)`
- `nh7_school_access_approved_v230(...)`

`reader_text` is projected as an empty JSON object in this compatibility view.

### Collection view exact output shape

The current collection projection has **12 columns**, in order:

`id, slug, title_fa, title_en, title_hr, description_fa, description_en, description_hr, icon, audience, sort_order, item_count`

The live definition filters active collections/items and performs authorization using current functions including:

- `nh7_is_admin()`
- `auth.uid()`
- `nh7_content_access_active_v251(...)`
- `nh7_school_access_approved_v230(...)`

No proposal may broaden base table `SELECT` or bypass current audience/revocation rules.

## 3.3 Key live function ACL/fingerprint facts

These are exact read-only live observations:

### `public.nh7_submit_registration_v3`

- SECURITY DEFINER: yes
- args: `p_type text, p_email text, p_device_id text, p_language text, p_payload jsonb`
- live definition MD5: `9eb6681032fa0175ca25b03e0dfbb038`
- EXECUTE currently granted to: `anon`, `authenticated`, `service_role`, `postgres`

### `public.nh7_school_registration_payload_error_v351`

- SECURITY DEFINER: no
- args: `p_email text, p_payload jsonb`
- live definition MD5: `509baab43b408df8f42d28e04e19d593`
- EXECUTE currently only `service_role`, `postgres`

### `public.nh7_admin_delete_account_full_v372`

- SECURITY DEFINER: yes
- definition MD5: `84428142fee80fb3746d04ec61d7f1fa`
- EXECUTE: `authenticated`, `service_role`, `postgres`

### `public.nh7_admin_delete_account_full_v381`

- SECURITY DEFINER: yes
- definition MD5: `63b973c06b4f94c2db4459abba1a621c`
- EXECUTE: `authenticated`, `service_role`, `postgres`

### `public.nh7_delete_my_account_v393`

- SECURITY DEFINER: yes
- definition MD5: `6d41f29b102fcdaf5536342f9fad0771`
- EXECUTE: `authenticated`, `service_role`, `postgres`

### `public.nh7_admin_my_access_v350`

- SECURITY DEFINER: yes
- definition MD5: `21255d8f90474e2b4052da5acd946fa0`
- EXECUTE: `authenticated`, `postgres`

### `public.nh7_library_catalog_v396`

- SECURITY DEFINER: yes
- definition MD5: `44338ee6097c5308f94aef0c9100b217`
- EXECUTE: `authenticated`, `service_role`, `postgres`

### `public.nh7_is_admin`

- SECURITY DEFINER: no
- definition MD5: `736a8e87e1294f992d50d47deb6ca4c8`
- executable by public/anon/authenticated/service_role/postgres

Do not change any of these solely from the function name. First classify body authority, caller requirements and current runtime usage.

## 3.4 Live RLS-with-no-policy Advisor list — exact 29 external findings

The Security Advisor exact list is:

### recovery schema

- `nh7_library_recovery_20260906.before_state`
- `nh7_library_recovery_20260906.chunks`
- `nh7_library_recovery_20260906.sources`
- `nh7_library_recovery_20260906.targets`

### private schema

- `private.nh7_admin_audit_log_v350`
- `private.nh7_admin_members_v350`
- `private.nh7_admin_permission_catalog_v350`
- `private.nh7_admin_permission_grants_v350`

### public schema

- `public._nh7_book_master_stage_14_21`
- `public.nh7_account_content_grants_v251`
- `public.nh7_admin_account_actions_v380`
- `public.nh7_apocrypha_books_v270`
- `public.nh7_content_entitlements_v380`
- `public.nh7_legacy_auth_claim_audit`
- `public.nh7_library_claim_codes_v433`
- `public.nh7_library_import_history_v434`
- `public.nh7_notification_runtime_secret`
- `public.nh7_school_audio_progress_v380`
- `public.nh7_school_video_code_items_v392`
- `public.nh7_school_video_codes_v260`
- `public.nh7_school_video_grants_v260`
- `public.nh7_school_videos_v260`
- `public.nh7_sermon_blessings_v440`
- `public.nh7_sermon_likes_v440`
- `public.notification_dispatch_log`
- `public.notification_schedule`
- `public.school_course_stage_lessons`
- `public.school_course_stages`
- `public.school_student_identities`

System schemas (`auth`, `storage`, `realtime`) may also have RLS/no-policy catalog states but they are not part of the above 29 external Advisor findings and must not be altered by this wave.

For each of these 29 classify:

- `INTENTIONAL_DENY_ALL`
- `SERVICE_ONLY`
- `TRIGGER_INTERNAL`
- `ADMIN_RPC_ONLY`
- `MISSING_POLICY_REAL_GAP`
- `LEGACY_RECOVERY_KEEP_LOCKED`
- `BLOCKED_LIVE_FACT`

Do not create a cosmetic permissive policy merely to remove an INFO advisory.

## 3.5 Live `pg_net`

Exact live extension state:

- extension: `pg_net`
- version: `0.20.3`
- schema: `public`
- owner: `supabase_admin`
- `extrelocatable = false`

Therefore **do not propose `ALTER EXTENSION ... SET SCHEMA` as an executable fix** unless Supabase-supported upgrade/reinstall procedure is independently verified.

Wave 6.6 should classify this as a platform/extension configuration advisory and focus on exact unnecessary ACL/dependency exposure, not an unsafe move.

## 3.6 Leaked password protection

Security Advisor reports it disabled.

User requirement: **do not increase cost and do not require a paid plan**.

Therefore:

- do not enable or require plan-dependent leaked-password protection;
- retain no-added-cost password policy improvements from Wave 6.5;
- document the warning as an accepted plan-dependent residual unless current plan includes it at no added cost;
- do not change live Auth settings in this wave.

---

# 4. Performance Advisor snapshot — informational only

A live read-only Performance Advisor check at the same time also reported:

- 21 unindexed foreign-key INFOs
- 6 `auth_rls_initplan` WARNs
- 19 unused-index INFOs
- 26 multiple-permissive-policy WARNs
- 4 duplicate-index WARNs
- Auth DB connection strategy INFO (fixed absolute 10 connection setting)

Wave 6.6 must record these in a **separate non-blocking appendix**.

Do NOT drop/add indexes, merge policies, or change Auth connection settings in this wave.

These are candidates for a later explicitly approved performance/database-maintenance task after security and final release work.

---

# 5. Main Wave 6.6 tasks

## 5.1 Reconcile Wave 6.5 proposals with verified live facts

Compare all Wave 6.5 review SQL and matrices against the live baseline above.

For every proposed object, classify:

- `LIVE_MATCH_EXACT`
- `LIVE_MATCH_COMPATIBLE`
- `LIVE_DIFF_REQUIRES_REGENERATION`
- `NOT_DEPLOYED`
- `BLOCKED_LIVE_FACT`
- `UNSAFE_DO_NOT_ACTIVATE`

Any definition/ACL fingerprint mismatch must block activation of that proposal.

No stale generated SQL may be labeled ready.

## 5.2 Four Library view solution

Produce an exact safe plan for the four live view errors.

The plan must preserve:

- exact existing view names;
- exact ordered columns/types;
- current public/School/minister/Admin visibility;
- published/active filtering;
- minister revocation behavior;
- dynamic Library publication;
- no reader body exposure;
- no base table grant broadening;
- existing app/runtime compatibility.

Evaluate at least these approaches:

A. direct `security_invoker=true` on current definitions;
B. compatibility views over a narrow current-user authorized RPC;
C. replacement with direct RPC use and preserving old views as compatibility layer;
D. leave as-is temporarily if no safe equivalent preserves behavior.

For each option give exact risk.

The final recommended proposal must have:

- preconditions;
- exact before fingerprint;
- exact after expected shape;
- role matrix for anon / unapproved authenticated / approved School / minister granted / revoked minister / Admin;
- rollback definition;
- release compatibility implications.

Do not assume option A is safe; the base tables currently have restrictive policies and direct security-invoker conversion may break users.

## 5.3 All 32 anon SECURITY DEFINER warnings

Build an exact classification matrix for every live anon-executable SECURITY DEFINER function.

Minimum categories:

- `PUBLIC_REQUIRED_AND_GUARDED`
- `REGISTRATION_REQUIRED_ANON`
- `RECOVERY_REQUIRED_ANON`
- `PUBLIC_VERIFICATION_REQUIRED`
- `PUBLIC_FEED_REQUIRED`
- `SHOULD_REVOKE_ANON`
- `TRIGGER_INTERNAL_REVOKE_CLIENT`
- `ADMIN_ONLY_REVOKE_ANON`
- `BLOCKED_BODY_REVIEW`

Pay special attention to clearly suspicious names exposed to anon such as:

- `nh7_admin_campaign_history_v416`
- `nh7_admin_message_templates_v416`
- `nh7_admin_sermon_blessings_v440`
- `nh7_admin_student_activity_v428`
- trigger/helper functions including `nh7_autoapprove_legacy_school_v398`, `nh7_block_incomplete_registration_approval_v352`, `nh7_fill_campaign_inbox_device_v361`

But do not revoke by name alone. Confirm internal authorization/body and current callers.

Public verification/feed/recovery/registration functions may intentionally remain public if their bodies are safe.

For each proposed revoke specify exact signature, current callers, and regression tests required.

## 5.4 All 236 authenticated SECURITY DEFINER warnings

Do not attempt to force this count to zero.

Classify functions into at least:

- `USER_UID_ENDPOINT_KEEP`
- `SCHOOL_USER_ENDPOINT_KEEP`
- `LIBRARY_USER_ENDPOINT_KEEP`
- `ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP` where body performs server-authoritative admin permission check;
- `OWNER_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP` where body performs server-authoritative owner check;
- `INTERNAL_TRIGGER_REVOKE_AUTH`
- `SERVICE_ONLY_REVOKE_AUTH`
- `OBSOLETE_VERSION_CANDIDATE_REVOKE`
- `DUPLICATE_LEGACY_CANDIDATE`
- `BLOCKED_BODY_REVIEW`

A warning may remain acceptable when authenticated transport is necessary and the function itself enforces `auth.uid()` / current admin permissions safely.

Priority review groups:

1. destructive Admin endpoints;
2. account deletion;
3. Admin directory/analytics/user-note endpoints;
4. Library grant/publish/import/delete endpoints;
5. School grading/identity endpoints;
6. Community moderation;
7. Notification messaging;
8. old versioned duplicates;
9. trigger-only/internal helpers.

Produce a proposed ACL delta **only for functions with high-confidence caller/body evidence**.

## 5.5 Registration live activation readiness

Compare Wave 6.5 strict registration proposal against the exact live:

- `nh7_submit_registration_v3` fingerprint and ACL;
- server validator fingerprint;
- relevant Auth metadata/trigger path available in migrations/repo;
- old Store client compatibility.

Determine exact activation order that prevents old installed apps from breaking.

Required decision states:

- client validation: `READY_FOR_NORMAL_RELEASE` or blocker;
- strict database validator: `WAIT_FOR_CLIENT_ADOPTION` / `READY_AFTER_PRECHECK` / blocker;
- anon submit RPC: whether anon is currently required for first-time signup;
- email-confirm approval enforcement;
- phone normalization before write;
- repeat/rejected registration behavior.

Do not enable strict server behavior before proving compatibility with current Store clients.

## 5.6 Full Delete live readiness

Reconcile Wave 6.5 full-delete manifest with actual live delete functions and known live identity tables.

Do not activate full delete.

Produce exact blocker list for:

- all currently deployed identity-linked tables;
- owned Storage paths/buckets;
- immutable certificate/document retention;
- prayer/testimony/sermon-social data;
- notification receipts;
- legacy device-only data;
- admin audit/member policy;
- write fencing for old JWTs;
- Auth Admin API orchestration;
- same-email re-registration;
- retry after unknown response;
- current owner/Admin self-protection.

Separate:

- `SAFE_TO_PURGE`
- `SAFE_TO_REDACT`
- `MUST_RETAIN_NON_PII_AUDIT`
- `RETENTION_POLICY_REQUIRED`
- `OWNER_MAPPING_UNKNOWN`
- `SHARED_DEVICE_DO_NOT_DELETE`

Full Delete remains disabled until every blocking target is resolved.

## 5.7 RLS/no-policy review

For all exact 29 Advisor entries, determine whether no policy is intentional deny-all or a real access gap.

Important examples likely intended deny-all include private Admin authority/audit and runtime-secret/internal tables.

For each table state:

- who should be able to read/write;
- current intended access path (RPC/service/trigger/direct client);
- whether no-policy is correct;
- whether direct grants exist and are safe;
- whether a policy proposal is needed.

No policy addition may be proposed merely to remove an Advisor INFO.

## 5.8 `pg_net`

Because live `pg_net` is non-relocatable, do not produce an unsafe move-schema command.

Instead:

- inventory repo callers/dependencies;
- identify whether client roles can invoke network functions directly;
- prepare exact ACL reduction proposal if safe;
- classify residual Advisor warning as accepted platform limitation if needed.

## 5.9 No-added-cost Auth hardening plan

Document only controls available without new paid dependencies:

- strong new/change password policy;
- email confirmation;
- safe redirect allowlist;
- rate limits within current plan;
- session/token hygiene;
- free Turnstile option only if separately configured and approved;
- no SMS OTP requirement;
- no paid KYC;
- no leaked-password plan upgrade requirement.

No live Auth change in this wave.

---

# 6. Required review-only outputs

Create:

- `docs/qa/WAVE6_6_LIVE_SECURITY_PREFLIGHT_AUDIT.md`
- `docs/qa/WAVE6_6_LIVE_SECURITY_DECISION_MATRIX.md`
- `docs/qa/WAVE6_6_SAFE_ACTIVATION_PLAN.md`
- `docs/qa/WAVE6_6_ROLLBACK_PLAN.md`
- `docs/qa/WAVE6_6_PERFORMANCE_ADVISOR_APPENDIX.md`
- `docs/qa/WAVE6_6_FINAL_REPORT.md`

Create review-only proposals under:

`supabase/review/wave6_6-live-security/`

At minimum:

- `README.md`
- `preflight-readonly.sql`
- `library-proposal.sql`
- `function-acl-proposal.sql`
- `rls-proposal.sql`
- `pg-net-acl-proposal.sql`
- `activation-checklist.md`
- `rollback.sql`

Important:

- proposal SQL must be inert/review-only;
- no ordinary migration file;
- no auto-run workflow;
- no deployment script;
- every executable statement must have an exact prerequisite/fingerprint check or be commented as a template until live approval;
- rollback must restore exact prior definitions/ACLs, not broad grants.

If exact rollback text cannot be proven, mark that activation blocked.

---

# 7. Testing requirements

Add source/fixture tests that prove the activation proposal itself is safe without touching Production.

Required tests include:

- four-view exact column order/type compatibility;
- role matrix for Library visibility;
- ACL proposal exact-signature targeting;
- unknown fingerprint fails closed;
- no wildcard/bulk grant rewrite;
- trigger/internal function direct-client revoke does not break trigger execution in fixture;
- intentional public RPC remains callable;
- Admin/owner body guard remains authoritative;
- RLS deny-all tables stay inaccessible to client roles;
- registration old/new client compatibility fixture;
- strict validator activation sequencing;
- full-delete remains disabled;
- no real data endpoints called by tests;
- Wave 1–6.5 regressions;
- exact-head CI.

Do not relax previous freeze/safety guards merely to make tests pass.

---

# 8. Performance/cost rules

This wave must add no runtime polling, telemetry, recurring timers or database traffic to users.

Because it is mainly reports/review SQL, normal app startup/idle measurements should remain unchanged.

Record at minimum:

- startup remote requests before/after;
- 60s visible idle;
- 60s hidden idle;
- registration idle;
- Admin idle.

No paid feature or provider may be introduced.

---

# 9. Migration parity and repository safety

Retain current migration parity check.

Expected known baseline remains:

- 42/42 exact migrations
- one pre-existing unapplied file:
  `20261012123000_audio_bible_public_catalog_read_v511.sql`

Do not apply it.

Do not add an ordinary migration in Wave 6.6.

`main` must remain unchanged.

No branch/PR.

---

# 10. Required final response from Codex

When finished, report exactly:

- starting develop SHA;
- audit commit SHA;
- implementation/follow-up commit SHAs;
- exact final develop SHA;
- unchanged main SHA;
- changed-file count and diff statistics;
- all report/review-package paths;
- exact successful CI URL and matching `head_sha`;
- migration parity;
- exact Security Advisor baseline counts used;
- disposition of all four Library view errors;
- disposition counts for all 32 anon SECURITY DEFINER warnings;
- disposition counts for all 236 authenticated SECURITY DEFINER warnings;
- exact high-confidence ACL revokes proposed;
- exact intentional warnings expected to remain;
- exact 29 RLS/no-policy disposition counts;
- `pg_net` disposition;
- leaked-password warning disposition/no-added-cost decision;
- registration activation readiness and Store compatibility gate;
- Full Delete readiness/blockers;
- rollback readiness;
- performance-advisor appendix summary;
- confirmation no Production mutation/deployment/Auth change/paid feature occurred.

Stop after Wave 6.6.

Do not start Wave 7 automatically.
