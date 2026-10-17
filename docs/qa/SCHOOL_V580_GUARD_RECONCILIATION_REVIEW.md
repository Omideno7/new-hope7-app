# School v580 — historical-gate reconciliation needs review

Status: implementation/fixtures in progress, **NOT CI ACCEPTED**, no Production activation. No established safety test was changed. Automatic approval review rejected an earlier proposed multi-guard adaptation because a broad whitelist could weaken assertions. That command did not execute.

## Concrete incompatibility

The accepted Batch2 base is `b769df6d91cc2ffb4cc86905ab35d2c022fb2447`. Its historical gates intentionally freeze `getSchoolSnapshot`, `submitSchoolAssignment`, all backend/review files, and runtime additions. The current authorized task explicitly requires cycle-aware School source, server RPC/schema/idempotency, and honest additional pending migration reporting. The old frozen-source assertions therefore reject the authorized delta before their semantic browser/SQL tests can run. Passing the new tests does not make these old gates green.

## User-approved narrow reconciliation

1. Keep the complete 42-migration checkpoint and v511 byte-exact. Permit exactly one named **unapplied** School migration, independently recompiled from the reviewed component sources and executed only in synthetic local PostgreSQL.
2. Independently test the current five modified app functions (`getSchoolSnapshot`, `submitSchoolAssignment`, `school`, `schoolLesson`, `saveSchoolProgress`) and the existing draft/security/path changes. All other app functions, Auth, Notes persistence, Library/Q&A transport branches, Audio engines, account context, certificates, report/PDF/Print implementation and protected user-data sources must remain exact.
3. For historical UI/source assertions only, use a reversible before/after SHA-256-bound representation of those exact approved School edits. Original assertions and original expected bytes remain unchanged. Validate current behavior independently before deriving any prior-byte representation. No directory-wide or wildcard path exemption.
4. Runtime additions are exactly the two named v580 School modules. Entry changes are one dependency line per entry; worker change is exactly adding those two assets, with all storage/cache behavior otherwise exact. Keep offline assets available without clearing caches.
5. All new SQL/review/test/report paths must be individually named. No generic `supabase/**`, `js/**`, or future-file allowlist. Any change outside the reviewed delta fails.
6. Record migration parity as **42 exact + 2 pending**, not zero pending; retain existing v511 and separately name School v580. Do not edit historical measurement results to pretend the School migration is already live.
7. Run the entire existing Validate Develop and new School gates on the final commit. No skipped failing tests, deleted assertions or changed security outcomes. Exact-head GitHub CI success is still required before acceptance.

Current independent checks live in `scripts/verify-school-safety-v580.py`, real SQL in `scripts/verify-school-cycles-v580.cjs`, and current browser/draft tests alongside them. These supplement rather than replace historical gates.

The user approved option 1 (the documented limited reconciliation) in this session. Implement only the exact hash-bound bridge below independent current-source/behavior checks; acceptance still requires complete exact-head CI. No new branch/PR/main/Production action is proposed.
