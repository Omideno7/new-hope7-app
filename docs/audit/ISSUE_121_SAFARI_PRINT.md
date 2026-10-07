# Issue #121 — Safari report Print

Base: current `main`, `1e08c775d3c4613016fecd64d3d2738bb558ceee`, rechecked before delivery. Branch: `codex/issue-121-safari-print`. This addresses Print only, after merged #119 / PR #120 and the native-print hotfix.

## Root cause and evidence limits

The #119 handler calls `iframe.contentWindow.print()`. The subsequent v1.2.0 native fallback intercepts that click, opens `about:blank`, writes report HTML, attaches handlers from the Admin window, and immediately calls `win.focus(); win.print()` while the document is being created. Its later Print handler also runs a closure created in the Admin window and focuses another window before printing. It does not have an independently loaded print-page script or readiness gate.

The confirmed defect is that neither browser API provides a success result proving that the native sheet appeared. `print()` can return normally when ignored by Safari/host WebView policy; exception handling cannot detect that case. The old native flow assumes that opening the page/returning from `print()` is useful success, and offers repeating the same call, even if the host never supports it. In the iframe-only path, a normal no-op supplies no feedback at all. Premature printing, window/gesture context and embedded browser restrictions are plausible triggers; their exact contribution on the user's physical device cannot be established without that device and its browser context. This change does not claim to have reproduced a physical Safari print sheet.

Loader inspection: the existing feedback file loads the working #119 PDF module with `?v=1.1.9`; the stable Admin wrapper separately loads the native override with `?v=1.2.0`. The wrapper uses fresh Admin HTML loading and native scripts use the existing network-first Admin service-worker path. Only the native override's URL is changed to `?v=1.2.1`. The working PDF/feedback loader and service workers are unchanged.

## Exact user-gesture strategy

1. The original preview's Print tap is intercepted synchronously. It opens the actual same-origin `school-report-print.html` URL immediately, without an await, timer, `document.write` or automatic print attempt.
2. The static page loads its own local `js/nh7-school-report-print-page-v121.js?v=1.2.1`. A random 128-bit ticket in the fragment connects that window to its in-memory report snapshot. Parent and child verify origin, source window and ticket; the ticket is consumed once. No report data/auth token is put in URLs or local/session storage, and no backend request is made.
3. The full existing preview document is copied into the print page, with its FA/EN/HR language, RTL/LTR, report styles and complete group/individual content. Scripts/controls/event attributes are removed from report content. The opener is cleared after handoff. Fonts/images are given a bounded readiness wait; this only enables the button and does not trigger printing.
4. The user taps the print page's explicit Print button. A listener defined by that page's own script calls that same page's `window.print()` synchronously, with no await, timer, popup creation or cross-window focus before it. Its toolbar is hidden by print CSS; report tables wrap, repeat headers and retain A4 landscape output.
5. Before the call, the page states that Print was requested and keeps the actionable fallback visible: return to the report, Download PDF, open the file in Files, then Share → Print. An in-app-browser hint says to open in Safari. This instruction remains visible when `print()` returns silently, and thrown errors show explicit feedback. No timeout or `afterprint` event is treated as proof of success.

The original preview also keeps these instructions in a separate print-help panel, unaffected by asynchronous PDF progress updates. Blocked pop-ups, missing reports and handoff timeout show recovery instructions, Open print page retry, and a control directing focus to the existing Download PDF button. The dedicated page has persistent Close / Back to report, preserves the parent preview, and displays manual return instructions if its host refuses closing. A directly opened/reloaded page without a report gives an explicit recovery message instead of a blank print action.

## Changed files

