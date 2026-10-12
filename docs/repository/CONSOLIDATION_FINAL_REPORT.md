# Repository consolidation final evidence

## Before / after

**451 → 6 remote branches. 445 deleted:** 129 entirely reachable from retained main/develop history, 11 exact-tip duplicates, **305 unique historical tips archived first**. 314 annotated preservation/checkpoint tags are verified remotely (313 before cleanup plus canonical develop checkpoint). Every branch has exactly one before-audit classification. No prefix-only or unproven-obsolete deletion; no blanket manual blockers. `BRANCH_AUDIT_AFTER_CLEANUP.json` retains every deleted name/SHA/class/tag/time. Remote-tracking refs were pruned.

No stale PR was closed: the three open Drafts are genuinely unmerged active work, not abandoned just because one is older. #106's own description explicitly gates companion integration despite green CI.

## Remaining branch refs at capture

- `codex/document-studio-regression-qa` — `822b7062302d5f9c60fa1e1caacd0c2e8a56f4c2`
- `codex/web-mobile-parity-safe-v573` — `a4c2ca0e90708a4743bd8be3d367e752510c609c`
- `develop` — `15b961e34d05307a03af33ae655228355213c153`
- `feature/final-qa-v2500-20261004` — `374b9bfee12897922d82522e47efa4a8837b8b75`
- `feature/watchos-v2500-20261004` — `8a58086289aa1fa0d9d845f76b574a9422adc63d`
- `main` — `67d829de0d8d4846e309a99bcd98c4c005b3b030`

The develop SHA above is the exact **validated runtime candidate** after deletion. This inventory is added in a following docs-only commit; the exact final documentation head is reported by the Draft integration PR/CI and delivery message, avoiding a self-referential Git hash inside its own commit. Both old main and old develop are ancestors of the new line. Main stays **67d829de0d8d4846e309a99bcd98c4c005b3b030**.

## Store provenance / reconciliation

- Android 2.5.0 / 25002: **a177cdc7d995894868cf84bbe00c2dfa05ad6e25**, published run 37388172102, real payload `android-release-25002/www`; stable annotated Store tag.
- iOS 2.5.0 / 25001: actual Xcode `App 10-5-26, 4.09 am.xcarchive` embedded public tree. ZIP SHA256 **e5b6565049ef5025de48dc0d629501732880fa482f0990251b010f8fdc803b6b**; all 388 file hashes verified. Exact bytes independently preserved at `store/ios-2.5.0-25001-archive-payload` → **b62085749c41c21b9ca346a8439e80d065a3fd10**. The dba24de9 lineage tag is separate and **not** evidence of archive byte identity.
- iOS lineage dba24de9 and release/2.5.0-rc ea556df6 are already ancestors of main. Test5 advanced to 374b9bfe; neither its newer tip nor original 82efc731 is substituted for the signed payload.
- All **8 Android-only commits** and **580 changed Git files** are listed/classified. Native Android compatibility/bridge/cache/scroll/build changes were archived, not wholesale ported to Web/iOS. Current newer Search/Exam/Profile/Library/Community/Audio implementations remain authoritative.
- Existing reviewed develop responsive v570, theme v571, offline v572, Fold layout, Notes/Search/Inbox/cost and School identity work is retained; current main v520 Documents fixes reconciled normally. **No new historical Android product port is claimed.** Shared sidebar/viewer/chrome/reflection gaps stay with active #241, and mixed Soul/Growth/native data policies remain explicit acceptance gates. Full Store parity is not claimed from branch names or green CI.

## Active work disposition

- PR #241: `a4c2ca0e90708a4743bd8be3d367e752510c609c` on `codex/web-mobile-parity-safe-v573` — kept Draft, head untouched; base `main`.
- PR #240: `822b7062302d5f9c60fa1e1caacd0c2e8a56f4c2` on `codex/document-studio-regression-qa` — kept Draft, head untouched; base `main`.
- PR #106: `8a58086289aa1fa0d9d845f76b574a9422adc63d` on `feature/watchos-v2500-20261004` — kept Draft, head untouched; base `feature/final-qa-v2500-20261004`.

#240 needs reviewed V2 backend/manual/native acceptance. #241 needs physical safe-area/hero/native approval. #106 needs companion integration and safe retargeting; its Test5 base is retained solely for that dependency. Integrate each reviewed result into develop, then delete the authorized temporary head/base. No unfinished Draft was merged for cleanliness. The only new integration review uses existing develop as head, not another branch.

## Tests

Validated candidate CI [38217685825](https://github.com/Omideno7/new-hope7-app/actions/runs/38217685825): **PASS**, including all current release validation blocks, existing develop responsive/theme/offline/migration/identity guards, optimization, Documents v520, notification/source cost/Fold safeguards, exact-byte build metadata tamper rejection and real local browser Profile/Search/Inbox regression. Existing migration parity remains **42/42 exact; 0 pending**. Whitespace and syntax checks pass. A subsequent docs-only head is also required to pass CI before delivery.

The Inbox test now uses the actual badge-sync module and waits for its documented asynchronous paint, rather than a fake sync result that left its internal count stale. The known v452 report RPC and new executable cache version are checked explicitly; no security assertion was dropped. Device/Store parity, actual native 07:00 push, #240/#241 acceptance and Production schedules cannot be certified (the attempted public schedule read was blocked by the cloud egress proxy: tunnel 403 before Supabase) in this cloud workspace; gates remain documented.

## Safety and release decision

**No Production data mutation, Supabase migration application, RLS/Auth/Storage-policy change, user-data clear, main history force rewrite, main update or deployment.** Backend source already on develop was retained verbatim; no database or Edge deployment was invoked. Executable cache rotates alone; stable data/reader/download caches remain. Exact-tip leases + atomic delete-only batches protected concurrency; default main/develop and all active refs were excluded. Tags preserve unique complete Git histories; the actual iOS payload is additionally byte-recoverable.

Main remains the current release source. Develop is the canonical work/testing line, with automatic non-deploying CI. A Draft develop→main integration is prepared for review only; remaining product/physical gates prevent release now.

## Required files and reproducibility

- `AGENTS.md`
- `docs/DEVELOPMENT_WORKFLOW.md`
- `docs/RELEASE_PROVENANCE.md`
- `docs/repository/BRANCH_AUDIT_BEFORE_CLEANUP.md` and `.json`
- `docs/repository/BRANCH_AUDIT_AFTER_CLEANUP.json`
- `docs/repository/STORE_CONVERGENCE_250.md`
- `docs/repository/PLATFORM_RUNTIME_CONSISTENCY.md`
- Full Android/payload inventories, iOS SHA manifest, runtime source hashes and tag-preservation manifest alongside them.
- `scripts/record-build-metadata.py` verifies actual exported bytes against the exact source SHA, records version/build/time/platform/hashes and rejects dirty/shared-old Production payloads; it never deploys. Its focused test and consolidation-safety guard are retained.
