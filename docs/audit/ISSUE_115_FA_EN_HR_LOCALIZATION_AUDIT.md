# Issue #115 — active-runtime FA / EN / HR audit

## Baseline and boundaries

Started from current `main`, `b67a4c6e72be57f78869426f5d1f0cebb3f7befc`, rather than the issue's older `c4b5e50` baseline. Rechecked origin/main before publishing. Branch: `codex/issue-115-full-i18n-audit`. Issue #116 is outside this work.

Reviewed the 78 active/dynamically loaded user runtime modules, entry HTML and release/offline wiring. Existing `T`/`tr`, `L` and `l223` patterns remain the translation mechanisms. No new active runtime file was added.

No schema, migrations, RLS, Storage policies, production data, auth logic, school progression, testimony deletion/cleanup, notification delivery, audio engine or profile-photo persistence changes. Admin files, Global Search implementation, Bible deep-link implementation, Inbox final-QA module, note/progress/favorite/download persistence modules remain unchanged. UI copy updates in shared modules do not change their transport or persistence handlers.

## Screen coverage

| Area | Audit / changes |
| --- | --- |
| Home / navigation / Search | Existing trilingual Home/search retained; localize shell accessible names and loading template. Exact-result search regression tested. |
| Profile / account | Localized crop Zoom; update open crop heading/help/buttons without replacing canvas or zoom. Home profile language participates in presentation signature. Existing account labels retained. |
| Appearance / themes | Croatian theme/style names; trilingual manual/system/day-night, reading surfaces and NEW/Close/Reset. Open dialog copy refresh preserves input nodes, listeners and unsaved values. Existing v515 adapter retained. |
| Audio / player | Localized Audio eyebrow, play/pause and seek/accessibility controls, device volume guidance and captions. UI adapter labels engine-rendered controls; playback engine is unchanged. |
| Bible / reader / notes / saved verses | Verse toolbar, clear-highlight/color labels, document frame title and Apocrypha note/retry localized. Book reader controls refresh in place with original document direction/content preserved. Existing note/saved-verse tools retained. |
| Daily sections / spiritual plans | Existing Daily Word, Faith, Juice, message and spiritual-plan helpers reviewed; existing translations retained. Six trilingual spiritual-plan checks pass. |
| Inbox | Existing v558 presentation and localized empty/loading/read/delete UI retained. Timestamp/read/delete and delivery modules unchanged. |
| School | Existing lesson/assignment/exam/status helpers reviewed; missing `exam` and empty access-code dictionary entries supplied. Progression/auth/assignment handlers unchanged. |
| Salvation / Christian dedication | Existing localized forms retained. Soul tracker and original-language study eyebrows localized. |
| Settings / errors / empty states | Notification permission enums get localized display labels; offline errors and download/remove confirmations gain Croatian; legacy settings error heading and Apocrypha retry copy localized. |
| Testimonies / Prayer Requests | **Unavailable on this main:** no active user routes/modules for these features. Route requests fall back to Home. Protected Admin features were not altered and feature-branch implementations were not imported. Their user UI requires a subsequent audit when present on main. |

## Changed files

| File | What changed |
| --- | --- |
| `index.html` | Accessible shell names, loading template and localized-script/worker refresh query parameters. |
| `js/app.js` | Missing dictionary entries, shell RTL/LTR, aria/template localization, verse/document/audio labels and Croatian offline confirmations/errors. |
| `js/nh7-apocrypha-preview-v240.js` | Note marker accessible name. |
| `js/nh7-apocrypha-v270.js` | Friendly trilingual load error and retry. |
| `js/nh7-appearance-i18n-v515.js` | Invoke original dialog's in-place copy refresh. |
| `js/nh7-appearance-personalization-v514.js` | Theme/style/reading-mode/control translations and dialog-copy refresh. |
| `js/nh7-audio-library-v500.js` | Localized Audio eyebrow. |
| `js/nh7-audio-miniplayer-v487.js` | Mounted control accessible names and volume guidance refresh. |
| `js/nh7-book-reader-v283.js` | Font-control aria labels and in-place reader UI copy/direction refresh. |
| `js/nh7-media-player-v500.js` | Full/mini player control labels, volume guidance and direction refresh. |
| `js/nh7-original-language-v453.js` | Study eyebrow. |
| `js/nh7-profile-photo-v564.js` | Zoom and open-editor presentation refresh; no save/crop/persistence changes. |
| `js/nh7-secure-media-v270.js` | Subtitle option labels. |
| `js/nh7-settings-account-v252.js` | Display-only notification permission labels. |
| `js/nh7-soul-winning-v472.js` | Soul tracker eyebrow. |
| `js/nh7-theme-studio-v453.js` | Personal eyebrow. |
| `js/nh7-ui-stability-v329.js` | Accessible labels for engine-created controls and localized legacy error heading. |
| `service-worker.js` | Import refresh parameter. |
| `sw-release-core-v403.js` | UI refresh comment changes imported worker bytes so existing install recaches assets; cache names/version/behavior remain unchanged. |
| `scripts/verify-i18n-v115.cjs` | Isolated browser localization and preservation regression check. |
| `docs/audit/ISSUE_115_FA_EN_HR_LOCALIZATION_AUDIT.md` | Scope, findings, evidence, exclusions and blockers. |

