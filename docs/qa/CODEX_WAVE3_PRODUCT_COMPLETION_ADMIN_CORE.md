# Codex Wave 3 — Product Completion Master Audit + Birthday E2E + Admin Workspace Core

## Mission

Work only in `Omideno7/new-hope7-app` on the existing `develop` branch.

Wave 1 (performance/cost) and Wave 2 (local-first/offline sync) are accepted development baselines. This Wave does **not** prepare a release. The product must first reach the intended feature-complete state across user app, Admin and target platforms; physical/integration QA comes later; only after the owner explicitly approves final QA may release work begin.

Wave 2 accepted develop baseline before this task file: `c7c3214afbeefbcef4f35b55983ca79ff1555b72`.

The goals of Wave 3 are deliberately controlled:

1. Produce one authoritative **Product Completion Master Audit** for everything still planned or partially implemented.
2. Verify and, if necessary, safely complete the **Birthday/Celebration end-to-end data path** already present in the app.
3. Build/repair the **Admin Workspace 2.0 Core** without weakening server authority or duplicating backend logic.
4. Leave a precise implementation roadmap for subsequent Waves (Notification 2.0, Document Studio, user-app bug sweep, platform completion, final integration/physical QA).

Do **not** attempt every remaining feature in a single giant change. Preserve working behavior and stop after the Wave 3 scope below is complete and validated.

---

## Absolute safety / branch rules

- First read `AGENTS.md` and `docs/DEVELOPMENT_WORKFLOW.md` if present.
- Fetch the remote and synchronize with the current `origin/develop` before editing. Do not reset away concurrent accepted work.
- Work directly on the existing `develop` branch.
- **Do not create any branch, PR, feature branch, fix branch, backup branch, test branch or Codex branch.**
- Do not modify, merge, rebase, force-push or otherwise touch `main`.
- Do not deploy Web/PWA, App Store, Google Play, Supabase, Edge Functions or any production service.
- Do not apply migrations.
- Do not mutate/backfill/delete Production data.
- Do not delete user data, Notes, progress, downloads, conflicts or offline queues.
- Do not replace server-authoritative School/access/security decisions with client logic.
- Do not hard-code an admin email, admin password, or client-side admin allowlist as authority.
- Do not expose secrets or service-role keys.
- Any schema/RLS/RPC/Edge change that appears necessary must be review-only unless the existing repository already contains an approved, unapplied implementation. Document it rather than applying it.
- Preserve Wave 1 performance controls and Wave 2 owner-isolated local-first behavior.

---

# Phase A — Product Completion Master Audit (mandatory before implementation)

Create:

`docs/qa/PRODUCT_COMPLETION_MASTER_AUDIT.md`

Audit the **actual current develop source**, not old screenshots, historical branches or assumptions.

For each item record:

- Product area / feature.
- Current status: `COMPLETE-CODE`, `PARTIAL`, `BROKEN`, `MISSING`, `PHYSICAL-QA-NEEDED`, or `DEFERRED-BY-DESIGN`.
- Exact current source files/modules/routes.
- Existing backend contract/RPC/table/Edge function when relevant.
- What is working now.
- What remains.
- User-data/security risk.
- Which later Wave should own the remaining work.
- Whether browser/CI validation is possible and whether physical-device QA is required.

Do not call something complete merely because a file exists. Trace whether it is loaded, reachable, owner-safe, localized and connected to its data source.

## Audit all major user-app areas

At minimum cover:

- Authentication/account lifecycle/recovery/logout/account switching.
- Canonical registration and user profile.
- Profile photo persistence/header display.
- Birthday/Celebration behavior.
- Daily Word 365.
- Faith 365 / Faith declarations.
- Daily Juice 365.
- Gratitude 30.
- Need Salvation / Christian dedication.
- Bible FA/EN/HR.
- Apocrypha.
- Bible search, saved verses, highlights, Notes, multi-verse actions.
- Bible deep links.
- Audio Bible.
- Sermon/audio library/player/miniplayer/offline downloads/speed/resume/favorites/likes/blessings/notes.
- Global Home search including Bible + audio + direct play.
- Library dynamic catalog, collections, protected/public items, Admin-uploaded item visibility, offline behavior.
- Spiritual plans / fasting journeys / Bible reading plans.
- Calendar and Calendar -> verse navigation/freeze risk.
- Community, testimony, prayer request/replies, Q&A.
- Inbox/read/delete/timestamps.
- Push binding and user-facing notifications.
- School registration, approval, class A/B paths, assignments, revision, exam attempts/scoring, reports/export/print/PDF.
- Themes/appearance/dark mode and whether verses/content remain readable.
- FA/EN/HR localization and RTL/LTR writing direction.
- Notes displaying code/numeric artifacts.
- Settings/account/profile.
- Offline/startup/update/service worker behavior.
- Privacy/access/grants/security gates.

