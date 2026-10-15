# CODEX Wave 6.5 — Security & Registration Hardening

## Purpose

Harden New Hope 7 authentication, registration, account deletion, Supabase exposure and security-advisor findings **without increasing service cost and without risking current Production users**.

This is a **source/fixture/review-only backend wave**. It must not deploy, apply migrations, mutate Production, delete real users, change live Auth configuration, enable paid products, send SMS, or alter `main`.

Starting accepted Wave 6 develop SHA before this task document: `0df4ad87de0df5f341b661b475adfe7a893fcce8`.

Wave 1–6 behavior remains authoritative unless this task explicitly permits a narrow security/registration change.

---

# 1. Mandatory safety boundaries

Work only on the existing `develop` branch.

Do **not**:

- create a branch or PR;
- merge/rebase/cherry-pick historical branches;
- modify or merge `main`;
- deploy Web/PWA/native builds;
- deploy Supabase functions or database changes;
- apply migrations to any remote project;
- modify live Auth settings;
- send real email/SMS/notification messages;
- enable a paid Supabase feature;
- add a paid SMS/identity provider;
- delete, backfill, migrate, reset or rewrite any real user row;
- clear user caches;
- run destructive SQL against Production;
- expose `service_role`, database secrets, private schema data or privileged keys to client code.

Any backend/database/Auth change required by this wave must remain **review-only** under:

`supabase/review/wave6_5-security-registration/`

with explicit activation order, compatibility checks and rollback instructions.

All browser/backend tests must use synthetic/fixture users only.

---

# 2. Read first

Read completely before editing runtime source:

- `AGENTS.md`
- `docs/DEVELOPMENT_WORKFLOW.md`
- `docs/qa/PRODUCT_COMPLETION_MASTER_AUDIT.md`
- `docs/qa/WAVE3_PRODUCT_ADMIN_REPORT.md`
- `docs/qa/WAVE4_NOTIFICATIONS_REPORT.md`
- `docs/qa/WAVE5_DOCUMENT_STUDIO_REPORT.md`
- `docs/qa/WAVE6_USER_APP_COMPLETION_AUDIT.md`
- `docs/qa/WAVE6_USER_APP_COMPLETION_REPORT.md`
- all current registration/Auth/account-delete runtime modules
- all current Supabase migrations/functions/RLS/grant definitions relevant to registration, Library, Auth-facing RPCs and account deletion.

Create and commit the pre-implementation audit **before runtime/backend-review implementation**:

`docs/qa/WAVE6_5_SECURITY_REGISTRATION_AUDIT.md`

---

# 3. Known live-security snapshot to verify, not blindly assume

A read-only Production audit immediately before this wave observed:

## Security Advisor

- 4 Problems / errors: `SECURITY DEFINER` Library views
  - `nh7_library_items_v224`
  - `nh7_library_items_v251`
  - `nh7_library_collections_public_v251`
  - `nh7_library_collections_public_v322`
- approximately 270 Warnings, including:
  - approximately 32 `SECURITY DEFINER` functions executable by `anon`;
  - approximately 236 `SECURITY DEFINER` functions executable by `authenticated`;
  - `pg_net` exposed in `public`;
  - leaked-password protection disabled.
- approximately 29 Suggestions for RLS-enabled tables with no policies.

These counts may change. Re-audit current repository contracts and, if safe read-only project access is available, current advisor/schema state. Never mutate Production to make the dashboard count smaller.

**The objective is least privilege and demonstrated safety, not a cosmetic zero-warning score.**

Some RLS-without-policy tables may intentionally be deny-all client-side tables. Some `SECURITY DEFINER` RPCs may intentionally be public endpoints with internal fail-closed authorization. Classify rather than blindly change.

---

# 4. Registration problems already reproduced

Current canonical registration uses `js/nh7-registration-canonical-v353.js` and server registration helpers/RPCs.

Observed weaknesses to address:

