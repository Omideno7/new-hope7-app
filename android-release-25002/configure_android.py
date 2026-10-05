from pathlib import Path
import re
import xml.etree.ElementTree as ET

root = Path('native-release/android')
gradle = root / 'app/build.gradle'
text = gradle.read_text()
text = re.sub(r'versionCode\s*(?:=\s*)?\d+', 'versionCode 25002', text)
text = re.sub(r'versionName\s*(?:=\s*)?[\"\'][^\"\']+[\"\']', 'versionName "2.5.0"', text)
text = text.replace('minifyEnabled false', 'minifyEnabled true\n            shrinkResources true')
text = text.replace('buildTypes {', 'buildTypes {\n        debug {\n            applicationIdSuffix ".qa"\n            versionNameSuffix "-qa"\n        }', 1)
gradle.write_text(text)
variables = root / 'variables.gradle'
text = variables.read_text()
for key, value in [('minSdkVersion', 24), ('compileSdkVersion', 36), ('targetSdkVersion', 36)]:
    text = re.sub(rf'{key}\s*=\s*\d+', f'{key} = {value}', text)
variables.write_text(text)
manifest = root / 'app/src/main/AndroidManifest.xml'
text = manifest.read_text()
for permission in ['POST_NOTIFICATIONS', 'RECORD_AUDIO']:
    full = 'android.permission.' + permission
    if full not in text:
        match = re.search(r'<manifest\b[^>]*>', text, re.S)
        assert match
        text = text[:match.end()] + f'\n    <uses-permission android:name="{full}" />' + text[match.end():]
if 'usesCleartextTraffic' not in text:
    text = text.replace('<application', '<application android:usesCleartextTraffic="false"', 1)
manifest.write_text(text)
ET.parse(manifest)
activity = root / 'app/src/main/java/com/omideno7/newhope7/MainActivity.java'
activity.write_text('''package com.omideno7.newhope7;

import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Invalidate only HTTP/compiled resource caches after a native update.
        // WebStorage, localStorage, IndexedDB, files and download stores persist.
        try {
            PackageInfo info = getPackageManager().getPackageInfo(getPackageName(), 0);
            long version = Build.VERSION.SDK_INT >= 28 ? info.getLongVersionCode() : info.versionCode;
            SharedPreferences preferences = getSharedPreferences("nh7_native_asset_cache", MODE_PRIVATE);
            if (preferences.getLong("version_code", -1) != version) {
                WebView cacheView = new WebView(getApplicationContext());
                cacheView.clearCache(true);
                cacheView.destroy();
                preferences.edit().putLong("version_code", version).apply();
            }
        } catch (Exception error) {
            android.util.Log.w("NewHope7", "Asset cache refresh failed", error);
        }
        super.onCreate(savedInstanceState);
    }
}
''')
assert 'applicationId "com.omideno7.newhope7"' in gradle.read_text()
print('Production identity, build 25002, API 36, optimized release and voice-testimony permission configured.')
