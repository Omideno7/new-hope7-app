# Wave6 — pre-implementation user app completion audit

2026-10-14 (Europe/Zagreb). Existing branch/upstream/target `develop`; clean checkout fetched and fast-forwarded only the new task document. Starting **184498f5e184ac6f0d5ffdf6962c426957af842b**, accepted Wave5 **18c9d063b076aab000a89b48fe64c4ea3d1bd7c9**. Main **15af811f78a17a0881c13171311e7ade6bc390f4** unchanged. Required AGENTS/workflow/master/Wave3–5 reports/convergence and full580-line Wave6 specification read. This audit is committed before runtime changes. No native/Production acceptance claim.

## Current runtime trace and reproduced evidence

index.html loads early v563 guard (disables old563/561 photo runtimes and captures initial Bible link), current appearance/styles/finalqa558, Wave1 performance/Wave2 local-first, currentv564 Profile, v562 Search, sermon/catalog/player, note-text501, app.js module/current School drafts/ExamReview566/SoulWinning/keyword engine, current Notes234/categories452/reader452/Library125/321/322, current Plans412/240, appearance514/453, writing direction571, celebrations464, Wave3 Workspace, Wave4 binding/intents and additive Wave5 archive entry. Current module route/history is canonical; no old v540 engine replacement.

Local Chromium actual loaded page, all remote endpoints intercepted, synthetic A/B only, reproduced:
- `typeof NH7ReaderSourceV452.open === 'undefined'`; Calendar feast verse invokes optional missing open and silently navigates nowhere. Current resolve() exists and exact canonical router exists; bridge can resolve then navigate with freshness fence.
- After switching A→B and remounting currentv564, B's header contains A's photo, Home says `Owner AWelcome`, and read() returns A's photo. PHOTO_KEY is global, Profile caches are merged without UID proof, same-tab owner changes aren't handled, delayed student-identity response publishes without exact token/owner fence; pending image decode also lacks actor capture.
- note-text normalize nested `{value:{note:'Exact paragraph\nNext'}}` becomes `[object Object]`; a known cloud `{content:...,updated_at:...}` envelope displays serialized JSON. repairKnownNotes automatically writes every recognized stored key at startup/storage/save events. This is unsafe for unknown/user-authored legacy payloads; Wave6 must prevent automatic rewrites and normalize only typed presentation/read boundaries. Existing local-first/cloud/deletion semantics must remain.
- v562 reads raw local notes with its own parser, shows only cached Audio/Notes/saved refs/Bible text, misses literal Bible reference search unless saved, missing authorized Library/Plans/School and audio favorites. It captures no account/token/language/connected-root ticket; pending results and existing rows can survive account changes. Generic notes fall back Home without locating the exact note.
- app.js render checks navigation epoch only after route functions have assigned DOM; awaited Bible/Daily/account/Library/Audio reads can overwrite a later route. Route presentation checkpoints are needed, not changes to save/auth/progression algorithms.

## Area / disposition matrix