1. Current client phone validation primarily counts 8–16 digits and can accept obvious junk such as `00000000000`.
2. Current server payload validation similarly accepts digit-count-only phone values.
3. Country code is not strictly required; current UI wording says it is preferred rather than mandatory.
4. The create/update registration RPC can allow a malformed request to reach `pending` even when later approval is blocked by the stricter approval validator.
5. Email syntax/typo detection is already materially better and must not regress.
6. Email ownership cannot be inferred from syntax; confirmed Auth email is the authoritative ownership proof.
7. A valid-looking phone number is **not** proof that the person owns the number; do not claim phone verification without OTP/SMS verification.
8. SMS OTP is out of scope because the user explicitly does not want added service cost.

---

# 5. Free / no-added-cost security requirement

Do not enable or depend on any feature that requires a plan upgrade or per-message paid provider.

Specifically:

- Do not require Supabase leaked-password protection if unavailable on the current plan.
- Do not add paid SMS OTP.
- Do not add paid KYC/identity verification.
- Do not add a commercial CAPTCHA subscription.

Prefer existing/no-added-cost controls:

- strong password rules already enforced in UI and, where supported at no added cost, documented Supabase Auth settings;
- email confirmation;
- Auth rate limits already available to the project;
- RLS and least-privilege grants;
- server-side validation;
- Cloudflare Turnstile integration only if it can be used at no added cost and only as a disabled/review-ready source path until site/secret keys are intentionally configured;
- fail-closed authorization;
- account/session fencing;
- deterministic audit logging that avoids unnecessary personal data.

Do not silently enable Turnstile or any remote provider. Prepare source/fixture wiring and activation documentation only unless the repository already contains a safe disabled provider contract.

---

# 6. Professional canonical registration contract

Build one canonical validation contract shared conceptually by client and server. Avoid divergent rules.

## 6.1 Phone input and storage

Canonical stored phone format must be E.164-style:

`+` followed by a non-zero country-code digit and total international digits within the valid E.164 maximum.

Target canonical regex after normalization:

`^\+[1-9][0-9]{7,14}$`

Examples that must pass when otherwise valid:

- `+989121234567`
- `+385912345678`

Examples that must fail:

- `00000000000`
- `11111111111`
- `12345678`
- `09121234567`
- `00385912345678` if the product contract requires explicit `+`
- alphabetic input
- all-identical digit junk after normalization
- too short / too long
- missing country code

Requirements:

- `inputmode="tel"` and appropriate `autocomplete`.
- FA/EN/HR localized placeholder/help/error text.
- Persian/Arabic numerals may be normalized to ASCII for user convenience.
- Spaces, hyphens and parentheses may be accepted as presentation input only if normalization produces the required canonical `+...` value.
- Do not invent a country code from IP, locale, language or country field.
- Do not silently prepend a code. The user must intentionally provide/select it.
- Store the canonical value only after validation.
- Client and server must reject obvious repeated-digit junk such as all zeros/all ones.
- Avoid aggressive heuristics that reject legitimate numbers merely because they contain repeated digits.

Required Persian user message meaning:

`لطفاً شماره موبایل را همراه با کد کشور وارد کنید؛ مثال: +989121234567`

Provide equivalent natural English and Croatian strings.

## 6.2 Email

Preserve/improve current behavior:

- trim + lowercase canonicalization;
- no whitespace;
- exactly one `@`;
- valid local/domain syntax;
- typo suggestions for known common domains;
- same email as signed-in account when already authenticated;
- server must not trust an arbitrary payload email over the authenticated JWT identity.

Do not claim an address is real merely because syntax is valid.

For approval/identity-sensitive operations, confirmed Auth email is the ownership signal. Audit the current approval path and prepare a review-only backend gate if an unconfirmed Auth account can currently be approved.

Do not send real confirmation mail during tests.

## 6.3 Other form quality

For required human-entered text fields:

- trim whitespace;
- reject empty/whitespace-only values;
- preserve Unicode names;
- reject obvious non-content placeholders where safely deterministic (for example a field consisting only of punctuation or one repeated character), but do not implement discriminatory or language-specific name rules;
- retain current valid DOB non-future validation;
- do not impose a new age minimum without explicit product approval;
- preserve current Yes/No controlled-field semantics.

A form cannot prove a person's real-world identity without separate verification. Do not claim KYC-level identity assurance.

---

# 7. Server-side registration enforcement

