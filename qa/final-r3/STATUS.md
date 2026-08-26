# New Hope 7 — Final QA R3.5 3.9.5

**Branch:** `qa/final-integration-20260825-r3`  
**Approved content/UI baseline:** RC 2.5.1 commit `a6b0f6465e2d7f3e335b528a116d962cbe8f5b20`  
**Current production baseline retained:** `main` app `2.3.9.44`

## Scope retained

R3.5 retains the approved 19-book Persian/English/Croatian Apocrypha, Bible-style Reader, highlight/notes/Save toggle, six Spiritual Plans, nine trilingual library books, registration/School/exam gates, live sermon catalogue, personal one-device video portal, Settings cleanup and secure self-service account deletion.

## Audio root cause and R3.5 fix

The repeated R3.4 playback/download failure was not only a Safari autoplay problem. A direct storage audit found that bucket `church-audio` is **private**, while sermon database rows contain URLs shaped like `/storage/v1/object/public/church-audio/...`. Those stored URLs therefore cannot be treated as public playback/download URLs.

School audio also lives in the same private bucket, with protected storage paths such as `school/class-01-fa.mp3`.

R3.5 moves both sources to the authenticated media Edge Function:

- sermon: `{ kind: 'sermon', sermon_id }` -> published sermon lookup -> storage path extraction -> 6-hour signed URL;
- School: `{ kind: 'audio', lesson_code }` -> `nh7_school_media_authorize_v260` -> protected storage path -> 6-hour signed URL;
- video portal/video remain on the v3.9.2 account/device-bound authorization functions.

The live `nh7-school-media-access` Edge Function was deployed as **version 5** with RawGit CORS support and signed sermon audio support.

## Safari playback

The QA launcher removes competing legacy audio/offline handlers from the approved RC shell and loads a single v3.9.5 controller.

For each sermon/School item it:

- prewarms signed URLs;
- uses one HTMLAudioElement for play/pause/seek/speed;
- shows real status below the card;
- if Safari blocks async autoplay after the signed URL request, inserts a visible native `<audio controls>` fallback on the same card so the user can start playback explicitly;
- keeps School listen-time reporting through `nh7_school_record_audio_v380` and analytics through `nh7_track_audio_session_v222`.

## Download and offline

R3.5 download uses the signed URL, never the raw private URL.

- Web download streams the response and shows percentage when Content-Length is available.
- Android/iOS builds use Capacitor FileTransfer progress.
- Completion changes the button to green `Downloaded ✓` / localized equivalent.
- A second press offers deletion.
- Downloaded files are keyed by a stable media ID rather than the expiring signed URL.
- Offline playback resolves the downloaded Blob/native file from the stable ID.

Offline caches:

- `nh7-core-v395` for prepared core app content;
- `nh7-media-v395` for downloaded media;
- `nh7-qa-shell-v395` for QA shell navigation.

Auth, REST/RPC, Edge Function and signed/authenticated storage requests are never cached by the Service Worker.

Offline setup remains explicit: prepare core content while online and separately download the large audio files required offline.

## Admin user/account lists

The old list RPCs used `nh7_is_admin()`, which only recognizes the configured owner email. This caused active delegated admins to receive list errors/empty pages despite having v350 permissions.

Production Supabase now has RBAC-aware read functions:

- `nh7_admin_has_permission_v395`
- `nh7_admin_content_access_dashboard_v395`
- `nh7_admin_account_directory_v395`

A simulated active delegate with `registrations.view` successfully received:

- **31** complete approved users;
- **71** Auth accounts.

`admin-tools-v395.html` accepts an active admin for viewing these lists. Sensitive operations remain restricted:

- minister item grants: Owner-only;
- full account deletion: Owner-only;
- registration deletion: existing permission-protected RPC.

At audit time there were still **0 active library items with `audience = ministers`**. Therefore the user dropdown should contain approved users, but item checkboxes correctly remain empty until at least one minister book/handout is published.

## More / Settings

The R3.4 Settings overlay remains active in R3.5:

- duplicate Gratitude is removed from More because Gratitude remains under Daily;
- Video is removed from Settings/nested views and remains only on the root More page;
- language, notification request, offline preparation, clear downloads, refresh and sync show visible feedback.

## Saved Apocrypha deep links

The R3.4 direct navigation remains active:

- merged Apocrypha runtime is prewarmed;
- intermediate catalogue is covered while navigating;
- exact book/chapter/verse is opened;
- visible verse trigger receives a green marker rather than the invisible `display: contents` article.

## Validation

GitHub Actions R3.5 validation succeeded for:

- JavaScript and inline HTML syntax;
- all 19 fresh Apocrypha translations and six Spiritual Plans;
- signed sermon/School audio architecture;
- v3.9.5 offline Service Worker safeguards;
- RBAC Admin list functions and QA tool wiring;
- existing video/account/School security modules;
- confirmation that `main` remains `2.3.9.44`.

This static/integration validation cannot replace real Safari/device media testing. User QA is still required before normalization/merge.

## Required user QA

1. Sign in on the QA domain with a complete approved account.
2. Play one current MP3 sermon and one current M4A sermon. If Safari shows the fallback audio control, press its Play button and confirm playback.
3. Open a School lesson and play its protected audio; `Run failed` must not appear.
4. Download one sermon and one School lesson; confirm percentage and the green completion check.
5. Disable internet and play both downloaded files.
6. Settings -> Prepare core content offline, then reopen offline and test Home/Bible/Plans/School shell.
7. Open `admin-tools-v395.html`, sign in with an active admin, and confirm user/account lists. Owner is required for minister grants and full-delete actions.
8. Confirm Gratitude is absent from More and Video is absent from Settings.
9. Exercise every Settings control and confirm visible feedback.
10. Open a saved Apocrypha verse and confirm direct navigation to the exact visibly marked verse.

Only after these checks pass should approved R3.5 changes be normalized onto a fresh release branch created from the latest `main`.
