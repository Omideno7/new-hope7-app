# Issue #125 — review-only Library production-path hardening

Base: current `main`, `5d376214295491a0d78b2637477a5bbd58eb14e0`. No Production connection, deploy, SQL execution, migrations, grants, data changes, or merge performed. Findings below use the live metadata supplied in Issue #125, rather than claiming another live inspection.

## Root cause and authorization

The live `nh7-content-access` route validates authentication/School approval but selects all active/published `nh7_library_items` using a service-role client. School approval is not a Ministers Library entitlement. A caller can request `action=catalog, resource=library` directly, independently of the correctly filtered UI. The service role cannot be the caller of an `auth.uid()` authorization RPC.

Production already has the appropriate authority: `nh7_library_catalog_v396` filters both items and collections using the current `auth.uid()` grant. Reader v372 and authorize v230/v251 also enforce current entitlement and identity matching. Admin exceptions must come from these server functions, never client role/email/device flags. `nh7-library` is private and its direct Storage policy permits Admin management only. `nh7-library-access` validates `auth.getUser()`, authorizes, then signs for 600 seconds; its deployed implementation is unchanged.

The proposed Edge Library branch calls `/auth/v1/user` with the incoming bearer and then calls catalog v396 with **the same caller bearer and a publishable key**. It never selects a Library table with the service role. Filtering/projection/pagination happens only on the already authorized result set. Scope grants, revocation and Admin handling therefore use the same current server authority as the main client. Unsupported query operators fail explicitly rather than widening the catalog. Other Edge actions and the existing School gate must remain byte-for-byte unchanged when integrating this branch.

## Source integration blocker — do not deploy this directory as-is

The repository has no deployed `nh7-content-access/index.ts`; the issue gives its behavior, not its full source. This PR provides executable/tested replacement code in `supabase/functions/nh7-content-access/library-catalog.mjs`. It deliberately does not invent the other status/audio/School handlers or a substitute entrypoint. The Production leak remains until an approved integration/deployment is completed. The module alone is not a deployable full Edge Function.

After obtaining the exact current entrypoint and preserving its imports, JWT validation, CORS and School approval gate, import:

```ts
import { libraryCatalog } from './library-catalog.mjs';
```

Replace only the `action === 'catalog' && resource === 'library'` branch, **after** the unchanged School approval check:

```ts
return await libraryCatalog(req, body, {
  supabaseUrl: Deno.env.get('SUPABASE_URL')!,
  publishableKey: Deno.env.get('SUPABASE_ANON_KEY')!,
  corsHeaders,
});
```

Here `req`, `body` and `corsHeaders` must refer to the existing request, parsed payload and CORS headers in that exported source. Verify the key is a publishable/anon key, never `SUPABASE_SERVICE_ROLE_KEY`. Keep `verify_jwt=true`. Compare actual old-client query shapes with the adapter's `eq`, `is`, `select`, `order`, `offset`, `limit` support before deployment. No table/view/schema/RLS/Storage migration is required for this catalog fix.

## Client call-site map

| Active path | Before | After |
|---|---|---|
| Home Library / Ministers tab / Apocrypha via `app.js` | catalog v396 plus shared unscoped session snapshot, including unrestricted fallback after failure | shared freshness helper calls v396 on every load; only public metadata persisted per UID |
| Library collections v322 | email-hash local snapshot, no entitlement check offline/on error | same live v396 helper; no persistent restricted items/collections |
| Book reader v283 / `NH7_OPEN_BOOK(id)` | stale catalog map hit; failed catalog retained old map | fresh v396 validation before each direct ID open and again before presenting text; denied items never trigger a reader request |
| Active language wrapper v321 | redirects reader v250 to **v321**, persists whole text under `nh7reader-offline-v327`, replays after offline/errors | language-aware v321 wire contract preserved; fresh catalog membership gate, no reader-body persistence/fallback; deletes this Library-only old cache |
| Legacy item views v222/v224 | protected fetch maps to School-only `nh7-content-access` Library catalog | protected fetch routes through fresh v396; filters only authorized rows; no Edge Library catalog call |
| Legacy collection view / inactive readers v250/v280/v281 | security-core aliases v341; old inactive scripts remain historical | unchanged inactive files; active v322 uses v396, v222/v224 intercepted before security-core aliases |
| File open | authorized `nh7-library-access`, signed GET, in-memory Blob | same payload/Edge/signing flow; discard results crossing logout/identity change; remove/revoke viewer when authorization snapshot invalidates |
| Global Search v558/v562 | Bible, audio, saved references and local notes; no Library provider | unchanged; synthetic restricted Library marker yields zero result rows |
| Offline files / worker | canonical storage identity strips signed tokens; shared IDB/cache/native downloads can replay files without grant check | Library bucket alone bypasses stored worker responses; Library `status/localPlayable/download` deny persistent reuse; identifiable old Library IDB/cache/native sidecars/files purged; audio/School paths unchanged |

