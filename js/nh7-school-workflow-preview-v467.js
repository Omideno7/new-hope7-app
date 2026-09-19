// Isolated QA only: real renderer functions, synthetic data, no production API or login.
import {createSchoolWorkflowV467} from './nh7-school-workflow-v467.js?v=4.6.7';
let language='fa',page='assignment',scenario='needs_revision',row=null,left=3;
const lang=()=>language,L=(fa,en,hr)=>language==='fa'?fa:language==='hr'?hr:en;
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=v=>language==='fa'?String(v??'').replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]):String(v??'');
const code='class_01_new_creation',email='school-preview@example.invalid';
const snapshot=()=>Promise.resolve({progress:[],assignments:row?[row]:[],from_cache:false});
const workflow=createSchoolWorkflowV467({lang,email:()=>email,userName:()=>'',snapshot,rpc:async(name,p)=>{row={...row,id:'sample-assignment',lesson_code:code,user_email:email,answer_text:p.p_answer_text,status:'submitted',admin_feedback:'',submitted_at:new Date().toISOString()};return row}});
function openClassExam(){document.getElementById('notice').textContent=L('این پیش‌نمایش آزمون واقعی ندارد و فرصتی از حساب شما مصرف نمی‌کند.','This preview has no real exam and uses none of your attempts.','Ovaj pretpregled nema stvarni ispit i ne troši vaše pokušaje.');}
function openFinalExam(){openClassExam()}
const CLASS_DEFS=[
  {key:'class_01',n:1,lessons:['class_01_new_creation']},
  {key:'class_02',n:2,lessons:['class_02_holy_spirit']},
  {key:'class_03',n:3,lessons:['class_03_christian_doctrine']},
  {key:'class_04',n:4,lessons:['class_04a_evangelism','class_04b_cell_ministry']},
  {key:'class_05',n:5,lessons:['class_05_character_prosperity']},
  {key:'class_06',n:6,lessons:['class_06_local_assembly']},
  {key:'class_07',n:7,lessons:['class_07_mobile_technology']}
];

function classLabel(n){return L(`کلاس ${N(n)}`,`Class ${n}`,`Razred ${n}`)}
function weekLabel(n){return L(`هفته ${N(n)}`,`Week ${n}`,`Tjedan ${n}`)}

function attemptsHtmlV467(s){
  if(s?.passed_already||s?.graduated||s?.legacy_course_passed)return '';
  const valid=n=>n!==null&&n!==undefined&&Number.isInteger(Number(n))&&Number(n)>=0;
  const max=s?.exam?.max_attempts,left=s?.remaining_attempts,used=s?.attempts_used;
  if(!valid(max)||Number(max)<1||!valid(left)||!valid(used))return '';
  return `<div class="nh7-attempts467 ${Number(left)===0?'is-exhausted':''}"><span>${E(L('فرصت استفاده‌شده','Attempts used','Iskorišteni pokušaji'))}: <strong>${E(N(used))} / ${E(N(max))}</strong></span><span>${E(L('فرصت باقی‌مانده','Attempts remaining','Preostali pokušaji'))}: <strong>${E(N(left))}</strong></span></div>`;
}
function exhaustedV467(s){return s?.exam?.max_attempts!=null&&s?.remaining_attempts!=null&&Number(s.exam.max_attempts)>0&&Number(s.remaining_attempts)===0&&!s?.passed_already&&!s?.graduated}
function statusText(s){if(s?.graduated)return L('قبولی قبلی حفظ شده','Previous graduation preserved','Prethodni završetak je sačuvan');if(s?.passed_already)return L('قبول شده','Passed','Položeno');if(!s?.class_unlocked)return L('قفل','Locked','Zaključano');if(exhaustedV467(s))return L('فرصت‌های آزمون پایان یافته','No attempts remaining','Nema preostalih pokušaja');if(s?.repeat_required)return L('نیاز به تکرار کلاس','Repeat class','Ponovite razred');if(s?.ready)return L('آماده آزمون','Exam ready','Ispit spreman');return L('در حال انجام','In progress','U tijeku')}
function gateText(s){if(!s?.class_unlocked)return L('این کلاس بعد از قبولی در آزمون کلاس قبل باز می‌شود.','This class unlocks after you pass the previous class exam.','Ovaj razred otključava se nakon prolaza prethodnog ispita.');if(exhaustedV467(s))return L('فرصت‌های مجاز این آزمون تمام شده است. برای ادامه با مدیر مدرسه تماس بگیرید؛ پیشرفت قبلی شما حفظ شده است.','The allowed attempts for this exam have been used. Contact the school administrator; your previous progress is preserved.','Iskoristili ste dopuštene pokušaje ovog ispita. Obratite se administratoru; prethodni napredak je sačuvan.');if(s?.repeat_required)return L('این کلاس را از ابتدا دوباره بگذرانید و تمام درس‌های آن را دوباره کامل کنید.','Repeat this class from the beginning and complete all of its lessons again.','Ponovite ovaj razred od početka i ponovno dovršite sve lekcije.');if(!s?.lessons_complete)return L('ابتدا تمام درس‌های این کلاس را کامل کنید.','Complete all lessons in this class first.','Najprije dovršite sve lekcije ovog razreda.');if(!s?.assignments_approved)return L('تکالیف ارسال شده باید توسط ادمین تأیید شوند.','Submitted assignments must be approved by the administrator.','Predane zadatke mora odobriti administrator.');if(s?.ready)return L('همه شرایط کامل است؛ آزمون کلاس باز است.','All requirements are complete; the class exam is open.','Svi uvjeti su ispunjeni; ispit je otvoren.');return''}

