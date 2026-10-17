# Codex Wave 8 Physical QA Fix Batch 2 — iPad / Responsive Navigation and Media UX

Date: 2026-10-17 (Europe/Zagreb)

Accepted Batch 1 automated/source final before this specification: `f728df9d1efe9c5e38a564d5799c50dbc0457fb7`.

This specification is subordinate to `AGENTS.md`, `docs/DEVELOPMENT_WORKFLOW.md`, and `docs/qa/WAVE8_PHYSICAL_FIX_MASTER_SPEC.md`.

## Non-negotiable workflow

- Work directly on the existing `develop` branch only. Do not create a branch or PR.
- Fetch first and use the actual current remote `develop` head; never reset over newer work.
- `main` remains Release/Production only and must not change.
- No deployment, Store upload, Production Supabase mutation, provider activation, security activation, document issuance activation, real issuance, destructive user-data operation, or hidden release work.
- Preserve all Batch 1 fixes and all accepted Wave 1–8 safeguards.
- Do not weaken tests or historical guards to get green CI.
- Keep FA/EN/HR, RTL/LTR, accessibility, phone/tablet/Fold/Web behavior, lifecycle safety, and bounded backend cost.
- Automated success is not physical acceptance. Real iPhone/iPad retest remains required later from the exact accepted develop payload.

## Scope — Batch 2 only

### B2.1 Native/header/bottom navigation vertical geometry

Physical evidence on iPhone and iPad showed excessive blank vertical space above the visible header content and below the six-item bottom navigation.

Requirements:
- Trace actual safe-area/inset ownership across WKWebView/native wrapper and Web CSS (`viewport-fit=cover`, `env(safe-area-inset-*)`, native status/navigation handling, app shell/header/bottom-nav variables).
- Fix the root cause; do not hard-code arbitrary smaller heights that break notch/home-indicator/keyboard devices.
- Avoid double-application of safe area.
- Header and bottom navigation should be compact but still safe on iPhone/iPad portrait and landscape.
- Preserve six bottom navigation items and mini-player geometry.
- Preserve Web/PWA/Android/Fold behavior.
- Add responsive/browser geometry regressions where possible, but do not claim native physical pass.

### B2.2 iPad Bible true master/detail hierarchy

Physical iPad evidence showed duplicate navigation levels: Books in both sidebar and main; after selection, Chapters in both sidebar and main; Back could overlap the title.

Required tablet behavior:
- Hierarchy is `Books → Chapters → Verses`.
- At book-list stage, navigation/master presents books; detail must not duplicate the same book list.
- After a book is selected, the navigation/master should present chapters for the selected book and detail should be ready for/select chapter content.
- After a chapter is selected, sidebar remains chapter navigation and main/detail shows verses/content for that chapter.
- Never render `Books + Books` or `Chapters + Chapters` as duplicated master/detail levels.
- Back/list controls must not overlap headings.
- Preserve exact verse selection, deep links, route/history semantics, reading position behavior and accepted Bible data.
- Keep appropriate stacked drill-down behavior on phone.
- Test Persian RTL plus EN/HR LTR, iPad portrait/landscape and representative split widths.

### B2.3 iPad Daily true split-view navigation

Physical iPad evidence showed Daily categories as a horizontal/top set that wastes tablet space.

Requirements:
- On tablet/iPad, make Daily a clear master/detail layout.
- Master/navigation contains Daily categories such as Daily Word, Confession, Daily Life/Water, Thanksgiving/other existing Daily modules exactly as the current product supports.
- Selecting a category changes the detail pane to the corresponding content.
- Do not duplicate the same category controls in the detail pane.
- Preserve current data, dates, language behavior, offline behavior and phone stacked layout.
- Keep FA/EN/HR and RTL/LTR correct.

### B2.4 iPad Audio / Messages master-detail experience

Physical feedback requested a more tablet-native structure.

Requirements:
- On iPad/tablet, provide progressive master/detail navigation: Categories → items in selected category → selected audio/player/detail.
- Category navigation stays available without duplicating the same list in detail.
- Selecting an item exposes the player plus relevant title/metadata/tools/notes in detail.
- Preserve all existing audio engine, resume/progress, offline/download behavior, social/actions and phone behavior.
- Do not alter audio analytics policy; no new recurring telemetry/read/write/storage.

