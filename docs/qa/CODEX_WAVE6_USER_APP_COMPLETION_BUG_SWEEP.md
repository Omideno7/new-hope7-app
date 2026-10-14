# Wave 6 — User App Completion / Bug & UX Convergence

## Mission

Complete the current user-facing New Hope 7 app at **source/fixture level** on the existing `develop` branch, using the accepted Wave 1–5 runtime as the only canonical base. This wave is a comprehensive user-app bug sweep, localization/theme convergence, navigation/data-safety hardening, and regression pass. It is **not** a release, Production deployment, native-device acceptance, backend activation, or branch merge.

The required outcome is one current `develop` implementation where the known user-facing gaps are either:

- fixed and regression-tested;
- proven already fixed by current source and tests; or
- explicitly documented as blocked by a missing approved backend/native contract and left safely unchanged.

Do not hide gaps by marking source presence as completion.

---

## Mandatory starting point and references

Work only from the exact current head of existing `develop`.

Before any implementation, read:

- `AGENTS.md`
- `docs/DEVELOPMENT_WORKFLOW.md`
- `docs/qa/PRODUCT_COMPLETION_MASTER_AUDIT.md`
- `docs/qa/WAVE3_PRODUCT_ADMIN_REPORT.md`
- `docs/qa/WAVE4_NOTIFICATIONS_REPORT.md`
- `docs/qa/WAVE5_DOCUMENT_STUDIO_REPORT.md`
- `docs/qa/WAVE5_DOCUMENT_STUDIO_BRANCH_CONVERGENCE.md`

Accepted current foundations that must remain intact:

- Wave 1 performance/request/DOM safeguards
- Wave 2 local-first durable owner-scoped personal data and reconciliation
- Wave 3 Birthday and server-authorized Admin Workspace
- Wave 4 Notifications 2.0 source/fixture contracts and account-safe binding
- Wave 5 Document Studio V2 source/fixture implementation and review-only backend boundary

Reference-only historical branches:

- `codex/web-mobile-parity-safe-v573`
- `feature/final-qa-v2500-20261004`
- `codex/document-studio-regression-qa`
- `feature/watchos-v2500-20261004`

For Wave 6, only the first two may contain relevant historical user-app fixes. **Do not merge, rebase, or blindly cherry-pick any historical branch.** Export/read/compare them as evidence only. Every useful behavior must be re-evaluated against current `develop` and selectively rebuilt or omitted. The Document Studio and Watch branches are not Wave 6 implementation sources except for regression/reference checks.

---

# Phase A — Pre-implementation User App Completion Audit

Create and commit a pre-implementation audit before runtime changes:

`docs/qa/WAVE6_USER_APP_COMPLETION_AUDIT.md`

For every user-facing area below, report:

- current route/surface;
- current active source files;
- backend/native dependency;
- status: `PASS`, `PARTIAL`, `BROKEN`, `BLOCKED-CONTRACT`, or `PHYSICAL-QA-ONLY`;
- exact defect or risk;
- exact intended Wave 6 disposition;
- regression evidence needed.

Do not rely only on filenames or old QA reports. Trace current loaded runtime, router, state ownership, persistent keys, source ordering and active CSS.

Also create a historical-reference disposition table for the relevant unique paths/commits in:

- `codex/web-mobile-parity-safe-v573`
- `feature/final-qa-v2500-20261004`

Classify each relevant behavior as:

- already current;
- superseded by safer/newer implementation;
- selectively port/rebuild;
- reference-only;
- reject as stale/unsafe.

No branch deletion in this wave.

---

# Phase B — Theme / Dark / Night / Readability convergence

Audit and fix the complete active user app so appearance settings propagate consistently without per-module visual breakage.

At minimum cover:

- Bible chapter/verse reader;
- verse selection/highlight/search result views;
- Daily Word 365;
- Faith declarations 365;
- Daily Juice 365;
- Gratitude 30;
- declarations/message-of-the-day surfaces if currently active;
- Plans and fasting journeys;
- Community / testimony / prayer request user surfaces;
- Inbox;
- Library catalog and book reader;
- Audio/Sermon catalog, player and mini-player;
- School catalog/lesson/exam/review/user report surfaces;
- Profile / Account / Settings;
- Christian Calendar / Birthday surfaces;
- My Documents / public user document viewing surfaces where user theme applies.

