"""Upgrade the real v451 worker to v452 using local static files only."""
import hashlib,json,os,threading,time
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
OUT=Path(os.environ['QA_OUTPUT']);BASELINE=Path(os.environ['QA_BASELINE']).resolve();CANDIDATE=Path.cwd();SCOPE='/new-hope7-app/';active={'root':BASELINE};errors=[];external=[]
class Handler(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
    def translate_path(self,path):
        path=unquote(urlparse(path).path)
        if not path.startswith(SCOPE):return str(active['root']/'does-not-exist')
        relative=path[len(SCOPE):];target=(active['root']/relative).resolve()
        if not target.is_relative_to(active['root']):return str(active['root']/'does-not-exist')
        return str(target)
    def do_GET(self):
        if urlparse(self.path).path==SCOPE+'qa-probe.html':
            body=b'<!doctype html><meta charset="utf-8"><title>Reader upgrade probe</title><p>Static upgrade probe</p>'
            self.send_response(200);self.send_header('Content-Type','text/html');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
        else:super().do_GET()
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start();ORIGIN=f'http://127.0.0.1:{server.server_port}';URL=ORIGIN+SCOPE
checks=[]
def passed(s):checks.append(s);print('PASS CACHE',s,flush=True)
def wait(p,expression):
    for _ in range(1200):
        if p.evaluate(expression):return
        p.wait_for_timeout(100)
    raise AssertionError('Timeout: '+expression)
async_setup=r'''async()=>{
 localStorage.setItem('nh7_bible_state_JHN_3_16',JSON.stringify({saved:true,note:'Existing note — یادداشت با فاصله',highlight:true,highlightColor:'blue'}));
 localStorage.setItem('nh7_bookmarks',JSON.stringify(['John 3:16','Psalms 23:1']));
 localStorage.setItem('nh7_sermon_note_upgrade','Existing sermon note');
 localStorage.setItem('nh7_gratitude_completed','[1,2,3]');
 localStorage.setItem('nh7_school_progress_upgrade','KEEP');
 for(const name of ['nh7-media-v2-protected','nh7reader-offline-v327','nh7-data-stable-v329','personal-notes']){
   await (await caches.open(name)).put(new URL('qa-preserved/'+name,location.href),new Response('PRESERVE-'+name));
 }
 for(const name of ['nh7-offline-audio-v397','nh7-offline-media-v4'])await new Promise((resolve,reject)=>{
   const req=indexedDB.open(name,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('media'))req.result.createObjectStore('media',{keyPath:'id'})};
   req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result,tx=db.transaction('media','readwrite');tx.objectStore('media').put({id:'qa-upgrade-download',blob:new Blob(['ORIGINAL-AUDIO']),note:'preserve'});tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)};
 });
 return Object.fromEntries(Object.entries(localStorage));
}'''
verify_media=r'''async()=>{
 const data={caches:{},databases:{}};
 for(const name of ['nh7-media-v2-protected','nh7reader-offline-v327','nh7-data-stable-v329','personal-notes']){
   const response=await (await caches.open(name)).match(new URL('qa-preserved/'+name,location.href));data.caches[name]=response?await response.text():null;
 }
 for(const name of ['nh7-offline-audio-v397','nh7-offline-media-v4'])data.databases[name]=await new Promise((resolve,reject)=>{
   const req=indexedDB.open(name,1);req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result,tx=db.transaction('media','readonly'),read=tx.objectStore('media').get('qa-upgrade-download');read.onsuccess=async()=>{const row=read.result;db.close();resolve(row?{note:row.note,text:await row.blob.text()}:null)};read.onerror=()=>reject(read.error)};
 });return data;
}'''
hash_resources=r'''async paths=>{
 const out={};for(const path of paths){const r=await fetch(path+'?qa=first-upgrade-read');const bytes=await r.arrayBuffer();const digest=await crypto.subtle.digest('SHA-256',bytes);out[path]={status:r.status,hash:Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')}}return out;
}'''
with sync_playwright() as pw:
    browser=pw.chromium.launch();c=browser.new_context()
    def route(r):
        if urlparse(r.request.url).hostname=='127.0.0.1':r.continue_()
        else:external.append(r.request.url);r.abort()
    c.route('**/*',route);c.route_web_socket('**/*',lambda ws:ws.close())
    p=c.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
    try:
        p.goto(URL+'qa-probe.html',wait_until='domcontentloaded')
        p.evaluate("navigator.serviceWorker.register('service-worker.js?v=4.5.1',{scope:'./',updateViaCache:'none'})")
        wait(p,"!!navigator.serviceWorker.controller&&navigator.serviceWorker.controller.state==='activated'")
        saved=p.evaluate(async_setup);media_before=p.evaluate(verify_media)
        scope_report=json.loads((OUT/'scope-report.json').read_text());paths=scope_report['cacheHandlerScope']
        warm=[path for path in paths if (BASELINE/path).is_file()]
        p.evaluate(hash_resources,warm);passed('Existing v451 worker active with old reader assets and stored notes/media')
        active['root']=CANDIDATE
        p.evaluate("navigator.serviceWorker.register('service-worker.js?v=4.5.2',{scope:'./',updateViaCache:'none'})")
        wait(p,"!!navigator.serviceWorker.controller&&navigator.serviceWorker.controller.state==='activated'&&navigator.serviceWorker.controller.scriptURL.includes('v=4.5.2')")
        expected={path:hashlib.sha256((CANDIDATE/path).read_bytes()).hexdigest() for path in paths}
        online=p.evaluate(hash_resources,paths)
        assert all(online[k]['status']==200 and online[k]['hash']==v for k,v in expected.items()),{'expected':expected,'online':online}
        passed('First read after worker upgrade returns every exact v452 reader asset, not stale v451 code')
        c.set_offline(True);offline=p.evaluate(hash_resources,paths)
        assert online==offline,{'online':online,'offline':offline}
        shell=p.evaluate("fetch('index.html').then(r=>r.text())");assert '4.5.2-reader-release' in shell and 'nh7-reader-toolbar-v452.js' in shell
        passed('Approved reader code and current app shell remain available offline')
        assert p.evaluate('Object.fromEntries(Object.entries(localStorage))')==saved
        assert p.evaluate(verify_media)==media_before
        passed('Notes, bookmarks, progress, four data/media caches and two download databases remain byte-identical')
        assert not errors and not external,{'errors':errors,'external':external}
        (OUT/'cache-upgrade-report.json').write_text(json.dumps({'status':'passed','checks':checks,'oldWorker':'4.5.1','newWorker':'4.5.2','onlineHashes':online,'offlineHashes':offline,'preservedStorage':True,'preservedDownloadDatabases':True,'pageErrors':errors,'actualExternalRequests':0},ensure_ascii=False,indent=2))
    except Exception as error:
        (OUT/'cache-upgrade-failure.json').write_text(json.dumps({'error':str(error),'checks':checks,'pageErrors':errors,'external':external},ensure_ascii=False,indent=2));raise
    finally:c.close();browser.close();server.shutdown()
