# Wave 2 — local-first and durable sync delivery

Canonical branch: **develop only**. Task base: `dedb26a1c9f4ae1b4c7ee4b62a3dcecc88cdeca5`. Performance baseline: Wave 1 final `d291592fff8b597e5ab5c8cce4bd1c137d2eab53` (runtime identical to task base). Audit first committed at `5d5db1cbe928a550823d62b697255b18e5edfe86`. Validated runtime candidate: `5f8dce16aa38d60ea1c560108e02ded6c30dfbe0`. Main remained `15af811f78a17a0881c13171311e7ade6bc390f4`.

The final report commit is identified by the exact final develop SHA and exact-head CI link in the delivery message; the runtime candidate above is immutable. Reporting commits do not change its runtime bytes. No branch or PR was created.

## Implemented behavior

- Personal Save actions persist locally and enqueue both existing Notes backups before any network wait. Sermon inline drafts retain existing per-input durable behavior. Generic/Bible explicit Save semantics are retained; this is not a new blanket autosave UX.
- A small shared browser coordinator stamps UID/device identity, uses independent atomic outbox records, ordered processing and 750ms stable-key debounce. Only equivalent replacement snapshots/refs coalesce. Inserts stay on the existing generic path with owner metadata; they are not treated as coalescible replacements.
- Matching revisions leave the outbox only after confirmed success. New edits appended during an old success survive. Retry delays persist: 2s exponential backoff capped at 5min, one transport failure stops a drain, 10s abortable transport, single-flight per document, Web Locks across tabs where available and a renewable checked lease fallback otherwise. Foreground/online/pageshow/focus resume retry; background nonessential timers stop. Pagehide/background attempt important writes but durable storage, not unload delivery, guarantees later retry.
- An additive owner-scoped Storage view preserves existing personal value formats and logical keys. Original historical raw values remain; no bulk copy/delete/backfill/reset occurs. Notes, Bible marks/bookmarks, saved text, audio favorites/positions, reading positions and metadata get the current owner view. Settings, Profile photos, School snapshots, media databases/files, push data and other stores retain their existing paths. Open audio note editors flush drafts under the old identity and close on switching; old player sessions do not persist into the new owner's progress.
- Explicit deletion/empty text and per-reference un-save intents survive restart and block restore resurrection. Unrelated cloud saved refs can still merge. My Notes deletion uses durable operations for both Notes paths, and clearing a Bible note retains saved/highlight state and the existing Edge payload.
- Notes/personal snapshots compare observed remote versions and use conditional PATCH/DELETE; create-if-absent uses ignore-duplicates. Existing updated_at versions advance even for rapid same-clock edits. Differing/unknown versions retain both sides in an explicit owner-scoped conflict record and pause the affected operation. Conflict copies are readable/copyable in My Notes in FA/EN/HR and wrap on phone/tablet/desktop; there is no automatic destructive winner or cloud conflict resolver.
- A collision in the UID-less legacy device backup with no proven owner is retained/blocked, without fetching/displaying another account's device note. Secure current account backup can still complete. Owned legacy operations transfer only after durable enqueue; unidentified main/Bible/plan bodies stay quarantined. v412 no longer truncates pending records at 300.
- Existing reader/Apocrypha account save paths now use the same durable coordinator. Multi-verse actions retain one Edge batch, not one write per verse; Edge success must confirm saved count and batch ID. A preflight read preserves conflicting verse marks; existing Edge School/JWT/UID behavior is unchanged.
- Audio positions remain locally durable on timeupdate, with <=60s cloud checkpoints plus pause/completion/background/pagehide, and identical checkpoints are skipped. No playback, Media Session, signed URL or downloaded-file engine behavior was replaced. Local-only reader positions and audio favorites remain local; no unproven server destination was invented.
- Reconnect account restores share in-flight reads per owner/token; completed responses are not cached and explicit force still reads afresh. Old account restore/session-refresh responses cannot overwrite a new session or its personal state. Client fencing does not change Supabase Auth, tokens, RLS or approval rules.
- Rebuildable PUBLIC catalog snapshots are capped at 2MiB estimated UTF-16 storage and 10,000 total rows. Oversized catalogs remain complete online; the previous snapshot/files stay intact, with no truncation or clearing. Existing public TTL, private freshness, authorization and verified reader rules remain. New executable helper/modules are precached in an executable-only cache epoch; stable data/download stores are unchanged. No deployment occurred.

