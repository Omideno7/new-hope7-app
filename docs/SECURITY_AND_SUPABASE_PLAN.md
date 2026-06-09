# Security and Supabase Plan

Static files cannot protect secrets. Production security must be implemented with Supabase.

## Required tables

- profiles: user id, email, name, language, roles, approval status
- meeting_access: protected meeting link/code/password, visible only to approved users
- school_enrollments: pending_review, approved, rejected
- school_progress: lesson progress, notes count, assignments submitted
- bible_notes, bible_bookmarks, bible_highlights
- notification_preferences

## RLS rules

- Users can read/write only their own profile and activity.
- Meeting access can be selected only when `profiles.meeting_status = 'approved'`.
- School content can be public, but student progress is private.
- Admin actions require an `admin` role in profiles.

## Anti-abuse

- Rate-limit points for search/share.
- Validate school unlock rules server-side.
- Do not trust client-side approval flags.
