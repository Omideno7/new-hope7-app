# Wave6 User App Completion report

2026-10-14 (Europe/Zagreb). Source/fixture convergence on existing `develop`, not a release or physical-device acceptance. Starting develop **184498f5e184ac6f0d5ffdf6962c426957af842b**; pre-implementation audit **13c48a97f41ab5e18c400d1a1e3d6dc6d6269f2e**. Implementation commit **c558be8782a3e01846c36c621653ccb0c81be758**. Unchanged main **15af811f78a17a0881c13171311e7ade6bc390f4**. The final delivery receipt records every implementation/report follow-up SHA, exact final head, complete diff statistics and successful Validate Develop run whose `head_sha` equals that head; keeping the final CI receipt outside the tested Git payload avoids a self-referential commit/CI loop.

No new branch/PR, main edit/merge, historical merge/rebase/cherry-pick, Web/PWA/native/Store/provider/backend deployment, migration apply, real notification, Production/user-row mutation, deletion/backfill/reset or blanket cache clearing. Stop after Wave6; no Wave7 work.

## Confirmed defects and resulting behavior

- **Profile ownership:** the global legacy photo and merged email/unidentified caches could show A's name/photo under B. Current v564 now reads an explicit UID/device-bound photo record, canonical session metadata and only UID-proven cache rows. Explicit user photo selection/removal writes only that owner's new slot; old unbound `nh7_profile_photo_v561` bytes are never copied, overwritten, deleted or automatically assigned an owner. Crop/zoom/policy remain current. Unknown legacy global images require owner re-selection; this is an explicit safe quarantine limitation, not a migration. Same-owner new photos persist across navigation, refresh, full-process browser restart and simulated five minutes. Home/header/Profile agree; presentation-only full-screen viewer closes on owner/route changes. Pending image decode, student identity/cache and private photo responses have exact actor fences.
- **Notes:** nested typed wrappers and cloud content envelopes showed JSON/object/numeric artifacts; the old repair pass automatically rewrote stored notes. Normalization is now presentation/read-only for known envelopes, preserves raw user text/Unicode/paragraphs/newlines, rejects contradictory UID hints, leaves unknown raw data recoverable and disables automatic persisted repairs. Ordinary literal code and numeric user text remain text. Recovery shows the original explicitly with `textContent`, no Delete. Existing writes/deletion/conflict copies/backups/restore remain the Wave2 methods; not a data model change. Known legacy envelope-shaped JSON is treated as that known envelope at display only; original bytes remain recoverable in storage.
- **Virtual Plan notes:** exact current-owner, existing-started-day reflections appear with localized generic titles, no internal plan ID and no Delete. Open uses the current router/history and validates the current assembled catalog/day. No `start:1`; day opening skips synchronization/start side effects and keeps the existing progress payload byte-identical. Explicit Start/Save/Complete operations and queue/merge functions remain unchanged.
- **Global Search:** current v562 retained, now searches literal/exact Bible refs, Bible text, normalized owned Notes, published cached Sermons, saved verses, favorites, current caller-authorized Library metadata, already-loaded public Plans titles and already-approved School lesson titles. Result bound **24** across eight source groups; no protected full-table fetch for indexing. School projection expires at120s and clears on denial/owner change; Library projection reuses existing published/fresh/online authority, excludes URLs and never invents entitlement. Search fences owner/token/epoch/language/connected root/serial; catalog revocation, offline, route and session changes invalidate already-painted rows. Exact note/ref/item/day destinations and Back are tested.
- **Direct audio destination:** the current `audio({open:id})` path still called the retired inline `playSermon`. That one authorized catalog route call now uses the existing classic/media engine with its normal metadata/signed-media/account fence. No engine, signed-url policy, telemetry or second player implementation changed. Real fixture result tap reaches the current engine; browser media is simulated, not native decoding acceptance.
- **Calendar/router:** Calendar's verse handoff called a missing optional `ReaderSource.open`. Added a resolver-to-canonical-exact-verse bridge; release modal/inert before opening, fence account/history during handoff, retain focus/Back. Read-only route tickets prevent delayed Bible/Daily/Library/Audio/Account/Q&A/etc. DOM responses from replacing the new surface. Same route/params do not add duplicate history. Read-only Notes/photo dialogs close on route/Back/owner change. Hidden crop dialog descendants no longer falsely suppress Birthday forever.
- **Themes:** closer baseline measurement proved existing highlighted Bible verses already readable; those highlight rules were retained. Confirmed crop text/default book and standalone My Documents/public verification chrome now use current semantic palette. Existing explicit reader Light/Sepia/Dark and Eye Comfort Paper/Night remain authoritative. Canonical certificate snapshot/PDF/print page coordinates/colors are untouched; only document user chrome/header/record controls are themed. All existing theme engines remain current; no duplicated per-module theme engine.

