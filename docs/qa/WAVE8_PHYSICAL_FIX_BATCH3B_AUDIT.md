# Batch3B pre-implementation audit

Base develop: `73610310eaccebe417975aaa48b17b563b642796`. Main: `15af811f78a17a0881c13171311e7ade6bc390f4`. Existing develop only; clean fetched baseline. No Production operations.

## Actual architecture and decisions

- Calendar: `js/nh7-celebrations-v464.js` owns 16 observances, Gregorian Easter offsets, localized approved body/reference text, birthday identity checks, modal focus/inert restoration and foreground date lifecycle. Preserve dates/body/birthday/Bible handoff. Add structured educational sections and current-date/home context; uncertain liturgical origins require curation, never invented historical dates.
- Home: existing `home()`/adaptive layout and canonical router. Add compact CTA/detail navigation without replacing hero/profile/layout authority or adding polling.
- YouVersion: existing `data/church/church_config.json.youVersionUrl` exactly matches About's bible.com organization link. Reuse that configured HTTPS destination; no guessed IDs, custom schemes or automatic membership claim. Repository provenance is not physical universal-link acceptance.
- Meetings: current `meetings()` trusts cached approval for immediate presentation; `defaultMeetingSettings()` contains a static credential fallback; `fetchMeetingSettings()` retries legacy email/device RPC and direct REST before static fallback. Those are not adequate authority for private data. Live Wave6.6 row131 has auth_uid=false and a fingerprint but no proven safe current body. Do not claim a live exploit or reuse that contract as UID authority. Fail closed on the new unactivated contract.
- Existing static credential material also occurs in obsolete root meeting setup SQL/Admin initial markup. Remove only obsolete literal seed/fallback values, never modify installed migrations or real settings. Historical Git history cannot be erased: owner must review/rotate previously exposed credentials separately before activation. Never reproduce values in reports/logs/fixtures.
- Existing Admin Workspace uses current server-proven Wave3/v350 owner/delegated authority. Reuse owner-only tool integration; no invented delegated permission. New server manager must independently require existing private owner helper, not trust cached UI role.
- Dynamic multi-category entries do not exist in current single-row meeting settings. Prepare a separate minimal REVIEW-ONLY table/RPC/ACL package with no direct client table grants, auth.uid identity, bounded public catalog and on-demand restricted detail; preserve existing settings/links. Public/authenticated/admin audiences proven; approved/student remain BLOCKED_ACTIVATION until exact trusted UID approval contract is reconciled. Do not infer authorization from client email/device or boolean cache.
- All credential state memory-only, request/route/session fenced, explicit Admin saves, no startup remote query, no polling/realtime/analytics/provider initialization. Calendar reminder contract source-only; no permission prompt or delivery activation.
- Baseline checkpoint42 exact/0missing/2pending (v511,v580), both unapplied. Batch3A Q&A package inactive. New source remains under review/, no ordinary migration.

## Acceptance plan

Independent current-source tests plus exact hash-bound projection for historical byte-freeze guards; retain original security assertions. Synthetic PostgreSQL authorization/CRUD/conflict/ACL and browser FA/EN/HR phone/tablet/history/stale/logout/safe links/calendar/no-provider tests. Existing full Validate Develop remains mandatory. Actual WKWebView/universal links/native reminders/OS calendar delivery require physical QA; no physical PASS.
