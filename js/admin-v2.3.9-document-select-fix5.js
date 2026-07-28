/* New Hope 7 Admin v2.3.9 Fix 6 — stable in-place document selection inside studio */
(()=>{'use strict';
const VERSION='2.3.9-document-select-fix6';
const SELECT_KEY='nh7_doc_selected_certificate_v260';
const DESIGN_KEY='nh7_doc_studio_v239';
const CONTACT_KEY='nh7_doc_church_contact_v239_fix1';
const L=(fa,en,hr)=>typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en;
const E=value=>typeof h==='function'?h(value):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let injecting=false,listLoading=false,listAttempted=false,applying=false;
function rows(){try{return Array.isArray(state?.schoolCertificates)?state.schoolCertificates:[]}catch(_){return[]}}
function currentId(){try{return String((typeof nh7SelectedCertificateId!=='undefined'&&nh7SelectedCertificateId)||sessionStorage.getItem(SELECT_KEY)||'')}catch(_){return String(sessionStorage.getItem(SELECT_KEY)||'')}}
function rowTitle(row){const language=typeof lang!=='undefined'?lang:'fa';return row?.['title_'+language]||row?.title_fa||row?.title_en||row?.title_hr||L('مدرک رسمی','Official document','Službeni dokument')}
function rowLabel(row){const number=row?.certificate_number||L('بدون شماره','No number','Bez broja'),name=row?.user_name||row?.user_email||L('بدون نام','Unnamed','Bez imena'),status=String(row?.status||'draft').toUpperCase();return `${number} — ${name} — ${rowTitle(row)} [${status}]`}
function parseObject(value){if(value&&typeof value==='object'&&!Array.isArray(value))return JSON.parse(JSON.stringify(value));try{const out=JSON.parse(String(value||'{}'));return out&&typeof out==='object'?out:{}}catch(_){return{}}}
function readDesign(row){
  const raw=parseObject(row?.design);
  if(row?.layout&&!raw.orientation)raw.orientation=row.layout;
  if(row?.theme_code&&!raw.theme)raw.theme=row.theme_code;
  if(row?.logo_url){raw.logo=Object.assign({},raw.logo||{},{source:row.logo_url,enabled:true});raw.watermark=Object.assign({},raw.watermark||{},{source:row.logo_url})}
  if(row?.photo_url)raw.photo=Object.assign({},raw.photo||{},{source:row.photo_url,enabled:true});
  if(row?.signature_url)raw.signature=Object.assign({},raw.signature||{},{source:row.signature_url});
  if(row?.church_info&&typeof row.church_info==='object')raw.church=Object.assign({},raw.church||{},row.church_info);
  return raw;
}
function pathValue(obj,path){let value=obj;for(const key of String(path||'').split('.')){if(value==null||!Object.prototype.hasOwnProperty.call(Object(value),key))return{found:false,value:null};value=value[key]}return{found:true,value}}
function fire(node,type){node?.dispatchEvent(new Event(type,{bubbles:true}))}
const frame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
async function applyDesignToOpenStudio(design){
  const overlay=document.querySelector('.nh7-f4-overlay');if(!overlay)return;
  applying=true;
  try{
    for(const control of overlay.querySelectorAll('[data-f4-path]')){
      const found=pathValue(design,control.dataset.f4Path);if(!found.found)continue;
      if(control.type==='checkbox')control.checked=!!found.value;else control.value=String(found.value??'');fire(control,'input');
    }
    const styles=design?.styles&&typeof design.styles==='object'?design.styles:{};
    for(const [field,style] of Object.entries(styles)){
      const fieldSelect=overlay.querySelector('[data-f4-field]');if(!fieldSelect||![...fieldSelect.options].some(option=>option.value===field))continue;
      fieldSelect.value=field;fire(fieldSelect,'change');await frame();
      for(const control of overlay.querySelectorAll('[data-f4-style]')){
        const key=control.dataset.f4Style;if(!Object.prototype.hasOwnProperty.call(style||{},key))continue;
        if(control.type==='checkbox')control.checked=!!style[key];else control.value=String(style[key]??'');fire(control,'input');
      }
    }
    const preferred=design.activeField||'title',fieldSelect=overlay.querySelector('[data-f4-field]');
    if(fieldSelect&&[...fieldSelect.options].some(option=>option.value===preferred)){fieldSelect.value=preferred;fire(fieldSelect,'change')}
    window.NH7DocumentStudioFix4?.apply?.();
  }finally{applying=false}
}
function setStatus(text,type='success'){const el=document.querySelector('[data-f4-status]');if(!el)return;el.textContent=text;el.className='nh7-f4-status show '+type;el.scrollIntoView({behavior:'smooth',block:'nearest'})}
async function choose(id){
  id=String(id||'').trim();let row=rows().find(x=>String(x.id)===id);
  if(!row){await loadRows(true);row=rows().find(x=>String(x.id)===id)}
  if(!row){alert(L('مدرک انتخاب‌شده پیدا نشد. فهرست را تازه‌سازی کنید.','The selected document was not found. Refresh the list.','Odabrani dokument nije pronađen.'));return}
  const design=readDesign(row);
  try{localStorage.setItem(DESIGN_KEY,JSON.stringify(design));if(design.church)localStorage.setItem(CONTACT_KEY,JSON.stringify(design.church))}catch(_){}
  sessionStorage.setItem(SELECT_KEY,id);
  try{
    if(typeof nh7SelectedCertificateId!=='undefined')nh7SelectedCertificateId=id;
    if(typeof nh7CertificatePreviewMode!=='undefined')nh7CertificatePreviewMode='issued';
    if(typeof nh7SelectIssuedCertificate==='function')nh7SelectIssuedCertificate(id);
  }catch(error){console.warn('Issued document content selection',error)}
  await frame();await applyDesignToOpenStudio(design);inject(true);
  setStatus(L(`مدرک «${row.user_name||row.user_email||row.certificate_number||''}» بدون خروج از استودیو بارگذاری شد.`,`The selected document was loaded without leaving the studio.`,`Odabrani dokument je učitan bez izlaska iz studija.`),'success');
}
function selectionSignature(){return `${listLoading?'loading':'ready'}#${rows().map(row=>`${row.id}:${row.updated_at||row.approved_at||row.created_at||''}`).join('|')}#${currentId()}`}
function selectionHtml(){
  const list=rows().slice().sort((a,b)=>String(b.updated_at||b.approved_at||b.created_at||'').localeCompare(String(a.updated_at||a.approved_at||a.created_at||''))),selected=currentId(),signature=selectionSignature();
  if(listLoading)return `<section class="nh7-f5-cert-select" data-f5-signature="${E(signature)}"><strong>📄 ${E(L('در حال دریافت فهرست مدارک…','Loading documents…','Učitavanje dokumenata…'))}</strong><div class="nh7-f6-loader"></div></section>`;
  if(!list.length)return `<section class="nh7-f5-cert-select" data-f5-signature="${E(signature)}"><div><strong>📄 ${E(L('انتخاب مدرک برای ویرایش','Choose a document to edit','Odaberite dokument za uređivanje'))}</strong><p>${E(L('در فهرست فعلی مدرکی پیدا نشد. «تازه‌سازی فهرست» را بزنید؛ یا پنجره را ببندید و ابتدا یک مدرک صادر کنید.','No document was found. Refresh the list, or close the studio and issue a document first.','Nema dokumenata. Osvježite popis ili prvo izdajte dokument.'))}</p></div><div class="nh7-f5-cert-actions"><button type="button" data-f5-refresh>${E(L('تازه‌سازی فهرست','Refresh list','Osvježi popis'))}</button><button type="button" data-f5-new-document>${E(L('رفتن به فرم صدور مدرک','Go to issue form','Idi na obrazac izdavanja'))}</button></div></section>`;
  return `<section class="nh7-f5-cert-select" data-f5-signature="${E(signature)}"><div class="nh7-f5-cert-copy"><strong>📄 ${E(L('مدرک موردنظر برای ویرایش','Document to edit','Dokument za uređivanje'))}</strong><p>${E(L('مدرک را انتخاب کنید و «بارگذاری در همین استودیو» را بزنید؛ صفحه دوباره باز نمی‌شود.','Choose a document and load it in this studio; the page will not reload.','Odaberite dokument i učitajte ga bez ponovnog otvaranja stranice.'))}</p></div><div class="nh7-f5-cert-actions"><select data-f5-certificate><option value="">${E(L('انتخاب مدرک…','Choose document…','Odaberite dokument…'))}</option>${list.map(row=>`<option value="${E(row.id)}" ${String(row.id)===selected?'selected':''}>${E(rowLabel(row))}</option>`).join('')}</select><button type="button" data-f5-load>${E(L('بارگذاری در همین استودیو','Load in this studio','Učitaj u ovom studiju'))}</button><button type="button" data-f5-refresh>${E(L('تازه‌سازی فهرست','Refresh list','Osvježi popis'))}</button><button type="button" data-f5-new-document>${E(L('صدور مدرک جدید','Issue new document','Izdaj novi dokument'))}</button></div>${selected?`<small class="nh7-f5-selected">✓ ${E(L('یک مدرک فعال است و ذخیرهٔ طراحی روی همان انجام می‌شود.','A document is active; the design will be saved to it.','Dokument je aktivan.'))}</small>`:''}</section>`;
}
function inject(force=false){
  if(injecting||applying)return;const controls=document.querySelector('.nh7-f4-overlay .nh7-f4-controls');if(!controls)return;
  const existing=controls.querySelector('.nh7-f5-cert-select'),signature=selectionSignature();if(!force&&existing?.dataset.f5Signature===signature)return;
  injecting=true;try{const holder=document.createElement('div');holder.innerHTML=selectionHtml();const next=holder.firstElementChild;if(existing)existing.replaceWith(next);else controls.insertAdjacentElement('afterbegin',next)}finally{injecting=false}
  if(!rows().length&&!listAttempted&&!listLoading)loadRows(false);
}
function closeAndShowForm(){document.querySelector('[data-f4-close]')?.click();setTimeout(()=>{const target=document.querySelector('.certificate-admin-grid,.doc-v222-official-form,.doc-v222-editor');target?.scrollIntoView({behavior:'smooth',block:'start'})},120)}
async function loadRows(force=false){
  if(listLoading||(!force&&listAttempted))return;listLoading=true;listAttempted=true;inject(true);
  try{
    if(typeof authFetch==='function'){
      const result=await authFetch('/rest/v1/school_certificates?select=*&order=updated_at.desc&limit=2000');
      if(Array.isArray(result)&&typeof state!=='undefined')state.schoolCertificates=result;
    }else if(typeof loadAll==='function')await loadAll(true);
  }catch(error){console.warn('Certificate list refresh',error);setStatus(error?.message||String(error),'error')}finally{listLoading=false;inject(true)}
}
document.addEventListener('click',event=>{
  if(event.target.closest?.('[data-f5-load]')){event.preventDefault();event.stopPropagation();const id=document.querySelector('[data-f5-certificate]')?.value;id?choose(id):alert(L('ابتدا مدرک موردنظر را انتخاب کنید.','Choose a document first.','Najprije odaberite dokument.'));return}
  if(event.target.closest?.('[data-f5-refresh]')){event.preventDefault();event.stopPropagation();loadRows(true);return}
  if(event.target.closest?.('[data-f5-new-document]')){event.preventDefault();event.stopPropagation();closeAndShowForm()}
},true);
const observer=new MutationObserver(()=>requestAnimationFrame(()=>inject()));observer.observe(document.documentElement,{childList:true,subtree:true});
setInterval(()=>inject(),1000);setTimeout(()=>inject(true),300);
window.NH7_ADMIN_DOCUMENT_SELECT_FIX_VERSION=VERSION;
})();