## Area status matrix

PASS below means source/fixture evidence, not live/native acceptance. PHYSICAL-QA-ONLY suffixes require later device validation; BLOCKED-CONTRACT remains safely disabled.

|Area/current surface|Before → after|Source disposition|Evidence / remaining handoff|
|---|---|---|---|
|Home/header/navigation|PARTIAL → PASS|app read fences/current564; adaptive570/dock558 retained|Nine widths, four orientation/safe-variable probes; native visual acceptance pending|
|Bible chapter/verse/highlight/selection|PARTIAL → PASS|Exact opener/late read fences; original highlight rules retained|32 actual palette contrasts ≥4.5, exact verse/focus/Back, raw note unchanged; not WCAG certification|
|Bible deep links/search|PARTIAL → PASS|Current resolver/canonical router + current562|Literal FA/EN/HR references, exact book/chapter/verse; Wave4 typed-intent negative cases|
|Daily Word365|PARTIAL → PASS|Current theme571/localized content retained; route fence|Actual three-language route/width sweep; completion payload untouched|
|Faith declarations365|PARTIAL → PASS|Same current semantic contract/read fence|Actual route/language/width coverage; editorial body unchanged|
|Daily Juice365|PARTIAL → PASS|Same current semantic contract/read fence|Actual route/language/width coverage; no content/progress mutation|
|Gratitude30|PARTIAL → PASS|Owned display/title normalization; existing save/delete|Actual route/Notes producers; Unicode/raw bytes preserved|
|Current message/declaration surfaces|PASS → PASS|Existing daily/themed content retained|Current content routes; no new module/backend|
|Spiritual Plans|PARTIAL → PASS|Read-only existing-day open and catalog projection; writer methods exact|Exact reflection day/history/Back and byte equality; normal Start/Save/Complete regressions|
|Fasting journeys|PASS → PASS|Existing v240/v412 persistence retained|Wave2 composite keys/offline reconcile, actual localized route; no new progression logic|
|My Notes all producers|BROKEN → PASS|v501/v234 display boundary/virtual entries|Bible/audio/School/book/gratitude/general/legacy/numeric/JSON/Unicode and owner negatives; unknown raw envelopes recoverable|
|Global Search|PARTIAL → PASS|Current562, authority projections only|All eight groups, exact destinations, bounded24, no remote indexing reads, revocation/account/late response tests|
|Profile/photo/Home viewer|BROKEN → PASS with legacy quarantine|Current564/127 + new presentation ticket helper|Header/Profile/restart/five minutes/pending image/student races/A→B; unbound legacy image requires explicit owner selection|
|Account fields/recovery/logout/delete boundary|PARTIAL → PASS source|Canonical metadata/UID display fences; existing Auth operations unchanged|Wrong UID/same email/unidentified-cache negatives, logout fencing; real recovery/mail/deletion not executed|
|Birthday/DOB discovery|PASS → PASS|Wave3 nested metadata/date/owner contract retained|Actual signup fixture, three timezones, once/day, invalid DOB/owner/reduced motion/collisions|
|DOB view/edit capability|BLOCKED-CONTRACT → BLOCKED-CONTRACT|No authenticated general DOB update contract invented|Current registration metadata discovery works; safe editing requires separate approved backend contract|
|Calendar/modal/focus|BROKEN → PASS|Current464 modal release/visibility/handoff fences|Real Calendar→feast→exact verse, Tab/Escape/focus/inert/Back; no theology/calendar content edits|
|Dynamic Library publication/catalog|PASS → PASS|Existing current writer/catalog/collection/freshness retained|Published item arrival without new bundle, unpublished/revoked/other owner excluded; live upload not performed|
|Library reader/offline/access|PARTIAL → PASS source|Current v321/caller authority/public verified caching retained; legacy refresh races fenced|W1 verified public reader FA/EN/HR offline replay; Ministers online/fresh only; expired A credential negative cases|
|Community/Testimonies/Prayer Requests|PASS → PASS|Current Community502/505/507 untouched|Web Community parity + actual localized routes; no cleanup/data/deletion changes|
|Inbox/notifications user UI|PASS → PASS|Wave4 binding/intents/Inbox runtime unchanged|Exact timestamps/read state, owner/session races, localized controls, typed destinations; live/provider closed-app delivery remains activation/device gate|
|School/registration/lessons/assignments/exams/review|PASS → PASS|Current authority/progression/scoring/submit/identity contracts exact|All identity/stage/approval/scoring/submission/review and Wave2 draft tests; UI search is metadata after approval only|
|School reports/Print/Save/PDF/CSV|PASS source / PHYSICAL-QA-ONLY → same|Existing116/119/121 modules untouched|1,109-row full CSV/searchable browser PDF;203-row real Persian PDF; individual long answers; direct tap Print/actionable fallback/Close and no mutations; native Safari sheet/File acceptance pending|
|Audio/Sermon/Audio Bible/mini-player|PARTIAL → PASS source / PHYSICAL-QA-ONLY|One direct route call fixed; all current engines/bridges unchanged|Current player languages/writing direction/state/one engine, play/pause/resume/media actions/route dock; lock-screen/background/native download pending|
|Settings/Appearance themes/readability|PARTIAL → PASS|Current453/514/571 retained + narrow semantic CSS|32 palettes, system/auto controls, route/raw note stability, explicit reader/Eye Comfort preserved|
|My Documents/public user verification|PARTIAL → PASS source / backend activation gate|Current Wave5 authority/render/output exact; themed chrome + localized persistent Back on unavailable archive|Wave5 lifecycle/720 cases/six A4 PDFs/QR/public/UID/races; review backend still disabled|
|Responsive Web/mobile/Fold source|PASS → PASS source / PHYSICAL-QA-ONLY|Current570/558 retained, no old mobile CSS/native touch suppression|567 route-language-width cases320/360/390/430/768/820/1024/1280/1440; four orientations/safe variables; physical WKWebView/Fold not claimed|
|Performance/account/security boundaries|PARTIAL → PASS source|No added recurring poll; UID/session/read tickets|Real60s visible+hidden before/after, callbacks/queries/observers/listeners/local/cloud writes; Wave1–5 authority/owner tests; live billing/battery not claimed|

