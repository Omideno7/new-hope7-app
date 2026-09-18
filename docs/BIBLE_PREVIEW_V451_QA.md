# Bible Preview 4.5.1 — verified checkpoint

Date: 2026-09-18. Scope: Bible reader and 2500-keyword concordance only.

## Verified versions

- Working branch: `feature/bible-keywords-v450-preview-20260918`.
- Tested runtime commit: `6d5ac49f1dff841c38bef11b8272b8084487ee2e`.
- Main before and after this work: `eccd9a12c2ac6f216f678c0ea81635d42db830cd`, unchanged.
- Dedicated immutable Preview: https://rawcdn.githack.com/Omideno7/new-hope7-app/6d5ac49f1dff841c38bef11b8272b8084487ee2e/bible-preview.html
- The host can show an `Open the page` notice. Follow that normal button, then Amen, Bible, written Bible, Keywords.
- Do not use `index.html` as the isolated Preview; its normal production integrations are not the dedicated test entry.

## Evidence

- Full source/data audit and 14-scenario Chromium regression: https://github.com/Omideno7/new-hope7-app/actions/runs/35390924746 — success. Artifact ID: 10565807497.
- Actual public URL verification, including embedded logos and Persian keyword-to-verse navigation: https://github.com/Omideno7/new-hope7-app/actions/runs/35391220751 — success. Artifact ID: 10565397805.
- Workflow artifacts contain machine-readable reports and screenshots; configured retention is seven days.

## Data validation

Each language (Persian, English, Croatian) contains exactly 2500 unique normalized keywords: 7500 in total. All occurrence counts match the current corpus; zero keywords have no matching verses. Occurrences and matching-verse totals are intentionally distinct.

Corpus validation covers 66 books, 1189 chapters and 31102 unique verses. Corpus file hashes are unchanged. This is structural verification of the existing translations, not a replacement translation or a complete scholarly translation review.

## Completed behavior

- Shared Persian normalization fixes keyword count/search inconsistencies.
- All keywords are reachable through list pagination; search results are no longer truncated at 200.
- Per-language filter state and return navigation are retained; results open and focus the exact verse.
- Single and multi-verse save/unsave preserve unrelated bookmarks, notes, highlights and unknown stored fields.
- Cancel selection and successful mocked sharing dismiss the toolbar; mobile controls stay within the viewport.
- Editing and reloading preserve test notes. Original non-preview storage sentinels remain byte-identical.
- English duplicate leading verse numbers are removed at display time only; source verses remain unchanged.

## Isolation and remaining release gates

The dedicated Preview prefixes local storage with `nh7_preview_bible_v451:`. It does not use real accounts, Supabase, push services or service workers. App network requests in both QA runs were same-origin GET/HEAD only, with no external application requests, writes or JavaScript page errors. Requests from the hosting notice are reported separately from application requests. Preview-only styles omit external font imports and embed the existing logo to avoid CDN image redirects, without relaxing CSP.

All storage fixtures are synthetic. Existing real user notes are intentionally not displayed in Preview, and Preview notes do not synchronize with production. Production and main were not modified. No merge or release is authorized.

Still required before release: user review on real iPhone/Android, native share-sheet checks and scoped integration/cloud-sync checks. Browser tests use Chromium with mobile/desktop viewports, not a native phone. `navigator.share` was mocked in regression tests.
