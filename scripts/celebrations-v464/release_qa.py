import functools, http.server, json, re, subprocess, threading
from pathlib import Path
from datetime import datetime
from playwright.sync_api import sync_playwright
ROOT=Path.cwd();OUT=ROOT/'qa-output';OUT.mkdir(exist_ok=True)
BASE='2df1fabd295a0b2de2eaf1486e41c41242a4c52f'
js=Path('js/nh7-celebrations-v464.js').read_text()
assert 'innerHTML' not in js and 'fetch(' not in js and 'previewEvent' not in js
assert 'localStorage.removeItem' not in js and 'deleteDatabase' not in js
css=Path('css/nh7-celebrations-v464.css').read_text();assert 'var(--i)%2' not in css
for p in ['js/app.js','js/nh7-school-path-v351.js','js/nh7-audio-classic-v400.js','js/nh7-audio-route-stability-v423.js','js/nh7-theme-studio-v453.js','manifest.json']:
 assert Path(p).read_bytes()==subprocess.check_output(['git','show',BASE+':'+p]),p
for p in ['js/nh7-celebrations-v464.js','service-worker.js','sw-release-core-v403.js']:
 subprocess.run(['node','--check',p],check=True)
idx=Path('index.html').read_text();links='\n'.join(re.findall(r'<link[^>]+rel="stylesheet"[^>]*>',idx))
html='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#1858a4">'''+links+'''<body><div id="amenGate" class="hidden" hidden></div><div id="appShell" class="app-shell"><header class="topbar nh7-header-date455"><div class="brand"><strong>New Hope 7</strong></div><select id="langSelect"><option>en</option><option>fa</option><option>hr</option></select><div class="nh7-header-date-row455"><time id="nh7HeaderDate455"></time></div></header><main id="view" class="view"><section class="card"><h2>New Hope 7</h2><button id="source">Open</button><textarea id="draft">draft preserved</textarea></section></main></div><script src="js/nh7-theme-studio-v453.js"></script><script src="js/nh7-header-date-v455.js"></script><script src="js/nh7-celebrations-v464.js"></script></body></html>'''
Path('.qa-celebrations.html').write_text(html)
Path('.qa-celebrations-minimal.html').write_text(html.replace('<script src="js/nh7-theme-studio-v453.js"></script>','').replace('<script src="js/nh7-header-date-v455.js"></script>',''))
# Existing styles import Google fonts; provide empty CSS offline, not real requests.
# Bundled font files and all actual app styles still load from localhost unchanged.
legacy_font_urls=set()
for file in subprocess.check_output(['git','ls-tree','-r','--name-only',BASE,'css/'],text=True).splitlines():
 if file.endswith('.css'):
  source=subprocess.check_output(['git','show',BASE+':'+file],text=True)
  legacy_font_urls.update(re.findall(r'https://fonts\.googleapis\.com/[^\s\"\'\)]+',source))
font_stubs=set()
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start();origin=f'http://127.0.0.1:{server.server_port}'
KEY='nh7_user_session_v170'
protected={'nh7_bookmarks':'["John 3:16"]','nh7_note_fixture':'یادداشت محفوظ','nh7_audio_media_v397:fixture':'{"downloaded":true}','nh7_gamification':'{"points":57,"badges":["first_verse"]}','nh7_school_snapshot_fixture':'{"assignments":[{"status":"approved"}]}'}
def seed(language='en',dob='1980-09-19',user='one',name='Friend'):
 return {**protected,'nh7_lang':language,KEY:json.dumps({'access_token':'synthetic-offline-only','user':{'id':user,'email':user+'@example.invalid'}}),'nh7_school_access':json.dumps({'email':user+'@example.invalid','firstName':name,'birthDate':dob,'status':'approved'})}
results=[];failures=[]
def record(name,fn):
 try:fn();results.append(name);print('PASS',name,flush=True)
 except Exception as e:failures.append({'name':name,'error':str(e)});print('FAIL',name,str(e),flush=True)
