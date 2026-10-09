# New Hope 7 — Library Production Security Audit

Date: 2026-10-09 (Europe/Zagreb)
Baseline `main`: `2c8c12e8abfeaa4dd84c72b03739ab05ae992d95`
Scope: read-only Production audit. No database, Storage, Edge Function, app, or user-data mutation was performed.

## Executive result

The current Production Library security state is materially newer than the assumptions recorded in draft PR #126. Do not merge or deploy PR #126 as-is.

The live `nh7-content-access` Edge Function is version 5 with JWT verification enabled. Its Library branch forwards the authenticated caller JWT to `public.nh7_library_catalog_v396()` using the publishable key; it does not use the service-role client to read the Library catalog.

The currently observed Library path therefore already implements the central caller-identity correction discussed in #126. The remaining work is attack-surface reduction and stale QA/diagnostic cleanup, not a blind redeploy of the old draft branch.

## Live Production evidence

### Edge Function

- `nh7-content-access`: ACTIVE, version 5, `verify_jwt=true`.
- Library catalog adapter validates the caller token, then calls `rest/v1/rpc/nh7_library_catalog_v396` with that caller bearer token.
- `nh7_library_catalog_v396()` requires an authenticated caller and filters Ministers items/collections using `nh7_is_admin()` or `nh7_content_access_active_v251(auth.uid(), ...)`.

### Last 24 hours — version 5

Observed `nh7-content-access` version-5 requests:

- total: 366
- HTTP 200: 168
- HTTP 401: 13
- HTTP 403: 185
- HTTP 5xx: 0

401/403 responses are expected authorization outcomes for invalid/unauthorized callers and are not evidence of a runtime crash. No 5xx errors were observed in this window.

### Database / Storage

RLS is enabled on:

- `public.nh7_library_items`
- `public.nh7_library_collections_v322`
- `public.nh7_account_content_grants_v251`
- `public.nh7_library_access_log`

The `nh7-library` Storage bucket is private. Its direct Storage policy grants authenticated management only when `nh7_is_admin()` is true.

### Reader RPC chain

The legacy-but-callable reader RPCs `nh7_library_reader_access_v250`, `v260`, and `v321` delegate authorization to `nh7_library_authorize_v230` before returning reader content. That authorization function validates caller identity and enforces School approval for non-Ministers content and active content grants/Admin for Ministers content.

`nh7_library_reader_access_v372` performs the corresponding identity / School / Ministers checks directly.

No direct bypass was identified in those reader versions during this audit.

## Security Advisor findings and native compatibility boundary

Supabase Security Advisor reports four Library views as SECURITY DEFINER views:

- `public.nh7_library_items_v224`
- `public.nh7_library_items_v251`
- `public.nh7_library_collections_public_v251`
- `public.nh7_library_collections_public_v322`

All four are owned by `postgres`. `anon` does not have SELECT on them; `authenticated` and `service_role` do. Their definitions contain caller-aware filters using `auth.uid()`, School approval and/or Ministers content grants.

This is still a structural security warning, but **these views must not be revoked, dropped, or switched to `security_invoker` in the current release line without a compatibility migration**. The published native 2.5.0 baselines still contain direct references:

### Published iOS 2.5.0 baseline

- `js/nh7-book-reader-v280.js` reads `nh7_library_items_v224`.
- `js/nh7-book-reader-v281.js` reads `nh7_library_items_v224`.
- `js/nh7-library-text-reader-v250.js` reads `nh7_library_items_v224`.
- `js/nh7-security-core-v340.js` explicitly recognizes both `nh7_library_items_v224` and `nh7_library_collections_public_v322`.

### Published Android 2.5.0 baseline

- `android-release-25002/www/js/nh7-access-bootstrap-v230.js` references `nh7_library_items_v224`.
- `android-release-25002/www/js/nh7-book-reader-v280.js` reads `nh7_library_items_v224`.
- `android-release-25002/www/js/nh7-book-reader-v281.js` reads `nh7_library_items_v224`.
- `android-release-25002/www/js/nh7-library-text-reader-v250.js` reads `nh7_library_items_v224`.
- `android-release-25002/www/js/nh7-security-core-v340.js` recognizes `nh7_library_items_v224` and `nh7_library_collections_public_v322`.

Therefore the current native installed-user compatibility contract still depends on those views. A future hardening design may migrate all supported clients to caller-JWT RPCs and then retire the views, but that is a separate release project and must not be bundled into this small hardening step.

The same published iOS/Android baseline search found **no references** to the two v363 QA RPCs below.

## Remaining stale QA surface

Two old QA RPCs still have EXECUTE exposed through PUBLIC, which also makes them callable by `anon` at the database privilege layer:

- `public.nh7_qa_library_catalog_v363()`
- `public.nh7_qa_library_reader_access_v363(uuid,text)`

Both functions currently contain an internal `auth.uid()` + `nh7_is_admin()` guard, so this audit did **not** identify anonymous disclosure through them. However, PUBLIC execution is unnecessary attack surface for SECURITY DEFINER QA functions.

Additional evidence:

- no current `main` code reference was found for either v363 QA RPC;
- no reference was found in the published iOS 2.5.0 or Android 2.5.0 baselines;
- no invocation of either RPC was observed in the last 24-hour Production log window;
- current default privileges for new `postgres`-owned functions in `public` already omit PUBLIC/authenticated and grant only postgres/service_role, so these v363 grants are historical residue rather than the desired current default.

## Whole-project Security Advisor note

The current Advisor also reports multiple other anonymous-executable SECURITY DEFINER functions across legacy/public workflows. These findings must **not** be bulk-revoked: several are intentionally public APIs (for example public testimony/certificate/document lookups and registration flows), several are trigger functions, and several Admin-labelled functions contain internal Admin guards. They require a separate endpoint-by-endpoint audit.

This PR intentionally remains Library-scoped and does not alter those unrelated contracts.

## Recommended minimal hardening

Phase A should only revoke `PUBLIC` and `anon` EXECUTE from the two v363 QA RPCs while retaining `authenticated` and `service_role` execution. This does not drop either function and does not touch Library views, Library rows, grants, user data, Storage objects, app code, or Edge Functions.

A rollback-only rehearsal is included at:

`supabase/review/library-hardening-20261009/01_revoke_legacy_qa_execute_rehearsal.sql`

It ends in `ROLLBACK` and is **not** a Production migration.

## PR #126 disposition

Current comparison with `main`:

- status: diverged
- ahead by: 10 commits
- behind by: 2 commits
- merge base: `5d376214295491a0d78b2637477a5bbd58eb14e0`

A clean Library 125.5 client subset has already reached `main` through PR #140, and Production `nh7-content-access` is already version 5. Therefore #126 should remain a reference/test source until its still-useful tests/documentation are selectively reconciled against current `main`; it should not be merged wholesale.

## Safety gate before any Production change

Before converting the rehearsal into a migration:

1. Keep current `main`, the four compatibility Library views, and installed native apps unchanged.
2. Recheck that the two QA RPCs remain unused by current `main`, published iOS/Android baselines, and Production logs.
3. Run current Library, School, Notes, Audio, localization, report, and offline regressions.
4. Apply only the EXECUTE revoke in a reviewed migration.
5. Verify authenticated Admin QA remains callable if still needed; verify anon receives permission denied.
6. Verify published/native Library access still works unchanged through the compatibility views.
7. Verify `nh7-content-access` continues returning expected 200/401/403 behavior with zero new 5xx.

No destructive cleanup, function DROP, view permission change, or view conversion is authorized by this audit.