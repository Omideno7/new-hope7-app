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
