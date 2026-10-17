# Wave 8 Physical QA Fix Master Specification

Date: 2026-10-17 (Europe/Zagreb)

Accepted starting `develop` head before this specification: `bf264f86540a3033c7efdf86da642f0dfac5c5eb`.

## Non-negotiable workflow

- Work **directly on `develop` only**. Do not create any branch or PR.
- Before every implementation session: fetch, print repository/current branch/current SHA/upstream/target and reconcile any concurrent `develop` work.
- `main` is Release/Production only and must remain untouched until final physical + automated acceptance and explicit owner approval.
- No deploy, Store upload, signed Production release, Production Supabase migration/data mutation, provider activation, security activation, document issuance activation, real document issue, user-data deletion, reset, backfill or destructive cleanup.
- Do not weaken RLS/Auth/security. Do not hardcode privileged users, meeting secrets or access decisions in public client source.
- Preserve existing data, account isolation, School progress, Notes, Plans, Library, issued legacy records and offline data.
- New/changed behavior must keep FA/EN/HR, RTL/LTR, accessibility, responsive phone/tablet/Fold/Web behavior and offline/lifecycle safety.
- Avoid new recurring backend reads/writes/storage. Existing Wave7.5 audio analytics decision remains zero-incremental-cost / rejected.
- Automated success never equals physical acceptance. Final physical QA is required after all fix batches.

## Delivery strategy

Implement in four sequential batches on the same continuously advancing `develop` branch. Each batch must pass scoped regression + full required Validate Develop gates before the next batch starts.

### Batch 1 — Critical/Core Stability

1. Login hang/freeze after successful sign-in.
2. Soul Winning (`نجات جان‌ها`) load failure on iPhone/iPad and app-wide freeze after the error.
3. Admin Workspace needs an explicit Return to App action without logout/force-close.
4. Admin Documents: visible `New Hope 7 Document Studio V2` entry currently taps with no result; it must open the V2 Studio/QA surface while real Production issuance remains disabled.
5. Consolidate duplicate `My Profile` vs `Account`: Account becomes the sole profile authority; remove duplicate My Profile entry only after preserving every unique capability.
6. Unify profile photo to one canonical account-owned source. Existing photo must restore after login/relaunch/account switch as appropriate and must not be lost during consolidation. All surfaces use the same canonical photo.
7. Bible Study Plans need contextual Back navigation on iPhone/iPad, preserving correct flow/state.
8. Password visibility eye icon must stay inside the password field across RTL/LTR, iPhone/iPad, portrait/landscape and Dynamic Type.
9. General route/focus/scroll safety needed for these fixes: new destination opens at logical top/target; browser/app Back restores prior position where appropriate; no overlay/modal may leave the app blocked.

### Batch 2 — iPad/Responsive Navigation and Media UX

10. Remove excessive native/header/bottom-nav vertical space without breaking real safe areas, notch/home-indicator, keyboard or split view.
11. iPad Bible becomes true master/detail: Books → Chapters → Verses. Never duplicate Books+Books or Chapters+Chapters across panes; Back must not overlap headings.
12. iPad Daily becomes split-view/master-detail: daily categories in navigation pane, selected content in detail pane. Phone remains appropriate stacked flow.
13. iPad Audio/Messages becomes master/detail: Categories → items → player/detail. Preserve phone behavior.
14. Quick Bible from audio must open below/beside the player rather than covering player controls; playback remains controllable.
15. Opening Notes/tools must scroll/focus to the opened section. Next book/chapter starts at logical beginning; Back restores prior reading position where expected.
16. Home/Hero responsive redesign: eliminate dead iPad space; avoid duplicate avatar presentation; provide useful Today/next-event/continue content without bloating phone UI.
17. Remove redundant `FA · EN · HR` badge from Plans hero; header language selector remains canonical.

### Batch 3 — Account, Content, Inbox, Calendar and Church Connect

