# PR #241 — chrome and Home presentation candidate

Base: `2f0debe15a46861681befe0289ff9c92d3e3c863`.
Physical iPhone/iPad QA reported remaining white seams and an unbalanced Home hero.
This follow-up is presentation-only; native acceptance is still pending.

## Paint audit and correction

The Web layer used translucent header/nav surfaces over a gradient shell, a
different html/body background and rounded navigation corners. Exposed safe-area
space or tablet gutters could therefore show a different surface. iOS html, body,
shell, header and navigation now use one opaque active-palette surface; the shell
gradient and nav corner cutouts are removed only for iOS. Safe-area padding remains
inside the existing grid rows. No pseudo-element/overlay/filler layer, inset,
height, scrolling rule or navigation target is added or reduced.

This controls **Web-owned pixels**. The R7/R8 wrapper also has native
`ios.backgroundColor=#ffffff` and `contentInset=automatic`. This follow-up does not
change that wrapper. If a physical band lies outside the WKWebView/HTML viewport,
CSS cannot paint it; record its position and native viewport/inset measurements
before a wrapper adjustment. Do not call this a confirmed physical fix from
Chromium screenshots.

## Home composition

Only the existing Home hero receives a new layout class. The church title is
centered. Phone layout stacks the existing v564 profile row, welcome copy, original
CTAs and a compact Today/date panel. Tablet/wide landscape layout places
profile/welcome/CTAs in one column and the Today panel in an equally sized column.
Logical grid ordering follows FA RTL and EN/HR LTR.

The date reuses `NH7HeaderDateV455.format()` with the current language and local
date/calendar. Day number reuses the existing Home daily-cycle value. Date refresh
updates DOM only, including language/day/visibility changes. No new route, backend
request, storage row or persistence logic is introduced. The two CTA handlers and
v564 profile insertion/avatar/crop/persistence remain unchanged.

Screenshot review exposed low contrast in the existing Home welcome label and
notification CTA. Scoped styles now inherit hero text for that label and use an
opaque palette surface for the notification CTA and Today panel. Existing themes
remain authoritative; no global palette CSS is replaced.

## Changed files

- `css/nh7-web-parity-v573.css`: iOS opaque chrome and responsive Home composition.
- `js/app.js`: Home-only class and read-only Today/date markup; existing CTA IDs/routes.
- `js/nh7-web-parity-v573.js`: DOM-only date formatting/refresh through the existing API.
- `scripts/verify-ios-safe-area-v573.cjs`: paint/palette equality, no gradients/rounded
  nav cutouts, centered title, balanced columns/compact stack and readable date panel.
- `index.html`, `service-worker.js`, `sw-release-core-v403.js`: executable asset/cache
  refresh to `5.5.0-web-parity573-chrome-hero`; data/media/reader/download caches unchanged.
- `docs/qa/PR241_IOS_CHROME_HERO_QA.md`: this audit and native acceptance checklist.

No Profile implementation, Notes/Plans/School/Community/account logic, Supabase,
Auth/RLS/schema, migration or data files are changed. No clearing of user storage.

## Verification

The existing Web parity regression and synthetic native test remain required.
Native geometry runs iPhone portrait/landscape and iPad portrait/landscape × FA/EN/HR,
using the real current entrypoint and simulated insets. Added checks cover:

- matching opaque html/body/shell/header/nav paint under default, Midnight and
  Sapphire palettes, no gradient and square nav edges;
- centered church title, contained content, equal separate tablet columns and
  ordered phone stacking;
- shared localized date output and Today panel text contrast >=4.5:1;
- retained six tappable icon/label controls, safe-area boundaries, no horizontal
  or page overflow, Programs tabs scrolling, mini-player docking and unchanged photo.

Chromium screenshots were reviewed at phone/tablet sizes. These are layout evidence,
not evidence that physical WKWebView bands have disappeared. Full existing repository
validation, migration parity, optimization guard, Profile verifier, changed-JS
syntax and `git diff --check` remain required before candidate review.

## Physical acceptance

Using the exact green candidate head in the existing QA wrapper, check the same
app on iPhone and iPad in both orientations:

1. Top safe area/header and bottom safe area/nav are visually continuous, including
   tablet gutters, with no white seam or covering strip.
2. All six icons/labels remain visible and tappable; mini-player remains above nav.
3. Home title is centered; profile/welcome/CTAs and Today panel remain balanced,
   readable and non-overlapping in FA/EN/HR and light/dark palettes.
4. Existing photo remains visible after returning Home/restart; no horizontal
   overflow or extra scrolling row. Programs tabs still scroll away.
5. If a white band remains, record HTML viewport bounds and native WKWebView frame/
   adjusted insets. Distinguish a CSS surface from the wrapper's native white area.

Keep PR #241 Draft. No merge or deployment. Physical acceptance remains pending.
