# Issue #116 — School reports, browser print/PDF and CSV

## Baseline and scope

Branch `codex/issue-116-school-reports` starts from current main `68bcc5dfd2d2370de3ad710b1a95177d95f404ad` (the integrated #115 localization change). Only the two active Admin report modules, their cache-refresh parameters, report validation and this evidence document change. No merge, main push or deployment is part of this package.

## Features

- Group reports retain the existing authoritative `nh7_admin_student_academic_center_v542` batch RPC and status semantics. Enrolled/registered, started but inactive, needs revision, passed, failed and not registered are all selectable. Existing class/final exam, pending-review, completion, graduation and never-started groups remain. “Not registered” includes every known unregistered identity returned by the RPC, including roster-only members. Passed remains final-exam passed; failed remains an unresolved class failure or attempted final without a pass. No client calculation changes School eligibility or result rules. Groups can overlap.
- Group view displays 100 people per page. Filters, name/email search, inactivity threshold and test-account exclusion remain. CSV and print include **all filtered rows**, not merely the current page. The open group modal holds a snapshot for matching CSV output.
- Individual reports reuse the existing profile and optional library-reading RPCs. Registration state, recorded progress, active completed/pending lessons, required unsubmitted assignments, assignment review state/answer/feedback/score, exam attempts and recorded objective/assignment/final scores are visible. Wrong answers use the question/answer data already loaded for Admin; unavailable question/answer data is explicitly identified rather than claimed to contain no mistakes. Missing scores display unavailable, not invented zero scores.
- Individual CSV has stable machine-readable columns and typed registration, lesson, assignment, exam-attempt and wrong-answer records, including required missing assignments and recorded score components. Group CSV adds stable status codes, registration date, total/pending lesson counts to existing summary fields. Both use UTF-8 BOM, quoted/escaped cells and spreadsheet-formula protection. User records themselves are unchanged.
- Print and Save as PDF use the native browser print dialog. Save as PDF selects the browser's PDF destination; there is no direct PDF-blob download/share engine. Both work immediately without CDN/PDF generation. Report print styles use A4 landscape, wrapping fixed-width tables, repeated headers, visible overflow and natural pagination, with Admin controls hidden. Long attempt sections can flow over pages.
- Modal Close, Escape and backdrop close restore the report view, scroll and original focus. Keyboard focus stays in the dialog. Toolbars wrap and content scrolls horizontally/vertically at phone, tablet/iPad and desktop widths. FA is RTL; EN/HR are LTR. Report chrome uses existing trilingual helpers. Student data/content remains in its original language.

## Performance and loading

- Group loading previously configured up to 90 seconds waiting for Admin, two 60-second requests, a quiet delay and a 3-second retry. Initial-sync waiting is now capped at 3 seconds. Each group request has a 22-second presentation deadline; only a **completed server statement-timeout error** gets one retry after 700 ms. There is no automatic retry of a potentially still-running client timeout. Worst configured UI wait is approximately 25 seconds for one hung request or 47.7 seconds for two server-timeout attempts.
- Individual profile UI deadline is 17 seconds; optional reading deadline is 7 seconds in parallel. Optional reading failure leaves School details printable/exportable with an explicit warning. Duplicate generation is blocked and controls are unlocked on success/failure, including after an Admin rerender. A short-lived in-memory cache (60 seconds, maximum 20 students) avoids repeat profile requests on language/report regeneration; Refresh bypasses it. No sensitive report cache is persisted locally.
- Existing group caching remains 60 seconds. Refresh failure retains the prior snapshot with an error, timestamp and Retry. Invalid response shapes never masquerade as a successful empty report. Changing inactivity thresholds during loading discards the superseded response and schedules one current request.
- Rendering group/overview/member views no longer eagerly builds the unrelated full student-profile dashboard. Profiles still use the original dashboard unchanged. Group loading uses one batch RPC rather than per-student requests. No report polling or pre-generation of canvas PDFs remains.
- Removed both report modules' html2canvas/jsPDF loading, capture canvases, raster page generation and blob/share gating. Existing transport/RBAC owns network abort and authorization. The presentation deadline does **not** redesign that transport or cancel the server operation; late results after timeout are ignored.

## Changed files

| File | Change |
| --- | --- |
| `js/nh7-admin-student-academic-v540.js` | Bounded/staged read-only group loading, stale-snapshot error handling, all requested groups, 100-row pagination, full structured CSV, browser print/PDF and accessible responsive modal; lazy profile dashboard rendering. Existing roster add/delete/import/template functions remain byte-identical. |
| `js/nh7-admin-student-report-v496.js` | Bounded profile/optional reading calls, in-memory cache, required/pending lesson/assignment presentation, registration/scored attempt/wrong-answer detail, typed CSV, browser print/PDF, modal accessibility and print CSS. |
| `admin-v239-stable.html` | Append `reports=116` only to the two report runtime URLs, retaining current release and module ordering. |
| `.github/workflows/deploy-pages.yml` | Replace obsolete canvas/PDF engine-string checks with browser-print/CSV wiring and meaningful Node report tests. Enable PR validation; the existing deployment guard still permits deployment only for `refs/heads/main`, so PR validation does not deploy. |
| `scripts/verify-school-reports-v116.mjs` | Dependency-free CI regression of actual report functions: group semantics, resolved failures/stalled states, CSV escaping, pending lessons, wrong answers, data immutability and timeout fences. |
| `scripts/verify-school-reports-browser-v116.cjs` | Isolated synthetic and real-Admin integration browser tests with CSV/PDF text extraction, large data, responsive dialogs, timeouts and read-only request verification. |
| `docs/audit/ISSUE_116_SCHOOL_REPORTS.md` | Implementation, validation, reproduction and limitations. |

## Validation evidence

- Node report tests pass. Current release validation's four steps pass: active runtime syntax, current app/offline wiring (159 assets), Admin AI/report contracts and HTML inline scripts/JSON. Next-native optimization guard passes. Syntax checks pass for 80 reachable app/report modules; `git diff --check` passes.
- Synthetic Chromium test with **1,109 known identities** covers all required status groups, 100-row view pagination, full group CSV including first/final rows, formula/quote escaping, immediate Print and Save as PDF. Chromium's native PDF output is multi-page/searchable; `pdftotext` confirms the first and final report rows and detailed wrong-answer/feedback text. Print overflow/table widths are checked. Native print invocation is instrumented rather than automating an OS print dialog.
- FA → EN → HR → FA and modal view/close tested at 390, 820 and 1440 pixels. Individual tests cover required missing assignments, completed/pending lessons, review state, attempts/scores/wrong answers, optional-source failure, cache reuse and typed CSV/PDF. Real timeout callbacks exercise hung group/profile requests; one completed statement timeout retries successfully. The original source fixtures remain byte-identical and captured page errors are empty.
- A second browser smoke test loads the actual current `admin-v239-stable.html`, its Admin HTML, RBAC and stability layers, then opens/prints/closes a group report and navigates to an individual report. All external requests are mocked. Report-time non-GET calls are existing read-only report/dashboard/assignment-feed RPCs or existing AI `status` / email `config` reads; no record-write or delivery action occurs.
- Existing `verify-i18n-v115.cjs` passes: 11 app routes, language cycle, appearance draft, crop canvas/zoom, players, book reader, exact-result Search → John 3:16, verse share and seeded data preservation.
- `admin.html`, School path/exam/registration/drafts, auth/RBAC/session/stability, school review workflow, testimony modules, profile-photo persistence, audio engine, Search and Bible deep-link files are byte-identical to baseline (16 protected runtime comparisons). Existing explicit church-roster mutation functions are also byte-identical; report actions never call them. No Supabase/schema/migration/RLS/Storage changes.
- Read-only validation steps extracted from all nine existing workflows: **15 pass, 6 historical failures, 7 excluded mutation/deployment/live-production steps**. All six failures reproduce on untouched `68bcc5d`: old v447 Admin version, old v451 cache/release signatures, audio23945 removed signed-loader and old release metadata, wave1a old stable release, wave1b old loader wiring. Standalone auth-v348 and Admin-RBAC-v350 verifiers also fail the obsolete 2.3.9.40 assertion identically on baseline. Their version locks were not rewritten under this report package.
- Apply/commit Admin-patch workflow steps, Pages deployment and historical live Edge auth/CORS calls were not run. No production data/service calls occurred.

## Reproduce

From repository root:

```sh
node scripts/verify-school-reports-v116.mjs
python3 -m http.server 8765 --bind 127.0.0.1
# In another terminal (Playwright, Chromium and pdftotext must be available):
node scripts/verify-school-reports-browser-v116.cjs http://127.0.0.1:8765
node scripts/verify-i18n-v115.cjs
```

Browser test defaults to `/usr/bin/chromium`; `CHROMIUM_PATH` can override it. All nonlocal traffic is intercepted. CSV/PDF evidence is written to a temporary directory printed by the test. It never reaches Production, submits assignments/exams or modifies a real student.

## Remaining limitations / risks

- Live production volume and server response time have not been measured. The unchanged aggregate RPC still returns its full known-identity dataset; backend statement timeouts remain possible. First-load failure shows Retry; refresh failure preserves an explicitly stale snapshot. Further server-query/schema work would require a separate authorized package.
- Not-registered reports cover known identities returned by the existing RPC, not unknown people outside Auth/activity/roster. No server-side pagination parameter exists for this RPC. Display pagination reduces DOM work; full exports/print still hold the selected dataset in memory.
- Required/pending lesson detail depends on Admin's already-loaded active lesson catalog and existing `schoolLessonHasAssignment` helper. Wrong-answer text/correct options require the already-available exam questions and attempt answers; missing source data is not reconstructed. No progression/approval/score calculations were changed.
- Browser Save as PDF is a print-destination flow, not a one-click `.pdf` download. Physical printer, native Safari/iPad OS print UI and device-specific PDF destinations require device QA. Width checks emulate phone/tablet layouts in Chromium; they are not a claim of hardware Safari testing.
- Historical version-pinned validators remain pre-existing failures as listed above. PR review should verify Croatian wording and representative production-sized data with authorized read-only access. No automatic merge/deployment.
