from pathlib import Path
import subprocess,re,json,http.server,functools,threading
from playwright.sync_api import sync_playwright
BASE='2bde658268eeaed0e7873c83aa7fb54c1d37fc8f';ROOT=Path.cwd();OUT=ROOT/'qa-store-review-v469';OUT.mkdir(exist_ok=True)
old=lambda p:subprocess.check_output(['git','show',BASE+':'+p],text=True)
s=Path('js/app.js').read_text()
undo=s.replace("import {mountMoreReviewV469} from './nh7-store-review-v469.js?v=4.6.9';\n",'',1).replace("\n  mountMoreReviewV469(view.querySelector('[data-more-navigation456]'),{language:state.lang});",'',1)
assert undo==old('js/app.js'),'Only import and More mount may differ; Settings/School must match exactly'
for p in ['js/nh7-school-drafts-v468.js','js/nh7-school-path-v351.js','js/nh7-audio-classic-v400.js','js/nh7-settings-controller-v403.js','js/nh7-theme-studio-v453.js','js/nh7-celebrations-v464.js','manifest.json','version.json']:assert Path(p).read_text()==old(p),p
module=Path('js/nh7-store-review-v469.js').read_text()
assert not any(x in module for x in ['fetch(','localStorage','sessionStorage','setTimeout(','requestReview(','innerHTML','window.open('])
for p in ['js/app.js','js/nh7-store-review-v469.js','js/nh7-store-review-preview-v469.js','service-worker.js','sw-release-core-v403.js']:subprocess.run(['node','--check',p],check=True)
more=s[s.index('async function more(){'):s.index('\nasync function fetchMyQuestionsCloud')]
tile=next(l for l in s.splitlines() if l.startswith('function tile('))
links='\n'.join(re.findall(r'<link[^>]*rel="stylesheet"[^>]*>',Path('index.html').read_text()))
Path('.qa-more469.html').write_text('<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+links+'<body><main id="view" style="max-width:600px;margin:auto;padding:16px"></main><textarea id="savedDraft">متن دانشجو</textarea><script src="js/nh7-theme-studio-v453.js"></script><script type="module" src=".qa-more469.js"></script></body></html>')
Path('.qa-more469.js').write_text('''import * as A from './js/nh7-store-review-v469.js';
const {mountMoreReviewV469}=A;const state={lang:'fa'},view=document.getElementById('view');
const html=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const tr=k=>k;
'''+tile+'\n'+more+'''\nwindow.ReviewMore=A;window.showMore=async(lang='fa',platform=null)=>{state.lang=lang;document.documentElement.lang=lang;document.documentElement.dir=lang==='fa'?'rtl':'ltr';await more();if(platform)mountMoreReviewV469(view.firstChild,{language:lang,platform})};''')
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start();origin=f'http://127.0.0.1:{server.server_port}'
S={'nh7_user_session_v170':'synthetic-session','nh7_school_draft_v468:fixture':'متن محفوظ','nh7_gamification':'{"points":450}','nh7_audio_media_v397:fixture':'downloaded','nh7_note_fixture':'Saved note'}
passed=[];failed=[]
def test(name,fn):
 try:fn();passed.append(name);print('PASS',name,flush=True)
 except Exception as e:failed.append({'test':name,'error':str(e)});print('FAIL',name,str(e),flush=True)
with sync_playwright() as pw:
 for engine in ['chromium','webkit']:
  browser=getattr(pw,engine).launch(headless=True)
  def setup(ua=None):
   args={'viewport':{'width':390,'height':844},'service_workers':'block'}
   if ua:args['user_agent']=ua
   ctx=browser.new_context(**args);p=ctx.new_page();p.set_default_timeout(8000);err=[];net=[];stores=[];p.on('pageerror',lambda e:err.append(str(e)))
   def route(r):
    url=r.request.url
    if url.startswith(origin):r.continue_()
    elif url.startswith('https://fonts.googleapis.com/') and r.request.resource_type=='stylesheet':r.fulfill(status=200,content_type='text/css',body='')
    elif url.startswith(('https://apps.apple.com/','https://play.google.com/')):stores.append(url);r.fulfill(status=200,content_type='text/html',body='<title>Mock store</title>')
    else:net.append(url);r.abort()
   ctx.route('**/*',route);p.goto(origin+'/.qa-more469.html');p.wait_for_function('!!window.showMore');p.evaluate('(x)=>Object.entries(x).forEach(([k,v])=>localStorage.setItem(k,v))',S)
   return ctx,p,err,net,stores
  def end(ctx,p,err,net,stores):
   assert not err,err;assert not net,net
   for k,v in S.items():assert p.evaluate('(k)=>localStorage.getItem(k)',k)==v,k
   if p.locator('#savedDraft').count():assert p.locator('#savedDraft').input_value()=='متن دانشجو'
   ctx.close()
  def languages():
   ctx,p,err,net,stores=setup()
   for lang,title in [('fa','شرکت در نظرسنجی'),('en','Rate & review'),('hr','Ocijenite aplikaciju')]:
    for platform in ['ios','android','web']:
     p.evaluate('([l,t])=>showMore(l,t)',[lang,platform]);item=p.locator('[data-review-menu469]')
     assert item.locator('strong').inner_text()==title
     assert p.locator('[data-more-navigation456] > .tile').count()==8
     assert p.locator('[data-more-navigation456] > [data-go]').count()==7
     assert item.get_attribute('data-go') is None
     assert item.get_attribute('dir')==('rtl' if lang=='fa' else 'ltr')
     assert item.locator('select,input,textarea').count()==0
     assert p.locator('[role=dialog],#nh7StoreReview469,.nh7-store-review469').count()==0
   assert not stores;end(ctx,p,err,net,stores)
  test(engine+': 3 languages, 8 More entries, original 7 routes and no Settings card or controls',languages)
  def handoff():
   for ua,store,href in [('iPhone','ios','https://apps.apple.com/app/id6803187205?action=write-review'),('Android 16','android','https://play.google.com/store/apps/details?id=com.omideno7.newhope7')]:
    ctx,p,err,net,stores=setup(ua);p.evaluate('showMore()');item=p.locator('[data-review-menu469]')
    assert item.evaluate('(n)=>n.tagName')=='A' and item.get_attribute('data-review-store469')==store
    assert item.get_attribute('href')==href and not stores
    with p.expect_popup() as event:item.click()
    pop=event.value;pop.wait_for_load_state();assert pop.url==href and pop.evaluate('window.opener===null');pop.close();p.bring_to_front()
    assert len(stores)==1 and p.locator('[data-more-navigation456]').count()==1
    assert p.locator('[role=status]').inner_text()=='';end(ctx,p,err,net,stores)
  test(engine+': single tap directly opens exact device store; More remains; no false success',handoff)
  def platforms():
   ctx,p,err,net,stores=setup()
   assert p.evaluate("ReviewMore.detectedReviewPlatformV469({navigator:{userAgent:'Macintosh',maxTouchPoints:5}})")=='ios'
   assert p.evaluate("ReviewMore.detectedReviewPlatformV469({Capacitor:{getPlatform:()=> 'android'},navigator:{userAgent:'iPhone'}})")=='android'
   assert p.evaluate("ReviewMore.detectedReviewPlatformV469({Capacitor:{getPlatform(){throw Error()}},navigator:{userAgent:'Android'}})")=='android'
   p.evaluate('showMore("en","web")');item=p.locator('details[data-review-menu469]');item.locator('summary').click();assert item.get_attribute('open') is not None
   assert item.locator('a').count()==2
   with p.expect_popup() as event:item.locator('a[data-review-store469=android]').click()
   event.value.close();p.bring_to_front();end(ctx,p,err,net,stores)
  test(engine+': iPad/native detection and inline desktop store choice',platforms)
  def offline():
   ctx,p,err,net,stores=setup('iPhone')
   for lang in ['fa','en','hr']:
    p.evaluate('(l)=>showMore(l)',lang);p.evaluate("()=>{Object.defineProperty(navigator,'onLine',{value:false,configurable:true})}")
    p.locator('[data-review-menu469]').click();assert p.locator('[role=status]').inner_text() and not stores
    p.evaluate("()=>{Object.defineProperty(navigator,'onLine',{value:true,configurable:true});window.dispatchEvent(new Event('online'))}");assert not stores
   end(ctx,p,err,net,stores)
  test(engine+': offline warning in 3 languages; reconnect never auto-opens',offline)
  def theme_layout():
   ctx,p,err,net,stores=setup('iPhone');themes=p.evaluate('Object.keys(NH7ThemeStudioV453.PRESETS)');assert len(themes)==14
   for lang in ['fa','en','hr']:
    p.evaluate('(l)=>showMore(l)',lang)
    for theme in themes:
     p.evaluate('(t)=>NH7ThemeStudioV453.set({preset:t,...NH7ThemeStudioV453.PRESETS[t],fa:"vazirmatn",latin:"inter"})',theme)
     colors=p.locator('[data-review-menu469]').evaluate('(n)=>({color:getComputedStyle(n).color,bg:getComputedStyle(n).backgroundColor})')
     existing=p.locator('[data-go]').first.evaluate('(n)=>({color:getComputedStyle(n).color,bg:getComputedStyle(n).backgroundColor})');assert colors==existing
   for width in [320,390,768]:
    p.set_viewport_size({'width':width,'height':900});p.evaluate("document.documentElement.style.fontSize='120%'");box=p.locator('[data-review-menu469]').bounding_box();assert box['height']>=44 and box['x']>=0 and box['x']+box['width']<=width+1
   assert not stores;end(ctx,p,err,net,stores)
  test(engine+': inherits existing tiles in 14 themes x 3 languages; no chooser; 120% text widths',theme_layout)
  def keyboard_repeat():
   ctx,p,err,net,stores=setup('iPhone')
   for _ in range(12):p.evaluate('showMore()')
   assert p.locator('[data-review-menu469]').count()==1 and not stores
   p.locator('[data-review-menu469]').focus()
   with p.expect_popup() as event:p.keyboard.press('Enter')
   event.value.close();p.bring_to_front();end(ctx,p,err,net,stores)
  test(engine+': keyboard, repeated navigation, no duplicate links or requests',keyboard_repeat)
  def preview():
   ctx,p,err,net,stores=setup('iPhone')
   for lang in ['fa','en','hr']:
    p.goto(origin+'/store-review-preview.html?lang='+lang);p.wait_for_selector('[data-review-menu469]')
    assert p.locator('select,input,textarea').count()==0
    assert p.locator('[data-go][disabled]').count()==7 and p.locator('[data-review-menu469]').get_attribute('lang')==lang
    if lang=='fa':p.screenshot(path=str(OUT/(engine+'-more-fa.png')))
   assert not stores;end(ctx,p,err,net,stores)
  test(engine+': phone preview has no theme/language selectors or hidden API use',preview)
  browser.close()
server.shutdown()
(OUT/'report.json').write_text(json.dumps({'baseline':BASE,'passed_groups':len(passed),'tests':passed,'failures':failed,'scope':'Actual source-extracted More function and actual menu module/CSS; synthetic local data and intercepted store pages, not physical native-store handoff. No real ratings, Supabase requests or production data changes.'},indent=2,ensure_ascii=False))
if failed:raise SystemExit(1)
