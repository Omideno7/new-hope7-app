# Batch 1 — repository architecture audit

Audit date: 2026-10-06 (Europe/Zagreb). Issue: [#108](https://github.com/Omideno7/new-hope7-app/issues/108).

## Scope and evidence boundary

Audited baseline `a177cdc7d995894868cf84bbe00c2dfa05ad6e25` on `codex/batch-1-repository-audit`, matching the issue and `build/android-2.5.0-corrected-25002`. All path evidence below refers to that commit unless a branch is explicitly named. This is static inspection plus existing read-only validators. No production network calls, browser app startup, SQL execution, release build, workflow dispatch, account action, deletion or functionality change occurred. Admin, Testimony and Prayer Request are inventoried only; their implementation and database objects remain assigned to the other agent. No AGENTS.md was found in the checkout or its workspace ancestor.

Classification: ACTIVE = directly wired or build-consumed; LEGACY = historical/superseded implementation evidence; SAFE TO REMOVE = candidate requiring separate approval and retention checks; NEEDS REVIEW = reachability, purpose or deployment state uncertain. No deletion is recommended solely from a filename or missing index reference. Dynamic loaders, worker caches, direct URLs, native packaging and old installed clients must also be checked.

## Architecture and source split

The root is a static browser/PWA site. `index.html` loads global compatibility scripts, CSS layers and `js/app.js` as an ES module. That module owns route rendering, localization, cloud transport, Bible, school, account, audio and local persistence. Extensions patch globals, delegated events, fetch and rendered DOM. There is no root package manifest, lockfile, bundler or framework build step.

The Android workflow builds **`android-release-25002/www`**, not the root index. Its 384 tracked files occupy 94,833,022 bytes (uncompressed). Against matching root-relative files: 340 byte-identical, 24 different, 20 payload-only. Thus it is a release source snapshot with platform adaptations, not disposable generated output. Its validator reaches 70 JavaScript modules and checks 108 entry assets. Root js has 198 files / 3,017,647 bytes, css 57 / 378,764 bytes, data 40 / 46,549,058 bytes, public 25 / 41,959,315 bytes; 935 tracked files total at baseline.

`a177cdc` changes only the native payload's `js/nh7-finalqa-v558.js` to make Android scroll setup idempotent. Its Android-only overscroll override preserves overflow/position rules. Do not replace that file with the root copy. The older handoff `docs/NEXT_NATIVE_STORE_RELEASE_HANDOFF_20261003.md` says latest main is canonical; the later issue explicitly selects the corrected-build SHA for this audit. Resolving future release source policy is an owner decision (R01).

## Component map

| Component | Classification | Evidence and responsibility |
| --- | --- | --- |
| Web entry | ACTIVE | Root `index.html`, `manifest.json`, `js/app.js`; static module/global-script startup and `#view` route rendering. |
| Mobile release entry | ACTIVE | `android-release-25002/www/index.html`, `www/js/app.js`; version 2.5.0, native service-worker guard, payload-only search/community/exam modules. |
| Public download entry | ACTIVE | `app/index.html`, `app/download-worker-v1.js`, root worker import; app-store landing, separate from main SPA. |
| Auxiliary entries | NEEDS REVIEW | `reset-password.html`, `certificate.html`, `certificate-v239.html`, `verify-document.html`, `support.html`, `privacy.html`, `books-review.html`, `minister-library-code.html`; public/direct entry points must be checked independently of index reachability. |
| Phone/tablet/foldable | ACTIVE | Payload `css/nh7-tablet-v530.css` uses min-width:600px despite a comment mentioning 768px; `js/nh7-finalqa-v558.js` Android overscroll fix; `upgrade_smoke.py` tests real touch swipe at phone and unfolded viewport. Root lacks tablet stylesheet. Actual Samsung hardware is untested here. |
| Android native build | ACTIVE | `.github/workflows/android-25002-corrected.yml`, `android-release-25002/package.json`, `capacitor.config.json`, `configure_android.py`, `patch_native_push_compat.py`; generated wrapper uses package com.omideno7.newhope7, Node 22, Java 21, API 36, min SDK 24, release shrink/minify, versionCode 25002. Native Android source/Gradle project is generated in CI, not checked in. |
| iOS wrapper | NEEDS REVIEW | Absent from selected tree; `agent/ios-capacitor-239:ios-wrapper/package.json` and verify-ios-wrapper workflow contain useful native preparation/entitlement/build logic. macOS/Xcode required; no iOS build or entitlement verification here. |
| Admin implementations | ACTIVE / LEGACY / NEEDS REVIEW | `admin.html`, `admin-v239-stable.html`, master and versioned redirect/test entries; inventory appendix below. Deployment workflow asserts stable Admin wiring, but external/direct use of every alternate entry is unknown. No edits or functional tests. |
| Service worker chain | ACTIVE | Root `service-worker.js` imports stream bypass, fresh navigation, download landing worker, release core, offline v329 and path fix in order. Payload has its own worker and release-core copy; native index guards registration. First-handler precedence matters. |
| Older worker | LEGACY | `sw-offline-v328.js` retained beside v329; selected service-worker.js imports v329. Verify old deployments/cache consumers before removal. |
| Supabase client | ACTIVE | `js/app.js` SUPABASE_CONFIG and authRequest/cloudRequest/Edge transport use fetch to /auth/v1, /rest/v1 and /functions/v1; `nh7-security-core-v340.js` wraps fetch to constrain learner operations. Public client keys are not service-role secrets. Live RLS/deployment state not audited. |
| Edge Functions | ACTIVE / NEEDS REVIEW | Checked-in functions: nh7-school-media-access, nh7-send-notifications, nh7-admin-ai-v490, nh7-admin-messaging-v360. Client deletion references nh7-delete-my-account-v252 absent from these sources (R06). Checked-in presence does not prove deployment. Protected-area endpoints inventory only. |
| Push / OneSignal | ACTIVE | Root index loads Web SDK v16, push/OneSignalSDKWorker.js; native index omits web SDK and payload nh7-push-account-bind-v364.js binds native account; package onesignal-cordova-plugin 5.5.3 patched for pre-Chrome-85 callback syntax. Notification scheduling in nh7-notifications-zagreb-v334.js and Edge notification sender. |
| Audio / player | ACTIVE | nh7-audio-classic-v484.js engine, nh7-audio-miniplayer-v487.js, nh7-media-player-v500.js UI, nh7-audio-library-v500.js, sermon list/social patches and native filesystem transfers in app.js. Multiple active layers are not interchangeable duplicates. |
| Bible / reader | ACTIVE | app.js, data/bible/groups, nh7-bible-keywords-v451.js, reader-toolbar-v452, original-language-v453, fonts/quick-Bible-v454; Bible storage, verse tools, reading plans and grouped data. Apocrypha v270/reader runtime uses large preview-named data; the filename does not establish abandonment. |
| School | ACTIVE | app.js, nh7-school-path-v351.js, school-exam-v344, school-drafts-v468, school-media-session-v262 and security-core; server-approved content and exams. data/school/school_content.json intentionally ships no protected lessons, validated by guard. |
| Profile / account | ACTIVE | app.js account renderer/session helpers, settings-account-v252, delete-account-v253, auth-recovery-v342; local session namespace preserved. Destructive account flow was only read. |
| Themes / fonts / localization | ACTIVE | EN/FA/HR dictionaries in app.js and extension L helpers; index langSelect; fonts/v453 and v454 license/manifest assets; theme-studio-v453, appearance-personalization-v514, icons-v517 and accumulated CSS. Root also requests many Google fonts. |
| Search | ACTIVE | Root app.js Bible search; payload nh7-global-search-v540.js imported by payload app.js adds notes/saved Bible/audio search, nh7-exam-review-v540.js adds exam review. Global search absent from root tree (R01/R04). |
| Offline / download / storage | ACTIVE | offline-core-v327, persistence-v323, playback-bridge-v332, data-v422; sw-offline-v329 IndexedDB/media/cache stores; app.js native Filesystem/FileTransfer DATA downloads and metadata; localStorage notes/progress and cloud queue. Storage namespaces and cached signed media need upgrade testing. |
| Deep links | ACTIVE / NEEDS REVIEW | sermon-social-v443 openShared parses ?sermon UUID and retries DOM navigation; spiritual-plans-v412 parses ?open=plans; auth-recovery-v342 parses query/hash tokens; Bible navigation and sharing in app.js/reader-toolbar. Native universal/custom scheme handling cannot be established from generated Android config alone. |
| Settings | ACTIVE | settings-controller-v403, settings-account-v252, delete-account-v253 plus app.js; earlier settings-controller-v399 and feedback-v398 require reachability review. |
| CI/CD | ACTIVE / LEGACY / NEEDS REVIEW | deploy-pages.yml validates and deploys main only; android-25002-corrected.yml builds only the corrected build branch; next-native-optimization-guard.yml checks PRs to main. Older validate-wave1*/audio/admin workflows and apply-admin-* are inventoried below; do not dispatch mutation helpers. |
| Build outputs / generated assets | NEEDS REVIEW | Android www is build input; CI native-release/, out/*.aab, qa APKs, manifests and AAB parts are generated outputs, not baseline tracked binaries. qa/ and validation/ are historical evidence, not proof of current validation. No tracked .apk/.aab/.ipa found. |

## Cleanup, dependencies and assets

- LEGACY candidates: older settings-controller-v399, book-reader-v281, school-path-v350, audio-classic-v400 and offline-playback-bridge-v326 coexist with newer index-linked versions. Confirm worker/import/direct/native references before promotion to SAFE TO REMOVE. Presence in the Android copy means even inactive code may still be packaged.
- NEEDS REVIEW: apocrypha-preview-v240 and preview-named JSON, stage1/test Admin HTML and cover experiment; historical names do not prove dead code. Disabled book-reading-telemetry-v490 is explicitly forbidden in the active index by deploy-pages.yml; backend compatibility and historical QA expectations remain relevant.
- SAFE TO REMOVE candidate: redundant `assets/admin-icon.png` / `assets/admin-icon-512.png` have identical bytes; only a future reference/manifest/native asset review could consolidate them. Both remain untouched. Android/root byte-identical copies are intentional release inputs, not removal candidates.
- Largest JSON: Bible groups 01_18 = 14,532,045 bytes; 19_39 = 9,109,588; 40_66 = 7,645,212; Apocrypha preview runtime = 8,820,735. Each also ships in Android. Public morning-prayer/001.m4a = 5,626,062 bytes. These are oversized/performance review candidates, not established unused assets. Large Bible files support runtime features.
- Repeated utilities: per-extension EN/FA/HR L helpers, HTML escaping, localStorage parsing, Supabase constants/session extraction. app.js and delete-account-v253 implement separate session refresh paths (R07). Shared utility extraction is a future coding task, not part of this audit.
- Package review: only Android package.json exists in this baseline; all eight direct dependencies/devDependencies are exact-pinned but no lockfile is tracked. Runtime Filesystem/FileTransfer/LocalNotifications/OneSignal and build CLI/assets have explicit consumers, so none is proven unnecessary. Transitive dependencies remain unassessed without a lockfile/install. Root CDN Mammoth 1.12.0, OneSignal web v16, Google Fonts and remote document/PDF helpers have network and trust cost. Do not remove without feature/usage tests. iOS branch uses different versions/ranges and additional native plugins; review separately.

## Validation and reproduction

From checkout root, on Node v24.19.0 / Python 3.12.14:

```
python3 android-release-25002/validate_payload.py android-release-25002/www
python3 scripts/validate_next_native_optimization_guard.py
```

Both passed. Payload result: status PASS, 108 entry assets, 70 active JavaScript modules, retired analytics absent, global storage wipe absent. Guard checks static source invariants. These results do not demonstrate browser rendering, push delivery, live authorization, native emulator/device compatibility or a new build. No dependency installation is required for this read-only audit workflow. Builds, production-facing tests and older mutation scripts are intentionally unrun within the issue's safety boundary.

Before a future draft PR, ensure its base is `build/android-2.5.0-corrected-25002` at the specified SHA: main lacks the 391-file corrected-build addition. A main-targeted PR from this audit baseline would include non-documentation changes. Any retarget/rebase requires a separate scope decision.

See [risk register](BATCH1_RISK_REGISTER.md) for evidence-backed risks and [complete branch inventory](BATCH1_BRANCH_INVENTORY.md) for all historical refs. Candidate status never authorizes removal.

## Admin entry inventory (no implementation changes)

- `admin-cover-test-v538.html` — NEEDS REVIEW alternate/historical entry; references `admin-manifest.json?v=2.3.6`, `https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js`, `https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js`, `https://cdn.jsdelivr.net/npm/tus-js-client@4.3.1/dist/tus.min.js`.
- `admin-master-v462.html` — NEEDS REVIEW alternate/historical entry; references inline implementation/redirect; inspect entry.
- `admin-master.html` — NEEDS REVIEW alternate/historical entry; references `./admin-v239-stable.html`.
- `admin-refresh.html` — NEEDS REVIEW alternate/historical entry; references inline implementation/redirect; inspect entry.
- `admin-reset-password.html` — NEEDS REVIEW alternate/historical entry; references inline implementation/redirect; inspect entry.
- `admin-stage1-clean-v240.html` — NEEDS REVIEW alternate/historical entry; references `js/admin-stage1-student-scroll.js?v=2.3.7-scroll-restored`, `js/admin-stage1-native-close-v239.js?v=2.3.9-native-link`.
- `admin-stage1-test.html` — NEEDS REVIEW alternate/historical entry; references `js/admin-stage1-student-scroll.js?v=2.3.7-scroll`, `js/admin-stage1-close-v238.js?v=2.3.8-portal-close`.
- `admin-v237.html` — NEEDS REVIEW alternate/historical entry; references inline implementation/redirect; inspect entry.
- `admin-v238.html` — NEEDS REVIEW alternate/historical entry; references inline implementation/redirect; inspect entry.
- `admin-v239-fix10.html` — NEEDS REVIEW alternate/historical entry; references inline implementation/redirect; inspect entry.
- `admin-v239-fix11.html` — NEEDS REVIEW alternate/historical entry; references inline implementation/redirect; inspect entry.
- `admin-v239-fix12.html` — NEEDS REVIEW alternate/historical entry; references inline implementation/redirect; inspect entry.
- `admin-v239-fix2.html` — NEEDS REVIEW alternate/historical entry; references inline implementation/redirect; inspect entry.
- `admin-v239-fix3.html` — NEEDS REVIEW alternate/historical entry; references inline implementation/redirect; inspect entry.
- `admin-v239-fix4.html` — NEEDS REVIEW alternate/historical entry; references inline implementation/redirect; inspect entry.
- `admin-v239-fix5.html` — NEEDS REVIEW alternate/historical entry; references inline implementation/redirect; inspect entry.
- `admin-v239-fix6.html` — NEEDS REVIEW alternate/historical entry; references inline implementation/redirect; inspect entry.
- `admin-v239-fix7.html` — NEEDS REVIEW alternate/historical entry; references inline implementation/redirect; inspect entry.
- `admin-v239-fix8.html` — NEEDS REVIEW alternate/historical entry; references inline implementation/redirect; inspect entry.
- `admin-v239-fix9.html` — NEEDS REVIEW alternate/historical entry; references inline implementation/redirect; inspect entry.
- `admin-v239-stable.html` — ACTIVE entry; references `js/admin-v2.3.9-clean-scroll-v300.js?v=${BUILD}`, `js/admin-v2.3.9-library-clean-v311.js?v=${BUILD}`, `js/admin-v2.3.9-apocrypha-catalog-v274.js?v=${BUILD}`, `js/admin-v2.3.9-apocrypha-text-only-v320.js?v=${BUILD}`.
- `admin-v239.html` — NEEDS REVIEW alternate/historical entry; references `admin-manifest.json?v=auto-refresh-r1`.
- `admin.html` — ACTIVE entry; references `admin-manifest.json?v=2.3.6`, `https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js`, `https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js`, `https://cdn.jsdelivr.net/npm/tus-js-client@4.3.1/dist/tus.min.js`.

## Workflow inventory

- `.github/workflows/android-25002-corrected.yml` — ACTIVE current build/validation/deployment; trigger/target evidence in this workflow; execution not performed.
- `.github/workflows/apply-admin-full-stability-v447.yml` — NEEDS REVIEW historical validation or Admin mutation helper; mutation helper: read only, never dispatched.
- `.github/workflows/apply-admin-listening-session-v451.yml` — NEEDS REVIEW historical validation or Admin mutation helper; mutation helper: read only, never dispatched.
- `.github/workflows/apply-admin-stability-v439.yml` — NEEDS REVIEW historical validation or Admin mutation helper; mutation helper: read only, never dispatched.
- `.github/workflows/deploy-pages.yml` — ACTIVE current build/validation/deployment; trigger/target evidence in this workflow; execution not performed.
- `.github/workflows/next-native-optimization-guard.yml` — ACTIVE current build/validation/deployment; trigger/target evidence in this workflow; execution not performed.
- `.github/workflows/validate-admin-v238.yml` — NEEDS REVIEW historical validation or Admin mutation helper; trigger/target evidence in this workflow; execution not performed.
- `.github/workflows/validate-audio-hotfix-23945.yml` — NEEDS REVIEW historical validation or Admin mutation helper; trigger/target evidence in this workflow; execution not performed.
- `.github/workflows/validate-wave1a-apocrypha.yml` — NEEDS REVIEW historical validation or Admin mutation helper; trigger/target evidence in this workflow; execution not performed.
- `.github/workflows/validate-wave1b-spiritual-plans.yml` — NEEDS REVIEW historical validation or Admin mutation helper; trigger/target evidence in this workflow; execution not performed.

## Entry-linked asset evidence

The following local script/style references are parsed directly from each index; lists establish direct wiring, not whole-program reachability. Module dependencies add further active code.

### `index.html`

- `css/styles.css` — ACTIVE direct entry reference.
- `css/v2.2.0.css` — ACTIVE direct entry reference.
- `css/v2.2.2.css` — ACTIVE direct entry reference.
- `css/v2.2.3.css` — ACTIVE direct entry reference.
- `css/v2.2.4.css` — ACTIVE direct entry reference.
- `css/v2.3.0-access-bible.css` — ACTIVE direct entry reference.
- `css/v2.3.4-my-notes.css` — ACTIVE direct entry reference.
- `css/nh7-book-reader-v280.css` — ACTIVE direct entry reference.
- `css/nh7-library-collections-v322.css` — ACTIVE direct entry reference.
- `css/nh7-secure-media-v270.css` — ACTIVE direct entry reference.
- `css/nh7-secure-media-watermark-v272.css` — ACTIVE direct entry reference.
- `css/nh7-apocrypha-v270.css` — ACTIVE direct entry reference.
- `css/nh7-spiritual-plans-v240.css` — ACTIVE direct entry reference.
- `css/nh7-appearance-v427.css` — ACTIVE direct entry reference.
- `css/nh7-bible-keywords-v450.css` — ACTIVE direct entry reference.
- `css/nh7-reader-toolbar-v452.css` — ACTIVE direct entry reference.
- `css/nh7-notes-categories-v452.css` — ACTIVE direct entry reference.
- `css/nh7-theme-studio-v453.css` — ACTIVE direct entry reference.
- `css/nh7-study-reader-v453.css` — ACTIVE direct entry reference.
- `css/nh7-fonts-quick-bible-v454.css` — ACTIVE direct entry reference.
- `css/nh7-header-date-v455.css` — ACTIVE direct entry reference.
- `css/nh7-navigation-v456.css` — ACTIVE direct entry reference.
- `css/nh7-theme-gallery-v457.css` — ACTIVE direct entry reference.
- `css/nh7-appearance-personalization-v514.css` — ACTIVE direct entry reference.
- `css/nh7-icons-v517.css` — ACTIVE direct entry reference.
- `css/nh7-player-volume-v521.css` — ACTIVE direct entry reference.
- `css/nh7-growth-v463.css` — ACTIVE direct entry reference.
- `css/nh7-celebrations-v464.css` — ACTIVE direct entry reference.
- `css/nh7-store-review-v469.css` — ACTIVE direct entry reference.
- `css/nh7-soul-winning-v472.css` — ACTIVE direct entry reference.
- `css/nh7-finalqa-v558.css` — ACTIVE direct entry reference.
- `js/nh7-security-core-v340.js` — ACTIVE direct entry reference.
- `js/nh7-qna-i18n-v341.js` — ACTIVE direct entry reference.
- `js/nh7-offline-startup-v327.js` — ACTIVE direct entry reference.
- `js/nh7-auto-update-v335.js` — ACTIVE direct entry reference.
- `js/nh7-notifications-zagreb-v334.js` — ACTIVE direct entry reference.
- `js/nh7-offline-core-v327.js` — ACTIVE direct entry reference.
- `js/nh7-offline-data-v422.js` — ACTIVE direct entry reference.
- `js/nh7-audio-route-stability-v423.js` — ACTIVE direct entry reference.
- `js/nh7-sermon-catalog-hotfix-v424.js` — ACTIVE direct entry reference.
- `js/nh7-access-bootstrap-v230.js` — ACTIVE direct entry reference.
- `js/nh7-auth-signup-guard-v343.js` — ACTIVE direct entry reference.
- `js/nh7-registration-canonical-v353.js` — ACTIVE direct entry reference.
- `js/nh7-school-registration-v342.js` — ACTIVE direct entry reference.
- `js/nh7-registration-final-guard-v401.js` — ACTIVE direct entry reference.
- `js/nh7-registration-repeat-guard-v402.js` — ACTIVE direct entry reference.
- `js/nh7-offline-playback-bridge-v332.js` — ACTIVE direct entry reference.
- `js/nh7-offline-persistence-v323.js` — ACTIVE direct entry reference.
- `js/nh7-auth-recovery-v342.js` — ACTIVE direct entry reference.
- `js/nh7-audio-classic-v484.js` — ACTIVE direct entry reference.
- `js/nh7-audio-miniplayer-v487.js` — ACTIVE direct entry reference.
- `js/nh7-finalqa-v558.js` — ACTIVE direct entry reference.
- `js/nh7-sermon-social-v443.js` — ACTIVE direct entry reference.
- `js/nh7-sermon-list-detail-v445.js` — ACTIVE direct entry reference.
- `js/nh7-audio-library-v500.js` — ACTIVE direct entry reference.
- `js/nh7-note-text-v501.js` — ACTIVE direct entry reference.
- `js/app.js` — ACTIVE direct entry reference.
- `js/nh7-settings-controller-v403.js` — ACTIVE direct entry reference.
- `js/nh7-settings-account-v252.js` — ACTIVE direct entry reference.
- `js/nh7-delete-account-v253.js` — ACTIVE direct entry reference.
- `js/nh7-app-enhancements-v230.js` — ACTIVE direct entry reference.
- `js/nh7-reader-toolbar-v452.js` — ACTIVE direct entry reference.
- `js/nh7-my-notes-v234.js` — ACTIVE direct entry reference.
- `js/nh7-my-notes-categories-v452.js` — ACTIVE direct entry reference.
- `js/nh7-book-reader-v283.js` — ACTIVE direct entry reference.
- `js/nh7-library-language-v321.js` — ACTIVE direct entry reference.
- `js/nh7-library-collections-v322.js` — ACTIVE direct entry reference.
- `js/nh7-school-media-session-v262.js` — ACTIVE direct entry reference.
- `js/nh7-secure-media-v270.js` — ACTIVE direct entry reference.
- `js/nh7-secure-media-fix-v271.js` — ACTIVE direct entry reference.
- `js/nh7-large-mov-native-fallback-v273.js` — ACTIVE direct entry reference.
- `js/nh7-secure-media-watermark-v272.js` — ACTIVE direct entry reference.
- `js/nh7-apocrypha-v270.js` — ACTIVE direct entry reference.
- `js/nh7-protected-audio-gate-v316.js` — ACTIVE direct entry reference.
- `js/nh7-ui-stability-v329.js` — ACTIVE direct entry reference.
- `js/nh7-push-account-bind-v362.js` — ACTIVE direct entry reference.
- `js/nh7-inbox-badge-sync-v418.js` — ACTIVE direct entry reference.
- `js/nh7-school-exam-v344.js` — ACTIVE direct entry reference.
- `js/nh7-school-path-v351.js` — ACTIVE direct entry reference.
- `js/nh7-spiritual-plans-v412.js` — ACTIVE direct entry reference.
- `js/nh7-fasting-practical-note-removal-v413.js` — ACTIVE direct entry reference.
- `js/nh7-theme-studio-v453.js` — ACTIVE direct entry reference.
- `js/nh7-original-language-v453.js` — ACTIVE direct entry reference.
- `js/nh7-fonts-v454.js` — ACTIVE direct entry reference.
- `js/nh7-appearance-personalization-v514.js` — ACTIVE direct entry reference.
- `js/nh7-icons-v517.js` — ACTIVE direct entry reference.
- `js/nh7-audio-quick-bible-v454.js` — ACTIVE direct entry reference.
- `js/nh7-media-player-v500.js` — ACTIVE direct entry reference.
- `js/nh7-header-date-v455.js` — ACTIVE direct entry reference.
- `js/nh7-celebrations-v464.js` — ACTIVE direct entry reference.

### `android-release-25002/www/index.html`

- `android-release-25002/www/css/styles.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/v2.2.0.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/v2.2.2.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/v2.2.3.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/v2.2.4.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/v2.3.0-access-bible.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/v2.3.4-my-notes.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-book-reader-v280.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-library-collections-v322.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-secure-media-v270.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-secure-media-watermark-v272.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-apocrypha-v270.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-spiritual-plans-v240.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-appearance-v427.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-bible-keywords-v450.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-reader-toolbar-v452.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-notes-categories-v452.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-theme-studio-v453.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-study-reader-v453.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-fonts-quick-bible-v454.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-header-date-v455.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-navigation-v456.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-theme-gallery-v457.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-appearance-personalization-v514.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-icons-v517.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-player-volume-v521.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-growth-v463.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-celebrations-v464.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-store-review-v469.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-soul-winning-v472.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-amen-theme-v531.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-plans-theme-v533.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-inbox-v542.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-global-search-exam-v540.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-tablet-v530.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-finalqa-v551.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-finalqa-v553.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-finalqa-v554.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-finalqa-v555.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-finalqa-v556.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-finalqa-v557.css` — ACTIVE direct entry reference.
- `android-release-25002/www/css/nh7-finalqa-v558.css` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-security-core-v340.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-qna-i18n-v341.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-offline-startup-v327.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-auto-update-v335.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-notifications-zagreb-v334.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-offline-core-v327.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-offline-data-v422.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-audio-route-stability-v423.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-sermon-catalog-hotfix-v424.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-access-bootstrap-v230.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-auth-signup-guard-v343.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-registration-canonical-v353.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-school-registration-v342.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-registration-final-guard-v401.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-registration-repeat-guard-v402.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-offline-playback-bridge-v332.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-offline-persistence-v323.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-auth-recovery-v342.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-audio-classic-v484.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-audio-miniplayer-v487.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-sermon-social-v443.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-sermon-list-detail-v445.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-audio-library-v500.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-note-text-v501.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-community-v502.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/app.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-settings-controller-v403.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-settings-account-v252.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-delete-account-v253.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-app-enhancements-v230.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-reader-toolbar-v452.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-my-notes-v234.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-my-notes-categories-v452.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-book-reader-v283.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-library-language-v321.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-library-collections-v322.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-school-media-session-v262.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-secure-media-v270.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-secure-media-fix-v271.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-large-mov-native-fallback-v273.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-secure-media-watermark-v272.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-apocrypha-v270.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-protected-audio-gate-v316.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-ui-stability-v329.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-push-account-bind-v364.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-inbox-badge-sync-v418.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-school-exam-v344.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-school-path-v351.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-spiritual-plans-v412.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-fasting-practical-note-removal-v413.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-theme-studio-v453.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-original-language-v453.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-fonts-v454.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-appearance-personalization-v514.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-icons-v517.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-audio-quick-bible-v454.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-media-player-v500.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-header-date-v455.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-celebrations-v464.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-finalqa-v553.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-finalqa-v554.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-finalqa-v555.js` — ACTIVE direct entry reference.
- `android-release-25002/www/js/nh7-finalqa-v558.js` — ACTIVE direct entry reference.
