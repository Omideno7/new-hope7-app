# Wave 6.5 Security & Registration report

2026-10-15 (Europe/Zagreb). **Source/fixture/review-only hardening; not a release or proof of live remediation.** Starting develop `fd7191653d45fc53791b867feb54181e2b90bf77`; audit commit `50138a2401463f2deef53a1eea170d4780a51000`; main remains `15af811f78a17a0881c13171311e7ade6bc390f4`. Implementation commit `ae945f24fb76876d3c000310bc467fe9d2a2769b`. Follow-ups remove generated Python bytecode, add a narrow ignore/safety assertion, verify review-only Edge CORS/preflight, and bind confirmed UI retries to the same immutable deletion job ID with a recovery reference. Backend activation remains disabled. All implementation/follow-up SHAs, exact final head, changed-file/diff totals and exact-head successful Validate Develop URL are recorded in the delivery receipt after CI; a commit cannot contain its own final SHA/CI result.

No new branch/PR, main changes/merge, deployment (Web/PWA/native/Store/Supabase/Edge/provider), live Auth configuration, migrations applied, real user/data mutation/deletion/backfill/reset, real email/SMS/push or cache clearing. No paid feature/provider was activated. Stop after Wave 6.5; no Wave 7.

## Confirmed defects / narrow source changes

- Canonical registration v353 accepted optional country code/junk phone strings and unnormalized storage. New local contract requires explicit international `+`, 8–15 digits, first nonzero, rejects all-identical junk, normalizes Persian/Arabic digits and presentation separators. FA/EN/HR mandatory help, placeholder, tel autocomplete/inputmode and accessible error preserved. No inferred country code, no SMS/phone ownership claim.
- DOB rejects impossible/future/zero-year dates; human-required text trims, retains Unicode and rejects punctuation-only/repeated-character placeholders. No age minimum. Existing Yes/No, email typo list/syntax/lowercase/same-account rules remain. SQL before-write validator matches these semantics; malformed direct RPC/table/atomic-signup fixtures create zero rows. Valid/retry produces one row; rejected request can reapply; payload status/UID/device are authoritative, not caller-supplied approval.
- New password signup policy was already strong; replacement/reset paths allowed six characters. Both now use the same >=10/upper/lower/digit/symbol/no whitespace policy. Existing normal sign-in is byte-identical; existing passwords are not retroactively rejected or reset. No live password setting changed.
- Confirmation page previously could claim success with no verified token. It now reads Auth `/user` and requires confirmed email. Missing/unconfirmed identity fails; no ownership inferred from syntax/local decoded JWT. Server approval candidate also requires confirmed Auth email and Admin permission. Unconfirmed signup may have an atomic **pending** request, never approval.
- Post-await registration/status/recovery writes are owner-fenced; stale A cannot persist its token/profile/status into B. Recovering A while B is active preserves B's session. Repeat-registration guard no longer queries on keystrokes or a recurring interval; visible form events retain bounded status checks.
- Old self-delete retried 401/403 using the current account and blanket-cleared all nh7 keys; settings fallback duplicated unsafe clearing. New explicit UUID/email/DELETE flow never retargets, has bounded request/finally cleanup, only invalidates the exact current session after verified server deletion, and preserves caches. **Full delete is disabled until the reviewed backend is approved; no fallback to an unverified partial delete.** Existing Admin Reject/request-delete semantics are unchanged; separate owner-authorized full-delete control appears only behind the disabled activation flag and a proven target UUID.
- New shared helper is loaded before the synchronous signup guard; executable worker cache version/precache includes its dependency. Personal/offline stable data cache and policies are unchanged. All other Wave1–6 engines, data sources, active backend/migrations, School/Notes/Plans/Library/Community/Profile/push/Studio modules remain protected by exact bytes and regressions.

## Registration / Auth matrix

