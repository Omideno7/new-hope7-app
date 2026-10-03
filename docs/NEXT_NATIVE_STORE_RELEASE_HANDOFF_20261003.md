# New Hope 7 — Next Native Store Release Handoff

Date: 2026-10-03

## Canonical source

Build the next iOS / Android Store update from **latest `main` only**.

Application-code baseline before this handoff document:

`25d4166ef10096403c2ea2d13c0426b0a704e8a5`

Do **not** build from:
- old ZIP exports
- `release/next-v250-preview`
- old 2.3.x release-candidate branches
- stale open PRs
- old iOS wrapper PR branches without first syncing them to latest `main`

The two archived ZIPs used for historical work are not the canonical native source for this release.

## Application identity — must stay unchanged

Product: **New Hope 7**

Android package ID / native application ID:

`com.omideno7.newhope7`

The iOS bundle identity used by the existing native wrapper must remain the same existing New Hope 7 identity. Do not create a new bundle/application identity.

The next Store build must be an **in-place update** over the installed app:
- preserve application/bundle identifiers
- preserve signing identity / Play upload identity
- preserve Supabase project reference
- preserve persistent storage namespaces
- preserve OneSignal/App Group/native entitlements already used by the current production wrapper

Increment Store version/build numbers from the currently published release; do not reuse an already-published build number.

## Supabase Production baseline

Project: `new-hope7`
Project ref: `gpzcwffxnddhaeaogdyo`

Required migration tail:
- `20261002221819 optimize_disk_io_inbox_registrations_v1`
- `20261003073335 retire_nonessential_telemetry_and_audio_gate_v1`
- `20261003100105 add_batched_social_and_inbox_snapshot_v1`
- `20261003171531 optimize_inbox_rls_initplan_v1`
- `20261003171549 optimize_admin_engagement_analytics_v223`
- `20261003172711 optimize_admin_library_dashboard_queries_v1`

Do not rerun proposal branches #77/#78/#79. Their verified changes are already in Production and formally recorded as migrations.

Exact rollback SQL is stored under `supabase/rollbacks/`.

## Supabase behavior required in the new client

Keep these optimizations:

### Audio / telemetry
Do not restore client calls to:
- `nh7_track_audio_session_v222`
- `nh7_school_record_audio_v380`
- `nh7_track_content_v223`
- `nh7_track_app_section_v222`
- `nh7_library_reading_record_v490`

Legacy backend endpoints remain available as no-op compatibility endpoints for older installed builds. Do not drop them in this release.

### Sermon Like / Blessing
Use:
- `nh7_sermon_social_batch_v444` for batched reads
- `nh7_sermon_social_state_v440` only as safe fallback
- maximum batch of 20 near-visible items
- double-tap protection

### Inbox
Use `nh7_inbox_snapshot_v419` first.

Keep:
- `SYNC_TTL_MS=120000`
- `POLL_MS=900000`
- legacy own/global/receipts fallback
- event-driven refresh on foreground, push, online restoration, Inbox open and explicit sync

Do not return to 30–60 second background polling.

### Library
Keep the 10-minute stable catalog cache:
`NH7_LIBRARY_CATALOG_CACHE_MS=10*60*1000`

### School Path
Keep:
- approximately 30-second cache
- approximately 120-second periodic refresh

Do not make school progression depend on listening telemetry.

## Confirmed current runtime signatures in main

The native web payload must contain the latest equivalents of these runtime modules:

- `js/nh7-audio-classic-v484.js?v=4.8.5-no-telemetry`
- `js/nh7-sermon-social-v443.js?v=4.4.8-batch`
- `js/nh7-inbox-badge-sync-v418.js?v=4.1.10-snapshot`
- `js/nh7-school-path-v351.js?v=4.6.7-io`
- `js/nh7-settings-controller-v403.js`
- `js/app.js?v=4.8.16-inbox`

Reader/theme modules already merged to main must travel with the same web payload, including the current unified Reader toolbar, book reader, notes reader integration, Apocrypha reader integration, Theme Studio and Theme Gallery.

Do not manually cherry-pick only a few JS files from old ZIPs. Sync the canonical web payload from latest main so all already-merged features move together.

## User-data preservation — release blocker

