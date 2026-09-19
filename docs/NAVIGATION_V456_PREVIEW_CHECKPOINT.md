# Navigation v4.5.6 Preview checkpoint — 19 September 2026

## Status and exact source

Repository: Omideno7/new-hope7-app.
Tested runtime commit: `a15365d1eaf05225a322670c58f10a4401602fbe`.
Feature branch: `feature/navigation-cleanup-v456-20260919`.
Main baseline: `08d3bfb51532163392fe87cd017e316327c38234` (localized header date v455).
This phase has NOT been merged into main or deployed to the main app. Main-before and main-after snapshots match. No production database changes or native store builds/submissions were performed.

Verified immutable Preview:
https://rawcdn.githack.com/Omideno7/new-hope7-app/a15365d1eaf05225a322670c58f10a4401602fbe/navigation-preview.html

The hosting provider displayed an Open the page notice in the public test. Follow that button, then Amen. This is a menu/navigation Preview, not a signed-in production environment.

## Navigation changes

Six generic duplicate shortcuts were removed from the menu renderers; the destinations themselves still exist.

- Home no longer repeats the generic Bible, Plans and School tiles. Their canonical entries remain in the unchanged six-item bottom bar.
- Church Meetings stays on Home as one full-width tile. Its duplicate More tile was removed.
- Gratitude Course stays under Daily. Its duplicate More tile was removed.
- Inbox stays in the top bar with its existing unread badge. Its duplicate More tile was removed.
- More retains Audio Messages, Need Salvation, Q&A, Account, About and Settings. The existing Videos and visual media tile is still injected and visible; it was not removed.
- A collapsed, three-language location guide in More explains where School, Bible, Plans, Gratitude, Meetings and Inbox are. It contains no duplicate navigation buttons.
- Contextual controls such as Continue today, daily reading shortcuts, note/source navigation, registration links and Back are intentionally preserved. These are not generic duplicate module tiles.

## Additional navigation bug fixed

The first full-app test exposed an existing stale-response race: after opening Meetings and switching rapidly to More, the late Meetings lookup could replace the newer More view. A memory-only render epoch now prevents late Meetings markup and stale post-render/error callbacks from winning over a newer navigation. Meeting access checks, approval rules, request payloads and stored data are unchanged.

The final test deliberately delayed registration-related requests, navigated to More before completion, then verified that More and its active bottom-bar item remained after those requests finished.

## Verification

Successful workflow: Navigation Cleanup v456 QA, run `35432887941`, job `105870482114`.
Artifact: `10581965462`, navigation-v456-952da1e2ee2be7773c58466cac02ddb636eb9cfe.

- Baseline menu inventory was captured from the exact main commit before testing the candidate.
- Chromium: 9 scenario groups passed.
- WebKit: 9 scenario groups passed.
- Existing fonts, 60 explained lexicon entries and uninterrupted audio/Quick Bible regression: all 13 Chromium groups passed.
- Isolated local Preview: 9 checks passed.
- Actual immutable public Preview: 9 checks passed.
- Menu destinations were checked in Persian, English and Croatian; layouts at 320, 390, 768 and 1280 pixels in light and dark; keyboard operation of the guide; repeated navigation and reload.
- Existing synthetic notes, Bible bookmarks, Apocrypha/sermon notes, course progress, unread inbox message and notification preference were preserved.
- External services were intercepted in the full-app browser tests: zero real production API calls. Private audio still showed the existing guest access gate.
- Source syntax, preparation idempotence and corpus/backend/native-file nonchanges passed. Screenshots of actual Home/More and the public Preview were visually reviewed.

## Safety and scope boundaries

The deployable UI change currently concerns `js/app.js`, `index.html` and `css/nh7-navigation-v456.css`. Preview/test files must be excluded from any future main integration, with release-cache/version wiring updated and integration checks run separately.

The navigation Preview uses `nh7_preview_nav_v456:` namespaces for both localStorage and sessionStorage. Existing unprefixed storage remains untouched. External/write fetches are blocked, service workers are disabled, and real account operations, notification activation and downloads are disabled. No real login is needed. Private-content access and final native behavior are not demonstrated by this Preview.

Notification controls were deliberately not redesigned in this phase: Home activation and the existing Settings controls remain as before. Consolidating activation and adding per-category notification choices remain the next notification work item. Safe download counts/size/removal, advanced points and the older custom release validator are still separate pending tasks.

Next checkpoint: user reviews the revised Home and More menus on the phone before the limited runtime integration. Do not merge the entire feature branch or claim this phase is already in main.
