# Wave 8 physical fix Batch 1 — pre-implementation audit

Starting develop: `9ad13f338aae4f3eba10850b57e02305c1d66ea9`. Main: `15af811f78a17a0881c13171311e7ade6bc390f4` (read-only). Existing develop tracking checkout; no new remote branch.

All browser evidence uses synthetic accounts and intercepts every non-local request. This is not physical WKWebView acceptance.

| Area | Confirmed source/evidence | Required narrow repair |
|---|---|---|
| B1 | Login saves the session then sequentially awaits registration, account restore and School snapshot before navigating. Held registration fixture leaves route Account after successful authentication. Account also waits for certificate archive before drawing controls. | Separate interactive authenticated surface from optional restoration, retain current data paths, fence asynchronous completion by actor/attempt/route. |
| B2 | Dashboard throws ReferenceError: L is not defined at nh7-soul-winning-v472.js:130. Module is local-only, not a missing server contract. Error page lacks retry/contextual Back. Browser navigation itself remains usable; native freeze not independently proven. | Define the missing localized helper; recoverable route error actions. Do not change Soul storage/sync. |
| B3 | Authorized Admin has zero links back to index.html. Workspace Back is internal Admin history only. | Persistent localized same-tab Return to App; retain credentials. |
| B4 | admin-entry.mjs silently returns when window.open returns null. Reproduced with popup-denied fixture. | Visible same-tab fallback; preserve existing legacy-draft import and exact owner authorization; issuance remains inactive. |
| B5 | More exposes profile and account, but both render account(). Old Community profile implementation is not exported. Current v564 uses UID-scoped Wave6 photo; raw legacy global photo is unowned. | One visible Account entry; retain legacy route alias; accept only identity-proven legacy candidates when no canonical value/tombstone exists. Never guess ownership or erase legacy bytes. |
| B6 | Bible reading plan selection renders inline without route state or contextual Back. | Current router plan parameter, list/detail Back and restored list position; no progress changes on navigation. |
| B7 | Password button absolute placement competes with shared theme/button styles; input margins affect wrapper geometry. Toggle has no localized accessible label/caret preservation. | Scoped layout invariant, logical-side placement, focus/caret retention and language labels. Measure all target dimensions. |
| B8 | Error render does not bind recovery actions; Back URL drops params. | Narrow shared error/history/scroll corrections only. |

Read: AGENTS, development workflow, master/batch specifications, current Wave8 integration/upgrade and Wave7.5 document evidence. Audio analytics remains REJECTED_COST. Document backend remains inactive. No schema/Auth/ACL/provider/live changes are needed. All existing Wave1–8 assertions remain required; new source deltas need a separate exact, reversible safety contract rather than silently changing historical baselines.

Physical rebuild/retest remains required on iPhone/iPad for all reported device symptoms, keyboard/Dynamic Type behavior and native history. No native project is reconstructed, signed or deployed.
