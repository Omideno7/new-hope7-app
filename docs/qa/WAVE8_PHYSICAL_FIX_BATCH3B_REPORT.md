# Wave8 physical fix Batch3B — Calendar / YouVersion / Church Connect

Starting develop `73610310eaccebe417975aaa48b17b563b642796`; audit `1e14e9da` (full SHA in final delivery). Main unchanged `15af811f78a17a0881c13171311e7ade6bc390f4`. Existing develop only. No branch/PR, deployment, Production request/mutation, provider activation, ordinary migration or real data clearing. Stop after3B.

## Architecture / content

Existing Calendar v464 remains date/body/reference/birthday authority: all16 entries and Gregorian Easter offsets preserved exactly. Shared educational markup adds recurrence, biblical context, application and honest editorial-history status. Pentecost context explicitly comes from Acts2/Feast of Weeks; the other15 liturgical origin histories require church editorial review, explicitly stated in FA/EN/HR rather than invented. Existing header modal/focus/inert/Bible handoff retained; list highlights today, detail has Back. Compact Home Today appears only for matching day. Canonical current router opens date-specific detail and browser Back restores Home/list; no personal-calendar read.

YouVersion: local trusted `data/church/church_config.json.youVersionUrl`, identical existing About destination: `https://www.bible.com/organizations/da6136d1-04cd-4243-a52b-f9ba7f32ec79?utm_source=yvapp&utm_medium=share&utm_content=partner-page`. HTTPS universal/web link, new browsing context with noopener/noreferrer, no custom-scheme hang, no membership-completed claim. Users must select/follow church in YouVersion. Home CTA + secondary Connect CTA; Connect also repeats YouVersion. Missing/unsafe configuration disables action. This is repository provenance, not a fresh real-device or church-admin ownership verification. Home URL currently remains local config; owner-managed dynamic media links work in Connect after separately approved backend activation, not a hidden remote Home override.

Connect reuses existing `meetings` route, canonical navigation/history, three categories, phone list/detail/contextual Back and tablet master/detail. Empty groups/media stay empty until verified Admin entries exist. HTTPS-only validated links; no guessed social destinations. Meeting detail supports multilingual instructions/schedule, platform, exact start/end/timezone, meeting ID, authorized passcode, copy and write-only .ics export with no private credentials or personal-calendar read. No network on app startup beyond one local JSON config request; bounded catalog on open/category/retry, explicit detail selection. Twelve-second request timeout/abort and retry avoid blocked UI; no recurring backend job/polling/subscription. Existing main content/header/player/Profile/School/Notes/Plans engines untouched.

## Security / backend boundary

Root cause: obsolete built-in credential fallback and cached approval could show old private details while legacy email/device RPC/direct REST fallback failed. Remove fallback literal and those client transports. Two obsolete root SQL seed literals are redacted only; checkpoint migrations untouched. Existing settings, users and links are not changed or imported. Public Git history still contains historical material: owner review/rotation remains required; do not confuse source redaction with live remediation.

New review-only package `supabase/review/batch3b-church-connect/`: private RLS table, bounded catalog excluding destinations/meetingID/passcode, current-auth.uid item authorization, owner-only management using existing v350 helper, explicit narrow ACLs, revision conflict/duplicate protection, preflight and revoke-only rollback preserving rows. No normal migration added. Candidate and rollback intentionally raise/ROLLBACK; tests extract candidate into isolated synthetic PostgreSQL only.

Supported proven audiences: public, current authenticated user, owner Admin. **Approved/student audience adapter is BLOCKED_ACTIVATION** until exact current UID-bound entitlement is reconciled. Never copy approval-only legacy meetings as authenticated/public. No new delegated permission invented; existing delegates and their tools preserved; manager owner-only. Old Store legacy reader safety/compatibility requires exact live-body review and staged approval; this source package does not revoke or alter that RPC live.

