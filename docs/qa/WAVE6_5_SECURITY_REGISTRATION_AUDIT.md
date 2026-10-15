# Wave 6.5 pre-implementation audit

Date: 2026-10-15 (Europe/Zagreb). Starting develop: `fd7191653d45fc53791b867feb54181e2b90bf77`. Accepted Wave 6: `0df4ad87de0df5f341b661b475adfe7a893fcce8`. Main: `15af811f78a17a0881c13171311e7ade6bc390f4`.

## Evidence and authority

Read AGENTS, DEVELOPMENT_WORKFLOW, Product Completion Master Audit, Wave 3–6 reports/audit and the complete Wave 6.5 specification. Existing Wave 1–6 source is authoritative. No historical branch integration. This audit precedes implementation. Repository SQL, browser source and deterministic local fixtures are available; privileged Supabase metadata/Auth configuration is not. The supplied advisor snapshot is owner-provided evidence, not a freshly verified live catalog. No connection to Production was made. No live user/provider test is authorized.

## Registration/Auth traces and confirmed issues

- `index.html` loads `nh7-auth-signup-guard-v343.js` (can synchronously load canonical registration), `nh7-registration-canonical-v353.js`, the v342 compatibility loader and v401/v402 final/repeat guards. Canonical full form is the only supported signup source. `app.js` normal sign-in remains authoritative, including existing weak passwords.
- Canonical v353 `validate`/`packetComplete` use digit counting (8–16) and optional `+`. Phone is stored unnormalized; UI says country code preferred. DOB parsing can normalize invalid calendar dates. Required text is only nonempty. Email normalization, common-domain typo detection, controlled Yes/No and same-account email checks already exist and must remain.
- v353 already requires 10/upper/lower/digit/symbol/no whitespace for new signup. `nh7-auth-recovery-v342.js` and `reset-password.html` allow six-character replacement passwords: confirmed creation/change inconsistency. The reset page can display confirmation success without a server-verified confirmed identity.
- Registration signup/sign-in persistence, final-status writes and v401/v402 status responses lack post-await owner fencing. Existing v402 checks on email keystrokes/intervals can create unnecessary requests. Scope-local validation must not add this cost.
- Server v348 revokes direct registration INSERT but grants v3 EXECUTE to anon/authenticated/service. v355 BEFORE Auth insert calls v351 payload validation; v356 AFTER Auth insert inserts a pending registration atomically. Full current v3/v351/approval function bodies are absent. Thus reviewed strict before-write validation must cover both authenticated RPC and atomic signup; approval requires server-confirmed Auth email. Unconfirmed pending creation is distinct from approval/ownership.
- Recovery redirects are fixed HTTPS Pages URLs; token fragments are scrubbed. No paid password protection or SMS ownership proof can be inferred. No CAPTCHA currently configured in source. Prepare disabled, no-network-until-enabled Turnstile integration only.

## Deletion traces and confirmed risks

- `nh7-delete-account-v253.js` intercepts the settings button, invokes deployed `nh7-delete-my-account-v252`, retries 401/403 after refreshing the *current* account, and blanket-removes all `nh7_` local keys on success. Refresh persistence also lacks owner fencing. This can retarget an account after a switch and clear another user's cached data. The settings v252 fallback contains another blanket-clear path. Neither proves complete modern domain deletion.
- `admin.html` Reject updates request status. Delete calls `nh7_admin_delete_registration` with a registrations-only fallback. It must remain request deletion, not silently become full-account deletion. A separately confirmed server-authorized full-delete control is required, disabled until a reviewed backend is approved.
- v372/v381 full-delete bodies and the deployed self-delete Edge source are not in tracked source. Their live completeness cannot be asserted; capture them during read-only preflight. Never reconstruct unknown deployed behavior or activate a new delete route here.
- Current identity domains include Auth, registrations, account/legacy Notes/progress/verses, School identities/grants/progress/assignments/exams/certificates, fasting/plans, Library grants/reading/claim ownership, Community, sermon social, Inbox/receipts, Q&A, avatars/owned Storage, Admin audit and Wave 4/5 review contracts. Inventory must include referenced tables whose definitions are absent. UUID beats device/email; shared-device-only rows are quarantined unless exclusive ownership is proven. Issued immutable official documents require an explicit retention/redaction/revocation policy; no blind deletion or rewrite of certificates.
- Storage API must precede database/Auth deletion; SQL storage.objects deletion is prohibited. Multi-system atomicity is impossible: persisted stages, exact UUID idempotency, ownership checks, fail-closed schema census and retry tests are required. Completed jobs must not rescan a fresh same-email UID.

## Security Advisor/source completeness

The 110 tracked SQL files contain 231 SECURITY DEFINER declarations across 188 names (historical/review duplicates; not live signatures/counts). Inventory will distinguish source declarations, referenced-only endpoints, inferred purpose and unresolved live ACL/search_path, with read-only catalog queries required before activation.

The four supplied Library views have no CREATE VIEW definitions in repository: `nh7_library_items_v224`, `nh7_library_items_v251`, `nh7_library_collections_public_v251`, `nh7_library_collections_public_v322`. Blind invoker conversion/base SELECT grants are unsafe. Prove a narrow caller-UID RPC/view adapter in PostgreSQL fixtures, preserve exact captured view projection and publication/ministers checks, and gate activation on actual view definitions/base policies/projection fingerprints.

Private v350 Admin membership/permission/audit tables deliberately enable RLS, revoke client access and define no client policy: deny-all is intentional. Other ~29 live suggestions cannot be enumerated from a snapshot count; source inventory plus a fail-closed live preflight is necessary. No evidence justifies blanket policies.

No known source dependency justifies moving pg_net. Inspect extension namespace/relocatability/dependents/ACL live; prepare conditional privilege reduction only, otherwise explicitly retain warning. Public anon/publishable keys are client credentials, not service secrets; a role-aware scan must inspect all tracked runtime/review fixtures without printing matched values.

## Implementation and verification boundaries

Implement narrowly scoped shared validation, strict phone/localized help, creation/change password alignment, disabled CAPTCHA and owner-fenced registration/recovery/delete UX. Preserve all data models, IDs, current app sign-in, Notes/School/audio/push/Library/Studio engines. New backend SQL/Edge orchestration stays under `supabase/review/wave6_5-security-registration/`, with preflight, ordered activation, schema/compatibility blockers, rollback and synthetic PostgreSQL/provider fixtures. No migration/live setting/provider activation.

Before release require current live catalog capture, owner-approved data-retention policy/complete identity census and staged client adoption before strict backend activation. Test FA/EN/HR, malformed direct writes, duplicates/rejected resubmission, account switches/timeouts, every known identity domain with explicit safe exceptions, same-email fresh UID, shared-device B, Library roles/grants/no-policy denial and secret negatives. Run all Wave 1–6 guards without broad exceptions; any historical freeze adjustment must verify an explicit hash-bound Wave 6.5 delta independently. Measure actual 60-second visible/hidden idle, form/Admin idle and synthetic submit/purge/CAPTCHA cost. Final CI must match final develop SHA; migration checkpoint stays 42/42 exact with one pre-existing pending v511 migration, none applied. Stop after Wave 6.5.
