import functools, http.server, json, os, re, subprocess, threading, hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path.cwd();OUT=ROOT/'qa-output';OUT.mkdir(exist_ok=True)
BASE='346e274be35ba422a18c96a82810c33f007c1bed'
def original(path):
 if os.environ.get('NH7_BASE_DIR'):return (Path(os.environ['NH7_BASE_DIR'])/path).read_text()
 return subprocess.check_output(['git','show',BASE+':'+path],text=True)
def function(s,name):
 m=re.search(r'^(?:async )?function '+re.escape(name)+r'\(',s,re.M);assert m,name
 end=s.find('\n',m.start());first=s[m.start():end]
 if first.rstrip().endswith('}'):return first
 return s[m.start():s.index('\n}',m.start())+2]
source=Path('js/app.js').read_text();old=original('js/app.js')
changed=['js/app.js','index.html','service-worker.js','sw-release-core-v403.js']
a=old.index('async function school(');b=old.index('\nasync function schoolLesson(',a)
start=source.index('async function school(');end=source.index('\nasync function schoolLesson(',start)
assert source[:start]==old[:a] and source[end:]==old[b:]
for f in ['js/nh7-school-path-v351.js','js/nh7-school-exam-v344.js','js/nh7-audio-classic-v400.js','js/nh7-theme-studio-v453.js','js/nh7-celebrations-v464.js','css/nh7-celebrations-v464.css','manifest.json','version.json']:
 assert Path(f).read_text()==original(f),f
for f in changed:
 if f.endswith('.js'):subprocess.run(['node','--check',f],check=True)
