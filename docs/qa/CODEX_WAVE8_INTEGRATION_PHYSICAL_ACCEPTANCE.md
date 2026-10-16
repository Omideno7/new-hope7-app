# CODEX WAVE 8 — Integration, Upgrade, Physical Device & Final Acceptance

Date: 2026-10-16

Authoritative starting `develop` SHA: `6c41958b7027f4da51f9f96f755a52aaa4ba3cb5`

This Wave is the final integration/device-acceptance phase before any final release-readiness freeze or `develop -> main` approval.

Wave 8 must not deploy, release, mutate Production, apply Supabase security/document packages, or change `main`. It must prove what can be proven now, prepare exact physical/native evidence, fix only defects discovered within approved scope, and clearly separate automated/simulator evidence from real-device acceptance.

## 0. Read first

Before implementation or QA, read:

- `AGENTS.md`
- `docs/DEVELOPMENT_WORKFLOW.md`
- `docs/RELEASE_PROVENANCE.md`
- `docs/qa/PRODUCT_COMPLETION_MASTER_AUDIT.md`
- `docs/qa/WAVE4_NOTIFICATIONS_REPORT.md`
- `docs/qa/WAVE5_DOCUMENT_STUDIO_REPORT.md`
- `docs/qa/WAVE6_USER_APP_COMPLETION_REPORT.md`
- `docs/qa/WAVE6_5_SECURITY_REGISTRATION_REPORT.md`
- `docs/qa/WAVE6_6_FINAL_REPORT.md`
- `docs/qa/WAVE7_PLATFORM_COMPLETION_REPORT.md`
- `docs/qa/WAVE7_WATCHOS_CONVERGENCE.md`
- `docs/qa/WAVE7_5_ADMIN_DOCUMENTS_REPORT.md`
- `docs/qa/WAVE7_5_ZERO_COST_AUDIO_ANALYTICS_DECISION.md`
- `supabase/review/wave7_5-admin-documents/activation-checklist.md`

Before changing runtime source, create and commit:

`docs/qa/WAVE8_INTEGRATION_PHYSICAL_ACCEPTANCE_AUDIT.md`

The audit must record:

- exact fetched remote `develop` SHA
- exact `main` SHA
- working-tree state
- native wrapper/project inventory
- toolchain availability
- simulator/emulator availability
- physical-device availability actually visible to the environment
- signing capability actually available
- all inherited `PHYSICAL_QA_ONLY`, `BLOCKED_TOOLCHAIN`, `BLOCKED_ACTIVATION`, and unresolved items from Waves 1–7.5
- which items can be proven automatically
- which require a real physical device or owner action

Do not claim physical acceptance from browser emulation.

## 1. Branch and release discipline

Work only on existing `develop`.

Do not:

- create another branch
- create a PR
- change or merge `main`
- create a Store release
- deploy Web/PWA
- upload App Store / TestFlight / Google Play artifacts
- apply Production migrations
- mutate Production Supabase/Auth/RLS/ACL/functions/views/data
- activate Wave 6.6 security proposals
- activate Document Studio backend
- issue a real document
- activate strict registration enforcement
- activate Full Delete
- activate paid features/providers

All Wave 8 fixes and evidence must remain on `develop`.

## 2. Exact build provenance

The goal is to prove that every build/test artifact uses the exact accepted Wave 8 `develop` SHA and current native wrappers.

Audit current iOS/iPadOS/macOS/Android/watchOS wrapper/project sources and build scripts.

For every build that can actually be produced in the available environment:

- record exact Git SHA
- record wrapper/project source
- record build tool versions
- record platform/version/build identifiers
- hash the exported/shared application payload
- generate or update build metadata using the repository's current provenance tooling
- prove no historical Store payload silently replaced current `develop`

A version label is not provenance.

If a native build cannot be produced because Xcode, signing, Gradle, SDKs, simulator, emulator, or physical device is unavailable, classify it accurately as `BLOCKED_TOOLCHAIN` or `PHYSICAL_QA_REQUIRED`.

Do not fabricate build success.

## 3. Priority 1 — Document Studio physical/output acceptance

Document issuance is the highest-priority physical QA item.

Do not activate the Production backend in this Wave.

Test the current source/fixture/local output path on every platform/toolchain actually available.

Required checks:

