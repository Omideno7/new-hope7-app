# New Hope 7 — Apocrypha 19-book trilingual coverage

This directory contains the bounded Apocrypha content work for branch
`agent/next-plans-logo-240`. It does not change app runtime code, authentication,
Supabase data, or any feature outside the Apocrypha library.

## Scope

The project scope is exactly these 19 titles:

1. First Esdras
2. Second Esdras
3. Tobit
4. Judith
5. Additions to Esther
6. Wisdom of Solomon
7. Sirach / Ecclesiasticus
8. Baruch
9. Letter of Jeremiah
10. Prayer of Azariah and Song of the Three
11. Susanna
12. Bel and the Dragon
13. Prayer of Manasseh
14. First Maccabees
15. Second Maccabees
16. First Enoch
17. Third Maccabees
18. Fourth Maccabees
19. Psalm 151

`Additions to Daniel` is not a twentieth title: its three project components are
Prayer of Azariah / Song of the Three, Susanna, and Bel and the Dragon. Odes,
Jubilees, Meqabyan, and Psalms of Solomon are outside this delivery.

## Coverage and review gate

- English: 19 canonical alignment/reference files.
- Persian: 14 previously prepared draft titles plus 5 review sets (Fourth Maccabees,
  Judith, Prayer of Azariah, Susanna, and Bel and the Dragon).
- Croatian: 13 previously prepared titles plus 6 review sets (First Enoch,
  First Esdras, Second Esdras, Third Maccabees, Fourth Maccabees, and Psalm 151).

The text coverage is complete, but coverage is not the same as publication
approval. Every newly prepared Persian or Croatian row remains `in_review`, and
the 14 pre-existing Persian titles retain their earlier draft state. Do not import
or publish review rows until editorial approval.

## Sources and numbering

English alignment text uses KJV with Apocrypha, World English Bible Classic, and
the public-domain R. H. Charles edition of First Enoch. KJVA books were checked
against the official eBible USFM snapshot; extraction defects were repaired and
the small set of obvious source-typography corrections is recorded per file.
Source URLs, edition names, license notes, chapter counts, and verse/segment
counts are stored per book in `catalog.in-review.json` and `sources/en/`.

The newly prepared Croatian files are fresh project translations from those
English alignment sources. The Ivan Šarić text is not bundled or copied: although
eBible labels its revision public domain, the revision provenance and ordinary
EU term require separate legal confirmation. It may be used only as a QC
comparison source unless that basis is confirmed.

Numbering is source-specific. The validator deliberately does not force equal
verse counts across languages. This prevents silent loss or fabricated rows in
known variant areas such as Second Esdras, Tobit, Sirach, Esther/Daniel additions,
Prayer of Manasseh, Fourth Maccabees 8, and First Enoch 91–93.

## Validation

Run from the repository root after copying this package into place:

```bash
node scripts/validate-apocrypha-19.mjs
```

The validation checks the exact 19-book set, source completeness, chapter/verse
continuity, byte-for-byte English alignment, translation non-emptiness, review
statuses, checksums, and catalog totals.
