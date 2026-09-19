"""Read-only static deployment check and fresh synthetic browser contexts."""
from pathlib import Path
import hashlib,json,os,subprocess,sys,time,urllib.request,shutil
EXPECTED=os.environ['EXPECTED_SHA'];ROOT='https://omideno7.github.io/new-hope7-app/';OUT=Path('/tmp/date455-live');OUT.mkdir(exist_ok=True)
files=['index.html','service-worker.js','sw-release-core-v403.js','js/nh7-header-date-v455.js','css/nh7-header-date-v455.css'];matches={}
for name in files:
 expected=hashlib.sha256(subprocess.check_output(['git','show',EXPECTED+':'+name])).hexdigest()
 for attempt in range(7):
  try:
   req=urllib.request.Request(ROOT+name+'?date_release_check='+EXPECTED[:12],headers={'Cache-Control':'no-cache','User-Agent':'NewHope7-Date-Verification'})
   with urllib.request.urlopen(req,timeout=35) as r:status=r.status;actual=hashlib.sha256(r.read()).hexdigest()
   if status==200 and actual==expected:matches[name]={'status':status,'sha256':actual,'matchesCommit':True};break
  except Exception as e:print('Read retry',name,str(e),flush=True)
  time.sleep(3)
 else:raise AssertionError('Live file not equal to tested release: '+name)
 print('MATCH',name,flush=True)
(OUT/'static-match-report.json').write_text(json.dumps({'status':'passed','commit':EXPECTED,'files':matches},indent=2))
r=subprocess.run([sys.executable,'scripts/header-date-v455/browser.py'],env=dict(os.environ,QA_LIVE_URL=ROOT,QA_ENGINE='chromium'))
if Path('qa-date455').exists():shutil.copytree('qa-date455',OUT/'browser',dirs_exist_ok=True)
assert r.returncode==0,'Live header test did not pass'
(OUT/'live-report.json').write_text(json.dumps({'status':'passed','mainCommit':EXPECTED,'liveUrl':ROOT,'exactStaticFiles':len(files),'liveBrowser':'Chromium','accountRequests':'intercepted and mocked','realAccountUsed':False,'productionDatabaseWrites':0},indent=2))