- Admin can enter Document Studio only with current authorized Admin state
- normal/anonymous user cannot enter privileged authoring
- Create -> type/template -> recipient -> FA/EN/HR edit -> Preview -> validation -> Prepare -> explicit Confirm flow remains correct
- no automatic issue action
- malformed/empty/stale issue receipt cannot mark a document issued
- retry reuses the exact request identity
- previous issued/revision fixtures remain immutable
- My Documents remains owner isolated
- QR contains only the safe verification URL/token contract
- public verification displays only minimum safe proof
- old School/legacy certificate flows remain intact

Physical/output checks where possible:

- FA fonts render correctly
- EN/HR fonts render correctly
- RTL/LTR layout is correct
- A4 portrait geometry
- A4 landscape geometry
- photo/logo/signature/seal/background placement
- QR readability
- PDF creation
- Print flow
- Share flow
- Save-to-Files/download flow
- open/reopen generated PDF
- no clipped footer/header/content
- no wrong page scaling
- no private information in QR or public proof

Required target platforms for final acceptance are:

- iPhone
- iPad
- Android phone
- Samsung Galaxy Fold or equivalent foldable
- Android tablet
- macOS/Safari/PWA where available

If actual physical output cannot be tested in Codex's environment, prepare an exact owner-executable checklist and mark those rows `PHYSICAL_QA_REQUIRED`; never mark PASS.

Wave 8 must finish with a precise statement of what remains before the separate Document Production Activation gate.

## 4. iPhone / iPad / iOS PWA / WKWebView

Where toolchain/device access exists, verify:

- clean install/upgrade behavior
- exact current shared payload
- portrait/landscape
- safe areas/notch/home indicator
- keyboard open/close and focus restoration
- modal/dialog focus
- app Back/history/deep links
- Calendar -> Bible
- Bible exact verse deep links
- Global Search -> Bible/Audio destination
- Profile photo persistence
- Notes persistence and plain-text rendering
- Account A -> B isolation
- logout
- offline/reconnect
- OS/background/foreground transitions
- audio background behavior
- lock-screen/media controls
- Bluetooth route changes if a real device is available
- file/PDF Share and Print sheets
- notification click/resume only if existing provider delivery can be tested without activating a new provider or paid feature

Do not claim APNs/notification success unless a real notification actually reaches a real device and exact target behavior is observed.

## 5. Android phone / tablet / Samsung Fold

Where toolchain/device access exists, verify:

- clean install/upgrade
- exact current shared payload
- Android system Back
- app history
- deep links
- portrait/landscape
- keyboard/focus
- safe areas/system bars
- tablet wide layout
- Fold narrow cover state
- Fold open/wide state
- live narrow <-> wide transition without losing route/content/account/audio state
- split/resume behavior where available
- Profile photo
- Notes
- School forms/exams/reports
- PDF/Print/Share/Save
- offline/reconnect
- background audio/media session
- OS kill/relaunch and recovery
- account switching

Do not use viewport resizing alone as Fold acceptance.

## 6. macOS / desktop / installed PWA

Where available verify:

- exact shared payload
- resize/min/max window behavior
- keyboard navigation
- focus visibility
- dialogs
- browser Back/Forward
- deep links
- offline/reconnect
- install/update PWA behavior
- file/PDF download
- Print
- Share where supported
- Document Studio output
- Admin Workspace
- session/account switching

If the native Mac/Catalyst wrapper exists and can be built, test it separately from Safari/PWA and record that distinction.

## 7. Apple Watch / watchOS

Use only current Wave 7 safe watchOS source.

Do not restore the historical direct sermon URL player.

Required checks where Xcode/watchOS toolchain exists:

- project generation/build
- companion target/embed relationship
- install/pair with iPhone if a physical Watch is available
- launch
- FA/EN/HR Bible resources
- all 66 books / 1,189 chapters remain valid
- navigation/scrolling/readability
- no network dependency for bundled Bible content
- no audio playback claim; audio remains intentionally unsupported unless separately approved in a future task
- accessibility/readability
- app version/build consistency

If Xcode/watchOS SDK or physical pairing is unavailable, keep status `BLOCKED_TOOLCHAIN` / `PHYSICAL_QA_REQUIRED`.

## 8. Upgrade / legacy / old-user acceptance

Wave 8 must test upgrades rather than only fresh installs.

Using safe synthetic/local test accounts/data, cover:

- existing session upgrade
- old local Notes formats
- existing saved verses/highlights
- favorites
- audio progress/resume
- downloaded audio metadata/files where testable
- School progress/drafts/assignments/exam state
- profile photo
- Inbox/read receipts
- notification binding state
- Library cache/grants
- appearance/theme/language
- fasting/reading-plan progress
- existing Document/School certificate links

Never clear user data to make an upgrade pass.

