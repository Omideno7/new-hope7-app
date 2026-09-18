# Reader v4.5.2 main release — 19 September 2026 (Europe/Zagreb)

## Result

The user confirmed that the Reader Preview worked correctly on their device and explicitly approved adding it to the main app.

- Repository: `Omideno7/new-hope7-app`.
- Previous main: `569f94080131bf91d64cf7a66684c1159c823d62`.
- Phone-approved Reader source: `0554e87363b1bb979f8edaf8609402db08bbd43a`.
- Released main: `259280fe00a7dbc7359c24f997338724961f0c08`.
- Recovery branch: `backup/pre-reader-v452-20260919`, at the previous main.
- Clean integration branch: `integration/reader-v452-20260919`.
- Test/evidence branch: `qa/reader-v452-main-integration-20260919`.
- Main was fast-forwarded with `force=false` after successful tests and an exact 14-file scope comparison.

## Published scope

The phone-approved shared Bible/Apocrypha toolbar, individual and multiple verse selection, localized Copy/Share, safe group notes, source categories in My Notes, and book groups in Saved Verses are now in the main app. The approved functional JavaScript and CSS were copied byte-for-byte. Only entry/loader version references and release-cache wiring were adjusted for deployment.

Exactly 14 files changed:

1. `index.html`
2. `js/app.js`
3. `js/nh7-app-enhancements-v230.js`
4. `js/nh7-my-notes-v234.js`
5. `js/nh7-apocrypha-preview-v240.js` (existing production reader module, despite its historical filename)
6. `js/nh7-apocrypha-actions-v393.js`
7. `js/nh7-reader-ux-v251.js`
8. `js/nh7-reader-toolbar-v452.js`
9. `js/nh7-my-notes-categories-v452.js`
10. `css/nh7-reader-toolbar-v452.css`
11. `css/nh7-notes-categories-v452.css`
12. `js/nh7-apocrypha-v270.js` (loader build tag only)
13. `service-worker.js`
14. `sw-release-core-v403.js`

No newly generated Preview HTML, Preview storage guard, generated Preview app copy, test fixture, test workflow, test account or synthetic user data was added to main. No source text, Bible/Apocrypha JSON, School content, Supabase backend, native package, native version, printed QR destination or app-store submission was changed.

The cache update uses `nh7-release-core-v452-reader`. A narrowly scoped GET handler ensures the 11 reader JS/CSS assets are served from the current release rather than stale legacy query-ignoring caches. Account requests, media handling, other app paths, other origins and non-GET operations are outside this handler.

## Verification evidence

### Before main integration

Workflow `Reader v452 Main Integration`, run `35401007814`, job `105780643613`: SUCCESS.
Artifact `10570835971`: `reader-main-integration-v452-3052f19ccfa68f29c3eda55891482e913fd4a0df`.

- Chromium: 13 scenario groups passed against the actual full app entry.
- WebKit: 13 scenario groups passed against the actual full app entry.
- Source corpus and backend/native files compared unchanged against previous main.
- All entry scripts and changed scripts passed syntax checks.
- A real Chromium service-worker upgrade from v451 to v452 passed four scenario groups: previous worker with old assets; exact new-reader bytes on the first read after upgrade; identical offline reader bytes plus current navigation fallback cache; preservation of synthetic notes, bookmarks, progress, four data/media caches and two download databases.
- The offline-shell check reads the exact navigation fallback cache; it does not claim to be a separate full offline application-navigation acceptance test.
- A supplementary local Node VM test passed eight handler scope/method cases without network access.
- UI tests mocked all external services. The cache upgrade used a local static server and synthetic data. No real production account data was edited by the assistant.

### Deployment and live verification

Standard GitHub Pages run `35401200937`: build and deployment SUCCESS for the released main commit.

Workflow `Verify Reader v452 Live Main`, run `35401222485`, job `105781319699`: SUCCESS.
Artifact `10571255422`: `reader-v452-live-main-verification`.

- Live URL: `https://omideno7.github.io/new-hope7-app/`.
- All 14 deployed files returned HTTP 200 and SHA-256 hashes identical to the exact released main commit.
- The actual live main entry passed all 13 Chromium reader scenario groups. Tests used a new synthetic browser context and intercepted/mocked all external account/service traffic; no real user session was used.
- Shared toolbar, localization, multiple selection, safe notes, saved-book categories and primary routes passed on the live served code.

## Preserved behavior and remaining work

Previously accepted School, Player, Like/Blessing, Settings and sermon-note features were not redesigned in this integration. The existing single-verse reward was retained; advanced gamification has not been delivered.

The older custom `.github/workflows/deploy-pages.yml` was deliberately left unchanged. Its known stale school/app/release-core asset pins remain a separate release-pipeline maintenance item. No workflow permissions were elevated and no rejected workflow-write operation was bypassed. This known issue is distinct from the successful standard Pages deployment and successful new integration/live checks.

Navigation deduplication, per-category notification preferences, download count/size/safe removal and advanced gamification remain separate work items. Real-account cross-device cloud synchronization and native iOS/Android build/sign/store submission remain final release gates; browser mocks do not establish these.

Users do not need to uninstall the app or erase notes/downloads for this update. A normal close/reopen or page refresh is the intended way to load the current app. Do not recommend clearing all site/app data.
