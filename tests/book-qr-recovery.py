import threading, pathlib, mimetypes, json
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
BASE=pathlib.Path.cwd()
old_worker=(BASE/'service-worker.js').read_text().replace("importScripts('./app/download-worker-v1.js?v=20260914.3');\n",'')
class Handler(BaseHTTPRequestHandler):
 def log_message(self,*args): pass
 def do_GET(self):
  rel=urlparse(self.path).path.removeprefix('/new-hope7-app/')
  if rel=='service-worker.js': data=old_worker.encode();ctype='text/javascript'
  elif rel=='qr-test-setup.html': data=b'<!doctype html><title>Cache test setup</title>';ctype='text/html'
  else:
   if not rel or rel.endswith('/'): rel+='index.html'
   file=BASE/rel
   if not file.resolve().is_relative_to(BASE.resolve()) or not file.is_file():
    self.send_response(404);self.end_headers();return
   data=file.read_bytes();ctype=mimetypes.guess_type(str(file))[0] or 'application/octet-stream'
  self.send_response(200);self.send_header('Content-Type',ctype+'; charset=utf-8' if ctype.startswith('text/') else ctype);self.send_header('Cache-Control','no-cache');self.end_headers();self.wfile.write(data)
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
ROOT=f'http://127.0.0.1:{server.server_port}/new-hope7-app/'
CANON=ROOT+'app/'
APPLE='https://apps.apple.com/hr/app/new-hope-7/id6803187205'
checks=[]
def check(label,result):
 assert result,label
 checks.append(label);print('PASS',label,flush=True)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True)
 ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 page=ctx.new_page();page.goto(ROOT+'qr-test-setup.html')
 page.evaluate("async()=>{await navigator.serviceWorker.register('./service-worker.js',{scope:'./',updateViaCache:'none'});await navigator.serviceWorker.ready;}")
 page.wait_for_function('navigator.serviceWorker.controller !== null',timeout=25000)
 old='<html><body><img class="logo" src="../assets/admin-icon-192.png"><div class="soon">App Store Coming Soon</div></body></html>'
 page.evaluate('''async ({root,old})=>{
  const c=await caches.open('nh7-cache-test-sentinel');
  for(const path of ['app/','app/index.html','app/?v=20260914'])await c.put(root+path,new Response(old,{headers:{'Content-Type':'text/html'}}));
  await c.put(root+'data/test-sentinel.json',new Response('KEEP-DATA'));
  await c.put(root+'test-audio.mp3',new Response('KEEP-AUDIO'));
  localStorage.setItem('qr-test-login','KEEP-SESSION');
  await new Promise((resolve,reject)=>{let r=indexedDB.open('qr-test-db',1);r.onupgradeneeded=()=>r.result.createObjectStore('notes');r.onsuccess=()=>{let t=r.result.transaction('notes','readwrite');t.objectStore('notes').put('KEEP-NOTE','sentinel');t.oncomplete=resolve;t.onerror=reject;};r.onerror=reject;});
 }''',{'root':ROOT,'old':old})
 page.goto(CANON)
 check('real legacy worker reproduces non-clickable Coming Soon page',page.locator('.soon').count()==1 and page.locator('a').count()==0)
 page.goto(CANON+'?v=20260914')
 check('query-string alone does not bypass legacy navigation cache',page.locator('.soon').count()==1)
 page.goto(CANON+'refresh.html',wait_until='domcontentloaded');page.wait_for_url(CANON,timeout=25000)
 page.wait_for_function('document.querySelector(".logo") && document.querySelector(".logo").complete')
 check('repair returns to exact permanent printed URL',page.url==CANON)
 check('real church logo loaded without admin asset',page.locator('.logo').evaluate('(e)=>e.naturalWidth===656 && e.getAttribute("src")==="./church-logo-d00c2947.png"'))
 check('App Store is a real same-tab link',page.locator('#app-store-link').get_attribute('href')==APPLE and not page.locator('#app-store-link').get_attribute('target'))
 check('no public QR text or Coming Soon remains','بارکد' not in page.content() and 'Coming Soon' not in page.content())
 saved=page.evaluate('''async root=>{const c=await caches.open('nh7-cache-test-sentinel');return {data:await (await c.match(root+'data/test-sentinel.json')).text(),audio:await (await c.match(root+'test-audio.mp3')).text(),session:localStorage.getItem('qr-test-login'),note:await new Promise((resolve,reject)=>{let r=indexedDB.open('qr-test-db',1);r.onsuccess=()=>{let q=r.result.transaction('notes').objectStore('notes').get('sentinel');q.onsuccess=()=>resolve(q.result);q.onerror=reject;};})};}''',ROOT)
 check('data and audio caches, session and IndexedDB notes preserved',saved=={'data':'KEEP-DATA','audio':'KEEP-AUDIO','session':'KEEP-SESSION','note':'KEEP-NOTE'})
 for path in ['app/','app/index.html','app/?v=20260914']:
  page.goto(ROOT+path)
  check('correct version on repeat navigation '+path,page.locator('#app-store-link').count()==1 and 'church-logo-d00c2947' in page.locator('.logo').get_attribute('src'))
 page.screenshot(path='/tmp/qr-browser/results/repaired-recovery-test.png',full_page=True)
 ctx.route(APPLE,lambda route:route.fulfill(status=200,content_type='text/html',body='<title>Test App Store boundary</title>'))
 page.locator('#app-store-link').tap();page.wait_for_url(APPLE)
 check('touch navigates to exact Apple URL in same tab',page.url==APPLE and len(ctx.pages)==1)
 fresh=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
 tab=fresh.new_page();tab.goto(CANON+'refresh.html');tab.wait_for_url(CANON,timeout=25000)
 check('fresh browser repair does not install a worker',tab.locator('#app-store-link').count()==1 and tab.evaluate('navigator.serviceWorker.controller === null'))
 b.close()
server.shutdown()
pathlib.Path('/tmp/qr-browser/results/recovery-test-report.json').write_text(json.dumps({'passed':len(checks),'checks':checks},indent=2))
print('ALL',len(checks),'CHECKS PASSED')
