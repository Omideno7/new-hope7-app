"""GET-only release byte verification plus UI tests with all account endpoints mocked."""
from pathlib import Path
import hashlib,json,os,subprocess,sys,time,urllib.request,shutil
ROOT='https://omideno7.github.io/new-hope7-app/';EXPECTED=os.environ['EXPECTED_SHA'];OUT=Path('/tmp/nav456-live-evidence');OUT.mkdir(exist_ok=True,parents=True)
files=['js/app.js','index.html','css/nh7-navigation-v456.css','service-worker.js','sw-release-core-v403.js'];results={}
for name in files:
 expected=hashlib.sha256(subprocess.check_output(['git','show',EXPECTED+':'+name])).hexdigest()
 last=''
 for _ in range(7):
  try:
   req=urllib.request.Request(ROOT+name+'?nav456_release='+EXPECTED[:12],headers={'User-Agent':'NewHope7-Navigation-QA','Cache-Control':'no-cache'})
   with urllib.request.urlopen(req,timeout=35) as r:status=r.status;body=r.read()
   actual=hashlib.sha256(body).hexdigest()
   if status==200 and actual==expected:results[name]={'status':200,'matchesCommit':True,'sha256':actual};break
   last=f'HTTP {status}, hash {actual}'
  except Exception as e:last=str(e)
  time.sleep(3)
 else:raise AssertionError(name+': '+last)
 print('MATCH',name,flush=True)
(OUT/'static-release-report.json').write_text(json.dumps({'status':'passed','main':EXPECTED,'files':results,'onlyGET':True},indent=2))
# The same no-guide route suite as pre-release; only its base URL changes.
subprocess.run([sys.executable,'scripts/navigation-release456/setup_tests.py'],check=True)
source=Path('/tmp/nav456-release-tests/navigation.py').read_text()
old="BASE=f'http://127.0.0.1:{server.server_port}'";assert source.count(old)==1
source=source.replace(old,"BASE='"+ROOT.rstrip('/')+"'")
test=OUT/'live-navigation.py';test.write_text(source)
env=dict(os.environ,QA_ENGINE='chromium',QA_OUTPUT=str(OUT),QA_LIVE_URL=ROOT);env.pop('QA_AGENT_BROWSER',None)
result=subprocess.run([sys.executable,str(test)],env=env)
if Path('qa-nav456').exists():shutil.copytree('qa-nav456',OUT/'navigation',dirs_exist_ok=True)
assert result.returncode==0,'Live navigation verification failed; see evidence'
subprocess.run([sys.executable,'scripts/navigation-release456/account_test.py'],env=env,check=True)
(OUT/'live-release-report.json').write_text(json.dumps({'status':'passed','mainCommit':EXPECTED,'liveUrl':ROOT,'exactStaticFiles':5,'guideAbsent':True,'navigationBrowser':'Chromium','accountWiringBrowser':'Chromium','realAccountUsed':False,'externalAccountServices':'intercepted and mocked','productionDataWrites':0},indent=2))
print('Live main verified: no location guide; account controls use original enabled configuration.')