| File | Change |
| --- | --- |
| `js/nh7-admin-print-native-v120.js` | Print-only interceptor opens a real URL; validated memory handoff; persistent translated guidance for no-op/blocked-popup/retry. Native version 1.2.1. |
| `school-report-print.html` | Dedicated top-level printable document, persistent controls, print-only CSS and local script. |
| `js/nh7-school-report-print-page-v121.js` | Own-window direct-tap printing, translated readiness/failure/recovery, content handoff and Close/Back. |
| `admin-v239-stable.html` | Only change native print loader query `1.2.0` → `1.2.1`. |
| `scripts/verify-report-pdf-v119.cjs` | Optional `NH7_TEST_PRINT121=1` mode adds top-level/mobile-touch Print, silent no-op/error, blocked-popup and Back assertions while rerunning actual PDF/CSV regressions. Default #119 mode is retained. |
| `scripts/verify-school-reports-browser-v116.cjs` | Integrated real Admin test now taps the top-level page Print button and verifies activation/return for group and individual reports. Existing report/CSV/timeout tests remain. |
| `scripts/verify-print-v121.mjs` | Dependency-free direct-tap/no-auto-print/no-op/error/local-runtime/loader/read-only contracts. |
| `.github/workflows/deploy-pages.yml` | Syntax and #121 contracts added to current validation; deployment remains main-only. |
| `docs/audit/ISSUE_121_SAFARI_PRINT.md` | Root cause, strategy, changed files, checks and limits. |

No new library/CDN. The standalone page/script are small local assets, loaded only for Print. `js/nh7-admin-report-print-v117.js`, the feedback loader, local PDF renderer, both School report data/CSV modules, and all protected system modules are byte-identical to the base. No Supabase/RLS/Storage/Auth, School progression, student data, testimony, notification delivery, audio engine or profile persistence changes. Report operations remain read-only.

## Validation results

- **PASS:** `node scripts/verify-print-v121.mjs` — actual print-page handler runs synchronously, never prints on load, retains actionable guidance for a normal no-op and for thrown errors; local URL, origin/source/ticket checks, no storage/data API calls, native cache key and standalone script wiring.
- **PASS:** `NH7_TEST_PRINT121=1 node scripts/verify-report-pdf-v119.cjs` — mobile/touch Chromium context with Safari-style user agent; full group and individual content in the real static top-level page; fresh user activation on its Print tap; deliberate no-op/error and blocked pop-ups; persistent PDF guidance; Print CSS excludes toolbar; Close/Back preserves original preview. FA → EN → HR → FA, RTL/LTR and 390/820/1440 px controls. Real 203-row multi-page group PDF and long individual PDF still download and parse as actual PDFs; CSV, File/Share cancel/failure fallback, blank-output Retry and immutable fixtures still pass. All requests stay local. This is browser-logic simulation, not an actual Safari test.
- **PASS:** `node scripts/verify-school-reports-browser-v116.cjs` — integrated current Admin wrapper loads native version 1.2.1, group and individual top-level Print gestures/Back, 1,109-row CSV, classifications/details, caching/timeouts and no source-data mutations/report-time write calls.
- **PASS:** `node scripts/verify-i18n-v115.cjs` — existing 11-route localization and protected user-feature fixture regressions.
- **PASS:** `node scripts/verify-report-pdf-v119.mjs`, existing #116 contracts, all four current workflow validation steps, Next Native Optimization Guard, other passing legacy read-only checks, JavaScript/HTML/JSON syntax and diff whitespace.
- Six historical workflow checks still fail on untouched current main as well: v447/v451 old Admin release/wiring, audio-23945 old signed-audio loader/release (two steps), Wave 1A old release wiring, Wave 1B old classic-audio loader. The standalone auth v348/RBAC v350 checks likewise fail identically on both trees because they require release `2.3.9.40`. All were run; obsolete assertions/protected systems were not changed. In total 15 existing read-only workflow steps passed and six historical steps failed.
- Historical patch/commit steps, deployment and the live production Edge CORS/auth probe were excluded to avoid unrelated mutations or production access.

Local browser reproduction: serve repository root at `http://127.0.0.1:8765`, then run the commands above from the root. Browser scripts require installed Playwright/Chromium and Poppler PDF tools. CI uses the dependency-free `.mjs` contracts.

## Safari/device limitations and review checklist

The physical device was unavailable. Playwright WebKit was not installed; installation was attempted into `/tmp`, but all provided download hosts returned HTTP 403 `Domain forbidden`. Chromium mobile/touch simulation verifies gesture placement, content, recovery and working PDF/CSV; it cannot certify that iOS shows the native sheet.

Before deployment, on the user's iPhone/iPad: open group and individual reports; tap Print, then the new page's Print; verify either the native sheet or the visible PDF/Files/Share → Print route; verify return to preview and PDF/CSV downloads. Browser/OS or WebView printing support cannot be forced by JavaScript. If pop-ups/opener handoff is restricted, the existing report keeps a retry and the independently working PDF printing route. No success claim depends solely on `print()` returning.
