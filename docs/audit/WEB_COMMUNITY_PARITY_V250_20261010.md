# Web Community parity v2.5.0 — 2026-10-10

## Goal
Forward-port the user-facing Testimonies and Prayer Request experience from the isolated Community 2.5 release onto the current `main` baseline without merging the diverged historical branch and without changing Production data/schema.

## Baseline
- Source baseline: `main` at `a09ea91885e206b3b2f21d8135d814f28edbbec9`.
- Production migration parity before the change: 33/33 exact, zero pending migrations.
- Historical Community branch was used only as a source for the two user-facing assets; it is **not** merged.

## Live backend read-only audit
No writes were performed.

Confirmed in Production:
- `nh7_prayer_requests_v502` exists, RLS enabled; authenticated own-row INSERT/SELECT policies exist.
- `nh7_testimonies_v502` exists, RLS enabled; authenticated own-row INSERT/SELECT policies exist.
- `nh7_public_testimony_feed_v502(text, integer)` exists and returns only published/consented testimony data.
- Private testimony bucket `nh7-testimony-submissions-v502` exists and is private.
- Published testimony bucket `nh7-testimony-published-v502` exists and is public.
- Live testimony bucket file limit is 50 MiB. The forward-port lowers the historical client-side 60 MiB limit to 50 MiB so users do not reach a backend-only failure.

Not present in Production:
- historical `nh7_user_profiles_v502` table
- historical `nh7-profile-photos-v502` bucket

Therefore the stale Community cloud-profile route is deliberately **not exposed**. The `Profile` navigation route uses the current `main` Account/Profile path, which is already enhanced by `nh7-profile-photo-v563.js` / `v564.js`. This avoids a broken save flow and avoids changing existing top-bar profile behavior.

## Runtime scope
Added/forward-ported:
- `js/nh7-community-v502.js`
- `data/community/testimony_guide_v502.json`
- Testimonies route
- Prayer Request route and own-request status list
- three-language navigation/copy (FA/EN/HR)
- login-resume behavior for Community submission flows
- MediaRecorder/crop lifecycle disposal already present in the hardened Community runtime

Preserved:
- current Profile v563/v564 implementation
- School / Student Identity / exams / assignments
- Library security/runtime
- Audio runtime
- existing user local data and Supabase records

## Offline/cache safety
- New Community JS is added to the release core cache.
- Testimony guide JSON is added to the release data cache.
- Release core cache name/version is rotated so an installing worker does not mutate the cache used by the currently active worker.
- Service-worker URL/tag is rotated to force a clean update path.

## No Production mutation
This branch contains no Supabase migration, DDL, data migration, bucket creation, or Production write.

## Verification
- Web Community parity verifier: PASS
- Supabase migration parity: PASS (33/33 exact)
- Next Native Optimization Guard: PASS
- School Identity/access/progress/exam/assignment/certificate/stage verifiers: PASS
- JavaScript syntax checks: PASS
- JSON parse: PASS
- `git diff --check`: PASS
- Browser-only legacy scripts requiring locally installed Playwright were not run in the clean audit clone; no dependency was added for this change.
