/* New Hope 7 Admin v4.7.5 — stable manual review refresh.
 * The button/strip are rendered by admin.html itself; this module only performs the targeted refresh.
 * No MutationObserver, delayed DOM injection or manual scroll restoration.
 */
(()=>{'use strict';
if(window.__NH7_ADMIN_REVIEW_REFRESH_V475__)return;
window.__NH7_ADMIN_REVIEW_REFRESH_V475__=true;

const VERSION='4.7.5-stable-review-refresh';
let refreshing=false;

function L(fa,en,hr){
  try{return typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en}
  catch(_){return en}
}
function reviewCounts(){
  try{
    const pending=Array.isArray(state?.registrations)?state.registrations.filter(r=>typeof isEffectivePending==='function'?isEffectivePending(r):String(r?.status||'pending').toLowerCase()==='pending').length:0;
    const questions=Array.isArray(state?.questions)?state.questions.filter(q=>!['answered','archived'].includes(String(q?.status||'new').toLowerCase())).length:0;
    const assignments=Array.isArray(state?.schoolAssignments)?state.schoolAssignments.filter(a=>String(a?.status||'submitted').toLowerCase()==='submitted').length:0;
    return {pending,questions,assignments,total:pending+questions+assignments};
  }catch(_){return{pending:0,questions:0,assignments:0,total:0}}
}
function setBusy(on){
  document.querySelectorAll('[data-nh7-review-refresh-v475]').forEach(b=>{
    b.disabled=!!on;
    b.dataset.busy=on?'1':'0';
    const label=b.querySelector('[data-nh7-review-label-v475]');
    if(label)label.textContent=on?L('در حال بررسی…','Checking…','Provjera…'):L('بررسی موارد جدید','Check new items','Provjeri nove stavke');
  });
}
function summaryText(c){
  return L(
    `درخواست‌ها: ${c.pending} · پرسش‌ها: ${c.questions} · تکالیف: ${c.assignments}`,
    `Requests: ${c.pending} · Q&A: ${c.questions} · Assignments: ${c.assignments}`,
    `Zahtjevi: ${c.pending} · Pitanja: ${c.questions} · Zadaci: ${c.assignments}`
  );
}
async function refreshReviewQueues(){
  if(refreshing)return;
  try{if(typeof token==='undefined'||!token||typeof authFetch!=='function')return}catch(_){return}
  refreshing=true;setBusy(true);
  const before=reviewCounts();
  try{if(typeof setMessage==='function')setMessage(L('در حال بررسی موارد جدید…','Checking new review items…','Provjera novih stavki…'))}catch(_){}
  try{
    const results=await Promise.allSettled([
      typeof loadRegistrationFeed==='function'?loadRegistrationFeed():authFetch('/rest/v1/registrations?select=*&order=created_at.desc&limit=2000'),
      authFetch('/rest/v1/qa_questions?select=*&order=created_at.desc&limit=500'),
      typeof loadSchoolAssignmentsFeed==='function'?loadSchoolAssignmentsFeed():authFetch('/rest/v1/school_assignments?select=*&order=updated_at.desc&limit=2000')
    ]);
    const [registrations,questions,assignments]=results;
    if(registrations.status==='fulfilled'&&Array.isArray(registrations.value))state.registrations=registrations.value;
    if(questions.status==='fulfilled'&&Array.isArray(questions.value))state.questions=questions.value;
    if(assignments.status==='fulfilled'&&Array.isArray(assignments.value)){
      state.schoolAssignments=assignments.value;
      state.schoolAssignmentsError='';
    }else if(assignments.status==='rejected'){
      state.schoolAssignmentsError=String(assignments.reason?.message||assignments.reason||'');
    }
    const errors=results.filter(x=>x.status==='rejected').map(x=>String(x.reason?.message||x.reason||''));
    if(errors.length)console.warn('[NH7 review refresh v475]',errors);
    try{lastLoadedAt=new Date().toISOString()}catch(_){}
    try{if(typeof notifyIfNew==='function')notifyIfNew()}catch(_){}
    if(typeof render==='function')render(false);
    const after=reviewCounts(),newCount=Math.max(0,after.total-before.total);
    const msg=errors.length
      ?L('بررسی انجام شد، اما یک بخش خطا داشت. دوباره تلاش کنید.','Check completed, but one section had an error. Try again.','Provjera je završena, ali jedan dio ima pogrešku.')
      :(newCount>0
        ?L(`${newCount} مورد تازه پیدا شد. ${summaryText(after)}`,`${newCount} new item(s) found. ${summaryText(after)}`,`Pronađeno novih stavki: ${newCount}. ${summaryText(after)}`)
        :L(`مورد تازه‌ای نیست. ${summaryText(after)}`,`No new review items. ${summaryText(after)}`,`Nema novih stavki. ${summaryText(after)}`));
    try{if(typeof setMessage==='function')setMessage(msg,errors.length?'danger':'success')}catch(_){}
  }catch(error){
    console.warn('[NH7 review refresh v475]',error);
    try{if(typeof setMessage==='function')setMessage(error?.message||String(error),'danger')}catch(_){}
  }finally{
    refreshing=false;
    setBusy(false);
  }
}
window.nh7AdminReviewRefreshV475=refreshReviewQueues;
window.NH7_ADMIN_REVIEW_REFRESH_VERSION=VERSION;
})();