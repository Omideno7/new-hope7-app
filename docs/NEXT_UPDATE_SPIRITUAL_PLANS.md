# New Hope 7 — Spiritual Plans module (next release only)

Status: implemented and validated on `agent/next-plans-logo-240`. Production `main` is not changed until this branch is explicitly merged for a future store release.

## Implemented in v2.4.0.240
- 30 Days of Prayer in the Spirit and Tongues — 30 complete days, biblical foundations, pastoral guidance, and a unique daily practice.
- Living in Grace — 14 complete days.
- Fasting and Prayer — 7 complete teaching days, six fasting types, health guidance, journeys, daily logs, and history.
- Obedience and Blessing — 10 complete days.
- Salvation and New Life in Christ — 10 complete days.
- Native FA/EN/HR metadata and content for every day: title, devotional, Scripture references, reflection, practice, prayer, and declaration.
- Existing one-year/two-year Bible reading plans remain available in a separate tab and retain their existing storage behavior.
- Offline-first, account-scoped local state and queued, idempotent Supabase upserts.
- Account profile summary for active/completed plans, completed days, streak, recent completions, and fasting records. Private note text is never shown in the summary.
- Approved display logo retained, with standards-compliant 192, 512, maskable 512, and Apple touch icons.
- Feature flag `NH7_SPIRITUAL_PLANS_V240` is enabled only in this branch build.

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

## Isolated data model
- Versioned plan metadata and localized day content are bundled as offline JSON under `data/spiritual-plans/`.
- `spiritual_plan_progress`: user_id, plan_id, day_number, status, completed_at, reflection/note
- `fasting_journeys`: user_id, fasting_type, start/end, purpose, status
- `fasting_daily_logs`: journey_id, date, completed, prayer_minutes, scripture_note, reflection

The three user tables are installed through `20260820214030_spiritual_plans_v240.sql` plus its composite-FK index follow-up. RLS is enabled with separate SELECT/INSERT/UPDATE/DELETE policies for `authenticated`; `anon` has no table privileges. Each policy compares `auth.uid()` with `user_id`, so users can read/write only their own progress and private reflections.

## Safe integration rules
- Develop and test on this branch first.
- Add the feature as a separate route/module and separate CSS/JS/data files.
- No replacement of existing global auth/session code.
- No schema changes to existing School tables.
- Keep the feature flag branch-scoped until release QA is complete.
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

Automated validation covers all five plan files (71 devotional days × three languages), unique devotional/practice content, required fields, offline cache inclusion, module syntax, render smoke tests, icon dimensions, live RLS policy/grant checks, and Supabase security/performance advisors for the new tables.
