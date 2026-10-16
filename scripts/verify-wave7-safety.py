"""Independent actual-source guard. No backend, data, router, player, auth or persistence exemptions."""
import sys
sys.dont_write_bytecode=True
from pathlib import Path
import hashlib,json,subprocess,re,tempfile
from wave7_accepted_source import BASE,manifest,previous_bytes
m=manifest();assert m['base']==BASE
assert set(m['existing_runtime'])=={'index.html','manifest.json','sw-release-core-v403.js'}
assert set(m['new_runtime'])=={'js/nh7-platform-wave7.js','css/nh7-platform-wave7.css'}
scopes=['js','css','assets','data','public','supabase','index.html','admin.html','reset-password.html','sw-release-core-v403.js','service-worker.js','manifest.json']
old=set(subprocess.check_output(['git','ls-tree','-r','--name-only',BASE,'--',*scopes]).decode().splitlines())
now=set(subprocess.check_output(['git','ls-files','--',*scopes]).decode().splitlines())|set(subprocess.check_output(['git','ls-files','--others','--exclude-standard','--',*scopes]).decode().splitlines())
assert now-old==set(m['new_runtime']),'Unexpected Wave7 runtime/backend addition'
objects=dict(line.split(' ',1)[::-1] for line in subprocess.check_output(['git','ls-tree','-r','--format=%(objectname) %(path)',BASE,'--',*scopes]).decode().splitlines())
for p in old:
 raw=previous_bytes(p);assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==objects[p],'Protected current product/backend/review source changed: '+p
for p,h in m['new_runtime'].items():assert hashlib.sha256(Path(p).read_bytes()).hexdigest()==h,p
patch=Path('scripts/fixtures/wave7-approved-platform.patch');assert hashlib.sha256(patch.read_bytes()).hexdigest()==m['patch_sha256']
with tempfile.TemporaryDirectory(prefix='nh7-wave7-check-') as tmp:
 for p in list(m['existing_runtime'])+list(m['new_runtime']):
  target=Path(tmp)/p;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(Path(p).read_bytes())
 subprocess.run(['git','apply','--reverse','--check','--unidiff-zero',str(patch.resolve())],cwd=tmp,check=True)
# Entry/core changes are only one geometry module/style, orientation and executable-cache rotation.
before=json.loads(previous_bytes('manifest.json'));after=json.loads(Path('manifest.json').read_text());before['orientation']='any';assert before==after
oldhtml=previous_bytes('index.html').decode();html=Path('index.html').read_text()
assert html.index('css/nh7-platform-wave7.css')>html.index('css/nh7-user-app-wave6.css')
assert html.index('js/nh7-platform-wave7.js')>html.index('js/nh7-adaptive-layout-v570.js')
assert html.replace('  <link rel="stylesheet" href="css/nh7-platform-wave7.css?v=7">\n','').replace('  <script src="js/nh7-platform-wave7.js?v=7" defer></script>\n','').replace('manifest.json?v=wave7','manifest.json?v=4.4.7')==oldhtml
core=Path('sw-release-core-v403.js').read_text();assert "NH7_RELEASE_DATA_CACHE='nh7-data-stable-v329'" in core
for p in m['new_runtime']:assert p in core,p
source=Path('js/nh7-platform-wave7.js').read_text()
for bad in ['fetch(', 'setInterval(', 'setTimeout(', 'localStorage', 'sessionStorage','caches.','XMLHttpRequest','touchmove','preventDefault','NH7_NAVIGATE','new Audio','MutationObserver']:
 assert bad not in source,'Presentation module may not take business/storage/audio ownership: '+bad
assert 'if(window.NH7PlatformWave7)return' in source and 'if(started)return' in source and 'if(!frame)' in source
css=Path('css/nh7-platform-wave7.css').read_text();assert 'minmax(0,1fr)' in css and 'max-height:none' in css and '.nh7-plans-tabs' in css
assert not re.search(r'max-height:\s*40px|touch-action:\s*none|overscroll-behavior:\s*none',css)
for p in Path('watchos').rglob('*'):
 if p.is_file():
  assert p.suffix not in ['.p12','.mobileprovision','.xcarchive','.ipa','.key'],p
  if p.suffix=='.swift':
   s=p.read_text();assert not re.search(r'URLSession|https?://|AVPlayer|Timer\(|scheduledTimer|service_role|sb_secret_|UserDefaults|removeItem|deleteAccount',s),p
assert not subprocess.check_output(['git','diff',BASE,'--','supabase','data','public','js/app.js','js/nh7-media-player-v500.js','js/nh7-audio-classic-v484.js','js/nh7-local-first-wave2.js','js/nh7-profile-photo-v564.js'])
print('PASS Wave7 exact reversible presentation delta; all current engines/router/authority/persistence/data/backend/review/migrations frozen; no polling/cache clear/touch suppression, Watch network/playback bypass absent')
