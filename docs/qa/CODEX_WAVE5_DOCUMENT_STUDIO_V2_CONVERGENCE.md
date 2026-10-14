# Codex Wave 5 — Document Studio V2 Convergence, Authoring, Publication and Verification

## Mission

Work only in `Omideno7/new-hope7-app` on the existing `develop` branch.

Accepted development baselines before this task:

- Wave 1 — performance/cost controls
- Wave 2 — owner-isolated local-first/offline reconciliation
- Wave 3 — Product Completion audit, Birthday E2E and Admin Workspace Core
- Wave 4 — Notifications 2.0 source/fixture contracts
- Wave 4 accepted runtime head before this task: `498d0650c3c1b4d0fe97fce16564498de2ffc620`
- `main` must remain unchanged at `15af811f78a17a0881c13171311e7ade6bc390f4`

Wave 5 must make **Document Studio V2 the reviewed canonical future document-authoring path on `develop`**, while preserving all existing issued documents, certificates, legacy public links and current user data.

This is **not a release wave** and **not a Production/backend activation wave**. Implement and validate the complete source/fixture path, create review-only backend contracts when needed, and stop before deployment/apply/release.

The old branch `codex/document-studio-regression-qa` is a **reference source only**. It currently diverges from `develop`; do not merge, rebase, cherry-pick blindly, or replace current Wave 1–4 runtime with old branch bytes. Audit and selectively port/rebuild only behavior that is still required and safe on current `develop`.

---

## Absolute branch / safety rules

1. Read first:
   - `AGENTS.md`
   - `docs/DEVELOPMENT_WORKFLOW.md`
   - `docs/qa/PRODUCT_COMPLETION_MASTER_AUDIT.md`
   - `docs/qa/WAVE3_PRODUCT_ADMIN_REPORT.md`
   - `docs/qa/WAVE4_NOTIFICATIONS_REPORT.md`
   - this file
2. Fetch and fast-forward to current `origin/develop` before editing. Do not reset away accepted concurrent work.
3. Work directly on the existing `develop` branch.
4. **Do not create a branch, PR, feature branch, backup branch, test branch or Codex branch.**
5. **Do not modify, merge, rebase, force-push or otherwise touch `main`.**
6. Do not deploy Web/PWA, Supabase, Edge Functions, App Store, Google Play or any Production service.
7. Do not apply migrations or execute review SQL against Production.
8. Do not mutate/backfill/delete Production data.
9. Do not delete or rewrite existing issued certificates/documents, old public verification tokens, School records, Notes, progress, saved verses, downloads, audio state, community data, registration data or Wave 2 queues/conflicts.
10. Preserve Wave 1 performance controls, Wave 2 account isolation, Wave 3 Admin authority/fencing and Wave 4 notification contracts.
11. Do not use hardcoded admin email/password/client allowlists as authority.
12. Do not expose service-role secrets or private recipient fields in public verification payloads.
13. Any missing schema/RLS/RPC contract must be **review-only** under `supabase/review/wave5-document-studio-v2/` unless an existing approved review-only implementation can be safely adapted. Do not add/apply a migration.
14. Existing issued-document rendering and verification routes remain supported. No destructive legacy cleanup in Wave 5.

---

# Phase 0 — exact baseline and convergence audit BEFORE implementation

Before changing runtime code, create and commit:

`docs/qa/WAVE5_DOCUMENT_STUDIO_CONVERGENCE_AUDIT.md`

The audit must compare current `develop` against:

- `codex/document-studio-regression-qa`
- current active Document/Certificate paths on `develop`
- any relevant Draft/PR #240 historical source that is locally/repository-accessible

For every unique old-branch file/behavior classify it as exactly one of:

- `ALREADY_CURRENT`
- `SUPERSEDED_BY_NEWER_DEVELOP`
- `PORT_BEHAVIOR_REBUILD_ON_CURRENT`
- `REFERENCE_ONLY`
- `REJECT_UNSAFE_OR_OBSOLETE`

Do **not** infer that a file being absent means the feature is absent; trace actual loaded entrypoints and contracts.

The audit must explicitly cover:

- `document-studio.html`
- `document-output.html`
- `document-verify.html`
- `my-documents.html`
- `js/document-studio-v2/*`
- `css/document-studio-v2.css`
- current `nh7-document-*` modules
- current Admin Documents tools and Wave 3 workspace grouping
- legacy certificate/verification routes
- public verification
- PDF/Print paths
- QR dependency/license
- service worker/cache implications
- backend review SQL from the old branch
- legacy repair overlay chain
- existing issued-row compatibility

