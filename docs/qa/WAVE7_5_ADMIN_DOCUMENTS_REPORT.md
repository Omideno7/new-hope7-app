# Wave 7.5 Admin completion / document issuance readiness report

2026-10-16, Europe/Zagreb. Existing develop only; accepted start `3e209b646eac811d47a735408365c06a01c5b7de`. Pre-implementation audit commit **`8566e4b55486a226b6e0c6cd39a567eef98842e9`** preceded runtime/backend-source implementation. Main remains **`15af811f78a17a0881c13171311e7ade6bc390f4`**. No branch/PR, merge, deployment, real issuance, Production SQL/Auth/data operation or provider/paid activation. Stop after7.5; Wave8 is not started.

Source/fixtures are complete for the scoped changes. **Real Production issuance remains BLOCKED_ACTIVATION**, not falsely “issued successfully.” No backend flag is enabled. After every mandatory live-equivalent staging/security/rollback/output gate and later explicit activation/controlled-first-issue approval, the core flow is ready for a first real document. It has no dependency on rejected listening analytics, optional Library publication, AI or notifications. Flipping a flag by itself is insufficient.

## Admin

| Area | Disposition / evidence |
| --- | --- |
| Existing architecture / Web Admin | ALREADY_COMPLETE; current admin.html and stable loader retained, no second architecture. |
| App Workspace visibility | ALREADY_COMPLETE; current signed JWT→`nh7_admin_my_access_v350`; no role cache/hardcoded email final authority. Normal/anon entry absent. |
| Direct URLs / data | ALREADY_COMPLETE; current v350 server owner/delegate checks, unauthorized normal/anon receive no privileged data. Hiding a button is not authorization. Direct Studio additionally requires current server-proven owner. |
| Delegation | ALREADY_COMPLETE; existing server-granted sections only. Registration-only fixture remains registration-only; no new delegated document permission. |
| Credential fencing | ALREADY_COMPLETE; A→B/logout/token/epoch and delayed responses cannot restore privileged UI. Current Wave3 and new delayed recipient tests retained. |
| Organization | Eleven existing groups retained: Overview; Requests; Users/Students; School; Content; Messaging/Notifications; Library; Storage; Reports/Analytics; Documents; Settings/Administration. No useful tool removed. |
| Listening presentation | READY_FOR_ACTIVATION_REVIEW source; FA/EN/HR intentional-disabled notice and no stale audio filter/drill reads; actual School/non-listening reports remain. No listening telemetry activated. |

## Document workflow / feature matrix

