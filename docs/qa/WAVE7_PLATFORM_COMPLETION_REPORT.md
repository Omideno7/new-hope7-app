# Wave 7 platform completion report

2026-10-16, Europe/Zagreb. Source/fixture convergence only; not release or installed-device acceptance. Stop after Wave7. Wave8 is not started.

Starting develop: `8bdb9a0cad807440b36bdca7c5a6f53562cc9e70` (the Wave7 specification-only successor of accepted Wave6.6 `f625431acf707c83f29206daa64f49fa7c2fae8e`). Pre-implementation audit: `8ea01abb56e499fad9676e942cfe2d4ca7884705`, committed before runtime changes. Main remains `15af811f78a17a0881c13171311e7ade6bc390f4`. Implementation/follow-up/final remote develop hashes, complete start→final diff statistics and successful **matching-head** Validate Develop URL are returned in the final delivery. A report cannot contain the hash of its own commit. CI artifacts include `measured_head=GITHUB_SHA` and actual five runtime-file SHA-256 values; no older green run substitutes for final-head CI.

## Confirmed problems and bounded changes

1. Before change, a24px simulated top safe area still produced only12px topbar padding at320/390/820/844/1194 widths. The wide nav used a hardcoded102px top offset instead of the actual header height. Rebuild measured geometry only; current v570 remains the navigation/split-pane owner.
2. Before change,844x390 landscape rail ended at322px while its last two controls ended at330/375px, clipped inside the nav. Short windows now use the same six canonical controls in a horizontal row with >=44px height, wrapping labels and no hard height cap. Wide/tall Web retains its current rail.
3. Native source now explicitly owns header/content/nav inset rows: `auto minmax(0,1fr) auto`, visible viewport height, one scrolling content row, safe-area padding within theme-colored header/navigation, no white filler or native touch suppression. Existing v558 mini-player owner remains; only docking CSS reads actual nav height. Programs tabs scroll normally. This is source/browser evidence, **not proof physical R7/R8 regression is fixed**.
4. PWA manifest `orientation:portrait` prevented intended installed landscape/Fold parity. Change only orientation→any; install identity/start/scope/icons stay exact.
5. Add focus-visible presentation for semantic controls. No theme engine, router, Profile/Notes/School/data/playback behavior replaced.
6. Rebuild minimal safe Watch public Bible/settings source. Reject the historical anonymous direct sermon-table/raw URL player. The Watch Audio tab explicitly says playback is unavailable and directs the user to the iPhone app; it does not claim to launch/play anything.

Existing runtime changes are only **index.html, manifest.json, sw-release-core-v403.js** plus the two new geometry files. Geometry assets total **6,899 bytes** (JS2,284; CSS4,615). Cache rotation targets executable assets only, adding their precache/fetch allowlist entries. Stable data/cache ownership, verified public readers, Ministers-online-only policy, downloads and user data stay unchanged. Existing registration/full-delete/backend/review flags remain disabled/inert. No Supabase source or migration change was needed.

## Platform and behavior matrix

| Area | Source/fixture result | Remaining acceptance |
| --- | --- | --- |
| Web/PWA responsive | PASS current layout engine; six controls not clipped, no document overflow in new matrix and current route sweep | Actual installed-PWA orientation/cache behavior PHYSICAL_QA_ONLY |
| iPhone/iPad/Safari source | PASS explicit insets/row backgrounds, height restoration, phone/tablet landscape/portrait, Home photo, mini dock, normal Plans tabs | Safari and WKWebView physical bars/keyboard/split view/OS contentInset unproven |
| Android phone/tablet/Fold | PASS current shared source in Android native-mode fixtures, narrow/wide/short-height and repeated transitions retain exact route/state/player | Real WebView/system Back/posture/pan/OS lifecycle PHYSICAL_QA_ONLY |
| macOS/desktop/PWA windows | PASS browser source320–1600 widths and large-height window, pointer/keyboard/Enter/Space/Escape/focus restoration | macOS Safari/installed PWA/native sheets PHYSICAL_QA_ONLY; no new macOS native app |
| Watch | Public Bible all66/1189/FAENHR texts exact; static bounds/config/labels/network checks PASS; Audio intentionally unavailable | Swift/Xcode/watchOS SDK/XcodeGen and companion embedding BLOCKED_TOOLCHAIN; Watch device PHYSICAL_QA_ONLY |
| Deep links/Back/history | Current Wave4/6 canonical router retained; exact Bible/Plans/reflections/Calendar/Search destinations, cold typed intent, warm handoff and Back/regression PASS | OS notification/deep-link launch/resume/kill acceptance PHYSICAL_QA_ONLY |
| Daily / Inbox / School / Library / Profile / Community / Documents destinations | Current direct routes and typed intent/permission/account gates retained; current authorized/revoked/wrong-owner/offline/stale callbacks regressions PASS | Review-only backend-dependent features remain review-only; no new privileged route |
| Audio/media | Same classic484/media500 instance, mini/full synchronization/rate/time/navigation and responsive changes PASS; existing signing/downloads untouched | Lock-screen/Bluetooth/headset/background kill/native codec/audio focus unproven |
| Print/PDF/CSV/Share/file picker | Existing report116/119/121 and StudioV2/QR fixtures pass, actual PDF bytes and actionable print fallback retained; current v564 crop/owner fences unchanged | Physical Safari share/print/Save to Files/file picker/native download acceptance Wave8 |
| Offline/cache/quota | Existing Wave1/2/572 and Library security regressions retained, stable cache/data untouched; no new runtime catalog/cache/log/telemetry | Actual OS quota/eviction/storage pressure/offline OS-kill recovery unproven |
| FA/EN/HR / RTL/LTR / themes | 3locale×3platform-mode×20viewport cases; current Wave6 complete route/theme sweep retained; Watch9label keys all3languages/RTL | Native fonts/Dynamic Type/VoiceOver/OS RTL acceptance unproven; no formal WCAG certification |
| Accessibility/input | Focus-visible outline, semantic controls, >=44px nav, Enter/Space photo viewer, Escape/return focus, reduced-motion fixture, current Calendar/dialog cleanup PASS | Screen reader/Switch Control/Digital Crown/text scaling/native certification deferred |
| Account/security | Current UID photo, Notes/Plans no-write, School/Admin/Library authority, Wave4 bindings/intents and stale callback fences PASS | No live security activation, new Full Delete or strict registration enforcement; physical shared-device acceptance Wave8 |

