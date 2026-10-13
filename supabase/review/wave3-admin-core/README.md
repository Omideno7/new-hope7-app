# Wave 3 backend boundaries — review only

No SQL/Edge/RLS/Storage/Auth change or deployment is included. Existing server contracts remain authoritative.

## Authority and roles

`nh7_admin_my_access_v350()` uses `auth.uid()` and private v350 memberships/grants. Owner-only classic APIs remain owner-only; delegated members retain only their server-granted registration actions. The shared app only offers an entry after this RPC; the separate current Admin runtime repeats proof with the exact JWT before loading any Admin data. No client email allowlist, credential in a URL, or service-role key is introduced.

A current client must still fail closed if any contract is absent or denied. Browser fixtures verify source behavior, not live role assignment or policies. General delegated content/messaging/Storage permissions are **not** invented.

## Messaging / Wave 4 contract and known limits

Current compose uses `nh7_admin_user_directory_v360`, `nh7_admin_message_templates_v416`, `nh7_admin_campaign_history_v416` and `nh7-admin-messaging-v360` source version4.1.9. Its Edge validates Auth user + `nh7_is_admin` before using server secrets. No Edge file changes. Single maps exactly one directory identity to `audience:'selected'`; a language Segment maps the current directory's known language subset to the same existing contract. Limit selected2000; missing identity/language is not guessed. English title/body remains required by the existing Edge even for FA/HR recipients.

The source's All Push uses role-not-admin tag filters; All Inbox reads **approved registrations capped5000**, not all Auth users. Selected Inbox uses each recorded recipient language; Push includes localized variants for the provider to select its language. Current app language may differ from recorded directory/provider language. No claim of proven live All audience equivalence, actual delivery, or preferred-language freshness. Source accepts recipient identities/languages from an Admin; authoritative directory resolution/anti-spoofing should be reviewed server-side in Wave4, preserving current endpoint compatibility. Do not send all variants as independent campaigns.

Required approved next contract: UID-resolved recipient identity + canonical preferred language, bounded/paged segments, explicit eligibility/Push vs Inbox audience policy, idempotent campaign execution and delivery receipts. An ambiguous send timeout is not proof of failure; verify campaign history before retry. No automatic retry or preview send is added.

Closed-app Admin events: registrations creation/status; prayer/reply; Q&A submission; testimony/blessing submission; assignments submitted/needs_revision. Current90s **visible** Admin refresh and foreground Notification are not event delivery. Wave4 needs server-authorized owner/delegate routing, event idempotency/dedupe, category permission checks, exact request ID + allowed route params, APNs/FCM/OneSignal account binding/permissions and real device closed-app evidence. No client polling workaround or provider credential is approved here.

AI: current `nh7-admin-ai-v490` supports status/translation/Q&A/sermon/assignment drafts. Wave3 composer accepts manually reviewed localized drafts; it never automatically calls an unsupported campaign-draft action. Approval for a typed `{kind:'campaign', translations, recipient_policy}` adapter and provider integration must precede wiring; no speculative endpoint or secret.

## Storage foundation

Manual GET `/storage/v1/bucket`; POST `/storage/v1/object/list/{bucket}` with current Admin JWT, prefix, offset, limit100 and sortBy. Existing Storage authorization applies; permission errors remain visible. Folder entries have no object ID. Listing does not sign, download, upload, move, replace or DELETE files. Search is current page only. No full-bucket scans or reference queries. An orphan/duplicate candidate is **not** permission to delete. Existing testimony/sermon cleanup remains separate and byte-identical.

A future destructive manager requires a server-authorized reference audit across all owners/current publications, immutable object identity/version, active-reference refusal, user-approved preview/confirmation, minimal delete scope, deletion receipt and post-delete verification. This is not implemented/deployed inWave3.

## Missing general contracts

- DOB viewing/editing after registration: v563/v564 photo is current authority; no proven general authenticated profile DOB-update contract. Do not revive old profile table/bucket. Review owner UID, supported source and update contract first; Birthday is read-only.
- Whole-database Admin search and exact aggregate request counts: reuse bounded existing feeds now; no full-table fetch to simulate search. Need permission-aware paged search/count API if product requires complete live coverage.
- Fresh cost-efficient cloud analytics: Wave1 bounded local/session/daily summaries and review contract retained. No high-frequency legacy tracking reactivation.
- Document Studio V2: Wave5 and isolated Draft240, with approved publish/update/file contracts; do not merge it inWave3.

Rollback is client-only: return the Wave3 presentation/adapter/wiring commits to their pre-Wave3 versions **on develop by a reviewed normal revert**, retaining Wave2 coordinator/outbox and all user data. No backend rollback or data cleanup is needed. Reverting the executable epoch must still fetch the intended reviewed executable assets; never clear stable data/media caches. Any future backend deployment has its own separately approved migration/deployment/rollback plan.
