# Document Studio V2 engineering and review report

PR **#240**, existing branch `codex/document-studio-regression-qa`. V2 work began at **674e4183d7b132dfca1ea0401ee7c0caf476d0b4**. PR #241 is separate and untouched. The exact candidate head and CI results are recorded in the PR description and final delivery message, rather than embedding a self-referential commit hash here.

**Status:** implementation and automated fixture validation; **not manually/physically approved, not deployed, not Production-enabled**. Do not equate green CI with completion of the mandatory native/manual acceptance gate.

## 1. Architecture

A parallel, modular Studio V2 uses one versioned millimetre-based document definition and one renderer. It does not replace the current app runtime wholesale or mutate existing issued documents. This avoids extending the legacy chain of runtime repair overlays. Four additive server contracts support the lifecycle without sharing legacy issuance keys. Existing Documents, Studio, verification and links remain available during review.

## 2. Root causes

The old path combines transient draft state, current-row state and design overrides, so uploaded assets can diverge during hydration or document switching. Several overlays adjust editor/public/output markup separately; pixel-scaled geometry and CSS overrides produce different output. Asynchronous asset/capture operations need bounded waits and unconditional cleanup. The current repository does not include the exact legacy issuer source; reusing it for new arbitrary document types would risk overwriting historical rows. V2 avoids those boundaries rather than inventing a destructive migration.

Additional integration bugs caught in V2 automation: the bundled QR library assigns intrinsic pixel display styles (now reset to the canonical element size); issuance must flush an in-flight autosave before confirming the snapshot; uploads must remain bound to their document/recipient; public snapshots need explicit editable-language defaults when copied into a fresh revision.

## 3. Existing files changed in the V2 follow-up

- `admin.html`: isolated module entry button inside Documents; no old runtime replacement.
- `index.html`: signed-in Profile archive entry module; executable worker version only.
- `service-worker.js`: matching executable release version.
- `sw-release-core-v403.js`: cache `5.4.5-document-studio-v2`, V2 static asset list and preferred executable refresh. No RPC response caching or user/download/reader cache clearing.

The complete PR also retains its earlier V521/V522 fixes and provenance audit. See PR Files changed for those pre-existing commits; this report describes the additional master-spec implementation.

## 4. New files

- `.github/workflows/validate-document-studio-v2.yml`
- `css/document-studio-v2.css`
- `document-studio.html`
- `document-output.html`
- `document-verify.html`
- `my-documents.html`
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
- `js/document-studio-v2/ui.mjs`
- `js/document-studio-v2/verification.mjs`
- `js/vendor/document-qrcode-1.5.4.js`
- `js/vendor/document-qrcode-LICENSE.txt`
- `scripts/document-studio-v2/database.cjs`
- `scripts/verify-document-studio-v2.cjs`
- `scripts/verify-document-studio-v2-browser.cjs`
- `scripts/verify-document-studio-v2-wiring.py`
- `supabase/review/document-studio-v2.sql`
- `supabase/review/document-studio-v2-disable.sql`
- `docs/DOCUMENT_STUDIO_V2_BACKEND_REVIEW.md`
- `docs/DOCUMENT_STUDIO_V2_QA.md`
- `docs/DOCUMENT_STUDIO_V2_REPORT.md`

## 5. Deferred legacy cleanup

No old file is deleted. A future separately approved deprecation may retire the old `admin-v2.3.9-document-studio.js`, `...-fix1.js`, `...-focus-fix2.js`, `...-document-runtime-fix4.js` and `...-document-select-fix5.js` repair chain after proving compatibility for every issued design/link. V521 legacy rendering remains required meanwhile. Removing these now would violate the specification’s acceptance gate.

## 6–7. Database, RLS and Auth

No migration is added to `supabase/migrations`; none is applied. **42/42 exact Production checkpoint hashes, 0 pending.** Review-only SQL is justified by immutable repeat issuance and durable UID delivery. It proposes four independent RLS tables, a separate numbering sequence, guarded exact-signature RPCs and allow-listed public projection. It does not alter School, existing certificates, Auth, RLS on old tables, Storage or Edge functions. Details, prerequisites, approval sequence and non-destructive rollback are in `DOCUMENT_STUDIO_V2_BACKEND_REVIEW.md`.

