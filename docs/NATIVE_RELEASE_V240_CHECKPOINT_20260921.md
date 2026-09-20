# New Hope 7 — Native Store Release Candidate 2026-09-21

Frozen web base:
- Main SHA: f9f1b1fb8d9c3733199545af336dc43d015a1d9d
- Native release branch: release/native-store-v240-20260921
- Feature freeze: active; no new product features until store candidate validation is complete.

Release versions:
- Android: 2.4.0 (versionCode 24000)
- iOS: 1.1 (build 20260921)
- Bundle/package ID: com.omideno7.newhope7

Native-only release adaptation:
- OneSignal account binding upgraded to nh7-push-account-bind-v364.
- Web service worker and Web OneSignal SDK are disabled inside native wrappers; native OneSignal owns push.
- Background audio / MediaSession runtime remains nh7-audio-classic-v484 + nh7-audio-miniplayer-v487.
- No production Supabase schema/data mutation is part of native packaging.

Bible keyword audit on frozen main:
- FA: 2500 unique, 2500 positive-match entries.
- EN: 2500 unique, 2500 positive-match entries.
- HR: 2500 unique, 2500 positive-match entries.
- Runtime imported through js/app.js and cached in release core.

Release gates:
1. iOS simulator + generic-device unsigned Release build.
2. Android API 36 optimized AAB build.
3. Android separate-package QA APK.
4. Android emulator online launch and offline relaunch smoke.
5. Signing availability checked separately; existing Store signing identity must be reused for uploadable update binaries.
