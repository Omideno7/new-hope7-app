# Ministers Library security audit — 2026-10-06

Status: development audit only. No Production change is authorized by this document.

## Confirmed secure layers

- The current app catalog uses `nh7_library_catalog_v396`.
- `nh7_library_catalog_v396` requires an authenticated identity and only returns `audience='ministers'` items when the current `auth.uid()` has an active library grant, except for the configured owner admin.
- A simulated authenticated identity with no grant returned **0 minister items**.
- The `nh7-library` Storage bucket is private.
- The `nh7-library-access` Edge Function requires a valid JWT, resolves the actual user, calls server-side library authorization, and only then creates a short-lived signed URL.
- The base `nh7_library_items` table does not expose SELECT to ordinary authenticated clients; RLS/admin policy remains in force.

## Confirmed defects / hardening gaps

1. **Catalog cache in `app.js` is not scoped to the authenticated user.**
   - `nh7_library_catalog_cache_v1` is shared within the browser/app session.
   - An authorized account can leave minister metadata in session cache for a different account using the same running app/session.
   - Logout does not currently clear all library catalog/cache/tab markers.

2. **The Ministers Library tab is offered to ordinary school-approved users.**
   - The modern backend may return zero minister rows, but the protected UI surface is still enterable.
   - Required behavior is default-deny: without an active minister entitlement the tab must remain locked and restricted metadata must not render.

3. **`nh7-library-collections-v322.js` retains live in-memory state across identity changes.**
   - Its persisted cache is email-scoped, but live `collections`, `itemMap`, `lastLoad`, and selected collection state are not reset when the authenticated identity changes.

4. **Legacy compatibility surfaces remain present.**
   - `nh7_library_items_v222` is legacy. It is currently `security_invoker=true`, so it cannot bypass the base table's SELECT/RLS restrictions, but it is not the canonical authorization contract.
   - Modern catalog/access RPCs must remain the source of truth for restricted content.

## Required development fix

- Scope catalog cache to `auth.uid()`.
- Clear all library catalog/collection caches, selected minister tab, and minister markers on logout/account change.
- Fetch fresh `nh7_my_content_access_v251` authorization before entering/rendering Ministers Library.
- Do not render minister cards/collection metadata when authorization is absent or revoked.
- Reset collection-module in-memory state on account identity change.
- Keep file delivery behind server-authorized short-lived signed URLs; never expose a public Storage URL.
- Verify Global Search/deep links/offline cache cannot surface restricted minister content to an unauthorized identity.

## Required test matrix

- Anonymous user
- Authenticated ordinary user
- School-approved user without minister grant
- Authorized minister
- Minister with a single-item grant
- Revoked minister
- Owner/admin
- Account A authorized → logout → Account B unauthorized in the same app session
- Direct deep link / known item ID
- Stale cache / offline state
- Signed URL expiry behavior

## Production rule

No database/RLS/view/Edge Function change should be made from this audit without a separately reviewed migration/rollback plan and explicit approval.
