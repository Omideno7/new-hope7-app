# School cycle / progression v580 — UNAPPLIED source

This package is not permission to deploy. No Production calls or student mutations are part of this task. The single generated School migration is under supabase/migrations and remains UNAPPLIED. Existing 42 checkpoint files and pending v511 are immutable.

The active backend has no enrollment generation. A real restart needs a new cycle tag on progress, assignments and attempts, retaining every historical row and primary ID. Generation zero represents existing evidence without a data backfill. New cycle writes must include the observed cycle and use current auth.uid; stale/old clients cannot write into the new cycle. Question selection, approved assignment units and weighted scoring are reused from the UID-first v128/v351 implementation.

Admin policy: existing server-proven owner authority only for these consequential academic controls. Current assignable v350 catalog covers registration review, not School academic overrides. No delegated privilege is inferred from registration access. Every action needs reason, explicit confirmation, expected cycle and idempotency ID, with server actor/timestamp/before/after audit. No Admin email is embedded.

Activation requires separately approved SQL review, exact live preflight, client/version compatibility and physical/Admin QA. Old Store clients without cycle and submission identities must receive an actionable update-required error rather than mutate a new cycle. Do not enable backend enforcement before the compatible client is adopted. Keep Document Studio/security/provider/strict registration/Full Delete activation independent and OFF.

Rollback must disable the v580 capability/writes while preserving new and old cycle rows, immutable submission receipts and Admin audit. Never rollback by removing a cycle column/unique key once multi-cycle data exists. Do not restore all-history legacy progression functions on multi-cycle accounts.
