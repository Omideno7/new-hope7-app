/* New Hope 7 — School rules preview v1.0.0
 * UI-only preview. Does not change lesson content, assignments, exams or production records.
 */
(()=>{'use strict';
if(window.__NH7_SCHOOL_RULES_PREVIEW_V100__)return;window.__NH7_SCHOOL_RULES_PREVIEW_V100__=true;
if(!window.NH7_SCHOOL_RULES_PREVIEW)return;
const SB='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION='nh7_user_session_v170';
const LOCAL='nh7_school_rules_preview_v100';
const CLASS_DEFS=[
  {key:'class_01',n:1,lessons:['class_01_new_creation'],section:/^Class\s*1\b/i},
  {key:'class_02',n:2,lessons:['class_02_holy_spirit'],section:/^Class\s*2\b/i},
  {key:'class_03',n:3,lessons:['class_03_christian_doctrine'],section:/^Class\s*3\b/i},
  {key:'class_04',n:4,lessons:['class_04a_evangelism','class_04b_cell_ministry'],section:/^Class\s*4(?:A|B)?\b/i},
  {key:'class_05',n:5,lessons:['class_05_character_prosperity'],section:/^Class\s*5\b/i},
  {key:'class_06',n:6,lessons:['class_06_local_assembly'],section:/^Class\s*6\b/i},
  {key:'class_07',n:7,lessons:['class_07_mobile_technology'],section:/^Class\s*7\b/i}
];
let applying=false,lastDashboardSignature='',examSessionCache=null;
const lang=()=>{const x=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return ['fa','en','hr'].includes(x)?x:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=n=>lang()==='fa'?String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]):String(n);
function state(){try{return {...{exam:{},repeat:{},sim:{},started:{}},...JSON.parse(localStorage.getItem(LOCAL)||'{}')}}catch(_){return{exam:{},repeat:{},sim:{},started:{}}}}
function save(s){localStorage.setItem(LOCAL,JSON.stringify(s));return s}
function session(){try{return JSON.parse(localStorage.getItem(SESSION)||'null')}catch(_){return null}}
function token(){return session()?.access_token||''}
async function rpc(name,body={}){const t=token();if(!t)throw new Error('login_required');const r=await fetch(`${SB}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'});const tx=await r.text();let x={};try{x=tx?JSON.parse(tx):{}}catch(_){x={message:tx}}if(!r.ok)throw new Error(x?.message||r.statusText);return Array.isArray(x)?(x[0]||{}):x}
async function snapshot(){try{return await rpc('nh7_get_my_school_snapshot_v2110',{})}catch(e){console.warn('[school rules preview snapshot]',e);return{progress:[],assignments:[],error:String(e.message||e)}}}
function rowDone(row){return !!row&&(!!row.completed_at||Number(row.progress_percent||0)>=100)}
function assignmentApproved(row){return String(row?.status||'').toLowerCase()==='approved'}
function lessonCodeFromButton(btn){try{return JSON.parse(btn.dataset.params||'{}').lesson||''}catch(_){const m=String(btn.dataset.params||'').match(/"lesson"\s*:\s*"([^"]+)"/);return m?m[1]:''}}
function isSchoolRoute(){return !!document.querySelector('.nav-item.active[data-route="school"]')}
function deadlineLabel(start){if(!start)return'';const ms=Date.now()-new Date(start).getTime(),used=Math.max(0,Math.floor(ms/86400000)),left=Math.max(0,7-used);return used<7?L(`${N(left)} روز از این هفته باقی مانده است.`,`${N(left)} day${left===1?'':'s'} remain in this class week.`,`${N(left)} dana preostalo je u ovom tjednu nastave.`):L('بازهٔ ۷ روزه این کلاس گذشته است؛ کلاس را در اولین فرصت کامل کنید.','The 7-day class window has passed; complete the class as soon as possible.','Razdoblje od 7 dana je prošlo; dovršite razred što prije.')}
function ensureStart(c,s,unlocked){if(!unlocked||s.started[c.key])return false;s.started[c.key]=new Date().toISOString();return true}
function introHtml(compact=false){return `<section class="nh7-school-rules-intro ${compact?'is-compact':''}" data-school-rules-intro>
  <div class="nh7-school-rules-head"><span>🎓</span><div><h2>${E(L('مسیر مدرسه آنلاین New Hope 7','How New Hope 7 Online School works','Kako funkcionira New Hope 7 Online School'))}</h2><p>${E(L('هر کلاس یک مسیر هفتگی کامل است؛ درس، تکلیف، تأیید ادمین و آزمون همه بخشی از همان مرحله هستند.','Each class is one complete weekly learning cycle: lessons, assignments, admin approval and the class exam belong to the same stage.','Svaki razred je cjelovit tjedni ciklus: lekcije, zadaci, odobrenje administratora i ispit čine jednu fazu.'))}</p></div></div>
  <div class="nh7-school-flow">
    <div><b>1</b><strong>${E(L('یک کلاس = ۷ روز','One class = 7 days','Jedan razred = 7 dana'))}</strong><small>${E(L('تمام درس‌های همان کلاس را در همان هفته بگذرانید.','Complete all lessons for that class during its week.','Dovršite sve lekcije tog razreda tijekom tjedna.'))}</small></div>
    <div><b>2</b><strong>${E(L('تکالیف را کامل کنید','Complete assignments','Dovršite zadatke'))}</strong><small>${E(L('ارسال تکلیف به‌تنهایی کافی نیست.','Submitting alone does not unlock the exam.','Sama predaja ne otključava ispit.'))}</small></div>
    <div><b>3</b><strong>${E(L('منتظر تأیید ادمین بمانید','Wait for admin approval','Pričekajte odobrenje administratora'))}</strong><small>${E(L('فقط وضعیت «تأیید شده» اجازه ورود به آزمون را می‌دهد.','Only an Approved assignment unlocks the class exam.','Samo odobren zadatak otključava ispit.'))}</small></div>
    <div><b>4</b><strong>${E(L('آزمون کلاس','Class exam','Ispit razreda'))}</strong><small>${E(L('بعد از تکمیل درس‌ها و تأیید همه تکالیف، آزمون باز می‌شود.','The exam opens after the lessons are complete and every assignment is approved.','Ispit se otvara nakon dovršenih lekcija i odobrenih zadataka.'))}</small></div>
    <div><b>5</b><strong>${E(L('قبولی → کلاس بعد','Pass → next class','Prolaz → sljedeći razred'))}</strong><small>${E(L('تا قبل از قبولی، محتوای کلاس بعدی قفل و پنهان می‌ماند.','The next class remains locked and hidden until you pass.','Sljedeći razred ostaje zaključan i skriven do prolaza.'))}</small></div>
    <div><b>6</b><strong>${E(L('مردودی → تکرار همان کلاس','Fail → repeat the class','Pad → ponovite razred'))}</strong><small>${E(L('در صورت عدم قبولی، همان کلاس باید از ابتدا دوباره طی شود.','If you do not pass, repeat that class from the beginning before another exam attempt.','Ako ne položite, isti razred treba ponoviti od početka prije novog pokušaja.'))}</small></div>
  </div>
  <p class="nh7-school-rule-note">🔒 ${E(L('این نسخه فقط برای تست است؛ هیچ نتیجه یا تغییری در اطلاعات واقعی مدرسه ذخیره نمی‌شود.','This is a test preview. No result or change is saved to the real School data.','Ovo je testni pregled. Nijedan rezultat ni promjena ne sprema se u stvarne podatke Škole.'))}</p>
</section>`}
function addIntro(){if(!isSchoolRoute())return;const v=document.getElementById('view');if(!v||v.querySelector('[data-school-rules-intro]'))return;if(v.querySelector('.school-course-group'))return;v.insertAdjacentHTML('afterbegin',introHtml(false))}
function statusForClass(c,snap,local){
  const p=new Map((snap.progress||[]).map(x=>[String(x.lesson_code||''),x]));
  const a=new Map((snap.assignments||[]).map(x=>[String(x.lesson_code||''),x]));
  const realLessons=c.lessons.every(code=>rowDone(p.get(code)));
  const realAssignments=c.lessons.every(code=>assignmentApproved(a.get(code)));
  const sim=local.sim?.[c.key]||{};
  const repeat=!!local.repeat?.[c.key];
  const lessonsDone=repeat?!!sim.repeatLessons:(realLessons||!!sim.lessons);
  const assignmentsDone=repeat?!!sim.repeatAssignments:(realAssignments||!!sim.assignments);
  const passed=!!local.exam?.[c.key]?.passed&&!repeat;
  return{realLessons,realAssignments,lessonsDone,assignmentsDone,passed,repeat};
}
function previousPassed(index,local){return index===0||!!local.exam?.[CLASS_DEFS[index-1].key]?.passed&&!local.repeat?.[CLASS_DEFS[index-1].key]}
function lessonButtons(group){return [...group.querySelectorAll('button.list-btn[data-go="school"]')].map(b=>({button:b,code:lessonCodeFromButton(b)})).filter(x=>x.code)}
function classTitle(c,buttons){const match=buttons.find(x=>c.lessons.includes(x.code));const strong=match?.button?.querySelector('strong')?.textContent?.trim();return strong||L(`کلاس ${N(c.n)}`,`Class ${c.n}`,`Razred ${c.n}`)}
function badge(ok,yes,no){return `<span class="nh7-rule-badge ${ok?'ok':'wait'}">${ok?'✓':'○'} ${E(ok?yes:no)}</span>`}
function qaControls(c,st){return `<details class="nh7-school-qa-tools"><summary>${E(L('ابزار تست محلی','Local QA controls','Lokalne QA kontrole'))}</summary><p>${E(L('این دکمه‌ها فقط برای آزمایش قفل‌ها روی همین دستگاه هستند و هیچ دیتای واقعی را تغییر نمی‌دهند.','These buttons only simulate gates on this device and never change real data.','Ovi gumbi samo simuliraju uvjete na ovom uređaju i ne mijenjaju stvarne podatke.'))}</p><div class="button-row">
<button class="secondary-btn" data-qa-lessons="${c.key}">${E(st.repeat?L('شبیه‌سازی: تکرار درس‌ها کامل شد','Simulate: repeated lessons complete','Simuliraj: ponovljene lekcije završene'):L('شبیه‌سازی تکمیل درس‌ها','Simulate lessons complete','Simuliraj dovršene lekcije'))}</button>
<button class="secondary-btn" data-qa-assignments="${c.key}">${E(st.repeat?L('شبیه‌سازی: تکالیف تکرار تأیید شد','Simulate: repeat assignments approved','Simuliraj: ponovljeni zadaci odobreni'):L('شبیه‌سازی تأیید تکالیف','Simulate assignments approved','Simuliraj odobrenje zadataka'))}</button>
</div></details>`}
async function buildDashboard(group){
  const buttons=lessonButtons(group);if(!buttons.length)return;
  const snap=await snapshot();const local=state();let changed=false;
  const sig=JSON.stringify({p:(snap.progress||[]).map(x=>[x.lesson_code,x.completed_at,x.progress_percent]),a:(snap.assignments||[]).map(x=>[x.lesson_code,x.status]),e:local.exam,r:local.repeat,s:local.sim,l:lang()});
  if(sig===lastDashboardSignature&&document.querySelector('[data-school-rules-dashboard]'))return;lastDashboardSignature=sig;
  document.querySelector('[data-school-rules-dashboard]')?.remove();
  group.style.display='none';
  const container=document.createElement('section');container.dataset.schoolRulesDashboard='1';container.className='nh7-school-rules-dashboard';
  let html=introHtml(true)+'<div class="nh7-school-class-list">';
  CLASS_DEFS.forEach((c,index)=>{
    const unlocked=previousPassed(index,local);if(ensureStart(c,local,unlocked))changed=true;
    const st=statusForClass(c,snap,local),title=classTitle(c,buttons),start=local.started?.[c.key];
    const ownButtons=buttons.filter(x=>c.lessons.includes(x.code));
    const classStatus=st.passed?L('قبول شده','Passed','Položeno'):st.repeat?L('باید از ابتدا تکرار شود','Repeat required','Potrebno ponoviti'):unlocked?L('در حال انجام','In progress','U tijeku'):L('قفل','Locked','Zaključano');
    html+=`<article class="nh7-school-class-card ${unlocked?'is-open':'is-locked'} ${st.passed?'is-passed':''}"><div class="nh7-school-class-top"><div><span class="nh7-week-chip">${E(L(`هفته ${N(c.n)}`,`Week ${c.n}`,`Tjedan ${c.n}`))}</span><h3>${E(title)}</h3><p>${E(classStatus)}</p></div><span class="nh7-lock-icon">${st.passed?'✅':unlocked?'🔓':'🔒'}</span></div>`;
    if(!unlocked){html+=`<div class="nh7-school-locked-message">${E(L('بعد از قبولی در آزمون کلاس قبل، این کلاس و تمام محتوای آن باز می‌شود.','This class and all of its content unlock only after you pass the previous class exam.','Ovaj razred i sav njegov sadržaj otključavaju se tek nakon položenog ispita prethodnog razreda.'))}</div></article>`;return}
    html+=`<p class="nh7-deadline">⏱ ${E(deadlineLabel(start))}</p><div class="nh7-rule-status-row">${badge(st.lessonsDone,L('درس‌ها کامل','Lessons complete','Lekcije dovršene'),L('درس‌ها کامل نشده','Lessons incomplete','Lekcije nisu dovršene'))}${badge(st.assignmentsDone,L('تکالیف تأیید شده','Assignments approved','Zadaci odobreni'),L('منتظر تأیید تکالیف','Assignments not approved','Zadaci nisu odobreni'))}</div>`;
    if(st.repeat)html+=`<div class="notice nh7-repeat-notice"><strong>↻ ${E(L('این کلاس باید از ابتدا تکرار شود.','This class must be repeated from the beginning.','Ovaj razred treba ponoviti od početka.'))}</strong><p>${E(L('کلاس بعدی قفل می‌ماند. بعد از مرور دوباره درس‌ها و تأیید دوباره تکالیف، آزمون دوباره باز می‌شود.','The next class stays locked. Re-complete the lessons and obtain assignment approval before the exam opens again.','Sljedeći razred ostaje zaključan. Ponovno dovršite lekcije i dobijte odobrenje zadataka prije novog ispita.'))}</p></div>`;
    html+='<div class="nh7-school-lesson-links">'+ownButtons.map(x=>{const clone=x.button.cloneNode(true);clone.classList.add('nh7-preview-lesson-btn');return clone.outerHTML}).join('')+'</div>';
    if(st.lessonsDone&&st.assignmentsDone&&!st.passed){html+=`<button class="primary-btn wide-btn nh7-class-exam-btn" data-class-exam="${c.key}">📝 ${E(L(`آزمون کلاس ${N(c.n)}`,`Class ${c.n} exam`,`Ispit razreda ${c.n}`))}</button>`}else if(!st.passed){html+=`<div class="nh7-school-exam-lock">🔒 ${E(!st.lessonsDone?L('آزمون بعد از تکمیل همه درس‌های این کلاس باز می‌شود.','The exam opens after all lessons in this class are complete.','Ispit se otvara nakon dovršetka svih lekcija ovog razreda.'):L('درس‌ها کامل شده‌اند؛ آزمون پس از تأیید تکالیف توسط ادمین باز می‌شود.','Lessons are complete; the exam opens after an admin approves every assignment.','Lekcije su dovršene; ispit se otvara nakon odobrenja svih zadataka.'))}</div>`}
    if(st.passed)html+=`<div class="notice success-text">✓ ${E(L('این کلاس با موفقیت گذرانده شده و کلاس بعدی باز شده است.','This class has been passed and the next class is unlocked.','Ovaj razred je položen i sljedeći je otključan.'))}</div>`;
    html+=qaControls(c,st)+'</article>';
  });
  html+='</div><button class="secondary-btn nh7-preview-reset" data-qa-reset-school>↺ '+E(L('پاک‌کردن فقط شبیه‌سازی‌های Preview','Reset Preview simulations only','Poništi samo Preview simulacije'))+'</button>';
  container.innerHTML=html;
  group.parentNode.insertBefore(container,group);
  if(changed)save(local);
  bindDashboard(container);
}
async function examSession(){if(examSessionCache)return examSessionCache;examSessionCache=await rpc('nh7_school_exam_session_v340',{p_course_code:'foundation_school',p_lesson_code:null});return examSessionCache}
function qText(q){const v=q?.question;if(v&&typeof v==='object')return String(v[lang()]||v.en||v.fa||v.hr||'');return String(v||'')}
function optText(o){if(o&&typeof o==='object')return String(o[lang()]||o.en||o.fa||o.hr||'');return String(o||'')}
function sectionText(q){const v=q?.section;if(v&&typeof v==='object')return String(v.en||v[lang()]||v.fa||v.hr||'');return String(v||'')}
async function openClassExam(key){
  const c=CLASS_DEFS.find(x=>x.key===key);if(!c)return;const v=document.getElementById('view');if(!v)return;
  v.innerHTML=`<section class="card"><p>${E(L('در حال آماده‌سازی سؤال‌های واقعی همان کلاس…','Preparing the real questions for this class…','Priprema stvarnih pitanja za ovaj razred…'))}</p></section>`;
  try{
    const s=await examSession(),all=s?.exam?.questions||[],qs=all.filter(q=>c.section.test(sectionText(q)));
    if(!qs.length)throw new Error('class_questions_unavailable');
    v.innerHTML=`<section class="card nh7-preview-class-exam"><button class="secondary-btn" data-preview-exam-back>‹ ${E(L('بازگشت به مدرسه','Back to School','Natrag u školu'))}</button><h2>${E(L(`آزمون کلاس ${N(c.n)}`,`Class ${c.n} exam`,`Ispit razreda ${c.n}`))}</h2><div class="notice"><strong>${E(L('نسخه تست ایمن','Safe test mode','Siguran testni način'))}</strong><p>${E(L('این‌ها سؤال‌های واقعی موجود هستند، اما برای جلوگیری از تغییر اطلاعات مدرسه، پاسخ‌ها به Production ارسال نمی‌شوند. پس از پاسخ‌دادن، فقط نتیجهٔ قبولی یا مردودی را برای آزمایش مسیر شبیه‌سازی می‌کنیم.','These are the existing real questions, but answers are not sent to Production. After answering, you can simulate Pass or Fail only to test the progression flow.','Ovo su postojeća stvarna pitanja, ali odgovori se ne šalju u Production. Nakon odgovora simulira se prolaz ili pad samo radi testiranja toka.'))}</p></div><p class="muted">${E(L('حد قبولی نهایی در سیستم فعلی','Current system passing score','Trenutni prag prolaza'))}: ${N(s?.exam?.passing_score||70)}% · ${N(qs.length)} ${E(L('سؤال','questions','pitanja'))}</p><form data-preview-class-exam-form>${qs.map((q,i)=>`<fieldset class="nh7-preview-exam-q"><legend>${N(i+1)}. ${E(qText(q))}</legend>${(q.options||[]).map((o,j)=>`<label><input type="radio" name="nh7pq_${i}" value="${j}"><span>${E(optText(o))}</span></label>`).join('')}</fieldset>`).join('')}<button class="primary-btn wide-btn" type="submit">${E(L('پایان پاسخ‌ها','Finish answers','Završi odgovore'))}</button></form><div data-preview-exam-result></div></section>`;
    v.querySelector('[data-preview-exam-back]').onclick=()=>document.querySelector('.nav-item[data-route="school"]')?.click();
    v.querySelector('[data-preview-class-exam-form]').onsubmit=e=>{e.preventDefault();const missing=qs.findIndex((_,i)=>!v.querySelector(`input[name="nh7pq_${i}"]:checked`));if(missing>=0){alert(L('لطفاً به همه سؤال‌ها پاسخ بدهید.','Please answer every question.','Odgovorite na sva pitanja.'));v.querySelectorAll('.nh7-preview-exam-q')[missing]?.scrollIntoView({behavior:'smooth'});return}const out=v.querySelector('[data-preview-exam-result]');out.innerHTML=`<div class="notice"><h3>${E(L('شبیه‌سازی نتیجه فقط برای Preview','Simulate result for Preview only','Simuliraj rezultat samo za Preview'))}</h3><p>${E(L('چون این Preview اجازه نوشتن در دیتابیس اصلی را ندارد، یکی از دو نتیجه زیر را انتخاب کنید تا فقط قفل/بازشدن کلاس بعدی را امتحان کنیم.','Because this Preview cannot write to the production database, choose a result below only to test the locking/unlocking flow.','Budući da Preview ne može pisati u produkcijsku bazu, odaberite rezultat samo radi testiranja zaključavanja i otključavanja.'))}</p><div class="button-row"><button class="primary-btn" data-preview-pass="${key}">✓ ${E(L('شبیه‌سازی قبولی','Simulate PASS','Simuliraj PROLAZ'))}</button><button class="secondary-btn" data-preview-fail="${key}">↻ ${E(L('شبیه‌سازی مردودی','Simulate FAIL','Simuliraj PAD'))}</button></div></div>`;out.querySelector('[data-preview-pass]').onclick=()=>setExamResult(key,true);out.querySelector('[data-preview-fail]').onclick=()=>setExamResult(key,false);out.scrollIntoView({behavior:'smooth'});};
  }catch(e){console.warn('[preview class exam]',e);v.innerHTML=`<section class="card"><button class="secondary-btn" data-preview-exam-back>‹ ${E(L('بازگشت','Back','Natrag'))}</button><div class="notice">${E(L('سؤال‌های آزمون باز نشدند. ابتدا با حساب دانشجوی تأییدشده وارد مدرسه شوید.','Exam questions could not be loaded. Sign in with an approved School account first.','Pitanja se nisu mogla učitati. Prijavite se odobrenim školskim računom.'))}</div></section>`;v.querySelector('[data-preview-exam-back]').onclick=()=>document.querySelector('.nav-item[data-route="school"]')?.click()}
}
function setExamResult(key,passed){const s=state();s.exam=s.exam||{};s.repeat=s.repeat||{};s.sim=s.sim||{};if(passed){s.exam[key]={passed:true,at:new Date().toISOString()};delete s.repeat[key];const idx=CLASS_DEFS.findIndex(x=>x.key===key);if(idx>=0&&idx+1<CLASS_DEFS.length&&!s.started?.[CLASS_DEFS[idx+1].key]){s.started=s.started||{};s.started[CLASS_DEFS[idx+1].key]=new Date().toISOString()}}else{s.exam[key]={passed:false,at:new Date().toISOString()};s.repeat[key]=true;s.sim[key]={repeatLessons:false,repeatAssignments:false}}save(s);document.querySelector('.nav-item[data-route="school"]')?.click()}
function mutateSim(key,type){const s=state();s.sim=s.sim||{};s.sim[key]=s.sim[key]||{};if(s.repeat?.[key])s.sim[key][type==='lessons'?'repeatLessons':'repeatAssignments']=true;else s.sim[key][type]=true;save(s);lastDashboardSignature='';schedule()}
function bindDashboard(root){root.querySelectorAll('[data-class-exam]').forEach(b=>b.onclick=()=>openClassExam(b.dataset.classExam));root.querySelectorAll('[data-qa-lessons]').forEach(b=>b.onclick=()=>mutateSim(b.dataset.qaLessons,'lessons'));root.querySelectorAll('[data-qa-assignments]').forEach(b=>b.onclick=()=>mutateSim(b.dataset.qaAssignments,'assignments'));root.querySelector('[data-qa-reset-school]')?.addEventListener('click',()=>{if(confirm(L('فقط وضعیت‌های شبیه‌سازی Preview پاک شوند؟','Reset only local Preview simulation state?','Poništiti samo lokalno Preview stanje?'))){localStorage.removeItem(LOCAL);lastDashboardSignature='';examSessionCache=null;schedule()}})}
function installStyles(){if(document.getElementById('nh7SchoolRulesPreviewStyle'))return;const s=document.createElement('style');s.id='nh7SchoolRulesPreviewStyle';s.textContent=`.nh7-school-rules-intro,.nh7-school-class-card{border:1px solid var(--line,#d9e6f7);border-radius:18px;background:var(--card,#fff);padding:16px;margin:0 0 14px}.nh7-school-rules-head{display:flex;gap:12px;align-items:flex-start}.nh7-school-rules-head>span{font-size:32px}.nh7-school-rules-head h2{margin:0 0 5px}.nh7-school-rules-head p{margin:0;color:var(--muted,#607889)}.nh7-school-flow{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:15px}.nh7-school-flow>div{display:grid;grid-template-columns:34px 1fr;gap:2px 9px;align-items:center;border:1px solid var(--line,#d9e6f7);border-radius:14px;padding:11px;background:var(--soft,#f8fbff)}.nh7-school-flow b{grid-row:1/3;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:var(--brand,#1d4ed8);color:#fff}.nh7-school-flow small{color:var(--muted,#607889)}.nh7-school-rule-note{margin:13px 0 0;font-weight:800}.nh7-school-class-list{display:grid;gap:12px}.nh7-school-class-card.is-locked{opacity:.72;background:var(--soft,#f6f8fb)}.nh7-school-class-card.is-passed{border-color:#78c99d}.nh7-school-class-top{display:flex;justify-content:space-between;gap:12px}.nh7-school-class-top h3{margin:6px 0 2px}.nh7-school-class-top p{margin:0;color:var(--muted,#607889)}.nh7-week-chip{display:inline-block;border-radius:999px;padding:4px 9px;background:#eef5ff;color:#145a8d;font-weight:900;font-size:12px}.nh7-lock-icon{font-size:28px}.nh7-school-locked-message,.nh7-school-exam-lock{padding:12px;border-radius:13px;background:#f3f5f8;margin-top:12px;font-weight:750}.nh7-deadline{font-size:13px;font-weight:800}.nh7-rule-status-row{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.nh7-rule-badge{padding:6px 9px;border-radius:999px;font-weight:850;font-size:12px}.nh7-rule-badge.ok{background:#eafaf1;color:#08783d}.nh7-rule-badge.wait{background:#fff7ed;color:#9a4a05}.nh7-school-lesson-links{display:grid;gap:8px;margin:10px 0}.nh7-school-qa-tools{margin-top:12px;border-top:1px dashed var(--line,#d9e6f7);padding-top:10px}.nh7-school-qa-tools summary{cursor:pointer;font-weight:800}.nh7-school-qa-tools p{font-size:12px;color:var(--muted,#607889)}.nh7-preview-reset{margin:8px 0 20px}.nh7-preview-class-exam{max-width:900px;margin:auto}.nh7-preview-exam-q{border:1px solid var(--line,#d9e6f7);border-radius:14px;padding:12px;margin:13px 0}.nh7-preview-exam-q legend{font-weight:850;line-height:1.55}.nh7-preview-exam-q label{display:flex;gap:9px;border:1px solid var(--line,#e2eaee);border-radius:11px;padding:10px;margin:8px 0}.nh7-preview-exam-q input{width:20px;height:20px}.nh7-repeat-notice{border-color:#f0b48d!important}@media(max-width:640px){.nh7-school-flow{grid-template-columns:1fr}.nh7-school-rules-intro,.nh7-school-class-card{padding:13px}}`;document.head.appendChild(s)}
let timer=0;function schedule(){clearTimeout(timer);timer=setTimeout(apply,120)}
async function apply(){if(applying||!isSchoolRoute())return;applying=true;try{installStyles();const group=document.querySelector('#view .school-course-group');if(group)await buildDashboard(group);else addIntro()}finally{applying=false}}
const view=document.getElementById('view');if(view)new MutationObserver(()=>schedule()).observe(view,{childList:true,subtree:true});
document.addEventListener('click',e=>{if(e.target.closest('.nav-item[data-route="school"]'))setTimeout(()=>schedule(),180)},true);
document.getElementById('langSelect')?.addEventListener('change',()=>{lastDashboardSignature='';examSessionCache=null;setTimeout(()=>schedule(),180)});
window.addEventListener('nh7-preview-write-blocked',e=>{console.info('[NH7 preview blocked write]',e.detail)});
installStyles();schedule();window.NH7_SCHOOL_RULES_PREVIEW_VERSION='1.0.0';
})();
