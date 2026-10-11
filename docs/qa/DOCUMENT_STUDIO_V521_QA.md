# Documents / Full Document Studio regression QA

Base: current `main`, `67d829de0d8d4846e309a99bcd98c4c005b3b030` (rechecked before publishing the review branch).
Branch: `codex/document-studio-regression-qa`. Review only; no deployment or merge.

## Changed files

| File | Purpose |
| --- | --- |
| `.github/workflows/deploy-pages.yml` | Adds active Documents static/syntax guards; deployment triggers unchanged. |
| `admin.html` | Loads shared renderer and refreshed Documents assets. |
| `admin-v239-stable.html` | Refreshes stable Admin build key. |
| `admin-cover-test-v538.html` | Adds renderer dependency for the existing cover QA entrypoint. |
| `certificate.html` | Delegates public markup to the shared renderer and refreshes output assets. |
| `css/nh7-document-ux-v520.css` | Canonical logical page, centered church, bounded footer/QR and print scaling. |
| `index.html` | Worker/app cache query refresh only; module selection unchanged. |
| `js/admin-v2.2.0.js` | Saved-row asset hydration, shared renderer and new-context identity/recipient isolation. |
| `js/admin-v2.3.9-document-runtime-fix4.js` | Draft-first Studio hydration, shared defaults and current asset synchronization. |
| `js/admin-v2.3.9-document-select-fix5.js` | Preserves saved references and resets the new-document button context. |
| `js/nh7-document-renderer-v521.js` | Shared document markup and defaults, including saved styles and watermark. |
| `js/nh7-document-ux-v520.js` | Bounded PDF stages, detached-clone placement/image normalization and cleanup. |
| `service-worker.js` | Aligned release worker import query only. |
| `sw-release-core-v403.js` | Executable release-cache version/key refresh only. |
| `scripts/verify-admin-live-search-document-studio-v508.cjs` | Checks moved renderer in its shared source. |
| `scripts/verify-community-certificate-admin-v505.cjs` | Retains draft-QR safety assertions against the shared renderer. |
| `scripts/verify-document-v520.py` | Checks active v521 asset references and hydration/shared renderer contracts. |
| `scripts/verify-document-studio-v521.cjs` | Local-only full-flow browser/output/failure/isolation regression. |
| `docs/qa/DOCUMENT_STUDIO_V521_QA.md` | Findings, evidence, safety boundaries and user acceptance steps. |

## Findings and fixes

- Studio hydrated the issued row before the current draft, so newly uploaded main-page assets could be replaced by older saved URLs. Opening/applying Studio now reconciles current draft assets while retaining saved positions/design. On row selection/reopening, the saved `studio_v239` asset references are restored even if the existing design-save RPC leaves older top-level photo metadata unchanged. Saved church details take precedence over the last document's global contact cache.
- The in-Studio selector independently overwrote saved logo references with row metadata. It now fills missing references only. Its “Issue new document” action previously only closed Studio; it now starts a clean draft.
- New/template contexts retained the old issued ID/public identity. They now detach that identity and reset recipient photo/draft state; changing the recipient clears the previous recipient's photo and detaches the issued identity. Existing issued rows and their stored designs are not deleted or rewritten by these resets.
- Admin and public pages used separate markup, with differences in saved styles, watermark rendering and photo-position precedence. `nh7-document-renderer-v521.js` is the shared markup/defaults source. Studio clones the current Admin page and preserves QR pixels; the existing PDF exporter captures that page. Public links use the same renderer. The export clone additionally rasterizes image cover/contain cropping and grayscale and resolves translation matrices to pixel placement (removing identity transforms); html2canvas otherwise misplaces nested centered church text and photo contents despite correct DOM geometry. Fixed staging placement overrides the shared page positioning, avoiding offscreen-coordinate drift. Editor/public DOM is unaffected. Church name is centered at 10% page height; contact details remain in the footer. Default logo is on the right; explicitly saved asset positions remain authoritative.
- Screen widths, legacy mobile margins/field columns, print sizes and PDF staging previously produced different reflow. Shared CSS now uses the same logical A4 page in every mode (760×1075 portrait; 1120×792 landscape), with print scaling to physical A4. Narrow hosts scroll the logical page instead of changing its geometry. Footer columns have zero minimum widths, and the QR/verification area stays within the page.
- PDF image/font readiness and html2canvas completion had unbounded waits. Image/font stages are bounded to 15 seconds each and rendering to 30 seconds. Errors propagate to the existing localized alert and `finally` always removes staging and the blocking overlay. A failed export can be retried without closing Admin. PDF remains the existing local, flattened JPEG-in-PDF output (`application/pdf`, one A4 page), with no form fields or editable text layer. This is not encryption or a guarantee against modification by specialist PDF tools. No PDF dependency was added.

## Pages investigation

Read-only GitHub API evidence on 2026-10-11:

- Pages source: `main`, repository root; configured build type `legacy`.
- Latest Pages build: `built`, commit `67d829de0d8d4846e309a99bcd98c4c005b3b030`, updated `2026-10-11T15:23:17Z`, no build error.
- Current main already loads Community v502 and exposes Testimonies / Prayer Request routes and navigation in FA/EN/HR. No missing Community module or deployment of an older commit was established.
- The workflow also contains Actions Pages publishing, but this PR does not change Pages settings or publishing triggers.
- Cache remedy prepared: aligned main worker/release-core version `5.4.4-community-cert-doc521`, new executable release cache, refreshed app query, Admin build key and changed Documents script/style queries. Existing stable data, reader and media caches are retained. No localStorage/IndexedDB bulk deletion or user-download purge is introduced.
- Direct HTTP access to the live Pages site returned 403 in this environment. Therefore live Pages/Safari behavior is **not** claimed as verified. These changes reach Pages only after maintainer review/merge and the normal deployment; nothing was deployed during this task.

## Verification

Local Chromium + Playwright test (`node scripts/verify-document-studio-v521.cjs http://127.0.0.1:8877`, static server from repository root; Playwright/Chromium and `pdfinfo` required):

- Actual main-page logo/photo upload handlers, including photo crop, with local mock Storage only; current uploads hydrate into Studio.
- Existing design-save RPC mocked with Production-shaped older top-level photo metadata; saved design reopens and in-Studio selection retains assets and positions.
- FA/EN/HR × portrait/landscape: desktop Studio geometry equals phone public-page geometry within 1 logical pixel for logo, photo frame, church, title, recipient, footer, QR and verification container.
- Church horizontal center and QR/verification page bounds asserted. Actual PDF-renderer pixel output is checked for centered church-name ink, and exported PDF images were inspected for photo cropping and watermark rendering.
- Six real flattened PDF downloads: PDF header, image XObject and no form fields asserted. Six browser print captures: exactly one A4 page each, checked with `pdfinfo`. Public Print button invokes the print function directly when clicked.
- Never-resolving canvas and broken-image failures: overlay/staging cleanup. Timeout timer accelerated only in the failure test. Successful Admin PDF retry and Close/Admin recovery verified.
- New-document button, template switch and recipient switch: issued identity/photo isolation; next draft has no old recipient or token. No page runtime errors.
- All external network access is blocked/mock-routed by the browser fixture; no Production account, Storage upload or data write is used.

Passing repository checks:

- All current Pages workflow validation bodies, including runtime JavaScript, app wiring, Admin/report wiring, HTML inline scripts and JSON.
- Document v520, Admin live search/Studio v508 and Community/certificate/Admin v505 verifiers (renderer-location assertions updated without changing their safety requirements).
- Supabase migration parity: **42/42 exact, 0 pending**; Next Native Optimization Guard.
- Web Community parity, Notes account merge, Audio playback safety, student Exam Review, Calendar lock, Plans themes, Appearance CSS.
- School stage model, access identity, assignment-submit identity, exam-submit identity, certificate identity and public certificate verification page guards.
- JS syntax for every changed JS/CJS file; `git diff --check`.

The retired v510/v511 document verifiers fail their old loader/footer expectations on both this branch and an untouched worktree at the exact base SHA. Main v520 had already retired those patches. They were not reactivated to satisfy obsolete tests; the active v520/v521 guards pass.

## Safety and remaining device checks

No migration was added or modified. No Supabase, RLS, auth, Storage-policy, Production data, School progression, registration, exam, assignment, Community, Audio, Notes, push or profile implementation was changed. Existing explicit document save/issue/delivery operations retain their existing backend paths; hydration/reset operations affect the client draft only. `app.js` was not replaced or edited. No historical mobile branch was merged.

Physical iPhone/iPad Safari print/download behavior, live signed/public image CORS configuration, the actual save RPC and live Pages cache refresh still require maintainer QA; mocked-browser results do not prove those Production behaviors. Large custom certificate text still requires fitting within one A4 page using Studio font controls. Phone previews deliberately scroll instead of reflowing certificate content.

## Exact user acceptance steps

Use the reviewed branch in a staging/local QA build before Production rollout:

1. Open Admin → Documents. Select an issued QA document. Upload a photo and logo on the main Documents page, then open Full Document Studio. Confirm both appear without uploading again.
2. Change photo/logo positions and sizes, church name/contact details and template text. Save the design to that QA document. Close Studio, reselect the same document and reopen. Also use “Load in this studio.” Confirm the saved assets/positions and church details remain.
3. Repeat in FA, EN and HR, portrait and landscape. Confirm only church name appears in the top center and full contact information is in the footer; QR and its container are fully inside the page.
4. Copy the public link and open it in a separate tab/device. Compare it with Studio. Tap Print with browser headers/footers disabled and A4/orientation selected; confirm one page and matching placement. Download locked PDF from both Studio and the public page; open the downloaded `.pdf` and compare it.
5. Disconnect/block an image or interrupt PDF preparation in QA. Confirm an error appears and the blocking overlay disappears; repair the connection and retry. Confirm Admin and Studio Close remain usable.
6. In Studio tap “Issue new document.” Confirm the old recipient/photo/public identity are absent. Select another recipient/template and upload that person's image. Reopen the original issued document and confirm its saved design is intact.
7. After an approved main deployment, open Pages online, reload once to activate the updated worker, and confirm Testimonies/Prayer Request entries and routes. Do not clear user data/downloads to perform this test.
8. Smoke-test existing School registration, progress, exam review, assignments, Community, Audio playback and Notes on QA accounts. Check existing saved data before/after. No such data is migrated by this PR.
