# Codex Wave 7 — Platform Completion & Convergence

## Purpose

Complete source-level platform convergence for the current `develop` line across Web/PWA, iPhone/iPad, macOS browser/PWA surfaces, Android phones/tablets, Samsung Fold-class layouts, and the existing historical watchOS companion work, without releasing, deploying, changing Supabase Production, or weakening any Wave 1–6.6 safety boundary.

This wave is **not** a Store release and **not** the final physical-device acceptance wave. It prepares one coherent platform source baseline so Wave 8 can perform installed/native/OS-kill/provider/physical-device acceptance against one exact head.

## Starting point and branch discipline

Authoritative starting `develop` at task creation:

`f625431acf707c83f29206daa64f49fa7c2fae8e`

`main` must remain unchanged at:

`15af811f78a17a0881c13171311e7ade6bc390f4`

Historical reference branches are read-only evidence only:

- `codex/web-mobile-parity-safe-v573` @ `a4c2ca0e90708a4743bd8be3d367e752510c609c`
- `feature/final-qa-v2500-20261004` @ `374b9bfee12897922d82522e47efa4a8837b8b75`
- `feature/watchos-v2500-20261004` @ `8a58086289aa1fa0d9d845f76b574a9422adc63d`

Do **not** merge, rebase, wholesale cherry-pick, or reset from any historical branch. Audit behavior/file-by-file and selectively rebuild only what remains necessary on current `develop`.

Do not create a branch or PR. Work only on existing `develop`.

## Hard prohibitions

Do not:

- modify or merge `main`
- deploy Web/PWA/native builds
- upload to App Store Connect or Google Play
- sign release artifacts
- apply Supabase migrations
- execute Wave 6.6 review SQL
- change Production RLS/views/functions/ACL/Auth/provider settings
- activate CAPTCHA, SMS/KYC, push providers, leaked-password paid features, or other paid capability
- mutate/delete/migrate/backfill/reset real Production user data
- clear users' caches or local data
- change the live four Library views
- activate strict Wave 6.5 registration backend enforcement
- activate the new Full Delete flow
- delete historical branches
- start Wave 8 automatically

Wave 6.6 review artifacts must remain inert/review-only.

## Required pre-implementation audit

Before runtime/source changes, create:

`docs/qa/WAVE7_PLATFORM_COMPLETION_AUDIT.md`

Audit current `develop` and all three historical branches above. Classify each relevant behavior/file as exactly one of:

- `ALREADY_CURRENT`
- `SUPERSEDED`
- `SELECTIVE_REBUILD`
- `SELECTIVE_PORT_WITH_REVALIDATION`
- `REFERENCE_ONLY`
- `REJECT_UNSAFE_OR_STALE`
- `PHYSICAL_QA_ONLY`
- `BLOCKED_TOOLCHAIN`

The audit must cover at minimum:

1. responsive Web/mobile parity and safe-area work
2. iOS/iPadOS Safari/PWA behavior
3. Android/Chrome/WebView source assumptions
4. Samsung Fold narrow/wide posture and resize behavior
5. desktop/macOS browser/PWA behavior
6. deep links/history/back behavior
7. file/download/share/print/PDF paths
8. notification/deep-link handoff source
9. audio/background/media-control source ownership
10. offline/cache/account-switch behavior
11. theme/RTL/LTR/accessibility platform differences
12. historical native QA scripts/assets
13. watchOS project and data contracts
14. any historical native wrapper/build scripts

The audit must explicitly state that historical code is not authoritative merely because it existed before.

## Historical convergence report

Create:

`docs/qa/WAVE7_HISTORICAL_PLATFORM_CONVERGENCE.md`

For each unique historical area, record:

- historical path/commit
- intended behavior
- current `develop` equivalent, if any
- security/account/data impact
- final disposition
- exact current file(s) if rebuilt
- tests proving equivalence or intentional supersession

Do not delete any historical branch in this wave.

## 1. Canonical responsive platform foundation

Use current Wave 6 source as authority and converge all platform-specific fixes into one responsive system. Do not introduce parallel mobile/desktop theme or layout engines.

Validate at minimum these viewport classes:

- 320x568
- 360x800
- 375/390 portrait iPhone-class
- 430 portrait large iPhone-class
- 568/667/844 landscape phone-class
- 600–720 narrow tablet/fold outer display
- 768/820/834 iPad portrait
- 1024/1112/1194 iPad landscape
- Samsung Fold-class narrow outer viewport
- Samsung Fold-class unfolded/wide viewport
- 1280 desktop
- 1440 desktop
- large-height desktop/PWA window

