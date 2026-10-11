# PR #240: signed iOS archive provenance and Android published-source comparison

Audit updated 2026-10-11. Current main verified remotely: `67d829de0d8d4846e309a99bcd98c4c005b3b030`. **Findings only: no runtime forward-port, native rebuild, migration, merge or deployment.**

## 1. Authoritative iOS 2.5.0 / 25001 source

The maintainer checked the actual Mac/Xcode archive:

- Archive: `~/Library/Developer/Xcode/Archives/2026-10-05/App 10-5-26, 4.09 am.xcarchive`.
- Embedded app: `Products/Applications/App.app`.
- Authoritative web tree: **`Products/Applications/App.app/public` within that signed archive**.
- Version 2.5.0, build 25001.
- Related Test5 checkout: `~/Desktop/NewHope7-Test5-iOS`, branch `feature/final-qa-v2500-20261004`, HEAD `82efc731c64f76c051528ae01189521bee0ee8b9`.

Read-only GitHub verification confirms [run 37202333319, Next Native iOS Store Candidate](https://github.com/Omideno7/new-hope7-app/actions/runs/37202333319) succeeded at that SHA/branch and produced `New_Hope_7_iOS_Next_Candidate` (artifact 11303312799, unexpired when checked). This corroborates candidate provenance; **it does not establish signed-archive byte identity**.

Maintainer's archived-file comparison:

| Archived file | Compared with Test5 HEAD | Consequence |
| --- | --- | --- |
| `version.json` | Matches | Does not identify the other runtime bytes. |
| `service-worker.js` | Matches | Does not prove matching imported workers or cached content. |
| `index.html` | Does not match | Active script/style graph must be read from the archive. |
| `js/app.js` | Does not match | User-facing runtime must be read from the archive, not reconstructed from Git HEAD. |

Archived index markers reported by the maintainer:

- `NH7_VERSION = '2.5.0 · Test 5.8 QA'`.
- `service-worker.js?v=5.4.0-qa250`.
- `nh7-community-v502.js?v=5.5.5-recorder-pause`.
- `app.js?v=5.5.5-test55`.

`baseline/ios-2.5.0-approved` at `dba24de9b35316e5e0a72d83966954988ecd0046` is **not proof of the shipped iOS web bundle**. Previous zero-missing/27-different root-branch counts are withdrawn from the shipped-iOS assessment and removed from the JSON's iOS comparison. Neither that branch, the candidate artifact nor Git HEAD is substituted for the archive.

### iOS comparison status

**Blocked on access to the archived `App.app/public` files.** The Mac archive is not present in the cloud workspace; no archive download URL was supplied. Its index markers prove a different release composition, but cannot enumerate missing/older features or classify local `app.js` changes. Missing/older iOS counts remain **unknown**, not zero. Archive access has been requested. No claim of exact iOS/Web parity is made.

To complete this section, provide the archived `public` directory as an attachment or accessible download. A hash inventory can establish file equality, but differing file contents (especially the two local overrides) are needed to classify behavior. No signing keys, provisioning profiles, user data or full archive are needed.

## 2. Android 2.5.0 / 25002: verified independent comparison

Published source: `a177cdc7d995894868cf84bbe00c2dfa05ad6e25`, refs `baseline/android-2.5.0-25002-published` and `build/android-2.5.0-corrected-25002`. [Successful build run 37388172102](https://github.com/Omideno7/new-hope7-app/actions/runs/37388172102) uses that SHA. Its workflow copies **`android-release-25002/www`**, not the repository root. Package version is 2.5.0 and the payload validator checks complete approved Test 5.8 features. Main has not advanced since the previous comparison.

Compared `js/`, `css/`, `data/`, entry index, version/manifest and service-worker runtime files: **325 paths; 266 identical, 43 different, 16 absent from main**. Following the active entry point and transitive ES-module imports gives **28 differing active paths and 16 missing active paths**. Different bytes do not by themselves mean main is older. The [JSON inventory](MOBILE_250_SOURCE_COMPARISON_V521.json) lists every difference and both Git blob identities; dormant files are distinguished from active references.

### Confirmed Android features absent from Web or requiring a forward-port review

These source differences are not guarded as Android-only; they are browser-capable additions. Findings are static source evidence, not device acceptance results.

| Feature / files | Published Android behavior | Current main / disposition |
| --- | --- | --- |
| Tablet/sidebar navigation — `css/nh7-tablet-v530.css`, `js/app.js` | Adaptive tablet/desktop layouts and `nh7-adaptive-sidebar` route controls. | Styles and sidebar construction absent. **Missing Web layout forward-port**, separate scoped review needed. |
| Full-screen profile photo viewer — `js/nh7-finalqa-v553.js`, `css/nh7-finalqa-v553.css` | Avatar opens a full-screen viewer with pinch zoom and zoom/reset buttons; augments the old crop UI. | Viewer absent. **Missing Web viewer enhancement**; current v563/v564 photo crop, persistence and top-bar avatar already exist and must stay authoritative. Do not import the legacy crop/backend behavior. |
| Measured fixed header/navigation — `js/nh7-finalqa-v554.js`, `css/nh7-finalqa-v554.css`, `css/nh7-finalqa-v555.css` | Measures actual chrome into `--nh7-fixed-header-h` / `--nh7-fixed-nav-h`, includes phone-landscape/safe-area/full-player layering rules. | Measurement helper absent. **Web chrome/layout candidate**, with iOS-only bounce suppression separated; inspect current navigation before porting. Current mini-player docking is already implemented. |
| Spiritual-plan reflections in My Notes — `js/nh7-my-notes-v234.js`, `js/nh7-my-notes-categories-v452.js`, `js/nh7-spiritual-plans-v240.js`, `js/nh7-spiritual-plans-v412.js` | Collects `nh7_spiritual_plans_v240:` day notes as virtual `kind:'plan'` entries, adds labels/direct day opening and refresh events. | No virtual plan-note collection in main. **Missing Web note aggregation/direct-open feature**. Android also has plan-note deletion/account behavior; do not copy it in this Documents PR or rewrite user notes. |
| Soul Tracker account merge — `js/nh7-soul-winning-v472.js`, `js/app.js` | `hydrateAccountStore`, ID/timestamp-based `mergeStores`, injected account read/save helpers and restore hooks. | Main explicitly uses a local-first tracker without these account helpers. **Account-sync parity difference**, not native-only; requires a separate user-data/backend review rather than a silent UI port. |
| Growth account restore merge — `js/app.js` | `nh7MergeGamificationV553` merges max counters and unions badges/activity days; one-time account seed. | Main saves Growth progress but lacks this explicit merge/seed restore path. **Account restore parity difference**, not a claim that Growth itself is missing. Review separately for user-data safety. |
| Settings offline-count reconciliation — `js/app.js` | Uses `getUsableNativeOfflineEntry`, cache metadata reconciliation and `nh7CachedMediaIsDownload` to count surviving user downloads. | Main's simpler storage summary lacks these helpers. Native-file existence checks are **native-only**; generic Web cached-download counting is a **Web accuracy candidate**, requiring independent tests before any change. |
| Dark/palette presentation — `css/nh7-amen-theme-v531.css`, `css/nh7-finalqa-v551.css`, `css/nh7-finalqa-v553.css`, `css/nh7-finalqa-v556.css` | Additional Amen, settings, notes, Library/Apocrypha and landscape surface rules. | Exact layers absent. **Presentation parity candidates**, not proof of unreadable current screens; existing main appearance/Plans guards pass. Compare computed styles before choosing narrow rules. |

### Intentional native-only differences

| Files / area | Reason to keep separate from Web |
| --- | --- |
| `js/nh7-auto-update-v335.js`; Android index wrapper | Native wrapper excludes legacy web updater/service-worker and web OneSignal injection; bundled assets update with the native application. Web requires its own worker refresh. |
| Native Android bridge/setup and build workflow | WebView compatibility, native push plugin injection, versionCode 25002, filesystem plugin, application/storage origin, resource-cache refresh and microphone permission are native build concerns. |
| `js/nh7-finalqa-v558.js` Android root-scroll/Amen-gate portions | Explicit native Android checks; fixes Samsung/WebView overscroll and invisible gate hit-testing. Shared mini-player docking is already on main. |
| `js/nh7-finalqa-v555.js` | Explicitly iOS/WKWebView-only edge rubber-band guard; skipped on Android. Its presence in the Android export is not an enabled Android feature or a needed Web port. |
| `version.json`, manifest/release labels and archive/index markers | Native Store version/build and QA labels differ from Web's independent release/cache labels. A higher native label does not prove older Web functionality. |

### Main already has replacements or newer safety behavior

- `js/nh7-global-search-v540.js`, `js/nh7-exam-review-v540.js`, `css/nh7-global-search-exam-v540.css`: Android's older imported search/exam system. Main uses direct Search **v562**, exact Bible deep-links **v565** and exam review **v566**. **Superseded implementation**, not an instruction to downgrade.
- `css/nh7-inbox-v542.css` and `css/nh7-header-date-v455.css`: old Inbox/profile presentation paths differ. Main has Inbox polish/timestamp handling in `js/nh7-finalqa-v558.js` and current Profile **v563/v564**. Missing old selectors do not mean Inbox or the avatar is absent.
- `css/nh7-plans-theme-v533.css`, `css/nh7-theme-gallery-v457.css`: main carries later Plans/dark/appearance fixes through current assets; relevant parity checks pass. **Review visual differences, preserve current fixes**.
- `css/nh7-finalqa-v557.css`: prior mini-player offset layer; main already uses measured v558 docking and the full player. **Superseded**, retain current audio engine.
- `js/nh7-community-v502.js`: both have Testimonies, Prayer Requests and pause/resume recording. Android adds account-update hooks and old Profile crop gesture handling; main has later feedback/locale/upload-limit changes and v564 crop. No wholesale Community replacement is warranted. Archive's Community query alone cannot prove it matches either copy.
- Library/cache paths (`js/nh7-access-bootstrap-v230.js`, `js/nh7-book-reader-v283.js`, `js/nh7-library-language-v321.js`, `js/nh7-library-collections-v322.js`, `js/nh7-offline-persistence-v323.js`, `js/app.js`): main contains newer Ministers/cache hardening and verified Public-reader offline flow. Android's older catalog/cache logic must **not** replace it.
- Notes text/restore (`js/nh7-note-text-v501.js`, `js/app.js`): main preserves additive/fill-only repair and existing local edits. Android's newer-named restore hooks do not automatically make its overwrite policy safer.
- School snapshot retention differs inside Android `app.js`: it retains last known-good snapshot instead of invalidating it, and validates fetched arrays before replacing the cache. **Safety-sensitive source difference for separate review**; no School change or claim of a confirmed current device regression here.

Android's eight commits absent from main, latest first:

- `a177cdc7d995894868cf84bbe00c2dfa05ad6e25` — Make Android scroll compatibility setup idempotent
- `61b5b53fe0f81f08157811dd6de012d44588dce7` — Harden Android root scrolling and Amen gate cleanup
- `7974d342e661753ffaa578a6e01c103721c0307a` — Add real Android phone and fold touch-scroll diagnostics
- `e20d1804357f9db539bf59c409fd7d0cf60d5cfa` — Fix Android 2.5.0 touch scrolling by scoping iOS overscroll guard
- `3bb4600f80a857eff3550c1c6355f28070a877f1` — Support legacy Android WebView UI APIs and verify persisted notes through cold restart and upgrade
- `68d64e3e29e17bde63a374cbfb81f9e9c3192e46` — Fix native push injection on older Android WebViews and verify real plugin bridge
- `f6e118db290e5404cb69303d36730885c951b65d` — Refresh Android WebView resource caches on native upgrades
- `8925112af211a2438e833aec57c3fc2b16ddf858` — Build Android 2.5.0 (25002) from the complete approved Test 5.8 payload

## 3. Limits and next action

Android comparison is complete at the stated source/main SHAs. iOS signed-archive comparison remains blocked on the actual embedded tree. Do not infer its feature inventory from Android, from a GitHub candidate, from the historical approved branch or from cache query strings.

The earlier worker refresh test remains valid for the Web code path: local execution of install/activate/fetch confirms current network shell, release runtime caching and preservation of downloads/reader/data caches. Pages API previously reported main deployed at the same inspected SHA. Live Pages HTTP access is restricted (403) in this environment; no deployment or installed-device cache state is verified here. Cache is a possible additional cause, **not the sole explanation** for native/Web differences.

Only this report, the machine-readable inventory and the Documents QA cross-reference changed for this provenance follow-up. No code, user data, backend or release configuration changed. PR #240 remains Draft; no merge or deploy.
