# Reader v4.5.2 Preview checkpoint

## Verified state

Repository: `Omideno7/new-hope7-app`.
Feature branch: `feature/bible-toolbar-notes-wave-20260918`.
Tested runtime commit: `0554e87363b1bb979f8edaf8609402db08bbd43a`.
Main remains at `569f94080131bf91d64cf7a66684c1159c823d62`; this wave has NOT been merged or deployed to the main app.
No production database, schema, account, stored user record, native package or store submission was changed during this wave.

Verified immutable Preview:
https://rawcdn.githack.com/Omideno7/new-hope7-app/0554e87363b1bb979f8edaf8609402db08bbd43a/reader-preview.html

The host showed an `Open the page` notice during the public browser check. Follow that ordinary button, then Amen. This is a reader-only Preview, not the complete production app.

## Implemented reader scope

- One compact bottom toolbar for Bible and Apocrypha: Copy, Highlight, Save/Unsave, Note, Share and explicitly labelled Clear selection.
- Repeatedly tapping a selected verse deselects only that verse. Other selected verses remain selected.
- Multiple verses support saving, highlighting, copying, sharing and writing notes. Export order follows the verse order rather than tap order.
- References and verse text use the selected FA/EN/HR language. Canonical stored references and identifiers remain unchanged; display localization is separate from identity.
- Copy exports localized references and text. Share adds one localized invitation and one permanent New Hope 7 app landing/download URL. It does not claim native Universal Links or verse-specific deep-link support.
- Successful copy/share clears the selection; cancelled or failed sharing and failed copying keep the selection.
- Multi-verse notes default to append, preserving different existing notes. Replacement requires an explicit choice and confirmation when it would replace old text. Existing note-length limits are checked before writes instead of silently truncating previous notes.
- Existing Apocrypha note/highlight/bookmark formats remain intact. The continuous verse text is not reconstructed by the toolbar.
- My Notes displays nonempty source categories: Bible, Apocrypha, Sermons/Audio, School, Gratitude and Other. Previously omitted Apocrypha notes are collected. Personal note text is not translated; only source labels/references are localized.
- Saved verses are grouped automatically by book, with Apocrypha distinguished. Existing inline verse display, source/chapter navigation and removal remain; localized Copy/Share actions were added.
- Removing a Bible bookmark preserves its note/highlight, changes saved=false and places the latest unsave payload after older queued saves. The queue contract was tested without sending it to production.
- Malformed stored reader data is rejected rather than replaced. Unrelated synthetic notes/progress were checked byte-for-byte after operations.
- The existing single-Bible-verse save reward (5 points and first_verse badge) is preserved. This is compatibility work, NOT the requested advanced gamification redesign.

## Tests and evidence

Final successful workflow: `Reader Wave v452 QA`, run `35399368999`, job `105775494802`.
Artifact: `10568898321` (`reader-v452-1d445573aab8a96f1c6f7b24e57426016ca6010f`).

- Chromium: 13 scenario groups passed, including an independent agent-browser inspection of the actual app.
- WebKit: 13 scenario groups passed.
- Actual full `index.html` and its script set were tested with synthetic storage. Every external request was intercepted; zero real production API requests were made.
- Guest Apocrypha access was verified blocked before using a synthetic approved-state fixture for reader tests. The production access gate was not changed.
- Three-language interaction scenarios exercised John chapter 3 and Tobit chapter 1, multi-selection, localized copy/share, failed/cancelled clipboard/share, group notes, saved-book groups, reload persistence, existing reward compatibility and invalid-data protection.
- Toolbar/layout checks passed at widths 320, 390, 768 and 1280; light/dark screenshots are included.
- No uncaught page errors in the completed runs.
- The isolated local Preview and the actual immutable public Preview each passed 9 checks, including new writes confined to the Preview namespace, unchanged pre-existing unprefixed storage, no service worker, no external application requests and blocked POST/external fetch.
- Source corpus comparison against main passed for `data/bible` and `data/apocrypha`. Twelve JSON-file hashes were recorded. Each keyword language still contains 2500 entries. No text or translation replacement was performed.
- Preparation/build scripts passed idempotence and syntax checks. Main-before and main-after snapshots matched.

## Preview data isolation

The dedicated `reader-preview.html` loads a separate guard and generated app copy. Production `index.html` does not load the guard. Preview storage uses `nh7_preview_reader_v452:` and does not read the actual app's saved notes or account session. No login is required. New trial notes/bookmarks stay in Preview and are not synced into the main account.

The reader Preview exposes only public bundled Bible/Apocrypha files. It has no real account/notification service, disables the cloud and service worker, blocks external and non-GET/HEAD fetches, and uses a restrictive same-origin content policy. Existing logos are embedded; external font imports are removed only from generated Preview styles.

## Remaining work — do not claim complete

1. Physical iPhone/Android testing, actual native share-sheet/clipboard behavior and real-account cloud synchronization are NOT verified by these browser tests.
2. Before any main integration, review a clean runtime-only change set, exclude Preview/test files, update release cache/version asset wiring, and re-run integration checks. Do not merge this entire feature branch blindly.
3. Navigation deduplication on Home/More, per-category notification preferences, offline download count/size/safe removal, and advanced points/gamification remain unimplemented in this delivery.
4. Previously accepted School, Player, Like/Blessing and Settings changes were not redesigned. Existing primary routes received smoke checks only, not a new full production-account acceptance test.
5. The older custom release validator's stale asset pins remain a separate release-pipeline task. No workflow-permission bypass was attempted.

Next user checkpoint: test this dedicated Preview on the phone, especially selection of two verses followed by deselecting one, localized Copy/Share, group notes and Apocrypha. Keep main untouched until the appropriate integration approval and release checks.
