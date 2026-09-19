import functools,http.server,threading,json,re,subprocess,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path.cwd();OUT=ROOT/'qa-store-review-v469';OUT.mkdir(exist_ok=True)
BASE='2bde658268eeaed0e7873c83aa7fb54c1d37fc8f'
old=lambda p:subprocess.check_output(['git','show',BASE+':'+p],text=True)
app=Path('js/app.js').read_text();before=old('js/app.js')
undo=app.replace("import {mountStoreReviewV469} from './nh7-store-review-v469.js?v=4.6.9';\n",'',1).replace('    <div id="nh7StoreReview469"></div>\n','',1).replace("  mountStoreReviewV469($('#nh7StoreReview469'),{language:state.lang});\n",'',1)
assert undo==before,'Only the additive Settings hook is allowed'
for p in ['js/nh7-school-drafts-v468.js','js/nh7-school-path-v351.js','js/nh7-audio-classic-v400.js','js/nh7-settings-controller-v403.js','js/nh7-theme-studio-v453.js','js/nh7-celebrations-v464.js','manifest.json','version.json']:
 assert Path(p).read_text()==old(p),p
module=Path('js/nh7-store-review-v469.js').read_text()
assert not any(x in module for x in ['localStorage.','sessionStorage.','fetch(','setInterval(','requestReview(','innerHTML','window.open('])
for p in ['js/app.js','js/nh7-store-review-v469.js','js/nh7-store-review-preview-v469.js','sw-release-core-v403.js','service-worker.js']:subprocess.run(['node','--check',p],check=True)
links='\n'.join(re.findall(r'<link[^>]*rel="stylesheet"[^>]*>',Path('index.html').read_text()))
fixture='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'''+links+'''<body><main id="view" style="max-width:580px;padding:16px;margin:auto"></main><textarea id="existingSchoolDraft">متن تکلیف نباید تغییر کند</textarea><script src="js/nh7-theme-studio-v453.js"></script><script type="module" src=".qa-review469.js"></script></body></html>'''
Path('.qa-review469.html').write_text(fixture)
def block(s):
 a=s.index('async function settings(){');return s[a:s.index('\nasync function enableNotifications()',a)]
stubs=r'''
import * as API from './js/nh7-store-review-v469.js';
const {mountStoreReviewV469}=API;window.Review469=API;
const state={lang:'en'},view=document.getElementById('view'),$=s=>document.querySelector(s),html=s=>String(s??'');
const tr=x=>x,card=(title,body)=>'<section class="card"><h2>'+title+'</h2>'+body+'</section>';
const nh7AppearanceSettingsHtml=()=>'<section id="oldAppearance">Existing appearance</section>',nh7BindAppearanceSettings=()=>{},cloudStatusText=()=>'';
const setLang=l=>{state.lang=l;return settings()},enableNotifications=()=>{},prepareCoreOffline=()=>{},clearDownloadedMedia=async()=>{},swMessage=async()=>{},syncCloudQueue=async()=>{},refreshInboxFromCloud=async()=>{};
const notificationPermissionStatus=async()=>'default',fetchNotificationSchedules=async()=>[],offlineStorageSummary=async()=>'';
let notificationSettingsCache=null;const render=()=>settings();
'''
Path('.qa-review469.js').write_text(stubs+block(app)+block(before).replace('async function settings(){','async function settingsBefore(){',1)+'''\nwindow.runSettings469=async(language='en',baseline=false)=>{state.lang=language;return baseline?settingsBefore():settings()};window.mountReview469=(language='en',platform='web')=>{view.innerHTML='<div id="host469"></div>';return mountStoreReviewV469(document.getElementById('host469'),{language,platform})};''')
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start();origin=f'http://127.0.0.1:{server.server_port}'
S={'nh7_user_session_v170':'{"user":{"id":"synthetic-only","email":"test@example.invalid"}}','nh7_school_access':'{"status":"approved"}','nh7_school_draft_v468:fixture':'{"text":"پیش‌نویس محفوظ","pending":true}','nh7_gamification':'{"points":450,"badges":["first_verse"]}','nh7_note_fixture':'My note','nh7_audio_media_v397:fixture':'{"downloaded":true}'}
passed=[];failed=[]
def record(name,fn):
 try:fn();passed.append(name);print('PASS',name,flush=True)
 except Exception as e:failed.append({'name':name,'error':str(e)});print('FAIL',name,str(e),flush=True)
