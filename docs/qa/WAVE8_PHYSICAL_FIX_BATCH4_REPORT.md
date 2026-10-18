# Wave8 Physical Fix Batch4 — Settings / storage / notifications / appearance

Source-only implementation on existing `develop`. Starting accepted SHA: `eef4e4fe365f50fe5b859e4e4acbc064c6a30cc0`. Pre-runtime audit commit: `4a76bae756cbdc6c33383df049ec7806b7a79871`. Main checkpoint: `15af811f78a17a0881c13171311e7ade6bc390f4`. Implementation/follow-up and exact CI head are recorded by Git history and the final delivery, rather than a self-referential commit hash in this file. This is not physical acceptance or permission to activate/release.

## Existing actions and resulting contracts

The actual active V403 capture handler, not the dormant V398 legacy text, controlled cleanup/prepare/refresh. Old cleanup cleared entire media DBs/cache name matches/native directories; old status trusted a readiness marker, and refresh swallowed errors then reloaded. New exact early capture delegates those Settings actions to one bounded, localized orchestrator; V252 Account/full-delete code is byte-identical. The three legacy V403 action bodies are retired: missing new tools now fail closed with a localized error, never falling back to broad deletion, fake readiness or forced reload. The app also does not expose legacy Settings controls after a dependency failure.

Sync and Refresh are intentionally separate. Sync awaits the existing account queue and local-first flush, then the existing Inbox snapshot; it reports pending/partial/offline and fences every response to the current account/token/route/language. It does not invent an account-restore path or rewrite Notes persistence. Refresh updates only the current app's worker registration and requests existing core/public-data preparation; it neither clears personal data nor forcibly reloads an unsaved editor. Missing/partial worker/public receipts cannot claim a complete refresh. Entering Settings no longer adds a notification-schedule backend read.

App Status shows current connectivity, actual source version and build identity only when available, read-only OS permission and explicitly unverified Push delivery. Explicit Measure scans known storage only: at most1000 entries per store/list and16MiB response payload budget. Audio Blob sizes and acknowledged native file stat sizes are separate from browser origin usage/quota. The latter includes other apps on the origin and is not an NH7-only physical-disk claim. Missing APIs, unclassified items, capped/partial/error results are labelled unavailable/partial, not fabricated MB. No startup or recurring storage scans.

Storage cleanup requires confirmation. It deletes only positive-size audio Blob rows classified in the two existing media stores, matching recreatable metadata, corresponding exact protected-audio cache copies, and exact recorded native owned audio leaf paths after successful stat/deleteFile. No recursive delete, DB/store clear, arbitrary native path, document/PDF or unknown entry deletion. Optional checkbox additionally removes only same-app `/data/*.json` entries from the exact stable public-data cache. Private hashed API responses, restricted reader caches, Notes, Saved Verses, highlights, School/assignments, Plans, Profile, personal drafts, Documents/Student ID, Inbox ownership/read state and personalization are preserved. Results count acknowledged removed copies/items and measured payload bytes, not guaranteed OS disk recovery. Zero deletions do not claim savings. Unknown byte lengths and partial errors remain explicit.

Offline Prepare verifies each current manifest asset in its correct core/data cache through `BATCH4_CORE_STATUS`. Extra unrelated keys cannot conceal a missing asset. Existing helpers prepare bounded existing core/public data; already-cached core, partial/failure, unsupported and offline have separate results. It never claims all optional Library/audio/School content is offline. No automatic huge-library download, cache clearing or change to the audio/download engine.

## Notification semantics and authority

Existing device-local master key remains `nh7_notifications_enabled_v252`. Categories are local UID/guest-scoped: church messages, Daily Word, Faith, Daily Juice, Gratitude, Meetings, Christian Calendar and School. The six current schedule keys map to these actual categories; ordinary existing categories retain ON defaults, Calendar/School default OFF and do not claim activated delivery. User B does not inherit A's category choices. The device master remains intentionally device-local. Required/unknown categories and Inbox history/read state are not suppressed by the optional preference predicate.

