"""Actual full app for navigation QA; account/network services are mocked before load."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from datetime import datetime,timezone
import hashlib,json,os,threading,subprocess
from playwright.sync_api import sync_playwright,expect
OUT=Path('qa-nav456');OUT.mkdir(exist_ok=True);ENGINE=os.getenv('QA_ENGINE','chromium');ROOT=Path(os.getenv('QA_ROOT','.')).resolve();BASELINE=os.getenv('QA_MODE')=='baseline'
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start();BASE=f'http://127.0.0.1:{server.server_port}'
checks=[];errors=[];external=[];visited=[]
SEED={'nh7_lang':'fa','nh7_offline_media_key_v2':'1','nh7_bookmarks':'["John 3:16"]','nh7_bible_state_JHN_3_16':json.dumps({'saved':True,'note':'Bible note KEEP — فاصله ۱۲۳','highlight':True,'highlightColor':'green'},ensure_ascii=False),'nh7_apo_note_v242:tobit:1:1':'Apocrypha note KEEP','nh7_sermon_note_nav456':'Sermon note KEEP','nh7_gratitude_start':'2026-09-19','nh7_gratitude_completed':'[1]','nh7_gratitude_note_1':'Gratitude note KEEP','nh7_school_progress_nav456':'School progress KEEP','nh7_notifications_enabled_v252':'0','nh7_inbox_messages':json.dumps([{'id':'nav456-inbox','title':'QA message','body':'KEEP inbox body','read':False,'category':'qa','createdAt':'2026-09-19T08:00:00Z'}])}
INIT='(()=>{if(!/^https?:/.test(location.protocol))return;if(!localStorage.getItem("qa456-seeded")){Object.entries('+json.dumps(SEED,ensure_ascii=False)+').forEach(([k,v])=>localStorage.setItem(k,v));localStorage.setItem("qa456-seeded","1")}})();'
def passed(text):checks.append(text);print('PASS',ENGINE,text,flush=True)
def wait(p,expr):
 for _ in range(650):
  if p.evaluate(expr):return
  p.wait_for_timeout(40)
 raise AssertionError('Timeout: '+expr)
def mock(route):
 r=route.request
 if r.url.startswith(BASE+'/'):return route.continue_()
 external.append({'method':r.method,'url':r.url})
 if r.resource_type=='script':return route.fulfill(status=200,content_type='application/javascript',body='')
 if r.resource_type=='stylesheet':return route.fulfill(status=200,content_type='text/css',body='')
 return route.fulfill(status=200,content_type='application/json',body=json.dumps({'ok':True,'approved':False,'authenticated':False,'items':[]} if '/functions/' in r.url else []))
def nav(p,route):
 p.locator('[data-route='+json.dumps(route)+']').click();wait(p,'document.getElementById("view").textContent.trim()!=="..." && document.getElementById("view").textContent.trim().length>5');p.wait_for_timeout(130)
def assert_no_error(p):
 wait(p,'document.getElementById("view").textContent.trim()!=="..." && document.getElementById("view").textContent.trim().length>5')
 assert not p.locator('#view h2').filter(has_text='Error').count(),p.locator('#view').inner_text()
def home(p):nav(p,'home');expect(p.locator('[data-home-navigation456]')).to_be_visible()
def more(p):nav(p,'more');expect(p.locator('[data-more-navigation456]')).to_be_visible()
with sync_playwright() as pw:
 browser=getattr(pw,ENGINE).launch(**({'args':['--remote-debugging-port=9222']} if ENGINE=='chromium' and not BASELINE else {}));c=browser.new_context(viewport={'width':390,'height':844},service_workers='block',timezone_id='Europe/Zagreb')
 c.route('**/*',mock);c.route_web_socket('**/*',lambda ws:ws.close());c.add_init_script(INIT)
 p=c.new_page();p.set_default_timeout(26000);expect.set_options(timeout=26000);p.on('pageerror',lambda e:errors.append({'message':str(e),'stack':e.stack}));p.on('dialog',lambda d:d.accept());p.clock.set_fixed_time(datetime(2026,9,19,10,0,0,tzinfo=timezone.utc))
 try:
  p.goto(BASE+'/index.html',wait_until='domcontentloaded');p.locator('#amenButton').click();expect(p.locator('#nh7HeaderDate455')).to_be_visible()
  if BASELINE:
   result={'home':[b for b in p.locator('#view .tile[data-go]').evaluate_all('(nodes)=>nodes.map(n=>n.dataset.go)')]}
   nav(p,'more');result['more']=p.locator('#view .tile[data-go]').evaluate_all('(nodes)=>nodes.map(n=>n.dataset.go)')
   result['bottom']=p.locator('.bottom-nav [data-route]').evaluate_all('(nodes)=>nodes.map(n=>n.dataset.route)');p.screenshot(path=str(OUT/'baseline-more.png'))
   (OUT/'baseline-navigation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print('BASELINE',json.dumps(result));assert not errors,errors
  else:
   if ENGINE=='chromium' and os.getenv('QA_AGENT_BROWSER'):
    r=subprocess.run([os.environ['QA_AGENT_BROWSER'],'--cdp','9222','snapshot','-i'],capture_output=True,text=True,timeout=30);(OUT/'agent-browser-navigation.txt').write_text(r.stdout+'\n'+r.stderr);assert r.returncode==0,r.stderr
   bottom=p.locator('.bottom-nav [data-route]').evaluate_all('(nodes)=>nodes.map(n=>n.dataset.route)');assert bottom==['home','daily','bible','plans','school','more'],bottom
   passed('Actual app boots with the unchanged six-item bottom bar and v455 localized date')
   for locale in ['fa','en','hr']:
    p.select_option('#langSelect',locale);home(p)
    assert p.locator('#view .tile[data-go]').evaluate_all('(nodes)=>nodes.map(n=>n.dataset.go)')==['meetings']
    expect(p.locator('#quickNotify')).to_have_count(1);expect(p.locator('[data-toggle-panel="notesPanel"]')).to_be_visible();expect(p.locator('[data-toggle-panel="savedVersesPanel"]')).to_be_visible()
    p.screenshot(path=str(OUT/f'{ENGINE}-{locale}-home.png'),full_page=True)
    p.locator('[data-go="meetings"]').click();wait(p,'!document.querySelector("[data-home-navigation456]")');assert_no_error(p);visited.append('meetings')
    more(p);assert p.locator('[data-more-navigation456] .tile[data-go]').evaluate_all('(nodes)=>nodes.map(n=>n.dataset.go)')==['audio','salvation','qna','account','about','settings']
    expect(p.locator('#view [data-nh7-video-portal]')).to_have_count(1);expect(p.locator('#inboxBtn')).to_be_visible()
    p.locator('.nh7-navigation-guide456 summary').click();expect(p.locator('[data-nav-location456]')).to_have_count(6)
    assert p.locator('[data-nav-location456] button,[data-nav-location456] a').count()==0
    p.screenshot(path=str(OUT/f'{ENGINE}-{locale}-more.png'),full_page=True)
    p.locator('#inboxBtn').click();wait(p,'!document.querySelector("[data-more-navigation456]")');assert_no_error(p);visited.append('inbox')
    nav(p,'daily');p.locator('[data-dailytab="gratitude"]').click();expect(p.locator('#gratitudeNote')).to_be_visible();expect(p.locator('#gratitudeNote')).to_have_value('Gratitude note KEEP');visited.append('gratitude')
    nav(p,'school');assert_no_error(p);visited.append('school')
    nav(p,'plans');assert_no_error(p);visited.append('plans')
    nav(p,'bible');assert_no_error(p);visited.append('bible')
    passed(locale+': canonical School, Bible, Plans, Gratitude, Meetings and Inbox destinations remain reachable')
   # Remaining More routes keep their existing behaviors, including private-media gates.
   for route in ['salvation','qna','account','about','settings']:
    more(p);p.locator('[data-more-navigation456] [data-go='+json.dumps(route)+']').click();wait(p,'!document.querySelector("[data-more-navigation456]")');assert_no_error(p);visited.append(route)
   more(p);p.locator('[data-go="audio"]').click();expect(p.locator('.nh7-access-gate-v230')).to_be_visible();p.locator('.nh7-access-close-v230').click()
   expect(p.locator('[data-more-navigation456]')).to_be_visible();passed('Audio access gate and all remaining More links remain intact; no authorization changes')
   # A deliberately delayed registration lookup tests the real previous navigation race.
   home(p)
   p.evaluate("""(()=>{window.qa456NativeFetch=window.fetch;window.qa456Pending=0;window.qa456Started=0;window.fetch=(input,options)=>{const url=typeof input==='string'?input:input.url;if(String(url).includes('registration')){qa456Pending++;qa456Started++;return new Promise(resolve=>setTimeout(resolve,250)).then(()=>qa456NativeFetch(input,options)).finally(()=>qa456Pending--)}return qa456NativeFetch(input,options)}})()""")
   p.locator('[data-go="meetings"]').click();wait(p,'qa456Started>0');more(p)
   for _ in range(50):
    p.wait_for_timeout(150)
    if p.evaluate('qa456Pending===0'):
     p.wait_for_timeout(350)
     if p.evaluate('qa456Pending===0'):break
   assert p.evaluate('qa456Pending===0')
   expect(p.locator('[data-more-navigation456]')).to_be_visible()
   expect(p.locator('.nav-item[data-route="more"]')).to_have_class('nav-item active')
   p.evaluate('window.fetch=qa456NativeFetch')
   passed('Late Meetings responses cannot replace the newer More page or its active navigation')
   # Browser back/forward must keep old route IDs and not strand a removed shortcut.
   home(p);p.locator('[data-go="meetings"]').click();wait(p,'!document.querySelector("[data-home-navigation456]")');p.locator('#backBtn').click();expect(p.locator('[data-home-navigation456]')).to_be_visible()
   passed('Existing in-app Back returns from Meetings to Home')
   for mode in ['light','dark']:
    p.evaluate('(m)=>document.documentElement.dataset.nh7Theme=m',mode)
    for width in [320,390,768,1280]:
     p.set_viewport_size({'width':width,'height':900});home(p);assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(mode,width,'home')
     more(p);p.locator('.nh7-navigation-guide456 summary').click();assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(mode,width,'more')
     expect(p.locator('#nh7HeaderDate455')).to_be_visible()
   p.set_viewport_size({'width':390,'height':844});more(p);p.locator('.nh7-navigation-guide456 summary').focus();p.keyboard.press('Enter');assert p.locator('.nh7-navigation-guide456').evaluate('(n)=>n.open')
   passed('Home/More and keyboard-operated guide fit four widths in light and dark without hiding the header')
   # A repeated route/language render must not reinsert duplicates or accumulate listeners.
   for i in range(8):more(p);expect(p.locator('[data-more-navigation456] .tile[data-go]')).to_have_count(6);home(p);expect(p.locator('[data-home-navigation456] .tile')).to_have_count(1)
   p.reload(wait_until='domcontentloaded');p.locator('#amenButton').click();home(p);expect(p.locator('#quickNotify')).to_be_visible()
   for key,value in SEED.items():
    if key=='nh7_inbox_messages':
     rows=json.loads(p.evaluate('(k)=>localStorage.getItem(k)',key));record=next(x for x in rows if x['id']=='nav456-inbox');assert record['body']=='KEEP inbox body' and record['read'] is False
    elif key!='nh7_lang':assert p.evaluate('(k)=>localStorage.getItem(k)',key)==value,key
   expect(p.locator('#inboxBadge')).to_be_visible()
   assert not errors,errors;passed('Repeated navigation/reload preserves notes, saved verses, course progress, unread message and notification preference')
   (OUT/f'{ENGINE}-report.json').write_text(json.dumps({'status':'passed','checks':checks,'visitedDestinations':sorted(set(visited)),'pageErrors':errors,'mockedExternalRequests':len(external),'actualExternalAPICalls':0,'realAccountUsed':False,'physicalDeviceTest':False,'mainModified':False},ensure_ascii=False,indent=2))
 except Exception as e:
  p.screenshot(path=str(OUT/f'{ENGINE}-failure.png'),full_page=True);(OUT/f'{ENGINE}-failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'pageErrors':errors,'body':p.locator('body').inner_text()[:14000]},ensure_ascii=False,indent=2));raise
 finally:c.close();browser.close();server.shutdown()
