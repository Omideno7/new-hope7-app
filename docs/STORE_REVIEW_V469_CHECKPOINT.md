# Store reviews v469 — direct More-menu preview, 19 September 2026

## Latest user decision

Use one entry in **More**, labelled **«شرکت در نظرسنجی»** in Persian, **Rate & review** in English and **Ocijenite aplikaciju** in Croatian. Do not put a review card in Settings. No theme picker or separate local five-star/comment form. On iPhone/iPad a tap goes directly to this app's App Store review page; on Android it goes directly to this app's Google Play listing. The real stars and review are entered at the store. No intermediate app screen on mobile. The app continues using its existing selected theme; changing the theme is not part of this feature.

The previous Settings-card preview at 7dffc71013f28768bfeffddadf4cf568b105ff30 is SUPERSEDED. Do not deliver or merge that version. The current preview also has no theme or language selectors. Its URL may use ?lang=en or ?lang=hr for localization QA, but those controls do not appear in the page.

## State

Production main remains `2bde658268eeaed0e7873c83aa7fb54c1d37fc8f`.
Branch: `feature/store-review-v469-preview-20260919`, draft PR #30.
Verified More-menu candidate: `414f57d982d6205ab2811774731a6a86ba726a17`.
Phone preview: https://rawcdn.githack.com/Omideno7/new-hope7-app/414f57d982d6205ab2811774731a6a86ba726a17/store-review-preview.html

The preview uses the actual source-extracted More renderer. Only the new review entry is active; the other seven routes are visibly disabled and a short preview-only note explains that. No authentication, School data, production API, service worker or notification code is loaded. No real rating needs to be submitted to check navigation.

Unknown/desktop platforms use one inline expandable entry offering App Store and Google Play, without guessing which store the visitor uses. Mobile platforms have an ordinary external anchor, not a JavaScript redirect or a new app route. These links never report a submitted review merely because the store opened. Offline state gives a translated message and waits for another tap; reconnect does not launch the store.

Destinations:
- https://apps.apple.com/app/id6803187205?action=write-review
- https://play.google.com/store/apps/details?id=com.omideno7.newhope7

## Tests

Successful workflow: **Store Review v469 More Preview QA**, run `35459265394`, job `105940051443`.
Artifact `10589706653`, name `store-review-v469-more-qa`.
All 14 Chromium/WebKit scenario groups passed: original seven More routes plus one new entry; FA/EN/HR; direct single-tap iOS/Android links with exact IDs; no intermediate route or Settings card; iPad/native detection; desktop inline choice; translated offline handling; no auto-open; inheritance of existing tile colors in 14 themes x 3 languages; 120% text at 320/390/768 widths; keyboard and repeated navigation; no preview controls; preserved session/draft/notes/points/download sentinels.

The actual app.js is checked to differ from production ONLY by the import and the mount call in more(). Settings and School code remain exactly unchanged. Existing draft, audio, theme, calendar and native metadata files are unchanged. Cache tests preserved four protected stores and verified eight versioned runtime routes. Public preview HTML/JS/CSS all returned HTTP 200 with exact tested bytes and correct MIME. The WebKit Persian More screenshot was visually inspected.

These are synthetic browser tests with intercepted store pages, not a claim of physical native-store handoff. Phone approval is still required. No user reviews were posted and no Supabase operations occurred.

## Six runtime files for later clean integration

Use the tested commit above; recheck main and create/reuse a current rollback point first. Do not merge the whole preview branch.

- js/app.js — `7801db08a22531f870d4d04c2d4266b11cac9920`
- index.html — `f59a58165c2993f14c06eb9568cf91536f552d20`
- service-worker.js — `d6efe766a8aa935fd49ca71439095ec914fcfc29`
- sw-release-core-v403.js — `3417c60f57c0135d6ca2a2854730f3fcc34c50a4`
- js/nh7-store-review-v469.js — `f45b44fef22a53f731bb1b5d44402d503c71f24f`
- css/nh7-store-review-v469.css — `28319e222419e02004655ef2ced000069b9278f4`

Exclude preview HTML/JS, docs, scripts, workflows, tests and sample data. Preserve v468 draft recovery, all accepted student work, old School UI, working audio, birthday/calendar and 14 themes. Rejected School redesigns, alternate unapproved audio/session changes and Chat remain excluded. No store/native package has been built or submitted.

## Primary guidance rechecked

Apple https://developer.apple.com/documentation/StoreKit/requesting-app-store-reviews describes the user-initiated action=write-review link. Google https://developer.android.com/guide/playcore/in-app-review recommends the Play Store link for explicit buttons instead of a quota-limited native review prompt. This feature implements the direct-link approach only, without a custom star picker, review incentives or positive-review filtering.