An update must not remove/reset:
- account Notes
- Saved Verses
- Verse Marks / highlights
- Account Progress
- School Progress
- School Assignments / submitted work
- Registrations / account links
- Library reading progress
- School legacy progress
- spiritual-plan progress
- local preferences/settings that are not explicitly cache/download data

The repository release guard rejects destructive migrations against protected user-state tables from migration version `20261003171531` onward.

The guard also rejects:
- `localStorage.clear()`
- unapproved IndexedDB database deletion

The only approved IndexedDB deletion is the explicit user-confirmed **Clear Downloads / Offline Media** flow for the known offline-media databases.

## Data-preservation verification already completed

During Supabase hardening, aggregate checks were run before/after changes for:
- `nh7_account_notes`
- `nh7_account_saved_verses`
- `nh7_account_progress`
- `nh7_account_verse_marks_v230`
- `school_progress`
- `school_assignments`
- `registrations`

No row loss was observed. User progress continued to increase while the optimization work was being performed, confirming the Production app remained writable during the changes.

## Production performance verification

After Inbox RLS hardening:
- no Inbox 5xx observed in the post-change sample
- no PostgreSQL `57014 statement_timeout` observed in the post-change sample
- real `notification_inbox_receipts` requests averaged roughly tens of milliseconds in the sampled period

Admin load:
- legacy Analytics / Library / Audio supplemental reads are no longer attached to the general 90-second Admin heartbeat
- Analytics is on-demand
- Library Admin is on-demand
- Library/Admin reporting functions have optimized aggregation paths

## Native wrapper rule

This repository contains the production web application; the signed AAB/IPA wrapper and signing credentials are external to this repo.

When preparing the native update:

1. Start from the existing production wrapper, not a new wrapper identity.
2. Sync its web payload / production web target to latest `main`.
3. Preserve existing package/bundle IDs and signing.
4. Preserve native capabilities: notifications, background audio, lock-screen media controls, offline files and deep-link handling already present in the production wrapper.
5. Do not reset native storage or web storage during upgrade.
6. Do not add a migration that clears app data on first launch.
7. Build a test artifact first; do not submit the first build directly to Production.

## Required upgrade QA on a device with existing user data

Install the new build **over the currently installed production build**, without deleting the app first.

Before update, create/confirm:
- at least one Note
- at least one Saved Verse / mark
- School progress / assignment state
- existing login/session if possible
- Reader/theme/settings preference
- one downloaded offline media item if available

After update, verify all of the above still exists.

Then verify:

### Account / auth
- existing account opens
- login refresh works
- logout/login works
- password recovery/deep-link path does not use localhost

### School
- School opens without resetting progress
- lesson list and lesson content load
- assignment remains visible
- Admin feedback remains visible
- approval unlock behavior remains correct
- exam attempt rules remain intact

### Audio
- play/pause/resume
- seek
- speed
- volume
- next/previous/queue
- background playback
- lock-screen controls
- offline playback/download

### Reader / Bible / Library
- Bible opens
- Bible search works
- Notes and Saved Verses work
- Reader settings persist
- Library opens
- book reader opens
- return navigation works

### Social
- sermon list opens
- Like / Unlike
- Blessing / delete Blessing
- Share
- counts do not reset

### Inbox / notifications
- Inbox opens
- badge is correct
- read/delete/mark-read works
- foreground/background refresh works
- push click opens the app correctly

### Settings
- themes/light/dark/system behavior
- Reader/font settings
- Downloads count/management
- **Clear Downloads** removes only downloaded/offline media, not Notes/Progress/account data

## Release stop conditions

Do not upload the Store build if any of these occurs:
- data is missing after an in-place upgrade
- user is unexpectedly logged out because storage was reset
- School progress moves backward or resets
- Notes/Saved Verses disappear
- Inbox produces repeated 5xx/timeouts
- app ID/bundle ID/signing differs from the currently published app
- native build was made from a source older than latest main
- optimization guard is red

## Final rule

For this release, prioritize **upgrade continuity and data preservation over adding one more feature**.

Any feature already merged to latest `main` is included by syncing the full canonical web payload. Any feature that exists only in a stale/open branch must not be merged into the Store build without its own current-main review and regression test.
