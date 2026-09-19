"""Verify the published static release; account traffic and sample audio are synthetic."""
from pathlib import Path
import hashlib,json,os,shutil,subprocess,sys,time,urllib.request
ROOT='https://omideno7.github.io/new-hope7-app/'
BASE=os.environ['BASE_SHA'];EXPECTED=os.environ['EXPECTED_SHA'];SOURCE=os.environ['SOURCE_SHA']
OUT=Path('/tmp/study454-live');OUT.mkdir(exist_ok=True)
files=subprocess.check_output(['git','diff','--name-only',BASE,EXPECTED],text=True).splitlines()
assert 15<=len(files)<=60 and all(not n.startswith(('.github/','supabase/','data/bible/','data/apocrypha/')) for n in files)
report={}
for name in files:
    expected=hashlib.sha256(subprocess.check_output(['git','show',EXPECTED+':'+name])).hexdigest()
    for attempt in range(7):
        try:
            req=urllib.request.Request(ROOT+name+'?v454_verify='+EXPECTED[:12],headers={'User-Agent':'NewHope7-Static-Release-QA','Cache-Control':'no-cache'})
            with urllib.request.urlopen(req,timeout=40) as r:status=r.status;actual=hashlib.sha256(r.read()).hexdigest()
            if status==200 and actual==expected:report[name]={'status':200,'sha256':actual,'matchesCommit':True};break
        except Exception as e:print('Retry',name,str(e),flush=True)
        time.sleep(3)
    else:raise AssertionError('Published file mismatch: '+name)
    print('VERIFIED',name,flush=True)
(OUT/'static-release-report.json').write_text(json.dumps({'status':'passed','commit':EXPECTED,'liveUrl':ROOT,'files':report},indent=2))
source=subprocess.check_output(['git','show',SOURCE+':scripts/study-v454/browser.py'],text=True)
old="BASE=f'http://127.0.0.1:{server.server_port}'";assert source.count(old)==1
source=source.replace(old,"BASE='"+ROOT.rstrip('/')+"'")
# The runtime is served from the actual main URL. A local WAV fixture is fulfilled
# only for this test URL, so no real sermon account or media request is required.
marker="    r=route.request\n    if r.url.startswith(BASE+'/'):return route.continue_()";assert marker in source
source=source.replace(marker,"    r=route.request\n    if r.url==BASE+'/qa-study454/sample.wav':return route.fulfill(status=200,content_type='audio/wav',path=str(OUT/'sample.wav'))\n    if r.url.startswith(BASE+'/'):return route.continue_()",1)
path=OUT/'live-test.py';path.write_text(source)
result=subprocess.run([sys.executable,str(path)],env=dict(os.environ,QA_ENGINE='chromium'))
if Path('qa-study454').exists():shutil.copytree('qa-study454',OUT/'browser',dirs_exist_ok=True)
assert result.returncode==0,'Live UI test failed; see evidence'
(OUT/'live-release-report.json').write_text(json.dumps({'status':'passed','commit':EXPECTED,'verifiedStaticFiles':len(files),'browser':'Chromium','actualLiveRuntime':True,'realUserAccount':False,'productionDatabaseWrites':0,'audio':'synthetic local WAV through existing classic player'},indent=2))
print('Exact live release and font/lexicon/quick-Bible UI verified.')
