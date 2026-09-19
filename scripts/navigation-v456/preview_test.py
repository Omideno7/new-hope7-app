"""Run locally or at a pinned public Preview URL. No account services used."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from urllib.parse import urlparse
import json,os,threading
from playwright.sync_api import sync_playwright,expect
OUT=Path('qa-nav456');OUT.mkdir(exist_ok=True);url=os.getenv('QA_PREVIEW_URL','');stage='public' if url else 'local';server=None;requests=[];errors=[]
if not url:
 class Quiet(SimpleHTTPRequestHandler):
  def log_message(self,*a):pass
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(Path.cwd())));threading.Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/navigation-preview.html'
with sync_playwright() as pw:
 b=pw.chromium.launch();c=b.new_context(viewport={'width':390,'height':844})
 c.add_init_script("""(()=>{if(!location.pathname.endsWith('/navigation-preview.html'))return;window.qaNavRaw=localStorage;window.qaNavSession=sessionStorage;localStorage.setItem('nh7_note_original456','KEEP');localStorage.setItem('nh7_lang','en');sessionStorage.setItem('nh7_access_original456','KEEP SESSION');})();""")
 c.on('page',lambda p:p.on('pageerror',lambda e:errors.append(str(e))));c.on('request',lambda r:requests.append({'url':r.url,'method':r.method}));p=c.new_page();p.set_default_timeout(60000);expect.set_options(timeout=60000)
 try:
  response=p.goto(url,wait_until='domcontentloaded',timeout=90000);assert response.status==200
  gate=p.get_by_text('Open the page',exact=True);notice=False
  if gate.count() and gate.is_visible():
   notice=True
   if gate.get_attribute('target')=='_blank':
    with c.expect_page() as opened:gate.click()
    p=opened.value
   else:gate.click()
   expect(p.locator('#amenButton')).to_be_visible();requests.clear();errors.clear();p.reload(wait_until='domcontentloaded',timeout=90000)
  p.locator('#amenButton').click();expect(p.locator('[data-home-navigation456]')).to_be_visible()
  assert p.evaluate('window.NH7_NAVIGATION_PREVIEW') is True
  assert p.evaluate('localStorage.getItem("nh7_note_original456")') is None
  assert p.evaluate('sessionStorage.getItem("nh7_access_original456")') is None
  for locale in ['fa','en','hr']:
   p.select_option('#langSelect',locale);p.locator('[data-route="home"]').click();expect(p.locator('[data-home-navigation456] .tile')).to_have_count(1)
   assert p.locator('[data-home-navigation456] .tile').get_attribute('data-go')=='meetings'
   p.screenshot(path=str(OUT/f'{stage}-{locale}-home.png'),full_page=True)
   p.locator('[data-route="more"]').click();expect(p.locator('[data-more-navigation456] .tile[data-go]')).to_have_count(6)
   expect(p.locator('[data-nh7-video-portal]')).to_have_count(1)
   p.locator('.nh7-navigation-guide456 summary').click();expect(p.locator('[data-nav-location456]')).to_have_count(6)
   p.screenshot(path=str(OUT/f'{stage}-{locale}-more.png'),full_page=True)
  p.locator('[data-route="home"]').click();p.locator('[data-go="meetings"]').click();expect(p.locator('[data-home-navigation456]')).to_have_count(0)
  p.locator('[data-route="daily"]').click();p.locator('[data-dailytab="gratitude"]').click();expect(p.locator('#startGratitude')).to_be_visible()
  p.locator('[data-route="home"]').click();p.locator('#quickNotify').click();expect(p.locator('#nh7NavPreviewStatus456')).not_to_have_text('')
  assert p.evaluate('qaNavRaw.getItem("nh7_note_original456")')=='KEEP'
  assert p.evaluate('qaNavRaw.getItem("nh7_lang")')=='en'
  assert p.evaluate('qaNavSession.getItem("nh7_access_original456")')=='KEEP SESSION'
  assert p.evaluate('qaNavRaw.getItem("nh7_preview_nav_v456:nh7_lang")')=='hr'
  assert p.evaluate('fetch(location.href,{method:"POST"}).then(()=>false,()=>true)')
  assert p.evaluate('fetch("https://example.invalid/blocked").then(()=>false,()=>true)')
  assert p.evaluate('navigator.serviceWorker.getRegistrations().then(x=>x.length)')==0
  assert not errors,errors
  assert all(urlparse(r['url']).hostname==urlparse(p.url).hostname and r['method'] in ['GET','HEAD'] for r in requests),requests
  (OUT/f'{stage}-preview-report.json').write_text(json.dumps({'status':'passed','url':url,'resolvedUrl':p.url,'hostingNoticeShown':notice,'checks':['Three-language Home/More use canonical links','Visual-media shortcut preserved','Location guide shows all six destinations','Meetings and Gratitude routes remain available','Original localStorage and sessionStorage unchanged','Preview writes confined to own namespace','External fetch and POST blocked','No service workers','No external application requests or page errors'],'requests':requests},ensure_ascii=False,indent=2))
 except Exception as e:
  p.screenshot(path=str(OUT/f'{stage}-preview-failure.png'),full_page=True);(OUT/f'{stage}-preview-failure.json').write_text(json.dumps({'error':str(e),'pageErrors':errors,'requests':requests,'body':p.locator('body').inner_text()[:10000]},ensure_ascii=False,indent=2));raise
 finally:c.close();b.close()
if server:server.shutdown()
