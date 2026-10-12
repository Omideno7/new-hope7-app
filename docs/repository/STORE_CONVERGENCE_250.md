# Store 2.5.0 convergence and canonical development gate

Follow-up source: current main `f91d13113f02ea0f13e506f64090d3f35c295f69`, synchronized runtime develop `4926ff6af0e89045e6fe8a060d189626b4d4e3bb`; see [MAIN_DEVELOP_SYNC_20261012.json](MAIN_DEVELOP_SYNC_20261012.json). PR #243 adds only the preserved Admin sermon orphan guard/loader; the Store/runtime comparisons below remain dated evidence against their stated inputs. No notification, native, backend or data behavior was changed by synchronization.

Sources at initial audit: main `67d829de0d8d4846e309a99bcd98c4c005b3b030`, pre-normalization develop `82544939da06f580351002dca5114b6bd8d0471e`, published Android `a177cdc7d995894868cf84bbe00c2dfa05ad6e25` (build 25002; **android-release-25002/www**), and authoritative iOS archive (build 25001; ZIP SHA256 `e5b6565049ef5025de48dc0d629501732880fa482f0990251b010f8fdc803b6b`). All 388 archive file hashes verified again. Its independent payload snapshot is `b62085749c41c21b9ca346a8439e80d065a3fd10` tagged `store/ios-2.5.0-25001-archive-payload`. This is not a branch-name-based parity claim.

Main is unchanged. Canonical develop is a **normal ancestry-preserving main→develop reconciliation**, retaining all existing 75 develop-only commits and current main's newer Documents work. No wholesale Store copy or active Draft PR merge occurs. Root/layout differences are not all "stale cache": four missing shared UI behaviors and mixed account-policy differences remain explicitly gated.

## Ancestry and Android-only decisions

`baseline/ios-2.5.0-approved` at dba24de9… and `release/2.5.0-rc` at ea556df6… are already ancestors of main/develop. Do not remerge them. Current Test5 branch is **374b9bfee12897922d82522e47efa4a8837b8b75**, advanced beyond 82efc731…; neither is the exact shipped archive. It stays temporarily only as PR #106's base.

Android has **8 commits not in main**. They are native Android legacy-WebView/polyfill, plugin, cache-upgrade, scroll/diagnostics or packaged-build changes (A/E); none is approved to overwrite current shared implementations. All exact tips and payloads are recoverable via Store/archive tags. **No Android branch is merged wholesale, and no new Android product port is claimed.** Reviewed responsive, Fold, Notes/Search/Inbox/theme/offline and identity behavior already on develop is preserved and tested. Every changed Git file (580) and every payload-file hash/classification is inventoried in `ANDROID_25002_DIFFERENCE_INVENTORY.md` / `STORE_PAYLOAD_COMPARISON_250.json`, including mixed B/F differences.

## Behavior matrix