| Area | Source/fixture result | Live / compatibility boundary |
|---|---|---|
| Phone FA/EN/HR | PASS +989121234567, +385912345678, separators, Persian/Arabic numerals; exact canonical ASCII + shape | Ship client/adoption before strict backend approval |
| Missing + / national / 00 / alpha / zero / repeated / short / >15 digits | Rejected locally and by PostgreSQL before writes; zero invalid rows | Does not prove phone ownership or real assigned country/carrier |
| Email syntax/domain/known typo | Existing typo suggestions and same-account check preserved; server matches Auth UID/email | No email enumeration endpoint added; GoTrue responses/settings not changed |
| Email ownership | Confirmed Auth `/user` for confirmation UI; server approval requires email_confirmed_at and Admin authority | Live Auth confirm setting / legacy approval bodies require read-only preflight |
| Password new/change | PASS policy; weak reset rejected, correct strong replacement succeeds | Existing password sign-in untouched; free matching Auth settings require approval |
| DOB / human / controlled fields | Exact valid nonfuture date, Unicode text, no age minimum, Yes/No retained | No KYC/real-world identity claim |
| Duplicates / abuse | One valid row across retry; same-email/device idempotency; device never grants identity; rejected resubmit | Existing Store v3 compatibility must be assessed before activation |
| Account races | Double submit bounded; delayed signup/status cannot write B; recovery A preserves B | Requires physical account-switch acceptance after release |
| Offline / timeout / existing account | Synthetic offline + aborted request restore button; correct/wrong existing password and unconfirmed flows bounded | Tests intercept all Auth/email calls; no real mail sent |
| CAPTCHA | Disabled by default: zero requests. Synthetic success/expiry/error/cancel/retry/localized UI and GoTrue token shape tested | No free site/keys/Auth provider activated; no paid feature |

## Security Advisor / Library architecture

See [triage](WAVE6_5_SUPABASE_SECURITY_ADVISOR_TRIAGE.md) and review README. Supplied live snapshot is unverified here: four Library definer-view problems, approximately 32 anon and 236 authenticated definer warnings, ~29 RLS/no-policy suggestions, pg_net and leaked-password warning. Do not equate warning count with vulnerability count or claim zero warnings.

All four views (`nh7_library_items_v224`, `_v251`, `nh7_library_collections_public_v251`, `_v322`) lack repository definitions. Chosen review alternative: current caller-UID/grant-secure catalog RPC bundle → narrow adapter RPC → **exact captured column/type projection** in security-invoker/security-barrier compatibility views, without base SELECT/RLS broadening. Offline generator requires owner approval, matching definitions/fingerprints and proven catalog projection; wrong/unknown projections or hidden columns fail. PostgreSQL fixture covers anonymous/unapproved/School public/minister/revoked/Admin, active/published exclusion, columns, base denial, dynamic publication. The fixture supplies a secure v396 contract-shaped implementation, not evidence that deployed v396 was read. Exact deployed definition/shape/authorization must be captured before generating live proposals. Existing signed-file/reader/cache code is unchanged.

Function inventory: 231 source declarations / 188 names across 110 baseline SQL files (historical/review duplicates). Every declaration has source header/provenance/grants/search_path/purpose and anon/authenticated/service roles marked UNVERIFIED until live preflight. `build-wave65-inventory.py` reproduces the baseline inventory; no live ACLs fabricated. Admin endpoints lose PUBLIC/anon only with exact body/signature/caller proof; internal/trigger/maintenance wrappers lose direct clients only after proving no current caller or a replacement. Intentional public and UID-bound authenticated endpoints retain necessary execution and internal authorization. New purge RPCs are service-only; new trigger/helpers are revoked from clients. No bulk unknown-function rewrite.

43 source RLS tables are classified. Private v350/review internal tables remain deny-all rather than adding cosmetic policies. New job/scope client denial and service-only RPC access are tested. Other actual no-policy suggestions require the supplied read-only live census. pg_net is not relocated: live namespace/dependency/relocatability/ACL unknown; reduce exact unused HTTP privileges only after proving compatibility. Leaked-password protection remains plan-dependent/desirable, not required at added cost. Current text secret scan + negative detectors pass; publishable/anon credentials are intentional. The guard does not certify all historical commits/provider logs.

## Permanent Delete coverage and orchestration