### B2.5 Quick Bible while audio is playing

Current Quick Bible may cover/obstruct the player as a popup.

Requirements:
- Open Quick Bible below/beside the player/detail area rather than covering essential player controls.
- Player controls remain visible and operable while finding a verse (play/pause/seek as already supported).
- On iPad, use available detail space intelligently; on phone, use a stacked in-flow section that does not trap/cover playback controls.
- Preserve existing Quick Bible data/deep-link semantics and audio playback state.

### B2.6 Notes/tool focus and global logical scroll behavior

Physical feedback showed opened Notes can appear below the viewport and next book/chapter can inherit an inappropriate middle scroll position.

Requirements:
- When a user opens Notes or another in-page tool, move/focus the viewport to that newly opened section in an accessible way.
- New book → logical beginning of the book.
- New chapter → logical beginning / verse 1 unless an explicit verse/deep target is requested.
- New destination → logical top/target.
- Contextual Back/browser Back → restore prior position where appropriate.
- Preserve Batch 1 route/history fencing; do not regress deep links or accepted verse centering.
- Avoid focus theft from active form controls and respect reduced motion where scrolling is animated.

### B2.7 Home/Hero responsive redesign

Physical iPad evidence showed a very large mostly-empty welcome card and duplicate avatar presentation.

Requirements:
- Make Home hero adaptive rather than a stretched phone card.
- Do not reintroduce duplicate profile/photo authorities. Batch 1 Account/photo remains canonical.
- Avoid redundant avatar presentation between header and hero; choose one coherent user-facing presentation based on current design architecture.
- On iPad/tablet, use otherwise-dead space for useful current information already available without adding backend cost, such as Today/date, next existing event, or Continue Reading/Listening where current local/product state already provides it.
- Do not invent new backend reads or a personal-device calendar integration in Batch 2.
- Keep phone hero compact and uncluttered.
- YouVersion CTA, richer Christian calendar content and Church Connect belong to Batch 3, not this batch.

### B2.8 Remove redundant Plans language badge

Physical evidence shows a non-interactive `FA · EN · HR` badge inside the Plans hero card while language is already controlled in the app header.

Requirements:
- Remove the redundant badge completely.
- Collapse its spacing cleanly; no dead gap.
- Header language selector remains canonical.
- Plans content must still switch correctly with FA/EN/HR and RTL/LTR.

## Cross-cutting acceptance

- Preserve Batch 1 login/Soul/Admin/Document Studio/account/photo/Plans Back/password fixes.
- Do not touch Production activation gates.
- Do not regress School, Notes persistence, Plans progress, Library, Inbox backend, Community, authentication or offline persistence.
- Use actual responsive breakpoint/state architecture rather than device-name hacks.
- Tablet split views must degrade cleanly to stacked phone flow.
- Keyboard/focus must not obscure core controls.
- Accessibility semantics and minimum touch targets must remain valid.
- Motion introduced here must be lightweight and respect reduced-motion preferences; broad theme/motion redesign belongs to Batch 4.

## Required regression evidence

Add/extend deterministic tests where feasible for:
- no duplicate Bible master/detail level at tablet breakpoints;
- Daily tablet category→detail behavior;
- Audio category→item→player detail flow without changing progress bytes unexpectedly;
- Quick Bible does not overlay/disable essential player controls in representative phone/tablet geometries;
- opened Notes/tool becomes visible/focused;
- new chapter/book top behavior and Back position restoration;
- header/bottom-nav geometry invariants and safe-area variable ownership in representative widths;
- Plans hero has no redundant FA/EN/HR badge while language switching still works;
- Home hero remains compact on phone and uses tablet space without new recurring requests.

Keep all existing Validate Develop stages enabled. Run changed-file syntax checks and `git diff --check`.

## Delivery / stop condition

When Batch 2 is complete:

1. Commit implementation and any narrow follow-ups directly to `develop`.
2. Push `develop`.
3. Require exact-head `Validate Develop` success.
4. Report exact start SHA, audit/implementation/follow-up commits, final develop SHA, unchanged main SHA, CI run ID/URL, changed files, test evidence and unresolved physical-only items.
5. Do not claim physical pass.
6. STOP after Batch 2. Do not begin Batch 3, Batch 4, release, deployment or Production activation without explicit instruction.
