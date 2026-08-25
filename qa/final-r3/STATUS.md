# New Hope 7 — Final QA R3.1 3.9.1

**Branch:** `qa/final-integration-20260825-r3`  
**Approved UI baseline:** RC 2.5.1 commit `a6b0f6465e2d7f3e335b528a116d962cbe8f5b20`  
**Current production baseline retained:** `main` app `2.3.9.44`

## Apocrypha translation source

R3.1 keeps the exact approved translation pipeline from RC 2.5.1. It first suppresses legacy third-party Persian/Croatian text and then applies the three fresh New Hope 7 registries prepared from the English source:

1. `translation-overlays-v245.json`
2. `translation-overlays-v246-continuation.json`
3. `translation-overlays-v247-audit-corrections.json`

The CI hydration and merge test fails if any of the 19 books lacks complete fresh Persian or Croatian coverage.

## Apocrypha Reader behavior

R3.1 retains all approved Reader functions and changes the visual flow to match the written Bible more closely:

- 19-book trilingual catalogue.
- Fresh New Hope 7 Persian and Croatian overlays from the English source.
- Verses flow continuously after one another instead of each verse occupying a separate row.
- Verse numbers appear as compact superscript markers.
- Tapping a verse still opens its tools without breaking the stored verse structure.
- Previous/next book and chapter navigation.
- Chapter selector and swipe navigation.
- A− / A+ text scaling.
- Highlight, private note, copy, share and saved verse.
- Direct navigation from a saved Apocrypha verse to its exact book, chapter and verse.

The continuous layout is implemented as a presentation overlay. It does not rewrite, combine or remove verse records, so saved references, notes and highlights remain verse-specific.

## Live sermon archive

A database audit on 2026-08-25 found:

- **109 published sermons**.
- **109 sermons with audio URLs**.
- **9 active sermon categories**.
- Latest published record dated 2026-08-24.

The reason R3 previously displayed the first-version bundled archive was an RLS mismatch: `public.sermons` allowed administrators to manage/read rows, but there was no read policy for ordinary approved School accounts. The client therefore received no cloud sermon rows and silently loaded `data/audio/messages.json`.

R3.1 corrects this in two layers:

1. Migration `20260825214500_sermon_archive_approved_access_v391.sql` allows signed-in administrators and fully approved School accounts to select only published sermons.
2. The QA bridge blocks the obsolete bundled `data/audio/messages.json` fallback completely. When the cloud archive is unavailable, the user sees a clear sign-in/approval message rather than old sermons.

A simulated authenticated, non-owner approved School account was verified against the new policy and could see all **109** published sermons.

## Spiritual Plans restored

The exact approved RC plan module and catalogue remain active:

1. 30 Days of Prayer and Speaking in Tongues (`prayer-30`)
2. Life in Grace (`grace-14`)
3. Fasting and Prayer (`fasting-7`, with fasting-type teaching)
4. Obedience and Blessing (`obedience-10`)
5. Salvation and New Life in Christ (`salvation-10`)
6. Change Your Thinking (`mind-renewal-14` in the approved RC snapshot)

The future production normalization must still address the previously requested 30-day expansion of Change Your Thinking; the approved RC snapshot itself remains 14 days.

## Nine trilingual library books

A direct database audit found nine active, published, Reader-ready public books with substantial Persian, English and Croatian text:

- How to Receive a Miracle and Retain It
- Seven Things the Holy Spirit Will Do in You
- Don't Stop Here! — A Spiritual Journey to Greater Impact
- When God Visits You
- Praying the Right Way
- How to Pray Effectively — Volume One
- The Counter Attack — Revised Edition
- Join This Chariot
- The Holy Spirit & You

Eight books have matching page/section counts in all three languages. `How to Pray Effectively — Volume One` contains the introduction, all 11 teaching chapters and the closing prayer invitation in Persian and Croatian; the English-only front matter, other-books list and Scripture appendix remain flagged for the final editorial pass.

## Current safeguards retained

- Complete registration and canonical signup path.
- Password recovery eligibility: confirmed Auth email + complete approved School registration.
- Complete lesson audio before assignment.
- Assignment required for every lesson before final exam.
- Secure server-side exam session/scoring and maximum three attempts.
- School guide in Persian, English and Croatian.
- `main` remains unchanged by R3.1.

## Required user QA before merge

1. Open an Apocrypha chapter and confirm that verses run continuously like the Bible rather than appearing in separate rows.
2. Confirm A−/A+, highlight, note, save, copy and share still work on individual verses.
3. Save one Apocrypha verse and open its exact book/chapter from Saved Verses.
4. Sign in on the QA domain with a complete, admin-approved School account.
5. Open Audio Sermons and confirm the current admin archive appears with approximately 109 published sermons and nine categories.
6. Confirm the obsolete bundled archive is never displayed; an invalid or expired session must show a sign-in message instead.
7. Confirm all six Spiritual Plan cards.
8. Confirm the nine trilingual library books.
9. Retest School audio → assignment → final exam gate.

Only after these checks pass should R3.1 be normalized into production files and merged to `main`.
