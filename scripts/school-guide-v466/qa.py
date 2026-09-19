"""Scoped guide-placement regression. All account/cloud values are synthetic."""
import functools, hashlib, http.server, json, os, subprocess, threading
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE='5e8e822616b22774560796155e4e181c1671bb8e'
ROOT=Path.cwd(); OUT=ROOT/'qa-output'; OUT.mkdir(exist_ok=True)
paths=['js/nh7-school-path-v351.js','index.html','service-worker.js','sw-release-core-v403.js']
old={p:Path(p).read_text() for p in paths}
assert old[paths[0]].count('wrap.innerHTML=guideHtml();')==1
new={**old}
new[paths[0]]=old[paths[0]].replace('wrap.innerHTML=guideHtml();','')
new['index.html']=old['index.html'].replace('js/nh7-school-path-v351.js?v=4.6.4','js/nh7-school-path-v351.js?v=4.6.6').replace('service-worker.js?v=4.6.5','service-worker.js?v=4.6.6')
new['service-worker.js']=old['service-worker.js'].replace('sw-release-core-v403.js?v=4.6.5','sw-release-core-v403.js?v=4.6.6')
new['sw-release-core-v403.js']=old['sw-release-core-v403.js'].replace('4.6.5-school-entry','4.6.6-school-guide').replace('nh7-release-core-v465-school-entry','nh7-release-core-v466-school-guide')
for path,value in new.items():
 assert value!=old[path],path
 Path(path).write_text(value)