## Measured before/after summary

|Actual scenario|Remote requests before → after|DOM queries before → after|Timer callbacks before → after|Raw local writes before → after|
|---|---|---|---|---|
|Signed-in startup (10s settle)|18 → 18|2829 → 2653|217 → 195|30 → 30|
|Visible idle60s|0 → 0|237 → 238|172 → 173|2 → 2|
|Simulated hidden60s|0 → 0|227 → 227|146 → 146|1 → 1|
|Global Search typing/results|0 → 2 inherited foreground reads|355 → 360|88 → 88|1 → 1|
|Notes exact JHN3:16 open/edit/delete|2 → 2|5528 → 6135|95 → 72|27 → 27|
|Theme switch, preceding Notes queue settles|6 → 6|7 → 3|6 → 3|7 → 7|
|Profile/photo restore|1 → 1|905 → 909|48 → 50|1 → 1|
|Library open/reopen/forced freshness|2 → 2|1134 → 1136|61 → 62|4 → 4|
|Calendar→Bible (baseline no-op)|0 → 0|494 → 15232|71 → 187|0 → 0|
|Current audio mini-player/navigation|2 → 2|1127 → 1438|48 → 54|12 → 12|

Startup local asset requests133→135: explicit helper/CSS. Visible/hidden observer callbacks and listener registrations0→0; hidden callback sources/counts identical. New startup listeners320→339 implement owner/route/modal fences, with no recurring polling. Search's two raw-sample RPCs are inherited Admin permission/Inbox foreground reads; dedicated already-loaded category queries assert zero remote fetches. Notes save/delete coalesce; four synthetic write calls plus two reads land in the following Theme sample in both runs. Calendar's increased work is the now-working exact reader, not a claimed cost regression against an equivalent baseline. Browser counters include harness queries and single-sample timer boundary variation; no statistical latency/battery/billing claim. Full request and observer details/source hashes are in the measurement JSON.

## Every originally-known concern

