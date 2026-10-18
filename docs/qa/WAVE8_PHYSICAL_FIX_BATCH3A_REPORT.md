# Wave 8 Physical Fix Batch 3A

Starting develop: `ae2c9d4c460a7dc999c9713449366ac427ac5cea`. Audit: `38abab59f69a227cb9e0ca4305e559a90c2d6884` (full audit SHA is in git/delivery). Main remains `15af811f78a17a0881c13171311e7ade6bc390f4`. Exact final commit/CI URL and changed-file statistics are supplied after exact-head CI, not invented before it runs. Existing develop only; no new branch or PR. Stop after Batch3A.

## Architecture and result

| Area | Implemented source behavior | Boundary |
|---|---|---|
| My Access | Account groups the existing v564 profile/Student ID, existing legacy certificate list and ONE existing V2 My Documents entry under My Access. Logout/Delete stay in the separate account-management area. Legacy dates/numbers/status/open/PDF preserved, V2 recipient name displayed when present. | No duplicate archive or new issuance path. V2 backend remains default-off. Legacy server authorization and V2 credential/UID tickets remain authoritative. |
| Notes | Existing source-aware My Notes aggregation gains Edit/Save/Cancel. Bible state merges the note into current saved/highlight state; plain personal/audio/gratitude use the same existing saveNoteCloud bridge/keys; Apocrypha retains its existing local path. No note-ID migration, duplicate creation, account merge or persistence engine change. | Existing local-first queue/conflict/restore mechanisms remain byte-identical. Offline save is local-first, not a claim of cloud receipt. Recoverable malformed legacy notes remain read-only with their original body preserved. |
| Plan reflections | Virtual entries keep their translated title, canonical source navigation and no Delete. Explicit Edit changes only the already-existing day's note/updatedAt through the existing progress-row queue. | No start, new day, completion recalculation, lastOpenedDay movement or implicit progress from opening/editing. Existing source editor remains available. |
| Drafts | Explicit per-actor/per-note draft storage restores unsaved text after reload. Cancel discards the edit draft without writing the note; failed save keeps text/draft. Current-credential/editor/route fences close old private UI and prevent late metadata writes into another account. | No enumeration/adoption of another account's drafts; storage/quota failure tells the user to copy the text. No recurring draft sync. |
| Q&A | Current own/public fetches and delayed cache updates are route/account fenced. Own/public caches now have UID/device-specific scopes. Only server-confirmed owner removal hides a question locally; absent/denied backend leaves it intact and gives an actionable error. Public refresh removes obsolete public answers even while the composer is active, preserving typed question text. | Unidentified old global cache bytes are preserved but not attributed to a new UID. No claim that an old device/email cache proves ownership. |
| Q&A lifecycle | Review-only UID-authorized privacy tombstone: blank base/FA/EN/HR question text and translated answers, null base answer, set hidden in one transaction, keep only private question-ID/actor/timestamp audit. Replay is idempotent; no email/device ownership fallback. | **BLOCKED_ACTIVATION**: exact live UID binding, six v341 column types, all public/own reader contracts/RLS, old Store compatibility, additional translations/answer stores/triggers and cached projections must be reconciled. No candidate was run against Production. |
| Inbox | Professional unread/current cards, explicit read archive and focused detail with original timestamp/body. A reproduced old snapshot fallback fabricated receive-now time when the server omitted every original timestamp; it now retains null and displays localized time-unavailable instead. Reading marks all aliases in that canonical group, uses existing read receipts, removes it from unread and retains history. Mark-all only writes previously unread receipts. Detail/destination use existing router/history and Wave4 permission-safe intents. Invalid/unavailable messages show a recoverable state. | No history hard-delete or language-cleanup data discard. Read receipt synchronization retains the existing best-effort cloud contract; local read state survives snapshot/reload/offline. No new notification backend/provider. |
| Inbox accounts | Current UID selects its own cached Inbox view; account switches preserve the former view in its own slot and restore only the next UID's view. Unknown legacy global Inbox is quarantined intact, not silently claimed. Late snapshots remain generation/token fenced; logged-out count is zero. Owner events only switch/paint the local view; they do not add a background backend read. Opening Inbox uses its existing bounded refresh. | A reproduced quota failure previously exposed A’s still-current global cache after switching to B. The corrected source requires the exact UID marker before any app/badge read and blocks refresh/fallback on failed namespace backup, preserving A’s original bytes and showing an actionable storage message. Local browser storage is not protection against device forensic inspection. Server snapshot/RLS is still authoritative for network data. |
| App badge | Canonical unread count updates existing Web badge and optional already-installed Capacitor Badge/Cordova badge bridge; zero/logout/switch clears. Serialized native calls prevent an older completion from winning. Existing valid Wave4 push destinations retain priority; optional message-ID-only push tap opens the current account's Inbox record. | No plugin install, provider initialization, permission request, Store build or native PASS. Unsupported bridge reports NATIVE_BRIDGE_UNAVAILABLE; actual iOS/Android badge/dot behavior is PHYSICAL/NATIVE QA REQUIRED. |

## Backend / safety / cost

No ordinary migration was added. Review-only Q&A files are `supabase/review/batch3a-qa-owner-removal/{README.md,preflight-readonly.sql,candidate.sql,rollback.sql}`. Rollback disables the proposed RPC and preserves hidden records/minimal audit; never resurrect removed public text. Existing issued documents and certificate verification URLs are unchanged. No real question/document/user was mutated.

All 42 checkpoint migrations, pending v511 and School v580, School v580 source/review package, Admin authority, current Auth/RLS/security transport, Wave4 intents/Push binding, v564 profile persistence, Notes local-first/account merge engines, Audio playback/download engines, Plans existing progression functions and all other data remain byte-exact. Migration checkpoint is **42/42 exact, 0 missing, 2 pending/unapplied** (v511 + v580). No live Supabase call/inspection occurred.