Record the exact old branch head, current `develop` head, merge base and why a whole-branch merge is forbidden.

Commit this audit **before** implementation.

---

# Phase 1 — canonical Document Studio V2 architecture

Build one coherent, modular path rather than another overlay chain.

Required conceptual modules may be adapted from the old branch, but must be reconciled with current Wave 1–4 code:

- model/schema
- editor
- renderer
- UI/controller
- catalog/templates/presets
- API boundary
- output/PDF/print
- verification/public page
- My Documents/archive
- Admin entry/workspace integration

Use **one canonical document model** and **one canonical renderer** for:

1. Studio editor preview
2. final confirmation preview
3. user My Documents viewer
4. public verification view
5. print view
6. generated PDF

No separate geometry/rendering implementations for these surfaces.

Use versioned schema, e.g. `design_schema_version: 2`, with deterministic serialization.

Coordinates/page geometry must be canonical physical units (prefer mm for A4) rather than viewport pixels. Zoom/fit is presentation only and must not mutate document geometry.

---

# Phase 2 — supported document lifecycle and data-safety model

Implement/validate this lifecycle at source/fixture level:

`New Draft → Edit → Autosave/Explicit Save → Preflight → Preview → Confirm → Publish/Issue → Verify/Archive`

After publish/issue:

- the published snapshot is immutable;
- "edit after publish" means **Create Revision / Duplicate as New Draft**, not silently mutate the historical public record;
- the new revision must have a new revision/document identity while retaining an explicit parent/reference relationship;
- previous valid/revoked historical record remains auditable;
- revoke does not hard-delete history;
- account deletion must not be blocked by a fragile FK design;
- no new document may overwrite an older issued row because number/title/recipient happens to match.

Autosave must be bounded/debounced and owner/admin-session fenced. Switching document/recipient/account must not allow a delayed save/upload to overwrite the new context.

Unsaved work recovery must not leak across accounts.

---

# Phase 3 — document types, templates and presets

At minimum support the reviewed set from the old V2 reference unless the convergence audit proves a safer current equivalent:

Document/certificate types:

- Water Baptism
- Course Completion
- Foundation School
- Ministry Training
- Participation
- Membership
- Active Membership
- Ministry Service
- Volunteer
- Conference
- Leadership
- Graduation
- Official Church Letter
- Custom Certificate
- Custom Official Document

Templates/themes at minimum:

- New Hope Classic
- New Hope Emerald
- Royal Blue
- Elegant Gold
- Minimal Modern
- Dark Prestige
- Celebration
- Clean Official

Support A4 portrait and landscape.

Templates must not contain recipient identity, UID, email, student ID, issue token or issue number when saved/reused.

Presets must be explicit and reusable. Loading a preset must never overwrite text in another language silently.

---

# Phase 4 — FA / EN / HR canonical content model

Document Studio must support independent editable content for:

- Persian (`fa`, RTL)
- English (`en`, LTR)
- Croatian (`hr`, LTR)

Rules:

1. Switching language tabs changes the active language representation only.
2. Existing content in other languages is preserved byte-for-byte unless the operator explicitly edits/replaces it.
3. Never auto-translate on tab switch.
4. If AI translation/drafting is offered, it is **draft-only** and must require human review/acceptance before it can replace any field.
5. AI must never automatically publish/issue/revoke a document.
6. The final selected document language controls printed labels, direction and typography.
7. Persian fields must use appropriate RTL behavior without forcing RTL onto English/Croatian input.

Use legally bundled fonts already in the repository where possible. Do not introduce runtime CDN fonts. Verify Arabic/Persian glyph readiness before capture/PDF.

---

# Phase 5 — editor requirements

Provide a usable professional editor, not merely JSON fields.

Required element classes where relevant:

- title
- subtitle
- recipient name
- body/custom text
- document/certificate number
- Student ID / canonical student code when authorized
- date
- church name
- church contact/footer
- recipient photo
- logo
- QR
- verification code/text
- signature
- signer name/role
- seal
- watermark
- line
- frame
- shape
- page/background element
- footer

Required editor behavior:

- select element
- name/label layers
- show/hide
- lock/unlock
- reorder layers
- bring forward/send backward
- duplicate optional elements
- delete optional elements
- required elements cannot be accidentally deleted
- reset to template
- drag
- resize
- exact numeric coordinates/sizes
- arrow-key movement; Shift for larger step
- align controls
- grid/center snapping
- undo/redo
- zoom/fit
- fullscreen/editor focus mode if current app architecture supports it safely
- inspector panel

Text controls:

- font family
- size
- weight
- italic
- underline
- color
- alignment
- line-height
- letter/character spacing where safe
- padding/bounds

Image controls:

- contain/crop
- focal position
- zoom
- opacity
- border/radius
- deterministic renderer parity

Page controls:

- orientation
- palette
- background/gradient where supported
- frame
- shadow where renderer parity is guaranteed

All uploaded images/assets must stay bound to the document and user/admin session that initiated the upload. Delayed completion after switching recipient/document must be rejected/fenced.

Do not create an unsafe general-purpose remote URL fetcher for images.

---

# Phase 6 — preflight and issue/publish safety

Before Publish/Issue, perform deterministic preflight checks for at least:

- required fields present
- required elements visible
- recipient identity consistency
- canonical Student ID only from existing server-authoritative identity when applicable
- valid A4 bounds including rotated elements
- QR fits inside page and has quiet zone
- text overflow/clipping
- image readiness
- font readiness
- capture readiness
- missing signer/church identity when required by template
- valid document language
- valid orientation
- no private email/UID accidentally rendered in public content unless explicitly intended and approved by policy

Publish/Issue must require an explicit confirmation step after preflight.

Double-click / repeated confirmation / refresh must be idempotent. No duplicate issue number or duplicate public record for the same issuance request.

Number reservation must be stable and server-authoritative in the review contract; do not trust browser counters.

---

# Phase 7 — PDF / Print / Share output

Output must be based on the same canonical renderer.

Required source/fixture behavior:

- true A4 portrait/landscape dimensions
- fresh output generated from the confirmed immutable snapshot
- no viewport scale baked into geometry
- correct FA/EN/HR glyph rendering
- images/QR ready before capture
- bounded timeout on capture/readiness
- unconditional cleanup in `finally`
- failure must restore usable UI and allow retry
- Blob/File created only from the current owner/admin context
- print uses a dedicated top-level same-origin page or equally reliable current architecture
- explicit Print action invokes print synchronously from user gesture where browser requires it
- Safari/iOS fallback instructions/control for Share / Save to Files / Print
- no claim that raster PDF is cryptographically tamper-proof or encrypted

If the current repo already has a safer native file/share bridge, use it only after tracing it; do not invent a fake native API.

---

# Phase 8 — QR and public verification

QR must encode only the canonical public verification URL/token.

Use a locally bundled QR implementation with proper license retained. No runtime CDN.

Public verification states:

- VALID
- REVOKED
- EXPIRED (if expiry is supported by policy/type)
- NOT FOUND / INVALID
- SERVICE ERROR (localized, without leaking internals)

Public responses must be an explicit allow-list. Never expose:

- recipient email
- private Auth UID
- Admin UID
- service credentials
- private notes
- School submissions/exam data
- hidden template metadata
- internal storage paths that bypass access control

For valid public documents, expose only fields intended to appear publicly on the issued document, e.g. public recipient name, optional visible student code, issue number/code/date, church identity, public document snapshot.

Revoked/expired verification must not continue rendering an old "valid" badge/page from cache.

Old verification links/tokens from existing production document systems must remain functional and untouched.

---

# Phase 9 — My Documents / user archive

Add/reconcile a signed-in user-facing **My Documents** archive using current authenticated UID only.

Requirements:

- current UID is the authority; email alone is never sufficient authorization;
- account switch/logout clears visible archive data immediately and fences delayed responses;
- recipient A data can never be shown after switching to B;
- filters for type/status/date/number where useful;
- preview
- PDF
- verify
- share
- revoked state visible
- revision relationship visible where useful
- no editing of issued snapshot by ordinary user
- no cross-user enumeration

Manual/non-account recipients may have a public document but must not be invented as a UID archive member.

---

# Phase 10 — Admin Workspace integration

Integrate Document Studio cleanly into the existing Wave 3 Admin Workspace.

Rules:

- reuse current `nh7_admin_my_access_v350()` / current server-authorized Admin authority;
- do not create a parallel permission model;
- do not hardcode owner email;
- ordinary users and unauthorized delegates see no issue/manage actions;
- if delegated document permissions do not currently exist, do not fabricate grants—keep owner-only or current proven permission boundary and document the gap;
- current existing certificate/document tools remain reachable until V2 compatibility is proven;
- no deletion of legacy Admin document overlays in this Wave;
- navigation/back/history must remain responsive and keyboard usable;
- preserve Wave 3 search/navigation grouping.

---

# Phase 11 — Library publication boundary

The user ultimately needs documents/books/materials to be dynamically published without an app-store release. For Wave 5, support only the safe Document Studio publication boundary that can be proven from current Library contracts.

If a generated official document is meant for **My Documents**, do not incorrectly publish it to the general Library.

If the Studio also supports creating a reusable public church document/resource intended for Library publication:

- use the current Library Admin contract;
- Draft and Publish are separate states;
- Publish must be explicit;
- publication must preserve FA/EN/HR metadata/content correctly;
- editing after publish creates a reviewed new revision/version rather than silently replacing a public historical artifact when history matters;
- do not bypass current Library authorization/security/freshness logic;
- do not make dynamic Library visibility fixes by hardcoding bundled JSON.

If current Library backend write contracts are insufficient, document review-only requirements instead of inventing client authority. Do not deploy them in Wave 5.

---

# Phase 12 — AI assistance boundary

If existing Admin AI is integrated into Document Studio, it may assist with:

- title/body drafting
- formal wording variants
- FA/EN/HR translation drafts
- grammar/style suggestions

But:

- it must never issue/publish automatically;
- it must never change another language silently;
- operator must preview and explicitly accept AI output;
- rejected output must leave original text intact;
- recipient private data should not be sent unnecessarily;
- no new third-party secret in client code;
- reuse current server-side AI boundary if present and authorized.

---

# Phase 13 — backend review-only contracts

First audit any existing old-branch review SQL and current contracts. Reuse/adapt concepts only if safe.

If still required, place all new candidate files under:

`supabase/review/wave5-document-studio-v2/`

Review-only backend design must cover, as needed:

- admin-authorized drafts
- optimistic revision/save
- document/template definitions
- immutable issuance/public snapshot
- server-authoritative number reservation
- verification token/status
- revocation
- revision relationship
- UID archive delivery/linkage
- public allow-listed verification projection
- RLS for Admin and recipient
- account deletion compatibility
- idempotent issuance

It must not alter existing School/Auth/Notes/Community/Audio tables as a shortcut.

No migration file in `supabase/migrations` and no apply/deploy.

Provide:

- preflight/checklist
- candidate SQL/source
- disable/rollback review source
- exact prerequisites
- data-safety explanation

---

# Phase 14 — legacy compatibility and branch convergence proof

Wave 5 must end with a machine-readable or Markdown convergence matrix proving the disposition of the old `codex/document-studio-regression-qa` unique work.

Create:

`docs/qa/WAVE5_DOCUMENT_STUDIO_BRANCH_CONVERGENCE.md`

For every meaningful old-branch unique feature/file group state:

- present in current develop now
- intentionally superseded
- intentionally retained only on legacy path
- rejected with reason
- deferred with exact gate

Do not delete the old branch in Wave 5.

Do not delete legacy files merely because V2 tests pass. Legacy deprecation belongs to a separately approved cleanup after physical and live compatibility acceptance.

---

# Phase 15 — responsive, accessibility and device-oriented source QA

Automated browser/source QA must cover at least widths around:

- 390 phone
- 430 large phone/Fold narrow pane
- 768/820 tablet
- 1024 tablet/desktop split
- 1280/1440 desktop

Cover FA RTL, EN LTR, HR LTR.

Validate:

- no horizontal overflow of essential controls
- touch targets
- keyboard navigation
- visible focus
- modal focus trap/restore where applicable
- Escape/back behavior
- editor zoom/fit
- inspector collapse on narrow screens
- safe handling of orientation changes in layout calculations
- no mutation of canonical mm geometry from responsive layout
- reduced motion where animation exists

Do not claim physical WKWebView/Safari/native print acceptance; that belongs to later physical QA.

---

# Phase 16 — performance / memory / network constraints

Document Studio must not regress the app into high-frequency polling or background work.

Measure and report source/fixture/browser counters for:

- Admin idle before/after
- Studio open idle
- autosave burst during repeated edits
- image upload/cancel/retry fixture
- preview generation
- PDF generation fixture
- My Documents idle
- account switch