**Reader backend review gate:** the active language wrapper was found to redirect v250 to v321, not v372. No deployed signature/function body for v321/v372 is present in this repository or supplied in the issue. The current client adds fresh UID-scoped catalog authorization around v321 while retaining the working FA/EN/HR request contract. Before Production approval, read the signatures/definitions using `supabase/review/issue125/metadata-preflight.sql`; prove that v321 delegates to the confirmed UID-secure v372 (including language and scope handling). If it does not, prepare a narrowly scoped compatible server wrapper or switch the client to the verified v372 signature in a further reviewed patch. Do not guess parameters or claim direct raw v321 is secured by a client check. This unresolved verification is a blocker for a complete backend rollout.

## Cache/freshness design

Restricted metadata exists only in memory following a successful online caller-JWT RPC. It is not written to session storage, local storage or Cache Storage. Persistent catalog snapshots use `nh7_library_public_v125_<UID>` with an explicit `uid`, timestamp and strictly `audience=public` items/collections. Public snapshots expire in ten minutes. No token/reader text/grant flag is persisted as authority.

Each catalog/reader use rechecks online authority; a request captures UID and generation, and discards a late result if either changes. Same-tab auth-save/logout dispatches a Library-only event; storage changes, offline, page restoration, foreground and a one-second identity/freshness watchdog invalidate stale state. While restricted metadata is present, a ten-second heartbeat rechecks current grants. A snapshot expires after 35 seconds without a successful response. RPC requests have a ten-second abort deadline. These bounds describe detection without server push, not instantaneous remote revocation. Failed/401/403/`allowed=false` checks clear restricted memory/cards/collections/viewers; 401/403 do not restore even public snapshots. Transient/offline fallback may restore only a matching UID's unexpired public metadata. A cached School approval is never minister authority.

Startup removes legacy Library catalog/session/collection snapshots and only shared protected snapshots labelled `resource=library`. The language wrapper deletes the Library-only full-text cache. The offline utility deletes identifiable Library download rows and associated stable Cache Storage/native files, preserving other downloads. Library byte lookup/download methods refuse this private mixed-audience bucket before any cached lookup. The worker never replays its cached Library bytes, even if a signed URL's token changes or expires. New release cache identity and loader versions include the helper and updated Library modules; all changed runtime assets are guaranteed offline.

Security tradeoff: old unscoped offline Library documents/readers, including public ones, require an online re-open. Public online Library and language behavior remain intact; public catalog metadata still works offline per UID. There was no active Library offline-download button to preserve. Notes, saved verses, reader positions, themes, audio downloads and School/account data are not deleted. Unknown orphan bytes without an identity/sidecar cannot safely be attributed and deleted without risking unrelated files; shipped APIs do not serve them. Content previously copied/exported outside the app cannot be retracted. Already issued signed URLs retain their existing 600-second capability lifetime; this PR does not promise to revoke such URLs immediately or change the working signed-file backend.

## Tests and evidence

All fixtures are synthetic. Edge/Supabase responses are mocked; no real restricted metadata, content, accounts or grants are accessed. A mocked grant matrix demonstrates JWT forwarding and fail-closed client behavior; it is not a fresh Production RLS certification.

