# School Progression & Admin Override v580

Source/fixture implementation on `develop`, **backend UNAPPLIED**. Production behavior and real stuck students have NOT been changed. Starting remote develop: `b769df6d91cc2ffb4cc86905ab35d2c022fb2447`; audit commits `a63020399ab2a8f29c0dba0a1e303a89aacc48c8` and `76183961010f9de24625257f2052413ee3f65eb6`. Main baseline `15af811f78a17a0881c13171311e7ade6bc390f4` must stay unchanged. Exact implementation/final SHA and exact-head CI are reported in delivery, not invented in this document before commit/CI.

## Root cause

The active security transport already blocks raw client scoring and uses server-scored v340/v351 RPCs. Those RPCs counted all exam attempts against `max_attempts`, including class/lesson exams. The checkpoint hotfix removed repeat-after-failure lesson/approval timestamp fences but retained the attempt cap. Completed lessons and approved assignments therefore could not repair an exhausted class. No enrollment generation existed; deleting/reusing those rows would destroy history or incorrectly satisfy a fresh journey. Final requests lacked stable submission identity, and retrospective assignment recalculation could rewrite finalized grades.

## Implemented source behavior

| Area | Result |
|---|---|
| Lesson/class quiz | Unlimited failed attempts; server grading and approved-assignment/class prerequisites retained. Actual SQL tests exercise ten failures, attempt eleven and later pass for both scopes. |
| Final School exam | Three confirmed failed finalized receipts per cycle; failures one/two retry, third requires restart, ordinary fourth rejected. Passed/legacy/Admin completion cannot be regraded into another normal attempt. |
| Submission recovery | Durable UID/cycle/exam request identity + original answers before sending; exact server replay, input mismatch rejection, transaction-level cycle lock and unique receipt. Lost replies/refresh do not create another finalized failure. |
| Restart | Explicit localized confirmation only. New metadata cycle and fresh active reads/writes/drafts; no historical row deletion/reset/backfill. New assignments require normal review/approval again. Waiting/contacting Admin remains an alternative. |
| Extra opportunity | Owner-only audited increment, reason/confirmation/request identity; no release/manual SQL needed per student after separately approved activation. |
| Reset allowance | Owner-only reset offset; attempts, receipts and original failed total retained. |
| Academic acceptance | Explicit ADMIN_OVERRIDE completion flag/audit, no fabricated exam score/attempt. Cycle-aware path, reports and read-only completion adapter recognize it. No automatic certificate issuance. |
| Technical repair | Separate audited stage-unlock metadata. Does not fabricate an academic pass or waive assignment/class final prerequisites. |
| Admin restart | Same non-destructive generation semantics; prior cycles/history remain owner-visible. |
| Admin UI | Manual, bounded School Progress Management inside existing student detail. Five localized actions, reason/confirmation, recover same pending action, owner-bound pending key, previous-cycle attempt pagination; actor/generation/selection/late-response fencing. No automatic backend load/polling. |
| Accounts/offline | UID-bound pending requests and cycle hints; hints isolate drafts/cached old rows but never authorize RPCs/count failures. New-cycle draft keys preserve legacy Notes/draft bytes. Stale owner/route/cycle responses cannot repopulate current state. |
| Reports/completion | Preserve exact deployed profile/academic bodies privately; overlay active-cycle School fields, retain identity/non-School data, preserve other courses. Completion adapter distinguishes EXAM/LEGACY_PRESERVED/ADMIN_OVERRIDE. Existing PDF/Print/CSV/certificate render/issuance code remains unchanged. |

## Schema, RPC and authority

Single new **unapplied** migration: `supabase/migrations/20261017130000_school_cycles_and_admin_overrides_v580.sql`. Generated reproducibly by `scripts/build-school-cycle-source-v580.py` from reviewed components and exact existing UID-first grading/read source. Adds private cycle metadata, immutable finalized submission receipts and actor/request/audit records; adds `school_cycle DEFAULT 0` to three existing activity tables; extends only activity uniqueness, retaining primary IDs and every existing row. No migration-time student UPDATE/DELETE/backfill. Historical duplicate attempt numbers are not destructively cleaned; receipt identity is authoritative.

Existing UID bridge and RLS remain intact. Attempt inserts additionally require a private same-transaction pending receipt, preventing legacy score-writing RPCs from bypassing idempotency; finalized attempt updates are rejected. Course-pass progress requires an actual current-cycle passed attempt. The legacy assignment-score lookup retains its TABLE contract but enforces current UID/own-email or trusted owner permission, rather than accepting another student’s email as authority. New private tables/views/functions have external grants revoked. Public operations validate current `auth.uid`, School approval or trusted server owner authority. Privileged academic overrides do not inherit registration-only delegated permissions: existing v350 catalog has no proven delegated academic override grant. Standard assignment review retains its existing trusted `nh7_admin_is_admin_v170` authority and approval semantics, while preventing closed-cycle edits and retrospective rewriting of finalized attempts. Alias fallback resolves trusted current identity and rejects ambiguous binding; unbound old evidence cannot satisfy a new UID cycle.

Old unidentifiable exam submits fail closed with update-required after activation. Old generation-zero assignment/progress RPCs cannot mutate a restarted cycle. Compatible Store/Web client adoption and explicit rollout/version gating are mandatory BEFORE backend activation. No old-client bypass is added.

