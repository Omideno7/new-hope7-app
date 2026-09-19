"""Date header in the real app, synthetic storage and mocked external services."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from datetime import datetime,timezone
import json,os,threading,subprocess
from playwright.sync_api import sync_playwright,expect
OUT=Path('qa-date455');OUT.mkdir(exist_ok=True);ENGINE=os.getenv('QA_ENGINE','chromium');LIVE=os.getenv('QA_LIVE_URL','').rstrip('/');errors=[];checks=[];blocked=[]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(Path.cwd())));threading.Thread(target=server.serve_forever,daemon=True).start();BASE=LIVE or f'http://127.0.0.1:{server.server_port}'
seed={'nh7_lang':'fa','nh7_offline_media_key_v2':'1','nh7_bookmarks':'["John 3:16"]','nh7_bible_state_JHN_3_16':json.dumps({'saved':True,'note':'یادداشت قبلی با فاصله ۱۲۳','highlight':True,'highlightColor':'green','extra':'KEEP'},ensure_ascii=False),'nh7_apo_note_v242:tobit:1:1':'Apo note KEEP','nh7_sermon_note_date455':'Sermon note KEEP','nh7_gratitude_note_7':'Gratitude KEEP','nh7_school_progress_date455':'Progress KEEP'}
init='(()=>{if(!/^https?:/.test(location.protocol))return;if(!localStorage.getItem("qa455seed")){Object.entries('+json.dumps(seed,ensure_ascii=False)+').forEach(([k,v])=>localStorage.setItem(k,v));localStorage.setItem("qa455seed","1")}})();'
def passed(text):checks.append(text);print('PASS',ENGINE,text,flush=True)
def wait(p,expr):
 for _ in range(700):
  if p.evaluate(expr):return
  p.wait_for_timeout(30)
 raise AssertionError('Timeout: '+expr)
def mock(route):
 r=route.request
 if r.url.startswith(BASE+'/'):return route.continue_()
 blocked.append({'method':r.method,'url':r.url})
 if r.resource_type=='script':return route.fulfill(status=200,content_type='application/javascript',body='')
 if r.resource_type=='stylesheet':return route.fulfill(status=200,content_type='text/css',body='')
 return route.fulfill(status=200,content_type='application/json',body=json.dumps({'ok':True,'authenticated':False,'approved':False,'items':[]} if '/functions/' in r.url else []))
with sync_playwright() as pw:
 browser=getattr(pw,ENGINE).launch(**({'args':['--remote-debugging-port=9222']} if ENGINE=='chromium' and not LIVE else {}))
 context=browser.new_context(viewport={'width':390,'height':844},timezone_id='Europe/Zagreb',service_workers='block');context.route('**/*',mock);context.route_web_socket('**/*',lambda ws:ws.close());context.add_init_script(init)
 page=context.new_page();page.set_default_timeout(30000);expect.set_options(timeout=30000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.clock.set_fixed_time(datetime(2026,9,19,10,0,0,tzinfo=timezone.utc))
 try:
  response=page.goto(BASE+'/index.html',wait_until='domcontentloaded');assert response.status==200
  page.locator('#amenButton').click();expect(page.locator('#nh7HeaderDate455')).to_be_visible()
  wait(page,'!!window.NH7ThemeStudioV453 && !!window.NH7FontsV454')
  date=page.locator('#nh7HeaderDate455');expect(date).to_have_text('شنبه، ۲۸ شهریور ۱۴۰۵');expect(date).to_have_attribute('datetime','2026-09-19');expect(date).to_have_attribute('data-calendar','persian')
  assert not page.evaluate('!!window.NH7_STUDY_PREVIEW');passed('Real app entry shows Persian weekday and Solar Hijri date with Persian digits on first open')
  if ENGINE=='chromium' and not LIVE and os.getenv('QA_AGENT_BROWSER'):
   r=subprocess.run([os.environ['QA_AGENT_BROWSER'],'--cdp','9222','snapshot','-i'],capture_output=True,text=True,timeout=30);(OUT/'agent-browser-header.txt').write_text(r.stdout+'\n'+r.stderr);assert r.returncode==0,r.stderr
  for language,word in [('en','Saturday, 19 September 2026'),('hr','subota, 19. rujna 2026.'),('fa','شنبه، ۲۸ شهریور ۱۴۰۵')]:
   page.select_option('#langSelect',language);expect(date).to_have_text(word);expect(date).to_have_attribute('lang',language);expect(date).to_have_attribute('dir','rtl' if language=='fa' else 'ltr');assert page.locator('#nh7HeaderDate455').count()==1
   passed(language+': language selection updates calendar, weekday, month and direction immediately')
  # Repainting only the date must not replace view, audio, selection or form nodes.
  page.evaluate('window.qaDateView=document.getElementById("view");window.qaDateHeader=document.querySelector("header.topbar");window.qaDateStorage=Object.fromEntries(Object.entries(localStorage))')
  page.clock.set_fixed_time(datetime(2026,9,20,0,0,1,tzinfo=timezone.utc));page.evaluate('window.dispatchEvent(new Event("focus"))');expect(date).to_have_text('یکشنبه، ۲۹ شهریور ۱۴۰۵')
  assert page.evaluate('qaDateView===document.getElementById("view") && qaDateHeader===document.querySelector("header.topbar")')
  assert page.evaluate('JSON.stringify(qaDateStorage)===JSON.stringify(Object.fromEntries(Object.entries(localStorage)))')
  page.clock.set_fixed_time(datetime(2026,3,21,10,0,0,tzinfo=timezone.utc));page.evaluate('window.dispatchEvent(new Event("pageshow"))');expect(date).to_have_text('شنبه، ۱ فروردین ۱۴۰۵')
  passed('Resume and restored page refresh the date including Nowruz without replacing the view or writing storage')
  page.clock.set_fixed_time(datetime(2026,9,19,10,0,0,tzinfo=timezone.utc));page.evaluate('NH7HeaderDateV455.refresh()')
  for mode in ['light','dark']:
   page.evaluate('(mode)=>{document.documentElement.dataset.nh7Theme=mode}',mode)
   for language in ['fa','en','hr']:
    page.select_option('#langSelect',language);expect(date).to_have_attribute('lang',language)
    for size in ['90','100','110','120']:
     page.evaluate('(size)=>document.documentElement.style.fontSize=size+"%"',size)
     for width in [320,390,768]:
      page.set_viewport_size({'width':width,'height':844});page.wait_for_timeout(35)
      assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(mode,language,size,width)
      header=page.locator('.topbar').bounding_box();box=date.bounding_box();assert box and header and box['x']>=0 and box['x']+box['width']<=width+1 and box['y']>=header['y'] and box['y']+box['height']<=header['y']+header['height']+1
      assert date.evaluate('(n)=>n.scrollWidth<=n.clientWidth+1')
      expect(page.locator('#langSelect')).to_be_visible();expect(page.locator('#inboxBtn')).to_be_visible()
   page.evaluate('document.documentElement.style.fontSize="100%"');page.set_viewport_size({'width':390,'height':844});page.select_option('#langSelect','fa');page.screenshot(path=str(OUT/f'{ENGINE}-header-{mode}.png'))
  passed('Date and existing controls fit 320/390/768 widths, three languages and 90–120% text in light/dark')
  for preset in ['hope','ocean','forest','royal','sand','rose','midnight','sepia']:
   assert page.evaluate('(id)=>NH7ThemeStudioV453.set({...NH7ThemeStudioV453.PRESETS[id],preset:id,fa:"system",latin:"system"})',preset)
   expected=page.evaluate('NH7ThemeStudioV453.get().text');color=date.evaluate('(n)=>getComputedStyle(n).color')
   assert color==f'rgb({int(expected[1:3],16)}, {int(expected[3:5],16)}, {int(expected[5:7],16)})',(preset,color,expected)
  assert page.evaluate('NH7FontsV454.choose("fa","naskh")');assert 'NH7 Noto Naskh' in date.evaluate('(n)=>getComputedStyle(n).fontFamily')
  page.screenshot(path=str(OUT/f'{ENGINE}-header-sepia-font.png'));passed('Header date follows all eight custom palettes and the actual selected Persian font')
  for route in ['daily','plans','school','more','bible','home']:
   page.locator('[data-route='+json.dumps(route)+']').click();expect(date).to_be_visible();assert page.locator('#nh7HeaderDate455').count()==1;page.wait_for_timeout(100)
  page.locator('[data-route="more"]').click();page.locator('[data-go="settings"]').click();page.select_option('#settingsLang','hr');expect(date).to_contain_text('rujna')
  page.reload(wait_until='domcontentloaded');page.locator('#amenButton').click();expect(date).to_contain_text('rujna');expect(date).to_have_attribute('lang','hr')
  passed('All primary routes, Settings language selector and reload retain one correctly localized date')
  for key,value in seed.items():
   if key!='nh7_lang':assert page.evaluate('(k)=>localStorage.getItem(k)',key)==value,key
  assert not errors,errors;passed('Old synthetic Bible, Apocrypha, sermon, gratitude and school data unchanged; no uncaught errors')
  # Independent browser contexts verify the host/device date instead of forcing Zagreb globally.
  for zone,iso in [('America/Los_Angeles','2026-09-18'),('Pacific/Kiritimati','2026-09-19')]:
   c=browser.new_context(timezone_id=zone,service_workers='block');c.route('**/*',mock);c.add_init_script(init);p=c.new_page();p.clock.set_fixed_time(datetime(2026,9,19,0,30,tzinfo=timezone.utc));p.goto(BASE+'/index.html',wait_until='domcontentloaded');p.locator('#amenButton').click();expect(p.locator('#nh7HeaderDate455')).to_have_attribute('datetime',iso);c.close()
  passed('Actual browser contexts show different local dates for Los Angeles and Kiritimati at the same instant')
  report={'status':'passed','engine':ENGINE,'entry':BASE+'/index.html','checks':checks,'pageErrors':errors,'realAccountUsed':False,'actualExternalAPIRequests':0,'mockedExternalRequests':len(blocked),'dateModuleStorageWrites':0,'nativeDeviceTest':False}
  (OUT/f'{ENGINE}-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 except Exception as error:
  page.screenshot(path=str(OUT/f'{ENGINE}-failure.png'),full_page=True);(OUT/f'{ENGINE}-failure.json').write_text(json.dumps({'error':str(error),'checks':checks,'pageErrors':errors,'body':page.locator('body').inner_text()[:9000]},ensure_ascii=False,indent=2));raise
 finally:context.close();browser.close();server.shutdown()
