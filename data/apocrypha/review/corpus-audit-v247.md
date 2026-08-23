# New Hope 7 — Apocrypha / Deuterocanon Corpus Audit v2.4.7

Date: 2026-08-23
Branch: `release-candidate-2.4.0-preview`
Translation-complete baseline: `a2a7e5fa72763c5632d485f199ea3ea3f7ae6a38`
Status: `in_review` — NOT release-ready yet

## Scope

- 19 books in the New Hope 7 Apocrypha / Deuterocanon set.
- 7,501 canonical English source verse rows represented in the project progress manifest.
- Fresh Persian and Croatian coverage is recorded for every source verse row.
- Final release remains blocked until corpus audit and integrated Reader QA are complete.

## Audit phase 1 — completed checks

### Corpus completion / Reader registration

- Progress manifest records 19/19 books complete for EN + fresh FA + fresh HR coverage.
- Sirach manifest records 51 chapters and 1,393 source / FA / HR verse rows with zero missing localized rows.
- Sirach translation files from chapters 1–51 are registered in the continuation overlay registry.
- Audit corrections are isolated in `translation-overlays-v247-audit-corrections.json`, loaded after the translation registries so verified corrections win without rewriting the original review batches.

### Verified corrections

1. **Tobit 1:2**
   - Problem: FA/HR review text had introduced Kadesh (`قادش / Kadeš`), which is not present in the project's KJVA source row.
   - Action: audit correction overlay now follows the actual KJVA wording without the introduced place name.

2. **Tobit 14:11**
   - Problem: Persian age was malformed as `صدوهشت‌وپنج` while the KJVA source and Croatian text say 158.
   - Action: Persian corrected to `صد و پنجاه‌وهشت سال`.

3. **Prayer of Azariah 1:55**
   - Problem: imported English snapshot duplicates the mountains line at verse 55. The canonical Song of the Three sequence has **fountains** here; the fresh Croatian review already documented and used `Izvori`.
   - Action: FA correction uses `چشمه‌ها`, HR remains `Izvori`, and the RC Reader normalizes the English display to `O ye fountains...`.
   - Note: the immutable imported source snapshot remains traceable; the Reader display normalization is explicitly audit-scoped.

4. **1 Enoch 108:15**
   - Problem: the R. H. Charles print snapshot carries the printer imprint (`Printed in Great Britain...`) inside the final verse, and that artifact was also carried into FA/HR review text.
   - Action: RC Reader now strips the printer imprint from EN/FA/HR display at 108:15 while preserving the source snapshot for provenance.

### Targeted high-risk review — Second Esdras 15–16

Compared the previously flagged difficult rows against the project's KJVA source, including 15:32, 15:35–40, 15:54 and 16:50.

- No missing or displaced verse was found in these targeted references.
- 15:32 follows the awkward KJVA source construction and remains source-faithful.
- 15:35–40 preserves the KJVA star/cloud/storm imagery without verse-number shifts.
- 15:54 remains a continuation of 15:53 in the KJVA punctuation/structure and is represented as a separate normalized verse as required by project versification.
- 16:50 remains semantically difficult because the KJVA pronoun chain is itself ambiguous; current FA is retained for now and remains `in_review` for final style/readability pass.

## Remaining audit gates

1. Enumerate every book/chapter/verse against its canonical source and assert no missing, duplicate, out-of-order or overlay-created non-source references.
2. Assert non-empty EN/FA/HR display text for all 7,501 rows after all registries and audit corrections are applied.
3. Scan FA/HR for placeholders, control characters, `/n/n`, Cyrillic leakage, legacy/prepared text leakage and accidental source/editorial metadata.
4. Recheck source translation, license, versification and source snapshot/checksum metadata per book.
5. Review other known textual/versification exceptions and document the chosen normalization.
6. Integrated Reader QA: language switching, chapter navigation, verse tools/highlights, mobile flow and fresh-cache behavior.
7. Only after all blockers are zero: change `release_ready` to true and prepare the release candidate for store testing / production approval.
