# Wave 6.5 Security Advisor triage

2026-10-15, Europe/Zagreb. **Source/fixture findings; no live advisor connection or changes.** The owner-supplied snapshot (~4 problems/~270 warnings/~29 suggestions) is not represented as a fresh count. Absence of privileged read-only access limits live verification, not authorization to guess.

| Item | Classification | Evidence / review action / remaining risk |
|---|---|---|
| `nh7_library_items_v224` | MUST FIX BEFORE RELEASE; REVIEW-ONLY BACKEND CHANGE | Definition absent. Exact column/type/ACL/dependency capture required. Narrow current-UID catalog RPC + exact-projection invoker/barrier adapter, exercised in real PostgreSQL fixture. No broadened base grants. |
| `nh7_library_items_v251` | MUST FIX BEFORE RELEASE; REVIEW-ONLY BACKEND CHANGE | Same independent view contract/fingerprint gate; not a blind ALTER. |
| `nh7_library_collections_public_v251` | MUST FIX BEFORE RELEASE; REVIEW-ONLY BACKEND CHANGE | Collections use current authorized bundle; publication/audience/revocation and projection proof required. |
| `nh7_library_collections_public_v322` | MUST FIX BEFORE RELEASE; REVIEW-ONLY BACKEND CHANGE | Preserve current collections UI/catalog behavior, same-name/types only after live proof. |
| Approximately 32 anon-executable SECURITY DEFINER functions | HARDEN LEAST PRIVILEGE; REVIEW-ONLY BACKEND CHANGE | 231 repository declarations/188 names inventoried with source signatures, grants, purpose and search_path evidence. Exact live role ACL remains UNVERIFIED. Remove PUBLIC/anon from approved Admin signatures; private/trigger/internal helpers also remove authenticated only with no unresolved current caller. Retain intentional public verification/status/signup/recovery contracts with internal fail-closed checks. No blanket revoke. |
| Approximately 236 authenticated-executable SECURITY DEFINER functions | HARDEN LEAST PRIVILEGE; SAFE BY DESIGN / KEEP where proven | EXECUTE is not row authority. Preserve legitimate UID-bound user RPCs. Internal/trigger/maintenance/obsolete wrappers need exact signature/body/caller replacement review. New purge RPCs are service-only; browser flags confer no privilege. |
| Definer search_path / dynamic SQL | HARDEN LEAST PRIVILEGE | New functions pin empty search_path and qualify sensitive relations. Dynamic delete table names come only from private owner-reviewed scope/regclass; values are bound parameters. Unknown deployed function bodies are not rewritten. Adapter generator verifies fingerprints and rejects unsafe signatures/hidden columns/unresolved callers. |
| Private v350 Admin membership/permission/catalog/audit RLS no policies | SAFE BY DESIGN / KEEP | Existing migration revokes clients; internal service/definer use only. Do not add a client policy just to suppress advisor suggestions. |
| Wave4/5 review private tables / new delete job/scope deny-all | SAFE BY DESIGN / KEEP | Client schema/table/function denial tested in PostgreSQL; only exact service endpoints receive grants. |
| Other ~29 live RLS-with-no-policy suggestions | DEFER WITH EXPLICIT RISK; REVIEW-ONLY BACKEND CHANGE where needed | 43 source RLS tables classified, but source and live table sets differ. Read-only preflight enumerates every actual table/policy/ACL. Missing client ownership policy must be proven with UID negatives; no permissive generic policies. Cannot label all 29 safe from a snapshot count. |
| pg_net installed/exposed in public | DEFER WITH EXPLICIT RISK; HARDEN LEAST PRIVILEGE after proof | No baseline repository net.* runtime dependency found. Live extension relocatability/dependencies/ACL unknown. No blind relocation. Review exact unnecessary net HTTP EXECUTE revocations while preserving trigger/service dependencies; restore captured ACLs for rollback. Warning remains until approved verification. |
| Leaked-password protection off | PLAN-DEPENDENT / NO-COST RULE PREVENTS ACTIVATION | Desirable but not required/activated when a paid plan is needed. No upgrade or paid dependency. |
| Publishable/anon client keys | FALSE POSITIVE / INTENTIONAL credential exposure category | Browser publishable keys are expected; role-aware scan rejects privileged JWTs, private keys and real server/provider literals. Their safety still depends on server RLS/RPC authority. No claim that public credentials alone secure data. |
| Loose phone validation / direct malformed pending insertion | MUST FIX BEFORE RELEASE; REVIEW-ONLY BACKEND CHANGE | Strict shared E.164 contract implemented in client and SQL fixture before writes, Unicode digits, exact DOB/text quality. Server deployment and Store adoption remain separate approval. No phone-ownership claim/SMS. |
| Unconfirmed email / password/Auth controls | REVIEW-ONLY BACKEND CHANGE | Confirmed Auth email is approval/identity signal; pending unconfirmed signup remains distinct. Reset confirmation UI now verifies server identity. Free password/rate/redirect/confirm settings documented but not changed live. |
| Bot abuse / CAPTCHA | REVIEW-ONLY BACKEND CHANGE | Disabled no-cost Turnstile signup/recovery source; localized accessible expiry/failure/cancel, bounded lifetime, fresh token, no polling. No live site/secret/provider configured. |
| Full deletion / unknown deployed v372/v381/v252 coverage | MUST FIX BEFORE RELEASE | Unknown bodies cannot prove modern completeness. New service-only staged source and 61-table discovery/fixture matrix; unsupported/ambiguous/retention cases block verified success. Old blind refresh/retarget and blanket-local-clear removed. No real deletion executed. |
| Secrets in current repository text | SAFE BY DESIGN / KEEP with ongoing guard | Role-aware CI scan and synthetic detector negatives pass; see report for exact run count. No values printed. This does not certify all git history or provider logs. |

## Machine-readable evidence

Under `supabase/review/wave6_5-security-registration/`:

- `function-matrix.json`: every baseline source definer declaration/signature and source grants; historical/review duplicates retained, live roles explicitly UNVERIFIED.
- `rls-matrix.json`: every source RLS relation, source policy mention, deny-all/review classification; not an invented live no-policy list.
- `identity-coverage.json`: every source/discovered candidate and safe exception/provenance; exact live keys/aliases/JSON/FKs must be approved before activation.
- `preflight.sql`: read-only live definitions/ACL/column/RLS/FK/trigger/extension census. No private row bodies or configuration secrets requested.
- `propose-adapters.py`, `library.sql`, `grants.sql`: exact-fingerprint, projection/caller-gated least-privilege proposals; source-backed trigger revocations only, no cosmetic zero-warning changes.

PostgreSQL fixtures demonstrate School-approved public access, authorized minister, revoked minister, normal/unapproved, anon, Admin, unpublished/inactive exclusion, narrow columns, dynamic publication and base-table denial. Current Library runtime/file/cache code remains byte-identical. Tests prove the proposed adapter contract; they do not prove absent live definitions are equivalent. Separate owner-approved live preflight is mandatory.
