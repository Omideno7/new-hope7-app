# Wave 8 Physical Fix Batch 2 report

## Provenance and safety

Starting develop: `d06b170f052390c84a500a7b78bd18115a84b04f` (fetched actual remote head, fast-forward only). Pre-implementation audit: `ea06ff498f13f6da227592c4b1c3ce0f62b2369c`. Main checkpoint: `15af811f78a17a0881c13171311e7ade6bc390f4`. Implementation/follow-up SHAs and exact-head CI are recorded in the delivery; this report travels with that tested commit, avoiding a self-referential commit hash.

Develop only; no branch or PR created. No main integration, deployment, native build, Store upload, Production call/mutation, migration application, provider/security/issuance activation or real-user data operation. Batch 3/4 and release work were not started. Audio analytics remains REJECTED_COST. No analytics request, write, persistent row, storage or recurring timer added.

## Findings and disposition

| Item | Cause / change | Acceptance boundary |
| --- | --- | --- |
| B2.1 | Current Web source already gives env insets to header/nav rows and sizes the native grid from visualViewport. Excess content padding is compacted (header content 12→6px; nav 6→4px), preserving full measured env insets, six 44px controls, integrated row backgrounds, no hard height cap and sole content scroller. | SOURCE_PARTIAL / PHYSICAL_QA_REQUIRED. Exact current native wrapper is unavailable: native automatic inset ownership/double-inset root cause cannot be proven or safely changed here. No guessed inset subtraction or native configuration change. |
| B2.2 | v570 mirrored book/chapter controls into sidebar while retaining visible duplicates; verse detail lacked chapter navigation. Canonical lists now mark master controls; split-only detail hides duplicates and presents localized selection prompt. Chapter detail provides current-book chapters via existing metadata/router. Back stays in normal flow. | Automated hierarchy, exact destinations, logical top/Back and existing exact-verse tests; real iPad retest required. |
| B2.3 | Daily was excluded from split layout. Current four product categories now populate master and detail hides duplicate category controls. Category selection uses canonical router with existing date params, fixing stale tab on language refresh. | Actual category→detail and FA/EN/HR tests; existing data/offline sources retained. |
| B2.4 | Audio was identified only through active bottom-nav metadata, which is absent on Audio route; item selection did not expose detail. Actual history route drives layout. Existing chips/items form sidebar; item selection invokes the same canonical playItem API, waits for completion and validates current actor/route/item before expanding existing player into measured detail bounds. | No new engine/catalog/persistence, no duplicate play. Actual fixture audio and existing Audio safety tests. |
| B2.5 | showModal placed Quick Bible above playback controls. It is now a labelled, nonmodal in-flow section in current player sheet (or page fallback), with existing seek/time/main controls temporarily grouped sticky using the same nodes/listeners. Closing restores original nodes/focus; route/owner/language changes fence lookup without stealing focus. | Existing lookup/place/deep-link functions byte-exact; actual play/pause and single-engine assertions in four orientations. Native keyboard/media acceptance remains physical. |
| B2.6 | A delayed v251 reader observer could overwrite canonical Back/verse positioning; it now defers only canonical Bible scroll to the existing router. Open Notes could sit below viewport; Bible tools stop bubbling clicks. Capture listener waits until tool handlers finish, focuses visible editor and scrolls instantly without stealing another active form control. | Existing navigation/back/popstate and persistence unchanged. New book/chapter top, browser Back scroll, Bible Notes focus and Audio Notes focus/visibility assertions. |
| B2.7 | Stretched hero and duplicate header/Home avatars. Compact adaptive grid uses existing identity/welcome/CTA and a locally formatted current date; the existing canonical v564 control is presented once in Home and restored to header before route replacement. | v564/account/photo persistence source unchanged; one Home image, no duplicate header control, restore-on-navigation and prior account/photo regressions. No new backend reads or date timer. |
| B2.8 | Redundant hard-coded language badge in Plans hero. Only that exact span removed. | Whole Plans file otherwise byte-exact; header language selector and content switching remain canonical. |

Split uses width ≥768 and height ≥500; narrow and short landscape phone windows retain stacked flow. Existing wide Web rail and native six-control grid remain canonical. No device-name detection added.

## Changed files

Runtime (six):

