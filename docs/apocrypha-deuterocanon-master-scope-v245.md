# New Hope 7 — Apocrypha & Deuterocanonical Master Scope v2.4.5

## Release policy
- Work only on `release-candidate-2.4.0-preview` until user QA approval.
- Do not merge into `main` or change production behavior before explicit approval.
- Every translated verse must remain `in_review` until corpus audit passes.
- No legacy third-party Persian text may be promoted into the new reader.

## Corpus model
The app presents one unified **Apocrypha & Deuterocanonical Library**. Books are stored once and tagged by tradition/scope rather than duplicated.

### Core Deuterocanonical / Catholic corpus
- Tobit
- Judith
- Wisdom of Solomon
- Sirach / Ecclesiasticus
- Baruch
- Letter of Jeremiah
- 1 Maccabees
- 2 Maccabees
- Additions to Esther
- Prayer of Azariah & Song of the Three Holy Children
- Susanna
- Bel and the Dragon

### Broader Apocrypha / Orthodox & historical corpus in New Hope 7
- 1 Esdras
- 2 Esdras
- Prayer of Manasseh
- 3 Maccabees
- 4 Maccabees
- Psalm 151
- 1 Enoch

## Translation policy
- English: use an explicitly documented public-domain/reference source per book whenever possible; preserve source metadata and verse numbering.
- Persian: New Hope 7 translation created from the approved English/reference source; no reuse of the prior organization Persian translation.
- Croatian: New Hope 7 translation created from the same approved reference source; do not depend on existing copyrighted/attributed Croatian wording for the final independent translation.
- For sources requiring special handling (for example 1 Enoch), retain exact source, edition, versification and license/provenance metadata.
- Each verse stores `text_en`, `text_fa`, `text_hr`, source metadata, review status and canonical book/chapter/verse identifiers.

## Reader requirements
- Bible-style continuous reading flow: verse text follows verse text in one readable body, with verse numbers inline.
- Chapter selector; previous/next chapter; previous/next book; swipe chapter navigation.
- Per-verse actions: multi-color highlight, private note, copy, share.
- Highlight palette: yellow, green, blue, pink, purple; clear highlight.
- Language follows app language automatically.
- Missing in-house translation must show a clear pending state instead of legacy third-party text.

## Corpus QA gates
Before release, automated checks must confirm:
1. 19 expected books are present.
2. Expected chapter counts are present per source/versification.
3. No missing English source verse in the canonical runtime.
4. No missing Persian or Croatian translation in any release-ready chapter.
5. No duplicate verse keys.
6. No out-of-order verse numbers.
7. No stale source-English mismatch in translated rows.
8. No legacy Persian/Croatian prepared text accidentally promoted into the in-house corpus.
9. All three language book titles and chapter labels render correctly.
10. Reader actions work on iOS Safari, Android Chrome/PWA and native wrappers.

## Library text project
For user-provided books/handouts:
- Extract and normalize text into structured chapters/sections.
- Store `fa`, `en`, `hr` reader text in the app rather than relying on PDF viewing.
- Preserve the original PDF privately as source/archive when appropriate.
- Publication requires the work to be user-owned, licensed for this use, or public domain.

### Audience classes
- `public`: visible to approved ordinary users according to app access policy.
- `ministers`: the Ministers Library menu is locked until authorization.

### Ministers authorization target
Admin can create/revoke an access code for a specific minister and configure:
- user/account binding,
- optional device binding,
- expiry,
- activation/use limit,
- allowed collections,
- allowed individual items,
- immediate revoke.
Only authorized collections/items should be returned to the client; hidden minister resources must not be enumerated before authorization.

## Release sequence
1. Complete reader UX.
2. Complete FA/HR corpus translation in batches.
3. Run corpus audit until zero blocking issues.
4. Complete Ministers Library scoped-access upgrade.
5. Import/translate approved PDF books and handouts.
6. Full RC QA on isolated preview.
7. Freeze release candidate.
8. Google Play Internal Testing.
9. iOS TestFlight.
10. User approval and production release.