Requirements:

1. Light, Dark/Night, System/Auto and every currently-supported custom theme must preserve readable foreground/background contrast.
2. Bible verse text must never become invisible or near-invisible in Dark/Night.
3. Active/selected/disabled/focus/error/success states must remain distinguishable.
4. Theme propagation must not require reopening the whole app unless a current platform API genuinely requires it.
5. Theme changes must not reset route, scroll, audio state, Notes state, plan state, exam state or current account data.
6. Do not introduce per-module duplicated theme engines; converge on current appearance variables/contracts.
7. Preserve reduced-motion behavior.
8. Keep print/PDF/export surfaces semantically separate from interactive app theme where a fixed print palette is required.
9. Run source-level contrast/readability fixtures across FA/EN/HR and representative widths. Do not claim WCAG certification unless actually measured against the standard.

---

# Phase C — FA / EN / HR localization and direction sweep

Perform a complete current user-app localization audit.

Requirements:

- no visible user-facing English fallback in FA or HR except proper names/technical tokens intentionally untranslated;
- no Persian text in EN/HR surfaces except user-created content;
- all active button labels, dialogs, empty/error/loading states, toasts, player actions, search labels, filters, settings, account flows, School flows, Community flows, Inbox, Plans, Library, audio and document user surfaces must be checked;
- use current translation architecture rather than creating a parallel dictionary system;
- preserve canonical content text exactly where content datasets intentionally contain a language-specific body;
- user-authored text must never be auto-translated without explicit user/admin action;
- FA input direction is RTL; EN/HR are LTR;
- do not use `dir=auto` as a substitute for the required app-language writing behavior on controlled user-writing fields;
- mixed Bible references, emails, URLs, codes and numbers must render without corrupting logical value;
- date/time formatting must remain localized where currently intended, without rewriting stored timestamps.

Explicitly verify Audio Player control labels in EN and HR, plus all current mini-player/full-player buttons.

Create automated coverage for localized strings on actual active routes at minimum 390, 820 and 1280 CSS px.

---

# Phase D — My Notes complete artifact / legacy-format sweep

Known user concern: Notes may display code/numeric artifacts or malformed representations depending on origin.

Trace every current Notes producer and viewer, including:

- Bible single/multi-verse notes;
- Sermon/audio notes;
- School notes;
- Plans/reflections;
- Library/book notes;
- general My Notes creation/editing;
- any imported legacy local note formats still recognized;
- Wave 2 local-first/cloud backup/reconciliation.

Requirements:

1. Never display internal IDs, serialized JSON, HTML/code wrappers, numeric enum values or implementation markers as the visible note body/title unless that was genuinely user-authored text.
2. Do not destructively rewrite unknown legacy payloads.
3. Normalize at presentation/read boundary where possible; migration/backfill is forbidden unless separately approved.
4. Preserve exact user text, Unicode, paragraphs and line breaks.
5. Preserve owner isolation and conflict copies from Wave 2.
6. Account A data must never appear under B.
7. Offline edit/delete/reload/reconnect must still work.
8. Search/indexing must use normalized visible text without altering stored user payload.
9. Empty/invalid legacy data must fail safely with a recoverable/read-only representation rather than silent deletion.

Add regression fixtures representing every known producer and several legacy malformed formats.

---

# Phase E — Global Search completion

The Home/global search must be a real current-app search, not Notes-only.

Required searchable categories, where current authorized data exists:

- Bible verses / exact references / text;
- user Notes;
- Sermons / audio items;
- saved Bible verses / favorites;
- current Library catalog metadata when permitted by existing catalog/access contract;
- Plans titles if already locally/catalog available without expensive fetch;
- current School content metadata only where the user already has authorized/catalog access.

Do not fetch protected entire tables solely to populate global search.

Requirements:

1. Search result explicitly indicates category/source.
2. Bible result opens the exact book/chapter/verse, not only the chapter.
3. Audio/Sermon result opens/starts through the canonical current player route; no second player implementation.
4. Notes result opens the exact note context/editor/viewer available for that note type.
5. Library result must still pass current Library authorization before opening.
6. School result must still pass current server-authoritative approval/progression gates.
7. Search must work correctly in FA/EN/HR and handle RTL/LTR.
8. Debounce/cancel stale search responses; switching accounts/routes must fence old results.
9. No new polling or unbounded scans.
10. Empty/loading/error states localized.
11. Keep result count bounded and document the bound.

