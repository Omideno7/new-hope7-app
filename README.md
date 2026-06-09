# New Hope 7 App — Version 1 MVP

Mobile-first trilingual PWA for New Hope 7 / Omideno7.

## Included

- English, Persian, Croatian UI foundation
- Offline-first PWA shell and lazy data caching
- Daily Word, Faith Proclamation, Daily Juice
- 30-day Gratitude Plan
- Need Salvation / New Birth content
- Complete Bible data: Persian TPV fallback-complete, English KJV, Croatian BKJ
- Bible reading plans: 1-year and 2-year
- Online School content from Excel files
- School registration / admin approval scaffold
- Audio folder structure for GitHub uploads
- Church meeting access scaffold
- YouVersion church button
- Step-by-step back navigation
- Opening daily Amen modal

## Audio folders

Place files here:

```text
public/audio/school/
public/audio/messages/morning-prayers/
public/audio/messages/short-messages/
public/audio/messages/sermons/
public/audio/messages/teachings/
```

School files expected:

```text
class-01-fa.mp3
class-02-fa.mp3
class-03-fa.mp3
class-04a-fa.mp3
class-04b-fa.mp3
class-05-fa.mp3
class-06-fa.mp3
class-07-fa.mp3
```

## Security notes

GitHub Pages is public. Do not store private FreeConferenceCall codes, meeting passwords, user personal data, or admin secrets in static JSON or JavaScript files. Use Supabase Auth, RLS policies, and protected tables for production.

## Deploy to GitHub Pages

Upload this folder to your GitHub repository and enable Pages from the main branch. The app is built with relative paths and should work under a repository subpath.

## Next production steps

1. Connect Supabase Auth.
2. Create user profiles, approvals, school progress, assignments, notes, highlights, and meeting access tables.
3. Enable Row Level Security.
4. Connect OneSignal/Firebase for real push notifications.
5. Add actual MP3 files and update `data/audio/messages.json`.
6. Review Bible translation licenses before public store release.
