# Safe Web/mobile parity v573

Base: current `main`, `67d829de0d8d4846e309a99bcd98c4c005b3b030`.
Branch: `codex/web-mobile-parity-safe-v573`. Separate from Documents PR #240.

The signed iOS 2.5.0/25001 `App.app/public` archive (ZIP SHA-256
`e5b6565049ef5025de48dc0d629501732880fa482f0990251b010f8fdc803b6b`)
and Android published source `a177cdc7d995894868cf84bbe00c2dfa05ad6e25`
contain contextual tablet sidebars, photo viewing, measured chrome and plan
reflections absent from the current Web UI. This change implements those four
shared browser capabilities against current Web modules; it does not copy old
mobile runtime files.

## Implementation and data boundary

- Bible book/chapter, School lesson and Audio category sidebars use only metadata
  already loaded by their current renderers. Buttons go through the existing
  `data-go`/`data-params` routing. At widths below 768px the original navigation
  remains visible and the contextual sidebar is hidden. Tablet/desktop content
  uses an adaptive two-column layout without replacing bottom navigation.
- A full-screen dialog reads the photo through `NH7ProfilePhotoV564.read()`. Header,
  Home and Account avatar activation supports keyboard access. Close/Escape returns
  focus; zoom/reset changes only the displayed image. Crop, picker, persistence,
  student identity, v563 guard and v564 implementation are unchanged.
- ResizeObserver measures the fixed header and bottom navigation including their
  safe-area padding. Layout reserves the measured space and updates when header
  content, viewport or fonts change. Existing mini-player measurement/docking and
  engine remain unchanged. No global touch/overscroll suppression is added.
- My Notes reads existing v240 reflections for the canonical current-session UID
  (or guest scope). It does not enumerate other users' plan keys. Virtual cards have
  no storage row, no delete button and a programmatic deletion guard. Open source
  calls the current Spiritual Plans renderer with the stored plan/day, without
  `start:1`. Existing plan editing and its normal sync behavior remain authoritative.
  No Notes save/delete/restore contract changes for ordinary notes.
- Existing Midnight, Aurora and Sapphire sidebar colors passed computed text
  contrast checks (at least 4.5:1). No reproduced palette bug required changes to
  existing theme CSS.
- The isolated release-core executable cache and worker URL advance to
  `5.4.5-web-parity573`; the new presentation files are precached. Library 125.5,
  stable data/media/download/reader cache contracts and update logic are preserved.

No migration, deployment, Production call, RLS/Storage/auth change, native bridge,
push, account merge, School snapshot change or user-data mutation is included.
Search v562, Exam Review v566, Community, Library, Profile and audio modules are
retained. Tests intercept external requests; no Production credentials/data are
used. Existing route analytics are unchanged, with no additional tracking calls.

## Changed files

- `js/nh7-web-parity-v573.js`: DOM-only sidebar wrapper, photo viewer, chrome measurement.
- `css/nh7-web-parity-v573.css`: scoped responsive layout and viewer presentation.
- `js/app.js`: small current-renderer sidebar hooks; existing routes/data flows retained.
- `js/nh7-my-notes-v234.js`: identity-scoped virtual reflections and read-only guard.
- `js/nh7-my-notes-categories-v452.js`: localized Spiritual Plans group.
- `index.html`: load presentation assets and version the current app/worker.
- `service-worker.js`: release-core import version.
- `sw-release-core-v403.js`: executable cache version and presentation asset list.
- `scripts/verify-web-parity-v573.cjs`: responsive, identity, immutability and route tests.
- `.github/workflows/web-parity-v573.yml`: isolated pinned Playwright regression CI.
- `docs/qa/SAFE_WEB_MOBILE_PARITY_V573.md`: audit, boundaries, validation and manual QA.

## Validation

- New Chromium regression: 390/768/1440px × FA/EN/HR; sidebar visibility, exact route
  parameters, retained control handlers, no horizontal overflow, header measurement
  after height changes, viewer zoom/Escape/focus return, no persistence writes or
  backend requests, current-account isolation and blocked virtual-note deletion.
- Real `index.html` at all three widths: exact Bible verse focus, user-tapped tablet
  chapter navigation, existing plan day/reflection opening with unchanged progress.
  Dark/color palette contrast checks on tablet/desktop. No runtime page errors.
- All existing Pages validation commands pass: migration parity **42/42 exact,
  zero pending**; Web Community, Exam Review, Calendar, Notes account merge, Plans
  themes, Appearance CSS, Audio safety, runtime JS, app wiring, Admin/report/PDF/print
  contracts, inline HTML scripts and JSON.
- Next Native Optimization Guard passes. Current Profile student-code and School
  access/assignment-submit/exam-submit/progress/snapshot ownership verifiers pass.
- `git diff --check` and syntax checks on every changed JavaScript file pass.

Chromium automation covers browser behavior, not real iOS hardware. Real iPhone/iPad
Safari visual and accessibility QA remains a reviewer check; no native build is
changed. School/Audio backend services are not exercised against Production.

## Reviewer test steps

1. On a phone, navigate Home, Bible, Audio and School normally. On tablet/desktop,
   open a Bible book/chapter, an accessible School lesson and an Audio category.
   Select sidebar destinations and verify existing Back and bottom navigation.
2. With a photo already saved using the current Profile picker/crop, tap its Header,
   Home or Account avatar. Zoom/reset, close with the button/Escape, and refresh.
   Confirm the original avatar remains unchanged. Crop/remove controls still work.
3. Switch FA → EN → HR → FA and rotate/resize the viewport. Verify header/date,
   safe-area space, bottom navigation and existing mini-player do not cover content.
4. Save a reflection using the existing Spiritual Plans screen. Open Home/My Notes:
   expand Spiritual Plans, use Open source, and verify the correct plan/day. There
   must be no Delete action on that virtual card. Ordinary notes retain their actions.
   Switch accounts and confirm another account's plan reflections are not listed.
5. Select Midnight, Aurora and Sapphire in Appearance and inspect sidebar/reader
   contrast. Exercise normal Community, Library, Notes and existing audio controls.

Keep the PR Draft. Do not merge or deploy without separate authorization.