No polling/cron/realtime/analytics/provider added. The pre-existing Inbox visibleLoop hook was removed; sync remains existing bounded startup/manual/open/focus/online activity. Additional audio analytics reads/writes/rows/storage remain **0**, REJECTED_COST unchanged. A new precached Batch3A JS asset is the only worker delta; no cache clear/reset or blanket release rewrite.

## Tests / reproducibility

- `verify-batch3a-browser.cjs`: actual current UI across FA/EN/HR, phone/tablet, same-key edit/save/cancel/failure/no duplicate, Delete cancellation, My Access/Student ID/one archive, exact Inbox timestamp/read/archive/deep destination/browser Back, Q&A cancel/failed backend/success/refresh, account-switch/private-draft closure, optional native badge zero and overflow/analytics negatives.
- `verify-batch3a-notes-archive.cjs`: actual Bible/audio/Apocrypha/Plan edits, saved/highlight preservation, exact Plan payload equality except note/timestamp, offline local save, draft across reload/cancel, confirmed deletion, V2 wrong-UID filtering/logout/account fencing. Capability enabled ONLY inside the synthetic fixture, never in source configuration.
- `verify-batch3a-postgres.cjs`: actual candidate in synthetic PGlite PostgreSQL; owner/non-owner/anonymous, replay, scrub all base and translated bodies, hidden public row, one private audit, denied audit SELECT. Does not prove live column/body compatibility or concurrent separate-connection correctness.
- `verify-batch3a-safety.py`: independently checks CURRENT exact allowed function/file changes, unchanged earlier authority/data/School/persistence, exact hashes/reversible patch, no ordinary migration, no new recurring cost and all original CI steps retained.
- Historical guards consume only independently hash-verified exact prior bytes for the nine explicitly named changed files and five named new runtime/review paths. No wildcard exemption or removed security assertion. School's original manifest/patch/migration source stays unchanged. Immutable baseline reads are cached to avoid repeated git processes; current file hashes are always checked.
- The old Wave4 Inbox test now locates the retained message-detail timestamp after read/Back instead of requiring a read item in the primary unread list. Original timestamp value, destination, ownership and history assertions stay intact. Existing Profile/Search/Inbox and full Wave4 browser suites passed locally on the new behavior.
- The new early CI gate starts/readiness-checks its own localhost8983 server and traps cleanup; it does not depend on the later canonical browser gate starting localhost8878. Full Validate Develop on the final head is mandatory: all Wave1–8/Batch1/Batch2/School regressions, document PDF/Print/CSV, Community, Notes account persistence/offline/security, syntax, checkpoint, build provenance and real-duration measurement windows remain enabled. Final successful run/head is recorded in delivery; local fixtures are not physical acceptance.

## Remaining gates / honest limitations

1. **BLOCKED_ACTIVATION:** Q&A exact live owner binding/readers/translated/linked answer storage/cached projections. Until separately approved source activation, Delete fails closed; real Production removal is NOT claimed. An already-downloaded public answer on an offline third-party device cannot be remotely erased instantly. Old clients and online refresh behavior require staging/provider evidence before activation.
2. **BLOCKED_ACTIVATION:** existing Document V2 issuance and School v580 activation prerequisites remain exactly as previously documented. Neither is enabled here. No v511 application.
3. **PHYSICAL/NATIVE QA REQUIRED:** iPhone/iPad/Android badge/dot, actual installed native plugin capability, push payload/provider tap, native keyboard/focus/back, safe areas/tablet orientation, accessibility/screen reader, offline/OS-kill/Store upgrade. No native toolchain/device test or physical PASS claimed.
4. Unidentified legacy global Q&A/Inbox cache cannot safely be assigned to the current UID. Original bytes remain quarantined; only current authorized server data or explicit proven ownership can restore visibility. No destructive cleanup/backfill.

No deploy, main modification, new branch/PR, Production call/mutation, provider/security/School/Document activation, real-user deletion/reset/backfill or analytics activation. Batch3B/4/release work not started.

## Changed-file inventory

- `.github/workflows/validate-develop.yml`
- `docs/qa/WAVE8_PHYSICAL_FIX_BATCH3A_AUDIT.md`
- `docs/qa/WAVE8_PHYSICAL_FIX_BATCH3A_REPORT.md`
- `index.html`
- `js/app.js`
- `js/document-studio-v2/archive-entry.mjs`
- `js/document-studio-v2/archive.mjs`
- `js/nh7-batch3a-v581.js`
- `js/nh7-inbox-badge-sync-v418.js`
- `js/nh7-my-notes-v234.js`
- `js/nh7-spiritual-plans-v240.js`
- `js/nh7-spiritual-plans-v412.js`
- `scripts/batch3a_accepted_source.py`
- `scripts/fixtures/batch3a-approved.patch`
- `scripts/fixtures/batch3a-source-contract.json`
- `scripts/school_accepted_source_v580.py`
- `scripts/verify-batch2-safety.py`
- `scripts/verify-batch3a-browser.cjs`
- `scripts/verify-batch3a-notes-archive.cjs`
- `scripts/verify-batch3a-postgres.cjs`
- `scripts/verify-batch3a-safety.py`
- `scripts/verify-school-safety-v580.py`
- `scripts/verify-wave4-notifications-browser.cjs`
- `supabase/review/batch3a-qa-owner-removal/README.md`
- `supabase/review/batch3a-qa-owner-removal/candidate.sql`
- `supabase/review/batch3a-qa-owner-removal/preflight-readonly.sql`
- `supabase/review/batch3a-qa-owner-removal/rollback.sql`
- `sw-release-core-v403.js`
