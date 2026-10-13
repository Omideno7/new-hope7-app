# Wave 3 focused audit / implementation decisions

Pre-change source `177d196f8fdb2b641156b0e7b28d03e8bd98b7cc`; master audit committed first at `351fb25af7ab44d1ce0bc6e1f3b11f95e2996ecc`. Runtime decisions below close its Wave3 defects only.

## Birthday path

Actual v353 canonical handler requires `birthDate`, embeds it in signup `data.school_registration`, and stores the returned Auth session in `nh7_user_session_v170`. The old celebration reader considered only top-level fields and flattened school/profile caches; signup therefore depended on accidental later flattening. Read nested current Auth metadata first, then current direct metadata, then cache rows with a matching UID/email and no contradictory identity. Dates remain strict Gregorian `YYYY-MM-DD`, real date, >=1900, not future; compare month/day in **device-local calendar**, not UTC/server time. No display with missing token, UID or explicit logout.

Keep cake, Christian blessing, Jeremiah29:11, three rockets/54 sparks/26 confetti, reduced-motion behavior, seen keys and approved CSS unchanged. Owner/session events fence open modal synchronously; day/render does not repeat. Gate, real registration success modal, other aria-modal/open dialogs and focused inputs defer celebration without marking seen. Calendar focus trap now permits its own event buttons and does not misapply feast translation to the open calendar.

DOB edit after registration remains a documented gap: no proven current general profile update contract; no data write invented. Backend/schema/user DOB values unchanged.

## Admin source and consolidation boundary

Stable loader `admin-v239-stable.html` fetches classic `admin.html`, patches UI renderer, injects current helpers, de-duplicates script paths, and reinserts v350 late. `admin.html` remains useful core; versioned redirects/test shells remain. New shared `nh7-admin-workspace-wave3.js` is loaded by app/current Admin, uses current tool metadata/callbacks and organizes 11 groups without deleting capabilities. Existing testimony Storage moderation is retained under Requests, separate from the new read-only Storage foundation; the composer belongs to Messaging. Unknown existing tools fall under Administration. Existing Documents v520 remains reachable; V2 is Wave5/Draft240.

Authority stays `nh7_admin_my_access_v350()` over `auth.uid()`/private grants. App entry is server-proven and passes no credential in URL; explicit workspace launch reuses current same-origin session only as a credential and **rechecks role before data load**. Same-UID shared-session refresh is single-flight; a denied Workspace or panel-only logout cannot revoke the normal app session. Explicit separate Admin sign-in returns to the existing isolated login path. Owner gets grouped tools; delegated registration-only surface remains intact; normal/anonymous do not load Admin rows. Pending role/auth-refresh/reads and the independently loaded v451 keepalive are generation/token fenced; owner classic two-phase data loading checks generation before applying results. Logout/account switch clears transient Admin views/exposed helper caches and new composer/Storage results, not user data. Existing refresh90s skips hidden state; two existing prayer/testimony count readers now also park while hidden. Automatic AI-provider status probes use an owner/token-bound 120s in-memory snapshot, while explicit AI actions retain their existing live server checks. No new polling. The active v491 is refined; historical v490 remains byte-identical.

Requests summarize loaded registration/Q&A/assignments and available prayer/testimony/blessing counts; unavailable counts display dash, not fake zero. Relevant original panels/filters are reachable. Search scans authorized **already-loaded** rows, max50 results, no new large reads; supported student/sermon callbacks open their current details. It is not advertised as whole-database search.

Composer retains FA/EN/HR drafts across targets/language, explicit All/language Segment/Single maps existing endpoint, strict known recipient identity/language, immutable preview plus checkbox/native confirmation. Changes invalidate preview; one execution in flight; close/logout/old responses fenced; timeout has actionable history warning and no automatic retry. Legacy manual Broadcast/Inbox compose buttons enter the same preview boundary; automatic document/approval/reply paths remain unchanged. No AI call invented; manual reviewed draft boundary documented.

Storage is manual authorized bucket + paged100 object listing, current-page name search, sort/date/size/MIME/folder navigation, explicit permission/loading/empty errors. No destructive actions, signed-file calls or bulk rescans. Existing testimony/sermon cleanup files untouched.

## Validation boundary

All remote browser traffic is intercepted with `.invalid` identities and local fixtures; successful send means one intercepted request, **not a Production campaign**. Exact current-source registration handler, birthday module, real stable Admin loader/runtime, delayed RBAC responses and actual app entry are exercised. Full CI and raw before/after counters are in the final report. Native device, actual preferred-language delivery and live Storage policy availability remain acceptance gates. No user-visible debug switch is introduced.
