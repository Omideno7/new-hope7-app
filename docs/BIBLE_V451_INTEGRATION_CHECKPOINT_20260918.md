# Bible v4.5.1 integration checkpoint — 18 September 2026

## Integrated runtime

- Repository: Omideno7/new-hope7-app.
- Main commit: `569f94080131bf91d64cf7a66684c1159c823d62`.
- Previous main: `eccd9a12c2ac6f216f678c0ea81635d42db830cd`.
- Recovery branch: `backup/pre-bible-v451-20260918` (previous main).
- Integration branch: `integration/bible-v451-20260918`.
- Main was fast-forwarded only after full-app integration tests succeeded.
- Exactly eight runtime files changed: `css/nh7-bible-keywords-v450.css`, `data/bible/keywords/bible_keywords_v450.json`, `index.html`, `js/app.js`, `js/nh7-app-enhancements-v230.js`, `js/nh7-bible-keywords-v451.js`, `service-worker.js`, `sw-release-core-v403.js`.
- No Preview HTML, storage guard, test workflow or test namespace was transferred to main.
- No production database, account, schema or stored user record was edited as part of this integration.
- Native app/store version remains unchanged. No iOS or Android binary was built, signed or submitted.

## Verified evidence

- Full-app integration workflow run `35392384391`: successful.
- Baseline main was tested first. Candidate uses the actual `index.html` with its complete app script set, not the Bible-only Preview.
- Chromium: 14 checks passed, including independent agent-browser UI inspection.
- WebKit: 13 checks passed.
- Tests cover FA/EN/HR keyword lookup, 120-to-240 keyword pagination, 200-to-400 verse-result pagination, filter preservation, Enter search, exact chapter/verse opening, single and multiple bookmark save/unsave, selection cancellation, mocked sharing, note editing/reload persistence, and mobile toolbar bounds.
- Keyword layouts checked at widths 320, 390, 768 and 1280 pixels.
- Existing synthetic Bible, personal, sermon and gratitude notes preserved. Notes/highlights/unknown fields and unrelated bookmarks retained during save/unsave.
- All external requests intercepted and mocked: zero actual external API requests during UI tests. No real account credentials used.
- Cache activation unit test removed only the old release-core cache, preserving the stable Bible data and media cache examples.
- Corpus audit: unchanged hashes for the original 66-book, 1189-chapter, 31102-verse corpus. Exactly 2500 unique keywords per language; all 7500 normalized keys have positive matches and verified occurrence counts.
- Translation review was structural only; no replacement or editing of Bible translations.
- Standard GitHub Pages run `35392729781`: build and deployment both successful for the exact new main commit.

## Remaining gates and limitations

- Chromium/WebKit automation is not a physical iPhone/Android device test. Native share-sheet behavior and real-account cloud synchronization remain to be checked before final store builds.
- Direct live-page verification through the web/download tools was unavailable in this session; deployment confirmation is from GitHub Pages, and full UI testing used the exact runtime locally in CI with mocked external services.
- An older custom workflow, `.github/workflows/deploy-pages.yml`, still pins three outdated asset references: school path v350, app script tied to the store version, and release-core v4.2.2.
- A strictly limited three-line alignment was tested successfully in run `35392629281` (the original release checks and HTML/JSON checks passed, no assertions removed). Its commit/push was rejected because the Actions token lacks `workflows` permission. The production workflow was NOT changed and no alternate write path was used to bypass that permission failure.
- This older custom validator issue must be resolved through an authorized workflow-editing path before calling the complete release pipeline ready. It is distinct from the successful standard GitHub Pages deployment.
- School/audio release branch `release-school-audio-main-20260918` is already an ancestor of previous main; do not re-merge it or overwrite newer work. Next step is detailed regression testing of the current School flows, then the other approved app features, followed by final native release testing/build/signing.
