# New Hope 7 — Media Player 2.0 (v5.0.0) Preview Specification

Date: 2026-09-30
Base main commit: 2b7e666c9634b31d90627e1c24b4787b71f36c88
Feature branch: feature/media-player-v500-preview-20260930
Rollback checkpoint: checkpoint/pre-media-player-v500-20260930

## Safety constraints

- Do not modify main or Production.
- Do not modify Supabase Production schema, RLS, Edge Functions, or existing user data.
- Preserve existing local and cloud progress keys, downloaded audio, notes, saved verses, School progress, and current authentication/session behavior.
- Preserve the current signed-media and offline-download pipeline.
- No new recurring-cost dependency.
- Do not add per-play AI/TTS or high-bandwidth video to this phase.

## Current runtime audit

The production audio path on main is split across these stable components:

- js/nh7-audio-classic-v484.js — authoritative audio engine.
- js/nh7-audio-miniplayer-v487.js — current persistent mini/full-sheet UI.
- js/nh7-audio-quick-bible-v454.js — Quick Bible dialog that intentionally does not interrupt audio.
- js/nh7-sermon-social-v443.js — sermon like/share/blessing UI.
- js/nh7-sermon-list-detail-v445.js — sermon list/detail presentation.
- js/app.js — application routes and legacy/fallback audio handling.

The v484 engine already provides the important playback contract and MUST remain the audio authority:
- signed private-media playback
- offline playback/download compatibility
- resume progress
- playback speed
- next/previous queue
- 15s back / 30s forward seek
- Media Session / lock-screen actions
- current artwork/title metadata
- media position state
- School listening telemetry
- sermon progress persistence
- optional volume control where platform allows it

## Architecture decision

Media Player 2.0 is a UI layer over the existing v484 engine. It must not create a second audio element and must not replace the signed-media or progress logic.

The new UI reads state from:
window.NH7_AUDIO_CLASSIC_V400.getState()

The new UI controls playback through the existing engine API:
- playNextTrack()
- playPreviousTrack()
- setPlaybackSpeed()
- setMediaVolume()
- toggleMediaMute()
- playItem()

Direct HTMLAudioElement operations are limited to play/pause and seek on the engine-owned audio instance returned by getState().

## UX target

Apple-like, calm, premium audio experience while keeping New Hope 7 identity.

### Persistent mini player
- Artwork thumbnail
- Sermon/lesson title
- Elapsed time and/or progress bar
- Previous
- Play/pause
- Next
- Expand
- Close
- Positioned above bottom navigation and safe-area aware

### Full player
- Large square artwork
- Soft blurred artwork background
- Title
- New Hope 7 / content context
- Seek timeline with elapsed and remaining/total time
- Previous track
- 15 seconds back
- Play/pause
- 30 seconds forward
- Next track
- Playback speed
- Volume/mute where browser/platform permits
- Quick Bible shortcut
- Blessings shortcut/panel
- Collapse
- Close

### Quick Bible
Reuse NH7QuickBibleV454. Opening Bible must never stop, recreate, or replace audio.

### Blessings
For sermon tracks only, reuse the existing sermon social UI/data contract. Blessings should be collapsed by default and only expanded on user action. School audio must not expose sermon-only social controls.

### Artwork
Use in this order:
1. cover_url
2. artwork_url
3. New Hope 7 fallback logo

Artwork uploaded for sermons should remain square. Recommended source artwork is 3000×3000, while runtime UI should request/render an appropriately sized asset where possible.

## Lock-screen / background audio requirements

The new UI must not interfere with v484 Media Session handlers. The following must continue to work:
- play/pause from lock screen
- next/previous
- seek backward/forward
- title
- artist
- artwork
- position state
- return to New Hope 7 rather than an unrelated app/web target

## Persistence requirements

Closing the visual player must preserve the current resume position. It must not clear:
- nh7_sermon_progress_*
- offline media metadata
- playback speed preference
- School telemetry state

Stopping playback is allowed only as an explicit close behavior and must save progress first.

## Performance rules

- No polling faster than animation-frame/250–500ms UI sync.
- No duplicate network call for playback state.
- No new Supabase query for every timeupdate.
- Artwork should not be repeatedly reloaded if track has not changed.
- Prefer DOM reuse rather than re-creating the player on every route change.

## Acceptance tests

1. Play sermon, navigate Home/More/Bible, mini player remains available.
2. Expand/collapse full player repeatedly without restarting audio.
3. Lock phone and use play/pause, previous/next, seek controls.
4. Tap lock-screen media surface and confirm it returns to New Hope 7.
5. Resume after closing player and reopening same sermon.
6. Previous/next respects current visible queue.
7. Auto-next still works at track end.
8. Change speed and confirm it persists.
9. Quick Bible opens while audio keeps playing.
10. Blessings are collapsed by default and expand only on tap.
11. Artwork renders in mini/full player and lock screen.
12. Dark/light themes remain readable.
13. Persian RTL, English, and Croatian layouts are usable.
14. iPhone safe areas do not cover controls.
15. Existing downloaded audio remains playable.
16. Existing School audio continues to report progress.
17. No changes to Notes, Saved Verses, School Progress, user accounts, or Supabase Production.
18. Old player can be restored by removing the v500 UI includes.

## Phase plan

Phase A — complete:
- audit current runtime
- freeze engine contract
- create rollback checkpoint
- create isolated preview branch

Phase B:
- add v500 CSS and JS UI layer
- wire only on preview branch
- static syntax checks and regression checks

Phase C:
- device preview / TestFlight-style verification
- fix visual/runtime issues on feature branch only

Phase D:
- after explicit approval, prepare a minimal merge set for main
