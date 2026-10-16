# Wave 7 watchOS convergence

2026-10-16, Europe/Zagreb. Historical source: `feature/watchos-v2500-20261004` @ `8a58086289aa1fa0d9d845f76b574a9422adc63d`. Current authoritative starting develop: `8bdb9a0cad807440b36bdca7c5a6f53562cc9e70`. No historical merge/cherry-pick/reset/rebase, new branch, native build, signing, installation, upload or endpoint activation.

| Historical file | Findings | Decision / exact current file |
| --- | --- | --- |
| `watchos/NewHope7Watch/NewHope7WatchApp.swift` | Three tabs and language preference are useful; incomplete localization and older runtime assumptions | SELECTIVE_REBUILD same path: semantic SwiftUI Bible / audio-unavailable / language settings, FA/EN/HR labels, Locale/RTL environment. Only persisted preference is `nh7WatchLanguage`. |
| `watchos/NewHope7Watch/Bible.swift` | Public generated Bible JSON is compatible in principle; old generated resources not tracked, raw errors/bounds insufficient | SELECTIVE_REBUILD same path: immutable current public text, safe book/chapter identifiers/ranges, file-size preflight and data cap, generic localized retry state, no network or private catalog. |
| `watchos/NewHope7Watch/Audio.swift` | Uses publishable-key direct REST sermons table read and raw `audio_url` playback through AVPlayer | REJECT_UNSAFE_OR_STALE historical implementation. Same current path contains **only** a localized unavailable message directing the user to the iPhone app, no launch bridge, AVPlayer, network or protected URLs. No Watch audio functionality claimed. |
| `watchos/NewHope7Watch/Info.plist` | Production companion identity / independent background assumptions not proven against current wrapper | SELECTIVE_REBUILD same path: isolated QA companion ID, not independent/not Watch-only, no background audio mode. Actual current companion embedding still requires owner/toolchain evidence. |
| `watchos/project.yml` | Old release ID/version/workflow signing assumptions are not current authority | SELECTIVE_REBUILD same path: unsigned watchOS10 Swift5 source target, isolated QA identifier, explicitly generated Bible resources. XcodeGen/Xcode validation pending. |

New supporting files: `scripts/build-watch-bible-wave7.py`, `scripts/verify-wave7-watch.py`, `watchos/README.md`, `watchos/.gitignore`. No resources, Xcode project, DerivedData, key, provisioning profile, native binary or generated archive is committed. No existing current Watch target was overwritten: develop had none.

## Content, privacy, bounds and source validation

The build-only generator reads the three current `data/bible/groups/bible_group_*.json` files. All **66 books, 1,189 chapters and FA/EN/HR text values** are checked against those exact inputs. Provenance retains their SHA-256, version and existing license notes. Existing Bible data bytes are unchanged. It neither queries Supabase nor downloads a catalog. Unknown files in an output directory cause a refusal, never a directory purge.

Derived immutable JSON bundle: **15,958,491 bytes**, maximum chapter **132,978 bytes**. The Watch loader permits a **32KiB catalog**, one **256KiB/200-verse chapter input**, validates duplicate IDs/verses, book ranges and nonempty trilingual text, and drops the active chapter on disappearance. These are source/input bounds, not a native RSS/decoded-memory guarantee. There is no persistent content cache, catalog duplication per account, personal data, delete action, session, token, Storage URL, API key, background task, polling/timer or network request. Only a small language preference persists.

`verify-wave7-watch.py` runs in Validate Develop. It rebuilds every resource in a temporary directory, compares every current verse/language, checks refusal of unknown output, parses YAML/plist, validates unsigned QA IDs and nine trilingual labels, inspects Swift source bounds and forbids direct network/player/credential/deletion paths. Semantic List/NavigationLink/Button/Picker/ScrollView and text styles preserve Dynamic Type and accessible names; root RTL supports Persian where watchOS renders it. Errors/retry and audio limitation have FA/EN/HR copy. No formal native accessibility certification.

## Exact blockers and intentional omissions

**BLOCKED_TOOLCHAIN:** Linux has no Swift compiler, Xcode, watchOS SDK or XcodeGen. Balanced-source checks and parsed configuration are not a Swift build. Framework/API/actor-isolation/compiler validity, generated project/Info.plist, app icons, matching iPhone QA companion target/embedding and pairing configuration require a supported Mac. No current authoritative tracked iPhone wrapper exists here; do not reconstruct it from Test5. `CODE_SIGNING_ALLOWED=NO` is deliberate, not a signed candidate.

**PHYSICAL_QA_ONLY:** Apple Watch Ultra/device installation, pairing, Digital Crown, VoiceOver/Dynamic Type/RTL, offline OS kill/reopen, app memory/battery/thermal pressure. Cellular/background/lock-screen/audio behavior is not implemented or accepted. Independent playback is expressly unavailable. App Store identity/signing/upload and licensing release review remain deferred, not silently approved.

A future Watch audio capability needs an approved current companion-auth/session/entitlement/streaming design with token/account fencing and real acceptance. It must not restore the anonymous direct table flow, embed privileged credentials, add a Production endpoint for convenience or weaken Web authorization. Nothing is activated by this source package.
