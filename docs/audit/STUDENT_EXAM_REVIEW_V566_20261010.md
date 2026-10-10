# Student final-exam review v5.6.6 — 2026-10-10

## Goal
Restore the read-only student-facing final-exam review that existed in Final QA without restoring the older global-search runtime or changing current School grading/submission logic.

## Production baseline
- Base: `main` at `0ddb5926effb0caf4fd9402bb6e7627b2d1c1224`.
- Supabase migration parity: 33/33 exact; 0 pending.
- No database migration, Edge Function, table, RLS, Storage, attempt-count or progress mutation is introduced.

## Behavior
- After a current final-course exam attempt is saved, the result panel additionally shows a read-only review.
- When reopening the course exam, the latest stored attempt can be reviewed.
- Wrong answers show: question, student's selected answer, and correct answer.
- All-correct attempts show a compact success message.
- FA / EN / HR copy is included.
- Failed attempts open the review by default; passed attempts keep it collapsed.

## Shuffle safety
Historical attempts reconstruct their exact question order using the stored `attempt_number` before review. Answer-to-question mapping uses `question_number` first and only falls back to original answer position. This avoids the filtered-index mismatch present in the older Final QA renderer.

## Isolation
`js/nh7-exam-review-v566.js` is presentation-only:
- no `fetch`
- no cloud API call
- no persistent storage write
- no scoring or attempt calculation
- no account/School state mutation

The canonical current submission code remains unchanged except for appending the already-computed review HTML after a successful save.

## Cache/offline
The module is added to the release core cache and release fetch allow-list. A new release-core cache identity is used so the installing worker never mutates the currently active worker's core cache.

## Verification
- Student Exam Review v566 static guard: PASS
- shuffled-question runtime mapping smoke: PASS
- Web Community parity: PASS
- Production migration parity: PASS (33/33 exact)
- Next Native Optimization Guard: PASS
- School/Identity/assignment/exam/certificate/report static regressions: PASS
- no Supabase migration/function changes
- JS syntax / diff check / release asset existence: PASS
