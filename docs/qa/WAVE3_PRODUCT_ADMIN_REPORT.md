# Wave 3 — Product / Birthday / Admin final report

2026-10-13. Existing `develop` only. **Wave3 code complete within approved client/read-only boundaries; not a release or physical/live-backend acceptance.** Stop here; Wave4 was not started.

## Exact provenance

- Fetched/fast-forwarded task base: `177d196f8fdb2b641156b0e7b28d03e8bd98b7cc` (only the Wave3 task document advanced accepted Wave2).
- Master audit committed **before implementation**: `351fb25af7ab44d1ce0bc6e1f3b11f95e2996ecc`.
- Main implementation: `2e744577e6d614ea4561bda934028e3c12c19ac1`.
- Correct menu ownership / retain existing moderation: `d90e02dc944c1b885c73988b493299f07a7ded18`.
- Final runtime / retain existing detailed dashboard: `13ebccf5c40befcda2fa13610c57ad038869260a`.
- Release/main remains `15af811f78a17a0881c13171311e7ade6bc390f4`.
- This documentation/measurement commit follows the frozen runtime. **The exact final develop/report SHA and exact-head CI run URL are provided in the delivery receipt.** A commit cannot contain its own hash. CI must check that report commit; the runtime bytes above are unchanged by the report commit. Workflow: [Validate Develop](https://github.com/Omideno7/new-hope7-app/actions/workflows/validate-develop.yml).
- Runtime + audit diff: **23 files changed, 574 insertions(+), 69 deletions(-)**. The delivery receipt gives the complete final diff including these two evidence files.

## Complete changed-file list (26 files)

- `.github/workflows/validate-develop.yml`
- `admin-v239-stable.html`
- `admin.html`
- `docs/qa/PRODUCT_COMPLETION_MASTER_AUDIT.md`
- `docs/qa/WAVE3_ADMIN_BIRTHDAY_AUDIT.md`
- `docs/qa/WAVE3_ADMIN_MEASUREMENTS.json`
- `docs/qa/WAVE3_PRODUCT_ADMIN_REPORT.md`
- `index.html`
- `js/nh7-admin-ai-v491.js`
- `js/nh7-admin-community-fixes-v503.js`
- `js/nh7-admin-message-center-v416.js`
- `js/nh7-admin-rbac-v350.js`
- `js/nh7-admin-session-keepalive-v451.js`
- `js/nh7-admin-testimony-core-v565.js`
- `js/nh7-admin-workspace-wave3.js`
- `js/nh7-celebrations-v464.js`
- `scripts/fixtures/wave3-admin.cjs`
- `scripts/measure-wave3-admin.cjs`
- `scripts/run-ci-check.py`
- `scripts/verify-calendar-lock-parity-v250.py`
- `scripts/verify-wave3-admin-browser.cjs`
- `scripts/verify-wave3-admin-fencing.cjs`
- `scripts/verify-wave3-birthday.cjs`
- `scripts/verify-wave3-safety.py`
- `supabase/review/wave3-admin-core/README.md`
- `sw-release-core-v403.js`

The production-facing changes are additive app/Admin wiring, Birthday owner reads/focus handling, Admin authorization/refresh response fencing, the shared workspace, existing composer, two hidden count-read guards and owner-bound AI status probes. Existing app engine/data/security modules and backend executable source are byte-protected by the new scope guard. The worker change rotates **executable** cache only; stable data/download caches remain. No release/Store version bump.

## Birthday E2E result

**PASS code/fixture E2E.** The actual v353 registration click handler creates `user_metadata.school_registration.birthDate`; returned signed-in Auth metadata now reaches Birthday without a flattened cache. Sources, in order: owner session nested registration, direct session metadata DOB aliases, then `nh7_school_access` / `nh7_user_profile` with matching UID/email and no contradictory owner field. Another account cache, invalid/future/missing DOB and explicit logout are rejected.

Preserved cake, Christian blessing, Jeremiah29:11, three rockets/54 sparks/26 confetti, reduced-motion behavior and existing seen keys. Strict YYYY-MM-DD Gregorian date, >=1900, valid date, not future; birthday comparison and once-per-account/day use **device-local calendar**, including cases whose local date differs from UTC. No DOB/data write. Birthday defers for Amen Gate, actual registration success dialog, other modals and focused form input; ownership change closes/fences immediately. Calendar buttons can be reached with Tab and modal/verse handoff remains intact.

FA/EN/HR, RTL/LTR, 390/820/1280 widths, approved-cache/non-School metadata, missing/invalid/not-today, once per day, other-owner/logout, collision/focus and reduced motion all pass. Three timezones: Europe/Zagreb, Pacific/Honolulu, Pacific/Kiritimati. Existing profile DOB viewing/editing remains a gap: no proven current general authenticated DOB update contract, so no insecure write was invented.

## Admin authority and completed Core

**Authority: existing `nh7_admin_my_access_v350()`**, private v350 memberships/grants and `auth.uid()`. Current owner-only REST/RPC/Edge authority remains unchanged. No hardcoded email or cached role acts as authority. App entry requires current caller-JWT server proof; entering the existing current Admin rechecks that credential before data loading. Normal/anonymous users receive no Admin rows in negative fixtures; delegates retain only server-granted registration access.

Completed:

- One additive shared presentation core over existing current Admin functions; current stable loader remains canonical. No wholesale rewrite, legacy deletion, historical port or independent permission system.
- Eleven localized groups: Overview, Requests, Users/Students, School, Content, Messaging/Notifications, Library, Storage, Reports/Analytics, Documents, Settings/Administration. Current callbacks/tool metadata retained; one menu item per tool ID. Existing testimony Storage moderation is preserved under Requests, separate from read-only Storage. Existing detailed dashboard remains accessible under Reports.
- Browser history/Back and responsive phone/tablet/desktop navigation. Meaningful loaded/pending/error/empty states and request categories. Registration/Q&A/assignments summarize loaded data; unverified prayer/testimony counts show dash; loaded count subsets are not claimed as whole-database totals.
- Search over authorized already-loaded registration/student/Q&A/assignment/content rows, max50 hits; current supported student/sermon detail callbacks retained. No entire-table search fetch.
- Generation/token fences for pending bootstrap/sign-in/role/refresh/read responses; both classic data-load phases check generation before merging. Logout/account change clears transient views, exposed helper caches, composer/Storage and report overlays. No user persistence deletion.
- Existing v451 keepalive uses the same single-flight fenced refresh. Twenty concurrent refresh calls produce **one** Auth fixture request. In shared current-session mode, same-UID credentials rotate together; denial/panel logout never revokes the ordinary app session. Explicit separate Admin sign-in retains isolated existing login behavior.
- No new recurring Core/composer polling. Existing prayer/testimony count reads skip hidden state; only these one-line guards change their moderation core files. Active v491 automatic AI-provider status is owner/token-bound, 120s in-memory and in-flight shared; explicit AI actions retain their existing server behavior. Historical v490 is unchanged.
- Existing School, registration, exam, feedback, Library, reports/analytics and Documents capabilities stay on current modules/contracts. No raw high-frequency analytics reactivation.

Deferred safely: whole-database Admin search, authoritative aggregate count API, broader delegated content/messaging/Storage permissions, general DOB edit, proven live target-language delivery, closed-app Admin events/push and full Document Studio V2. Missing contracts are documented, not simulated with client authority.

## Messaging All / Segment / Single

**PASS client contract and guarded fixture execution; live delivery not claimed.** Current templates/directory/history RPCs and unchanged `nh7-admin-messaging-v360` source v4.1.9 remain. All maps to existing `all`; Single uses exactly one known `{user_id,email,language}`; language Segment uses the known directory subset via existing `selected`. Unknown identities/languages are not guessed; selected cap2000. FA/EN/HR drafts survive target/language changes. Recipient-language copy and the existing required English variant must be present.

Draft → escaped immutable Preview → explicit review checkbox → native Confirm → one Execute. No send during preview/cancel; edits invalidate approval; token/owner change fences responses; modal cleanup and timeout warning are explicit; no automatic send retry. Legacy manual Inbox/Broadcast buttons now use this same boundary; automatic approval/document/reply delivery is unchanged. Test sends are intercepted `.invalid` fixtures only. Manually reviewed AI copy can enter draft; no unsupported automatic campaign-AI endpoint is called.

Known existing backend limits: All Push excludes admin-tag subscriptions; All Inbox is approved registrations capped5000, not all Auth users. Selected Inbox uses recorded preferred language, which may lag the actual app preference; provider Push chooses localized variants. Directory/server recipient resolution, audience equivalence, idempotency and actual language delivery need Wave4 approved contract/integration testing. No Edge deploy/source changes.

## Storage / reports / Documents

**Read-only Storage foundation PASS**: manual authenticated GET buckets and POST object/list, prefix, offset, limit100, name/date sort, page-local search, folder navigation, size/date/MIME, clear permission/loading/empty feedback. No sign/download/upload/delete/move/replace operations or full rescans. A potential duplicate/missing reference is a review candidate, never a certified orphan or deletion authorization. Existing testimony/sermon cleanup remains byte-identical, aside from the explicit count-read visibility guard in testimony core; no cleanup action was executed.

Current useful analytics/reports and current v520 Documents remain reachable and protected; School Print/PDF/CSV and public certificates are unchanged. Full Studio templates, rich text/images/page layout/FAENHR/preview/PDF/Print/Draft/Library publication/subsequent edit/AI approval belong to Wave5 and isolated Draft240.

## Measurements

Raw source/fixture provenance and counters: `WAVE3_ADMIN_MEASUREMENTS.json`. Same actual stable Admin and mocked owner data; real timers with a fixed calendar date, settle25s, idle45s, four existing request tabs, compose open, hidden60s. All external traffic intercepted, no delivery/deletion. Real startup callbacks may race; startup totals are an **observed sample**, not a causal/billing guarantee.

Observed total requests **95 → 70**; startup **84 → 66** includes variation in legacy full-load count and fewer AI probes. Matched post-settle phases **11 → 4** give the clearer scoped comparison.

| Scenario | Requests before → after | DOM queries | Observer callbacks | New listener registrations | Composer timer callbacks |
|---|---|---|---|---|---|
| visible_idle | 0 → 0 | 177 → 146 | 0 → 0 | 0 → 0 | 31 → 0 |
| request_navigation | 6 → 1 | 1116 → 1447 | 678 → 814 | 10 → 10 | 1 → 0 |
| compose_open_preview_only | 3 → 3 | 77 → 81 | 38 → 38 | 0 → 1 | 1 → 0 |
| background | 2 → 0 | 236 → 195 | 0 → 0 | 0 → 0 | 40 → 0 |

The old composer timer is removed; the new core adds no recurring timer. Navigation adds finite DOM/observer work for tool capture/decorating and one focus listener per composer opening; this is reported rather than hidden. Singleton guards and assigned event handlers prevent duplicate installations. No physical CPU/battery/thermal, live SQL latency, Production volume, billing, Storage egress or delivery improvement is inferred. The ordinary app adds a necessary bounded role proof for Workspace entry (identity/token, 120s event-only freshness); it is not free or an analytics write.

## Tests / CI

Local PASS:

- All current Validate Develop non-browser commands: syntax, responsive570, theme571, offline572, migration parity; Student Identity Core/School read/scoring/submit/assignments/certificates/public verification/course metadata/stage guards; Next Native Optimization Guard.
- `validate-canonical-develop.py`: every actual current release **validate** block, Community/Web parity, Notes account merge, Plans/theme, Appearance, audio safety, app/Admin wiring, JSON/HTML checks, exam review, calendar lock, current Documents520, notification global Inbox18, cost545 and Fold544. No deploy/apply job runs.
- Consolidation safety, main/develop PR243 guard preservation and exact-byte build provenance.
- Wave1 actual-source VM + browser; Wave2 actual-source VM, repeated-write measurement and full-app offline/reconnect browser.
- Existing Profile/Search/Inbox, Sermon Notes direction, all user-writing direction browser checks; local profile photo Home/header/five minutes/restart, FAENHR, current exact Search routes/timestamps/read/deletion preserved.
- New Birthday actual registration E2E/current-source checks; actual stable Admin/app entry responsive/localized navigation/search/history/category/Storage/Documents/report access; All/Segment/Single draft/preview/edit/confirm/cancel and one intercepted execution; normal/anonymous/delegated negative tests.
- New delayed Admin bootstrap/refresh/legacy read/keepalive, app-role stale reply and concurrent shared-session refresh tests. Personal note payload is unchanged.
- Wave3 safety guard: protected app/data/engine/Library/Profile/backend bytes, old AI490 unchanged, exactly two count visibility changes, server authority, no new polling/destructive Storage path. Changed JS/CJS syntax and `git diff --check`.

Initial exact-head run `38476413463` failed; GitHub returned empty job steps and 403 for runner logs. All local gates remained green. A CI-only wrapper now preserves original commands/exit codes and publishes failing assertions to check annotations; no test is weakened. Final acceptance requires **Validate Develop success on the exact final report/develop SHA**. The delivery receipt records the immutable run URL and confirms its `headSha`; do not substitute an earlier green runtime commit. Browser/VM evidence is not physical/live integration acceptance.

## Completion matrix / next approval gates

| Wave | Remaining ownership after this work |
|---|---|
|4|Notification2.0, closed-app Admin events, All/Segment/Single actual preferred-language delivery, server recipient/event idempotency, exact permission-safe deep links, APNs/FCM/OneSignal device evidence|
|5|Documents V2 and reviewed Draft240 convergence; full authoring/publication/PDF/Print/AI approval contract|
|6|Complete user-app localization/theme/Notes artifact/search/profile/Library/deep-link/School report sweep; DOB edit contract review; whole-database search/count if approved; conflict atomicity limits|
|7|Shared/native iPhone/iPad/Mac/Android/Samsung Fold completion; review Draft241 and AppleWatch Draft106 gates; Wear is absent/future, not invented|
|8|Integration/upgrade/legacy/offline/quota/OS-kill/accessibility/performance/cost and physical acceptance; exact installed SHA and preserved native wrappers|
|After owner-approved final QA only|Release preparation and approved develop→main; same exact shared main bytes for Web/iOS/Android|

Physical/integration still required: iPhone/iPad portrait/landscape WKWebView, Android/Samsung/Fold, Mac/Safari/desktop installed PWA, native safe areas/focus/Back/modal behavior, profile persistence and active audio across context switches, actual account/role transitions, live permitted Storage policies, real notification/Inbox language delivery. AppleWatch companion architecture remains unvalidated, not merged. No native build/deployment was attempted in this environment.

Migration checkpoint remains **42/42 exact, zero missing, one pre-existing pending** `20261012123000_audio_bible_public_catalog_read_v511.sql`. Zero new migration/pending file. This is repository checkpoint parity, not a new live schema inspection. No file was applied/backfilled. Review-only notes: `supabase/review/wave3-admin-core/README.md`; no speculative runnable SQL or new secret.

## Safety / rollback

Existing Notes/progress/saved refs/assignments/exam attempts/downloads/conflicts/outbox/profile and Community data formats/persistence are unchanged. Tests mutate only isolated mock state. Only transient Admin view/session presentation changes and current same-UID session refresh coordination are added; **no user-data model, backend authority or Production data behavior was changed/deployed**. User app/Admin useful functions stay; no legacy module deleted. Client-only rollback via reviewed normal develop revert; retain Wave2 scoped stores/outbox and all user data. No backend rollback/data cleanup required.

No new branch or PR, no main modification/push/merge, no force/history rewrite, no Web/PWA/Production/Supabase schema/RLS/Storage/Auth/Edge deployment, no migration, no App Store/Google Play release, no user-data delete/migrate/backfill/cache reset. Draft240/241/106 untouched. Develop push triggers only read-only Validate Develop; deployment/apply workflows target other branches/main and were not invoked. Stop after Wave3.
