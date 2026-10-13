# PR #241 — iOS safe-area candidate R8

Starting head: `1d5dd862518326f7655b79bed2e01bfb2de75d1d` (physical R7).
This is an unapproved candidate until checked in native WKWebView on both devices.

## Cause and narrow correction

R7 overrode native safe-area padding with 2px at the top and 1px at the bottom,
then imposed a 40px maximum nav height. That removed the status/home-indicator
space and prevented a padded navigation row from accommodating its icon/label
controls. Its comment treated `ios.contentInset=automatic` as sufficient evidence
of protection; physical iPad QA contradicts that assumption.

Only iOS native presentation changes. Header/content/nav remain three grid rows:
`auto minmax(0,1fr) auto`. Header padding is compact padding plus the top safe area;
nav padding includes the bottom safe area, with naturally sized controls and no
height cap. Left/right insets also protect landscape phone controls. Safe areas
are painted by their own rows; no separate white layer/reserved overlay is added.
Content remains the scrolling row. Programs tabs retain R7's relative positioning
and scroll with that content. R7 v564 Home/avatar work is unchanged.

The iOS shell uses the smaller of `innerHeight` and `visualViewport.height`, instead
of relying on `100dvh`. Insets are accounted for once, inside the rows, rather than
subtracted again from shell height. The actual WKWebView `100dvh`/safe-area readings
still require device evidence. Native player placement uses the existing dock
measurement with the measured nav height as its minimum; no audio engine changes.
Android and ordinary Web presentation retain their current rules.

No migrations, backend/Auth/RLS changes, user-data clearing, Notes/Plans/School
progress, Community, account merge or Profile persistence changes.

## Evidence and limits

`scripts/verify-ios-safe-area-v573.cjs` uses synthetic iOS platform/inset fixtures
with the real current Web entrypoint. It checks iPhone portrait/landscape and iPad
portrait/landscape in FA/EN/HR: header content below simulated status inset, six
tappable icon/label pairs above the simulated home inset, no intervening band,
no horizontal/page scrolling, tabs scrolling away, measured player docking, Home
photo visibility/persistence and a visual viewport shorter than the layout viewport.
These are Chromium geometry assertions, **not physical WKWebView evidence**.
Existing v573 Web tests and repository CI remain required.

## Exact-head Mac build — after CI only

The cloud workspace cannot access the MacBook, Xcode or either device. Reuse:

- Worktree: `/Users/admin/NH7-PR241-DeviceQA`
- Existing wrapper: `ios-release`
- Existing project: `ios-release/ios/App/App.xcodeproj`
- R8 identity: `com.omideno7.newhope7.qa241r8` / `NH7 QA241 R8`

After updating the local branch to the exact reviewed PR head without discarding
the unrelated dirty README files, run:

```bash
cd /Users/admin/NH7-PR241-DeviceQA
bash scripts/build-pr241-ios-device-qa-r8.sh EXACT_40_CHARACTER_PR_HEAD_SHA --install
```

The script refuses to build unless local/remote/PR heads match, PR is Draft and all
three exact-head validation workflows are green. It verifies the R7 package and
installed plugin versions, archives the committed SHA rather than the dirty tree,
backs up the old Web payload/config, changes only QA identity/name and runs
`cap copy ios`. It never adds/regenerates the project or installs dependencies.
It builds the same signed Debug project/team, verifies embedded runtime hashes,
then optionally installs the same App.app on both specified devices. Unlock the
iPhone first; a locked-device install error is not a wrapper/build failure.

Build output: `DerivedData-DeviceQA-r8/Build/Products/Debug-iphoneos/App.app`.
Local log/provenance: `BUILD_QA241_R8.log`, `QA241_R8_PROVENANCE.json`.
Do not commit wrapper, backups, DerivedData, logs or generated payloads.

## Physical acceptance — all pending until recorded

On iPad Air 11-inch M2 and iPhone 15 Pro Max, use that same verified R8 app:

1. Portrait and landscape: status clock/Wi-Fi/battery never overlap header content.
2. All six bottom controls show their icon and translated label, accept taps and
   remain above the home indicator. No blank band above or covering navigation.
3. Only content scrolls; no horizontal overflow or second page scroll.
4. Programs tabs scroll away naturally, with no sticky header offset.
5. Play existing audio and confirm the real mini-player sits above navigation.
6. Existing Home photo appears on phone/tablet, survives navigation/restart and
   still uses the current v564 picker/crop/persistence.
7. In Safari's remote Web Inspector, record `innerHeight`,
   `visualViewport.height`, shell/header/nav rectangles and computed top/bottom
   padding. Compare a temporary hidden `height:100dvh` probe to those readings;
   remove the probe afterward. Record whether WKWebView reports nonzero
   `safe-area-inset-*` through `--nh7-parity-safe-*` and whether it already insets
   its viewport. If the status area is still unprotected, stop approval and report
   those measurements; do not compensate with another guessed height cap.

No physical build/install/device result is claimed from this cloud run.
Keep PR #241 Draft; no merge or deployment.
