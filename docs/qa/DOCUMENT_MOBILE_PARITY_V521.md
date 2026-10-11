# PR #240 final review: mobile source and web refresh evidence

Audit date: 2026-10-11. Main inspected: `67d829de0d8d4846e309a99bcd98c4c005b3b030`.

## Exact source refs and provenance

| Platform | Source branch | Exact commit | Evidence |
| --- | --- | --- | --- |
| iOS 2.5.0 approved baseline | `baseline/ios-2.5.0-approved` | `dba24de9b35316e5e0a72d83966954988ecd0046` | Remote ref; commit merges approved Test 5.8 RC. This is the repository-designated approved baseline, **not independently verified against the shipped IPA web payload**. |
| Android 2.5.0 / 25002 | `baseline/android-2.5.0-25002-published` and `build/android-2.5.0-corrected-25002` | `a177cdc7d995894868cf84bbe00c2dfa05ad6e25` | Successful [build run 37388172102](https://github.com/Omideno7/new-hope7-app/actions/runs/37388172102). Workflow copies `android-release-25002/www`; package version 2.5.0; validator verifies approved Test 5.8 payload. |

The earlier Mac Test5 Safari QA source `feature/final-qa-v2500-20261004` at `82efc731c64f76c051528ae01189521bee0ee8b9` was a QA checkout, not proven Store build provenance. That branch has since advanced to `374b9bfee12897922d82522e47efa4a8837b8b75`; its current head must not be substituted for the historical build source.

GitHub's latest iOS App Store workflow run is from September 20 at `ce7455f9c3652d6a7f536dce6618833bada0096f` on `release/ios-appstore-final`; it does not establish the October iOS 2.5.0 build. Maintainer confirmation of the shipped iOS bundle/manifest has been requested. No IPA or Mac-local bundle is available in this environment. Therefore exact installed iOS parity remains explicitly unverified.

## Comparison results

The approved iOS baseline is an ancestor of current main: **zero iOS-baseline commits absent from main**, and zero missing active referenced JS/CSS paths. Twenty-six directly referenced active files differ, because main has subsequent changes; this is not proof that installed iOS has identical behavior. Every active-file comparison is recorded in [MOBILE_250_SOURCE_COMPARISON_V521.json](MOBILE_250_SOURCE_COMPARISON_V521.json).

Android has these eight commits absent from main (latest first):

- `a177cdc7d995894868cf84bbe00c2dfa05ad6e25` — Make Android scroll compatibility setup idempotent
- `61b5b53fe0f81f08157811dd6de012d44588dce7` — Harden Android root scrolling and Amen gate cleanup
- `7974d342e661753ffaa578a6e01c103721c0307a` — Add real Android phone and fold touch-scroll diagnostics
- `e20d1804357f9db539bf59c409fd7d0cf60d5cfa` — Fix Android 2.5.0 touch scrolling by scoping iOS overscroll guard
- `3bb4600f80a857eff3550c1c6355f28070a877f1` — Support legacy Android WebView UI APIs and verify persisted notes through cold restart and upgrade
- `68d64e3e29e17bde63a374cbfb81f9e9c3192e46` — Fix native push injection on older Android WebViews and verify real plugin bridge
- `f6e118db290e5404cb69303d36730885c951b65d` — Refresh Android WebView resource caches on native upgrades
- `8925112af211a2438e833aec57c3fc2b16ddf858` — Build Android 2.5.0 (25002) from the complete approved Test 5.8 payload

Android's shipped web payload is a separate directory, not the root files at that commit. Comparing its entry-point assets with main finds 14 missing paths:

- `css/nh7-amen-theme-v531.css`
- `css/nh7-finalqa-v551.css`
- `css/nh7-finalqa-v553.css`
- `css/nh7-finalqa-v554.css`
- `css/nh7-finalqa-v555.css`
- `css/nh7-finalqa-v556.css`
- `css/nh7-finalqa-v557.css`
- `css/nh7-global-search-exam-v540.css`
- `css/nh7-inbox-v542.css`
- `css/nh7-plans-theme-v533.css`
- `css/nh7-tablet-v530.css`
- `js/nh7-finalqa-v553.js`
- `js/nh7-finalqa-v554.js`
- `js/nh7-finalqa-v555.js`

These include adaptive tablet/sidebar styles (`v530`), Amen/theme styles (`v531`), Inbox presentation (`v542`), old search/exam styling (`v540`), Plans styling (`v533`), final QA styles (`v551`, `v553`–`v557`), profile viewer helpers (`v553`), viewport chrome measurements (`v554`), and the iOS-only overscroll guard (`v555`, explicitly skipped on Android). Missing old filenames are not automatically missing feature implementations: main already uses newer direct Search v562, Profile v563/v564, exam review v566 and appearance/plans fixes. Importing these old files wholesale could regress current behavior.

Twenty-five shared directly referenced Android asset paths have different contents. The machine-readable report lists every one, including `app.js`, Community v502, mini-player v487, Library/cache/security paths and theme/notes modules. Android-only behavior also lives in `js/nh7-finalqa-v558.js` (native Android root-scroll/Amen-gate handling), `js/nh7-auto-update-v335.js` (native updater exclusion), native WebView bridge/setup and build workflow. Those eight commits are native compatibility/build work, not absent web Testimony/Prayer features. Current Community parity verifier passes; both those routes and current Community v502 are loaded on main.

**Conclusion:** a blanket “only stale cache” explanation was too strong. There are real Android source/presentation differences. This Documents PR documents them; it does not transplant older modules or change unrelated screens. Exact iOS shipped-bundle provenance is still awaiting maintainer evidence.

## Pages and service-worker evidence

Read-only Pages API reports root `main` deployment, built commit `67d829de0d8d4846e309a99bcd98c4c005b3b030`, built at 2026-10-11T15:23:17Z. No deployment performed. Live Pages HTTP access from this environment returns 403, so live-device web cache clearing is not claimed.

`verify-document-release-refresh-v521.cjs` executes the actual release-core and navigation worker lifecycle locally: install fetches with `cache:no-store`, activation removes only obsolete executable release caches, user downloads/reader/data caches survive, navigation obtains the current network shell, and offline fallback serves that current shell/runtime. Current Pages CI additionally checks index/worker/release versions match, current scripts exist in the release asset list, and navigation interception precedes the legacy offline worker. This verifies the code path, not the installed device's actual cache state.

After an approved merge/deployment, verify online refresh obtains current scripts, then test offline restart. Do not clear all site data: that risks local notes/downloads. Native build parity gaps should be evaluated separately against newer equivalents; no historical branch was merged.

The JSON also inventories all missing UI files under `js/`, `css/` and `data/community/`, with active entry-point references distinguished from unreferenced legacy files. Root comparison: iOS 0 missing; Android bundle 16 missing. The two remaining paths, `js/nh7-global-search-v540.js` and `js/nh7-exam-review-v540.js`, are active transitive imports from Android `app.js`; main deliberately uses newer Search v562 and exam review v566. The JSON traverses module imports as well as direct HTML references.

Including transitive ES-module imports, the comparison totals are 27 differing active iOS paths (0 missing) and 28 differing active Android paths (16 missing). These are source differences, not an assertion that every difference is a regression or absent feature.
