# New Hope 7 — Project Control & Continuity

This file is the canonical handoff document for the New Hope 7 app project.
It exists so work can continue safely across ChatGPT conversations without losing decisions, ownership, or release state.

## 1. Project manager
- Primary project manager: ChatGPT in the user's active conversation.
- The project manager owns architecture, prioritization, security review, Supabase review, QA planning, release safety, checklist maintenance, and final acceptance review.
- A new conversation must NOT restart planning from scratch. It must first read this file and `docs/QA_MASTER_CHECKLIST.md` from the current working branch.
- No assistant should claim an item is complete without checking the repository/checklist and, where applicable, verification evidence.

## 2. Implementation delegation
- Codex may be used only for implementation tasks explicitly assigned by the user or by the project manager within the user's agreed workflow.
- Codex does not own project direction, release decisions, Production changes, or the master checklist.
- Large multi-file implementation/refactor/build tasks may be delegated to Codex; the project manager must review the result before merge/release.
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

## 5. Mandatory new-chat startup protocol
At the start of any new conversation that continues this project:
1. Read `docs/PROJECT_CONTROL.md` from the active development branch.
2. Read `docs/QA_MASTER_CHECKLIST.md` from the same branch.
3. Inspect the branch head / most recent relevant commits if exact current status is needed.
4. Continue from the highest-priority incomplete checklist item unless the user gives a different priority.
5. Do not ask the user to repeat known project history unless repository state is genuinely ambiguous.
6. Keep the master checklist updated after meaningful work.

## 6. Status vocabulary
- ⬜ Not started
- 🟡 In progress
- 🧪 Code/fix ready; needs real-device or backend QA
- ✅ Tested/verified
- 🚀 Included in approved release

## 7. Ownership model
### Project manager (ChatGPT)
- Architecture and technical decisions
- Root-cause investigation
- Security/Auth/RLS/Supabase design review
- Production-safety decisions
- Feature/fix specifications
- Review of delegated implementation
- QA scenarios and acceptance criteria
- Master checklist and progress reporting
- Final release readiness review

### Codex (only when intentionally delegated)
- Large multi-file implementation
- Broad refactors
- Larger UI implementation batches
- Build/packaging automation and heavy code-generation tasks
- Work must remain on an approved development/packaging branch until reviewed

## 8. Source of truth rule
If chat memory and repository documentation conflict, repository state and the latest explicit user instruction take precedence.
If repository documentation itself is stale, update it as part of the current work before proceeding.

## 9. Current continuity decision
The user wants one continuous management approach through the end of the project. Conversation changes must be treated as handoffs within the same project, not as a new project or a fresh redesign.
