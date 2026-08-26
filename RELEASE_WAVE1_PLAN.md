# New Hope 7 — Cautious Content Integration Wave 1

**Branch:** `release/content-wave1-apocrypha-plans`  
**Created from:** latest validated `main` after app `2.3.9.48`  
**Production rule:** no content change enters `main` until the isolated branch passes validation and user QA.

## Objective

Add only the already reviewed content packages to the current production app without replacing the production shell or deleting existing features.

## Wave 1 scope

### A. Apocrypha

- 19-book canonical English runtime.
- Fresh in-house Persian and Croatian translations prepared from the English reference text.
- Continuous Bible-style verse layout.
- Book/chapter navigation.
- Text size controls.
- Per-verse highlight, saved verse, private note, copy/share.
- Direct navigation from a saved Apocrypha verse to the exact book, chapter and verse.
- No legacy Persian PDF/source fallback.

### B. Spiritual plans

- 30 days of prayer in the Spirit and tongues.
- Life in Grace.
- Fasting and Prayer.
- Obedience and Blessing.
- Salvation and New Life in Christ.
- Change Your Thinking / Mind Renewal.

The plan catalog and every localized day must be audited before promotion. The Mind Renewal duration must be reconciled with the user's final 30-day requirement rather than silently shipping an older 14-day copy.

## Explicitly excluded from Wave 1

- Admin redesign.
- School registration/gate changes.
- Account deletion changes.
- Video access UI changes.
- Library/ministers access changes.
- Store packaging.

These remain separate waves so an issue in one module cannot destabilize unrelated production functions.

## Merge method

1. Begin from the latest `main`; never replace `main` with an old RC branch.
2. Copy only approved content data, styles and isolated bridge modules.
3. Keep the current production `app.js`, authentication, School exam, signed audio, offline storage and Settings controller.
4. Remove only explicitly obsolete Apocrypha/plan scripts after the replacement is proven.
5. Compare the release branch against `main` and reject unexplained deletions.
6. Validate syntax, content coverage, script order, authentication, School exam, audio/offline and Settings.
7. Test the branch on the main church domain using the same account/session environment.
8. Fast-forward or merge to `main` only after user approval.

## Required QA before promotion

- All 19 Apocrypha books open in FA/EN/HR.
- Spot-check first, middle and last chapters, including 4 Maccabees.
- Continuous verse layout and every verse action work.
- Saved verse opens the exact verse immediately.
- Every plan appears in all three languages and every day opens.
- Current production audio, School exam, Settings, login/recovery and offline downloads remain unchanged.
- GitHub validation and deployment dry-run are green.
