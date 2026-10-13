# Codex Wave 4 — Notifications 2.0, Closed-App Admin Events, Language-Safe Delivery and Deep Links

## Mission

Work only in `Omideno7/new-hope7-app` on the existing `develop` branch.

Accepted development baseline before this task: `32eb9b59afa07a0c95f6c94323364708002702b6` (Wave 3 final). Wave 1 performance/cost, Wave 2 local-first/offline reconciliation and Wave 3 Product Completion/Birthday/Admin Core are accepted development baselines and must remain intact.

This is **not a release task**. The owner explicitly wants all planned development completed first, followed by device/integration/final QA, and only after explicit owner approval may release preparation begin.

Wave 4 owns the notification system only. Its goals are:

1. Audit and converge the current notification/push/inbox architecture without creating a second parallel system.
2. Complete the server-oriented design/source for **closed-app Admin event notifications** for the church workflows the owner cares about.
3. Complete/verify manual Admin messaging for **All / Segment / Single User** with FA/EN/HR recipient-language delivery.
4. Make push/inbox identity binding, account switching, logout and stale-response behavior safe.
5. Make notification deep links exact, allowlisted, permission-safe and resilient across foreground/background/cold-start/offline cases.
6. Add deterministic idempotency/deduplication contracts so one business event cannot accidentally create repeated push/inbox delivery.
7. Preserve notification Inbox read/delete/timestamps/badges and all current user data.
8. Measure network/background behavior and prove the implementation does not introduce polling or battery-cost regressions.
9. Produce exact review-only backend artifacts if backend changes are required, but **do not deploy or apply them**.

Stop after Wave 4 is complete and validated. Do not start Wave 5 automatically.

---

## Absolute safety / repository rules

- First read `AGENTS.md`, `docs/DEVELOPMENT_WORKFLOW.md`, `docs/qa/PRODUCT_COMPLETION_MASTER_AUDIT.md`, `docs/qa/WAVE3_PRODUCT_ADMIN_REPORT.md`, and this file.
- Fetch remote and fast-forward/synchronize the current `origin/develop` before editing. Never reset away accepted or concurrent work.
- Work directly on the existing `develop` branch.
- **Do not create any new branch, PR, feature branch, fix branch, backup branch, test branch or Codex branch.**
- Do not merge, rebase, force-push or modify `main`.
- Do not deploy Web/PWA, App Store, Google Play, Supabase, Edge Functions, OneSignal configuration, APNs/FCM configuration or any Production service.
- Do not apply migrations or mutate Production schema/RLS/Auth/Storage/data.
- Do not send any real notification to real users during this Wave.
- Do not delete, migrate, backfill, rewrite or reset user data, Inbox rows, receipts, notes, progress, saved verses, offline queues, downloads, profile data or notification preferences.
- Never expose service-role keys, OneSignal REST API secrets, APNs keys, FCM private credentials or any other secret to client code, repo logs, fixtures or reports.
- Client code may contain only the existing public/publishable values that are already appropriate for clients.
- Preserve server authority for Admin, School/access, Library, messaging recipient authorization and notification generation.
- Preserve Wave 1 request/background controls and Wave 2 owner-isolated local-first behavior.
- Preserve Wave 3 server-authorized Admin Workspace and its Draft → Preview → Confirm → Execute safety boundary.
- Do not invent or hard-code admin email addresses, user IDs, device IDs, language identities or recipient lists.
- Do not implement closed-app Admin event delivery using client polling, hidden timers or repeated background fetch loops.
- Do not weaken existing negative tests, CI gates, RLS assumptions, access checks or payload validation to make tests pass.

If a required live backend contract is missing, implement its source/review design in a **review-only** location such as `supabase/review/wave4-notifications-2/` and test it with fixtures. Do not apply it. Clearly mark what still needs explicit backend approval/integration in Wave 8.

---

## Phase 0 — Freeze baseline and create an audit before implementation

Before modifying runtime code:

