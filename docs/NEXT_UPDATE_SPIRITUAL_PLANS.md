# New Hope 7 — Spiritual Plans module (next release only)

Status: design/staging only. This document and future work live on `agent/next-plans-logo-240`; production `main` is not changed by this module until explicitly merged for a future store release.

## Legacy source reviewed
Repository: `Omideno7/omideno7-app`
Primary legacy content: `plans-v14.js`
Legacy plans confirmed:
- Obedience and Blessing — 10 days
- Salvation and New Life in Christ — 10 days
- Fasting and Prayer — 7-day teaching journey

Legacy fasting EN/HR currently reference the Persian plan object instead of having complete native-language content. The new module must not copy that defect.

## Next-release goals
1. Add a self-contained Spiritual Plans feature without modifying Bible, School, Audio, Library, Q&A, Meetings, Notifications, or authentication behavior.
2. Keep all plan content in FA/EN/HR with native titles, devotional teaching, scripture references, reflection/action, prayer, and declaration.
3. Upgrade legacy teachings rather than blindly copying them; avoid repeated/generic devotional paragraphs.
4. Add fasting journey selection and a daily fasting log.
5. Store progress in Supabase by authenticated user so reinstall/device changes do not erase progress.
6. Show plan activity in the user profile: active plans, completed days, completion date, fasting records, streak/history, and optional private notes.
7. Work offline with a local cache/queue and sync when online.
8. Use the approved New Hope 7 app logo/icon assets in the future iOS/Android release package.

## Proposed isolated data model
- `spiritual_plans`: plan metadata, active/version/order
- `spiritual_plan_days`: localized day content (FA/EN/HR)
- `spiritual_plan_progress`: user_id, plan_id, day_number, status, completed_at, reflection/note
- `fasting_journeys`: user_id, fasting_type, start/end, purpose, status
- `fasting_daily_logs`: journey_id, date, completed, prayer_minutes, scripture_note, reflection

All user tables must use RLS so a user can read/write only their own progress. Admin can manage plan content but should not need access to private reflections unless explicitly designed later.

## Safe integration rules
- Develop and test on this branch first.
- Add the feature as a separate route/module and separate CSS/JS/data files.
- No replacement of existing global auth/session code.
- No schema changes to existing School tables.
- Feature flag off by default until QA is complete.
- Merge to `main` only after regression testing current app modules.

## Content upgrade outline
### Obedience and Blessing
10 days. Focus: love-driven obedience, renewing the mind, hearing/doing the Word, trust when understanding is incomplete, Holy Spirit guidance, obedience and fruit, correction, perseverance, blessing as covenant fruit rather than transaction, living as a doer of the Word.

### Salvation and New Life in Christ
10 days. Focus: God's redemptive plan, the cross, forgiveness, righteousness, resurrection, new birth, identity in Christ, eternal life, the indwelling Spirit, assurance and a new way of living.

### Fasting and Prayer
Keep a teaching journey but expand the user flow with fasting-type selection, purpose, start/end, safety note, daily teaching/log, prayer/scripture/reflection, and completion history. FA/EN/HR must each be real localized content rather than aliases.

## QA acceptance criteria
- Starting/completing a plan never alters School progress.
- Switching language changes plan UI/content without losing progress.
- A completed day remains completed after logout/login and reinstall after cloud restore.
- Duplicate clicks do not create duplicate progress rows.
- Fasting log entries are idempotent per user/journey/date.
- Offline updates queue and reconcile without data loss.
- Profile accurately summarizes plan/fasting history.