Client private data is memory-only, no local/session cache, no logs/analytics, current actor/token/generation/route fencing, cleared on logout/switch/background/route. Stale responses cannot repaint another account. Admin reuses current Workspace/server owner proof, manual Load/create/edit/active/order/destination/translations/schedule, explicit confirmation, conflict/error retains form. Existing legacy authorized Admin tools remain available.

Calendar reminders expose only optional/default-off `christian_calendar` semantic, no permission prompt/provider/scheduling. NATIVE_ACTIVATION_REQUIRED. Audio Analytics remains REJECTED_COST, new analytics reads/writes/storage0.

## Evidence and remaining acceptance

Targeted synthetic PostgreSQL and actual-browser tests cover authorization, catalog secret exclusion, ownership/direct-table denial, public/authenticated/Admin audiences, CRUD/order/conflict, FA/EN/HR phone/tablet portrait/landscape, Calendar dates/Today/noevent/Back, Connect list/detail/history, unsafe links, .ics privacy, session/stale/logout and manual Admin confirmation. Independent current-source contract protects all prior engines/data and preserves historical assertions through exact hash-bound inverse projection; no broad directory whitelist. Prior source contracts/checkpoints retained.

Final local/full CI results, commit inventory and exact head URL are recorded in final delivery after checks complete. No automated result is a physical PASS. PHYSICAL_QA_REQUIRED: actual iPhone/iPad/Android return/universal link, clipboard, ICS import, keyboard, safe area/player docking and screen reader. NATIVE_ACTIVATION_REQUIRED: native reminder delivery. BLOCKED_ACTIVATION: new backend approval/preflight/owner-helper reconciliation, exact approved/student entitlement, legacy Store RPC compatibility and credential rotation review. CONTENT_REVIEW_REQUIRED:15 specific liturgical origin histories; current approved biblical text retained. No actual links/groups/media fabricated.

Migration checkpoint42/42 exact,0missing,2pending unapplied: v511 and v580. Batch3A Q&A/School/Document/provider/security packages remain inactive. No Production calls/data mutation/reset/backfill, no main change, no deployment or paid feature.


## Changed files (exact scope)

- `.github/workflows/validate-develop.yml`
- `admin.html`
- `css/nh7-church-connect-batch3b.css`
- `docs/qa/WAVE8_PHYSICAL_FIX_BATCH3B_AUDIT.md`
- `docs/qa/WAVE8_PHYSICAL_FIX_BATCH3B_REPORT.md`
- `index.html`
- `js/app.js`
- `js/nh7-admin-connect-batch3b.js`
- `js/nh7-celebrations-v464.js`
- `js/nh7-church-connect-batch3b.js`
- `scripts/batch3a_accepted_source.py`
- `scripts/batch3b_accepted_source.py`
- `scripts/fixtures/batch3b-source-contract.json`
- `scripts/school_accepted_source_v580.py`
- `scripts/verify-batch3a-safety.py`
- `scripts/verify-batch3b-browser.cjs`
- `scripts/verify-batch3b-postgres.cjs`
- `scripts/verify-batch3b-safety.py`
- `supabase/review/batch3b-church-connect/README.md`
- `supabase/review/batch3b-church-connect/candidate.sql`
- `supabase/review/batch3b-church-connect/preflight-readonly.sql`
- `supabase/review/batch3b-church-connect/rollback.sql`
- `supabase_v1_6_3_meeting_settings_fix.sql`
- `supabase_v1_6_4_meeting_settings_rpc_fix.sql`
- `sw-release-core-v403.js`


Follow-up regression evidence: Wave6.6 current-caller preservation correctly flagged the intentionally retired row131 legacy meeting RPC. Only that exact row/path now proves its original hash-bound caller and asserts the unsafe current RPC/REST path is absent. Every other live fingerprint/caller/ACL assertion remains exact; original review decisions remain unchanged because older Store callers are not retired. Independent Batch3B guard proves this precise test transformation. No live revoke is proposed.

- `scripts/verify-wave66-evidence.py` (exact row131 caller retirement assertion)
