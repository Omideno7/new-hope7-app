# Supabase cost audit — 5,000-user target

Date: 2026-10-10. Baseline develop before this branch: `54e5a13ab4f8bec3648eef54121abf2179099a51`.

## Goal
Reduce unnecessary Supabase CPU/IO/request volume without removing user-facing features or weakening user-data safety.

## Production observations
- Project is ACTIVE_HEALTHY in eu-central-1.
- `notification_inbox` is currently the largest public table observed (~31 MB, ~34k live rows).
- 24h edge traffic is led by Inbox REST, Auth user checks, Library catalog, Registrations, Inbox receipts, and Inbox snapshot.
- `nh7_inbox_snapshot_v419` is relatively expensive compared with most app RPCs.
- Legacy telemetry v222/v223 endpoints are already server-side no-ops in Production; old clients may still call them, but the current develop client does not write those analytics.
- Performance advisor reports RLS InitPlan opportunities, missing FK indexes, duplicate permissive policies, and duplicate indexes. These are backend candidates, not reasons to remove features.

## Safe client optimizations in this branch
1. Inbox route no longer forces a new cloud sync every time it opens. It uses the existing 2-minute shared sync TTL. Push foreground/click, reconnect, manual Cloud Sync, and first app startup retain forced synchronization where already implemented.
2. Library catalog uses a 2-minute in-memory reuse only when the currently verified bundle contains exclusively `public` items/collections. Any protected/ministers bundle continues to revalidate on every catalog call. Concurrent calls are coalesced through one in-flight promise. Persistent cache remains public-only and UID-bound.

## Backend candidates — REVIEW ONLY
See `supabase/review/optimize_inbox_rls_cost_v1_candidate.sql`. It is intentionally not an active migration. Candidate changes:
- case-insensitive Inbox email+time index;
- lower(email)+lesson indexes for School assignment/progress lookups;
- InitPlan-safe account/community RLS expressions with equivalent ownership rules.

## Deliberately not changed
- no Production schema/data/RLS/function mutation;
- no deletion of historical telemetry tables yet;
- no removal of Inbox, Profile, School, Community, Library, Notes, Audio, Push, or offline features;
- no reduction of protected-library authorization freshness;
- no user-data cleanup or retention policy introduced.

## Next backend phase
Before activating the candidate SQL, compare exact EXPLAIN plans and rerun Supabase performance/security advisors. Duplicate policies/indexes should be removed only after proving they are semantically redundant. Historical analytics tables can later be archived/retained with a policy only after explicit review.
