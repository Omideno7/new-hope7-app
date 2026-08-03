/* New Hope 7 Admin v3.3.1 — pending request badge, pending-first view and jump-free deletion */
(()=>{'use strict';
const VERSION='3.3.1-registration-requests';
if(typeof state!=='object'||!state||typeof render!=='function')return;
const L=(fa,en,hr)=>typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en;
const EMAIL=value=>String(value||'').trim().toLowerCase();
const TYPE=row=>String(typeof getType==='function'?getType(row):row?.type||'registration').trim().toLowerCase();
const EMAIL_OF=row=>EMAIL(typeof getEmail==='function'?getEmail(row):(row?.payload?.email||row?.email||row?.user_email||''));
const STATUS=row=>String(typeof getEffectiveStatus==='function'?getEffectiveStatus(row):row?.status||'pending').trim().toLowerCase();
const PENDING=row=>typeof isEffectivePending==='function'?isEffectivePending(row):!['approved','rejected','denied','blocked','archived'].includes(STATUS(row));
const APPROVED=row=>STATUS(row)==='approved';
const DATE=row=>new Date(row?.updated_at||row?.created_at||row?.payload?.submittedAt||0).getTime()||0;
let installed=false;
function rows(){return Array.isArray(state.registrations)?state.registrations:[]}
function pendingRows(){return rows().filter(PENDING)}
function requestKey(row){const email=EMAIL_OF(row);return email?TYPE(row)+'|'+email:''}
function bestRow(group){return group.slice().sort((a,b)=>Number(APPROVED(b))-Number(APPROVED(a))||DATE(b)-DATE(a))[0]||null}
function duplicatesFor(email='',type=''){
  const targetEmail=EMAIL(email),targetType=String(type||'').trim().toLowerCase(),groups=new Map();
  for(const row of rows()){
    const key=requestKey(row);if(!key)continue;
    if(targetEmail&&EMAIL_OF(row)!==targetEmail)continue;
    if(targetType&&TYPE(row)!==targetType)continue;
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);
  }
  const remove=[];
  for(const group of groups.values()){
    if(group.length<2)continue;const keep=bestRow(group);
    group.forEach(row=>{if(row!==keep)remove.push(row)});
  }
  return remove;
}
function restoreScroll(y){requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo({top:Math.max(0,y),behavior:'auto'})))}
function renderAt(y=window.scrollY){render();restoreScroll(y)}
function style(){
  if(document.getElementById('nh7RegistrationRequestsStyleV331'))return;
  const element=document.createElement('style');element.id='nh7RegistrationRequestsStyleV331';
  element.textContent=`.nh7-request-summary-v331{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:8px 0 12px;padding:11px 13px;border:1px solid #fed7aa;border-radius:15px;background:#fff7ed;color:#9a3412}.nh7-request-summary-v331 b{font-size:1.15rem}.nh7-request-deleting-v331{opacity:.45;pointer-events:none;transform:scale(.985);transition:.16s ease}.nh7-request-tab-alert-v331{box-shadow:0 0 0 3px rgba(225,29,72,.12)}`;
  document.head.appendChild(element);
}
function requestTab(){return [...document.querySelectorAll('.tab')].find(button=>/setTab\((?:&quot;|["'])requests/.test(button.getAttribute('onclick')||''))||null}
function decorate(){
  style();const count=pendingRows().length,tab=requestTab();
  if(tab){let badge=tab.querySelector('.badge');if(count){if(!badge){badge=document.createElement('span');badge.className='badge';tab.appendChild(badge)}badge.textContent=String(count);tab.classList.add('nh7-request-tab-alert-v331')}else{badge?.remove();tab.classList.remove('nh7-request-tab-alert-v331')}}
}
if(typeof renderRequests==='function'){
  const originalRenderRequests=renderRequests;
  renderRequests=window.renderRequests=function(approvedOnly=false){
    let html=originalRenderRequests(approvedOnly);
    if(!approvedOnly){const count=pendingRows().length;html=html.replace('</h3>',`</h3><div class="nh7-request-summary-v331"><span>${L('درخواست‌های تازه و در انتظار تأیید','New requests awaiting approval','Novi zahtjevi koji čekaju odobrenje')}</span><b>${count}</b></div>`)}
    return html;
  };
}
if(typeof setTab==='function'){
  const originalSetTab=setTab;
  setTab=window.setTab=function(tab){
    if(tab==='requests'&&typeof currentFilter!=='undefined'){currentFilter='pending';if(typeof currentSearch!=='undefined')currentSearch=''}
    const result=originalSetTab.apply(this,arguments);requestAnimationFrame(decorate);return result;
  };
}
const originalRender=render;
render=window.render=function(){const result=originalRender.apply(this,arguments);requestAnimationFrame(decorate);return result};
async function serverDelete(id){
  try{return await adminRpc('nh7_admin_delete_registration',{p_id:id})}
  catch(rpcError){console.warn('Registration delete RPC',rpcError);return authFetch('/rest/v1/registrations?id=eq.'+encodeURIComponent(id),{method:'DELETE'})}
}
deleteRequest=window.deleteRequest=async function(id){
  if(!confirm(typeof tr==='function'?tr('confirmDelete'):L('این درخواست حذف شود؟','Delete this request?','Izbrisati zahtjev?')))return;
  const before=rows().slice(),target=before.find(row=>String(row.id)===String(id));if(!target)return;
  const y=window.scrollY,card=[...document.querySelectorAll('.request-card')].find(node=>node.querySelector(`[onclick*="${CSS.escape(String(id))}"]`));card?.classList.add('nh7-request-deleting-v331');
  state.registrations=before.filter(row=>String(row.id)!==String(id));renderAt(y);
  try{await serverDelete(id);if(typeof setMessage==='function')setMessage(typeof tr==='function'?tr('deletedMsg'):L('حذف شد','Deleted','Izbrisano'),'success')}
  catch(error){state.registrations=before;renderAt(y);const message=error?.message||String(error);if(typeof setMessage==='function')setMessage(message,'danger');alert(message)}
};
cleanupRegistrationDuplicates=window.cleanupRegistrationDuplicates=async function(){
  const remove=duplicatesFor();if(!remove.length){alert(L('درخواست تکراری وجود ندارد.','No duplicate requests were found.','Nema duplikata zahtjeva.'));return}
  if(!confirm(L(`درخواست‌های تکراری اضافی حذف شوند؟ تعداد: ${remove.length}`,`Delete ${remove.length} duplicate request(s)?`,`Izbrisati ${remove.length} duplikata zahtjeva?`)))return;
  const before=rows().slice(),ids=new Set(remove.map(row=>String(row.id))),y=window.scrollY;state.registrations=before.filter(row=>!ids.has(String(row.id)));renderAt(y);
  try{await adminRpc('nh7_admin_cleanup_registration_duplicates',{p_email:null,p_type:null});if(typeof setMessage==='function')setMessage(L('درخواست‌های تکراری حذف شدند.','Duplicate requests were removed.','Duplikati su uklonjeni.'),'success')}
  catch(error){state.registrations=before;renderAt(y);alert(error?.message||String(error))}
};
cleanupRegistrationDuplicatesFor=window.cleanupRegistrationDuplicatesFor=async function(email,type){
  email=EMAIL(email);const remove=duplicatesFor(email,type);if(!remove.length){alert(L('برای این ایمیل درخواست تکراری وجود ندارد.','No duplicate request exists for this email.','Nema duplikata za ovaj email.'));return}
  if(!confirm(L(`درخواست‌های تکراری این ایمیل حذف شوند؟ تعداد: ${remove.length}`,`Delete ${remove.length} duplicate request(s) for this email?`,`Izbrisati ${remove.length} duplikata za ovaj email?`)))return;
  const before=rows().slice(),ids=new Set(remove.map(row=>String(row.id))),y=window.scrollY;state.registrations=before.filter(row=>!ids.has(String(row.id)));renderAt(y);
  try{await adminRpc('nh7_admin_cleanup_registration_duplicates',{p_email:email,p_type:type||null});if(typeof setMessage==='function')setMessage(L('تکراری‌ها حذف شدند.','Duplicates removed.','Duplikati uklonjeni.'),'success')}
  catch(error){state.registrations=before;renderAt(y);alert(error?.message||String(error))}
};
if(typeof activeTab!=='undefined'&&activeTab==='requests'&&typeof currentFilter!=='undefined')currentFilter='pending';
window.addEventListener('pageshow',()=>requestAnimationFrame(decorate));document.addEventListener('visibilitychange',()=>{if(!document.hidden)requestAnimationFrame(decorate)});
installed=true;style();requestAnimationFrame(decorate);window.NH7_ADMIN_REGISTRATION_REQUESTS_VERSION=VERSION;
})();