18. My Documents becomes a clear Account/Profile destination beside Student ID / access information, not beside logout/delete. Preserve secure UID ownership and existing legacy School certificates. Preview/download/print/share/verification UI only where authorized; do not activate real V2 issuance.
19. Unified Notes edit capability across Bible/personal/audio/plans/all note surfaces: Edit/Save/Cancel; Delete separate and confirmed; failed save must not lose current text.
20. Q&A: authenticated user can delete their own submitted question; it must disappear from all user-facing surfaces and associated public answer must not remain orphaned. Preserve minimal audit only if required; no normal-user recoverability.
21. Inbox redesign as a professional notification center: unread/read distinction, clean message detail, safe read/archive behavior, deep destination support, account isolation, FA/EN/HR.
22. App-icon unread badge: iOS/iPadOS numeric badge and Android badge/dot where supported; push tap should deep-open the intended message/destination; physical provider delivery remains a separately controlled test/activation.
23. Christian Calendar richer educational event detail: short history/origin, biblical connection, relevant verses, meaning/application; visible day marker and Today/Home highlight. Notification reminder only through existing/approved notification controls.
24. Promote `My Church on YouVersion` out of About into a visible Home CTA plus logical secondary Church Connect entry. Deep/universal link if available; otherwise web fallback; show short join instruction. Destination URL must be admin-managed, not hardcoded as a release requirement.
25. Dynamic Church Connect hub with progressive navigation: Meetings / Groups & Channels / Media. Meetings may include FreeConferenceCall, Zoom, Google Meet; groups/channels may include WhatsApp, Telegram; media may include YouTube, Instagram, LinkedIn and future providers.
26. Admin-managed Church Connect content: titles FA/EN/HR, category/platform, URL, meeting ID/passcode/instructions, schedule, sort order, active state, optional start/end dates and audience. Private meeting credentials must be server-authorized for registered/approved users and must not be exposed in public static source.

### Batch 4 — Settings, Offline/Storage, Notifications, Themes and Motion

27. Settings → App Status becomes a useful dashboard: connectivity, notification state, offline readiness, version/build and app-managed storage usage where platform APIs permit reliable measurement.
28. Storage management must clearly separate cache/download/audio/offline data where measurable. Clearing must never delete Notes, account identity, School progress, reading progress or other protected user data.
29. Offline/download actions must report concrete result: success/failure, item count and bytes freed/prepared where measurable.
30. `Sync now` and `Refresh app data` must be audited. If redundant, consolidate; if distinct, rename/explain and show post-action result.
31. Notification preferences become progressive: master enable plus expandable per-category preferences (Daily Word, Confession, Daily Life/Water, meetings, School, Inbox, Christian calendar, etc.). Essential account/security notices must not be accidentally treated as optional marketing/daily content.
32. Dark Mode accessibility audit: Bible verses and all text/cards/buttons/placeholders/dialogs/player/disabled states must retain readable contrast.
33. UI style presets must become meaningfully distinct (e.g. Soft 3D, Flow, Minimal, Glass/Layered) with coherent transitions, not superficial naming differences.
34. Motion/transition system must remain performant, respect `prefers-reduced-motion` / platform Reduce Motion, and avoid battery-heavy perpetual effects.
35. Theme Library presets must be visually distinct across background/cards/buttons/text/accent/navigation/shadows.
36. Theme customization controls must actually apply and persist supported background/card/button/text/accent choices with immediate preview; prefer local-first persistence unless cross-device sync is already justified and bounded.

## Cross-cutting acceptance requirements

- No feature/fix branch, PR or `main` change.
- No new Production backend mutation or provider activation.
- No user-visible data loss.
- No duplicate profile/photo authorities after Batch 1.
- No route that requires force-closing the app to recover.
- No stale overlay, modal, pending promise or error state may lock the global shell.
- Tablet master/detail layouts must not regress phone layouts.
- Native safe-area fixes must be based on actual inset ownership, not arbitrary hardcoded shrinkage.
- Private meeting/document/admin data remains server-authorized.
- Existing automated Wave1–8 safeguards remain enabled; do not weaken tests to obtain green CI.
- Add regression tests for each confirmed physical defect where automation can model it.
- Report exact starting SHA, implementation commits, final `develop` SHA and exact-head CI run.
- Do not claim physical pass after code changes. Rebuild/install from the exact final `develop` candidate and perform final physical QA on real devices.

## Final convergence / release gate

After all four batches:

1. Full automated/integration/security/performance/offline/upgrade regression on the exact final `develop` SHA.
2. Build QA artifacts from that exact `develop` payload and perform final real iPhone/iPad plus required Android/Web physical acceptance.
3. Fix any final regressions on `develop` and repeat affected/full gates.
4. Freeze the exact accepted `develop` SHA.
5. Only after explicit owner approval, integrate the exact reviewed state `develop → main` without unrelated rewrites.
6. Production Web/iOS/Android release artifacts must use the same exact approved canonical `main` shared payload SHA. Backend/provider/document/security activation steps remain separate explicit approval gates.
