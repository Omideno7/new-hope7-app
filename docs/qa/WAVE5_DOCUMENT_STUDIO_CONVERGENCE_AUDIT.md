# Wave 5 — pre-implementation Documents convergence audit

2026-10-14. Repository Omideno7/new-hope7-app, current/upstream/target **develop**, starting **46c0ebf9aaabf67f07bcbae4e02028913b86b951** (Wave5 task-only commit after accepted Wave4 498d0650…). Main **15af811f78a17a0881c13171311e7ade6bc390f4** remains untouched. Clean checkout fetched/fast-forwarded before editing. Required AGENTS/workflow/master audit/Wave3/Wave4 reports and complete719-line task read.

Reference-only old branch: `codex/document-studio-regression-qa`, exact **822b7062302d5f9c60fa1e1caacd0c2e8a56f4c2**. Merge base **67d829de0d8d4846e309a99bcd98c4c005b3b030**. Old branch changes deployment/version/worker/app/Admin/legacy certificates without current Wave1–4 fencing. Whole merge/rebase/blind cherry-pick is forbidden. Its source was exported into /tmp for inspection only; no native/mobile payload or unrelated code will be copied.

## Loaded current source and retained authority

Current stable Admin document.write loader fetches admin.html; current classic core loads admin-v2.2.0 → runtime-fix4/fix9 → select-fix5 and legacy repair helpers → canonical current UXv520. `NH7CurrentDocumentV508` supplies current draft/selected row/design/photo/logo/church and current rendering. Current fixes reconcile saved row images, preserve image children/QR bitmap, position photo/footer/QR and flatten output with bounded staging. Existing certificates public `certificate.html`, verify-document.html, verify-certificate.html, v239/v508 links, School public-verifier v127 and legacy tokens remain independent supported paths; no issued row/token repair or migration is authorized.

Current Wave3 Workspace recognizes certificates/documents tools in Documents group; authority is **nh7_admin_my_access_v350** plus current generation/token checks, not legacy nh7_admin_is_admin_v170/client email. Current issued School reports/PDF/Print and their native fallback are protected. Legacy editable designs/issued-row update/delete/delivery paths are retained, not used as V2 lifecycle authority.

Old Studio has useful mm model/editor/templates/renderer/raster-PDF/local QR, but it calls old generic Admin proof, exposes preview fallback owner, uses separate Admin token without current app/logout fencing, and lacks exact-JWT response fences throughout. ResizeObserver is created on every language build without disconnect; upload targets selected element after await rather than capturing it; pending saves/issue/records/output can outlive context changes. Archive checks UID after fetch but not exact JWT/logout and lacks same-tab owner events. Public page is one-shot and may retain a valid view after revocation. These boundaries must be rebuilt.

## Unique source/behavior disposition (exact classification vocabulary)

