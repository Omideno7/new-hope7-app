# Permanent development and release workflow

`develop` → automated QA → physical iOS/Android/Web QA where required → explicit release approval → normal `develop` → `main` integration → Web/iOS/Android builds from the **same exact approved main SHA**.

## Single development branch rule

For normal work there are only two active workflow roles: **`develop` for all coding/testing** and **`main` for approved release/Production**. Every agent must work directly on `develop` after fetching current remote state. Do **not** create `feature/*`, `fix/*`, `codex/*`, `agent/*`, `test/*`, backup, experiment or per-task PR branches unless the user explicitly authorizes that exact exception. Normal QA happens on `develop`; after user approval, the reviewed `develop` state is integrated into `main`.

- `main` is the reviewed release source and default branch. No direct routine edits, force pushes or history rewrite.
- `develop` is the only normal development/integration branch. Before editing, print repo/branch/SHA/upstream/target, fetch and check for another agent's work. Commit normally here. If the remote advances, reconcile the actual work rather than overwriting it.
- All normal development must reach `develop` first. Never create a temporary branch and merge it directly into `main`; `main` receives only explicitly approved release integration.
- A new temporary branch needs explicit user authorization. Do not create another permanent agent/codex/fix/backup branch. Delete an authorized temporary head after reviewed integration.
- Historical Store/build/checkpoint/unique experiments use immutable annotated tags. The before-cleanup JSON records exact names and tips; the tag manifest and after-cleanup report explain recovery. Never reset main to a historical Store tree.
- Active #240 Documents V2 and #241 mobile/Web QA retain their exact heads and Draft status. #106 WatchOS and its Test5 base remain temporary pending companion/device acceptance and safe retargeting. No unfinished Draft is merged just to clean branches. Their acceptance gates are in `docs/repository/STORE_CONVERGENCE_250.md`.
- Required checks: current app/Admin wiring, changed JS/modules, Community, Notes, School/registration/exams, audio, Plans, appearance, current Documents, migration parity, responsive/theme/offline checks, optimization, worker/cache safety and `git diff --check`. `Validate Develop` runs automatically on pushes and has no deployment permission/job.
- A Draft integration PR may expose `develop` for review while required Store/device gaps remain. Do not mark it release-ready until those gates are actually complete. Backend review SQL is not permission to apply it.

## Release provenance

After approval, use an exact main commit, not a dirty working tree or a similarly named historical branch. Export shared assets from that SHA. Preserve each approved native wrapper's dependency/signing/plugin configuration; generated native bridges/config may differ, application modules may not silently come from an older payload. Generate `build-metadata.json` using `scripts/record-build-metadata.py` and keep it with each artifact. The recorder hashes actual exported files; a hash detects accidental local/index/app edits that a version label misses.

Set the platform/version/build explicitly. Production mode refuses a shared source other than current local `origin/main`; fetch first. A SHA match is a necessary source condition, not release approval or proof of native signing. Never include credentials in metadata. Update `docs/RELEASE_PROVENANCE.md` with main/develop source, CI/build run, wrapper provenance, artifact hash and signing/archive evidence. Store labels alone do not prove payload identity.

Physical acceptance covers real WKWebView/Android WebView (safe areas, navigation, native print/share, offline/plugin behavior, notifications) in addition to Web desktop/mobile. Record exact installed SHA, OS/device, permissions and evidence. Do not assume deleting branches fixes notification delivery.

## Recovery

Use a preserved tag to inspect/recover historical source. Restoring a remote branch still requires explicit authorization; do not bulk recreate the deleted clutter. `store/ios-2.5.0-25001-archive-payload` is the exact verified embedded public tree in an independent snapshot, not the native Xcode project; its lineage tag is separate and explicitly not byte-identity evidence. Archival tags must not be force-updated.