Client validation is UX only. A direct REST/RPC caller must not bypass the canonical contract.

Create review-only backend source that:

- introduces a versioned strict registration validator;
- validates phone/email/required fields server-side;
- normalizes/stores canonical phone;
- rejects malformed registration **before INSERT or UPDATE** rather than merely blocking later approval;
- preserves Auth UID/email authority for authenticated users;
- preserves current device/account fencing;
- returns deterministic error codes that current/new clients can map to FA/EN/HR messages;
- never converts an invalid request into an apparently successful `pending` row.

Compatibility is critical.

Document a staged rollout so current Store users are not unexpectedly broken:

1. ship compatible client validation;
2. confirm adoption/compatibility;
3. activate strict server contract in an approved maintenance step;
4. verify metrics/errors;
5. rollback path available.

If a safe version-gated server strategy is preferable, document and test it. Do not weaken the eventual strict contract indefinitely for legacy clients.

---

# 8. Password and Auth hardening without added cost

Audit current password requirements in app source and local/config evidence.

The current product expectation is at least:

- minimum 10 characters;
- uppercase Latin letter;
- lowercase Latin letter;
- digit;
- symbol;
- no whitespace.

Preserve or strengthen only if it does not impose a paid dependency or break existing sign-in.

Important compatibility rule:

- Existing users must remain able to sign in with their existing passwords.
- Stronger rules apply to new password creation/change flows, not retroactive destructive account resets.

Audit and document free/no-added-cost Auth controls:

- email confirmation;
- password length/character settings if available to the current project without upgrade;
- sign-up/recovery rate limits;
- CAPTCHA support;
- redirect allowlist/current recovery URL safety;
- session expiration/refresh behavior where already configured.

Leaked-password protection:

- report it as desirable but plan-dependent;
- do not enable it or require an upgrade;
- do not mark Wave 6.5 incomplete merely because this paid control remains off.

---

# 9. CAPTCHA / bot-abuse protection

Prepare a **no-added-cost, disabled-until-configured** Cloudflare Turnstile integration path for registration/signup and password recovery if compatible with the current architecture.

Requirements:

- no secret in client/repository;
- client receives only site key;
- secret remains server/Auth configuration;
- CAPTCHA token required only when the feature flag/config is enabled;
- failure has localized accessible UI;
- expiration/retry handled;
- no polling;
- registration remains functional in source fixtures with provider disabled;
- exact setup/rollback documented.

Do not deploy or configure a live Turnstile site in this wave.

---

# 10. Account deletion semantics

The product must clearly distinguish:

## Reject request

Rejecting a school/registration request is **not automatically the same as deleting an account** unless the Admin explicitly chooses permanent deletion.

A rejected request may retain the account/data according to product rules so the user can correct/reapply.

## Permanent Delete

An explicit Admin `Permanent Delete` / `Full Account Delete` means the user's active personal data must be removed from New Hope 7 so the same email can later register again as a new account.

Current full-delete RPCs (`v372`, `v381`, self-delete/core variants) must be audited against all tables added since those functions were authored.

Known newer identity-linked areas that require explicit disposition include, at minimum:

- Auth user + identities + sessions/tokens through supported/cascade mechanisms;
- registrations;
- account notes/progress/saved verses/verse marks;
- School identity/progress/legacy progress/audio progress/video grants/assignments/exams/certificates where product policy permits deletion;
- fasting/spiritual-plan progress;
- Library grants/access/reading progress/claim-code ownership where applicable;
- Prayer requests;
- Testimonies;
- Sermon likes/blessings;
- Inbox/messages/receipts bound by email/device;
- Q&A authored records;
- profile/avatar/user-owned Storage objects;
- device-scoped legacy notes/progress/saved items only when the device is proven to belong to that target account;
- admin/action logs containing direct target personal data;
- any newer table with `user_id`, `user_email`, `author_email`, `target_email`, `owner`, `owner_id`, or equivalent identity key.

Do not blindly delete rows merely because they share a device ID; shared-device collateral deletion must be prevented.

## 10.1 Storage deletion

Do not directly delete `storage.objects` rows if that would orphan underlying object storage.

