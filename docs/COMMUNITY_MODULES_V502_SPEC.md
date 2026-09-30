# Community Modules v5.0.2 — Preview Specification

Status: **Preview only / Production not changed**

Modules:
1. Testimonies
2. Prayer Requests
3. User Profile photo

## Testimonies
- Lives under More.
- Signed-in user submits testimony.
- User chooses whether their display name may be shown.
- Submission is pending until admin approval.
- Only approved + consented testimonies appear publicly.
- Admin permission: `testimonies.review`.

## Prayer Request
- User form has only **name + prayer request**.
- Requests are never public.
- Normal users cannot read other users' requests.
- Prayer Servants use server-side permission-gated RPCs.
- Statuses: New / Praying / Completed.
- PDF export permission: `prayer_requests.export`.
- Manage permission: `prayer_requests.manage`; it automatically implies view.

## User Profile
- User can set/change/remove a profile photo.
- Photo bucket is private.
- Storage path begins with the signed-in user's UUID.
- Only that user can read/write/delete the photo.
- Existing app data is not migrated or deleted.

## Production safety
- Candidate SQL is stored in the repo but **must not be run** on Supabase Production without explicit approval.
- No existing table is dropped or altered.
- No existing Notes, Saved Verses, School Progress, Audio or Auth data is modified.
- App icon, Player 2.0 and Production releases are not touched.
