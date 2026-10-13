# Codex Wave 1 — Performance, Battery, Network, Supabase Cost

## Mission
Optimize the New Hope 7 user app for lower battery/CPU/network/Supabase cost while preserving all existing behavior and user data. This wave does **not** redesign Admin, does **not** prepare a Store release, and does **not** deploy Production.

## Branch rules — mandatory
- Work **only on `develop`**.
- Do **not** create any new branch (`feature/*`, `fix/*`, `codex/*`, `agent/*`, `qa/*`, etc.).
- Do **not** modify or merge `main`.
- Do **not** deploy web/PWA, Supabase Production, App Store, or Google Play.
- Do **not** apply Production migrations.
- Existing long-lived platform-specific branches may remain only for truly platform-specific code (for example WatchOS). Shared user-app logic belongs on `develop`.

Before editing: fetch origin, switch to `develop`, sync safely with `origin/develop`, confirm clean/understood working tree, then inspect `AGENTS.md` and repo workflow docs.

## Current production-scale context
Recent read-only Supabase inspection showed approximately:
- 311 Auth users
- PostgreSQL database: ~158 MB
- Storage: ~6.8 GB
- `church-audio`: ~6.75 GB of Storage
- `user_notes`: ~3.1 MB
- `nh7_account_notes`: ~2.2 MB

Notes are **not** currently the main storage-cost problem. The primary concerns are excessive requests, egress, CPU/battery work, polling, duplicated sync, and scaling cleanly toward ~3,000–5,000 users.

High-volume recent endpoints include:
- `nh7_library_catalog_v396`
- `/auth/v1/user`
- `registrations`
- `notification_inbox`
- `nh7_admin_my_access_v350`
- `nh7_school_access_approved_v230`
- `nh7_sermon_social_state_v440`
- `nh7_inbox_snapshot_v419`
- account/user progress and notes calls

Users report phone heating and faster battery drain during longer app usage.

## Phase A — audit first, then modify
Before changing product behavior, create:

`docs/qa/PERFORMANCE_COST_WAVE1_AUDIT.md`

Audit and inventory:

### Network / Supabase
Search all `supabase.from`, `supabase.rpc`, `getUser`, `getSession`, `refreshSession`, `fetch`, REST/Edge Function calls, catalog loads, inbox refreshes, registration/school/admin access checks, sermon social-state calls, progress writes, notes writes.

### Timers / lifecycle
Search `setInterval`, recursive `setTimeout`, polling loops, `visibilitychange`, `pageshow`, `focus`, online/offline, background/foreground handlers.

### CPU / DOM
Audit MutationObserver, ResizeObserver, IntersectionObserver, duplicate global listeners, expensive DOM scans, render loops, audio timers, animation/visualizer work.

### Persistence / sync
Audit localStorage, IndexedDB, Cache API, device-local storage, Supabase sync, offline queues/reconciliation, notes/progress syncing.

For every major issue document: file/location, current behavior, estimated request/CPU impact, proposed fix, regression risk, user-data impact, schema requirement.

## Phase B — optimize safely
Implement the highest-value fixes after the audit.

### 1. Library catalog
Investigate why `nh7_library_catalog_v396` is called so frequently. Use a safe cache/version/staleness strategy so the full catalog is fetched only when stale. Reuse existing version/updated-at mechanisms if possible. Must work online, offline, after app update, and after library content changes.

### 2. Auth/access calls
Reduce repeated `/auth/v1/user`, `getUser`, `getSession`, registration status, admin access and school access calls by sharing safe session/access state with explicit invalidation. Do **not** weaken authentication or authorization.

### 3. Inbox
Reduce unnecessary `notification_inbox` / receipts polling and full reloads. Prefer deltas/snapshots/stale checks and meaningful lifecycle refreshes. Suspend nonessential work in background. Preserve unread/read/deleted state and offline behavior. Do not redesign push notifications in this wave.

### 4. Audio + battery
Audit progress timers, analytics, DOM updates, background events, network writes, Media Session and animations. Avoid Supabase writes every few seconds. Prefer local state + throttled/significant checkpoints such as pause, stop, background, completion. Preserve background audio and lock-screen controls.

### 5. Analytics — keep it if inexpensive
Audit `nh7_app_activity_daily`, `nh7_content_activity_daily`, `nh7_audio_sessions` and related code. We want useful reports: active users, content usage, lesson/sermon listening, duration and completion. Do **not** simply delete analytics. Prefer local counters + batching/session summaries/daily aggregate upserts instead of high-frequency raw events. Only recommend removing analytics if a cost-efficient implementation is genuinely not feasible, and prove why.

### 6. Notes
Do **not** remove cloud backup. Investigate why both `user_notes` and `nh7_account_notes` exist, which is canonical, legacy compatibility and duplication. Document a future consolidation path but do not perform destructive consolidation in Wave 1. No note loss.

### 7. App lifecycle
When app backgrounds, stop nonessential polling/refresh/observers/timers where safe. On foreground, refresh only stale/required data; do not blindly reload everything.

### 8. Local-first principle
For suitable data (notes, favorites, saved verses, reading/audio position, preferences, noncritical counters), prefer immediate local persistence and debounced/batched cloud sync while preserving account portability/cross-device backup. Do not silently change ownership or delete cloud data.

## Supabase SQL changes
Existing performance findings include inefficient RLS initplan patterns, duplicate indexes, missing FK indexes and multiple permissive policies.

Do **not** apply Production SQL.
If worthwhile, create candidate SQL only under:

`supabase/review/performance-wave1/`

Each candidate must include expected benefit, security/RLS impact and rollback. No destructive SQL and no live application.

## Measurement
Measure a realistic scenario before and after if feasible:
1. launch app
2. sign in
3. idle on Home
4. open Library
5. open/play sermon
6. open Bible/save note
7. open Inbox
8. background app
9. foreground app

Report before/after Supabase/fetch/RPC counts, timers/listeners if measurable, and percentage reduction. Development-only instrumentation is allowed; do not ship debug telemetry.

## Regression requirements
Preserve:
- FA / EN / HR
- authenticated and supported anonymous startup
- cached/offline Library
- Library refresh after version change
- Inbox state
- note save/reopen
- progress save/reopen
- audio play/pause/resume/background
- offline reconciliation
- no duplicate listeners/runaway polling

Run the repository's canonical `develop` validation suite. Do not weaken/delete tests to force CI green.

## Out of scope for Wave 1
Do not work on Admin redesign, Document Studio, Apple Watch, Wear OS, Mac UI, iPad layout, Store release/version numbers or unrelated feature work unless strictly required for a shared performance fix.

## Final report
Stop after Wave 1 on `develop`. Report:
1. exact commit SHA(s)
2. modified files
3. diff stat
4. tests and CI
5. measured before/after request counts
6. battery/network impact estimate
7. Supabase-cost impact
8. remaining risks/deferred items
9. explicit confirmation: no new branch, no `main` modification, no Production deploy/migration, no Store release.
