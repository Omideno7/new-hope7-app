import functools,http.server,threading,json,re,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path.cwd();OUT=R/'qa-drafts-v468';OUT.mkdir(exist_ok=True)
BASE='44dfd189832c4a6031562851765811f941e0efe4'
old=subprocess.check_output(['git','show',BASE+':js/app.js'],text=True);new=Path('js/app.js').read_text()
def chunk(s,a,b):i=s.index(a);return s[i:s.index(b,i)]
STUBS=r'''
let user={id:'draft-user-one',email:'one@example.invalid'},server={id:'assignment-one',user_email:'one@example.invalid',lesson_code:'class_01_new_creation',status:'needs_revision',answer_text:'Previous answer',admin_feedback:'Please clarify this answer.'};
let state={lang:localStorage.getItem('nh7_lang')||'en',route:'school',params:{},stack:[]},nh7NavigationEpochV456=0,hold=false,fail=false,released=null;
const calls=[],view=document.getElementById('view'),$=s=>document.querySelector(s),localNum=String,localText=String;
const authSession=()=>user?{access_token:'synthetic',user}:null,isAccountLoggedIn=()=>!!user,authEmail=()=>user?.email||'',accountCloudEmail=authEmail,currentUserEmail=authEmail;
const schoolDraftsV468=createSchoolDraftsV468({account:()=>user,lang:()=>state.lang});
const tr=k=>({assignment:'Assignment',school:'School',fullLesson:'Lesson',saved:'Saved',loginRequired:'Sign in'})[k]||k;
const html=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])).replace(/\n/g,'<br>');
const card=(title,body,cls='')=>`<section class="card ${cls}"><h2>${html(title)}</h2>${body}</section>`;
const schoolCourseInfo=()=>({code:'foundation_school'}),sermonProgressKey=id=>'nh7_sermon_progress_'+id,formatAudioTime=()=>'';
const bindInlineSermonControls=()=>{},updateInlineSermonPlayers=()=>{},refreshOfflineButtons=async()=>{},renderSchoolExamBlock=()=>'';
const saveSchoolProgress=()=>calls.push('UNEXPECTED progress change'),submitSchoolExam=()=>calls.push('UNEXPECTED exam submit');
const getSchoolSnapshot=async()=>({progress:[{lesson_code:'class_03_christian_doctrine',completed_at:'2026-09-01',progress_percent:100}],assignments:server?[server]:[]});
const getKnownUserProfile=()=>({name:'Test'}),invalidateSchoolSnapshot=()=>{};
const saveNoteCloud=async(...args)=>calls.push(['explicitSave',...args]);
async function cloudRpc(name,args){calls.push([name,args]);if(hold)await new Promise(r=>released=r);if(fail)throw Error('synthetic offline request failure');server={id:'assignment-one',user_email:user.email,lesson_code:args.p_lesson_code,status:'submitted',answer_text:args.p_answer_text,submitted_at:'2026-09-19T15:00:00Z'};return server}
async function cloudFetch(path){calls.push(['read',path]);if(path.startsWith('nh7_account_notes'))return [{note_key:'note_school-class_01_new_creation',content:'Older saved cloud copy'}];return []}
const accountProgressKey=k=>k,restoreAccountProgressValue=()=>{},bindDynamic=()=>{},trackAppSection=()=>{},nh7TrackRenderedContentV223=()=>{},setCrumb=()=>{};
const data={lessons:['class_01_new_creation','class_02_holy_spirit'].map(lesson_code=>({lesson_code,translations:{fa:{class_title:'درس مدرسه',assignment_question:'پاسخ این درس چیست؟'},en:{class_title:'School lesson',assignment_question:'What is your answer?'},hr:{class_title:'Školska lekcija',assignment_question:'Koji je vaš odgovor?'}},written:{fa:{text:'متن درس'},en:{text:'Lesson content'},hr:{text:'Tekst lekcije'}}}))};
async function school(p){if(p.lesson)return schoolLesson(data,p.lesson);view.innerHTML='<h2>School hub</h2>'}
async function home(){view.innerHTML='<h2>Home</h2>'}
function navigate(route,params={}){state.route=route;state.params=params;return render(route,params)}
window.alert=message=>calls.push(['alert',message]);
'''
FOOT=r'''
window.fixture={open:code=>navigate('school',{lesson:code||'class_01_new_creation'}),home:()=>navigate('home'),setLang:lang=>{state.lang=lang;localStorage.setItem('nh7_lang',lang);document.documentElement.lang=lang;document.documentElement.dir=lang==='fa'?'rtl':'ltr'},switchUser:u=>{user=u;server=null},setRow:r=>{server=r},restore:()=>restoreAccountCloudData(true),setHold:v=>{hold=v},release:()=>released?.(),setFail:v=>{fail=v},submit:()=>submitSchoolAssignment('foundation_school','class_01_new_creation',document.getElementById('schoolAssignmentAnswer').value),getCalls:()=>calls,clearCalls:()=>calls.splice(0),drafts:()=>Object.keys(localStorage).filter(k=>k.startsWith('nh7_school_draft_v468:')).map(k=>JSON.parse(localStorage.getItem(k))),emit:event=>{if(event==='hidden'){Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))}else window.dispatchEvent(new Event(event))}};
await fixture.open();window.ready=true;
'''
links='\n'.join(re.findall(r'<link[^>]*rel="stylesheet"[^>]*>',Path('index.html').read_text()))
for label,src in [('baseline',old),('fixed',new)]:
 sections=[chunk(src,'function assignmentStatusText(', 'async function school(params={})'),chunk(src,'async function schoolLesson(', '\n\nfunction examLocalized'),chunk(src,'async function render(', '\nasync function home('),chunk(src,'async function restoreAccountCloudData(', 'function schoolSnapshotCacheKey(')]
 code="import {createSchoolDraftsV468} from './js/nh7-school-drafts-v468.js';\n"+STUBS+'\n'.join(sections)+FOOT
 (R/f'.qa-drafts-{label}.html').write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+links+'</head><body><main id="view" class="view"></main><script type="module">'+code+'</script></body></html>')
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(R)));threading.Thread(target=srv.serve_forever,daemon=True).start();origin=f'http://127.0.0.1:{srv.server_port}'
SENTINELS={'nh7_note_school-class_01_new_creation':'Old explicitly saved draft','nh7_gamification':'{"points":73}','nh7_bookmarks':'["John 3:16"]','nh7_user_session_v170':'SESSION SENTINEL NOT USED','nh7_school_snapshot_one@example.invalid':'{"progress":[{"progress_percent":100}],"assignments":[{"status":"approved"}]}','nh7_audio_media_v397:school-old':'{"web":true}'}
passed=[];failed=[]
with sync_playwright() as pw:
 for engine in ['chromium','webkit']:
  browser=getattr(pw,engine).launch(headless=True)
  def context():
   ctx=browser.new_context(viewport={'width':390,'height':844},service_workers='block');errors=[];external=[]
   ctx.on('page',lambda p:p.on('pageerror',lambda e:errors.append(str(e))))
   def route(r):
    if r.request.url.startswith(origin):r.continue_()
    elif r.request.url.startswith('https://fonts.googleapis.com/') and r.request.resource_type=='stylesheet':r.fulfill(status=200,body='',content_type='text/css')
    else:external.append(r.request.url);r.abort()
   ctx.route('**/*',route)
   ctx.add_init_script('for(const [k,v] of Object.entries('+json.dumps(SENTINELS)+'))if(localStorage.getItem(k)===null)localStorage.setItem(k,v);')
   return ctx,errors,external
  def start(label='fixed'):
   ctx,err,ext=context();p=ctx.new_page();p.goto(origin+'/.qa-drafts-'+label+'.html');p.wait_for_function('window.ready===true');return ctx,p,err,ext
  def intact(ctx,p,err,ext,exclude=()):
   for k,v in SENTINELS.items():
    if k not in exclude:assert p.evaluate('(k)=>localStorage.getItem(k)',k)==v,k
   assert not err,err;assert not ext,ext;ctx.close()
  def record(name,fn):
   try:fn();passed.append(engine+': '+name);print('PASS',engine,name,flush=True)
   except Exception as e:failed.append({'test':engine+': '+name,'error':str(e)});print('FAIL',engine,name,str(e),flush=True)
  def lost_text():
   ctx,p,err,ext=start('baseline');p.locator('textarea').fill('Lost when the old editor is rebuilt');p.evaluate("fixture.emit('hidden');fixture.open()");assert p.locator('textarea').input_value()=='Previous answer';intact(ctx,p,err,ext)
  record('baseline interrupted writing loss reproduced',lost_text)
  def unchanged_ui():
   ctx,a,err,ext=start('baseline');before=a.locator('.school-assignment').evaluate('(n)=>n.outerHTML');photo=a.screenshot()
   b=ctx.new_page();b.goto(origin+'/.qa-drafts-fixed.html');b.wait_for_function('ready===true');after=b.locator('.school-assignment').evaluate('(n)=>n.outerHTML');assert before==after
   assert photo==b.screenshot(),'Existing school layout differs';b.screenshot(path=str(OUT/f'{engine}-unchanged-school.png'));intact(ctx,b,err,ext)
  record('original HTML, buttons, text and initial screen pixel-identical',unchanged_ui)
  def interruption():
   for lang in ['fa','en','hr']:
    ctx,p,err,ext=start();p.evaluate('(l)=>fixture.setLang(l)',lang)
    text='  پاسخ و متن محفوظ '+lang+'\nLine two & <literal> "quotes" 🎓\n\n  پایان  '
    p.locator('textarea').fill(text);assert p.evaluate('fixture.drafts()[0].text')==text
    for ev in ['hidden','blur','pagehide']:p.evaluate('(e)=>fixture.emit(e)',ev)
    p.evaluate('fixture.open()');assert p.locator('textarea').input_value()==text
    p.reload();p.wait_for_function('ready===true');assert p.locator('textarea').input_value()==text
    p.close();p=ctx.new_page();p.goto(origin+'/.qa-drafts-fixed.html');p.wait_for_function('ready===true');assert p.locator('textarea').input_value()==text
    intact(ctx,p,err,ext)
  record('FA/EN/HR exact text after hidden, blur, pagehide, reload and reopened page',interruption)
  def no_event_loss():
   ctx,p,err,ext=start();p.locator('textarea').fill('Input must survive without any final unload event');p.close();p=ctx.new_page();p.goto(origin+'/.qa-drafts-fixed.html');p.wait_for_function('ready===true');assert 'without any final' in p.locator('textarea').input_value();intact(ctx,p,err,ext)
  record('synchronous input persistence does not depend on an unload callback',no_event_loss)
  def local_only():
   ctx,p,err,ext=start();p.evaluate('()=>{Object.defineProperty(navigator,"onLine",{configurable:true,get:()=>false});fixture.clearCalls()}');p.locator('textarea').fill('Offline writing retained locally');p.evaluate("fixture.emit('hidden')");assert p.evaluate('fixture.getCalls().length')==0;p.evaluate('fixture.open()');assert p.locator('textarea').input_value()=='Offline writing retained locally';intact(ctx,p,err,ext)
  record('typing offline makes no API request, submission or progress write',local_only)
  def recovery_vs_cloud():
   ctx,p,err,ext=start();p.locator('textarea').fill('Newer unsent changes');p.evaluate('fixture.restore();');assert p.evaluate('localStorage.getItem("nh7_note_school-class_01_new_creation")')=='Older saved cloud copy';p.evaluate('fixture.open()');assert p.locator('textarea').input_value()=='Newer unsent changes';intact(ctx,p,err,ext,exclude=('nh7_note_school-class_01_new_creation',))
  record('actual cloud-restore function cannot overwrite new local draft',recovery_vs_cloud)
  def accounts_lessons():
   ctx,p,err,ext=start();p.locator('textarea').fill('Private draft for account one, lesson one');p.evaluate("fixture.open('class_02_holy_spirit')");assert p.locator('textarea').input_value()=='';p.locator('textarea').fill('Lesson two independent draft');p.evaluate('fixture.open()');assert 'lesson one' in p.locator('textarea').input_value()
   p.evaluate("fixture.switchUser({id:'draft-user-two',email:'two@example.invalid'});fixture.open()");assert 'Private draft' not in p.locator('textarea').input_value();p.locator('textarea').fill('Second account own draft');p.evaluate("fixture.switchUser({id:'draft-user-one',email:'one@example.invalid'});fixture.open()");assert 'Private draft' in p.locator('textarea').input_value();intact(ctx,p,err,ext)
  record('new drafts isolated by existing account and lesson; legacy keys retained',accounts_lessons)
  def blank_and_ime():
   ctx,p,err,ext=start();p.locator('textarea').fill('');p.evaluate('fixture.open()');assert p.locator('textarea').input_value()==''
   p.evaluate('()=>{const t=document.querySelector("textarea");t.value="پایان نوشتن";t.dispatchEvent(new Event("compositionend"))}');p.evaluate('fixture.open()');assert p.locator('textarea').input_value()=='پایان نوشتن'
   p.evaluate('()=>{document.querySelector("textarea").value="Last unreported input before navigation"}');p.evaluate('fixture.home()');p.evaluate('fixture.open()');assert p.locator('textarea').input_value()=='Last unreported input before navigation';intact(ctx,p,err,ext)
  record('intentional empty answer, composition end and pre-render checkpoint',blank_and_ime)
  def approved_and_sent():
   ctx,p,err,ext=start();p.locator('textarea').fill('My unsent revision');p.evaluate("fixture.setRow({lesson_code:'class_01_new_creation',status:'approved',answer_text:'Accepted original'});fixture.open()");assert p.locator('textarea').is_disabled() and p.locator('textarea').input_value()=='Accepted original';assert p.evaluate('fixture.drafts()[0].text')=='My unsent revision';intact(ctx,p,err,ext)
   ctx,p,err,ext=start();p.locator('textarea').fill('The exact answer I explicitly submit');p.evaluate('fixture.submit()');assert p.evaluate('fixture.drafts()[0].pending') is False
   p.evaluate("fixture.setRow({lesson_code:'class_01_new_creation',status:'needs_revision',answer_text:'New server copy'});fixture.open()");assert p.locator('textarea').input_value()=='New server copy';intact(ctx,p,err,ext,exclude=('nh7_note_school-class_01_new_creation',))
  record('approved answers never replaced; only matching explicit receipt acknowledges draft',approved_and_sent)
  def late_submit():
   ctx,p,err,ext=start();p.locator('textarea').fill('Answer submitted before later edits');p.evaluate('()=>{fixture.setHold(true);window.submitting=fixture.submit()}');p.wait_for_function('fixture.getCalls().some(x=>x[0]==="nh7_submit_school_assignment")');p.locator('textarea').fill('New text typed while the request is in flight');p.evaluate('()=>{fixture.release()}');p.evaluate('window.submitting');assert p.locator('textarea').input_value()=='New text typed while the request is in flight';assert p.evaluate('fixture.drafts()[0].pending') is True;intact(ctx,p,err,ext,exclude=('nh7_note_school-class_01_new_creation',))
  record('late submission response does not clear subsequently typed text',late_submit)
  def failed_submit():
   ctx,p,err,ext=start();p.locator('textarea').fill('Keep my writing after a failed submission');p.evaluate('fixture.setFail(true);fixture.submit()');p.evaluate('fixture.open()');assert p.locator('textarea').input_value()=='Keep my writing after a failed submission';assert p.evaluate('fixture.drafts()[0].pending') is True;intact(ctx,p,err,ext,exclude=('nh7_note_school-class_01_new_creation',))
  record('failed explicit submission retains the draft',failed_submit)
  def repeated_mount_and_manual():
   ctx,p,err,ext=start()
   for _ in range(5):p.evaluate('fixture.open()')
   p.evaluate('()=>{window.writes=0;const old=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith("nh7_school_draft_v468:"))writes++;return old.call(this,k,v)};fixture.clearCalls()}');p.locator('textarea').fill('Single handler and old manual save button');assert p.evaluate('writes')==1 and p.evaluate('fixture.getCalls().length')==0
   p.locator('#saveSchoolAssignmentDraft').click();assert p.evaluate('fixture.getCalls().filter(x=>x[0]==="explicitSave").length')==1;assert p.evaluate('localStorage.getItem("nh7_note_school-class_01_new_creation")')=='Single handler and old manual save button';intact(ctx,p,err,ext,exclude=('nh7_note_school-class_01_new_creation',))
  record('no duplicate listeners; original manual-save action still works',repeated_mount_and_manual)
  def quota():
   for lang in ['fa','en','hr']:
    ctx,p,err,ext=start();p.evaluate('(l)=>{fixture.setLang(l);Storage.prototype.setItem=()=>{throw Error("quota")}}',lang);p.locator('textarea').fill('Keep in memory but never claim persisted');assert p.locator('[data-school-draft-warning468]').count()==1;p.evaluate('fixture.open()');assert p.locator('textarea').input_value()=='Keep in memory but never claim persisted';assert p.locator('[data-school-draft-warning468]').inner_text();intact(ctx,p,err,ext)
  record('storage failure preserves current-session text and warns in all three languages',quota)
  browser.close()
srv.shutdown();report={'baseline':BASE,'passed_groups':len(passed),'results':passed,'failures':failed,'scope':'Actual original/patched schoolLesson, render, submitSchoolAssignment and restoreAccountCloudData source with synthetic dependency functions. Real localStorage, page reopening and browser lifecycle event dispatch; not a physical phone-call/native-device test. No production account, backend request or grade mutation.'}
(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({'passed':len(passed),'failed':len(failed)}))
if failed:raise SystemExit(1)