Measure startup/search requests and DOM work relative to the current accepted baseline.

---

# Phase F — Profile / Account persistence and identity safety

Audit the complete current profile/account flow.

## Profile photo

Known concern: image may disappear/not appear in Home header.

Requirements:

- current user's photo must persist across Home/Profile navigation, reload and supported restart path;
- header and Profile must show the same current owner image;
- account switch/logout immediately fences the previous owner's photo;
- never display A's photo while B is current;
- preserve existing crop/zoom/data policy unless a safer current contract exists;
- no speculative Storage upload or new backend bucket.

## Account fields

- prove canonical name/email/student identity/profile data ownership;
- do not use email as authorization identity when UID exists;
- session refresh/account switch must not repopulate stale profile data.

## Birthday / DOB

Wave 3 Birthday discovery must remain intact.

Investigate whether there is now a proven safe authenticated DOB view/edit server contract. If and only if a current approved contract exists, expose safe edit with validation and owner fencing. If it does not exist, leave DOB editing unavailable and document `BLOCKED-CONTRACT`; do not invent a table write.

## Account recovery/logout/delete

Run regressions for recovery entry, logout, account deletion boundary and personal-local state ownership. Do not perform any live deletion.

---

# Phase G — Library dynamic content and reader integrity

Known concern: Admin-uploaded Library books/documents may not appear dynamically in the user app.

Audit current dynamic Library pipeline end-to-end at source/fixture level:

Admin/current writer contract -> catalog/publication metadata -> user catalog -> language/collection filters -> authorization -> reader/file access.

Requirements:

1. Do not replace current Library security with direct Storage/table reads.
2. Published authorized items must appear without requiring a new App Store release when the current dynamic contract says they should.
3. Unpublished/private/unauthorized items must not appear.
4. FA/EN/HR metadata and language selection must behave correctly.
5. New item visibility must respect current freshness/version cache and Wave 1 request reductions.
6. Do not bring back stale public-cache leakage.
7. Reader authorization must be rechecked when required by current v321/v230 contracts.
8. Account/grant switching must clear/fence inaccessible catalog/body data.
9. Offline only serves content that current policy explicitly permits and previously verified for that owner/public state.
10. Missing backend hardening/deployment remains review-only; do not deploy/apply it.

Use synthetic authorized/unpublished/revoked/other-owner fixtures and verify dynamic arrival/removal behavior.

---

# Phase H — Deep links and navigation/back-stack completion

Audit every supported current deep-link/notification route and ordinary internal navigation route.

Required user destinations include where applicable:

- exact Bible verse;
- Sermon/audio item;
- Daily Word/Faith/Juice day;
- Inbox item;
- School route/lesson where authorized;
- Plans and exact existing plan/day without creating progress merely by opening;
- Library item through authorization;
- Profile/Account/Settings;
- Community destinations;
- My Documents / public verification where current contract permits.

Requirements:

- no arbitrary URL/script injection;
- cold start, foreground, background-resume and offline-pending intent behavior must preserve Wave 4 typed-intent safety;
- exact params preserved;
- wrong account/revoked access fails closed;
- Back returns to the logical prior surface, not a frozen/blank page;
- repeated same intent does not stack duplicate routes;
- Calendar -> verse navigation must not freeze;
- switching away during delayed route/reader load must not let stale callbacks replace the new surface;
- current audio playback should not be destroyed by unrelated navigation unless existing UX explicitly requires it.

Add router/history stress fixtures.

---

# Phase I — School Reports / Print / Save / PDF completion

Known concern: School report export buttons may exist while Print/Save behavior is incomplete.

Audit the current student/user report and admin-report handoff only where it affects user-facing School report/export surfaces.

Requirements:

