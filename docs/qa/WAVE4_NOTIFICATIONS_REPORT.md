# Wave 4 Notifications 2.0 — source and fixture completion report

2026-10-14. Existing `develop` only. This continues the preserved local audit and implementation after the usage interruption; no replacement branch, parallel contract or duplicate implementation was created. Nothing is released or enabled in Production by this work. Live closed-app/provider delivery remains unproven and explicitly gated.

## Provenance and acceptance

- Starting develop: **f841a1df90c07e842ebf4b910df26dfd8561b2a3**; accepted Wave3: `32eb9b59afa07a0c95f6c94323364708002702b6`.
- Pre-implementation audit commit: **3abbe6cb420b6017935c71303a9c0109c386e15f**. It existed locally before resumption and was preserved.
- Runtime, review-source and regression implementation: **f7172a8abd8ca79a0222787030b4ff62821bba32**.
- Final evidence commit adds this report, measurements, stable/switch measurement phases, expired-identity/preview negatives and corrects the browser counter's history-RPC name; no runtime difference from the measured implementation. The delivery receipt records its exact final develop SHA, complete diff statistics and the successful Validate Develop URL with matching `head_sha`. A report cannot contain its own Git hash; acceptance requires that receipt, not an earlier run.
- Main: **15af811f78a17a0881c13171311e7ade6bc390f4**, unchanged. Existing Draft #240/#241/#106 and their branches were not touched.
- Audit: [WAVE4_NOTIFICATIONS_AUDIT.md](WAVE4_NOTIFICATIONS_AUDIT.md). Raw counters/provenance: [WAVE4_NOTIFICATIONS_MEASUREMENTS.json](WAVE4_NOTIFICATIONS_MEASUREMENTS.json). Exact future approval/disable steps: [backend README](../../supabase/review/wave4-notifications-2/README.md).

## Findings and canonical architecture

Previously loaded v364 repeatedly checked binding every 2.5 seconds; v334 independently rewrote language/tags and requested permission on an unrelated first click; Admin v400 used a shared external ID rather than authenticated UID. Awaited SDK/Inbox refresh operations lacked consistent owner fences. The client-trusted manual sender did not prove current recipient preference or immutable preview/idempotency. Remote clicks did not safely preserve exact params. Existing event sender's role-tag audience and failure-claim deletion were insufficient for private closed-app workflows.

One pipeline now governs source/fixtures: business transition or approved campaign → current server authority → current recipient/language snapshot → durable channel/device claim → **existing** Inbox and/or provider → sole v364 binding → typed intent → current UID/access resolver → **existing** app/Admin router. No second Inbox, directory, history or router was introduced. Current deployed Edge source is unchanged; replacement contracts live only under review.

The remaining Inbox race was reproduced after resumption: A's delayed refresh, including a failure, could cause a retry under B's new session. Both REST/snapshot paths now recheck owner/UID/logout after refresh before retry. Success/failure fixtures prove B's session bytes and Notes remain unchanged and only the initial snapshot + refresh occur.

## Runtime changes

