# New Hope 7 iOS Wrapper — Phase Status

- Baseline: Stable Web 2.3.9
- Bundle ID: `com.omideno7.newhope7`
- Branch: `agent/ios-capacitor-239`
- Production web/main files modified: **No**
- Phase 1: Capacitor native-safe bundle — ✅ verified
- Phase 2: Xcode Simulator + unsigned physical-device Release build — ✅ verified
- Phase 3: New Hope 7 App Icon + branded Launch Screen — ✅ verified
- Phase 4: Push capability + Background Audio + OneSignal Notification Service Extension — ✅ verified
- Phase 5: Privacy Manifest + native packaging checks — ✅ verified
- Full verification: GitHub Actions Run #47 on macOS 26 / Xcode 26 — ✅ success
- Phase 6: Apple signing, APNs account connection and signed TestFlight archive — ⏳ requires Apple Developer/App Store Connect account access

## Safety boundary
The iOS work remains isolated in the draft branch/PR. Do not merge into `main` until signed iPhone/iPad and TestFlight tests are complete.
