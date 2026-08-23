# New Hope 7 — Apocrypha / Deuterocanon Corpus Audit v2.5.0

Date: 2026-08-23
Branch: `release-candidate-2.4.0-preview`
Translation-complete baseline: `a2a7e5fa72763c5632d485f199ea3ea3f7ae6a38`
Machine audit report: `artifacts/apocrypha-corpus-audit-v250.json`
Status: MACHINE CORPUS GATE PASSED — integrated full-app QA / user approval pending

## Scope and result

- 19 books in the New Hope 7 Apocrypha / Deuterocanon set.
- 7,501 canonical English source verse rows.
- Final merged Reader coverage: EN 7,501 / FA 7,501 / HR 7,501.
- Missing localized rows: 0.
- Machine blockers: 0.
- Machine warnings: 0.
- Per-book counts match the canonical source and progress manifest.
- Reader overlay no longer creates non-source chapters or verses; stale/misaligned overlay references are rejected.

## Verified final-audit corrections

1. **Tobit 1:2** — removed introduced Kadesh (`قادش / Kadeš`) because it is not present in the project KJVA source row.
2. **Tobit 14:11** — corrected malformed Persian age to `صد و پنجاه‌وهشت سال` (158).
3. **Prayer of Azariah 1:55** — normalized the known imported-source duplicate to the canonical fountains reading: FA `چشمه‌ها`, HR `Izvori`, Reader EN `O ye fountains...`.
4. **1 Enoch 108:15** — stripped the R. H. Charles printer imprint from Reader display in EN/FA/HR while retaining the immutable source snapshot for provenance.
5. **1 Enoch 74–75** — restored 26 Persian rows found missing by the machine audit.
6. **Sirach** — restored 19 omitted canonical FA/HR rows: 26:19–29, 31:31, 33:26–31 and 34:26.
7. **Sirach 32** — removed two stale non-source rows (32:25–26) that duplicated the beginning of chapter 33.
8. **2 Maccabees 11:5** — corrected Persian distance from the erroneous `بیست فرسنگ` to the KJVA source wording `پنج فرلانگ`.
9. **Baruch 1:10** — restored the KJVA source-specific manna wording (`مَنّا / manu`) instead of the earlier generic rendering.
10. **Text-sanity cleanups** — cleaned the flagged Croatian rows at 3 Maccabees 6:24, 4 Maccabees 13:22, 2 Maccabees 15:10 and 1 Enoch 90:28.
11. **Overlay compatibility** — added support for declared-language single-chapter files (`language: fa/hr` with `verses[].text`), fixing Reader application of files such as Third Maccabees Persian.

## Targeted difficult-source review

### Second Esdras 15–16

The previously flagged rows 15:32, 15:35–40, 15:54 and 16:50 were compared again with the project KJVA source.

- No missing or displaced verse was found.
- 15:32 follows the awkward KJVA construction.
- 15:35–40 preserves the KJVA star/cloud/storm imagery without verse-number shifts.
- 15:54 remains a continuation of 15:53 in KJVA punctuation but is correctly represented as a separate normalized verse.
- 16:50 has an ambiguous KJVA pronoun chain; the current rendering remains source-faithful and `in_review` for any later editorial style pass.

## Machine gate details

The final validator mirrors the RC Reader pipeline: canonical runtime → fresh localized filter → base translation registry → continuation registry → final-audit correction registry → documented display normalizations.

It verifies:

- canonical book/chapter/verse identity and source counts;
- exact 7,501-row source/runtime alignment;
- complete EN/FA/HR display coverage after overlays;
- no missing or duplicate canonical references;
- no blank localized rows;
- no TODO/TBD/translation placeholders, control characters, `/n/n`, Cyrillic leakage in Croatian, legacy/Razgah markers or printer metadata in final displayed text;
- source translation/license/versification metadata presence;
- regression assertions for the verified audit corrections above.

Final report result: `structural_release_gate_passed: true`, `blocker_count: 0`, `warning_count: 0`.

## Remaining release gate

The only remaining gate is integrated full-app QA on the pinned RC build: app startup, authentication paths, Books/Apocrypha navigation, all 19 titles, EN/FA/HR switching, chapter navigation, Reader flow, verse tools/highlights, cache freshness and general mobile/full-app regression checks. Production release remains blocked until the user completes this QA and explicitly approves release.
