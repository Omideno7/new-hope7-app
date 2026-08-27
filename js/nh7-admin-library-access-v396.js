/* New Hope 7 Admin v3.9.6 — approved-user ministers-library access manager. */
(()=>{'use strict';
if(window.__NH7_ADMIN_LIBRARY_ACCESS_V396__)return;
window.__NH7_ADMIN_LIBRARY_ACCESS_V396__=true;

const VERSION='3.9.6';
const URL='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const TOKEN_KEY='nh7_admin_token';
const REFRESH_KEY='nh7_admin_refresh_token';
let modal=null,refreshing=null,injectTimer=0;
const state={loading:false,saving:false,error:'',users:[],items:[],publicItems:[],collections:[],grants:[],selectedUser:'',search:'',scope:'library_all',resource:'',expires:'',note:'',loadedAt:0};

function language(){
  const select=document.querySelector('#langSelect');
  const value=String(select?.value||document.documentElement.lang||localStorage.getItem('nh7_admin_lang')||localStorage.getItem('nh7_lang')||'fa').toLowerCase();
  return ['fa','en','hr'].includes(value)?value:'fa';
}
const L=(fa,en,hr)=>language()==='fa'?fa:language()==='hr'?hr:en;
const E=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const uid=value=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value||''))?String(value):'';
function token(){return String(localStorage.getItem(TOKEN_KEY)||'')}
function refreshToken(){return String(localStorage.getItem(REFRESH_KEY)||'')}
function jwtExpiry(value){try{const part=String(value||'').split('.')[1]||'';const normalized=part.replace(/-/g,'+').replace(/_/g,'/');return Number(JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length/4)*4,'='))).exp||0)*1000}catch(_){return 0}}
async function ensureToken(){
  let access=token();
  if(access&&jwtExpiry(access)>Date.now()+90000)return access;
  const refresh=refreshToken();
  if(!refresh)return access;
  if(refreshing)return refreshing;
  refreshing=(async()=>{
    try{
      const response=await fetch(`${URL}/auth/v1/token?grant_type=refresh_token`,{method:'POST',cache:'no-store',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:refresh})});
      const raw=await response.text();let data={};try{data=raw?JSON.parse(raw):{}}catch(_){data={message:raw}}
      if(!response.ok)throw new Error(data.message||data.error_description||L('نشست مدیریت منقضی شده است.','The admin session has expired.','Administratorska sesija je istekla.'));
      access=String(data.access_token||'');
      if(access)localStorage.setItem(TOKEN_KEY,access);
      if(data.refresh_token)localStorage.setItem(REFRESH_KEY,String(data.refresh_token));
      return access;
    }finally{refreshing=null}
  })();
  return refreshing;
}
async function requestHeaders(){const access=await ensureToken();if(!access)throw new Error(L('ابتدا وارد پنل مدیریت شوید.','Sign in to the admin panel first.','Najprije se prijavite u administratorsku ploču.'));return{apikey:KEY,Authorization:'Bearer '+access,'Content-Type':'application/json'}}
async function rpc(name,payload={},retry=true){
  const call=async()=>{
    const response=await fetch(`${URL}/rest/v1/rpc/${encodeURIComponent(name)}`,{method:'POST',cache:'no-store',headers:await requestHeaders(),body:JSON.stringify(payload||{})});
    const raw=await response.text();let data=null;try{data=raw?JSON.parse(raw):null}catch(_){data=raw}
    if(!response.ok){const error=new Error(data?.message||data?.hint||String(data||response.statusText));error.status=response.status;throw error}
    return data;
  };
  try{return await call()}catch(error){if(retry&&error.status===401){localStorage.removeItem(TOKEN_KEY);await ensureToken();return call()}throw error}
}
async function rest(path){const response=await fetch(`${URL}/rest/v1/${path}`,{headers:await requestHeaders(),cache:'no-store'});const raw=await response.text();let data=[];try{data=raw?JSON.parse(raw):[]}catch(_){data=[]}if(!response.ok)throw new Error(data?.message||raw||response.statusText);return Array.isArray(data)?data:[]}
function formatDate(value){if(!value)return L('بدون تاریخ انقضا','No expiration','Bez isteka');try{return new Intl.DateTimeFormat(language()==='fa'?'fa-IR':language()==='hr'?'hr-HR':'en-US',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value))}catch(_){return String(value)}}
function userOf(id){return state.users.find(row=>String(row.user_id)===String(id))}
function itemOf(id){return state.items.find(row=>String(row.id)===String(id))}
function collectionOf(id){return state.collections.find(row=>String(row.id)===String(id))}
function itemTitle(row){if(!row)return'';const l=language();return row['title_'+l]||row.title_en||row.title_fa||row.title_hr||row.file_name||L('بدون عنوان','Untitled','Bez naslova')}
function scopeLabel(scope){return scope==='library_all'?L('دسترسی کامل کتابخانه خادمان','All ministers-library access','Cijela knjižnica za služitelje'):scope==='library_collection'?L('دسترسی به یک مجموعه','One collection','Jedna zbirka'):scope==='library_item'?L('دسترسی به یک کتاب یا جزوه','One book or handout','Jedna knjiga ili materijal'):scope}
function resourceLabel(grant){if(grant.scope==='library_collection')return itemTitle(collectionOf(grant.resource_id));if(grant.scope==='library_item')return itemTitle(itemOf(grant.resource_id));return L('تمام موارد فعلی و آینده','All current and future items','Sve sadašnje i buduće stavke')}
function currentUserGrants(){return state.grants.filter(row=>String(row.user_id)===String(state.selectedUser))}
function activeAccessSnapshot(){try{return JSON.parse(localStorage.getItem('nh7_admin_access_v350')||'null')}catch(_){return null}}
function authorizedEntry(){const access=activeAccessSnapshot();return Boolean(token()&&(access?.is_owner||Array.isArray(access?.permissions)&&access.permissions.includes('registrations.view')))}

