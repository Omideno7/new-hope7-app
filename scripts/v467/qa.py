import os,json,subprocess,threading,functools,http.server,wave,math,struct
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path.cwd();OUT=ROOT/'qa-v467';OUT.mkdir(exist_ok=True);Q=ROOT/'.qa-v467';Q.mkdir(exist_ok=True)
BASE='44dfd189832c4a6031562851765811f941e0efe4'
def original(path):return subprocess.check_output(['git','show',BASE+':'+path],text=True)
for file in ['js/app.js','js/nh7-audio-classic-v400.js']:(Q/('baseline-'+Path(file).name)).write_text(original(file))
with wave.open(str(Q/'tone.wav'),'wb') as w:
 w.setparams((1,2,16000,0,'NONE','not compressed'));w.writeframes(b''.join(struct.pack('<h',int(math.sin(i*2*math.pi*220/16000)*1000)) for i in range(16000*8)))
(Q/'index.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body><main id="view"></main><button id="outside">Outside</button></body></html>')
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start();URL=f'http://127.0.0.1:{server.server_port}'
KEY='nh7_user_session_v170';SNAP='nh7_school_snapshot_one@example.invalid'
SENTINELS={'nh7_note_school-class_01_new_creation':'تکلیف من باید محفوظ بماند','nh7_bookmarks':'["John 3:16"]','nh7_gamification':'{"points":103,"badges":["first_verse"]}',SNAP:'{"progress":[{"lesson_code":"class_03_christian_doctrine","progress_percent":100,"completed_at":"2026-09-01"}],"assignments":[{"status":"approved","lesson_code":"class_03_christian_doctrine"}]}','nh7_audio_media_v397:school-class_01_new_creation':'{"web":true,"bytes":256044}'}
BOOT=r'''
window.calls=[];window.blocked=[];window.config={failure:'',slow:0};
window.token=exp=>btoa('{}')+'.'+btoa(JSON.stringify({exp}))+'.synthetic';
window.session=(expired=false)=>({access_token:token(Math.floor(Date.now()/1000)+(expired?-100:3600)),refresh_token:'refresh-original',user:{id:'11111111-1111-4111-8111-111111111111',email:'one@example.invalid',user_metadata:{first_name:'Test'}}});
localStorage.setItem('nh7_user_session_v170',JSON.stringify(session()));window.realFetch=window.fetch.bind(window);
window.fetch=async function(input,init={}){
 const u=new URL(typeof input==='string'?input:input.url,location.href),method=init.method||'GET';
 if(u.hostname==='gpzcwffxnddhaeaogdyo.supabase.co'){
  let body={};try{body=JSON.parse(init.body||'{}')}catch(_){}
  calls.push({path:u.pathname,method,body,token:new Headers(init.headers).get('Authorization')});
  if(u.pathname==='/auth/v1/token'){
   if(config.slow)await new Promise(r=>setTimeout(r,config.slow));
   if(config.failure==='refresh')throw new TypeError('Load failed');
   return new Response(JSON.stringify({access_token:token(Math.floor(Date.now()/1000)+7200),refresh_token:'refresh-rotated'}),{status:200,headers:{'Content-Type':'application/json'}});
  }
  if(u.pathname==='/functions/v1/nh7-school-media-access'){
   if(config.failure==='media')throw new TypeError('Load failed');
   if(config.failure==='403')return new Response(JSON.stringify({code:'school_approval_required'}),{status:403});
   if(config.failure==='401once'&&!config.once){config.once=true;return new Response(JSON.stringify({code:'invalid_session'}),{status:401})}
   if(body.sermon_id==='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')await new Promise(r=>setTimeout(r,350));
   return new Response(JSON.stringify({signed_url:location.origin+'/.qa-v467/tone.wav?lesson='+(body.lesson_code||body.sermon_id),expires_in:21600,mime_type:'audio/wav'}),{status:200,headers:{'Content-Type':'application/json'}});
  }
  return new Response('{}',{status:200,headers:{'Content-Type':'application/json'}});
 }
 if(u.origin!==location.origin){blocked.push(u.origin);throw Error('unexpected external request')}
 if(config.failure==='placeholder'&&u.pathname.endsWith('school_content.json'))throw new TypeError('Load failed');
 return realFetch(input,init);
};
'''
results=[];failures=[]
def run(name,fn):
 try:fn();results.append(name);print('PASS',name,flush=True)
 except Exception as e:failures.append({'name':name,'error':str(e)});print('FAIL',name,str(e),flush=True)