- **Binding:** serialized, event-driven v364 is sole Web/native binding owner. UID must match unexpired JWT subject. Server-proven Admin context uses its current JWT. Every awaited operation is fenced; A→B races repair provider external identity without publishing/tagging stale A. Same-account lifecycle/token refresh deduplicates login and language; legitimate multiple devices remain separate. No recurring binding loop.
- **Language:** FA/EN/HR tags/language update only when signature changes. Intentional language preference writes are debounced, owner-bound, deduplicated and backend-gated; render/focus does not write preference. v334/v400 delegate, preserving native initialization and existing server_v335 Europe/Zagreb scheduling.
- **Permission/status:** permission prompt only on existing explicit Enable controls. Localized ready/unavailable status does not claim device receipt. Unsupported/offline/missing subscription leaves normal app usage intact. No new animation or background prompt loop.
- **Composer:** retains owner Draft → Preview → checkbox → Confirm → Execute, current templates/history and explicit review. Server preview resolves UID/actual language; stale/unknown directory language cannot force wrong copy or suppress a server-valid segment. Single selects exactly one known UID. Edits invalidate approval, cancel never sends, in-flight double click is blocked, request UUID remains stable through same-content re-preview, and unknown outcomes never auto-retry. Missing new backend preview fails closed with localized approval-required copy; no old client-trusted sender fallback.
- **Deep links:** shared strict vocabulary rejects arbitrary URLs/scripts/HTML, unsupported keys, malformed UUIDs and `start:1`. Exact Bible/day/audio/School/Plans/Admin targets reuse current routes/history. Public generic targets use existing public paths; recipient/restricted targets require current caller-JWT resolver when backend enabled. Offline/cold-start retains only bounded non-sensitive intent, rechecks on reconnect/login, rejects wrong account/stale response. Foreground banner never forces navigation during forms, does not insert a duplicate Inbox row, and uses the same safe resolver. Back/lifecycle dedupe is tested.
- **Plans safety:** exact existing owner/day only; unmaterialized day is unavailable because current renderer would start progress. Scoped presentation disposal prevents an old Plans restore callback replacing a later route. No progress, Notes, queue or persistence logic changed.
- **Inbox:** existing timestamps, receipts, read/delete model, TTL and visible-only Wave1 cadence retained. New typed UID-owned rows retain received language/history and bypass legacy scheduled-title collapsing; historical rows are not rewritten. Badge labels localized. Stale Auth refresh cannot replace/delete B's session. Local cancellation narrowed to this app's retired 17000–19999 IDs instead of all plugin notifications.
- **Cache:** rotate executable cache and load two shared notification modules; stable `nh7-data-stable-v329`, downloads and current worker/imports remain intact. No stable cache reset.

## Exact source/fixture status

| Event | Reviewed producer / current permission | Fixture result | Production status |
|---|---|---|---|
|Registration|registrations insert / distinct status transition; owner + active registrations.view delegate|Repeated identical event: 2 generic localized Push calls + 2 Inbox rows total, not doubled; exact Admin source UUID|Not deployed/activated; live closed-app receipt unproven|
|Prayer|current prayer table insert / distinct status; current owner only|1 Push + 1 Inbox; non-matching delegate excluded; exact UUID|Same approval gate|
|Q&A|qa_questions insert / distinct status; current owner only|1 Push + 1 Inbox; generic copy; exact UUID|Same approval gate|
|Assignment|school_assignments insert / distinct status; current owner only|1 Push + 1 Inbox; no answer/body in push; exact UUID|Same approval gate|
|Testimony|current testimony table insert / distinct status; current owner only|1 Push + 1 Inbox; no private testimony body; exact UUID|Same approval gate|

Current RBAC has registrations.view as the delegable category permission; no fabricated new permission/grant was assigned. Other supported queues were audited, not implicitly activated. Business rows/submission paths are unchanged. Queue producer carries type/source/revision/time, not private content; worker is bounded server invocation, never browser polling.

| Audience / channels | Result | Exact meaning / limit |
|---|---|---|
|All|PASS Push, Inbox, Push+Inbox|Active confirmed approved-registration accounts excluding current server Admins; not every Auth user/device; max2000 explicit failure|
|FA segment|PASS all 3 channels|Same audience, current supported server FA preference|
|EN segment|PASS all 3 channels|Same audience, current EN preference/documented unknown→EN fallback; zero stale directory EN rows cannot block server preview|
|HR segment|PASS all 3 channels|Same audience, current supported HR preference|
|Single|PASS all 3 channels|Exactly one eligible known UID; spoofed email/language ignored|
|Push|PASS source/fixtures|One deterministic claim/provider call per verified device; accepted ≠ delivered|
|Inbox|PASS source/fixtures|One existing-Inbox row per recipient/logical event; device-independent|
|Push+Inbox|PASS source/fixtures|Separate claims; unknown Push does not duplicate recorded Inbox|

