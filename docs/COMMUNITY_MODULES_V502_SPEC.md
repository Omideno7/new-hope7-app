# Community Modules v5.0.2 — Revised Preview Specification

Status: **Preview only / Production not changed**

## 1. Prayer Request

User form contains only:
- Name
- Detailed prayer request

The form explicitly asks the user to explain the issue completely: when it began, current condition, main pressure/problem, and exactly what they want prayer for. If the user personally sees the issue as related to spiritual warfare or deliverance, they may explain that as part of the request.

Privacy:
- Prayer requests are never public.
- No Prayer Servant app/admin panel is created.
- Only the main Owner/Admin reads requests inside Admin.
- Admin can mark New / Praying / Completed.
- Admin can export a clean PDF/print file and distribute it offline to prayer servants.
- Candidate backend uses owner-only security-definer RPCs.

## 2. Audio Testimonies

Primary submission method is **audio**, not a long written form.

User options:
- Record directly inside the app with microphone.
- Pause/resume/stop/play back before submitting.
- Or upload an existing MP3/M4A/AAC/WAV/WebM audio file.
- Add a short title and optional note.
- Choose testimony type: Healing / Answered Prayer / Salvation / Provision / Other.
- Consent separately to publication, display-name visibility, and publication of health information for healing testimonies.

### Guided Recording mode

Recording remains one continuous audio file, while the app presents a 4-stage guide based on the church's 14-point healing-testimony formula:

1. Before healing: introduction, illness, diagnosis, treatment.
2. Prayer encounter: how they heard, how they joined, the word/prayer and immediate change.
3. After prayer: following days, restored activities, medication and medical follow-up.
4. Meaning and invitation: importance, life impact, sharing/inviting others, message to Apostle Yuhana and ministry team.

The full 14-point guide remains available in expandable sections before/during recording.

### Moderation and publication

- A submitted testimony audio file is **private** while pending.
- Only Owner/Admin can listen to pending files.
- Rejected files never become public.
- On approval, Admin publishes/copies the approved audio to the public testimony-audio bucket.
- The approved testimony then appears in the user app as a compact audio card, similar to sermon/audio-message cards, with play controls.
- Health testimony publication requires explicit health-information consent.
- Users are instructed to report medical facts honestly and not give medical advice to listeners.

Storage design:
- `nh7-testimony-submissions-v502` — private pending uploads.
- `nh7-testimony-published-v502` — public approved audio only.

## 3. User Profile

- User can set/change/remove display photo.
- Profile-photo bucket remains private.
- Each user can access only their own folder.
- Existing app data is not migrated or deleted.

## Production safety

- Candidate SQL exists only in the feature branch.
- Do not run it on Supabase Production without explicit approval.
- No existing table is dropped or altered.
- Notes, Saved Verses, School Progress, Audio, Auth and Player 2.0 are untouched.
- No app-store release is changed.


## Revision — 2026-09-30

### Exact testimony guide
- The Persian healing-testimony prompts must follow the church-provided wording and content exactly.
- The prompts remain grouped into four readable sections, but visible question numbers are omitted.
- The same guide is available in Persian, English, and Croatian.
- Guided Recording cycles through the same 14 topics without showing numeric labels.
- Intro explains that sharing a testimony passes on God's love, hope and faith to others.
- Supporting Scripture references shown in the module:
  - Mark 5:19
  - Psalm 66:16
  - Revelation 12:11

### Profile photo framing
- After selecting a profile photo, user can open an in-app circular crop/framing editor.
- User can drag the photo with touch/pointer gestures and zoom from 1x to 3x.
- The app stores photo framing metadata (`photo_position_x`, `photo_position_y`, `photo_zoom`) so the selected framing is preserved.
- The original photo can remain intact; the UI applies saved framing metadata when rendering the circular avatar.


### Profile crop UX refinement
- Opening the crop editor locks the page behind it; background scrolling must not occur on iOS/Android.
- Drag offsets are clamped so the circular frame never exposes empty space.
- Saving the crop renders a real 512×512 avatar image on a Canvas from the exact visible frame.
- The profile avatar displays that rendered crop, so the saved result matches the editor pixel-for-pixel.
- The original private photo is retained separately for future re-editing; the rendered avatar is stored as the normal profile photo.