New platform test: **180 geometry/language/platform cases**,20sizes ×3languages ×Web/iOS-mode/Android-mode. Sizes:320x568,360x800,375x812,390x844,430x932,568x320,667x375,844x390,600x960,672x840,720x960,768x1024,820x1180,834x1194,1024x768,1112x834,1194x834,1280x800,1440x1000,1600x1400. Existing Wave6 **567 route/language/width cases** and32palette highlighted-text contrast probes remain intact; contrast probes are not a formal whole-app audit. New tests also cover20fold resize cycles per platform, listener singleton re-evaluation, keyboard shrink/restore, exact verse/Back, native single scroller/row colors/insets, Home photo on every size, no Notes byte change and A→B photo/Library fencing. Native APIs/viewport values are explicit fixtures, not device emulation proof.

## Historical convergence

Exact pinned refs audited without integration/deletion:

- parity `a4c2ca0e90708a4743bd8be3d367e752510c609c`
- Final-QA `374b9bfee12897922d82522e47efa4a8837b8b75`
- Watch `8a58086289aa1fa0d9d845f76b574a9422adc63d`

The43reference-path census records **ALREADY_CURRENT9, REFERENCE_ONLY11, SELECTIVE_REBUILD5, SUPERSEDED4, REJECT_UNSAFE_OR_STALE14**. Separate behavior rows explain current Profile564, virtual Notes, Community/Calendar/Search/Exam/Library, current audio/push/offline and measured chrome decisions. No historical runtime, SQL, signing workflow, stale native validator or Android install/force-stop/connectivity script was copied/run. Current business source remains hash-exact. Watch rebuilt/added/rejected files and toolchain limitations are itemized in its report; the five historical Watch source paths were individually inspected.

## Measurements

See `WAVE7_PLATFORM_MEASUREMENTS.json` for local captured evidence and exact-head CI artifact `wave7-measurements-<final SHA>` for the final committed head. Real60s visible and60s simulated-hidden windows; no timer/Date acceleration. All remote providers intercepted, synthetic users only. Baseline/current signed-in startup **18/18** intercepted requests. Visible60s **0/0**, simulated hidden60s **0/0**. Narrow→wide→narrow **0/0**,40viewport/orientation changes **0/0**, settled2s **0/0**. Existing mini-player navigation **1/1** (`notification_schedules`), exact warm verse handoff **0/0**, account switch **1/1** (`nh7_admin_my_access_v350`). Global listener registrations **304→312** (+8 fixed presentation listeners), with **0 growth** across idle,40resizes,route handoff/navigation and account switch. Current40resize phase:80coalesced geometry frames/40ResizeObserver callbacks; settled2s and both60s idle windows:0frames/0callbacks. One header/nav ResizeObserver, no observer multiplication. Startup wall time under concurrent local fixture load **7166ms baseline /7139ms current**, including the deliberate5s settlement; not an absolute device startup benchmark. No added requests or recurring work.

No platform polling, timers, network/API call, localStorage/sessionStorage/content cache/write, new routing/player owner or touch suppression exists in the geometry module. One singleton ResizeObserver watches only header/nav, writes changed CSS variables and coalesces requestAnimationFrame. Repeated module evaluation adds no listeners. Watch runtime network/polling/content cache are0; immutable derived Bible bundle15,958,491 bytes with maximum chapter132,978 bytes. Loader caps32KiBcatalog/256KiBchapter/200verses. This is not native RSS/battery/thermal proof.