Migration checkpoint: **42/42 exact, 0 missing; 2 newer pending**: existing `20261012123000_audio_bible_public_catalog_read_v511.sql` plus School v580. Neither applied. Do not describe this as zero pending or live parity at the new source head.

## Verification and acceptance boundary

New tests: actual synthetic PostgreSQL migration/RPC tests (including actual recalculation trigger), current student UI 12 FA/EN/HR phone/tablet portrait/landscape cases, Admin UI 6 language/width cases, generation-zero/new-cycle draft bytes/receipts/account isolation, current-source scope and exact original checkpoint tests. Existing 20 School static/migration tests passed during implementation. Current reports/Print/PDF, Profile/Search/Inbox, Wave1–8 browser/SQL/measurement regressions run through Validate Develop; final exact-head CI determines acceptance. Browser fixtures are not a Production or physical-device claim. PGlite serial locking tests are not two-connection PostgreSQL concurrency acceptance.

Historical safety assertions originally froze *all* School/backend changes from prior waves. Their narrow reconciliation was explicitly approved by the user after an automatic-review rejection of an earlier broad proposal. The approved bridge must validate current School behavior and exact before/after hashes/reversible patch first; historical original-byte assertions remain intact, no wildcard backend/runtime exemption. See `SCHOOL_V580_GUARD_RECONCILIATION_REVIEW.md`.

## Remaining activation / physical gates

- **BLOCKED_ACTIVATION:** independently approved live read-only preflight of actual constraints/standalone indexes, report bodies/callers/ACLs, legacy identity aliases and certificate eligibility consumers. Missing prerequisites must abort rather than reconstruct unknown live code.
- **BLOCKED_ACTIVATION:** compatible Store/Web client adoption/version gate before replacing legacy submission/write contracts. Existing Store clients are not fixed by a Git commit.
- **BLOCKED_ACTIVATION:** actual two-connection concurrency/transaction rollback testing in approved staging; exact live certificate consumers must use cycle-aware completion including Admin acceptance. Existing issued records/links are preserved, not reissued.
- **PHYSICAL_QA_REQUIRED:** exact installed client on iPhone/iPad/Android/Web; all Admin actions, interrupted request recovery, long history pagination, new-cycle offline drafts, assignments/reapproval, reports Print/PDF/CSV and StudentID/certificate continuity. No physical PASS claimed.
- No real students were repaired or mutated. No deployment/main merge/provider/security/Document activation/paid feature, no analytics expansion. Audio analytics remains REJECTED_COST.

Exact activation and non-destructive rollback: `supabase/review/school-progression-v580/activation-checklist.md` and `rollback.sql`. Rollback disables School writes, preserving generation-aware reads and all cycles/receipts/audit/history. Never drop cycle columns/keys or restore all-history legacy progression functions after multi-cycle data exists.

Stop after this School task; no Batch3 or release work.

## Exact changed-file inventory

- `.github/workflows/validate-develop.yml`
- `admin.html`
- `docs/qa/SCHOOL_PROGRESSION_ADMIN_OVERRIDE_AUDIT.md`
- `docs/qa/SCHOOL_PROGRESSION_ADMIN_OVERRIDE_REPORT.md`
- `docs/qa/SCHOOL_V580_GUARD_RECONCILIATION_REVIEW.md`
- `index.html`
- `js/app.js`
- `js/nh7-admin-school-cycles-v580.js`
- `js/nh7-school-cycles-v580.js`
- `js/nh7-school-drafts-v468.js`
- `js/nh7-school-path-v351.js`
- `js/nh7-security-core-v340.js`
- `scripts/batch2_accepted_source.py`
- `scripts/build-school-cycle-source-v580.py`
- `scripts/fixtures/school-approved-v580.patch`
- `scripts/fixtures/school-source-contract-v580.json`
- `scripts/school-v580/database.cjs`
- `scripts/school_accepted_source_v580.py`
- `scripts/verify-batch1-safety.py`
- `scripts/verify-batch2-safety.py`
- `scripts/verify-school-admin-browser-v580.cjs`
- `scripts/verify-school-cycles-browser-v580.cjs`
- `scripts/verify-school-cycles-v580.cjs`
- `scripts/verify-school-drafts-cycle-v580.cjs`
- `scripts/verify-school-safety-v580.py`
- `scripts/verify-wave3-safety.py`
- `scripts/verify-wave6-safety.py`
- `scripts/verify-wave65-safety.py`
- `scripts/verify-wave66-safety.py`
- `scripts/verify-wave7-safety.py`
- `scripts/verify-wave75-safety.py`
- `scripts/verify-wave8-safety.py`
- `supabase/migrations/20261017130000_school_cycles_and_admin_overrides_v580.sql`
- `supabase/review/school-progression-v580/README.md`
- `supabase/review/school-progression-v580/acl.sql`
- `supabase/review/school-progression-v580/actions.sql`
- `supabase/review/school-progression-v580/activation-checklist.md`
- `supabase/review/school-progression-v580/compatibility.sql`
- `supabase/review/school-progression-v580/compiled-rpcs.sql`
- `supabase/review/school-progression-v580/preflight-readonly.sql`
- `supabase/review/school-progression-v580/report-compatibility.sql`
- `supabase/review/school-progression-v580/rollback.sql`
- `supabase/review/school-progression-v580/schema.sql`
- `sw-release-core-v403.js`
