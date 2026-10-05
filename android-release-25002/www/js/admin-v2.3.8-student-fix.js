/* New Hope 7 Admin v2.3.8 — isolated, real student profile and assignment review */
(()=>{'use strict';
const VERSION='2.3.8';
const L=(fa,en,hr)=>typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en;
const E=value=>typeof h==='function'?h(value):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=value=>Number(value||0);
const EMAIL=value=>String(value||'').trim().toLowerCase();
const DATE=value=>{if(!value||String(value).includes('-infinity'))return'-';const d=new Date(value);return Number.isNaN(d.getTime())?'-':d.toLocaleString(typeof lang!=='undefined'&&lang==='fa'?'fa-IR':typeof lang!=='undefined'&&lang==='hr'?'hr-HR':'en-US')};
const FMT=value=>{let s=Math.max(0,Math.round(N(value)));const hh=Math.floor(s/3600),mm=Math.floor((s%3600)/60),ss=s%60;return hh?`${hh}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`:`${mm}:${String(ss).padStart(2,'0')}`};

if(typeof state!=='object'||!state)return;
state.studentProfileV238=state.studentProfileV238&&typeof state.studentProfileV238==='object'?state.studentProfileV238:{};
state.schoolAssignments=Array.isArray(state.schoolAssignments)?state.schoolAssignments:[];
state.schoolAssignmentsError='';
let assignmentsBusyV238=false;

function unwrapRpc(value){
  let data=value;
  for(let i=0;i<4&&Array.isArray(data)&&data.length===1;i++)data=data[0];
  if(data&&typeof data==='object'&&!Array.isArray(data)){
    const keys=Object.keys(data);
    if(keys.length===1&&/^nh7_admin_/.test(keys[0]))data=data[keys[0]];
  }
  return data;
}
function profileState(email){return state.studentProfileV238[EMAIL(email)]||null}
function statusInfo(status){status=String(status||'submitted').toLowerCase();if(status==='approved')return['approved',L('تأیید شده','Approved','Odobreno')];if(status==='needs_revision')return['rejected',L('نیاز به اصلاح','Needs revision','Potrebna dorada')];return['pending',L('در انتظار بررسی','Pending review','Čeka pregled')]}
function lessonName(code){try{if(typeof assignmentLessonTitle==='function')return assignmentLessonTitle(code)}catch(_){}const row=(state.schoolLessons||[]).find(x=>String(x.lesson_code||'')===String(code||'')),d=row?.content_data||{},tx=d.translations?.[typeof lang!=='undefined'?lang:'fa']||d.translations?.fa||d.translations?.en||{};return tx.class_title||tx.lesson_title||code||'-'}
function courseName(code){const row=(state.schoolCourses||[]).find(x=>String(x.course_code||'')===String(code||''));return row?.['title_'+(typeof lang!=='undefined'?lang:'fa')]||row?.title_fa||row?.title_en||code||'foundation_school'}

async function loadAssignmentsV238(redraw=true){
  if(assignmentsBusyV238||typeof token==='undefined'||!token)return;
  assignmentsBusyV238=true;
  try{
    const raw=await adminRpc('nh7_admin_school_assignments_feed_v238',{p_limit:5000});
    const data=unwrapRpc(raw)||{};
    const rows=Array.isArray(data.rows)?data.rows:Array.isArray(data)?data:[];
    state.schoolAssignments=rows;
    state.schoolAssignmentsError='';
  }catch(error){
    state.schoolAssignmentsError=error?.message||String(error);
    try{
      const rows=await authFetch('/rest/v1/school_assignments?select=*&order=updated_at.desc&limit=5000');
      state.schoolAssignments=Array.isArray(rows)?rows:[];
      state.schoolAssignmentsError='';
    }catch(fallbackError){state.schoolAssignmentsError=fallbackError?.message||String(fallbackError)}
  }finally{
    assignmentsBusyV238=false;
    if(redraw&&typeof render==='function')render();
  }
}
window.nh7LoadAssignmentsV238=loadAssignmentsV238;

async function loadStudentProfileV238(email,redraw=true){
  email=EMAIL(email);if(!email||typeof token==='undefined'||!token)return;
  state.studentProfileV238[email]={loading:true,error:''};
  if(redraw&&typeof render==='function')render();
  try{
    const raw=await adminRpc('nh7_admin_student_profile_v238',{p_email:email});
    const data=unwrapRpc(raw)||{};
    state.studentProfileV238[email]={loading:false,error:'',school:data.school||{},activity:data.activity||{}};
  }catch(error){
    state.studentProfileV238[email]={loading:false,error:error?.message||String(error),school:{},activity:{}};
  }
  if(redraw&&typeof render==='function')render();
}
window.nh7LoadStudentProfileV238=loadStudentProfileV238;

function assignmentCard(row,context='profile'){
  const [pillClass,pillText]=statusInfo(row.status),id=String(row.id||''),safeId=E(id),prefix=context==='profile'?'p238':'a238';
  return `<article class="nh7-v238-assignment-card"><div class="req-head"><div><strong>${E(lessonName(row.lesson_code))}</strong><div class="req-meta">${E(courseName(row.course_code||'foundation_school'))} · ${E(DATE(row.submitted_at||row.updated_at))}<br>${E(row.user_name||'')} ${row.user_email?`· ${E(row.user_email)}`:''}</div></div><span class="pill ${pillClass}">${E(pillText)}</span></div><div class="nh7-v238-answer"><b>${E(L('پاسخ دانشجو','Student answer','Odgovor studenta'))}</b><p>${E(row.answer_text||L('پاسخی ثبت نشده است.','No answer was recorded.','Odgovor nije zabilježen.'))}</p></div><div class="grid2"><label>${E(L('امتیاز تکلیف','Assignment score','Ocjena zadatka'))}<input id="${prefix}_score_${safeId}" type="number" min="0" max="100" value="${E(row.score_percent??100)}"></label><label>${E(L('بازخورد برای دانشجو','Feedback for student','Povratna informacija'))}<textarea id="${prefix}_feedback_${safeId}" placeholder="${E(L('برای اصلاح، توضیح دقیق را اینجا بنویسید.','Write clear revision instructions here.','Napišite jasne upute za doradu.'))}">${E(row.admin_feedback||'')}</textarea></label></div><div class="actions"><button type="button" class="btn primary" onclick="nh7ReviewAssignmentV238('${safeId}','approved','${prefix}')">✓ ${E(L('تأیید تکلیف','Approve assignment','Odobri zadatak'))}</button><button type="button" class="btn danger-btn" onclick="nh7ReviewAssignmentV238('${safeId}','needs_revision','${prefix}')">↻ ${E(L('نیاز به اصلاح و اطلاع‌رسانی','Needs revision & notify','Dorada i obavijest'))}</button></div>${row.admin_feedback?`<div class="nh7-v238-feedback"><b>${E(L('بازخورد ثبت‌شده','Saved feedback','Spremljena povratna informacija'))}:</b> ${E(row.admin_feedback)}</div>`:''}</article>`;
}
window.nh7ReviewAssignmentV238=async function(id,status,prefix='a238'){
  const score=Math.max(0,Math.min(100,N(document.getElementById(`${prefix}_score_${id}`)?.value)));
  const feedbackEl=document.getElementById(`${prefix}_feedback_${id}`),feedback=String(feedbackEl?.value||'').trim();
  if(status==='needs_revision'&&!feedback){alert(L('برای درخواست اصلاح باید توضیح دقیق بنویسید؛ همان متن برای دانشجو ارسال می‌شود.','Write revision instructions; the same message will be sent to the student.','Napišite upute za doradu.'));feedbackEl?.focus();return}
  try{
    await adminRpc('nh7_admin_review_assignment_v237',{p_id:id,p_status:status,p_score:score,p_feedback:feedback});
    const selected=EMAIL(typeof selectedStudentEmail!=='undefined'?selectedStudentEmail:'');
    await Promise.allSettled([loadAssignmentsV238(false),selected?loadStudentProfileV238(selected,false):Promise.resolve()]);
    if(typeof render==='function')render();
    alert(status==='needs_revision'?L('نیاز به اصلاح ثبت شد و پیام داخل اپ برای دانشجو ارسال شد.','Revision was saved and the student was notified.','Dorada je spremljena i student je obaviješten.'):L('تکلیف تأیید شد.','Assignment approved.','Zadatak je odobren.'));
  }catch(error){alert(error?.message||String(error))}
};

function schoolBlock(student,school){
  const summary=school?.summary||{},progress=Array.isArray(school?.progress)?school.progress:[],assignments=Array.isArray(school?.assignments)?school.assignments:[],attempts=Array.isArray(school?.attempts)?school.attempts:[],aliases=Array.isArray(school?.identity_emails)?school.identity_emails:[];
  const progressHtml=progress.map(row=>{const complete=!!row.completed_at||N(row.progress_percent)>=100;return `<tr><td><strong>${E(lessonName(row.lesson_code))}</strong><br><small>${E(row.lesson_code||'')}</small></td><td>${N(row.progress_percent)}%</td><td class="${complete?'':'red-label'}">${E(complete?L('تکمیل شده','Completed','Dovršeno'):L('در حال انجام','In progress','U tijeku'))}</td><td>${E(DATE(row.updated_at||row.completed_at))}</td></tr>`}).join('');
  const attemptsHtml=attempts.map(row=>`<tr><td>${E(courseName(row.course_code||row.lesson_code))}</td><td>${N(row.objective_score_percent??row.score_percent)}%</td><td>${N(row.assignment_score_percent)}%</td><td><strong>${N(row.final_score_percent??row.score_percent)}%</strong></td><td class="${row.passed?'':'red-label'}">${E(row.passed?L('قبول','Passed','Položeno'):L('نیاز به مرور','Review needed','Potrebno ponoviti'))}</td><td>${E(DATE(row.submitted_at))}</td></tr>`).join('');
  const hasData=progress.length||assignments.length||attempts.length;
  return `<section class="nh7-v238-section"><div class="req-head"><div><h3>🎓 ${E(L('پرونده واقعی دروس، تکالیف و آزمون‌ها','Actual lessons, assignments, and exams','Stvarni školski zapis'))}</h3><p class="muted small">${E(L('این بخش فقط اطلاعات واقعاً ثبت‌شده در Supabase را نشان می‌دهد.','Only records actually stored in Supabase are shown.','Prikazuju se samo stvarno spremljeni podaci.'))}</p></div><button type="button" class="btn secondary" onclick="nh7LoadStudentProfileV238('${E(student.email)}',true)">⟳ ${E(L('تازه‌سازی','Refresh','Osvježi'))}</button></div>${aliases.length>1?`<div class="notice small">${E(L('حساب‌های مرتبط: ','Linked accounts: ','Povezani računi: '))}${aliases.map(E).join(' · ')}</div>`:''}<div class="nh7-v238-summary"><div><b>${N(summary.completed_lessons)}/${N(summary.progress_rows)}</b><span>${E(L('درس تکمیل / ثبت‌شده','Completed / recorded lessons','Dovršene / zabilježene lekcije'))}</span></div><div><b>${N(summary.assignment_rows)}</b><span>${E(L('کل تکالیف','Assignments','Zadaci'))}</span></div><div><b>${N(summary.submitted_assignments)}</b><span>${E(L('در انتظار بررسی','Pending review','Čeka pregled'))}</span></div><div><b>${N(summary.revision_assignments)}</b><span>${E(L('نیاز به اصلاح','Needs revision','Potrebna dorada'))}</span></div><div><b>${N(summary.approved_assignments)}</b><span>${E(L('تأییدشده','Approved','Odobreno'))}</span></div><div><b>${N(summary.attempt_rows)}</b><span>${E(L('آزمون‌ها','Exam attempts','Pokušaji ispita'))}</span></div></div>${!hasData?`<div class="nh7-v238-empty">${E(L('برای این دانشجو هنوز درس، تکلیف یا آزمونی ثبت نشده است.','No lesson, assignment, or exam record exists for this student yet.','Za ovog studenta još nema školskih podataka.'))}</div>`:''}${progress.length?`<details open><summary>📘 <strong>${E(L('پیشرفت دروس','Lesson progress','Napredak lekcija'))}</strong> (${progress.length})</summary><div class="nh7-v238-table"><table><thead><tr><th>${E(L('درس','Lesson','Lekcija'))}</th><th>${E(L('پیشرفت','Progress','Napredak'))}</th><th>${E(L('وضعیت','Status','Status'))}</th><th>${E(L('آخرین ثبت','Last update','Zadnje'))}</th></tr></thead><tbody>${progressHtml}</tbody></table></div></details>`:''}${assignments.length?`<details open><summary>📝 <strong>${E(L('تکالیف دانشجو و بررسی مدیر','Student assignments and review','Zadaci i pregled'))}</strong> (${assignments.length})</summary><div class="nh7-v238-assignment-list">${assignments.map(row=>assignmentCard(row,'profile')).join('')}</div></details>`:''}${attempts.length?`<details><summary>📋 <strong>${E(L('سوابق آزمون','Exam history','Povijest ispita'))}</strong> (${attempts.length})</summary><div class="nh7-v238-table"><table><thead><tr><th>${E(L('دوره','Course','Tečaj'))}</th><th>${E(L('آزمون','Exam','Ispit'))}</th><th>${E(L('تکالیف','Assignments','Zadaci'))}</th><th>${E(L('نهایی','Final','Konačno'))}</th><th>${E(L('نتیجه','Result','Rezultat'))}</th><th>${E(L('تاریخ','Date','Datum'))}</th></tr></thead><tbody>${attemptsHtml}</tbody></table></div></details>`:''}<button type="button" class="btn secondary nh7-v238-open-assignments" onclick="nh7OpenStudentAssignmentsV238('${E(student.email)}')">📝 ${E(L('باز کردن همین دانشجو در بخش تکالیف','Open this student in Assignments','Otvori studenta u Zadacima'))}</button></section>`;
}

function activityBlock(activity){
  const summary=activity?.summary||{},audio=Array.isArray(activity?.audio)?activity.audio:[],content=Array.isArray(activity?.content)?activity.content:[],sections=Array.isArray(activity?.sections)?activity.sections:[],library=Array.isArray(activity?.library)?activity.library:[];
  const hasData=audio.length||content.length||sections.length||library.length||N(summary.app_opens)||N(summary.content_opens)||N(summary.total_listened_seconds);
  const audioHtml=audio.map(row=>`<div class="nh7-v238-audio"><strong>${E(row.title||row.media_id||'-')}</strong><small>${E(row.media_type||'audio')} · ${E(L('زمان شنیدن','Listening','Slušanje'))}: ${FMT(row.total_listened_seconds)} · ${E(L('شنیده‌شده','Listened','Poslušano'))}: ${N(row.listened_percent)}% · ${E(L('جلسات','Sessions','Sesije'))}: ${N(row.sessions)} · ${E(DATE(row.last_listened_at))}</small><div><i style="width:${Math.min(100,N(row.listened_percent))}%"></i></div></div>`).join('');
  const contentHtml=content.map(row=>`<tr><td><strong>${E(row.title||row.content_id||'-')}</strong></td><td>${E(row.content_type||'-')}</td><td>${N(row.open_count)}</td><td>${FMT(row.engaged_seconds)}</td><td>${E(DATE(row.last_opened_at))}</td></tr>`).join('');
  const libraryHtml=library.map(row=>`<tr><td><strong>${E(row.title||row.item_id||'-')}</strong></td><td>${N(row.open_count)}</td><td>${E(DATE(row.last_opened_at))}</td></tr>`).join('');
  return `<section class="nh7-v238-section"><h3>📊 ${E(L('تحلیل واقعی فعالیت دانشجو در اپ','Actual student activity analytics','Stvarna aktivnost studenta'))}</h3><div class="nh7-v238-summary"><div><b>${FMT(summary.total_listened_seconds)}</b><span>${E(L('زمان شنیدن','Listening time','Vrijeme slušanja'))}</span></div><div><b>${N(summary.active_days)}</b><span>${E(L('روز فعال','Active days','Aktivni dani'))}</span></div><div><b>${N(summary.app_opens)}</b><span>${E(L('بازکردن بخش‌های اپ','App section opens','Otvaranja aplikacije'))}</span></div><div><b>${N(summary.content_opens)}</b><span>${E(L('مطالعه محتوا','Content opens','Otvaranja sadržaja'))}</span></div><div><b>${N(summary.library_opens)}</b><span>${E(L('بازکردن جزوه‌ها','Handout opens','Otvaranja materijala'))}</span></div><div><b>${E(DATE(summary.last_activity_at))}</b><span>${E(L('آخرین فعالیت','Last activity','Zadnja aktivnost'))}</span></div></div>${!hasData?`<div class="nh7-v238-empty">${E(L('هنوز فعالیت قابل اندازه‌گیری برای این دانشجو ثبت نشده است.','No measurable app activity has been recorded for this student yet.','Još nema mjerljive aktivnosti.'))}</div>`:''}${audio.length?`<details open><summary>🎧 <strong>${E(L('فایل‌های صوتی گوش‌داده‌شده','Audio files listened to','Poslušane audio datoteke'))}</strong> (${audio.length})</summary>${audioHtml}</details>`:''}${sections.length?`<details open><summary>📱 <strong>${E(L('بخش‌های استفاده‌شده','Used app sections','Korišteni dijelovi'))}</strong></summary><div class="nh7-v238-chips">${sections.map(row=>`<span>${E(row.section)} · ${N(row.open_count)}</span>`).join('')}</div></details>`:''}${content.length?`<details><summary>📖 <strong>${E(L('مطالعه محتوا','Content reading','Čitanje sadržaja'))}</strong> (${content.length})</summary><div class="nh7-v238-table"><table><thead><tr><th>${E(L('عنوان','Title','Naslov'))}</th><th>${E(L('نوع','Type','Vrsta'))}</th><th>${E(L('دفعات','Opens','Otvaranja'))}</th><th>${E(L('زمان','Time','Vrijeme'))}</th><th>${E(L('آخرین استفاده','Last use','Zadnje'))}</th></tr></thead><tbody>${contentHtml}</tbody></table></div></details>`:''}${library.length?`<details><summary>📚 <strong>${E(L('کتاب‌ها و جزوه‌ها','Books and handouts','Knjige i materijali'))}</strong> (${library.length})</summary><div class="nh7-v238-table"><table><thead><tr><th>${E(L('عنوان','Title','Naslov'))}</th><th>${E(L('دفعات','Opens','Otvaranja'))}</th><th>${E(L('آخرین استفاده','Last use','Zadnje'))}</th></tr></thead><tbody>${libraryHtml}</tbody></table></div></details>`:''}</section>`;
}

renderStudentModal=function(student){
  if(!student)return'';
  const email=EMAIL(student.email),data=profileState(email);
  let body='';
  if(!data||data.loading)body=`<div class="notice">${E(L('در حال دریافت اطلاعات واقعی دانشجو…','Loading actual student records…','Učitavanje stvarnih podataka…'))}</div>`;
  else if(data.error)body=`<div class="notice"><strong>${E(L('خطای دریافت اطلاعات','Data loading error','Pogreška učitavanja'))}:</strong> ${E(data.error)}</div><button type="button" class="btn secondary" onclick="nh7LoadStudentProfileV238('${E(email)}',true)">⟳ ${E(L('تلاش دوباره','Retry','Pokušaj ponovno'))}</button>`;
  else body=schoolBlock(student,data.school||{})+activityBlock(data.activity||{});
  const reg=student.registration,regStatus=typeof studentRegistrationStatus==='function'?studentRegistrationStatus(reg):String(reg?.status||'-');
  return `<div class="nh7-v238-backdrop" role="dialog" aria-modal="true"><div class="nh7-v238-profile"><header class="nh7-v238-head"><div><h2>${E(student.name||email)}</h2><p>${E(email)} · ${E(typeof registrationStatusLabel==='function'?registrationStatusLabel(regStatus):regStatus)}</p></div><button type="button" class="nh7-v238-close" onclick="closeStudentDashboard()" aria-label="${E(L('بستن','Close','Zatvori'))}">×</button></header><main class="nh7-v238-body">${body}<div class="nh7-v238-end"></div></main></div></div>`;
};
openStudentDashboard=function(encoded){const email=EMAIL(decodeURIComponent(String(encoded||'')));selectedStudentEmail=email;state.studentProfileV238[email]={loading:true,error:''};render();loadStudentProfileV238(email,true).catch(console.warn)};
closeStudentDashboard=function(){selectedStudentEmail='';document.documentElement.classList.remove('nh7-v238-open');document.body.classList.remove('nh7-v238-open');render()};

window.nh7OpenStudentAssignmentsV238=function(email){assignmentStudentFilter=EMAIL(email)||'all';assignmentFilter='all';assignmentSearch='';selectedStudentEmail='';activeTab='assignments';try{localStorage.setItem('nh7_admin_tab','assignments')}catch(_){}render();loadAssignmentsV238(true).catch(console.warn)};
function assignmentStudentOptionsV238(){const map=new Map();if(typeof studentDirectory==='function')studentDirectory().forEach(s=>map.set(EMAIL(s.email),s.name||s.email));(state.schoolAssignments||[]).forEach(a=>{const email=EMAIL(a.user_email);if(email&&!map.has(email))map.set(email,a.user_name||email)});return [...map.entries()].sort((a,b)=>String(a[1]).localeCompare(String(b[1]))).map(([email,name])=>`<option value="${E(email)}" ${assignmentStudentFilter===email?'selected':''}>${E(name)} · ${E(email)}</option>`).join('')}
function renderAssignmentsV238(){
  const all=(state.schoolAssignments||[]).slice().sort((a,b)=>String(b.updated_at||'').localeCompare(String(a.updated_at||'')));
  let rows=all;
  if(assignmentStudentFilter&&assignmentStudentFilter!=='all')rows=rows.filter(x=>EMAIL(x.user_email)===EMAIL(assignmentStudentFilter));
  if(assignmentFilter&&assignmentFilter!=='all')rows=rows.filter(x=>String(x.status||'submitted')===assignmentFilter);
  if(assignmentSearch){const q=String(assignmentSearch).toLowerCase();rows=rows.filter(x=>(String(x.user_name||'')+' '+String(x.user_email||'')+' '+String(x.lesson_code||'')+' '+String(x.course_code||'')+' '+String(x.answer_text||'')).toLowerCase().includes(q))}
  const pending=all.filter(x=>x.status==='submitted').length,approved=all.filter(x=>x.status==='approved').length,revision=all.filter(x=>x.status==='needs_revision').length;
  const groups=new Map();rows.forEach(row=>{const email=EMAIL(row.user_email)||'unknown';if(!groups.has(email))groups.set(email,[]);groups.get(email).push(row)});
  const grouped=[...groups.entries()].map(([email,items])=>`<details class="nh7-v238-assignment-group" open><summary><span><strong>${E(items[0]?.user_name||email)}</strong><small>${E(email)}</small></span><span>${E(L(`کل ${items.length}`,`Total ${items.length}`,`Ukupno ${items.length}`))}</span></summary><div>${items.map(row=>assignmentCard(row,'page')).join('')}</div></details>`).join('');
  const selectedEmpty=assignmentStudentFilter&&assignmentStudentFilter!=='all'&&!rows.length?`<div class="nh7-v238-empty">${E(L('برای دانشجوی انتخاب‌شده تکلیفی در این فیلتر ثبت نشده است. وضعیت را روی «همه» قرار دهید.','No assignment matches the selected student and filter. Set status to “All.”','Nema zadataka za odabranog studenta i filtar.'))}</div>`:'';
  return `<section class="panel-card"><div class="req-head"><div><h3>📝 ${E(L('تکالیف دانشجویان — بررسی و بازخورد','Student assignments — review and feedback','Zadaci studenata — pregled'))}</h3><p class="muted small">${E(L('نام دانشجو را انتخاب کنید تا تمام تکالیف او، حتی موارد تأییدشده، نمایش داده شود.','Choose a student to see all assignments, including approved work.','Odaberite studenta za prikaz svih zadataka.'))}</p></div><button type="button" class="btn secondary" onclick="nh7LoadAssignmentsV238(true)">⟳ ${E(L('تازه‌سازی','Refresh','Osvježi'))}</button></div>${state.schoolAssignmentsError?`<div class="notice">${E(state.schoolAssignmentsError)}</div>`:''}<div class="nh7-v238-summary"><div><b>${all.length}</b><span>${E(L('کل تکالیف','All assignments','Svi zadaci'))}</span></div><div><b>${pending}</b><span>${E(L('در انتظار','Pending','Čeka'))}</span></div><div><b>${approved}</b><span>${E(L('تأییدشده','Approved','Odobreno'))}</span></div><div><b>${revision}</b><span>${E(L('نیاز به اصلاح','Needs revision','Potrebna dorada'))}</span></div></div><div class="nh7-v238-toolbar"><input id="assignmentSearchInput" placeholder="${E(L('جستجو نام، ایمیل، درس یا پاسخ','Search name, email, lesson, or answer','Pretraži ime, e-mail, lekciju ili odgovor'))}" value="${E(assignmentSearch)}" oninput="assignmentSearch=this.value;render()"><select onchange="assignmentStudentFilter=this.value;assignmentFilter='all';render()"><option value="all">${E(L('همه دانشجویان','All students','Svi studenti'))}</option>${assignmentStudentOptionsV238()}</select><select onchange="assignmentFilter=this.value;render()"><option value="all" ${assignmentFilter==='all'?'selected':''}>${E(L('همه وضعیت‌ها','All statuses','Svi statusi'))}</option><option value="submitted" ${assignmentFilter==='submitted'?'selected':''}>${E(L('در انتظار بررسی','Pending review','Čeka pregled'))}</option><option value="needs_revision" ${assignmentFilter==='needs_revision'?'selected':''}>${E(L('نیاز به اصلاح','Needs revision','Potrebna dorada'))}</option><option value="approved" ${assignmentFilter==='approved'?'selected':''}>${E(L('تأییدشده','Approved','Odobreno'))}</option></select></div>${assignmentsBusyV238?`<div class="notice">${E(L('در حال دریافت تکالیف…','Loading assignments…','Učitavanje zadataka…'))}</div>`:''}${selectedEmpty}${grouped||(!selectedEmpty?`<div class="empty">${E(L('هیچ تکلیفی ثبت نشده است.','No assignments are recorded.','Nema zabilježenih zadataka.'))}</div>`:'')}</section>`;
}
renderSchoolAssignmentsPage=renderAssignmentsV238;
renderSchoolAssignmentsAdmin=renderAssignmentsV238;
try{assignmentFilter='all'}catch(_){}

if(typeof loadAll==='function'){
  const baseLoadAllV238=loadAll;
  loadAll=async function(silent=false){const result=await baseLoadAllV238(silent);if(typeof token!=='undefined'&&token)await loadAssignmentsV238(false);if(typeof render==='function')render(false);return result};
}
function postRenderV238(){
  const open=!!document.querySelector('.nh7-v238-backdrop');
  document.documentElement.classList.toggle('nh7-v238-open',open);
  document.body.classList.toggle('nh7-v238-open',open);
  const badge=document.querySelector('.nh7-admin-version-v235');if(badge)badge.textContent='v'+VERSION;
  document.title='New Hope 7 Admin v'+VERSION;
}
if(typeof render==='function'){
  const baseRenderV238=render;
  render=function(){const result=baseRenderV238();requestAnimationFrame(postRenderV238);return result};
}
document.addEventListener('click',event=>{if(event.target?.classList?.contains('nh7-v238-backdrop'))closeStudentDashboard()},true);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.querySelector('.nh7-v238-backdrop'))closeStudentDashboard()},true);
setTimeout(()=>{postRenderV238();if(typeof token!=='undefined'&&token)loadAssignmentsV238(true).catch(console.warn)},400);
window.NH7_ADMIN_STUDENT_FIX_VERSION=VERSION;
})();
