# More -> Store review v469 — RELEASED

19 September 2026. Repository Omideno7/new-hope7-app.

The user positively reviewed the control-free More-menu preview and thanked us, after requesting tested/approved changes be integrated incrementally. The approved runtime was released through clean PR #31.

Main/release commit: `0152649b3d557664c23e7b0c4251db19d455a40b`.
Previous main: `2bde658268eeaed0e7873c83aa7fb54c1d37fc8f`.
Rollback branch: `rollback/pre-store-review-v469-20260919`.
Clean source branch: `release/store-review-v469-approved-20260919`, commit `0ab75eb8866b06986d904a0f05c7af89516bc261`.
Approved More preview: `414f57d982d6205ab2811774731a6a86ba726a17`.

Only six runtime paths changed: js/app.js, index.html, service-worker.js, sw-release-core-v403.js, js/nh7-store-review-v469.js and css/nh7-store-review-v469.css. app.js differs from previous main by one import and one mount call inside more(). Old Settings and School logic, v468 draft recovery, working audio, themes, birthday/calendar and native version metadata are unchanged.

One menu entry in More: «شرکت در نظرسنجی» / Rate & review / Ocijenite aplikaciju. Direct App Store link on iPhone/iPad and Google Play listing on Android. Unknown desktop devices get an inline choice. No Settings card, theme selector, extra mobile route, star/comment form, automatic popup, reward, local rating record or claim that opening a store means a review was submitted.

Original browser/cache QA: run `35459265394`, job `105940051443`, successful. The reported 14 Chromium/WebKit groups and protected-cache upgrade ran on the approved candidate with synthetic data/intercepted store destinations; no real reviews were submitted.

Post-release verification: **Verify Published More Review v469**, run `35459914416`, SUCCESS. Workflow `.github/workflows/store-review-v469-published.yml` exists only on the feature branch. It checked the exact six-path diff, compared each release blob to the approved preview, proved other app logic and listed unaffected modules unchanged, and fetched all six publicly deployed static files to compare exact bytes. No backend, private account or Supabase request. This is static publication verification, not a native package submission or device session test.

Mixed preview PR #30 was CLOSED UNMERGED, not merged wholesale. Superseded Settings preview remains unshipped. Rejected School redesigns #26/#27, alternative audio/session PR #28 and Chat remain excluded. Do not reload the old previews or redo completed School work. Next feature is a separate user choice from the remaining roadmap; no additional feature has been activated by this release.

No student records, registration, assignment approvals, grades, attempts, notes, downloads or paid plans were modified. No iOS/Android binary or App Store/Google Play release was submitted in this step.
