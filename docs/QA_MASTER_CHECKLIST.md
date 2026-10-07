# New Hope 7 — QA Master Checklist

Last updated: 2026-10-07
Working branch: `batch2/critical-stability-v300`
Continuity / project management protocol: `docs/PROJECT_CONTROL.md`

Status legend:
- ⬜ Not started
- 🟡 In progress
- 🧪 Code/fix ready; needs real-device or backend QA
- ✅ Tested/verified
- 🚀 Included in approved release

## Progress summary
- Total tracked items: 57
- 🧪 Code/fix ready, awaiting QA: 16
- 🟡 In progress / implementation or review still needed: 25
- ⬜ Not started / release-stage only: 15
- ✅ Fully verified on target devices/backends: 1
- 🚀 Included in approved release but not yet verified: 0

> Count-based snapshot only; items differ significantly in engineering effort. A task is not counted as fully complete until its required real-device/backend QA is done.

## A. Critical stability and data safety
- 🧪 Notes / School Assignment line-break normalization — client fixes committed; final device regression QA pending.
- 🧪 Calendar freeze / lock guard — fix prepared; final device regression QA pending.
- 🧪 Dark/Night Bible verse visibility — fix prepared; final theme/device regression QA pending.
- 🧪 Ministers Library security/cache revocation — implementation prepared; final auth/security QA pending.
- 🟡 Preserve existing Notes, Saved Verses, School Progress, assignments and saved items — release-wide invariant; must be verified before merge/release.

## B. Profile
- 🧪 Profile UI + crop/local fallback — implemented on development branch.
- 🧪 Cloud profile schema candidate — `nh7_user_profiles_v502` migration prepared, not applied to Production.
- 🧪 Private profile photo bucket candidate — `nh7-profile-photos-v502`, 5 MB, authenticated own-folder RLS prepared, not applied to Production.
- 🧪 Header avatar cloud restore path — code path verified; requires backend/device QA.
- 🧪 Logout/Login persistence — requires backend QA.
- 🧪 Second-device persistence — requires backend QA.
- 🧪 Profile display-name UI/schema limit aligned at 160 characters.

## C. Search / Inbox
- 🧪 Global Search — current module searches Bible, Saved Verses, Notes and Audio; Bible results deep-navigate and Audio results hand off to the player. Real-device regression QA pending.
- 🧪 Inbox cleanup — current code has no user-facing developer/OneSignal implementation sentence, has redesigned cards/tooling, and shows exact notification timestamps in message detail. Real-device/cloud-delivery QA pending.

## D. Audio player / offline
- 🟡 Player performance and start latency.
- 🟡 Progress bar / seek marker / icon sizing / localization regression QA.
- 🟡 Continue Listening / Favorites presentation QA.
- 🟡 Offline media — implementation exists; native Android/iOS regression QA required.
- ⬜ Human Audio Bible gap audit / error handling.

## E. School
- 🟡 Strict lesson progression after assignment approval.
- 🟡 Final exam unlock only after all lessons complete.
- 🟡 Status terminology consistency: Accepted / Completed / Passed.
- 🟡 Admin student reports and per-student details.
- 🟡 Report Print / Save / PDF behavior.
- 🧪 School assignment note normalization — fix prepared; final QA pending.

## F. Admin / Community
- 🟡 Admin panel information architecture / remove duplicates and unnecessary sections.
- 🟡 In-app Admin access with secure RBAC.
- 🟡 Sermon admin edit/image/save regression QA.
- ✅ Testimony Admin playback/publish flow — Web Admin 2.3.9.66 deployed; user verified private review playback works, published a testimony, and verified the published testimony plays in the app. Permanent storage-first delete path remains part of the same protected hotfix set.
- 🧪 Testimony user UX for next update — submission composer is collapsed behind “Record or upload audio”; published testimonies are compact rows showing display name + title and expand to note/player on tap. Commit `8b3e8b76b0e437559dd77b349684f2b6517a2f87`; device QA pending.
- ⬜ Certificate Studio final implementation/QA.
- ⬜ Remove obsolete Analytics UI while keeping required operational functions.

## G. Themes / UI / localization
- 🟡 Make Outline Clean and Neon Age more visually distinct / 3D.
- 🟡 Theme consistency across Daily Word, Juice, Declarations, Message of the Day and popup.
- 🟡 Add/verify old theme option, auto light/dark, custom theme color controls.
- 🟡 Font set expansion and device font option.
- 🟡 EN/HR localization for theme/profile/player controls.