## Performance evidence

Full raw evidence: `LOCAL_FIRST_WAVE2_MEASUREMENTS.json`. The same nine Wave 1 phases ran against exact d291 and the candidate, with the fixture's successful PostgREST/Edge acknowledgements modeled correctly. The clock is frozen before startup, and the initial catalog settles before timed phases, removing real-wall-clock response timing drift. No assertion was weakened in existing Wave 1 regressions.

| Metric | d291 baseline | Wave 2 | Result |
|---|---:|---:|---|
| Supabase requests including launch | 23 | 24 | +1 existing verse-mark safety read (+4.35%) |
| Library catalog requests | 2 | 2 | unchanged; Wave 1 public TTL retained |
| DOM queries in nine timed phases | 46,119 | 45,322 | -1.73% |
| Observer callbacks in timed phases | 13,349 | 12,951 | -2.98% |
| Background player callbacks | 0 | 0 | unchanged |
| Idle Home player callbacks / 45s | 9 | 9 | unchanged |
| Repeated-edit scenario cloud writes | 52 | 6 | -88.46%; final state verified |
| 30 repeated personal progress writes | 60 | 2 | -96.67%; final state verified |

The edit scenario is 20 explicit note saves, 30 actual-classic local position snapshots, six save/remove toggles, lifecycle transition and duplicate retry. Classic positions previously had **zero** cloud writes; Wave 2 adds two useful backup writes in this scenario. It does not claim the old classic player wrote positions 30 times. A separate existing personal-progress scenario checks 30 replacement snapshots.

**Strict total-request non-increase is not achieved:** the extra read checks current verse-mark state before the unchanged Edge write. Removing it would weaken conflict safety. Wave 1 in-flight sharing, Library TTL, background suppression and UI scheduling remain covered/passing; the realistic repeated-edit scenario saves 46 writes despite adding audio backup. These are fixture counters, not measured battery/CPU time, Production request volumes, SQL latency or billing. No media egress/storage savings are claimed.

## Validation results

