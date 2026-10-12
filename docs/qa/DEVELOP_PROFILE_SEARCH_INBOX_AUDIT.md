# Current develop: Profile, Global Search and Inbox audit

Base: `79a1fd7668fe4e590df1b8266136ac44dea023a5`. Remote `develop` was verified exactly with `git ls-remote`, then fetched into `origin/develop` and verified again before creating `codex/develop-profile-search-inbox-qa`. No old Final-QA/Store branch was merged or copied. The final commit SHA is recorded in the PR and completion report.

## Findings and minimal fixes

**Profile:** Current v563 guard disables the retired picker/remount loop; active v564 owns crop/zoom, Home/header/account avatars and the existing `nh7_profile_photo_v561` local key. Only explicit save/remove actions write/delete that key. Remounts, time passing, cancelled picks and invalid image errors do not clear a valid photo. Browser fixtures confirmed a valid image survives refresh and full Chromium process restart, remains in Home/header/account, and survives five simulated minutes. No persistence bug was reproduced. One localization bug was confirmed: the header avatar aria-label was created once and retained its initial language. `syncHeader()` now refreshes that label in FA/EN/HR. Photo persistence/backend behavior is unchanged; the old v502 backend/bucket is not restored.

**Global Search:** Current v562 already searches bundled Bible verse text, the existing cached Audio sermon/message catalog, local Bible/audio/School/gratitude notes, and supported saved references. It retains exact Bible `bookId/chapter/verse`, Audio `open` and School `lesson` routes. No source replacement or extra catalog/analytics request was added. Apocrypha notes were included in matching but fell through to Home; saved `APO:` references fell through the Bible resolver. Both now reuse the already-loaded canonical `NH7_OPEN_SAVED_APOCRYPHA_V394` exact verse opener. Bible and Audio paths are unchanged. No note/bookmark contents are edited. Audio search retains its existing cached-catalog scope; this change does not introduce cold-cache server queries. Legacy generic notes without identifiable location retain existing behavior; no destination is invented from their text.

**Inbox:** The current view showed developer implementation details (OneSignal/Supabase Edge Function) in all three languages. Replaced only that explanatory copy with user-facing text. Existing `createdAt` values (cloud `delivered_at` mapping) were already retained when marking read; the view now formats the timestamp using the selected FA/EN/HR locale, uses semantic `<time datetime>`, and includes the same timestamp in the opened message panel. It can also display existing delivered/sent fields. Missing/invalid dates show localized unavailability instead of a fabricated current time. The read-state label now says Read rather than Completed. Receipt writes, cloud synchronization, scheduling, badge logic, deletion logic and OneSignal/account binding v3.6.4 are unchanged. Fixtures confirmed the original timestamp remains identical after opening, read state updates and the unread badge decreases.

## Changed files

- `js/nh7-profile-photo-v564.js`: refresh header photo aria-label only.
- `js/nh7-global-search-direct-v562.js`: exact Apocrypha note/saved-reference opener only.
- `js/app.js`: Inbox localized explanatory copy/read label/timestamp presentation only.
- `index.html`: scoped cache-busting suffixes for the three changed client runtimes.
- `sw-release-core-v403.js`: rotate static application-code cache identity; user media/data caches unchanged.
- `scripts/verify-profile-search-inbox-qa.cjs`: focused actual-UI Chromium regression with persistent profile and mocked remote services.
- `docs/qa/DEVELOP_PROFILE_SEARCH_INBOX_AUDIT.md`: this audit/evidence.

## Validation

All passed locally:

| Command | Result |
| --- | --- |
| `python3 scripts/verify-supabase-migration-parity.py --strict` | 33/33 exact raw hashes, zero missing, zero pending |
| `python3 scripts/validate_next_native_optimization_guard.py` | PASS |
| `node scripts/verify-responsive-v570.mjs` | PASS |
| `node scripts/verify-theme-propagation-v571.mjs` | PASS |
| `node scripts/verify-offline-reconciliation-v572.mjs` | PASS |
| `python3 scripts/verify-web-community-parity-v250.py` | PASS |
| `python3 scripts/verify-notes-account-merge-v544.py` | PASS |
| `python3 scripts/verify-audio-playback-safety-v486.py` | PASS |
| `node scripts/verify-i18n-v115.cjs` | PASS: 11 routes, FA→EN→HR→FA, RTL/LTR, crop/zoom, player accessibility, exact Bible search/deep-link/share and account fixture preservation |
| `node scripts/verify-profile-search-inbox-qa.cjs` | PASS: local photo Home/header, refresh/process restart/simulated five minutes/cancel/error, three-language header labels, Inbox timestamps/read/badge, current v562 Audio/Bible-note/saved-Bible/Apocrypha navigation |
| `node --check` for every changed JS and new verifier | PASS |
| `git diff --check` | PASS |

Migration parity compares the repository's captured Production checkpoint manifest, not a new live Production connection. Browser tests use Chromium with all non-local requests mocked: existing app background writes and Inbox receipts never reach Production. Physical Android/iOS restart/picker behavior is not claimed; browser fixtures exercise the same device-local storage code, and five minutes are simulated through the test clock. Existing CI workflows restricted to `main` may not auto-run on a PR against `develop`; local required-check results are recorded above without changing workflow triggers.

## Safety and deliberate exclusions

No migrations, Supabase functions/RLS/Storage/Auth, old profile bucket/v502 path, analytics/IO instrumentation, notifications backend or push account binding changed. No user notes, assignments, progress, bookmarks, downloads, photos, Testimonies or Prayer Requests were deleted or rewritten. No Audio engine, Exam Review, Community or current Search/Profile runtime was downgraded. No branch merge, deployment or Production write was performed. The application changes are presentation/exact navigation only; existing user-data/backend write behavior is unchanged. Review and physical-device confirmation remain appropriate before any separately authorized release.
