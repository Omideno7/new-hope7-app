# New Hope 7 — Project Control & Continuity

This file is the canonical handoff document for the New Hope 7 app project.
It exists so work can continue safely across ChatGPT conversations without losing decisions, ownership, or release state.

## 1. Project manager
- Primary project manager: ChatGPT in the user's active conversation.
- The project manager owns architecture, prioritization, security review, Supabase review, implementation, QA planning, release safety, checklist maintenance, and final acceptance review.
- A new conversation must NOT restart planning from scratch. It must first read this file and `docs/QA_MASTER_CHECKLIST.md` from the current working branch.
- No assistant should claim an item is complete without checking the repository/checklist and, where applicable, verification evidence.

## 2. Implementation delegation
- Current execution rule: ChatGPT handles the project work directly.
- Codex is parked. It may be used only when the user explicitly asks for or explicitly authorizes a specific Codex task.
- The project manager must NOT autonomously delegate work to Codex merely because a task is large, multi-file, a refactor, or a build task.
- If the user explicitly authorizes Codex, Codex remains implementation-only and does not own project direction, release decisions, Production changes, or the master checklist.
- Do not introduce any other coding agent or autonomous project manager unless the user explicitly asks for it.

## 3. Production safety rules
- Do not change App Store Production, Google Play Production, Web Production, or Supabase Production for ordinary development work.
- Production changes require explicit user approval unless the user has already explicitly approved a specific hotfix action.
- Preserve user data: Notes, Saved Verses, School Progress, assignments, saved items, and existing Production data.
- Supabase Production schema/storage/policy mutations require explicit user approval.
- Work incrementally in small reviewable batches; avoid giant merges.

## 4. Current repository state
- Repository: `Omideno7/new-hope7-app`
- Active development branch: `batch2/critical-stability-v300`
- Master checklist: `docs/QA_MASTER_CHECKLIST.md`
- This file: `docs/PROJECT_CONTROL.md`
- `main` currently represents the deployed Web/Admin line and is NOT a complete representation of the newer 2.5.0 development payload.
- As of 2026-10-07, `main` and the active development branch have diverged. Do not perform a blind merge. Reconcile Production hotfixes into the development branch selectively, then perform a controlled source-parity pass before release freeze.

## 5. Mandatory new-chat startup protocol
At the start of any new conversation that continues this project:
1. Read `docs/PROJECT_CONTROL.md` from the active development branch.
2. Read `docs/QA_MASTER_CHECKLIST.md` from the same branch.
3. Inspect the branch head / most recent relevant commits if exact current status is needed.
4. Compare `main` and the active branch before any release or Web parity work.
5. Continue from the highest-priority incomplete checklist item unless the user gives a different priority.
6. Do not ask the user to repeat known project history unless repository state is genuinely ambiguous.
7. Keep the master checklist updated after meaningful work.

## 6. Status vocabulary
- ⬜ Not started
- 🟡 In progress
- 🧪 Code/fix ready; needs real-device or backend QA
- ✅ Tested/verified
- 🚀 Included in approved release

## 7. Ownership model
### Project manager / implementer (ChatGPT)
- Architecture and technical decisions
- Root-cause investigation
- Security/Auth/RLS/Supabase design review
- Production-safety decisions
- Feature/fix implementation
- QA scenarios and acceptance criteria
- Master checklist and progress reporting
- Final release readiness review

### Codex
- No scheduled work by default.
- Can receive a narrowly defined implementation task only after explicit user authorization.
- Any Codex result must remain on an approved development/packaging branch until ChatGPT reviews it.

## 8. Source of truth rule
If chat memory and repository documentation conflict, repository state and the latest explicit user instruction take precedence.
If repository documentation itself is stale, update it as part of the current work before proceeding.
The newer app payload must not be inferred from Web `main`; source parity must be explicitly verified before final merge/release.

## 9. Current continuity decision
The user wants one continuous management approach through the end of the project. Conversation changes must be treated as handoffs within the same project, not as a new project or a fresh redesign.
