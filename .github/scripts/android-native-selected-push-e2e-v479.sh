#!/usr/bin/env bash
set -euo pipefail

APK='NH7_Android_Native_Push_E2E_v479.apk'
PACKAGE='com.omideno7.newhope7'
ENDPOINT='https://gpzcwffxnddhaeaogdyo.supabase.co/functions/v1/nh7-os-e2e-android-v478'

capture() {
  adb logcat -d > e2e-logcat.txt 2>/dev/null || true
  adb shell dumpsys notification > e2e-notifications.txt 2>/dev/null || true
  adb shell dumpsys package "$PACKAGE" > e2e-package.txt 2>/dev/null || true
}
trap capture EXIT

adb install -r "$APK"
adb shell am force-stop "$PACKAGE"
adb logcat -c
adb shell monkey -p "$PACKAGE" -c android.intent.category.LAUNCHER 1
sleep 20
adb shell input tap 500 900 || true
sleep 5

echo 'Waiting for OneSignal AndroidPush subscription...'
FOUND=0
for i in $(seq 1 18); do
  BODY=$(curl -fsS "$ENDPOINT" || true)
  printf '%s\n' "$BODY" | tee e2e-onesignal-user.json
  if printf '%s' "$BODY" | grep -q '"type":"AndroidPush"'; then
    FOUND=1
    echo 'ANDROID_PUSH_SUBSCRIPTION_FOUND'
    break
  fi
  sleep 5
done

if [ "$FOUND" != "1" ]; then
  echo 'AndroidPush subscription was not created' >&2
  exit 10
fi

SEND=$(curl -fsS -X POST "$ENDPOINT")
printf '%s\n' "$SEND" | tee e2e-send-result.json
printf '%s' "$SEND" | grep -Eq '"id":"[^"]+"'
sleep 20

capture
if ! grep -Eiq 'NH7 E2E|Selected Push E2E v478' e2e-notifications.txt e2e-logcat.txt; then
  echo 'Push was sent but no matching Android notification evidence was found' >&2
  exit 11
fi

echo 'NATIVE_SELECTED_PUSH_E2E_OK'
