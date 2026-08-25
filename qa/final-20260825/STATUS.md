# New Hope 7 — Final Integration QA Status

**Date:** 2026-08-25  
**Branch:** `qa/final-integration-20260825`  
**Production shell baseline:** `2.3.9.43`  
**Admin shell baseline:** `2.3.9.40`  
**Final QA integration label:** `3.7.0`

## Release rule

This branch is the only staging source for the next release. Do not merge to `main` and do not build store packages from this branch until the full QA checklist is accepted.

## 1. Registration / account creation

- Client canonical registration validates the complete School form, email and password before signup.
- Supabase `auth.users` has the complete-registration BEFORE INSERT guard enabled.
- Supabase has the atomic AFTER INSERT School-registration trigger enabled.
- Direct database audit found one valid Auth account with complete registration metadata but no School row.
- The valid orphan was backfilled from its existing verified metadata using an idempotent database repair.
- Post-repair verification: **0 valid complete-metadata Auth orphans remain**.
- Duplicate audit: **0 duplicate School email groups / 0 extra duplicate rows**.
- Current School data audit: 107 School registration rows, with 1 pending request at audit time.
- Direct execute access to the two sensitive trigger functions is revoked for both `anon` and `authenticated` roles.
- Repository migration files exist for v3.5.5/v3.5.6, but these manually applied changes are not represented in the hosted `supabase_migrations.schema_migrations` history. Runtime functions/triggers were therefore verified directly rather than inferred from migration history.

**QA status:** Backend repaired, duplicate-free and security-checked. Client flow still needs end-to-end mobile registration test on Final QA.

## 2. Bible Reader and saved verses

- The proven RC snapshot contains Reader UX v2.5.1 and saved-verse chapter action v2.5.2.
- Saved verse cards retain/display verse text and provide a direct “Go to chapter” action.
- Logged-in account saved-verse references sync to `public.nh7_account_saved_verses`.
- The table has RLS enabled and an ownership/admin policy for authenticated access.
- These UX files are not part of the current production `main` shell; Final QA intentionally restores them from the proven RC snapshot.

**QA status:** Backend protection verified; app UX included in Final QA and must be regression-tested before merge.

## 3. Apocrypha — 19 books

Verified review asset totals:

- English: **19/19 books**, 307 chapters, 7,501 canonical rows.
- Persian effective reader coverage: **19/19 books**.
- Croatian effective reader coverage: **19/19 books**.
- Croatian missing books: **0**.
- Croatian partial reader books: **0**.

The previous RC verse-only reader intentionally hid prepared page-based Persian/Croatian payloads, which made some complete material appear unavailable. Final QA v3.7.0 corrects that integration behavior:

- English uses structured canonical chapter/verse text.
- Persian uses structured chapter/verse text when complete, otherwise the prepared Persian document/page payload.
- Croatian uses prepared Croatian chapters where supplied, otherwise structured Croatian rows.
- The reader keeps chapter/book navigation, notes, highlight, copy/share and compatibility with the saved-verse UX overlay.

**QA status:** 19-book content integration corrected in the test branch. No production merge yet.

## 4. Plans / access / protected content

The Final QA app is based on the proven RC application snapshot that already includes:

- Spiritual Plans bridge.
- Account content access controls.
- Minister/library lock.
- School assignment workflow.
- Secure media and protected-audio gates.

**QA status:** Included from proven snapshot; needs regression test together with the newer registration flow.

## 5. Admin

The Admin QA entry point uses RC 3.6.3 and includes the tested admin overlays for:

- Registration requests and approval email actions.
- Student state / panel fixes.
- Audio and video management.
- Per-person video access.
- Documents UI.
- Library / Apocrypha administration.
- Notifications and Q&A localization.
- RBAC.
- University panel and message module.

Separate QA utilities remain available for:

- Message Center QA 3.6.6 — real test sending is limited to Selected audience, max 3 accounts.
- Admin-only trilingual Books Review.

**QA status:** Functionality is assembled but mobile/iPhone UI and real-account workflows must be checked before merge.

## 6. CI / GitHub Pages

The previous production workflow had stale hard-coded assertions that treated app and admin as the same `2.3.9.40` version. Final QA corrected this without deploying the QA branch:

- App/admin versions are validated from `version.json` (`2.3.9.43` / `2.3.9.40`).
- JavaScript syntax checks pass.
- Release metadata and protected School bundle checks pass.
- Auth / registration / recovery checks pass using the current v3.7.0 verifier.
- Admin RBAC / recovery checks pass with version-aware validation.
- HTML inline script parsing passes.
- Final QA integration file checks pass.
- QA branch deployment is deliberately skipped; only `main` may deploy.

**QA status:** **GREEN** on commit `f5c434d95a86ae90fb72eb2423a307ffea4439d7` before this status-only update.

## 7. Store release status

Store review/release status is deliberately not encoded into the source branch. Store packaging starts only after Final QA is accepted and merged to `main`.

## Final merge gate

Before merge to `main`, all of the following must pass:

1. Final QA page loads without module errors.
2. New registration creates exactly one complete pending School request and no orphan Auth account.
3. Login / recovery / re-registration after deletion works.
4. Saved Bible verse displays text, syncs for account, deletes correctly, and opens its chapter.
5. Apocrypha opens all 19 books in FA/EN/HR; spot-check first/middle/last chapters plus 4 Maccabees.
6. Plans render and progress remains functional.
7. School/access gates block unapproved users and admit approved users.
8. Audio/video/library/documents regressions are clear.
9. Admin request list, approval, search, student panel and message UI work on desktop and mobile.
10. GitHub validation is green.

Only after all ten checks pass should the branch be merged and store packages be generated.
