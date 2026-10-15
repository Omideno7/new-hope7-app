# Wave 6.6 Performance Advisor appendix

Owner-supplied read-only 2026-10-15 snapshot, separate from the security disposition counts. This appendix is non-blocking and contains no performance DDL.

| Finding | Count | Later review evidence required |
| --- | --- | --- |
| Unindexed foreign keys INFO | 21 | Exact relation/key, workload/explain/size/write cost; no automatic index creation. |
| auth_rls_initplan WARN | 6 | Exact policy equivalence and plans under each role; no policy rewrite now. |
| Unused indexes INFO | 19 | Observation window/stat resets/constraints/release workload; zero usage alone is not deletion proof. |
| Multiple permissive policies WARN | 26 | Exact OR-policy semantics and per-role negatives; no consolidation now. |
| Duplicate indexes WARN | 4 | Exact definitions/opclasses/predicates/constraints/dependencies; no drop now. |
| Auth connection strategy INFO | 1 | Reported absolute 10; assess available current-plan capacity without changing setting. |

No indexes added/dropped, no policy merged, no Auth connection strategy change, no paid optimization. Startup/60s visible/60s hidden/registration/Admin idle measurements are recorded separately with synthetic intercepted remote requests; review files add no app traffic/timers.
