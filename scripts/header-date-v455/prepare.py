"""Five-file date-only runtime candidate. No corpus, account or app.js changes."""
from pathlib import Path
import os,re,json,hashlib,subprocess
BASE='6239cdc187083ff192137d05207447453a92cce9'
OUT=Path('qa-date455');OUT.mkdir(exist_ok=True)

def edit(name,fn):
 p=Path(name);old=p.read_text();new=fn(old)
 if old!=new:p.write_text(new)

def index(s):
 if 'id="nh7HeaderDate455"' not in s:
  assert s.count('<header class="topbar">')==1
  s=s.replace('<header class="topbar">','<header class="topbar nh7-header-date455">',1)
  row='''      <div class="nh7-header-date-row455" hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 2v6M17 2v6M3 11h18M7 15h3M14 15h3"/></svg>
        <time id="nh7HeaderDate455" hidden></time>
      </div>
'''
  assert s.count('    </header>')==1;s=s.replace('    </header>',row+'    </header>',1)
 if 'css/nh7-header-date-v455.css' not in s:s=s.replace('</head>','  <link rel="stylesheet" href="css/nh7-header-date-v455.css?v=4.5.5" />\n</head>')
 if 'js/nh7-header-date-v455.js' not in s:s=s.replace('</body>','  <script src="js/nh7-header-date-v455.js?v=4.5.5" defer></script>\n</body>')
 return s.replace('service-worker.js?v=4.5.4','service-worker.js?v=4.5.5')
edit('index.html',index)
edit('service-worker.js',lambda s:s.replace('sw-release-core-v403.js?v=4.5.4','sw-release-core-v403.js?v=4.5.5'))

def core(s):
 s=s.replace("'4.5.4-study'","'4.5.5-header-date'").replace("'nh7-release-core-v454-study'","'nh7-release-core-v455-header-date'")
 names=['js/nh7-header-date-v455.js','css/nh7-header-date-v455.css']
 assets=re.search(r'const NH7_RELEASE_ASSETS=\[([\s\S]*?)\];',s);assert assets
 extra=['./'+n for n in names if "'./"+n+"'" not in assets[1]]
 if extra:s=s[:assets.end(1)]+',\n  '+','.join(repr(n) for n in extra)+s[assets.end(1):]
 match=re.search(r'const NH7_READER_RELEASE_PATHS_V452=new Set\((\[[^;]+\])\);',s);assert match
 paths=json.loads(match[1]);merged=list(dict.fromkeys(paths+names));s=s[:match.start(1)]+json.dumps(merged)+s[match.end(1):]
 return s
edit('sw-release-core-v403.js',core)
files=['index.html','service-worker.js','sw-release-core-v403.js','js/nh7-header-date-v455.js','css/nh7-header-date-v455.css']
subprocess.run(['git','diff','--check'],check=True)
subprocess.run(['git','diff','--exit-code',BASE,'--','js/app.js','data','supabase','version.json','manifest.json','app','js/nh7-notifications-zagreb-v334.js','js/nh7-audio-classic-v400.js'],check=True)
(OUT/'allowed-files.json').write_text(json.dumps(files,indent=2))
(OUT/'runtime-hashes.json').write_text(json.dumps({p:hashlib.sha256(Path(p).read_bytes()).hexdigest() for p in files},indent=2))
(OUT/'scope-report.json').write_text(json.dumps({'status':'prepared','baseline':BASE,'files':files,'timezone':'device-local','faCalendar':'persian','enCalendar':'gregory','hrCalendar':'gregory','storageWrites':0,'dateNetworkCalls':0,'appJsCorpusBackendNativeManifestsUnchanged':True,'notificationScheduleUnchanged':True},indent=2))
print('Prepared five-file date-only release, with original account/data code unchanged.')