| Old file/group | Classification | Current finding / action |
|---|---|---|
|document-studio.html|PORT_BEHAVIOR_REBUILD_ON_CURRENT|New dedicated owner-authorized Studio, local-only until reviewed backend explicitly enabled; current Admin entry and legacy draft handoff|
|document-output.html|PORT_BEHAVIOR_REBUILD_ON_CURRENT|Dedicated top-level same-origin explicit user-tapped Print, persistent Back/PDF controls, guarded snapshot handoff|
|document-verify.html|PORT_BEHAVIOR_REBUILD_ON_CURRENT|New V2 tokens only; fresh no-store allowlisted status/snapshot with event-based revalidation, no old link rewrite|
|my-documents.html|PORT_BEHAVIOR_REBUILD_ON_CURRENT|Current UID/JWT/logout/event fences, filters/read-only issued viewer; retain legacy links|
|js/document-studio-v2/catalog.mjs + ui.mjs|PORT_BEHAVIOR_REBUILD_ON_CURRENT|15 types/8 templates/3 languages/presets/bundled font inventory useful; expand missing localized errors/AI/Library states|
|js/document-studio-v2/model.mjs|PORT_BEHAVIOR_REBUILD_ON_CURRENT|Canonical mm/schema2, geometry/history/identity stripping useful; strengthen strict assets/style/serialization/preflight/projection/revision safety|
|js/document-studio-v2/editor.mjs|PORT_BEHAVIOR_REBUILD_ON_CURRENT|Professional layer/drag/resize/inspector controls useful; rebuild authorization, all awaited context fences, bounded save/readiness and observer/upload lifecycle|
|js/document-studio-v2/renderer.mjs|PORT_BEHAVIOR_REBUILD_ON_CURRENT|One V2 renderer for all V2 surfaces; strengthen glyph/asset/capture readiness, overflow and QR/code parity|
|js/document-studio-v2/api.mjs|REJECT_UNSAFE_OR_OBSOLETE|No preview-owner fallback/old authorization. Rebuild exact UID+JWT owner boundary/current v350 proof and backend gating|
|js/document-studio-v2/admin-entry.mjs|PORT_BEHAVIOR_REBUILD_ON_CURRENT|Old entry depends on oldv522 workspace, no current proof. Use current Wave3 Documents metadata/tool capture and owner nonce/context handoff|
|js/document-studio-v2/archive-entry.mjs|PORT_BEHAVIOR_REBUILD_ON_CURRENT|Account route link can be additive, bounded singleton/event adapter; no old app.js replacement|
|js/document-studio-v2/archive.mjs + verification.mjs|REJECT_UNSAFE_OR_OBSOLETE|Rebuild transient clear/fenced readiness/output/current verification, safe public projection/statuses|
|js/document-studio-v2/output.mjs + output-page.mjs|PORT_BEHAVIOR_REBUILD_ON_CURRENT|Raster real PDF/A4 bytes and explicit Safari second gesture useful; add owner fences, late-capture cleanup and localized failures, no encryption/tamper-proof claim|
|css/document-studio-v2.css|PORT_BEHAVIOR_REBUILD_ON_CURRENT|Scoped new page styles/bundled fonts; improve narrow inspector/touch/focus and scale-to-fit without changing mm geometry|
|js/vendor/document-qrcode-1.5.4.js + LICENSE|PORT_BEHAVIOR_REBUILD_ON_CURRENT|Local npm qrcode1.5.4 bundle, MIT RyanDay license retained; encode only canonical V2 public token URL, decode test; no runtime CDN|
|nh7-document-renderer-v521.js + legacy core/runtime/select changes|REFERENCE_ONLY|Legacy v520 is current and protected; new modular renderer replaces V2 geometry only, no need old dependency chain injected into legacy files|
|nh7-admin-documents-workspace-v522.js/CSS|SUPERSEDED_BY_NEWER_DEVELOP|Current Wave3 workspace grouping/router/permission fences authoritative; no competing Documents workspace overlay|
|old nh7-document-ux-v520 JS/CSS + certificate.html changes|REFERENCE_ONLY|Current versions/legacy compatibility retained exactly; selected behavior represented in new V2 path, not replayed into legacy issued path|
|old admin.html/stable/cover-test wiring|SUPERSEDED_BY_NEWER_DEVELOP|Keep current Wave3/4 wiring; additive new module only, old search/print/AI/push modules never replaced|
|old index.html/app wiring|SUPERSEDED_BY_NEWER_DEVELOP|Current app/Profile/Community/Audio/Notes and notification intent modules retained; additive archive entry only|
|old service-worker.js/sw-release/version.json/deploy-pages.yml|REJECT_UNSAFE_OR_OBSOLETE|No release/main/deployment/version bump; only current executable cache wiring if necessary, stable user/download cache staysv329|
|old validate-document-studio-v2.yml|REFERENCE_ONLY|No second workflow; extend existing Validate Develop with required syntax/source/SQL/browser guards|
|old scripts/document-studio-v2/database.cjs|PORT_BEHAVIOR_REBUILD_ON_CURRENT|Useful isolated PGlite harness if reproducible; use current owner boundary, exact new review SQL, no remote DB. Not Production schema proof|
|old Studio model/browser/wiring tests|PORT_BEHAVIOR_REBUILD_ON_CURRENT|Keep useful assertions but expand full combinations/current authority/negative races/output/memory/performance, no old CI replacement|
|old legacy document-v520/community/admin-live-search tests modifications|REFERENCE_ONLY|Current regression assertions unchanged; new separate parity/scope guard; no weakening legacy checks|
|old entrypoint-v521/release-refresh/document-v521 tests|REFERENCE_ONLY|Old legacy dependency absent current core; new V2 entrypoint/worker scope guards instead|
|old V2 SQL/disable.sql|PORT_BEHAVIOR_REBUILD_ON_CURRENT|Additive draft/template/immutable snapshot/number/token/delivery concepts useful; rebuild owner/created-by/fresh UID, optimistic saves and server-prepared confirmed issue; remove hard-delete draft contract; bounded list; strict public projection and reviewed Library boundary|
|old report/QA/backend docs + mobile parity JSON|REFERENCE_ONLY|Historical evidence only; regenerate exact Wave5 measurements/convergence from current source, no mobile/deployment claim|

