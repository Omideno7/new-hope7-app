(function reportScriptV496(){
  'use strict';
  if(window.__NH7_ADMIN_STUDENT_REPORT_V496__)return;
  window.__NH7_ADMIN_STUDENT_REPORT_V496__=true;
  const VERSION='4.9.6-issue116-browser-print-csv';
  let report={email:'',language:'fa',html:'',name:'',generatedAt:null};
  let generating=false, generation=0, returnFocus=null;
  const detailCache=new Map();
  const L=(fa,en,hr,l=null)=>{const v=l||String(typeof lang!=='undefined'?lang:'fa');return v==='fa'?fa:v==='hr'?hr:en};
  const E=v=>typeof h==='function'?h(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const N=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const currentLang=()=>{const v=String(typeof lang!=='undefined'?lang:'fa');return ['fa','en','hr'].includes(v)?v:'fa'};
  function unwrap(value){for(let i=0;i<4&&Array.isArray(value)&&value.length===1;i++)value=value[0];return value}
  // Bound presentation even when an existing Admin wrapper drops timeoutMs.
  function bounded(promise,ms){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error(L('زمان دریافت گزارش تمام شد. دوباره تلاش کنید.','Report request timed out. Please retry.','Zahtjev za izvještaj je istekao. Pokušajte ponovno.'))),ms);Promise.resolve(promise).then(value=>{clearTimeout(timer);resolve(value)},error=>{clearTimeout(timer);reject(error)})})}
  function printPreparedPdf(){
    if(!report.html)return;
    if(!document.getElementById('nh7ReportPreviewOverlay'))openPreview();
    document.body.classList.add('nh7r491-printing');
    const oldTitle=document.title;document.title='New Hope 7 — '+report.name;
    const cleanup=()=>{document.body.classList.remove('nh7r491-printing');document.title=oldTitle};
    window.addEventListener('afterprint',cleanup,{once:true});
    try{window.print()}catch(error){cleanup();throw error}
  }
  // Save PDF uses the browser's print destination, retaining searchable text.
  function downloadPreparedPdf(){printPreparedPdf()}
  function csvEscape(value){let text=String(value??'');if(/^[\s]*[=+@-]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"'}
  function exportDetail(){
    if(!report.profile)return;
    const l=report.language,school=report.profile.school||{};
    const rows=[['record_type','email','course','lesson_or_exam','state','score','attempt','question','student_answer','correct_answer','feedback','updated_at','objective_score_percent','assignment_score_percent','final_score_percent']];
    rows.push(['registration',report.email,'','',school.registration?.status||'', '', '', '', '', '', '',school.registration?.created_at||'']);
    for(const lesson of lessonRows(school)){rows.push(['lesson',report.email,lesson.course_code,lesson.lesson_code,lesson.completed?'completed':'pending',lesson.final_score_percent??lesson.exam_score??'', '', '', '', '', '',lesson.updated_at||'']);if(lesson.assignmentState==='missing')rows.push(['assignment',report.email,lesson.course_code,lesson.lesson_code,'missing','','','','','','','']);}
    for(const a of school.assignments||[])rows.push(['assignment',report.email,a.course_code,a.lesson_code,a.status,a.score_percent??'', '', '',a.answer_text||'', '',a.admin_feedback||'',a.submitted_at||'']);
    for(const a of school.attempts||[]){
      rows.push(['exam_attempt',report.email,a.course_code,a.exam_id,a.passed===true?'passed':a.passed===false?'failed':'unknown',a.final_score_percent??a.score_percent??'',a.attempt_number??'', '', '', '', '',a.submitted_at||'',a.objective_score_percent??a.score_percent??'',a.assignment_score_percent??'',a.final_score_percent??a.score_percent??'']);
      for(const w of wrongAnswers(a,l))rows.push(['wrong_answer',report.email,a.course_code,a.exam_id,'incorrect','',a.attempt_number??'',w.question,w.selected,w.correct,'',a.submitted_at||'']);
    }
    const blob=new Blob(['\uFEFF'+rows.map(row=>{while(row.length<15)row.push('');return row.map(csvEscape).join(',')}).join('\r\n')],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='New-Hope-7-student-report.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  function fmtDate(v,l){if(!v)return'-';try{return new Date(v).toLocaleString(l==='fa'?'fa-IR':l==='hr'?'hr-HR':'en-GB')}catch(_){return String(v)}}
  function fmtSeconds(v){v=Math.max(0,N(v));const h=Math.floor(v/3600),m=Math.floor((v%3600)/60),s=Math.floor(v%60);return h?`${h}h ${m}m`:`${m}m ${s}s`}
  function pct(v){const n=N(v);return Number.isFinite(n)?Math.round(n*10)/10:0}
  function students(){
    try{if(typeof studentDirectory==='function')return studentDirectory()}catch(_){}
    const map=new Map(),add=(email,name='')=>{email=String(email||'').trim().toLowerCase();if(!email)return;if(!map.has(email))map.set(email,{email,name:String(name||'').trim()||email})};
    (state.schoolAssignments||[]).forEach(x=>add(x.user_email,x.user_name));
    (state.schoolAttempts||[]).forEach(x=>add(x.user_email,x.user_name));
    (state.schoolProgress||[]).forEach(x=>add(x.user_email,x.user_name));
    return[...map.values()].sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  }
  function optionText(value,l){if(value==null)return'-';if(typeof value==='string')return value;if(typeof value==='object')return String(value[l]||value.fa||value.en||value.hr||value.text||'');return String(value)}
  function questionText(q,l){const v=q?.question;if(typeof v==='string')return v;if(v&&typeof v==='object')return String(v[l]||v.fa||v.en||v.hr||'');return String(q?.text||'')}
  function examTitle(exam,l){return String(exam?.['title_'+l]||exam?.title_fa||exam?.title_en||exam?.title_hr||exam?.lesson_code||'-')}
  function wrongAnswers(attempt,l){
    const exam=(state.schoolExams||[]).find(x=>String(x.id)===String(attempt.exam_id));if(!exam)return[];
    const questions=Array.isArray(exam.questions)?exam.questions:[],answers=Array.isArray(attempt.answers)?attempt.answers:[],out=[];
    answers.forEach((a,index)=>{
      const q=questions.find(x=>N(x.number,-999)===N(a.question_number,-998))||questions[N(a.question_id,-999)]||questions[N(a.question_number,0)-1]||questions[index];
      if(!q||q.correct==null||a.selected==null)return;
      const selected=N(a.selected,-1),correct=N(q.correct,-2);if(selected===correct)return;
      const opts=Array.isArray(q.options)?q.options:[];
      out.push({number:N(a.question_number,N(q.number,index+1)),question:questionText(q,l)||L('متن سؤال در دسترس نیست','Question text unavailable','Tekst pitanja nije dostupan',l),selected:optionText(opts[selected],l)||String(selected),correct:optionText(opts[correct],l)||String(correct)});
    });
    return out;
  }
  function statusLabel(v,l){
    const key=String(v||''),m={approved:['تأیید شده','Approved','Odobreno'],submitted:['در انتظار بررسی','Pending review','Čeka pregled'],needs_revision:['نیاز به اصلاح','Needs revision','Potrebna dorada'],pending:['در انتظار','Pending','Na čekanju'],rejected:['رد شده','Rejected','Odbijeno'],missing:['ارسال نشده','Not submitted','Nije predano'],none:['تکلیف لازم نیست','No required assignment','Nema obveznog zadatka']};
    const a=m[key]||[key,key,key];return l==='fa'?a[0]:l==='hr'?a[2]:a[1];
  }
  function rowTitle(item,l){return String(item?.title||item?.['title_'+l]||item?.title_fa||item?.title_en||item?.title_hr||item?.item_id||item?.media_id||'-')}
  function summaryCards(school,activity,reading,l){
    const ss=school?.summary||{},as=activity?.summary||{},read=Array.isArray(reading)?reading:[];
    const cards=[
      [L('درس‌های تکمیل‌شده','Completed lessons','Završene lekcije',l),N(ss.completed_lessons)],
      [L('تکالیف تأییدشده','Approved assignments','Odobreni zadaci',l),N(ss.approved_assignments)],
      [L('آزمون‌های قبول‌شده','Passed attempts','Položeni pokušaji',l),N(ss.passed_attempts)],
      [L('روزهای فعال','Active days','Aktivni dani',l),N(as.active_days)],
      [L('فایل‌های صوتی شنیده‌شده','Audio files listened','Preslušane audio datoteke',l),N(as.audio_files_listened)],
      [L('زمان شنیدن','Listening time','Vrijeme slušanja',l),fmtSeconds(as.total_listened_seconds)],
      [L('کتاب‌های بازشده','Books opened','Otvorene knjige',l),Math.max(N(as.library_opens),read.length)]
    ];
    return`<div class="nh7r490-summary">${cards.map(([k,v])=>`<div><b>${E(v)}</b><span>${E(k)}</span></div>`).join('')}</div>`;
  }
  function lessonRows(school){
    const progress=Array.isArray(school.progress)?school.progress:[],catalog=Array.isArray(state.schoolLessons)?state.schoolLessons:[];
    const relevant=new Set([...progress,...school.assignments||[],...school.attempts||[]].map(x=>String(x.course_code||'foundation_school')));
    if(!relevant.size)relevant.add('foundation_school');
    const map=new Map(progress.map(x=>[String(x.course_code||'foundation_school')+'|'+x.lesson_code,{...x}]));
    for(const lesson of catalog)if(lesson.is_active!==false&&relevant.has(String(lesson.course_code||'foundation_school'))){
      const key=String(lesson.course_code||'foundation_school')+'|'+lesson.lesson_code;
      if(!map.has(key))map.set(key,{lesson_code:lesson.lesson_code,course_code:lesson.course_code,title_fa:lesson.title_fa,title_en:lesson.title_en,title_hr:lesson.title_hr});
    }
    return [...map.values()].map(x=>{const lesson=catalog.find(y=>String(y.lesson_code)===String(x.lesson_code)&&String(y.course_code||'foundation_school')===String(x.course_code||'foundation_school'));const assignment=(school.assignments||[]).find(a=>String(a.lesson_code)===String(x.lesson_code)&&String(a.course_code||'foundation_school')===String(x.course_code||'foundation_school'));const required=lesson&&typeof schoolLessonHasAssignment==='function'?schoolLessonHasAssignment(lesson):false;return {...x,completed:!!x.completed_at||N(x.progress_percent)>=100,assignmentState:assignment?.status||(required?'missing':'none')};});
  }
  function progressHtml(school,l){
    const rows=lessonRows(school);
    if(!rows.length)return`<p class="empty">${E(L('فهرست درس‌ها در دسترس نیست.','Lesson catalog unavailable.','Popis lekcija nije dostupan.',l))}</p>`;
    return`<table><thead><tr><th>${E(L('درس','Lesson','Lekcija',l))}</th><th>${E(L('پیشرفت','Progress','Napredak',l))}</th><th>${E(L('نمره نهایی','Final score','Konačni rezultat',l))}</th><th>${E(L('تکمیل / باقی‌مانده','Completed / pending','Završeno / na čekanju',l))}</th><th>${E(L('وضعیت تکلیف','Assignment state','Status zadatka',l))}</th><th>${E(L('آخرین تغییر','Updated','Ažurirano',l))}</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${E(x['title_'+l]||x.lesson_code||'-')}</td><td>${E(x.progress_percent??'—')}${x.progress_percent!=null?'%':''}</td><td>${E(x.final_score_percent??x.exam_score??'—')}</td><td>${E(x.completed?L('تکمیل‌شده','Completed','Završeno',l):L('باقی‌مانده','Pending','Na čekanju',l))}</td><td>${E(statusLabel(x.assignmentState,l))}</td><td>${E(fmtDate(x.updated_at,l))}</td></tr>`).join('')}</tbody></table>`;
  }
  function assignmentsHtml(rows,l){
    rows=Array.isArray(rows)?rows:[];
    if(!rows.length)return`<p class="empty">${E(L('تکلیفی ثبت نشده است.','No assignments recorded.','Nema zabilježenih zadataka.',l))}</p>`;
    return`<table><thead><tr><th>${E(L('درس','Lesson','Lekcija',l))}</th><th>${E(L('وضعیت','Status','Status',l))}</th><th>${E(L('نمره','Score','Ocjena',l))}</th><th>${E(L('پاسخ دانشجو','Student answer','Odgovor studenta',l))}</th><th>${E(L('بازخورد','Feedback','Povratna informacija',l))}</th></tr></thead><tbody>${rows.map(a=>`<tr><td>${E(a.lesson_code||'-')}<br><small>${E(fmtDate(a.submitted_at,l))}</small></td><td>${E(statusLabel(a.status,l))}</td><td>${E(a.score_percent==null?'-':a.score_percent+'%')}</td><td class="long">${E(a.answer_text||'-')}</td><td class="long">${E(a.admin_feedback||'-')}</td></tr>`).join('')}</tbody></table>`;
  }
  function attemptsHtml(rows,l){
    rows=Array.isArray(rows)?rows:[];
    if(!rows.length)return`<p class="empty">${E(L('آزمونی ثبت نشده است.','No exam attempts recorded.','Nema zabilježenih pokušaja ispita.',l))}</p>`;
    return rows.map(a=>{
      const exam=(state.schoolExams||[]).find(x=>String(x.id)===String(a.exam_id)),wrong=wrongAnswers(a,l);
      return`<article class="nh7r490-attempt"><h4>${E(examTitle(exam,l))} · #${E(a.attempt_number||1)} · ${E(a.passed===true?'✅ '+L('قبول','Passed','Položeno',l):a.passed===false?'↻ '+L('قبول نشده','Failed','Nije položeno',l):L('نتیجه در دسترس نیست','Result unavailable','Rezultat nije dostupan',l))}</h4>
      <p>${E(L('نمره آزمون','Exam score','Rezultat ispita',l))}: <b>${E(a.objective_score_percent??a.score_percent??'—')}${a.objective_score_percent!=null||a.score_percent!=null?'%':''}</b> · ${E(L('تکالیف','Assignments','Zadaci',l))}: <b>${E(a.assignment_score_percent??'—')}${a.assignment_score_percent!=null?'%':''}</b> · ${E(L('نهایی','Final','Konačno',l))}: <b>${E(a.final_score_percent??a.score_percent??'—')}${a.final_score_percent!=null||a.score_percent!=null?'%':''}</b> · ${E(fmtDate(a.submitted_at,l))}</p>
      <h5>${E(L('پاسخ‌های اشتباه','Incorrect answers','Netočni odgovori',l))} (${wrong.length})</h5>
      ${wrong.length?`<ol>${wrong.map(w=>`<li><strong>${E(w.question)}</strong><br><span>${E(L('پاسخ دانشجو','Student','Student',l))}: ${E(w.selected)}</span><br><span>${E(L('پاسخ صحیح','Correct','Točno',l))}: ${E(w.correct)}</span></li>`).join('')}</ol>`:`<p>✓ ${E((exam&&Array.isArray(exam.questions)&&exam.questions.length&&Array.isArray(a.answers)&&a.answers.length?L('پاسخ اشتباهی ثبت نشده است.','No incorrect answers recorded.','Nema zabilježenih netočnih odgovora.',l):L('جزئیات پاسخ‌ها در دسترس نیست.','Answer details unavailable.','Detalji odgovora nisu dostupni.',l)))}</p>`}
    </article>`;
    }).join('');
  }
  function audioHtml(rows,l){
    rows=Array.isArray(rows)?rows:[];
    if(!rows.length)return`<p class="empty">${E(L('فعالیت صوتی ثبت نشده است.','No audio activity recorded.','Nema zabilježene audio aktivnosti.',l))}</p>`;
    return`<table><thead><tr><th>${E(L('فایل','Audio','Audio',l))}</th><th>${E(L('نوع','Type','Vrsta',l))}</th><th>${E(L('شنیده','Listened','Preslušano',l))}</th><th>${E(L('پیشرفت','Reached','Dosegnuto',l))}</th><th>${E(L('وضعیت','Status','Status',l))}</th><th>${E(L('آخرین فعالیت','Last activity','Zadnja aktivnost',l))}</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${E(rowTitle(x,l))}</td><td>${E(x.media_type||'-')}</td><td>${E(fmtSeconds(x.total_listened_seconds))}</td><td>${E(pct(x.reached_percent))}%</td><td>${E(x.completed?'✓ '+L('کامل','Complete','Završeno',l):x.likely_skipped?'⚠ '+L('پرش زیاد','Likely skipped','Vjerojatno preskakano',l):L('در حال گوش دادن','In progress','U tijeku',l))}</td><td>${E(fmtDate(x.last_listened_at,l))}</td></tr>`).join('')}</tbody></table>`;
  }
  function libraryHtml(access,reading,l){
    const detailed=Array.isArray(reading)?reading:[],opened=Array.isArray(access)?access:[];
    if(detailed.length){
      return`<table><thead><tr><th>${E(L('کتاب','Book','Knjiga',l))}</th><th>${E(L('پیشرفت مطالعه','Reading progress','Napredak čitanja',l))}</th><th>${E(L('زمان فعال','Active time','Aktivno vrijeme',l))}</th><th>${E(L('آخرین مطالعه','Last read','Zadnje čitanje',l))}</th></tr></thead><tbody>${detailed.map(x=>`<tr><td>${E(rowTitle(x,l))}</td><td>${E(pct(x.read_percent))}% ${x.completed_at?'✓':''}</td><td>${E(fmtSeconds(x.active_seconds))}</td><td>${E(fmtDate(x.last_read_at,l))}</td></tr>`).join('')}</tbody></table>`;
    }
    if(!opened.length)return`<p class="empty">${E(L('کتابی باز نشده است.','No books opened.','Nema otvorenih knjiga.',l))}</p>`;
    return`<p class="notice">${E(L('داده قدیمی فقط بازشدن کتاب را ثبت کرده است؛ درصد مطالعه از نسخه جدید به بعد ثبت می‌شود.','Older data records book opens only; reading percentage is tracked from the new version onward.','Stariji podaci bilježe samo otvaranje knjige; postotak čitanja prati se od nove verzije.',l))}</p>
  <table><thead><tr><th>${E(L('کتاب','Book','Knjiga',l))}</th><th>${E(L('دفعات بازشدن','Opens','Otvaranja',l))}</th><th>${E(L('آخرین بار','Last opened','Zadnje otvaranje',l))}</th></tr></thead><tbody>${opened.map(x=>`<tr><td>${E(rowTitle(x,l))}</td><td>${E(x.open_count||1)}</td><td>${E(fmtDate(x.last_opened_at,l))}</td></tr>`).join('')}</tbody></table>`;
  }
  function build(profile,reading,l,email,loaded=new Date()){
    const school=profile?.school||{},activity=profile?.activity||{},identity=profile?.student_identity||{},reg=school.registration||{};
    const progress=school.progress||[],assignments=school.assignments||[],attempts=school.attempts||[],audio=activity.audio||[],library=activity.library||[];
    const name=String(reg.user_name||assignments[0]?.user_name||attempts[0]?.user_name||email);
    const html=`<div class="nh7r490-report" lang="${l}" dir="${l==='fa'?'rtl':'ltr'}">
    <header><div><h2>New Hope 7 · ${E(L('گزارش دانشجو','Student Report','Izvještaj studenta',l))}</h2><h3>${E(name)}</h3><p>${identity.student_code?E(identity.student_code)+' · ':''}${E(email)} · ${E(L('زمان دریافت داده','Data loaded','Podaci učitani',l))}: ${E(fmtDate(loaded,l))}</p></div><img src="assets/logo.png" alt=""></header>
    <p>${E(L('ثبت‌نام','Registration','Registracija',l))}: ${E(school.registration?statusLabel(school.registration.status||L('ثبت‌نام شده','Registered','Registriran',l),l):L('ثبت‌نام نشده','Not registered','Nije registriran',l))}</p>
    ${summaryCards(school,activity,reading,l)}
    <section><h3>${E(L('پیشرفت درس‌ها','Lesson progress','Napredak lekcija',l))}</h3>${progressHtml(school,l)}</section>
    <section><h3>${E(L('تکالیف','Assignments','Zadaci',l))}</h3>${assignmentsHtml(assignments,l)}</section>
    <section><h3>${E(L('آزمون‌ها و پاسخ‌های اشتباه','Exams and incorrect answers','Ispiti i netočni odgovori',l))}</h3>${attemptsHtml(attempts,l)}</section>
    <section><h3>${E(L('فعالیت فایل‌های صوتی','Audio listening activity','Aktivnost slušanja audija',l))}</h3>${audioHtml(audio,l)}</section>
    <section><h3>${E(L('مطالعه کتابخانه','Library reading','Čitanje knjižnice',l))}</h3>${libraryHtml(library,reading,l)}</section>
    <footer>${E(L('این گزارش برای پیگیری آموزشی و خدمتی تهیه شده است.','This report is prepared for educational and ministry follow-up.','Ovo izvješće pripremljeno je za obrazovno i službeno praćenje.',l))}</footer>
  </div>`;
    return{name,html};
  }
  function reportCss(){
    return`body{font-family:system-ui,-apple-system,"Segoe UI",Tahoma,Arial,sans-serif;margin:0;color:#102033;background:#fff}.nh7r490-report{max-width:1100px;margin:auto;padding:24px}.nh7r490-report header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;border-bottom:2px solid #0f766e;padding-bottom:14px}.nh7r490-report header img{width:72px;height:72px;object-fit:contain}.nh7r490-report h2,.nh7r490-report h3,.nh7r490-report h4{margin:0 0 8px}.nh7r490-report section{margin:24px 0}.nh7r490-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:18px 0}.nh7r490-summary div{border:1px solid #d8ecea;border-radius:12px;padding:10px}.nh7r490-summary b{display:block;font-size:1.25rem}.nh7r490-summary span{font-size:.78rem;color:#667085}table{width:100%;border-collapse:collapse;font-size:.85rem}th,td{border:1px solid #dce8e7;padding:7px;vertical-align:top;text-align:start}th{background:#eef8f7}.long{max-width:310px;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;unicode-bidi:plaintext}.nh7r490-attempt{border:1px solid #d8ecea;border-radius:14px;padding:12px;margin:10px 0;break-inside:avoid}.nh7r490-attempt li{margin:9px 0}.notice{padding:9px;border-radius:10px;background:#fff7ed;color:#9a3412}.empty{color:#667085}.nh7r490-report footer{margin-top:30px;padding-top:10px;border-top:1px solid #d8ecea;font-size:.75rem;color:#667085}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.nh7r490-report{padding:0}.nh7r490-report section{break-inside:auto}table{page-break-inside:auto}tr{page-break-inside:avoid}.nh7r490-summary{grid-template-columns:repeat(4,1fr)}}@media(max-width:700px){.nh7r490-summary{grid-template-columns:1fr 1fr}.nh7r490-report{padding:12px;overflow-x:auto}}`;
  }
  function panel(){
    const list=students(),known=window.NH7AcademicReportRowsV116?.()||[];for(const row of known)if(row.email&&!list.some(x=>x.email===row.email))list.push({email:row.email,name:row.display_name||row.email});const opts=list.map(s=>`<option value="${E(s.email)}">${E(s.name||s.email)} · ${E(s.email)}</option>`).join('');
    return`<section class="panel-card"><div class="req-head"><div><h3>📄 ${E(L('گزارش جامع دانشجو','Student Report Center','Centar izvještaja studenta'))}</h3><p class="muted small">${E(L('نام یا ایمیل دانشجو را انتخاب کن؛ گزارش تکالیف، آزمون‌ها، شنیدن فایل‌ها و مطالعه کتابخانه ساخته می‌شود.','Select a student to generate assignments, exams, audio and library activity.','Odaberite studenta za izvještaj o zadacima, ispitima, audiju i knjižnici.'))}</p></div></div>
    <div class="grid3"><select id="nh7ReportStudent" ${generating?'disabled':''} aria-label="${E(L('دانشجو','Student','Student'))}"><option value="">— ${E(L('انتخاب دانشجو','Choose student','Odaberi studenta'))} —</option>${opts}</select><select id="nh7ReportLang" ${generating?'disabled':''} aria-label="${E(L('زبان گزارش','Report language','Jezik izvještaja'))}"><option value="fa">فارسی</option><option value="en">English</option><option value="hr">Hrvatski</option></select><button id="nh7ReportGenerateBtn" class="btn primary" onclick="nh7GenerateStudentReportV496()" ${generating?'disabled':''}>📊 ${E(L('ساخت گزارش','Generate report','Izradi izvještaj'))}</button></div>
    <div class="actions"><button id="nh7ReportPrintBtn" class="btn secondary" onclick="nh7OpenStudentReportPreviewV496()" ${report.html?'':'disabled'}>📄 PDF / Print</button><button class="btn ghost" onclick="nh7GenerateStudentReportV496(true)">⟳ ${E(L('به‌روزرسانی گزارش','Refresh report','Osvježi izvještaj'))}</button><button id="nh7ReportCsvBtn" class="btn secondary" onclick="nh7ExportStudentReportV116()" ${report.html?'':'disabled'}>CSV</button></div>
    <div id="nh7ReportStatus" class="muted small" role="status" aria-live="polite"></div>
  </section><section class="panel-card" id="nh7ReportOutput">${report.html||`<div class="empty">${E(L('هنوز گزارشی ساخته نشده است.','No report generated yet.','Izvještaj još nije izrađen.'))}</div>`}</section>`;
  }
  async function generate(force=false){
    if(generating)return;
    const email=String(document.getElementById('nh7ReportStudent')?.value||'').trim().toLowerCase(),l=String(document.getElementById('nh7ReportLang')?.value||currentLang());
    if(!email){alert(L('دانشجو را انتخاب کن.','Choose a student.','Odaberite studenta.'));return}
    generating=true;const run=++generation;
    const status=document.getElementById('nh7ReportStatus'),button=document.getElementById('nh7ReportGenerateBtn');
    if(button)button.disabled=true;for(const id of ['nh7ReportStudent','nh7ReportLang']){const input=document.getElementById(id);if(input)input.disabled=true}if(status)status.textContent=L('در حال جمع‌آوری اطلاعات…','Collecting report data…','Prikupljanje podataka…');
    try{
      let cached=detailCache.get(email);
      if(force||!cached||Date.now()-cached.at>60000){
        const [profile,reading]=await Promise.all([
          bounded(adminRpc('nh7_admin_student_profile_v452',{p_email:email},15000),17000),
          bounded(adminRpc('nh7_admin_library_reading_v490',{p_email:email},6000),7000).then(value=>({value:unwrap(value),warning:false}),()=>({value:[],warning:true}))
        ]);
        const value=unwrap(profile);if(!value?.school)throw new Error(L('اطلاعات گزارش معتبر نیست. دوباره تلاش کنید.','Invalid report response. Please retry.','Nevaljan odgovor izvještaja. Pokušajte ponovno.'));
        cached={profile:value,reading:reading.value,warning:reading.warning,at:Date.now()};detailCache.set(email,cached);
        if(detailCache.size>20)detailCache.delete(detailCache.keys().next().value);
      }
      if(run!==generation)return;
      const built=build(cached.profile,cached.reading,l,email,cached.at);
      report={email,language:l,html:built.html,name:built.name,generatedAt:new Date(cached.at),profile:cached.profile};
      if(cached.warning)report.html+='<p class="notice">'+E(L('داده اختیاری مطالعه کتابخانه در دسترس نیست؛ گزارش مدرسه آماده است.','Optional library reading data unavailable; the School report is ready.','Neobavezni podaci čitanja nisu dostupni; školski izvještaj je spreman.',l))+'</p>';
      closePreview();const out=document.getElementById('nh7ReportOutput');if(out)out.innerHTML=report.html;
      for(const id of ['nh7ReportPrintBtn','nh7ReportCsvBtn']){const btn=document.getElementById(id);if(btn)btn.disabled=false}
      if(status)status.textContent=L('گزارش آماده شد ✓','Report ready ✓','Izvještaj je spreman ✓')+' · '+fmtDate(cached.at,l);
    }catch(e){if(status)status.textContent=L('گزارش بارگذاری نشد؛ دوباره تلاش کنید. ','Report could not load; please retry. ','Izvještaj nije učitan; pokušajte ponovno. ')+String(e.message||e)}
    finally{generating=false;const currentButton=document.getElementById('nh7ReportGenerateBtn');if(currentButton)currentButton.disabled=false;for(const id of ['nh7ReportStudent','nh7ReportLang']){const input=document.getElementById(id);if(input)input.disabled=false}}
  }
  function closePreview(){
    const overlay=document.getElementById('nh7ReportPreviewOverlay');
    if(overlay)overlay.remove();
    document.body.classList.remove('nh7r491-preview-open','nh7r491-printing');
    document.documentElement.classList.remove('nh7r491-preview-open');
    if(returnFocus?.isConnected)returnFocus.focus();
  }
  function openPreview(){
    if(!report.html){alert(L('ابتدا گزارش را بساز.','Generate the report first.','Najprije izradite izvještaj.'));return}
    closePreview();returnFocus=document.activeElement;
    const overlay=document.createElement('div');
    overlay.id='nh7ReportPreviewOverlay';
    overlay.className='nh7r491-overlay';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','nh7ReportPreviewTitle');overlay.lang=report.language;
    overlay.dir=report.language==='fa'?'rtl':'ltr';
    overlay.innerHTML=`
      <div class="nh7r491-shell">
        <div class="nh7r491-toolbar">
          <div class="nh7r491-toolbar-title">
            <strong id="nh7ReportPreviewTitle">📄 ${E(L('پیش‌نمایش گزارش دانشجو','Student report preview','Pregled izvještaja studenta',report.language))}</strong>
            <small id="nh7ReportPreviewHint">${E(L('می‌توانی گزارش را ببینی، چاپ کنی یا به PDF ذخیره کنی.','Review, print, or save the report as PDF.','Pregledajte, ispišite ili spremite izvještaj kao PDF.',report.language))}</small>
          </div>
          <div class="nh7r491-toolbar-actions">
            <button type="button" class="btn ghost" onclick="nh7CloseStudentReportPreviewV496()">✕ ${E(L('بستن','Close','Zatvori',report.language))}</button>
            <button id="nh7ReportPrintAction" type="button" class="btn secondary" onclick="nh7PrintStudentReportPdfV496()">🖨 ${E(L('چاپ','Print','Ispis',report.language))}</button>
            <button id="nh7ReportPdfAction" type="button" class="btn primary" onclick="nh7DownloadStudentReportPdfV496()">📄 ${E(L('ذخیره PDF','Save PDF','Spremi PDF',report.language))}</button>
            <button class="btn secondary" onclick="nh7ExportStudentReportV116()">CSV</button>
          </div>
        </div>
        <div class="nh7r491-preview-scroll">
          <div class="nh7r491-print-surface">${report.html}</div>
        </div>
      </div>`;
    overlay.addEventListener('click',event=>{if(event.target===overlay)closePreview()});
    document.body.appendChild(overlay);
    document.body.classList.add('nh7r491-preview-open');
    document.documentElement.classList.add('nh7r491-preview-open');
    overlay.querySelector('button')?.focus();
    const hint=document.getElementById('nh7ReportPreviewHint');if(hint)hint.textContent=L('برای PDF، در پنجره چاپ گزینه ذخیره PDF را انتخاب کنید.','For PDF, choose Save as PDF in the browser print dialog.','Za PDF odaberite Spremi kao PDF u dijalogu ispisa.',report.language);

  }
  function install(){
    if(typeof tabsHtml!=='function'||typeof renderActivePanel!=='function'||typeof adminRpc!=='function')return false;
    if(tabsHtml.__nh7Report496)return true;
    const oldTabs=tabsHtml;
    const wrappedTabs=function(){
      const html=oldTabs(),button=`<button class="tab ${activeTab==='studentreport'?'active':''}" onclick="setTab('studentreport')">📄 ${E(L('گزارش دانشجو','Student report','Izvještaj studenta'))}</button>`;
      return html.includes('</nav>')?html.replace('</nav>',button+'</nav>'):html+button;
    };
    wrappedTabs.__nh7Report496=true;tabsHtml=window.tabsHtml=wrappedTabs;
    const oldPanel=renderActivePanel;renderActivePanel=window.renderActivePanel=function(){if(activeTab==='studentreport')return panel();return oldPanel()};
    window.nh7GenerateStudentReportV496=generate;
    window.nh7ExportStudentReportV116=exportDetail;
    window.nh7OpenStudentReportPreviewV496=openPreview;
    window.nh7CloseStudentReportPreviewV496=closePreview;
    window.nh7DownloadStudentReportPdfV496=downloadPreparedPdf;
    window.nh7PrintStudentReportPdfV496=printPreparedPdf;
    window.NH7_ADMIN_STUDENT_REPORT_VERSION=VERSION;
    return true;
  }
  const style=document.createElement('style');
  style.id='nh7AdminStudentReportV491Style';
  style.textContent=reportCss()+`
    .nh7r490-report{padding:0;min-width:0}.nh7r490-report header img{max-width:72px}
    .nh7r490-report table{min-width:600px}.nh7r490-report section{overflow-x:auto}
    .nh7r490-report td,.nh7r490-report th,.nh7r490-report p,.nh7r490-report li{overflow-wrap:anywhere;word-break:break-word}
    html.nh7r491-preview-open,body.nh7r491-preview-open{overflow:hidden!important}
    .nh7r491-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,.62);display:flex;align-items:stretch;justify-content:center;padding:0}
    .nh7r491-shell{width:min(1180px,100%);height:100dvh;background:#f8fafc;display:flex;flex-direction:column;box-shadow:0 0 40px rgba(0,0,0,.25)}
    .nh7r491-toolbar{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px max(12px,env(safe-area-inset-right)) 10px max(12px,env(safe-area-inset-left));padding-top:max(10px,env(safe-area-inset-top));background:#fff;border-bottom:1px solid #d8ecea;box-shadow:0 4px 18px rgba(16,32,51,.08)}
    .nh7r491-toolbar-title{min-width:0;display:flex;flex-direction:column;gap:2px}.nh7r491-toolbar-title strong{font-size:.98rem}.nh7r491-toolbar-title small{font-size:.76rem;color:#667085;line-height:1.5}
    .nh7r491-toolbar-actions{display:flex;gap:7px;flex-wrap:wrap}.nh7r491-toolbar-actions .btn{width:auto;min-width:108px;margin:0}
    .nh7r491-preview-scroll{flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;padding:16px}
    .nh7r491-print-surface{max-width:1100px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:20px;box-shadow:0 10px 28px rgba(16,32,51,.08)}
    @media(max-width:700px){
      .nh7r491-toolbar{align-items:stretch;flex-direction:column}
      .nh7r491-toolbar-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}
      .nh7r491-toolbar-actions .btn{min-width:0;width:100%;padding:10px 6px;font-size:.82rem}
      .nh7r491-preview-scroll{padding:8px}.nh7r491-print-surface{padding:10px;border-radius:12px}
    }
    @media print{
      @page{size:A4 landscape;margin:12mm}
      html,body{height:auto!important;overflow:visible!important}
      body.nh7r491-printing table{min-width:0!important;width:100%!important;table-layout:fixed}
      body.nh7r491-printing th,body.nh7r491-printing td{position:static!important;overflow-wrap:anywhere}
      body.nh7r491-printing thead{display:table-header-group}
      body.nh7r491-printing .nh7r490-attempt{break-inside:auto!important}
      body.nh7r491-printing>*:not(#nh7ReportPreviewOverlay){display:none!important}
      body.nh7r491-printing #nh7ReportPreviewOverlay{position:static!important;display:block!important;background:#fff!important;height:auto!important;overflow:visible!important}
      body.nh7r491-printing .nh7r491-shell{width:100%!important;height:auto!important;box-shadow:none!important;background:#fff!important}
      body.nh7r491-printing .nh7r491-toolbar{display:none!important}
      body.nh7r491-printing .nh7r491-preview-scroll{overflow:visible!important;padding:0!important}
      body.nh7r491-printing .nh7r491-print-surface{max-width:none!important;border:0!important;border-radius:0!important;padding:0!important;box-shadow:none!important}
      body.nh7r491-printing .nh7r490-report{padding:0!important;overflow:visible!important}
      body.nh7r491-printing .nh7r490-report section{overflow:visible!important}
    }`;
  document.head.appendChild(style);
  document.addEventListener('keydown',event=>{const modal=document.getElementById('nh7ReportPreviewOverlay');if(!modal)return;if(event.key==='Escape')closePreview();if(event.key==='Tab'){const buttons=[...modal.querySelectorAll('button:not([disabled])')];const first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}});

  if(!install()){let n=0;const t=setInterval(()=>{n++;if(install()||n>100)clearInterval(t)},100)}
})();