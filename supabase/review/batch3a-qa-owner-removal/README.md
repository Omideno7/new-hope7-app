# Own-question removal — REVIEW ONLY / BLOCKED_ACTIVATION

No migration, database call or deployment was performed. Client fails closed unless the server confirms the exact removed question ID. Synthetic SQL proves the proposed UID lifecycle only; it does not prove live compatibility.

Selected lifecycle: **privacy-preserving tombstone**. Keep row ID, trusted owner UID and a private actor/timestamp audit; blank the question, null the base answer, blank all six v341 FA/EN/HR translation fields, set hidden. No public tombstone text. Repeated same-owner requests remain idempotent. Anonymous/non-owner callers are denied without accepting client email/device identity. No wildcard grants or service-role credential.

Before ANY activation, separately approve read-only preflight and verify:

1. Exact live `qa_questions` columns, trusted immutable `user_id uuid` binding established by current server submit, current UID-bound own-reader contracts, RLS/ACL and dependent triggers. No legacy email/device-only claim or automatic backfill. An unresolved legacy owner stays BLOCKED_ACTIVATION.
2. Enumerate and explicitly scrub **every** live question/answer translation column and any linked answer store in the same transaction. The public repo includes a v341 multilingual adapter; base `question_text/answer_text` alone is NOT proof that all live translated copies are removed. The candidate requires the exact six v341 text columns and scrubs them atomically; missing/different columns or additional stores deliberately block activation until reconciled. No guessed dynamic column deletion.
3. Prove all current AND old Store/public-reader RPCs, direct REST/RLS, Admin-published projections and CDN/offline caches stop exposing hidden records/linked answers. Once a public response has already been downloaded to another offline device, immediate remote erasure is impossible. Online refresh must reconcile against authoritative server rows. No realtime/polling is introduced.
4. In synthetic/approved staging, owner/non-owner/anon/replay, concurrent answer-versus-delete, translation/linked-answer and old-client/public refresh tests. Confirm no notification trigger republishes deleted text.
5. Only then review the exact adapted candidate and release compatible clients; activation remains a separate owner decision. Do not execute pending v511/v580 or other review packages.

Rollback: disable RPC EXECUTE using rollback.sql. Preserve hidden content/audit and never restore removed text. No live removal or Production deletion success claimed by this package.
