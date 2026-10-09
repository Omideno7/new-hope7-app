# Supabase Production migration-history reconciliation — 2026-10-09

## Release-safety rule

Until GitHub Issue #144 is closed, **do not run `supabase db push` against Production**.

Production migration history and `main/supabase/migrations` drifted because some changes were applied through controlled SQL/migration actions without the exact Production versioned file being committed, while several School/Admin SQL files were kept under `supabase/migrations` even though no matching history row exists.

Stage A removes the immediate replay hazard. It does **not** claim full parity yet.

## Production source of truth

The manifest `supabase/review/migration-history-reconciliation-20261009/production-tail.json` records the Production history from `2026-10-01` onward using:

- exact Production migration version;
- exact Production migration name;
- MD5 of the SQL text recorded in `supabase_migrations.schema_migrations.statements`;
- recorded SQL character count;
- reconciliation status.

Production schema/data is not changed by this source-history cleanup.

## Stage A actions

1. Keep the three already-correct October migrations whose version/name match Production.
2. Rename the two 2026-10-09 migrations to the exact versions recorded by Production after proving semantic SQL equivalence.
3. Move five `20261003_*` School/Admin files out of executable `supabase/migrations`. Their objects exist in Production, but no matching migration-history row exists; leaving them executable risks replay by a future `db push`.
4. Move the old v508 source candidate out of executable migrations because its SQL is not semantically identical to the Production-recorded migration.
5. Add a validator that rejects any executable October migration not present in the Production manifest or whose filename version/name disagrees with Production.

## Still missing — Stage B

The following Production-applied migrations still need exact source recovery from Production history before parity is complete:

- `20261002221819 optimize_disk_io_inbox_registrations_v1`
- `20261003073335 retire_nonessential_telemetry_and_audio_gate_v1`
- `20261003100105 add_batched_social_and_inbox_snapshot_v1`
- `20261005232733 community_prayer_testimony_v502_backend`
- `20261006083051 community_moderation_prayer_v503`
- `20261006085853 community_storage_ops_v504`
- `20261006090128 community_storage_cleanup_helpers_v504`
- `20261007065642 community_storage_orphan_audit_v507`
- `20261007074710 fix_testimony_public_storage_admin_select_v508`
- `20261008173510 school_v351_legacy_class_progress_hotfix`
- `20261008173533 school_v351_legacy_final_progress_hotfix`

Do not create placeholder executable migrations for these versions. Recover the SQL recorded by Production (or a byte/semantic-equivalent authoritative source), then verify hashes before placing them under `supabase/migrations`.

## Archived local-only files

The files under `supabase/review/migration-history-reconciliation-20261009/legacy-applied-outside-history/` are retained as forensic/source references only. They are intentionally outside the executable migration directory.

The v508 file under `source-candidates/` is also reference-only because it differs from the SQL recorded by Production.

## Exit condition for #144

Normal migration workflows may resume only after:

- every Production version in the manifest has a matching executable migration file;
- no executable migration exists without a matching Production history row unless it is an explicitly reviewed new pending migration;
- recovered SQL is hash/semantic verified;
- the validator passes in strict mode;
- a final read-only Production/local comparison is recorded.