|Concern|Disposition|Proof/limit|
|---|---|---|
|Dark/Night invisible verses|PROVEN ALREADY FIXED|Existing highlight cascade retained;32 current palette checks ≥4.5; no physical WCAG claim|
|Themes not propagating to daily content|PROVEN ALREADY FIXED|Current v571 semantic rules/current day routes; only confirmed crop/book/public chrome corrected|
|EN/HR player localization|PROVEN ALREADY FIXED|Current500/571 labels and input direction tested FA→EN→HR; engine unchanged|
|Global Search completeness/direct audio|FIXED|Eight categories/24 bound/authority fences; exact Bible/Notes/Library/Plans/School, current-engine audio tap|
|Profile photo header/persistence|FIXED, unknown legacy ownership quarantined|New explicit owner selection persists; old raw slot preserved with no guessed owner|
|Calendar→verse freeze/no-op|FIXED|Real missing bridge added; exact destination/inert/focus/Back and late read fences|
|Notes code/numeric/JSON artifacts|FIXED at typed display boundary|No automatic raw writes; known envelopes unwrapped; arbitrary user text retained; unknown recoverable original/no Delete|
|Bible deep links|PROVEN ALREADY FIXED core; Calendar/exact Search bridges FIXED|Existing v563/current resolver and Wave4 typed intents retained; late DOM race fixed|
|School Reports Print/Save/PDF|PROVEN ALREADY FIXED source; PHYSICAL-QA ONLY native sheet|Real PDFs/CSV and top-level explicit print/fallback controls pass; no unsupported native success claim|
|Dynamic Library uploads visibility|PROVEN ALREADY FIXED current dynamic contract|Arrival/refresh/open collection/public v321 offline tests; no live upload/activation performed|
|FA/EN/HR general UI sweep|PASS source; confirmed UI error/recovery/title chrome FIXED|218 literal app keys explicit in all3 locales, actual21 routes×3 languages×9 widths, current player/Inbox/School/Community/document regression suites|

Intentionally untranslated: language-selector autonyms English/فارسی/Hrvatski, font/product/proper names, URLs/emails/IDs only where user-facing codes are intended, and exact user/authored/editorial content. No user text auto-translation or timestamp rewriting. No `dir=auto` substitution for controlled writing fields; current writing-direction571 tests cover FA RTL/right and EN/HR LTR/left including save/reopen.

## Validation and fixture changes

All current Validate Develop and canonical release gates retained: migration checkpoint, Student Identity, School read/scoring/submit/assignment/certificate/public verifier/course/stage guards; optimization; responsive570/theme571/offline572; Community; Notes account merge; Audio safety; provenance; Wave1 performance/browser; Wave2 local-first/offline/reconcile/measurement; Wave3 Birthday/Admin fencing/workspace; Wave4 contracts/language/idempotency/deep links/Inbox/account binding; Wave5 document models/PostgreSQL ACLs/lifecycle/QR/PDF/AI/Library boundary/720-render/browser/races; report116/PDF119/Print121 real-browser exports; JS/MJS/CJS syntax, HTML dependencies/JSON and diff check.

New Wave6 tests: `verify-wave6-user-security.cjs`, `verify-wave6-navigation-search.cjs`, `verify-wave6-ui-browser.cjs`, `verify-wave6-read-contracts.cjs`, `verify-wave6-safety.py`, `verify-wave6-syntax.cjs`; synthetic shared fixture `scripts/fixtures/wave6-user.cjs`. Every remote fixture request is intercepted, no real user/provider writes. Browser audio events/visibility are simulations and are explicitly not native decoding/energy evidence.

Old Wave3–5 freeze guards necessarily prohibited future authorized UI edits. They retain their historical assertions against exact pre-Wave6 bytes only for the explicit **hash-pinned, reversible reviewed UI patch** in `scripts/fixtures/wave6-approved-ui.{json,patch}` via `wave6_accepted_source.py`. Each runs the new current-source Wave6 guard first. That guard protects every other runtime/backend/data file and42 migrations byte-for-byte, rejects any new runtime file outside the two named additions, checks27 exact business/persistence sections, authority/engines/notifications/Studio outputs, no polling/blanket clearing, UID photo rules and dependency order. Current behavioral tests still execute actual changed source. Patch blank context lines use Git-accepted empty context instead of whitespace-only lines so repository diff whitespace checks remain clean; inverse-check and runtime hashes are unchanged. No gate/assertion was removed/skipped or unguarded wildcard UI exception added.

Two old fixtures were strengthened: Profile now seeds a UID-proven record and explicitly owns its new photo instead of assuming an unbound global image belongs to anyone; all existing restart/locale/cancel/Inbox/exact navigation assertions remain. Calendar static guard now asserts modal release plus caller/history fence and an actual canonical opener rather than literal matching of the obsolete no-op handoff. New fixtures use actual published reader availability/v321 response and approved protected School lesson shapes; fake empty catalogs are not evidence of real missing UI data.

## Measurements and production boundary

