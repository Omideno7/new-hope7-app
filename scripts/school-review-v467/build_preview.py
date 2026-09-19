from pathlib import Path
R=Path(__file__).resolve().parents[2]
s=(R/'js/nh7-school-path-v351.js').read_text()
def span(a,b):
 i=s.index(a);return s[i:s.index(b,i)]
parts=[span('const CLASS_DEFS=[','let cache='),span('function classLabel(', 'function cloneLesson('),span('function cloneLesson(', 'async function scan()')]
head="""// Isolated QA only: real renderer functions, synthetic data, no production API or login.
import {createSchoolWorkflowV467} from './nh7-school-workflow-v467.js?v=4.6.7';
let language='fa',page='assignment',scenario='needs_revision',row=null,left=3;
const lang=()=>language,L=(fa,en,hr)=>language==='fa'?fa:language==='hr'?hr:en;
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=v=>language==='fa'?String(v??'').replace(/\\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]):String(v??'');
const code='class_01_new_creation',email='school-preview@example.invalid';
const snapshot=()=>Promise.resolve({progress:[],assignments:row?[row]:[],from_cache:false});
const workflow=createSchoolWorkflowV467({lang,email:()=>email,userName:()=>'',snapshot,rpc:async(name,p)=>{row={...row,id:'sample-assignment',lesson_code:code,user_email:email,answer_text:p.p_answer_text,status:'submitted',admin_feedback:'',submitted_at:new Date().toISOString()};return row}});
function openClassExam(){document.getElementById('notice').textContent=L('این پیش‌نمایش آزمون واقعی ندارد و فرصتی از حساب شما مصرف نمی‌کند.','This preview has no real exam and uses none of your attempts.','Ovaj pretpregled nema stvarni ispit i ne troši vaše pokušaje.');}
function openFinalExam(){openClassExam()}
"""
logic=r"""
function choose(value){
 scenario=value;left=value==='exhausted'?0:3;
 row=value==='draft'?null:{id:'sample-assignment',lesson_code:code,user_email:email,status:['approved','passed','exhausted'].includes(value)?'approved':value,answer_text:L('پاسخ قبلی من به این تکلیف.\nاین متن برای آزمایش است.','My previous assignment answer.\nThis is sample text.','Moj prethodni odgovor na zadatak.\nOvo je primjer teksta.'),admin_feedback:value==='needs_revision'?L('شروع خوبی است. لطفاً نکتهٔ اصلی درس را با زبان خودتان روشن‌تر توضیح دهید.\nیک مثال کاربردی نیز اضافه کنید.','A good start. Please explain the main lesson point more clearly in your own words.\nAdd a practical example.','Dobar početak. Jasnije objasnite glavnu misao lekcije svojim riječima.\nDodajte praktičan primjer.'):'',submitted_at:'2026-09-18T10:00:00Z'};
 render();
}
function render(){
 document.documentElement.lang=language;document.documentElement.dir=language==='fa'?'rtl':'ltr';
 const el=id=>document.getElementById(id);
 el('previewTitle').textContent=L('مدرسه؛ تکلیف و بازخورد','School: assignments and feedback','Škola: zadaci i povratne informacije');
 el('previewHelp').textContent=L('پیش‌نمایش با اطلاعات نمونه؛ بدون ورود به حساب یا تغییر تکالیف واقعی.','Preview with sample data; no account sign-in or real assignment changes.','Pretpregled s primjerima; bez prijave u račun ili izmjene stvarnih zadataka.');
 el('assignmentTab').textContent=L('تکلیف نمونه','Sample assignment','Primjer zadatka');el('classesTab').textContent=L('وضعیت کلاس‌ها','Class status','Status razreda');
 const options=[['needs_revision',L('نیاز به اصلاح','Needs revision','Potrebna dorada')],['submitted',L('در انتظار بررسی','Awaiting review','Na čekanju')],['approved',L('تأیید تکلیف','Assignment approved','Zadatak odobren')],['draft',L('تکلیف جدید','New assignment','Novi zadatak')],['exhausted',L('پایان سه فرصت آزمون','Three attempts used','Tri pokušaja iskorištena')],['passed',L('قبولی در آزمون کلاس','Class exam passed','Ispit položen')]];
 el('previewState').innerHTML=options.map(([v,t])=>'<option value="'+v+'">'+E(t)+'</option>').join('');el('previewState').value=scenario;
 const question=L('نکتهٔ اصلی این درس چیست و چگونه می‌توانید آن را در زندگی روزانه به کار ببرید؟','What is the main point of this lesson, and how can you apply it in daily life?','Koja je glavna misao ove lekcije i kako je možete primijeniti u svakodnevnom životu?');
 if(page==='assignment'){const cfg={code,courseCode:'foundation_school',question,row,snapshot:{from_cache:false}};el('view').innerHTML=workflow.render(cfg);workflow.bind(cfg);return}
 el('view').innerHTML='<div class="nh7-school-list-v351"></div>';const list=el('view').firstChild;
 const defs=CLASS_DEFS;const buttons=defs.flatMap(def=>def.lessons.map(c=>{const b=document.createElement('button');b.className='secondary-btn list-btn';b.textContent=L('مطالعه و تکلیف درس','Study and assignment','Lekcija i zadatak');b.onclick=()=>{page='assignment';render()};return{button:b,code:c}}));
 defs.forEach((def,i)=>{const passed=scenario==='passed'&&i===0;const unlocked=i===0||(scenario==='passed'&&i===1);const approved=row?.status==='approved'&&i===0;list.append(makeClassCard(def,{class_unlocked:unlocked,passed_already:passed,lessons_completed:approved?1:0,lessons_total:def.lessons.length,lessons_complete:approved,assignments_total:1,assignments_approved_count:approved?1:0,assignments_approved:approved,repeat_required:scenario==='exhausted'&&i===0,ready:approved&&!passed&&left>0,remaining_attempts:i===0?left:3,attempts_used:i===0?3-left:0,exam:{max_attempts:3}},buttons))});
 list.append(renderFinal({passed_classes:scenario==='passed'?1:0,required_classes:7,ready:false,exam:null}));
}
document.getElementById('previewLang').onchange=e=>{language=e.target.value;choose(scenario)};
document.getElementById('previewState').onchange=e=>choose(e.target.value);
document.getElementById('assignmentTab').onclick=()=>{page='assignment';render()};
document.getElementById('classesTab').onclick=()=>{page='classes';render()};
const theme=document.getElementById('previewTheme'),studio=window.NH7ThemeStudioV453;
if(studio){theme.innerHTML=Object.entries(studio.PRESETS).map(([v,p])=>'<option value="'+v+'">'+E(v)+'</option>').join('');theme.onchange=()=>studio.set({preset:theme.value,...studio.PRESETS[theme.value],fa:'vazirmatn',latin:'inter'})}
choose(scenario);
"""
(R/'js/nh7-school-workflow-preview-v467.js').write_text(head+'\n'.join(parts)+logic)
html='''<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; object-src 'none'; base-uri 'self'"><title>New Hope 7 — School Preview</title><link rel="stylesheet" href="css/styles.css"><link rel="stylesheet" href="css/nh7-theme-studio-v453.css"><link rel="stylesheet" href="css/nh7-school-workflow-v467.css?v=4.6.7"><style>body{margin:0}.preview-shell{max-width:700px;margin:auto;padding:18px 14px 40px;color:var(--nh7-studio-text,var(--ink))}.preview-head{display:flex;align-items:center;gap:12px}.preview-head img{width:50px;height:50px}.preview-head h1{font-size:1.25rem}.preview-controls{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}.preview-controls select{min-height:44px;width:100%;font:inherit}.preview-controls #previewState{grid-column:1/-1}.preview-tabs{display:flex;gap:10px}.preview-tabs button{flex:1;font:inherit;min-height:44px}.view{padding:0!important;min-height:0!important}.nh7-school-list-v351{display:grid;gap:14px;margin-top:18px}.nh7-school-class-v351,.nh7-final-v351{padding:16px;background:var(--nh7-studio-card,var(--card));border:1px solid var(--line);border-radius:18px}.nh7-class-head-v351{display:flex;justify-content:space-between}.nh7-class-head-v351 h3{margin:4px 0}.nh7-class-meta-v351{display:flex;flex-wrap:wrap;gap:8px;font-size:.8rem;margin:10px 0}.nh7-class-body-v351{display:grid;gap:10px}#previewHelp,#notice{font-size:.86rem;line-height:1.8}</style><script src="js/nh7-theme-studio-v453.js?v=4.5.7" defer></script><script src="js/nh7-school-workflow-preview-v467.js?v=4.6.7" type="module"></script></head><body><div class="preview-shell"><header class="preview-head"><img src="assets/new-hope7-logo-192.png" alt="New Hope 7"><h1 id="previewTitle"></h1></header><p id="previewHelp"></p><div class="preview-controls"><select id="previewLang" aria-label="Language"><option value="fa">فارسی</option><option value="en">English</option><option value="hr">Hrvatski</option></select><select id="previewTheme" aria-label="Theme"></select><select id="previewState" aria-label="Test scenario"></select></div><nav class="preview-tabs"><button class="primary-btn" id="assignmentTab"></button><button class="secondary-btn" id="classesTab"></button></nav><p id="notice" role="status"></p><main id="view" class="view"></main></div></body></html>'''
(R/'school-workflow-preview.html').write_text(html)
print('Created isolated preview: production authentication and APIs are not loaded.')
