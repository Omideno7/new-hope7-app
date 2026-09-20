(function reportScript(){
  'use strict';
  if(window.__NH7_ADMIN_STUDENT_REPORT_V490__)return;
  window.__NH7_ADMIN_STUDENT_REPORT_V490__=true;
  const VERSION='4.9.0-student-report';
  let report={email:'',language:'fa',html:'',name:'',generatedAt:null};
  const L=(fa,en,hr,l=null)=>{const v=l||String(typeof lang!=='undefined'?lang:'fa');return v==='fa'?fa:v==='hr'?hr:en};
  const E=v=>typeof h==='function'?h(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const N=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const currentLang=()=>{const v=String(typeof lang!=='undefined'?lang:'fa');return ['fa','en','hr'].includes(v)?v:'fa'};
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
      if(!q)return;
      const selected=N(a.selected,-1),correct=N(q.correct,-2);if(selected===correct)return;
      const opts=Array.isArray(q.options)?q.options:[];
      out.push({number:N(a.question_number,N(q.number,index+1)),question:questionText(q,l)||L('متن سؤال در دسترس نیست','Question text unavailable','Tekst pitanja nije dostupan',l),selected:optionText(opts[selected],l)||String(selected),correct:optionText(opts[correct],l)||String(correct)});
    });
    return out;
  }
  function statusLabel(v,l){
    const key=String(v||''),m={approved:['تأیید شده','Approved','Odobreno'],submitted:['در انتظار بررسی','Pending review','Čeka pregled'],needs_revision:['نیاز به اصلاح','Needs revision','Potrebna dorada']};
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
      return`<article class="nh7r490-attempt"><h4>${E(examTitle(exam,l))} · #${E(a.attempt_number||1)} · ${E(a.passed?'✅ '+L('قبول','Passed','Položeno',l):'↻ '+L('نیاز به مرور','Review needed','Potrebno ponoviti',l))}</h4>
      <p>${E(L('نمره آزمون','Exam score','Rezultat ispita',l))}: <b>${E(a.objective_score_percent??a.score_percent??0)}%</b> · ${E(L('تکالیف','Assignments','Zadaci',l))}: <b>${E(a.assignment_score_percent??0)}%</b> · ${E(L('نهایی','Final','Konačno',l))}: <b>${E(a.final_score_percent??a.score_percent??0)}%</b> · ${E(fmtDate(a.submitted_at,l))}</p>
      <h5>${E(L('پاسخ‌های اشتباه','Incorrect answers','Netočni odgovori',l))} (${wrong.length})</h5>
      ${wrong.length?`<ol>${wrong.map(w=>`<li><strong>${E(w.question)}</strong><br><span>${E(L('پاسخ دانشجو','Student','Student',l))}: ${E(w.selected)}</span><br><span>${E(L('پاسخ صحیح','Correct','Točno',l))}: ${E(w.correct)}</span></li>`).join('')}</ol>`:`<p>✓ ${E(L('پاسخ اشتباهی ثبت نشده است.','No incorrect answers recorded.','Nema zabilježenih netočnih odgovora.',l))}</p>`}
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
  function build(profile,reading,l,email){
    const school=profile?.school||{},activity=profile?.activity||{},reg=school.registration||{};
    const assignments=school.assignments||[],attempts=school.attempts||[],audio=activity.audio||[],library=activity.library||[];
    const name=String(reg.user_name||assignments[0]?.user_name||attempts[0]?.user_name||email);
    const html=`<div class="nh7r490-report" dir="${l==='fa'?'rtl':'ltr'}">
    <header><div><h2>New Hope 7 · ${E(L('گزارش دانشجو','Student Report','Izvještaj studenta',l))}</h2><h3>${E(name)}</h3><p>${E(email)} · ${E(L('تاریخ گزارش','Report date','Datum izvještaja',l))}: ${E(fmtDate(new Date(),l))}</p></div><img src="assets/logo.png" alt=""></header>
    ${summaryCards(school,activity,reading,l)}
    <section><h3>${E(L('تکالیف','Assignments','Zadaci',l))}</h3>${assignmentsHtml(assignments,l)}</section>
    <section><h3>${E(L('آزمون‌ها و پاسخ‌های اشتباه','Exams and incorrect answers','Ispiti i netočni odgovori',l))}</h3>${attemptsHtml(attempts,l)}</section>
    <section><h3>${E(L('فعالیت فایل‌های صوتی','Audio listening activity','Aktivnost slušanja audija',l))}</h3>${audioHtml(audio,l)}</section>
    <section><h3>${E(L('مطالعه کتابخانه','Library reading','Čitanje knjižnice',l))}</h3>${libraryHtml(library,reading,l)}</section>
    <footer>${E(L('این گزارش برای پیگیری آموزشی و خدمتی تهیه شده است.','This report is prepared for educational and ministry follow-up.','Ovo izvješće pripremljeno je za obrazovno i službeno praćenje.',l))}</footer>
  </div>`;
    return{name,html};
  }
  function reportCss(){
    return`body{font-family:system-ui,-apple-system,"Segoe UI",Tahoma,Arial,sans-serif;margin:0;color:#102033;background:#fff}.nh7r490-report{max-width:1100px;margin:auto;padding:24px}.nh7r490-report header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;border-bottom:2px solid #0f766e;padding-bottom:14px}.nh7r490-report header img{width:72px;height:72px;object-fit:contain}.nh7r490-report h2,.nh7r490-report h3,.nh7r490-report h4{margin:0 0 8px}.nh7r490-report section{margin:24px 0}.nh7r490-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:18px 0}.nh7r490-summary div{border:1px solid #d8ecea;border-radius:12px;padding:10px}.nh7r490-summary b{display:block;font-size:1.25rem}.nh7r490-summary span{font-size:.78rem;color:#667085}table{width:100%;border-collapse:collapse;font-size:.85rem}th,td{border:1px solid #dce8e7;padding:7px;vertical-align:top;text-align:start}th{background:#eef8f7}.long{max-width:310px;white-space:pre-wrap}.nh7r490-attempt{border:1px solid #d8ecea;border-radius:14px;padding:12px;margin:10px 0;break-inside:avoid}.nh7r490-attempt li{margin:9px 0}.notice{padding:9px;border-radius:10px;background:#fff7ed;color:#9a3412}.empty{color:#667085}.nh7r490-report footer{margin-top:30px;padding-top:10px;border-top:1px solid #d8ecea;font-size:.75rem;color:#667085}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.nh7r490-report{padding:0}.nh7r490-report section{break-inside:auto}table{page-break-inside:auto}tr{page-break-inside:avoid}.nh7r490-summary{grid-template-columns:repeat(4,1fr)}}@media(max-width:700px){.nh7r490-summary{grid-template-columns:1fr 1fr}.nh7r490-report{padding:12px;overflow-x:auto}}`;
  }
  function panel(){
    const list=students(),opts=list.map(s=>`<option value="${E(s.email)}">${E(s.name||s.email)} · ${E(s.email)}</option>`).join('');
    return`<section class="panel-card"><div class="req-head"><div><h3>📄 ${E(L('گزارش جامع دانشجو','Student Report Center','Centar izvještaja studenta'))}</h3><p class="muted small">${E(L('نام یا ایمیل دانشجو را انتخاب کن؛ گزارش تکالیف، آزمون‌ها، شنیدن فایل‌ها و مطالعه کتابخانه ساخته می‌شود.','Select a student to generate assignments, exams, audio and library activity.','Odaberite studenta za izvještaj o zadacima, ispitima, audiju i knjižnici.'))}</p></div></div>
    <div class="grid3"><select id="nh7ReportStudent"><option value="">— ${E(L('انتخاب دانشجو','Choose student','Odaberi studenta'))} —</option>${opts}</select><select id="nh7ReportLang"><option value="fa">فارسی</option><option value="en">English</option><option value="hr">Hrvatski</option></select><button class="btn primary" onclick="nh7GenerateStudentReportV490()">📊 ${E(L('ساخت گزارش','Generate report','Izradi izvještaj'))}</button></div>
    <div class="actions"><button id="nh7ReportPrintBtn" class="btn secondary" onclick="nh7PrintStudentReportV490()" ${report.html?'':'disabled'}>📄 PDF / Print</button><button class="btn ghost" onclick="loadAll(true)">⟳ ${E(typeof tr==='function'?tr('refresh'):'Refresh')}</button></div>
    <div id="nh7ReportStatus" class="muted small"></div>
  </section><section class="panel-card" id="nh7ReportOutput">${report.html||`<div class="empty">${E(L('هنوز گزارشی ساخته نشده است.','No report generated yet.','Izvještaj još nije izrađen.'))}</div>`}</section>`;
  }
  async function generate(){
    const email=String(document.getElementById('nh7ReportStudent')?.value||'').trim().toLowerCase(),l=String(document.getElementById('nh7ReportLang')?.value||currentLang());
    if(!email){alert(L('دانشجو را انتخاب کن.','Choose a student.','Odaberite studenta.'));return}
    const status=document.getElementById('nh7ReportStatus');if(status)status.textContent=L('در حال جمع‌آوری اطلاعات…','Collecting report data…','Prikupljanje podataka…');
    try{
      const [profile,reading]=await Promise.all([
        adminRpc('nh7_admin_student_profile_v451',{p_email:email}),
        adminRpc('nh7_admin_library_reading_v490',{p_email:email}).catch(()=>[])
      ]);
      const built=build(profile,reading,l,email);report={email,language:l,html:built.html,name:built.name,generatedAt:new Date()};
      const out=document.getElementById('nh7ReportOutput');if(out)out.innerHTML=report.html;
      const btn=document.getElementById('nh7ReportPrintBtn');if(btn)btn.disabled=false;
      if(status)status.textContent=L('گزارش آماده شد ✓','Report ready ✓','Izvještaj je spreman ✓');
    }catch(e){if(status)status.textContent=e.message||String(e);alert(e.message||String(e))}
  }
  function printReport(){
    if(!report.html){alert(L('ابتدا گزارش را بساز.','Generate the report first.','Najprije izradite izvještaj.'));return}
    const w=window.open('','_blank');if(!w){alert(L('مرورگر پنجره چاپ را مسدود کرد.','The browser blocked the print window.','Preglednik je blokirao prozor za ispis.'));return}
    const title=`New Hope 7 - ${report.name}`;
    w.document.open();
    w.document.write(`<!doctype html><html lang="${report.language}" dir="${report.language==='fa'?'rtl':'ltr'}"><head><meta charset="utf-8"><title>${E(title)}</title><style>${reportCss()}</style></head><body>${report.html}<script>setTimeout(()=>window.print(),350)<\/script></body></html>`);
    w.document.close();
  }
  function install(){
    if(typeof tabsHtml!=='function'||typeof renderActivePanel!=='function'||typeof adminRpc!=='function')return false;
    if(tabsHtml.__nh7Report490)return true;
    const oldTabs=tabsHtml;
    const wrappedTabs=function(){
      const html=oldTabs(),button=`<button class="tab ${activeTab==='studentreport'?'active':''}" onclick="setTab('studentreport')">📄 ${E(L('گزارش دانشجو','Student report','Izvještaj studenta'))}</button>`;
      return html.includes('</nav>')?html.replace('</nav>',button+'</nav>'):html+button;
    };
    wrappedTabs.__nh7Report490=true;tabsHtml=window.tabsHtml=wrappedTabs;
    const oldPanel=renderActivePanel;renderActivePanel=window.renderActivePanel=function(){if(activeTab==='studentreport')return panel();return oldPanel()};
    window.nh7GenerateStudentReportV490=generate;
    window.nh7PrintStudentReportV490=printReport;
    window.NH7_ADMIN_STUDENT_REPORT_VERSION=VERSION;
    return true;
  }
  const style=document.createElement('style');
  style.textContent=reportCss()+`.nh7r490-report{padding:0}.nh7r490-report header img{max-width:72px}.nh7r490-report table{min-width:700px}.nh7r490-report section{overflow-x:auto}`;
  document.head.appendChild(style);
  if(!install()){let n=0;const t=setInterval(()=>{n++;if(install()||n>100)clearInterval(t)},100)}
})();