| Area/current route | Active source | Dependency | Before | Defect/risk / intended Wave6 disposition | Required evidence |
|---|---|---|---|---|---|
|Home/navigation|app.js, finalqa558, adaptive570|local routes|PARTIAL|Retain current routes; rebuild only proven presentation parity, no old wholesale app payload|320–1440px/no overflow/back/owner|
|Bible/chapter/selection/highlight/search|app.js, reader452/251, finalqa558.css|bundled exact Bible|PARTIAL|Base propagation already exists; measure dark/highlight contrast and fix only reproduced conflicts; add late-reader route fence|actual verses/themes/three languages/late read|
|Daily Word/Faith/Juice|app.js, daily datasets|published override/current read contracts|PARTIAL|Existing semantic theme layer, independent localized bodies; check buttons/states/late route writes|theme/locale/route and stored notes unchanged|
|Gratitude30|app.js, note234/categories452|owner-scoped local-first notes|PARTIAL|Keep stored text/progress; normalize display/title only, exact day destination|all3 locales/Unicode/day/bytes|
|Spiritual Plans/reflections|plans412/240, notes234|current scope and progress/read contracts|PARTIAL|Rebuild reference's read-only virtual aggregation; title localized/no internal ID; canonical route exact existing day, no start/progress write|raw payload equality/A-B/Back|
|Fasting/Bible reading plans|plans412/240, app.js|existing journey/progression|PASS|Preserve persistence; check theme/localization/direct route handling|source bytes, visible fields|
|Community/Testimony/Prayer/Q&A|community502, qna341, app.js|existing owner/public RPCs|PASS|No cleanup/moderation/authority changes; actual permitted/empty/loading/error theme/locale fixtures|current guards + route views|
|Inbox|app.js, badge418, Wave4 intents|current owner Inbox/receipts|PASS|Keep timestamps/read/delete/badge/binding; presentation-only readability/locale sweep|current Wave4 fixtures|
|Global Search|global-search-direct562|local Bible/caches + current authorized catalogs|BROKEN|Add missing bounded sources, explicit categories, exact destinations, debounce/cancel/current actor/route fences, normalized Notes|each category/FAENHR/negative/delayed results/request bounds|
|Profile photo/header/crop|profile564, early guard563|device-local existing image; no old bucket|BROKEN|Keep crop/editor; add captured owner/refresh/image/student response fences; preserve raw old photo, no blanket clear/migration. Unidentified legacy ownership must not authorize B|Home/header/reload/restart/late picker/A-B/no data loss|
|Profile name/email/student ID|profile564, app.js, identity127|Auth UID/current identity RPC|BROKEN|Prefer current canonical owner metadata; reject contradictory UID/email caches; response cannot publish under other UID/token|same-email different-UID, refresh/late query|
|DOB/Birthday|celebrations464, registration353|nested owner Auth metadata; no proven edit contract|BLOCKED-CONTRACT|Birthday discovery/seen/focus already Wave3; DOB read can be safe, editing remains unavailable without proven approved update contract|Wave3 E2E/no invented write|
|Recovery/logout/delete|app.js, auth342, delete253, Wave2|current Auth/account boundary|PASS|No live action/data deletion; negative fixtures/current guards only|owner/session/local bytes|
|Library dynamic catalog/collections|security125, language321, collections322, app.js|caller-JWT v396/new catalog; v321→v230/file grants|PARTIAL|Current refresh/version/freshness already handles arrivals; expose only authorized current view to search, never direct table/Storage read|publish/withdraw/revoke/A-B/language/offline|
|Library reader/offline/files|reader283, security125, offline paths|verified PUBLIC cache only; Ministers online|PASS|Retain actual current security, old cache quarantine/file/RPC behavior; no deployment of prior hardening|Wave1 tests + unauthorized/deep link|
|Deep links/router/history|app.js, Bible565, Wave4 intents|typed current route vocabulary/authoritative resolver|PARTIAL|Preserve cold/offline/recipient checks and exact Bible/audio/day; route-presentation race fence and duplicate same-intent handling|Wave4 + stress/Back/late reader|
|Calendar→Bible/focus|celebrations464, reader source app.js|local calendar/canonical Bible resolver|BROKEN|Resolve reference then current router; close/inert cleanup before route; fresh token/navigation fence; no theology change|actual click/focus/Back/B switch|
|Birthday modal collisions|celebrations464|current local day/seen and owner metadata|PASS|Preserve Wave3 collision/focus/reduced motion; verify Calendar handoff cannot leave active inert shell|Amen/forms/modals/timezones/local day|
|Audio/Sermon/player|classic484, media500, library500, social443|current engine/signed/offline/current personal state|PASS|Labels have current EN/HR refresh; prove every current control, speed/resume/route/personal action. No player replacement|real engine mocks/labels/one player/state bytes|
|School lessons/exams/assignments|app.js, drafts468, path351, exam344/review566|server authority/identity/scoring|PASS|Keep all progression/submission/identity rules; only late UI read/locale/theme presentation changes if needed|all existing School gates + permitted/denied UI|
|School reports/CSV/realPDF/Print|report496/print117/native120/top-level121|read-only v452/v543|PHYSICAL-QA-ONLY|Wave5 fixtures already prove complete data/real files/actionable Safari fallback; retain and strengthen account race presentation if reproduced|all active buttons/errors/FAENHR/no writes|
|Settings/Appearance|settings403/252, studio453/appearance514/i18n515|local theme/preferences|PARTIAL|Use current semantic variables; complete dictionary/state sweep, no second engine/no account/persistence reset|all presets/modes/active/disabled/contrast|
|My Documents/Public user document view|Wave5 archive/verify/output and legacy routes|UID archive/public allowlist; backend disabled|PASS|Keep review-only flag/authority and fixed document/print palette; theme only surrounding user chrome where appropriate|Wave5 full suite/exact source hashes|
|Native/Fold/safe-area/split panes|adaptive570/current CSS; parity reference|native wrapper absent|PHYSICAL-QA-ONLY|Source/browser widths and env insets only; do not port WKWebView touch suppression/build identity/platform projects|responsive matrix, no physical claim|
|Performance/background|Wave1/2, binding/intents4|event-only/bounded local queues|PASS|Before/after actual60s idle/network/DOM/timers/listeners/writes; no new polling|measurement harness advancing clock|
|Security/owner negatives|Wave2, Library125, Admin3, Notifications4, Studio5|current server UID/role/grant|PARTIAL|Fix Profile/Search stale UI only; retain all business/server boundaries|anon/wrongUID/stale response/no cache clear|