`identity-coverage.json` records 61 source/discovery candidates: 51 purge candidates and 10 explicit retained/shared/policy exceptions. Known schema absence is a blocker, not an invented deployed table. PostgreSQL fixtures create synthetic owner-key contracts for each candidate; actual live columns, FK dependencies/student-ID mappings, nested JSON and legacy aliases must be resolved before activation. These generic contract fixtures do **not** certify current Production table shapes.

| Domain | Review contract / result |
|---|---|
| Auth user/identities/sessions/tokens | Supported Auth Admin API, fixture cascade/zero-child checks and independent B preservation |
| Registrations/account Notes/verses/progress/Bible legacy | Canonical UUID first; legacy email only while old Auth UID exists; invalid input never inserts |
| School identities/member/legacy/audio/video/access/assignments/exams | Exact approved identity scope + transaction; no School progression logic changes |
| Fasting/Spiritual Plans / Library grants/reading/claims | Same identity purge contract; no grants inferred from device; no runtime/cache logic downgrade |
| Prayer/Testimonies / Sermon likes/blessings / Inbox/receipts / Q&A | Same target-only scope; no notification sending or testimony cleanup changes |
| Profile/avatar/owned Storage | Server-supported Storage remove API BEFORE DB/Auth, UID-owned objects only, batches<=100, bound<=10000, zero-object case |
| Shared device / contradictory UID | B remains in every purge table; device-only B remains quarantined; no device-only delete predicate |
| Issued certificates/documents / shared catalog / Admin records | Active target PII blocks full-delete verification until approved retention/redaction/revocation/offboarding policy; never blindly delete issued history/global content |
| Minimal deletion audit | SHA256 email, immutable actor/target identifiers, time, stage/counts only; no raw email/name/phone/bodies |
| Provider/backups/logs | Independent retention; cannot promise immediate erasure outside active application systems |

Prepare checks confirmed server-verified actor, target immutable UUID + email + typed DELETE, current owner permission/self authority and active Admin protection. Request ID binds actor/target/hash; repeated confirmed UI attempts reuse the same in-memory UUID rather than starting a second purge after an unknown outcome. Job/scope are private deny-all. Mandatory all-domain write-fence/Storage inventory/final-verify ports fail closed until approved schema integration; old access JWTs cannot be assumed invalid merely after banning/revoking refresh.

Stages are explicit, **not atomically cross-system**: authorize → fence → owned Storage API remove/verify → application DB transaction → Auth Admin delete → zero active verification → verified result. Each boundary/failure and zero/201-object path tested. Database rechecks protected Admin/current owner permission. Retained target PII makes transaction fail and rolls back all partial row deletes. No success while an exception is unresolved. After Auth removal, self JWT recovery needs trusted internal persisted-job worker recovery (`resumeDeleteJob`); no HTTP actor override. API 404 requires independent exact-UUID absence proof, plus final database verification.

Synthetic same-email test: old A deleted, fresh UID N registers with same email; retry old UUID job leaves N/Auth/registration intact. Synthetic B retains all its rows on the same device, Auth children and device-only legacy note. Active owner/Admin deletion denied; clients cannot directly execute purge RPCs. Deployed v372/v381/self-delete sources are absent and remain a live completeness blocker. New transport source is **not universally deployable**: actual schema census, dependency ordering/indexes, all write/fence ports/concurrency, legacy owner membership, retained history policy and actual Storage owner/path verification need separate owner approval and implementation from the captured live contract before activation.

### Per-table disposition

Purge rows below pass the synthetic target A→zero / B→one predicate fixture. Exception rows are never silently reported erased; active target PII blocks the transaction. Exact deployed keys/types/existence remain mandatory preflight.