Requirements:

- no horizontal document overflow in supported primary routes
- no clipped primary actions
- no controls under notch/safe-area/home indicator
- keyboard appearance must not permanently corrupt layout
- orientation/resize/fold transition must preserve route and user state
- modal/sheet placement must remain usable in FA RTL and EN/HR LTR
- no duplicate mobile and desktop runtime ownership for the same feature
- split-pane/wide layouts must degrade safely to single-pane
- touch targets remain usable; pointer/keyboard remain usable on desktop

## 2. iPhone / iPad / Safari / iOS PWA convergence

Audit and selectively rebuild useful behavior from historical Web/Mobile and Final-QA branches against current source.

Cover source/fixture behavior for:

- CSS safe-area insets
- top/bottom chrome
- standalone PWA detection only where needed
- Safari viewport height changes
- dynamic address bar / virtual keyboard
- iPhone portrait/landscape
- iPad portrait/landscape
- iPad split-view-like widths
- back/history behavior
- file input/photo selection source paths
- profile-photo persistence path from Wave 6
- Print/PDF/CSV source flows
- Web Share / download fallback source handling
- deep-link cold/warm route restoration source logic
- audio mini-player and route persistence
- notification typed-intent handoff
- offline/reconnect/account switch
- FA/EN/HR + RTL/LTR
- reduced motion

Do not claim native share-sheet, lock-screen audio, background execution, notification delivery, WKWebView or Safari physical acceptance unless actually run in a supported environment. Otherwise mark `PHYSICAL_QA_ONLY` for Wave 8.

## 3. Android phones / tablets / Samsung Fold convergence

Converge source behavior for Chrome/Android-WebView-like environments without inventing a native architecture that is not currently authoritative.

Cover:

- small Android phone widths
- Galaxy Tab-class tablet widths
- Fold outer narrow display
- Fold unfolded wide display
- live resize/posture transitions
- browser/system Back semantics
- keyboard resize/pan source resilience
- safe bottom/navigation spacing
- downloads/Print/PDF/share fallbacks
- notification/deep-link route restoration source logic
- audio route persistence and no duplicate players
- offline/reconnect/account switching
- FA/EN/HR and RTL/LTR
- touch/pointer parity where tablets support both

Any historical Android/native wrapper files may be selectively rebuilt only if they are still required by the current release architecture and can be proven compatible with current Wave 1–6.6 contracts. Do not resurrect stale native code wholesale.

## 4. macOS / desktop browser / PWA convergence

Validate current app source at desktop/PWA window sizes, including Safari/Chrome-like semantics where source-level testable.

Cover:

- resize from narrow to wide and back without route/state loss
- keyboard navigation/focus order for primary UI
- Enter/Space activation of semantic controls
- modals and focus restoration
- scroll containment
- print/PDF/download behavior
- deep-link/history behavior
- audio persistence across route navigation
- no mobile-only assumptions breaking desktop
- FA/EN/HR and RTL/LTR

Do not create a new macOS native app unless the repository already has an authoritative current native contract that requires it. A macOS browser/PWA surface is sufficient for this wave unless existing release architecture proves otherwise.

## 5. watchOS selective convergence

The historical branch `feature/watchos-v2500-20261004` contains a real watch source set, including:

- `watchos/NewHope7Watch/NewHope7WatchApp.swift`
- `watchos/NewHope7Watch/Bible.swift`
- `watchos/NewHope7Watch/Audio.swift`
- `watchos/NewHope7Watch/Info.plist`
- `watchos/project.yml`

Treat these as historical source, not current truth.

Create:

`docs/qa/WAVE7_WATCHOS_CONVERGENCE.md`

Audit every Watch file and every endpoint/data assumption against current `develop` contracts.

If compatible, selectively rebuild a minimal current watchOS companion source on `develop`. Requirements:

- no secrets/API service-role credentials embedded in Watch source
- no bypass of current auth/content-access boundaries
- no new Production backend endpoint solely to make Watch work
- no direct reliance on deprecated/removed historical RPC contracts without current proof
- Bible content behavior must use a currently supported/public-safe data path
- Audio behavior must use current supported catalog/streaming path and never expose privileged URLs/tokens
- graceful offline/error/empty states
- no destructive user actions from Watch
- localization at least FA/EN/HR for user-visible Watch labels when practical in current architecture
- RTL text rendering for Persian content where watchOS supports it
- Dynamic Type/readability/accessibility labels
- reduced unnecessary network refresh/polling
- no background loop or high-frequency timer
- no claim of independent cellular/background playback unless physically proven later

