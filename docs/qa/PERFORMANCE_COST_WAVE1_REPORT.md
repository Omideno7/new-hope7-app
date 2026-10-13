# Performance/cost Wave 1 — final report

## 1. Exact source and disposition

Work stayed on existing **develop** throughout. Base `6e312ff087220520fc89aac69c5d7e145b992cb8`; audit-before-runtime commit `0a10e4c9ad3ea868e56381f26b32e981237c4e24`; measured implementation candidate **`60465e2bb297102eae55ae14e80b11d2d829d67e`**. The subsequent inventory/report commit is documentation-only; its exact final develop SHA and exact-head CI are recorded in delivery, avoiding a self-referential Git hash inside its own commit.

Observed main: `15af811f78a17a0881c13171311e7ade6bc390f4`, never modified/merged by this task. No new branch or PR created. Wave 1 stops on develop; this is not a release or a claim that installed Store apps have changed.

## 2. Implemented behavior

- Library: existing public two-minute TTL now actually lasts two minutes instead of being reset at 35 seconds. UID-bound public-only snapshots carry a cache epoch; stale/old-version/explicit force/content-change refreshes reach the server. Mixed/restricted snapshots are offline-public fallback only, never fresh online authorization. Ministers opens force current catalog; restricted metadata expires after 35 seconds and never persists. Catalog refresh updates current public cards while retaining the open collection. Signed-file/v321 authorization stays intact.
- Auth/access: identical in-flight audited reads/refresh requests share one response with independent clones; JWT/body/header/options differ or abortable callers never share. No completed Auth-response cache. Existing status TTL remains five minutes with owner/token/race fencing and explicit 401/403 denial invalidation. Registration read results and the existing 60-second School approval display cache are session-bound; a current denial cannot inherit an old local admin-approved display flag. No authentication endpoint, RLS or School progression rule changes.
- Inbox: existing snapshot/receipt behavior, two-minute freshness and 15-minute cadence remain. Snapshot merges are owner/language-bound; old-owner responses are quarantined. Scheduled background polling stops, resumes stale-only, and badge updates are idempotent/scoped to the view. Push delivery/account-binding source unchanged.
- Audio/CPU: current player polling is adaptive and parked in background; identical snapshots do not repaint. Superseded mini-player loop stops while v500 exists, with its fallback retained. Hidden legacy controls avoid repaint; idempotent status/download text breaks the classic observer → patch → same-text mutation loop. Playback, signed URLs, offline files, local position, notes draft flush and Media Session controls remain. No high-frequency cloud audio telemetry re-enabled.
- Persistence: same-window cloud queue drains once, in order; each successful operation is acknowledged against the latest queue. New appends, failed/offline/other-owner/legacy operations survive. Existing note/progress payloads/keys, both note cloud backups, account restore/merge and deletion paths remain; no value coalescing or destructive consolidation.
- Analytics: useful local daily/language section/content summaries and audio session duration/completion, UID/device-scoped, 400-record/30-day bounded retention, minute/lifecycle checkpoints. Only these new noncritical summaries rotate. No free-form notes/titles/raw event stream or analytics network requests. Cloud report freshness is **not restored**: legacy server RPCs were already deliberate no-ops, and captured table/RLS/idempotency metadata is incomplete. The review-only batch architecture is feasible and explicitly recommended; deployment/activation is approval-gated, not silently faked by calling the no-op endpoints.
- Offline asset graph: new helper is ordered before consumers and included in executable precache. Cache namespace becomes `nh7-release-core-v571-performance-wave1`; changed modules use the release-core fetch path. Only executable caches rotate. Stable data/reader/download caches, Store versions, wrappers and top-level worker release markers are unchanged. No deployment occurred.

## 3. Modified files