1. Record exact current `develop` SHA.
2. Record exact `main` SHA and prove it remains untouched.
3. Inventory the current notification implementation by tracing the actual loaded source, not filenames alone.
4. Trace current user push binding/account binding, including the active `nh7-push-account-bind-*` source.
5. Trace current local scheduled notification behavior, including Zagreb/CET scheduling where applicable.
6. Trace current Service Worker / OneSignal worker registration and deep-link behavior.
7. Trace current Inbox implementation, badge synchronization, receipts, read/delete behavior and timestamps.
8. Trace Wave 3 Admin Message Center and the current server contracts for templates, directory, campaign history and sending.
9. Trace current notification sender/Edge/RPC/review source and identify exactly how Push and Inbox recipients are resolved today.
10. Trace current preferred-language storage/source and whether it represents actual current app preference or only registration-time language.
11. Trace notification-related code present in the historical branches `feature/final-qa-v2500-20261004` and `feature/watchos-v2500-20261004` only to determine whether notification functionality exists there that is absent or newer in `develop`. Do not merge those branches and do not port unrelated code.
12. Record current network/timer behavior for a signed-in ordinary user and Admin in visible, background and account-switch scenarios.

Create an audit document before the implementation commit, e.g.:

`docs/qa/WAVE4_NOTIFICATIONS_AUDIT.md`

For every relevant component classify it as one of:

- current canonical
- duplicate/legacy but still loaded
- duplicate/legacy not loaded
- missing
- partial
- backend approval required
- physical/live integration required

Do not infer completeness from file existence.

---

# Functional scope

## A. One canonical notification architecture

Wave 4 must converge around the existing working architecture instead of creating another notification stack.

The intended logical pipeline is:

`business event or approved Admin campaign`
→ `server-authorized recipient resolution`
→ `language resolution`
→ `idempotency key / delivery record`
→ `Inbox and/or Push channel generation`
→ `provider delivery`
→ `device receives notification`
→ `safe deep-link intent`
→ `app validates current identity/access and opens exact destination`

Client code must not be the authority that decides who should receive a privileged notification.

Where the current repo already has a valid contract, extend/reuse it rather than replacing it.

Do not create separate competing versions of Inbox, push binding, campaign history, recipient directory or notification routing unless the audit proves the current canonical implementation cannot safely support the requirement.

---

## B. Closed-app Admin event notifications

The owner wants an Admin to receive meaningful alerts even when the app is not open. This must be **event-driven from server-side state**, not client polling.

At minimum design/implement/test source contracts for these business events:

1. **New registration / School registration request**
2. **New prayer request**
3. **New Q&A/question**
4. **New School assignment submission requiring review**
5. **New testimony submission requiring review**

Audit whether other already-supported Admin queues have an existing event mechanism. Do not silently expand scope to every table.

Each event notification must have:

- stable event type
- stable source/business row ID
- created timestamp
- intended admin permission/audience
- localized title/body strategy
- safe app route / deep-link target
- deterministic idempotency key
- no personal content beyond what is appropriate on a lock screen
- a server-side authorization boundary

### Privacy requirement

Lock-screen Push text should be useful but conservative. Do not expose private prayer text, testimony body, student assignment content, phone numbers, emails, medical details or sensitive submission content in Push previews. A safe pattern is a generic localized title/body such as “New prayer request — open Admin Workspace to review.” The detailed content is fetched only after the Admin opens the authenticated app.

### Admin permission requirement

An Admin event must only target owner/delegated Admin accounts that currently have the appropriate server-granted permission for that queue. Do not use a client-side role cache or hard-coded owner email as the authoritative audience.

If the current backend cannot express permission-scoped recipients, create a review-only contract and fixture tests; do not fake authority on the client.

### No polling

There must be no new recurring client loop that repeatedly checks registration/prayer/Q&A/assignment/testimony counts to simulate push. Background polling count after Wave 4 should remain zero for the new system.

---

## C. Admin manual messaging — All / Segment / Single

Wave 3 established the owner-only composer and the UI boundary:

`Draft → Preview → explicit review → Confirm → Execute`

Preserve that UX. Wave 4 owns actual recipient/language contract correctness.

### All

- Resolve recipients server-side using the existing authorized contract or a review-only proposed contract.
- Clearly document the exact definition of “All” for Push and Inbox.
- Do not claim “all app users” if the existing backend actually means only approved registrations or subscribed devices.
- Exclude Admin-tag subscriptions where current product policy requires it, but prove the rule rather than assuming it.
- Deduplicate by canonical account/device identity.

