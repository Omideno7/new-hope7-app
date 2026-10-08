# PR #126 Safari / Test5 integration

The Safari QA source is `feature/final-qa-v2500-20261004` at **82efc731c64f76c051528ae01189521bee0ee8b9**, supplied by the user. That source contains the real single-`$` verse-note typo. Current main/PR source already uses `$$`; the new regression protects that selector and checks routes with no verse-note elements, including caught render errors.

`ISSUE_125_TEST5_INTEGRATION.patch` applies the reviewed Library client changes and exact `$$` typo correction to this Test5 reference. It preserves Test5's own app outside the Library section, Community/Testimony/Prayer Request/Profile/Calendar, themes/player/navigation, and its existing module imports/order. No whole older `app.js` or release worker replaces the Test5 versions. The reader authorization hunks preserve Test5's reader UI. Release worker changes add Library assets/cache version to Test5's existing asset lists.

The PR's normal runtime also has the real Public Library download/status control and offline PDF viewer path. An offline PUBLIC open resolves a UID/item-bound canonical file proof and calls `NH7OfflineV325.localPlayable` before any Edge request. The existing signed-file flow handles online verification/download. Ministers and unknown items never receive an offline control/fallback. Reclassification removes a stale public card/viewer as well as its file proof/bytes; account changes close the viewer. The offline helper owns cached Blob URLs so closing a viewer does not break the next offline open. FA/EN/HR copy and RTL/LTR stay intact.

## Reproduce in an isolated QA copy only

1. Obtain the exact reference (read-only Git fetch if needed): `git fetch origin feature/final-qa-v2500-20261004`.
2. `node scripts/verify-library-test5-integration-v125.mjs` creates a temporary copy, applies the committed patch, checks syntax and preservation, and prints its `qa_copy` path. It verifies all 555 non-Library reference files byte-for-byte, original script import order, and non-Library app source with only the documented typo/control-selector exceptions.
3. Serve the printed QA copy with the existing local QA server. Run `NH7_TEST_TEST5=1 node scripts/verify-library-public-ui-v125.cjs http://127.0.0.1:8766` against that server. All remote services are mocked; this test never accesses Supabase Production.
4. For the user's Mac QA copy, first run `git apply --check /path/to/ISSUE_125_TEST5_INTEGRATION.patch` from the clean exact Test5 source, then apply it. A context mismatch requires review; do not overwrite or reset changed Test5 files. Use the existing Test5 packaging workflow for `ios-release/www`; the generated native bundle is not committed in this reference and was not accessed by the agent. Retain all unrelated native bundle files/plugins/settings. This is preparation for review/QA, not authorization to publish/deploy.

## Real Safari / iOS retest checklist

- Navigate Home/More/Settings/Profile/Testimonies/Prayer Request with zero verse-note controls: no `null.forEach` error or caught Error card; verify Bible note saving separately.
- Online, open the Public Library and tap its Download offline control. Confirm Offline ready, then disconnect and reopen the PDF from its actual card. Close and reopen again. Neither offline open may request `nh7-library-access` or storage bytes from the network.
- Ministers and unknown content have no offline-download control or offline viewer fallback. Verify logout/account switch and approved reclassification/revocation scenarios in isolated QA fixtures or separately approved test accounts.
- Check FA → EN → HR → FA and direction, current Calendar/Community/Profile/themes/player/navigation, and public download status/remove behavior.

Local Chromium regressions pass on both the PR runtime and patched Test5. Real Safari/iOS/native validation is still a release gate. Playwright WebKit installation was unavailable because the browser download domains returned HTTP 403 `Domain forbidden`; no WebKit or physical-device pass is claimed. No merge, deployment, Supabase/RLS/Storage/schema/data change was performed.


The native iPhone follow-up updates this same exact-reference patch to loader `125.4`: PUBLIC text-only books use the existing v321 reader cache through “Read and prepare offline,” with per-language ready status, and never request a signed PDF URL. File downloads require verified file capability. Open collections survive authorized catalog refresh and reset only on disappearance or UID/audience changes. The browser regression covers both actual user paths in the patched Test5 copy. All previous module/file preservation guarantees remain enforced.


The native-persistence follow-up updates the same patch to loader `125.5` and preserves the newer Test5 reader code while adding the targeted offline-miss handling. PUBLIC text is committed to UID/item/language IndexedDB even if CacheStorage is unavailable. Run `NH7_TEST_SOURCE=/path/to/isolated/Test5/qa node scripts/verify-library-native-reader-v125.cjs http://127.0.0.1:PORT` against its local test server to exercise the full browser-process restart regression with bundled-file modelling and mocked services. Actual iPhone restart/airplane-mode validation is still required. Do not apply this patch over an older patched QA copy: start from the pinned clean Test5 reference as above.
