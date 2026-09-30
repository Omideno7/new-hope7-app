# Notes + Deep Links v5.0.1 QA

Branch: `feature/notes-deeplinks-v501-preview-20260930`
Base: `main@2b7e666c9634b31d90627e1c24b4787b71f36c88`

## Notes
- Legacy numeric line breaks: PASS
- Double-encoded numeric line breaks: PASS
- HTML `<br>` / escaped `&lt;br&gt;`: PASS
- `&nbsp;` / numeric spaces: PASS
- Percent-encoded newline / spaces: PASS
- Literal `\\n` / `\\r\\n`: PASS
- Existing Bible-note storage is repaired locally without deleting saved/highlight state.
- Existing sermon / generic / gratitude / apocrypha notes are repaired locally.
- New Bible and sermon saves use canonical plain newline text.
- My Notes renders canonical text.

## Deep Links
- Bible verse share builds exact BOOK / CHAPTER / VERSE URL: PASS
- Sermon share builds exact sermon UUID URL: PASS
- Landing page iOS App Store fallback: PASS
- Landing page Android Google Play fallback: PASS
- Native scheme targets prepared:
  - `newhope7://sermon/<UUID>`
  - `newhope7://bible/<BOOK>/<CHAPTER>/<VERSE>`
- Native wrapper registration: PENDING because wrapper projects / signing config are not in this repository.

## Safety
- `main`: untouched.
- Supabase Production: untouched.
- Service Worker: untouched.
- Existing user Notes / Saved Verses / School Progress: no schema or destructive migration.
- App icon: intentionally not changed.


## Auth-gated deep-link flow
- Installed + signed in → opens exact sermon / exact Bible verse.
- Installed + signed out → target is stored in `nh7_pending_deep_link_v501`; Account screen asks user to sign in or start registration.
- Successful Account sign-in → pending target resumes before normal School navigation.
- Successful School sign-in → pending target resumes before normal School navigation.
- New registration with an authenticated session → pending target resumes automatically.
- If email confirmation prevents an immediate authenticated session, pending target remains for up to 7 days and resumes after later sign-in.
- Not installed → landing page attempts native scheme / Android intent, then falls back to App Store or Google Play.
- First install deferred target handoff is not yet implemented; after a fresh store install, the original shared link must currently be opened again.