### Segment

At minimum support the current product language segments:

- FA
- EN
- HR

Segment membership must be based on a recorded supported language preference, not country, name, email domain or guessed locale.

If the server directory only contains stale registration-time language, document the gap and provide a safe source contract for keeping preferred language current; do not overwrite user language silently.

### Single User

- Must require one known canonical account identity.
- Never target by free-form email alone when a stable user ID exists.
- Prevent sending to the wrong account after an account switch or stale directory response.
- If the selected account becomes invalid/unauthorized before Execute, fail closed and require a fresh preview.

### Channel choices

Preserve existing supported combinations:

- Push
- Inbox
- Push + Inbox

Preview must show the channel selection and resolved target mode before execution.

No automatic retry of a manual campaign execution if the outcome is unknown; retries can duplicate real notifications. Use idempotency instead.

---

## D. Recipient language / localization contract

All notification surfaces must be designed for:

- Persian (`fa`)
- English (`en`)
- Croatian (`hr`)

For campaigns that include all three versions, the server/provider must select the copy based on the recipient’s recorded preferred language.

Rules:

1. Never send FA copy to a known EN or HR recipient merely because the Admin currently uses Persian.
2. Never infer preferred language from country or email.
3. Never translate arbitrary user-submitted private text automatically for lock-screen Push.
4. Preserve UTF-8, RTL/LTR and punctuation correctly.
5. If language is truly unknown, use the current documented safe fallback; if no safe canonical fallback exists, propose English as a review decision rather than silently inventing behavior.
6. Changing app language must not create duplicate user/device subscriptions.
7. If product architecture permits, update the recipient’s preferred-language binding efficiently when the user intentionally changes app language; do not make a network write on every render or navigation.

Add fixture coverage proving FA, EN and HR recipients receive the correct localized variant.

---

## E. Push identity binding, logout and account switching

The app already has push/account binding logic. Audit and harden the canonical version rather than adding another binding layer.

Required behavior:

- Device/subscription binding belongs to the currently authenticated account only.
- Login to Account A → bind A safely.
- Logout → remove/clear account association as supported by the existing provider contract without destroying unrelated local user data.
- Login Account B on the same device → no stale push identity from A may remain authoritative.
- Rapid A → B switch while a binding request is in flight → stale A response must be ignored/fenced.
- Token/session refresh for the same UID must not create duplicate provider subscriptions.
- App language change must update language metadata without duplicating account/device bindings.
- Multiple devices for one user are legitimate and must not be collapsed incorrectly.
- One device must not receive another user’s account-targeted Inbox/Push after switch/logout.
- Explicit logout must not leave privileged Admin event binding attached to a normal later account.

Use generation/token/UID fencing patterns consistent with Wave 2/3.

Do not clear Notes, progress, downloads or unrelated local storage as part of push unbinding.

---

## F. Idempotency and duplicate prevention

This is mandatory.

Define a deterministic idempotency model for both business-event notifications and manual campaigns.

For business events, an acceptable conceptual identity is:

`event_type + source_row_id + recipient_account_or_subscription + channel + event_revision`

Do not use timestamps alone as an idempotency key.

For manual campaigns, preserve a stable campaign/request identity from Preview/Confirm through Execute so network retry/provider timeout cannot accidentally fan out duplicate rows/messages.

Required behavior:

- one source event must not create repeated Inbox rows on repeated trigger execution
- one source event must not create repeated provider sends to the same bound subscription
- Push and Inbox are separate channels and may each have one delivery
- multiple legitimate devices may each receive one Push where policy allows
- repeated webhook/database-trigger execution must be safe
- provider timeout/unknown outcome must be recorded as unknown/retryable state rather than blind immediate resend
- retries must be bounded and idempotent
- client UI double-click or Back/Forward must not double-send a campaign

If backend tables/RPCs are required, create review-only SQL/design source and fixture tests; do not apply it.

---

## G. Safe deep links and exact routing

Every notification route must be allowlisted and structured. Never execute arbitrary URLs from notification payloads.

Audit current app routing first and map valid notification destination types to the exact current routes.

At minimum support safe deep-link intents for:

