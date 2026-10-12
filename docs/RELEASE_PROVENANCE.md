# Release provenance — verified 2026-10-12

## Current production / Store references

| Platform | Approved/historical source | Exact source/provenance | Workflow/archive |
|---|---|---|---|
| Web | current main | `f91d13113f02ea0f13e506f64090d3f35c295f69` | Maintainer squash-merged PR #243; successful existing Pages validation/deploy run **38232212806**, Pages deployment **38232212310**; neither deployment was initiated by this synchronization |
| iOS | 2.5.0 / 25001 | Actual signed archive's App.app/public; independent verified snapshot `b62085749c41c21b9ca346a8439e80d065a3fd10` | `App 10-5-26, 4.09 am.xcarchive`; Products/Applications/App.app/public; 388 per-file hashes |
| Android | 2.5.0 / versionCode 25002 | `a177cdc7d995894868cf84bbe00c2dfa05ad6e25`, payload `android-release-25002/www` | Successful published build run **37388172102** |
| Development before normalization | develop | `82544939da06f580351002dca5114b6bd8d0471e` | Checkpoint tag preserves every existing unique commit; normal main merge only |

Initial cleanup validated runtime candidate: `15b961e34d05307a03af33ae655228355213c153`, CI run **38217685825**. Final inventory commits are documentation-only and their exact head is recorded in the integration PR/delivery.

The initial cleanup completed at develop `491c7b3625092d8322020fc696d222a2e256a2b8`, while main was `67d829de0d8d4846e309a99bcd98c4c005b3b030`. Subsequently the maintainer merged PR #243 into main at `f91d13113f02ea0f13e506f64090d3f35c295f69`. The follow-up normal main→develop merge is `2be63e8ef0ab5b4ef265ad4ce3a8c038c4fcd7a1`; a second tree-identical ancestry merge preserves the original squash-merged PR tip `00baef33aa408ffb7631c4f2774ef8fe7967c0d7` at synchronized runtime candidate `4926ff6af0e89045e6fe8a060d189626b4d4e3bb`. No develop commits were dropped and both PR #243 files are byte-identical to main.

Current fetched release source is main `f91d13113f02ea0f13e506f64090d3f35c295f69`. The follow-up did not change main or deploy. Current develop's exact final documentation SHA and its CI are recorded in Draft PR #242 and delivery, avoiding a self-referential hash. [Follow-up evidence](repository/MAIN_DEVELOP_SYNC_20261012.json) records the exact main/develop runtime capture, merge parents, original PR tip, file hashes, verified branch deletion and seven remote branches (including an unrelated concurrent branch, left untouched). Historical cleanup inventories remain immutable dated evidence.

### Authoritative iOS distinction

[Archive public ZIP](https://github.com/Omideno7/new-hope7-app/releases/download/untagged-df25c41694977d63b610/ios-2.5.0-25001-App.app-public.zip) SHA-256: **e5b6565049ef5025de48dc0d629501732880fa482f0990251b010f8fdc803b6b**. Full manifest: `docs/repository/IOS_25001_SHA256SUMS.txt`. Recover exact embedded Web bytes from annotated tag `store/ios-2.5.0-25001-archive-payload`; the tagged independent root snapshot was created only after verifying every Git blob round-trips to the archive bytes. It is not a native-project reconstruction or a claim to preserve signed executable/signing files not supplied here.

Lineage tag `store/ios-2.5.0-25001-git-lineage` points to `dba24de9b35316e5e0a72d83966954988ecd0046`. **It is not byte-identical to the shipped archive.** Candidate Git `82efc731c64f76c051528ae01189521bee0ee8b9` and run **37202333319** corroborate Test5 lineage only. Archived index/app differ from that HEAD. Current Test5 branch advanced to 374b9bfe…; do not substitute its newer Library edits for shipped bytes.

### Immutable recovery references

`store/android-2.5.0-25002`; `store/ios-2.5.0-25001-git-lineage`; `store/ios-2.5.0-25001-archive-payload`; `checkpoint/pre-branch-cleanup-2026-10-12`; `checkpoint/pre-branch-cleanup-develop-2026-10-12`; `checkpoint/pr240-2026-10-12`; `checkpoint/pr241-2026-10-12`; `checkpoint/pr106-2026-10-12`. Full exact SHA/annotation manifest in `docs/repository/TAG_PRESERVATION.json`.

## Future releases

Web/iOS/Android shared application assets must originate from the same exact approved main SHA. Native signing, plugin bridges/config and generated platform files may differ and must be recorded explicitly. Export Git bytes, not a dirty worktree. Use `scripts/record-build-metadata.py` to verify actual shared bytes against that Git SHA, detect missing active dependencies, and record Git SHA/version/build/timestamp/platform plus per-file hashes outside the payload. Attach it to build outputs. No secrets are recorded. Production mode requires fetched origin/main and never performs deployment or substitutes for approval.

Keep this ledger updated with every release: approved main/develop source, CI/build run, actual native wrapper/archive, metadata/artifact hash and device acceptance. The cleanup creates no new production release.
