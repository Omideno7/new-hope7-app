/* New Hope 7 Admin v4.7.4 — manual review-queue refresh.
 * Refreshes only registrations, unanswered Q&A and school assignments.
 * No background database polling.
 */
(()=>{'use strict';
if(window.__NH7_ADMIN_REVIEW_REFRESH_V474__)return;
window.__NH7_ADMIN_REVIEW_REFRESH_V474__=true;

const VERSION='4.7.4-manual-review-refresh';
let refreshing=false,decorateTimer=0;

function L(fa,en,hr){
  try{return typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en}
  catch(_){return en}
}
function E(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function reviewCounts(){
  try{
    const pending=Array.isArray(state?.registrations)?state.registrations.filter(r=>typeof isEffectivePending==='function'?isEffectivePending(r):String(r?.status||'pending').toLowerCase()==='pending').length:0;
    const questions=Array.isArray(state?.questions)?state.questions.filter(q=>!['answered','archived'].includes(String(q?.status||'new').toLowerCase())).length:0;
    const assignments=Array.isArray(state?.schoolAssignments)?state.schoolAssignments.filter(a=>String(a?.status||'submitted').toLowerCase()==='submitted').length:0;
    return {pending,questions,assignments,total:pending+questions+assignments};
  }catch(_){return{pending:0,questions:0,assignments:0,total:0}}
}
function restoreScroll(y){requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo({top:Math.max(0,Number(y)||0),left:0,behavior:'auto'})))}
function setBusy(on){
  document.querySelectorAll('[data-nh7-review-refresh-v474]').forEach(b=>{
    b.disabled=!!on;
    b.dataset.busy=on?'1':'0';
    const label=b.querySelector('[data-nh7-review-label-v474]');
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
  try{
    if(typeof token==='undefined'||!token||typeof authFetch!=='function')return;
  }catch(_){return}
  refreshing=true;setBusy(true);
  const y=window.scrollY,before=reviewCounts();
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
    if(errors.length)console.warn('[NH7 review refresh]',errors);
    try{lastLoadedAt=new Date().toISOString()}catch(_){}
    try{if(typeof notifyIfNew==='function')notifyIfNew()}catch(_){}
    const after=reviewCounts(),newCount=Math.max(0,after.total-before.total);
    try{
      if(typeof render==='function')render(false);
      restoreScroll(y);
    }catch(_){}
    setTimeout(decorate,40);
    const msg=errors.length
      ?L('بررسی انجام شد، اما یک بخش خطا داشت. دوباره تلاش کنید.','Check completed, but one section had an error. Try again.','Provjera je završena, ali jedan dio ima pogrešku.')
      :(newCount>0
        ?L(`${newCount} مورد تازه پیدا شد. ${summaryText(after)}`,`${newCount} new item(s) found. ${summaryText(after)}`,`Pronađeno novih stavki: ${newCount}. ${summaryText(after)}`)
        :L(`مورد تازه‌ای نیست. ${summaryText(after)}`,`No new review items. ${summaryText(after)}`,`Nema novih stavki. ${summaryText(after)}`));
    try{if(typeof setMessage==='function')setMessage(msg,errors.length?'danger':'success')}catch(_){}
  }catch(error){
    console.warn('[NH7 review refresh]',error);
    try{if(typeof setMessage==='function')setMessage(error?.message||String(error),'danger')}catch(_){}
  }finally{refreshing=false;setBusy(false)}
}
function style(){
  if(document.getElementById('nh7ReviewRefreshV474Style'))return;
  const s=document.createElement('style');s.id='nh7ReviewRefreshV474Style';
  s.textContent=`
    .nh7-review-refresh-v474{display:inline-flex;align-items:center;gap:7px}
    .nh7-review-refresh-v474[data-busy="1"]{opacity:.65;cursor:wait}
    .nh7-review-hint-v474{margin:8px 0 0;padding:9px 11px;border:1px solid #d8ecea;border-radius:13px;background:#f8fcfc;color:#5b6877;font-size:.78rem;line-height:1.6}
    .nh7-review-strip-v474{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;margin:10px 0 14px;padding:12px;border:1px solid #cfe7e3;border-radius:16px;background:linear-gradient(135deg,#f8fcfc,#f6fbff)}
    .nh7-review-strip-v474 strong{display:block}.nh7-review-strip-v474 small{display:block;margin-top:3px;color:#667085;line-height:1.5}
    @media(max-width:620px){.nh7-review-strip-v474{grid-template-columns:1fr}.nh7-review-strip-v474 .btn{width:100%}}
  `;
  document.head.appendChild(s);
}
function buttonHtml(compact=false){
  return `<button type="button" class="btn secondary nh7-review-refresh-v474${compact?' compact':''}" data-nh7-review-refresh-v474><span aria-hidden="true">🔎</span><span data-nh7-review-label-v474>${E(L('بررسی موارد جدید','Check new items','Provjeri nove stavke'))}</span></button>`;
}
function decorate(){
  style();
  document.querySelectorAll('[data-nh7-review-refresh-v474]').forEach(b=>{if(!b.dataset.boundV474){b.dataset.boundV474='1';b.addEventListener('click',refreshReviewQueues)}});
  const top=document.querySelector('.top-actions');
  if(top&&!top.querySelector('[data-nh7-review-refresh-v474]')){
    const wrap=document.createElement('span');wrap.innerHTML=buttonHtml(true);top.prepend(wrap.firstElementChild);
  }
  const app=document.getElementById('adminApp');
  if(!app)return;
  const reviewTab=['overview','requests','qa','assignments'].includes(typeof activeTab!=='undefined'?String(activeTab):'');
  if(reviewTab&&!app.querySelector('.nh7-review-strip-v474')){
    const host=[...app.querySelectorAll('.panel-card')].find(x=>x.querySelector('h3'))||app.querySelector('.panel-card');
    if(host){
      const c=reviewCounts(),box=document.createElement('div');box.className='nh7-review-strip-v474';
      box.innerHTML=`<div><strong>${E(L('صف بررسی ادمین','Admin review queue','Red za pregled'))}</strong><small>${E(summaryText(c))} · ${E(L('به‌روزرسانی فقط با دکمه انجام می‌شود؛ Poll خودکار غیرفعال است.','Updates run only when you tap the button; background polling is off.','Ažuriranje se pokreće samo pritiskom na gumb; automatsko osvježavanje je isključeno.'))}</small></div>${buttonHtml()}`;
      host.prepend(box);
      box.querySelector('[data-nh7-review-refresh-v474]')?.addEventListener('click',refreshReviewQueues);
    }
  }
}
const observer=new MutationObserver(()=>{clearTimeout(decorateTimer);decorateTimer=setTimeout(decorate,60)});
observer.observe(document.documentElement,{childList:true,subtree:true});
['pageshow','focus'].forEach(ev=>window.addEventListener(ev,()=>setTimeout(decorate,50)));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(decorate,80),{once:true});else setTimeout(decorate,80);
window.nh7AdminReviewRefreshV474=refreshReviewQueues;
window.NH7_ADMIN_REVIEW_REFRESH_VERSION=VERSION;
})();