All 15 mode/channel combinations pass concurrent double Execute. Multiple devices yield two Push calls and one Inbox row. Changed audience/language, revoked owner and unapproved/Admin recipient fail closed. Immutable preview/request identity and unique claim prevent duplicate sends; timeout stays `unknown` with claim retained, same logical retry returns that state without a second provider call.

Preferred language: authenticated intentional app choice → latest supported recorded registration language → explicit English fallback. FA, EN and HR fixtures select exactly recipient's copy, irrespective of Admin UI language. Unknown is flagged, never inferred from email/country. Generic lock-screen copy includes no prayer/testimony/assignment content, phone/email/medical detail. Source registry and provider ownership checks require current Auth UID; tags are hints only.

## Deep links, identity and negative tests

- Current Home/Inbox/settings/meetings, exact Daily day, Bible John3:16, non-autoplay Audio item, approved/unlocked foundation School lesson, existing Spiritual Plan/day, five Admin queues, overview and messaging history have explicit typed contracts. Exact route/Back/foreground/cold-start/offline/resume fixtures pass. School resolver reuses current v230/v351 authority; unsupported non-foundation lesson gates remain unavailable pending proven canonical backend contract.
- Actual app tested at 390/820/1280px in FA RTL and EN/HR LTR: no overflow, localized banner/errors, existing timestamp after opening, route history, read-only Plan byte equality and no implicit new day. Existing Profile/Search/Inbox, writing-direction and Admin keyboard/navigation tests retained.
- Anonymous/normal Admin denial, delegate without matching event permission, stale owner/UID response, wrong recipient, malformed route ID, external/javascript URL, expired/missing identity checks, revoked permission/audience, logout→B, delayed A→B binding and delayed Inbox refresh pass. No Admin DTO is exposed before current access proof.
- Web/native asynchronous getter fixtures: 20 stable lifecycle events add **0 SDK operations / 0 backend requests**; same-UID token refresh does not re-create subscription. A→B adds one logout/login/language/remove-role/tag sequence, **0 backend requests with flag disabled**; current state belongs to B. Saved Notes remain byte-identical.
- Real reviewed Edge handlers exercised with injected HTTP: anonymous campaign401/no calls; normal403 before privileged contract; unauthorized worker403/no queue read; signed identity uses authenticated UID despite victim UID input. Actual scheduled due()/Zagreb conversion preserves weekday/window rules, spring missing hour and fall repeated-hour same-date dedupe.
- Review SQL was parsed with temporary pglast7.10 for outer PostgreSQL syntax only. No PostgreSQL instance, DDL/RLS/function-body/schema integration or live provider was executed. In-memory Store claims test orchestration, not live SQL concurrency. These limitations must not be represented as Production security acceptance.

## Measurements

Final measurements use the same harness for exported starting f841… and frozen implementation f717…; actual advancing browser clock/wall timers, 12s startup settle, at least60s visible +60s simulated hidden on app/Admin, remote calls intercepted and SDK fake. The audit's initial fixed-calendar experiment is superseded by these final real-clock samples. Hidden document simulation is not native OS suspension. Raw counts include existing app/Admin requests and legacy observers/timers, not only Wave4. Composer open/cancel is measured separately from four explicit preview fixture requests; the raw idle harness's legacy `compose_open_preview_cancel` label performs open/cancel only.

| Surface / phase | Before requests → after | Before notification callbacks → after |
|---|---|---|
|signed-in app startup (12s settle)|13 → 13|See raw per-file counters|
|signed-in app foreground_idle (60000ms)|0 → 0|24 → 0|
|signed-in app stable_binding_lifecycle (750ms)|0 → 0|0 → 0|
|signed-in app background (60000ms)|0 → 0|24 → 0|
|signed-in app account_switch_binding (750ms)|0 → 0|0 → 0|
|Admin startup (12s settle)|49 → 49|See raw per-file counters|
|Admin foreground_idle (60000ms)|0 → 0|31 → 0|
|Admin stable_binding_lifecycle (750ms)|19 → 19|0 → 0|
|Admin compose_open_preview_cancel (500ms)|3 → 3|0 → 0|
|Admin background (60000ms)|0 → 0|0 → 0|

