import functools,http.server,threading,json,os,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[2];OUT=R/'qa-school-review-v467';OUT.mkdir(exist_ok=True)
(R/'.qa-assignment467.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="css/styles.css"><link rel="stylesheet" href="css/nh7-theme-studio-v453.css"><link rel="stylesheet" href="css/nh7-school-workflow-v467.css"><script src="js/nh7-theme-studio-v453.js"></script><main id="view"></main><script type="module">import {createSchoolWorkflowV467} from './js/nh7-school-workflow-v467.js';window.createWF=createSchoolWorkflowV467;</script></html>''')
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(R)));threading.Thread(target=server.serve_forever,daemon=True).start();ORIGIN=f'http://127.0.0.1:{server.server_port}'
passed=[];failed=[]
SENTINELS={'nh7_gamification':'{"points":57}','nh7_note_school-class_01_new_creation':'Legacy draft belongs to existing data','nh7_sermon_note_1':'یادداشت قبلی','nh7_school_snapshot_saved':'{"progress":100}','nh7_audio_media_v397:old':'{"downloaded":true}','nh7_user_session_v170':'{"access_token":"sentinel-not-used"}'}
SETUP=r'''({language,which})=>{
 window.language=language;window.owner='one@example.invalid';window.online=true;window.calls=[];window.syncs=[];window.rpcError=false;window.stale=false;window.hold=false;window.preflightHold=false;
 Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>window.online});
 window.row=which==='draft'?null:{id:'synthetic-assignment',lesson_code:'class_01_new_creation',user_email:owner,status:which,answer_text:'Previous answer\nSecond line',admin_feedback:'Please revise.\n<img src=x onerror=alert(1)>',submitted_at:'2026-09-18T12:00:00Z'};
 window.snapshot=async()=>{if(window.preflightHold)await new Promise(r=>window.releasePreflight=r);return {progress:[],assignments:window.row?[window.row]:[],from_cache:window.stale}};
 window.workflow=createWF({lang:()=>window.language,email:()=>window.owner,userName:()=>'',snapshot:()=>window.snapshot(),syncDraft:async(...args)=>window.syncs.push(args),rpc:async(name,p)=>{window.calls.push({name,p});if(window.hold)await new Promise(r=>window.releaseRPC=r);if(window.rpcError)throw Error('synthetic-network-error');window.row={...window.row,id:'synthetic-assignment',user_email:window.owner,lesson_code:p.p_lesson_code,answer_text:p.p_answer_text,status:'submitted',admin_feedback:'',submitted_at:'2026-09-19T12:00:00Z'};return window.row}});
 window.render=()=>{document.documentElement.lang=window.language;document.documentElement.dir=language==='fa'?'rtl':'ltr';const cfg={code:'class_01_new_creation',courseCode:'foundation_school',question:'Sample question',row:window.row,snapshot:{from_cache:false}};document.getElementById('view').innerHTML=workflow.render(cfg);workflow.bind(cfg)};window.render();
}'''
with sync_playwright() as pw:
 for engine in os.getenv('QA_BROWSERS','chromium,webkit').split(','):
  browser=getattr(pw,engine).launch(headless=True)
  def start(language='en',which='needs_revision'):
   ctx=browser.new_context(viewport={'width':390,'height':844},service_workers='block');p=ctx.new_page();errors=[];external=[];p.on('pageerror',lambda e:errors.append(str(e)))
   def route(rt):
    if rt.request.url.startswith(ORIGIN):rt.continue_()
    elif rt.request.url.startswith('https://fonts.googleapis.com/') and rt.request.resource_type=='stylesheet':rt.fulfill(status=200,body='',content_type='text/css')
    else:external.append(rt.request.url);rt.abort()
   ctx.route('**/*',route);p.goto(ORIGIN+'/.qa-assignment467.html');p.wait_for_function('!!window.createWF')
   p.evaluate('(v)=>Object.entries(v).forEach(([k,s])=>localStorage.setItem(k,s))',SENTINELS)
   p.evaluate(SETUP,{'language':language,'which':which});return ctx,p,errors,external
  def record(name,fn):
   try:fn();passed.append(engine+': '+name);print('PASS',engine,name,flush=True)
   except Exception as e:failed.append({'test':engine+': '+name,'error':str(e)});print('FAIL',engine,name,str(e),flush=True)
  def clean(ctx,p,err,ext):
   vals=p.evaluate('(keys)=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)]))',list(SENTINELS));assert vals==SENTINELS,(vals,SENTINELS)
   assert not err,err;assert not ext,ext;ctx.close()
  def translations():
   for l,t in [('fa','نیاز به اصلاح'),('en','Needs revision'),('hr','Potrebna dorada')]:
    ctx,p,err,ext=start(l);assert t in p.locator('.nh7-assignment-status467').inner_text();assert p.locator('.nh7-assignment-feedback467 img').count()==0
    assert p.locator('textarea').input_value()=='Previous answer\nSecond line'
    p.locator('textarea').fill('My revised answer\nLine two\n<literal>');p.locator('#saveSchoolAssignmentDraft').click()
    assert len(p.evaluate('syncs'))==1;p.evaluate('render()');assert p.locator('textarea').input_value()=='My revised answer\nLine two\n<literal>'
    p.screenshot(path=str(OUT/f'{engine}-revision-{l}.png'));p.reload();p.wait_for_function('!!window.createWF');p.evaluate(SETUP,{'language':l,'which':'needs_revision'});assert 'My revised answer' in p.locator('textarea').input_value();clean(ctx,p,err,ext)
  record('three-language feedback, literal markup, multiline draft and reload',translations)
  def local_offline():
   ctx,p,err,ext=start();p.evaluate('online=false');p.locator('textarea').fill('Offline preserved draft');p.locator('#saveSchoolAssignmentDraft').click();p.locator('#submitSchoolAssignment').click();assert p.evaluate('calls.length+syncs.length')==0
   assert 'only' in p.locator('[role=status]').inner_text();p.evaluate('render()');assert p.locator('textarea').input_value()=='Offline preserved draft';clean(ctx,p,err,ext)
  record('offline is local-only, no API call or false cloud success',local_offline)
  def single_submit():
   ctx,p,err,ext=start();p.locator('textarea').fill('A revised answer sent once');p.evaluate('hold=true');p.locator('#submitSchoolAssignment').click();p.wait_for_function('calls.length===1')
   p.evaluate("document.getElementById('submitSchoolAssignment').dispatchEvent(new Event('click'))");assert p.evaluate('calls.length')==1;assert p.locator('textarea').get_attribute('readonly') is not None
   p.evaluate('releaseRPC()');p.wait_for_function("document.querySelector('[data-assignment467]').dataset.status==='submitted'")
   assert p.evaluate('calls[0].name')=='nh7_submit_school_assignment';assert 'awaiting' in p.locator('[role=status]').inner_text().lower()
   p.locator('#submitSchoolAssignment').click();p.wait_for_timeout(120);assert p.evaluate('calls.length')==1;clean(ctx,p,err,ext)
  record('single-flight resubmission, server receipt and duplicate suppression',single_submit)
  def failures():
   for mode in ['rpcError','stale']:
    ctx,p,err,ext=start();p.evaluate(mode+'=true');p.locator('textarea').fill('Preserve this revised answer');p.locator('#submitSchoolAssignment').click();p.wait_for_function("document.querySelector('[role=status]').dataset.error==='1'")
    assert p.locator('textarea').input_value()=='Preserve this revised answer';assert p.locator('#submitSchoolAssignment').is_enabled();assert p.evaluate('calls.length')==(1 if mode=='rpcError' else 0);p.evaluate('render()');assert p.locator('textarea').input_value()=='Preserve this revised answer';clean(ctx,p,err,ext)
  record('failed request or stale preflight preserves drafts',failures)
  def approved():
   ctx,p,err,ext=start(which='approved');assert p.locator('textarea').is_disabled();assert p.locator('#submitSchoolAssignment').is_disabled();p.evaluate("document.getElementById('submitSchoolAssignment').dispatchEvent(new Event('click'))");assert p.evaluate('calls.length')==0;clean(ctx,p,err,ext)
   ctx,p,err,ext=start();p.locator('textarea').fill('New draft before approval');p.evaluate("row={...row,status:'approved'}");p.locator('#submitSchoolAssignment').click();p.wait_for_function("document.querySelector('textarea').disabled");assert p.evaluate('calls.length')==0
   assert p.evaluate("workflow.readDraft(owner,'class_01_new_creation').text")=='New draft before approval';clean(ctx,p,err,ext)
  record('approved answers read-only, concurrent approval never overwritten',approved)
  def identities():
   ctx,p,err,ext=start();p.locator('textarea').fill('Only account one draft');p.evaluate("owner='two@example.invalid';row=null;render()");assert p.locator('textarea').input_value()==''
   p.evaluate("owner='one@example.invalid';render()");assert p.locator('textarea').input_value()=='Only account one draft';p.evaluate("preflightHold=true");p.locator('#submitSchoolAssignment').click();p.wait_for_function('!!window.releasePreflight');p.evaluate("owner='two@example.invalid';releasePreflight()");p.wait_for_timeout(150);assert p.evaluate('calls.length')==0;clean(ctx,p,err,ext)
  record('account-scoped drafts and account-switch guard',identities)
  def refresh_conflict():
   ctx,p,err,ext=start();p.locator('textarea').fill('My unfinished revised draft');p.evaluate("row={...row,status:'submitted',answer_text:'Updated server answer',submitted_at:'2026-09-19T13:00:00Z'}");p.locator('#submitSchoolAssignment').click();p.wait_for_function("!!document.querySelector('.nh7-assignment-copy467')&&document.querySelector('.nh7-assignment-copy467').textContent.includes('Updated server answer')")
   assert p.evaluate('calls.length')==0;assert p.locator('textarea').input_value()=='My unfinished revised draft';assert 'changed' in p.locator('.nh7-assignment-cached467').inner_text();clean(ctx,p,err,ext)
  record('changed server copy keeps local text and comparison',refresh_conflict)
  def validation():
   ctx,p,err,ext=start();p.locator('textarea').fill('short');p.locator('#submitSchoolAssignment').click();assert '10' in p.locator('[role=status]').inner_text();assert p.evaluate('calls.length')==0
   p.evaluate("Storage.prototype.setItem=()=>{throw Error('quota')}");p.locator('textarea').fill('Cannot persist this long answer');p.locator('#submitSchoolAssignment').click();assert 'Copy' in p.locator('[role=status]').inner_text();assert p.evaluate('calls.length')==0;clean(ctx,p,err,ext)
  record('answer validation and quota error never report saved',validation)
  def navigation():
   ctx,p,err,ext=start();p.locator('textarea').fill('Submitted while changing pages');p.evaluate('hold=true');p.locator('#submitSchoolAssignment').click();p.wait_for_function('calls.length===1');p.evaluate("document.getElementById('view').innerHTML='<h2>Another page</h2>';releaseRPC()");p.wait_for_timeout(100);assert p.locator('#view').inner_text()=='Another page';clean(ctx,p,err,ext)
  record('late response cannot overwrite another route',navigation)
  def themes():
   ctx,p,err,ext=start('fa');themes=p.evaluate('Object.keys(NH7ThemeStudioV453.PRESETS)');assert len(themes)==14
   for l in ['fa','en','hr']:
    p.evaluate('(l)=>{language=l;render()}',l)
    for t in themes:
     p.evaluate('(t)=>NH7ThemeStudioV453.set({preset:t,...NH7ThemeStudioV453.PRESETS[t],fa:"vazirmatn",latin:"inter"})',t)
     actual=p.locator('.nh7-assignment467').evaluate('(n)=>getComputedStyle(n).getPropertyValue("--wf-brand").trim()');assert actual==p.evaluate('(t)=>NH7ThemeStudioV453.PRESETS[t].accent',t)
   for w in [320,390,768]:
    p.set_viewport_size({'width':w,'height':900});box=p.locator('.nh7-assignment467').bounding_box();assert box['x']>=0 and box['x']+box['width']<=w+1
   p.screenshot(path=str(OUT/f'{engine}-theme-hr.png'));clean(ctx,p,err,ext)
  record('14 palettes x 3 languages and 3 widths',themes)
  def preview():
   ctx,p,err,ext=start();p.goto(ORIGIN+'/school-workflow-preview.html');p.wait_for_selector('#schoolAssignmentAnswer');assert p.locator('.nh7-assignment-feedback467').count()==1
   p.locator('#classesTab').click();assert p.locator('.nh7-school-class-v351').count()==7;p.locator('#previewState').select_option('exhausted');assert '0' in p.locator('.nh7-attempts467').first.inner_text() or '۰' in p.locator('.nh7-attempts467').first.inner_text()
   assert p.locator('.nh7-class-exam-v351').first.is_disabled();p.locator('#previewState').select_option('passed');assert p.locator('.nh7-school-class-v351.is-open').count()==2
   p.screenshot(path=str(OUT/f'{engine}-classes-fa.png'));p.locator('#previewLang').select_option('hr');assert 'Razred' in p.locator('#view').inner_text();clean(ctx,p,err,ext)
  record('safe phone preview: seven classes, 0 attempts, passed-class unlock',preview)
  def app_integration():
   ctx,p,err,ext=start('fa');src=(R/'js/app.js').read_text();i=src.index('async function schoolLesson(');fn=src[i:src.index('\n\nfunction examLocalized',i)]
   setup=r'''()=>{
    window.state={lang:'fa'};window.nh7NavigationEpochV456=1;window.currentUserEmail=()=>owner;window.schoolWorkflowV467=workflow;window.view=document.getElementById('view');window.$=s=>document.querySelector(s);window.html=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;').replace(/\n/g,'<br>');window.tr=s=>s;window.schoolCourseInfo=()=>({code:'foundation_school'});window.cloudFetch=async()=>[];window.getSchoolSnapshot=()=>snapshot();window.sermonProgressKey=s=>'nh7_sermon_progress_'+s;window.formatAudioTime=()=>'';window.bindInlineSermonControls=()=>{};window.updateInlineSermonPlayers=()=>{};window.refreshOfflineButtons=async()=>{};window.saveSchoolProgress=()=>{};window.navigate=()=>{};
    window.lesson={lesson_code:'class_01_new_creation',translations:{fa:{assignment_question:'پرسش تکلیف',class_title:'کلاس نمونه'}},written:{fa:{text:'متن کامل درس'}}};
   }'''
   p.evaluate(setup);p.evaluate(fn+'\nwindow.schoolLesson=schoolLesson;');p.evaluate('schoolLesson({lessons:[lesson]},lesson.lesson_code)');assert p.locator('.nh7-assignment467').count()==1;assert 'متن کامل' in p.locator('#view').inner_text()
   assert p.locator('#completeSchoolLesson').count()==1;clean(ctx,p,err,ext)
  record('actual schoolLesson assignment integration preserves lesson/audio hooks',app_integration)
  browser.close()
server.shutdown()
report={'passed_groups':len(passed),'results':passed,'failures':failed,'scope':'Synthetic fixtures and actual assignment module, schoolLesson source and School Path presentation functions. No production API, credentials or student content. Existing external Google font imports stubbed offline.'}
(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
if failed:sys.exit(1)