Design the review-only permanent-delete orchestrator to use the supported server-side Storage API for owned objects, with service credentials only in server environment, followed by database/Auth cleanup.

If the project has no user-owned Storage objects in a category, still test the zero-object path.

## 10.2 Deletion audit

A deletion audit may retain a one-way SHA-256 email hash, actor, timestamp and aggregate deleted-count summary if needed for security/accountability.

It must not retain raw deleted profile fields, phone, name, message bodies or the full email.

Document that provider/infrastructure logs/backups may have independent retention and are not equivalent to active application data.

## 10.3 Atomicity / recovery

A multi-system purge cannot pretend to be transactionally atomic across Storage/Auth/Postgres if it is not.

Design deterministic stages and idempotency:

- authorize target;
- snapshot only identifiers required to delete;
- delete owned Storage safely;
- delete app-domain rows;
- delete Auth account;
- write minimal deletion audit;
- verify zero active identity-linked rows;
- return exact stage/count status.

Retries must be safe and must not delete another account.

---

# 11. Permanent-delete Admin UX

Audit the existing Admin controls.

A destructive full delete must require:

- server-authoritative Admin permission;
- target immutable user UUID when available;
- confirmation email match;
- explicit destructive confirmation phrase such as `DELETE` or equivalent localized confirmation;
- clear distinction from `Reject`;
- no one-click accidental purge;
- cannot delete current owner account;
- cannot delete an active Admin through ordinary user-delete flow;
- stale account-switch/request fencing;
- double-submit/idempotency protection;
- localized FA/EN/HR success/error UI.

After verified permanent deletion, Admin UI must remove the deleted account from active views without blanket-cache clearing.

Do not activate a new backend delete route in Production in this wave.

---

# 12. Security Advisor triage

Create a complete classification report:

`docs/qa/WAVE6_5_SUPABASE_SECURITY_ADVISOR_TRIAGE.md`

Every current advisor item/category must be assigned one of:

- `MUST FIX BEFORE RELEASE`
- `SAFE BY DESIGN / KEEP`
- `HARDEN LEAST PRIVILEGE`
- `REVIEW-ONLY BACKEND CHANGE`
- `PLAN-DEPENDENT / NO-COST RULE PREVENTS ACTIVATION`
- `FALSE POSITIVE / INTENTIONAL` with evidence
- `DEFER WITH EXPLICIT RISK`

Do not equate advisor count with vulnerability count.

---

# 13. Four Library SECURITY DEFINER views

Do not simply set `security_invoker=true` on the four known views.

Current underlying Library tables have restrictive/admin-focused RLS, so a blind invoker conversion can make the Library disappear for legitimate approved users or expose unintended base-table columns if grants are broadened incorrectly.

Build review-only alternatives and tests.

Required properties:

- preserve approved School users' public Library catalog visibility;
- preserve Ministers grant checks;
- preserve Admin visibility;
- preserve unpublished/inactive/revoked exclusion;
- preserve exact column projection (no hidden/internal/storage-secret columns);
- direct base-table access remains least privilege;
- anonymous access remains only where explicitly intended;
- no broader row/column grant than the current public contract;
- current dynamic publication behavior continues;
- Wave 1/6 Library caching/offline rules remain intact.

Evaluate safe patterns such as security-invoker views + exact RLS + column grants, or a safer narrow RPC architecture. Choose based on actual PostgreSQL/Supabase behavior demonstrated in fixtures, not assumption.

Do not apply the chosen SQL remotely.

---

# 14. SECURITY DEFINER function EXECUTE grants

Inventory all `SECURITY DEFINER` functions and their current `anon`, `authenticated`, `service_role` and internal/trigger usage.

For each function classify:

1. intentional anonymous public endpoint;
2. authenticated user endpoint;
3. Admin endpoint;
4. internal helper;
5. trigger-only function;
6. migration/maintenance-only function;
7. obsolete compatibility wrapper.

Required hardening approach:

- trigger/internal helpers should not be directly executable by `anon`/ordinary `authenticated` unless genuinely required;
- Admin RPCs should not be executable by `anon` merely because they contain an internal Admin check;
- all Admin functions must still fail closed server-side even after grant hardening;
- public verification/registration/recovery RPCs retain only the minimum role access actually required;
- do not remove a grant used by the current app without a proven replacement;
- pin safe `search_path` for security-definer functions where applicable;
- schema-qualify sensitive references where appropriate;
- no dynamic SQL from untrusted input unless strictly justified and tested.

