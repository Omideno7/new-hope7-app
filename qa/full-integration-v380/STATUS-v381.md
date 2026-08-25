# New Hope 7 — Full Integration QA 3.8.1

**Final QA branch:** `qa-full-integration-v381`  
**Production main:** `2.3.9.44`  
**Merge status:** Not merged  
**Store build status:** Not generated

## Implemented in this QA snapshot

### Apocrypha
- The approved 19-book project asset is pinned to commit `a4235c6c0c38d24abf4dbd6a975f2a03c196de60`.
- The old Apocrypha reader is removed from the QA launcher.
- Project FA/EN/HR structured text has priority.
- The reader supports book/chapter navigation, notes, highlight, copy, share and save.
- Saved Apocrypha references use `APO:<book>:<chapter>:<verse>`.
- The Saved Verses action opens the exact book, chapter and verse.

### Nine trilingual books
- `nh7-qa-library-v363.js` is loaded.
- `NH7_QA_LIBRARY_V363` and `NH7_QA_NINE_BOOKS` are enabled by the stable launcher.
- The library view was browser-checked in FA, EN and HR with at least nine distinct prepared item titles in each language.

### Minister books and booklets
- Owner-only entitlement storage and RPCs are installed in Supabase.
- Admin can select only a fully registered, approved account.
- Admin can grant/revoke the whole Minister hub.
- Admin can grant/revoke an exact book, booklet, library item or collection.
- The user app reads account entitlements and shows only allowed items.

### School workflow
- Audio progress is stored server-side per account and lesson.
- Skipping forward does not count as listened time.
- Completion requires the listening threshold and end/coverage condition.
- Assignment UI is locked until that lesson audio is complete.
- Final exam access requires lessons, all lesson audio and all required assignments.
- Server-side exam submission repeats these checks.
- Final score is documented as 70% exam + 30% assignments; passing score is 70%.
- Maximum exam attempts remain 3.
- The School guide and blocking messages are implemented in FA, EN and HR.

### Registration and password recovery
- Name, date of birth, city, country, spiritual age, testimony, discovery source, email and phone have stricter rules.
- Email typo suggestions and phone normalization are included.
- Incomplete or invalid forms are stopped before submission.
- Password recovery eligibility requires a confirmed Auth account plus a complete approved School registration.
- User-facing validation/recovery messages are implemented in FA, EN and HR.

### Account administration
- Delete request only: removes registration request rows while keeping Auth and other account data.
- Full deletion: owner-only, typed confirmation required, removes Auth and linked account data.
- Test-account filtering is available.
- Sensitive actions are logged.

## Automated verification completed

- Both final GitHub Actions validation workflows passed.
- The validation workflows contain no deploy or merge job.
- Stable hub and stable app opened in a real browser without uncaught JavaScript/module errors.
- All four new frontend modules loaded and reported their expected version globals.
- The stable launcher loaded all modules from `qa-full-integration-v381`.
- Approved Apocrypha catalogue rendered 19 books.
- 4 Maccabees chapter 4 rendered non-empty text in FA, EN and HR.
- A saved 4 Maccabees verse produced the patched Saved Verses button and reopened the exact chapter/verse.
- Nine-book library rendering was checked in FA, EN and HR.
- Invalid registration values produced field errors for email, phone and other required fields.
- Recovery for an unapproved address was blocked with HTTP 403 before Auth recovery.
- Supabase schema/RPC existence, grants and owner restrictions were checked.
- A temporary exact-book entitlement was granted, verified and removed in an automated smoke test.
- A completed approved student was correctly blocked with `audio_required` by the v380 exam session.
- A temporary audio-progress smoke test reached completion only after the required listened coverage, then its test row was removed.
- The course has gradeable assignments and the assignment gate is active.

## Manual acceptance tests still required before merge

1. Use a disposable fully registered student account to complete one real lesson audio and assignment through the mobile UI.
2. Confirm the final exam unlocks only after every audio and required assignment is complete.
3. Use an approved real test email to complete the full password-recovery email-link flow.
4. In Admin QA, grant and revoke Minister hub and one exact book/booklet, then verify the same test account sees only its allowed content.
5. Use disposable test accounts to verify request-only deletion and full-account deletion separately.
6. Review the nine book titles and content in FA/EN/HR for editorial approval.
7. Review all 19 Apocrypha books, with emphasis on first/middle/last chapters and 4 Maccabees.

Only after these manual acceptance tests pass should the QA branch be merged to `main` and new Google Play/App Store packages be generated.
