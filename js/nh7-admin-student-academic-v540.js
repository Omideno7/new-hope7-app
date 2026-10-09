/* New Hope 7 Admin v5.4.0 — Student Academic Center
   Read-only academic dashboard + lightweight church member registry.
   No background polling and no analytics writes. */
(()=>{'use strict';
if(window.__NH7_ADMIN_STUDENT_ACADEMIC_V540__)return;
window.__NH7_ADMIN_STUDENT_ACADEMIC_V540__=true;
const VERSION='5.4.7-issue116-readonly-reports';

let view='overview';
let reportFilter='school_registered';
let searchValue='';
let inactiveDays=30;
let showTests=false;
let data=null;
let loading=false;
let error='';
let loadedAt=0;
let waitingForAdminIdle=false;
let retryingAcademicLoad=false;
let pageIndex=0, returnFocus=null, groupSnapshot=null;
const PAGE_SIZE=100;
let loadSequence=0, pendingReload=false;

const L=(fa,en,hr)=>String(typeof lang!=='undefined'?lang:'fa')==='fa'?fa:String(typeof lang!=='undefined'?lang:'fa')==='hr'?hr:en;
const E=v=>typeof h==='function'?h(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const lower=v=>String(v||'').trim().toLowerCase();
function unwrap(v){let d=v;for(let i=0;i<4&&Array.isArray(d)&&d.length===1;i++)d=d[0];if(d&&typeof d==='object'&&!Array.isArray(d)){const keys=Object.keys(d);if(keys.length===1&&/^nh7_admin_/.test(keys[0]))d=d[keys[0]]}return d}
function rows(){return Array.isArray(data?.rows)?data.rows:[]}
function visibleRows(){return rows().filter(x=>showTests||!x.is_test)}
function fmtDate(v){if(!v)return'—';try{return new Date(v).toLocaleDateString(lang==='fa'?'fa-IR':lang==='hr'?'hr-HR':'en-GB')}catch(_){return String(v)}}
function fmtDateTime(v){if(!v)return'—';try{return new Date(v).toLocaleString(lang==='fa'?'fa-IR':lang==='hr'?'hr-HR':'en-GB')}catch(_){return String(v)}}
function statusLabel(code){
  const map={
    member_no_app:['عضو کلیسا بدون حساب/فعالیت شناخته‌شده','Church member without known app account/activity','Član crkve bez poznatog računa/aktivnosti'],
    app_no_school:['حساب اپ دارد، مدرسه ثبت‌نام نکرده','App account, school not registered','Ima račun, škola nije registrirana'],
    registered_never_started:['ثبت‌نام کرده، شروع نکرده','Registered, not started','Registriran, nije započeo'],
    needs_revision:['تکلیف نیاز به اصلاح','Assignment needs revision','Zadatak treba doradu'],
    class_exam_failed:['آزمون کلاس هنوز قبول نشده','Class exam not yet passed','Razredni ispit još nije položen'],
    final_exam_failed:['امتحان نهایی هنوز قبول نشده','Final exam not yet passed','Završni ispit još nije položen'],
    completed:['دوره کامل شده','Course completed','Tečaj završen'],
    graduated:['فارغ‌التحصیل','Graduated','Završio školu'],
    inactive:['شروع کرده ولی غیرفعال شده','Started but inactive','Započeo, ali neaktivan'],
    in_progress:['در حال تحصیل','In progress','U tijeku'],
    known_user:['کاربر شناخته‌شده','Known user','Poznati korisnik']
  };
  const a=map[String(code||'')]||[code||'—',code||'—',code||'—'];
  return lang==='fa'?a[0]:lang==='hr'?a[2]:a[1]
}
function statusClass(row){
  const code=String(row.academic_status_code||row.status_code||'');
  if(['needs_revision','class_exam_failed','final_exam_failed','inactive'].includes(code))return'rejected';
  if(['completed','graduated'].includes(code))return'approved';
  if(row.school_registered)return'pending';
  return''
}
function isCompleted(r){return !!r.course_completed}
function isStalled(r){return !!r.school_registered&&!!r.started_school&&!isCompleted(r)&&N(r.days_since_activity,-1)>=inactiveDays}
function matchesFilter(r,key=reportFilter){
  switch(key){
    case'all':return true;
    case'not_registered':return !r.school_registered;
    case'school_registered':return !!r.school_registered;
    case'app_no_school':return !!r.app_account_exists&&!r.school_registered;
    case'app_used_no_school':return !!r.app_activity_seen&&!r.school_registered;
    case'app_account_no_activity':return !!r.app_account_exists&&!r.app_activity_seen&&!r.school_registered;
    case'registered_never_started':return !!r.school_registered&&!r.started_school;
    case'in_progress':return !!r.school_registered&&!!r.started_school&&!isCompleted(r);
    case'needs_revision':return N(r.revision_assignments)>0;
    case'pending_review':return N(r.pending_assignments)>0;
    case'class_exam_failed':return N(r.unresolved_failed_class_exams)>0;
    case'final_exam_failed':return N(r.final_exam_attempts)>0&&!r.final_exam_passed;
    case'final_exam_passed':return !!r.final_exam_passed;
    case'completed':return !!r.course_completed;
    case'graduated':return !!r.graduated;
    case'inactive':return isStalled(r);
    case'member_no_app':return !!r.in_church_roster&&!r.app_account_exists&&!r.app_activity_seen;
    case'roster':return !!r.in_church_roster;
    case'exam_failed':return N(r.unresolved_failed_class_exams)>0||N(r.final_exam_attempts)>0&&!r.final_exam_passed;
    case'passed':return !!r.final_exam_passed;
    default:return true;
  }
}
function filteredRows(){
  const q=lower(searchValue);
  return visibleRows().filter(r=>matchesFilter(r)&&(!q||lower([r.display_name,r.email,r.phone,r.student_code].join(' ')).includes(q)))
    .sort((a,b)=>String(a.display_name||a.email).localeCompare(String(b.display_name||b.email),undefined,{sensitivity:'base'}))
}
function counts(){
  const list=visibleRows(),c=k=>list.filter(r=>matchesFilter(r,k)).length;
  return{
    all:list.length,
    school_registered:c('school_registered'),
    app_no_school:c('app_no_school'),
    app_used_no_school:c('app_used_no_school'),
    app_account_no_activity:c('app_account_no_activity'),
    never_started:c('registered_never_started'),
    in_progress:c('in_progress'),
    needs_revision:c('needs_revision'),
    pending_review:c('pending_review'),
    class_exam_failed:c('class_exam_failed'),
    final_exam_failed:c('final_exam_failed'),
    final_exam_passed:c('final_exam_passed'),
    completed:c('completed'),
    graduated:c('graduated'),
    inactive:c('inactive'),
    member_no_app:c('member_no_app'),
    roster:c('roster')
  }
}
function optionLabel(key){
  const m={
    all:['همه افراد','All identities','Sve osobe'],
    not_registered:['ثبت‌نام مدرسه ندارد','Not registered in School','Nije registriran u školi'],
    exam_failed:['آزمون کلاس یا نهایی قبول نشده','Class or final exam not passed','Razredni ili završni ispit nije položen'],
    passed:['امتحان نهایی قبول شده','Final exam passed','Završni ispit položen'],
    school_registered:['ثبت‌نام‌شده‌های مدرسه','School registered','Registrirani u školi'],
    app_no_school:['حساب اپ بدون ثبت‌نام مدرسه','App account without school registration','Račun bez školske registracije'],
    app_used_no_school:['فعالیت اپ دیده شده، مدرسه ثبت‌نام نشده','App activity seen, school not registered','Aktivnost u aplikaciji, škola nije registrirana'],
    app_account_no_activity:['حساب دارد، فعالیت اپ دیده نشده','Account exists, no app activity seen','Račun postoji, nema aktivnosti u aplikaciji'],
    registered_never_started:['ثبت‌نام کرده ولی شروع نکرده','Registered but not started','Registriran, nije započeo'],
    in_progress:['در حال گذراندن مدرسه','School in progress','Škola u tijeku'],
    needs_revision:['تکلیف نیاز به اصلاح','Assignments need revision','Zadaci trebaju doradu'],
    pending_review:['تکلیف در انتظار بررسی','Assignments pending review','Zadaci čekaju pregled'],
    class_exam_failed:['آزمون کلاس قبول نشده','Class exam not passed','Razredni ispit nije položen'],
    final_exam_failed:['امتحان نهایی قبول نشده','Final exam not passed','Završni ispit nije položen'],
    final_exam_passed:['امتحان نهایی قبول شده','Final exam passed','Završni ispit položen'],
    completed:['دوره کامل‌شده','Course completed','Tečaj završen'],
    graduated:['فارغ‌التحصیل‌ها','Graduated','Završili školu'],
    inactive:['شروع کرده ولی ادامه نداده','Started but inactive','Započeo pa stao'],
    member_no_app:['عضو کلیسا بدون حساب/فعالیت شناخته‌شده','Church member without known app account/activity','Član bez poznatog računa/aktivnosti'],
    roster:['همه اعضای ثبت‌شده کلیسا','Church member registry','Popis članova crkve']
  };
  const a=m[key]||[key,key,key];return lang==='fa'?a[0]:lang==='hr'?a[2]:a[1]
}
const nh7AcademicDelay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function nh7AcademicAdminBusy(){
  try{return typeof adminLoadInFlight!=='undefined'&&!!adminLoadInFlight}catch(_){return false}
}
async function nh7AcademicWaitForAdminIdle(maxMs=3000){
  const started=Date.now();
  let announced=false;
  while(nh7AcademicAdminBusy()&&Date.now()-started<maxMs){
    waitingForAdminIdle=true;
    if(!announced&&activeTab==='students'){announced=true;render()}
    await nh7AcademicDelay(500);
  }
  waitingForAdminIdle=false;
  // Continue after the bounded initial-sync wait; no extra quiet delay.
}
async function load(force=false){
  if(loading||!token)return;
  if(data&&!force&&Date.now()-loadedAt<60000)return;
  loading=true;error='';retryingAcademicLoad=false;
  if(activeTab==='students')render();
  try{
    await nh7AcademicWaitForAdminIdle();
    const requestDays=inactiveDays,sequence=loadSequence;
    let lastError=null;
    for(let attempt=0;attempt<2;attempt++){
      try{
        const raw=await reportRequest(adminRpc('nh7_admin_student_academic_center_v543',{p_inactive_days:requestDays},20000),22000);
        if(sequence!==loadSequence)return;
        const next=unwrap(raw);if(!Array.isArray(next?.rows))throw new Error(L('پاسخ گزارش معتبر نیست.','Invalid report response.','Nevaljan odgovor izvještaja.'));
        data={...next,__days:requestDays};
        loadedAt=Date.now();
        lastError=null;
        break;
      }catch(e){
        lastError=e;
        if(attempt===0&&/57014|statement timeout/i.test(String(e?.message||e))){
          retryingAcademicLoad=true;
          if(activeTab==='students')render();
          await nh7AcademicDelay(700);
          retryingAcademicLoad=false;
          continue;
        }
        throw e;
      }
    }
    if(lastError)throw lastError;
  }catch(e){error=e?.message||String(e)}
  finally{waitingForAdminIdle=false;retryingAcademicLoad=false;loading=false;if(activeTab==='students')render();if(pendingReload){pendingReload=false;setTimeout(()=>load(true),0)}}
}
function reportRequest(promise,ms){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error(L('زمان دریافت گزارش تمام شد؛ دوباره تلاش کنید.','Report timed out; please retry.','Izvještaj je istekao; pokušajte ponovno.'))),ms);Promise.resolve(promise).then(value=>{clearTimeout(timer);resolve(value)},e=>{clearTimeout(timer);reject(e)})})}
function setView(v){view=v;render();if(!data)setTimeout(()=>load(false),0)}
function setFilter(v){reportFilter=v;pageIndex=0;render()}
function setInactiveDays(v){inactiveDays=Math.max(1,Math.min(365,N(v,30)));loadSequence++;pageIndex=0;error='';render();if(loading)pendingReload=true;else setTimeout(()=>load(true),0)}
function setSearch(v){searchValue=String(v||'');pageIndex=0;const input=document.querySelector('[data-academic-search]'),position=input?.selectionStart;render();const next=document.querySelector('[data-academic-search]');next?.focus();if(position!=null)try{next.setSelectionRange(position,position)}catch(_){}}
function toggleTests(v){showTests=!!v;pageIndex=0;render()}
function setPage(v){pageIndex=Math.max(0,N(v));render()}
function reportNotice(){return '<div role="status" aria-live="polite">'+(loading?'<p>'+E(L('در حال به‌روزرسانی؛ گزارش قبلی قابل مشاهده است.','Refreshing; the previous snapshot remains available.','Osvježavanje; prethodni izvještaj ostaje dostupan.'))+'</p>':'')+(error?'<p class="notice">'+E(L('به‌روزرسانی ناموفق بود؛ داده قبلی را می‌بینید. ','Refresh failed; showing the previous snapshot. ','Osvježavanje nije uspjelo; prikazan je prethodni izvještaj. '))+E(error)+'</p><button class="btn secondary" onclick="nh7StudentAcademicReloadV540()">'+E(L('تلاش دوباره','Retry','Pokušaj ponovno'))+'</button>':'')+(loadedAt?'<small>'+E(L('آخرین دریافت','Last loaded','Zadnje učitavanje'))+': '+E(fmtDateTime(loadedAt))+'</small>':'')+'</div>'}