with sync_playwright() as pw:
 for engine in os.getenv('QA_BROWSERS','chromium,webkit').split(','):
  opts={'headless':True}
  if os.getenv('QA_CHROMIUM_PATH') and engine=='chromium':opts['executable_path']=os.getenv('QA_CHROMIUM_PATH')
  browser=getattr(pw,engine).launch(**opts)
  def page():
   ctx=browser.new_context(viewport={'width':390,'height':844},service_workers='block');p=ctx.new_page();p.set_default_timeout(8000);errors=[];network=[];stores=[]
   p.on('pageerror',lambda e:errors.append(str(e)))
   def route(r):
    u=r.request.url
    if u.startswith(origin):r.continue_()
    elif u.startswith('https://fonts.googleapis.com/') and r.request.resource_type=='stylesheet':r.fulfill(status=200,content_type='text/css',body='/* existing font import stubbed offline */')
    elif u.startswith(('https://apps.apple.com/','https://play.google.com/')):
     stores.append(u);r.fulfill(status=200,content_type='text/html',body='<title>Simulated store destination</title>Store navigation only; no review submitted.')
    else:network.append(u);r.abort()
   ctx.route('**/*',route);p.goto(origin+'/.qa-review469.html');p.wait_for_function('!!window.Review469')
   p.evaluate('(x)=>Object.entries(x).forEach(([k,v])=>localStorage.setItem(k,v))',S)
   return ctx,p,errors,network,stores
  def clean(ctx,p,errors,network,stores):
   for k,v in S.items():assert p.evaluate('(k)=>localStorage.getItem(k)',k)==v,k
   assert p.locator('#existingSchoolDraft').input_value()=='متن تکلیف نباید تغییر کند'
   assert not errors,errors;assert not network,network;ctx.close()
  def localized():
   ctx,p,err,net,stores=page()
   for language,title in [('fa','امتیاز و نظر شما'),('en','Rate & review'),('hr','Ocjena i recenzija')]:
    for platform,count in [('ios',1),('android',1),('web',2),('unknown',2)]:
     p.evaluate('([l,p])=>mountReview469(l,p)',[language,platform]);assert p.locator('.nh7-store-review469 h3').inner_text()==title
     assert p.locator('[data-review-store469]').count()==count
     assert p.locator('.nh7-store-review469').get_attribute('dir')==('rtl' if language=='fa' else 'ltr')
     assert p.locator('.nh7-store-review469 input,.nh7-store-review469 textarea,[role=slider]').count()==0
   p.evaluate("mountReview469('__proto__','<img>')");assert p.locator('.nh7-store-review469 h3').inner_text()=='Rate & review'
   assert not stores;clean(ctx,p,err,net,stores)
  record(engine+': three languages, platform variants, no local rating control',localized)
  def platform():
   ctx,p,err,net,stores=page()
   rows=[({'navigator':{'userAgent':'iPhone'}},'ios'),({'navigator':{'userAgent':'Macintosh','maxTouchPoints':5}},'ios'),({'navigator':{'userAgent':'Macintosh','maxTouchPoints':0}},'web'),({'navigator':{'userAgent':'Android 16'}},'android'),({},'web')]
   for env,wanted in rows:assert p.evaluate('(e)=>Review469.detectedReviewPlatformV469(e)',env)==wanted
   assert p.evaluate("Review469.detectedReviewPlatformV469({Capacitor:{getPlatform:()=> 'android'},navigator:{userAgent:'iPhone'}})")=='android'
   assert p.evaluate("Review469.detectedReviewPlatformV469({Capacitor:{getPlatform(){throw Error('missing')}},navigator:{userAgent:'iPad'}})")=='ios'
   clean(ctx,p,err,net,stores)
  record(engine+': native detection, iPhone/iPad, Android, desktop fallback',platform)
  def setting():
   ctx,p,err,net,stores=page()
   p.evaluate("runSettings469('en',true)");p.wait_for_timeout(180)
   ids=p.locator('#view [id]').evaluate_all('(ns)=>ns.map(n=>n.id).sort()')
   for l in ['fa','en','hr']:
    p.evaluate('(l)=>runSettings469(l)',l);p.wait_for_timeout(180)
    newids=p.locator('#view [id]').evaluate_all('(ns)=>ns.map(n=>n.id).filter(x=>x!=="nh7StoreReview469").sort()');assert ids==newids,(ids,newids)
    assert p.locator('#nh7StoreReview469').count()==1
    assert p.evaluate("document.getElementById('nh7StoreReview469').nextElementSibling.classList.contains('nh7-version-footer')")
   assert not stores;clean(ctx,p,err,net,stores)
  record(engine+': actual Settings renderer, old controls retained, version footer last',setting)
  def navigation():
   ctx,p,err,net,stores=page()
   for platform in ['ios','android']:
    p.evaluate('(x)=>mountReview469("fa",x)',platform)
    link=p.locator('[data-review-store469]');expected=link.get_attribute('href')
    assert expected==('https://apps.apple.com/app/id6803187205?action=write-review' if platform=='ios' else 'https://play.google.com/store/apps/details?id=com.omideno7.newhope7')
    assert 'noopener' in link.get_attribute('rel') and link.get_attribute('target')=='_blank'
    with p.expect_popup() as event:link.click()
    pop=event.value;pop.wait_for_load_state();assert pop.url==expected;assert pop.evaluate('window.opener===null');pop.close()
    p.bring_to_front();assert p.locator('.nh7-review-status469').inner_text()==''
   assert len(stores)==2,stores;clean(ctx,p,err,net,stores)
  record(engine+': explicit gesture opens exact stores; no false review-success message',navigation)
  def offline():
   ctx,p,err,net,stores=page()
   for language in ['fa','en','hr']:
    p.evaluate('(l)=>mountReview469(l,"ios")',language);p.evaluate("()=>Object.defineProperty(navigator,'onLine',{configurable:true,value:false})")
    p.locator('[data-review-store469]').click();assert p.locator('[role=status]').inner_text();assert not stores
    p.evaluate("()=>{Object.defineProperty(navigator,'onLine',{configurable:true,value:true});window.dispatchEvent(new Event('online'))}");p.wait_for_timeout(50);assert not stores
   with p.expect_popup() as event:p.locator('[data-review-store469]').click()
   event.value.close();clean(ctx,p,err,net,stores)
  record(engine+': localized offline warning; reconnect does not open a store automatically',offline)
  def palettes():
   ctx,p,err,net,stores=page();presets=p.evaluate('Object.keys(NH7ThemeStudioV453.PRESETS)');assert len(presets)==14
   for language in ['fa','en','hr']:
    p.evaluate('(l)=>mountReview469(l,"ios")',language)
    for t in presets:
     p.evaluate('(t)=>NH7ThemeStudioV453.set({preset:t,...NH7ThemeStudioV453.PRESETS[t],fa:"vazirmatn",latin:"inter"})',t)
     v=p.locator('.nh7-review-link469').evaluate('(e)=>({color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor,accent:getComputedStyle(e).getPropertyValue("--review-accent").trim()})')
     palette=p.evaluate('(t)=>NH7ThemeStudioV453.PRESETS[t]',t);assert v['accent']==palette['accent']
     colors=p.evaluate('({fg,bg})=>NH7ThemeStudioV453.contrast(fg,bg)',{'fg':palette['text'],'bg':palette['card']});assert colors>=4.5,(t,colors)
     if language=='fa' and t in ['hope','aurora','emerald']:p.locator('.nh7-store-review469').screenshot(path=str(OUT/f'{engine}-{t}-fa.png'))
   for width in [320,390,768,1280]:
    p.set_viewport_size({'width':width,'height':900});p.evaluate("document.documentElement.style.fontSize='120%'")
    p.evaluate('mountReview469("hr","web")');box=p.locator('.nh7-store-review469').bounding_box();assert box['x']>=0 and box['x']+box['width']<=width+1
    for link in p.locator('.nh7-review-link469').all():
     box=link.bounding_box();assert box['height']>=44 and box['x']+box['width']<=width+1
   clean(ctx,p,err,net,stores)
  record(engine+': 14 palettes x 3 languages, contrast and 4 widths at 120% text',palettes)
  def keyboard():
   ctx,p,err,net,stores=page();p.evaluate('mountReview469("en","ios")');link=p.locator('a.nh7-review-link469');link.focus()
   with p.expect_popup() as event:p.keyboard.press('Enter')
   event.value.close();p.bring_to_front()
   p.emulate_media(reduced_motion='reduce');assert link.evaluate('(e)=>getComputedStyle(e).transitionDuration')=='0s'
   for _ in range(20):p.evaluate('mountReview469("en","web")')
   assert p.locator('.nh7-store-review469').count()==1 and len(stores)==1
   clean(ctx,p,err,net,stores)
  record(engine+': keyboard navigation, reduce-motion and idempotent remount',keyboard)
  def preview():
   ctx,p,err,net,stores=page();p.goto(origin+'/store-review-preview.html');p.wait_for_selector('.nh7-store-review469')
   for l in ['fa','en','hr']:
    p.locator('#reviewPreviewLang').select_option(l);assert p.locator('.nh7-store-review469').get_attribute('lang')==l
   p.locator('#reviewPreviewTheme').select_option('aurora');p.screenshot(path=str(OUT/f'{engine}-phone-preview.png'))
   assert not stores and not err and not net,(stores,err,net);ctx.close()
  record(engine+': isolated public preview language/theme controls and no background API',preview)
  browser.close()
server.shutdown()
report={'baseline':BASE,'passed_groups':len(passed),'results':passed,'failures':failed,'scope':'Actual review module, stylesheet and source-extracted Settings function with synthetic dependencies. Store navigations intercepted; no actual rating submitted. Existing Google font imports stubbed. No Supabase, native bridge, profile/score writes or phone store acceptance claimed.'}
(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
if failed:raise SystemExit(1)