| Capability | Status |
| --- | --- |
| Create→type/template→recipient→edit→reopen | ALREADY_COMPLETE + bounded recipient-search refinement; owner-approved existing context/photo/logo/design/positions restored; fresh document resets identity.209 synthetic accounts prove pagination/search beyond first200. Explicit Search/Next only; typing filters current rows locally. Server re-resolves selected account, never trusts a supplied email/UID for archive ownership. |
| Authoring | Existing physical-mm canvas,15 types,8 templates,FA/EN/HR/RTL/LTR,A4 portrait/landscape, recipient/photo/logo/signature/seal/background/editable text/layers/z-order/alignment/size/colors/fonts/history preserved. No wholesale old-branch copy or renderer replacement. |
| Preview / validation | Existing canonical renderer/asset/text overflow/preflight retained; editable local source not mistaken for an issued record. |
| Prepare | SOURCE_COMPLETE_BACKEND_INACTIVE; exact saved revision/request, canonical recipient/number/random token, client compares returned prepared snapshot to current public projection. Prepare alone creates no official document. |
| Explicit final confirmation | SOURCE_COMPLETE_BACKEND_INACTIVE; real final preview/ready check, dedicated tap required. Cancel/Escape invalidate confirmation; direct issueConfirm without a prepared open dialog rejected. No automatic issue. |
| Authoritative issue receipt | READY_FOR_ACTIVATION_REVIEW; contract75/id/draft/request/status/token/number/time/recipient/delivery/full canonical snapshot checked. HTTP200/empty/malformed/wrong receipt never marks local issued or claims success. Error/finally unlocks editor. Unknown result retries exact existing request, not a new draft. |
| Duplicate issue / concurrency | Synthetic repeated/same-request promise tests give one official row+delivery+issue event; mismatch rejected even on retry; row lock and unique original constraints reused. Separate-connections live-equivalent acceptance still BLOCKED_ACTIVATION. |
| Revision / immutable history | New draft/version/parent/token, all prior issued definition/number/identity/token/parent fields immutable; no deletes/overwrites. Explicit revoke permanent; explicit expiry only shortens, records audit history. |
| Revoke / expire | Explicit owner/server-gated RPCs + confirm/cancel UI; expired and revoked minimal proof; original definition unchanged. No cron/job needed for expiry, status evaluated on read. |
| Recipient My Documents | SOURCE_COMPLETE_BACKEND_INACTIVE; successful issue atomically delivers to the trusted selected recipient; archive requires current auth.uid matching both record and delivery. No UID/email argument. Wrong user gets zero, logout/account switch clears/fences private UI/output. Manual non-account recipient gets no invented account archive. |
| QR / public proof | QR only random verification-token URL; actual decoded QR asserts token-only query, no email/UID/Admin/private body/credential/Storage URL. New V2 public response/UI only number/status (optional generic Library resource marker). Even an unsolicited old full response is ignored. No public full-body/PDF/Print bypass. |
| PDF / Print / Share | Existing authorized canonical renderer and real flattened `%PDF-` output retained; six actual browser PDFs with A4 geometry/QR/brand coordinates, explicit top-level Print/Close/Refresh/PDF and fallback tests; Share/Save fallback retained. No new library or CDN. Physical Safari/native sheets/fonts remain PHYSICAL_QA_ONLY. Flattened PDF is not cryptographic DRM; no such claim. |
| Legacy / School certificates | ALREADY_COMPLETE; old certificate.html links, issued data, eligibility and School reports/Print/PDF/CSV unchanged. No migration/conversion/backfill. Existing approved Foundation certificate remains required; no progression bypass. |
| Optional Library / AI | SOURCE_COMPLETE_BACKEND_INACTIVE; current Wave5 separated publication boundary and manual AI approval retained. Core package excludes optional Library by default; no policy/provider/Edge deployment. Neither blocks issuance. |

The15type×8template×3language×2orientation source/model and render matrices remain720; browser output fixtures cover representative actual PDF/Print/asset combinations and21locale text/symbol variants, not720 physical prints. Supported types/templates remain exactly the Wave5 catalog; no removal/downgrade.

## Review-only activation package

All new SQL is confined to `supabase/review/wave7_5-admin-documents/`; **zero ordinary migrations**. Exact Wave5 `candidate.sql` and optional `library-boundary.sql` remain byte-identical and SHA-pinned. `assemble.py` generates an offline one-transaction artifact outside migrations; it never connects/executes. Default core excludes optional Library. Full file inventory:

- `README.md`: contracts/security/storage/authority and source-only limitations.
- `preflight-readonly.sql`: exact owner/function/column/constraints/trigger/RLS/ACL/default-ACL/Storage metadata queries, not run live.
- `document-backend-proposal.sql`: owner+server false-default gate; capability75; exact original issue/verify/list body reuse; exact confirmed retry; atomic delivery; immutable trigger; expiry/status audit; minimal verification; bounded keyset account search.
- `rls-acl-proposal.sql`: explicit signatures/grantees, private/table/sequence denials. No wildcard GRANT/generic bypass/client secret.
- `activation-checklist.md`: A1–A9 operator/evidence/approval sequence and controlled first document.
- `rollback.sql`: disable gate + exact mutation revokes; preserves all historical records and private archives/minimal proof.
- `baseline-sha256.json`, `assemble.py`: exact reuse/atomic assembly, output/overwrite/path guards, no incompatible competing schema.

Core requires zero new Storage buckets/objects/policies: bounded inline validated images/local assets live in already authorized document definitions. Required issuance tables/delivery/status events are document functionality, **not audio analytics**. Optional remote public-asset aliases need exact ownership/policy review; optional Library path remains `documents/studio-v2/<current UID>/<version>.pdf`, no overwrite. No private URL belongs in QR/public proof.

## Exact blockers and rollback

