# Wave 7.5 zero-incremental-cost audio analytics decision

2026-10-16, Europe/Zagreb. Decision: **REJECTED_COST**.

Reason: **CENTRALIZED_ANALYTICS_REQUIRES_INCREMENTAL_BACKEND_USAGE**. Cross-user listening analytics cannot truthfully be implemented with the proven current data and **zero incremental backend usage: NO**. Document issuance is independent of this decision and continues through the separate activation checklist.

## Existing information and its purpose

`nh7-audio-classic-v484.js`, `nh7-audio-library-v500.js` and `nh7-media-player-v500.js` remain byte-identical to accepted develop `3e209b646eac811d47a735408365c06a01c5b7de`. Local owner-scoped position/resume, speed, favorites, downloaded audio and current playback state remain functional. Wave1 keeps bounded owner-local playback summaries for performance/product behavior; this is not a cross-user server report. Wave2 fences current/pending functional notes/progress/favorites when credentials change, preserves per-account restore/reconciliation and prevents the old playing session from writing into the new account. Existing persistence is not converted into analytics.

Required account progress/School state may already be persisted in `nh7_account_progress`, `user_progress`, current School snapshot/progress tables/contracts and backups. These are current position, seek/complete/learning state, not a trustworthy census of listening duration, distinct listeners, 80% genuinely listened, most-listened sermons or per-user session history. Reaching position80% after seeking does not prove listening80%. Historical listening-specific tables/RPCs also exist in source; those historical rows were produced for telemetry, not a required non-analytics feature, so they fail the explicit reuse conditions. Their live contents were **not queried solely to produce analytics**. No claim about exact live row counts is made.

The current classic player explicitly has `scheduleTracking(){return false}` and `flushTracking()` returns false. Existing Wave1 local processing and required account progress synchronization remain unchanged; no retired writer is re-enabled. Old analytics function names or free-tier availability do not establish zero resource usage.

## Gate answers

| Question | Answer / consequence |
| --- | --- |
| Truly zero-incremental cross-user report possible with proven already-loaded required data? | **NO**; none proves the requested listening facts. No fabricated report. |
| What is local-only? | Current owner resume/position/speed and bounded local summaries; local files/download metadata/favorites retain current persistence. No upload added. |
| What is server-side for non-analytics reasons? | Existing required account progress and School learning state; existing manual non-listening Admin reports. These do not prove genuine listening time/unique listeners/session history. |
| Would useful central collection require a new write? | Yes, absent a currently proven source of genuine listening facts; forbidden. |
| Would it require new persistent rows? | Yes for newly collected user/session/aggregate facts; forbidden even within free quota. |
| Would a new central report require a read/RPC? | Yes unless its exact useful data were already loaded for another required feature; no such complete dataset is proven. A new manual analytics RPC/read is also forbidden. |
| Would recording/aggregation increase DB or Storage footprint? | Yes for a new central implementation; forbidden. No schema, rows, aggregates, indexes, files or jobs added. |
| Would implementation increase ordinary playback traffic? | Capturing/uploading genuine events would; forbidden. Actual current playback modules are frozen and network negatives verify no retired event request. |
| Could analytics be made merely low-cost? | Irrelevant: the requirement is zero incremental use, not quota headroom or optimized nonzero cost. |

Implemented additional audio-analytics backend reads **0**, writes **0**, RPCs **0**, Edge calls **0**, persistent rows **0**, database/Storage bytes **0**, tables **0**, migrations **0**, subscriptions **0**, polling/timers/jobs **0**, third-party providers/fingerprints/paid activations **0**. No new centralized analytics is implemented. Existing product requests are not mislabeled as zero total application traffic.

## Admin presentation and active/historical inventory

- `nh7-admin-workspace-wave3.js`: existing Reports group now includes the exact localized disabled notice. Eleven groups, owner proof and delegation remain unchanged.
- `admin-v2.2.3.js`: current engagement surface excludes retired audio categories/cards and rejects stale audio-only filter requests. Keeps existing non-listening manual reports and useful current tools.
- `admin-v2.3.5-analytics-core-v237.js`: current users/student surface replaces listening claims/cards with the notice; blocks audio-only content drilldowns and keeps existing non-listening and actual School reports. No extra RPC.
- `nh7-admin-student-report-v496.js`: listening section/cards use the notice, while real School lessons, assignments, attempts, scores, wrong answers and CSV/Print/PDF machinery are preserved.
- Shared `nh7-admin-audio-cost-wave75.js`: static FA/EN/HR copy, singleton, no network, storage, timer or role ownership. `admin.html` loads it before analytics; stable Admin's existing loader preserves it.
- Existing loaders `admin-v2.3.5-analytics.js`, `nh7-admin-listening-analytics-v427.js` and `v451.js` stay unchanged. They route **existing** manually requested mixed activity/profile calls to current contracts; they do not reactivate the disabled player writers. Existing mixed non-listening/School manual reads are preserved, not introduced as a new listening analytics feature. No new query is made for the notice.
- Historical `nh7-admin-student-report-v490` through `v495`, old analytics/dashboard variants and their archives are reference source; active v496 replaces their report implementation. No old engine/report implementation is restored. Current `nh7-admin-student-academic-v540.js` and `nh7-admin-report-print-v117.js` are unchanged.

EN: “Listening analytics are intentionally disabled to avoid additional backend storage and request costs.” FA: «تحلیل شنیدن عمداً غیرفعال است تا هزینهٔ اضافی ذخیره‌سازی و درخواست‌های بک‌اند ایجاد نشود.» HR: “Analitika slušanja namjerno je onemogućena kako bi se izbjegli dodatni troškovi pohrane i pozadinskih zahtjeva.” No false zero listening totals are presented as evidence of active tracking.

## Evidence and limits

`verify-wave75-safety.py` freezes the actual audio/owner/School/account engines and existing backend bytes, checks the notice has no I/O/timer/storage, and permits only the exact hash-bound delta. `verify-wave75-browser.cjs` exercises actual current Admin locales and verifies stale audio category selection makes no read. Wave1/Wave2 browser regressions exercise real current engine events, notes, resume, offline/reload/reconnect, account-switch/logout fencing and Media Session actions. `measure-wave75.cjs` compares the exact accepted baseline to current source with real visible60/hidden60/Admin60/editor60/audio60 intervals, eight pause/resume bursts, route/account/logout, and asserts no retired telemetry requests. All providers are intercepted; media progression is a synthetic event driver at real5s intervals. This proves the source/fixture gate, not native battery/thermal/listening accuracy or live device performance.

See `WAVE7_5_MEASUREMENTS.json` for local measured source hashes and raw request names. The exact final-head CI emits `wave75-measurements-<head SHA>` with its own `measured_head`; a prior-head checked-in measurement is not relabeled as final-head CI. Physical device acceptance remains Wave8, not started.