for path in [paths[0],'service-worker.js','sw-release-core-v403.js']:subprocess.run(['node','--check',path],check=True)
assert new[paths[0]].replace("wrap.className='nh7-school-path-v351';", "wrap.className='nh7-school-path-v351';wrap.innerHTML=guideHtml();")==old[paths[0]]
app=Path('js/app.js').read_text(); school=app[app.index('async function school(params={}){'):app.index('async function signInSchool(){')]
assert "navigate('school',{enter:true},true);" in app
Path('.qa-school-path-before.js').write_text(old[paths[0]])
Path('.qa-school-function.js').write_text(school)
STUB=r'''
const view=document.getElementById('view'),$=s=>document.querySelector(s);
let nh7NavigationEpochV456=1; const state={lang:localStorage.getItem('nh7_lang'),route:'school'};
const html=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tr=x=>x,localNum=x=>String(x),card=(t,s)=>'<section class="card"><h2>'+html(t)+'</h2>'+s+'</section>';
const codes=['class_01_new_creation','class_02_holy_spirit','class_03_christian_doctrine','class_04a_evangelism','class_04b_cell_ministry','class_05_character_prosperity','class_06_local_assembly','class_07_mobile_technology'];
const loadSchoolContent=async()=>({lessons:codes.map((c,i)=>({lesson_code:c,lesson_order:i,translations:Object.fromEntries(['fa','en','hr'].map(l=>[l,{class_title:'Lesson '+(i+1),lesson_title:c}]))}))});
let logged=true,access={status:'approved'};
const isSchoolIdentityAvailable=()=>logged,fetchLatestRegistration=async()=>access,currentUserEmail=()=> 'fixture@example.invalid';
const getKnownUserProfile=()=>({name:'Test account',email:currentUserEmail()}),cloudFetch=async()=>[],getSchoolSnapshot=async()=>({progress:[],assignments:[]});
const schoolCourseInfo=()=>({code:'foundation_school',order:1,title:{fa:'مدرسه',en:'School',hr:'Škola'}});
const courseAssignmentSummary=()=>({total:0,rows:new Map()}),assignmentIsCompleted=()=>false;
const bindPasswordToggles=()=>{},signInSchool=()=>{},registrationFormHtml=()=>'<form id="registration-fixture"></form>',logoutAccount=()=>{};
const schoolLesson=async(d,c)=>{view.innerHTML='<p id="lesson-fixture">'+html(c)+'</p>'},schoolCourseExam=()=>{};
async function navigate(route,params={}){nh7NavigationEpochV456++;await school(params)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-go="school"]');if(b)navigate('school',JSON.parse(b.dataset.params||'{}'))});
'''
fixture='''<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:16px sans-serif;margin:20px;background:#f5faff;color:#16364c}.card{background:white;border-radius:16px;padding:16px}.school-entry-actions{display:grid;gap:12px}button{padding:12px;cursor:pointer} .nav-item{display:none}</style><body><button class="nav-item active" data-route="school"></button><select id="langSelect"><option value="en">EN</option><option value="fa">FA</option><option value="hr">HR</option></select><main id="view"></main><script>'''+STUB+'''</script><script src=".qa-school-function.js"></script><script src="__PATH__"></script></body></html>'''
Path('.qa-school-guide.html').write_text(fixture.replace('__PATH__',paths[0]));Path('.qa-school-before.html').write_text(fixture.replace('__PATH__','.qa-school-path-before.js'))
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start();origin=f'http://127.0.0.1:{server.server_port}'
protected={'nh7_note_fixture':'یادداشت','nh7_gamification':'{"points":57}', 'nh7_audio_media_v397:fixture':'{"downloaded":true}','nh7_school_progress_fixture':'{"score":85}', 'nh7_user_session_v170':json.dumps({'access_token':'synthetic-test-only','user':{'id':'fixture','email':'fixture@example.invalid'}})}
cloud={'classes':[{'class_key':f'class_{n:02d}','class_unlocked':n==1,'ready':False,'lessons_total':2 if n==4 else 1} for n in range(1,8)],'final':{'ready':False,'passed_classes':0,'required_classes':7}}
results=[]
with sync_playwright() as pw:
 for engine in os.environ.get('NH7_QA_ENGINES','chromium,webkit').split(','):
  browser=getattr(pw,engine).launch(headless=True)
  for language in ['fa','en','hr']:
   ctx=browser.new_context(viewport={'width':390,'height':844});errors=[];bad=[]
   ctx.add_init_script('for(const [k,v] of Object.entries('+json.dumps({**protected,'nh7_lang':language})+'))localStorage.setItem(k,v);')
   def route(r):
    if r.request.url.startswith(origin):r.continue_()
    elif r.request.url=='https://gpzcwffxnddhaeaogdyo.supabase.co/rest/v1/rpc/nh7_school_path_state_v351':r.fulfill(status=200,content_type='application/json',body=json.dumps(cloud))
    else:bad.append(r.request.url);r.abort()
   ctx.route('**/*',route);p=ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
   if language=='en':
    p.goto(origin+'/.qa-school-before.html');p.evaluate('school({enter:true})');p.wait_for_selector('[data-school-path-v351]');assert p.locator('[data-school-path-v351] .nh7-school-guide-v351').count()==1
    results.append(engine+': reproduced duplicate in baseline')
   p.goto(origin+'/.qa-school-guide.html');p.evaluate('document.documentElement.dir=state.lang==="fa"?"rtl":"ltr";school({})')
   assert p.locator('.school-entry-actions>button').count()==3
   p.locator('.school-entry-actions>button').nth(0).click();p.wait_for_selector('.nh7-school-guide-v351');assert p.locator('.nh7-school-guide-v351 ol>li').count()==5
   p.screenshot(path=str(OUT/f'{engine}-{language}-hub-guide.png'))
   p.locator('#view [data-go="school"]').last.click();p.wait_for_selector('.school-entry-actions')
   p.locator('.school-entry-actions>button').nth(1).click();p.wait_for_selector('[data-school-path-v351]')
   assert p.locator('.nh7-school-class-v351').count()==7
   assert p.locator('.nh7-school-guide-v351').count()==0
   assert p.locator('.nh7-school-class-v351.is-locked').count()==6
   assert p.locator('.nh7-final-v351 button').is_disabled()
   p.screenshot(path=str(OUT/f'{engine}-{language}-classes.png'))
   p.evaluate('window.dispatchEvent(new Event("focus"))');p.wait_for_timeout(400);assert p.locator('.nh7-school-guide-v351').count()==0
   p.locator('.nh7-school-class-v351.is-open .list-btn').first.click();p.wait_for_selector('#lesson-fixture');assert p.locator('.nh7-school-guide-v351').count()==0
   p.evaluate('school({})');p.locator('.school-entry-actions>button').nth(0).click();assert p.locator('.nh7-school-guide-v351').count()==1
   p.evaluate('school({form:true})');assert p.locator('#registration-fixture').count()==1
   p.evaluate('logged=false;school({enter:true})');assert p.locator('#schoolLoginEmail').count()==1
   for k,v in protected.items():assert p.evaluate('(k)=>localStorage.getItem(k)',k)==v,k
   assert not errors,errors;assert not bad,bad
   results.append(engine+': '+language+' hub guide, no class guide, 7 class cards, locks, refresh, lesson, registration, guest entry and storage');ctx.close()
  browser.close()
server.shutdown()
report={'baseline':BASE,'passed_groups':len(results),'results':results,'scope':'Actual school function extracted unchanged from app.js and actual School Path JS; synthetic cloud, accounts, and lessons. No production request. No native-device test.'}
(OUT/'report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False));print(json.dumps(report,ensure_ascii=False,indent=2))
(OUT/'before-release-core.js').write_text(old['sw-release-core-v403.js'])
print('runtime_blobs',json.dumps({p:hashlib.sha1(('blob '+str(len(Path(p).read_bytes()))+'\0').encode()+Path(p).read_bytes()).hexdigest() for p in paths},indent=2))
