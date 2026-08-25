# New Hope 7 — Final QA R3.3 3.9.3

**Branch:** `qa/final-integration-20260825-r3`  
**Approved content/UI baseline:** RC 2.5.1 commit `a6b0f6465e2d7f3e335b528a116d962cbe8f5b20`  
**Current production baseline retained:** `main` app `2.3.9.44`

## Current QA scope

R3.3 keeps the approved 19-book trilingual Apocrypha translations and Reader, six Spiritual Plans, nine trilingual library books, the current School/exam safeguards, the live Admin sermon archive and the personal one-device video portal. Nothing from R3.3 has been merged into `main` yet.

## Apocrypha Reader

- All 19 books have complete fresh Persian and Croatian project translations over the English source.
- Verses flow continuously like the Bible, with compact superscript verse numbers.
- A− / A+ scaling, notes, copy, share and exact Saved Verse navigation remain active.
- R3.3 fixes the Safari highlight regression: yellow, green, blue, pink and purple classes now override the transparent inline-reader background.
- The Apocrypha star is now a true toggle:
  - first press saves locally and syncs the signed-in account;
  - second press removes the same reference locally and from `nh7_account_saved_verses`;
  - verse metadata remains available for the Saved Verses panel.

## Live sermons

- The obsolete bundled first-version archive remains disabled.
- The current archive is loaded through authenticated RPC `nh7_sermon_catalog_v392`.
- The catalogue reflects current Admin uploads and categories rather than a static bundled JSON.

## Personal video access

- The video entry shows a visible password form rather than a generic Load failed screen.
- A personal password is restricted to its assigned account and first device.
- The backend supports all videos, one video or a selected set of videos.
- Secure signed playback and account/device watermarking remain active.

## Secure self-service account deletion

R3.3 adds **More → Account → Permanently delete account** for signed-in non-admin users.

The client requires:

1. current account password;
2. exact account email confirmation;
3. the word `DELETE`;
4. a permanence acknowledgement checkbox;
5. final confirmation.

The password is reauthenticated through Supabase Auth before deletion. The database function then verifies the authenticated/confirmed identity, exact email and `DELETE` phrase, and refuses owner or administrator accounts.

The permanent deletion transaction removes the Auth account and linked New Hope 7 data, including registrations, School progress/audio/assignments/exams/certificates, saved verses, notes, plans, messages, content grants, video codes/grants, sessions and associated device records. A hashed audit record is retained without storing the deleted email in plain text.

The deletion path was exercised inside a rollback transaction using a non-admin account. The transaction completed successfully and the rollback confirmed that the test account remained present.

## Merge strategy

R3.3 must **not** replace `main` as a whole. The production release procedure is:

1. create a fresh release branch from the latest `main`;
2. transfer only approved R3.3 modules, migrations and data;
3. reconcile same-file changes manually so newer `main` functionality is retained;
4. review the complete diff for accidental deletions;
5. run CI and full regression tests;
6. merge the reviewed release branch into `main`.

Therefore the intended result is that current `main` features remain and the approved R3.3 changes are added. Only explicitly obsolete paths, such as the legacy Apocrypha/archive fallback, are removed or bypassed.

## Required user QA before normalization

1. Choose each Apocrypha highlight color and confirm it appears immediately and persists after reopening the chapter.
2. Save an Apocrypha verse, press the same star again and confirm it is removed from Saved Verses.
3. Confirm note, share, A−/A+ and direct Saved Verse navigation still work.
4. Test video password entry with a newly created personal test code.
5. Open More → Account and confirm the delete-account danger zone is present.
6. Test permanent deletion only with a disposable test account; verify that login fails afterward and the account disappears from Admin.
7. Recheck live sermons, Plans, library and School gates.

Only after these checks pass should R3.3 be normalized onto the latest production `main`.
