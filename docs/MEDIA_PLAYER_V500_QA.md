# Media Player 2.0 v5.0.0 — Phase B QA

Date: 2026-09-30
Branch: feature/media-player-v500-preview-20260930
Production/main changed: NO
Supabase Production changed: NO

## Static checks

- js/nh7-media-player-v500.js passes Node syntax validation.
- Player 2.0 creates no second audio element.
- Player 2.0 uses window.NH7_AUDIO_CLASSIC_V400 as the playback authority.
- No fetch(), Supabase query, schema change, Edge Function, or new paid dependency was added by v500.
- Existing v484 signed-media/offline/progress/Media Session engine remains untouched.
- Existing v487 player remains available as rollback/fallback; v500 only hides its visual UI while v500 is active.

## Chromium isolated harness

Environment: system Chromium, iPhone-size viewport 390×844, no network, mocked stable audio-engine contract.

Passed:
- persistent mini-player visible
- current title rendered
- Blessings panel collapsed by default
- full player expands
- Quick Bible callback invoked
- Blessings panel expands
- previous track invokes stable engine
- next track invokes stable engine
- timeline seeking updates currentTime
- playback speed changes 1.00× → 1.25×
- mute toggle works
- close delegates to existing v487 close path
- resume snapshot remains stored under existing nh7_sermon_progress_<id> key
- no JavaScript page errors

Observed seek test:
- 50% of a 245-second mock track -> 122.5 seconds

## Visual review

Mini player:
- fits 390px iPhone viewport
- positioned above bottom navigation
- artwork/title/time and transport controls fit without horizontal overflow

Full player:
- large square artwork
- blurred/artwork-derived background
- title and speaker
- seek timeline
- previous / 15s back / play-pause / 30s forward / next
- speed, Bible, Blessings, volume
- Blessings area stays closed until tapped

## Still requires native-device QA before any merge

These cannot be certified by the isolated browser harness:
- iOS lock-screen tap returns to New Hope 7 native app
- lock-screen artwork on a real device
- background audio during screen lock / app switching
- Bluetooth/headset controls
- native volume limitations
- real signed sermon media
- real offline downloaded media
- School telemetry against the existing runtime
- Persian RTL and Croatian on actual devices
- safe-area behavior across supported iPhone models

## Merge rule

Do not merge this feature branch to main until the user explicitly approves after device/preview review.


## Fresh verification — current v500 source

Verified after the Blessings icon markup repair.

- Player source blob SHA: `b84017ddb1297eaa3dedeef028771120ce2f7494`
- JavaScript syntax: PASS
- Creates a second audio element: NO
- Direct Supabase/REST/Edge Function calls from v500 UI: NO
- Uses existing `NH7_AUDIO_CLASSIC_V400` engine: YES
- Uses existing `NH7QuickBibleV454`: YES
- Close delegates to existing v487 safe resume/close path: YES

### Chromium interaction harness — PASS

Because this execution environment blocks browser navigation to localhost, file URLs, and synthetic HTTPS origins, the exact v500 source was injected into an originless Chromium QA page. Native `localStorage` is blocked on originless pages, so only the QA page received an in-memory Storage-compatible object. The application source was not modified for this test.

iPhone-size viewport: 390×844.

Passed:
- mini-player visible and contained within viewport
- title/artwork state rendered
- full player expand/collapse
- Blessings hidden by default
- Blessings panel expands on tap
- Quick Bible callback
- playback speed 1.00× → 1.25×
- seek 50% of 245 seconds → 122.5 seconds
- next / previous callbacks
- mute callback
- close delegates to v487
- resume saved under the existing `nh7_sermon_progress_<id>` key
- no JavaScript page errors
- no horizontal overflow

### Language/layout harness — PASS

At 390×844:
- Persian RTL: PASS; labels `کتاب مقدس`, `برکت‌ها`, `سرعت`, `صدا`; no overflow
- English LTR: PASS; no overflow
- Croatian LTR: PASS; labels `Biblija`, `Blagoslovi`, `Brzina`, `Glasnoća`; no overflow
- School audio: Player remains visible and sermon-only Blessings control is hidden

### Still pending native-device verification

