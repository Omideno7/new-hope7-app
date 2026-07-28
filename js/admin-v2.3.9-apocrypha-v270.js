/* New Hope 7 Admin — dynamic Apocrypha catalogue v2.7.0 */
(()=>{'use strict';
const VERSION='2.7.0-apocrypha-admin';
const L=(fa,en,hr)=>typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en;
const E=value=>typeof h==='function'?h(value):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
state.apocryphaV270=state.apocryphaV270||{books:[],loading:false,error:''};
let draft=fresh(),scheduled=false,lastSignature='';
function fresh(){return{id:'',book_code:'',title_fa:'',title_en:'',title_hr:'',description_fa:'',description_en:'',description_hr:'',sort_order:100}}
function books(){return Array.isArray(state.apocryphaV270?.books)?state.apocryphaV270.books:[]}
function localized(row){return row?.['title_'+(typeof lang!=='undefined'?lang:'fa')]||row?.title_fa||row?.title_en||row?.title_hr||row?.book_code||'-'}
function slug(value){return String(value||'').trim().toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80)}
async function load(redraw=false){
  if(state.apocryphaV270.loading||typeof token==='undefined'||!token)return;
  state.apocryphaV270.loading=true;state.apocryphaV270.error='';if(redraw&&typeof render==='function')render();
  try{const raw=await adminRpc('nh7_admin_apocrypha_dashboard_v270',{}),data=Array.isArray(raw)?raw[0]:raw;state.apocryphaV270={books:Array.isArray(data?.books)?data.books:[],loading:false,error:''}}
  catch(error){state.apocryphaV270={books:[],loading:false,error:error?.message||String(error)}}
  if(redraw&&typeof render==='function')render();else schedule();
}
function formHtml(){return `<div class="nh7-apo-form-v270"><div class="grid3"><label>${E(L('کد کتاب','Book code','Kod knjige'))}<input data-apo-field="book_code" value="${E(draft.book_code)}" placeholder="example_book"></label><label>${E(L('ترتیب نمایش','Sort order','Redoslijed'))}<input data-apo-field="sort_order" type="number" value="${N(draft.sort_order,100)}"></label><span></span></div><div class="grid3"><input data-apo-field="title_fa" value="${E(draft.title_fa)}" placeholder="عنوان فارسی"><input data-apo-field="title_en" value="${E(draft.title_en)}" placeholder="English title"><input data-apo-field="title_hr" value="${E(draft.title_hr)}" placeholder="Hrvatski naslov"></div><div class="grid3"><textarea data-apo-field="description_fa" placeholder="توضیح فارسی">${E(draft.description_fa)}</textarea><textarea data-apo-field="description_en" placeholder="English description">${E(draft.description_en)}</textarea><textarea data-apo-field="description_hr" placeholder="Hrvatski opis">${E(draft.description_hr)}</textarea></div><div class="actions"><button type="button" class="btn primary" data-apo-save>✓ ${E(draft.id?L('ذخیره تغییرات','Save changes','Spremi promjene'):L('افزودن کتاب','Add book','Dodaj knjigu'))}</button><button type="button" class="btn ghost" data-apo-reset>${E(L('فرم جدید','New form','Novi obrazac'))}</button></div></div>`}
function listHtml(){return `<div class="nh7-apo-list-v270">${books().map(row=>`<article><div><strong>${E(localized(row))}</strong><small>${E(row.book_code)} · #${N(row.sort_order,100)}</small></div><div><button type="button" class="btn secondary" data-apo-edit="${E(row.id)}">✎ ${E(L('ویرایش','Edit','Uredi'))}</button><button type="button" class="btn danger-btn" data-apo-disable="${E(row.id)}">× ${E(L('حذف از فهرست','Remove from list','Ukloni'))}</button></div></article>`).join('')||`<p class="muted">${E(L('کتابی ثبت نشده است.','No books have been added.','Nema knjiga.'))}</p>`}</div>`}
function managerHtml(){return `<details class="nh7-apo-manager-v270" data-apo-manager><summary>📚 <strong>${E(L('مدیریت کامل کتاب‌های اپوکریفا','Manage the complete Apocrypha catalogue','Upravljanje katalogom apokrifa'))}</strong> <small>${books().length}</small></summary><p class="muted small">${E(L('این فهرست ثابت نیست. هر کتابی را با عنوان فارسی، انگلیسی و کرواتی اضافه کنید؛ سپس هنگام بارگذاری فایل اپوکریفا همان کتاب در انتخاب‌گر ظاهر می‌شود. حذف از فهرست، فایل‌های قبلی را پاک نمی‌کند.','This catalogue is dynamic. Add any book in Persian, English and Croatian; it will then appear in the Apocrypha upload selector. Removing a book does not delete existing files.','Katalog je dinamičan. Dodajte bilo koju knjigu i ona će se pojaviti pri prijenosu.'))}</p>${state.apocryphaV270.error?`<div class="notice">${E(state.apocryphaV270.error)}</div>`:''}${formHtml()}${listHtml()}</details>`}
function updateSelector(){
  const select=document.querySelector('#nh7_library_editor_v224 select[onchange*="apocrypha_book"]');if(!select)return;
  const current=select.value||'';const list=books();
  select.innerHTML=`<option value="">— ${E(L('انتخاب کتاب','Choose book','Odaberite knjigu'))} —</option>`+list.map(row=>`<option value="${E(row.book_code)}">${E(localized(row))}</option>`).join('');
  if(current&&!list.some(row=>String(row.book_code)===String(current))){const option=document.createElement('option');option.value=current;option.textContent=current;select.appendChild(option)}
  select.value=current;
}
function mount(){
  try{if(typeof activeTab==='undefined'||activeTab!=='library')return}catch(_){return}
  const editor=document.getElementById('nh7_library_editor_v224');if(!editor)return;
  const signature=books().map(x=>`${x.id}:${x.updated_at||''}`).join('|')+'#'+draft.id+'#'+state.apocryphaV270.loading;
  const existing=document.querySelector('[data-apo-manager]');
  if(!existing){editor.insertAdjacentHTML('beforebegin',managerHtml());lastSignature=signature}
  else if(signature!==lastSignature){const holder=document.createElement('div');holder.innerHTML=managerHtml();existing.replaceWith(holder.firstElementChild);lastSignature=signature}
  updateSelector();
  if(!books().length&&!state.apocryphaV270.loading)load(false);
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount()})}
async function saveDraft(){
  if(!draft.book_code)draft.book_code=slug(draft.title_en)||('book_'+Date.now());
  try{await adminRpc('nh7_admin_apocrypha_save_v270',{p_item:draft});draft=fresh();await load(false);mount();alert(L('کتاب اپوکریفا ذخیره شد.','Apocrypha book saved.','Apokrifna knjiga je spremljena.'))}catch(error){alert(error?.message||String(error))}
}
document.addEventListener('input',event=>{const field=event.target.closest?.('[data-apo-field]');if(!field)return;draft[field.dataset.apoField]=field.type==='number'?N(field.value,100):field.value;if(field.dataset.apoField==='title_en'&&!draft.id&&!draft.book_code)draft.book_code=slug(field.value)},true);
document.addEventListener('click',event=>{
  if(event.target.closest?.('[data-apo-save]')){event.preventDefault();saveDraft();return}
  if(event.target.closest?.('[data-apo-reset]')){event.preventDefault();draft=fresh();lastSignature='';mount();return}
  const edit=event.target.closest?.('[data-apo-edit]');if(edit){event.preventDefault();const row=books().find(x=>String(x.id)===String(edit.dataset.apoEdit));if(row){draft=Object.assign(fresh(),row);lastSignature='';mount();setTimeout(()=>document.querySelector('.nh7-apo-form-v270')?.scrollIntoView({behavior:'smooth',block:'center'}),50)}return}
  const disable=event.target.closest?.('[data-apo-disable]');if(disable){event.preventDefault();if(!confirm(L('این کتاب از فهرست انتخاب حذف شود؟ فایل‌های آپلودشده پاک نمی‌شوند.','Remove this book from the selector? Uploaded files will not be deleted.','Ukloniti knjigu iz popisa? Datoteke se neće izbrisati.')))return;adminRpc('nh7_admin_apocrypha_disable_v270',{p_id:disable.dataset.apoDisable}).then(()=>load(true)).catch(error=>alert(error?.message||String(error)))}
},true);
const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});
const previousLoadAll=typeof loadAll==='function'?loadAll:null;if(previousLoadAll){loadAll=async function(...args){const result=await previousLoadAll.apply(this,args);if(typeof token!=='undefined'&&token)await load(false);return result}}
setTimeout(()=>{if(typeof token!=='undefined'&&token)load(false);schedule()},350);
window.NH7_ADMIN_APOCRYPHA_VERSION=VERSION;
})();