| Case | Evidence |
|---|---|
| Anonymous | Edge adapter 401, no catalog RPC; client missing/logout identity returns empty |
| Normal authenticated / School-approved non-minister | Edge/current client grant fixtures return public rows only; `audience=eq.ministers` returns empty |
| Authorized scoped minister | only public + granted item, no other minister item; no restricted strings in persistent snapshots |
| Revoked | fresh catalog drops item/collection; no stale 403/offline restoration; current UI removes card and open reader |
| Admin | server fixture includes explicitly authorized Admin rows; forged client role/email cannot widen normal access |
| Direct ID/deep link | actual `NH7_OPEN_BOOK` denies revoked ID without issuing reader RPC; public reader works |
| Session/local/offline | actual helper purge/identity-race/expiry tests; actual worker and offline API refuse stale Library bytes; shared audio snapshot/cache path retained |
| Search | actual current search returns zero Library-marker result rows; existing exact Bible result/deep-link/share regression passes |
| FA → EN → HR → FA | active Library rendering and reader regression, RTL/LTR; existing 11-route i18n regression |
| Public Library | current public card/reader + legacy v224 filters; public-only per-UID offline snapshot |
| School reports | 1,109-row full CSV, group/individual PDF, Print/Back, wrong answers, timeouts and read-only source preservation browser suites |

Commands: `node scripts/verify-library-security-v125.mjs`; `node scripts/verify-library-browser-v125.cjs`; `node scripts/verify-i18n-v115.cjs`; `node scripts/verify-school-reports-v116.mjs`; `node scripts/verify-school-reports-browser-v116.cjs`; `node scripts/verify-report-pdf-v119.mjs`; `NH7_TEST_PRINT121=1 node scripts/verify-report-pdf-v119.cjs`; all read-only repository workflow validation blocks. Browser commands require a local static server on 8765, Playwright and Chromium. No browser-native Safari/real-device or live backend deployment validation is claimed.

Current deploy-pages validation and next-native optimization guard pass, with a new dependency-free security job. Historical patch workflows retain six pre-existing hardcoded version/old wiring failures, reproduced on untouched current main. Mutating patch/deploy/CORS/live steps are excluded. Machine-readable sanitized validation evidence is in `ISSUE_125_VALIDATION.json`.

## Exact Production steps requiring explicit approval — NOT executed

1. Export/back up the **complete currently deployed** `nh7-content-access` source, dependency lock/config and JWT setting; record its hash/version. Store securely, without committing keys. Obtain missing entrypoint and confirm reader signatures/aliases using the metadata-only SQL. Resolve the reader gate above before approving a complete rollout.
2. Integrate the module with the exact existing entrypoint as shown; review a diff restricted to Library branch/import. Keep status/audio/School approval logic unchanged. Reproduce old-client query cases; validate no unsupported operator is silently broadened. Run Deno type/syntax checks and the synthetic suite on the complete function. Test in an isolated non-Production project against the **actual existing** catalog function and all principal/scope/expiry cases.
3. Seek explicit approval of the complete source diff and target project. Only then, an authorized operator runs `supabase functions deploy nh7-content-access --project-ref gpzcwffxnddhaeaogdyo` with `verify_jwt=true` retained. No `--no-verify-jwt`, `db push`, SQL migrations, or Storage/RLS policy commands are required or allowed by this PR.
4. With approved test accounts, verify a School-approved non-minister requesting the Edge catalog directly gets zero restricted rows, scoped ministers see only grants, revoked users see zero, and server Admin exception/public/audio/School paths are intact. Avoid logging row contents or tokens.
5. Separately approve/publish the client branch and updated worker assets. Force a normal full reload/update for old open clients. Verify logout/relogin, old session/local/reader/download cache seeds, offline refusal, expiry and language transitions on real iPhone/iPad and desktop. Recheck existing School Print/PDF/CSV. Old arbitrary clients can still call the currently weak Edge until the server deploy is completed.

## Rollback

Before deployment, save the complete deployed Edge artifact and client release, plus hashes. No DB/RLS/Storage/data rollback is needed. If the Library adapter fails, replace **only its Library branch** with a fail-closed 503 `library_catalog_unavailable` response retaining existing CORS/no-store/JWT/School gate; keep all other actions and the verified signed-file flow. Prefer forward-fixing a compatibility filter to restoring the known metadata leak. An authorized operator may redeploy the backed-up entrypoint only with the vulnerable Library branch disabled and explicit approval.

If client rollback is needed, roll forward the last good UI with this helper, restricted cache denial and Library worker exclusion retained, bump the Library loader/worker cache identity, and smoke-test public Library and unrelated downloads. Do not revive v1/v327 restricted snapshots or restore old offline reader bodies. Purged Library downloads must be reacquired online after authorization; never restore them from a shared backup. Restoring the fully vulnerable pre-fix release requires an explicit security exception, not an automatic rollback.
