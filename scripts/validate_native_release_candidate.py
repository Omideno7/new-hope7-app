#!/usr/bin/env python3
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

def read(path):
    p = ROOT / path
    if not p.exists():
        errors.append(f"missing required release file: {path}")
        return ""
    return p.read_text(encoding="utf-8")

def require(path, needle, label=None):
    data = read(path)
    if needle not in data:
        errors.append(f"{path}: missing {label or needle}")

def forbid(path, needle, label=None):
    data = read(path)
    if needle in data:
        errors.append(f"{path}: forbidden {label or needle}")

index = read("index.html")

required_index = [
    'js/nh7-push-account-bind-v364.js?v=3.6.4-native',
    'js/nh7-audio-classic-v484.js?v=4.8.6-qa250',
    'js/nh7-audio-miniplayer-v487.js?v=4.8.7',
    'js/nh7-audio-library-v500.js?v=5.3.5-cover-sync',
    'js/nh7-media-player-v500.js?v=5.3.5-cover-sync',
    'js/nh7-appearance-personalization-v514.js?v=5.2.1-i18n-finalqa',
    'css/nh7-theme-gallery-v457.css?v=4.7.3-dark-verse',
    'js/nh7-reader-toolbar-v452.js?v=4.5.3-unified',
    'js/nh7-settings-controller-v403.js?v=4.6.4',
    'js/nh7-sermon-social-v443.js?v=4.4.8-batch',
    'js/nh7-inbox-badge-sync-v418.js?v=4.1.10-snapshot',
    'js/nh7-school-path-v351.js?v=4.6.7-io',
    'js/nh7-my-notes-v234.js?v=4.5.2-reader',
]
for needle in required_index:
    if needle not in index:
        errors.append(f"index.html: missing release runtime {needle}")

if not re.search(r'<script[^>]+src=["\']js/app\.js\?v=[^"\']+["\'][^>]*type=["\']module["\']', index):
    errors.append("index.html: missing release runtime js/app.js module")

if 'js/nh7-push-account-bind-v362.js?v=3.6.2' in index:
    errors.append("index.html: stale native push binding v362 is still active")

require("js/nh7-push-account-bind-v364.js", "confirmNativeExternalId")
require("js/nh7-push-account-bind-v364.js", "nativePushSubscription")
require("js/nh7-push-account-bind-v364.js", "isNativeRuntime")
require("js/nh7-push-account-bind-v364.js", "externalId:confirmedExternalId")

# Store identity must remain the same so this installs as an update.
for wf in (
    ".github/workflows/next-native-android-store.yml",
    ".github/workflows/next-native-ios-store.yml",
):
    require(wf, "com.omideno7.newhope7", "production application identifier")

android = read(".github/workflows/next-native-android-store.yml")
ios = read(".github/workflows/next-native-ios-store.yml")

for needle in (
    "targetSdkVersion = 36",
    "compileSdkVersion = 36",
    "minSdkVersion = 24",
    "minifyEnabled true",
    "shrinkResources true",
    "onesignal-cordova-plugin",
    "@capacitor/android",
    "public",
):
    if needle not in android:
        errors.append(f"Android workflow: missing {needle}")

for needle in (
    "UIBackgroundModes",
    "remote-notification",
    "audio",
    "aps-environment",
    "onesignal-cordova-plugin",
    "@capacitor/ios",
    "public",
):
    if needle not in ios:
        errors.append(f"iOS workflow: missing {needle}")

def default_number(text, key):
    m = re.search(rf"{re.escape(key)}:\s*\n(?:.*\n){{0,6}}?\s*default:\s*['\"]?(\d+)['\"]?", text)
    return int(m.group(1)) if m else None

android_code = default_number(android, "version_code")
ios_build = default_number(ios, "build_number")
if android_code is None or android_code <= 24001:
    errors.append(f"Android default versionCode must be > 24001, got {android_code}")
if ios_build is None or ios_build <= 24003:
    errors.append(f"iOS default build number must be > 24003, got {ios_build}")

if "version_name:" not in android or "default: '2.5.0'" not in android:
    errors.append("Android workflow must expose version_name input with 2.5.0 candidate default")
if "version_name:" not in ios or "default: '2.5.0'" not in ios:
    errors.append("iOS workflow must expose version_name input with 2.5.0 candidate default")

# Native packaging must explicitly disable Web SW / Web OneSignal ownership in WebView.
for text, name in ((android, "Android"), (ios, "iOS")):
    if "!window.Capacitor?.isNativePlatform?.()" not in text:
        errors.append(f"{name} workflow: missing native service-worker isolation")
    if "Web OneSignal SDK disabled" not in text:
        errors.append(f"{name} workflow: missing native OneSignal isolation")

if errors:
    print("New Hope 7 native release candidate guard: FAILED")
    for item in errors:
        print(" -", item)
    sys.exit(1)

print("New Hope 7 native release candidate guard: PASS")
