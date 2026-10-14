# Studio V2 server review and rollback

**Source for review only. Not applied to Supabase.** Both SQL files live in `supabase/review`, outside the deployed migration history. CI runs them only inside a disposable PGlite/PostgreSQL fixture. Production migration parity remains **42/42 raw hashes, zero pending**.

## Why an additive backend is necessary

The existing `school_certificates` path combines drafts/design overrides with issued records, and its historical `(user_email, course_code)` uniqueness cannot safely represent arbitrary repeat official documents. Its issuer RPC source is not present in this repository. Client-only issuance or email-only delivery would provide neither immutable/idempotent issuance nor a protected, durable account archive. V2 therefore uses separate tables and RPC names, leaving existing tables, RPCs, numbers, tokens and links intact.

## Preconditions to verify read-only before approval

- `nh7_is_admin()` must enforce current caller entitlement using `auth.uid()`; the existing `nh7_admin_is_admin_v170()` must remain available for the editor entry gate.
- `school_student_identities.user_id/student_code/status` must be the unique canonical identity source; `active` must retain its present meaning.
- `school_certificates.recipient_user_id/course_code/status` must exist. Foundation School issuance remains in the existing School workflow: V2 requires its already-approved canonical certificate and never changes progression or eligibility.
- Confirm approved document-asset URL prefixes and the maximum request/storage limits with realistic uploaded photos. V2 inline images avoid a new Storage bucket/policy; reviewed definitions are capped at 3 MB. Existing uploaded-asset references remain read-only.
- Review the exact signatures, SECURITY DEFINER owners, empty search paths, grants, table ownership, backup and retention obligations. Do not broaden grants to accommodate a failing test.

## Proposed objects

`document-studio-v2.sql` creates four additive RLS-enabled tables:

| Object | Purpose | Client access |
| --- | --- | --- |
| `nh7_document_drafts_v2` | Owner-admin draft JSON, optimistic revision, reserved number, issue linkage | Admin RPC only |
| `nh7_official_documents_v2` | Unique immutable public snapshot, private UID/email metadata, stable token/number, issue/revoke audit and revision relationship | Admin RPC; allow-listed public verify; UID archive |
| `nh7_document_deliveries_v2` | Idempotent durable delivery keyed by document, canonical recipient UID | Admin deliver RPC; current UID archive |
| `nh7_document_design_templates_v2` | Sanitized, identity-free reusable designs | Admin RPC only |

The sequence `nh7_document_numbers_v2` is isolated from legacy numbering. Reserving a number can leave harmless gaps; numbers are never recycled. Draft reservations are stable. Row locks/revision checks protect issue races; the unique draft-to-issued relationship makes retried issuance return the same record/token/number. Issued definitions have no update/delete RPC. Revocation preserves the snapshot and first audit event. Reissue creates a new identity with `replaces` pointing to the earlier document.

Private helpers guard current admin UID, validate designs and project public JSON. Explicit grants target exact RPC signatures, not similarly named overloads. There are no direct anonymous/authenticated table or sequence grants. RLS has no permissive client policies. No service-role credentials ship to the browser.

Canonical Student IDs are looked up on the server; browser-supplied IDs cannot grant eligibility. Account recipients are checked against `auth.users`; canonical email is private metadata, never a delivery authorization key. Manual nonstudent recipients cannot receive an account delivery without a verified UID.

Public verification takes only a UUID token and exposes an allow-list of approved visible document fields. Private email, account UID, administrator UID, drafts, revision links and hidden assets are excluded. Revoked/expired responses omit the full preview. Personal text deliberately placed in a visible custom element is public; the issue confirmation warns Admin of that boundary. No copy protection can revoke a PDF already downloaded by its recipient.

The archive requires `auth.uid()`, matches both delivery and document recipient UID, and reads legacy records only by their existing canonical `recipient_user_id`. It does not fall back to email. Audit actor IDs retain history without new account-deletion blockers. Deleting a recipient account detaches the V2 certificate UID and removes only that account's V2 delivery linkage. It never deletes an issued document.

## Proposed approval and deployment sequence — NOT executed

1. Review schema/ACLs and the read-only preconditions above against the actual environment. Back up existing and proposed document records.
2. Have an authorized operator approve an additive migration derived verbatim from the reviewed SQL. No automatic migration is included in this PR.
3. Apply to an isolated staging database first. Run the same identity/ACL/revision/issue/revoke/archive matrix against staging and complete the 63-step manual acceptance flow.
4. With separate explicit Production approval, apply the reviewed additive SQL transaction; verify exact ACLs/RLS and compare unchanged legacy rows/links.
5. Release the matching reviewed Web assets only after functional, Safari/native and manual approval. There is no Edge deployment, Storage-policy change or School migration.
6. Confirm backend capabilities before issuance. Without these RPCs, the authenticated editor allows local draft/design work and clearly disables issuance; it never falls back to an unsafe legacy issuer.

## Non-destructive rollback

First disable V2 entry points/revert only the Web integration commit and executable release cache version. Keep old Documents/Studio and original public routes in place. If server access must be halted, execute **only with approval** `document-studio-v2-disable.sql`, which revokes the exact V2 RPC grants while preserving every V2 and legacy row. Existing V2 public links will be unavailable while disabled: communicate this before using the emergency shutdown. Do not drop tables, truncate, renumber, regenerate tokens, reset a sequence or rewrite issued snapshots.

Restore service by reviewing the incident and reapplying the grants/functions in the reviewed idempotent source. Export/retain issued records before any future deprecation. Removing the old overlay files or changing old links requires separate compatibility/manual approval; this PR does neither.

## Evidence

The local PostgreSQL test applies the proposed SQL twice to prove rerun safety. It exercises real role grants and SECURITY DEFINER execution, not regex-only authorization tests: anonymous/ordinary/admin roles, cross-account archives, direct table denial, forged Student ID, malformed definition, revision conflict, stable reservation, issue retry, revoke history, template sanitization, account deletion and unchanged legacy fixture rows. The browser test uses the same isolated database through a mocked HTTP boundary and blocks all external network. This is not evidence of a Production deployment or live Supabase compatibility approval.