## Canonical future architecture / review-only prerequisites

New schema2 mm model → modular editor/history → bounded owner-fenced local recovery/optimistic reviewed save → preflight plus server-authoritative prepared number/token/student identity → canonical confirmation render → explicit immutable idempotent Issue → fresh verification + UID archive. Revision gets new draft/document identity with parent; old issued snapshot never overwritten. Manual recipient has no invented UID. Required layers/rotated bounds/quiet zone/text/font/image checks precede confirmation. All languages remain independent. Uploaded file is decoded locally with captured context, bounded size and object URL cleanup; arbitrary remote URL image fetch prohibited.

One new renderer/CSS handles editor, confirmation, MyDocuments, V2 public, top-level Print and raster PDF. Preview fit is visual only. Published verification status is fresh network-only; public projection excludes private UIDs/email/hidden metadata/hidden language content. Legacy rendering remains supported on original routes, not silently converted. Bundled fonts/license retained; html2canvas1.4.1 already exists locally with integrity manifest. Real PDF is flattened image/A4, not cryptographic protection.

Missing live contracts: authenticated owner drafts/templates/recipient directory, optimistic save; prepared immutable issuance/current canonical student code+existing School eligibility; stable number/token/request identity; non-destructive revoke/revision, current UID archive, public allowlist/status and approved resource-only Library publication. All candidate SQL/source/disable/preflight lives ONLY in `supabase/review/wave5-document-studio-v2/`. No migrations/current functions/business tables updated or deployed. Owner helper must reuse current privatev350 owner proof; insufficient delegates remain denied. Existing Library admin contract/access remains canonical; personal certificates cannot be published into general Library. AI reuse current server boundary manual-only; no private recipient upload, auto-translation or auto-issue.

## Evidence plan and safety

Full type/template/language/orientation model matrix, real editor/output geometry/QR decode/PDF files, isolated reviewed SQL authority/idempotency/revoke/archive/account-deletion tests when harness available; A→B/save/upload/issue/output races; widths390/430/768/820/1024/1280/1440, FA RTL/ENHR LTR, focus/Back/fit; autosave burst, image/capture failure/cleanup and visible/hidden idle counters. Retain all Wave1–4/legacy School/report/certificate regression gates. No native physical claim, no real recipient/send/upload/data mutation; provider/Storage/live constraints/manual WKWebView/Safari remain later acceptance.

Checkpoint **42/42 exact**,0 missing,1 pre-existing pending `20261012123000_audio_bible_public_catalog_read_v511.sql`; no new migration. No old branch deletion or PR change. This audit is committed before implementation. Final convergence report will enumerate every unique old-branch path and final disposition.
