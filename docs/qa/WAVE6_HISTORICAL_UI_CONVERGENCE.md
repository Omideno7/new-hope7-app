# Wave6 historical user-interface convergence

2026-10-14. Canonical starting develop `184498f5e184ac6f0d5ffdf6962c426957af842b`; reference exports inspected only. No merge/rebase/cherry-pick, branch deletion, historical payload replacement or native build. These Git tips are source references, not proof of any shipped iOS archive identity. Wave5 Document Studio branch disposition remains authoritative and unchanged.

Current responsive570, theme571, current v562 Search, ExamReview566, Community502, owner-safe Library125/v321, Profile564, Audio484/500, Wave2 persistence and Wave4 binding/intents remain canonical. Useful historical concepts were rebuilt only where current defects were reproduced: virtual Plan reflections, owner-safe photo viewer, exact Plan navigation, presentation normalization. Current measured mini-player docking558 and responsive570 already provide browser-capable chrome/sidebar behavior; historical native overscroll/contentInset/QA wrapper assumptions are not imported.

The following are all unique paths between each historical merge base and its fetched tip. “Already current” denotes the behavior, not an unsupported claim of byte identity. Explicit unsafe implementations are rejected even when their UX concept is useful.

## Parity: `a4c2ca0e90708a4743bd8be3d367e752510c609c`

Merge base `67d829de0d8d4846e309a99bcd98c4c005b3b030`; 20 unique paths.

|Reference path|Disposition|Current evidence / reason|
|---|---|---|
|`.github/workflows/web-parity-v573.yml`|reference-only|Historical QA/release evidence retained; no activation/deployment/source copy.|
|`css/nh7-web-parity-v573.css`|reference-only|Adaptive570 and dock558 already current; native physical chrome remains device acceptance, no historical CSS/native touch suppression port.|
|`docs/qa/PR241_IOS_CHROME_HERO_QA.md`|reference-only|Historical QA/release evidence retained; no activation/deployment/source copy.|
|`docs/qa/PR241_IOS_SAFE_AREA_R8.md`|reference-only|Historical QA/release evidence retained; no activation/deployment/source copy.|
|`docs/qa/SAFE_WEB_MOBILE_PARITY_V573.md`|reference-only|Historical QA/release evidence retained; no activation/deployment/source copy.|
|`index.html`|superseded by safer/newer implementation|Canonical current router plus narrow presentation/read fences and additive helper/CSS; no wholesale app/loader replacement.|
|`js/app.js`|superseded by safer/newer implementation|Canonical current router plus narrow presentation/read fences and additive helper/CSS; no wholesale app/loader replacement.|
|`js/nh7-community-v502.js`|already current|Current Community parity/server-authorized Admin guards pass; no Wave6 mutation.|
|`js/nh7-my-notes-categories-v452.js`|reference-only|Historical QA/release evidence retained; no activation/deployment/source copy.|
|`js/nh7-my-notes-v234.js`|selectively rebuild|Wave6 typed display/no raw rewrites, read-only virtual reflections/canonical exact day, current UID photo/viewer and stale-read fences; no old persistence imported.|
|`js/nh7-profile-photo-v564.js`|selectively rebuild|Wave6 typed display/no raw rewrites, read-only virtual reflections/canonical exact day, current UID photo/viewer and stale-read fences; no old persistence imported.|
|`js/nh7-spiritual-plans-v412.js`|selectively rebuild|Wave6 typed display/no raw rewrites, read-only virtual reflections/canonical exact day, current UID photo/viewer and stale-read fences; no old persistence imported.|
|`js/nh7-web-parity-v573.js`|reference-only|Adaptive570 and dock558 already current; native physical chrome remains device acceptance, no historical CSS/native touch suppression port.|
|`scripts/build-pr241-ios-device-qa-r8.sh`|reference-only|Historical QA/release evidence retained; no activation/deployment/source copy.|
|`scripts/verify-ios-safe-area-v573.cjs`|reference-only|Adaptive570 and dock558 already current; native physical chrome remains device acceptance, no historical CSS/native touch suppression port.|
|`scripts/verify-profile-approved-student-code-v1.py`|reference-only|Current canonical and Wave1–6 tests are stronger; historical test source is not substituted.|
|`scripts/verify-web-community-parity-v250.py`|already current|Current Community parity/server-authorized Admin guards pass; no Wave6 mutation.|
|`scripts/verify-web-parity-v573.cjs`|reference-only|Adaptive570 and dock558 already current; native physical chrome remains device acceptance, no historical CSS/native touch suppression port.|
|`service-worker.js`|superseded by safer/newer implementation|Current Wave1 public TTL/restricted freshness, stable data cache329/Wave5 asset epoch; Wave6 executable epoch only.|
|`sw-release-core-v403.js`|superseded by safer/newer implementation|Current Wave1 public TTL/restricted freshness, stable data cache329/Wave5 asset epoch; Wave6 executable epoch only.|
## Test5: `374b9bfee12897922d82522e47efa4a8837b8b75`