- `.github/workflows/validate-develop.yml`
- `docs/qa/PERFORMANCE_COST_WAVE1_AUDIT.md`
- `docs/qa/PERFORMANCE_COST_WAVE1_INVENTORY.json`
- `docs/qa/PERFORMANCE_COST_WAVE1_MEASUREMENTS.json`
- `docs/qa/PERFORMANCE_COST_WAVE1_REPORT.md`
- `index.html`
- `js/app.js`
- `js/nh7-access-bootstrap-v230.js`
- `js/nh7-audio-classic-v484.js`
- `js/nh7-audio-miniplayer-v487.js`
- `js/nh7-inbox-badge-sync-v418.js`
- `js/nh7-library-collections-v322.js`
- `js/nh7-library-security-v125.js`
- `js/nh7-media-player-v500.js`
- `js/nh7-performance-wave1.js`
- `scripts/measure-performance-wave1-bursts.cjs`
- `scripts/measure-performance-wave1.cjs`
- `scripts/verify-performance-wave1-browser.cjs`
- `scripts/verify-performance-wave1.cjs`
- `supabase/review/performance-wave1/README.md`
- `sw-release-core-v403.js`

## 4. Diff stat

From task base to final report contents: **21 files changed, 4,359 insertions(+), 73 deletions(-)**. Most added lines are the exhaustive audit (2,254 locations), raw measurement evidence and regression fixtures, not application refactoring. The earlier audit commit's verbose JSON was compacted without removing evidence.

## 5. Measurements

Local Chromium/Playwright 1.62.1 at 390×844, all remote endpoints intercepted, valid fixture JWT/approved account, real account form/restore and Bible save paths, identical virtual elapsed-time scenario. Playback state is passive only in the count benchmark; a separate regression exercises actual engine code/media events with mocked media. Baseline serves the exact Git archive of the base SHA; after serves candidate code. These are request/DOM-work counts, **not measured CPU time, watts, thermal readings, native delivery, Production SQL latency or billing**. Listener registration counters include element listeners; they are not a live listener-count or leak proof.

| Step | Supabase requests before → after | DOM queries before → after | Observer callbacks before → after |
|---|---|---|---|
| sign_in | 9 → 9 | 1,288 → 1,213 | 565 → 495 |
| home_idle | 0 → 0 | 1,441 → 179 | 720 → 0 |
| library | 1 → 0 | 433 → 411 | 255 → 238 |
| library_idle_and_reopen | 2 → 1 | 3,575 → 548 | 1,716 → 50 |
| sermon | 4 → 4 | 58,041 → 28,548 | 22,741 → 10,723 |
| bible_save_note | 3 → 3 | 16,780 → 15,392 | 2,183 → 1,753 |
| inbox | 1 → 1 | 1,693 → 261 | 666 → 180 |
| background | 0 → 0 | 87,024 → 226 | 29,118 → 0 |
| foreground | 0 → 0 | 1,530 → 310 | 486 → 78 |

All requests, including launch: **26 → 23 (11.5% fewer)**. Library catalog **4 → 2 (50% fewer)**. Timed phases' DOM queries **171,805 → 47,088 (72.6% fewer)**; observer callbacks **58,450 → 13,517 (76.9% fewer)**. Home player callbacks **180 → 9**; one-minute hidden phase **241 → 0**, with hidden-phase DOM queries **87,024 → 226** and observer callbacks **29,118 → 0** in this fixture. Other necessary/background timers are retained; this is not a blanket zero-background-work claim.

Separate exact-source burst benchmark: 20 simultaneous identical `/auth/v1/user` reads **20 → 1 (95%)**; 20 forced access checks **20 → 1 (95%)**; two concurrent note operations **3 → 2 writes (33.3%)**, queue empty afterward. The end-to-end scenario did not repeatedly call `/auth/v1/user`; do not present the burst figure as observed normal-usage or Production traffic.

Evidence: `PERFORMANCE_COST_WAVE1_MEASUREMENTS.json`. Reproduce count scenarios with `node scripts/measure-performance-wave1.cjs http://127.0.0.1:<port> <output.json>` against an exact exported base/candidate directory; `measure-performance-wave1-bursts.cjs` compares source directly. Instrumentation lives only in scripts, never shipped debug telemetry.

## 6. Tests and CI