| Table | Domain | Disposition |
|---|---|---|
| `public.registrations` | registrations | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.bible_user_actions` | notes-verses-progress | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.bible_user_bookmarks` | notes-verses-progress | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.bible_user_highlights` | notes-verses-progress | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.bible_user_notes` | notes-verses-progress | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.bible_user_rewards` | notes-verses-progress | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.nh7_account_notes` | notes-verses-progress | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.nh7_account_progress` | notes-verses-progress | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.nh7_account_saved_verses` | notes-verses-progress | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.nh7_account_verse_marks_v230` | notes-verses-progress | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.saved_verses` | notes-verses-progress | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.user_bible_activity` | notes-verses-progress | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.user_notes` | notes-verses-progress | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.user_points_ledger` | notes-verses-progress | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.user_progress` | notes-verses-progress | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.user_reading_progress` | notes-verses-progress | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.church_members` | school | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.nh7_school_video_grants_v260` | school | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.school_assignments` | school | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.school_audio_progress` | school | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.school_course_access_grants` | school | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.school_exam_attempts` | school | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.school_legacy_progress_v542` | school | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.school_progress` | school | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.school_student_identities` | school | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.school_video_progress` | school | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.fasting_daily_logs` | plans | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.fasting_journeys` | plans | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.spiritual_plan_progress` | plans | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.nh7_library_access_grants` | library | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.nh7_library_code_claims` | library | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.nh7_library_grants` | library | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.nh7_library_minister_grants` | library | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.nh7_library_reading_progress_v490` | library | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.nh7_library_user_access` | library | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.nh7_prayer_requests_v502` | community | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.nh7_testimonies_v502` | community | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.nh7_sermon_blessings` | sermon-social | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.nh7_sermon_likes` | sermon-social | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.sermon_blessings` | sermon-social | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.sermon_likes` | sermon-social | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.notification_inbox` | inbox | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.notification_inbox_receipts` | inbox | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.qa_questions` | questions | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.nh7_user_profiles` | profile | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.nh7_user_profiles_v502` | profile | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.profiles` | profile | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `private.nh7_notification_preferences_wave4` | notifications-review | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `private.nh7_notification_subscriptions_wave4` | notifications-review | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.nh7_document_deliveries_v2` | documents-review | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.nh7_document_drafts_v2` | documents-review | Synthetic target purge/B preserve PASS; live key/FK/JSON census required |
| `public.nh7_apocrypha_books_v270` | retention-policy-exception | Policy exception; active PII blocks full-delete success |
| `public.nh7_school_videos_v260` | retention-policy-exception | Policy exception; active PII blocks full-delete success |
| `public.nh7_school_video_codes_v260` | retention-policy-exception | Policy exception; active PII blocks full-delete success |
| `public.school_certificates` | retention-policy-exception | Policy exception; active PII blocks full-delete success |
| `public.nh7_official_documents_v2` | retention-policy-exception | Policy exception; active PII blocks full-delete success |
| `public.nh7_document_design_templates_v2` | retention-policy-exception | Policy exception; active PII blocks full-delete success |
| `private.nh7_document_library_versions_v2` | retention-policy-exception | Policy exception; active PII blocks full-delete success |
| `private.nh7_admin_audit_log_v350` | retention-policy-exception | Policy exception; active PII blocks full-delete success |
| `private.nh7_admin_members_v350` | retention-policy-exception | Policy exception; active PII blocks full-delete success |
| `private.nh7_admin_permission_grants_v350` | retention-policy-exception | Policy exception; active PII blocks full-delete success |

## Verification, measurements and safe rollout

Required local Validate Develop suite and Wave 6.5 tests are run without deployment; exact-head remote result is in final delivery receipt. The historical freeze guards retain their earlier accepted baseline through an **explicit per-file pre/post SHA256 security manifest**; new Wave 6.5 safety guard independently validates the narrow current delta, all other engines/data/backend/migrations exact, disabled flags, no broad clearing/polling/storage SQL deletion. No wildcard runtime exception or removed regression. The Wave3 isolated canonical-signup fixture now loads the new validator dependency first, matching current index.html; its Birthday assertions remain intact. One concurrent local Library refresh timeout passed unchanged on serial rerun; no Library runtime/test assertion was weakened.

