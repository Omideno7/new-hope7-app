# Codex Wave 2 — Local-first + Durable Cloud Sync

Repository: `Omideno7/new-hope7-app`

Canonical branch: **develop only**.

Baseline before this task: Wave 1 final head `d291592fff8b597e5ab5c8cce4bd1c137d2eab53` plus this task-file commit.

## Safety / Git rules

- Work only on existing `develop`.
- Do not create any branch or PR.
- Do not modify/merge `main`.
- Do not deploy Web/PWA, Supabase, Edge Functions, App Store or Google Play.
- Do not apply migrations or destructive SQL.
- Do not clear/reset user caches, Notes, progress, downloads or offline files.
- Preserve Wave 1 performance behavior and its tests.

## Goal

Make the user app genuinely **local-first** for suitable personal state while preserving Supabase as secure account backup/cross-device sync. The app must feel immediate offline, make fewer writes/reads, preserve all existing data formats/compatibility, and safely reconcile when connectivity returns.

Do not redesign Admin or Documents in this wave.

## 1. Audit first

Before product changes, inventory the current persistence/sync paths for:

- `user_notes`
- `nh7_account_notes`
- Bible/reader notes
- saved verses / favorites / verse marks
- user/account progress
- School progress/drafts where applicable
- spiritual plan progress
- audio playback position / download state
- language/theme/settings
- Inbox read/deleted state
- queued cloud operations
- existing localStorage / IndexedDB / Cache API stores

Create:

`docs/qa/LOCAL_FIRST_WAVE2_AUDIT.md`

For each data class record:
- current local store
- current cloud store
- source of truth when offline/online
- write frequency
- conflict semantics
- cross-device requirement
- whether cloud is required, optional backup, or should remain server-authoritative
- deletion semantics
- migration/compatibility risk

## 2. Architecture rules

Use this model where appropriate:

`User action -> immediate local durable save -> enqueue sync -> debounce/batch -> cloud sync -> acknowledge only after success`

Network failure must not lose the local change.

Do not make sensitive authorization/server-controlled state local-authoritative. Examples that remain server-authoritative include access grants, Admin role, School approval/entitlements and protected Library authorization.

Do not introduce a new native database dependency unless existing browser-compatible storage cannot safely satisfy the requirement. Prefer the current IndexedDB/local persistence architecture and avoid unnecessary platform divergence.

## 3. Shared sync coordinator

If the current code has fragmented sync scheduling, introduce or extend a small shared coordinator that provides:

- per-owner isolation (UID/device)
- ordered durable queue
- de-duplication/coalescing only where semantics are provably equivalent
- debounce for rapid repeated edits
- bounded exponential backoff
- online/foreground-triggered retry
- pause nonessential sync in background
- flush important pending writes on pagehide/background when practical
- no retry storm
- no acknowledgement before confirmed cloud success
- account-switch fencing so old-user responses/writes cannot mutate new-user state

Reuse Wave 1 queue behavior instead of replacing it recklessly.

## 4. Notes — preserve both cloud backups

Current Wave 1 evidence says:
- `user_notes` is legacy/device-bound compatibility.
- `nh7_account_notes` is current account restore source.

Do **not** delete, merge, backfill or consolidate these tables in Wave 2.

Required behavior:
- note edit saves locally immediately
- UI never waits for cloud to display the edit
- cloud sync is debounced/queued
- offline edits survive restart
- reconnect syncs without duplicates or loss
- account switching never exposes another account's note
- delete/tombstone behavior remains compatible with both existing cloud paths
- conflicting texts are never silently overwritten by a weaker/older local copy

Document a future UID-keyed consolidation plan only; no destructive migration.

## 5. Progress / saved state

Apply local-first semantics, where safe, to high-frequency user-owned state such as:

- audio position
- reading position
- favorites/saved verses
- verse marks
- personal progress
- spiritual-plan local progress

Coalesce high-frequency updates. Example: audio playback position should not cause cloud writes every few seconds. Persist locally frequently enough for UX, but sync cloud checkpoints on meaningful lifecycle events/intervals.

Do not weaken School progression/assignment/exam server authority.

## 6. Offline reconciliation

Implement deterministic reconciliation tests for:

- edit offline -> restart offline -> reconnect
- edit on device A then stale device state returns
- account switch with pending queue
- delete offline -> reconnect
- rapid repeated edits to same note/progress key
- partial cloud failure
- retry after app restart
- duplicate event/retry idempotence

Prefer explicit timestamps/version metadata already present. Do not invent destructive last-write-wins logic if existing semantics are ambiguous; preserve both sides or defer with documented conflict state.

## 7. Local storage cost / pruning

Create a clear retention policy:

Never automatically prune:
- user notes
- user-created content
- required offline downloads
- active pending sync queue

May prune/rebuild when safe:
- derived caches
- stale public catalog snapshots
- noncritical analytics summaries beyond established retention
- temporary rendering/search indexes

Add size/record bounds where missing for rebuildable data.

## 8. Analytics

Preserve the Wave 1 bounded local summaries. Do not re-enable raw per-event cloud analytics.

Do not deploy a batch RPC in Wave 2.

However, perform a **read-only contract audit from available repo/schema evidence** and update:

`supabase/review/performance-wave1/README.md`

with the exact minimum server contract required for a future inexpensive batch ingestion path. If exact schema/RLS/unique keys cannot be proven, say so and do not guess runnable SQL.

The desired future model remains:

`local aggregate -> <=50 item batch -> UID-derived server ownership -> idempotent aggregate upsert`

No free-form note/profile content in analytics.

## 9. Performance guard

Wave 2 must not regress Wave 1.

Re-run the Wave 1 measurement scenario and report before/after relative to `d291592...` for:
- Supabase request count
- Library catalog requests
- DOM queries
- observer callbacks
- background player callbacks

Also measure cloud-write count for a realistic local-first scenario:
- type/edit a note repeatedly
- change audio position repeatedly
- save/favorite several times
- background/foreground

Goal: materially fewer cloud writes without losing final state.

## 10. Required regression tests

At minimum cover:

- FA/EN/HR
- authenticated startup
- offline startup
- note save/reopen online
- note save/reopen offline
- reconnect sync
- account switch isolation
- note deletion
- progress save/reopen
- audio pause/resume/position restore
- saved verse/favorite restore
- queued write survives reload
- partial failure/retry
- Inbox state unchanged
- protected Library/security unchanged
- no duplicate listeners/runaway polling
- existing Wave 1 tests
- canonical develop CI

Do not weaken existing assertions to make tests pass.

## 11. Deliverables

Create:

`docs/qa/LOCAL_FIRST_WAVE2_REPORT.md`

Final response must include:

1. exact final `develop` SHA
2. audit commit SHA
3. implementation commit SHA(s)
4. all changed files
5. diff stat
6. exact test/CI results
7. Wave 1 performance non-regression metrics
8. cloud write-count before/after for the local-first scenario
9. data-safety/conflict behavior
10. what remains server-authoritative
11. anything deferred
12. confirmation:
   - no new branch
   - main untouched
   - no Production deployment
   - no migration applied
   - no Store release
   - no user-data deletion/backfill

Stop on `develop` after validation. Do not merge to `main`.
