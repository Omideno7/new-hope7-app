/* New Hope 7 Admin — PDF to in-app text reader v2.5.0 */
(()=>{'use strict';
const VERSION='2.5.0-library-text-admin';
const PDFJS_URL='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs';
const PDFJS_WORKER='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
const L=(fa,en,hr)=>typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en;
const E=value=>typeof h==='function'?h(value):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let pdfjsPromise=null,lastFile=null,busy=false,mounting=false;
let reader={enabled:false,mode:'both',language:'fa',status:'none',pageCount:0,text:'',pages:[],all:{},fileName:'',message:''};
function fresh(){return{enabled:false,mode:'both',language:typeof lang!=='undefined'&&['fa','en','hr'].includes(lang)?lang:'fa',status:'none',pageCount:0,text:'',pages:[],all:{},fileName:'',message:''}}
function parseObject(value){if(value&&typeof value==='object'&&!Array.isArray(value))return JSON.parse(JSON.stringify(value));try{const x=JSON.parse(String(value||'{}'));return x&&typeof x==='object'?x:{}}catch(_){return{}}}
function languagePayload(all,language){const raw=all?.[language];if(typeof raw==='string')return{text:raw,pages:[]};if(raw&&typeof raw==='object')return{text:String(raw.text||''),pages:Array.isArray(raw.pages)?raw.pages:[]};return{text:'',pages:[]}}
function loadRow(row){
  if(!row){reader=fresh();return}
  const all=parseObject(row.reader_text),language=['fa','en','hr'].includes(row.reader_language)?row.reader_language:'fa',payload=languagePayload(all,language);
  reader={enabled:['text','both'].includes(String(row.reader_mode||'')),mode:['text','both'].includes(String(row.reader_mode||''))?String(row.reader_mode):'both',language,status:String(row.reader_status||'none'),pageCount:Number(row.reader_page_count||payload.pages.length||0),text:payload.text,pages:payload.pages,all,fileName:String(row.file_name||''),message:''};
}
function currentRows(){try{return Array.isArray(state?.libraryV224?.items)?state.libraryV224.items:[]}catch(_){return[]}}
function statusText(){
  if(busy)return L('در حال استخراج متن از فایل…','Extracting text from the file…','Izdvajanje teksta iz datoteke…');
  if(reader.status==='ready')return L(`متن آماده است؛ ${reader.pageCount} صفحه و ${reader.text.trim().length} نویسه استخراج شده است.`,`Text is ready: ${reader.pageCount} pages and ${reader.text.trim().length} characters.`,`Tekst je spreman: ${reader.pageCount} stranica.`);
  if(reader.status==='needs_ocr')return L('این PDF بیشتر اسکن یا تصویر است و متن کافی داخل آن پیدا نشد. می‌توانید متن اصلاح‌شده را در کادر پایین وارد کنید؛ OCR خودکار اسکن‌ها در مرحله بعد اضافه می‌شود.','This PDF appears to be scanned/image-based. Enter corrected text below; automatic OCR for scans is a separate next step.','PDF je skeniran. Unesite ispravljeni tekst ispod.');
  if(reader.status==='error')return reader.message||L('استخراج متن انجام نشد.','Text extraction failed.','Izdvajanje teksta nije uspjelo.');
  return L('با فعال‌کردن این گزینه، PDF اصلی حفظ می‌شود و نسخهٔ متنی برای مطالعه داخل اپ نیز ساخته می‌شود.','Enable this to keep the original PDF and also create an in-app reading version.','Izvorni PDF ostaje sačuvan, a izrađuje se i tekst za čitanje u aplikaciji.');
}
function panelHtml(){return `<section class="nh7-reader-admin-v250"><div class="nh7-reader-head"><div><strong>📖 ${E(L('تبدیل PDF به نوشته داخل اپ','Convert PDF to in-app text','Pretvori PDF u tekst u aplikaciji'))}</strong><p>${E(L('برای PDFهای متنی، نوشته صفحه‌به‌صفحه استخراج می‌شود. فایل اصلی PDF نیز حذف نمی‌شود.','For text-based PDFs, page text is extracted while the original PDF remains available.','Tekst se izdvaja po stranicama, a izvorni PDF ostaje dostupan.'))}</p></div><label class="nh7-reader-switch"><input type="checkbox" data-reader-enabled ${reader.enabled?'checked':''}> ${E(L('فعال','Enabled','Omogućeno'))}</label></div><div class="nh7-reader-grid"><label>${E(L('روش نمایش در اپ','Display in app','Prikaz u aplikaciji'))}<select data-reader-mode ${reader.enabled?'':'disabled'}><option value="both" ${reader.mode==='both'?'selected':''}>${E(L('نوشته + PDF اصلی','Text + original PDF','Tekst + izvorni PDF'))}</option><option value="text" ${reader.mode==='text'?'selected':''}>${E(L('فقط نوشته داخل اپ','In-app text only','Samo tekst'))}</option></select></label><label>${E(L('زبان متن','Text language','Jezik teksta'))}<select data-reader-language ${reader.enabled?'':'disabled'}><option value="fa" ${reader.language==='fa'?'selected':''}>فارسی</option><option value="en" ${reader.language==='en'?'selected':''}>English</option><option value="hr" ${reader.language==='hr'?'selected':''}>Hrvatski</option></select></label><button type="button" data-reader-extract ${reader.enabled&&lastFile&&!busy?'':'disabled'}>${E(L('استخراج دوباره از فایل انتخاب‌شده','Extract again from selected file','Ponovno izdvoji tekst'))}</button></div><div class="nh7-reader-status ${E(reader.status)}">${E(statusText())}</div><label class="nh7-reader-text-label">${E(L('متن قابل ویرایش قبل از انتشار','Editable text before publishing','Tekst koji se može urediti prije objave'))}<textarea data-reader-text ${reader.enabled?'':'disabled'} placeholder="${E(L('متن استخراج‌شده اینجا نمایش داده می‌شود و می‌توانید آن را اصلاح کنید.','Extracted text appears here and can be corrected.','Izdvojeni tekst pojavit će se ovdje.'))}">${E(reader.text)}</textarea></label><small>${E(L('نکته: PDF اسکن‌شده بدون لایه متن، برای تبدیل دقیق به OCR نیاز دارد. در این نسخه تشخیص داده می‌شود ولی OCR سنگین خودکار هنوز اجرا نمی‌شود.','Scanned PDFs without a text layer require OCR. This version detects them but does not yet run heavy automatic OCR.','Skenirani PDF bez tekstualnog sloja zahtijeva OCR.'))}</small></section>`}
function mount(){
  if(mounting)return;const editor=document.getElementById('nh7_library_editor_v224');if(!editor)return;mounting=true;
  try{let panel=editor.querySelector('.nh7-reader-admin-v250');if(panel)return;const firstActions=editor.querySelector('.file-drop');if(firstActions)firstActions.insertAdjacentHTML('afterend',panelHtml());else editor.insertAdjacentHTML('beforeend',panelHtml())}finally{mounting=false}
}
function renderPanel(){const old=document.querySelector('.nh7-reader-admin-v250');if(!old){mount();return}const holder=document.createElement('div');holder.innerHTML=panelHtml();old.replaceWith(holder.firstElementChild)}
async function pdfjs(){if(!pdfjsPromise)pdfjsPromise=import(PDFJS_URL).then(mod=>{mod.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;return mod});return pdfjsPromise}
function pageText(content){const lines=[];let line='';for(const item of content.items||[]){const part=String(item?.str||'').trim();if(part){if(line&&!/^[،؛:,.!?؟)]/.test(part))line+=' ';line+=part}if(item?.hasEOL&&line.trim()){lines.push(line.trim());line=''}}if(line.trim())lines.push(line.trim());return lines.join('\n').replace(/\n{3,}/g,'\n\n')}
async function extract(file){
  if(!file||busy||!reader.enabled)return;if(!/\.pdf$/i.test(file.name||'')&&String(file.type||'').toLowerCase()!=='application/pdf'){reader.status='error';reader.message=L('برای تبدیل خودکار به نوشته، فایل PDF انتخاب کنید.','Choose a PDF for automatic text conversion.','Odaberite PDF.');renderPanel();return}
  busy=true;reader.status='none';reader.message='';reader.fileName=file.name;renderPanel();
  try{
    const lib=await pdfjs(),doc=await lib.getDocument({data:await file.arrayBuffer(),useWorkerFetch:true,isEvalSupported:false}).promise,pages=[];
    for(let i=1;i<=doc.numPages;i++){const page=await doc.getPage(i),content=await page.getTextContent({includeMarkedContent:true}),text=pageText(content);pages.push({number:i,text});reader.pageCount=i;reader.message=L(`در حال خواندن صفحه ${i} از ${doc.numPages}…`,`Reading page ${i} of ${doc.numPages}…`,`Čitanje stranice ${i} od ${doc.numPages}…`);renderPanel();await new Promise(r=>setTimeout(r,0))}
    const full=pages.map(p=>p.text).filter(Boolean).join('\n\n────────\n\n').trim(),meaningful=full.replace(/\s/g,'').length>=Math.max(80,doc.numPages*18);
    reader.pages=pages;reader.pageCount=doc.numPages;reader.text=full;reader.status=meaningful?'ready':'needs_ocr';reader.all=Object.assign({},reader.all,{[reader.language]:{text:full,pages}});reader.message='';
  }catch(error){console.error('PDF text extraction',error);reader.status='error';reader.message=error?.message||String(error)}finally{busy=false;renderPanel()}
}
function setLanguage(language){reader.all=Object.assign({},reader.all,{[reader.language]:{text:reader.text,pages:reader.pages}});reader.language=language;const payload=languagePayload(reader.all,language);reader.text=payload.text;reader.pages=payload.pages;reader.pageCount=payload.pages.length;reader.status=reader.text.trim()?'ready':'none';renderPanel()}
document.addEventListener('change',event=>{
  const enable=event.target.closest?.('[data-reader-enabled]');if(enable){reader.enabled=!!enable.checked;if(!reader.enabled){reader.status='none'}renderPanel();if(reader.enabled&&lastFile)extract(lastFile);return}
  const mode=event.target.closest?.('[data-reader-mode]');if(mode){reader.mode=mode.value;return}
  const language=event.target.closest?.('[data-reader-language]');if(language){setLanguage(language.value);return}
  const file=event.target.closest?.('#nh7_library_editor_v224 input[type="file"]');if(file?.files?.[0]){lastFile=file.files[0];if(reader.enabled)setTimeout(()=>extract(lastFile),0)}
},true);
document.addEventListener('input',event=>{const text=event.target.closest?.('[data-reader-text]');if(!text)return;reader.text=text.value;reader.status=reader.text.trim()?'ready':(reader.pageCount?'needs_ocr':'none');reader.all=Object.assign({},reader.all,{[reader.language]:{text:reader.text,pages:reader.pages}})},true);
document.addEventListener('click',event=>{if(!event.target.closest?.('[data-reader-extract]'))return;event.preventDefault();if(lastFile)extract(lastFile)},true);
function bindAdminRpc(){
  if(typeof adminRpc!=='function'||adminRpc.__nh7ReaderV250)return;const old=adminRpc;
  const wrapped=async function(name,payload={}){
    let next=payload;
    if(name==='nh7_admin_library_save_item_v224'&&payload?.p_item){
      const all=Object.assign({},reader.all,{[reader.language]:{text:String(reader.text||''),pages:Array.isArray(reader.pages)?reader.pages:[]}}),enabled=!!reader.enabled;
      next=Object.assign({},payload,{p_item:Object.assign({},payload.p_item,{reader_mode:enabled?reader.mode:'file',reader_language:reader.language,reader_text:enabled?all:{},reader_status:enabled?(String(reader.text||'').trim()?'ready':reader.status==='needs_ocr'?'needs_ocr':'none'):'none',reader_page_count:enabled?Number(reader.pageCount||0):0})});
    }
    const result=await old.call(this,name,next);
    if(name==='nh7_admin_library_save_item_v224'&&result){reader.message=L('نسخهٔ متنی همراه فایل ذخیره شد.','The in-app text version was saved with the file.','Tekstualna verzija je spremljena.');setTimeout(renderPanel,0)}
    return result;
  };
  wrapped.__nh7ReaderV250=true;adminRpc=wrapped;
}
function bindEdit(){
  if(typeof window.nh7EditLibraryV224==='function'&&!window.nh7EditLibraryV224.__nh7ReaderV250){const old=window.nh7EditLibraryV224;const wrapped=function(id){const row=currentRows().find(x=>String(x.id)===String(id));loadRow(row);lastFile=null;const result=old.apply(this,arguments);setTimeout(renderPanel,60);return result};wrapped.__nh7ReaderV250=true;window.nh7EditLibraryV224=wrapped}
  if(typeof window.nh7ResetLibraryDraftV224==='function'&&!window.nh7ResetLibraryDraftV224.__nh7ReaderV250){const old=window.nh7ResetLibraryDraftV224;const wrapped=function(){reader=fresh();lastFile=null;const result=old.apply(this,arguments);setTimeout(renderPanel,60);return result};wrapped.__nh7ReaderV250=true;window.nh7ResetLibraryDraftV224=wrapped}
}
const observer=new MutationObserver(()=>requestAnimationFrame(mount));observer.observe(document.documentElement,{childList:true,subtree:true});
setInterval(()=>{bindAdminRpc();bindEdit();mount()},900);
setTimeout(()=>{bindAdminRpc();bindEdit();mount()},250);
window.NH7_LIBRARY_TEXT_ADMIN_VERSION=VERSION;
})();