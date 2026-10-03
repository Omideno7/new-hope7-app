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
