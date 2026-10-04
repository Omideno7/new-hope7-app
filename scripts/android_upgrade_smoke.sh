#!/bin/sh
set -eu

PACKAGE=""
BASE_PACKAGE="com.omideno7.newhope7"
MAIN_ACTIVITY="com.omideno7.newhope7.MainActivity"
BASELINE_APK="New_Hope_7_QA_BASELINE_24001.apk"
CANDIDATE_APK="New_Hope_7_QA_CANDIDATE.apk"
SENTINEL="files/nh7_upgrade_preserve.txt"

detect_package() {
  packages="$(adb shell pm list packages 2>/dev/null | tr -d '\r' | sed -n 's/^package:\(com\.omideno7\.newhope7[^[:space:]]*\)$/\1/p')"
  count="$(printf '%s\n' "$packages" | sed '/^$/d' | wc -l | tr -d ' ')"
  if [ "$count" -ne 1 ]; then
    echo "Expected exactly one New Hope 7 QA package after install; found $count" >&2
    printf '%s\n' "$packages" >&2
    exit 1
  fi
  PACKAGE="$(printf '%s\n' "$packages" | sed '/^$/d' | head -n 1)"
  echo "Detected installed QA package: $PACKAGE"
}

launch_app() {
  component="$(adb shell "cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.LAUNCHER '$PACKAGE'" 2>/dev/null | tr -d '\r' | tail -n 1 || true)"
  case "$component" in
    */*)
      adb shell "am start -W -n '$component'" >/tmp/nh7-am-start.txt
      ;;
    *)
      echo "Launcher intent was not resolved; starting Capacitor MainActivity explicitly."
      adb shell "am start -W -n '$PACKAGE/$MAIN_ACTIVITY'" >/tmp/nh7-am-start.txt
      ;;
  esac
  cat /tmp/nh7-am-start.txt
}

wait_for_pid() {
  attempts=0
  while [ "$attempts" -lt 20 ]; do
    pid="$(adb shell "pidof '$PACKAGE'" 2>/dev/null | tr -d '\r' | tr -d '\n' || true)"
    if [ -n "$pid" ]; then
      printf '%s\n' "$pid"
      return 0
    fi
    attempts=$((attempts + 1))
    sleep 1
  done
  echo "App process did not start for $PACKAGE" >&2
  adb shell "dumpsys package '$PACKAGE' | head -n 80" || true
  return 1
}

echo "Installing baseline QA APK..."
adb install "$BASELINE_APK"
detect_package
launch_app
BASELINE_PID="$(wait_for_pid)"
test -n "$BASELINE_PID"
sleep 2

echo "Writing update-preservation sentinel..."
adb shell "run-as '$PACKAGE' sh -c 'mkdir -p files && printf nh7-preserve > $SENTINEL'"
adb shell "run-as '$PACKAGE' cat '$SENTINEL'" | grep -q nh7-preserve

echo "Updating baseline in place with candidate APK..."
adb install -r "$CANDIDATE_APK"
adb shell "run-as '$PACKAGE' cat '$SENTINEL'" | grep -q nh7-preserve
echo "Sandbox sentinel survived update-in-place."

echo "Launching candidate online..."
adb shell "am force-stop '$PACKAGE'"
launch_app
PID="$(wait_for_pid)"
test -n "$PID"
sleep 4
adb exec-out screencap -p > android-next-smoke.png
adb logcat -d > android-next-logcat.txt
if grep -E "FATAL EXCEPTION|ANR in $PACKAGE|Process: $PACKAGE.*has died" android-next-logcat.txt; then
  echo "Fatal Android runtime issue detected"
  exit 1
fi

echo "Launching candidate offline..."
adb shell svc wifi disable
adb shell svc data disable || true
adb shell "am force-stop '$PACKAGE'"
launch_app
PID2="$(wait_for_pid)"
test -n "$PID2"
sleep 4
adb exec-out screencap -p > android-next-offline.png

echo "Android update-in-place/data-preservation smoke: PASS"
