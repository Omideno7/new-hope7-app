# Wave5 Document Studio V2 completion report

**COMPLETE-CODE / source-fixture complete; backend REVIEW-ONLY; live and physical acceptance unproven.** No deployment, migration application, Production/user-data mutation, new branch/PR, merge or main change. Stop after Wave5. All coding/testing is on existing `develop`.

Starting develop **46c0ebf9aaabf67f07bcbae4e02028913b86b951**; audit committed first at **d15efe2629c549b1d558b66f6b550037592dc393**; implementation **5f8ad6a44c320223680f1626c9efb92ad2a998b7**. Main remains **15af811f78a17a0881c13171311e7ade6bc390f4**. The final follow-up SHA, exact-head CI URL/head proof and complete aggregate diff/file inventory are recorded in the final delivery receipt after this report is committed, avoiding a self-referential commit hash. No claim of successful CI before its actual conclusion.

## Root causes and architecture

The old reference had valuable mm editor/templates/PDF/QR concepts, but old/preview authorization, incomplete exact-token fencing, one-shot public status, stale upload/save contexts, repeated observers and fragile issue/data contracts. It was exported/read/audited before runtime changes, never merged/rebased/cherry-picked. Current Wave1–4 and legacy runtime bytes are preserved exactly. New scoped pages/modules sit alongside current supported legacy routes.

One schema2, deterministic physical-mm model and one renderer/CSS provide editor, prepared confirmation, account viewer, public verification, top-level Print and flattened PDF. Viewport fit/zoom never changes A4 coordinates. Church name is between photo/logo; details stay in footer; QR quiet zone and rotated bounds are checked client/server. Fonts and QR/html2canvas dependencies are local and licensed. Six existing fonts are offered; FA uses RTL, EN/HR LTR; other-language authoring survives tab changes, issue and revision.

Authorization reuses current `nh7_admin_my_access_v350` / private v350 owner helper. Insufficient delegates receive no invented grant. Every await uses captured UID/exact JWT/app companion identity/document/context/revision. New RPCs are disabled unless the explicit backend-ready flag is approved; current owner proof permits only local authoring when absent. New SQL/Edge/AI contracts live exclusively under review/, never migrations/deployed functions. Existing School progression, Auth, Library grants/file flow, data and Wave4 notifications are byte-exact.

## Lifecycle and editor matrix

| Stage/feature | Source/fixture result |
|---|---|
| New draft / duplicate | New UUID, no prior recipient/photo/student code/token/number; template reuse strips identity and rejects remaining private literals |
| Edit / bounded save / reopen | Captured upload target/context; image/logo/church/design/layers preserved; 1200ms debounce; optimistic revision; local UID recovery plus distinct server copy; conflict never silently overwrites |
| Preflight / preview | Required title/body/name/signer/date/church/layers, real fonts/images/overflow, rotated bounds and QR quiet zone; one canonical renderer |
| Prepare / confirm / issue | Server number/token/current recipient/student identity; stable request; exact prepared snapshot confirmation; explicit tap; duplicate issue returns one immutable record |
| Foundation School | Reads already-approved existing certificate/current Student ID; no new eligibility/progression algorithm |
| Revision after publish | New document/token/identity with parent; all3 private authoring languages preserved; previous published definition unchanged |
| Revoke / expire / deliver | Non-destructive status/history; expiry verified; current-UID explicit delivery, no email authority; no hard-delete draft/document endpoint |
| Account deletion | Synthetic SQL proves official recipient FK SET NULL and delivery CASCADE; historical public snapshot remains, deleted UID archive disappears; no live deletion performed |
| Layers | Select/name/show/hide/lock, order/front/back, duplicate optional/delete optional, protected-layer delete restriction, reset |
| Geometry | Actual pointer drag/resize, numeric mm, arrow/Shift movement, undo/redo, align, grid/snap, zoom/fit/fullscreen and responsive inspector |
| Text | Independent FA/EN/HR title/subtitle/body/footer, six bundled fonts, weight/italic/size/line height/alignment/color |
| Images | Photo/logo/signature/seal/background; contain/cover, focal crop/zoom/rotation/opacity/border/radius; local decode/downscale; cancellation, captured target and URL cleanup |
| Page | Palette/gradient/background/frame/shadow; all variants preserve canonical portrait/landscape dimensions |
| Accessibility | Keyboard layer controls, visible focus, native dialog trap/Tab/Escape/restore, compact inspector, touch controls, reduced motion and visual-only fit |

