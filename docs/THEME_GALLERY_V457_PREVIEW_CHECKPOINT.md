# Theme Gallery v4.5.7 Preview — 19 September 2026

## Verified state

Repository: Omideno7/new-hope7-app.
Main baseline: `466badb8a151dbdf02d07606a99e9660da1fe04a`.
Feature branch: `feature/theme-gallery-v457-20260919`.
Tested runtime commit: `2994295b3c248ff3c815c6be0ec0cb79753c53ff`.
This appearance change has NOT been merged to main. Main-before and main-after snapshots matched. No Supabase operation, real account write, native build or app-store submission was performed.

Verified immutable Preview:
https://rawcdn.githack.com/Omideno7/new-hope7-app/2994295b3c248ff3c815c6be0ec0cb79753c53ff/theme-preview.html

The public host showed its ordinary Open the page notice. Follow that, then Amen and the Choose theme button. This Preview is for appearance only. It cannot sign in to a real account; blocked account/notification/download actions show an explicit Preview message rather than Cloud disabled.

## Reported problem and reproduced cause

The user's screenshot showed Dark selected in the old Appearance panel while a pale custom Studio theme remained active. A baseline browser test reproduced that exact combination: `nh7_ui_theme_v425=dark` and the saved Ocean Studio palette produced a light body background. Studio palette rules took precedence over the old base-mode buttons and selector. The duplicated controls consequently described a mode that was not determining the visible palette.

## Implemented changes

- Removed the old Auto/Light/Dark button group and duplicate Color mode select from the Appearance renderer. The underlying legacy mode preference is preserved, not deleted or migrated.
- One Theme Studio gallery is now placed before the retained font/size/accent controls.
- Tapping a preset applies and saves it immediately. The custom-color editor still uses preview plus Apply and rejects unreadable color combinations.
- All eight previously approved palette definitions and their labels remain byte-for-byte equal to the baseline: New Hope, Ocean, Forest, Royal Purple, Warm Sand, Rose, Midnight and Sepia.
- Added six optional presets: Vivid Blue, Emerald, Sunset, Orchid, Berry and Aurora Night. Existing users' selected palettes are NOT automatically recolored.
- The 14 choices are divided into three compact groups: Colorful (5), Soft/Reading (7), and Dark (2: Midnight and Aurora Night).
- Dark presets change the page, editor surfaces and controls consistently, including the native color-scheme hint. Dark mode is available in the gallery rather than competing with an unrelated old toggle.
- Stronger surrounding background and accent colors are paired with high-contrast reading surfaces. Scripture text is not rebuilt or edited.
- The preserved legacy module-accent picker now updates the active Studio palette and stays visually synchronized instead of silently being overridden.
- Existing font selections, text size choices, theme library, personal notes, bookmarks, course progress and notification preference retain their storage keys. Appearance reset is explicit and does not delete personal content or saved named themes.

## Verification evidence

Successful workflow: Theme Gallery v457 QA, run `35435549482`, job `105877461211`.
Artifact: `10581909354` (theme-gallery-v457-16c91128ffc06ac22a1f907dc1f4b3ae07e0f165).

- Baseline screenshot test reproduced the original mismatch before checking the candidate.
- Static palette audit proved 8 original palettes unchanged and checked 70 foreground/background pairs across all 14 presets, each at least 4.5:1. Automatic button foreground choice was also checked. This is a scoped contrast test, not a claim of complete WCAG conformance.
- One new Orchid secondary-text value was darkened after the first audit found it below the chosen threshold; no baseline palette was modified.
- Chromium: 9 scenario groups passed, including 294 computed rendered-contrast checks.
- WebKit: 9 scenario groups passed, including the same rendered-contrast checks.
- Every theme was selected in Persian, English and Croatian. Tests checked immediate actual body colors, light/dark form scheme, preserved Persian/Latin font choices, the old named-theme library, the module-accent picker, invalid custom drafts, automatic readability repair, keyboard group navigation, widths 320/390/768/1280, reload and explicit reset.
- Previously accepted font, 60-entry explained glossary and uninterrupted classic audio/Quick Bible regression: all 13 Chromium groups passed. Only the intentionally removed old mode-selector assertion and access to the now-grouped Sepia card were adapted; the substantive old feature assertions remained.
- Local isolated Preview: 10 checks passed.
- Actual immutable public Preview: 10 checks passed, including real bundled Persian font use, instant colorful/dark application, unchanged original localStorage/sessionStorage, Preview-only writes, no external application requests, blocked POST/external fetch and no service worker.
- No uncaught page errors in completed runs. Screenshots of the public Persian gallery, dark Croatian editor and vivid Home were visually inspected.
- App.js comparison allows only the Appearance HTML renderer change. Corpus, backend, font controller, classic audio code, service workers, manifest and native version remain unchanged in this feature.

## Scope and remaining gates

Deployable changes are limited to `js/app.js`, `js/nh7-theme-studio-v453.js`, `index.html` and the new `css/nh7-theme-gallery-v457.css`. Generated Preview files and test workflows must not be merged wholesale. A later approved main integration needs clean runtime-only selection and release-cache wiring.

The dedicated Preview uses `nh7_preview_theme_v457:` for both local and session storage. It does not edit the real application's appearance or user account. Font binaries were neither changed nor included in the user-facing QA archive.

A physical phone appearance review is still needed before main integration. Browser tests do not establish native iOS/Android acceptance, all possible custom-theme combinations or real-account synchronization. Notification preferences, download management and advanced points remain separate pending work; they were not changed in this phase.
