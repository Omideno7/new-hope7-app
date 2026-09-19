from pathlib import Path
import functools,http.server,threading,json,os,traceback
from playwright.sync_api import sync_playwright
ROOT=Path.cwd();OUT=ROOT/'qa-output';OUT.mkdir(exist_ok=True)
app=(ROOT/'js/app.js').read_text()
lesson=app[app.index('async function schoolLesson('):app.index('\nfunction examLocalized(',app.index('async function schoolLesson('))]
path=(ROOT/'js/nh7-school-path-v351.js').read_text()
helpers=path[path.index('function attemptsV467('):path.index('function cloneLesson(')]
preview_helper=(ROOT/'school-review-attempts-preview.mjs').read_text()
assert helpers.strip() in preview_helper,'Preview attempt examples must match actual candidate source'
module=r'''
import {createSchoolReviewV467} from './js/nh7-school-review-v467.js';
window.QA={lang:'fa',user:'a@example.invalid',row:null,calls:[],cloud:[],offline:false,fail:false,stale:false,delay:false,snapshotFail:false};
const state={get lang(){return QA.lang}},view=document.getElementById('view');
const $=s=>document.querySelector(s),html=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tr=s=>s,localNum=s=>s,localText=s=>s,card=(t,s)=>`<section class="card"><h2>${html(t)}</h2>${s}</section>`;
function currentUserEmail(){return QA.user}function isAccountLoggedIn(){return !!QA.user}function getKnownUserProfile(){return {name:'Test only',email:QA.user}}
function schoolCourseInfo(){return {code:'foundation_school'}}function sermonProgressKey(id){return 'nh7_sermon_progress_'+id}function formatAudioTime(){return '0:00'}
function bindInlineSermonControls(){}function updateInlineSermonPlayers(){}async function refreshOfflineButtons(){}function renderSchoolExamBlock(){return ''}function navigate(){}function saveSchoolProgress(){throw Error('Manual completion not part of this test')}
async function cloudFetch(){return []}async function getSchoolSnapshot(){if(QA.snapshotFail)throw Error('offline');return {progress:[],assignments:QA.row?[QA.row]:[],from_cache:QA.stale,error:QA.stale?'test':''}}
async function saveNoteCloud(k,v){QA.cloud.push({k,v})}
async function cloudRpc(n,p){QA.calls.push({n,p});if(QA.delay)await new Promise(resolve=>QA.release=resolve);if(QA.fail)throw Error(QA.fail===true?'network':QA.fail);return QA.row={id:'fixture',user_email:QA.user,lesson_code:p.p_lesson_code,answer_text:p.p_answer_text,status:'submitted',admin_feedback:''}}
Object.defineProperty(navigator,'onLine',{get:()=>!QA.offline});
'''+lesson+r'''
const L=(fa,en,hr)=>QA.lang==='fa'?fa:QA.lang==='hr'?hr:en,E=html,N=v=>QA.lang==='fa'?String(v).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]):String(v);
'''+helpers+r'''
window.attemptsCheck=s=>({a:attemptsV467(s),html:attemptsHtmlV467(s),exhausted:attemptsExhaustedV467(s),status:statusText(s),gate:gateText(s)});
const data={lessons:[{lesson_code:'class_01_new_creation',translations:Object.fromEntries(['fa','en','hr'].map(l=>[l,{class_title:'Class',lesson_title:'Lesson',lesson_text:'Lesson text fixture',assignment_question:'Test question; no real course content'}])),written:{en:{text:'Protected source unchanged'}},audio:{}}]};
window.show=async (status='needs_revision',language='fa')=>{QA.lang=language;document.documentElement.lang=language;document.documentElement.dir=language==='fa'?'rtl':'ltr';QA.row=status==='unsubmitted'?null:{id:'fixture',user_email:QA.user,lesson_code:'class_01_new_creation',answer_text:'Original server answer',status,admin_feedback:status==='needs_revision'?'Administrator feedback fixture':''};await schoolLesson(data,'class_01_new_creation')};
window.redraw=()=>schoolLesson(data,'class_01_new_creation');
await show();window.ready=true;
'''
(ROOT/'.qa-review.mjs').write_text(module)
(ROOT/'.qa-review.html').write_text('''<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="css/styles.css"><link rel="stylesheet" href="css/nh7-theme-studio-v453.css"><link rel="stylesheet" href="css/nh7-school-review-v467.css"><body><main id="view" style="max-width:760px;margin:auto"></main><script type="module" src=".qa-review.mjs"></script></body></html>''')
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start();origin=f'http://127.0.0.1:{server.server_port}'
results=[];failures=[]
with sync_playwright() as pw:
 for engine in ['chromium','webkit']:
  browser=getattr(pw,engine).launch(headless=True)
  def scenario(name,fn):
   ctx=browser.new_context(viewport={'width':390,'height':844},service_workers='block');p=ctx.new_page();errors=[];external=[]
   p.on('pageerror',lambda e:errors.append(str(e)))
   def intercept(route):
    if route.request.url.startswith(origin):route.continue_()
    elif route.request.resource_type in ['stylesheet','font']:route.fulfill(status=200,content_type='text/css',body='')
    else:external.append(route.request.url);route.abort()
   ctx.route('**/*',intercept)
   ctx.add_init_script("localStorage.setItem('nh7_note_fixture','KEEP');localStorage.setItem('nh7_gamification','{\"points\":12}');localStorage.setItem('nh7_audio_media_v397:fixture','KEEP');")
   try:
    p.goto(origin+'/.qa-review.html');p.wait_for_function('window.ready===true')
    fn(p)
    assert not errors,errors;assert not external,external
    assert p.evaluate("localStorage.getItem('nh7_note_fixture')")== 'KEEP'
    assert p.evaluate("localStorage.getItem('nh7_gamification')")== '{"points":12}'
    assert p.evaluate("localStorage.getItem('nh7_audio_media_v397:fixture')")== 'KEEP'
    results.append(engine+': '+name);print('PASS',engine,name,flush=True)
   except Exception as e:
    detail=traceback.format_exc();failures.append({'name':engine+': '+name,'error':detail});print('FAIL',engine,name,detail,flush=True)
    try:p.screenshot(path=str(OUT/f'{engine}-failure-{len(failures)}.png'),full_page=True)
    except Exception:pass
   finally:ctx.close()
  for lang,title in [('fa','نیاز به اصلاح'),('en','Needs revision'),('hr','Potrebna dorada')]:
   def basic(p,lang=lang,title=title):
    p.evaluate('([s,l])=>show(s,l)',['needs_revision',lang]);assert title in p.locator('[data-review-title]').inner_text(),'localized review title'
    assert p.locator('[data-review-feedback-text]').inner_text()=='Administrator feedback fixture','review feedback'
    p.locator('#schoolAssignmentAnswer').fill('My revised answer saved on this device')
    p.locator('#saveSchoolAssignmentDraft').click();p.evaluate('redraw()')
    assert p.locator('#schoolAssignmentAnswer').input_value()=='My revised answer saved on this device','draft restored after revisit'
    p.locator('[data-review-server] summary').click()
    assert p.locator('[data-review-server-text]').inner_text()=='Original server answer','expanded original answer'
    p.locator('[data-review-server] summary').click()
    p.screenshot(path=str(OUT/f'{engine}-{lang}-review.png'),full_page=True)
    p.locator('#submitSchoolAssignment').click();p.wait_for_function('QA.calls.length===1 && !document.getElementById("submitSchoolAssignment").disabled')
    assert p.evaluate('QA.row.status')=='submitted','submitted status'
    assert p.evaluate('QA.calls[0].n')=='nh7_submit_school_assignment','existing submit RPC'
    p.evaluate('redraw()');assert p.locator('[data-review-message]').text_content()=='','submitted answer must not be labelled unsent draft'
   scenario('localized revision/draft revisit/one submission '+lang,basic)
  def offline(p):
   p.evaluate('QA.offline=true');p.locator('#schoolAssignmentAnswer').fill('An offline response retained safely');p.locator('#submitSchoolAssignment').click()
   assert p.evaluate('QA.calls.length')==0;msg=p.locator('[data-review-message]').inner_text();assert 'این دستگاه' in msg and 'ابر' not in msg
   p.evaluate('redraw()');assert p.locator('#schoolAssignmentAnswer').input_value()=='An offline response retained safely'
  scenario('offline draft does not claim cloud success or submit',offline)
  def failed(p):
   p.evaluate('QA.fail=true');p.locator('#schoolAssignmentAnswer').fill('Keep this response on submission failure');p.locator('#submitSchoolAssignment').click();p.wait_for_function('QA.calls.length===1 && !document.getElementById("submitSchoolAssignment").disabled')
   assert p.evaluate('QA.row.status')=='needs_revision';p.evaluate('redraw()');assert p.locator('#schoolAssignmentAnswer').input_value().startswith('Keep this')
  scenario('failed request preserves draft and prior review',failed)
  def twice(p):
   p.evaluate('QA.delay=true');p.locator('#schoolAssignmentAnswer').fill('A response that should submit only once');p.locator('#submitSchoolAssignment').click()
   p.evaluate('document.getElementById("submitSchoolAssignment").click()');assert p.evaluate('QA.calls.length')==1
   assert p.locator('#schoolAssignmentAnswer').get_attribute('readonly') is not None
   p.evaluate('QA.release()');p.wait_for_function('!document.getElementById("submitSchoolAssignment").disabled')
  scenario('double submit prevented during request',twice)
  def refreshed(p):
   p.locator('#schoolAssignmentAnswer').fill('Unsaved edits that must survive approval');p.evaluate("QA.row={...QA.row,status:'approved',answer_text:'Approved server text'}")
   p.locator('[data-review-refresh]').click();p.wait_for_function('document.getElementById("schoolAssignmentAnswer").value==="Approved server text"')
   assert p.locator('#submitSchoolAssignment').is_disabled()
   assert p.evaluate('Object.keys(localStorage).filter(x=>x.startsWith("nh7_school_assignment_draft_v467:")).some(x=>JSON.parse(localStorage.getItem(x)).text.startsWith("Unsaved edits"))')
  scenario('approval refresh keeps dirty draft, locks accepted answer',refreshed)
  def stale(p):
   p.locator('#schoolAssignmentAnswer').fill('Typing while checking latest state');p.evaluate("QA.stale=true;QA.row={...QA.row,status:'approved'}")
   p.locator('[data-review-refresh]').click();p.wait_for_function('!document.querySelector("[data-review-refresh]").disabled')
   assert not p.locator('#submitSchoolAssignment').is_disabled();assert p.locator('#schoolAssignmentAnswer').input_value()=='Typing while checking latest state'
  scenario('cached snapshot never announces fresh approval',stale)
  def quota(p):
   p.evaluate("()=>{Storage.prototype.setItem=()=>{throw Error('quota')}}");p.locator('#schoolAssignmentAnswer').fill('Keep typing when quota is exhausted');p.locator('#saveSchoolAssignmentDraft').click()
   assert p.locator('[data-review-message]').get_attribute('data-error')=='1';assert p.locator('#schoolAssignmentAnswer').input_value().startswith('Keep typing')
   p.locator('#submitSchoolAssignment').click();assert p.evaluate('QA.calls.length')==0
  scenario('storage failure truthful, no silent submission',quota)
  def identity(p):
   p.locator('#schoolAssignmentAnswer').fill('Private owner A draft');p.locator('#saveSchoolAssignmentDraft').click()
   p.evaluate("QA.user='b@example.invalid';show('unsubmitted')");assert p.locator('#schoolAssignmentAnswer').input_value()==''
   p.evaluate("QA.user='a@example.invalid';show('needs_revision')");assert p.locator('#schoolAssignmentAnswer').input_value()=='Private owner A draft'
  scenario('new drafts scoped by owner, legacy owner mismatch blocked',identity)
  def legacy(p):
   p.evaluate("localStorage.setItem('nh7_note_school-class_01_new_creation','Old draft remains available');show('unsubmitted')");assert p.locator('#schoolAssignmentAnswer').input_value()=='Old draft remains available'
  scenario('existing unsubmitted legacy draft remains available',legacy)
  def approved(p):
   p.evaluate("show('approved')");assert p.locator('#schoolAssignmentAnswer').get_attribute('readonly') is not None
   assert p.locator('#saveSchoolAssignmentDraft').is_disabled();p.locator('#submitSchoolAssignment').evaluate('(n)=>n.click()');assert p.evaluate('QA.calls.length')==0
  scenario('approved answers read-only and not resubmitted',approved)
  def safe(p):
   p.evaluate("QA.row={...QA.row,admin_feedback:'<img src=x onerror=alert(1)>'};redraw()");assert p.locator('[data-review-feedback-text]').inner_text().startswith('<img');assert p.locator('.nh7-school-review-v467 img').count()==0
  scenario('feedback is text, not executable markup',safe)
  def left(p):
   for count in [3,2,1,0]:
    r=p.evaluate('(left)=>attemptsCheck({class_unlocked:true,attempts_used:3-left,remaining_attempts:left,exam:{max_attempts:3},lessons_complete:true,assignments_approved:true,repeat_required:left===0})',count)
    assert r['a']=={'used':3-count,'left':count,'total':3};assert r['exhausted']==(count==0)
   assert p.evaluate('attemptsCheck({class_unlocked:false,remaining_attempts:0}).a') is None
   assert p.evaluate('attemptsCheck({graduated:true,remaining_attempts:0,attempts_used:0}).a') is None
   assert p.evaluate('attemptsCheck({passed_already:true,remaining_attempts:0,attempts_used:1}).a') is None
  scenario('actual path counters 3/2/1/0, graduates and locks preserved',left)
  def nav(p):
   p.evaluate('QA.delay=true');p.locator('#schoolAssignmentAnswer').fill('A submission then navigate away');p.locator('#submitSchoolAssignment').click()
   p.evaluate("document.getElementById('view').innerHTML='<h2 id=other>Other screen</h2>';QA.release()")
   p.wait_for_timeout(80);assert p.locator('#other').inner_text()=='Other screen';assert p.locator('.nh7-school-review-v467').count()==0
  scenario('late async response does not overwrite another screen',nav)
  def theme(p):
   p.add_script_tag(path=str(ROOT/'js/nh7-theme-studio-v453.js'))
   presets=p.evaluate('Object.keys(NH7ThemeStudioV453.PRESETS)');assert len(presets)==14
   for name in presets:
    p.evaluate('(t)=>NH7ThemeStudioV453.set({preset:t,...NH7ThemeStudioV453.PRESETS[t],fa:"vazirmatn",latin:"inter"})',name)
    actual=p.locator('.nh7-school-review-v467').evaluate('(n)=>getComputedStyle(n).getPropertyValue("--review-accent").trim()')
    assert actual==p.evaluate('(t)=>NH7ThemeStudioV453.PRESETS[t].accent',name)
   for width in [320,390,768]:
    p.set_viewport_size({'width':width,'height':844});b=p.locator('.nh7-school-review-v467').bounding_box();assert b['x']>=0 and b['x']+b['width']<=width+1
   p.screenshot(path=str(OUT/f'{engine}-theme-review.png'),full_page=True)
  scenario('all 14 theme palettes and responsive widths',theme)
  def phone_preview(p):
   p.goto(origin+'/school-review-preview.html');p.wait_for_function('window.NH7_REVIEW_PREVIEW_READY===true')
   assert "connect-src 'none'" in p.locator('meta[http-equiv="Content-Security-Policy"]').get_attribute('content')
   for language in ['fa','en','hr']:
    p.select_option('#pvLang',language)
    for status in ['unsubmitted','submitted','needs_revision','approved']:
     p.locator('[data-sample="'+status+'"]').click()
     assert p.locator('.nh7-review-status467').get_attribute('data-state')==status
    p.locator('[data-sample="needs_revision"]').click()
    p.screenshot(path=str(OUT/f'{engine}-phone-preview-{language}.png'),full_page=True)
   p.locator('#schoolAssignmentAnswer').fill('Simulated preview submission only')
   p.locator('#submitSchoolAssignment').click();p.wait_for_function('document.querySelector(".nh7-review-status467").dataset.state==="submitted"')
   p.locator('#pvReset').click();p.locator('#pvOffline').check();p.locator('#schoolAssignmentAnswer').fill('An offline simulation does not send any data')
   p.locator('#submitSchoolAssignment').click();assert p.locator('.nh7-review-status467').get_attribute('data-state')=='needs_revision'
   for n in ['3','2','1','0']:
    p.select_option('#pvAttempts',n);assert n+' / 3' in p.locator('#pvExam').inner_text()
   p.select_option('#pvTheme','midnight');p.screenshot(path=str(OUT/f'{engine}-phone-preview-dark.png'),full_page=True)
   forbidden=p.evaluate('Object.keys(localStorage).filter(k=>/session|school_access|user_profile|assignment_draft/.test(k))');assert forbidden==[],forbidden
   assert p.evaluate('navigator.serviceWorker.controller===null')
  scenario('phone preview FA/EN/HR/statuses/offline/theme with no account or backend',phone_preview)
  browser.close()
server.shutdown()
report={'passed_groups':len(results),'results':results,'failures':failures,'basis':'Actual schoolLesson extracted from candidate app.js + actual review module + actual path helper source. Synthetic cloud/identity/lesson fixtures; no real account or backend request. Phone preview uses memory-only data and connect-src none.'};(OUT/'report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False));print(json.dumps(report,indent=2,ensure_ascii=False))
if failures:raise SystemExit(1)