## Audit Admin areas

At minimum cover:

- Current Web/Desktop Admin entrypoints and duplicated/obsolete Admin modules.
- Admin authentication/access source of truth.
- Dashboard/navigation/layout.
- Requests: registration, prayer, Q&A, testimony/blessing, School work/assignments.
- User/student management.
- Content management.
- Sermons and cover images.
- Library collections/items and dynamic publishing.
- Messaging/notifications: All, Segment, Single User.
- FA/EN/HR translation/drafting.
- Reports and analytics.
- Supabase Storage visibility/management.
- Documents/Document Studio.
- AI-assisted Admin workflows.
- Audit/safety/confirmation flows for destructive actions.

## Audit target platforms/adaptive surfaces

Record current source/build support and missing work for:

- iPhone.
- Android phones, especially Samsung.
- Samsung Fold / foldable/adaptive widths.
- iPad.
- Mac / MacBook (current iOS/Catalyst or other actual repo architecture; do not invent a new platform).
- Apple Watch.
- Android/Wear watch if present; if absent, mark future scope rather than inventing it now.
- Desktop PWA/browser use on Windows/macOS/ChromeOS-like laptops where the existing web runtime applies.

For each platform distinguish:

- shared runtime feature work that belongs on `develop`,
- genuinely platform-native code,
- automated validation possible now,
- physical-device validation required later.

## Master roadmap

End the audit with a dependency-aware roadmap. Use these intended boundaries unless actual code evidence requires a safer split:

- **Wave 3:** Product Master Audit + Birthday E2E + Admin Workspace Core.
- **Wave 4:** Notification 2.0 / closed-app Admin push / All-Segment-Single language delivery / deep links / notification event coverage.
- **Wave 5:** Document Studio completion.
- **Wave 6:** Comprehensive user-app bug sweep + localization/search/profile/theme/deep-link/Library/School report fixes.
- **Wave 7:** Platform/adaptive completion: iPhone/iPad/Mac/Android/Samsung Fold plus Apple Watch integration; document any Wear scope separately.
- **Wave 8:** Full integration, upgrade/legacy recovery, offline/reconnect, battery/thermal, performance/cost, accessibility and physical-device acceptance.
- **Only after owner-approved final QA:** release preparation.

No release preparation belongs in the above Waves.

Commit the audit before the main Wave 3 implementation so the pre-change evidence remains reviewable.

---

# Phase B — Birthday / Celebration E2E validation and safe completion

The current develop already loads:

- `js/nh7-celebrations-v464.js`
- `css/nh7-celebrations-v464.css`

The present code contains a birthday modal with cake symbol, fireworks/confetti effects, FA/EN/HR Christian blessing, Jeremiah 29:11, once-per-account/day seen state, reduced-motion handling and account ownership checks. **Preserve this approved visual behavior unless an actual defect requires a narrow fix.**

The important question is whether Date of Birth reaches it reliably for every relevant signed-in account.

Current registration code requires `birthDate` and may store the canonical packet under user metadata such as `school_registration`. The celebration reader currently checks `nh7_school_access`, `nh7_user_profile`, and direct user metadata date fields. Trace the complete real data flow before changing anything.

### Required Birthday checks

Verify:

1. New canonical registration -> signed-in account -> birthday date is discoverable by the celebration module.
2. Existing approved School user -> birthday is discoverable.
3. Existing non-School signed-in account with valid profile/metadata -> expected behavior is defined and safe.
4. Another account's cached date/name can never trigger or display.
5. Logout/account switch closes/fences an open modal and cannot reuse another owner's birthday.
6. Exact local calendar date semantics are correct for the app's intended user-local behavior; do not introduce server timezone drift.
7. Invalid/future/missing birth dates do not trigger.
8. Birthday displays once for that account on that calendar day, not on every route/render.
9. FA/EN/HR title, blessing, close label and direction are correct.
10. Cake, fireworks and confetti are present when motion is allowed; reduced-motion users get the celebration without animation.
11. The Birthday modal does not conflict with Amen Gate, another modal, active form input, or accessibility focus handling.
12. Responsive behavior works at minimum 390px, 820px and 1280px.

