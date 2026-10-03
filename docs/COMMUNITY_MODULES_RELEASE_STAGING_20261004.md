# New Hope 7 — Community Modules 2.5.0 Release Staging

Date: 2026-10-04
Branch: `feature/community-modules-release-20261004`
Base: `release/native-store-next-20261003`

## Scope

This branch rebases only the previously previewed Community modules onto the current native 2.5.0 release candidate:

- My Profile
- Audio Testimonies
- Prayer Request

The rolled-back Bible/sermon Deep Link experiment is not restored.

## Production status

- Supabase Production is unchanged.
- No Community table or Storage bucket exists in Production yet.
- No Community migration has been applied.
- Existing Notes, Saved Verses, Verse Marks, Account Progress, School Progress, Assignments, Registrations, Library progress and spiritual-plan progress are not altered by the candidate SQL.

## Client I/O budget

### Public testimony feed
- one RPC per language when cache is cold
- maximum 30 rows requested
- in-memory cache TTL: 10 minutes
- no background polling
- audio playback uses the approved public Storage object URL, not a per-play database write
- generic listening telemetry remains disabled

### Prayer Request
- one insert when the user explicitly submits a request
- no user-side polling
- Admin feed is loaded only when the Prayer tab is opened/refreshed
- normal Admin feed asks for at most 200 rows
- the larger export query is executed only when Admin explicitly requests PDF/print

### Testimony moderation
- Admin feed is loaded only when the Testimonies tab is opened/refreshed
- normal feed asks for at most 100 rows
- signed private-audio URLs are created only for the first 20 returned rows
- no recurring Admin heartbeat query is added

## Storage budget and lifecycle

### Profile
- source image input capped at 5 MiB
- cropped avatar is rendered at 512×512 JPEG
- the previous original/avatar objects are removed after a successful replacement
- newly uploaded objects are removed if the profile database save fails

### Testimonies
- upload/recording capped at 60 MiB
- MediaRecorder byte count stops oversized recordings before they continue growing in memory
- failed database submission removes the just-uploaded private object
- failed moderation after a public copy removes the copied public object
- approved/rejected submissions attempt to remove the no-longer-needed private audio object

## Database/RLS design

Candidate tables:
- `nh7_user_profiles_v502`
- `nh7_testimonies_v502`
- `nh7_prayer_requests_v502`

Candidate Storage buckets:
- private `nh7-profile-photos-v502`
- private `nh7-testimony-submissions-v502`
- public approved-only `nh7-testimony-published-v502`

Hardening:
- RLS enabled on all three tables
- own-user policies use per-statement `(select auth.uid())`
- owner-only moderation uses the existing owner authorization helper
- user/status/feed indexes are included for expected access paths
- public testimony RPC exposes only publication-safe fields
- no Realtime subscription, trigger polling, cron task or background refresh is introduced

## Static QA completed

- current App integration contains the three Community routes
- App module body parses after removing ESM import declarations for syntax-only validation
- Community user runtime parses successfully
- Community Admin runtime parses successfully
- candidate SQL dollar-quote delimiters are balanced
- no Deep Link runtime is referenced by the release integration
- branch diff is additive/current-release scoped

## Required before merge / Store upload

1. Run the candidate migration in an isolated Supabase development environment.
2. Test Auth + RLS with at least two normal users and one Owner/Admin.
3. Test profile upload/read/replace/crop and verify cross-user denial.
4. Test private testimony upload; verify another user cannot read it.
5. Test Owner approval/rejection and Storage object cleanup.
6. Test approved public testimony playback.
7. Test Prayer submit, Owner status changes and PDF export.
8. Run Supabase security/performance advisors on the test backend.
9. Run native in-place upgrade QA with existing user data.
10. Merge only after explicit release approval.
