# Soul Winning v4.7.2 Preview Checkpoint — 20 September 2026

## Scope

Repository: Omideno7/new-hope7-app

Main baseline (unchanged during this preview work):
`291b7b84222185f3c5549552345da30fe0883718`

Feature branch:
`feature/soul-winning-v472-preview-20260920`

This phase adds a local-first Soul Winning / Soul Tracker module for phone review. It does **not** write to Supabase, authentication, account notes, downloads, School data, Q&A, audio data, or production user records.

## Product flow

The tracked journey is:

1. New contact
2. Gospel shared
3. Follow-up / interested
4. Prayed for salvation
5. Connected to church
6. In discipleship
7. Serving / multiplying

For each person the preview supports:

- first name or nickname
- date first met
- current stage
- context / how they met
- next follow-up date
- private notes
- stage-change history
- follow-up note history
- edit and delete

Dashboard counters cover total people, Gospel shared, salvation prayer, church connection, discipleship, and follow-ups due.

The list supports search and stage filtering. The module is localized in Persian, English, and Croatian and is theme-aware.

## Privacy boundary

Preview/runtime module storage key:
`nh7_soul_tracker_v472`

In this phase the Soul Tracker module contains no `fetch`, `cloudFetch`, `cloudRpc`, `authApi`, `saveProgressCloud`, or `saveNoteCloud` calls.

The preview advises users to use a first name or nickname and record only necessary information.

Production cloud sync is intentionally deferred. If later approved, it requires a separate account-bound Supabase design with RLS so each user can access only their own records.

## App integration prepared on the feature branch

- `js/nh7-soul-winning-v472.js`
- `css/nh7-soul-winning-v472.css`
- `js/app.js` route and More-menu entry
- `index.html` runtime style loading
- release-cache wiring for v4.7.2
- isolated `soul-winning-preview.html`

The production `main` branch is not changed by this checkpoint.

## QA

Successful workflow:
Soul Winning v472 Preview QA — run `35476627503`

Passed checks:

- isolated changed-file scope
- no Supabase/data/admin/assets changes
- JavaScript module syntax
- seven-stage normalization
- dashboard stage counts
- local-only storage boundary
- no cloud/account writes in the tracker module
- FA/EN/HR app wiring
- More-menu route wiring
- protected release-cache inclusion
- preview module syntax
- 14 theme options present

The first QA run failed only because the QA assertion searched for different English wording in the preview notice. The assertion was corrected; the second run passed every step.

## Remaining gate

Phone review is required before any merge to main.

After phone approval, choose one of two release paths:

1. local-only first release, or
2. account-synced release after designing and testing a dedicated RLS-protected Supabase table.

No production Supabase migration should be made before that decision and approval.
