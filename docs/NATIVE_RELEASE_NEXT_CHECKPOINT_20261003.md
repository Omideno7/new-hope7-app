# New Hope 7 — Next Native Store Candidate Checkpoint

Date: 2026-10-03

## Source and identity

- Source web baseline: `main` commit `25d4166ef10096403c2ea2d13c0426b0a704e8a5`
- Native release branch: `release/native-store-next-20261003`
- Production bundle/package ID: `com.omideno7.newhope7` — MUST NOT change
- Candidate default version: `2.5.0`
- Android candidate default versionCode: `25001`
- iOS candidate default build: `25001`
- Version/build values are workflow inputs and may be raised before signing/upload; they must never be lowered below the currently published builds.

## Supabase production baseline included

The native candidate is built after the verified Production hardening:

- `20261002221819 optimize_disk_io_inbox_registrations_v1`
- `20261003073335 retire_nonessential_telemetry_and_audio_gate_v1`
- `20261003100105 add_batched_social_and_inbox_snapshot_v1`
- `20261003171531 optimize_inbox_rls_initplan_v1`
- `20261003171549 optimize_admin_engagement_analytics_v223`
- `20261003172711 optimize_admin_library_dashboard_queries_v1`

No release packaging step runs a Supabase migration.

## User-data preservation

Protected server-side user state includes:

- Notes
- Saved Verses
- Verse Marks
- Account Progress
- School Progress
- School Assignments
- Registrations
- Library reading progress
- Spiritual-plan progress

The repository optimization guard blocks destructive migration operations against protected state from the hardening baseline onward.

Native update rules:

- keep `com.omideno7.newhope7`
- reuse the existing Android upload signing identity for Play
- reuse the existing Apple signing identity/profile for App Store
- do not change persistent local-storage namespaces for Notes/Settings/Offline state
- update in place; never publish as a second application

Android CI additionally installs a lower-version QA package, writes a sentinel into the application sandbox, performs `adb install -r` with the candidate, and verifies the sentinel remains after update.

## Feature set present in this candidate

The branch inherits the current tested `main`, including:

- Appearance personalization and Theme Gallery
- unified Reader toolbar / reading controls
- current Settings controller
- My Notes and Notes category/repair work
- current Audio Classic runtime
- Mini-player and lock/background MediaSession support
- Audio Library
- integrated Media Player
- current sermon cards / Model C audio-card work
- Like / Unlike / Blessing batching
- Inbox snapshot-first synchronization and safe fallback
- School registration, School Path, assignments and exams
- Student Academic Center and PDF reporting fixes
- Bible keywords and current Bible/Apocrypha reader runtimes
- Account deletion runtime
- Library catalog/reader
- current Admin Supabase I/O reductions

Native-only adaptation:

- OneSignal account binding v3.6.4 with external-ID confirmation
- Web OneSignal SDK disabled inside native WebView
- Web service-worker ownership disabled inside native WebView
- Android API 36 / minSdk 24 / R8 + resource shrinking
- iOS background audio + remote-notification modes
- production push entitlement configuration

## Deliberately not reintroduced

The Bible Deep Link experiment was rolled back to the last user-tested stable state before the current Appearance/Player releases. It must not be silently restored into this Store candidate without a fresh isolated QA pass.

Checklist-only features that are not present as active runtime modules in current `main` must not be represented as shipped features merely because they exist on the roadmap.

## Required release gates

1. `python3 scripts/validate_next_native_optimization_guard.py`
2. `python3 scripts/validate_native_release_candidate.py`
3. Android API 36 release AAB compiles.
4. Android QA package launches online.
5. Android QA package relaunches offline.
6. Android update-in-place sentinel survives `adb install -r`.
7. iOS Simulator Release compiles unsigned.
8. iOS generic-device Release compiles unsigned.
9. Real-device QA before Store upload:
   - Login/session refresh
   - Notes/Saved Verses retained
   - School Progress retained
   - Audio play/pause/seek/speed/queue/background/lock screen
   - offline download/clear-download behavior
   - Like/Blessing/Share
   - Inbox/read/delete/badges/push
   - Reader/theme/settings
   - Library
10. Only after real-device QA, sign with the existing Store identities and upload as an update.

## Rollback

Web/Supabase rollback references remain in `supabase/rollbacks/`.
If native QA fails, discard this native release branch; do not roll back or mutate user data merely to fix packaging.