The20-event stable lifecycle probe adds0 push-binding endpoint requests before/after; SDK mutations fall from4→0 in the ordinary app and80→0 in Admin. The19→19 Admin HTTP calls in that probe are the existing Auth/loadAll refresh (listed individually in JSON), not new binding polling; they are retained, not hidden or counted as0. Ordinary account switch has0→0 HTTP calls and6→5 SDK mutations, with correct current B binding.

Startup count variation is not a causal request reduction/increase claim: legacy async loading and intercepted fixture timing remain. All observed settled60s visible/background request counts are0; notification-origin recurring callbacks are removed. Retained visible-only Inbox/Admin legacy cadences outside these windows are not claimed nonexistent. Complete per-file timer callbacks, observer callbacks/listener registrations and SDK operations are in JSON. Counts are not Production billing, battery, CPU, SQL latency or APNs/FCM evidence.

Actual composer: 3 directory/templates/history open reads, one server Preview request per explicit click (4 in this fixture scenario), one Execute POST despite double click,0 cancel executes,0 unknown automatic retries. All-mode three-account Push+Inbox executes twice concurrently but records3 Push calls +3 Inbox rows total. Repeated event generation counts are in the table/JSON. Backend-enabled binding endpoint latency/counts are not live measured; reviewed endpoints/provider proof remain approval-gated.

## Regression/CI coverage

All existing Validate Develop gates are retained and run: active JS/review TS/CJS syntax; responsivev570, themev571, offlinev572; migration parity; every current School identity/scoring/submit/certificate/public-verifier/stage guard; Next Native Optimization Guard; canonical current release safeguards without deployment; consolidation and main/develop-sync; build byte provenance; Wave1 VM/browser/performance invariants; Wave2 VM/browser/measurement/offline owner isolation; Wave3 Birthday/Admin fencing/workspace; Profile/Search/Inbox; sermon/general writing direction; new Wave4 fixtures/browser/scope. `git diff --check` passes. Wave3 assertions were adapted to the approved new server preview/token request and atomically observe the same11-nav readiness condition; no test was removed/skipped/weakened.

`verify-wave4-safety.py` proves all baseline product data/engines/current deployed functions/migrations remain exact except an explicit notification/routing allowlist. app.js reverses only approved notification presentation/dispatch/presentation disposal and narrowed local cancellation to exact baseline; Plans persistence is exact. Current protected Notes backups, Bible conflicts, Audio/resume/offline, Library, Profile, School/business submissions, Documents/reports and account merge are unchanged. No live user data was used. Final successful exact-head CI is mandatory and recorded in the delivery receipt.

Migration checkpoint: **42/42 raw-hash exact, 0 missing, 1 pre-existing pending**, unchanged: `supabase/migrations/20261012123000_audio_bible_public_catalog_read_v511.sql`. No new migration or migration application. Review SQL is outside migrations.

## Changed files

35 files relative to starting develop (complete inventory):

- `.github/workflows/validate-develop.yml`
- `admin.html`
- `docs/qa/WAVE4_NOTIFICATIONS_AUDIT.md`
- `docs/qa/WAVE4_NOTIFICATIONS_MEASUREMENTS.json`
- `docs/qa/WAVE4_NOTIFICATIONS_REPORT.md`
- `index.html`
- `js/app.js`
- `js/nh7-admin-message-center-v416.js`
- `js/nh7-admin-push-owner-v400.js`
- `js/nh7-inbox-badge-sync-v418.js`
- `js/nh7-notification-contract-wave4.js`
- `js/nh7-notification-intents-wave4.js`
- `js/nh7-notifications-zagreb-v334.js`
- `js/nh7-push-account-bind-v364.js`
- `js/nh7-spiritual-plans-v412.js`
- `scripts/fixtures/wave3-admin.cjs`
- `scripts/measure-wave4-notifications.cjs`
- `scripts/verify-wave3-admin-browser.cjs`
- `scripts/verify-wave3-safety.py`
- `scripts/verify-wave4-notifications-browser.cjs`
- `scripts/verify-wave4-notifications.cjs`
- `scripts/verify-wave4-review-syntax.cjs`
- `scripts/verify-wave4-safety.py`
- `supabase/review/wave4-notifications-2/README.md`
- `supabase/review/wave4-notifications-2/authorization.sql`
- `supabase/review/wave4-notifications-2/candidate.sql`
- `supabase/review/wave4-notifications-2/disable.sql`
- `supabase/review/wave4-notifications-2/edge.ts`
- `supabase/review/wave4-notifications-2/entrypoint.ts`
- `supabase/review/wave4-notifications-2/inbox-snapshot.sql`
- `supabase/review/wave4-notifications-2/pipeline.ts`
- `supabase/review/wave4-notifications-2/preflight.sql`
- `supabase/review/wave4-notifications-2/scheduled-sender.ts`
- `supabase/review/wave4-notifications-2/service-grants.sql`
- `sw-release-core-v403.js`