function nav(){
  const items=[
    ['overview','📊',L('نمای کلی','Overview','Pregled')],
    ['reports','📋',L('گزارش‌ها','Reports','Izvještaji')],
    ['profiles','👤',L('پرونده دانشجو','Student profiles','Profili studenata')],
    ['members','⛪',L('اعضای کلیسا','Church members','Članovi crkve')]
  ];
  return'<div class="nh7ac540-nav">'+items.map(([id,icon,label])=>'<button type="button" class="'+(view===id?'active':'')+'" onclick="nh7StudentAcademicSetViewV540(\''+id+'\')">'+icon+' '+E(label)+'</button>').join('')+'</div>'
}
function loadingCard(){
  if(error)return'<section class="panel-card"><div class="notice" role="alert">'+E(L('گزارش بارگذاری نشد. ','Report could not load. ','Izvještaj nije učitan. '))+E(error)+'</div><button class="btn secondary" onclick="nh7StudentAcademicReloadV540()">⟳ '+E(L('تلاش دوباره','Retry','Pokušaj ponovno'))+'</button></section>';
  const message=waitingForAdminIdle
    ?L('در حال تکمیل بارگذاری اولیه پنل… گزارش دانشجو بلافاصله بعد از آن دریافت می‌شود.','Finishing the Admin initial sync… the student report will load immediately afterward.','Dovršava se početna sinkronizacija… izvještaj će se učitati odmah nakon toga.')
    :retryingAcademicLoad
      ?L('سرور شلوغ بود؛ گزارش به‌صورت خودکار دوباره در حال دریافت است…','The server was busy; the report is retrying automatically…','Poslužitelj je bio zauzet; izvještaj se automatski ponovno učitava…')
      :L('در حال جمع‌آوری گزارش‌های دانشگاهی…','Loading academic reports…','Učitavanje akademskih izvještaja…');
  return'<section class="panel-card"><div class="empty" role="status" aria-live="polite">'+E(message)+'</div></section>'
}
function statCard(value,label,filter,alert=false){
  return'<button type="button" class="nh7ac540-stat '+(alert?'alert':'')+'" onclick="nh7StudentAcademicOpenReportV540(\''+filter+'\')"><b>'+E(value)+'</b><span>'+E(label)+'</span></button>'
}
function overview(){
  if(!data)return loadingCard();
  const c=counts();
  return'<section class="panel-card"><div class="req-head"><div><h3>🎓 '+E(L('مرکز مدیریت دانشگاهی','Academic Management Center','Centar akademskog upravljanja'))+'</h3><p class="muted small">'+E(L('وضعیت‌ها اکنون بین آزمون کلاس، امتحان نهایی، تکمیل دوره و فارغ‌التحصیلی تفکیک شده‌اند. سابقهٔ معتبر دانشجویان قدیمی حفظ شده و از مرحله بعد قانون جدید اجرا می‌شود.','Statuses now distinguish class exams, the final exam, course completion, and graduation. Valid legacy progress is preserved and the new rules apply from the next stage.','Statusi sada razlikuju razredne ispite, završni ispit, završetak tečaja i diplomiranje. Valjani stari napredak ostaje sačuvan, a nova pravila vrijede od sljedeće faze.'))+'</p></div><button class="btn secondary" onclick="nh7StudentAcademicReloadV540()">⟳ '+E(L('به‌روزرسانی','Refresh','Osvježi'))+'</button></div>'+
  reportNotice()+'<div class="nh7ac540-stats">'+
    statCard(c.school_registered,L('ثبت‌نام مدرسه','School registered','Registrirani u školi'),'school_registered')+
    statCard(c.app_used_no_school,L('اپ استفاده شده، بدون مدرسه','App used, no school','Aplikacija korištena, bez škole'),'app_used_no_school',c.app_used_no_school>0)+
    statCard(c.never_started,L('ثبت‌نام، بدون شروع','Registered, not started','Registrirani, nisu počeli'),'registered_never_started',c.never_started>0)+
    statCard(c.in_progress,L('در حال تحصیل','In progress','U tijeku'),'in_progress')+
    statCard(c.needs_revision,L('نیاز به اصلاح تکلیف','Needs revision','Treba doradu'),'needs_revision',c.needs_revision>0)+
    statCard(c.class_exam_failed,L('آزمون کلاس قبول نشده','Class exam not passed','Razredni ispit nije položen'),'class_exam_failed',c.class_exam_failed>0)+
    statCard(c.final_exam_failed,L('امتحان نهایی قبول نشده','Final exam not passed','Završni ispit nije položen'),'final_exam_failed',c.final_exam_failed>0)+
    statCard(c.final_exam_passed,L('امتحان نهایی قبول شده','Final exam passed','Završni ispit položen'),'final_exam_passed')+
    statCard(c.completed,L('دوره کامل شده','Course completed','Tečaj završen'),'completed')+
    statCard(c.graduated,L('فارغ‌التحصیل','Graduated','Završili školu'),'graduated')+
    statCard(c.inactive,L('شروع کرده، متوقف شده','Started, inactive','Započeo, neaktivan'),'inactive',c.inactive>0)+
  '</div>'+
  '<div class="nh7ac540-note"><strong>'+E(L('قانون پیشرفت','Progression rule','Pravilo napredovanja'))+':</strong> '+E(L('از اولین کلاس پس از سابقهٔ Legacy: تکمیل درس‌های همان کلاس → تأیید همه تکالیف لازم → قبولی آزمون همان کلاس → بازشدن کلاس بعد. امتحان نهایی فقط پس از معتبرشدن هر ۷ مرحله باز می‌شود.','From the first class after the legacy anchor: complete the class lessons → all required assignments approved → pass that class exam → unlock the next class. The final exam opens only after all 7 stages are validated.','Od prvog razreda nakon legacy točke: završiti lekcije → odobriti sve potrebne zadatke → položiti ispit tog razreda → otključati sljedeći razred. Završni ispit otvara se tek nakon potvrđenih svih 7 faza.'))+'</div>'+
  '<div class="nh7ac540-actions"><button class="btn primary" onclick="nh7StudentAcademicOpenReportV540(\'needs_revision\')">📝 '+E(L('پیگیری تکالیف نیازمند اصلاح','Follow up revisions','Prati zadatke za doradu'))+'</button><button class="btn secondary" onclick="nh7StudentAcademicOpenReportV540(\'app_used_no_school\')">📱 '+E(L('اپ استفاده شده ولی مدرسه ثبت‌نام نشده','App used but school not registered','Aplikacija korištena, škola nije registrirana'))+'</button><button class="btn secondary" onclick="nh7StudentAcademicSetViewV540(\'members\')">⛪ '+E(L('مدیریت فهرست اعضا','Manage member registry','Upravljaj članovima'))+'</button></div></section>'
}
function filterOptions(){
  const keys=['school_registered','not_registered','passed','exam_failed','app_used_no_school','app_account_no_activity','app_no_school','registered_never_started','in_progress','needs_revision','pending_review','class_exam_failed','final_exam_failed','final_exam_passed','completed','graduated','inactive','member_no_app','all'];
  return keys.map(k=>'<option value="'+k+'" '+(reportFilter===k?'selected':'')+'>'+E(optionLabel(k))+'</option>').join('')
}
function reportTable(){
  const all=filteredRows();pageIndex=Math.min(pageIndex,Math.max(0,Math.ceil(all.length/PAGE_SIZE)-1));
  const list=all.slice(pageIndex*PAGE_SIZE,(pageIndex+1)*PAGE_SIZE);
  const body=list.map(r=>'<tr>'+
    '<td><strong>'+E(r.display_name||r.email)+'</strong><br><small>'+E(r.email||'—')+'</small>'+(r.student_code?'<br><small><b>'+E(r.student_code)+'</b></small>':'')+'</td>'+
    '<td>'+E(r.app_activity_seen?L('فعالیت دیده شده','Activity seen','Aktivnost zabilježena'):L('فعالیت شناسایی نشده','No identified activity','Nema prepoznate aktivnosti'))+'<br><small>'+E(fmtDate(r.last_app_activity))+'</small></td>'+
    '<td>'+E(r.school_registered?L('ثبت‌نام شده','Registered','Registriran'):L('ثبت‌نام نشده','Not registered','Nije registriran'))+'<br><small>'+E(fmtDate(r.registered_at))+'</small></td>'+
    '<td>'+E(N(r.completed_lessons))+'/'+E(N(r.total_lessons))+'<br><small>'+E(L('مرحله معتبر','validated stages','potvrđene faze'))+': '+E(N(r.validated_classes))+'/7'+(N(r.legacy_completed_through_class)>0?' · Legacy '+E(N(r.legacy_completed_through_class)):'')+'</small></td>'+
    '<td>'+E(N(r.revision_assignments))+' / '+E(N(r.pending_assignments))+'<br><small>'+E(L('اصلاح / بررسی','revision / review','dorada / pregled'))+'</small></td>'+
    '<td><strong>'+E(r.final_exam_passed?L('نهایی: قبول','Final: passed','Završni: položen'):N(r.final_exam_attempts)>0?L('نهایی: قبول نشده','Final: not passed','Završni: nije položen'):L('نهایی: هنوز باز/داده نشده','Final: not taken yet','Završni: još nije polagan'))+'</strong><br><small>'+E(L('آزمون کلاس قبول‌شده','class exams passed','položeni razredni ispiti'))+': '+E(N(r.class_exams_passed))+' · '+E(L('نمره نهایی','final score','završni rezultat'))+': '+E(r.final_exam_best_score==null?'—':N(r.final_exam_best_score)+'%')+'</small></td>'+
    '<td>'+E(fmtDate(r.last_school_activity))+(r.days_since_activity!=null?'<br><small>'+E(r.days_since_activity)+' '+E(L('روز قبل','days ago','dana'))+'</small>':'')+'</td>'+
    '<td><span class="pill '+statusClass(r)+'">'+E(statusLabel(r.academic_status_code||r.status_code))+'</span></td>'+
    '<td><div class="nh7ac540-row-actions">'+(r.email?'<button class="btn ghost" onclick="nh7StudentAcademicProfileV540(\''+encodeURIComponent(r.email)+'\')">'+E(L('پرونده','Profile','Profil'))+'</button><button class="btn ghost" onclick="nh7StudentAcademicIndividualReportV540(\''+encodeURIComponent(r.email)+'\')">PDF</button>':'')+'</div></td>'+
  '</tr>').join('');
  return'<div class="nh7ac540-pagination"><button class="btn secondary" '+(pageIndex===0?'disabled':'')+' onclick="nh7StudentAcademicPageV116('+ (pageIndex-1) +')">'+E(L('قبلی','Previous','Prethodno'))+'</button><span>'+E(L('صفحه','Page','Stranica'))+' '+(pageIndex+1)+' / '+Math.max(1,Math.ceil(all.length/PAGE_SIZE))+' · '+all.length+'</span><button class="btn secondary" '+((pageIndex+1)*PAGE_SIZE>=all.length?'disabled':'')+' onclick="nh7StudentAcademicPageV116('+ (pageIndex+1) +')">'+E(L('بعدی','Next','Sljedeće'))+'</button></div><div class="nh7ac540-table-wrap"><table class="nh7ac540-table"><thead><tr>'+
    '<th>'+E(L('دانشجو','Student','Student'))+'</th><th>'+E(L('اپ','App','Aplikacija'))+'</th><th>'+E(L('ثبت‌نام','Registration','Registracija'))+'</th><th>'+E(L('درس / مرحله','Lessons / stages','Lekcije / faze'))+'</th><th>'+E(L('تکالیف','Assignments','Zadaci'))+'</th><th>'+E(L('آزمون‌ها','Exams','Ispiti'))+'</th><th>'+E(L('آخرین فعالیت','Last activity','Zadnja aktivnost'))+'</th><th>'+E(L('وضعیت کل','Overall status','Ukupni status'))+'</th><th></th>'+
  '</tr></thead><tbody>'+body+'</tbody></table></div>'+
  (!list.length?'<div class="empty">'+E(L('موردی با این فیلتر پیدا نشد.','No records match this filter.','Nema zapisa za ovaj filtar.'))+'</div>':'')
}
function reports(){
  if(!data)return loadingCard();
  const list=filteredRows();
  return'<section class="panel-card"><div class="req-head"><div><h3>📋 '+E(L('گزارش‌های گروهی دانشجویان','Student Group Reports','Grupni izvještaji studenata'))+'</h3><p class="muted small">'+E(L('گروه را انتخاب کن، سپس همان لیست را CSV بگیر یا برای PDF/چاپ باز کن.','Choose a group, then export the same list as CSV or open a printable/PDF report.','Odaberite grupu, zatim izvezite CSV ili otvorite izvještaj za PDF/ispis.'))+'</p></div><span class="pill">'+E(list.length)+' '+E(L('نفر','people','osoba'))+'</span></div>'+
  reportNotice()+'<div class="nh7ac540-toolbar"><select aria-label="'+E(L('گروه گزارش','Report group','Grupa izvještaja'))+'" onchange="nh7StudentAcademicSetFilterV540(this.value)">'+filterOptions()+'</select><input data-academic-search type="search" aria-label="'+E(L('جستجو','Search','Pretraži'))+'" placeholder="'+E(L('جستجوی نام، ایمیل یا کد دانشجویی…','Search name, email or Student ID…','Pretraži ime, e-mail ili studentski ID…'))+'" value="'+E(searchValue)+'" oninput="nh7StudentAcademicSearchV540(this.value)"><select aria-label="'+E(L('روزهای عدم فعالیت','Inactive days','Dani neaktivnosti'))+'" onchange="nh7StudentAcademicInactiveDaysV540(this.value)"><option value="7" '+(inactiveDays===7?'selected':'')+'>7 '+E(L('روز','days','dana'))+'</option><option value="14" '+(inactiveDays===14?'selected':'')+'>14 '+E(L('روز','days','dana'))+'</option><option value="30" '+(inactiveDays===30?'selected':'')+'>30 '+E(L('روز','days','dana'))+'</option><option value="60" '+(inactiveDays===60?'selected':'')+'>60 '+E(L('روز','days','dana'))+'</option><option value="90" '+(inactiveDays===90?'selected':'')+'>90 '+E(L('روز','days','dana'))+'</option></select></div>'+
  '<div class="nh7ac540-actions"><button class="btn primary" onclick="nh7StudentAcademicCsvV540()">⬇ CSV</button><button class="btn secondary" onclick="nh7StudentAcademicPrintV540()">📄 PDF / '+E(L('چاپ','Print','Ispis'))+'</button><label class="nh7ac540-check"><input type="checkbox" '+(showTests?'checked':'')+' onchange="nh7StudentAcademicToggleTestsV540(this.checked)"> '+E(L('نمایش حساب‌های تست','Show test accounts','Prikaži test račune'))+'</label></div>'+
  reportTable()+'</section>'
}
function memberRows(){
  return visibleRows().filter(r=>r.in_church_roster).sort((a,b)=>String(a.display_name||a.email).localeCompare(String(b.display_name||b.email)))
}
function members(){
  if(!data)return loadingCard();
  const list=memberRows(),noApp=list.filter(r=>!r.app_account_exists&&!r.app_activity_seen).length,noSchool=list.filter(r=>r.app_activity_seen&&!r.school_registered).length;
  const cards=list.map(r=>'<article class="nh7ac540-member"><div><strong>'+E(r.display_name||r.email)+'</strong><small>'+E(r.email||'—')+(r.phone?' · '+E(r.phone):'')+'</small></div><div class="nh7ac540-member-flags"><span class="pill '+(r.app_activity_seen?'approved':r.app_account_exists?'pending':'rejected')+'">'+E(r.app_activity_seen?L('فعالیت اپ دیده شده','App activity seen','Aktivnost u aplikaciji'):r.app_account_exists?L('حساب دارد، فعالیت دیده نشده','Account, no activity seen','Račun, nema aktivnosti'):L('بدون حساب/فعالیت شناخته‌شده','No known account/activity','Nema poznatog računa/aktivnosti'))+'</span><span class="pill '+(r.school_registered?'approved':'pending')+'">'+E(r.school_registered?L('مدرسه ثبت‌نام شده','School registered','Škola registrirana'):L('مدرسه ثبت‌نام نشده','School not registered','Škola nije registrirana'))+'</span></div><button class="btn danger-btn" onclick="nh7DeleteChurchMemberV540(\''+E(r.member_id)+'\')">🗑</button></article>').join('');
  return'<section class="panel-card"><div class="req-head"><div><h3>⛪ '+E(L('فهرست اعضای کلیسا','Church Member Registry','Popis članova crkve'))+'</h3><p class="muted small">'+E(L('برای فهمیدن اینکه کدام عضو اصلاً حساب اپ ندارد، فهرست اعضای کلیسا باید اینجا ثبت شود. تطبیق فقط با ایمیل انجام می‌شود.','To identify members with no app account, keep the church roster here. Matching is by email.','Za prepoznavanje članova bez računa vodite popis ovdje. Usklađivanje je prema e-mailu.'))+'</p></div><button class="btn secondary" onclick="nh7DownloadChurchMemberTemplateV540()">⬇ '+E(L('نمونه CSV','CSV template','CSV predložak'))+'</button></div>'+
  '<div class="nh7ac540-stats">'+statCard(list.length,L('اعضای فهرست','Roster members','Članovi'),'roster')+statCard(noApp,L('بدون حساب اپ','No app account','Bez računa'),'member_no_app',noApp>0)+statCard(noSchool,L('حساب اپ، بدون مدرسه','App account, no school','Račun bez škole'),'app_no_school',noSchool>0)+'</div>'+
  '<div class="nh7ac540-member-form"><input id="nh7MemberNameV540" placeholder="'+E(L('نام و نام خانوادگی','Full name','Ime i prezime'))+'"><input id="nh7MemberEmailV540" type="email" placeholder="email@example.com"><input id="nh7MemberPhoneV540" placeholder="'+E(L('تلفن (اختیاری)','Phone (optional)','Telefon (opcionalno)'))+'"><button class="btn primary" onclick="nh7AddChurchMemberV540()">＋ '+E(L('افزودن عضو','Add member','Dodaj člana'))+'</button></div>'+
  '<label class="file-drop nh7ac540-import"><strong>CSV · '+E(L('ورود گروهی اعضا','Bulk member import','Skupni uvoz članova'))+'</strong><input type="file" accept=".csv,text/csv" onchange="nh7ImportChurchMembersV540(this)"><small>'+E(L('ستون‌ها: full_name,email,phone. ایمیل برای تطبیق با حساب اپ لازم است.','Columns: full_name,email,phone. Email is required for app-account matching.','Stupci: full_name,email,phone. E-mail je potreban za povezivanje.'))+'</small></label>'+
  '<div class="nh7ac540-member-list">'+(cards||'<div class="empty">'+E(L('هنوز فهرست اعضا وارد نشده است.','No church member roster has been imported yet.','Popis članova još nije uvezen.'))+'</div>')+'</div></section>'
}
function shell(oldDashboard){
  if(!data&&!loading&&!error)setTimeout(()=>load(false),0);
  return'<section class="panel-card nh7ac540-shell"><div class="req-head"><div><h2>🎓 '+E(L('دانشجویان و گزارش‌های آموزشی','Students & Academic Reports','Studenti i akademski izvještaji'))+'</h2><p class="muted small">'+E(L('مدیریت مدرسه، پیگیری، گزارش گروهی و پرونده فردی در یک بخش.','School management, follow-up, group reports, and student profiles in one place.','Upravljanje školom, praćenje i izvještaji na jednom mjestu.'))+'</p></div></div>'+nav()+'</section>'+
    (view==='overview'?overview():view==='reports'?reports():view==='members'?members():oldDashboard)
}

