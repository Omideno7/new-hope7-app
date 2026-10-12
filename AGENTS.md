# NEW HOPE 7 REPOSITORY RULES

1. Read AGENTS.md before changing code.
2. Production branch is `main`.
3. **STRICT SINGLE-DEVELOPMENT-BRANCH POLICY:** `develop` is the only normal branch for coding, agent work, fixes, experiments and QA/testing.
4. Do not create a new branch or PR head for normal work. A new branch is allowed only when the user explicitly authorizes that specific branch.
5. Do not invent `agent/*`, `codex/*`, `fix/*`, `feature/*`, `test/*` or `backup/*` branches. Agents must continue on `develop`, fetch first, and reconcile concurrent work there.
6. `main` is the release/Production source branch. Normal release flow is `develop` → required QA → explicit user approval → `main`.
7. Before editing, print repository, current branch, current SHA, upstream and target branch. If normal work is not on `develop`, stop and move the work into `develop` without creating another remote branch.
8. All normal development changes and tests go to `develop` first; fetch/check for concurrent work first. Never bypass `develop` and never merge normal development directly into `main`.
9. Never commit directly to `main` except an explicitly approved release/convergence operation.
10. `main` must contain only reviewed, release-ready state. Never force-push or rewrite its history.
11. Web, iOS and Android releases must reference the exact same approved canonical `main` SHA for shared Web assets.
12. Native wrappers/configuration may differ; the shared application payload must come from that exact canonical SHA. Record any generated native-only files separately.
13. Never copy historical branches wholesale into current code; port validated behavior cleanly.
14. Never weaken Supabase RLS/Auth/security to make an old client work. No Production deployment/migration/data mutation without explicit approval.
15. Never clear user data/storage as a release shortcut.
16. Run required CI/regressions and required physical QA before proposing `develop` → `main`; green automation does not substitute for device acceptance.
17. Delete an explicitly authorized temporary branch after its reviewed integration; preserve historical releases in immutable annotated tags, not backup branches.
18. Report the exact SHA in every delivery message.

See `docs/DEVELOPMENT_WORKFLOW.md` and `docs/RELEASE_PROVENANCE.md`. Existing Draft PRs #240/#241/#106 and #106's base are temporary exceptions with documented acceptance/removal gates; do not merge or close them just to reduce branch count. An archival tag preserves history, not approval to deploy that historical code.
