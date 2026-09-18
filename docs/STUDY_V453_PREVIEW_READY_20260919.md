# Study and Theme Studio v4.5.3 — Preview ready

## State and exact entry

Repository: `Omideno7/new-hope7-app`.
Feature branch: `feature/reader-lexicon-theme-v453-20260919`.
Verified runtime commit: `8f8fec2e03a23eaef0f59587ac97ade650c54db6`.
Main baseline and final observed main: `259280fe00a7dbc7359c24f997338724961f0c08`.
This phase has NOT been integrated into main. No native build or store submission was made.

Verified immutable public Preview:
https://rawcdn.githack.com/Omideno7/new-hope7-app/8f8fec2e03a23eaef0f59587ac97ade650c54db6/study-preview.html

The host showed its normal `Open the page` notice in the final test. Follow that button, then Amen. The banner's Theme Studio button opens the appearance controls. Bible > written Bible > Original languages opens the separate glossary; Apocrypha remains accessible through Bible.

## Completed functionality in this Preview

### Unified Apocrypha toolbar

Legacy toolbox triggers now delegate to the unified reader. A scoped rule prevents the old toolbox from also appearing when the unified controller is present. Stable book/chapter attributes identify the existing verse wrappers without altering the continuous scripture text. The old Apocrypha view is deactivated on navigation; a delayed language callback cannot resurrect it after leaving.

Single/multiple selection, individual deselection, Copy, Highlight, Save/Unsave, Note and Share retain the previously accepted storage contracts. Original-language study is available from the first selected Bible verse. Its shortcut shares the compact toolbar summary row rather than adding a tall extra row.

The earlier WebKit test blocker was investigated with pointer-event traces: the test's absolute-coordinate clicks did not reliably reach the requested inline verse. The harness now uses an actual text fragment and Playwright locator actionability checks, without forced clicks or scripted replacement clicks. The existing selection assertions and all book/language cases were retained. A subsequent regression exposed a genuine 320px toolbar-height issue; the summary-row layout fixed it without loosening the existing 125px bound.

### Separate original-language core glossary

- 280 recovered core entries: 160 legacy entries plus 120 additional distinct keys recovered from the user's Phase 2 collection.
- 554 selected lemma/reference associations verified against the pinned original-language corpora used by the build.
- 61 old suggested associations were not confirmed and were excluded from displayed reference links; this is not a claim that every excluded association is impossible under every textual tradition.
- 20 entries have expanded trilingual contextual summaries. The other entries have short trilingual glosses and identifiers, explicitly labelled as basic entries.
- Search by Persian/English/Croatian term, original spelling, transliteration or Strong ID; language filter, pagination, contextual references, related-entry comparisons and source-verse navigation.
- Original-language headwords and identifiers are distinct from the existing 2500-per-language Bible keyword search.
- This is NOT a complete 2500/3000/12000-entry lexicon, an exhaustive concordance, a word-aligned interlinear, or an expert-reviewed translation replacement.
- Selected-reference mappings carry source attribution and the applicable license notice. Bible and Apocrypha source JSON files were not edited.

### Theme Studio

Eight preset palettes: New Hope, Ocean, Forest, Royal Purple, Warm Sand, Rose, Midnight and Sepia Reading. Independently configurable app background, card background, main text, secondary text, verse text and accent/button color. Draft preview, readable-contrast validation, automatic readability repair, apply, named personal themes and appearance-only reset are available.

Three added Persian font families (Vazirmatn, Noto Naskh Arabic, Estedad) and three added Latin families (Inter, Lora, Nunito Sans) are packaged with their licenses in the app assets. Persian and English/Croatian have independent choices. Tests loaded the actual font faces, checked Persian/Croatian character coverage and verified application to text, not only a menu label. Device/default and classic choices remain available.

Appearance preferences are device-local. Resetting the custom appearance does not clear notes, saved verses or learning progress. The editor itself retains a readable palette when a proposed draft has insufficient contrast.

## Final successful verification

Workflow: `Study and Theme Studio v453 QA`.
Run: `35406978094`.
Job: `105798638477`.
Triggered from commit: `ad2cc1e20f9d25e0f69ea9874bb129a5091bd6a5`.
Artifact: `10573306091`, `study-theme-v453-ad2cc1e20f9d25e0f69ea9874bb129a5091bd6a5`.
All workflow steps completed successfully, including the final public URL check.

- Chromium: 12 scenario groups passed.
- WebKit: 12 scenario groups passed.
- Each engine exercised 57 Apocrypha book/language cases: a sample chapter from each of 19 books in FA, EN and HR. This is functional sampling, not a verse-by-verse linguistic review of all translations.
- Previously accepted Reader v452 regression: all 13 scenario groups passed without removing assertions. This includes localized Copy/Share, cancellation, group notes, categorized notes, book-grouped saved verses, persistence, original reward compatibility, invalid stored-data protection and viewport bounds.
- Local dedicated Preview: all 10 checks passed.
- Actual immutable public Preview: all 10 checks passed, including actual bundled Persian font loading, glossary/reference navigation, unified Apocrypha controls, localized copy, isolated storage, blocked external/non-GET fetches, no service worker and no uncaught page errors.
- Eight palettes, invalid custom drafts, automatic repair, actual font loading, named-theme persistence and safe reset were exercised. The full app tests checked layout widths 320, 390, 768 and 1280.
- The app's source corpus, backend files, store version and production service workers were compared unchanged against main.
- Full-app tests used synthetic browser data and intercepted all external account/service requests. No real production account or Supabase data was edited.
- Main-before and main-after snapshots matched.
- Screenshot evidence from the actual public Preview was visually inspected after the run.

## Preview isolation

Only `study-preview.html` loads the dedicated guard/generated app copy. Its localStorage namespace is `nh7_preview_study_v453:`. Existing unprefixed note and appearance values were seeded in the test and remained unchanged. New trial notes and themes do not synchronize into the real user account. No login is needed for this reader/appearance Preview. Non-reader/account/notification controls are disabled or excluded; it is not a complete production-account acceptance environment.

## Remaining release gates and next scope

The next gate is the user's physical-phone validation of this exact Preview. Do not merge this entire feature branch blindly. On approval, prepare a runtime-only integration from the latest main, exclude Preview guards, generated preview app/style files, test fixtures and workflows, and update production release-cache wiring for the changed reader scripts, new glossary and bundled fonts. Re-run upgrade/cache preservation and live deployment checks.

Real native iPhone/Android behavior, cross-device account synchronization and iOS/Android signing/build/store submission are not established by browser mocks. The previously known custom release-validator stale pins remain a separate maintenance gate.

Navigation deduplication, notification preferences, download count/size/safe deletion and advanced points remain separate future tasks. No work on those modules was merged during this phase.
