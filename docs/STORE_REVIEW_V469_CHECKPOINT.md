# Store rating and review v469 — verified phone preview

Date: 19 September 2026. Repository: Omideno7/new-hope7-app.

## User request and status

The user authorized completing the optional store review/rating feature before continuing. Previously approved School layout, student progress, draft recovery, audio, themes and calendar must remain intact; Chat stays deferred. This feature is for the USER APP, not the admin panel.

Main baseline: `2bde658268eeaed0e7873c83aa7fb54c1d37fc8f`.
Feature branch: `feature/store-review-v469-preview-20260919`.
Tested candidate commit: `7dffc71013f28768bfeffddadf4cf568b105ff30`.
Phone preview: https://rawcdn.githack.com/Omideno7/new-hope7-app/7dffc71013f28768bfeffddadf4cf568b105ff30/store-review-preview.html

Status: complete, browser-tested candidate with a publicly verified isolated phone preview. Not merged to main; no native/store build submitted. Phone approval and actual iPhone/Android store handoff remain the release gate.

## User experience

A permanent optional 'Rate & review' card in More -> Settings, above the existing version footer. Persian title: «امتیاز و نظر شما». FA/EN/HR text invites honest feedback and explains that the actual rating/comment is entered at the store. iPhone/iPad selects App Store; Android selects Google Play; unknown/desktop devices receive both choices. No custom star input or rating pre-screen, no automatic popup, no rewards and no connection to School access or Growth points.

Official configured destinations:
- https://apps.apple.com/app/id6803187205?action=write-review
- https://play.google.com/store/apps/details?id=com.omideno7.newhope7

A normal user-initiated external link opens the store; a detected offline state gives a translated inline message and waits for a fresh tap. Reconnecting does not open a store automatically. No success claim is made on returning: the app cannot infer whether a review was submitted. No new native plugin or automatic StoreKit/Play review bridge is assumed.

The card follows all 14 current Theme Studio palettes, supports RTL and larger fonts, has keyboard focus and respects Reduce Motion. It does not read or write profiles, notes, drafts, points, grades or downloads and performs no automatic network requests. Existing Settings controls remain in place. app.js changes are strictly one import, one empty host before the footer and one synchronous mount call in settings().

## Verification

Successful workflow: `Store Review v469 Preview QA`, run `35455907882`, job `105931002577`.
Artifact: `10588042716` (`store-review-v469-preview-qa`).
All 16 Chromium/WebKit scenario groups passed: 3 languages, platform variants including iPad desktop UA and native platform detection, no local rating control, actual source-extracted Settings function and unchanged controls, exact destinations/opener isolation, no false success, offline/reconnect behavior, 14 palettes x 3 languages, four widths at 120% text size, contrast, keyboard access, Reduce Motion, repeated mounting, and isolated preview language/theme controls. Tests preserved account/School/draft/points/note/download sentinels and the existing textarea. The full app source was checked to differ only by the three additive Settings hooks; core School/audio/theme/calendar/draft modules and native metadata match main exactly.

The cache upgrade test used the actual release-core JS and preserved four personal/media/data cache sentinels while checking eight versioned runtime routes including existing School draft recovery. This is a simulated browser cache, not a device database migration.

The immutable public preview HTML, preview JS, runtime module and stylesheet all returned HTTP 200, correct content types and exact tested bytes. WebKit screenshots in the Hope and Aurora themes were visually inspected. Browser tests intercepted store navigation with synthetic pages: they did not contact a real review form or post reviews. Existing external Google-font imports were stubbed in automated fixtures. Native device/store handoff is not claimed tested until the owner checks it.

## Release paths and exact blob identities

Select only these six runtime paths after phone approval, using the tested commit as source and a fresh main/rollback check:

- js/app.js — `3c2a791200b9d6a957a883bc40a5f15c9f44dc6d`
- index.html — `f59a58165c2993f14c06eb9568cf91536f552d20`
- service-worker.js — `d6efe766a8aa935fd49ca71439095ec914fcfc29`
- sw-release-core-v403.js — `3417c60f57c0135d6ca2a2854730f3fcc34c50a4`
- js/nh7-store-review-v469.js — `5eaee4270e241bee3db603302e667e50df4b4060`
- css/nh7-store-review-v469.css — `6ff324c9087cfa7c03a5255ad0e7c269d85c10cf`

Exclude store-review-preview.html, js/nh7-store-review-preview-v469.js, scripts, workflows, QA fixtures and this checkpoint document from runtime-only integration. Do not merge the entire preview branch. Preserve v468 draft recovery and do not introduce the rejected School redesign or the separate unapproved audio/session candidate. No Supabase change is needed. Main/store version remains untouched until approval.

## Primary implementation guidance checked on 19 September 2026

Apple, Requesting App Store reviews: https://developer.apple.com/documentation/StoreKit/requesting-app-store-reviews
Apple, App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
Google, Play In-App Reviews: https://developer.android.com/guide/playcore/in-app-review

Both platforms distinguish optional persistent store links from quota-controlled native review requests. This candidate implements the explicit button/link approach only; it does not simulate a native automatic review sheet or claim it exists in the current wrapper.
