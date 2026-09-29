# New Hope 7 — Decisions

- Production v2.4.0 remains untouched during next-release development.
- Next release is integrated on `release/next-v250-preview`.
- Media Player 2.0 requires visual mockups/design approval before coding.
- Profile management belongs under Account, not Settings.
- Logged-in user photo appears as a small circular Home-header avatar; logout removes personal photo.
- Reader Mode is global across readable app content.
- Typography is global; add clearly differentiated Persian/Latin fonts, weight and size controls; remove Old/New labels.
- Settings 2.0 uses organized categories.
- Download statistics bug showing zero must be fixed; Download Manager shows count and storage used.
- Existing Production data may be read by preview when safe; Production writes/migrations are not allowed without explicit approval.
- AI Bible audio model: generate approved chapter audio once, compress/store/cache, then serve the same file to users; copyright and cost checks precede bulk generation.
- Video module deferred.
- App icon completed; no further icon change.
- Admin Q&A AI and tri-language translation completed; regression QA only.