Create a machine-readable role/function matrix fixture and negative tests.

---

# 15. RLS-with-no-policy suggestions

Audit every RLS-enabled table with zero policies.

Do **not** add a policy just to remove an advisor suggestion.

If a table is intentionally server/internal-only, `RLS enabled + no client policy` may be the correct fail-closed state. Mark it accordingly.

For any table that is genuinely meant to be client-accessible, prove the required ownership/role policy in review-only SQL and fixtures.

Test `anon`, wrong UID, correct UID, Admin and service/internal access as applicable.

---

# 16. `pg_net` in public

Audit why `pg_net` is installed/exposed in `public` and every current repository reference to it.

Do not move the extension schema merely to remove a warning if current functions depend on `net.*` names or extension relocation is unsafe.

If relocation or privilege reduction is safe, prepare review-only SQL + compatibility tests + rollback.

Otherwise classify and document the residual warning and mitigations.

---

# 17. Secrets and client exposure

Run a repository secret/exposure audit focused on:

- Supabase publishable/anon keys: allowed client credentials only;
- no service-role key in Web/PWA/native JS bundles;
- no database password;
- no Turnstile secret;
- no provider secret;
- no private admin token;
- no sensitive values in fixtures/reports/log samples.

Do not misclassify a Supabase publishable key as a secret if it is intended for browser use, but verify that RLS/RPC authorization makes it safe.

Add a CI guard for forbidden secret patterns if the repository does not already have adequate coverage.

---

# 18. Registration abuse / duplicate behavior

Test at least:

- rapid repeated submit;
- double click;
- same email same device;
- same email different device;
- authenticated same UID;
- mismatched authenticated email;
- deleted user re-registering;
- rejected request correcting/reapplying;
- malformed direct RPC input;
- stale account switch during submit;
- offline/network timeout;
- confirmation-required account;
- already-existing account with correct/wrong password;
- repeated invalid phone/email attempts.

No real emails or users.

The canonical registration operation must remain idempotent/bounded and must not produce duplicate pending requests.

---

# 19. Required tests

Add deterministic tests for:

## Registration

- FA/EN/HR valid/invalid phone matrix;
- Persian/Arabic digit normalization;
- E.164 canonical storage shape;
- zero/repeated-junk rejection;
- missing country code rejection;
- email typo/domain/syntax/current-account rules;
- password rules;
- server-bypass negatives;
- invalid request creates zero registration rows in backend fixture;
- valid request produces one canonical row;
- duplicate/retry idempotency.

## Account deletion

Synthetic user with rows in **every known identity-linked table**:

- dry fixture pre-count;
- permanent delete;
- post-delete zero active personal rows;
- same email can create a fresh synthetic Auth/registration identity;
- no other synthetic user touched;
- shared-device user protected;
- owner/current Admin protected;
- repeated delete is bounded/idempotent and never retargets.

## Advisor/grants/RLS

- role/function EXECUTE matrix;
- Admin RPC anonymous denial;
- public endpoint intended anonymous success;
- wrong-user denial;
- Library visibility matrix;
- RLS deny-all tables remain inaccessible;
- no secret exposure.

## Regression

All Wave 1–6 tests and existing migration parity checks must pass.

---

# 20. Performance / cost requirements

Security hardening must not add uncontrolled network/background cost.

Measure at minimum:

- app startup remote requests;
- visible idle 60 seconds;
- hidden/background simulated 60 seconds;
- registration form idle;
- form submit valid and invalid;
- Admin account list idle;
- account permanent-delete source fixture;
- CAPTCHA disabled path.

Hard requirements:

- no new polling;
- no recurring registration validation request while typing;
- local field validation should be local;
- no per-keystroke server calls;
- no user-enumeration endpoint added;
- no paid provider dependency;
- no full-table scans from client.

Write raw measurements to:

`docs/qa/WAVE6_5_SECURITY_REGISTRATION_MEASUREMENTS.json`