### User-facing
- Home
- Inbox
- Daily content where current exact ID/day routing exists
- Bible reference where current exact Bible routing exists
- Sermon/audio item where current route exists
- School area where the current user has access
- Plans where current exact routing exists

### Admin-facing
- Admin Workspace overview
- Registrations queue
- Prayer requests queue
- Q&A queue
- Assignment review queue
- Testimony moderation queue
- Messaging history if already safely supported

Rules:

- Validate route type and identifiers before navigation.
- Do not use arbitrary script/HTML/URL payloads.
- Do not expose privileged Admin content before server authorization completes.
- If an Admin notification is tapped while logged out, preserve only a **non-sensitive route intent**, authenticate, re-check Admin permission, then navigate if still authorized.
- If the current account is not an Admin, fail safely to ordinary app Home/Inbox with no privileged data disclosure.
- If a user-targeted notification is tapped under the wrong account, do not show another account’s Inbox item; require correct identity or show a safe generic destination.
- If a referenced item no longer exists or access was revoked, show a localized unavailable/permission message rather than a blank screen or crash.
- Back navigation must return to the correct prior surface.
- Deep link handling must be idempotent; app resume/repeated lifecycle callbacks must not reopen the same modal/route repeatedly.

### Cold-start / background / foreground matrix

Test at least:

1. app closed/cold start intent
2. app backgrounded
3. app foregrounded
4. app already on the destination
5. notification tapped after account switch
6. notification tapped while logged out
7. offline tap then reconnect
8. revoked access before tap

Because this Wave cannot perform real APNs/FCM delivery, use exact payload fixtures and current lifecycle/router entrypoints. Mark physical provider acceptance for Wave 8.

---

## H. Inbox integrity

Preserve current Inbox behavior unless a verified bug requires a scoped fix:

- received timestamp
- sent timestamp where applicable
- read/unread
- delete/hide receipt semantics
- badge synchronization
- account isolation
- TTL/cleanup behavior already accepted
- deep-link metadata

Do not delete existing Inbox history or rewrite old rows.

New notification generation must not cause the same logical notification to appear multiple times in Inbox because both foreground and background handlers inserted it independently.

Inbox must remain server/account authoritative for account-targeted messages.

---

## I. Foreground notification UX

When the app is already open:

- avoid duplicate UI if both provider foreground callback and Inbox refresh observe the same event
- do not interrupt text entry, prayer submission, School exam or modal flows with an unsafe forced navigation
- prefer a non-destructive banner/toast/badge update using existing UI patterns if a foreground surface is needed
- tapping the foreground notification should use the same safe deep-link resolver as a system notification
- do not add an always-running observer/timer loop just to show foreground alerts

Do not invent a large new visual design system in this Wave.

---

## J. Local scheduled church notifications

Audit the existing scheduled New Hope 7 reminders and preserve intended CET/Zagreb behavior. Existing known product times include Daily Word/Faith/Juice/Gratitude and church meeting reminders.

Wave 4 must not accidentally duplicate local scheduled reminders with remote notifications.

Verify:

- timezone/DST behavior remains deterministic
- one scheduled logical reminder does not become two after upgrade/reload
- account switch does not expose personal account notification content
- permission denied state does not create retry loops
- background execution is minimal

Do not change the ministry schedule/content unless required by an existing product requirement; this Wave is infrastructure/notification correctness, not editorial redesign.

---

## K. Permission denied / unsupported provider states

Provide clear non-blocking behavior when:

- notification permission is denied
- browser/native push is unsupported
- OneSignal/provider init fails
- user is offline
- provider subscription is unavailable
- APNs/FCM token is not ready

The app must continue functioning normally. Do not repeatedly prompt on every launch/navigation.

Admin messaging UI must distinguish “campaign accepted by server” from “provider delivery proven.” Do not claim delivered when only queued/accepted.

---

# Backend review contract

If current backend contracts are insufficient, create review-only source under:

`supabase/review/wave4-notifications-2/`

Include a README that documents:

- required tables/columns/indexes if any
- RLS assumptions
- RPC/trigger/Edge responsibilities
- idempotency model
- recipient resolution
- language selection
- Admin permission checks
- Push subscription ownership
- Inbox insertion behavior
- retry states
- provider response recording
- rollback/disable strategy
- expected migration order if eventually approved

