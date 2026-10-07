# Issue #123 — review-only backend artifacts

These files are deliberately **outside automatic migrations**. They are not approved for Production.

- `00_read_only_inventory.sql`: read-only metadata query; requires separately authorized live metadata access. No content, user/grant rows or object names are read. Policy expressions can identify users; keep raw output private.
- `01_authorization_rehearsal.sql`: gated local-fixture transaction ending in `ROLLBACK`. Empty adapters are deliberate blockers until real ledger/admin/object mappings are reviewed. It does not fix legacy endpoints/views/collection policies, old public/signed files or caches. No bucket is created/moved or grant changed.
- `02_rollback_rehearsal.sql`: gated local policy-neutralization illustration, also ending in `ROLLBACK`. This can reintroduce baseline exposure and is not an automatically safe Production recovery. Prefer deny-and-fix-forward. No table/function/policy/file/grant deletion.

Full map, findings, target model, phased deployment, compatibility and rollback:
[Issue #123 audit](../../../docs/audit/ISSUE_123_MINISTERS_LIBRARY_SECURITY.md).

Local SQL test dependency is pinned `@electric-sql/pglite@0.3.14`, installed outside the repository; for example:

```sh
npm_config_cache=/tmp/nh7-review-npm npm install --prefix /tmp/nh7-review-pg --no-audit --no-fund @electric-sql/pglite@0.3.14
NH7_PGLITE_PACKAGE=/tmp/nh7-review-pg/node_modules/@electric-sql/pglite node scripts/verify-ministers-library-sql-v123.cjs
node scripts/verify-ministers-library-audit-v123.mjs
```

The SQL tests create only an in-memory synthetic database and never connect to Supabase. All new authority is derived from a verified request's `auth.uid`, backed by reviewed server-managed grant/admin adapters. Spoofed client email/role is not authority. No active app, School reports, Print/PDF/CSV, audio, testimony, notifications, profile or student-data code is changed.
