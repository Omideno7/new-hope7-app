# New Hope 7 — Final QA R3 3.9.0

**Branch:** `qa/final-integration-20260825-r3`  
**Approved UI baseline:** RC 2.5.1 commit `a6b0f6465e2d7f3e335b528a116d962cbe8f5b20`  
**Current production baseline retained:** `main` app `2.3.9.44`

## Why R2 showed zero Persian verses

R2 read only the unmerged `text_fa`/`text_hr` fields from the canonical runtime JSON. The approved RC did not work that way. It first removed legacy third-party Persian/Croatian text and then loaded three fresh New Hope 7 translation registries:

1. `translation-overlays-v245.json`
2. `translation-overlays-v246-continuation.json`
3. `translation-overlays-v247-audit-corrections.json`

R3 restores that exact approved pipeline and the exact Bible-style reader from RC 2.5.1.

## Apocrypha restored behavior

- 19-book catalogue.
- Fresh New Hope 7 Persian and Croatian overlays from the English source.
- Continuous Bible-style verse layout.
- Previous/next book and chapter navigation.
- Chapter selector and swipe navigation.
- A− / A+ text scaling.
- Highlight, private note, copy, share and saved verse.
- Direct navigation from a saved Apocrypha verse to its exact book, chapter and verse.

The R3 CI hydrates the approved RC data and merges all overlay registries. It fails if any of the 19 books lacks full fresh Persian or Croatian verse coverage. The current R3 validation passed.

## Spiritual Plans restored

The exact approved RC plan module and catalogue are restored:

1. 30 Days of Prayer and Speaking in Tongues (`prayer-30`)
2. Life in Grace (`grace-14`)
3. Fasting and Prayer (`fasting-7`, with fasting-type teaching)
4. Obedience and Blessing (`obedience-10`)
5. Salvation and New Life in Christ (`salvation-10`)
6. Change Your Thinking (`mind-renewal-14` in the approved RC snapshot)

The R3 CI verifies all six catalogue entries and their source files.

## Nine trilingual library books

A direct database audit found nine active, published, Reader-ready public books. Every one contains substantial Persian, English and Croatian text:

- How to Receive a Miracle and Retain It
- Seven Things the Holy Spirit Will Do in You
- Don't Stop Here! — A Spiritual Journey to Greater Impact
- When God Visits You
- Praying the Right Way
- How to Pray Effectively — Volume One
- The Counter Attack — Revised Edition
- Join This Chariot
- The Holy Spirit & You

Eight books have matching page/section counts in all three languages. `How to Pray Effectively — Volume One` contains the introduction, all 11 teaching chapters and the closing prayer invitation in Persian and Croatian; the English-only front matter, other-books list and Scripture appendix are separate non-core extras and remain flagged for the final editorial pass rather than being falsely labelled complete.

R3 routes the approved library UI to the current `nh7_library_catalog_v372` and `nh7_library_reader_access_v372` backends so these nine published items can appear in the user app under the existing account/access rules.

## Current safeguards retained

- Complete registration and canonical signup path.
- Password recovery eligibility: confirmed Auth email + complete approved School registration.
- Complete lesson audio before assignment.
- Assignment required for every lesson before final exam.
- Secure server-side exam session/scoring and maximum three attempts.
- School guide in Persian, English and Croatian.
- `main` remains unchanged by R3.

## Required user QA before merge

1. Open Apocrypha in FA/EN/HR and spot-check First Esdras, Tobit, First Enoch, Sirach and Fourth Maccabees.
2. Confirm continuous verse layout, A−/A+, highlight, note, save and share.
3. Save one Apocrypha verse, return to Saved Verses and open its exact chapter.
4. Open Plans and confirm all six approved plan cards.
5. Open Books & Handouts with an approved test account and confirm all nine books and language switching.
6. Test School audio → assignment → exam gate.

Only after these checks pass should R3 be normalized into production files and merged to `main`.