Requirements:

- no recurring network polling introduced solely by Studio;
- autosave is debounced/bounded;
- repeated rapid edits collapse into bounded persistence writes;
- no duplicate event listeners/observers on repeated Studio open/close;
- object URLs/offscreen capture DOM are cleaned up;
- no unbounded image/base64 retention across document changes;
- background/hidden tab does not continue expensive preview/PDF loops;
- Wave 1 and Wave 2 request/persistence invariants remain protected.

Report measurements honestly as fixture/browser measurements, not physical battery/thermal claims.

---

# Phase 17 — required automated tests

Add/retain comprehensive tests. At minimum cover:

## Model / lifecycle

- all required type/template/language/orientation combinations
- deterministic serialization
- create/save/reopen
- autosave debounce
- stale save fencing
- duplicate/new draft identity stripping
- revision from issued snapshot
- issue idempotency
- revoke
- public status
- account deletion compatibility in review DB fixture if database harness exists

## Editor

- drag/resize/numeric edit parity
- layer ordering
- lock/hide/required-element restrictions
- undo/redo
- snapping
- image crop parity
- language switching without overwrite
- template switching behavior

## Output

- preview/editor/public/PDF/print geometry parity
- portrait/landscape
- FA/EN/HR
- QR payload and decode
- image/font readiness
- failed/hung asset timeout and cleanup
- repeated PDF/Print without leaked busy/offscreen state

## Security

- anonymous Admin denied
- normal signed-in user cannot issue
- wrong UID archive denied
- A→B account switch fences archive responses
- public verification cannot expose email/private UID
- forged Student ID/client counter ignored
- arbitrary public token rejected
- stale Admin token response fenced

## Compatibility

- existing certificate verification tests stay green
- existing School reports/Print/PDF stay green
- existing legacy document/certificate routes stay green
- Wave 1–4 regressions all stay green
- migration parity remains exact with only the pre-existing pending migration unless separately explained; Wave 5 adds no migration

## Code quality

- JS/MJS/CJS syntax
- HTML/JSON validation
- `git diff --check`
- exact changed-file scope guard

---

# Phase 18 — CI requirements

Update existing `Validate Develop` only as necessary; do not create a deployment workflow.

Final acceptance requires a green CI run on the **exact final `develop` SHA**.

Do not weaken, skip, delete or rename away prior Wave 1–4 gates to obtain green CI.

If a CI environment issue occurs, diagnose it and preserve equivalent or stronger validation. Document any CI-only compatibility fix separately.

---

# Required documentation / evidence

Create/update at minimum:

- `docs/qa/WAVE5_DOCUMENT_STUDIO_CONVERGENCE_AUDIT.md`
- `docs/qa/WAVE5_DOCUMENT_STUDIO_REPORT.md`
- `docs/qa/WAVE5_DOCUMENT_STUDIO_MEASUREMENTS.json`
- `docs/qa/WAVE5_DOCUMENT_STUDIO_BRANCH_CONVERGENCE.md`
- review-only backend README/files if needed

The final report must distinguish clearly among:

- COMPLETE-CODE / source-fixture complete
- backend review-only
- live integration unproven
- physical device/manual QA unproven
- deferred legacy cleanup

Never describe fixture SQL/Chromium output as Production security or physical-device acceptance.

---

# Final deliverable / response format

When finished, push all valid Wave 5 work to the existing `develop` branch and return:

1. exact starting `develop` SHA
2. audit commit SHA
3. each implementation/follow-up commit SHA
4. exact final `develop` SHA
5. unchanged `main` SHA
6. complete changed-file count and diff statistics
7. exact audit/report/measurements/convergence paths
8. exact successful CI run URL and proof its `head_sha` equals final `develop`
9. status matrix for every required document type/template/language/orientation family
10. editor feature status
11. Draft/Save/Preflight/Preview/Publish/Revision/Revoke status
12. PDF/Print/Share status
13. QR/Public Verification status
14. My Documents A/B owner-isolation status
15. Admin authorization status
16. Library-publication boundary status
17. AI-assistance/manual-approval status
18. old branch convergence disposition
19. review-only backend files and exact activation prerequisites, if any
20. migration parity status
21. performance/request/autosave measurements
22. complete remaining live/physical/manual limitations

Stop after Wave 5.

**Do not start Wave 6 automatically.**