- Full canonical develop workflow plus actual current release validation blocks: PASS locally. Includes migration parity, responsive v570, theme v571, offline v572, School identity/read/score/submit/assignment/certificate/public-verifier/course/stage guards, Community, Exam, Calendar, Notes account merge, Plans/appearance, Audio safety, Documents, current app/Admin wiring, Native Optimization Guard, notification/cost/Fold, ancestry/data safety and build-provenance tamper/old-source rejection.
- New VM runtime contracts: PASS — exact-request sharing, independent bodies, no completed Auth cache, abort/JWT/write separation, Library TTL/restart/version/offline/restricted-expiry/denial/UID races, old-owner Inbox quarantine/language freshness, registration response/cache fencing and explicit denial, ordered queue appends/failure/offline/other-owner/legacy retention, local analytics/account isolation. Expected offline-fixture warnings are simulated failure tests.
- Browser regressions: PASS — existing Profile/Search/Inbox, Sermons direction (360/390/820px), all writing surfaces FA/EN/HR, real Library card refresh preserving collection, verified v321 text-reader offline replay in all three languages, Inbox read/deleted state, actual engine note/progress save/reopen, pause/resume/background and Media Session play/pause/seek actions. All remote endpoints mocked.
- Changed/new JS syntax and `git diff --check`: PASS. Tests were added to existing develop CI; no existing assertions were weakened/deleted.
- Implementation candidate [Validate Develop 38426130794](https://github.com/Omideno7/new-hope7-app/actions/runs/38426130794): **PASS on the exact implementation candidate**. Final report head must also pass exact-head CI; delivery records its link/result.
- Migration checkpoint **42/42 exact**, with the **same pre-existing one pending v511 migration**. Zero new executable migrations and none applied. Do not falsely report zero pending or remove the unrelated file to make that number green.

## 7. Battery/network and Supabase-cost estimate

Lower DOM churn, eliminated hidden duplicate loops and foreground/stale-only maintenance should reduce CPU wakeups and battery work, particularly during long/background usage. The decode engine, actual audio streaming and native permission/transport costs remain, so a battery percentage/heat fix needs real iPhone/iPad/Android sampling at the exact SHA.

For one comparable scenario/day per 3,000–5,000 users, three fewer requests corresponds to **9,000–15,000 fewer client requests/day**; two fewer full catalog responses corresponds to **6,000–10,000 fewer catalog responses/day**. This is a conditional scaling estimate, not observed volume. Catalog metadata egress is roughly halved for this scenario if payload sizes match; signed audio/media bytes and the reported ~6.8 GB stored media are unchanged. Database/query-plan/compute savings and currency depend on real traffic/EXPLAIN/payload/pricing; no exact billing reduction is claimed.

## 8. Remaining risks / deferred work / rollback

- Physical battery/thermal, native background/lock-screen and installed Store acceptance require real devices; browser media fixtures cannot certify them.
- Production analytics ingestion/Admin report freshness remains blocked by the intentionally retired server contracts and missing exact schema/RLS/unique-key metadata. Preserve local summaries; obtain read-only metadata, design UID-derived idempotent batches, reconcile reports, stage/load-test, then seek explicit backend approval. Do not deploy the old raw-event APIs. See `supabase/review/performance-wave1/README.md` for benefit/security/rollback and note consolidation plan.
- Public catalog staleness is bounded by existing 120s TTL while visible, with explicit force/content-change support; background delays can defer noncritical presentation until resume. Restricted content still requires current server authorization and online access.
- School/push/security watermark and other sensitive pollers are deliberately retained. Online reconnect continues authoritative account restore/School refresh; future coalescing across reconnect bursts needs its own portability tests. Single-flight queue is per document; cross-tab coordination remains a separate legacy risk rather than a promised cross-tab transaction.
- No destructive note consolidation or guessed SQL/index/RLS changes. Existing review candidate and recorded School optimization history require current metadata/EXPLAIN before any further SQL approval.
- Rollback is normal source revert on develop followed by review/QA; never reset main or erase user caches. Keep original note/progress keys/cloud rows/offline files, failed queues and new local summaries. Disable future analytics batch capability before backend rollback; retain report tables. Cache rollback rotates executable namespace only, never user-data caches.

## 9. Explicit safety confirmation

**No new branch; no main modification/merge; no Production/Supabase/Web/PWA deployment; no migration application; no App Store/Google Play release.** No Admin redesign, Document Studio/platform work, schema/RLS/backend-Auth-configuration/Storage-policy edits, notes/progress/assignments/user-data clearing or unrelated feature port. Backend function/migration and push/Profile/Notes-merge/Store metadata sources are byte-unchanged from the task base. Server-side authorization stays authoritative. All automated remote reads/writes are fixture-only.
