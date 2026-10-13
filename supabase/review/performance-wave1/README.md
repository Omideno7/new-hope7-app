# Wave 1 backend review only — do not apply

No executable migration or Production SQL is added by Wave 1. Client caching, in-flight sharing and lifecycle changes do not require schema, RLS, Auth, Storage or data changes.

Existing candidates `../optimize_inbox_rls_cost_v1_candidate.sql` and `../optimize_school_registration_rls_cost_v1_candidate.sql` must not be copied into migrations or re-applied speculatively. Before considering another index/policy, obtain read-only current pg_indexes, FK constraints, pg_policies, cardinalities and EXPLAIN (ANALYZE only for safe SELECTs). The original 42-entry checkpoint is exact; the pre-existing v511 pending migration is outside this wave.

## Analytics ingestion proposal and security prerequisite

Legacy `nh7_track_app_section_v222`, `nh7_track_content_v223`, `nh7_track_audio_session_v222` are already no-ops in captured migration 20261003073335. Their old per-event callers must not be re-enabled. Existing Admin report v223 expects daily app/content rows and audio session summaries. Full current table definitions, unique constraints, ownership columns and RLS are not captured; therefore runnable write SQL guessing those contracts would be unsafe.

The client now preserves bounded UID-scoped local summaries without any analytics network request. A separately approved batch RPC should accept cumulative daily/session totals in batches of <=50. Derive the owner only from auth.uid(), never trust email/listener_key from payload. Reject anonymous requests. Validate identifiers, dates, language, duration caps and maximum payload bytes. Map UID to the existing report listener key server-side, preserving report semantics. Use an idempotency key (UID, client instance, day, section/content/session) and monotonic cumulative counters: retries must not add the same delta twice. Store at most daily aggregates and session summaries, not keystrokes, notes, profile content, raw events or media files.

Expected benefit: one small foreground/session/background batch can replace hundreds of per-event requests while preserving active users, section/content opens, listened duration and completion reports. This is feasible; analytics deletion is not recommended. Cloud ingestion/report freshness remains deferred until source metadata verification and explicit backend approval. The client keeps unsent summaries rather than falsely acknowledging them through the retired no-op RPCs.

Activation prerequisites: read-only schema/RLS verification, exact proposed function source with auth.uid()/idempotency checks, mixed anonymous/normal/admin and cross-UID test matrix, report reconciliation, payload validation, EXPLAIN and staging load test. Then explicit Production approval. No automatic probe or retry against a nonexistent analytics endpoint in Wave 1.

Rollback: disable the future batch capability first, leaving local unsent summaries intact; restore only the previous approved function definition/EXECUTE grants. Never drop/truncate existing report tables or overwrite rows. Preserve original client queues and notes. Any candidate SQL must include a schema-specific forward/rollback pair after metadata is known.

## Notes consolidation proposal

`user_notes` is keyed by (device_id, note_key) and supports device-bound/legacy compatibility. `nh7_account_notes` is keyed by (user_email, note_key) and is the current account-restore source. Explicit writes/deletes currently target both; School drafts/Bible marks have their own pathways. Keep both cloud backups during this wave. Their combined ~5.3 MB is <0.1% of the reported 6.8 GB Storage; replacing them will not address media egress.

Future consolidation requires read-only UID/email/device coverage counts and conflict inventory, a UID-keyed canonical adapter, additive dual-read/dual-write transition, reconciliation preserving both conflicting texts/timestamps, and account switch/offline/legacy rollback tests. Do not migrate/backfill/delete records automatically. Rollback switches readers to existing tables while preserving both sets and any newly queued edits. Data ownership must be server-enforced, not inferred solely from local cache.
