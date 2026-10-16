# Wave 8 device matrix and owner execution record

2026-10-16, Europe/Zagreb. Source baseline `ffa2cc97a7c225d3d97a5ff4e57e620360440e04` (spec-only successor of accepted Wave7.5 runtime6c41958b). Audit4258d2e197e92827a52535e1ee0e959e9d8ac6bb. Exact final tested candidate/head and file hashes are in the matching-head `wave8-evidence-<SHA>` CI artifact and final delivery; no native install is inferred from that source SHA. No actual native device, simulator or Mac is accessible here. UNKNOWN means unobserved, not assumed absent from the owner's possession.

| Target | Actual device/model | OS version | Tested/build/installed SHA | Install/build method actually used | Device status | Build/toolchain status | Evidence / unresolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| iPhone | UNKNOWN | UNKNOWN | Candidate: matching-head CI metadata; installed UNKNOWN | None | PHYSICAL_QA_REQUIRED | BLOCKED_TOOLCHAIN | Linux Chromium source/fixture evidence only; no current wrapper/Xcode/WKWebView/signing/device |
| iPad | UNKNOWN | UNKNOWN | Candidate: matching-head CI metadata; installed UNKNOWN | None | PHYSICAL_QA_REQUIRED | BLOCKED_TOOLCHAIN | No installed app; physical bars/keyboard/split-view/rotation/Print/Share untested |
| Android phone | UNKNOWN | UNKNOWN | Candidate: matching-head CI metadata; installed UNKNOWN | None | PHYSICAL_QA_REQUIRED | BLOCKED_TOOLCHAIN | Java present but no current Android project/Gradle/SDK/adb/emulator/device |
| Android tablet | UNKNOWN | UNKNOWN | Candidate: matching-head CI metadata; installed UNKNOWN | None | PHYSICAL_QA_REQUIRED | BLOCKED_TOOLCHAIN | Actual system Back/multiwindow/media/files/output untested |
| Samsung Fold | UNKNOWN | UNKNOWN | Candidate: matching-head CI metadata; installed UNKNOWN | None | PHYSICAL_QA_REQUIRED | BLOCKED_TOOLCHAIN | Browser resizing is not hinge/cover/open/posture/split/resume acceptance |
| macOS/Safari/PWA | UNKNOWN | UNKNOWN | Candidate: matching-head CI metadata; installed UNKNOWN | None | PHYSICAL_QA_REQUIRED | BLOCKED_TOOLCHAIN | Linux has no Safari/Mac/Catalyst wrapper; no installed PWA acceptance |
| Apple Watch | UNKNOWN | UNKNOWN | Current safe Watch source hashes in CI; installed UNKNOWN | Source/resource verification only | PHYSICAL_QA_REQUIRED | BLOCKED_TOOLCHAIN | No Swift/Xcode/watchOS SDK/XcodeGen/current companion embedding/pairing; audio deliberately unavailable |

Linux Chromium151 is an automated browser target, not an eighth physical device or an iOS simulator. PASS_AUTOMATED covers current shared source and explicit mocks only. PASS_SIMULATOR and PASS_PHYSICAL were not earned for any row. Existing Viewport/iOS-mode/Android-mode fixtures do not change these statuses.

## Evidence the owner must attach before changing a row

Record operator/time/timezone, exact device/model/OS/build, installed app bundle/version/build ID, exact Git candidate SHA and successful CI URL, actual embedded payload hashes (not version text), exact current wrapper/project and package/Pod/Gradle lock hashes, permissions/entitlements/plugins/deep-link registrations, installation/build method, synthetic test account labels, test case IDs, screen recording/screenshot/log/PDF hashes and failures. Keep credentials, private user content, full live metadata and device identifiers in private owner evidence, not this public report. A version label/old Store lineage/historical R7 description is insufficient.

For source-only QA export on an approved host, use the final **exact** candidate from accepted CI, not a moving branch or dirty worktree:

```bash
QA_SHA='<exact candidate SHA from accepted CI>'
QA_DIR="$(mktemp -d)"
mkdir -p "$QA_DIR/payload"
git archive "$QA_SHA" | tar -x -C "$QA_DIR/payload"
python3 scripts/record-build-metadata.py --payload "$QA_DIR/payload" --platform web --version wave8-integration-qa --build "$QA_SHA" --sha "$QA_SHA" --output "$QA_DIR/build-metadata.json"
```

This produces QA source metadata, not a signed native build, Production deployment or permission to install/sign. Preserve the current owner-approved iOS/Android wrapper in place; inspect its configuration/locks/entitlements/plugins and actual embedded payload. Do not run `cap add`, regenerate a project, change plugin versions/signing/Production IDs, or substitute Test5/old archives. No signing/upload command is authorized here. If the wrapper is unavailable, keep BLOCKED_TOOLCHAIN. A future separately approved native QA export must reference the same exact source and compare actual embedded bytes using the existing recorder with the correct platform; generated bridge/config files are separately inventoried.

## Priority document physical cases (run on every applicable required target)

Use only synthetic documents/accounts and a proven isolated QA fixture/backend; never turn on the Production flag/backend or issue a real document. The CI artifact already contains six synthetic PDFs and raster PNGs, allowing immediate physical PDF reopen/print/share inspection without backend activation. Full interactive authoring requires current server-proven QA owner authority; never fake a Production role or bypass authorization to test a screen.

| ID | Action / acceptance evidence |
| --- | --- |
| D01 | Prove owner entry; normal/anonymous/direct-URL denied; delegate gets only existing grants. Record network denial, not just hidden buttons. |
| D02 | Create→type/template→choose/manual recipient→FA/EN/HR edit→Preview→validation→Prepare. No official record before explicit final Confirm. |
| D03 | Cancel/Escape, wrong/empty/stale receipt, double tap, same-request retry; never false success/stuck editor/duplicate issue. Fixture only. |
| D04 | Photo/logo/signature/seal/background and saved mm positions survive reopen; new document has no old recipient/photo/token. |
| D05 | Inspect FA joined glyphs/RTL and EN/HR accents/LTR; titles/body/footer/header/number/signer/church name readable, no clipped text. Record text size/font and screenshots. |
| D06 | A4 portrait and landscape at actual100% page size; compare all elements to canonical editor, no reflow or wrong scaling. Review all15types/8templates in preview and record any physical subset tested rather than claiming720 physical prints. |
| D07 | Open all six CI PDFs twice on device; verify page size/orientation/file completeness. They say SYNTHETIC-WAVE8-NOT-PRODUCTION, not a real issue. |
| D08 | Use actual native/browser Print from a direct tap; record the sheet opening or explicit actionable fallback. Print one physical sheet per orientation where possible; measure margins/QR/footer inside page. |
| D09 | PDF Download→Save to Files/download manager→reopen actual saved file. Verify same bytes/hash where supported; no plain HTML masquerading as PDF. |
| D10 | File-ready explicit Share gesture, cancellation/retry/fallback, Close/Back/focus restoration. Never stuck modal or inaccessible Admin. |
| D11 | Scan actual PDF/printed QR with camera; only canonical verification URL plus random token, no UID/email/Admin/body/credential/privileged URL. Public proof only status/number. No real issue created for scanning. |
| D12 | Recipient QA archive only own documents; A→B/logout/delayed reply closes old preview/export. Wrong user zero rows. |
| D13 | Revision creates new version/token; original immutable. Explicit revoke/expire status correct; legacy/School links unchanged. |
| D14 | Rollback rehearsal only on separately approved disposable backend: disable writes, retain already-proven read config and archives/minimal proof/history. No Production SQL. |
| D15 | Keyboard/large text/VoiceOver/TalkBack/focus-visible/reduced motion; modal trap/Escape/Back/return focus and touch targets. |