Permission is checked read-only on entry and requested only by an explicit button. Allowed/denied/not-requested/unsupported/unavailable are distinguished from provider activation. No OneSignal initialization, notification send/schedule, OS-settings redirect, new provider tags or backend contract. The canonical v364 attached-SDK path now respects master OFF before opt-in and can opt out an existing optional subscription; all existing identity/JWT/stale-response checks and inactive backend gate remain. Foreground optional presentations and local known schedules consult current preferences; source preferences do not claim server-side category delivery. Server/provider/native confirmation remains required. Account/security delivery contracts are not invented.

## Appearance root causes and corrections

Reproduced midnight+Paper ordinary verse ink `rgb(242,241,229)` on `rgb(248,241,229)`: reader-mode surface overrode background while child ink retained the dark palette. New semantic reader surface/ink pairs cover child verses/numbers/headings and retain highlight contrast. Paper now uses `rgb(63,53,41)` ink. Shared editor/modal/disabled/status surfaces use semantic tokens; certificate/output canvases are not targeted. Representative route/FA/EN/HR checks apply the real hope/midnight palettes with a success assertion and parse browser color(srgb)/RGB through Canvas; 318 computed light/dark foreground/surface pairs pass. These checks supplement existing32 highlighted-Bible-palette regressions; these are not WCAG or physical visual certification.

All32 palettes and12 style IDs remain. Palette frames/active navigation make accent differences visible; soft depth has layered elevation, Flow has a finite220ms entry transition and interaction feedback. Existing styles retain their distinct output. No permanent decorative GPU loop, blur animation or infinite animation is added. Reduce Motion disables nonessential animation/transition/active transforms, preserving input/navigation.

Preferences remain DEVICE-local in the existing keys, not account/Supabase data. Custom validated colors preview immediately in memory without writing. Apply commits the current authoritative Theme Studio config plus personalization only after acknowledged storage success. A narrow rollback restores previous exact keys and visuals on quota; the reproduced stored/visual divergence is corrected, with visible failure instead of a saved claim. Closing unsaved preview restores stored state, including native dialog close/Escape. Existing contrast validation prevents unreadable saved combinations. Background/system/storage/resume events apply visual state read-only; the former minute write interval is removed. Auto mode uses a single foreground day/night boundary timer, cancelled when hidden; no recurring backend or decorative timer.

## Release name audit (no release work)

This checkout does not include authoritative current Store native wrappers. Do not infer installed names or regenerate wrappers from old branches. `scripts/verify-native-display-name.py` reads an explicitly supplied Capacitor JSON config and rejects any release `appName` other than exactly `New Hope 7`; QA remains distinguishable. Synthetic tests cover correct release/QA and rejected QA/Test release labels. Later build acceptance must also inspect the actual iOS CFBundleDisplayName and Android resource/manifest label in signed artifacts and on-device. No app identity, signing, native wrapper, Store configuration or production display name was changed.

## Validation and safety evidence

New gates: `verify-batch4-safety.py`, `verify-batch4-storage.cjs`, `verify-batch4-browser.cjs`, `verify-batch4-lifecycle.cjs`, `verify-batch4-contrast.cjs`; display-name synthetic checks run inside safety. Tests use isolated synthetic accounts/Blobs/IDB/CacheStorage and intercepted external traffic, never Production. Storage fixture measured15 audio bytes/two items,11 public JSON bytes,23 native bytes through a synthetic Filesystem; unknown PDF/drafts/personal keys byte-identical, quota and unsupported APIs handled. UI covers FA/EN/HR × phone/tablet portrait/landscape, UID switch, explicit permission, master/category defaults/persistence, separate Sync/Refresh, partial/already/offline,32 distinct actual palette outputs,12 styles, custom preview/save/reload/quota rollback and Reduce Motion. Lifecycle covers exact manifest missing-vs-extra keys, attached mock SDK opt-in/out/logout and zero requests with backend inactive, accelerated60s visible/hidden and day-boundary zero theme writes. Clock acceleration proves lifecycle semantics, not physical battery/thermal/real-time idle performance.

