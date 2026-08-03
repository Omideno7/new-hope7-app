/* New Hope 7 Admin v3.3.1 — accurate pending queue, live count and no-jump deletion */
(()=>{'use strict';
const VERSION='3.3.1-registration-workflow';
let installed=false,refreshing=false;
const L=(fa,en,hr)=>typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en;
const E=value=>typeof h==='function'?h(value):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const emailOf=row=>{try{const p=typeof row?.payload==='string'?JSON.parse(row.payload):row?.payload||{};return String(p.email||p.user_email||row?.email||row?.user_email||'').trim().toLowerCase()}catch(_){return String(row?.email||row?.user_email||'').trim().toLowerCase()}};
const typeOf=row=>String(row?.type||'registration').trim().toLowerCase();
const rawStatus=row=>String(row?.status||'pending').trim().toLowerCase();
const approved=row=>rawStatus(row)==='approved';
const rejected=row=>['rejected','denied','blocked'].includes(rawStatus(row));
const pending=row=>!approved(row)&&!rejected(row)&&rawStatus(row)!=='archived';
function pendingCount(){return Array.isArray(state?.registrations)?state.registrations.filter(pending).length:0}
function addStyle(){if(document.getElementById('nh7RegistrationWorkflowStyleV331'))return;const style=document.createElement('style');style.id='nh7RegistrationWorkflowStyleV331';style.textContent=`.nh7-registration-summary-v331{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:10px 0 14px}.nh7-registration-summary-v331>div{border:1px solid #d8ecea;border-radius:16px;padding:11px;background:#f8fcfc;text-align:center}.nh7-registration-summary-v331 b{display:block;font-size:1.3rem}.nh7-registration-summary-v331 span{font-size:.78rem;color:#667085}.request-card.nh7-removing-v331{opacity:0;transform:translateX(-14px);max-height:0;margin:0;padding-block:0;overflow:hidden;transition:.22s ease}.nh7-request-count-v331{box-shadow:0 0 0 3px rgba(225,29,72,.13)}@media(max-width:600px){.nh7-registration-summary-v331{grid-template-columns:1fr 1fr}.nh7-registration-summary-v331>div:first-child{grid-column:1/-1}}`;document.head.appendChild(style)}
function preserveRender(){const y=window.scrollY;render();requestAnimationFrame(()=>window.scrollTo({top:y,left:0,behavior:'auto'}))}
function updateBadge(){
  const count=pendingCount();
  document.querySelectorAll('.tabs .tab').forEach(button=>{const action=String(button.getAttribute('onclick')||'');if(!action.includes('requests'))return;let badge=button.querySelector('.badge');if(count){if(!badge){badge=document.createElement('span');badge.className='badge';button.appendChild(badge)}badge.textContent=String(count);badge.classList.add('nh7-request-count-v331')}else badge?.remove()});
  const titleBase='OmideNo7 Admin',other=typeof counts==='function'?counts():{newQ:0,pendingAssignments:0};const total=count+Number(other.newQ||0)+Number(other.pendingAssignments||0);document.title=(total?`(${total}) `:'')+titleBase;
}
function cardFor(id){return [...document.querySelectorAll('.request-card')].find(card=>[...card.querySelectorAll('[onclick]')].some(button=>String(button.getAttribute('onclick')||'').includes(String(id))))||null}
function removeCard(id){const card=cardFor(id);if(!card)return;card.classList.add('nh7-removing-v331');setTimeout(()=>card.remove(),230)}
function dedupeRows(rows,match=()=>true){const chosen=new Map(),removed=[];for(const row of rows){if(!match(row)){chosen.set('id:'+row.id,row);continue}const mail=emailOf(row),key=mail?typeOf(row)+'|'+mail:'id:'+row.id;if(!chosen.has(key)){chosen.set(key,row);continue}const old=chosen.get(key),oldTime=new Date(old.updated_at||old.created_at||0).getTime(),newTime=new Date(row.updated_at||row.created_at||0).getTime(),takeNew=(approved(row)&&!approved(old))||(approved(row)===approved(old)&&newTime>oldTime);if(takeNew){removed.push(old);chosen.set(key,row)}else removed.push(row)}return{rows:[...chosen.values()],removed}}
async function refreshRegistrations(renderWhenChanged=true){
  if(refreshing||document.hidden||typeof token==='undefined'||!token||typeof authFetch!=='function')return;
  refreshing=true;try{
    const before=(state.registrations||[]).map(row=>String(row.id)+'|'+rawStatus(row)).join(','),rows=await authFetch('/rest/v1/registrations?select=*&order=created_at.desc&limit=2000',{method:'GET'});if(!Array.isArray(rows))return;
    state.registrations=rows;const after=rows.map(row=>String(row.id)+'|'+rawStatus(row)).join(',');updateBadge();
    if(renderWhenChanged&&before!==after&&typeof activeTab!=='undefined'&&['requests','approved','overview'].includes(activeTab))preserveRender();
  }catch(error){console.warn('Registration refresh',error)}finally{refreshing=false}
}
function install(){
  if(installed||typeof state!=='object'||typeof render!=='function'||typeof renderRequests!=='function'||typeof counts!=='function')return false;installed=true;addStyle();
  const baseCounts=counts;baseCounts.__nh7V331=true;
  counts=window.counts=function(){const out=baseCounts();out.pending=pendingCount();return out};
  getEffectiveStatus=window.getEffectiveStatus=function(row){return rawStatus(row)||'pending'};
  isEffectivePending=window.isEffectivePending=pending;
  isEffectiveApproved=window.isEffectiveApproved=approved;
  const baseRequests=renderRequests;
  renderRequests=window.renderRequests=function(approvedOnly=false){const html=baseRequests(approvedOnly);if(approvedOnly)return html;const rows=state.registrations||[],waiting=rows.filter(pending).length,ok=rows.filter(approved).length,reject=rows.filter(rejected).length,summary=`<div class="nh7-registration-summary-v331"><div><b>${waiting}</b><span>${E(L('در انتظار تأیید','Waiting approval','Čeka odobrenje'))}</span></div><div><b>${ok}</b><span>${E(L('تأییدشده','Approved','Odobreno'))}</span></div><div><b>${reject}</b><span>${E(L('ردشده','Rejected','Odbijeno'))}</span></div></div>`;return html.replace('<div class="toolbar">',summary+'<div class="toolbar">')};
  const baseSetTab=setTab;
  setTab=window.setTab=function(tab){if(tab==='requests'&&typeof currentFilter!=='undefined')currentFilter='pending';const out=baseSetTab(tab);requestAnimationFrame(updateBadge);if(tab==='requests')setTimeout(()=>refreshRegistrations(true),120);return out};
  deleteRequest=window.deleteRequest=async function(id){
    if(!confirm(typeof tr==='function'?tr('confirmDelete'):L('این درخواست حذف شود؟','Delete this request?','Izbrisati zahtjev?')))return;
    const backup=(state.registrations||[]).slice(),row=backup.find(item=>String(item.id)===String(id));state.registrations=backup.filter(item=>String(item.id)!==String(id));removeCard(id);updateBadge();
    try{await adminRpc('nh7_admin_delete_registration',{p_id:id});if(typeof setMessage==='function')setMessage(typeof tr==='function'?tr('deletedMsg'):L('حذف شد','Deleted','Izbrisano'),'success')}
    catch(error){state.registrations=backup;preserveRender();const message=error?.message||String(error);if(typeof setMessage==='function')setMessage(message,'danger');alert(message)}
  };
  updateStatus=window.updateStatus=async function(id,status){
    const backup=(state.registrations||[]).slice(),index=backup.findIndex(item=>String(item.id)===String(id));if(index<0)return;const updated=Object.assign({},backup[index],{status,updated_at:new Date().toISOString()});state.registrations=backup.map((item,i)=>i===index?updated:item);if(typeof activeTab!=='undefined'&&activeTab==='requests'&&typeof currentFilter!=='undefined'&&currentFilter==='pending')removeCard(id);updateBadge();
    try{await authFetch('/rest/v1/registrations?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({status,updated_at:new Date().toISOString()})});if(typeof setMessage==='function')setMessage(status==='approved'?(typeof tr==='function'?tr('approvedMsg'):'Approved'):(typeof tr==='function'?tr('rejectedMsg'):'Rejected'),'success')}
    catch(error){state.registrations=backup;preserveRender();alert(error?.message||String(error))}
  };
  cleanupRegistrationDuplicates=window.cleanupRegistrationDuplicates=async function(){
    if(!confirm(L('همه ثبت‌نام‌های تکراری اضافی حذف شوند؟','Remove all duplicate registrations?','Ukloniti sve duplikate registracija?')))return;const before=(state.registrations||[]).slice(),local=dedupeRows(before);state.registrations=local.rows;preserveRender();
    try{const count=Number(await adminRpc('nh7_admin_cleanup_registration_duplicates_v331',{p_type:'',p_email:''})||0);updateBadge();if(typeof setMessage==='function')setMessage(L(`ثبت‌نام‌های تکراری حذف شدند: ${Math.max(count,local.removed.length)}`,`Duplicate registrations removed: ${Math.max(count,local.removed.length)}`,`Duplikati su uklonjeni: ${Math.max(count,local.removed.length)}`),'success')}
    catch(error){state.registrations=before;preserveRender();alert(error?.message||String(error))}
  };
  cleanupRegistrationDuplicatesFor=window.cleanupRegistrationDuplicatesFor=async function(email,type){
    email=String(email||'').trim().toLowerCase();type=String(type||'').trim().toLowerCase();if(!email)return;const before=(state.registrations||[]).slice(),local=dedupeRows(before,row=>emailOf(row)===email&&(!type||typeOf(row)===type));state.registrations=local.rows;preserveRender();
    try{await adminRpc('nh7_admin_cleanup_registration_duplicates_v331',{p_type:type,p_email:email});updateBadge()}
    catch(error){state.registrations=before;preserveRender();alert(error?.message||String(error))}
  };
  const baseRender=render;render=window.render=function(...args){const out=baseRender.apply(this,args);requestAnimationFrame(updateBadge);return out};
  window.addEventListener('pageshow',()=>setTimeout(()=>refreshRegistrations(true),800));document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>refreshRegistrations(true),400)});setInterval(()=>refreshRegistrations(true),60000);setTimeout(()=>{updateBadge();refreshRegistrations(true)},1000);
  window.NH7_ADMIN_REGISTRATION_WORKFLOW_VERSION=VERSION;return true;
}
let attempts=0;const boot=()=>{attempts++;if(install())return;if(attempts<80)setTimeout(boot,50)};boot();
})();