function cloneLesson(orig){const c=orig.cloneNode(true);c.removeAttribute('onclick');c.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();orig.click()});return c}
function makeClassCard(def,s,buttons){const article=document.createElement('article');article.className=`nh7-school-class-v351 ${s?.class_unlocked?'is-open':'is-locked'} ${s?.passed_already?'is-passed':''}`;article.innerHTML=`<div class="nh7-class-head-v351"><div><span>${E(weekLabel(def.n))}</span><h3>${E(classLabel(def.n))}</h3><p>${E(statusText(s))}</p></div><b>${s?.passed_already?'✅':s?.class_unlocked?'🔓':'🔒'}</b></div><div class="nh7-class-meta-v351"><span>${E(L('درس‌ها','Lessons','Lekcije'))}: ${E(N(s?.lessons_completed||0))}/${E(N(s?.lessons_total||def.lessons.length))}</span><span>${E(L('تکالیف تأییدشده','Approved assignments','Odobreni zadaci'))}: ${E(N(s?.assignments_approved_count||0))}/${E(N(s?.assignments_total||0))}</span><span>${E(L('مدت این مرحله: ۷ روز','Stage length: 7 days','Trajanje faze: 7 dana'))}</span></div>`;
  article.insertAdjacentHTML('beforeend',attemptsHtmlV467(s));const body=document.createElement('div');body.className='nh7-class-body-v351';article.appendChild(body);
  if(!s?.class_unlocked){body.innerHTML=`<div class="notice">${E(gateText(s))}</div>`;return article}
  const own=buttons.filter(x=>def.lessons.includes(x.code));own.forEach(x=>body.appendChild(cloneLesson(x.button)));
  const msg=gateText(s);if(msg)body.insertAdjacentHTML('beforeend',`<p class="muted">${E(msg)}</p>`);
  const exam=document.createElement('button');exam.className='primary-btn wide-btn nh7-class-exam-v351';exam.disabled=!s?.ready||!!s?.passed_already;exam.innerHTML=s?.graduated?`✅ ${E(L('قبولی قبلی حفظ شده','Previous graduation preserved','Prethodni završetak je sačuvan'))}`:s?.passed_already?`✅ ${E(L('آزمون کلاس قبول شده','Class exam passed','Ispit položen'))}`:`📝 ${E(L('آزمون کلاس','Class Exam','Ispit razreda'))}`;if(s?.ready&&!s?.passed_already)exam.addEventListener('click',()=>openClassExam(def.key));body.appendChild(exam);
  return article}
function renderFinal(final){const d=document.createElement('section');d.className='nh7-final-v351';const passed=Number(final?.passed_classes||0),required=Number(final?.required_classes||7);d.innerHTML=`<div class="nh7-class-head-v351"><div><span>${E(L('پایان دوره','End of course','Kraj tečaja'))}</span><h3>${E(L('امتحان نهایی مدرسه','School Final Examination','Završni ispit škole'))}</h3><p>${E(final?.legacy_course_passed?L('قبولی قبلی مدرسه حفظ شده','Previous school graduation preserved','Prethodni završetak škole je sačuvan'):final?.passed_already?L('قبول شده','Passed','Položeno'):final?.ready?L('آماده آزمون','Exam ready','Ispit spreman'):L(`${N(passed)} از ${N(required)} آزمون کلاسی قبول شده`,`${passed} of ${required} class exams passed`,`${passed} od ${required} razrednih ispita položeno`))}</p></div><b>${final?.passed_already?'✅':final?.ready?'📝':'🔒'}</b></div>`;const b=document.createElement('button');b.className='primary-btn wide-btn';b.disabled=!final?.ready||!!final?.passed_already;b.textContent=final?.legacy_course_passed?L('قبولی قبلی مدرسه حفظ شده','Previous school graduation preserved','Prethodni završetak škole je sačuvan'):final?.passed_already?L('امتحان نهایی قبول شده','Final exam passed','Završni ispit položen'):L('ورود به امتحان نهایی ۵۰سؤالی','Open 50-question final exam','Otvori završni ispit od 50 pitanja');if(final?.ready&&!final?.passed_already)b.addEventListener('click',openFinalExam);d.insertAdjacentHTML('beforeend',attemptsHtmlV467(final));d.appendChild(b);return d}

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
