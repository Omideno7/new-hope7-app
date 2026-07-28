/* New Hope 7 Admin v2.3.9 Fix 5 — select an issued document inside the standalone studio */
(()=>{'use strict';
const VERSION='2.3.9-document-select-fix5';
const SELECT_KEY='nh7_doc_selected_certificate_v250';
const REOPEN_KEY='nh7_doc_reopen_studio_v250';
const DESIGN_KEY='nh7_doc_studio_v239';
const CONTACT_KEY='nh7_doc_church_contact_v239_fix1';
const L=(fa,en,hr)=>typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en;
const E=value=>typeof h==='function'?h(value):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let restored=false;
let injecting=false;
function rows(){try{return Array.isArray(state?.schoolCertificates)?state.schoolCertificates:[]}catch(_){return[]}}
function currentId(){try{return String(typeof nh7SelectedCertificateId!=='undefined'&&nh7SelectedCertificateId||sessionStorage.getItem(SELECT_KEY)||'')}catch(_){return String(sessionStorage.getItem(SELECT_KEY)||'')}}
function rowTitle(row){const language=typeof lang!=='undefined'?lang:'fa';return row?.['title_'+language]||row?.title_fa||row?.title_en||row?.title_hr||L('مدرک رسمی','Official document','Službeni dokument')}
function rowLabel(row){const number=row?.certificate_number||L('بدون شماره','No number','Bez broja'),name=row?.user_name||row?.user_email||L('بدون نام','Unnamed','Bez imena'),status=String(row?.status||'draft').toUpperCase();return `${number} — ${name} — ${rowTitle(row)} [${status}]`}
function readDesign(row){
  const raw=row?.design&&typeof row.design==='object'?JSON.parse(JSON.stringify(row.design)):{};
  if(row?.layout&&!raw.orientation)raw.orientation=row.layout;
  if(row?.theme_code&&!raw.theme)raw.theme=row.theme_code;
  if(row?.logo_url){raw.logo=Object.assign({},raw.logo||{},{source:row.logo_url,enabled:true});raw.watermark=Object.assign({},raw.watermark||{},{source:row.logo_url})}
  if(row?.photo_url)raw.photo=Object.assign({},raw.photo||{},{source:row.photo_url,enabled:true});
  if(row?.signature_url)raw.signature=Object.assign({},raw.signature||{},{source:row.signature_url});
  if(row?.church_info&&typeof row.church_info==='object')raw.church=Object.assign({},raw.church||{},row.church_info);
  return raw;
}
function choose(id){
  id=String(id||'').trim();const row=rows().find(x=>String(x.id)===id);if(!row){alert(L('مدرک انتخاب‌شده پیدا نشد. ابتدا فهرست را تازه‌سازی کنید.','The selected document was not found. Refresh the list first.','Odabrani dokument nije pronađen.'));return}
  const design=readDesign(row);try{localStorage.setItem(DESIGN_KEY,JSON.stringify(design));if(design.church)localStorage.setItem(CONTACT_KEY,JSON.stringify(design.church))}catch(_){}
  sessionStorage.setItem(SELECT_KEY,id);sessionStorage.setItem(REOPEN_KEY,'1');
  const url=new URL(location.href);url.searchParams.set('tab','certificates');url.searchParams.set('certificate',id);url.searchParams.set('v',Date.now().toString());location.replace(url.href);
}
function selectionSignature(){return rows().map(row=>`${row.id}:${row.updated_at||row.approved_at||row.created_at||''}`).join('|')+'#'+currentId()}
function selectionHtml(){
  const list=rows().slice().sort((a,b)=>String(b.updated_at||b.approved_at||b.created_at||'').localeCompare(String(a.updated_at||a.approved_at||a.created_at||''))),selected=currentId(),signature=selectionSignature();
  if(!list.length)return `<section class="nh7-f5-cert-select" data-f5-signature="${E(signature)}"><div><strong>📄 ${E(L('انتخاب مدرک برای ویرایش','Choose a document to edit','Odaberite dokument za uređivanje'))}</strong><p>${E(L('هنوز مدرک صادرشده‌ای در فهرست نیست. پنجره را ببندید، مدرک جدید را صادر کنید و سپس دوباره استودیو را باز کنید.','There are no issued documents yet. Close the studio, issue a document, then reopen it.','Još nema izdanih dokumenata.'))}</p></div><button type="button" data-f5-new-document>${E(L('رفتن به فرم صدور مدرک','Go to issue form','Idi na obrazac izdavanja'))}</button></section>`;
  return `<section class="nh7-f5-cert-select" data-f5-signature="${E(signature)}"><div class="nh7-f5-cert-copy"><strong>📄 ${E(L('مدرک موردنظر برای ویرایش','Document to edit','Dokument za uređivanje'))}</strong><p>${E(L('یک مدرک صادرشده را انتخاب و «بارگذاری برای ویرایش» را بزنید. طراحی ذخیره‌شده همان مدرک داخل استودیو باز می‌شود.','Select an issued document and load it for editing.','Odaberite izdani dokument i učitajte ga za uređivanje.'))}</p></div><div class="nh7-f5-cert-actions"><select data-f5-certificate><option value="">${E(L('انتخاب مدرک…','Choose document…','Odaberite dokument…'))}</option>${list.map(row=>`<option value="${E(row.id)}" ${String(row.id)===selected?'selected':''}>${E(rowLabel(row))}</option>`).join('')}</select><button type="button" data-f5-load>${E(L('بارگذاری برای ویرایش','Load for editing','Učitaj za uređivanje'))}</button><button type="button" data-f5-refresh>${E(L('تازه‌سازی فهرست','Refresh list','Osvježi popis'))}</button><button type="button" data-f5-new-document>${E(L('صدور مدرک جدید','Issue new document','Izdaj novi dokument'))}</button></div>${selected?`<small class="nh7-f5-selected">✓ ${E(L('مدرک انتخاب‌شده فعال است. اکنون می‌توانید طراحی را ذخیره کنید.','A document is selected. You can now save the design.','Dokument je odabran.'))}</small>`:''}</section>`;
}
function inject(){
  if(injecting)return;const controls=document.querySelector('.nh7-f4-overlay .nh7-f4-controls');if(!controls)return;const existing=controls.querySelector('.nh7-f5-cert-select'),signature=selectionSignature();if(existing?.dataset.f5Signature===signature)return;injecting=true;
  try{const holder=document.createElement('div');holder.innerHTML=selectionHtml();const next=holder.firstElementChild;if(existing)existing.replaceWith(next);else controls.insertAdjacentElement('afterbegin',next)}finally{injecting=false}
}
function closeAndShowForm(){document.querySelector('[data-f4-close]')?.click();setTimeout(()=>{const target=document.querySelector('.certificate-admin-grid,.doc-v222-official-form,.doc-v222-editor');target?.scrollIntoView({behavior:'smooth',block:'start'})},120)}
async function refreshList(){try{if(typeof loadAll==='function')await loadAll(true);if(typeof render==='function')render()}catch(error){console.warn(error)}setTimeout(inject,250)}
document.addEventListener('click',event=>{
  if(event.target.closest?.('[data-f5-load]')){event.preventDefault();const id=document.querySelector('[data-f5-certificate]')?.value;id?choose(id):alert(L('ابتدا مدرک موردنظر را انتخاب کنید.','Choose a document first.','Najprije odaberite dokument.'));return}
  if(event.target.closest?.('[data-f5-refresh]')){event.preventDefault();refreshList();return}
  if(event.target.closest?.('[data-f5-new-document]')){event.preventDefault();closeAndShowForm()}
},true);
function restoreSelected(){
  if(restored)return;const requested=new URL(location.href).searchParams.get('certificate')||sessionStorage.getItem(SELECT_KEY)||'';if(!requested)return;
  const row=rows().find(x=>String(x.id)===String(requested));if(!row)return;
  restored=true;sessionStorage.setItem(SELECT_KEY,String(row.id));
  try{if(typeof nh7SelectIssuedCertificate==='function')nh7SelectIssuedCertificate(row.id);else if(typeof nh7SelectedCertificateId!=='undefined')nh7SelectedCertificateId=row.id}catch(error){console.warn('Document selection restore',error)}
  if(sessionStorage.getItem(REOPEN_KEY)==='1'){sessionStorage.removeItem(REOPEN_KEY);setTimeout(()=>window.NH7DocumentStudioFix4?.open?.(),350)}
}
const observer=new MutationObserver(()=>{requestAnimationFrame(()=>{inject();restoreSelected()})});observer.observe(document.documentElement,{childList:true,subtree:true});
setInterval(()=>{inject();restoreSelected()},900);
window.NH7_ADMIN_DOCUMENT_SELECT_FIX_VERSION=VERSION;
})();