Prefer the smallest change that extends existing notification contracts.

Do not create a parallel notification database if existing `notification_inbox`, receipts, campaign/history or subscription tables can be safely extended.

Any proposed SQL must be safe to review and must not be executed in this Wave.

Any proposed Edge source must not contain secrets. Secrets must be referenced only by environment variable names.

---

# Performance / battery / cost requirements

Wave 4 must preserve the optimization work already accepted.

Measure before/after with controlled fixtures and report separately:

- ordinary signed-in user startup requests
- Admin startup requests
- foreground idle requests for at least 60 seconds
- background requests for at least 60 seconds
- push-binding requests during stable same-account session
- account switch binding requests
- manual composer open/preview/cancel requests
- one fixture campaign execute request count
- one fixture event notification generation count
- timer callbacks introduced by notification code
- MutationObserver/listener deltas where material

Hard requirements:

- no new recurring background polling
- stable visible idle should not repeatedly call push-binding endpoints
- background count/request polling introduced by Wave 4 must be zero
- account binding must be event-driven and deduplicated
- language updates must be debounced/deduplicated rather than repeated on render
- Service Worker must not clear stable user/download caches just to rotate notification code

Fixture measurements are not Production billing or physical battery claims. State that explicitly.

---

# Security tests

Add negative fixtures for at least:

- anonymous user cannot access Admin event payload content
- ordinary authenticated user cannot receive Admin-only event detail through Admin resolver
- delegated Admin without required permission is excluded from that event audience
- stale Admin token response after account switch is ignored
- stale push binding response for Account A cannot bind Account B
- notification payload with arbitrary external/javascript URL is rejected
- notification payload with malformed route ID is rejected
- user notification for Account A is not opened under Account B
- expired/revoked access fails closed
- double Execute cannot create two campaign sends
- repeated identical business event trigger is idempotent
- unknown language does not cause cross-language recipient guessing
- lock-screen push fixture contains no sensitive prayer/testimony/assignment body

---

# FA / EN / HR and accessibility

All newly visible UI strings must exist in Persian, English and Croatian.

Verify:

- FA RTL
- EN/HR LTR
- notification preview copy for all 3 languages
- deep-link unavailable/error copy in all 3 languages
- permission/push-disabled status in all 3 languages
- keyboard focus remains correct after notification route/modal transitions
- screen-reader labels for notification-related buttons/actions
- reduced motion settings are respected by any existing notification animation; do not add unnecessary animation

---

# Regression protection

Wave 4 must prove it did not break:

- Wave 1 performance invariants
- Wave 2 offline/local-first reconciliation and owner isolation
- Wave 3 Birthday behavior
- Wave 3 Admin authorization and Workspace navigation
- Notes and both Notes backups
- Bible/saved verse conflict logic
- Audio playback/resume/offline state
- Library protected access
- Profile/photo behavior
- School approval/progression/assignments/exams/scoring
- Prayer/testimony/Q&A submission
- Inbox timestamps/read/delete/badge
- existing Daily/Faith/Juice/Gratitude local reminders
- existing admin reports/Documents access

No regression suite may be weakened or deleted.

---

# Browser/fixture validation matrix

At minimum test with controlled fixtures:

### User accounts
- anonymous
- Account A FA
- Account B EN
- Account C HR
- rapid A→B switch
- logout→different account login

### Admin
- owner
- delegated Admin with matching permission
- delegated Admin without matching permission
- ordinary user

### Campaign modes
- All Push
- All Inbox
- All Push+Inbox
- FA segment
- EN segment
- HR segment
- Single user
- cancel at Preview
- edit after Preview invalidates confirmation
- double-click Execute
- timeout/unknown outcome

### Event types
- registration
- prayer
- Q&A
- assignment
- testimony

### App state
- foreground
- background payload simulation
- cold-start payload simulation
- offline then reconnect
- wrong account
- logged out
- revoked permission

### Viewports
- approximately 390px phone
- approximately 820px tablet
- approximately 1280px desktop

Native/provider physical acceptance remains for Wave 8; do not claim it here.

---

# Historical branch handling

Do not merge any historical branch.

For notification/push-specific files only, compare current `develop` against:

- `feature/final-qa-v2500-20261004`
- `feature/watchos-v2500-20261004`

If historical code contains a capability not present in current `develop`, classify it as:

- superseded
- already reimplemented
- useful to port selectively
- unsafe/obsolete
- future platform-specific

Port only if clearly necessary for Wave 4 and if it can be adapted to current Wave 1–3 architecture without regression. Record exact provenance. Do not port old release workflows or WatchOS code in this Wave.

---

# Required implementation/report artifacts

Create/update appropriately:

1. `docs/qa/WAVE4_NOTIFICATIONS_AUDIT.md`
2. `docs/qa/WAVE4_NOTIFICATIONS_REPORT.md`
3. `docs/qa/WAVE4_NOTIFICATIONS_MEASUREMENTS.json`
4. focused verification scripts for notification identity, localization, idempotency, deep links and background/no-polling behavior
5. browser/fixture tests for All/Segment/Single and event notification routing
6. `supabase/review/wave4-notifications-2/README.md` if backend review changes are required
7. review-only backend source files only when genuinely required

Do not add generated secrets, real tokens, real emails, real user payloads or Production dumps to evidence files.

---

# CI / acceptance gate

Before declaring Wave 4 complete:

1. Run JS/CJS/module syntax validation for every changed executable file.
2. Run `git diff --check`.
3. Run all existing `Validate Develop` gates.
4. Run Wave 1 regression/measurement guards.
5. Run Wave 2 local-first/offline reconciliation regressions.
6. Run Wave 3 Birthday/Admin regressions.
7. Run new Wave 4 notification fixtures/browser tests.
8. Validate migration checkpoint parity and report any pre-existing pending migration unchanged unless source review explicitly requires a new review-only artifact.
9. Ensure no deployment/apply workflow ran.
10. Commit and push to existing `develop` only.
11. Trigger/observe `Validate Develop` on the **exact final `develop` SHA**.
12. Final acceptance requires a successful CI run whose `head_sha` exactly equals the reported final SHA.

If CI fails, diagnose and fix the actual issue. Do not weaken assertions, skip gates or replace tests with no-op wrappers.

---

# Required final response from Codex

Return one concise delivery receipt plus the complete report paths. The receipt must include:

- exact starting develop SHA
- audit commit SHA
- implementation commit SHA(s)
- exact final develop SHA
- exact `main` SHA proving unchanged
- complete changed-file count and diff statistics
- links/paths to audit, final report and raw measurements
- exact successful CI run URL and confirmation that `head_sha == final develop SHA`
- whether any review-only SQL/Edge/backend source was added and exact paths
- migration parity status and list of pending migrations
- before/after request measurements with limitations
- exact status of each event type: registration, prayer, Q&A, assignment, testimony
- exact status of All / FA segment / EN segment / HR segment / Single
- exact status of Push / Inbox / Push+Inbox
- exact status of preferred-language delivery fixtures
- exact status of idempotency/deduplication tests
- exact status of deep-link tests
- exact status of logout/account-switch binding tests
- known backend/provider/live-device limitations
- explicit statement that no real messages were sent
- explicit statement that no deployment, Production mutation, migration apply, branch creation, PR, merge, `main` change, user-data deletion/backfill or Store release occurred
- explicit statement that Wave 5 was **not** started

---

# Definition of done

Wave 4 is complete only when all of the following are true at source/fixture level:

- one canonical notification architecture is documented and used
- event-driven closed-app Admin notification source contracts exist for registration, prayer, Q&A, assignment and testimony
- no client polling is used to simulate those events
- All/Segment/Single recipient contracts are explicit and guarded
- FA/EN/HR preferred-language selection is tested
- push binding is owner/account safe across login/logout/switch/refresh
- notification deep links are allowlisted and permission-safe
- idempotency prevents duplicate logical delivery
- Inbox integrity is preserved
- background/idle request behavior does not regress into polling
- security negative tests pass
- Wave 1–3 regressions pass
- exact-head CI is green
- `main` is untouched
- nothing was deployed or released

Anything requiring real APNs/FCM/OneSignal, native cold-start behavior, live Production policies, physical devices or real user delivery remains clearly marked for Wave 8 integration/physical acceptance.
