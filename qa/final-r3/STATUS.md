# New Hope 7 — Final QA R3.4 3.9.4

**Branch:** `qa/final-integration-20260825-r3`  
**Approved content/UI baseline:** RC 2.5.1 commit `a6b0f6465e2d7f3e335b528a116d962cbe8f5b20`  
**Current production baseline retained:** `main` app `2.3.9.44`

## Scope retained from prior QA

R3.4 retains the approved 19-book Persian/English/Croatian Apocrypha, continuous Bible-style Reader, highlight/notes/Save toggle, six Spiritual Plans, nine trilingual library books, current registration/School/exam gates, live sermon catalogue, personal one-device video portal and secure self-service account deletion.

## Audio playback

The former RC audio player deferred `audio.play()` until the `loadedmetadata` event and silently swallowed the promise rejection. Safari could therefore show an active Play button but never start playback because the later call was no longer treated as the user gesture.

R3.4 installs one capture-level audio controller before the legacy document handlers:

- public sermon audio starts directly from the original click;
- School audio first arms the same audio element during the click, then requests the protected signed URL from `nh7-school-media-access`;
- Play/pause, 15-second rewind, 30-second forward, seek and playback speed use one player state;
- errors are displayed under the relevant card instead of being swallowed;
- School listening time continues to be sent to `nh7_school_record_audio_v380` and the audio analytics RPC.

The legacy secure-media/audio handlers are removed from the QA shell to avoid duplicate interception and the previous `Run failed`/silent-player path.

## Audio downloads and offline use

Every sermon and School audio card now supports a real download flow:

- streamed web download with visible percentage when `Content-Length` is available;
- Capacitor FileTransfer progress in Android/iOS builds;
- green checked button after completion;
- second press offers removal of the downloaded file;
- downloaded files are stored with stable media IDs, so expiring School signed URLs do not invalidate the offline copy;
- offline playback uses the downloaded Blob/native file rather than the expired network URL.

A QA Service Worker caches the immutable shell and prepared core content. Auth, RPC, Edge Function and expiring signed-storage responses are explicitly excluded. The most recent sermon, School and library catalogues are persisted separately for offline UI rendering.

Offline requires a successful online preparation first:

1. Settings → Prepare core content offline;
2. download each required audio file completely;
3. then disconnect the network and reopen the app/file.

## Admin users and account directory

The previous RawGit Admin helper depended on `nh7_admin_token` created on another domain. Browser origin isolation meant the token was usually absent, so the UI showed no users/accounts even though the RPCs contained data.

R3.4 adds `admin-tools-v394.html` with direct Supabase Owner login on the QA domain, access-token refresh and automatic retry. Direct database checks showed:

- 31 complete approved users available to the content-access dashboard;
- 71 Auth accounts in the account directory;
- 36 registration records without a matching Auth account at audit time.

The tool clearly distinguishes an empty **resource** list from an empty **user** list. At audit time there were no active library items with `audience = ministers`, so approved users are available but item-by-item checkboxes appear only after a book/handout is published for ministers.

## More menu and Settings

R3.4 removes:

- the duplicate Gratitude tile from More, because Gratitude remains under Daily;
- legacy/duplicate video tiles from Settings and other nested More pages.

The personal video entry remains only on the root More screen.

Settings controls now provide visible status for:

- language selection;
- notification permission/scheduling;
- prepare core content offline;
- clear downloaded media;
- refresh app data/cache;
- cloud-sync request.

## Saved Apocrypha deep links

The previous deep link rendered the Apocrypha catalogue, waited for the 8.8 MB merged asset, then outlined the article element. Because the article uses `display: contents`, the mark was not visible.

R3.4:

- prewarms the merged 19-book runtime as soon as the module loads;
- covers the intermediate catalogue with a direct-opening overlay;
- opens the exact book and chapter;
- scrolls without the slow animated delay;
- applies a green animated marker to the visible verse trigger for 6.5 seconds.

## Validation status

GitHub Actions validation succeeded for:

- JavaScript and inline HTML syntax;
- all 19 fresh trilingual Apocrypha books;
- direct saved-verse navigation;
- audio playback/download/School authorization contracts;
- offline Service Worker safeguards;
- Settings/menu cleanup;
- Admin direct login and dashboard RPC wiring;
- sermon/video/account/School contracts;
- Spiritual Plans catalogue;
- confirmation that `main` remains `2.3.9.44`.

This is static/integration validation. Real Safari and installed-app playback/download/offline behavior still requires the user QA described below.

## Required user QA before normalization

1. Play one MP3 and one M4A sermon; pause/resume and seek.
2. Open a School lesson, play its protected audio and verify the raw `Run failed` message is absent.
3. Download one sermon and one School lesson; observe percentage and the green check.
4. Turn off Wi-Fi/internet and play both downloaded files.
5. Prepare core content offline, close/reopen the page offline and test Home, Bible, Plans and School screens.
6. Open Admin Tools 3.9.4, sign in with the Owner account and verify the approved-user and account lists.
7. Confirm Gratitude is absent from More and video is absent from Settings.
8. Test every Settings control and confirm a visible response.
9. Open a saved Apocrypha verse and verify it goes directly to the exact verse with the green marker.

Only after these checks pass should R3.4 be normalized onto a fresh branch created from the latest production `main`.
