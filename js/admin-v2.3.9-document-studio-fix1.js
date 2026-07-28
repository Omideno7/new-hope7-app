/* New Hope 7 Admin v2.3.9 — document studio visibility, stable editing, and official church contact header */
(()=>{'use strict';
const BUILD='2.3.9-document-fix1';
const STORE='nh7_doc_church_contact_v239_fix1';
const L=(fa,en,hr)=>typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en;
const E=value=>typeof h==='function'?h(value):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const DEFAULTS={
  enabled:true,
  useChurchName:true,
  name_fa:'کلیسای امیدنو۷',
  name_en:'NEW HOPE 7 CHURCH',
  name_hr:'CRKVA NEW HOPE 7',
  address:'Lastovska ulica 2A, Zagreb, Croatia',
  email:'omideno7church@gmail.com',
  phone:'+385 91 788 0824',
  website:'omideno7church.com',
  showAddress:true,
  showEmail:true,
  showPhone:true,
  showWebsite:true,
  placement:'header',
  size:10,
  color:'#475569'
};
const clone=value=>JSON.parse(JSON.stringify(value));
function normalize(raw){return Object.assign(clone(DEFAULTS),raw&&typeof raw==='object'?raw:{})}
let contact=(()=>{try{return normalize(JSON.parse(localStorage.getItem(STORE)||'null'))}catch(_){return normalize()}})();
let templatesById=new Map();
let mountScheduled=false;
let baseReloadAttempted=false;

function save(){localStorage.setItem(STORE,JSON.stringify(contact))}
function exportedContact(){return clone(contact)}
function unwrap(value){let out=value;for(let i=0;i<4&&Array.isArray(out)&&out.length===1;i++)out=out[0];return out}
function languageFor(preview){
  try{
    const direct=String(preview?.dataset?.language||'').toLowerCase();if(['fa','en','hr'].includes(direct))return direct;
    if(preview?.getAttribute('dir')==='rtl')return'fa';
    if(typeof certificateLanguage!=='undefined'&&['fa','en','hr'].includes(certificateLanguage))return certificateLanguage;
    if(typeof nh7ManualCert!=='undefined'&&['fa','en','hr'].includes(nh7ManualCert?.language))return nh7ManualCert.language;
    return typeof lang!=='undefined'&&['fa','en','hr'].includes(lang)?lang:'en';
  }catch(_){return'fa'}
}
function localizedName(l){return contact['name_'+l]||contact.name_en||contact.name_fa||'NEW HOPE 7 CHURCH'}
function contactParts(){
  const parts=[];
  if(contact.showAddress&&String(contact.address||'').trim())parts.push({type:'address',value:String(contact.address).trim()});
  if(contact.showEmail&&String(contact.email||'').trim())parts.push({type:'email',value:String(contact.email).trim()});
  if(contact.showPhone&&String(contact.phone||'').trim())parts.push({type:'phone',value:String(contact.phone).trim()});
  if(contact.showWebsite&&String(contact.website||'').trim())parts.push({type:'website',value:String(contact.website).trim()});
  return parts;
}
function blockHtml(){return contactParts().map(part=>`<span class="nh7-v239-contact-${part.type}"><bdi dir="ltr">${E(part.value)}</bdi></span>`).join('<i aria-hidden="true">•</i>')}
function applyContact(root=document){
  root.querySelectorAll?.('.certificate-preview').forEach(preview=>{
    const l=languageFor(preview),kicker=preview.querySelector('.certificate-kicker');
    if(kicker&&contact.useChurchName){const name=localizedName(l);if(kicker.textContent!==name)kicker.textContent=name}
    let block=preview.querySelector('.nh7-v239-church-contact');
    if(!contact.enabled||!contactParts().length){block?.remove();return}
    if(!block){block=document.createElement('div');block.className='nh7-v239-church-contact'}
    block.dataset.placement=contact.placement||'header';
    block.dir=l==='fa'?'rtl':'ltr';
    block.style.fontSize=`${Math.max(7,Math.min(18,N(contact.size,10)))}px`;
    block.style.color=contact.color||'#475569';
    const html=blockHtml();if(block.innerHTML!==html)block.innerHTML=html;
    if((contact.placement||'header')==='footer'){
      const meta=preview.querySelector('.certificate-meta');
      if(meta){if(block.parentElement!==preview||block.nextElementSibling!==meta)preview.insertBefore(block,meta)}
      else if(block.parentElement!==preview||preview.lastElementChild!==block)preview.appendChild(block);
    }else if(kicker){
      if(block.parentElement!==preview||block.previousElementSibling!==kicker)kicker.insertAdjacentElement('afterend',block);
    }else if(block.parentElement!==preview||preview.firstElementChild!==block){
      preview.prepend(block);
    }
  });
}
function panelHtml(){
  return `<details open class="nh7-v239-contact-editor"><summary>🏛 <strong>${E(L('اطلاعات رسمی کلیسا در سربرگ','Official church contact header','Službeni podaci crkve u zaglavlju'))}</strong></summary>
    <div class="nh7-v239-contact-note">${E(L('این اطلاعات بدون تازه‌سازی صفحه ذخیره می‌شوند؛ هنگام تایپ، فیلد بسته نمی‌شود و صفحه به ابتدای مدارک برنمی‌گردد.','These fields save without reloading the page, so typing will not close the field or jump to the top.','Polja se spremaju bez ponovnog učitavanja stranice.'))}</div>
    <div class="nh7-v239-contact-grid">
      <label>${E(L('نام کلیسا — فارسی','Church name — Persian','Naziv crkve — perzijski'))}<input data-nh7-contact="name_fa" value="${E(contact.name_fa)}"></label>
      <label>${E(L('نام کلیسا — انگلیسی','Church name — English','Naziv crkve — engleski'))}<input data-nh7-contact="name_en" value="${E(contact.name_en)}"></label>
      <label>${E(L('نام کلیسا — کرواتی','Church name — Croatian','Naziv crkve — hrvatski'))}<input data-nh7-contact="name_hr" value="${E(contact.name_hr)}"></label>
      <label class="nh7-v239-contact-wide">${E(L('آدرس کلیسا','Church address','Adresa crkve'))}<input data-nh7-contact="address" value="${E(contact.address)}"></label>
      <label>${E(L('ایمیل کلیسا','Church email','E-mail crkve'))}<input class="ltr" type="email" data-nh7-contact="email" value="${E(contact.email)}"></label>
      <label>${E(L('شماره تلفن کلیسا','Church phone','Telefon crkve'))}<input class="ltr" type="tel" data-nh7-contact="phone" value="${E(contact.phone)}"></label>
      <label>${E(L('وب‌سایت کلیسا','Church website','Web-stranica crkve'))}<input class="ltr" data-nh7-contact="website" value="${E(contact.website)}"></label>
      <label>${E(L('محل نمایش','Placement','Položaj'))}<select data-nh7-contact="placement"><option value="header" ${contact.placement==='header'?'selected':''}>${E(L('زیر نام کلیسا در سربرگ','Below church name','Ispod naziva crkve'))}</option><option value="footer" ${contact.placement==='footer'?'selected':''}>${E(L('بالای شماره سند','Above document number','Iznad broja dokumenta'))}</option></select></label>
      <label>${E(L('اندازه اطلاعات تماس','Contact font size','Veličina podataka'))}<input type="range" min="7" max="18" data-nh7-contact-number="size" value="${N(contact.size,10)}"></label>
      <label>${E(L('رنگ اطلاعات تماس','Contact color','Boja podataka'))}<input type="color" data-nh7-contact="color" value="${E(contact.color||'#475569')}"></label>
    </div>
    <div class="nh7-v239-contact-checks">
      <label><input type="checkbox" data-nh7-contact-bool="enabled" ${contact.enabled?'checked':''}> ${E(L('نمایش اطلاعات تماس','Show contact information','Prikaži podatke'))}</label>
      <label><input type="checkbox" data-nh7-contact-bool="useChurchName" ${contact.useChurchName?'checked':''}> ${E(L('استفاده از نام کلیسای بالا','Use church name above','Koristi naziv crkve'))}</label>
      <label><input type="checkbox" data-nh7-contact-bool="showAddress" ${contact.showAddress?'checked':''}> ${E(L('آدرس','Address','Adresa'))}</label>
      <label><input type="checkbox" data-nh7-contact-bool="showEmail" ${contact.showEmail?'checked':''}> Email</label>
      <label><input type="checkbox" data-nh7-contact-bool="showPhone" ${contact.showPhone?'checked':''}> ${E(L('تلفن','Phone','Telefon'))}</label>
      <label><input type="checkbox" data-nh7-contact-bool="showWebsite" ${contact.showWebsite?'checked':''}> Website</label>
    </div>
    <div class="actions"><button type="button" class="btn secondary" data-nh7-contact-reset>↺ ${E(L('بازنشانی اطلاعات رسمی کلیسا','Reset church contact details','Vrati podatke crkve'))}</button></div>
  </details>`;
}
function mountPanel(){
  wrapStudioApi();
  const studio=document.querySelector('.nh7-doc-studio-v239');
  if(!studio){
    if(typeof activeTab!=='undefined'&&activeTab==='certificates'&&window.NH7Doc239&&typeof render==='function'&&!document.documentElement.dataset.nh7DocForceRenderFix1){
      document.documentElement.dataset.nh7DocForceRenderFix1='1';setTimeout(()=>{try{render()}catch(_){}},0);
    }
    applyContact();return;
  }
  if(!studio.querySelector('.nh7-v239-contact-editor')){
    const head=studio.querySelector(':scope > .req-head');
    if(head)head.insertAdjacentHTML('afterend',panelHtml());else studio.insertAdjacentHTML('afterbegin',panelHtml());
  }
  applyContact();
  const badge=document.querySelector('.nh7-admin-version-v235');if(badge&&badge.textContent!=='v2.3.9')badge.textContent='v2.3.9';
}
function scheduleMount(){if(mountScheduled)return;mountScheduled=true;requestAnimationFrame(()=>{mountScheduled=false;mountPanel()})}
function updateValue(key,value){contact[key]=value;save();applyContact()}

document.addEventListener('input',event=>{
  const text=event.target.closest?.('[data-nh7-contact]');if(text){updateValue(text.dataset.nh7Contact,text.value);return}
  const number=event.target.closest?.('[data-nh7-contact-number]');if(number){updateValue(number.dataset.nh7ContactNumber,N(number.value));return}
},true);
document.addEventListener('change',event=>{
  const bool=event.target.closest?.('[data-nh7-contact-bool]');if(bool){updateValue(bool.dataset.nh7ContactBool,!!bool.checked);return}
  const field=event.target.closest?.('[data-nh7-contact]');if(field)updateValue(field.dataset.nh7Contact,field.value);
},true);
document.addEventListener('click',event=>{
  if(!event.target.closest?.('[data-nh7-contact-reset]'))return;
  event.preventDefault();
  if(!confirm(L('اطلاعات رسمی کلیسا به مقدار پیش‌فرض بازگردد؟','Reset the official church contact details?','Vratiti službene podatke crkve?')))return;
  contact=normalize();save();document.querySelector('.nh7-v239-contact-editor')?.remove();scheduleMount();
},true);

function isCertificateTextInput(el){
  if(!el||!el.matches?.('input:not([type="range"]):not([type="color"]):not([type="file"]):not([type="checkbox"]),textarea'))return false;
  return !!el.closest('.certificate-admin-grid,.nh7-doc-studio-v239');
}
function captureEditing(){
  const el=document.activeElement;if(!isCertificateTextInput(el))return null;
  const values={};document.querySelectorAll('.certificate-admin-grid input[id],.certificate-admin-grid textarea[id],.nh7-doc-studio-v239 input[id],.nh7-doc-studio-v239 textarea[id],[data-nh7-contact]').forEach(node=>{const key=node.id||('contact:'+node.dataset.nh7Contact);if(key)values[key]=node.value});
  let start=null,end=null;try{start=el.selectionStart;end=el.selectionEnd}catch(_){}
  return{key:el.id||('contact:'+el.dataset.nh7Contact),values,start,end,scrollX:window.scrollX,scrollY:window.scrollY};
}
function restoreEditing(snapshot){
  if(!snapshot)return;
  for(const [key,value] of Object.entries(snapshot.values||{})){
    const node=key.startsWith('contact:')?document.querySelector(`[data-nh7-contact="${CSS.escape(key.slice(8))}"]`):document.getElementById(key);
    if(node&&node.value!==value)node.value=value;
  }
  const el=snapshot.key?.startsWith('contact:')?document.querySelector(`[data-nh7-contact="${CSS.escape(snapshot.key.slice(8))}"]`):document.getElementById(snapshot.key||'');
  if(el){try{el.focus({preventScroll:true});if(snapshot.start!=null&&typeof el.setSelectionRange==='function')el.setSelectionRange(snapshot.start,snapshot.end)}catch(_){}}
  window.scrollTo(snapshot.scrollX||0,snapshot.scrollY||0);
}

if(typeof render==='function'&&!render.__nh7DocFix1){
  const previousRender=render;
  const wrapped=function(...args){const editing=captureEditing(),result=previousRender.apply(this,args);requestAnimationFrame(()=>{scheduleMount();restoreEditing(editing)});return result};
  wrapped.__nh7DocFix1=true;render=wrapped;
}
if(typeof loadAll==='function'&&!loadAll.__nh7DocFix1){
  const previousLoadAll=loadAll;
  const wrapped=async function(silent=false,...args){if(silent&&isCertificateTextInput(document.activeElement))return null;return previousLoadAll.call(this,silent,...args)};
  wrapped.__nh7DocFix1=true;loadAll=wrapped;
}
if(typeof adminRpc==='function'&&!adminRpc.__nh7DocFix1){
  const previousRpc=adminRpc;
  const wrapped=async function(name,payload={}){
    let next=payload;
    if((name==='nh7_admin_save_certificate_design_v239'||name==='nh7_admin_save_document_template_v239')&&payload?.p_design){
      let d=payload.p_design;try{if(typeof d==='string')d=JSON.parse(d)}catch(_){d={}}
      d=Object.assign({},d,{church:exportedContact()});next=Object.assign({},payload,{p_design:d});
    }
    const result=await previousRpc.call(this,name,next);
    if(name==='nh7_admin_list_document_templates_v239'){
      const data=unwrap(result),rows=Array.isArray(data)?data:Array.isArray(data?.rows)?data.rows:[];templatesById=new Map(rows.map(row=>[String(row.id),row]));
    }
    return result;
  };
  wrapped.__nh7DocFix1=true;adminRpc=wrapped;
}
function adoptChurch(raw){if(!raw||typeof raw!=='object')return;contact=normalize(Object.assign({},contact,raw));save()}
function selectedIssuedRow(){try{const id=String(typeof nh7SelectedCertificateId!=='undefined'?nh7SelectedCertificateId:'');return(state.schoolCertificates||[]).find(row=>String(row.id)===id)||null}catch(_){return null}}
if(typeof nh7SelectIssuedCertificate==='function'&&!nh7SelectIssuedCertificate.__nh7DocFix1){
  const previousSelect=nh7SelectIssuedCertificate;
  const wrapped=function(id){try{const row=(state.schoolCertificates||[]).find(x=>String(x.id)===String(id));adoptChurch(row?.design?.church)}catch(_){}const result=previousSelect.apply(this,arguments);scheduleMount();return result};
  wrapped.__nh7DocFix1=true;nh7SelectIssuedCertificate=wrapped;
}
function wrapStudioApi(){
  const api=window.NH7Doc239;if(!api||api.__nh7ContactFix1)return;
  if(typeof api.loadIssued==='function'){const old=api.loadIssued;api.loadIssued=function(){adoptChurch(selectedIssuedRow()?.design?.church);const result=old.apply(this,arguments);scheduleMount();return result}}
  if(typeof api.loadTemplate==='function'){const old=api.loadTemplate;api.loadTemplate=function(){const id=document.getElementById('nh7-v239-template-select')?.value,row=templatesById.get(String(id));adoptChurch(row?.design?.church);const result=old.apply(this,arguments);scheduleMount();return result}}
  api.__nh7ContactFix1=true;
}
function ensureBaseStudio(){
  if(window.NH7Doc239){scheduleMount();return}
  if(baseReloadAttempted)return;baseReloadAttempted=true;
  const script=document.createElement('script');script.src=`js/admin-v2.3.9-document-studio.js?v=${encodeURIComponent(BUILD)}-${Date.now()}`;script.onload=()=>{try{render()}catch(_){}scheduleMount()};script.onerror=()=>console.error('New Hope 7 document studio base failed to load');document.body.appendChild(script);
}
const observer=new MutationObserver(scheduleMount);observer.observe(document.documentElement,{childList:true,subtree:true});
setTimeout(()=>{
  ensureBaseStudio();
  const requested=new URL(location.href).searchParams.get('tab');
  if(requested==='certificates'&&typeof activeTab!=='undefined'&&activeTab!=='certificates'&&typeof setTab==='function')setTab('certificates');else scheduleMount();
},120);
window.NH7_ADMIN_DOCUMENT_FIX_VERSION=BUILD;
})();