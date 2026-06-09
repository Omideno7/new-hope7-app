# New Hope 7 App v1.3

This version adds Supabase cloud-save foundation, improved offline caching, and Teaching audio 001-029.

## Required Supabase setup

1. Open Supabase Dashboard.
2. Go to SQL Editor.
3. Open `docs/supabase_schema_v1_3.sql`.
4. Copy all SQL and run it.
5. For admin panel, create an Auth user with email `omideno7church@gmail.com` and a password.

## Test URLs

- App: `https://omideno7.github.io/new-hope7-app/?v=13`
- Admin: `https://omideno7.github.io/new-hope7-app/admin.html?v=13`


## v1.3.1
- Added public anonymous Questions & Answers.
- Added admin answer workflow.
- Fixed school registration to submit to Supabase registrations table.
- Added qa_questions table to SQL schema.

## v1.3.4
- Q&A page is cleaner: My Questions and Public Answers are collapsed sections; each answer opens only when the user taps the question.


## v1.3.6 Notifications

OneSignal Web Push connected with App ID. Enable notifications from Home or Settings.
