from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import hashlib
import json
import re
import subprocess
import sys

root = Path(sys.argv[1])
index = (root / 'index.html').read_text()
required = ['js/nh7-community-v502.js', 'js/nh7-global-search-v540.js', 'js/nh7-media-player-v500.js', 'js/nh7-finalqa-v558.js', 'js/nh7-push-account-bind-v364.js', 'css/nh7-tablet-v530.css', 'data/community/testimony_guide_v502.json']
for name in required:
    assert (root / name).is_file(), f'Missing approved feature: {name}'
assert "window.NH7_VERSION = '2.5.0';" in index
assert "!window.Capacitor?.isNativePlatform?.()" in index
assert 'src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"' not in index
assert 'isNativePlatform?.()' in (root / 'js/nh7-auto-update-v335.js').read_text()
assert 'nh7-community-v502.js?v=5.5.5-recorder-pause' in index
assert 'nh7-media-player-v500.js?v=5.5.5-full-overlay' in index

class Assets(HTMLParser):
    references = []
    scripts = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        url = attrs.get('src') if tag == 'script' else attrs.get('href') if tag == 'link' else None
        if not url or urlsplit(url).scheme or url.startswith('//'):
            return
        path = unquote(urlsplit(url).path)
        self.references.append(path)
        if tag == 'script':
            self.scripts.append(path)

parser = Assets()
parser.feed(index)
for name in parser.references:
    assert (root / name).is_file(), f'Broken entry-point reference: {name}'
active = set(parser.scripts)
pending = list(active)
while pending:
    name = pending.pop()
    text = (root / name).read_text()
    for target in re.findall(r'(?:from\s*|import\s*)[\"\'](\.[^\"\']+)[\"\']', text):
        imported = (Path(name).parent / urlsplit(target).path).as_posix()
        assert (root / imported).is_file(), f'Broken module import: {name} -> {target}'
        if imported not in active:
            active.add(imported)
            pending.append(imported)
for name in sorted(active):
    text = (root / name).read_text()
    assert 'localStorage.clear(' not in text, f'Global user-data wipe: {name}'
    result = subprocess.run(['node', '--input-type=module', '--check'], input=text, text=True, capture_output=True)
    assert result.returncode == 0, f'JavaScript syntax: {name}\n{result.stderr}'
for name in ['js/app.js', 'js/nh7-audio-classic-v484.js']:
    text = (root / name).read_text()
    for rpc in ['nh7_track_audio_session_v222', 'nh7_school_record_audio_v380', 'nh7_track_content_v223', 'nh7_track_app_section_v222', 'nh7_library_reading_record_v490']:
        assert rpc not in text, f'Retired analytics returned: {name}: {rpc}'
assert 'const NH7_LIBRARY_CATALOG_CACHE_MS=10*60*1000;' in (root / 'js/app.js').read_text()
assert 'nh7_sermon_social_batch_v444' in (root / 'js/nh7-sermon-social-v443.js').read_text()
assert 'nh7_inbox_snapshot_v419' in (root / 'js/nh7-inbox-badge-sync-v418.js').read_text()
assert 'setInterval(refreshSchoolPath,120000)' in (root / 'js/nh7-school-path-v351.js').read_text()
print(json.dumps({'status': 'PASS', 'entry_assets': len(parser.references), 'active_js_modules': len(active), 'feature_set': 'approved Test 5.8', 'retired_analytics': 'absent', 'global_storage_wipe': 'absent'}))
