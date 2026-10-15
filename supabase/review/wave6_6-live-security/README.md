# Wave 6.6 live security review package

Review only; not a migration, deployment or approval to execute. No Production SQL, deployment, Auth/provider/paid-feature activation, real user/data mutation or migration was performed. Existing runtime and Wave 1–6.5 review source remain byte-identical to metadata baseline `4f6c702c3f9e996256a5f9410bfd6096b5f3f018`.

Authoritative metadata: `docs/qa/WAVE6_6_LIVE_METADATA_MANIFEST.md` and its four PSV matrices. The export is owner-supplied read-only metadata from 2026-10-15, not a new query from this workspace. All 236 signatures have a disposition; all 32 anonymous signatures are a subset. 72 raw body/signature matches are proven. Matching a public wrapper does not prove a private helper's current body. One matched Inbox wrapper therefore remains individually blocked on identity-helper proof; 164 others have no exact matching body. Registration's anonymous compatibility is confirmed separately by the manifest despite missing full body reconciliation.

Files:

- `function-dispositions.json`: exact live signatures, identities, ACLs, definition/body hashes, source file/line matches, tracked runtime references, reasons and row-specific blockers. A tracked reference may be historical/dynamically loaded; it is never proof an old Store caller can be removed.
- `library-live-contract.json`: exact four view definitions, ordered types and before fingerprints.
- `library-proposal.sql`: inert typed current-UID definer adapters and invoker/barrier compatibility views. Existing view ACLs remain unchanged; new helper execution is limited to captured SELECT grantees. PUBLIC-view ACL fails closed for separate review. No existing RPC or base table is changed. New adapters may add up to two intentional authenticated SD warnings if captured view roles require that transport and activation is later approved; anon warnings only if captured anon SELECT requires that transport.
- `rollback.sql`: inert exact original SELECT definitions, reset options, drop only the two new functions without CASCADE. Existing ACLs stay intact. Capture owner/ACL/grantor/options/dependencies first; transaction abort on drift. Rollback metadata artifact and post-activation hashes are mandatory before approval.
- `preflight-readonly.sql`: metadata-only owner template; no user payload queries, secrets, SQL writes or settings changes. Not executed here.
- `function-acl-proposal.sql`: **zero existing-function SAFE_TO_REVOKE proposals**. No named Admin/trigger body/caller proof supports a safe delta. Keep current grants while resolving those individual rows privately.
- `rls-dispositions.json` / `rls-proposal.sql`: exact 29 external findings, intended readers/writers/paths, missing actual table ACL facts; no policy addition.
- `pg-net-acl-proposal.sql`: retain non-relocatable extension; no proven ACL reduction.
- `wave65-reconciliation.json`: each old file/created object, regeneration/unsafe/absence checks; old review package preserved, not retroactively rewritten.
- `full-delete-readiness.json`: 61 discovery candidates, additional exact live names, retention/shared-device/API/fencing blockers. Disabled; zero approved real purge targets.
- `activation-checklist.md`: explicit staged gates and release/provider separation.

Run `python3 scripts/verify-wave66-evidence.py`, `python3 scripts/verify-wave66-safety.py`, and `node scripts/verify-wave66-postgres.cjs` with isolated PGlite installed by Validate Develop. SQL is extracted only into synthetic in-memory PostgreSQL; the complete proposal starts with an unconditional review-only exception in a transaction and ends with ROLLBACK. No automatic backend activation path exists.