| Gate | State / remaining evidence |
| --- | --- |
| A1 | BLOCKED_ACTIVATION: exact fresh live private owner350 signature/body fingerprint/owner/search_path/ACL/nested dependencies. No guessed workaround. |
| A2 | BLOCKED_ACTIVATION: exact live School columns/approved Foundation compatibility; V2 naming collisions/objects/FKs/default ACL/owners/legacy behavior. Supplied Wave6.6 metadata does not prove this new package. |
| A3 | READY_FOR_ACTIVATION_REVIEW: SHA-pinned atomic artifact, explicit permissions, gate false and tests. Requires human review/approved artifact hash. |
| A4 | BLOCKED_ACTIVATION: disposable real PostgreSQL/Supabase roles, two concurrent connections, competing prepare/issue/revision, atomic failure and direct/RLS/helper/forged-client negatives. Serial PGlite is not proof. |
| A5 | PHYSICAL_QA_ONLY core output/fonts/printing/sharing on actual devices; optional remote asset/Library Storage evidence BLOCKED_ACTIVATION separately. No need to activate optional services for core. |
| A6 | BLOCKED_ACTIVATION: live-equivalent rollback rehearsal. Synthetic disable preserves exact historical definitions/numbers/tokens/parents/deliveries/events, verifier/archive readable, mutations denied. |
| A7 | BLOCKED_ACTIVATION: explicit later Production approval/operator/window/exact source+artifact hash. This Wave forbids activation. |
| A8 | BLOCKED_ACTIVATION: later separately approved server enable and matching shared-client flag release on all V2 pages; current false/absent flag fails closed. Strict registration/Full Delete/Library/AI remain off. |
| A9 | BLOCKED_ACTIVATION: separately approved controlled first real recipient/issue with exact final receipt/archive/PDF/QR verification evidence. No Production document issued now. |

Rollback after separate approval: stop new-issue entry (retain the already-proven backend-ready read configuration), execute reviewed disable/revoke transaction, verify capabilities false/direct mutation rejection, retain minimal verification and current-UID archives. Do not drop tables/triggers or delete/replace any history, restore old full-public verifier, grant broadly, clear caches or rewrite legacy data. Re-enable only after new approval with exact reviewed grants and rehearsal. Exact order/source is in the checklist and rollback.sql.

## Validation, measurements and evidence discipline

New `verify-wave75-documents.cjs`: disposable SQL owner/delegate/normal/anon/direct table/contract/default-off, assembled core twice without Storage,209directory pagination/literal query, prepared no-issue, exact idempotency, strict receipt negatives, atomic delivery failure+retry, immutable revision/revoke/expire, wrong-user archive and non-destructive rollback. New `verify-wave75-browser.cjs`: actual editor/receipt failure/unlock, cancel/explicit confirm, same-request retry, account directory manual paging, wrong backend denied, delayed switched-account reply, public privacy and trilingual Workspace/zero audio filter read.

All current Wave1–7 workflow gates are retained, plus new Wave7.5 stages, syntax for each changed JS/module, migration parity and diff check. Frozen-source adapters now permit only the exact independently checked75delta: all prior audio/auth/School/Notes/Library/Profile/account/data/current backend and older review source stays byte-exact. No prior safety assertion is simply skipped.

Fixture corrections are intentional stronger contracts: old empty/mismatched retry “success” now rejects while exact replay succeeds; recipient archive now populated atomically; expiry uses the authorized RPC instead of a raw update; V2 public full-body expectation becomes minimum proof, while all real renderer/QR/brand/pixel/PDF assertions run on authorized recipient preview. Wave6.6 historical caller line offsets moved after the additive Admin script tag; exact historical line checked through hash-bound accepted bytes **and the caller name must still exist in current source**. Metadata/fingerprints/dispositions are unchanged.

`WAVE7_5_MEASUREMENTS.json` records actual local before/after startup,60s visible/hidden/Admin/editor/audio intervals, preview/output/PDF, eight pause/resumes, route/account/logout, owner resume60 and account fencing, raw request names and source hashes. Existing required progress/manual non-listening requests are retained and explicitly counted. Additional listening analytics reads/writes/rows/storage are all0. No polling/refresh loop/subscription/provider is added. Existing bounded user-triggered searches/outputs reuse current calls, no per-keystroke fetch or full-table directory loop.

