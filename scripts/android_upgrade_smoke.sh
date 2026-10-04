#!/bin/sh
set -eu

PACKAGE="com.omideno7.newhope7.qa"
BASELINE_APK="New_Hope_7_QA_BASELINE_24001.apk"
CANDIDATE_APK="New_Hope_7_QA_CANDIDATE.apk"
SENTINEL="files/nh7_upgrade_preserve.txt"

launch_app() {
  component="$(adb shell cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.LAUNCHER "$PACKAGE" 2>/dev/null | tr -d '\r' | tail -n 1)"
  case "$component" in
    */*) adb shell am start -W -n "$component" >/tmp/nh7-am-start.txt ;;
    *)
      echo "Could not resolve launcher activity for $PACKAGE"
      adb shell cmd package resolve-activity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER "$PACKAGE" || true
      exit 1
      ;;
  esac
}

echo "Installing baseline QA APK..."
adb install "$BASELINE_APK"
launch_app
sleep 6

echo "Writing update-preservation sentinel..."
adb shell run-as "$PACKAGE" sh -c "mkdir -p files && printf nh7-preserve > $SENTINEL"
adb shell run-as "$PACKAGE" cat "$SENTINEL" | grep -q nh7-preserve

echo "Updating baseline in place with candidate APK..."
adb install -r "$CANDIDATE_APK"
adb shell run-as "$PACKAGE" cat "$SENTINEL" | grep -q nh7-preserve
echo "Sandbox sentinel survived update-in-place."

echo "Launching candidate online..."
adb shell am force-stop "$PACKAGE"
launch_app
sleep 12
PID="$(adb shell pidof "$PACKAGE" | tr -d '\r')"
test -n "$PID"
adb exec-out screencap -p > android-next-smoke.png
adb logcat -d > android-next-logcat.txt
if grep -E "FATAL EXCEPTION|ANR in $PACKAGE|Process: $PACKAGE.*has died" android-next-logcat.txt; then
  echo "Fatal Android runtime issue detected"
  exit 1
fi

echo "Launching candidate offline..."
adb shell svc wifi disable
adb shell svc data disable || true
adb shell am force-stop "$PACKAGE"
launch_app
sleep 8
PID2="$(adb shell pidof "$PACKAGE" | tr -d '\r')"
test -n "$PID2"
adb exec-out screencap -p > android-next-offline.png

echo "Android update-in-place/data-preservation smoke: PASS"
