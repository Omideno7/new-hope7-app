# Issue #119 — School report preview and real PDF download

Base: current `main`, `03c2403e1c620e5f3e86160cfca9df4545833c46`, verified again before delivery. Branch: `codex/issue-119-mobile-report-pdf`. Scope is report presentation/export only; Issue #116 remains completed.

## Root cause

The v1.1.7 presentation override opened an `about:blank` window containing only report HTML. It supplied no controls. Its print attempts depended on asynchronous loading/timers, which lose the reliable direct user gesture on mobile browsers. Its fallback used an invisible, short-lived iframe. Both “Print” and “Save PDF” entered that same HTML/print flow; there was no PDF generator, PDF Blob or file download.

## Completed behavior

- Group and individual actions open a dedicated, full-screen preview above the existing report dialog. A persistent, wrapping toolbar supplies Close / Back, Print, Download PDF and the existing CSV export. The original dialog and report data remain intact underneath; Close and Escape restore it and focus.
- Print calls the visible, same-origin report iframe's `focus()` and `print()` synchronously inside the actual Print-button click, without a popup, await or timer. The iframe contains only the report, with A4 landscape print CSS and repeated table headers. Browser print destinations can still include Save as PDF.
- Download PDF creates a real PDF 1.4 Blob and File with `application/pdf` MIME and a `.pdf` filename. Generation starts when preview opens; the toolbar reports progress and enables Download when the file is ready. Failure leaves Print/Back available and exposes Retry; blank renderer output is rejected.
- iPhone/iPad (including desktop-UA iPad) use the already-prepared File with `navigator.share` in the download click gesture when supported. The OS share sheet provides Save to Files where available. Share cancellation is harmless; failed sharing exposes an explicit Direct download button. Other browsers use a Blob URL and download filename.
- Group snapshots use `.nh7ac540-print-table`, containing the complete filtered result, rather than the 100-row screen table. Individual snapshots use the full `.nh7r491-print-surface`, retaining available lesson, assignment, attempt, wrong-answer, score and metadata sections.
- FA/EN/HR controls, document language and RTL/LTR are preserved. The browser shapes Persian text using native system fonts before rasterization; no font CDN is needed.

## PDF strategy and bundle impact

Locally pinned MIT `html2canvas` 1.4.1 rasterizes ordered report blocks in bounded page canvases. Table rows split at measured boundaries and repeat their header. Long single rows/answers continue across slices. An internal minimal PDF writer embeds those JPEG pages and writes explicit object offsets/xref records. This avoids an additional PDF library and avoids incorrect Persian glyph shaping from a Latin-only PDF font.

The renderer is unchanged upstream code: 198,689 bytes, 46,052 bytes gzip (about 45 KiB), loaded lazily only for report PDF generation. The report presentation module is about 16.3 KB (6.5 KB gzip). The dependency manifest records NPM tarball integrity and the vendored file's SHA-256, `e87e550794322e574a1fda0c1549a3c70dae5a93d9113417a429016838eab8cb`; the MIT license is included. No remote runtime CDN or new production service is used.

Generation yields between pages, releases individual canvases, cancels obsolete preview jobs and removes its staging iframe. It retains compressed page bytes until the file is assembled. It does not fetch report data again or change the bounded report loading, timeout and caching behavior from #116.

## Changed files

| File | Change |
| --- | --- |
| `js/nh7-admin-report-print-v117.js` | Replace plain-window print override with persistent preview, direct print, full-report pagination, true PDF File/Blob download, Share fallback and error/retry handling. Version 1.1.9. |
| `js/nh7-admin-message-feedback-v511.js` | Only change the report loader cache key from `1.1.7` to `1.1.9`; feedback and notification logic is byte-for-byte unchanged. |
| `js/vendor/html2canvas-1.4.1.min.js` | Locally pinned, unmodified renderer. |
| `js/vendor/html2canvas-LICENSE.txt` | Upstream MIT license. |
| `js/vendor/report-pdf-dependencies.json` | Version, provenance, integrity, SHA-256 and local-runtime declaration. |
| `scripts/verify-report-pdf-v119.mjs` | Dependency-free PDF byte-offset/MIME/page, local dependency and read-only CI contracts. |
| `scripts/verify-report-pdf-v119.cjs` | Local browser regressions with actual rasterization, PDF downloads, mock iOS sharing, failure/retry, CSV and immutable fixtures. |
| `scripts/verify-school-reports-browser-v116.cjs` | Adapt integrated Admin print assertions to the new preview's explicit Print gesture; retain #116 data/loading/CSV tests. |
| `.github/workflows/deploy-pages.yml` | Add #119 syntax/contract checks to existing validation. Deployment remains main-only. |
| `docs/audit/ISSUE_119_MOBILE_REPORT_PDF.md` | Root cause, strategy, changes, validation and limitations. |