Static/Chromium QA cannot certify:
- actual iOS lock-screen tap target returning to New Hope 7
- real lock-screen artwork on device
- background playback through screen lock/app switching
- Bluetooth/headset controls
- native volume behavior
- real signed sermon playback
- real offline downloaded audio
- School telemetry against the live existing runtime
- safe-area behavior across supported physical iPhone models

No merge to main is authorized by this QA.


## Integration verification — approved visual layout / real control wiring

Verified on 2026-09-30 after the compact 4×2 control layout, RTL/LTR sermon rows, visible Up Next, and Related artwork sizing fixes.

- Current Player source blob SHA: `e9fc2799a759e238aeed2c57b911c10d1e357374`
- JavaScript syntax: PASS
- Second audio element created by Player 2.0: NO
- Direct REST / Supabase / RPC call added by Player 2.0: NO
- Service Worker modified by this feature branch: NO
- Stable v4.8.4 audio engine remains playback authority: YES
- Existing v4.8.7 safe close/resume path reused: YES
- Existing Quick Bible v4.5.4 reused: YES
- Existing sermon Like RPC/UI reused: YES
- Existing Blessings RPC/UI reused: YES
- Existing sermon Share flow and deep link reused: YES
- Existing sermon Notes action reused: YES
- Existing offline download engine reused: YES
- Favorite is device-local only under `nh7_audio_favorites_v500`: YES
- Queue reads the stable engine queue and shows up to 5 items after the current track: YES
- Queue item tap delegates playback to the stable engine: YES
- Related/Suggested reads the already-loaded sermon catalog; no recommendation backend added: YES
- Related artwork constrained to 72×72 px: YES
- Theme colors derive from existing app theme CSS variables: YES
- Media Session / lock-screen ownership remains exclusively in the stable audio engine: YES

### Existing-client safety check

The feature branch is ahead of `main` and not behind it. Its diff is limited to:
- `docs/MEDIA_PLAYER_V500_QA.md`
- `docs/MEDIA_PLAYER_V500_SPEC.md`
- `index.html`
- `js/nh7-media-player-v500.js`
- `media-player-v500-preview.html`

No Production database schema, RLS policy, Edge Function, Service Worker, or existing audio-engine file is modified by Player 2.0.

### Still required before any Production merge

Physical-device QA is still required for:
- real signed sermon playback on iPhone
- real offline download and replay
- iOS background playback
- lock-screen title/artwork and tap-back target
- headset / Bluetooth controls
- interruption recovery (call / Siri / other audio)
- app background → foreground resume
- Persian / English / Croatian visual pass on device
- safe-area pass on supported iPhone sizes
- School audio telemetry regression check

No merge to `main` is authorized by this verification.


## Safe Integration Preview fixes after iPhone review

Date: 2026-09-30

User-device review exposed five integration issues and all were addressed on the feature branch:

- Audio home still showed the legacy layout: fixed by adding `js/nh7-audio-library-v500.js`, a UI-only layer over the existing `window.__sermonMap` catalog. No new backend query was added.
- Blessings pill appeared inactive: fixed so the Player Blessings pill opens the existing sermon social/compose flow directly.
- Safe-test Like incorrectly returned `0`: fixed the Safe Integration interceptor to simulate a local toggle from the currently displayed real count instead of forcing zero. Production Like RPC remains blocked in Safe Test.
- Safe-test Download could offer to remove an already-downloaded file: fixed so Player Download in `NH7_PLAYER_TEST_MODE` never mutates offline storage and shows a test-mode notice instead.
- iPhone volume slider did not affect device volume: the software slider is now hidden on iOS; the Player explains that iPhone hardware volume buttons control volume.
- Seek thumb snapped back while dragging: added a seek-drag guard. UI preview follows the thumb during drag and commits `currentTime` on change/release before sync resumes.
- Recently Played is now recorded locally under `nh7_audio_recent_v500` for the Audio Library shelves.

Static verification:
- Player syntax: PASS
- Audio Library syntax: PASS
- Audio Library direct backend writes/calls: NONE
- Safe Integration Service Worker registration: DISABLED
- Safe Integration OneSignal SDK: DISABLED
- Production Social writes: BLOCKED in Safe Integration Preview
- Production School audio telemetry write: BLOCKED in Safe Integration Preview
- `main`: NOT MODIFIED
