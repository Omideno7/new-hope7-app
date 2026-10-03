# New Hope 7 — Next Native Build Optimization Guard

Date: 2026-10-03  
Applies to: next iOS / Android native build  
Source baseline: latest `main` after the Supabase I/O optimization merges and subsequent approved fixes.

## Release baseline rule

Do **not** build the next native release from the stale `release/next-v250-preview` branch. It is materially behind current `main`.

The next native build must start from latest `main` (or a release branch created from latest `main`) so that the following optimization work remains present:

- PR #65 — retire nonessential telemetry / reduce Supabase I/O
- PR #72 — optimize Like, Blessing and Inbox
- commit `655dd08220b736d595ac55c4a14aeb1dd93c9914` or any newer main commit containing it

Feature merges, Theme work, Audio work, School work, Admin work and native wrapper changes must not revert these invariants.

## Client-side invariants

### 1. Generic telemetry stays retired

Do not reintroduce client calls to:

- `nh7_track_audio_session_v222`
- `nh7_track_content_v223`
- `nh7_track_app_section_v222`
- `nh7_school_record_audio_v380`
- `nh7_library_reading_record_v490`

The legacy backend RPCs remain for backward compatibility and intentionally do no tracking writes.

### 2. School audio telemetry remains removed

`js/nh7-audio-classic-v484.js` must not send periodic listening telemetry.

Playback features must remain functional:

- play / pause / resume
- seek
- speed
- volume
- queue
- background and lock-screen playback
- offline download
- local resume

School progression must not require a listening percentage.

The educational progression is:

**lesson completion → required assignment approved → class exam passed → next class → final exam**

### 3. Library reading telemetry remains removed

Do not load:

`js/nh7-book-reading-telemetry-v490.js`

Do not confuse telemetry removal with Library removal.

`nh7_library_catalog_v396` remains required.

Stable Library catalog data remains cached for 10 minutes:

`NH7_LIBRARY_CATALOG_CACHE_MS = 10 * 60 * 1000`

### 4. Sermon social state remains batched

Required runtime:

- batch read RPC: `nh7_sermon_social_batch_v444`
- safe fallback: `nh7_sermon_social_state_v440`
- batch size: up to 20 visible / near-visible sermons
- observer margin: `80px 0px`
- Like double-tap guard must remain

Like, Unlike, Blessing creation/deletion, Admin deletion and Share must remain functional.

### 5. Inbox remains snapshot-first and event-driven

Primary RPC:

`nh7_inbox_snapshot_v419`

Fallback must remain available using the old own/global/receipts reads.

Required timing:

- `SYNC_TTL_MS = 120000`
- `POLL_MS = 900000`

Do not return background polling to 30–60 seconds.

Primary refresh triggers remain event-driven:

- foreground push
- push click
- online restoration
- app/page show
- background → foreground
- opening Inbox
- explicit/manual sync

Badge and Inbox page must share the same sync path where possible.

### 6. School Path stays low-I/O

Required behavior:

- cache about 30 seconds
- periodic refresh about 120 seconds

Do not restore very short polling/cache windows without a measured reason.

## Required script references in index.html

At minimum, these signatures (or a newer equivalent preserving the same optimization) must remain:

- `js/nh7-audio-classic-v484.js?v=4.8.5-no-telemetry`
- `js/nh7-sermon-social-v443.js?v=4.4.8-batch`
- `js/nh7-inbox-badge-sync-v418.js?v=4.1.10-snapshot`
- `js/nh7-school-path-v351.js?v=4.6.7-io`
- `js/app.js?v=4.8.16-inbox`

Newer version numbers are allowed only when the optimization behavior is preserved.

## Production backend compatibility

Do not Drop or Rename legacy compatibility RPCs used by older App Store / Google Play builds:

- `nh7_track_audio_session_v222`
- `nh7_track_content_v223`
- `nh7_track_app_section_v222`
- `nh7_school_record_audio_v380`
- `nh7_library_reading_record_v490`

Historical analytics tables must not be dropped as part of the native release:

- `nh7_audio_sessions`
- `nh7_school_audio_progress_v380`
- `nh7_content_activity_daily`
- `nh7_app_activity_daily`
- `nh7_library_reading_progress_v490`

Cleanup/archive is a separate project.

## Production indexes that must remain

- `notification_inbox_device_delivered_io_v1`
- `notification_inbox_email_delivered_io_v1`
- `notification_inbox_global_language_delivered_io_v1`
- `registrations_type_status_updated_io_v1`

## Features optimization must not break