| Feature/behavior | iOS 2.5.0 | Android 2.5.0 | Current main | New canonical result | Action taken | Reason |
|---|---|---|---|---|---|---|
| Home | Test5.8 welcome/tablet layout | Same shared app bytes as iOS | Current Home/v564; no full adaptive sidebar | Preserve canonical Home; full parity remains #241 | KEEP active #241 | No unreviewed iPad hero/native chrome integration |
| Profile/photo | Older crop/persistence plus full-screen viewer | Same viewer implementation | Newer v563/v564 persistence/header; viewer absent | Keep current photo logic and develop localized aria; viewer pending #241 | Retain reviewed current code | Never restore old profile bucket/backend |
| Notifications | Server OneSignal v335; legacy local IDs retired | Same notification and v364 binding bytes | Same client scheduler/binding | Client binding unchanged; reviewed develop sender-v18 source retained | Read-only audit | Web success does not prove native plugin/subscription/permission |
| Daily Word | 365-day data; fallback 07:00 device-local entry | Same data/notification client | Same core daily feature | Retained; actual delivery uses server/OneSignal | No schedule changes | Zagreb-vs-local policy difference documented; no backend writes |
| Faith | Daily faith content; fallback 12:00 | Same | Present | Retained | No port | Bundled data hashes represented |
| Daily Juice | Daily juice content; fallback 17:00 | Same | Present | Retained | No port | No missing bundled data/media |
| Gratitude | Plan/notes + fallback 21:00 | Same | Present | Retained | No port | No data rewrite |
| Bible | Written reader/audio/notes | Same shared reader feature | Newer current reader/data | Retained | Keep current implementation | No historical Bible copy |
| Bible deep links | Exact reference route/share | Same | Current v565 exact verse | Retained plus reviewed develop Search Apocrypha handling | Retain reviewed code | Do not downgrade route contracts |
| Audio | Published sermons/Bible/player | Same shared audio; Android bridge compatibility | Newer safe classic engine/player | Preserve engine + reviewed develop Fold layout | Retain reviewed layout only | No native touch suppression port |
| mini-player | Measured docking/runtime surfaces | Same + Android root cleanup | Current v487/v558 docking | Preserve reviewed develop docking; #241 native QA stays isolated | No old engine port | Mini-player safety regression required |
| School | Old snapshot/progression runtime | Same Test5 behavior | Newer durable identity/access rules | Retain existing reviewed develop School/UI + current main fixes | Normal ancestry reconciliation | No Store snapshot downgrade or Production migration |
| assignments | Legacy account/email paths | Same | Canonical identity/revision safeguards | Retain reviewed current paths | No old port | User assignments untouched |
| exams | Test5 exam/review code | Same | Newer v566 retry/final fixes | Retain newer reviewed code and Student IDs | No old port | No scoring/progression change |
| registration | Canonical v353/v342 client | Same bytes | Same client + newer RLS history | Keep current + reviewed Student Identity helper | No registration backend change | 42/42 migration history exact |
| Notes | Account merge/text normalization + plan reflection entries | Same shared bytes | Current Notes v544 merge/text; reflections absent | Keep reviewed merge; read-only reflection UI remains #241 | Preserve active feature head | No virtual-note deletion/account-write port |
| saved verses | Reader saved refs/marks | Same | Current exact saved/deep-link behavior | Retain current, reviewed Apocrypha Search fix | No storage rewrite | No loss/clear of user marks |
| Plans | Existing progression + reflection aggregation | Same | Current themed Plans; reflection aggregation missing | Retain themed progression; aggregation gate #241 | No progression port | Open reflections without start/progress mutation requires acceptance |
| Community | Older v502 testimony/prayer modules | Same | Newer safeguards and admin feedback | Preserve newer current main/develop | No old port | No wholesale community CSS/runtime copy |
| Testimonies | Store delete/recording implementation | Same | Newer permanent-delete/orphan verification | Retain newer implementation | No Store deletion logic port | User content/storage untouched |
| Prayer Requests | Store prayer UI | Same | Current reply/feedback fixes | Retain current reviewed fixes | No old port | No user prayer mutation |
| Library | Older Store security/cache graph | Android native cache/updater patches | Current v125.5 secure Library | Retain reviewed develop public-only v125.6 TTL fence/current entitlement checks | No older Library copy | Never cache Ministers through public TTL or weaken auth |
| Documents | Historical Studio/public output | Same historical modules | Reviewed v520 main | Main v520 reconciled into develop; V2 stays Draft #240 | Keep #240 exact head | Backend/manual/native gates not complete; do not merge unfinished V2 |
| Search | Historical v540/direct audio helpers | Same | Newer exact v562 | Keep v562 with reviewed develop Apocrypha direct-open fix | Retain reviewed implementation | No old Search import |
| Inbox | Older presentation and fanout client | Same | Present; older internal sentence/time paths | Keep reviewed develop localized timestamps/internal-copy fix/shared sync TTL | Retain reviewed fix | Real badge/read-state verifier; no backend notification change |
| themes/appearance | Additional mixed dark/palette overlays | Same | Newer appearance/theme propagation | Retain reviewed v571/current appearance; older unproven overlays not copied | No wholesale CSS | Byte differences do not establish a reproduced contrast bug |
| cache/service worker | 5.4.0-qa250 graph; archive updater path | Native upgrade cache-refresh guard | Network-first navigation/current Library graph | New isolated executable cache 5.4.7; stable data/reader/download caches retained | Cache version reconciliation only | No user-data clear; native upgrades require wrapper acceptance |
| Supabase data behavior | Some legacy Soul/Growth/School restore policies | Same shared policies | Newer Notes/identity/security; Soul local-first | Retain reviewed canonical data policy; Soul/Growth differences require separate data-safety review | F gate documented; historical bytes tagged | Do not infer that unique old data code belongs in canonical app |
| native scroll behavior | Unscoped iOS rubber-band suppression | iOS guard scoped; Android compatibility/root/Amen cleanup | Web canonical scrolling | Never copy unscoped touch prevention; Android-only 8 commits archived for wrapper reference | A/D/E, no product port | Phone/fold native behavior must be implemented/accepted in approved wrapper |
| safe area behavior | Store iOS inset/fixed chrome | Android layout/root rules differ | Current Web safe areas; develop responsive v570 | Retain current; newer physical #241 safe-area work held for approval | No unfinished native merge | Chromium does not certify WKWebView status/home-indicator behavior |
| push/notification integration | Generated Cordova OneSignal iOS bridge | Native Android bridge with older-WebView fixes | Web SDK/worker + same account-binding v364 | Shared JS kept; native plugin/config evidence remains platform-specific | No plugin/backend change | 07:00 diagnosis still needs actual device subscription/OS/cron evidence |
| Soul Tracker / Growth restore | Historical account merge/seed behavior | Same shared implementation | Different local-first/restore policy | Retain current; manual data-policy gate | F, no unvalidated write port | Source retained by exact Store snapshot tags |

## Gates that prevent develop → main release now

- #240 `822b7062302d5f9c60fa1e1caacd0c2e8a56f4c2`: full Documents V2 implementation remains Draft; proposed backend source is review-only, physical/manual acceptance pending. Preserve head; no cleanup-driven merge.
- #241 `a4c2ca0e90708a4743bd8be3d367e752510c609c`: browser-capable sidebar, full-screen viewer, measured chrome and virtual plan-note aggregation exist here, with physical safe-area/hero/native acceptance still pending. Preserve head, not overwrite it with historical mobile files or partial duplicate work merely to remove a branch.
- #106 `8a58086289aa1fa0d9d845f76b574a9422adc63d`: open WatchOS Draft, CI green but companion integration explicitly unvalidated. Keep head and current Test5 base until owner QA and safe retargeting; delete both after approved develop integration or explicit abandonment.
- Mixed Soul/Growth/account/native plugin policies need targeted behavior/data-safety acceptance; do not weaken server security or write user records to simulate parity.

Archiving removes branch clutter, not these product gates. Tagged exact Store bytes ensure no historical implementation is destroyed. Canonical release behavior is not claimed complete until remaining acceptance is demonstrated. Therefore **no develop → main merge or deployment is authorized by this execution's evidence**, even if all automated gates pass.
