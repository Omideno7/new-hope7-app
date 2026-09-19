# School review v467 regression

The workflow prepares the candidate against main `44dfd189832c4a6031562851765811f941e0efe4`, tests the actual extracted `schoolLesson` source with the new review module, exercises source-matched attempt hints, and tests the independent phone preview in Chromium and WebKit. It does not use a real account or send school submissions to Supabase.

Run locally in a disposable repository checkout with Playwright browsers installed:

1. Run `python scripts/school-review-v467/prepare.py`.
2. Apply the test-only locator-wait substitutions documented in `.github/workflows/school-review-v467-qa.yml`. These avoid Playwright's string-eval polling under the preview's CSP; do not relax `connect-src 'none'` or add `unsafe-eval`.
3. Run `python scripts/school-review-v467/review_qa.py`.
4. Run the scope/cache checks in the same workflow.

The 34 browser groups cover localized revision/draft/submission paths, offline and uncertain results, duplicate clicks, admin review refresh, approved read-only responses, account-scoped new drafts, legacy compatibility, storage failures, literal feedback, attempt budgets, delayed navigation, fourteen real theme palettes and the phone preview. Existing imported remote font CSS is stubbed offline; network account/API requests are not allowed.

The phone preview uses a Map for synthetic account, draft and assignment data. It never rewrites auth sessions, school profiles or real assignment records; only existing Theme Studio preferences use local storage. Its controls and sample text must never be released in main. `school-review-preview.html` includes a dedicated dark-theme text fix for the preview's instruction and exam-example area; the runtime module's scoped theme styles were already tested.

The test output is `qa-output/report.json`, screenshots, `cache-report.json`, `runtime-integration.diff` and `runtime-manifest.json`. Only the seven runtime blobs in the manifest are candidates for a later approved integration. No tests, fixtures, preview files or workflows belong in that integration.

These tests are source-extracted browser and simulated-cache tests, not a claim of full native-device or real-account end-to-end acceptance. The actual backend definitions and active exam limits were separately inspected in a read-only Supabase transaction. No server rule was modified. Phone approval of this new visible interface remains required.
