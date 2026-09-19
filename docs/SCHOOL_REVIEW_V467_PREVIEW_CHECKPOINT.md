# School review v4.6.7 — phone-preview checkpoint

19 September 2026. Repository: Omideno7/new-hope7-app.

## Current state

Production main remains `44dfd189832c4a6031562851765811f941e0efe4` (v466). The user confirmed the School entry fix and removal of the duplicate inside-class guide, then authorized continuing to the next stage. No production files, Supabase schema, grades, attempts, approvals, assignments, users, or subscriptions were changed in this stage. Chat is excluded.

Feature branch: `feature/school-review-v467-20260919`.
Rollback reference prepared: `rollback/pre-school-review-v467-20260919`, at the unchanged production commit.

Tested runtime and isolated phone preview: `377377fd3857f1083150718ce98f46658d39c22b`.
Entry file: `school-workflow-preview.html` (not index.html).
Phone URL: https://rawcdn.githack.com/Omideno7/new-hope7-app/377377fd3857f1083150718ce98f46658d39c22b/school-workflow-preview.html

## Implemented candidate

- Dedicated three-language assignment card: draft, awaiting review, Needs revision, Approved; visible administrator feedback and a last-submitted-answer comparison.
- Revised drafts are saved in a new email-and-lesson-scoped local key and restored without being replaced by the previous server answer. Newline and literal-markup text remains text. Approved server answers remain read-only.
- Offline behavior states that a draft is on the device only. It does not claim cloud success or send an assignment offline. Explicit Save draft retains the existing account-note integration when online; autosave is local.
- Submission rechecks server status, defers stale/offline states, protects concurrently approved work, detects changed server answers, suppresses duplicate submissions, and requires a server receipt before displaying success.
- The assignment card refreshes in place rather than navigating or rebuilding the audio player. Delayed callbacks do not overwrite a different route/account.
- Class cards and exam forms show server-reported attempts used/remaining. Zero attempts has explicit guidance to contact the administrator. No client-side attempt reset, score calculation or new access rule is introduced.
- Existing three-option School hub, successful-entry routing and guide-only-on-hub behavior remain unchanged. All 14 Theme Studio palettes are supported by the candidate styles. Languages remain Persian, English and Croatian.

## Verification completed

Workflow: School Review v467 Preview QA.
Successful run: `35450237427`, job `105916005480`, artifact `10586244713` (`school-review-v467-preview-qa`).

24 browser scenario groups passed in Chromium and WebKit. They cover localized feedback, escaped text/newlines, save/reload persistence, offline/no-network behavior, single-flight and duplicate submissions, request failure, stale preflight, approved/read-only answers, concurrent approval, account changes, changed-server-answer conflicts, minimum answer length, storage quota errors, late callbacks after navigation, 14 palettes x 3 languages, three viewport widths, seven class-card preview states, and integration with the source-extracted actual schoolLesson function.

Tests use the actual candidate module, actual School Path presentation functions and source-extracted lesson renderer with synthetic dependencies. No real user account or production API was used. Existing Google font CSS imports were stubbed offline; this is not a native-device, full-app, real-cloud or production-cache-upgrade claim. The first remote run had two fixture errors in each engine (Playwright expression evaluation and missing fixture wrapper); those were corrected in the harness, with no assertions removed. The executed fixture is preserved in the artifact.

The phone preview imports the real assignment module and real extracted class presentation functions, but uses in-memory sample rows. It has no sign-in, no Supabase endpoint, no OneSignal and no service worker; Content Security Policy sets connect-src to none. Its only stored drafts are under a synthetic preview owner's new draft key. No real profile/session key is overwritten. Test scenarios: Needs revision, Awaiting review, Approved, New assignment, Three attempts used, Class exam passed.

## Read-only backend audit

Read-only catalog/configuration queries confirmed that all currently active foundation-school class exams and both active course-exam records have max_attempts=3. The existing scoring function counts attempts on the server under a transaction lock. The installed v351 class/final wrapper functions check their access prerequisites; the assignment submission function refuses replacing an approved answer. The installed v351 path preserves existing course graduates. No sample student was impersonated and no write-capable routine was executed.

This is not a claim that every legacy API path has identical gating. Further legacy-function gate alignment/security review is required separately. The audit also found that audio completion is recorded separately from school_progress. Removing manual lesson completion before reconciling repeat-after-failure semantics could strand students; that removal is intentionally not part of this presentation-only candidate. Existing final-exam duplicates were observed but not changed.

## Required before main integration

1. Obtain phone approval for the new visible assignment/attempt presentation.
2. Finish account-owned legacy-draft compatibility. Old unscoped local note keys are retained, not cleared or silently reassigned to another user. The new editor currently restores newly scoped drafts and the submitted answer; older unsent account drafts need an ownership-verified recovery path before production. Do not infer ownership merely from the current session on a shared device.
3. Verify the candidate inside the complete app with the existing overlays and offline/cloud synchronization adapters, using synthetic accounts first.
4. Build a clean runtime-only release; exclude the preview HTML/JS, scripts, workflows and sample data.
5. Add the new ES module and stylesheet to the release-core/offline routes, bump the release cache, test upgrade without clearing media/personal stores, and recheck main/rollback before merging.
6. Keep broader lesson-completion, repeat-class, legacy API authorization and native/store regression work explicitly separate; do not call those finished from a preview test.

No production merge or store upload is authorized merely by a green preview workflow. The inherited legacy CI literal v350 expectation is unchanged.
