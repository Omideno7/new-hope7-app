"""Copy only the phone-approved reader runtime onto the verified main baseline."""
from pathlib import Path
import hashlib,json,os,re,subprocess
BASE=os.environ['BASE_SHA'];SOURCE=os.environ['SOURCE_SHA'];OUT=Path(os.environ['QA_OUTPUT']);OUT.mkdir(exist_ok=True,parents=True)
RUNTIME=['index.html','js/app.js','js/nh7-app-enhancements-v230.js','js/nh7-my-notes-v234.js','js/nh7-apocrypha-preview-v240.js','js/nh7-apocrypha-actions-v393.js','js/nh7-reader-ux-v251.js','js/nh7-reader-toolbar-v452.js','js/nh7-my-notes-categories-v452.js','css/nh7-reader-toolbar-v452.css','css/nh7-notes-categories-v452.css']
def original(ref,name):return subprocess.check_output(['git','show',ref+':'+name])
for name in RUNTIME:
    p=Path(name);p.parent.mkdir(exist_ok=True,parents=True);p.write_bytes(original(SOURCE,name))
p=Path('index.html');text=p.read_text()
for old,new in [('js/app.js?v=4.5.1-bible-release','js/app.js?v=4.5.2-reader-release'),('js/nh7-app-enhancements-v230.js?v=4.5.1-bible','js/nh7-app-enhancements-v230.js?v=4.5.2-reader'),('js/nh7-my-notes-v234.js?v=2.3.9.33','js/nh7-my-notes-v234.js?v=4.5.2-reader'),('js/nh7-apocrypha-v270.js?v=2.3.9.33','js/nh7-apocrypha-v270.js?v=4.5.2-reader'),('service-worker.js?v=4.5.1','service-worker.js?v=4.5.2')]:
    assert text.count(old)==1,old;text=text.replace(old,new)
assert 'nh7-reader-preview' not in text and 'reader-preview.html' not in text
p.write_text(text)
p=Path('js/nh7-apocrypha-v270.js');text=original(BASE,str(p)).decode();assert "const BUILD='wave1a-402';" in text
text=text.replace("const BUILD='wave1a-402';","const BUILD='wave1a-402-reader452';");p.write_text(text)
lazy=re.search(r'const SCRIPTS=\[([\s\S]*?)\];',text);assert lazy
lazy_paths=re.findall(r"'([^']+)'",lazy[1]);assert len(lazy_paths)==8
p=Path('sw-release-core-v403.js');text=original(BASE,str(p)).decode()
text=text.replace("'4.5.1-bible-keywords'","'4.5.2-reader'").replace("'nh7-release-core-v451-bible-keywords'","'nh7-release-core-v452-reader'")
code_paths=[name for name in RUNTIME if name.endswith(('.js','.css'))]+['js/nh7-apocrypha-v270.js']
extra=['./'+x for x in dict.fromkeys(code_paths+lazy_paths) if "'./"+x+"'" not in text]
assert len(extra)==len(set(extra));marker='\n];';assert text.count(marker)==1
text=text.replace(marker,',\n  '+','.join(repr(x) for x in extra)+marker,1)
# The legacy worker ignores query strings. Prefer the new release's exact reader
# assets so old lazy-loaded Apocrypha scripts cannot mix with the new toolbar.
text+='\nconst NH7_READER_RELEASE_PATHS_V452=new Set('+json.dumps(code_paths)+');\n'+r'''
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url),scope=new URL(self.registration.scope);
  if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  const relative=url.pathname.slice(scope.pathname.length);
  if(!NH7_READER_RELEASE_PATHS_V452.has(relative))return;
  event.respondWith((async()=>{
    const cache=await caches.open(NH7_RELEASE_CORE_CACHE),key=nh7ReleaseKey(url.href),cached=await cache.match(key);
    if(cached)return cached;
    try{const response=await fetch(event.request,{cache:'no-store'});if(response.ok)await cache.put(key,response.clone());return response}
    catch(_){return new Response('',{status:503,headers:{'Content-Type':relative.endsWith('.css')?'text/css':'application/javascript'}})}
  })());
  event.stopImmediatePropagation();
});
'''
p.write_text(text)
p=Path('service-worker.js');text=original(BASE,str(p)).decode();old="importScripts('./sw-release-core-v403.js?v=4.5.1');";assert text.count(old)==1
text=text.replace(old+'\n','');before="importScripts('./sw-offline-v329.js?v=2.3.9.50-classic-audio-v400');";assert text.count(before)==1
text=text.replace(before,"importScripts('./sw-release-core-v403.js?v=4.5.2');\n"+before);p.write_text(text)
ALLOWED=RUNTIME+['js/nh7-apocrypha-v270.js','service-worker.js','sw-release-core-v403.js']
assert len(ALLOWED)==14
for name in RUNTIME:
    if name!='index.html':assert Path(name).read_bytes()==original(SOURCE,name),name
paths=re.search(r'const NH7_RELEASE_ASSETS=\[([\s\S]*?)\];',Path('sw-release-core-v403.js').read_text())[1]
assets=re.findall(r"'([^']+)'",paths)
assert len(assets)==len(set(assets))
for path in assets:assert path=='./' or Path(path).is_file(),path
for path in code_paths+lazy_paths:assert './'+path in assets,path
subprocess.run(['git','diff','--exit-code',BASE,'--','data','version.json','manifest.json','app','supabase'],check=True)
subprocess.run(['git','diff','--check'],check=True)
(OUT/'allowed-files.json').write_text(json.dumps(ALLOWED,indent=2))
(OUT/'release-hashes.json').write_text(json.dumps({x:hashlib.sha256(Path(x).read_bytes()).hexdigest() for x in ALLOWED},indent=2))
(OUT/'scope-report.json').write_text(json.dumps({'status':'passed','base':BASE,'approvedSource':SOURCE,'runtimeOnlyFiles':ALLOWED,'approvedReaderLogicUnchanged':True,'corpusAndAccountBackendUnchanged':True,'nativeVersionUnchanged':True,'newReleaseAssetCount':len(assets),'mainWritten':False,'cacheHandlerScope':code_paths},indent=2))
print('Prepared 14 runtime/cache files; approved reader logic and source texts unchanged.')