functions=['school','signInSchool','navigate','back','render','setCrumb','card','html','tr','localNum','isSchoolIdentityAvailable','authSession','saveAuthSession','isExplicitlyLoggedOut','isAccountLoggedIn','authEmail','currentUserEmail','authApi','invokeEdgeFunction','signInOrClaimLegacyAccount','accountLoginError','refreshUserSession','fetchLatestRegistration','cloudFetch','cloudRpc','loadSchoolContent','schoolCourseInfo','lessonHasAssignment','assignmentGroupKey','assignmentIsCompleted','assignmentScoreValue','courseAssignmentSummary','getKnownUserProfile','optionYesNo','registrationFormHtml','clearLegacySchoolSession','bindPasswordToggles']
fixture=r'''
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s)),view=$('#view');
const state={lang:localStorage.getItem('nh7_lang')||'en',route:'home',params:{},stack:[],data:{}};
const AUTH_SESSION_KEY='nh7_user_session_v170',EXPLICIT_LOGOUT_KEY='nh7_explicit_logout',LEGACY_SCHOOL_SESSION_KEY='nh7_legacy_school_session_v1';
const SUPABASE_CONFIG={url:'https://fixtures.invalid',key:'synthetic'},CLOUD_ENABLED=true;
let nh7NavigationEpochV456=0;
window.calls=[];window.alerts=[];window.access=window.access||'approved';window.networkDelay=0;
window.alert=x=>alerts.push(x);window.prompt=()=>null;
function deviceId(){return 'synthetic-device'}
function trackAppSection(){} function nh7TrackRenderedContentV223(){}
function bindDynamic(){$$('[data-go]').forEach(el=>el.onclick=()=>navigate(el.dataset.go,JSON.parse(el.dataset.params||'{}')))}
function home(){view.innerHTML=card('Home','<p id="home">Home</p>')}
function account(){view.innerHTML=card('Account','<p id="account">Account</p>')}
function settings(){view.innerHTML=card('Settings','<p id="settings">Settings</p>')}
function schoolLesson(d,code){view.innerHTML=card('Lesson','<p id="lesson">'+html(code)+'</p>')}
function schoolCourseExam(){view.innerHTML=card('Exam','<p id="exam">Locked exam fixture</p>')}
function logoutAccount(){localStorage.setItem(EXPLICIT_LOGOUT_KEY,'1');saveAuthSession(null);navigate('school',{},true)}
function invalidateSchoolSnapshot(){} async function restoreAccountCloudData(){calls.push('restore-read-only-stub')}
async function getSchoolSnapshot(){if(window.snapshotDelay)await new Promise(r=>setTimeout(r,window.snapshotDelay));return {progress:[],assignments:[]}}
const codes=['class_01_new_creation','class_02_holy_spirit','class_03_christian_doctrine','class_04a_evangelism','class_04b_cell_ministry','class_05_character_prosperity','class_06_local_assembly','class_07_mobile_technology'];
const lessons=codes.map((code,i)=>({lesson_code:code,lesson_order:i+1,content_data:{translations:Object.fromEntries(['fa','en','hr'].map(l=>[l,{class_title:'Class '+(i+1),lesson_title:'Fixture '+code}]))}}));
async function jfetch(path){calls.push(path);return {meta:{protectedContent:true},lessons:[]}}
const goodSession=()=>({access_token:'valid-synthetic',refresh_token:'refresh-synthetic',user:{id:'one',email:'student@example.invalid'}});
window.fetch=async(url,opt={})=>{
 const u=String(url);calls.push(u);if(window.networkDelay)await new Promise(r=>setTimeout(r,window.networkDelay));
 const response=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json'}});
 if(u.includes('grant_type=password'))return JSON.parse(opt.body||'{}').password==='correct'?response(goodSession()):response({message:'Invalid credentials'},400);
 if(u.includes('nh7-claim-legacy-auth'))return response({code:'ACCOUNT_EXISTS',message:'Incorrect password'},409);
 if(u.includes('grant_type=refresh_token'))return response(goodSession());
 if(u.includes('/rest/')&&opt.headers?.Authorization==='Bearer expired-synthetic')return response({message:'JWT expired'},401);
 if(u.includes('/rpc/nh7_registration_access_v2'))return response({found:true,status:window.access,approved:window.access==='approved',payload:{email:'student@example.invalid',firstName:'Student'}});
 if(u.includes('/rpc/nh7_school_path_state_v351'))return response({classes:Array.from({length:7},(_,i)=>({class_key:'class_0'+(i+1),class_unlocked:i===0,lessons_completed:0,lessons_total:1,assignments_approved_count:0,assignments_total:1,ready:false})),final:{passed_classes:0,required_classes:7,ready:false}});
 if(u.includes('school_lessons?')){if(window.lessonDelay)await new Promise(r=>setTimeout(r,window.lessonDelay));return response(lessons)}
 if(u.includes('school_exams?'))return response([]);
 throw Error('Unexpected fixture request: '+u);
};
'''
html='''<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui;margin:20px;background:#eef8ff;color:#14364d}button,input{padding:12px;margin:5px}.card{border-radius:18px;background:white;padding:18px}.school-entry-actions{display:grid}.hidden{display:none}.notice{padding:12px;background:#eef8ff}.wide-btn{width:100%}</style></head><body><header><b>New Hope 7</b><span id="breadcrumb"></span><button id="backBtn">Back</button><select id="langSelect"><option>fa</option><option>en</option><option>hr</option></select></header><main id="view"></main><nav><button class="nav-item" data-route="home">Home</button><button class="nav-item" data-route="school">School</button><button class="nav-item" data-route="settings">Settings</button></nav><script src="HARNESS"></script></body></html>'''
for mode,s in [('before',old),('after',source)]:
 text=s[s.index('const T = {'):s.index('const NEW_BIRTH_VIDEOS = [')]
 compiled=fixture+'\n'+text+'\n'+'\n'.join(function(s,n) for n in functions)
 guide=function(Path('js/nh7-school-path-v351.js').read_text(),'guideHtml')
 compiled+='\n(()=>{const E=html,L=(fa,en,hr)=>state.lang===\'fa\'?fa:state.lang===\'hr\'?hr:en;'+guide+';window.NH7SchoolPathV351={guideHtml};})();\n'
 compiled+=r'''
$$('.nav-item').forEach(el=>el.onclick=()=>navigate(el.dataset.route));$('#backBtn').onclick=back;
$('#langSelect').onchange=e=>{state.lang=e.target.value;localStorage.setItem('nh7_lang',state.lang);document.documentElement.dir=state.lang==='fa'?'rtl':'ltr';render(state.route,state.params)};
window.testApp={navigate,school,signInSchool,render,state,authSession};navigate('school',{},true);
'''
 Path('.qa-'+mode+'.js').write_text(compiled);Path('.qa-'+mode+'.html').write_text(html.replace('HARNESS','.qa-'+mode+'.js'))
 subprocess.run(['node','--check','.qa-'+mode+'.js'],check=True)
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
origin=f'http://127.0.0.1:{server.server_port}'
protected={'nh7_bookmarks':'["John 3:16"]','nh7_sermon_note_example':'یادداشت محفوظ','nh7_gamification':'{"points":150,"badges":["growth_150"]}','nh7_downloads_fixture':'[{"id":"audio1","cached":true}]','nh7_assignment_draft_fixture':'Original assignment text','nh7_school_progress_fixture':'{"marks":[75,80],"approved":true}','nh7_theme_studio_v453':'{"preset":"aurora"}'}
results=[];errors=[]
def record(label,fn):
 try:fn();results.append(label);print('PASS',label,flush=True)
 except Exception as e:errors.append({'case':label,'error':str(e)});print('FAIL',label,repr(e),flush=True)