def extract(src,a,b):return src[src.index(a):src.index(b,src.index(a))]
app=Path('js/app.js').read_text();old=original('js/app.js')
loader=extract(app,'async function loadSchoolContent(){','function schoolCourseInfo(')
oldrefresh=extract(old,'async function refreshUserSession(){','function authEmail(')
snapshot=extract(app,'function schoolSnapshotCacheKey(','async function saveQuestionCloud(')
school=extract(app,'async function school(params={}){','async function schoolLesson(')
(Q/'school-functions.js').write_text(loader+snapshot+school+'\nwindow.testSchool={school,signInSchool,loadSchoolContent,invalidateSchoolSnapshot,getSchoolSnapshot};')
(Q/'stubs.js').write_text(r'''
const state={lang:localStorage.getItem('nh7_lang')||'en',params:{},data:{}};const view=document.getElementById('view');const $=s=>document.querySelector(s);
let nh7NavigationEpochV456=1;const EXPLICIT_LOGOUT_KEY='nh7_explicit_logout';
const html=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const tr=x=>x,card=(t,s)=>'<section class="card"><h2>'+t+'</h2>'+s+'</section>',localNum=String;
const currentUserEmail=()=>JSON.parse(localStorage.getItem('nh7_user_session_v170')||'{}').user?.email||'';
const authEmail=currentUserEmail,isAccountLoggedIn=()=>!!currentUserEmail()&&localStorage.getItem(EXPLICIT_LOGOUT_KEY)!=='1',isSchoolIdentityAvailable=isAccountLoggedIn;
const accountLoginError=e=>e.message,bindPasswordToggles=()=>{},getKnownUserProfile=()=>({name:'Test',email:currentUserEmail()});
const clearLegacySchoolSession=()=>{},saveAuthSession=s=>localStorage.setItem('nh7_user_session_v170',JSON.stringify(s));
const signInOrClaimLegacyAccount=async()=>session(),restoreAccountCloudData=async()=>true;
const schoolCourseInfo=l=>({code:'foundation_school',title:{fa:'مدرسه',en:'School',hr:'Škola'},order:1});
const courseAssignmentSummary=()=>({total:0,completed:0,percent:0,rows:new Map()}),assignmentIsCompleted=()=>false;
const registrationFormHtml=()=>'<form id="registration">Registration</form>';window.NH7SchoolPathV351={guideHtml:()=>'<p id="guide">Guide</p>'};
const fetchLatestRegistration=async()=>({status:'approved',email:currentUserEmail()}),logoutAccount=()=>{},schoolLesson=()=>{},schoolCourseExam=()=>{};
const jfetch=async p=>{const r=await fetch(p);return r.json()};let cloudFail=false,malformedSnapshot=false;
const cloudFetch=async p=>{if(cloudFail)throw new TypeError('Load failed');if(p.startsWith('school_lessons'))return[{lesson_code:'class_01_new_creation',lesson_order:1,content_data:{translations:{en:{class_title:'Class one'}}}}];return[]};
const cloudRpc=async()=>{if(cloudFail)throw new TypeError('Load failed');return malformedSnapshot?{}:{progress:[{lesson_code:'class_03_christian_doctrine',progress_percent:100}],assignments:[{lesson_code:'class_03_christian_doctrine',status:'approved'}]}};
const navigate=async(r,params)=>{state.params=params;nh7NavigationEpochV456++;return school(params)};
document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b)navigate(b.dataset.go,JSON.parse(b.dataset.params||'{}'))});
window.setCloudFailure=v=>cloudFail=v;window.setMalformed=v=>malformedSnapshot=v;
''')
with sync_playwright() as pw:
 for engine in ['chromium','webkit']:
  browser=getattr(pw,engine).launch(headless=True)
  def page(lang='en',baseline=False,school_ui=False):
   ctx=browser.new_context(viewport={'width':390,'height':844},locale=lang,service_workers='block');p=ctx.new_page();errs=[];p.on('pageerror',lambda e:errs.append(str(e)))
   ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(URL) else r.abort())
   ctx.add_init_script(BOOT+'\nfor(const [k,v] of Object.entries('+json.dumps(SENTINELS)+'))localStorage.setItem(k,v);localStorage.setItem("nh7_lang",'+json.dumps(lang)+');')
   p.goto(URL+'/.qa-v467/index.html')
   if not baseline:p.add_script_tag(url=URL+'/js/nh7-session-v467.js')
   if school_ui:p.add_script_tag(url=URL+'/.qa-v467/stubs.js');p.add_script_tag(url=URL+'/.qa-v467/school-functions.js')
   return ctx,p,errs
  def script(p,f):p.add_script_tag(url=URL+'/'+f)
  def protect(p,exclude=()):
   for k,v in SENTINELS.items():
    if k not in exclude:assert p.evaluate('(k)=>localStorage.getItem(k)',k)==v,k
   assert not p.evaluate('blocked')
  def card(p,id='school-class_01_new_creation'):
   p.evaluate('''id=>{const c=document.createElement('section');c.dataset.sermonCard=id;c.className=id.startsWith('school-')?'school-audio-card':'';c.innerHTML='<strong>Test lesson</strong><button data-sermon-play>Play</button>';document.getElementById('view').append(c);window.__sermonMap=window.__sermonMap||{};__sermonMap[id]={id,analytics_type:id.startsWith('school-')?'school':'sermon',analytics_id:id,audio_url:id.startsWith('school-')?'nh7-private://school/test':'',title_en:'Test',title_fa:'آزمون',title_hr:'Test',duration_seconds:8}}''',id)
  def original_refresh_bug():
   ctx,p,err=page(baseline=True)
   p.add_script_tag(content="const authSession=()=>JSON.parse(localStorage.getItem('nh7_user_session_v170'));const saveAuthSession=v=>v?localStorage.setItem('nh7_user_session_v170',JSON.stringify(v)):localStorage.removeItem('nh7_user_session_v170');const authApi=async()=>{throw new TypeError('Load failed')};"+oldrefresh+'window.oldRefresh=refreshUserSession;')
   p.evaluate('oldRefresh()');assert p.evaluate('localStorage.getItem("nh7_user_session_v170")') is None;ctx.close()
  run(engine+': baseline session loss reproduced',original_refresh_bug)
  def original_loop():
   ctx,p,err=page(baseline=True);p.evaluate("config.failure='media'");card(p);script(p,'.qa-v467/baseline-nh7-audio-classic-v400.js');p.wait_for_timeout(1600)
   n=p.evaluate("calls.filter(x=>x.path.includes('nh7-school-media-access')).length");assert n>5,n;ctx.close()
  run(engine+': baseline repeated media requests reproduced',original_loop)
  def single_refresh():
   ctx,p,err=page();p.evaluate("localStorage.setItem('nh7_user_session_v170',JSON.stringify(session(true)));config.slow=60;");script(p,'js/nh7-school-media-session-v262.js')
   p.evaluate('Promise.all(Array.from({length:20},(_,i)=>i%2?NH7_SCHOOL_MEDIA_REFRESH(true):NH7_SESSION_V467.token()))')
   assert p.evaluate("calls.filter(x=>x.path==='/auth/v1/token').length")==1
   s=p.evaluate('NH7_SESSION_V467.read()');assert s['refresh_token']=='refresh-rotated' and s['user']['email']=='one@example.invalid';protect(p);assert not err,err;ctx.close()
  run(engine+': 20 refresh callers share one request and keep user metadata',single_refresh)
  def refresh_failure():
   ctx,p,err=page();s=p.evaluate("config.failure='refresh';localStorage.setItem('nh7_user_session_v170',JSON.stringify(session(true)));localStorage.getItem('nh7_user_session_v170')")
   p.evaluate('Promise.all(Array.from({length:12},()=>NH7_SESSION_V467.refresh(true)))');p.evaluate('NH7_SESSION_V467.refresh(true)')
   assert p.evaluate('localStorage.getItem("nh7_user_session_v170")')==s
   assert p.evaluate("calls.filter(x=>x.path==='/auth/v1/token').length")==1;protect(p);assert not err,err;ctx.close()
  run(engine+': refresh failure preserves session and uses cooldown',refresh_failure)
  def account_race():
   for signout in [False,True]:
    ctx,p,err=page();p.evaluate("()=>{config.slow=100;window.pendingRefresh=NH7_SESSION_V467.refresh(true)}");p.wait_for_function("calls.some(x=>x.path==='/auth/v1/token')")
    if signout:p.evaluate("localStorage.setItem('nh7_explicit_logout','1')")
    else:p.evaluate("const n=session();n.user={id:'two',email:'two@example.invalid'};n.access_token+='two';localStorage.setItem('nh7_user_session_v170',JSON.stringify(n))")
    before=p.evaluate('localStorage.getItem("nh7_user_session_v170")');p.evaluate('pendingRefresh');assert before==p.evaluate('localStorage.getItem("nh7_user_session_v170")');protect(p);ctx.close()
  run(engine+': delayed refresh respects logout and account switching',account_race)
  def bounded():
   ctx,p,err=page();p.evaluate("window.fetch=()=>new Promise(()=>{})")
   assert p.evaluate("NH7_SESSION_V467.request('/hang',{}, {timeoutMs:70}).catch(e=>e.code)")=='request_timeout';ctx.close()
   ctx,p,err=page();p.evaluate("window.n=0;window.fetch=async()=>{n++;throw new TypeError('Load failed')}")
   p.evaluate("NH7_SESSION_V467.request('/read',{}, {retryRead:true}).catch(()=>{})");assert p.evaluate('n')==2
   p.evaluate("n=0;NH7_SESSION_V467.request('/write',{method:'POST'}).catch(()=>{})");assert p.evaluate('n')==1;ctx.close()
  run(engine+': timeout, one read retry, no write replay',bounded)
  for language in ['fa','en','hr']:
   def loader_tests(language=language):
    ctx,p,err=page(language,school_ui=True);p.evaluate("config.failure='placeholder'")
    p.evaluate('testSchool.school({enter:true})');assert p.locator('.school-course-group').count()==1;assert p.locator('#schoolSignInBtn').count()==0
    p.evaluate('setCloudFailure(true);testSchool.school({enter:true})');assert p.locator('button[data-params*=enter]').count()==1;assert 'Load failed' not in p.locator('#view').inner_text()
    protect(p,exclude=(SNAP,));p.screenshot(path=str(OUT/f'{engine}-school-retry-{language}.png'))
    p.evaluate('setCloudFailure(false)');p.locator('button[data-params*=enter]').click();p.wait_for_function("document.querySelector('.school-course-group')!==null");assert not err,err;ctx.close()
   run(engine+': '+language+' failed placeholder and recoverable school view',loader_tests)
  def snapshots():
   ctx,p,err=page(school_ui=True);p.evaluate('testSchool.invalidateSchoolSnapshot()');protect(p)
   p.evaluate('setCloudFailure(true)');v=p.evaluate('testSchool.getSchoolSnapshot()');assert v['progress'][0]['progress_percent']==100 and v['assignments'][0]['status']=='approved';protect(p)
   p.evaluate('setCloudFailure(false);setMalformed(true)');v=p.evaluate('testSchool.getSchoolSnapshot()');assert v['progress'][0]['progress_percent']==100;protect(p);assert not err,err;ctx.close()
  run(engine+': malformed/failed snapshots retain accepted work',snapshots)
  def stable_audio():
   ctx,p,err=page();p.evaluate("config.failure='media'");card(p);script(p,'js/nh7-audio-classic-v400.js');p.wait_for_timeout(1700)
   n=p.evaluate("calls.filter(x=>x.path.includes('nh7-school-media-access')).length");assert n==2,n
   p.wait_for_timeout(700);assert p.evaluate("calls.filter(x=>x.path.includes('nh7-school-media-access')).length")==n
   assert not p.locator('[data-classic-toggle]').is_disabled();protect(p);assert not err,err;ctx.close()
  run(engine+': failed signing settles without self-triggering request loop',stable_audio)
  def play_real():
   ctx,p,err=page();card(p);script(p,'js/nh7-audio-classic-v400.js');p.wait_for_function("document.querySelector('[data-classic-status]')?.className==='is-ok'")
   p.locator('[data-classic-toggle]').click();p.wait_for_function("Array.from(document.querySelectorAll('audio')).some(a=>!a.paused&&a.currentTime>0)")
   p.wait_for_timeout(200);p.locator('[data-classic-toggle]').click();p.wait_for_function("Array.from(document.querySelectorAll('audio')).every(a=>a.paused)")
   assert p.evaluate("calls.filter(x=>x.path.includes('nh7-school-media-access')).length")==1;assert not err,err;protect(p);p.screenshot(path=str(OUT/f'{engine}-audio-controls.png'));ctx.close()
  run(engine+': real WAV playback and pause using actual player',play_real)
  def audio401():
   ctx,p,err=page();p.evaluate("config.failure='401once'");card(p);script(p,'js/nh7-audio-classic-v400.js');p.wait_for_function("document.querySelector('[data-classic-status]')?.className==='is-ok'")
   assert p.evaluate("calls.filter(x=>x.path==='/auth/v1/token').length")==1
   assert p.evaluate("calls.filter(x=>x.path.includes('nh7-school-media-access')).length")==2;protect(p);assert not err,err;ctx.close()
  run(engine+': media 401 refreshes once and retries signed access',audio401)
  def forbidden():
   ctx,p,err=page();p.evaluate("config.failure='403'");card(p);script(p,'js/nh7-audio-classic-v400.js');p.wait_for_timeout(1000)
   assert p.evaluate("calls.filter(x=>x.path.includes('nh7-school-media-access')).length")==1
   assert p.evaluate("calls.filter(x=>x.path==='/auth/v1/token').length")==0;protect(p);ctx.close()
  run(engine+': 403 approval denial is preserved',forbidden)
  def lazy_sermons():
   ctx,p,err=page()
   for i in range(5):card(p,f'00000000-0000-4000-8000-00000000000{i}')
   script(p,'js/nh7-audio-classic-v400.js');p.wait_for_timeout(700);assert len(p.evaluate('calls'))==0;protect(p);ctx.close()
  run(engine+': sermon lists no longer bulk-sign audio',lazy_sermons)
  def last_selection():
   ctx,p,err=page();a='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';b='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';card(p,a);card(p,b);script(p,'js/nh7-audio-classic-v400.js')
   p.evaluate('(ids)=>{NH7_AUDIO_CLASSIC_V400.playItem(__sermonMap[ids[0]]);setTimeout(()=>NH7_AUDIO_CLASSIC_V400.playItem(__sermonMap[ids[1]]),40)}',[a,b]);p.wait_for_timeout(800)
   src=p.evaluate("Array.from(document.querySelectorAll('audio')).find(a=>a.src)?.src");assert b in src,src;assert not err,err;ctx.close()
  run(engine+': late request cannot play the previously selected sermon',last_selection)
  def download_kept():
   ctx,p,err=page();card(p)
   p.evaluate('''async()=>{const blob=await (await realFetch('/.qa-v467/tone.wav')).blob();await new Promise((resolve,reject)=>{const q=indexedDB.open('nh7-offline-audio-v397',1);q.onupgradeneeded=()=>q.result.createObjectStore('media',{keyPath:'id'});q.onsuccess=()=>{const d=q.result,t=d.transaction('media','readwrite');t.objectStore('media').put({id:'school-class_01_new_creation',blob});t.oncomplete=()=>{d.close();resolve()}};q.onerror=reject})}''')
   script(p,'js/nh7-audio-classic-v400.js');p.wait_for_timeout(450);p.locator('[data-classic-toggle]').click();p.wait_for_timeout(150)
   p.evaluate("Array.from(document.querySelectorAll('audio')).find(a=>a.src)?.dispatchEvent(new Event('error'))")
   keep=p.evaluate('''()=>new Promise(resolve=>{const q=indexedDB.open('nh7-offline-audio-v397',1);q.onsuccess=()=>{const d=q.result,r=d.transaction('media').objectStore('media').get('school-class_01_new_creation');r.onsuccess=()=>{resolve(!!r.result?.blob);d.close()}}})''');assert keep;protect(p);ctx.close()
  run(engine+': playback error leaves offline audio and metadata intact',download_kept)
  browser.close()
server.shutdown()
(OUT/'report.json').write_text(json.dumps({'baseline':BASE,'passed':len(results),'tests':results,'failures':failures,'scope':'Actual source-extracted school functions and actual audio/coordinator. Synthetic accounts, stubbed API responses, local WAV playback. No real user or protected recording requests, SQL writes or backend authorization changes.'},indent=2,ensure_ascii=False))
if failures:raise SystemExit(1)