Local measured results (raw requests, intercepted synthetic providers):

| Window/action | Accepted baseline | Current |
| --- | ---: | ---: |
| App startup |18|18|
| Visible60s / hidden60s |0 /0|0 /0|
| Admin startup / settled idle60s |48 /0|46 /0|
| Editor startup / idle60s |5 /0|5 /0|
| Preview / top-level print output |1 /1|1 /1|
| PDF requests / real PDF bytes |0 /246896|0 /246896|
| Audio start / playback60s /8pause-resume |5 /0 /4|5 /0 /4|
| Route / account switch / logout |1 /1 /0|1 /1 /0|
| Additional analytics reads/writes/rows/bytes |0 /0 /0 /0|0 /0 /0 /0|

The final local full-suite startup is18/18. An earlier exploratory run recorded21/18 because of the existing Inbox fallback scheduling race. Admin48/46 also reflects existing asynchronous startup/refresh ordering, **not a claimed optimization**; raw names are retained, non-Inbox app source sets must match. Existing functional audio-start/pause progress writes and one-shot auth/route reads are counted as product I/O. The zero-incremental decision does not mean total playback/product I/O is zero.

Exact-head CI on push runs the full workflow and emits `wave75-measurements-<github.sha>` with matching measured_head, plus retained65/66/7 artifacts. Checked-in local measurements accurately state dirty tree/parent; final delivery supplies the exact commit/CI URL/head, never relabels old evidence. No physical battery/thermal/native success is inferred.

Migration checkpoint remains **42/42 exact,0missing,1pre-existing pending** (`20261012123000_audio_bible_public_catalog_read_v511.sql`); no migration added/applied and no claim of zero pending. All historical Wave6.6 unresolved live-body/security items remain unchanged; no review SQL executed live.

PHYSICAL_QA_ONLY: actual iPhone/iPad/Safari/WKWebView/iOS PWA, Android phone/tablet/Fold posture, desktop/macOS PWA, native print/share/save-files/font/image/page geometry/accessibility/keyboards, offline OS-kill/media controls and Watch pairing/toolchain from Wave7. No device/signing/Store/provider acceptance performed here. Production state, data, caches, main, School progress, Notes, Plans, Community, account merge, audio engine and existing issued records are unchanged.

Final local validation: all **22 executable Validate Develop stages PASS**, including the full Wave1–7 browser/SQL/security gates and all four real elapsed measurement stages. Setup tooling already existed; checkout/install/artifact upload are CI operations, not counted as local test stages. Git diff check and changed-JS syntax PASS. Exact final-head remote CI evidence is supplied in the final delivery and in the matching-head GitHub Actions run/artifact, not inferred from this local result.

CI follow-up: first remote run38873221902 on implementation5918df0f419ad44e46c57b3bb5f07afcf6b5749b correctly rejected a generated `scripts/__pycache__/wave75_accepted_source` file. Local runner had bytecode disabled; two imported-guard files set the flag after the new import. The follow-up moves those imports after the existing no-bytecode flag and sets the same flag explicitly for the CI job. No artifact exception/ignored safety assertion, fixture expectation, product or backend behavior changes. A fresh exact-follow-up-head full workflow is required.

Rollback-read follow-up: the shared backend-ready flag gates reads as well as mutations, so rollback instructions explicitly retain its already-approved read configuration on verification/My Documents/output. Server gate=false and exact mutation revokes disable issuing independently. An actual browser rollback regression now proves recipient archive and minimum public proof still open while Studio cannot write. No runtime/backend SQL behavior changed for this clarification.

CI fixture timing follow-up: run38873475027 passed the prior gates but new Wave75 locale test observed the legitimate temporary Workspace removal during asynchronous server reauthorization (`0 !== 11`). The test now waits for the same eleven-authorized-buttons ready condition as the existing Wave3 regression, preserving the assertion instead of racing loading state. No Admin runtime/permission change. The rollback browser test also distinguishes an attached empty status span from a visible populated notice and checks the actual capability response.