def set_date(page,iso):page.evaluate('(iso)=>{window.__qaNow=Date.parse(iso)}',iso)
with sync_playwright() as pw:
 for engine in ['chromium','webkit']:
  browser=getattr(pw,engine).launch(headless=True)
  def session(values=None,when='2026-09-19T12:00:00Z',lang='en',reduced='no-preference',zone='Europe/Zagreb',minimal=False):
   ctx=browser.new_context(viewport={'width':390,'height':844},locale=lang,timezone_id=zone,reduced_motion=reduced,service_workers='block')
   errors=[];external=[];page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
   def route(r):
    if r.request.url.startswith(origin):r.continue_()
    elif r.request.resource_type=='stylesheet' and r.request.url in legacy_font_urls:
     font_stubs.add(r.request.url);r.fulfill(status=200,content_type='text/css',body='/* offline baseline-font fixture */')
    else:external.append(r.request.url);r.abort()
   ctx.route('**/*',route)
   ms=int(datetime.fromisoformat(when.replace('Z','+00:00')).timestamp()*1000)
   init='window.__qaNow='+str(ms)+';const RealDate=Date;window.Date=class extends RealDate{constructor(...a){super(...(a.length?a:[window.__qaNow]))}static now(){return window.__qaNow}};'
   init+='const v='+json.dumps(values or {})+';for(const [k,x] of Object.entries(v)){localStorage.setItem(k,x)};'
   ctx.add_init_script(init)
   page.goto(origin+('/.qa-celebrations-minimal.html' if minimal else '/.qa-celebrations.html'))
   page.evaluate('document.documentElement.lang=localStorage.getItem("nh7_lang")||"en";document.documentElement.dir=document.documentElement.lang==="fa"?"rtl":"ltr";NH7_CELEBRATIONS_V464.run()')
   return ctx,page,errors,external
  def safe_storage(page):
   vals=page.evaluate('Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))')
   for k,v in protected.items():assert vals[k]==v,k
  def birthdays():
   for language,title in [('fa','تولدت مبارک'),('en','Happy Birthday'),('hr','Sretan rođendan')]:
    v=seed(language);ctx,p,err,ext=session(v,lang=language)
    assert title in p.locator('#nh7CelebrationTitle464').inner_text()
    assert p.locator('.nh7-bday-rocket464').count()==3
    assert p.locator('.nh7-bday-spark464').count()==54
    assert p.locator('.nh7-bday-confetti464').count()==26
    assert p.locator('.nh7-celebration-dialog464').get_attribute('dir')==('rtl' if language=='fa' else 'ltr')
    first=p.locator('.nh7-bday-confetti464').first
    a=first.evaluate('(n)=>getComputedStyle(n).transform');p.wait_for_timeout(900);b=first.evaluate('(n)=>getComputedStyle(n).transform');assert a!=b,(a,b)
    p.screenshot(path=str(OUT/f'{engine}-birthday-{language}.png'))
    p.keyboard.press('Tab');assert p.evaluate('document.activeElement.classList.contains("nh7-celebration-close464")')
    safe_storage(p)
    p.keyboard.press('Escape');assert p.locator('[role=dialog]').count()==0
    p.evaluate('NH7_CELEBRATIONS_V464.run()');p.wait_for_timeout(200);assert p.locator('[role=dialog]').count()==0
    p.reload();p.wait_for_timeout(1100);assert p.locator('[role=dialog]').count()==0
    safe_storage(p);assert p.evaluate('localStorage.getItem("'+KEY+'")')==v[KEY]
    assert not err,err;assert not ext,ext;ctx.close()
  record(engine+': birthday animation, FA/EN/HR, keyboard, once after reload and data preservation',birthdays)
  def identity_tests():
   ctx,p,err,ext=session(seed());p.keyboard.press('Escape')
   p.evaluate('(k)=>localStorage.setItem(k,JSON.stringify({access_token:"synthetic",user:{id:"two",email:"two@example.invalid"}}))',KEY)
   assert p.evaluate('NH7_CELEBRATIONS_V464.birthday()') is None
   p.evaluate('NH7_CELEBRATIONS_V464.run()');assert p.locator('[role=dialog]').count()==0
   p.evaluate('localStorage.setItem("nh7_school_access",JSON.stringify({email:"two@example.invalid",firstName:"<img src=x onerror=alert(1)>",birthDate:"1980-09-19"}));NH7_CELEBRATIONS_V464.run()')
   assert '<img' in p.locator('#nh7CelebrationTitle464').inner_text()
   assert p.locator('.nh7-celebration-dialog464 img').count()==0
   p.evaluate('localStorage.setItem("nh7_explicit_logout","1");NH7_CELEBRATIONS_V464.run()');assert p.locator('[role=dialog]').count()==0
   assert p.evaluate('NH7_CELEBRATIONS_V464.birthday()') is None
   safe_storage(p);assert not err,err;ctx.close()
  record(engine+': shared-device identity, sign-out and literal user-name rendering',identity_tests)
  def themes():
   ctx,p,err,ext=session(seed('fa'),lang='fa')
   presets=p.evaluate('Object.keys(NH7ThemeStudioV453.PRESETS)');assert len(presets)==14
   for language in ['fa','en','hr']:
    for theme in presets:
     ok=p.evaluate('({theme,language})=>{localStorage.setItem("nh7_lang",language);document.documentElement.lang=language;const c={preset:theme,...NH7ThemeStudioV453.PRESETS[theme],fa:"vazirmatn",latin:"inter"};const ok=NH7ThemeStudioV453.set(c);NH7_CELEBRATIONS_V464.run();return ok}',{'theme':theme,'language':language});assert ok,theme
     v=p.locator('.nh7-celebration-dialog464').evaluate('(n)=>({brand:getComputedStyle(n).getPropertyValue("--brand").trim(),color:getComputedStyle(n).color,background:getComputedStyle(n).backgroundImage})')
     wanted=p.evaluate('(t)=>NH7ThemeStudioV453.PRESETS[t].accent',theme);assert v['brand']==wanted,(theme,v)
     assert v['background']!='none',v
    if language=='hr':p.screenshot(path=str(OUT/f'{engine}-aurora-hr.png'))
   for width in [320,390,768,1280]:
    p.set_viewport_size({'width':width,'height':844});b=p.locator('.nh7-celebration-dialog464').bounding_box();assert b['x']>=0 and b['x']+b['width']<=width+1,(width,b)
    close=p.locator('.nh7-celebration-close464').bounding_box();assert close['width']>=44 and close['height']>=44
    assert close['y']<=b['y']+18,(b,close)
   safe_storage(p);assert not err,err;ctx.close()
  record(engine+': 14 real theme palettes x 3 languages and 4 responsive widths',themes)
  def feasts():
   ctx,p,err,ext=session({},when='2026-09-19T12:00:00Z')
   expected={'2026-01-01':'holy_name','2026-01-06':'epiphany','2026-02-18':'ash','2026-03-29':'palm','2026-04-02':'maundy','2026-04-03':'good_friday','2026-04-04':'holy_saturday','2026-04-05':'easter','2026-04-06':'easter_monday','2026-05-14':'ascension','2026-05-24':'pentecost','2026-05-25':'pentecost_monday','2026-11-01':'all_saints','2026-12-24':'christmas_eve','2026-12-25':'christmas','2026-12-26':'stephen'}
   for language in ['fa','en','hr']:
    p.evaluate('(l)=>{localStorage.setItem("nh7_lang",l);document.documentElement.lang=l}',language)
    for day,id in expected.items():
     set_date(p,day+'T12:00:00Z');p.evaluate('NH7_CELEBRATIONS_V464.run()')
     ev=p.evaluate('NH7_CELEBRATIONS_V464.eventFor()');assert ev['id']==id,(day,ev)
     assert len(ev['body'])>35 and ev['verse']
     assert ev['title'] in p.locator('#nh7ChristianToday464').inner_text()
     if p.locator('[role=dialog]').count():p.keyboard.press('Escape')
     p.locator('#nh7ChristianToday464').click();assert ev['body']==p.locator('#nh7CelebrationBody464').inner_text()
     if id=='pentecost':p.screenshot(path=str(OUT/f'{engine}-pentecost-{language}.png'))
     p.keyboard.press('Escape')
   p.evaluate('window.mutations=0;window.mo=new MutationObserver(r=>window.mutations+=r.length);mo.observe(document.querySelector(".nh7-header-date-row455"),{childList:true,subtree:true})')
   p.wait_for_timeout(1400);assert p.evaluate('window.mutations')<10
   assert not err,err;assert not ext,ext;ctx.close()
  record(engine+': 16 feast dates x 3 languages, references, manual reopen, idle header',feasts)
  def calendar_years():
   ctx,p,err,ext=session({})
   dates=p.evaluate('()=>{let out=[];for(let y=2024;y<=2035;y++){const d=NH7_CELEBRATIONS_V464.easter(y);out.push([d.getFullYear(),d.getMonth()+1,d.getDate()])}return out}')
   assert dates==[[2024,3,31],[2025,4,20],[2026,4,5],[2027,3,28],[2028,4,16],[2029,4,1],[2030,4,21],[2031,4,13],[2032,3,28],[2033,4,17],[2034,4,9],[2035,3,25]],dates
   ctx.close()
   for zone,id in [('America/Los_Angeles','christmas_eve'),('Pacific/Auckland','christmas')]:
    ctx,p,err,ext=session({},when='2026-12-25T01:00:00Z',zone=zone);assert p.evaluate('NH7_CELEBRATIONS_V464.eventFor().id')==id;ctx.close()
  record(engine+': Gregorian Easter 2024-2035 and local-date timezone boundary',calendar_years)
  def motion_gate():
   ctx,p,err,ext=session(seed(),reduced='reduce');assert p.locator('[role=dialog]').count()==1 and p.locator('.nh7-bday-effects464').count()==0;ctx.close()
   ctx,p,err,ext=session(seed(),when='2026-09-18T12:00:00Z')
   p.evaluate('const g=document.getElementById("amenGate");g.hidden=false;g.classList.remove("hidden")')
   set_date(p,'2026-09-19T12:00:00Z');p.evaluate('NH7_CELEBRATIONS_V464.run()');assert p.locator('[role=dialog]').count()==0
   p.evaluate('const g=document.getElementById("amenGate");g.hidden=true;g.classList.add("hidden");NH7_CELEBRATIONS_V464.run()');assert p.locator('[role=dialog]').count()==1
   p.wait_for_timeout(5100);assert p.locator('.nh7-bday-effects464').count()==0
   assert not err,err;ctx.close()
  record(engine+': reduced motion, Amen-gate deferral and finite effect cleanup',motion_gate)
  def invalids():
   for dob in ['wrong','1980-02-30','2090-09-19','']:
    ctx,p,err,ext=session(seed(dob=dob));assert p.evaluate('NH7_CELEBRATIONS_V464.birthday()') is None;assert p.locator('[role=dialog]').count()==0;ctx.close()
   ctx,p,err,ext=session(seed(),when='2026-09-18T12:00:00Z',minimal=True)
   p.evaluate('Storage.prototype.getItem=()=>{throw Error("denied")};Storage.prototype.setItem=()=>{throw Error("denied")};NH7_CELEBRATIONS_V464.run()');assert not err,err;ctx.close()
  record(engine+': malformed/future DOB and unavailable local storage',invalids)
  browser.close()
server.shutdown()
report={'baseline':BASE,'passed_groups':len(results),'results':results,'failures':failures,'legacy_google_font_imports_stubbed_offline':sorted(font_stubs),'scope':'Synthetic local-browser data; no production account or Supabase request. Existing external font imports replaced by offline fixture CSS; app CSS and bundled fonts unchanged. Device/store acceptance remains separate.','calendar_source':'https://www.churchofengland.org/prayer-and-worship/worship-texts-and-resources/common-worship/churchs-year/calendar'}
(OUT/'report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
if failures:raise SystemExit(1)
