# Issue #127 — Wave 1: School Student Identity foundation

## Scope and release boundary

This package prepares the permanent Student Identity layer required by multi-course School, credential delivery and verifiable certificates. It is deliberately additive and review-first.

- Branch: `feature/school-identity-credentials`
- Base: `develop` / current protected-main baseline.
- No push to `main`, no Production schema mutation and no deployment are part of this Wave-1 package.
- Existing School registrations, progress, assignments, exam attempts, certificates and legacy anchors must remain intact.

## Read-only Production audit — 2026-10-07

The current Production audit was read-only.

- School registrations: **293**.
- All 293 School registrations are `approved`.
- All 293 registrations match an existing Supabase Auth user.
- Distinct registration emails: **293**; duplicate School registration email rows: **0**.
- Existing School progress rows: **405**.
- Existing School assignment rows: **360**.
- Existing School exam-attempt rows: **169**.
- Existing School certificate rows: **3**.

This makes an idempotent user-id backfill practical: every existing approved School registration currently has a stable Auth identity to bind to.

## Current architectural constraints

The current School runtime is still partly email-keyed. `school_progress`, `school_assignments`, `school_exam_attempts` and `school_certificates` store `user_email`; several School RPCs derive the user from the JWT email and query those tables by email. The active Foundation School path also hard-codes the seven current class keys and `foundation_school` in several gates.

Email remains useful search/display metadata, but it must not remain the durable identity key for the new multi-course model. The migration strategy therefore adds `user_id` compatibility columns and a permanent Student Identity table without rewriting or deleting historical rows.

## Permanent Student Identity model

Proposed canonical display format: `NH7-1001`, `NH7-1002`, ...

The prefix is presentation/namespace; the numeric part is short enough to announce in meetings. Student Code is an identifier, not a password or authorization token, so sequentiality is acceptable. It contains no personal information.

Each identity has:

- internal identity UUID,
- stable Auth `user_id` when the account exists,
- immutable unique Student Code,
- original registration email snapshot,
- display-name snapshot,
- private photo storage path/reference,
- source School registration reference,
- active/inactive lifecycle status,
- timestamps.

Student Code must never change merely because the user's email changes.

## Existing-student backfill

Backfill rules:

1. Select only approved `type='school'` registrations.
2. Match each registration to `auth.users` by normalized registration email.
3. Insert exactly one identity per Auth `user_id`.
4. Allocate a Student Code only when an identity does not already exist.
5. Never update/delete School progress, assignments, exams or certificates during identity allocation.
6. Re-running the sync must not allocate a second code.
7. A registration retry for the same Auth user must reuse the same identity.

Current read-only counts support a complete 293/293 backfill, but deployment must re-run the preflight immediately before applying the final migration.

## Gradual user_id adoption

Wave 1 proposes nullable `user_id` columns on the legacy School activity tables and a safe backfill from Auth email. Existing email columns stay in place for compatibility.

Runtime transition rule:

- New/updated server functions identify the caller with `auth.uid()` first.
- During compatibility period, historical email rows can be resolved through the Student Identity / Auth mapping.
- No historical rows are rewritten merely to normalize spelling or user display names.
- `NOT NULL` is not introduced until coverage is measured and old-client compatibility is proven.

This permits current installed apps to keep working while the new app moves to stable identity.

## Student photo privacy

The Student Identity may reference a portrait/photo, but the actual source must remain private unless a separate user-facing profile image is intentionally public.

- Certificate rendering may embed the authorized portrait.
- The public verifier never returns the photo path or URL.
- Private Storage download must be JWT/RLS scoped or use a short-lived signed URL from an authorized server path.
- The public QR verifier and public token must never be usable to derive the photo object path.

## Certificate system reuse

Production already has a substantial `school_certificates` model including `certificate_number`, `public_token`, `photo_url`, `inbox_sent_at`, `verification_code`, `content_hash`, `document_version`, `design`, `template_code`, `theme_code`, `church_info` and signature/photo layout fields.

Therefore Issue #127 should extend this existing system rather than build a second certificate database.

Planned additions include a stable recipient user reference and Student Code snapshot for student-linked credentials, while allowing non-student ministry credentials such as baptism or ordination.

## Public-verification privacy finding

The current Production function `nh7_public_certificate_lookup(uuid)` returns more than the new privacy policy allows, including recipient name, final score and certificate body/designation text.

Wave 1 therefore introduces a **new** privacy-minimal verifier contract before retiring the legacy lookup. The safe verifier returns only allow-listed document authenticity fields, for example:

- verification result/status,
- certificate number,
- credential type/title code,
- issue date,
- optional expiry date,
- issuing ministry/church label,
- document version.

It must not return by default:

- recipient name,
- Student Code,
- email,
- phone,
- address,
- date of birth,
- internal user ID,
- photo/photo URL,
- scores,
- assignments/exams,
- admin notes,
- private PDF/storage paths.

Migration sequence for verification:

1. Add safe verifier RPC/endpoint.
2. Change verification page/QR generation to use it.
3. Validate active/revoked/replaced/not-found states.
4. Only then restrict or replace the old lookup so old links do not create an uncontrolled regression.

## Supabase security model

The proposed Student Identity table is RLS-enabled and is not directly writable by app clients.

- Direct `anon` access: none.
- Direct authenticated writes: none.
- User-facing RPC returns only the caller's own safe Student Identity fields and verifies `auth.uid()`.
- Admin search/list RPC checks the existing server-side Admin predicate.
- No authorization decision uses user-editable `user_metadata`.
- No service-role key is exposed to clients.
- Public credential verification is server-authoritative and returns an explicit allow-list only.

## Supabase 2026 compatibility note

Current Supabase guidance requires RLS plus explicit grants for exposed-schema tables, and new tables may no longer be automatically exposed to the Data API. This feature does not rely on accidental table exposure: client access should be through narrowly scoped RPCs and explicit grants.

## Wave 1 implementation split

### A — Identity data contract

- Student Identity table and sequence/canonical code allocation.
- 293-current-student safe backfill path.
- caller-safe identity RPC.
- Admin identity/search RPC.
- nullable `user_id` compatibility columns/indexes on School activity tables.

### B — Admin

- Student list: Student Code column.
- search by name/email/Student Code.
- individual Student Identity panel with portrait.
- exports: Student Code + email.

### C — Student app

- School header identity strip.
- Student Code persistent display + Copy.
- FA/EN/HR labels.
- offline-safe local snapshot of the caller's non-secret Student Code.

### D — Certificates/privacy bridge

- recipient user binding and Student Code snapshot when applicable.
- safe verifier RPC contract.
- no public PII.

## Pre-deployment gates

Before any Production migration:

- rerun registration/Auth-match counts;
- assert zero duplicate user identities and zero duplicate Student Codes;
- snapshot row counts for progress/assignments/exam-attempts/certificates;
- test migration on a disposable/branch database or transactionally staged environment;
- confirm old School app paths still work;
- confirm new Student Code RPC cannot read another user's identity;
- confirm Admin can search by code;
- confirm public verifier exposes no forbidden fields;
- run Supabase security/performance advisors;
- obtain explicit Production approval.

## Rollback philosophy

Because Student Codes become ministry identifiers, rollback must not recycle or silently reassign allocated codes. If a new UI/RPC must be rolled back, retain the identity mapping and disable the new presentation path. Historical School rows are never deleted as part of this Wave.
