/* New Hope 7 Admin v4.7.6 — review queue + Blessings moderation.
 * Manual refresh only: registrations, unanswered Q&A, submitted assignments, sermon blessings.
 * Blessings use the existing v440 admin/delete RPCs; no schema changes.
 */
(()=>{'use strict';
if(window.__NH7_ADMIN_REVIEW_BLESSINGS_V476__)return;
window.__NH7_ADMIN_REVIEW_BLESSINGS_V476__=true;

const VERSION='4.7.6-admin-review-blessings';
const SEEN_KEY='nh7_admin_blessings_seen_v476';
const store={items:[],loaded:false,loading:false};
let refreshing=false;

function L(fa,en,hr){
  try{return typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en}
  catch(_){return en}
}
function E(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function ts(v){const n=Date.parse(String(v||''));return Number.isFinite(n)?n:0}
function seenTs(){try{return ts(localStorage.getItem(SEEN_KEY)||'')}catch(_){return 0}}
function isNew(x){const seen=seenTs();return ts(x?.created_at)>seen}
function newCount(){return store.items.filter(isNew).length}
function totalCount(){return store.items.length}
function sermonCount(){return new Set(store.items.map(x=>String(x?.sermon_id||'')).filter(Boolean)).size}
function fmt(v){try{return new Date(v).toLocaleString(typeof lang!=='undefined'&&lang==='fa'?'fa-IR':typeof lang!=='undefined'&&lang==='hr'?'hr-HR':'en-US')}catch(_){return String(v||'')}}
function reviewCounts(){
  try{
    const pending=Array.isArray(state?.registrations)?state.registrations.filter(r=>typeof isEffectivePending==='function'?isEffectivePending(r):String(r?.status||'pending').toLowerCase()==='pending').length:0;
    const questions=Array.isArray(state?.questions)?state.questions.filter(q=>!['answered','archived'].includes(String(q?.status||'new').toLowerCase())).length:0;
    const assignments=Array.isArray(state?.schoolAssignments)?state.schoolAssignments.filter(a=>String(a?.status||'submitted').toLowerCase()==='submitted').length:0;
    const blessings=newCount();
    return {pending,questions,assignments,blessings,total:pending+questions+assignments+blessings};
  }catch(_){return{pending:0,questions:0,assignments:0,blessings:newCount(),total:newCount()}}
}
function sig(list){return (Array.isArray(list)?list:[]).map(x=>[x?.id,x?.status,x?.updated_at,x?.submitted_at,x?.answered_at,x?.created_at].join('|')).join(',')}
function setBusy(on){
  document.querySelectorAll('[data-nh7-review-refresh-v476]').forEach(b=>{
    b.disabled=!!on;b.dataset.busy=on?'1':'0';b.setAttribute('aria-busy',on?'true':'false');
    const icon=b.querySelector('[data-nh7-review-icon-v476]');if(icon)icon.textContent=on?'⏳':'🔎';
  });
}
function summaryText(c){
  return L(
    `درخواست‌ها: ${c.pending} · پرسش‌ها: ${c.questions} · تکالیف: ${c.assignments} · برکت‌های تازه: ${c.blessings}`,
    `Requests: ${c.pending} · Q&A: ${c.questions} · Assignments: ${c.assignments} · New blessings: ${c.blessings}`,
    `Zahtjevi: ${c.pending} · Pitanja: ${c.questions} · Zadaci: ${c.assignments} · Novi blagoslovi: ${c.blessings}`
  );
}
async function fetchBlessings(){
  store.loading=true;
  try{
    const r=await adminRpc('nh7_admin_sermon_blessings_v440',{p_limit:300});
    store.items=Array.isArray(r?.items)?r.items:[];
    store.loaded=true;
    return store.items;
  }finally{store.loading=false}
}
async function refreshReviewQueues(){
  if(refreshing)return;
  try{if(typeof token==='undefined'||!token||typeof authFetch!=='function'||typeof adminRpc!=='function')return}catch(_){return}
  refreshing=true;setBusy(true);
  const before=reviewCounts();
  const beforeSig=[sig(state?.registrations),sig(state?.questions),sig(state?.schoolAssignments),sig(store.items)].join('||');
  try{if(typeof setMessage==='function')setMessage(L('در حال بررسی موارد جدید…','Checking new review items…','Provjera novih stavki…'))}catch(_){}
  try{
    const results=await Promise.allSettled([
      typeof loadRegistrationFeed==='function'?loadRegistrationFeed():authFetch('/rest/v1/registrations?select=*&order=created_at.desc&limit=2000'),
      authFetch('/rest/v1/qa_questions?select=*&order=created_at.desc&limit=500'),
      typeof loadSchoolAssignmentsFeed==='function'?loadSchoolAssignmentsFeed():authFetch('/rest/v1/school_assignments?select=*&order=updated_at.desc&limit=2000'),
      fetchBlessings()
    ]);
    const [registrations,questions,assignments]=results;
    if(registrations.status==='fulfilled'&&Array.isArray(registrations.value))state.registrations=registrations.value;
    if(questions.status==='fulfilled'&&Array.isArray(questions.value))state.questions=questions.value;
    if(assignments.status==='fulfilled'&&Array.isArray(assignments.value)){state.schoolAssignments=assignments.value;state.schoolAssignmentsError=''}
    else if(assignments.status==='rejected')state.schoolAssignmentsError=String(assignments.reason?.message||assignments.reason||'');
    const errors=results.filter(x=>x.status==='rejected').map(x=>String(x.reason?.message||x.reason||''));
    if(errors.length)console.warn('[NH7 review/blessings v476]',errors);
    try{lastLoadedAt=new Date().toISOString()}catch(_){}
    try{if(typeof notifyIfNew==='function')notifyIfNew()}catch(_){}
    const afterSig=[sig(state?.registrations),sig(state?.questions),sig(state?.schoolAssignments),sig(store.items)].join('||');
    if(beforeSig!==afterSig&&typeof render==='function')render(false);
    const after=reviewCounts(),newItems=Math.max(0,after.total-before.total);
    const msg=errors.length
      ?L('بررسی انجام شد، اما یک بخش خطا داشت. دوباره تلاش کنید.','Check completed, but one section had an error. Try again.','Provjera je završena, ali jedan dio ima pogrešku.')
      :(newItems>0
        ?L(`${newItems} مورد تازه پیدا شد. ${summaryText(after)}`,`${newItems} new item(s) found. ${summaryText(after)}`,`Pronađeno novih stavki: ${newItems}. ${summaryText(after)}`)
        :L(`مورد تازه‌ای نیست. ${summaryText(after)}`,`No new review items. ${summaryText(after)}`,`Nema novih stavki. ${summaryText(after)}`));
    try{if(typeof setMessage==='function')setMessage(msg,errors.length?'danger':'success')}catch(_){}
  }catch(error){
    console.warn('[NH7 review/blessings v476]',error);
    try{if(typeof setMessage==='function')setMessage(error?.message||String(error),'danger')}catch(_){}
  }finally{refreshing=false;setBusy(false)}
}
function markSeen(){
  try{localStorage.setItem(SEEN_KEY,new Date().toISOString())}catch(_){}
  if(typeof render==='function')render(false);
}
async function removeBlessing(id){
  if(!id||!confirm(L('این برکت از نمایش عمومی حذف شود؟','Hide this blessing from public view?','Sakriti ovaj blagoslov iz javnog prikaza?')))return;
  try{
    await adminRpc('nh7_sermon_delete_blessing_v440',{p_id:String(id)});
    store.items=store.items.filter(x=>String(x.id)!==String(id));
    if(typeof setMessage==='function')setMessage(L('برکت از نمایش عمومی حذف شد.','Blessing was hidden from public view.','Blagoslov je skriven iz javnog prikaza.'),'success');
    if(typeof render==='function')render(false);
  }catch(e){alert(e?.message||String(e))}
}
function filterDom(){
  const root=document.querySelector('[data-nh7-blessings-panel-v476]');if(!root)return;
  const q=String(root.querySelector('[data-blessing-search-v476]')?.value||'').trim().toLowerCase();
  const mode=String(root.querySelector('[data-blessing-filter-v476]')?.value||'all');
  root.querySelectorAll('[data-blessing-row-v476]').forEach(row=>{
    const hit=!q||String(row.dataset.search||'').includes(q);
    const modeHit=mode!=='new'||row.dataset.new==='1';
    row.hidden=!(hit&&modeHit);
  });
}
function renderBlessings(){
  const total=totalCount(),fresh=newCount(),sermons=sermonCount();
  const loaded=store.loaded;
  const rows=store.items.map(x=>{
    const freshRow=isNew(x),search=[x.sermon_title,x.display_name,x.blessing_text].join(' ').toLowerCase();
    return `<article class="request-card nh7-blessing-row-v476" data-blessing-row-v476 data-new="${freshRow?'1':'0'}" data-search="${E(search)}">
      <div class="req-head"><div><div class="req-name">💬 ${E(x.sermon_title||'-')}</div><div class="req-meta">${E(x.display_name||'-')} · ${E(fmt(x.created_at))}</div></div><span class="pill ${freshRow?'pending':'approved'}">${E(freshRow?L('تازه','New','Novo'):L('بررسی‌شده','Reviewed','Pregledano'))}</span></div>
      <div class="detail-box"><p style="white-space:pre-wrap;margin:.4rem 0">${E(x.blessing_text||'')}</p></div>
      <div class="actions"><button type="button" class="btn danger-btn" onclick="window.nh7AdminDeleteBlessingV476('${E(x.id)}')">🗑 ${E(L('حذف از نمایش','Hide / remove','Sakrij'))}</button></div>
    </article>`;
  }).join('');
  return `<section class="panel-card" data-nh7-blessings-panel-v476>
    <div class="req-head"><div><h3>💬 ${E(L('برکت‌های موعظه‌ها','Sermon Blessings','Blagoslovi propovijedi'))}</h3><p class="muted small">${E(L('پیام‌هایی که کاربران زیر موعظه‌ها به‌عنوان برکت نوشته‌اند.','Messages users shared as blessings under sermons.','Poruke koje su korisnici ostavili kao blagoslove uz propovijedi.'))}</p></div>${fresh?'<button type="button" class="btn secondary" onclick="window.nh7AdminMarkBlessingsSeenV476()">✓ '+E(L('علامت‌گذاری بررسی‌شده','Mark reviewed','Označi pregledano'))+'</button>':''}</div>
    <div class="exam-results-grid">
      <div class="stat"><b>${total}</b><span>${E(L('قابل‌نمایش','Visible','Vidljivo'))}</span></div>
      <div class="stat ${fresh?'alert-stat':''}"><b>${fresh}</b><span>${E(L('تازه','New','Novo'))}</span></div>
      <div class="stat"><b>${sermons}</b><span>${E(L('موعظه‌ها','Sermons','Propovijedi'))}</span></div>
    </div>
    <div class="message-toolbar">
      <input data-blessing-search-v476 type="search" oninput="window.nh7AdminFilterBlessingsV476()" placeholder="${E(L('جستجو در نام، موعظه یا متن…','Search name, sermon or text…','Pretraži ime, propovijed ili tekst…'))}">
      <select data-blessing-filter-v476 onchange="window.nh7AdminFilterBlessingsV476()"><option value="all">${E(L('همه','All','Sve'))}</option><option value="new">${E(L('فقط تازه‌ها','New only','Samo novo'))}</option></select>
    </div>
    ${!loaded?'<div class="notice">'+E(L('برای دریافت آخرین برکت‌ها، «بررسی موارد جدید» را بزنید.','Tap “Check new items” to load the latest blessings.','Dodirnite „Provjeri nove stavke” za najnovije blagoslove.'))+'</div>':rows||'<div class="empty">'+E(L('برکت قابل‌نمایشی وجود ندارد.','No visible blessings.','Nema vidljivih blagoslova.'))+'</div>'}
  </section>`;
}

window.nh7AdminReviewRefreshV476=refreshReviewQueues;
window.nh7AdminRenderBlessingsV476=renderBlessings;
window.nh7AdminBlessingsNewCountV476=newCount;
window.nh7AdminBlessingsTotalCountV476=totalCount;
window.nh7AdminMarkBlessingsSeenV476=markSeen;
window.nh7AdminDeleteBlessingV476=removeBlessing;
window.nh7AdminFilterBlessingsV476=filterDom;
window.NH7_ADMIN_BLESSINGS_V476=store;
window.NH7_ADMIN_REVIEW_REFRESH_VERSION=VERSION;
})();