with sync_playwright() as pw:
 for engine in os.environ.get('NH7_QA_ENGINES','chromium,webkit').split(','):
  browser=getattr(pw,engine).launch(headless=True)
  def page(mode='after',language='fa',signed=False,access='approved',explicit=False,width=390,token='valid-synthetic'):
   ctx=browser.new_context(viewport={'width':width,'height':844},service_workers='block');p=ctx.new_page();p.set_default_timeout(6000)
   fails=[];network=[];p.on('pageerror',lambda e:fails.append(str(e)))
   ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(origin) else (network.append(r.request.url),r.abort()))
   values={**protected,'nh7_lang':language}
   if signed:values['nh7_user_session_v170']=json.dumps({'access_token':token,'refresh_token':'refresh-synthetic','user':{'id':'one','email':'student@example.invalid'}})
   if explicit:values['nh7_explicit_logout']='1'
   values['nh7_school_access']=json.dumps({'status':access,'email':'student@example.invalid'})
   ctx.add_init_script('const seed='+json.dumps(values)+';for(const [k,v]of Object.entries(seed))localStorage.setItem(k,v);window.access='+json.dumps(access)+';')
   p.goto(origin+'/.qa-'+mode+'.html');p.wait_for_function('!!window.testApp&&!!document.querySelector(".school-entry-actions")')
   p.evaluate('document.documentElement.dir=localStorage.getItem("nh7_lang")==="fa"?"rtl":"ltr"')
   return ctx,p,fails,network
  def finish(ctx,p,fails,network):
   for k,v in protected.items():assert p.evaluate('(k)=>localStorage.getItem(k)',k)==v,k
   assert not fails,fails;assert not network,network;ctx.close()
  def entry(p):p.locator('.school-entry-actions button').nth(1).click()
  def login(p,password='correct'):
   p.locator('#schoolLoginEmail').fill('student@example.invalid');p.locator('#schoolLoginPassword').fill(password);p.locator('#schoolSignInBtn').click()
  def courses(p):p.wait_for_selector('.school-course-group');assert p.locator('#schoolSignInBtn').count()==0
  def reproduce():
   c,p,f,n=page('before');entry(p);login(p);p.wait_for_selector('.school-entry-actions');assert p.locator('.school-course-group').count()==0;assert p.evaluate('testApp.state.params')=={};finish(c,p,f,n)
  record(engine+': original loop reproduced after successful password sign-in',reproduce)
  for language in ['fa','en','hr']:
   def hub():
    c,p,f,n=page(language=language);assert p.locator('.school-entry-actions button').count()==3 and p.evaluate('calls.length')==0
    assert p.locator('.notice p').inner_text().strip()
    p.locator('.school-entry-actions button').nth(0).click();p.wait_for_selector('.nh7-school-guide-entry-v458');assert p.locator('#schoolSignInBtn').count()==0
    p.locator('[data-go="school"]').click();p.wait_for_selector('.school-entry-actions');p.locator('.school-entry-actions button').nth(2).click();p.wait_for_selector('#reg_email');assert p.locator('#reg_password').count()==1
    assert p.evaluate('calls.length')==0;finish(c,p,f,n)
   record(engine+': '+language+' hub, guide/back and registration without loading protected lessons',hub)
   def success():
    c,p,f,n=page(language=language);entry(p);p.wait_for_selector('#schoolLoginEmail');assert p.evaluate('calls.length')==0
    login(p);courses(p);assert p.evaluate('testApp.state.params.enter') is True
    p.screenshot(path=str(OUT/f'{engine}-{language}-school-open.png'))
    p.locator('.nav-item[data-route="home"]').click();p.wait_for_selector('#home');p.locator('.nav-item[data-route="school"]').click();p.wait_for_selector('.school-entry-actions');entry(p);courses(p)
    assert p.evaluate('calls.filter(x=>x.includes("grant_type=password")).length')==1;finish(c,p,f,n)
   record(engine+': '+language+' fresh login reaches classes and next visit reuses sign-in',success)
   def signed():
    c,p,f,n=page(language=language,signed=True);entry(p);courses(p);assert not p.evaluate('calls.some(x=>x.includes("grant_type=password"))')
    p.locator('#backBtn').click();p.wait_for_selector('.school-entry-actions');assert p.locator('.school-entry-actions button').count()==3;finish(c,p,f,n)
   record(engine+': '+language+' approved account enters directly and Back keeps hub',signed)
   def pending():
    c,p,f,n=page(language=language,access='pending');entry(p);login(p);p.wait_for_selector('#schoolLogoutBtn');assert p.locator('.school-course-group').count()==0
    assert not p.evaluate('calls.some(x=>x.includes("school_lessons?"))')
    p.evaluate('window.access="approved"');p.locator('[data-params=\'{"enter":true}\']').click();courses(p);finish(c,p,f,n)
   record(engine+': '+language+' pending remains locked and Refresh checks approval without looping',pending)
   def rejected():
    c,p,f,n=page(language=language,signed=True,access='rejected');entry(p);p.wait_for_selector('#schoolLogoutBtn');assert p.locator('.school-course-group').count()==0;assert not p.evaluate('calls.some(x=>x.includes("school_lessons?"))');finish(c,p,f,n)
   record(engine+': '+language+' rejected registration cannot view lessons',rejected)
   def logout():
    c,p,f,n=page(language=language,signed=True,explicit=True);entry(p);p.wait_for_selector('#schoolLoginEmail');assert not p.evaluate('calls.some(x=>x.includes("school_lessons?"))');finish(c,p,f,n)
   record(engine+': '+language+' explicit sign-out still requires credentials',logout)
   def wrong():
    c,p,f,n=page(language=language);entry(p);login(p,'wrong');p.wait_for_function('alerts.length>0');assert p.locator('#schoolSignInBtn').count()==1 and p.locator('.school-course-group').count()==0;login(p);courses(p);finish(c,p,f,n)
   record(engine+': '+language+' incorrect password stays on form; corrected password succeeds',wrong)
  def refresh():
   c,p,f,n=page(signed=True,token='expired-synthetic');entry(p);courses(p);assert p.evaluate('calls.some(x=>x.includes("grant_type=refresh_token"))');finish(c,p,f,n)
  record(engine+': existing expired-token recovery still reaches school',refresh)
  def concurrency():
   for delay in ['networkDelay','lessonDelay','snapshotDelay']:
    c,p,f,n=page(signed=True);p.evaluate('(d)=>window[d]=250',delay);entry(p);p.wait_for_timeout(40);p.locator('.nav-item[data-route="settings"]').click();p.wait_for_selector('#settings');p.wait_for_timeout(650);assert p.locator('#settings').count()==1;finish(c,p,f,n)
  record(engine+': delayed school responses cannot overwrite another route',concurrency)
  def path_layer():
   c,p,f,n=page(signed=True);p.add_script_tag(url=origin+'/js/nh7-school-path-v351.js');entry(p);p.wait_for_selector('[data-school-path-v351]');assert p.locator('.nh7-school-class-v351').count()==7
   assert p.locator('.nh7-school-class-v351.is-locked').count()==6 and p.locator('.nh7-class-exam-v351').first.is_disabled()
   p.screenshot(path=str(OUT/f'{engine}-seven-classes.png'))
   p.locator('.nav-item[data-route="school"]').click();p.wait_for_selector('.school-entry-actions');assert p.locator('[data-school-path-v351]').count()==0;finish(c,p,f,n)
  record(engine+': actual v351 layer mounts seven class cards after approved entry',path_layer)
  browser.close()
server.shutdown()
report={'baseline':BASE,'passed_groups':len(results),'results':results,'failures':errors,'runtime_blobs':{p:hashlib.sha1(b'blob '+str(len(Path(p).read_bytes())).encode()+b'\0'+Path(p).read_bytes()).hexdigest() for p in changed},'scope':'Actual source-extracted router, school, sign-in, token refresh, registration loader and v351 path UI. Synthetic credentials, lessons, path state and mocked network only; no real account, Supabase or student writes. Unrelated runtime bytes preserved.'}
(OUT/'report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False));print('REPORT',report['passed_groups'],'groups;',len(errors),'failures')
if errors:raise SystemExit(1)