## Validation

- All 78 active/dynamic modules pass JavaScript syntax checks; no captured browser page errors.
- All four current `deploy-pages.yml` validation steps pass: runtime syntax, current app/offline wiring (159 assets), Admin AI/report wiring, HTML inline scripts/JSON.
- Next-native optimization guard passes. Dictionary keys are present/nonempty across FA/EN/HR.
- Read-only local validation steps across all nine workflows: **15 pass, 6 fail, 7 excluded mutation/live-service steps**. The six failures reproduce on untouched baseline main: wave1b old audio-loader wiring; wave1a old stable-release signatures; v447 old Admin version; v451 old release/cache signatures; audio23945 removed signed-loader assumption and old release metadata. They are pre-existing historical release checks, not green checks.
- Standalone `verify-auth-hotfix-v348.mjs` and `verify-admin-rbac-v350.mjs` both fail their obsolete 2.3.9.40 version assertion, identically on baseline main.
- Admin apply/commit steps and Pages deployment were deliberately not run. The historical live Edge authentication/CORS request was not run; no production credentials or production-service verification.
- Browser cycle **FA → EN → HR → FA** on 11 representative routes: Home, account, settings, Bible, Daily, School, Salvation, Inbox, More, Audio and soul tracker. Persian HTML/body RTL; EN/HR LTR; no Persian-only visible controls in representative EN/HR screens (native language name excluded).
- Open appearance dialog keeps original input/control nodes and unsaved custom color. Photo picker/crop maintains canvas identity/pixels and zoom. Mounted mini/full player labels update without playback. Book reader retains original article and search while its controls update.
- Exact search result opens John 3:16, retains verse target across language cycle and generates native share payload containing 3:16.
- Seeded account/profile, note/saved-verse, school progress/assignment, favorite and download-metadata values remain byte-identical. These fixtures check switching safety, not real production datasets.
- `git diff --check` passes.

Reproduce browser test: serve repository root with `python3 -m http.server 8765 --bind 127.0.0.1`, then `node scripts/verify-i18n-v115.cjs`. Requires available Playwright and Chromium (default `/usr/bin/chromium`; environment overrides are supported). Test intercepts all nonlocal requests, including background writes, and blocks service workers. It never plays audio, saves a profile photo, changes real assignments or reaches Production.

## Intentional untranslated material and limitations

Brand/product/font names (New Hope 7, YouTube, font family names), EN/FA/HR and native language endonyms, technical formats/units (MP3, PDF, CC, MB), version strings, Bible references, numeric time/rate notation and symbolic controls retain their identifiers. User notes, names, search queries, published scripture/book/audio/lesson content and server-provided content/messages are data, not newly translated UI. Content language follows the existing published data/document selection; switching reader chrome does not translate or replace a loaded document. Technical console diagnostics remain diagnostic text.

Full acceptance cannot be asserted for absent Testimony/Prayer user screens, real remote content, hardware-specific volume/audio or native-device/offline update behavior. No live Supabase, authentication, notification or photo-persistence test was performed. Existing historical CI failures are recorded rather than changed under this localization scope. Croatian wording should receive native-speaker review. PR is for review only; no automatic merge or deployment.
