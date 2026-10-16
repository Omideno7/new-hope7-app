# Wave 8 upgrade, offline and recovery evidence

2026-10-16. This report concerns disposable synthetic Chromium profiles and intercepted providers. It does not certify a Store package upgrade, native file plugin, Safari, actual OS kill or physical device. No real cache, account or data was reset. Exact-head artifacts are retained by Validate Develop.

## Previously persisted legacy profile — PASS_AUTOMATED

`verify-wave8-upgrade.cjs` seeds current-format and legacy-format data through the current app/local APIs. A normal initial browser shutdown establishes a previously persisted profile. The next process opens that profile, is actually SIGKILLed, and a third process reopens the same profile offline. It compares exact raw values for legacy Sermon Notes, literal markup/numeric recovery, Bible saved verse/highlight/note, favorites, Spiritual Plan reflections, fasting notes and an unsubmitted School assignment draft. Current profile photo, FA language, pending local-first intents and audio resume at38.5seconds survive. Wrong-owner Notes remain quarantined. Existing downloaded IndexedDB Blob is selected by the real current engine; media events/codec duration are synthetic.

This deliberately tests an **already persisted upgrade/legacy profile**. It does not promise immediate last-write disk durability. An exploratory fresh-profile experiment killed the process1.5seconds after the latest mocked playback checkpoint; some runs lost that latest resume checkpoint (and one run retained an earlier language). That diagnostic failed its stronger assertion and is not counted as a PASS or silently relabeled a native success. A separate three-run plain-storage control retained its writes, so generic disk flushing is not a proven root cause. No audio/persistence code was changed on this evidence. Immediate fresh-write crash consistency remains unresolved and requires a controlled native/browser reproduction with storage/process traces; the passing legacy scenario cannot close it. The exact earlier committed fixture assertions remain unchanged.

## Reconnect defect and minimal fix — PASS_AUTOMATED

Ten overlapping `online` events in the original `js/app.js` callback independently forced account restore and School snapshot invalidation/read. Baseline source replay reproduced ten snapshot reads; the browser measured15 total product requests. The replacement shares one in-flight reconnect for the exact current UID/token/epoch and checks that actor after every await. The current callback performs one snapshot read/six total requests in the same browser burst; a later independent reconnect still refreshes. Account A's late work cannot fetch/render as B; token refresh/logout/route changes fence stale work. No School progression, snapshot implementation, Notes format or restore algorithm changed.

`verify-wave8-reconnect.cjs` compares actual old/new handler source, delayed restore, A→B, logout/token and route races. `measure-wave8.cjs` measures the actual app burst, subsequent quiet period and expiration of existing request timeouts. No interval/poll/retry loop or telemetry added. Only the executable service-worker cache epoch rotates for this future approved app asset; stable data cache identity is unchanged. No worker deployed and no user cache cleared.

## Storage and reconciliation — PASS_AUTOMATED within fixture limits

- Temporary IndexedDB-open failure preserves existing download metadata; restoring access permits the existing file to play again. This is not device eviction or a native plugin test.
- Targeted Document local draft quota failure preserves the previous persisted draft and current unsaved editor state, exposes an actionable failure and unlocks Save; restoring quota permits retry. No blanket storage clear.
- Existing Wave2 tests retain conditional writes, exact-owner queue/retry, conflicts, old-account delayed acknowledgements, offline pending intents and interrupted reconciliation. API fixture acknowledgements do not prove live Supabase durability.
- Existing Wave6/7/75 tests retain Profile/account restore, Notes/deletion safety, public-only verified reader offline caching, Ministers online-only, School state, immutable Document history and private archive fencing.
- A→B/logout remove privileged/private views immediately; retained raw legacy data is not destructively erased or assigned to the next account. This is application isolation, not encryption against local forensic inspection.

## Remaining evidence

PHYSICAL_QA_REQUIRED: old Store→new installed-package upgrade on iPhone/iPad/Android/tablet/Fold, real app/background OS kill including immediate latest-write interval, Safari/PWA eviction/quota/private mode, native offline file survival/recovery, force-stop/relaunch, keyboard focus and account switch on shared devices. Do not clear user data to satisfy these cases. Owner matrix U01–U12/P01–P05 gives the sequence; log pre/post values locally without publishing private content.

BLOCKED_TOOLCHAIN: exact current native wrappers/config/locks/plugins/entitlements and Xcode/Android SDK/adb/emulators are absent. Watch resources are generated, but Swift compilation, installed companion embedding/pairing and Watch OS-kill are unproven.

PROVIDER_EVIDENCE_REQUIRED: real reconnect notification receipt/tap and push account identity require actual existing-provider/device evidence; no notification was sent. BLOCKED_ACTIVATION: disabled Document/security/registration/Full Delete backend contracts remain review-only. No migrations, SQL, Auth changes, data mutation or release occurred.