If the only missing link is that the canonical DOB is nested in existing session/profile metadata, implement the smallest owner-safe read/hydration adapter. **Do not add a new Production schema merely for Birthday.** Never trust a DOB from another account's cached object.

If Profile currently provides no safe way to view/edit the signed-in user's birth date after registration, document this as a product gap. Implement an edit flow in this Wave only if the current authenticated profile backend already has a safe supported update contract. Otherwise make it an explicit review item; do not invent an insecure client write.

Add deterministic regression coverage. Do not add a user-visible QA/debug switch to Production UI.

---

# Phase C — Admin Workspace 2.0 Core

## C1. Audit and consolidate, do not blindly rewrite

Inspect the current Admin implementation first. Identify active entrypoints, duplicated sections, legacy scripts and backend contracts. Preserve useful working functions. Do not delete legacy code until equivalence is proven by tests and current callers are migrated.

The product direction is **one Admin Core**, surfaced appropriately on mobile/native and Web/Desktop, not two independent Admin systems that drift.

## C2. Secure Admin authority

- Admin eligibility must be proven by the existing server-authoritative access contract (existing RPC/private access/app metadata/RLS path actually present in the repo).
- A hardcoded email may never be the authority.
- Client UI hiding alone is not security.
- Normal users must not receive Admin data or actions.
- If an existing secure server contract is insufficient for a requested action, stop that action at a safe UI/read-only boundary and document the exact missing backend contract. Do not fabricate a Production permission model.

If the signed-in identity has confirmed Admin access, expose a clean **Admin Workspace** entry/surface in the app. Normal users retain the normal app experience unchanged.

## C3. Admin information architecture

Build/refine a responsive Admin shell using existing modules/contracts. The exact labels can follow current product terminology, but organize at minimum:

- Overview / Dashboard
- Requests
- Users / Students
- School
- Content
- Messaging / Notifications
- Library
- Storage
- Reports / Analytics
- Documents
- Settings / Administration

Requirements:

- clear navigation and back behavior,
- no duplicate menu items for the same action,
- usable on phone, tablet and desktop,
- FA/EN/HR UI where the current Admin supports these languages,
- RTL/LTR correctness,
- meaningful empty/loading/error states,
- no loss of existing Admin capabilities.

## C4. Dashboard and request workflow core

Provide a professional core dashboard using current available data without creating expensive polling:

- counts/status summaries where already safely available,
- pending requests surfaced clearly,
- request categories separated,
- search/filter where useful,
- route/deep-link to the relevant request detail when current app contracts support it.

Cover at least current registration/student, prayer, Q&A, testimony/blessing and School work/request surfaces that actually exist in the repository. If some are not yet centrally queryable, mark them in the audit instead of inventing an endpoint.

Preserve Wave 1 rules: no runaway polling, duplicate auth/access checks or duplicate listeners. Background Admin UI must not continue unnecessary refresh loops.

## C5. Messaging core — All / Segment / Single User

Audit the current messaging/notification Admin implementation and fix the existing **Single User** targeting path if it is broken and a supported server contract already exists.

Admin compose UX should clearly support the applicable existing target modes:

- All users
- Segment/group
- Single user

Do not claim delivery capability if the backend cannot prove it.

Use a safe workflow:

`Draft -> Preview -> Confirm -> Execute`

For multilingual messages:

- preserve/edit FA/EN/HR variants,
- route a user's message to the user's actual preferred/app language when supported by current contracts,
- never send all three languages to a user merely because the Admin form contains all three unless that is the explicit intended preview/test behavior.

If AI drafting/translation already has a current safe integration, consolidate it behind the same preview/approval flow. If not, build the UI boundary/adapter contract and document what is missing; do not invent a secret or speculative Production AI endpoint.

**Closed-app Admin push for new requests is NOT to be deployed in Wave 3.** Audit the event sources and leave a concrete Wave 4 implementation contract for APNs/FCM/OneSignal/deep-link delivery.

## C6. Admin global search

Add/refine Admin global search only over data the confirmed Admin is already permitted to retrieve. It should help locate users/students/content/requests where current APIs allow it. Do not load entire large tables client-side solely to fake global search. Document missing server-side search support if needed.

## C7. Storage Manager foundation — read-only in this Wave

Create or refine an Admin Storage view using existing authenticated/authorized capabilities only:

- bucket name,
- object/file listing where permitted,
- size/date/type metadata where available,
- search/sort/filter if possible without expensive full rescans,
- clear distinction between active file and orphan/duplicate **candidate**.

Do **not** permanently delete/replace/move Production Storage objects in this Wave. Destructive Storage actions require a later audited confirmation contract and explicit owner approval before Production mutation.

## C8. Reports / analytics preservation

Do not remove useful analytics. Reuse the cost-efficient local/session/daily aggregate direction from Wave 1. Admin reports should not re-enable raw high-frequency event ingestion or expensive polling. If fresh cloud analytics requires an unapproved backend contract, show current available data and document the review-only requirement.

## C9. Documents / Document Studio boundary

Do not attempt the full Document Studio rebuild in Wave 3. Audit current implementation and ensure the Admin navigation reaches the existing safe surface without regression. Record exact missing items for Wave 5, including:

- templates,
- FA/EN/HR,
- rich text,
- images,
- page layout,
- preview,
- PDF,
- Print,
- Draft,
- Publish to Library,
- edit after publish,
- AI-assisted translation/formatting/title/summary with approval.

---

# Phase D — Regression and performance requirements

Run the canonical `develop` validation plus focused Wave 3 tests.

At minimum add/maintain deterministic coverage for:

### Birthday
- registered current owner DOB,
- nested metadata DOB if that is the actual supported source,
- no-DOB and invalid-DOB,
- birthday vs non-birthday date,
- once-per-user/day,
- account switch,
- FA/EN/HR,
- reduced motion,
- modal/gate/form collision,
- 390/820/1280 responsive layout.

### Admin access
- confirmed Admin can enter Admin Workspace,
- normal authenticated user cannot,
- anonymous user cannot,
- stale Admin response from a previous account cannot unlock a new account,
- sign-out/account switch removes/fences Admin UI/data,
- no hardcoded email authority.

### Admin UX
- navigation and back behavior,
- request category rendering/filters,
- Messaging All/Segment/Single target selection and Preview/Confirm guard,
- no accidental send during preview/tests,
- FA/EN/HR + RTL/LTR,
- phone/tablet/desktop widths,
- read-only Storage Manager cannot mutate/delete,
- Document surface remains reachable without regression.

### Wave 1 / Wave 2 invariants
- no request/polling explosion,
- no duplicate listeners/observers,
- local-first personal data still owner isolated,
- Notes/progress/saved data/offline queue regressions remain passing,
- Library security/cache behavior unchanged,
- audio background callbacks remain controlled.

Measure before/after request/timer/listener impact for the Admin idle/open/request-navigation scenarios where practical. Do not claim physical battery/thermal improvement from synthetic tests.

Run JS syntax, whitespace/diff checks and final exact-head CI.

---

# Phase E — Deliverables

Create:

1. `docs/qa/PRODUCT_COMPLETION_MASTER_AUDIT.md`
2. `docs/qa/WAVE3_ADMIN_BIRTHDAY_AUDIT.md`
3. `docs/qa/WAVE3_PRODUCT_ADMIN_REPORT.md`
4. Focused deterministic test scripts/fixtures as needed.
5. Any review-only backend contract notes under an appropriate `supabase/review/...` path; **no applied migration**.

The final report must include:

- exact final `develop` SHA,
- exact audit commit SHA,
- implementation commit SHA(s),
- complete changed-file list and diff stat,
- exact CI run URL and confirmation it ran on final SHA,
- Birthday E2E status and exact DOB source(s),
- Admin authorization source of truth,
- Admin areas completed vs deferred,
- Messaging All/Segment/Single status,
- Storage Manager status,
- performance/request/polling before/after evidence,
- all tests run and result,
- security/data risks and unresolved blockers,
- Product Completion Matrix summary by Wave 4-8,
- physical-device tests still required,
- migration parity and any pre-existing pending migration status,
- explicit confirmation that `main`, Production, Supabase live schema/data, Web deployment and Stores were not touched.

---

# Stop conditions

Stop and report rather than guessing if:

- secure Admin authority cannot be proven from existing contracts,
- a feature requires a new Production schema/RLS/RPC/Edge deployment,
- fixing a data path would require destructive migration/backfill,
- a requested Admin action cannot be tested without actually sending/deleting Production data,
- platform-native behavior cannot be validated in the current environment.

In those cases, implement only the safe client/read-only/testable boundary and document the exact next approved backend/device step.

When Wave 3 is complete, push the commits to the existing `develop` branch and stop. **Do not start Wave 4 automatically.**