The published snapshot is immutable; revision does not update the earlier issued definition. Old issued records open their original public/verification route; they are not silently converted. An owner-authorized nonce handoff copies only the active current legacy draft/row's supported photo/logo/church/design and measured mm layout into new V2 authoring. Unsupported old geometry/font cases need operator inspection; legacy cleanup remains deferred.

## Type / template / language / orientation coverage

Every row below passes **48 model and actual font/render cases**: all8 templates × FA/EN/HR × A4 portrait/landscape. Total **720**. Three explicit presets per type/language are verified; custom documents require explicit title/body. This is automatic source/render coverage, not subjective design/device approval.

| Type | FA RTL | EN LTR | HR LTR | Portrait + landscape |
|---|---|---|---|---|
|Water Baptism|PASS|PASS|PASS|PASS|
|Course Completion|PASS|PASS|PASS|PASS|
|Foundation School|PASS|PASS|PASS|PASS|
|Ministry Training|PASS|PASS|PASS|PASS|
|Participation|PASS|PASS|PASS|PASS|
|Membership|PASS|PASS|PASS|PASS|
|Active Membership|PASS|PASS|PASS|PASS|
|Ministry Service|PASS|PASS|PASS|PASS|
|Volunteer|PASS|PASS|PASS|PASS|
|Conference|PASS|PASS|PASS|PASS|
|Leadership|PASS|PASS|PASS|PASS|
|Graduation|PASS|PASS|PASS|PASS|
|Official Church Letter|PASS|PASS|PASS|PASS|
|Custom Certificate|PASS|PASS|PASS|PASS|
|Custom Official Document|PASS|PASS|PASS|PASS|

Templates: **New Hope Classic, New Hope Emerald, Royal Blue, Elegant Gold, Minimal Modern, Dark Prestige, Celebration, Clean Official** — all included in each row. Responsive/language cases cover390/430/768/820/1024/1280/1440px, plus844px landscape in the lifecycle test. All essential controls remain within viewport and mm geometry is unchanged. No native safe-area/wrapper import.

## Output, verification, archive and boundaries

| Boundary | Result and practical limit |
|---|---|
| PDF | Actual `%PDF-1.4`, application/pdf Blob/File, one physical A4 MediaBox, raster-flattened; six FA/EN/HR portrait/landscape files parsed by Poppler. Image canvas pixels match public/editor; same renderer feeds capture. Not encrypted, signed or cryptographically tamper-proof; text is flattened, not selectable |
| Print / Share | Dedicated top-level same-origin nonce handoff, explicit synchronous fresh user-tapped window.print, persistent Back/PDF and actionable Safari Share→Print/menu fallback. Old proof requires explicit Refresh. File-ready second Share gesture/fallback cleanup; native sheet behavior remains physical QA |
| Timeout / cleanup | Asset15s, capture30s and guarded requests15s; finally clears busy/staging; hung-image handlers/src cancelled, genuine retry works; stale account/context cannot export older private view |
| QR / Public Verification | Actual bundled QR pixels decoded to canonical UUID-token URL; no Admin/UID/email URL; fresh no-store valid/revoked/expired/not-found/error, visibility/online/BFCache revalidation, no stale valid offline fallback; private/hidden content excluded |
| My Documents | UID/JWT/logout fenced read-only archive, type/status/date/number filters, view/PDF/share/verify/revision relationship; delayed A→B response clears rather than repopulates; original legacy links retained; never email-authorized |
| Admin | Current server-proven owner only; anonymous/normal/wrong UID/insufficient delegate denied; delayed owner/save/issue fences tested; app companion switch also fences separate Admin token |
| Library | Only explicit recipient-free official_letter/custom_document resource flow, all3 metadata languages, canonical confirmation, fixed owned PDF path/hash, current owner recheck/current caller-JWT v224 writer, once-only claim/new immutable version; personal documents never general Library. Existing reader/Ministers/file/RLS security retained. Public resource verifier returns generic status/number only, never a content-access bypass |
| AI | Reuses server/provider boundary; generic brief only, no recipient UID/email; current translate remains unchanged, proposed draft_document adapter review-only; all6 language×field requests manual-only. Accept changes one captured field/language; reject/cancel/stale retains originals. No automatic tab-translate, issue/publish/revoke |

## Measurements and reproducibility

Raw evidence: `docs/qa/WAVE5_DOCUMENT_STUDIO_MEASUREMENTS.json`, harness `scripts/measure-wave5-documents.cjs`, fixed starting tree exported by git archive and current implementation tree served locally. All remote endpoints intercepted; fresh synthetic PGlite only; actual wall timers, no frozen measurement clock.