Raw initial startup measurements found18/19requests on **both unchanged baseline and current source**, differing only by an existing forced Inbox startup synchronization race. The new Wave7 harness fixes response latency at500ms on **both** sides, keeping real application code and all requests intact. It records every count/name; no current application assertion is removed and no pre-existing suite assertion weakened. Mini-player navigation and account switch may retain existing one-shot reads, itemized in measurements; no claim all legitimate activity makes zero requests.

## Verification and safety boundaries

Local current release/source/security/functional/browser gates passed, including all Wave1–6.6 functional regressions and focused Wave7 tests. The full current Validate Develop workflow additionally repeats real-clock Wave6.5,6.6 and7 measurement gates and uploads exact-head evidence. Completion requires its successful run with head SHA equal to final remote develop; the exact URL/result is provided in the final delivery, not inferred from earlier runs. Checked-in measurements explicitly identify the pre-commit working tree and bind its actual runtime hashes; CI artifacts bind the final committed head.

Checks include active JS syntax, current responsive570/theme571/offline572, migration checkpoint, School identity/exam/assignment/certificate/public verifier, Next Native Optimization Guard, Wave1cost/Wave2local-first and reconnect, Wave3birthday/Admin, Wave4contracts/events/language/intents/binding/Inbox, Wave5Studio lifecycle/outputs/QR/races/authority, Wave6Profile/Search/Notes/Calendar/Library/security/themes/localization, Wave6.5validation/confirmation/E.164/CAPTCHA-disabled/synthetic deletion/same-email/shared-device/secret scan and Wave6.6metadata/decisions/synthetic Postgres/rollback regressions. School reportCSV/actualPDF/Print/actionable fallback, Community, Notes account merge, Audio safety and current build provenance also run. PGlite executes only isolated synthetic fixture regressions; no Production SQL/client is contacted. No review SQL is applied to any live/staging project.

Earlier source-freeze tests retain every underlying assertion through a **new independent hash-bound reversible Wave7 adapter**: only the three existing entry/manifest/core files and two exact new presentation assets are authorized. All other app/router/player/persistence/authority/School/Notes/Plans/Profile/Community/notification/Studio/data/backend/migration/review bytes stay unchanged. No wildcard product/backend exemption. Source/measurement tests supplement, rather than replace, functional regressions. All changed JS syntax/Python parsing/YAML/plist and `git diff --check` pass.

Migration parity: **42/42 raw-hash exact;0missing;1pre-existing pending**, `20261012123000_audio_bible_public_catalog_read_v511.sql`, unchanged/unapplied. No ordinary or review migration/backend contract added. Wave6.6 metadata/review artifacts remain exactly inert; all live Advisor findings and activation blockers remain live until separately approved.

## Physical/toolchain limits and handoff

**BLOCKED_TOOLCHAIN:** Xcode/watchOS SDK/Swift/XcodeGen compile/API verification; Watch companion target/embedding/assets/Info.plist build validation; current native wrappers are not available here. Browser/static source checks must never be reported as successful native builds.

**PHYSICAL_QA_ONLY:** actual iPhone/iPad install, safe-area/status/home-indicator bands, split-screen/orientation/keyboard; actual Safari PWA launch/share/print/Save to Files; native file/photo picker and OS-kill persistence; iOS background/lock-screen/audio focus; push permission/delivery/typed launch/resume; Android install/tablet/real Fold posture/system Back/background kill; Bluetooth/headset; offline OS-kill/quota/eviction; macOS Safari/PWA sheets; Apple Watch Ultra install/pairing/VoiceOver/Dynamic Type/RTL/Digital Crown; cellular/background/thermal/battery/memory pressure. Watch audio is intentionally not supported, not merely untested. Store signing/upload/release is separately deferred and was not performed.

No branch or PR created. Only develop committed/pushed; main unchanged. No historical merge/rebase/reset/cherry-pick/deletion. No deployment, signing, Store upload, Supabase/Production/Auth/RLS/ACL/view/function/provider change, paid activation, real notification, user-data mutation/delete/migrate/backfill/reset, cache clear, strict registration or new Full Delete activation. No Wave8 work started. Existing Draft PRs remain untouched.

## Committed evidence

- `docs/qa/WAVE7_PLATFORM_COMPLETION_AUDIT.md`
- `docs/qa/WAVE7_PLATFORM_COMPLETION_REPORT.md`
- `docs/qa/WAVE7_HISTORICAL_PLATFORM_CONVERGENCE.md`
- `docs/qa/WAVE7_WATCHOS_CONVERGENCE.md`
- `docs/qa/WAVE7_NATIVE_ASSET_INVENTORY.md`
- `docs/qa/WAVE7_PLATFORM_MEASUREMENTS.json`

Exact source patch/allowlist: `scripts/fixtures/wave7-approved-platform.{json,patch}`. Actual CI workflow: `.github/workflows/validate-develop.yml`. Tests: `scripts/verify-wave7-platform-browser.cjs`, `scripts/verify-wave7-watch.py`, `scripts/verify-wave7-safety.py`; measurement driver `scripts/measure-wave7.cjs`. Watch source/build-only generator documented in `watchos/README.md`. Final delivery supplies exact final SHA/run URL/diff and limitation status, not an approval to release.
