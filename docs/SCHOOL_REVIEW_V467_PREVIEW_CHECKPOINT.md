# School Review v467 — awaiting phone approval

## Status on 19 September 2026

Main was read and remains `44dfd189832c4a6031562851765811f941e0efe4` (v466 guide placement). No main merge, production deployment, native build or store submission occurred in this stage.

Clean runtime-only candidate: branch `feature/school-review-v467-runtime-20260919`, commit `6791cfa7d51173c893cce6f54c8812da4703f7fd`, tree `4c13176b9665e094e90b820c7d2e119b3b960606`. Draft PR #26 contains exactly seven runtime paths and is NOT ready to merge until the user approves the new interface on their phone.

Final isolated phone preview: `https://rawcdn.githack.com/Omideno7/new-hope7-app/aa919fe3b997fcc216668cfb2411829e54f62553/school-review-preview.html`.

The preview uses memory-only synthetic account, draft, feedback and submission data; it has no login, no OneSignal, no service worker, and CSP connect-src none. Theme Studio may store only its normal appearance preferences. No preview action submits a real school assignment or overwrites a stored auth/profile record. The preview page and its two companion modules must not enter main.

## Implemented

FA/EN/HR assignment status/help, separate administrator feedback, explicit revise-and-submit action, account/lesson-scoped new drafts, expandable last submitted answer, readonly approved response, one in-flight submission, honest local-only/offline/uncertain-result messages, and a manual latest-status check preserving writing. New draft keys coexist with legacy notes; no destructive migration. Legacy unmarked drafts retain the old fallback because their historical ownership cannot be inferred. Cross-device draft synchronization is not guaranteed by this change.

Actual remaining-attempt hints are added to the seven-class path, class exams and final exam. Exhausted budgets direct students to the administrator; no attempts are granted or reset by this interface.

## Backend audit — read only

Inspected installed definitions and active exam metadata in project gpzcwffxnddhaeaogdyo with BEGIN READ ONLY. Existing assignment submission/review, approved-assignment class gates and server-side three-attempt limits are already installed. No SQL migrations, RPC writes, real assignments, grades, profiles, subscription or project changes occurred. The existing nh7_submit_school_assignment contract is reused.

Manual lesson completion/repeat behavior and reconciliation of preexisting course-level final-exam variants remain separate audit work. Do not claim every earlier school requirement has now been implemented. Do not alter previous graduation records. Chat remains excluded from this update.

## Verification

Initial successful runtime QA: run 35448203633, artifact 10585691504, source commit 06d8b468f2b44fa94d73a05eca628d6bc668be62.
Final preview QA: run 35448369214, artifact 10586456995, source/preview commit aa919fe3b997fcc216668cfb2411829e54f62553. SUCCESS: 34 Chromium/WebKit scenario groups, no failures. Four protected-cache sentinels and four versioned runtime routes passed the cache simulation. All seven runtime blob hashes exactly match the initial verified candidate.

Coverage uses the actual extracted schoolLesson function, actual review module, actual source-matched attempt helpers, 3 languages, 14 real theme palettes, responsive widths, revision/resubmission, offline/uncertain results, storage failures, repeated clicks, approved responses, dirty draft preservation, account-scoped new drafts, late navigation and preview operation. Font imports are stubbed offline. It is not a full native-device or real-account E2E claim. Final phone-preview screenshots were inspected, including the corrected dark-preview explanatory text.

## Integration gate

After phone approval, refresh live main, preserve a rollback ref, review PR #26's seven-path scope, verify no intervening changes, then merge only the runtime candidate and verify public deployment/cache upgrade. Existing school entry/login and guide placement, audio, birthdays/calendar and Theme Studio logic were retained. Do not merge the QA branch or its preview, test or workflow files.
