# School draft recovery v4.6.8 — deployed checkpoint

19 September 2026. Repository Omideno7/new-hope7-app.

## User scope

The user explicitly said the old School interface/workflow was satisfactory and should not be redesigned. Repair lost typed assignments after a call, app switching, backgrounding, leaving or reopening. Existing registration, accepted work, grades, attempts, notes, downloads and partial progress must remain intact. Do not activate stricter retrospective lesson rules. Chat remains excluded.

Redesign PRs #26 and #27 were closed WITHOUT MERGE. Their branches remain archived references, not approved releases.

## Deployed

PR #29 merged as `2bde658268eeaed0e7873c83aa7fb54c1d37fc8f`.
Parent/main before change: `44dfd189832c4a6031562851765811f941e0efe4`.
Rollback branch: `rollback/pre-school-drafts-v468-20260919` at that parent.
Clean release tree: `51c1b9790bd3efbc23bceb2dec33b532b6a03b7d`.

Five runtime files only: js/app.js, js/nh7-school-drafts-v468.js, index.html, service-worker.js, sw-release-core-v403.js. No CSS, preview, fixture, workflow, backend operation, school grading/gates, audio, theme, calendar, manifest or store-version changes included.

Behavior: input saves synchronously to a new existing-account-and-lesson-scoped local key; lifecycle events and pre-render add checkpoints. Pending text restores into the original textarea as text, preserving whitespace/newlines. Existing buttons and manual save/submit workflow remain. No automatic submission/network call is made by autosave. Approved server answers stay authoritative; local drafts are retained rather than erasing accepted work. A matching explicit-submission receipt acknowledges only its captured revision; subsequent typing remains pending. Storage failure retains current-session memory and shows a localized warning, not a false persistence claim. Legacy note keys are untouched by this new module; the existing explicit-save/restore code retains its previous behavior.

Boundaries: autosave is on the same device/origin/account, not newly synchronized across devices. It does not recover text lost before installation, survive deliberate app-data deletion, or guarantee durable storage when the browser refuses it. No native binary/store release or physical phone-call test was performed.

## Evidence

Tested QA runtime commit: `75613018c9283fed8355bb67826cc38cfb4e3407`.
QA run `35452468543`, job `105921898709`: SUCCESS.
Artifact `10587675532` (school-draft-v468-qa).
26 Chromium/WebKit scenario groups passed using real source-extracted schoolLesson/render/submitSchoolAssignment/restoreAccountCloudData with synthetic dependency functions and actual new module/localStorage. Covers baseline loss, unchanged HTML/buttons/settled screen pixels, FA/EN/HR, hidden/blur/pagehide, reload and closed/reopened page, synchronous input with no final lifecycle event, offline no API call, cloud-copy refresh, account/lesson separation, empty input/IME, pre-render, approved work, explicit successful/failed/late submission, no duplicate handlers, unchanged manual-save and quota failure. Four protected-cache sentinels survived release-cache upgrade; app and new-module versioned routes verified. Fixture origin and PNG capture/decoding issues were corrected before the successful run; no runtime issue was hidden by dropping assertions.

Published verification run `35452755743`, job `105922662155`: SUCCESS. Checkout pinned to merged commit; read-only public GET requests compared all five served files byte-for-byte with the release. No Supabase/auth/student request was involved. Workflow and reports remain on QA branch, not main. This does not assert every legacy repository CI job is green; the previously identified v350 literal validator is unrelated.

## Separate pending audio/login work

PR #28 must be rebased/reprepared on the new main and retested with the draft hooks. Do not load its old v466-based app/index/service-worker blobs over this fix, downgrade the release cache, or resurrect the rejected review UI. A comment on #28 records this integration gate. This draft-only release does not claim that School Load failed, lesson audio or sermon playback reports have all been resolved.