See `docs/qa/WAVE6_USER_APP_MEASUREMENTS.json` for actual before/after samples, per-stage remote/local requests, RPC bodies (synthetic only), wall times, source hashes, callback sources, DOM queries, observer/listener counts and native/live limits. Baseline server is an exact exported starting develop tree; after uses current worktree whose selected runtime hashes are recorded. Date and timers advance normally;60s visible and60s hidden per run, not virtual idle claims. Existing hidden registration/media/catalog maintenance callbacks remain and are measured explicitly; Wave6 adds no recurring polling/high-frequency hidden loop.

The report/export fixture executes the current real report/browser PDF/CSV/Print controls with an intercepted read-only Admin fixture; report engine bytes are unchanged. Report-only counters unsupported by that existing harness are marked unavailable rather than invented. No Production queries are benchmarked. Existing queued explicit Notes write reconciliation can land in the following Theme sample; raw request details preserve that attribution.

Migration parity: **42/42 exact**, zero missing/checkpoint mismatches, **one pre-existing pending** `20261012123000_audio_bible_public_catalog_read_v511.sql`. Pending file unchanged; zero Wave6 migration files or applies. Zero new Wave6 review-only backend files: DOB editing stays unavailable and previous Wave4/Wave5 backend activation flags/contracts remain disabled/review-only. No client authority substituted for those contracts; all prior preflight/activation/rollback documents remain unchanged.

## Remaining physical/live/native limits

- No installed native iPhone/iPad/Android/Fold/Mac build or real Safari print sheet/File/Share/background media/offline lifecycle was exercised. Source/browser safe-area probes and Chromium PDF/print tests do not substitute for that acceptance.
- General authenticated DOB edit lacks an approved contract; no unsafe table write added. Live Auth recovery/deletion, real Library/Admin upload/catalog/RLS/grant/provider behavior and prior review-only notification/Document Studio activation need separately authorized verification. No real users/notifications/documents were mutated.
- Unidentified legacy global profile photos are retained but not attributed to an account; owner must explicitly select their photo. Unknown legacy Notes remain preserved/recoverable; known envelope display interpretation is not a backfill. UID-scoped photo persistence is local/device, not a newly invented cross-device Storage service.
- Browser measurements show callbacks/requests/DOM only, not battery, thermal, billing or physical background suspension. Static/public content and current editorial language datasets were preserved. Historical branch/native wrapper differences remain reference-only, per convergence report.

## Changed files

- `.github/workflows/validate-develop.yml`
- `css/nh7-user-app-wave6.css`
- `docs/qa/WAVE6_HISTORICAL_UI_CONVERGENCE.md`
- `docs/qa/WAVE6_USER_APP_COMPLETION_AUDIT.md`
- `docs/qa/WAVE6_USER_APP_COMPLETION_REPORT.md`
- `docs/qa/WAVE6_USER_APP_MEASUREMENTS.json`
- `document-verify.html`
- `index.html`
- `js/app.js`
- `js/document-studio-v2/archive.mjs`
- `js/nh7-book-reader-v283.js`
- `js/nh7-celebrations-v464.js`
- `js/nh7-global-search-direct-v562.js`
- `js/nh7-library-security-v125.js`
- `js/nh7-my-notes-v234.js`
- `js/nh7-note-text-v501.js`
- `js/nh7-profile-photo-v564.js`
- `js/nh7-spiritual-plans-v240.js`
- `js/nh7-spiritual-plans-v412.js`
- `js/nh7-student-identity-v127.js`
- `js/nh7-user-context-wave6.js`
- `my-documents.html`
- `scripts/fixtures/wave6-approved-ui.json`
- `scripts/fixtures/wave6-approved-ui.patch`
- `scripts/fixtures/wave6-user.cjs`
- `scripts/measure-wave6-user.cjs`
- `scripts/verify-calendar-lock-parity-v250.py`
- `scripts/verify-profile-search-inbox-qa.cjs`
- `scripts/verify-wave3-safety.py`
- `scripts/verify-wave4-safety.py`
- `scripts/verify-wave5-safety.py`
- `scripts/verify-wave6-navigation-search.cjs`
- `scripts/verify-wave6-read-contracts.cjs`
- `scripts/verify-wave6-safety.py`
- `scripts/verify-wave6-syntax.cjs`
- `scripts/verify-wave6-ui-browser.cjs`
- `scripts/verify-wave6-user-security.cjs`
- `scripts/wave6_accepted_source.py`
- `sw-release-core-v403.js`

The final receipt contains exact commit/CI/count/diff values after all report files are committed. Repository must be clean, remote develop equal that final head and remote main equal the starting main before acceptance. No deploy/merge follows green CI.