The existing academic and individual report data modules are byte-identical to the base. No Supabase schema, RLS, Storage, Auth, School progression, student source data, testimony cleanup, notification delivery, audio engine or profile persistence changes are included.

## Validation

Passing checks:

- `node scripts/verify-report-pdf-v119.mjs`: actual writer's PDF header, MIME, page tree, JPEG embedding, xref byte offsets/startxref, local vendor SHA-256/license and read-only contracts.
- `node scripts/verify-report-pdf-v119.cjs`: actual 203-student multi-page PDF, all filtered student emails represented in rendered page DOMs, bounded canvas dimensions/no horizontal clipping, persistent controls, direct user activation for Print/Share, CSV, complete long individual report, actual `%PDF-1.4` downloads parsed by `pdfinfo`, FA → EN → HR → FA at 390/820/1440 px, Close/Escape, cancellation, blank-output rejection, Retry and failed-share direct download. Rendered first/last group and individual pages were inspected for connected Persian text, RTL and table wrapping. All requests stay local; fixtures remain unchanged.
- `node scripts/verify-school-reports-v116.mjs` and `node scripts/verify-school-reports-browser-v116.cjs`: existing group classifications, individual details, 1,109-row CSV, loading/cache/timeout behavior, print actions and integrated current Admin/RBAC behavior with synthetic data.
- `node scripts/verify-i18n-v115.cjs`: existing 11-route language-switch/browser regressions, exact Search, Bible deep-link/share, profile crop draft, player/reader and preserved account fixtures.
- All four current `deploy-pages.yml` validation steps, Next Native Optimization Guard, and the other passing legacy read-only checks: 15 workflow validation steps passed, six historical steps failed as described below. JavaScript syntax, HTML inline scripts/JSON and `git diff --check` passed.

Six historical workflow checks also fail on an untouched archive of the base commit, with the same cause: v447 expects Admin `2.3.9.47`; v451 expects old listening-session wiring/version; audio-23945 expects an obsolete signed-audio loader and app `2.3.9.45`; Wave 1A expects old `2.3.9.49` wiring; Wave 1B expects an obsolete classic-audio loader. The standalone `verify-auth-hotfix-v348.mjs` and `verify-admin-rbac-v350.mjs` also fail identically on both trees because they hard-code release `2.3.9.40`. These pre-existing failures were not repaired by changing protected systems or downgrading release metadata.

Historical workflow patch/commit steps and deployment were not executed; they mutate unrelated source or publish production. The live production Edge CORS/authentication probe was also excluded. All other existing read-only validation steps were executed. No production data/services were accessed during browser tests.

For local reproduction, serve the repository on `http://127.0.0.1:8765` (for example `python3 -m http.server 8765`) and run the browser script from the repository root. It requires installed Playwright, Chromium (`CHROMIUM_PATH` override supported), `pdfinfo` and `pdftoppm`; no dependency installation or service credentials are performed by the script. The dependency-free `.mjs` check runs in CI without browser packages.

## Remaining browser/device limitations

- A physical iPhone/iPad/Safari session was not available. The desktop-UA iPad File/Share capability and activation paths were simulated in Chromium; viewport tests are not hardware certification. Before approving deployment, check Print, share-sheet Save to Files and fallback download on the user's real devices.
- Native print/share sheets are browser/OS controlled. A WebView without printing or file sharing cannot be forced to support those features by JavaScript; the prepared PDF download remains an alternative where the browser permits it.
- Generated PDFs preserve visual Persian/RTL through images, so text is not selectable/searchable and accessibility is less than a tagged text PDF. CSV remains the structured export. Long reports use more memory and produce larger files than text-only PDFs; generation processes bounded pages rather than one giant canvas. Browser Print/Save as PDF remains available for browser-generated text output.
- New preview labels are translated. Existing report values/free-text student answers are preserved verbatim, as required; no stored content is translated or rewritten.