- Login / Logout / refresh token
- Account
- Notes
- Saved Verses
- Bible and Bible search
- Daily Word / Faith / Juice / Gratitude
- School registration
- School assignments and Admin feedback
- class exams, 3-attempt rule, final exam
- Audio playback / offline / resume / background / lock screen / speed / volume / queue
- Like / Blessing / Share
- Inbox / badges / Push Notifications
- Deep Links
- Theme / Reader settings
- Library catalog and Reader

## Required native-release QA

### School
Login → School → lesson → assignment → Admin approval → class exam → pass → next class → final exam.

### Audio
Play → pause → resume → seek → speed → background → lock screen → next/previous → download/offline.

### Social
Open sermon list → counts → Like/Unlike → Blessing → delete Blessing → Share.

### Inbox
Push → badge → Inbox → read → delete → mark all read → language change → background/foreground → offline/online.

### Library
Open Library → list books → open book → Reader → return to Library.

### Data preservation
Verify update does not remove or reset:

- Notes
- Saved Verses
- School Progress
- Account data

## Architecture rule for all new features

Prefer:

- local-first where possible
- cache stable data
- event-driven refresh
- batched reads
- no unnecessary background polling
- no per-card/per-item database calls
- database writes only when user state actually changes

Do not optimize by removing user-facing functionality. Optimize network and database behavior instead.


## Supabase release hardening applied on 2026-10-03

The following Production-safe optimizations are now part of the next native release baseline:

- `20261003171531_optimize_inbox_rls_initplan_v1`
  - preserves existing Inbox access semantics
  - caches stable request/auth helper results per statement via PostgreSQL initPlans
  - no row deletion, rewrite, truncate or table replacement
  - rollback is stored under `supabase/rollbacks/`

- `20261003171549_optimize_admin_engagement_analytics_v223`
  - preserves the existing RPC name/signature and Admin access check
  - removes duplicate aggregation work
  - preserves the observed summary and Top-150 item values
  - no user-data table changes
  - rollback is stored under `supabase/rollbacks/`

Admin recurring-load optimization was merged into `main` at:

`50f799e1522b508a992279fb06a228678a24bfdb`

Do not create the App Store / Google Play build from a commit older than this baseline.

## User-data preservation gate

Starting with migration history version `20261003171531`, the native optimization guard rejects destructive SQL against protected user-state tables, including:

- Notes / account notes
- Saved Verses / verse marks
- account and legacy progress
- School Progress / legacy school progress
- School Assignments
- Registrations
- spiritual-plan progress
- Library reading progress
- School audio progress

The guard also rejects:

- global `localStorage.clear()`
- `indexedDB.deleteDatabase()`

This protection is intentionally focused on destructive operations. Normal state updates and schema additions remain possible.

## Production verification completed before release hardening

Before and after the Supabase hardening changes, aggregate integrity checks were run for:

- `nh7_account_notes`
- `nh7_account_saved_verses`
- `nh7_account_progress`
- `nh7_account_verse_marks_v230`
- `school_progress`
- `school_assignments`
- `registrations`

No row loss or unexpected update timestamp changes were observed during the schema optimizations.

Inbox receipts RLS read benchmark improved from approximately 1.5 seconds to approximately 0.77 seconds in the no-match full-policy probe.

The Admin Engagement Analytics RPC preserved the baseline summary:

- total opens: 108,613
- unique users: 753
- total listened seconds: 3,183,637
- likely skipped sessions: 324
- returned items: 150

The isolated RPC execution improved from approximately 3.15 seconds to approximately 2.14 seconds, while recurring Admin analytics/library calls were removed from the general 90-second Admin heartbeat.

## Native update compatibility rule

The new native build must update in place over the currently published app. Do not change application identifiers, signing identity, Supabase project reference, or persistent storage namespaces in a way that would make the OS treat the app as a new installation.

Older installed builds must remain compatible with the Production backend. Legacy no-op telemetry RPCs remain available for that reason until the active installed base has migrated to the new build.


## Additional Admin Library optimization — 2026-10-03

Production migration:

- `20261003172711_optimize_admin_library_dashboard_queries_v1`

What changed:
- `nh7_admin_library_dashboard_v222()` and `v224()` now aggregate Library access statistics once and join the result, instead of running per-item correlated access-log subqueries.
- Function names, signatures, Admin checks, JSON shape and ordering remain unchanged.
- No user-data row, RLS policy, grant or Storage object is modified.

Observed validation:
- v222 items: 47 before/after-compatible shape
- v224 items: 47 before/after-compatible shape
- Library access code array remains unchanged in shape
- protected user-state row counts did not decrease
- whole-function latency remained approximately ~1.0s in the verification run
- shared buffer hits decreased from 2,806 to 2,133 (about 24% less buffer work)

Because Admin Library loading is now on-demand rather than part of the normal heartbeat, this migration is retained for lower database work rather than presented as a major end-to-end latency win.
