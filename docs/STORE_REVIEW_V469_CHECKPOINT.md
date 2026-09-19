# Store reviews v469 — next stage, not yet released

Starting point: main `2bde658268eeaed0e7873c83aa7fb54c1d37fc8f`, verified live in read-only audit run `35454867437`. All phone-approved existing features were already integrated; main has not been changed by starting this stage.

Branch: `feature/store-review-v469-preview-20260919`.
Initial module: `js/nh7-store-review-v469.js`, first added in `02aa56b2c1da018bcca27762bccf04b2e07347a5`.
Status: initial isolated implementation only. No claim of completed native integration, phone QA, store delivery or main wiring.

## Proposed user experience

A permanent, optional 'Review the app' entry in settings/More, with Persian, English and Croatian text. User-initiated store links go to the already configured App Store ID 6803187205 or Google Play package com.omideno7.newhope7. The Apple URL uses action=write-review. Unknown/desktop platforms display both choices rather than guessing that the app was installed from one store. No stars are collected locally and no positive-rating pre-screen is used. No reward, point, lesson unlock or School permission is conditional on a review. Opening the store is never reported as a completed review.

A future automatic native request must use a verified native StoreKit/Play review bridge, respect eligibility and app state, and not interrupt writing, exams, audio, sign-in or Birthday dialogs. No native bridge has been assumed available. The repository root and ios-wrapper package.json reads returned 404 on this main, so native build sources need explicit verification before adding a native dependency.

## Primary guidance consulted on 19 September 2026

Apple, Requesting App Store reviews:
https://developer.apple.com/documentation/storekit/requesting-app-store-reviews
Apple permits a persistent user-initiated product link with action=write-review and distinguishes it from quota-controlled automatic review requests.

Apple, App Review Guidelines 5.6.1:
https://developer.apple.com/app-store/review/guidelines/
Use the supplied native API for review prompts, not a custom rating prompt.

Google, Play In-App Reviews:
https://developer.android.com/guide/playcore/in-app-review
For an explicit review button, direct to the Play Store rather than relying on a quota-limited API that may not show. Do not pre-screen user opinion or alter the native rating card.

These sources guide this next stage, not changes to School or growth-point behavior.

## Still to do before release

Preview layout with the existing 14-theme variables; three-language/browser accessibility and storage-isolation tests; verify manual store navigation on actual iPhone/Android wrappers; review the native bridge separately for automatic prompts; user phone approval; then runtime-only main integration with a cache upgrade and the current draft fix retained. No Preview/test data, unapproved School redesign or Chat is to be included.
