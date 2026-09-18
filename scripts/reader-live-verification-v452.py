"""Read-only live deployment check; all account/service traffic is mocked in UI tests."""
from pathlib import Path
import hashlib,json,os,subprocess,sys,time,urllib.request
ROOT='https://omideno7.github.io/new-hope7-app/';EXPECTED=os.environ['EXPECTED_SHA'];SOURCE='0554e87363b1bb979f8edaf8609402db08bbd43a'
OUT=Path('/tmp/reader-v452-live-evidence');OUT.mkdir(exist_ok=True)
FILES=['index.html','js/app.js','js/nh7-app-enhancements-v230.js','js/nh7-my-notes-v234.js','js/nh7-apocrypha-preview-v240.js','js/nh7-apocrypha-actions-v393.js','js/nh7-reader-ux-v251.js','js/nh7-reader-toolbar-v452.js','js/nh7-my-notes-categories-v452.js','css/nh7-reader-toolbar-v452.css','css/nh7-notes-categories-v452.css','js/nh7-apocrypha-v270.js','service-worker.js','sw-release-core-v403.js']
results={}
for name in FILES:
    expected=hashlib.sha256(subprocess.check_output(['git','show',EXPECTED+':'+name])).hexdigest()
    last_error=''
    for attempt in range(6):
        try:
            request=urllib.request.Request(ROOT+name+'?reader_release_check='+EXPECTED[:12],headers={'Cache-Control':'no-cache','User-Agent':'NewHope7-Reader-Release-Verification'})
            with urllib.request.urlopen(request,timeout=30) as response:
                body=response.read();status=response.status;actual=hashlib.sha256(body).hexdigest()
            if status==200 and actual==expected:
                results[name]={'status':status,'sha256':actual,'matchesExactCommit':True};break
            last_error=f'{name}: HTTP {status}, expected {expected}, got {actual}'
        except Exception as error:last_error=str(error)
        time.sleep(3)
    else:
        (OUT/'failure.json').write_text(json.dumps({'error':last_error,'completed':results},indent=2));raise AssertionError(last_error)
    print('MATCH',name,flush=True)
(OUT/'live-byte-report.json').write_text(json.dumps({'status':'passed','url':ROOT,'commit':EXPECTED,'files':results,'onlyHttpGET':True},indent=2))
source=subprocess.check_output(['git','show',SOURCE+':scripts/reader-wave-v452/browser.py'],text=True)
old="BASE=f'http://127.0.0.1:{server.server_port}'";assert source.count(old)==1
source=source.replace(old,"BASE='"+ROOT.rstrip('/')+"'")
p=OUT/'live-browser.py';p.write_text(source)
env=dict(os.environ,QA_ENGINE='chromium');env.pop('QA_AGENT_BROWSER',None)
result=subprocess.run([sys.executable,str(p)],env=env)
if Path('qa-reader452').exists():
    import shutil
    shutil.copytree('qa-reader452',OUT/'browser',dirs_exist_ok=True)
assert result.returncode==0,'Live browser verification failed; see preserved evidence'
(OUT/'live-release-report.json').write_text(json.dumps({'status':'passed','commit':EXPECTED,'liveUrl':ROOT,'matchedRuntimeFiles':len(results),'liveBrowser':'Chromium','accountRequests':'intercepted and mocked','realAccountUsed':False,'productionDataEdited':False},indent=2))
print('Live deployed release verified; no real account writes.')