function installStyle(){
  if(document.getElementById('nh7LibraryAccessStyleV396'))return;
  const style=document.createElement('style');style.id='nh7LibraryAccessStyleV396';style.textContent=`
.nh7-access-overlay{position:fixed;inset:0;z-index:1500;background:rgba(7,27,40,.62);backdrop-filter:blur(6px);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:18px}.nh7-access-modal{width:min(1180px,100%);min-height:min(760px,calc(100vh - 36px));background:#f5fbfb;border-radius:26px;border:1px solid rgba(255,255,255,.75);box-shadow:0 28px 90px rgba(0,0,0,.3);padding:16px;margin:auto;direction:rtl}.nh7-access-modal[dir="ltr"]{direction:ltr}.nh7-access-head{position:sticky;top:-18px;z-index:4;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:10px 0 14px;background:rgba(245,251,251,.96);backdrop-filter:blur(12px);border-bottom:1px solid #d8ecea}.nh7-access-head h2{margin:0 0 4px}.nh7-access-head-actions{display:flex;gap:8px}.nh7-access-close{width:44px;height:44px;border:0;border-radius:999px;background:#fff;font-size:1.25rem;box-shadow:0 5px 16px rgba(16,32,51,.12);cursor:pointer}.nh7-access-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:14px 0}.nh7-access-stat{background:#fff;border:1px solid #d8ecea;border-radius:17px;padding:11px}.nh7-access-stat b{display:block;font-size:1.35rem}.nh7-access-stat span{font-size:.78rem;color:#667085}.nh7-access-grid{display:grid;grid-template-columns:minmax(300px,.85fr) minmax(380px,1.15fr);gap:13px}.nh7-access-card{background:#fff;border:1px solid #d8ecea;border-radius:21px;padding:14px;margin-bottom:12px;box-shadow:0 8px 24px rgba(16,32,51,.055)}.nh7-access-card h3{margin:0 0 9px}.nh7-access-users{display:grid;gap:8px;max-height:520px;overflow:auto;padding:2px}.nh7-access-user{border:1px solid #d8ecea;background:#fbfefe;border-radius:16px;padding:11px;text-align:start;cursor:pointer;color:#102033}.nh7-access-user.selected{border-color:#0b76b7;background:#eef8ff;box-shadow:0 0 0 2px rgba(11,118,183,.1)}.nh7-access-user strong,.nh7-access-user small{display:block}.nh7-access-user small{margin-top:3px;color:#667085;word-break:break-word}.nh7-access-user em{display:inline-flex;margin-top:7px;padding:4px 8px;border-radius:999px;background:#ecfdf3;color:#08783d;font-size:.72rem;font-style:normal;font-weight:800}.nh7-access-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.nh7-access-form-grid .wide{grid-column:1/-1}.nh7-access-field label{display:block;font-size:.8rem;font-weight:800;margin-bottom:3px;color:#344054}.nh7-access-field input,.nh7-access-field select,.nh7-access-field textarea{width:100%;border:1px solid #cfe4e2;border-radius:13px;padding:11px;background:#fff}.nh7-access-field textarea{min-height:78px;resize:vertical}.nh7-access-selected{padding:11px;border-radius:15px;background:#eef8f7;border:1px solid #cce9e5;margin-bottom:10px}.nh7-access-selected b,.nh7-access-selected span{display:block}.nh7-access-grant{border:1px solid #d8ecea;border-radius:16px;padding:11px;margin:8px 0;background:#fbfefe}.nh7-access-grant-head{display:flex;justify-content:space-between;gap:9px}.nh7-access-grant p{margin:5px 0;color:#667085;font-size:.82rem}.nh7-access-pill{display:inline-flex;padding:4px 8px;border-radius:999px;background:#ecfdf3;color:#08783d;font-size:.72rem;font-weight:850}.nh7-access-empty{padding:20px;border:1px dashed #cbdeda;border-radius:16px;text-align:center;color:#667085}.nh7-access-notice{padding:11px;border-radius:14px;background:#fff7ed;color:#9a3412;margin:9px 0}.nh7-access-error{background:#fff1f1;color:#a02121}.nh7-access-public-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.nh7-access-public-book{border:1px solid #e1eeee;border-radius:13px;padding:9px;background:#fbfefe}.nh7-access-public-book b,.nh7-access-public-book small{display:block}.nh7-access-public-book small{color:#667085;margin-top:3px}.nh7-access-toast{position:fixed;z-index:1600;left:50%;bottom:24px;transform:translateX(-50%);max-width:min(520px,calc(100vw - 28px));padding:12px 17px;border-radius:14px;background:#102033;color:#fff;box-shadow:0 12px 34px rgba(0,0,0,.25);text-align:center}.nh7-access-toast.good{background:#08783d}.nh7-access-toast.bad{background:#a02121}.nh7-access-tab{position:relative}.nh7-access-tab::after{content:'NEW';position:absolute;top:-5px;inset-inline-end:-5px;font-size:.52rem;padding:2px 4px;border-radius:999px;background:#e11d48;color:#fff;font-weight:900}.nh7-access-body-lock{overflow:hidden!important}
@media(max-width:850px){.nh7-access-grid{grid-template-columns:1fr}.nh7-access-stats{grid-template-columns:1fr 1fr}.nh7-access-public-list{grid-template-columns:1fr}.nh7-access-users{max-height:360px}}
@media(max-width:560px){.nh7-access-overlay{padding:0}.nh7-access-modal{border-radius:0;min-height:100vh;padding:12px}.nh7-access-head{top:0}.nh7-access-form-grid{grid-template-columns:1fr}.nh7-access-form-grid .wide{grid-column:auto}.nh7-access-head-actions .btn{padding:10px 8px}.nh7-access-stats{grid-template-columns:1fr 1fr}}
`;
  document.head.appendChild(style);
}
function toast(message,type='good'){
  document.querySelector('.nh7-access-toast')?.remove();
  const node=document.createElement('div');node.className='nh7-access-toast '+type;node.textContent=message;document.body.appendChild(node);setTimeout(()=>node.remove(),3200);
}
function closeModal(){modal?.remove();modal=null;document.body.classList.remove('nh7-access-body-lock')}
function modalShell(){
  return `<div class="nh7-access-overlay" id="nh7LibraryAccessOverlay"><section class="nh7-access-modal" dir="${language()==='fa'?'rtl':'ltr'}" role="dialog" aria-modal="true"><header class="nh7-access-head"><div><h2>🔐 ${E(L('دسترسی کتابخانه خادمان','Ministers-library access','Pristup knjižnici za služitelje'))}</h2><p class="muted small">${E(L('فقط حساب‌های ثبت‌نام کامل و تأییدشده نمایش داده می‌شوند.','Only fully registered and approved accounts are shown.','Prikazuju se samo potpuno registrirani i odobreni računi.'))}</p></div><div class="nh7-access-head-actions"><button type="button" class="btn secondary" data-access-refresh>⟳ ${E(L('تازه‌سازی','Refresh','Osvježi'))}</button><button type="button" class="nh7-access-close" data-access-close aria-label="${E(L('بستن','Close','Zatvori'))}">×</button></div></header><div data-access-body><div class="nh7-access-empty">${E(L('در حال دریافت کاربران و دسترسی‌ها…','Loading users and access…','Učitavanje korisnika i pristupa…'))}</div></div></section></div>`;
}
async function openModal(){
  installStyle();
  if(modal){modal.querySelector('.nh7-access-modal')?.scrollTo({top:0,behavior:'smooth'});return}
  const wrap=document.createElement('div');wrap.innerHTML=modalShell();modal=wrap.firstElementChild;document.body.appendChild(modal);document.body.classList.add('nh7-access-body-lock');bindModal();await loadData(true);
}
function bindModal(){
  modal.addEventListener('click',event=>{
    if(event.target===modal||event.target.closest('[data-access-close]'))return closeModal();
    if(event.target.closest('[data-access-refresh]'))return loadData(true);
    const user=event.target.closest('[data-access-user]');if(user){state.selectedUser=String(user.dataset.accessUser||'');render();return}
    if(event.target.closest('[data-access-grant]'))return grantAccess();
    const revoke=event.target.closest('[data-access-revoke]');if(revoke)return revokeAccess(String(revoke.dataset.accessRevoke||''));
  });
  modal.addEventListener('input',event=>{
    if(event.target.matches('[data-access-search]')){state.search=event.target.value;renderUsersOnly();}
    if(event.target.matches('[data-access-note]'))state.note=event.target.value;
    if(event.target.matches('[data-access-expires]'))state.expires=event.target.value;
  });
  modal.addEventListener('change',event=>{
    if(event.target.matches('[data-access-scope]')){state.scope=event.target.value;state.resource='';render();}
    if(event.target.matches('[data-access-resource]'))state.resource=event.target.value;
  });
}
async function loadData(force=false){
  if(state.loading||(!force&&state.loadedAt&&Date.now()-state.loadedAt<15000))return;
  state.loading=true;state.error='';render();
  try{
    const [dashboard,collections,publicItems]=await Promise.all([
      rpc('nh7_admin_content_access_dashboard_v395',{}),
      rest('nh7_library_collections_v322?select=id,slug,title_fa,title_en,title_hr,audience,is_active,sort_order&audience=eq.ministers&is_active=eq.true&order=sort_order.asc'),
      rest('nh7_library_items_v224?select=id,title_fa,title_en,title_hr,reader_available,reader_page_count,sort_order&audience=eq.public&resource_type=eq.library&order=sort_order.asc')
    ]);
    const data=Array.isArray(dashboard)?dashboard[0]:dashboard||{};
    state.users=Array.isArray(data.users)?data.users:[];
    state.items=Array.isArray(data.items)?data.items:[];
    state.grants=Array.isArray(data.grants)?data.grants:[];
    state.collections=collections;
    state.publicItems=publicItems;
    if(state.selectedUser&&!state.users.some(row=>String(row.user_id)===String(state.selectedUser)))state.selectedUser='';
    state.loadedAt=Date.now();
  }catch(error){state.error=error.message||String(error)}finally{state.loading=false;render()}
}
function filteredUsers(){const q=state.search.trim().toLocaleLowerCase();if(!q)return state.users;return state.users.filter(row=>`${row.display_name||''} ${row.email||''}`.toLocaleLowerCase().includes(q))}
function userCards(){
  const rows=filteredUsers();
  if(!rows.length)return `<div class="nh7-access-empty">${E(L('کاربر تأییدشده‌ای با این جست‌وجو پیدا نشد.','No approved user matched this search.','Nije pronađen odobreni korisnik.'))}</div>`;
  return rows.map(row=>{const count=state.grants.filter(grant=>String(grant.user_id)===String(row.user_id)).length;return `<button type="button" class="nh7-access-user ${String(state.selectedUser)===String(row.user_id)?'selected':''}" data-access-user="${E(row.user_id)}"><strong>${E(row.display_name||row.email)}</strong><small dir="ltr">${E(row.email)}</small><em>${count?`${count} ${E(L('دسترسی فعال','active access','aktivni pristup'))}`:E(L('بدون دسترسی خادمان','No ministers access','Bez pristupa za služitelje'))}</em></button>`}).join('');
}
function resourceOptions(){
  if(state.scope==='library_collection')return state.collections.map(row=>`<option value="${E(row.id)}" ${String(state.resource)===String(row.id)?'selected':''}>${E(itemTitle(row))}</option>`).join('');
  if(state.scope==='library_item')return state.items.map(row=>`<option value="${E(row.id)}" ${String(state.resource)===String(row.id)?'selected':''}>${E(itemTitle(row))}</option>`).join('');
  return'';
}
function grantRows(){
  const grants=currentUserGrants();
  if(!grants.length)return `<div class="nh7-access-empty">${E(L('برای این حساب هنوز دسترسی کتابخانه خادمان ثبت نشده است.','No ministers-library access has been granted to this account.','Za ovaj račun još nije odobren pristup knjižnici.'))}</div>`;
  return grants.map(row=>`<article class="nh7-access-grant"><div class="nh7-access-grant-head"><div><span class="nh7-access-pill">${E(scopeLabel(row.scope))}</span><strong style="display:block;margin-top:6px">${E(resourceLabel(row))}</strong></div><button type="button" class="btn danger-btn" data-access-revoke="${E(row.id)}" ${state.saving?'disabled':''}>${E(L('لغو','Revoke','Opozovi'))}</button></div><p>${E(formatDate(row.expires_at))}</p>${row.note?`<p>${E(row.note)}</p>`:''}</article>`).join('');
}
function publicBooks(){
  if(!state.publicItems.length)return `<div class="nh7-access-empty">${E(L('کتاب عمومی آماده‌ای پیدا نشد.','No ready public book was found.','Nije pronađena spremna javna knjiga.'))}</div>`;
  return `<div class="nh7-access-public-list">${state.publicItems.map((row,index)=>`<div class="nh7-access-public-book"><b>${index+1}. ${E(itemTitle(row))}</b><small>${row.reader_available?`✓ ${E(L('نسخه داخل اپ آماده است','In-app edition ready','Izdanje u aplikaciji spremno'))}`:E(L('نسخه داخل اپ آماده نیست','In-app edition not ready','Izdanje nije spremno'))} · ${Number(row.reader_page_count||0)} ${E(L('بخش','sections','dijelova'))}</small></div>`).join('')}</div>`;
}
function editor(){
  const user=userOf(state.selectedUser),needsResource=state.scope!=='library_all',resourceEmpty=needsResource&&!(state.scope==='library_collection'?state.collections.length:state.items.length);
  if(!user)return `<div class="nh7-access-empty">${E(L('از فهرست سمت راست یک حساب تأییدشده را انتخاب کنید.','Select an approved account from the user list.','Odaberite odobreni račun s popisa.'))}</div>`;
  return `<div class="nh7-access-selected"><b>${E(user.display_name||user.email)}</b><span dir="ltr">${E(user.email)}</span></div><div class="nh7-access-form-grid"><div class="nh7-access-field wide"><label>${E(L('نوع دسترسی','Access type','Vrsta pristupa'))}</label><select data-access-scope><option value="library_all" ${state.scope==='library_all'?'selected':''}>${E(scopeLabel('library_all'))}</option><option value="library_collection" ${state.scope==='library_collection'?'selected':''}>${E(scopeLabel('library_collection'))}</option><option value="library_item" ${state.scope==='library_item'?'selected':''} ${!state.items.length?'disabled':''}>${E(scopeLabel('library_item'))}</option></select></div>${needsResource?`<div class="nh7-access-field wide"><label>${E(state.scope==='library_collection'?L('مجموعه','Collection','Zbirka'):L('کتاب یا جزوه','Book or handout','Knjiga ili materijal'))}</label><select data-access-resource ${resourceEmpty?'disabled':''}><option value="">${E(L('انتخاب کنید…','Select…','Odaberite…'))}</option>${resourceOptions()}</select></div>`:''}<div class="nh7-access-field"><label>${E(L('تاریخ انقضا — اختیاری','Expiration — optional','Istek — neobavezno'))}</label><input type="datetime-local" data-access-expires value="${E(state.expires)}"></div><div class="nh7-access-field"><label>${E(L('یادداشت — اختیاری','Note — optional','Napomena — neobavezno'))}</label><input type="text" maxlength="500" data-access-note value="${E(state.note)}" placeholder="${E(L('مثلاً دلیل یا محدوده دسترسی','Reason or access note','Razlog ili napomena'))}"></div><div class="wide"><button type="button" class="btn primary" data-access-grant ${state.saving||resourceEmpty?'disabled':''}>${state.saving?E(L('در حال ذخیره…','Saving…','Spremanje…')):'✓ '+E(L('فعال‌کردن دسترسی','Grant access','Odobri pristup'))}</button></div></div>${!state.items.length?`<div class="nh7-access-notice">${E(L('هنوز کتاب یا جزوه‌ای با برچسب «مخصوص خادمان» بارگذاری نشده است. دسترسی کامل را می‌توان از هم‌اکنون فعال کرد و برای تمام موارد خادمان که بعداً اضافه می‌شوند نیز معتبر خواهد بود.','No item is currently marked as ministers-only. All-access can still be granted now and will cover future ministers items.','Trenutačno nema stavke označene samo za služitelje. Potpuni pristup može se odobriti sada i vrijedit će za buduće stavke.'))}</div>`:''}`;
}
function bodyHtml(){
  if(state.loading&&!state.loadedAt)return `<div class="nh7-access-empty">${E(L('در حال دریافت کاربران و دسترسی‌ها…','Loading users and access…','Učitavanje korisnika i pristupa…'))}</div>`;
  return `${state.error?`<div class="nh7-access-notice nh7-access-error">${E(state.error)}</div>`:''}<div class="nh7-access-stats"><div class="nh7-access-stat"><b>${state.users.length}</b><span>${E(L('حساب تأییدشده','Approved accounts','Odobreni računi'))}</span></div><div class="nh7-access-stat"><b>${state.publicItems.length}</b><span>${E(L('کتاب عمومی سه‌زبانه','Public trilingual books','Javne trojezične knjige'))}</span></div><div class="nh7-access-stat"><b>${state.items.length}</b><span>${E(L('موارد مخصوص خادمان','Ministers-only items','Stavke za služitelje'))}</span></div><div class="nh7-access-stat"><b>${state.grants.length}</b><span>${E(L('دسترسی فعال','Active grants','Aktivni pristupi'))}</span></div></div><div class="nh7-access-grid"><div><section class="nh7-access-card"><h3>👥 ${E(L('کاربران تأییدشده','Approved users','Odobreni korisnici'))}</h3><input type="search" data-access-search value="${E(state.search)}" placeholder="${E(L('جست‌وجو با نام یا ایمیل…','Search by name or email…','Pretraži po imenu ili e-mailu…'))}"><div class="nh7-access-users" data-access-users>${userCards()}</div></section></div><div><section class="nh7-access-card"><h3>🔑 ${E(L('دادن دسترسی','Grant access','Odobri pristup'))}</h3>${editor()}</section><section class="nh7-access-card"><h3>📋 ${E(L('دسترسی‌های این حساب','Access for this account','Pristupi ovog računa'))}</h3>${state.selectedUser?grantRows():`<div class="nh7-access-empty">${E(L('ابتدا یک حساب را انتخاب کنید.','Select an account first.','Najprije odaberite račun.'))}</div>`}</section><section class="nh7-access-card"><h3>📚 ${E(L('۹ کتاب عمومی آماده','Nine public books ready','Devet javnih knjiga spremno'))}</h3>${publicBooks()}</section></div></div>`;
}
function render(){if(!modal)return;const body=modal.querySelector('[data-access-body]');if(body)body.innerHTML=bodyHtml()}
function renderUsersOnly(){if(!modal)return;const node=modal.querySelector('[data-access-users]');if(node)node.innerHTML=userCards()}
async function grantAccess(){
  const user=uid(state.selectedUser);if(!user)return toast(L('یک حساب را انتخاب کنید.','Select an account.','Odaberite račun.'),'bad');
  let resource=null;
  if(state.scope!=='library_all'){resource=uid(state.resource);if(!resource)return toast(L('مجموعه یا کتاب را انتخاب کنید.','Select a collection or item.','Odaberite zbirku ili stavku.'),'bad')}
  state.saving=true;render();
  try{
    const expires=state.expires?new Date(state.expires).toISOString():null;
    await rpc('nh7_admin_content_access_grant_v251',{p_user_id:user,p_scope:state.scope,p_resource_id:resource,p_expires_at:expires,p_note:String(state.note||'').slice(0,500)});
    state.note='';state.expires='';state.resource='';
    await loadData(true);
    toast(L('دسترسی با موفقیت فعال شد.','Access was granted successfully.','Pristup je uspješno odobren.'));
  }catch(error){toast(error.message||String(error),'bad')}finally{state.saving=false;render()}
}
async function revokeAccess(id){
  id=uid(id);if(!id)return;
  if(!confirm(L('این دسترسی لغو شود؟','Revoke this access?','Opozvati ovaj pristup?')))return;
  state.saving=true;render();
  try{await rpc('nh7_admin_content_access_revoke_v251',{p_id:id});await loadData(true);toast(L('دسترسی لغو شد.','Access was revoked.','Pristup je opozvan.'))}catch(error){toast(error.message||String(error),'bad')}finally{state.saving=false;render()}
}
function injectEntry(){
  clearTimeout(injectTimer);injectTimer=setTimeout(()=>{
    if(!authorizedEntry())return;
    document.querySelectorAll('.tabs').forEach(nav=>{
      if(nav.querySelector('[data-nh7-library-access-entry]'))return;
      const button=document.createElement('button');button.type='button';button.className='tab nh7-access-tab';button.dataset.nh7LibraryAccessEntry='1';button.textContent='🔐 '+L('دسترسی خادمان','Ministers access','Pristup služitelja');button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openModal()});nav.appendChild(button);
    });
  },80);
}

document.addEventListener('keydown',event=>{if(event.key==='Escape'&&modal)closeModal()},true);
document.querySelector('#langSelect')?.addEventListener('change',()=>{injectEntry();if(modal){modal.querySelector('.nh7-access-modal')?.setAttribute('dir',language()==='fa'?'rtl':'ltr');render()}});
new MutationObserver(injectEntry).observe(document.documentElement,{childList:true,subtree:true});
installStyle();
setInterval(injectEntry,1800);
setTimeout(injectEntry,600);
window.NH7_ADMIN_LIBRARY_ACCESS_V396={open:openModal,refresh:()=>loadData(true),version:VERSION};
})();