## 8. Schema/lifecycle

`design_schema_version: 2` contains template/type/orientation/language, canonical page/theme, separate FA/EN/HR content, recipient/UID/canonical Student ID, church identity/contact, images, verification and ordered typed elements. Drafts carry optimistic revisions and debounced local/admin-server persistence. Preflight checks required fields/elements, rotated bounds, QR geometry, legal font readiness, image/capture readiness and text overflow. Number reservation is stable; deliberate confirmation precedes idempotent server issuance. Issued public snapshots cannot be edited or hard-deleted through V2. Revocation preserves history. Revision creates a new identity with an explicit relationship. New/duplicate/template contexts remove recipient photo/UID/email/Student ID and token/number; reopen preserves the current draft.

## 9. Templates

New Hope Classic, New Hope Emerald, Royal Blue, Elegant Gold, Minimal Modern, Dark Prestige, Celebration and Clean Official. Each supports A4 portrait/landscape, configurable frames, palettes, fonts, images and positions. Custom certificate/document types initially have blank title/body. Saved custom templates strip recipient/issued identity.

## 10–11. Types and presets

Water Baptism; Course Completion; Foundation School; Ministry Training; Participation; Membership; Active Membership; Ministry Service; Volunteer; Conference; Leadership; Graduation; Official Church Letter; Custom Certificate; Custom Official Document.

Three editable presets per type in each language: **135 type/language/preset combinations**. Baptism, completion, participation, membership, service and letter families have appropriate distinct formal/pastoral/concise wording; completion uses Academic/Ministry/Achievement labels. Custom reusable presets are identity-scoped and contain only content. Loading is explicit; switching FA/EN/HR never translates/overwrites existing text. Language tabs select the document’s RTL/LTR and printed labels.

## 12. Fonts

Vazirmatn, Noto Naskh Arabic, Amiri, Markazi Text, Inter and Lora use the repository’s legally bundled OFL WOFF2 assets. Persian uses Arabic-capable defaults/fallback. Readiness waits precede preview/output. PDF rasterization retains the actual drawn glyphs instead of relying on external viewer fonts.

## 13. Controls

Ordered layers: select/name/hide/lock/reorder/front/back/duplicate/delete optional/reset. Typed title/subtitle/recipient/body/custom text/number/student/date/church/contact/photo/logo/QR/code/signature/signer/role/seal/watermark/line/frame/shape/background/footer. Protected required elements cannot be deleted; hiding required fields blocks preflight. Pointer drag/resize, exact mm coordinates, arrows/Shift arrows, alignment, grid/center snapping, undo/redo, fit/zoom, fullscreen and inspector. Text font/size/weight/italic/underline/color/alignment/spacing/line-height, bounds and padding; image crop/contain/focal/zoom/opacity/border/radius; page palette/background/gradient; frames/shadow. Default church name is centered between photo/logo; full contact remains in the footer; QR stays inside A4 bounds.

## 14. Canonical rendering

Studio, final confirmation, public page, archive viewer, top-level print page and PDF all import `renderer.mjs`. Coordinates remain A4 mm; viewport fit affects only the outer transform. Cropped images use the same canvas operation in every mode. QR is bundled locally with a fixed quiet zone and the exact stable public URL. Print removes viewport scaling and uses `@page A4 portrait/landscape`.

## 15. PDF/Print

Vendored html2canvas captures a fresh unscaled canonical page. A small local PDF writer embeds one flattened JPEG on true A4 point dimensions. Output is a real `application/pdf`, with no editable document text layers. **Flattened does not mean cryptographically tamper-proof/encrypted**; do not market it as such. Font/image/QR waits and capture have deadlines; `finally` removes busy state and offscreen DOM on success/failure. Safari receives a prepared Blob/File and an explicit second-tap Share/Save to Files control plus download fallback. Print opens a dedicated same-origin top-level page with persistent Close/Back/Print/PDF controls; the final Print tap calls that page’s `window.print()` synchronously and always shows an actionable Safari menu fallback.

## 16. Public verification

