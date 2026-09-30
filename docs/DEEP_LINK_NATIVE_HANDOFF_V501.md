# New Hope 7 Deep Link Native Handoff — v5.0.1

This repository contains the web application only. The native iOS / Android wrapper projects and signing material are not stored here.

## Stable public share URLs

- Sermon: `https://omideno7.github.io/new-hope7-app/link.html?type=sermon&id=<UUID>`
- Bible verse: `https://omideno7.github.io/new-hope7-app/link.html?type=verse&book=GEN&chapter=1&verse=1`

These URLs must remain stable.

## Native URL scheme

Register the scheme `newhope7` in both wrappers.

Supported targets:

- `newhope7://sermon/<UUID>`
- `newhope7://bible/<BOOK>/<CHAPTER>/<VERSE>`

When the native wrapper receives one of these URLs, open the normal user app web entry with equivalent query parameters:

- Sermon → `index.html?type=sermon&id=<UUID>`
- Verse → `index.html?type=verse&book=<BOOK>&chapter=<CHAPTER>&verse=<VERSE>`

The web runtime `js/nh7-deep-links-v501.js` resolves those query parameters to the exact Audio sermon card or Bible chapter/verse.

## Android

Package: `com.omideno7.newhope7`

Add an intent filter for scheme `newhope7`. The hosted landing page uses a Chrome Android `intent://` URL with a Google Play fallback.

## iOS

Register `newhope7` under URL Types / `CFBundleURLTypes`. The landing page attempts the scheme and redirects to App Store id `6803187205` if the app does not open.

## Optional future Universal / App Links

A seamless HTTPS Universal/App Link can be added later, but both Apple AASA and Android `assetlinks.json` must be served from the origin root:

`https://omideno7.github.io/.well-known/...`

The current project site is under `/new-hope7-app/`, so root-domain publishing or a custom domain is required. Do not add placeholder association files with unknown Team ID / signing certificate fingerprints.

## Safety

No native wrapper or Production store build is changed by this branch.
