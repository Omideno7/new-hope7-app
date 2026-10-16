# Wave 7 Watch source — unsigned QA only

This is a selective rebuild, not the historical native project or a Store candidate. Current public Web Bible data is authoritative. Watch audio is deliberately unavailable: the historical direct `sermons`/raw URL flow is incompatible with the current authenticated catalog. No Watch session/token/entitlement bridge or Production endpoint is invented.

For a later toolchain review, generate resources with `python3 scripts/build-watch-bible-wave7.py --output watchos/GeneratedBible`. The generator refuses unrelated output files, preserves exact current FA/EN/HR verse text and emits source hashes/license provenance. Generated resources and Xcode projects are ignored, not committed. `python3 scripts/verify-wave7-watch.py` verifies all 66 books / 1,189 chapters, YAML/plist and source invariants. It is not a Swift compiler.

On an approved macOS toolchain, XcodeGen can consume `watchos/project.yml` after resources exist. Compilation, framework/API validation, a matching QA iPhone companion target/embedding configuration, Info.plist validation, assets and pairing remain **BLOCKED_TOOLCHAIN** here. `CODE_SIGNING_ALLOWED=NO` and the isolated `com.omideno7.newhope7.qa.wave7` family are intentional. Do not replace Production IDs, import a historical wrapper, sign, install, upload or activate any capability during Wave 7.

The runtime decodes a <=32KiB catalog and at most one <=256KiB/200-verse chapter payload. It has no disk/network content cache, polling, credentials, account data or destructive actions. The immutable derived resource bundle is about 15.96MB; that is not a resident-memory measurement. Language preference is the only AppStorage value. Semantic SwiftUI controls use Dynamic Type; Persian uses RTL. Reading/error/retry/audio-unavailable/settings labels have FA/EN/HR copy.

All installed Watch/Ultra/pairing/Digital Crown/VoiceOver/text-size/battery/thermal/cellular/background behavior is **PHYSICAL_QA_ONLY** for Wave 8. No native build or physical success is claimed. See `docs/qa/WAVE7_WATCHOS_CONVERGENCE.md`.