If current backend/auth contracts make a historical Watch capability unsafe, omit that capability and document it rather than weakening security.

Static/source validation of Swift/YAML/plist must be added where toolchain permits. If Xcode/watchOS SDK is unavailable, mark compile/device acceptance `BLOCKED_TOOLCHAIN` / `PHYSICAL_QA_ONLY`; do not fake a successful native build.

## 6. Deep-link, Back, resume and route convergence

Run a platform-oriented regression over the Wave 6 router/deep-link work.

Must cover:

- Bible exact verse
- Daily content where supported
- Audio/Sermon canonical player
- Inbox typed intents
- School authorized destinations
- Plans exact valid destinations
- Library authorization gates
- Profile
- Community
- Documents
- Calendar → Bible handoff

Requirements:

- no arbitrary external URL execution
- revoked/unauthorized targets fail closed
- account switch fences stale navigation
- cold/warm/foreground source handling remains deterministic
- browser/system Back does not create duplicate history entries or reopen stale modals
- fold/orientation/resize does not reset route

## 7. Audio/platform media behavior

No redesign. Preserve Wave 6 canonical player behavior.

Audit historical platform/audio code for useful source patterns only.

Prove source-level:

- one logical player owner
- mini-player and full-player state remain synchronized
- navigation does not spawn duplicates
- playback position/resume state remains owner/account fenced where applicable
- rate/play/pause/seek state survives responsive layout changes
- background/media-session integrations, if present, do not create recurring polling
- notifications/deep links can open the canonical player
- offline/download semantics remain unchanged unless explicitly required by current architecture

Physical lock-screen/Bluetooth/headset/background-kill acceptance belongs to Wave 8.

## 8. Offline/cache/storage/quota discipline

Wave 7 must not increase operating cost or introduce unnecessary memory/storage growth.

Requirements:

- preserve Wave 1/2 local-first and no-polling guarantees
- no new 60-second idle network activity
- no duplicate large catalog caches per platform
- no per-device unbounded log/history growth
- no blanket cache clears on account switch; clear/fence only owner-specific state as required
- Watch caches, if introduced, must be bounded and small
- image/profile/audio object URLs must be released appropriately
- platform listeners/observers must be idempotent
- resize/orientation listeners must not multiply

## 9. Accessibility and input parity

Across Web/PWA and any newly converged Watch source:

- semantic primary controls
- focus visibility
- keyboard access for desktop primary flows
- sensible focus restoration after dialogs
- no focus trap regressions
- accessible names for icon-only controls
- reduced-motion respected
- sufficient dark/night readability preserved
- dynamic type/text scaling resilience where platform-specific source supports it
- RTL/LTR correctness

Do not claim formal WCAG/native accessibility certification; report source/fixture evidence only.

## 10. Account, authority and security invariants

Wave 7 must preserve:

- School server authority
- Admin server authority
- Library authorization
- Wave 4 notification fences
- Wave 5 Document Studio review-only backend state
- Wave 6 account isolation
- Wave 6.5 registration source hardening
- Wave 6.6 Supabase review-only state

No platform-specific bypass, hardcoded admin email, service-role secret, privileged URL, cross-account cache leakage, or stale-account callback is allowed.

Watch/native source must never weaken Web security to simplify integration.

## 11. Historical branch safety

For each historical branch, explicitly prove that no wholesale merge/cherry-pick occurred.

At minimum inspect:

### `codex/web-mobile-parity-safe-v573`
Focus on safe area, responsive parity, iOS chrome/surface behavior, profile/community/plans/notes/mobile UI concepts. Rebuild only behavior still missing on current Wave 6 source.

### `feature/final-qa-v2500-20261004`
Treat as a broad old QA/native reference. Inspect platform-specific QA scripts, native assumptions, responsive/device fixes, audio/push/deep-link/watch-adjacent concepts. Do not restore its old runtime wholesale.

### `feature/watchos-v2500-20261004`
Audit and selectively rebuild only safe, current-compatible Watch functionality.

## 12. Platform/native asset inventory

Create:

`docs/qa/WAVE7_NATIVE_ASSET_INVENTORY.md`

Inventory every current or newly added platform/native artifact:

- watchOS
- iOS-related release/source artifacts if tracked
- Android-related release/source artifacts if tracked
- PWA manifest/service worker/install-related files
- platform QA scripts