## H. Layout / devices
- 🟡 iPad tablet-specific two-pane layout.
- 🟡 Foldable / large-screen responsive QA.
- ⬜ Apple Watch / complications / Smart Stack release scope and QA.

## I. Links / navigation
- 🟡 Sermon deep links — previously functional; regression QA required.
- 🟡 Bible deep links — exact verse + installed-app/store fallback still needs completion/QA.

## J. Supabase / performance
- 🧪 Removed/reduced unnecessary analytics/tracking paths as part of optimization work; regression monitoring pending.
- 🟡 Confirm current architecture is appropriate for ~200–300 active users and target growth toward ~5,000 without unnecessary IO/cost.
- 🟡 Profile backend candidate must not be applied to Production before explicit approval and QA.

## K. Release QA
- ⬜ Full clean-install QA on Android.
- ⬜ Upgrade-over-existing-install QA on Android with user data preserved.
- ⬜ Full TestFlight QA on iPhone.
- ⬜ iPad QA.
- ⬜ Foldable QA.
- ⬜ Cross-language FA/EN/HR regression pass.
- ⬜ Final Supabase security/performance review.
- ⬜ Freeze source-of-truth release commit.
- ⬜ Build signed Android artifact and verify exact version/features before Google Play submission.
- ⬜ Build/verify iOS release artifact before App Store submission.
- ⬜ User approval before Production release.

## L. Source of truth / Web parity
- 🟡 Reconcile `main` Web/Admin line with the newer 2.5.0 development payload before release freeze. Verified 2026-10-07: branches are diverged; development branch is 39 commits ahead and 9 commits behind `main`. Do not blind-merge. Selectively carry live hotfixes back to development, then perform controlled parity validation. The current Web App is not evidence of the full newer native-app feature set.

## Change log
### 2026-10-07
- User verified Web Admin 2.3.9.66 testimony review playback works; a testimony was published and the published audio was also verified playable inside the app. Moved the Testimony Admin playback/publish flow to ✅.
- Added next-update Testimony UX on the development branch: collapsed “Record or upload audio” composer and compact published testimony rows that expand to details/audio, commit `8b3e8b76b0e437559dd77b349684f2b6517a2f87`.
- Confirmed the user's Web App observation by comparing branches: `main` and `batch2/critical-stability-v300` are diverged; the development branch is 39 commits ahead and 9 behind `main`. Added a dedicated Source-of-Truth/Web parity work item.
- Updated `docs/PROJECT_CONTROL.md`: Codex is parked and may only be used after explicit user authorization; ChatGPT remains direct project manager/implementer.
- Root-caused the Testimony Admin playback regression and narrowed the live-file issue using Production metadata: pending `.m4a` submissions were stored as `audio/mp4;codecs=opus`, a problematic combination for Safari/WebKit inline playback.
- Added `js/nh7-admin-testimony-runtime-fix-v505.js` with permanent storage-first deletion: private/public Storage objects are removed before the testimony database row, avoiding orphaned audio objects.
- Added `js/nh7-admin-testimony-playback-v506.js`: authenticated private fetch, MIME cleanup to plain `audio/mp4`, direct `audio.src`, temporary object-URL cleanup, and signed-URL device-player fallback.
- Added/updated static CI for testimony playback; v5.0.6 syntax and wiring validation passed on the development branch.
- Promoted the narrow Admin hotfix to `main`, bumped stable Admin to `2.3.9.66`, and refreshed the Admin cache key.
- Main deployment was initially blocked by a pre-existing offline-release guard (`nh7-finalqa-v558.js` active but not listed in release assets); added the active runtime to `sw-release-core-v403.js` instead of weakening the guard.
- Main `Validate and Deploy New Hope 7` validation then passed all runtime/app/Admin/HTML checks and GitHub Pages deployment completed successfully.
- No Supabase schema/data mutation was made during this hotfix; Production Supabase was read-only inspected for testimony MIME/storage metadata.

### 2026-10-06
- Created persistent Master Checklist in the repository so progress is not dependent on chat history.
- Added `docs/PROJECT_CONTROL.md` as the mandatory continuity/handoff protocol for future conversations.
- Profile candidate migration and rollback prepared on development branch only.
- Profile display-name database constraint aligned with UI maximum (160 characters), commit `37bd951b5e296fe93d0405fe8edde6cd53d2ee3e`.
- Verified current Global Search module covers Bible + Saved Verses + Notes + Audio and provides direct result navigation/handoff; moved to 🧪.
- Verified current Inbox implementation has redesigned cards, cloud refresh/receipts, no developer-facing OneSignal sentence, and exact timestamp rendering; moved to 🧪.
- Added count-based progress summary for persistent status reporting.