CI syntax failure was reproduced with the actual runner Node24.21.0: its naked `--check file.ts` no longer erases annotations (local24.19 did), although module execution fixtures pass. `verify-wave4-review-syntax.cjs` uses Node's built-in TypeScript parser/type erasure, then checks the resulting module JavaScript without importing/serving backend entrypoints. Both versions pass; no dependency/check was removed. Syntax failures now also surface through the existing run-ci-check annotation wrapper. Runtime/measurement source bytes remain f717…; CI-only follow-up hashes and the exact final successful head are in the delivery receipt.

## Review-only backend and remaining acceptance gates

Exact paths: `supabase/review/wave4-notifications-2/{README.md,pipeline.ts,edge.ts,entrypoint.ts,candidate.sql,authorization.sql,service-grants.sql,inbox-snapshot.sql,scheduled-sender.ts,preflight.sql,disable.sql}`. None is deployed/current Production source. Private preference/subscription metadata is proposed only because no proven reusable current registry exists in repo; existing Inbox/receipt/campaign/event/dispatch authorities are extended, never replaced.

1. Approved read-only live schema/constraint/registry/v350 membership/v419 preflight, including legacy owner fallback equivalence. Current status CHECK definitions are absent: no guessed/drop-all amendments. Isolated actual PostgreSQL transaction/function/RLS/negative/concurrency acceptance is required before any apply.
2. Separately approve exact source/schema/constraint amendments, preserve all rows and receipt/read/delete semantics. Producer activation is last, after worker readiness/isolation. No enqueue/backfill/notification generation of historical rows.
3. Existing service packaging/import graph, current verify_jwt, service-only helper privileges, bounded secret-authenticated queue invocation. No new release/apply workflow or production function was added.
4. Actual OneSignal Web/native SDK versions must accept proposed identity-verification JWT/claims/expiry/renewal; validate View User response shape and current subscription membership. Only then enable backend capability. Native APNs/FCM tokens, entitlements, consent/denial, provider failures, logout/switch and actual closed-app/cold-start/foreground receipt require controlled real devices in Wave8. A provider-accepted notification cannot be recalled on logout; its generic copy and subsequent authenticated tap fence limit disclosure.
5. Scheduled sender review retains current global three-language Inbox/time rules and legacy channel coupling; it does not claim new reconciliation of historical reminder channels. Live scheduled/provider failure acceptance remains required. New event/campaign channels are independently claimed/tested.
6. All-audience database plans/volume/limits, queue invocation cadence, isolated subscription registry re-use decision and rate/operational monitoring require integration evidence; no live cost/delivery/battery claim.

Rollback/disable is review-only: stop new worker/provider invocation, disable flag/new producers/auth Preview under separate approval, retain every row/receipt/claim/preference and new UID/RLS/snapshot fences. Never revert to a snapshot exposing newly restricted rows; never delete unknown claims to retry blindly. Detailed order in README/disable.sql.

No real notification was sent. No deployment, Production mutation, migration apply, user-data deletion/migration/backfill/reset, new branch, PR, merge, main change or Store release occurred. No Wave5 work was started.
