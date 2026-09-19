"""Public or local theme-only preview. No live account login or service writes."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from urllib.parse import urlparse
import json,os,threading
from playwright.sync_api import sync_playwright,expect
OUT=Path('qa-theme457');OUT.mkdir(exist_ok=True);url=os.getenv('QA_PREVIEW_URL','');stage='public' if url else 'local';server=None;requests=[];errors=[]
if not url:
 class Quiet(SimpleHTTPRequestHandler):
  def log_message(self,*args):pass
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(Path.cwd())));threading.Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/theme-preview.html'
def wait(p,expr):
 for _ in range(1100):
  if p.evaluate(expr):return
  p.wait_for_timeout(40)
 raise AssertionError('Timeout: '+expr)
with sync_playwright() as pw:
 browser=pw.chromium.launch();context=browser.new_context(viewport={'width':390,'height':844})
 context.add_init_script("""(()=>{if(!location.pathname.endsWith('/theme-preview.html'))return;window.qaThemeRaw457=localStorage;window.qaThemeSession457=sessionStorage;localStorage.setItem('nh7_note_original457','KEEP USER NOTE');localStorage.setItem('nh7_theme_studio_v453','KEEP ORIGINAL THEME');sessionStorage.setItem('nh7_session_original457','KEEP SESSION');})();""")
 context.on('page',lambda p:p.on('pageerror',lambda e:errors.append(str(e))));context.on('request',lambda r:requests.append({'url':r.url,'method':r.method}));p=context.new_page();p.set_default_timeout(60000);expect.set_options(timeout=60000)
 try:
  response=p.goto(url,wait_until='domcontentloaded',timeout=90000);assert response.status==200
  gate=p.get_by_text('Open the page',exact=True);notice=False
  if gate.count() and gate.is_visible():
   notice=True
   if gate.get_attribute('target')=='_blank':
    with context.expect_page() as opened:gate.click()
    p=opened.value
   else:gate.click()
   expect(p.locator('#amenButton')).to_be_visible();requests.clear();errors.clear();p.reload(wait_until='domcontentloaded',timeout=90000)
  p.locator('#amenButton').click();wait(p,'!!window.NH7ThemeStudioV453 && !!window.NH7FontsV454');assert p.evaluate('window.NH7_THEME_PREVIEW') is True
  assert p.evaluate('localStorage.getItem("nh7_note_original457")') is None
  p.locator('.nh7-theme-preview-banner457 [data-go="settings"]').click();expect(p.locator('[data-theme-group457]')).to_have_count(3);expect(p.locator('[data-studio-preset453]')).to_have_count(14);expect(p.locator('#nh7ThemeSelect,[data-nh7-theme-quick]')).to_have_count(0)
  for locale in ['fa','en','hr']:
   p.select_option('#langSelect',locale);expect(p.locator('#nh7ThemeStudio453')).to_have_attribute('dir','rtl' if locale=='fa' else 'ltr')
   p.locator('[data-theme-group457="vivid"]').click();p.locator('[data-studio-preset453="emerald"]').click();wait(p,'document.documentElement.dataset.nh7Studio==="emerald"');assert p.evaluate('getComputedStyle(document.body).backgroundColor')=='rgb(138, 221, 195)'
   p.screenshot(path=str(OUT/f'{stage}-{locale}-gallery.png'))
  p.locator('[data-theme-group457="dark"]').click();p.locator('[data-studio-preset453="aurora"]').click();wait(p,'document.documentElement.dataset.nh7Studio==="aurora"');assert p.evaluate('document.documentElement.style.colorScheme')=='dark'
  assert p.locator('#nh7ThemeStudio453').evaluate('(n)=>getComputedStyle(n).backgroundColor')=='rgb(39, 34, 80)'
  p.screenshot(path=str(OUT/f'{stage}-aurora.png'));p.locator('[data-route="home"]').click();p.screenshot(path=str(OUT/f'{stage}-home-aurora.png'),full_page=True)
  p.locator('.nh7-theme-preview-banner457 [data-go="settings"]').click();p.select_option('#langSelect','fa');p.select_option('#nh7FontSelect','naskh');wait(p,'document.documentElement.dataset.nh7Font454==="naskh"')
  assert p.locator('#nh7HeaderDate455').evaluate('(n)=>getComputedStyle(n).fontFamily').find('NH7 Noto Naskh')>=0
  assert p.evaluate('qaThemeRaw457.getItem("nh7_note_original457")')=='KEEP USER NOTE';assert p.evaluate('qaThemeRaw457.getItem("nh7_theme_studio_v453")')=='KEEP ORIGINAL THEME';assert p.evaluate('qaThemeSession457.getItem("nh7_session_original457")')=='KEEP SESSION'
  assert p.evaluate('!!qaThemeRaw457.getItem("nh7_preview_theme_v457:nh7_theme_studio_v453")')
  p.locator('[data-route="more"]').click();p.locator('[data-go="account"]').click();expect(p.locator('#themePreviewStatus457')).not_to_have_text('');assert 'Cloud disabled' not in p.locator('body').inner_text()
  assert p.evaluate('fetch(location.href,{method:"POST"}).then(()=>false,()=>true)');assert p.evaluate('fetch("https://example.invalid/blocked").then(()=>false,()=>true)');assert p.evaluate('navigator.serviceWorker.getRegistrations().then(r=>r.length)')==0
  assert not errors,errors;assert all(urlparse(r['url']).hostname==urlparse(p.url).hostname and r['method'] in ['GET','HEAD'] for r in requests),requests
  (OUT/f'{stage}-preview-report.json').write_text(json.dumps({'status':'passed','url':url,'resolvedUrl':p.url,'hostingNoticeShown':notice,'checks':['One theme gallery; duplicate mode controls absent','14 presets in three groups','Vivid theme instantly applies in FA EN HR','Dark theme changes the whole page and editor','Existing real font choice loads','Original local and session data unchanged','New changes use Preview namespace','Account access explains Preview restriction','POST/external fetch and service workers blocked','No external application requests or page errors'],'requests':requests},ensure_ascii=False,indent=2))
 except Exception as e:
  p.screenshot(path=str(OUT/f'{stage}-preview-failure.png'),full_page=True);(OUT/f'{stage}-preview-failure.json').write_text(json.dumps({'error':str(e),'pageErrors':errors,'requests':requests,'body':p.locator('body').inner_text()[:9000]},ensure_ascii=False,indent=2));raise
 finally:context.close();browser.close()
if server:server.shutdown()
