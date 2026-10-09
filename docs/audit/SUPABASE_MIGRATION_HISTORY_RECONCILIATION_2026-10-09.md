# Supabase Production migration-history reconciliation — 2026-10-09

## Release-safety rule

Until GitHub Issue #144 is closed, **do not run `supabase db push` against Production**.

Production migration history and `main/supabase/migrations` drifted because some changes were applied through controlled SQL/migration actions without the exact Production versioned file being committed, while several School/Admin SQL files were kept under `supabase/migrations` even though no matching history row exists.

Stage A removed the immediate replay hazard. Stage B recovered the exact SQL recorded by Production. The captured 16-migration Production checkpoint now has byte-for-byte source parity in `supabase/migrations`.

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

## Stage B — exact recovery complete

All 11 previously missing Production-applied migrations were recovered from `supabase_migrations.schema_migrations.statements`. The five files that previously had only semantic parity were also replaced with the exact recorded SQL. A fresh clone verified **16/16 raw MD5 matches and 0 differences** against the captured Production history.

The validator now locks the captured checkpoint by exact filename, version, name, and raw MD5. Canonical migrations newer than the checkpoint are reported as pending; `--strict` additionally rejects pending migrations for a full checkpoint-only audit.

## Archived local-only files

The files under `supabase/review/migration-history-reconciliation-20261009/legacy-applied-outside-history/` are retained as forensic/source references only. They are intentionally outside the executable migration directory.

The v508 file under `source-candidates/` is also reference-only because it differs from the SQL recorded by Production.

## Exit condition for #144

The source-history portion of this exit condition is now satisfied:

- every captured Production version has a matching executable migration file;
- all 16 captured files match Production by raw MD5;
- no unrecorded historical executable migration remains at/before the checkpoint;
- the validator passes in strict mode.

A final read-only Production/local comparison after Stage B is merged to `main` is the remaining gate before Issue #144 can be closed.