## Shared user-app and platform cases

| ID | Exact checks / record failures |
| --- | --- |
| U01 | Upgrade a synthetic existing profile without clearing data; Notes raw/Unicode/code/numeric wrappers, saved verses/highlights, favorites, downloaded files/metadata,38.5resume, School drafts/progress/assignments/exam attempts, owned photo, Inbox receipts, bindings, Library cache/grant, theme/language, Plans/fasting and legacy certificates remain. Unknown ownership stays quarantined. |
| U02 | Online→offline→local edit→reconnect while pending, repeated online events, start offline, abrupt OS kill/relaunch. Record last-write timing separately from previously persisted data; immediate disk durability is not guaranteed by a localStorage return. No data/cache clearing. |
| U03 | Profile crop/viewer/Home/header, several minutes, rotate/restart; Notes FA right/RTL, EN/HR left/LTR; Save/reopen. |
| U04 | Search exact Bible JHN3:16/audio/Notes/saved/Plans/approved School/current Library; correct route/history/Back. Calendar→Bible no freeze/inert overlay. |
| U05 | Public collection/text-reader cached offline after verified reopen; Ministers online/current grant only, revoked/wrong account/deep link/search/offline denied. Pending security/view proposals remain inactive. |
| U06 | School registration approved/unapproved; current stage/prerequisite, draft/revision/assignment/exam/retry/wrong-answer behavior; reports/full CSV/PDF/Print and legacy certificate. Synthetic data only, no rule change. |
| U07 | Audio catalog/direct play, one mini/full player, seek/speed/pause/next/previous/favorite/like/blessing/Notes/route continuity; already-downloaded file offline; no new Analytics. |
| U08 | Background/lock-screen/Bluetooth/headset/audio focus/interruption; actual file plugin failures and process kill. Retain downloads, no automatic deletion as recovery. |
| U09 | Inbox timestamp after opening, read/delete/badge, preferred language and account binding; A→B/logout/stale requests cannot display prior owner's data. |
| U10 | Existing provider only after separate approved controlled delivery: foreground/background/closed-app/tap/typed exact destination/account fence, FA/EN/HR. No test sends or provider activation authorized by this checklist; otherwise PROVIDER_EVIDENCE_REQUIRED. |
| U11 | Low storage/quota/IndexedDB refusal/error/cancel/retry, old saved data survives, unsaved text recoverable/actionable; no fake Saved/Issued or blank stuck panel. |
| U12 | All current themes/light/dark/night/large text/RTL/LTR, keyboard-only focus/semantic names/touch/VoiceOver/TalkBack; record actual manual evidence, no WCAG certification claim. |
| P01 | iPhone+iPad: portrait/landscape, top status/notch/home indicator/nav six controls/no white band, mini-player above nav, keyboard hide/show, iPad split view/photo consistency, PWA and WKWebView separately. |
| P02 | Android phone/tablet: actual system Back/link intent/system bars/keyboard, wide layout/multiwindow, native files/print/share/media/kill/reopen. |
| P03 | Fold: physical cover→open→cover live posture/hinge/split/resume without losing route/content/account/audio; viewport resize is insufficient. |
| P04 | Mac/Safari/installed PWA: window min/max/resize, Back/Forward/keyboard/focus, install/update/cache/offline/download/Print/Share; Catalyst only if an actual current target exists. |
| P05 | Watch: current source compile/project generation/companion embedding/unsigned consistency first; approved install/pair later;66books/1189chapters/FAENHR offline, Crown/VoiceOver/Dynamic Type/RTL/kill. Audio is intentionally unavailable; do not restore historical raw-URL playback. |

Every failed physical case must retain its exact source/device/wrapper/evidence and be fixed/retested through develop. Do not mark a whole platform PASS after checking one PDF or one viewport. All rows remain unresolved until this evidence exists; no Final Release Readiness is started.
