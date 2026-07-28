/* New Hope 7 Admin v2.3.9 Fix 7 — one stable inline document workspace */
(()=>{'use strict';
const VERSION='2.3.9-document-clean-v270';
const L=(fa,en,hr)=>typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en;
const E=value=>typeof h==='function'?h(value):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let scheduled=false;
function rows(){try{return Array.isArray(state?.schoolCertificates)?state.schoolCertificates.slice():[]}catch(_){return[]}}
function selectedId(){try{return String(typeof nh7SelectedCertificateId!=='undefined'?nh7SelectedCertificateId:'')}catch(_){return''}}
function title(row){const l=typeof lang!=='undefined'?lang:'fa';return row?.['title_'+l]||row?.title_fa||row?.title_en||row?.title_hr||row?.certificate_type||L('مدرک رسمی','Official document','Službeni dokument')}
function removeObsolete(){
  document.querySelectorAll('.nh7-f4-fab,.nh7-f4-card,.nh7-f4-overlay,.nh7-f5-cert-select').forEach(node=>node.remove());
  document.body.classList.remove('nh7-f4-open');
}
function loadDocument(id){
  id=String(id||'').trim();if(!id){alert(L('ابتدا مدرک را انتخاب کنید.','Choose a document first.','Najprije odaberite dokument.'));return}
  try{
    if(typeof nh7SelectedCertificateId!=='undefined')nh7SelectedCertificateId=id;
    if(typeof nh7SelectIssuedCertificate==='function')nh7SelectIssuedCertificate(id);
    else if(typeof selectIssuedDocumentV220==='function')selectIssuedDocumentV220(id);
    setTimeout(()=>{try{window.NH7Doc239?.loadIssued?.()}catch(_){};mount()},80);
  }catch(error){alert(error?.message||String(error))}
}
function options(){
  const selected=selectedId();return rows().sort((a,b)=>String(b.updated_at||b.approved_at||b.created_at||'').localeCompare(String(a.updated_at||a.approved_at||a.created_at||''))).map(row=>`<option value="${E(row.id)}" ${String(row.id)===selected?'selected':''}>${E((row.certificate_number||L('بدون شماره','No number','Bez broja'))+' — '+(row.user_name||row.user_email||L('بدون نام','Unnamed','Bez imena'))+' — '+title(row))}</option>`).join('')
}
function workflowHtml(){
  const list=options();return `<section class="nh7-doc-clean-v270" data-nh7-doc-clean>
    <div class="nh7-doc-clean-copy"><h2>📜 ${E(L('مدارک — استودیوی کامل','Documents — complete studio','Dokumenti — cijeli studio'))}</h2><p>${E(L('این صفحه سه کار را یکجا انجام می‌دهد: اطلاعات مدرک و گیرنده را در فرم پایین وارد می‌کنید، ظاهر را در استودیو طراحی می‌کنید و سپس همان مدرک را صادر یا ذخیره می‌کنید. هر تغییری که روی مدرک انتخاب‌شده ذخیره شود، در پرونده مدارک و لینک معتبر همان مدرک اعمال می‌شود.','This page combines content, design and issuance. Enter the recipient and document text below, design it in the studio, then issue or save it. A design saved to the selected document is used by that issued record and its verified link.','Ova stranica objedinjuje sadržaj, dizajn i izdavanje dokumenta.'))}</p></div>
    <div class="nh7-doc-clean-actions"><label>${E(L('مدرک صادرشده برای طراحی','Issued document to design','Izdani dokument za dizajn'))}<select data-nh7-doc-select><option value="">${E(L('انتخاب مدرک…','Choose document…','Odaberite dokument…'))}</option>${list}</select></label><button type="button" class="btn primary" data-nh7-doc-load>↥ ${E(L('بارگذاری در همین صفحه','Load on this page','Učitaj na ovoj stranici'))}</button><button type="button" class="btn secondary" data-nh7-doc-form>＋ ${E(L('اطلاعات و صدور مدرک جدید','New document details and issue','Novi dokument'))}</button></div>
    <div class="nh7-doc-clean-steps"><span><b>۱</b>${E(L('اطلاعات و متن','Content','Sadržaj'))}</span><i>←</i><span><b>۲</b>${E(L('طراحی در استودیو','Design','Dizajn'))}</span><i>←</i><span><b>۳</b>${E(L('ذخیره یا صدور','Save / issue','Spremi / izdaj'))}</span></div>
  </section>`
}
function mount(){
  removeObsolete();
  try{if(typeof activeTab!=='undefined'&&activeTab!=='certificates')return}catch(_){return}
  const studio=document.querySelector('.nh7-doc-studio-v239');if(!studio)return;
  if(!document.querySelector('[data-nh7-doc-clean]'))studio.insertAdjacentHTML('beforebegin',workflowHtml());
  const badge=document.querySelector('.nh7-admin-version-v235');if(badge)badge.textContent='v2.3.9 FIX 7';
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount()})}
document.addEventListener('click',event=>{
  const load=event.target.closest?.('[data-nh7-doc-load]');if(load){event.preventDefault();loadDocument(document.querySelector('[data-nh7-doc-select]')?.value);return}
  const form=event.target.closest?.('[data-nh7-doc-form]');if(form){event.preventDefault();const target=document.querySelector('.certificate-admin-grid,.document-admin-grid,.doc-v222-official-form,.doc-v222-editor');target?.scrollIntoView({behavior:'smooth',block:'start'})}
},true);
const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});
setInterval(()=>{removeObsolete();mount()},1800);setTimeout(schedule,250);
window.NH7_ADMIN_DOCUMENT_CLEAN_VERSION=VERSION;
})();