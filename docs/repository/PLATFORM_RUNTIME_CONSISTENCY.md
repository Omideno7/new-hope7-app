# Platform runtime consistency — read-only source audit

Inputs: main `67d829de0d8d4846e309a99bcd98c4c005b3b030`, published Android `a177cdc7d995894868cf84bbe00c2dfa05ad6e25`/www, authoritative iOS 2.5.0/25001 archive (SHA256 `e5b6565049ef5025de48dc0d629501732880fa482f0990251b010f8fdc803b6b`), and reviewed pre-existing develop source `82544939da06f580351002dca5114b6bd8d0471e` plus normal main reconciliation. Exact client source hashes are in `PLATFORM_RUNTIME_SOURCE_HASHES.json`. No Production schedule/subscription/data query, secret access, cron invocation or deployment was performed. Thus current installed permissions/OS/plugin registration and live schedules/dispatch cannot be inferred from source alone.

## Confirmed common configuration

- Supabase project URL/ref: `https://gpzcwffxnddhaeaogdyo.supabase.co` / `gpzcwffxnddhaeaogdyo`; current client account/registration paths retain this project. Publishable keys are not secrets and are not reproduced here.
- OneSignal App ID: `86f4116a-707a-4959-aa3f-7c703f57bf7e`. Web uses its Web SDK + scoped `push/OneSignalSDKWorker.js`; native uses generated Cordova/plugin bridge and `window.plugins.OneSignal`.
- `nh7-notifications-zagreb-v334.js` and account-binding v364 are **byte-identical in iOS archive, Android www and main**. So those JS files alone do not explain a Web-only delivery discrepancy.
- v364 binds `auth.users.id` as external ID, never raw email tags, confirms native external ID/subscription state and polls binding every **2500 ms**, with focus/online/visibility/session hooks. Language and device tags matter to delivery. No binding code is changed.
- Canonical registration v353 and school-registration v342 are identical across the three shipped/current Web sources; newer reviewed Student Identity/RLS history is retained in develop, not deployed by this task.

## 07:00/local vs Zagreb: actual implementation distinction

Client fallback schedule rows still list Daily Word **07:00**, Faith 12:00, Juice 17:00 and Gratitude 21:00 with `timezone_mode:'local'`; meetings use Europe/Zagreb. But the shared v335 notification module **retires/cancels legacy local IDs 17000–19999 and filters them out of LocalNotifications.schedule**. It tags notification source `server_v335` and notification clock Europe/Zagreb. Therefore an installed native app is not guaranteed to retain a local 07:00 reminder simply because the fallback row exists.

Web push and native push use different SDK transports/permission states. Native initialization waits for the real bridge or `deviceready`, then requests permission from a user gesture. Web registration/opt-in is its own channel. A working Web subscription does not prove native subscription, permission/APNs/FCM/signing/plugin compatibility or external-ID/tag state.

Develop already tracks the reviewed sender-v18 synchronization from PR #217. It reads active `notification_schedules`, uses `Intl.DateTimeFormat(... timeZone:'Europe/Zagreb')`, dispatches in a **0–4 minute window**, claims/deduplicates runs, excludes admin user pushes, and stores three shared language Inbox rows rather than per-user fanout. Its `due()` does not branch on the row's `timezone_mode`; server scheduling is Zagreb-based. Use **Europe/Zagreb**, not a fixed CET offset: summer CEST/DST differs. Main's older checked-in sender uses historical OneSignal time-zone scheduling and fanout; repository source is not proof of which Edge version is deployed now. This task preserves reviewed develop source and makes no Edge/backend change.

The separately reported PR #241 R7/R8 QA wrapper dependency list contains Capacitor LocalNotifications but no OneSignal package. It is not the signed Store archive and is unavailable on this Linux workspace. If the failing installation is that QA wrapper, do not treat it as evidence of Production push parity; inspect its actual native bridge separately rather than adding plugins/signing changes during repository cleanup.

### Evidence still required to diagnose the actual native 07:00 failure

Read-only operator checks: exact installed payload/build metadata; native plugin/OS permission and push subscription ID/opted-in/external-ID (without publishing private IDs); OneSignal native-vs-Web delivery result/tag targeting; actual active schedule time/timezone; cron execution inside the Zagreb dispatch window and dispatch logs; whether the desired product policy is server Zagreb time or device-local time. Check iPhone/iPad/Android independently. **Branch cleanup does not fix notification delivery, and no unsupported root-cause claim or Production write is made.**

## Worker/cache/polling differences

| Area | iOS archive | Android published | Main / canonical develop |
|---|---|---|---|
| Entry/cache graph | Test5.8, `5.4.0-qa250` | Native payload/updater graph and compatibility bootstrap | Main 5.4.4; reviewed develop 5.4.6; reconciled executable cache **5.4.7-canonical-consolidation** |
| Navigation worker | Same network-first helper bytes | Same | Kept; no user-data cache purge |
| Native upgrade updater | Older worker path | Explicit native early return/resource cache refresh | Native behavior not wholesale ported into Web |
| Inbox refresh | Older open/fanout behavior | Same shared app bytes | Reviewed develop uses 2-minute shared snapshot TTL and 15-minute visible/online badge poll; no forced per-open fanout |
| Library metadata | Historical cache/security client | Native update/cache additions | Current entitlement-secure source retained; reviewed 2-minute TTL is **public-only** items AND collections, never Ministers |
| School approval cache | Older Test5 snapshot logic | Same shared logic | Current 60-second approval cache + durable identity semantics retained; no downgrade |
| Background hooks | Web worker + native lifecycle | Android legacy WebView/polyfill/bridge fixes | Preserve current lifecycle; do not add native overscroll/touch suppression to Web |

The native eight-commit Android difference inventory records legacy WebView APIs, bridge injection, upgrade cache refresh and scoped scroll/Amen diagnostics as native/build evidence. They are preserved by tags, not copied onto Web/iOS. Any future native wrapper must export the approved canonical shared source with explicitly recorded generated bridge/config differences and pass real device QA.
