# Codex Wave 8 Physical Fix Batch 1 — Critical/Core Stability

Read first:
- `AGENTS.md`
- `docs/DEVELOPMENT_WORKFLOW.md`
- `docs/qa/WAVE8_PHYSICAL_FIX_MASTER_SPEC.md`
- current Wave 8 / Wave 7.5 QA reports and existing tests relevant to changed areas.

## Start / branch discipline

This task is normal development work. Work **only on `develop`**. Do not create a branch or PR. Before editing:

1. Fetch remote.
2. Print repository, branch, current SHA, upstream and target.
3. Confirm `develop` is current and reconcile any concurrent remote advance rather than overwriting it.
4. Record the exact starting `develop` SHA in the final report.

Do not touch `main`. Do not deploy, release, mutate Production Supabase, activate providers/security/document issuance, issue a real document, delete/backfill/reset user data or weaken RLS/Auth.

## Scope — implement only this batch

### B1. Login post-success hang

Physical evidence: after successful login on the QA app, the UI has hung/frozen and required force-close/relaunch.

Requirements:
- Reproduce/trace the login-success transition and current-account bootstrap before changing code.
- Inspect auth/session restore, profile/photo bootstrap, Inbox central startup sync/fallback, route transition, reconnect coalescing, School/account refresh and any blocking overlay/pending promise.
- Fix the actual cause; do not mask with arbitrary timeouts/reloads.
- Global shell must remain interactive after success/failure/retry.
- Add regression coverage for successful login, failed dependent fetch, repeated login/account switch and stale/delayed responses.

### B2. Soul Winning load failure + global freeze

Physical evidence on iPhone and iPad:
- entering `نجات جان‌ها` shows the temporary-unavailable/retry error;
- after the error, the whole app becomes effectively frozen and requires force-close.

Requirements:
- Identify the real failing request/authority/data contract/route behavior.
- Fix the load failure if it is a client defect or safely surface the true server-unavailable state if external/backend-dependent.
- Regardless of upstream failure, error UI must be recoverable: Back/nav/retry/global shell stay usable; no overlay, focus trap, unresolved modal or disabled-shell state may survive.
- Never weaken authorization or expose private data to make the page load.
- Add tests for success, request failure, retry, navigation away during failure and account switch.

### B3. Admin Workspace Return to App

Physical evidence: once the user enters Admin Workspace from the app, there is no visible way back to the user app; force-close/relaunch is required.

Requirements:
- Add a clear localized `Return to App` / equivalent control in the persistent Admin top-level UI.
- Return to the normal app without logging the user out or discarding the valid session.
- Preserve owner/admin authorization boundaries and browser/native history safety.
- FA/EN/HR + RTL/LTR + phone/tablet responsive behavior.

### B4. Document Studio V2 entry is a no-op

Physical evidence: Admin → Documents exposes both legacy Documents and `New Hope 7 Document Studio Version 2`; legacy opens, V2 tap visibly does nothing.

Requirements:
- Trace the current intended V2 entry, owner check, module loading and navigation.
- Make the visible V2 entry open the intended V2 Studio/QA surface for an authorized owner/admin.
- The source/editor/preview QA surface may open; **real Production issuance must remain disabled** exactly as current activation gates require.
- Do not flip backend-ready/server issuance flags, apply review SQL or issue any real document.
- Unauthorized/normal user direct access remains denied.
- Add regression coverage for authorized entry, unauthorized direct URL, disabled issuance and return navigation.

### B5. Consolidate `My Profile` and `Account`; one canonical photo

Physical evidence:
- More currently contains both `پروفایل من` and `حساب کاربری`.
- Each can hold a different photo, creating two profile identities.
- A previously set account photo did not restore after later login.

Requirements:
- Audit both routes/features/data stores before removing anything.
- Make `Account` the sole canonical user-profile authority.
- Remove the duplicate `My Profile` entry only after migrating/preserving every unique capability that is still required.
- Establish one canonical account-owned profile photo source keyed by authenticated user identity, not by transient page/local-only state.
- Existing user photo must not be deleted or silently replaced. If multiple legacy candidate photos exist, implement deterministic safe precedence/migration compatible with existing users and document it.
- Login/relaunch/account A→B→A must never leak another account's photo.
- All app surfaces showing the user photo must resolve the same canonical photo state.
- Preserve account deletion/logout behavior; do not alter Production data destructively.
- Add regression coverage for old profile data, login restore, logout/login, A/B account switch, missing photo and upload/update/remove flows.

### B6. Bible Study Plans contextual Back

Physical evidence on iPhone/iPad: after entering a Bible study plan/detail flow, there is no contextual Back; user must escape through bottom navigation.

Requirements:
- Add correct Back/navigation semantics within Plans flow.
- Back returns to the actual previous level/state, not blindly Home.
- Preserve plan progress, selected plan and appropriate scroll state.
- Direct/deep entry must still have a sensible safe exit.
- Add phone/tablet regression coverage.

### B7. Password visibility control placement

Physical evidence on iPad: the eye icon for showing/hiding password renders below/outside the password input.

Requirements:
- Keep visibility toggle visually inside the password field.
- Correct logical-side placement for RTL/LTR.
- Stable on iPhone/iPad, portrait/landscape, keyboard visible, Dynamic Type/font scaling.
- Maintain accessible label, adequate hit target and password semantics.
- Toggling must not submit, lose cursor unexpectedly or trigger page scroll.

### B8. Route/focus/scroll safety for this batch

Do not implement the full Batch-2 redesign here, but fix any shared navigation primitive required by B1–B7:
- opening a new destination starts at its logical top/target;
- Back may restore prior position where appropriate;
- no stale modal/overlay/focus trap may lock the app;
- no navigation fix may regress bottom-nav routing or accepted deep links.

## Out of scope for Batch 1

Do not yet implement the full iPad Bible/Daily/Audio master-detail redesign, Home hero redesign, Inbox redesign, Church Connect, Christian Calendar content expansion, Q&A deletion, My Documents relocation, Notes editing expansion, storage dashboard, notification preference redesign or theme/motion overhaul. Those remain in later batches in the master spec.

## Validation / evidence

- Preserve all existing required Wave1–8 tests and guards.
- Add focused tests for every fixed defect where automation can model it.
- Run syntax/static checks for every changed JS/module.
- Run the full required `Validate Develop` workflow for the exact final head.
- Do not skip/relax an existing assertion merely to get green CI.
- Check startup/idle request behavior for accidental polling or recurring backend-cost regression.
- No physical-pass claim. The final report must explicitly mark these fixes as awaiting rebuild/device retest.

## Final report

Commit implementation normally to `develop`. Report:
- starting `develop` SHA;
- each implementation/follow-up commit SHA;
- concise root cause + fix per B1–B7;
- tests added/changed;
- exact final `develop` SHA;
- exact-head CI run/conclusion;
- confirmation `main` unchanged;
- confirmation no Production/backend/provider/security/document activation occurred;
- any item that could not be proven/fixed, with exact blocker rather than a fabricated PASS.

Stop after Batch 1. Do not start Batch 2 without the next instruction.