Full current Validate Develop remains mandatory, including every Wave1–7.5/Wave8/Batch1/Batch2/School/Batch3A/Batch3B gate, Notes merge, Audio, Profile, Inbox, Calendar, Documents/PDF/Print, theme/responsive/offline and optimization. Earlier source assertions are preserved through an independent hash-bound Batch4 inverse projection; no old expected fixture or security assertion is changed. The new current-source guard runs first and verifies exact paths/hashes/two changed app functions, unchanged prior fixtures/backend/data/engines and only an additive CI step. All changed JS syntax, CSS brace/static checks and diff whitespace are required. Exact-head successful CI is a completion gate, not inferred from local tests.

Migration parity:42/42 exact,0 missing; existing2 pending v511 and v580 unchanged and unapplied. All School/Q&A/Connect/Document/security/provider review packages remain inactive. Audio Analytics remains REJECTED_COST; no analytics requests/writes/storage/telemetry added. No Production access/mutation, migration, backend change, new dependency, branch/PR, main modification, deployment, provider activation, data reset/backfill/deletion or release work.

## Physical/native acceptance still required

Real iPhone/iPad WKWebView and Android phone/tablet permission responses, native Filesystem errors/quotas and OS byte accounting; Safari/PWA persistence/private-storage restrictions; real visual readability/focus/hover and Reduce Motion; native audio download list reconciliation after user-confirmed cleanup; offline upgrade with packaged/current wrapper; installed release display labels. Synthetic native adapters/browser viewports are not physical PASS. No real-user caches were cleared. Stop after Batch4.

## Completion evidence and final refinements

The complete local Validate Develop run finished successfully on2026-10-18, before the final close/dependency refinements. No existing step was skipped (installation/upload are environment setup/artifact actions, not local tests). Its Wave65/66/7 startup comparisons measured18 intercepted remote requests on each side. Real visible/hidden idle gates, Admin/editor/audio intervals, Notes/account isolation, PDF/Print/CSV, six output PDFs, forced Chromium restart and inherited provenance all passed. Full final-head CI, rather than this dirty-worktree run, is authoritative for the final commit and artifacts; exact URL/head are supplied in delivery.

Final scoped reruns cover Escape preview rollback without writes, missing-tools fail-closed behavior and actual day/night automatic palettes without background writes. The new Light fixture was corrected from an invalid ID to actual hope, asserts successful application, and reads CSS colors through Canvas (color(srgb) is not a0–255 RGB string). No earlier expected result or security assertion was weakened. The first full attempt correctly stopped on an over-inclusive runtime-addition list that included new docs/tests; the bridge was narrowed to exact new runtime paths and the full run repeated successfully.

Physical acceptance steps: use a later authorized QA wrapper containing the exact tested SHA; verify each language and phone/tablet orientation; test Bible Paper/night/highlights, Notes and dialogs; preview/save/reopen/cancel a custom palette; enable Reduce Motion; verify denied/unrequested OS permission without claiming provider delivery; measure only on demand; use synthetic expendable audio for confirmed cleanup and retain all personal data; test partial/offline/already-prepared states and distinct Sync/public Refresh. No wrapper/build/install/deploy is authorized by this report.

## Complete changed-file inventory

- `.github/workflows/validate-develop.yml`
- `css/nh7-settings-appearance-batch4.css`
- `docs/qa/WAVE8_PHYSICAL_FIX_BATCH4_AUDIT.md`
- `docs/qa/WAVE8_PHYSICAL_FIX_BATCH4_REPORT.md`
- `index.html`
- `js/app.js`
- `js/nh7-appearance-personalization-v514.js`
- `js/nh7-notification-intents-wave4.js`
- `js/nh7-push-account-bind-v364.js`
- `js/nh7-settings-account-v252.js`
- `js/nh7-settings-batch4.js`
- `js/nh7-settings-controller-v403.js`
- `js/nh7-settings-storage-batch4.js`
- `js/nh7-theme-studio-v453.js`
- `scripts/batch3b_accepted_source.py`
- `scripts/batch4_accepted_source.py`
- `scripts/fixtures/batch4-source-contract.json`
- `scripts/verify-batch3b-safety.py`
- `scripts/verify-batch4-browser.cjs`
- `scripts/verify-batch4-contrast.cjs`
- `scripts/verify-batch4-lifecycle.cjs`
- `scripts/verify-batch4-safety.py`
- `scripts/verify-batch4-storage.cjs`
- `scripts/verify-native-display-name.py`
- `sw-release-core-v403.js`
