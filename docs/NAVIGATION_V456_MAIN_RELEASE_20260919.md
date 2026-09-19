# Navigation v4.5.6 main release — 19 September 2026

## User-approved outcome
The user approved the Home/More cleanup and asked to remove the entire “Where are the other features?” guide. The released main contains the approved navigation without that guide or its CSS. No new guide, tooltip, notice or replacement was added to the main menu.

Repository: Omideno7/new-hope7-app.
Previous main: `08d3bfb51532163392fe87cd017e316327c38234`.
Released main: `466badb8a151dbdf02d07606a99e9660da1fe04a`.
Approved navigation source: `a15365d1eaf05225a322670c58f10a4401602fbe`.
Recovery branch: `backup/pre-navigation-v456-20260919` at previous main.
Integration branch: `integration/navigation-v456-20260919`.
Evidence branch: `qa/navigation-v456-release-20260919`.
Main was advanced by one tested commit with `force=false`, after exact scope and main-base rechecks.

## Limited release scope
Only five files changed: `js/app.js`, `index.html`, `css/nh7-navigation-v456.css`, `service-worker.js`, `sw-release-core-v403.js`.

Home no longer repeats Bible, Plans and School from the bottom bar; Meetings remains on Home. More no longer repeats Gratitude, Meetings or Inbox. Gratitude stays under Daily, and Inbox remains in the header with its unread badge. Audio, Salvation, Q&A, Account, About, Settings and the separately injected visual-media entry remain available. The six-item bottom bar, contextual source shortcuts and prior localized date are unchanged.

The approved in-memory navigation-epoch protection against late Meetings responses is retained. This changes view selection only, not meeting approval or authorization.

No Preview HTML, Preview app copy, storage-isolation guard, synthetic user record or test workflow was transferred to main. Original Bible/Apocrypha text, backend files, classic audio implementation, font controller, native version and manifests were not changed. No production Supabase query, account modification, email sending, native build or store submission was performed by this release work.

## Why the Preview showed “Cloud disabled”
The previous `navigation-preview.html` deliberately loads an isolated app copy with its cloud flag disabled and blocks external/write requests. Real sign-in is not available there; the normal fallback account handler can consequently display “Cloud disabled”. This is a Preview restriction, not evidence that the user's real account was disabled.

The released `index.html` does not load those Preview files. The production cloud configuration, authentication functions, Account renderer, sign-in, legacy-account handling, logout and password-recovery code were compared byte-for-byte with previous main and remained unchanged.

Browser checks used intercepted/mocked cloud endpoints, not a real account: sign-in reached the normal auth and legacy-account endpoints and displayed the controlled invalid-credentials response, not Cloud disabled; password recovery reached its existing mocked endpoint; an existing synthetic session and unrelated note survived navigation and reload. These tests do not assert a real user's password was authenticated or that live backend availability was independently tested.

## Verification evidence
Pre-release workflow `Navigation v456 Clean Release`: run `35434262169`, job `105874153150`, SUCCESS. Artifact `10582222111`.
- Chromium: all 9 navigation scenario groups passed.
- WebKit: all 9 navigation scenario groups passed.
- Account wiring: all 4 scenario groups passed in each browser.
- Existing fonts, complete 60-entry glossary and uninterrupted audio/Quick Bible: all 13 Chromium groups passed.
- Real service-worker upgrade from 4.5.5 to 4.5.6: all 4 scenario groups passed, preserving synthetic notes, bookmarks, progress, four data/media caches and two download databases. The inherited textual log labels mention earlier reader versions; the recorded worker versions and actual registrations are 4.5.5 and 4.5.6.
- Source syntax, deterministic preparation, exact five-file scope and unchanged production account code passed. Actual screenshots showed no guide.

Standard GitHub Pages build/deployment run `35434440612`: SUCCESS for released main.
Live workflow `Verify Navigation v456 Live Main`: run `35434447047`, job `105874630530`, SUCCESS. Artifact `10581727914`.
- All five static files at the real main URL returned HTTP 200 and matched the released commit's SHA-256 hashes.
- All 9 navigation groups and 4 account-wiring groups passed on the actual live-served code in Chromium, with synthetic storage and every external account/service request mocked.
- Live URL: https://omideno7.github.io/new-hope7-app/ .

## Remaining scope
Consolidated notification activation, per-category notification choices, safe download management, advanced points, real-account/native release acceptance and the previously documented stale custom release-validator pins remain separate work items. The older custom workflow was not edited in this release; successful standard Pages deployment is not a claim that every legacy validator was repaired.

The old immutable Preview link stays an isolated historical test page. Use the main app for real account sign-in. Normal reopen/refresh is appropriate; do not uninstall or clear all app/site data to obtain this menu update.