Merge base `cb96965aed165a7ca87f639e861900547a9c9e30`; 51 unique paths.

|Reference path|Disposition|Current evidence / reason|
|---|---|---|
|`.github/workflows/next-native-android-store.yml`|reference-only|Historical QA/release evidence retained; no activation/deployment/source copy.|
|`.github/workflows/next-native-ios-store.yml`|reference-only|Historical QA/release evidence retained; no activation/deployment/source copy.|
|`.github/workflows/watchos-v2500-qa.yml`|reference-only|Historical QA/release evidence retained; no activation/deployment/source copy.|
|`admin.html`|already current|Current Community parity/server-authorized Admin guards pass; no Wave6 mutation.|
|`community-release-safe-preview-20261004.html`|reference-only|Historical QA/release evidence retained; no activation/deployment/source copy.|
|`css/nh7-amen-theme-v531.css`|already current|Current semantic theme571/514/453 and Wave3 Birthday retained; only confirmed crop/default book/public chrome palette gaps fixed.|
|`css/nh7-appearance-personalization-v514.css`|already current|Current semantic theme571/514/453 and Wave3 Birthday retained; only confirmed crop/default book/public chrome palette gaps fixed.|
|`css/nh7-appearance-v427.css`|already current|Current semantic theme571/514/453 and Wave3 Birthday retained; only confirmed crop/default book/public chrome palette gaps fixed.|
|`css/nh7-celebrations-v464.css`|already current|Current semantic theme571/514/453 and Wave3 Birthday retained; only confirmed crop/default book/public chrome palette gaps fixed.|
|`css/nh7-global-search-exam-v540.css`|already current|Current semantic theme571/514/453 and Wave3 Birthday retained; only confirmed crop/default book/public chrome palette gaps fixed.|
|`css/nh7-header-date-v455.css`|already current|Current semantic theme571/514/453 and Wave3 Birthday retained; only confirmed crop/default book/public chrome palette gaps fixed.|
|`css/nh7-inbox-v542.css`|already current|Current semantic theme571/514/453 and Wave3 Birthday retained; only confirmed crop/default book/public chrome palette gaps fixed.|
|`css/nh7-plans-theme-v533.css`|already current|Current semantic theme571/514/453 and Wave3 Birthday retained; only confirmed crop/default book/public chrome palette gaps fixed.|
|`css/nh7-spiritual-plans-v240.css`|already current|Current semantic theme571/514/453 and Wave3 Birthday retained; only confirmed crop/default book/public chrome palette gaps fixed.|
|`css/nh7-tablet-v530.css`|already current|Current semantic theme571/514/453 and Wave3 Birthday retained; only confirmed crop/default book/public chrome palette gaps fixed.|
|`css/nh7-theme-gallery-v457.css`|already current|Current semantic theme571/514/453 and Wave3 Birthday retained; only confirmed crop/default book/public chrome palette gaps fixed.|
|`data/community/testimony_guide_v502.json`|already current|Current Community parity/server-authorized Admin guards pass; no Wave6 mutation.|
|`docs/COMMUNITY_MODULES_RELEASE_STAGING_20261004.md`|reference-only|Historical QA/release evidence retained; no activation/deployment/source copy.|
|`docs/COMMUNITY_MODULES_V502_QA.md`|reference-only|Historical QA/release evidence retained; no activation/deployment/source copy.|
|`docs/COMMUNITY_MODULES_V502_SPEC.md`|reference-only|Historical QA/release evidence retained; no activation/deployment/source copy.|
|`docs/NATIVE_RELEASE_NEXT_CHECKPOINT_20261003.md`|reference-only|Historical QA/release evidence retained; no activation/deployment/source copy.|
|`final-qa-preview-20261004.html`|reference-only|Historical QA/release evidence retained; no activation/deployment/source copy.|
|`index.html`|superseded by safer/newer implementation|Canonical current router plus narrow presentation/read fences and additive helper/CSS; no wholesale app/loader replacement.|
|`js/app.js`|superseded by safer/newer implementation|Canonical current router plus narrow presentation/read fences and additive helper/CSS; no wholesale app/loader replacement.|
|`js/nh7-access-bootstrap-v230.js`|reference-only|Historical QA/release evidence retained; no activation/deployment/source copy.|
|`js/nh7-admin-community-v502.js`|already current|Current Community parity/server-authorized Admin guards pass; no Wave6 mutation.|
|`js/nh7-appearance-personalization-v514.js`|already current|Current semantic theme571/514/453 and Wave3 Birthday retained; only confirmed crop/default book/public chrome palette gaps fixed.|
|`js/nh7-audio-classic-v484.js`|already current|Current one-engine/audio safety and three-language player tests; historical audio engine not copied.|
|`js/nh7-audio-library-v500.js`|superseded by safer/newer implementation|Current caller-authorized catalog/v321 public reader offline verification retained; only scoped search projection/default palette/refresh race hardened.|
|`js/nh7-bible-keywords-v451.js`|reference-only|Historical QA/release evidence retained; no activation/deployment/source copy.|
|`js/nh7-book-reader-v283.js`|superseded by safer/newer implementation|Current caller-authorized catalog/v321 public reader offline verification retained; only scoped search projection/default palette/refresh race hardened.|
|`js/nh7-celebrations-v464.js`|already current|Current semantic theme571/514/453 and Wave3 Birthday retained; only confirmed crop/default book/public chrome palette gaps fixed.|
|`js/nh7-community-v502.js`|already current|Current Community parity/server-authorized Admin guards pass; no Wave6 mutation.|
|`js/nh7-exam-review-v540.js`|superseded by safer/newer implementation|Current v562/566, Wave2 local-first and Wave4 security/native boundary; no downgrade.|
|`js/nh7-global-search-v540.js`|superseded by safer/newer implementation|Current v562/566, Wave2 local-first and Wave4 security/native boundary; no downgrade.|
|`js/nh7-library-collections-v322.js`|superseded by safer/newer implementation|Current caller-authorized catalog/v321 public reader offline verification retained; only scoped search projection/default palette/refresh race hardened.|
|`js/nh7-library-language-v321.js`|superseded by safer/newer implementation|Current caller-authorized catalog/v321 public reader offline verification retained; only scoped search projection/default palette/refresh race hardened.|
|`js/nh7-library-security-v125.js`|superseded by safer/newer implementation|Current caller-authorized catalog/v321 public reader offline verification retained; only scoped search projection/default palette/refresh race hardened.|
|`js/nh7-media-player-v500.js`|already current|Current one-engine/audio safety and three-language player tests; historical audio engine not copied.|
|`js/nh7-my-notes-v234.js`|selectively rebuild|Wave6 typed display/no raw rewrites, read-only virtual reflections/canonical exact day, current UID photo/viewer and stale-read fences; no old persistence imported.|
|`js/nh7-note-text-v501.js`|selectively rebuild|Wave6 typed display/no raw rewrites, read-only virtual reflections/canonical exact day, current UID photo/viewer and stale-read fences; no old persistence imported.|
|`js/nh7-offline-persistence-v323.js`|superseded by safer/newer implementation|Current v562/566, Wave2 local-first and Wave4 security/native boundary; no downgrade.|
|`js/nh7-push-account-bind-v364.js`|superseded by safer/newer implementation|Current v562/566, Wave2 local-first and Wave4 security/native boundary; no downgrade.|
|`js/nh7-spiritual-plans-v412.js`|selectively rebuild|Wave6 typed display/no raw rewrites, read-only virtual reflections/canonical exact day, current UID photo/viewer and stale-read fences; no old persistence imported.|
|`scripts/android_upgrade_smoke.sh`|reference-only|Historical QA/release evidence retained; no activation/deployment/source copy.|
|`scripts/validate_native_release_candidate.py`|reference-only|Current canonical and Wave1–6 tests are stronger; historical test source is not substituted.|
|`scripts/validate_next_native_optimization_guard.py`|reference-only|Current canonical and Wave1–6 tests are stronger; historical test source is not substituted.|
|`service-worker.js`|superseded by safer/newer implementation|Current Wave1 public TTL/restricted freshness, stable data cache329/Wave5 asset epoch; Wave6 executable epoch only.|
|`supabase/migrations/20260930_community_modules_v502_owner_audio_candidate.sql`|reject as stale/unsafe|No migration permitted; current accepted Community authority/checkpoint preserved.|
|`sw-offline-v329.js`|superseded by safer/newer implementation|Current v562/566, Wave2 local-first and Wave4 security/native boundary; no downgrade.|
|`sw-release-core-v403.js`|superseded by safer/newer implementation|Current Wave1 public TTL/restricted freshness, stable data cache329/Wave5 asset epoch; Wave6 executable epoch only.|

## Explicit exclusions / next acceptance

Soul Tracker/Growth account sync, School snapshots/progression/cache, native offline reconciliation/bridges/updater/push/signing, old Search/Exam/Profile/Library/Community implementations, and historical backend candidates are not ported. Current v564 crop/zoom remains authoritative; unbound legacy global photo bytes remain stored but quarantined instead of guessing an owner. Unknown raw Notes remain recoverable and unchanged. Plans content/catalog adapter (including the existing assembled renewal plan) is reused without editorial/data changes.

Browser source tests cover all nine requested widths plus portrait/landscape safe-area variable probes. Physical iPhone/iPad/Fold safe areas, WKWebView print/share/background/offline, native photo restoration and provider/live permissions still require later explicit device acceptance. No historical device screenshot/build is claimed as Wave6 evidence.
