/* New Hope 7 Admin v5.4.0 — Student Academic Center
   Read-only academic dashboard + lightweight church member registry.
   No background polling and no analytics writes. */
(()=>{'use strict';
if(window.__NH7_ADMIN_STUDENT_ACADEMIC_V540__)return;
window.__NH7_ADMIN_STUDENT_ACADEMIC_V540__=true;
const VERSION='5.4.0-student-academic-center';

let view='overview';
let reportFilter='school_registered';
let searchValue='';
let inactiveDays=30;
let showTests=false;
let data=null;
let loading=false;
let error='';
let loadedAt=0;

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
    member_no_app:[ 'عضو کلیسا بدون حساب اپ','Church member without app account','Član crkve bez računa u aplikaciji'],
    app_no_school:['حساب اپ دارد، مدرسه ثبت‌نام نکرده','App account, school not registered','Ima račun, škola nije registrirana'],
    registered_never_started:['ثبت‌نام کرده، شروع نکرده','Registered, not started','Registriran, nije započeo'],
    needs_revision:['تکلیف نیاز به اصلاح','Assignment needs revision','Zadatak treba doradu'],
    exam_failed:['آزمون رد شده','Exam not passed','Ispit nije položen'],
    completed:['دوره کامل شده','Course completed','Tečaj završen'],
    passed:['قبول شده','Passed','Položeno'],
    inactive:['غیرفعال','Inactive','Neaktivan'],
    in_progress:['در حال تحصیل','In progress','U tijeku'],
    known_user:['کاربر شناخته‌شده','Known user','Poznati korisnik']
  };
  const a=map[String(code||'')]||[code||'—',code||'—',code||'—'];
  return lang==='fa'?a[0]:lang==='hr'?a[2]:a[1]
}
function statusClass(row){
  if(row.revision_assignments>0||row.exam_attempts>0&&row.passed_attempts===0||isStalled(row))return'rejected';
  if(row.passed_attempts>0||isCompleted(row))return'approved';
  if(row.school_registered)return'pending';
  return'';
}
function isCompleted(r){return N(r.total_lessons)>0&&N(r.completed_lessons)>=N(r.total_lessons)&&N(r.passed_attempts)>0}
function isStalled(r){return !!r.school_registered&&!!r.started_school&&!isCompleted(r)&&N(r.days_since_activity,-1)>=inactiveDays}
function matchesFilter(r,key=reportFilter){
  switch(key){
    case'all':return true;
    case'school_registered':return !!r.school_registered;
    case'app_no_school':return !!r.app_account_exists&&!r.school_registered;
    case'registered_never_started':return !!r.school_registered&&!r.started_school;
    case'in_progress':return !!r.school_registered&&!!r.started_school&&!isCompleted(r);
    case'needs_revision':return N(r.revision_assignments)>0;
    case'pending_review':return N(r.pending_assignments)>0;
    case'exam_failed':return N(r.exam_attempts)>0&&N(r.passed_attempts)===0;
    case'passed':return N(r.passed_attempts)>0;
    case'completed':return isCompleted(r);
    case'inactive':return isStalled(r);
    case'member_no_app':return !!r.in_church_roster&&!r.app_account_exists;
    case'roster':return !!r.in_church_roster;
    default:return true;
  }
}
function filteredRows(){
  const q=lower(searchValue);
  return visibleRows().filter(r=>matchesFilter(r)&&(!q||lower([r.display_name,r.email,r.phone].join(' ')).includes(q)))
    .sort((a,b)=>String(a.display_name||a.email).localeCompare(String(b.display_name||b.email),undefined,{sensitivity:'base'}))
}
function counts(){
  const list=visibleRows(),c=k=>list.filter(r=>matchesFilter(r,k)).length;
  return{
    all:list.length,
    school_registered:c('school_registered'),
    app_no_school:c('app_no_school'),
    never_started:c('registered_never_started'),
    in_progress:c('in_progress'),
    needs_revision:c('needs_revision'),
    pending_review:c('pending_review'),
    exam_failed:c('exam_failed'),
    passed:c('passed'),
    completed:c('completed'),
    inactive:c('inactive'),
    member_no_app:c('member_no_app'),
    roster:c('roster')
  }
}
function optionLabel(key){
  const m={
    all:['همه افراد','All identities','Sve osobe'],
    school_registered:['ثبت‌نام‌شده‌های مدرسه','School registered','Registrirani u školi'],
    app_no_school:['حساب اپ بدون ثبت‌نام مدرسه','App account without school registration','Račun bez školske registracije'],
    registered_never_started:['ثبت‌نام کرده ولی شروع نکرده','Registered but not started','Registriran, nije započeo'],
    in_progress:['در حال گذراندن مدرسه','School in progress','Škola u tijeku'],
    needs_revision:['تکلیف نیاز به اصلاح','Assignments need revision','Zadaci trebaju doradu'],
    pending_review:['تکلیف در انتظار بررسی','Assignments pending review','Zadaci čekaju pregled'],
    exam_failed:['آزمون رد شده','Exam not passed','Ispit nije položen'],
    passed:['قبول‌شده‌ها','Passed','Položili'],
    completed:['دوره کامل‌شده','Course completed','Tečaj završen'],
    inactive:['شروع کرده ولی ادامه نداده','Started but inactive','Započeo pa stao'],
    member_no_app:['عضو کلیسا بدون حساب اپ','Church member without app account','Član bez računa u aplikaciji'],
    roster:['همه اعضای ثبت‌شده کلیسا','Church member registry','Popis članova crkve']
  };
  const a=m[key]||[key,key,key];return lang==='fa'?a[0]:lang==='hr'?a[2]:a[1]
}
async function load(force=false){
  if(loading||!token)return;
  if(data&&!force&&Date.now()-loadedAt<60000)return;
  loading=true;error='';
  if(activeTab==='students')render();
  try{
    const raw=await adminRpc('nh7_admin_student_academic_center_v540',{p_inactive_days:inactiveDays});
    data=unwrap(raw)||{};
    loadedAt=Date.now();
  }catch(e){error=e?.message||String(e)}
  finally{loading=false;if(activeTab==='students')render()}
}
function setView(v){view=v;render();if(!data)setTimeout(()=>load(false),0)}
function setFilter(v){reportFilter=v;render()}
function setInactiveDays(v){inactiveDays=Math.max(1,Math.min(365,N(v,30)));data=null;render();setTimeout(()=>load(true),0)}
function setSearch(v){searchValue=String(v||'');render()}
function toggleTests(v){showTests=!!v;render()}

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
  if(error)return'<section class="panel-card"><div class="notice">'+E(error)+'</div><button class="btn secondary" onclick="nh7StudentAcademicReloadV540()">⟳ '+E(L('تلاش دوباره','Retry','Pokušaj ponovno'))+'</button></section>';
  return'<section class="panel-card"><div class="empty">'+E(L('در حال جمع‌آوری گزارش‌های دانشگاهی…','Loading academic reports…','Učitavanje akademskih izvještaja…'))+'</div></section>'
}
function statCard(value,label,filter,alert=false){
  return'<button type="button" class="nh7ac540-stat '+(alert?'alert':'')+'" onclick="nh7StudentAcademicOpenReportV540(\''+filter+'\')"><b>'+E(value)+'</b><span>'+E(label)+'</span></button>'
}
function overview(){
  if(!data)return loadingCard();
  const c=counts();
  return'<section class="panel-card"><div class="req-head"><div><h3>🎓 '+E(L('مرکز مدیریت دانشگاهی','Academic Management Center','Centar akademskog upravljanja'))+'</h3><p class="muted small">'+E(L('گزارش‌ها فقط از داده‌های اصلی مدرسه ساخته می‌شوند؛ هیچ Analytics جدیدی برای این داشبورد ذخیره نمی‌شود.','Reports are built from core school records only; this dashboard creates no new analytics data.','Izvještaji koriste samo osnovne školske podatke; ova nadzorna ploča ne stvara novu analitiku.'))+'</p></div><button class="btn secondary" onclick="nh7StudentAcademicReloadV540()">⟳ '+E(L('به‌روزرسانی','Refresh','Osvježi'))+'</button></div>'+
  '<div class="nh7ac540-stats">'+
    statCard(c.school_registered,L('ثبت‌نام مدرسه','School registered','Registrirani u školi'),'school_registered')+
    statCard(c.app_no_school,L('حساب اپ، بدون مدرسه','App account, no school','Račun bez škole'),'app_no_school',c.app_no_school>0)+
    statCard(c.never_started,L('ثبت‌نام، بدون شروع','Registered, not started','Registrirani, nisu počeli'),'registered_never_started',c.never_started>0)+
    statCard(c.in_progress,L('در حال تحصیل','In progress','U tijeku'),'in_progress')+
    statCard(c.needs_revision,L('نیاز به اصلاح تکلیف','Needs revision','Treba doradu'),'needs_revision',c.needs_revision>0)+
    statCard(c.exam_failed,L('قبول‌نشده در آزمون','Exam not passed','Ispit nije položen'),'exam_failed',c.exam_failed>0)+
    statCard(c.passed,L('قبول‌شده','Passed','Položili'),'passed')+
    statCard(c.inactive,L('شروع کرده، متوقف شده','Started, inactive','Započeo, neaktivan'),'inactive',c.inactive>0)+
  '</div>'+
  '<div class="nh7ac540-note"><strong>'+E(L('وضعیت نصب اپ','App installation status','Status instalacije aplikacije'))+':</strong> '+E(L('برای حفظ هزینه و حریم خصوصی، Tracking جدید نصب/حذف اپ اضافه نشده است. «حساب اپ دارد» یعنی حساب شناخته‌شده در سیستم دارد. برای تشخیص اعضایی که هیچ حسابی ندارند، از فهرست اعضای کلیسا استفاده می‌کنیم.','To keep cost and tracking low, no new install/uninstall tracking is added. “App account” means a known account exists. The church-member registry is used to identify members with no known app account.','Radi nižih troškova ne dodajemo praćenje instalacije/deinstalacije. “Račun u aplikaciji” znači da postoji poznati račun. Popis članova služi za pronalazak članova bez poznatog računa.'))+'</div>'+
  '<div class="nh7ac540-actions"><button class="btn primary" onclick="nh7StudentAcademicOpenReportV540(\'needs_revision\')">📝 '+E(L('پیگیری تکالیف نیازمند اصلاح','Follow up revisions','Prati zadatke za doradu'))+'</button><button class="btn secondary" onclick="nh7StudentAcademicOpenReportV540(\'app_no_school\')">📱 '+E(L('حساب‌های بدون ثبت‌نام مدرسه','Accounts without school registration','Računi bez školske registracije'))+'</button><button class="btn secondary" onclick="nh7StudentAcademicSetViewV540(\'members\')">⛪ '+E(L('مدیریت فهرست اعضا','Manage member registry','Upravljaj članovima'))+'</button></div></section>'
}
function filterOptions(){
  const keys=['school_registered','app_no_school','registered_never_started','in_progress','needs_revision','pending_review','exam_failed','passed','completed','inactive','member_no_app','all'];
  return keys.map(k=>'<option value="'+k+'" '+(reportFilter===k?'selected':'')+'>'+E(optionLabel(k))+'</option>').join('')
}
function reportTable(){
  const list=filteredRows();
  const body=list.map(r=>'<tr>'+
    '<td><strong>'+E(r.display_name||r.email)+'</strong><br><small>'+E(r.email||'—')+'</small></td>'+
    '<td>'+E(r.school_registered?L('ثبت‌نام شده','Registered','Registriran'):L('ثبت‌نام نشده','Not registered','Nije registriran'))+'<br><small>'+E(fmtDate(r.registered_at))+'</small></td>'+
    '<td>'+E(N(r.completed_lessons))+'/'+E(N(r.total_lessons))+'<br><small>'+E(N(r.progress_percent))+'%</small></td>'+
    '<td>'+E(N(r.revision_assignments))+' / '+E(N(r.pending_assignments))+'<br><small>'+E(L('اصلاح / بررسی','revision / review','dorada / pregled'))+'</small></td>'+
    '<td>'+E(N(r.best_final_score,0))+'%<br><small>'+E(N(r.exam_attempts))+' '+E(L('تلاش','attempts','pokušaja'))+'</small></td>'+
    '<td>'+E(fmtDate(r.last_school_activity))+(r.days_since_activity!=null?'<br><small>'+E(r.days_since_activity)+' '+E(L('روز قبل','days ago','dana'))+'</small>':'')+'</td>'+
    '<td><span class="pill '+statusClass(r)+'">'+E(statusLabel(r.status_code))+'</span></td>'+
    '<td><div class="nh7ac540-row-actions">'+(r.school_registered?'<button class="btn ghost" onclick="nh7StudentAcademicProfileV540(\''+encodeURIComponent(r.email)+'\')">'+E(L('پرونده','Profile','Profil'))+'</button><button class="btn ghost" onclick="nh7StudentAcademicIndividualReportV540(\''+encodeURIComponent(r.email)+'\')">PDF</button>':'')+'</div></td>'+
  '</tr>').join('');
  return'<div class="nh7ac540-table-wrap"><table class="nh7ac540-table"><thead><tr>'+
    '<th>'+E(L('دانشجو','Student','Student'))+'</th><th>'+E(L('ثبت‌نام','Registration','Registracija'))+'</th><th>'+E(L('درس‌ها','Lessons','Lekcije'))+'</th><th>'+E(L('تکالیف','Assignments','Zadaci'))+'</th><th>'+E(L('آزمون','Exam','Ispit'))+'</th><th>'+E(L('آخرین فعالیت','Last activity','Zadnja aktivnost'))+'</th><th>'+E(L('وضعیت','Status','Status'))+'</th><th></th>'+
  '</tr></thead><tbody>'+body+'</tbody></table></div>'+
  (!list.length?'<div class="empty">'+E(L('موردی با این فیلتر پیدا نشد.','No records match this filter.','Nema zapisa za ovaj filtar.'))+'</div>':'')
}
function reports(){
  if(!data)return loadingCard();
  const list=filteredRows();
  return'<section class="panel-card"><div class="req-head"><div><h3>📋 '+E(L('گزارش‌های گروهی دانشجویان','Student Group Reports','Grupni izvještaji studenata'))+'</h3><p class="muted small">'+E(L('گروه را انتخاب کن، سپس همان لیست را CSV بگیر یا برای PDF/چاپ باز کن.','Choose a group, then export the same list as CSV or open a printable/PDF report.','Odaberite grupu, zatim izvezite CSV ili otvorite izvještaj za PDF/ispis.'))+'</p></div><span class="pill">'+E(list.length)+' '+E(L('نفر','people','osoba'))+'</span></div>'+
  '<div class="nh7ac540-toolbar"><select onchange="nh7StudentAcademicSetFilterV540(this.value)">'+filterOptions()+'</select><input type="search" placeholder="'+E(L('جستجوی نام یا ایمیل…','Search name or email…','Pretraži ime ili e-mail…'))+'" value="'+E(searchValue)+'" oninput="nh7StudentAcademicSearchV540(this.value)"><select onchange="nh7StudentAcademicInactiveDaysV540(this.value)"><option value="7" '+(inactiveDays===7?'selected':'')+'>7 '+E(L('روز','days','dana'))+'</option><option value="14" '+(inactiveDays===14?'selected':'')+'>14 '+E(L('روز','days','dana'))+'</option><option value="30" '+(inactiveDays===30?'selected':'')+'>30 '+E(L('روز','days','dana'))+'</option><option value="60" '+(inactiveDays===60?'selected':'')+'>60 '+E(L('روز','days','dana'))+'</option><option value="90" '+(inactiveDays===90?'selected':'')+'>90 '+E(L('روز','days','dana'))+'</option></select></div>'+
  '<div class="nh7ac540-actions"><button class="btn primary" onclick="nh7StudentAcademicCsvV540()">⬇ CSV</button><button class="btn secondary" onclick="nh7StudentAcademicPrintV540()">📄 PDF / '+E(L('چاپ','Print','Ispis'))+'</button><label class="nh7ac540-check"><input type="checkbox" '+(showTests?'checked':'')+' onchange="nh7StudentAcademicToggleTestsV540(this.checked)"> '+E(L('نمایش حساب‌های تست','Show test accounts','Prikaži test račune'))+'</label></div>'+
  reportTable()+'</section>'
}
function memberRows(){
  return visibleRows().filter(r=>r.in_church_roster).sort((a,b)=>String(a.display_name||a.email).localeCompare(String(b.display_name||b.email)))
}
function members(){
  if(!data)return loadingCard();
  const list=memberRows(),noApp=list.filter(r=>!r.app_account_exists).length,noSchool=list.filter(r=>r.app_account_exists&&!r.school_registered).length;
  const cards=list.map(r=>'<article class="nh7ac540-member"><div><strong>'+E(r.display_name||r.email)+'</strong><small>'+E(r.email||'—')+(r.phone?' · '+E(r.phone):'')+'</small></div><div class="nh7ac540-member-flags"><span class="pill '+(r.app_account_exists?'approved':'rejected')+'">'+E(r.app_account_exists?L('حساب اپ دارد','App account','Račun postoji'):L('بدون حساب اپ','No app account','Nema računa'))+'</span><span class="pill '+(r.school_registered?'approved':'pending')+'">'+E(r.school_registered?L('مدرسه ثبت‌نام شده','School registered','Škola registrirana'):L('مدرسه ثبت‌نام نشده','School not registered','Škola nije registrirana'))+'</span></div><button class="btn danger-btn" onclick="nh7DeleteChurchMemberV540(\''+E(r.member_id)+'\')">🗑</button></article>').join('');
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

function csvEscape(v){const s=String(v??'');return /[",\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
function csvRows(){
  const header=[
    L('نام','Name','Ime'),L('ایمیل','Email','E-mail'),L('حساب اپ','App account','Račun'),
    L('ثبت‌نام مدرسه','School registered','Registracija škole'),L('درس تکمیل','Completed lessons','Završene lekcije'),
    L('درس باقی‌مانده','Remaining lessons','Preostale lekcije'),L('پیشرفت %','Progress %','Napredak %'),
    L('تکلیف نیاز اصلاح','Needs revision','Treba doradu'),L('تکلیف در انتظار','Pending review','Čeka pregled'),
    L('تلاش آزمون','Exam attempts','Pokušaji ispita'),L('بهترین نمره','Best score','Najbolji rezultat'),
    L('آخرین فعالیت','Last activity','Zadnja aktivnost'),L('وضعیت','Status','Status')
  ];
  const body=filteredRows().map(r=>[
    r.display_name,r.email,r.app_account_exists?'yes':'no',r.school_registered?'yes':'no',
    r.completed_lessons,r.remaining_lessons,r.progress_percent,r.revision_assignments,r.pending_assignments,
    r.exam_attempts,r.best_final_score??'',r.last_school_activity||'',statusLabel(r.status_code)
  ]);
  return[header,...body]
}
function downloadCsv(){
  const text='\uFEFF'+csvRows().map(row=>row.map(csvEscape).join(',')).join('\r\n');
  const blob=new Blob([text],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='New-Hope-7-'+String(reportFilter||'students')+'-'+new Date().toISOString().slice(0,10)+'.csv';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)
}
function printGroup(){
  const list=filteredRows(),w=window.open('','_blank');
  if(!w){alert(L('پنجره گزارش باز نشد.','Report window could not open.','Prozor izvještaja se nije otvorio.'));return}
  const tr=list.map(r=>'<tr><td>'+E(r.display_name||r.email)+'<br><small>'+E(r.email)+'</small></td><td>'+E(r.completed_lessons)+'/'+E(r.total_lessons)+'</td><td>'+E(r.revision_assignments)+'</td><td>'+E(r.exam_attempts)+'</td><td>'+E(r.best_final_score??'—')+'%</td><td>'+E(fmtDate(r.last_school_activity))+'</td><td>'+E(statusLabel(r.status_code))+'</td></tr>').join('');
  w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>New Hope 7</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#102033}h1{margin:0 0 6px}p{color:#667085}table{width:100%;border-collapse:collapse;margin-top:18px;font-size:12px}th,td{border:1px solid #d7e3e3;padding:7px;text-align:start;vertical-align:top}th{background:#eef8f7}@media print{body{padding:0}}</style></head><body dir="'+(lang==='fa'?'rtl':'ltr')+'"><h1>New Hope 7 · '+E(optionLabel(reportFilter))+'</h1><p>'+E(L('تاریخ گزارش','Report date','Datum izvještaja'))+': '+E(fmtDateTime(new Date()))+' · '+E(list.length)+' '+E(L('نفر','people','osoba'))+'</p><table><thead><tr><th>'+E(L('دانشجو','Student','Student'))+'</th><th>'+E(L('درس‌ها','Lessons','Lekcije'))+'</th><th>'+E(L('اصلاح','Revision','Dorada'))+'</th><th>'+E(L('آزمون‌ها','Exams','Ispiti'))+'</th><th>'+E(L('نمره','Score','Rezultat'))+'</th><th>'+E(L('آخرین فعالیت','Last activity','Zadnja aktivnost'))+'</th><th>'+E(L('وضعیت','Status','Status'))+'</th></tr></thead><tbody>'+tr+'</tbody></table><script>setTimeout(()=>window.print(),250)<\/script></body></html>');w.document.close()
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
    if(select){select.value=email;window.nh7GenerateStudentReportV496?.()}
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
.nh7ac540-shell{padding-bottom:10px}.nh7ac540-nav{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.nh7ac540-nav button{border:1px solid var(--line,#d8ecea);background:#f8fbfb;color:#17324d;border-radius:14px;padding:11px 8px;font-weight:800}.nh7ac540-nav button.active{background:#0f766e;color:white;border-color:#0f766e}
.nh7ac540-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:14px 0}.nh7ac540-stat{border:1px solid #d8ecea;background:#fff;border-radius:16px;padding:13px;text-align:start;min-height:88px}.nh7ac540-stat b{display:block;font-size:1.55rem;color:#102033}.nh7ac540-stat span{display:block;margin-top:4px;color:#667085;font-size:.82rem;line-height:1.45}.nh7ac540-stat.alert{border-color:#f3c7c2;background:#fff8f7}.nh7ac540-stat.alert b{color:#b42318}
.nh7ac540-note{padding:11px 13px;border-radius:14px;background:#eff8ff;color:#175cd3;line-height:1.7;margin:10px 0}.nh7ac540-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.nh7ac540-toolbar{display:grid;grid-template-columns:minmax(180px,1fr) minmax(200px,1.4fr) minmax(110px,.5fr);gap:8px;margin:12px 0}.nh7ac540-check{display:flex;align-items:center;gap:6px;padding:8px 10px}
.nh7ac540-table-wrap{overflow:auto;-webkit-overflow-scrolling:touch;border:1px solid #d8ecea;border-radius:14px;margin-top:12px}.nh7ac540-table{width:100%;min-width:980px;border-collapse:collapse;font-size:.82rem}.nh7ac540-table th,.nh7ac540-table td{padding:9px;border-bottom:1px solid #e7efef;text-align:start;vertical-align:top}.nh7ac540-table th{background:#f3faf9;position:sticky;top:0;z-index:1}.nh7ac540-row-actions{display:flex;gap:5px;flex-wrap:wrap}.nh7ac540-row-actions .btn{padding:7px 8px;margin:0;min-width:0}
.nh7ac540-member-form{display:grid;grid-template-columns:1.2fr 1.2fr 1fr auto;gap:8px;margin:12px 0}.nh7ac540-import{margin:10px 0}.nh7ac540-member-list{display:grid;gap:8px}.nh7ac540-member{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:10px;align-items:center;border:1px solid #d8ecea;border-radius:14px;padding:11px;background:#fff}.nh7ac540-member strong,.nh7ac540-member small{display:block}.nh7ac540-member small{margin-top:3px;color:#667085}.nh7ac540-member-flags{display:flex;gap:5px;flex-wrap:wrap}
@media(max-width:820px){.nh7ac540-nav{grid-template-columns:repeat(2,minmax(0,1fr))}.nh7ac540-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.nh7ac540-toolbar{grid-template-columns:1fr}.nh7ac540-member-form{grid-template-columns:1fr}.nh7ac540-member{grid-template-columns:1fr}.nh7ac540-member-flags{justify-content:flex-start}}
`;
document.head.appendChild(style);

function install(){
  if(typeof renderStudentsDashboard!=='function'||typeof adminRpc!=='function')return false;
  if(renderStudentsDashboard.__nh7Academic540)return true;
  const old=renderStudentsDashboard;
  const wrapped=function(){return shell(old())};
  wrapped.__nh7Academic540=true;
  renderStudentsDashboard=window.renderStudentsDashboard=wrapped;
  window.nh7StudentAcademicSetViewV540=setView;
  window.nh7StudentAcademicSetFilterV540=setFilter;
  window.nh7StudentAcademicOpenReportV540=openReport;
  window.nh7StudentAcademicReloadV540=()=>load(true);
  window.nh7StudentAcademicInactiveDaysV540=setInactiveDays;
  window.nh7StudentAcademicSearchV540=setSearch;
  window.nh7StudentAcademicToggleTestsV540=toggleTests;
  window.nh7StudentAcademicCsvV540=downloadCsv;
  window.nh7StudentAcademicPrintV540=printGroup;
  window.nh7StudentAcademicProfileV540=openProfile;
  window.nh7StudentAcademicIndividualReportV540=individualReport;
  window.nh7AddChurchMemberV540=addMember;
  window.nh7DeleteChurchMemberV540=deleteMember;
  window.nh7ImportChurchMembersV540=importMembers;
  window.nh7DownloadChurchMemberTemplateV540=downloadTemplate;
  window.NH7_ADMIN_STUDENT_ACADEMIC_VERSION=VERSION;
  if(activeTab==='students'){setTimeout(()=>{load(false);render()},0)}
  return true
}
if(!install()){let n=0;const t=setInterval(()=>{n++;if(install()||n>100)clearInterval(t)},100)}
})();