- Generate/Preview uses current read-only report data;
- Print must invoke a real printable same-origin surface from an explicit user action;
- Save/PDF must produce a real valid PDF or use the existing proven native/file fallback contract;
- CSV/export retains all filtered data required by current feature;
- Safari/iOS fallback must be actionable in UI, but physical sheet success remains Wave 7/8 acceptance;
- no progression, score, assignment, certificate or identity mutation;
- stale account/report response fenced;
- FA/EN/HR layout/readability tested;
- empty/error/loading states explicit;
- preserve Wave 5 Document Studio isolation: School reports are not silently rerouted through Document Studio unless current canonical contract explicitly requires it.

Run existing report/PDF/print guards plus new browser fixtures for all active buttons.

---

# Phase J — Calendar / celebrations / modal/focus robustness

Preserve Wave 3 Birthday behavior and fix any remaining user-app modal collisions.

Requirements:

- Calendar -> verse never freezes;
- Birthday never interrupts registration success, Amen gate, active critical modal, focused form editing or account switch;
- once-per-account/local-day remains correct;
- Christian calendar event modal can be closed and keyboard focus restored;
- reduced motion respected;
- Back/route handoff does not duplicate dialogs;
- FA/EN/HR content remains intact.

Do not modify theological/calendar content except to fix clear implementation/localization wiring defects. Content/editorial changes are out of scope.

---

# Phase K — Audio/Sermon user UX regression sweep

Do not redesign the player in Wave 6. Validate/fix only current-user regressions:

- mini-player persistent where intended;
- expand/collapse;
- play/pause/next/previous;
- speed including existing supported values;
- download/offline bridge boundaries;
- favorites/like/blessing actions;
- quick Bible route;
- Notes integration;
- resume position;
- background/route transition state;
- localized FA/EN/HR controls;
- no duplicate listeners/players;
- account isolation for personal actions;
- search direct-play integration.

Physical lock-screen/background media session acceptance remains Wave 7/8.

---

# Phase L — User responsive / web-mobile parity source convergence

Use `codex/web-mobile-parity-safe-v573` and the relevant user-facing parts of `feature/final-qa-v2500-20261004` as **reference only**.

On current `develop`, source/fixture validate:

- 320/360/390/430 phone widths;
- 768/820/1024 tablet widths;
- 1280/1440 desktop;
- portrait/landscape where meaningful;
- iOS safe-area CSS variables/source behavior;
- Android/Fold narrow and wide panes at source/browser level;
- no horizontal overflow in primary user routes;
- tap targets remain usable;
- modal sheets/dialogs fit viewport;
- RTL/LTR direction remains correct;
- split-pane/tablet behavior does not duplicate content or state.

Do not claim physical iPhone/iPad/Fold/Mac acceptance; that belongs to Wave 7/8.

Do not wholesale import historical CSS. Every historical style must be proven necessary against current source.

---

# Phase M — Performance / battery-risk safeguards

Wave 6 must not undo Wave 1–4 improvements.

Measure at least:

- signed-in startup request counts;
- 60s visible idle;
- 60s simulated hidden/background;
- global search typing/results;
- Notes open/edit/delete;
- theme switch;
- Profile open/photo restore;
- Library catalog open/reopen/freshness;
- School report open/export fixture;
- Calendar -> Bible handoff;
- audio mini-player during navigation.

Report:

- network requests;
- repeated callbacks/timers;
- DOM query counts where harness supports them;
- observer/listener registrations;
- cloud writes;
- local writes;
- any request increase with exact cause.

No recurring polling may be added. No hidden/background high-frequency callback loop may be added.

Do not claim physical battery/thermal improvements from browser fixtures.

---

# Phase N — Security / data safety invariants

Must remain true:

- School approval/progression/scoring/submission remains server-authoritative.
- Admin remains server-authorized.
- Library protected access remains caller-authorized.
- Notifications retain Wave 4 owner/device/deep-link fences.
- Document Studio review-only backend remains disabled unless separately approved.
- Notes/progress/saved verses/favorites/audio position remain owner-scoped and durable.
- No existing user data is deleted, migrated, backfilled or reset.
- No cache blanket-clearing.
- No Auth/RLS/Storage/Edge weakening.
- No hardcoded Admin email authority.
- No unauthorized full-table search.
- No unsafe `innerHTML` from user text; escape/sanitize according to current architecture.
- Delayed responses from account A must never populate account B.

Create negative fixtures for anonymous/wrong-owner/stale-response cases across Profile, Notes, Search, Library and deep links.

---

# Phase O — Backend and migration boundary