- `js/app.js`: master markers/chapter nav; local Home date; Daily router tab state.
- `js/nh7-adaptive-layout-v570.js`: responsive hierarchy, existing-player detail presentation, canonical avatar placement, tool focus.
- `js/nh7-audio-quick-bible-v454.js`: in-flow presentation and lifecycle cleanup only.
- `js/nh7-spiritual-plans-v240.js`: redundant badge removal only.
- `js/nh7-reader-ux-v251.js`: defer canonical Bible scrolling to its existing router, preventing delayed observer top-scroll from overriding contextual Back or exact verse centering; apocrypha unchanged.
- `css/nh7-platform-wave7.css`: split visibility, Home grid, in-flow lookup/player controls, safe content spacing.

QA/documentation:

- `.github/workflows/validate-develop.yml`: additional Batch2 gate; all existing stages retained.
- `scripts/verify-batch2-browser.cjs`: actual-current synthetic browser regressions.
- `scripts/verify-batch2-safety.py`: independent changed-file/backend/persistence/Batch1 authority boundary.
- `scripts/batch2_accepted_source.py`, `scripts/fixtures/batch2-source-contract.json`, `scripts/fixtures/batch2-approved-ui.patch`: full before/after hashes and exact reversible UI delta for historical freeze guards.
- `scripts/batch1_accepted_source.py`, `scripts/verify-batch1-safety.py`, `scripts/verify-wave7-safety.py`: feed historical assertions their exact prior accepted bytes after independently checking Batch2 delta; original frozen assertions/fixtures remain intact and functional tests run actual current code.
- `scripts/verify-responsive-v570.mjs`: adds Daily eligibility assertion alongside existing Bible/Audio/phone/no-I/O assertions.
- This report and `docs/qa/WAVE8_PHYSICAL_FIX_BATCH2_AUDIT.md`.

## Test evidence and reproducibility

All browser backend requests intercepted with synthetic accounts; no Production testing. `verify-batch2-browser.cjs` covers six widths (390, 844 short-landscape, 672 split, 820, 1180, 1440) × FA/EN/HR: 27 NT books→John→21 chapters→chapter 3, no duplicated detail lists, four Daily categories and routed tab, no horizontal overflow, correct document direction. Protected Notes/School/Plans/verse payloads must remain byte-identical. Additional real-router assertions cover new chapter/book top and Back restoration; Bible Notes focus exercises capture propagation. Audio category/item→automatic player detail, same engine, nonmodal Quick Bible, existing play/pause and visible/focused Notes cover 390×844, 844×390, 820×1180, 1180×820. Home tests require one canonical photo/date and header restoration. Plans badge absence is checked in all three languages. No analytics call is allowed.

Run `verify-batch2-safety.py`, changed JS/module `node --check`, `verify-batch2-browser.cjs`, and `git diff --check`. Full `Validate Develop` remains required at the exact final head; includes all Wave 1–8/Batch1 regressions, 180-case platform geometry suite, responsive/theme/offline guards, School/Library/Community/Notes/audio/security/account fences, document output and upgrade/reconnect/provenance, and real-duration synthetic idle/listener/network measurements. Successful run ID, conclusion and matching head SHA are delivered separately after CI finishes; earlier green runs are not substituted.

Migration parity: **42/42 raw-hash exact**, missing checkpoint files 0. Existing pending v511 migration remains **1, unapplied** (`20261012123000_audio_bible_public_catalog_read_v511.sql`); no migration added or changed in Batch2. This is repository checkpoint evidence, not a new live database inspection.

## Unresolved physical-only / toolchain gates

- BLOCKED_TOOLCHAIN: current installed iOS/Android wrapper and actual WKWebView inset configuration unavailable. Inspect wrapper ownership with the exact accepted payload before claiming B2.1 root cause resolved. Preserve wrapper dependencies/signing; do not reconstruct historical wrappers.
- PHYSICAL_QA_REQUIRED: iPhone/iPad portrait/landscape, hardware status/home areas, native safe-area values, keyboard/rotation, six usable nav items, no blank inset band, mini-player dock and Home photo.
- PHYSICAL_QA_REQUIRED: actual tablet Bible/Daily/Audio split navigation, Notes focus with native keyboard, in-flow Quick Bible seek/play, native screen-reader/input behavior; Android/Fold posture/offline playback and WebKit checks.
- Browser synthetic viewport/capacitor probes are source/geometry evidence only. No physical device, native audio/keyboard, battery/thermal, Store delivery or real offline download PASS is claimed.

Stop after Batch2. Later device QA must identify exact installed source SHA and wrapper provenance; green CI does not authorize deployment or integration into main.