For each, record:

- source of truth
- current status
- buildability/toolchain status
- whether included in Wave 8 physical acceptance
- whether release/signing is explicitly deferred

Do not include private signing keys, provisioning profiles, certificates, passwords or service-role credentials in repository evidence.

## 13. Measurements

Create:

`docs/qa/WAVE7_PLATFORM_MEASUREMENTS.json`

Measure at minimum, where fixture/browser tooling permits:

- signed-in startup request count
- visible idle 60 seconds
- simulated hidden idle 60 seconds
- narrow→wide→narrow resize request delta
- repeated orientation/viewport changes callback/listener growth
- route navigation with mini-player
- deep-link route handoff
- account switch
- responsive/global listener count if measurable
- Watch source network policy/static check if Watch is added

Explain any increase from Wave 6/6.5 baselines. No recurring polling may be introduced.

## 14. Regression suite

Run all current Validate Develop gates and all existing Wave 1–6.6 regressions.

Add targeted Wave 7 tests for:

- responsive viewport matrix
- iOS safe-area source behavior
- tablet/iPad widths
- Samsung Fold narrow/wide transitions
- route preservation across resize
- Back/history convergence
- keyboard/focus/modal behavior
- FA/EN/HR + RTL/LTR across platform-sensitive UI
- audio single-owner behavior
- profile photo/account fencing
- Library/School/Inbox/deep-link authority
- Watch static/source contracts if Watch is converged
- no secrets in platform source
- no new polling/listener multiplication

Do not weaken existing tests. If a stale fixture must change, document why and preserve or strengthen the underlying assertion.

## 15. Physical/native limitations

The final report must separately list what remains unproven until Wave 8, including as applicable:

- actual iPhone installation
- iPad installation/split-screen
- Safari share/print sheets
- iOS background audio/lock-screen controls
- push delivery on device
- Android installation
- Samsung Fold real posture behavior
- Android background kill/restart
- Bluetooth/headset controls
- actual offline OS-kill recovery
- Apple Watch Ultra installation/pairing
- watchOS background/cellular/audio behavior
- App Store/Play signing/upload
- battery/thermal/memory pressure

Do not convert emulator/browser/source evidence into a physical-device claim.

## Required Wave 7 reports

Create and commit:

- `docs/qa/WAVE7_PLATFORM_COMPLETION_AUDIT.md`
- `docs/qa/WAVE7_PLATFORM_COMPLETION_REPORT.md`
- `docs/qa/WAVE7_HISTORICAL_PLATFORM_CONVERGENCE.md`
- `docs/qa/WAVE7_WATCHOS_CONVERGENCE.md`
- `docs/qa/WAVE7_NATIVE_ASSET_INVENTORY.md`
- `docs/qa/WAVE7_PLATFORM_MEASUREMENTS.json`

If Watch is blocked and no source is added, the Watch report must still give exact blockers and historical disposition.

## Final acceptance requirements

Before completion:

1. `develop` working tree clean.
2. `main` unchanged.
3. No new branch or PR.
4. No deployment/signing/upload.
5. No Supabase/Production mutation.
6. No Security Activation performed.
7. No historical wholesale merge/rebase/cherry-pick.
8. All Wave 1–6.6 regressions pass.
9. Wave 7 targeted tests pass.
10. Migration parity remains exact; the pre-existing pending migration remains unapplied unless owner separately approves outside this task.
11. Final `Validate Develop` must succeed with `head_sha` exactly equal to final remote `develop` SHA.
12. No Wave 8 work begins automatically.

## Final response required from Codex

Return:

- exact starting `develop` SHA
- pre-implementation audit commit SHA
- every implementation/follow-up commit SHA
- exact final `develop` SHA
- unchanged `main` SHA
- changed-file count and diff stats
- all six Wave 7 report paths
- exact successful CI URL with `head_sha` equal to final `develop`
- migration parity
- historical branch convergence matrix/counts
- iPhone/iPad source status
- Android/tablet/Fold source status
- macOS/desktop/PWA status
- watchOS status and exact files added/rebuilt/rejected
- deep-link/Back/history status
- audio platform status
- offline/cache/listener measurements
- FA/EN/HR and RTL/LTR platform status
- accessibility/source status
- account/security regression status
- all `PHYSICAL_QA_ONLY` and `BLOCKED_TOOLCHAIN` items
- explicit confirmation of no deploy, no Store upload, no Supabase mutation, no `main` change, no paid activation, no Wave 8 start

Stop after Wave 7.