- Admin before/after startup **48/48 requests**, each60s visible +60s hidden **0/0 idle requests**. Existing legacy callback totals varied with concurrent scheduling/load; these are recorded honestly, not CPU/battery savings. Current legacy timer code is exact and new Studio has no recurring polling.
- Studio startup **5 reads**, visible/hidden idle **0 requests /0 timer callbacks** each60s. My Documents startup **1 read**, idle **0/0**, explicit account-switch refresh **1 read**.
- Twenty edits: **one backend save**, bounded local recovery writes. Twenty rebuilds: **one active ResizeObserver, zero global listener additions**. History capped100; completed-image cache capped8 and cleared on context changes; one decoded upload retained only in current draft.
- Upload/cancel/retry: each created1/released1 actual ObjectURL; cancel wrote nothing. Upload produced1 save; identical retry produced0 saves. No staging/busy/object-URL leaks.
- Fixture preview **34ms**, PDF **293ms**, **249,947 bytes**; captures1/active0/owned URLs0 after output. Snapshot **1,027,453 bytes**, history21. These are one Chromium sample, not hardware/provider/Production latency limits.

Reproduce with existing Playwright + pinned isolated PGlite0.3.14/jsqr1.4/pngjs7 and local Chromium/Poppler, preserving existing NODE_PATH. Run measurement harness with starting/current local origins and output path. Exact harness/runtime hashes and versions are in JSON. No runtime dependency install/CDN added; these tools are CI/test-only.

## Tests, CI and fixture compatibility corrections

Existing Validate Develop retains all Wave1–4 gates and adds Wave5 syntax/scope, real SQL/model/boundary tests, browser lifecycle/safety/races and current School report/PDF/Print/Community/Notes/Audio regressions. No deploy job/permission. New HTML dependencies/IDs, JSON manifest, licensed QR hash, all changed JS/MJS/CJS/review TS parse, git diff --check validated. Review TypeScript uses Node built-in type erasure then JS parsing, preserving current Wave4 Node24.21 compatibility strategy.

Passed local: canonical/consolidation/main-develop provenance, migration/Student Identity/exam/assignment/certificate/public verifier/School-stage checks, Native Optimization Guard, responsivev570/themev571/offlinev572, current Profile/Search/Inbox, writing direction, Wave1 performance, Wave2 local-first/reconnect/account restore, Wave3 Birthday/Admin owner fencing/composer, Wave4 notification source/browser, Web Community parity, Notes account merge, Audio safety, legacy Community/certificate/Admin, reportsv116/PDFv119/Printv121 including native-fallback emulation. Wave5 model/actual-SQL,720 actual render/21 locale-responsive, six realPDF, QR decode, image/capture timeout/retry, actual drag/resize, identity stripping, server/local recovery, native dialog keyboard/focus, stale archive/owner/save/issue and AI/Library negatives pass.

Three older fixture files required **stronger current-path compatibility corrections only**:
- Wave2 browser test had fabricated a Notes panel on Profile after500ms, then attempted to click a closed categorized Audio note. It now navigates Home, opens the actual My Notes control and Audio details before the real Delete click. All offline persistence/restart/reconnect/owner/favorites/progress assertions remain.
- Reportsv116 browser fixture expected a Student Code beyond the first100 sorted rows; now searches that actual code, verifies rendered cell, clears search and retains full pagination/CSV/PDF assertions. Fixtures/strict read-only RPC allowlist now use current student_profile_v452 and academic_center_v543.
- PDFv119 browser fixture used obsolete student_profile_v451; updated only to currentv452. All real PDF/Print/File/Share/error/immutability assertions retained.

No existing product implementation was changed for these fixture issues, no force clicks/skipped tests/data assertions removed. Initial failures and their diagnosed assumptions are distinct from final successful results. Exact-head CI URL/head proof must be read from the completion receipt, not inferred from local PASS.

## Review-only backend inventory / activation / rollback

All8 files under `supabase/review/wave5-document-studio-v2/`: `README.md`, `candidate.sql`, `library-boundary.sql`, `library-publication.mjs`, `library-entrypoint.ts`, `ai-assistance.mjs`, `preflight.sql`, `disable.sql`. No migration used/added/applied. Checkpoint **42/42 exact,0 missing,1 pre-existing pending** `20261012123000_audio_bible_public_catalog_read_v511.sql` unchanged.

Exact activation order/prerequisites in README: read-only confirm current live v350/private helper, School identity/certificate fields, naming collisions, current v224 new-ID payload semantics, Storage owner_id/fixed bucket/RLS; approved isolated real Supabase parallel transaction/ACL/old-token/account-deletion tests; separate explicit candidate/schema approval; optional reviewed Library Edge verify_jwt/current-caller writer + ownership/hash/no-overwrite tests; optional AI action integration after unchanged JWT/CORS/provider boundary; only then explicit client capability. No secret value included. Lists are bounded100, recipients200; larger-directory paging is a future approved integration improvement, not hidden full-table scanning.