Wave 6 is primarily client/source convergence.

If a missing capability genuinely requires backend work:

- first prove there is no current safe contract;
- create only review-only source under a clearly named `supabase/review/wave6-*` path if truly necessary;
- include preflight, authorization assumptions, activation order and non-destructive rollback;
- do not add/apply a migration;
- do not deploy Edge Functions;
- do not mutate Production;
- do not fabricate client-side authority to avoid the missing backend.

Migration parity must remain exact to the accepted checkpoint. The existing pre-existing pending migration must remain unchanged unless separately and explicitly approved by the owner outside Wave 6.

---

# Phase P — Regression requirements

Run all current Validate Develop gates and all accepted Wave 1–5 regression suites.

Wave 6 must add targeted browser/source tests for:

- theme readability/propagation;
- localization FA/EN/HR and writing direction;
- Notes producer/legacy artifact normalization;
- Global Search exact destination and account fencing;
- Profile photo persistence/account switching;
- DOB contract disposition;
- dynamic Library publication/catalog visibility and authorization;
- deep links/router/history/Calendar->Bible;
- School report Print/PDF/Save/CSV active controls;
- Birthday/calendar modal/focus;
- Audio player localization/state during navigation;
- responsive widths and no-overflow;
- stale async/wrong-account negatives;
- performance/idle no-polling safeguards.

Also run:

- changed JS/MJS/CJS syntax;
- HTML/JSON validity where relevant;
- `git diff --check`;
- exact migration checkpoint parity;
- exact build/source provenance safeguards currently active.

Do not remove, skip or weaken an existing test to make Wave 6 green. If an old fixture is stale, document the exact mismatch and update only the fixture to the current canonical behavior while preserving the same or stronger safety assertion.

---

# Phase Q — Deliverables

Create:

- `docs/qa/WAVE6_USER_APP_COMPLETION_AUDIT.md`
- `docs/qa/WAVE6_USER_APP_COMPLETION_REPORT.md`
- `docs/qa/WAVE6_USER_APP_MEASUREMENTS.json`
- `docs/qa/WAVE6_HISTORICAL_UI_CONVERGENCE.md`

The final report must contain a matrix for every Wave 6 scope area:

- status before;
- status after;
- source changed;
- tests/evidence;
- remaining physical/live/backend limitation;
- Wave 7/8 handoff if still pending.

It must separately state whether each originally-known concern is now:

- FIXED;
- PROVEN ALREADY FIXED;
- BLOCKED BY CONTRACT;
- PHYSICAL-QA ONLY;
- DEFERRED WITH EXPLICIT REASON.

At minimum list dispositions for:

- Dark/Night invisible verses;
- themes not propagating to daily content;
- EN/HR player localization;
- Global Search completeness/direct audio;
- Profile photo header/persistence;
- Calendar->verse freeze;
- Notes code/numeric artifacts;
- Bible deep links;
- School Reports Print/Save/PDF;
- dynamic Library uploads visibility;
- FA/EN/HR general UI sweep.

---

# Phase R — Exact CI / stop gate

Push all approved Wave 6 work only to existing `develop`.

Final acceptance requires:

1. clean worktree;
2. exact final `develop` SHA recorded;
3. `main` unchanged;
4. successful `Validate Develop` on that exact final SHA;
5. no new branch or PR;
6. no merge to `main`;
7. no Web/PWA deployment;
8. no Supabase migration/RLS/Storage/Auth/Edge deployment;
9. no App Store/Google Play release;
10. no user-data deletion/migration/backfill/reset;
11. no Wave 7 work started.

---

## Final delivery receipt required from Codex

Return exactly:

- starting `develop` SHA;
- pre-implementation audit commit SHA;
- every implementation/follow-up commit SHA;
- final `develop` SHA;
- current unchanged `main` SHA;
- complete changed-file count and diff stats;
- paths to Wave 6 audit/report/measurements/historical convergence;
- exact successful CI URL whose `head_sha` equals final `develop`;
- migration parity and pending-migration status;
- status matrix for all Wave 6 features;
- exact disposition of every known bug listed above;
- performance/idle measurements;
- any review-only backend files;
- all remaining live/physical/native limitations;
- explicit confirmation: no Wave 7 started.

**Stop after Wave 6.**