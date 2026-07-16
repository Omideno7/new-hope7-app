New Hope 7 v2.1.2 – urgent account, registration and admin hotfix

This package fixes:
1. Old approved users being unable to restore/sign in to school access.
2. New registration requests being saved locally but not reliably reaching Supabase.
3. Registration count appearing while request cards fail to load.
4. Admin dashboard error caused by the missing adminDashboard function.
5. Slow admin loading caused by waiting for every large dataset before displaying requests.
6. Missing visible alert in the admin panel for new requests.

INSTALL ORDER
1. In Supabase SQL Editor, run:
   supabase_v2_1_2_auth_registration_admin_hotfix.sql
2. Upload/replace these files in GitHub:
   admin.html
   index.html
   js/app.js
   service-worker.js
3. Open the admin panel and hard refresh once.
4. Ask affected users to completely close and reopen the app while online.
   Their queued registration request will retry automatically.
5. An approved older user should choose “Sign in to school”, enter the same approved email,
   and enter a password of at least 6 characters. If an Auth account already exists and the
   password is forgotten, use “Forgot password”.

IMPORTANT
- The SQL and admin.html repair take effect without a Google Play update.
- The improved js/app.js behavior reaches native Android users only after the next AAB update,
  but the repaired RPC/RLS in SQL already supports the currently installed build.
- No registration, exam, lesson, assignment or user data is deleted.