Rollback is disable-first, never destructive: remove capability/stop optional Edge/AI calls, revoke only proposed mutations/admin/service helper access using reviewed disable.sql; retain issued definitions/numbers/tokens/parents/audit/deliveries/templates/local recovery and public/current-UID archive. Never drop/rewrite/backfill old rows or clear user caches. Existing functions/migrations unchanged.

## Convergence and remaining gates

`WAVE5_DOCUMENT_STUDIO_BRANCH_CONVERGENCE.md` accounts for **55 old unique paths** at exact822b… tip. Useful model/editor/catalog/render/PDF/QR/test concepts selectively reconciled; obsolete authority/session/runtime/release rejected; current Wave3 Workspace supersedesv522; legacyv520/core/public links retained; historical mobile/deploy evidence reference-only. Old branch retained; #240/#241/#106 unchanged.

Unproven: live schema/RLS/helper/Storage/provider definitions and actual activation, real parallel PostgreSQL issuance/claim races, real recipient/document delivery and account deletion, real production Library listing/new-file publication, controlled AI provider behavior, legacy long-lived token compatibility with actual records, subjective printed typography/design, Safari/iOS/Android file/share/native Print/WKWebView and PWA cold/offline/upgrade behavior. No physical battery/thermal/billing claim. Flattened PDFs are not tamper-proof. Later release/device acceptance and explicit Production approval remain mandatory; source/fixture completion does not enable backend services. Legacy cleanup deferred; no Wave6 started.

## Complete changed-file inventory

49 files, including the pre-implementation audit and this report; final aggregate insertion/deletion counts are in the final receipt.

- `.github/workflows/validate-develop.yml`
- `admin.html`
- `css/document-studio-v2.css`
- `docs/qa/WAVE5_DOCUMENT_STUDIO_BRANCH_CONVERGENCE.md`
- `docs/qa/WAVE5_DOCUMENT_STUDIO_CONVERGENCE_AUDIT.md`
- `docs/qa/WAVE5_DOCUMENT_STUDIO_MEASUREMENTS.json`
- `docs/qa/WAVE5_DOCUMENT_STUDIO_REPORT.md`
- `document-output.html`
- `document-studio.html`
- `document-verify.html`
- `index.html`
- `js/document-studio-v2/admin-entry.mjs`
- `js/document-studio-v2/api.mjs`
- `js/document-studio-v2/archive-entry.mjs`
- `js/document-studio-v2/archive.mjs`
- `js/document-studio-v2/catalog.mjs`
- `js/document-studio-v2/editor.mjs`
- `js/document-studio-v2/model.mjs`
- `js/document-studio-v2/output-page.mjs`
- `js/document-studio-v2/output.mjs`
- `js/document-studio-v2/renderer.mjs`
- `js/document-studio-v2/resource.mjs`
- `js/document-studio-v2/ui.mjs`
- `js/document-studio-v2/verification.mjs`
- `js/vendor/document-qrcode-1.5.4.js`
- `js/vendor/document-qrcode-LICENSE.txt`
- `js/vendor/document-qrcode-dependencies.json`
- `my-documents.html`
- `scripts/document-studio-v2/database.cjs`
- `scripts/measure-wave5-documents.cjs`
- `scripts/verify-local-first-wave2-browser.cjs`
- `scripts/verify-report-pdf-v119.cjs`
- `scripts/verify-school-reports-browser-v116.cjs`
- `scripts/verify-wave5-boundaries.cjs`
- `scripts/verify-wave5-documents-browser.cjs`
- `scripts/verify-wave5-documents-safety-browser.cjs`
- `scripts/verify-wave5-documents.cjs`
- `scripts/verify-wave5-races.cjs`
- `scripts/verify-wave5-safety.py`
- `scripts/verify-wave5-syntax.cjs`
- `supabase/review/wave5-document-studio-v2/README.md`
- `supabase/review/wave5-document-studio-v2/ai-assistance.mjs`
- `supabase/review/wave5-document-studio-v2/candidate.sql`
- `supabase/review/wave5-document-studio-v2/disable.sql`
- `supabase/review/wave5-document-studio-v2/library-boundary.sql`
- `supabase/review/wave5-document-studio-v2/library-entrypoint.ts`
- `supabase/review/wave5-document-studio-v2/library-publication.mjs`
- `supabase/review/wave5-document-studio-v2/preflight.sql`
- `sw-release-core-v403.js`