Focused tests: validation; actual PostgreSQL strict validator/RPC/atomic Auth triggers/approval/Library/grants/deny-all/purge/retention/registration-after-delete; injected provider staged failures/Storage ordering/idempotency/recovery; complete current browser FA/EN/HR forms, duplicate/existing/wrong/confirmation/offline/timeout/account-switch, CAPTCHA callbacks and reset ownership/session fencing. Current Profile/Search/Inbox, user writing direction, Wave1 performance, Wave2 reconnect/local-first, Wave3 Birthday/Admin, Wave4 Notifications, Wave5 Studio lifecycle/output/security, Wave6 UI/navigation/security and existing responsive/theme/offline/Community/Notes/audio/School reports/PDF/print are retained in CI.

Migration checkpoint: **42/42 exact, zero missing, one pre-existing pending** `20261012123000_audio_bible_public_catalog_read_v511.sql`. No new ordinary migrations, no checkpoint rewrite, none applied.

Raw baseline/current performance: `WAVE6_5_SECURITY_REGISTRATION_MEASUREMENTS.json`. Real wall-clock visible and hidden windows each >=60s, form/Admin idle 10s; no fake Date/timer acceleration. Every remote/provider call intercepted. Final values are summarized in that JSON and final receipt. Valid authenticated submit has one observed registration request; invalid/typing/CAPTCHA-disabled add zero requests. Synthetic delete timings are local fixture cost, not live provider latency/billing. Real native energy/suspension, network quotas and live data index cost remain manual.

Activation is separately gated: owner review → read-only preflight/export rollback metadata → schema/retention/write-fence/concurrency integration → client release/adoption → separately approved strict backend + adapter/grant changes → synthetic staging → optional free CAPTCHA config → full-delete worker/UI flags last. Nothing was activated. Disable flags/stop new jobs first for rollback, then use `disable.sql` and restore exact captured view/ACL definitions; preserve old UID tombstones/in-flight job status. Deleted personal data is not recoverable by source rollback. No blanket grants, cache clear, user restore/backfill or paid feature is an acceptable shortcut.

## Review-only backend files

- `supabase/review/wave6_5-security-registration/README.md`
- `supabase/review/wave6_5-security-registration/delete-orchestrator.mjs`
- `supabase/review/wave6_5-security-registration/delete.sql`
- `supabase/review/wave6_5-security-registration/disable.sql`
- `supabase/review/wave6_5-security-registration/edge.mjs`
- `supabase/review/wave6_5-security-registration/function-matrix.json`
- `supabase/review/wave6_5-security-registration/grants.sql`
- `supabase/review/wave6_5-security-registration/identity-coverage.json`
- `supabase/review/wave6_5-security-registration/library.sql`
- `supabase/review/wave6_5-security-registration/preflight.sql`
- `supabase/review/wave6_5-security-registration/propose-adapters.py`
- `supabase/review/wave6_5-security-registration/registration.sql`
- `supabase/review/wave6_5-security-registration/rls-matrix.json`

## Remaining limits / release blockers

- Live advisor/schema/ACL/view definitions/v3/v351/v372/v381/self-delete/Auth/provider/pg_net settings not verified here. Owner-approved read-only capture is required; no fabricated live counts or remediation claim.
- Exact deployed identity census/FKs/JSON/legacy keys, zero-active verification, Storage API ownership and all write fences/service/Admin-promotion races must be completed/approved before delete activation. Retained documents/shared catalog attribution/Admin logs require owner policy; active PII blocks success. Source fixture coverage does not justify live generic purge SQL.
- Existing Store users do not receive source changes until approved Web/native/Store release from canonical main; strict backend must not be activated before compatible client adoption. Main/release untouched.
- Turnstile/site/secret/free Auth controls remain unconfigured; leaked-password protection remains plan-dependent and off. No paid SMS/KYC/provider dependency.
- Physical iOS/Android signup/recovery/offline/account-switch/accessibility and approved staging email/deletion/Storage/provider latency/manual security acceptance remain. No physical/live claims from Chromium/PGlite.
- Current text scan is not historical git/provider-log certification. Backups/infrastructure/provider retention is independent of active application deletion.

Wave 6.5 ends here. No Wave 7 started.
