# New Hope 7 — Celebrations v4.6.4 release checkpoint

Date: 19 September 2026. Repository: Omideno7/new-hope7-app.

## Released

User approved the animated Birthday and educational Christian-calendar Preview on a phone. Production main is now `346e274be35ba422a18c96a82810c33f007c1bed`, merged via clean PR #23. Tree: `761f7121fe3a48e1377db894bb60210caf52dfe5`.

Previous main and rollback point: `2df1fabd295a0b2de2eaf1486e41c41242a4c52f` on `rollback/pre-celebrations-v464-20260919`.

The original mixed Preview PR #21 was closed unmerged. Its phone-reviewed Preview remains at immutable commit `61d691223ff8c16ad34b42af77cba110043446e6`. Do not use the old Preview with a real account: it contains old synthetic-profile test controls. No Preview/test control was copied into main.

Only five deployable files changed:

- `index.html`: versioned runtime wiring; existing feature cache references refreshed; no native version change.
- `service-worker.js`: release-core import version 4.6.4.
- `sw-release-core-v403.js`: new release cache plus approved runtime assets.
- `js/nh7-celebrations-v464.js`: birthday/account-day guards and educational calendar.
- `css/nh7-celebrations-v464.css`: approved fireworks/modal styling and scoped accessibility/theme compatibility fixes.

No app.js, school/audio code, Theme Studio code, manifest, fonts, backend, Supabase operation or user-content migration was included in the release. No store/native package was built or submitted.

## Verification

Verified QA runtime commit: `f18a53a02a377450098318cd934b79e083ada321`.
QA workflow `Celebrations v464 Release QA`: run `35444269284`, job `105900392395`, SUCCESS. Artifact `10585381039`.

All 14 Chromium/WebKit scenario groups passed. Coverage includes actual painted animation-frame movement, FA/EN/HR, 14 Theme Studio palettes, widths 320/390/768/1280, 16 currently listed feast dates, Gregorian Easter 2024–2035, local timezone boundaries, keyboard focus/close, Reduce Motion, Amen-gate deferral, finite effect cleanup, once-per-account-per-local-day behavior, shared-device profile ownership and literal text rendering of user names. Cache simulation preserved four protected-cache sentinels and verified eight current-runtime offline routes. Tests used synthetic local data and no Supabase or real-account requests. Preexisting external Google-font CSS imports were replaced with offline fixtures; bundled fonts and app styling remained real. This is not a claim of native-device or full real-account synchronization acceptance.

Production GitHub Pages workflow `pages build and deployment`: run `35444440612`, SUCCESS for main `346e274...`.
Post-publication read-only workflow `Verify Published Celebrations v464`: run `35444643860`, SUCCESS. All five publicly served release files were fetched from the live site and compared byte-for-byte with the merged commit. No backend requests were involved.

### Separate inherited CI warning

`Validate and Deploy New Hope 7`, run `35444440991`, failed at its existing literal expectation `js/nh7-school-path-v350.js?v=3.5.0`. The prior main already loaded v351, and this workflow file was unchanged by v464. The post-publication check proved this baseline mismatch. Its separate deploy job was skipped; the actual dynamic GitHub Pages deployment succeeded independently. Do not claim every repository workflow is green, do not remove safety checks, and do not reload the obsolete v350 module to silence the warning. Reconcile obsolete version-string assertions with real runtime safety tests as a separate scoped CI task.

## Runtime behavior

Birthday reads an authenticated user's matching existing DOB without updating profile data. Missing or invalid DOB produces no invented birthday. The persisted marker is scoped to user ID and local date. There is no claim of once-only synchronization across multiple devices. Fireworks stop after a few seconds or when hidden/closed; Reduce Motion disables strong animation. Birthday takes priority over a same-day feast; the feast remains accessible from the header. Existing approved descriptions and the 16-date Western/Gregorian list are retained, not a claim of every tradition's feast calendar. The Croatian January 1 title now denotes the same Holy Name entry as FA/EN rather than a different feast. No notification/push permission is requested by this feature.

## Next stage — issue #22

Read-only source audit found a School-entry routing gap: the approved hub sends its Sign in button to `{login:true}`, while successful signInSchool returns to `{}` (the hub), leaving the course-list path behind `{enter:true}`. This is a source-level finding; no real student's account was exercised. Next scoped fix should retain the three-option hub and all FA/EN/HR copy, then route signed-in users and successful login through the existing admin-approval gate. Test guest, pending, approved, expired session, logout, Back and repeated navigation without clearing existing student data.

After that, reconcile client/server Needs revision, resubmission, approved-assignment unlock and the agreed three-attempt exam cap. Verify actual backend behavior before making claims. Remaining separate work includes notification preferences, download management preserving existing stores, native/device regression and store metadata. Bible keywords, themes, the approved school hub and Growth UI have already been integrated; do not relist them as unmerged. Chat remains excluded from this update.
