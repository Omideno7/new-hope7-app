# NEW HOPE 7 REPOSITORY RULES

1. Read AGENTS.md before changing code.
2. Production branch is `main`.
3. Normal development/integration branch is `develop`.
4. Do not create a new branch unless the user explicitly authorizes it.
5. Do not invent `agent/*`, `codex/*`, `fix/*` or `backup/*` branches.
6. Before editing, print repository, current branch, current SHA, upstream and target branch.
7. Normal development changes go to `develop`; fetch/check for concurrent work first.
8. Never commit directly to `main` except an explicitly approved release/convergence operation.
9. `main` must contain only reviewed, release-ready state. Never force-push or rewrite its history.
10. Web, iOS and Android releases must reference the exact same approved canonical `main` SHA for shared Web assets.
11. Native wrappers/configuration may differ; the shared application payload must come from that exact canonical SHA. Record any generated native-only files separately.
12. Never copy historical branches wholesale into current code; port validated behavior cleanly.
13. Never weaken Supabase RLS/Auth/security to make an old client work. No Production deployment/migration/data mutation without explicit approval.
14. Never clear user data/storage as a release shortcut.
15. Run required CI/regressions and required physical QA before proposing `develop` → `main`; green automation does not substitute for device acceptance.
16. Delete an explicitly authorized temporary branch after its reviewed integration; preserve historical releases in immutable annotated tags, not backup branches.
17. Report the exact SHA in every delivery message.

See `docs/DEVELOPMENT_WORKFLOW.md` and `docs/RELEASE_PROVENANCE.md`. Existing Draft PRs #240/#241/#106 and #106's base are temporary exceptions with documented acceptance/removal gates; do not merge or close them just to reduce branch count. An archival tag preserves history, not approval to deploy that historical code.
