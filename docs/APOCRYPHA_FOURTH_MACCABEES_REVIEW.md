# Fourth Maccabees — Persian and Croatian review continuation

This review package continues the New Hope 7 Apocrypha work without changing application runtime code or production database records.

## Scope

- Book ID: `4_maccabees`
- Persian title: `مکابیان چهارم`
- English title: `Fourth Maccabees`
- Croatian title: `Četvrta knjiga o Makabejcima`
- Overall status: `in_review`
- Persian continuation included here: chapters 5–18
- Croatian continuation included here: chapters 4–18
- Previously prepared ranges intentionally excluded: Persian chapters 1–4; Croatian chapters 1–3

The chapter files include English source text only as an alignment reference. English is not counted as a new translation in this continuation.

## Source and versification

The alignment source is the public-domain World English Bible, Catholic/Deuterocanon (`WEBC`):

- <https://ebible.org/eng-web/4MA.htm>
- License: Public Domain

The package preserves WEBC verse numbering exactly. In WEBC, chapter 8 has 28 verses and the whole book has 484 verses. Some modern editions divide chapter 8 into 29 verses; that known difference is recorded in the manifest and is not treated as a missing verse.

The supplied Persian PDF (`Maccabees4(1).pdf`) was used as a secondary terminology and chapter-boundary reference. It was not copied into this repository package.

## File layout

- `manifest.in-review.json` — book metadata, continuation boundaries, source and QA totals
- `chapters/chapter-04.in-review.json` through `chapters/chapter-18.in-review.json` — one record per WEBC verse
- `scripts/validate-apocrypha-review.mjs` — deterministic structural and completeness checks

For chapter 4, Persian text is intentionally `null` and its locale status is `out_of_scope`; this prevents the continuation package from overwriting the previously prepared Persian chapter 4. Every newly included Persian and Croatian translation record is marked `in_review`.

## Validation

From the repository root, run:

```bash
node scripts/validate-apocrypha-review.mjs
```

The validator checks chapter coverage, exact WEBC verse counts, continuous verse numbering, English source alignment, locale boundaries, non-empty translations, review statuses, control characters, and aggregate totals.

## Release boundary

This package is review data only. It does not update Supabase, publish reader content, or modify web/Android application behavior. Promotion to `ready` and production import should happen only after editorial review.