UUID-token RPC returns VALID, REVOKED, EXPIRED or NOT FOUND. Valid responses contain only the approved visible document, recipient public name/Student ID if shown, number/code/date/church and matching preview/PDF/print. The branded page explains that current records confirm issuance. Revoked/expired pages do not expose an old valid preview. No private recipient email/account/admin UID or Supabase admin controls are exposed. Invalid token/service error is localized. Old public routes/tokens remain unchanged.

## 17. My Documents / delivery

Admin delivery creates a durable idempotent UID linkage, independent of notification transport. Profile adds My Documents without modifying the current Profile implementation. The archive is online and current-UID-only; session changes clear its view, including async response races. It supports type filtering, status/date/number, preview/PDF/verify/share, and canonical-UID legacy links. It never authorizes through email. Optional Inbox/push notification is deliberately omitted to preserve notification behavior.

## 18. Security and data safety

Current admin JWT plus server admin entitlement is mandatory. Browser state cannot authorize issuance, assign canonical Student IDs or read another UID’s archive. Ordinary/anonymous users have no table grants. Public data is a server allow-list; all intentional visible custom text is warned as public. Account deletion cannot be blocked by new audit FKs; issued history remains retained. No production data, notes, assignments, progress, saved verses, downloads, photos, testimony/prayer/community/audio/account-merge state is rewritten or cleared. No runtime CDN is added. Network in browser tests is intercepted and all external requests are blocked.

## 19. Automated evidence

- `verify-document-studio-v2.cjs`: **720 model combinations** (8 templates × 15 types × 3 languages × 2 orientations), presets, undo/redo, reset; actual isolated PostgreSQL security/lifecycle/revision/idempotence/canonical ID/template/privacy/archive/revoke/account-deletion tests, SQL applied twice.
- `verify-document-studio-v2-browser.cjs`: real upload → exact-coordinate edit → save/new/reopen → FA/EN/HR → fit at 390/844/768/1024/1440 widths → preflight/issue → public logical geometry and actual QR decoding → top-level user-gesture print → six real A4 PDFs parsed by Poppler → capture failure cleanup/retry → recipient A/B archive isolation → revoke/public status; unchanged legacy fixture rows.
- `verify-document-studio-v2-wiring.py`: imports/entry dependencies/local output assets; review SQL isolation and no existing School/Auth mutation.
- Existing V521 browser: upload/hydration/reopen; six FA/EN/HR A4 public/editor/PDF/print cases; broken/hung image cleanup/retry; clean new context.
- All 13 current Pages validation blocks, Next Native Optimization Guard, legacy ordered-renderer dependency guard, worker network-first refresh/data-cache retention, changed JS/MJS syntax and `git diff --check`.

CI adds an isolated regression workflow; it has no deployment or database credentials. Exact candidate SHA/check runs are reported on the Draft PR. Existing guards are not weakened.

## 20. Manual QA

Cloud browser automation and inspection of generated public/PDF artifacts completed. **No physical iPhone/iPad/WKWebView test, native print-sheet test, signed build, Production issuance or full 63-step manual operator run is claimed.** `DOCUMENT_STUDIO_V2_QA.md` retains that acceptance checklist, with explicit evidence categories. Physical/manual approval remains a merge/release gate.

## 21. Limitations

Backend source is review-ready, not installed: new server draft persistence, issue/verify/delivery/archive require the separately approved additive SQL and verified live preconditions. Local drafts work only after current online admin authentication. Inline images enlarge drafts; total backend definition cap is 3 MB and large complex/background designs need real-device memory QA. PDF is raster rather than selectable accessible text or crypto-encrypted. Safari may require Share → Print; native confirmation cannot be asserted in Chromium. Network revocation cannot retract downloaded files. Manual/nonaccount recipients cannot receive a UID archive entry. Old issued designs remain on their original renderer/links; redesign requires a new reviewed issuance. Batch issuance, notification transport, native file bridges, migrations application and legacy deletion are deliberately excluded. No unsafe claims of Production completion.

## 22–23. Candidate and release boundary

Exact PR head and green CI are in the PR description/final response. **PR #240 remains Draft. No merge, deployment or Production mutation. PR #241 untouched.** Production/server activation and legacy deprecation remain subject to explicit review plus physical/manual acceptance.
