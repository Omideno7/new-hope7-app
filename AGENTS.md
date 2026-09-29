# New Hope 7 — Agent Guardrails

Read docs/PROJECT_MASTER.md, docs/CURRENT_STATE.md, docs/DECISIONS.md and docs/NEXT_RELEASE_CHECKLIST.md before any work.

## Non-negotiable
- Never modify `main` directly.
- Never deploy Production without explicit user approval.
- Never modify Supabase Production schema, RLS, Storage policies, Edge Functions, or user data without explicit user approval.
- Never run destructive SQL.
- Never delete or migrate user data without explicit approval.
- Preserve Notes, Saved Verses, School Progress, assignments, profiles, graduation state and existing user content.
- Do not remove code merely because it appears unused.
- Do not delete branches/files during cleanup until they are classified and explicitly approved.
- Every implementation uses a feature branch based on `release/next-v250-preview`.
- Run relevant tests before proposing integration.
- Report every changed file, data risk, recurring cost and infrastructure impact.
- Merge to `main` only after explicit approval and release QA.

## Workflow
1. Inspect before editing.
2. State affected files and risks.
3. Implement only approved scope.
4. Test.
5. Update docs/CURRENT_STATE.md.
6. Never broaden scope silently.