Unknown legacy ownership must remain quarantined/fail-safe rather than assigned to the wrong account.

Do not backfill or mutate Production users.

## 9. Offline, reconnect, OS kill, storage/quota

Test the current local-first behavior under realistic failure transitions:

- start online -> go offline -> continue safe local actions -> reconnect
- start offline
- reconnect during pending write
- duplicate/repeated reconnect
- browser/app background and resume
- abrupt process termination where toolchain permits
- relaunch after termination
- low/limited storage simulation where available
- storage/quota write failure handling
- IndexedDB/local storage failure handling where testable
- cached public Library behavior
- protected Library freshness rules
- offline audio only when already downloaded
- no deletion of existing downloads/user data as automatic recovery

Verify no request storms, uncontrolled retries, polling, or repeated listeners.

## 10. Account, privacy, and stale-response isolation

Repeat account isolation against actual integrated runtime:

- account A -> B
- B -> logout
- delayed A response after B is active
- delayed Admin response
- delayed Document recipient/search response
- delayed Library response
- delayed Profile/Notes/Search response
- stale signed audio URL
- cached/private data from prior owner

No prior account's private content may appear under the new account.

This includes:

- Notes
- profile photo
- School
- documents
- Library protected items
- Inbox
- audio progress/favorites/download metadata
- Admin state

## 11. Notifications / Inbox integration

Preserve Wave 4 notification architecture.

Do not activate a new provider or paid feature.

Where existing configured real delivery can be safely tested without changing Production/provider configuration, verify:

- foreground receipt
- background receipt
- closed-app receipt
- notification tap
- exact destination
- account binding
- FA/EN/HR delivery where actually available
- Inbox synchronization
- timestamps
- read/delete receipts

If real provider/device delivery cannot be executed, classify it `PHYSICAL_QA_REQUIRED` / `PROVIDER_EVIDENCE_REQUIRED`; do not simulate it as PASS.

## 12. School integration

Verify end-to-end integrated behavior using non-Production/synthetic safe data where possible:

- registration UI
- approved/unapproved state rendering
- class/stage path
- assignments
- needs-revision flow
- video/audio progression
- exams
- retry limits/current rules
- wrong answer review
- reports
- CSV
- PDF
- Print
- certificate/public verification compatibility

Do not invent or change server progression rules in Wave 8.

## 13. Library integration

Preserve current compatibility until separate security activation.

Verify:

- public collections/items
- protected/ministers current-grant freshness
- reader
- files
- language metadata
- three-language content
- Admin publication UI source behavior where applicable
- old clients/compatibility assumptions remain intact

Do not activate Wave 6.6 Library view replacement in Wave 8.

Do not apply the pending v511 migration.

## 14. Audio/media integration

Audio Analytics remains `REJECTED_COST`.

Do not add analytics.

Verify actual user-facing audio behavior:

- catalog
- direct play
- mini-player
- full player
- same-player continuity
- seek
- speed
- pause/resume
- next/previous
- favorites
- likes/blessings current behavior
- Notes interaction
- offline downloaded audio
- resume position
- route changes
- screen/background behavior where available
- account switch/logout fencing

The test itself must not re-enable retired telemetry.

## 15. Accessibility and localization

Run automated and physical/manual acceptance where possible for:

- FA RTL
- EN LTR
- HR LTR
- dynamic text wrapping
- minimum usable font sizes
- focus visibility
- keyboard-only navigation on desktop
- semantic control labels
- screen-reader labels where inspectable
- reduced motion
- touch target usability
- contrast across current themes
- dark/light mode
- dialog focus/restore
- orientation/layout changes

Do not claim formal WCAG certification unless actually performed by an appropriate process.

## 16. Performance, listener, network and cost regression

Preserve the cost discipline from Waves 1 and 7.5.

Measure at minimum:

- startup requests
- 60-second visible idle
- 60-second hidden/background idle
- repeated route navigation
- 40+ resize/posture transitions where applicable
- account switch
- Admin idle
- Document editor idle
- Audio 60-second playback
- offline/reconnect
- listener/observer/timer growth

No new polling.

No request storm.

No Audio Analytics backend use.

Do not claim physical CPU/battery/thermal improvements unless measured on an actual device.

If actual devices are available, record battery/thermal/memory observations as observations, not universal guarantees.

## 17. Native wrapper/source integrity

Audit and preserve current native wrappers/configuration.

Do not recreate native projects from stale historical branches.

Do not silently replace current Capacitor/native configuration with old Store files.

Check:

- iOS project/config
- Android project/config
- package/dependency lock state
- Capacitor configuration
- entitlements/permissions
- URL/deep-link configuration
- notification integration wiring
- file/share/print plugins
- media/background capabilities
- watch companion integration source

Changes are allowed only when required to fix a proven Wave 8 defect and must be documented exactly.

## 18. Physical QA evidence package

Create:

- `docs/qa/WAVE8_DEVICE_TEST_MATRIX.md`
- `docs/qa/WAVE8_PHYSICAL_ACCEPTANCE_REPORT.md`
- `docs/qa/WAVE8_UPGRADE_OFFLINE_REPORT.md`
- `docs/qa/WAVE8_INTEGRATION_MEASUREMENTS.json`
- `docs/qa/WAVE8_FINAL_REPORT.md`

The device matrix must have explicit rows for:

- iPhone
- iPad
- Android phone
- Samsung Fold
- Android tablet
- macOS/Safari/PWA
- Apple Watch

For every row record:

- device/model if actually known
- OS version if actually known
- test/build SHA
- install/build method
- PASS / FAIL / PHYSICAL_QA_REQUIRED / BLOCKED_TOOLCHAIN
- evidence summary
- unresolved issues

Never fill unknown physical evidence with assumptions.

## 19. Defect handling

If a defect is discovered:

1. reproduce it
2. identify root cause
3. fix it only on `develop`
4. add regression coverage when feasible
5. rerun affected Wave 1–7.5 tests
6. rerun exact-head CI
7. update Wave 8 evidence

Do not hide failures by changing expected output without proving the old expectation is stale.

Do not weaken security/RLS/auth or clear user data to make a test pass.

## 20. Supabase/security/document activation boundary

Wave 8 may READ existing review documentation and may perform non-mutating repository/synthetic tests.

Wave 8 must NOT activate:

- Wave 6.6 security remediation
- Library view changes
- ACL changes
- strict registration backend
- Full Delete
- Document Studio Production backend
- real document issuance
- pending v511 migration

After Wave 8, these are separate explicit approval/activation tasks.

Wave 8 final report must state whether Document Production Activation can proceed to its separate live preflight gate.

## 21. CI / exact-head requirement

All applicable current Wave 1–7.5 gates must remain green.

Add Wave 8 source/integration checks without deleting or weakening earlier gates.

Final acceptance requires:

- clean working tree
- remote `develop` equals final local Wave 8 SHA
- successful `Validate Develop` on that exact final SHA
- no skipped required automated step
- all test artifacts tied to exact final SHA

Physical-only items are not CI failures when the environment truly cannot perform them, but they must remain explicitly unresolved and cannot be reported as PASS.

## 22. Final status vocabulary

Use only evidence-backed states:

- `PASS_AUTOMATED`
- `PASS_SIMULATOR`
- `PASS_PHYSICAL`
- `PHYSICAL_QA_REQUIRED`
- `BLOCKED_TOOLCHAIN`
- `PROVIDER_EVIDENCE_REQUIRED`
- `BLOCKED_ACTIVATION`
- `FAIL`

Do not collapse automated evidence into physical PASS.

## 23. Required final delivery

When Wave 8 is complete, return:

### Provenance
- starting `develop` SHA
- audit SHA
- every implementation/fix/follow-up SHA
- exact final `develop` SHA
- unchanged `main` SHA
- changed-file count
- insertions/deletions
- clean working-tree confirmation
- exact-head successful CI URL and `head_sha`

### Platform status
- iPhone/iOS status
- iPad status
- Android phone status
- Android tablet status
- Samsung Fold status
- macOS/Safari/PWA status
- watchOS status
- exact toolchain limitations

### Product integration
- Admin status
- Document Studio physical/output status
- exact remaining Document Production Activation blockers
- Profile/Notes/Search status
- Bible/deep-link status
- Library status
- School status
- Inbox/notification status
- Audio/media/offline status
- FA/EN/HR + RTL/LTR status
- accessibility status

### Reliability
- upgrade/legacy results
- offline/reconnect/OS-kill results
- storage/quota results
- account isolation results
- performance/network/listener measurements
- migration parity

### Safety
Explicitly confirm:

- no `main` change
- no release/deploy
- no Store/TestFlight upload
- no Production Supabase mutation
- no migration application
- no security activation
- no Document backend activation
- no real document issuance
- no Audio Analytics implementation
- no paid/provider activation
- no real-user data deletion/reset/backfill

Stop after Wave 8.

Do not merge `develop` to `main`.
Do not start Final Release Readiness automatically.