## Historical references and integration plan

Exact fetched reference heads: parity **a4c2ca0e90708a4743bd8be3d367e752510c609c**, Test5 **374b9bfee12897922d82522e47efa4a8837b8b75**. Merge bases respectively **67d829de0d8d4846e309a99bcd98c4c005b3b030**, **cb96965aed165a7ca87f639e861900547a9c9e30**. Exported into /tmp only, no worktree/new branch. Neither proves shipped native payload identity. Document/Watch branches are regression/reference only, no new implementation source.

| Relevant reference behavior | Disposition |
|---|---|
|parity virtual Plans Notes localized titles/canonical route|selectively port/rebuild on current Notes and exact scope; no progress writes|
|parity fullscreen photo viewer|selectively rebuild presentation-only after current Profile owner fence, current crop stays authoritative|
|parity adaptive/sidebar/current route metadata|current570 already adapts widths; reuse metadata only if current actual responsive test proves a gap, no competing router|
|parity measured chrome/insets/hero|reference-only; current570/Fold544/engine authoritative; narrow source/browser fixes only when reproduced, no native wrapper/build/R7 identity work|
|parity Community/Plans/profile patches|superseded by current Wave1–5 and current owner-gated read/persistence modules; no wholesale replacement|
|parity serviceworker/version/newworkflow/native build script|reject as stale/unsafe for this wave; no release/build/deploy/cache reset|
|Test5 dark/Plans/Amen/Inbox/tablet CSS|reference-only for computed-style comparisons; rebuild proven needed semantic variable rule only|
|Test5 Search540/Exam540/Profile/access/Library/Audio engine|superseded by current562/566/564/Wave1–5 authority/personal state; never downgrade|
|Test5 Community guide/user routes|already current newer505/507 testimony/prayer/cleanup boundaries|
|Test5 Notes text normalization|rebuild typed display only; reject automatic destructive repair/unknown wrapper conversion|
|Test5 push/offline/native/store/watch workflows/migration|reject as stale/unsafe; current binding4/offline2/backend data untouched|
|historical QA/docs/previews|reference-only evidence, not current QA/physical/runtime proof|

Full relevant-path/commit convergence will be recorded in WAVE6_HISTORICAL_UI_CONVERGENCE.md; no historical branch/legacy file deletion.

## Implementation, evidence and safety plan

Commit this audit first. Rebuild bounded display/reader-owner helpers where needed, minimally modify current562/564/234 and route presentation checkpoints/Calendar, semantic CSS/localization only after active probe. Preserve existing writer/reader/School progression/audio/Community/Notes backups/Auth functions byte-exact outside explicit presentation context guards. No user payload migration/backfill/reset. No blanket cache clearing. Only executable cache/version suffix wiring if changed modules need it; stable v329 remains.

Old Wave3–5 freeze guards intentionally prohibit all future user UI changes. Adapt them only through exact reviewed Wave6 inverse patch/source invariants with current behavioral tests; do not remove a gate or grant unguarded exceptions. New exact Wave6 scope guard protects every unmodified baseline file and business function/block, backend/data and current server authorities. Full existing Validate Develop and Wave1–5, plus new actual route/theme/localization/Notes/search/Profile/Library/Calendar/history/report/audio/security fixtures and before/after measurements. Explicit supported widths320/360/390/430/768/820/1024/1280/1440 and FAENHR.

DOB/general Auth metadata edit remains BLOCKED-CONTRACT; missing live prior Library/notification/Studio backend activation remains explicit approval gate. No speculative SQL/migration necessary unless later source evidence proves a new contract gap requiring review-only source. Schema checkpoint42/42 exact,0 missing,1 pre-existing pending audio-bible-public-catalog file; no Wave6 migration/applies/deployment/real notification/real user mutation. Source/Chromium fixtures do not prove physical WKWebView, Android/Fold, real Safari Print/Share, real provider/deep links/offline OS lifecycle. Stop after Wave6, no Wave7.
