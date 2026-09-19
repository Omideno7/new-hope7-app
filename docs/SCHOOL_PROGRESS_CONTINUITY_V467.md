# School progress continuity — user requirement, 19 September 2026

The user explicitly requires that existing registrations, completed or partially completed work, grades, approvals, exam history, notes and downloads remain intact. Students must resume from their current stage; a new release must not send them back to the beginning or retroactively invalidate already accepted work.

## Immediate scope

School/audio transport and playback repairs are separate from rule activation. No new progression policy, production migration, approval change or exam-attempt reset is included in the v467 school/audio repair. All database inspection in this work was explicitly READ ONLY. No existing record was deleted or changed by the inspection.

## Before any new progression policy can be activated

1. Record a precise cutover and policy version, separately from the web asset/cache version. A browser refresh or store download must not be mistaken for a database migration.
2. Preserve each student's existing identity, registration, accepted lessons/assignments, grades and completed-course status. Do not regenerate IDs, zero progress, rewrite historical attempts or clear client storage.
3. Evaluate legacy partial-stage entitlement as well as completed-course graduation. A student already at a later stage must not become locked out merely because an earlier stage gained a new exam requirement.
4. Apply new requirements to the student's remaining work from the preserved stage. Where history is ambiguous, retain the records and flag for review rather than inventing completion or silently demoting the student.
5. Prove the transition on synthetic cases (new student, incomplete first class, mid-course, approved assignments, legacy final pass, partially used exam attempts, needs revision, multiple devices and reconnect). Compare before/after entitlements and unchanged record hashes in an isolated test database before requesting approval for any production migration.
6. A rollback must preserve newly submitted work; restoring old code is not permission to overwrite a live student database with an old snapshot.

## Important audit distinction

Current v351 SQL contains protection for previous completed-course graduates, but that alone is not proof that all partially progressed students retain their current stage under a stricter prior-class-exam gate. That prospective transition remains pending and must not be described as completed by this transport/player repair.

Read-only audit also inspected the current school audio recording function: it derives the user from authenticated JWT claims, keeps administrator approval checks and does not clear an existing completed_at on ordinary new playback. The repair does not modify that function.

Chat remains excluded from this release. No production Supabase schema/data, Edge Function, paid plan or project lifecycle changes are part of this work.