---

# 21. Review-only backend package

If backend changes are required, create:

`supabase/review/wave6_5-security-registration/README.md`

and versioned SQL/Edge source as needed.

README must contain:

- exact purpose;
- prerequisites;
- current production assumptions;
- compatibility risks;
- activation order;
- preflight read-only queries;
- test procedure;
- rollback procedure;
- post-activation verification;
- expected advisor changes;
- expected warnings intentionally remaining;
- explicit statement that nothing in this folder was deployed/applied by Wave 6.5.

Do not add an ordinary live migration unless the project workflow explicitly requires a review artifact to be represented as a migration candidate. Prefer the established `supabase/review/...` pattern for this wave.

The existing pre-Wave pending migration remains untouched unless this task explicitly proves it must change; do not apply it.

---

# 22. Required reports

Create:

- `docs/qa/WAVE6_5_SECURITY_REGISTRATION_AUDIT.md`
- `docs/qa/WAVE6_5_SUPABASE_SECURITY_ADVISOR_TRIAGE.md`
- `docs/qa/WAVE6_5_SECURITY_REGISTRATION_REPORT.md`
- `docs/qa/WAVE6_5_SECURITY_REGISTRATION_MEASUREMENTS.json`

Report must include:

- every known advisor category;
- exact current source functions/views audited;
- client vs server registration rules;
- free/no-cost controls selected;
- paid/plan-dependent controls intentionally not enabled;
- password policy status;
- email confirmation status;
- CAPTCHA source/config status;
- phone validation matrix;
- full delete coverage matrix by table/system;
- Storage deletion strategy;
- RLS classification;
- function-grant classification;
- Library view remediation proposal/status;
- migration/review-only status;
- all unresolved risks;
- what still requires explicit owner approval before Production activation.

---

# 23. CI / exact-head requirement

Update CI only as needed to run Wave 6.5 tests. Do not weaken earlier guards.

All existing Wave 1–6 validations must remain green.

Final successful `Validate Develop` run must have:

`head_sha == exact final develop SHA`

No earlier-green run may be cited as final proof.

---

# 24. Completion criteria

Wave 6.5 is complete only when all of the following are true at source/fixture/review level:

- canonical strict phone contract implemented and tested;
- malformed phone/email cannot bypass the backend fixture contract;
- existing valid users are not forced to reset/change existing passwords;
- email ownership semantics are explicit;
- no-cost security controls are documented/implemented where source-level safe;
- no paid dependency is activated;
- permanent-delete coverage includes all current identity-linked domains or explicitly documents a safe exception;
- shared-device collateral deletion is prevented;
- same synthetic email can re-register after verified permanent deletion;
- four Library definer-view errors have a proven safe remediation design/review implementation without breaking Library access;
- Security Definer function grants are fully classified and least-privilege review changes prepared;
- RLS no-policy suggestions are classified rather than blindly modified;
- pg_net warning disposition is documented;
- no secrets are exposed;
- no new polling/cost regression;
- all Wave 1–6 regressions pass;
- exact-head CI succeeds;
- `main` remains unchanged;
- no Production/backend/provider deployment occurred.

---

# 25. Final Codex response format

Return all of the following:

- exact starting `develop` SHA;
- audit commit SHA;
- every implementation/follow-up commit SHA;
- exact final `develop` SHA;
- unchanged `main` SHA;
- complete changed-file count and diff statistics;
- audit/report/triage/measurement paths;
- exact successful CI URL and `head_sha`;
- migration parity and pending migration status;
- registration phone/email/password status matrix;
- E.164 test matrix summary;
- email-confirmation ownership status;
- CAPTCHA source/config status and confirmation that no paid/provider activation occurred;
- permanent-delete coverage matrix;
- same-email re-registration result after synthetic full deletion;
- shared-device safety result;
- four Library Security Definer view disposition;
- `anon`/`authenticated` Security Definer function-grant disposition;
- RLS-with-no-policy disposition;
- pg_net disposition;
- secret scan result;
- all review-only backend files;
- performance/no-polling measurements;
- all remaining Production/manual/plan/provider limitations.

Stop after Wave 6.5.

Do **not** start Wave 7 automatically.
