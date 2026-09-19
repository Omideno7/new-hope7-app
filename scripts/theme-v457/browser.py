"""Actual full app; synthetic storage; all external account/media requests mocked."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
import json,os,subprocess,threading
from playwright.sync_api import sync_playwright,expect
OUT=Path('qa-theme457');OUT.mkdir(exist_ok=True);ENGINE=os.getenv('QA_ENGINE','chromium');ROOT=Path(os.getenv('QA_ROOT','.')).resolve();BASELINE=os.getenv('QA_MODE')=='baseline'
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start();BASE=f'http://127.0.0.1:{server.server_port}'
checks=[];errors=[];external=[]
OCEAN={'preset':'ocean','bg':'#e8f5f7','card':'#fbffff','text':'#103e49','muted':'#49666c','verse':'#143d49','accent':'#006b83','fa':'naskh','latin':'lora'}
SEED={'nh7_lang':'fa','nh7_ui_theme_v425':'dark','nh7_ui_font_size_v425':'100','nh7_reader_fonts_v454':'{"fa":"naskh","latin":"lora"}','nh7_ui_font_family_v425':'naskh','nh7_theme_studio_v453':json.dumps(OCEAN),'nh7_theme_library_v453':json.dumps([{'id':'existing-theme457','name':'My old theme','config':OCEAN}]),'nh7_bookmarks':'["John 3:16"]','nh7_bible_state_JHN_3_16':json.dumps({'saved':True,'note':'یادداشت با فاصله ۱۲۳ KEEP','highlight':False,'extra':'KEEP'},ensure_ascii=False),'nh7_apo_note_v242:tobit:1:1':'Apocrypha KEEP','nh7_sermon_note_theme457':'Sermon KEEP','nh7_gratitude_note_7':'Gratitude KEEP','nh7_school_progress_theme457':'Progress KEEP','nh7_notifications_enabled_v252':'0','nh7_offline_media_key_v2':'1'}
INIT='(()=>{if(!/^https?:/.test(location.protocol))return;if(!localStorage.getItem("qa457seed")){Object.entries('+json.dumps(SEED,ensure_ascii=False)+').forEach(([k,v])=>localStorage.setItem(k,v));localStorage.setItem("qa457seed","1")}})();'
GROUPS={'vivid':['sapphire','emerald','sunset','orchid','berry'],'soft':['hope','ocean','forest','royal','sand','rose','sepia'],'dark':['midnight','aurora']}
def passed(s):checks.append(s);print('PASS',ENGINE,s,flush=True)
def wait(p,expr):
 for _ in range(700):
  if p.evaluate(expr):return
  p.wait_for_timeout(30)
 raise AssertionError('Timeout: '+expr)
def mock(route):
 r=route.request
 if r.url.startswith(BASE+'/'):return route.continue_()
 external.append({'method':r.method,'url':r.url})
 if r.resource_type=='script':return route.fulfill(status=200,content_type='application/javascript',body='')
 if r.resource_type=='stylesheet':return route.fulfill(status=200,content_type='text/css',body='')
 return route.fulfill(status=200,content_type='application/json',body=json.dumps({'ok':True,'approved':False,'authenticated':False,'items':[]} if '/functions/' in r.url else []))
def settings(p):p.locator('[data-route="more"]').click();p.locator('[data-go="settings"]').click();expect(p.locator('#nh7ThemeStudio453')).to_be_visible();expect(p.locator('#nh7FontSelect')).to_be_attached()
def theme(p,id):
 group=next(g for g,ids in GROUPS.items() if id in ids);p.locator('[data-theme-group457="'+group+'"]').click();p.locator('[data-studio-preset453="'+id+'"]').click();wait(p,'NH7ThemeStudioV453.get().preset==='+json.dumps(id));expect(p.locator('[data-studio-preset453="'+id+'"]').first).to_have_attribute('aria-pressed','true')
def raw(p,k):return p.evaluate('(k)=>localStorage.getItem(k)',k)
def color_check(p,selectors):
 result=p.evaluate('''selectors=>{
  const hex=x=>{const a=x.match(/[\\d.]+/g)||[];return a.length>=3?'#'+a.slice(0,3).map(v=>Math.round(Number(v)).toString(16).padStart(2,'0')).join(''):null};
  const out=[];for(const selector of selectors){const n=document.querySelector(selector);if(!n)throw Error('Missing color node '+selector);let bg=null,node=n;while(node){const c=getComputedStyle(node).backgroundColor;if(c!=='rgba(0, 0, 0, 0)'&&c!=='transparent'){bg=hex(c);break}node=node.parentElement}const fg=hex(getComputedStyle(n).color);out.push({selector,fg,bg,ratio:fg&&bg?NH7ThemeStudioV453.contrast(fg,bg):0})}return out;
 }''',selectors)
 assert all(x['ratio']>=4.5 for x in result),result
 return result
with sync_playwright() as pw:
 browser=getattr(pw,ENGINE).launch(**({'args':['--remote-debugging-port=9222']} if ENGINE=='chromium' and not BASELINE else {}));c=browser.new_context(viewport={'width':390,'height':844},service_workers='block',color_scheme='dark');c.route('**/*',mock);c.route_web_socket('**/*',lambda ws:ws.close());c.add_init_script(INIT)
 p=c.new_page();p.set_default_timeout(30000);expect.set_options(timeout=30000);p.on('pageerror',lambda e:errors.append({'message':str(e),'stack':e.stack}));p.on('dialog',lambda d:d.accept())
 try:
  p.goto(BASE+'/index.html',wait_until='domcontentloaded');p.locator('#amenButton').click();settings(p)
  if BASELINE:
   expect(p.locator('#nh7ThemeSelect')).to_have_value('dark');assert p.evaluate('getComputedStyle(document.body).backgroundColor')=='rgb(232, 245, 247)'
   p.locator('#nh7AppearancePanel').screenshot(path=str(OUT/'baseline-dark-selected-light-page.png'))
   (OUT/'baseline-report.json').write_text(json.dumps({'status':'reproduced','selectedOldMode':'dark','appliedStudioTheme':'ocean','lightBackground':'rgb(232, 245, 247)','cause':'stored custom palette overrides legacy base-mode control'},indent=2))
  else:
   if ENGINE=='chromium' and os.getenv('QA_AGENT_BROWSER'):
    r=subprocess.run([os.environ['QA_AGENT_BROWSER'],'--cdp','9222','snapshot','-i'],capture_output=True,text=True,timeout=30);(OUT/'agent-browser-theme.txt').write_text(r.stdout+'\n'+r.stderr);assert r.returncode==0,r.stderr
   expect(p.locator('#nh7ThemeSelect,[data-nh7-theme-quick],.nh7-theme-quick-wrap')).to_have_count(0)
   assert p.evaluate('document.getElementById("nh7ThemeStudio453").compareDocumentPosition(document.getElementById("nh7AppearancePanel"))&Node.DOCUMENT_POSITION_FOLLOWING')
   assert raw(p,'nh7_theme_studio_v453')==SEED['nh7_theme_studio_v453'] and raw(p,'nh7_ui_theme_v425')=='dark'
   assert raw(p,'nh7_reader_fonts_v454')==SEED['nh7_reader_fonts_v454'] and raw(p,'nh7_theme_library_v453')==SEED['nh7_theme_library_v453']
   expect(p.locator('#nh7AccentSelect option')).to_have_count(8);expect(p.locator('#nh7TextSizeSelect option')).to_have_count(4);expect(p.locator('#nh7FontSelect option[value="naskh"]')).to_have_count(1)
   passed('Duplicate mode controls removed, gallery placed first, all prior color/font/size choices and stored preferences preserved')
   assert p.evaluate('Object.keys(NH7ThemeStudioV453.PRESETS).length')==14
   assert p.evaluate('Object.values(NH7ThemeStudioV453.PRESETS).every(p=>NH7ThemeStudioV453.validate({...p,preset:"custom",fa:"system",latin:"system"}).ok)')
   contrast=[]
   for locale in ['fa','en','hr']:
    p.select_option('#langSelect',locale);expect(p.locator('#nh7ThemeStudio453')).to_have_attribute('dir','rtl' if locale=='fa' else 'ltr')
    for group,ids in GROUPS.items():
     p.locator('[data-theme-group457="'+group+'"]').click();expect(p.locator('.nh7-studio-presets453:visible')).to_have_count(1)
     for id in ids:
      theme(p,id);value=p.evaluate('NH7ThemeStudioV453.get()');expected=value['bg'];assert p.evaluate('getComputedStyle(document.body).backgroundColor')==f'rgb({int(expected[1:3],16)}, {int(expected[3:5],16)}, {int(expected[5:7],16)})'
      assert p.evaluate('document.documentElement.style.colorScheme')==('dark' if group=='dark' else 'light')
      assert p.evaluate('NH7FontsV454.choice("fa")')=='naskh' and p.evaluate('NH7FontsV454.choice("latin")')=='lora'
      contrast+=color_check(p,['#nh7ThemeStudio453 header h3','#nh7ThemeStudio453 header p','#nh7StudioCurrent457','[data-theme-group457][aria-selected="true"]','#nh7AppearancePanel h3','#nh7FontSelect','#nh7HeaderDate455'])
      assert raw(p,'nh7_ui_theme_v425')=='dark'
    passed(locale+': all 14 themes apply on one tap, match actual background and keep controls/date readable with prior fonts')
   # Named old theme remains usable from the retained personal library.
   library=p.locator('#nh7ThemeStudio453 details').last;library.locator('summary').click();p.locator('[data-studio-load453="existing-theme457"]').click();wait(p,'NH7ThemeStudioV453.get().preset==="ocean"')
   assert raw(p,'nh7_theme_library_v453')==SEED['nh7_theme_library_v453'];passed('Previously saved named theme loads without migration or deletion')
   # The existing accent picker now updates the active Studio palette instead of silently losing.
   p.select_option('#nh7AccentSelect','pink');wait(p,'NH7ThemeStudioV453.get().accent==="#be185d"');expect(p.locator('#nh7AccentSelect')).to_have_value('pink')
   color_check(p,['#nh7ThemeStudio453 header p','#nh7FontSelect']);passed('Existing module-accent control affects the active palette and stays synchronized')
   # Draft editing remains separate from an applied preset; unreadable choices cannot be saved.
   p.locator('.nh7-studio-custom453 summary').click();saved=raw(p,'nh7_theme_studio_v453')
   for field in ['bg','card','text']:
    p.locator('[data-studio-color453="'+field+'"]').evaluate('(n)=>{n.value="#ffffff";n.dispatchEvent(new Event("input",{bubbles:true}))}')
   expect(p.locator('[data-studio-apply453]')).to_be_disabled();assert raw(p,'nh7_theme_studio_v453')==saved
   p.locator('[data-studio-auto453]').click();expect(p.locator('[data-studio-apply453]')).to_be_enabled();p.locator('[data-studio-apply453]').click();assert p.evaluate('NH7ThemeStudioV453.validate(NH7ThemeStudioV453.get()).ok')
   passed('Low-contrast custom draft cannot overwrite current theme; automatic contrast repair works')
   for locale in ['fa','en','hr']:
    p.select_option('#langSelect',locale);theme(p,'emerald')
    p.locator('[data-theme-group457="vivid"]').focus();p.keyboard.press('End');expect(p.locator('[data-theme-group457="dark"]')).to_have_attribute('aria-selected','true');p.keyboard.press('Home');expect(p.locator('[data-theme-group457="vivid"]')).to_have_attribute('aria-selected','true')
    for width in [320,390,768,1280]:
     p.set_viewport_size({'width':width,'height':844});p.wait_for_timeout(50);assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(locale,width)
    p.set_viewport_size({'width':390,'height':844});p.locator('#nh7ThemeStudio453').scroll_into_view_if_needed();p.screenshot(path=str(OUT/f'{ENGINE}-{locale}-gallery.png'))
   passed('Grouped picker supports keyboard navigation, RTL, Croatian and four viewport widths')
   p.select_option('#langSelect','fa')
   for id in ['sapphire','emerald','sunset','orchid','berry','aurora','midnight']:
    theme(p,id);p.locator('[data-route="home"]').click();expect(p.locator('#nh7HeaderDate455')).to_be_visible();p.wait_for_timeout(150)
    p.screenshot(path=str(OUT/f'{ENGINE}-home-{id}.png'),full_page=True)
    color_check(p,['.bottom-nav .nav-item.active','.bottom-nav .nav-item.active small','.topbar .brand strong','#nh7HeaderDate455'])
    settings(p)
   theme(p,'aurora');p.reload(wait_until='domcontentloaded');p.locator('#amenButton').click();settings(p);wait(p,'NH7ThemeStudioV453.get().preset==="aurora"');assert p.evaluate('document.documentElement.style.colorScheme')=='dark';p.screenshot(path=str(OUT/f'{ENGINE}-dark-editor.png'))
   p.locator('[data-studio-reset453]').click();wait(p,'!document.documentElement.dataset.nh7Studio');assert raw(p,'nh7_ui_theme_v425')=='dark';assert raw(p,'nh7_theme_library_v453')==SEED['nh7_theme_library_v453']
   for key,value in SEED.items():
    if key.startswith(('nh7_theme_','nh7_ui_','nh7_reader_fonts_')) or key=='nh7_lang':continue
    assert raw(p,key)==value,key
   assert not errors,errors;passed('Dark editor and reload consistent; explicit appearance reset preserves personal library, notes, bookmarks and progress')
   (OUT/f'{ENGINE}-report.json').write_text(json.dumps({'status':'passed','checks':checks,'renderedContrastPairs':contrast,'pageErrors':errors,'realAccountUsed':False,'actualExternalAPICalls':0,'mockedRequests':len(external),'physicalDeviceTest':False},ensure_ascii=False,indent=2))
 except Exception as error:
  p.screenshot(path=str(OUT/f'{ENGINE}-failure.png'),full_page=True);(OUT/f'{ENGINE}-failure.json').write_text(json.dumps({'error':str(error),'checks':checks,'pageErrors':errors,'body':p.locator('body').inner_text()[:14000]},ensure_ascii=False,indent=2));raise
 finally:c.close();browser.close();server.shutdown()