- **19 actual-source deterministic contract groups PASS**: offline edit/restart/reconnect, both Notes backups, rapid coalescing, differing cross-device text, version advancement, offline deletion, progress/ref restoration, partial failure/backoff/restart, duplicate flush, account-switch pending queue/editor isolation, legacy-device privacy collision, new revision during old acknowledgement, stale restore/refresh fencing, bounded derived snapshot, distinct fasting composite keys, one multi-verse Edge batch, owned/unidentified legacy handling, generic Inbox queue preservation and duplicate module/listener guard.
- **Full-app browser PASS**: authenticated/offline startup; FA/EN/HR direction and note online/offline save/reopen/reload; reconnect; actual My Notes delete; actual Apocrypha save/remove and audio favorite reload; position/pause/resume/restart; owner switch while audio/editor is active; 390/820/1280 widths including expanded 4,000-character conflict copies without horizontal overflow. Remote endpoints intercepted; offline network failures simulated while local bundle remains available.
- **Existing Wave 1 VM + browser PASS**, with original assertions retained: public/restricted catalog ownership/freshness, v321 FA/EN/HR verified PUBLIC offline reader, collection preservation, Inbox read/deleted state, actual audio note/progress, background playback and Media Session actions. Fixture Edge acknowledgement shape now matches the real v4 response.
- **Current Profile/Search/Inbox, sermon direction and user-writing-direction browsers PASS**: current v563/v564 photo paths, five-minute/restart preservation, current v562 exact routes, timestamps/read state and FA/EN/HR. No historical module replacement.
- **Canonical develop gate PASS** using every actual release validation command without deployment: responsive v570, theme v571, offline v572, Next Native Optimization Guard, Community parity, Notes account merge, School identity/exam/scoring/assignment/stage guards, Documents/certificates, Audio safety, Inbox/notification cost, consolidation/sync history and actual exported-byte build provenance.
- All changed JS/CJS files syntax checked; `git diff --check` PASS. No checks were disabled to obtain a pass.
- Runtime **Validate Develop CI PASS** on exact `5f8dce16aa38d60ea1c560108e02ded6c30dfbe0`: [run 38439189657](https://github.com/Omideno7/new-hope7-app/actions/runs/38439189657), all validate job steps successful. Earlier b185, f204 and 1d exact-head runs also passed. Final report-head CI is checked separately before delivery.
- Migration checkpoint remains **42/42 exact, 0 missing**. **One pre-existing pending** file remains: `20261012123000_audio_bible_public_catalog_read_v511.sql`; it was not added/applied/removed by Wave 2. No Production metadata was mutated or live schema claimed verified.

Reproduction: run canonical develop gate and the workflow's existing browser checks, `node scripts/verify-local-first-wave2.cjs`, `node scripts/measure-local-first-wave2.cjs`, and the Wave 2 browser verifier against a local server with Chromium/Playwright. For the performance baseline use `git archive d291592...` into a temporary directory (no branch/worktree), serve it separately, then run the **current shared** `measure-performance-wave1.cjs` against both servers. No Production credentials or requests are needed.

## Data safety, authority and deferred work

No cloud table is dropped/merged/backfilled. Both Notes paths, conflict keys, note IDs, normalized content formats, existing deletion intent and progress formats remain. The outbox stores no JWT. Pending/conflicted operations, notes, user-created state, tombstones and offline files have **no automatic pruning**. Only successful matching acknowledgements/equivalent durable replacement retire outbox operations. Existing 400-record/30-day noncritical Wave 1 analytics bounds remain.

Server-authoritative: JWT identity/authentication; Admin/grants/School approval and entitlements; protected Library catalog/files/reader; actual School submissions, scores, exams, assignments/progression; Inbox delivery/receipts and Community data. Personal backup uses existing captured RLS/API contracts, not locally granted permissions. No OneSignal/native bridge/updater or account-merge logic was replaced.

Deferred/limits:

1. Unknown legacy device/Bible/plan owners and conflicting versions require explicit review; never replay with a guessed UID. Legacy raw local values are anchored once to the current persisted identity/device for compatibility; historical ownership cannot be retroactively proven from unlabelled bytes. Future UID-keyed Notes consolidation needs read-only mapping/conflict inventory and separate approval, as documented in the review README. Changing an account email remains bounded by the existing email-keyed backend contract; this wave does not migrate it.
2. Automatic cross-device conflict resolution is intentionally deferred. Conditional REST protects observed Notes/progress versions; the unchanged Bible Edge API has no transactional compare-and-swap, so a cross-device race after its preflight remains a backend-contract limitation. No new RPC/schema was guessed/deployed. Copy/review both conflict versions; there is no automatic destructive retry.
3. Multi-tab writes to the same personal key are conservatively quarantined with both versions, including different writer instances after a restart if edits overlap. Web Locks/lease and idempotent operations reduce duplicate drains; localStorage has no universal multi-key transaction. OS kill/disk quota/real native background scheduling need physical QA. Quota failures do not justify pruning notes/downloads; re-save after resolving storage capacity rather than clearing user data.
4. Original raw stores and new overlays/queues are preserved. Rollback must retain the coordinator/owner view until pending/conflicted edits are exported/reconciled; blindly returning to old unscoped readers would show stale raw values and weaken account isolation. No remote migration rollback is needed because none was deployed.
5. Oversized derived public catalogs are complete online but the last valid snapshot is used offline; very large catalog offline behavior needs acceptance QA. Files/readers are not removed.
6. Analytics batch ingestion remains review-only. The README records the exact minimum <=50 cumulative-record, UID-derived, idempotent server acceptance contract and missing live DDL/RLS/unique-key evidence. No runnable speculative SQL, raw-event analytics or nonexistent RPC retry is added. Cloud report freshness requires future approved backend work.
7. Native device acceptance, actual billing/energy/Production latency and older installed Store builds are not certified by Chromium/mock CI. These develop changes have not reached users through a Store/Web release.

## Changed files

- `.github/workflows/validate-develop.yml`
- `docs/qa/LOCAL_FIRST_WAVE2_AUDIT.md`
- `docs/qa/LOCAL_FIRST_WAVE2_MEASUREMENTS.json`
- `docs/qa/LOCAL_FIRST_WAVE2_REPORT.md`
- `index.html`
- `js/app.js`
- `js/nh7-apocrypha-actions-v393.js`
- `js/nh7-app-enhancements-v230.js`
- `js/nh7-audio-classic-v484.js`
- `js/nh7-book-reader-v283.js`
- `js/nh7-library-security-v125.js`
- `js/nh7-local-first-wave2.js`
- `js/nh7-media-player-v500.js`
- `js/nh7-my-notes-v234.js`
- `js/nh7-reader-ux-v251.js`
- `js/nh7-spiritual-plans-v240.js`
- `js/nh7-spiritual-plans-v412.js`
- `scripts/measure-local-first-wave2.cjs`
- `scripts/measure-performance-wave1.cjs`
- `scripts/verify-local-first-wave2-browser.cjs`
- `scripts/verify-local-first-wave2.cjs`
- `scripts/verify-performance-wave1-browser.cjs`
- `supabase/review/performance-wave1/README.md`
- `sw-release-core-v403.js`

## Implementation history

```text
9c4b269e1a205dc13cef216fb88bbe51e924de4f feat: add owner-isolated durable local-first personal sync
2f1bb451a0a90afe6b9a96fc637bdeb26680fa60 fix: coalesce reconnect restore reads and distinguish pending edits from conflicts
3fa3577108caee4d3348c9a6e9b390957bf7faa8 fix: align personal sync identity with signed-in session state
b1857f3604dd22fc00fc5f3332231a5dd952e82f test: settle initial catalog before advancing benchmark clock
67776cc4caef784464a41b315434c2cb092ff401 fix: retain existing generic queue behavior with per-owner metadata
f204f78ba0f97008dfbec6dd0229f13982d1e384 fix: advance conditional sync versions even during rapid edits
1d4469403821efeadc589dae5fa7e4ec61c326c0 fix: label unverified conflict copies without implying deletion
5f8dce16aa38d60ea1c560108e02ded6c30dfbe0 test: freeze performance clock and guard long conflict text on mobile
```

## Diff stat

```text
 .github/workflows/validate-develop.yml       |    3 +
 docs/qa/LOCAL_FIRST_WAVE2_AUDIT.md           |   36 +
 docs/qa/LOCAL_FIRST_WAVE2_MEASUREMENTS.json  | 1378 ++++++++++++++++++++++++++
 docs/qa/LOCAL_FIRST_WAVE2_REPORT.md          |  141 +++
 index.html                                   |    1 +
 js/app.js                                    |  113 ++-
 js/nh7-apocrypha-actions-v393.js             |    3 +
 js/nh7-app-enhancements-v230.js              |    9 +-
 js/nh7-audio-classic-v484.js                 |   16 +-
 js/nh7-book-reader-v283.js                   |    5 +-
 js/nh7-library-security-v125.js              |    8 +-
 js/nh7-local-first-wave2.js                  |  230 +++++
 js/nh7-media-player-v500.js                  |    5 +
 js/nh7-my-notes-v234.js                      |   17 +-
 js/nh7-reader-ux-v251.js                     |    8 +-
 js/nh7-spiritual-plans-v240.js               |   20 +-
 js/nh7-spiritual-plans-v412.js               |   13 +-
 scripts/measure-local-first-wave2.cjs        |   21 +
 scripts/measure-performance-wave1.cjs        |    9 +-
 scripts/verify-local-first-wave2-browser.cjs |  102 ++
 scripts/verify-local-first-wave2.cjs         |   94 ++
 scripts/verify-performance-wave1-browser.cjs |    2 +-
 supabase/review/performance-wave1/README.md  |   15 +
 sw-release-core-v403.js                      |    5 +-
 24 files changed, 2179 insertions(+), 75 deletions(-)
```

## Safety confirmation

No new branch or PR; existing develop only. Main was not pushed, changed or merged. No Production/Supabase/Edge/RLS/Storage/Auth deployment, no migration applied, no Web/PWA deployment, no App Store/Google Play release, no user-data deletion/backfill/cache reset. Intentional future user Delete actions remain functional and durable; tests mutate only isolated fixtures. Draft PRs #240/#241/#106 and protected historical branches remain untouched.
