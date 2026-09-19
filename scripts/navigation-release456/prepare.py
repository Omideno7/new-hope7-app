"""Use only approved menu changes, minus the rejected guide; no Preview/auth migration."""
from pathlib import Path
import hashlib,json,os,re,subprocess
BASE='08d3bfb51532163392fe87cd017e316327c38234';SOURCE='a15365d1eaf05225a322670c58f10a4401602fbe'
OUT=Path(os.environ['QA_OUTPUT']);OUT.mkdir(exist_ok=True,parents=True)
def get(ref,path):return subprocess.check_output(['git','show',ref+':'+path],text=True)
original=get(BASE,'js/app.js');source=get(SOURCE,'js/app.js')
start=source.index('async function more(){');end=source.index('\n\nasync function fetchMyQuestionsCloud',start)
more='''async function more(){
  const destinations=[['audio','🎧'],['salvation','✝'],['qna','❓'],['account','👤'],['about','ℹ'],['settings','⚙']];
  view.innerHTML=`<div class="grid" data-more-navigation456>${destinations.map(([route,icon])=>tile(route,icon,tr(route))).join('')}</div>`;
}'''
app=source[:start]+more+source[end:]
assert 'nh7-navigation-guide456' not in app and 'data-nav-location456' not in app
assert "const CLOUD_ENABLED = Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.key);" in app
assert 'NH7_NAVIGATION_PREVIEW' not in app
# All account/auth/config code is copied byte-for-byte from production.
for first,last in [('const SUPABASE_CONFIG = {','function deviceId(){'),('async function account(){','let notificationSettingsCache=null;')]:
 assert app[app.index(first):app.index(last)]==original[original.index(first):original.index(last)],first
Path('js/app.js').write_text(app)
Path('css/nh7-navigation-v456.css').write_text('/* Keep the one remaining Home destination balanced; no location guide. */\n.nh7-home-destinations456{grid-template-columns:minmax(0,1fr)!important}\n.nh7-home-destinations456>.tile{min-height:90px}\n')
s=get(BASE,'index.html');assert 'nh7-navigation-v456.css' not in s
s=s.replace('</head>','  <link rel="stylesheet" href="css/nh7-navigation-v456.css?v=4.5.6" />\n</head>')
assert 'js/app.js?v=4.5.4' in s;s=s.replace('js/app.js?v=4.5.4','js/app.js?v=4.5.6-navigation')
s=s.replace('service-worker.js?v=4.5.5','service-worker.js?v=4.5.6')
assert not any(x in s for x in ['nh7-navigation-preview','navigation-preview.html','NH7_NAVIGATION_PREVIEW']);Path('index.html').write_text(s)
s=get(BASE,'service-worker.js');assert 'sw-release-core-v403.js?v=4.5.5' in s;Path('service-worker.js').write_text(s.replace('sw-release-core-v403.js?v=4.5.5','sw-release-core-v403.js?v=4.5.6'))
s=get(BASE,'sw-release-core-v403.js');assert "'4.5.5-header-date'" in s
s=s.replace("'4.5.5-header-date'","'4.5.6-navigation'").replace("'nh7-release-core-v455-header-date'","'nh7-release-core-v456-navigation'")
m=re.search(r'const NH7_RELEASE_ASSETS=\[([\s\S]*?)\];',s);assert m
asset='./css/nh7-navigation-v456.css';assert repr(asset) not in m[1]
s=s[:m.end(1)]+',\n  '+repr(asset)+s[m.end(1):]
m=re.search(r'const NH7_READER_RELEASE_PATHS_V452=new Set\((\[[^;]+\])\);',s);assert m
paths=json.loads(m[1]);assert 'js/app.js' in paths;paths.append('css/nh7-navigation-v456.css');assert len(paths)==len(set(paths))
s=s[:m.start(1)]+json.dumps(paths)+s[m.end(1):];Path('sw-release-core-v403.js').write_text(s)
files=['js/app.js','index.html','css/nh7-navigation-v456.css','service-worker.js','sw-release-core-v403.js']
for name in files:
 if name.endswith('.js'):subprocess.run(['node','--check',name],check=True)
subprocess.run(['git','diff','--exit-code',BASE,'--','data','supabase','app','version.json','manifest.json','.github','js/nh7-audio-classic-v400.js','js/nh7-header-date-v455.js','js/nh7-fonts-v454.js'],check=True)
subprocess.run(['git','diff','--check'],check=True)
(OUT/'allowed-files.json').write_text(json.dumps(files,indent=2))
(OUT/'runtime-hashes.json').write_text(json.dumps({name:hashlib.sha256(Path(name).read_bytes()).hexdigest() for name in files},indent=2))
(OUT/'scope-report.json').write_text(json.dumps({'status':'passed','base':BASE,'approvedNavigationSource':SOURCE,'removedGuide':True,'runtimeFiles':files,'authAndAccountCodeUnchanged':True,'productionCloudConfigured':True,'previewGuardsExcluded':True,'sourceTextsAndUserDataBackendUnchanged':True,'cacheHandlerScope':paths,'nativeVersionUnchanged':True},indent=2))
print('Five-file candidate: guide removed; real account configuration and every backend/data file unchanged.')