function csvEscape(v){let s=String(v??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return /[",\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
function csvRows(list=filteredRows()){
  const header=['display_name','email','student_code','app_account_exists','app_activity_seen','last_app_activity','school_registered','completed_lessons','validated_classes','legacy_completed_through_class','revision_assignments','pending_assignments','class_exams_passed','unresolved_failed_class_exams','final_exam_attempts','final_exam_passed','final_exam_best_score','course_completed','graduated','last_school_activity','status','status_code','total_lessons','pending_lessons','registered_at'];
  const body=list.map(r=>[
    r.display_name,r.email,r.student_code||'',r.app_account_exists?'yes':'no',r.app_activity_seen?'yes':'no',r.last_app_activity||'',r.school_registered?'yes':'no',
    r.completed_lessons,r.validated_classes,r.legacy_completed_through_class,r.revision_assignments,r.pending_assignments,
    r.class_exams_passed,r.unresolved_failed_class_exams,r.final_exam_attempts,r.final_exam_passed?'yes':'no',r.final_exam_best_score??'',
    r.course_completed?'yes':'no',r.graduated?'yes':'no',r.last_school_activity||'',statusLabel(r.academic_status_code||r.status_code),r.academic_status_code||r.status_code,r.total_lessons,Math.max(0,N(r.total_lessons)-N(r.completed_lessons)),r.registered_at||''
  ]);
  return[header,...body]
}
function downloadCsv(){
  const text='\uFEFF'+csvRows(groupSnapshot?.rows||filteredRows()).map(row=>row.map(csvEscape).join(',')).join('\r\n');
  const blob=new Blob([text],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='New-Hope-7-'+String(reportFilter||'students')+'-'+new Date().toISOString().slice(0,10)+'.csv';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)
}
function closeGroupReport(){
  const modal=document.getElementById('nh7AcademicGroupReportV546');
  if(modal)modal.remove();groupSnapshot=null;if(returnFocus?.isConnected)returnFocus.focus();
  document.body.classList.remove('nh7ac540-report-open','nh7ac540-printing');
}
function groupPdfAction(){
  if(!document.getElementById('nh7AcademicGroupReportV546'))return;
  document.body.classList.add('nh7ac540-printing');
  const oldTitle=document.title;document.title='New Hope 7 — '+optionLabel(reportFilter);
  const cleanup=()=>{document.body.classList.remove('nh7ac540-printing');document.title=oldTitle};
  window.addEventListener('afterprint',cleanup,{once:true});
  try{window.print()}catch(e){cleanup();throw e}
}

function printGroup(){
  closeGroupReport();returnFocus=document.activeElement;
  const list=filteredRows();groupSnapshot={rows:list};
  const rows=list.map(r=>'<tr>'+
    '<td><strong>'+E(r.display_name||r.email)+'</strong><br><small>'+E(r.email||'—')+'</small>'+(r.student_code?'<br><small><b>'+E(r.student_code)+'</b></small>':'')+'</td>'+
    '<td>'+E(N(r.completed_lessons))+'/'+E(N(r.total_lessons))+'<br><small>'+E(L('مرحله معتبر','validated','potvrđeno'))+': '+E(N(r.validated_classes))+'/7</small></td>'+
    '<td>'+E(N(r.revision_assignments))+'<br><small>'+E(L('در انتظار','pending','na čekanju'))+': '+E(N(r.pending_assignments))+'</small></td>'+
    '<td>'+E(N(r.class_exams_passed))+'/7</td>'+
    '<td>'+E(r.final_exam_passed?L('قبول','Passed','Položen'):N(r.final_exam_attempts)>0?L('قبول نشده','Not passed','Nije položen'):L('هنوز داده نشده','Not taken','Nije polagan'))+
      (r.final_exam_best_score==null?'':'<br><small>'+E(N(r.final_exam_best_score))+'%</small>')+'</td>'+
    '<td>'+E(fmtDate(r.last_school_activity))+'</td>'+
    '<td>'+E(statusLabel(r.academic_status_code||r.status_code))+'</td>'+
  '</tr>').join('');

  const modal=document.createElement('div');
  modal.id='nh7AcademicGroupReportV546';
  modal.className='nh7ac540-report-modal';
  modal.setAttribute('role','dialog');
  modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','nh7GroupReportTitle');modal.lang=lang;
  modal.innerHTML=
    '<section class="nh7ac540-report-dialog" dir="'+(lang==='fa'?'rtl':'ltr')+'">'+
      '<div class="nh7ac540-report-toolbar">'+
        '<div class="nh7ac540-report-heading"><strong id="nh7GroupReportTitle">New Hope 7 · '+E(optionLabel(reportFilter))+'</strong><small>'+E(L('آخرین دریافت','Last loaded','Zadnje učitavanje'))+': '+E(fmtDateTime(loadedAt||new Date()))+' · '+E(list.length)+' '+E(L('نفر','people','osoba'))+'</small></div>'+
        '<div class="nh7ac540-report-actions">'+
          '<button type="button" id="nh7AcademicGroupPdfBtnV547" class="btn primary" onclick="nh7StudentAcademicGroupPdfActionV547()">🖨 '+E(L('چاپ','Print','Ispis'))+'</button>'+
          '<button type="button" class="btn secondary" onclick="nh7StudentAcademicGroupPdfActionV547()">'+E(L('ذخیره PDF','Save as PDF','Spremi kao PDF'))+'</button>'+
          '<button type="button" class="btn secondary" onclick="nh7StudentAcademicCsvV540()">⬇ CSV</button>'+
          '<button type="button" class="nh7ac540-report-close" aria-label="'+E(L('بستن','Close','Zatvori'))+'" onclick="nh7StudentAcademicCloseReportV546()">✕</button>'+
        '</div>'+
      '</div>'+
      '<div id="nh7AcademicGroupPdfHintV547" class="nh7ac540-report-help">'+E(L('برای PDF در پنجره چاپ گزینه ذخیره PDF را انتخاب کنید.','For PDF, choose Save as PDF in the browser print dialog.','Za PDF odaberite Spremi kao PDF u dijalogu ispisa.'))+'</div>'+
      '<div class="nh7ac540-report-body">'+
        '<table class="nh7ac540-print-table"><thead><tr>'+
          '<th>'+E(L('دانشجو','Student','Student'))+'</th>'+
          '<th>'+E(L('درس / مرحله','Lessons / stages','Lekcije / faze'))+'</th>'+
          '<th>'+E(L('تکالیف','Assignments','Zadaci'))+'</th>'+
          '<th>'+E(L('آزمون کلاس','Class exams','Razredni ispiti'))+'</th>'+
          '<th>'+E(L('امتحان نهایی','Final exam','Završni ispit'))+'</th>'+
          '<th>'+E(L('آخرین فعالیت','Last activity','Zadnja aktivnost'))+'</th>'+
          '<th>'+E(L('وضعیت','Status','Status'))+'</th>'+
        '</tr></thead><tbody>'+rows+'</tbody></table>'+
        (!list.length?'<div class="empty">'+E(L('موردی در این گزارش وجود ندارد.','This report has no records.','Ovaj izvještaj nema zapisa.'))+'</div>':'')+
      '</div>'+
    '</section>';
  modal.addEventListener('click',event=>{if(event.target===modal)closeGroupReport()});
  document.body.appendChild(modal);
  document.body.classList.add('nh7ac540-report-open');
  modal.querySelector('button')?.focus();
}

function openProfile(encoded){
  const email=decodeURIComponent(encoded);view='profiles';
  try{selectedStudentEmail=email}catch(_){}
  render()
}
function individualReport(encoded){
  const email=decodeURIComponent(encoded);activeTab='studentreport';render();
  setTimeout(()=>{
    const select=document.getElementById('nh7ReportStudent');
    if(select){if(![...select.options].some(x=>x.value===email))select.add(new Option(email,email));select.value=email;window.nh7GenerateStudentReportV496?.()}
  },120)
}

async function addMember(){
  const full_name=String(document.getElementById('nh7MemberNameV540')?.value||'').trim();
  const email=lower(document.getElementById('nh7MemberEmailV540')?.value);
  const phone=String(document.getElementById('nh7MemberPhoneV540')?.value||'').trim();
  if(!email){alert(L('ایمیل عضو را وارد کن؛ برای تطبیق با حساب اپ لازم است.','Enter the member email; it is required for app-account matching.','Unesite e-mail člana; potreban je za povezivanje.'));return}
  try{await adminRpc('nh7_admin_upsert_church_members_v540',{p_members:[{full_name,email,phone,member_status:'active'}]});await load(true)}
  catch(e){alert(e?.message||String(e))}
}
async function deleteMember(id){
  if(!confirm(L('این عضو از فهرست مرجع حذف شود؟ اطلاعات حساب یا مدرسه او حذف نمی‌شود.','Remove this member from the reference roster? Their app/school data will not be deleted.','Ukloniti člana s popisa? Podaci aplikacije/škole neće se izbrisati.')))return;
  try{await adminRpc('nh7_admin_delete_church_member_v540',{p_id:id});await load(true)}catch(e){alert(e?.message||String(e))}
}
function parseCsv(text){
  const rows=[];let row=[],field='',quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i],next=text[i+1];
    if(ch==='"'){if(quoted&&next==='"'){field+='"';i++}else quoted=!quoted}
    else if(ch===','&&!quoted){row.push(field);field=''}
    else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&next==='\n')i++;row.push(field);if(row.some(v=>String(v).trim()!==''))rows.push(row);row=[];field=''}
    else field+=ch
  }
  row.push(field);if(row.some(v=>String(v).trim()!==''))rows.push(row);
  if(!rows.length)return[];
  const headers=rows.shift().map(x=>lower(x).replace(/^\ufeff/,''));
  return rows.map(cols=>Object.fromEntries(headers.map((h,i)=>[h,String(cols[i]||'').trim()])))
}
async function importMembers(input){
  const file=input?.files?.[0];if(!file)return;
  try{
    const parsed=parseCsv(await file.text());
    const members=parsed.map(x=>({
      full_name:x.full_name||x.name||x.fullname||'',
      email:lower(x.email||x.user_email),
      phone:x.phone||'',
      member_status:x.member_status||'active',
      notes:x.notes||''
    })).filter(x=>x.email);
    if(!members.length)throw new Error(L('هیچ ایمیل معتبری در CSV پیدا نشد.','No valid emails found in the CSV.','U CSV-u nema valjanih e-mail adresa.'));
    await adminRpc('nh7_admin_upsert_church_members_v540',{p_members:members});
    alert(L('فهرست اعضا وارد شد: ','Member roster imported: ','Popis članova je uvezen: ')+members.length);
    input.value='';await load(true)
  }catch(e){alert(e?.message||String(e))}
}
function downloadTemplate(){
  const blob=new Blob(['\uFEFFfull_name,email,phone\r\nExample Member,member@example.com,+385'],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='New-Hope-7-Church-Members-Template.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)
}
function openReport(filter){reportFilter=filter;view='reports';render()}

const style=document.createElement('style');
style.id='nh7StudentAcademicV540Style';
style.textContent=`
.nh7ac540-shell{padding-bottom:10px}.nh7ac540-pagination{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:10px 0}.nh7ac540-report-dialog{min-height:0}.nh7ac540-report-body{min-height:0}.nh7ac540-nav{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.nh7ac540-nav button{border:1px solid var(--line,#d8ecea);background:#f8fbfb;color:#17324d;border-radius:14px;padding:11px 8px;font-weight:800}.nh7ac540-nav button.active{background:#0f766e;color:white;border-color:#0f766e}
.nh7ac540-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:14px 0}.nh7ac540-stat{border:1px solid #d8ecea;background:#fff;border-radius:16px;padding:13px;text-align:start;min-height:88px}.nh7ac540-stat b{display:block;font-size:1.55rem;color:#102033}.nh7ac540-stat span{display:block;margin-top:4px;color:#667085;font-size:.82rem;line-height:1.45}.nh7ac540-stat.alert{border-color:#f3c7c2;background:#fff8f7}.nh7ac540-stat.alert b{color:#b42318}
.nh7ac540-note{padding:11px 13px;border-radius:14px;background:#eff8ff;color:#175cd3;line-height:1.7;margin:10px 0}.nh7ac540-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.nh7ac540-toolbar{display:grid;grid-template-columns:minmax(180px,1fr) minmax(200px,1.4fr) minmax(110px,.5fr);gap:8px;margin:12px 0}.nh7ac540-check{display:flex;align-items:center;gap:6px;padding:8px 10px}
.nh7ac540-table-wrap{overflow:auto;-webkit-overflow-scrolling:touch;border:1px solid #d8ecea;border-radius:14px;margin-top:12px}.nh7ac540-table{width:100%;min-width:980px;border-collapse:collapse;font-size:.82rem}.nh7ac540-table th,.nh7ac540-table td{padding:9px;border-bottom:1px solid #e7efef;text-align:start;vertical-align:top}.nh7ac540-table th{background:#f3faf9;position:sticky;top:0;z-index:1}.nh7ac540-row-actions{display:flex;gap:5px;flex-wrap:wrap}.nh7ac540-row-actions .btn{padding:7px 8px;margin:0;min-width:0}
.nh7ac540-member-form{display:grid;grid-template-columns:1.2fr 1.2fr 1fr auto;gap:8px;margin:12px 0}.nh7ac540-import{margin:10px 0}.nh7ac540-member-list{display:grid;gap:8px}.nh7ac540-member{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:10px;align-items:center;border:1px solid #d8ecea;border-radius:14px;padding:11px;background:#fff}.nh7ac540-member strong,.nh7ac540-member small{display:block}.nh7ac540-member small{margin-top:3px;color:#667085}.nh7ac540-member-flags{display:flex;gap:5px;flex-wrap:wrap}
.nh7ac540-report-modal{position:fixed;inset:0;z-index:2147482000;background:rgba(15,35,45,.55);display:flex;align-items:stretch;justify-content:center;padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom));box-sizing:border-box}
.nh7ac540-report-dialog{width:min(1180px,100%);height:100%;background:#fff;border-radius:22px;box-shadow:0 24px 70px rgba(0,0,0,.28);display:flex;flex-direction:column;overflow:hidden;color:#102033}
.nh7ac540-report-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid #d8ecea;background:#f8fbfb;position:sticky;top:0;z-index:4}
.nh7ac540-report-heading strong,.nh7ac540-report-heading small{display:block}.nh7ac540-report-heading strong{font-size:1.05rem}.nh7ac540-report-heading small{margin-top:4px;color:#667085}
.nh7ac540-report-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.nh7ac540-report-actions .btn{margin:0}
.nh7ac540-report-close{width:42px;height:42px;border:0;border-radius:50%;background:#fff2cc;color:#7a5200;font-size:1.35rem;font-weight:900;box-shadow:0 4px 14px rgba(0,0,0,.12);cursor:pointer}
.nh7ac540-report-help{padding:9px 16px;background:#fff8e8;color:#7a5200;font-size:.82rem;line-height:1.6;border-bottom:1px solid #f3dfac}
.nh7ac540-report-body{padding:16px;overflow:auto;-webkit-overflow-scrolling:touch;flex:1}
.nh7ac540-print-table{width:100%;border-collapse:collapse;font-size:.78rem;min-width:880px}.nh7ac540-print-table th,.nh7ac540-print-table td{border:1px solid #d7e3e3;padding:8px;text-align:start;vertical-align:top}.nh7ac540-print-table th{background:#eef8f7;position:sticky;top:0}.nh7ac540-print-table small{color:#667085}
body.nh7ac540-report-open{overflow:hidden}
@media(max-width:720px){.nh7ac540-report-modal{padding:max(6px,env(safe-area-inset-top)) 6px max(6px,env(safe-area-inset-bottom))}.nh7ac540-report-dialog{border-radius:16px}.nh7ac540-report-toolbar{align-items:flex-start;flex-direction:column}.nh7ac540-report-actions{width:100%}.nh7ac540-report-actions .btn{flex:1}.nh7ac540-report-close{margin-inline-start:auto;position:absolute;top:10px;inset-inline-end:10px}.nh7ac540-report-heading{padding-inline-end:48px}.nh7ac540-report-body{padding:10px}}
@media print{
  @page{size:A4 landscape;margin:12mm}
  html,body{height:auto!important;overflow:visible!important}
  body.nh7ac540-printing .nh7ac540-print-table{table-layout:fixed;overflow-wrap:anywhere}
  body.nh7ac540-printing thead{display:table-header-group}
  body.nh7ac540-printing tr{break-inside:avoid}

  body.nh7ac540-printing>*:not(#nh7AcademicGroupReportV546){display:none!important}
  body.nh7ac540-printing{background:#fff!important;overflow:visible!important}
  body.nh7ac540-printing #nh7AcademicGroupReportV546{position:static!important;display:block!important;background:#fff!important;padding:0!important;overflow:visible!important}
  body.nh7ac540-printing .nh7ac540-report-dialog{width:100%!important;height:auto!important;max-width:none!important;border-radius:0!important;box-shadow:none!important;overflow:visible!important}
  body.nh7ac540-printing .nh7ac540-report-toolbar{position:static!important;padding:0 0 10px!important;background:#fff!important;border-bottom:1px solid #aaa!important}
  body.nh7ac540-printing .nh7ac540-report-actions,body.nh7ac540-printing .nh7ac540-report-help{display:none!important}
  body.nh7ac540-printing .nh7ac540-report-body{padding:0!important;overflow:visible!important}
  body.nh7ac540-printing .nh7ac540-print-table{min-width:0!important;font-size:9pt!important}
  body.nh7ac540-printing .nh7ac540-print-table th{position:static!important;background:#eee!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
@media(max-width:820px){.nh7ac540-nav{grid-template-columns:repeat(2,minmax(0,1fr))}.nh7ac540-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.nh7ac540-toolbar{grid-template-columns:1fr}.nh7ac540-member-form{grid-template-columns:1fr}.nh7ac540-member{grid-template-columns:1fr}.nh7ac540-member-flags{justify-content:flex-start}}
`;
document.head.appendChild(style);

function install(){
  if(typeof renderStudentsDashboard!=='function'||typeof adminRpc!=='function')return false;
  if(renderStudentsDashboard.__nh7Academic540)return true;
  const old=renderStudentsDashboard;
  const wrapped=function(){return shell(view==='profiles'?old():'')};
  wrapped.__nh7Academic540=true;
  renderStudentsDashboard=window.renderStudentsDashboard=wrapped;
  window.nh7StudentAcademicSetViewV540=setView;
  window.nh7StudentAcademicSetFilterV540=setFilter;
  window.nh7StudentAcademicPageV116=setPage;
  window.NH7AcademicReportRowsV116=()=>rows().map(x=>({...x}));
  window.nh7StudentAcademicOpenReportV540=openReport;
  window.nh7StudentAcademicReloadV540=()=>load(true);
  window.nh7StudentAcademicInactiveDaysV540=setInactiveDays;
  window.nh7StudentAcademicSearchV540=setSearch;
  window.nh7StudentAcademicToggleTestsV540=toggleTests;
  window.nh7StudentAcademicCsvV540=downloadCsv;
  window.nh7StudentAcademicPrintV540=printGroup;
  window.nh7StudentAcademicCloseReportV546=closeGroupReport;
  window.nh7StudentAcademicPrintCurrentV546=groupPdfAction;
  window.nh7StudentAcademicGroupPdfActionV547=groupPdfAction;
  window.nh7StudentAcademicProfileV540=openProfile;
  window.nh7StudentAcademicIndividualReportV540=individualReport;
  window.nh7AddChurchMemberV540=addMember;
  window.nh7DeleteChurchMemberV540=deleteMember;
  window.nh7ImportChurchMembersV540=importMembers;
  window.nh7DownloadChurchMemberTemplateV540=downloadTemplate;
  window.NH7_ADMIN_STUDENT_ACADEMIC_VERSION=VERSION;
  if(!window.__NH7_ACADEMIC_REPORT_ESCAPE_V546__){
    window.__NH7_ACADEMIC_REPORT_ESCAPE_V546__=true;
    document.addEventListener('keydown',event=>{const modal=document.getElementById('nh7AcademicGroupReportV546');if(!modal)return;if(event.key==='Escape')closeGroupReport();if(event.key==='Tab'){const buttons=[...modal.querySelectorAll('button')];const first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}},true);
  }
  if(activeTab==='students'){setTimeout(()=>{load(false);render()},0)}
  return true
}
if(!install()){let n=0;const t=setInterval(()=>{n++;if(install()||n>100)clearInterval(t)},100)}
})();