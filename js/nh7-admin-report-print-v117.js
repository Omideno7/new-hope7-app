/* Issue #119: read-only School preview, direct-gesture print and local PDF export. */
(()=>{'use strict';
if(window.__NH7_ADMIN_REPORT_PRINT_V117__)return;
window.__NH7_ADMIN_REPORT_PRINT_V117__=true;
const VERSION='1.1.9', WIDTH=1024, HEIGHT=680;
let session=null, enginePromise=null;
const locale=()=>{const value=typeof lang!=='undefined'?lang:document.documentElement.lang;return ['fa','en','hr'].includes(value)?value:'en'};
const copy=(fa,en,hr,l=locale())=>l==='fa'?fa:l==='hr'?hr:en;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css=`
@page{size:A4 landscape;margin:12mm}*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#102033;font-family:system-ui,-apple-system,"Segoe UI",Tahoma,Arial,sans-serif}body{padding:16px}
header,.nh7-print-header{border-bottom:2px solid #0f766e;margin-bottom:14px;padding-bottom:10px}header img{width:64px;height:64px;object-fit:contain}h1,h2,h3,h4,h5{margin:8px 0}section{margin:16px 0;overflow:visible!important}p,li,td,th{overflow-wrap:anywhere;word-break:break-word}p{white-space:pre-wrap}.long{white-space:pre-wrap;unicode-bidi:plaintext}table{width:100%;min-width:0!important;table-layout:fixed;border-collapse:collapse;font-size:12px}th,td{border:1px solid #dce8e7;padding:7px;text-align:start;vertical-align:top}th{background:#eef8f7;position:static!important}thead{display:table-header-group}tr{break-inside:avoid}small{color:#667085}.nh7r490-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}.nh7r490-summary div{border:1px solid #d8ecea;padding:8px}.nh7r490-summary b{display:block}.nh7r490-attempt{border:1px solid #d8ecea;padding:10px;margin:10px 0}.notice{background:#fff7ed;padding:10px}.nh7r490-report{width:100%;padding:0!important;overflow:visible!important}
@media print{html,body{height:auto!important;overflow:visible!important}body{padding:0}section,.nh7r490-attempt{break-inside:auto}}
`;
function clean(source){const clone=source.cloneNode(true);clone.querySelectorAll('script,button,input,select,textarea,.actions').forEach(n=>n.remove());return clone.outerHTML}
function snapshot(kind){
 if(kind==='group'){
  const modal=document.getElementById('nh7AcademicGroupReportV546'),table=modal?.querySelector('.nh7ac540-print-table');if(!table)return null;
  const title=modal.querySelector('.nh7ac540-report-heading strong')?.textContent||'New Hope 7';
  const meta=modal.querySelector('.nh7ac540-report-heading small')?.textContent||'';
  return {title,language:modal.lang||locale(),markup:'<header><h1>'+esc(title)+'</h1><p>'+esc(meta)+'</p></header>'+clean(table),csv:window.nh7StudentAcademicCsvV540};
 }
 const source=document.querySelector('#nh7ReportPreviewOverlay .nh7r491-print-surface')||document.querySelector('#nh7ReportOutput');if(!source?.querySelector('.nh7r490-report'))return null;
 const report=source.querySelector('.nh7r490-report');
 return {title:'New Hope 7 · '+(report.querySelector('h3')?.textContent||'Student'),language:report.lang||locale(),markup:clean(source),csv:window.nh7ExportStudentReportV116};
}
function engine(){
 if(typeof window.html2canvas==='function')return Promise.resolve(window.html2canvas);
 if(enginePromise)return enginePromise;
 enginePromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='js/vendor/html2canvas-1.4.1.min.js';
  const timer=setTimeout(()=>{script.remove();enginePromise=null;reject(Error('Local renderer timed out'))},15000);
  script.onload=()=>{clearTimeout(timer);if(typeof window.html2canvas==='function')resolve(window.html2canvas);else{enginePromise=null;reject(Error('Local renderer unavailable'))}};
  script.onerror=()=>{clearTimeout(timer);script.remove();enginePromise=null;reject(Error('Local renderer unavailable'))};document.head.appendChild(script);
 });return enginePromise;
}
// Minimal PDF 1.4 writer: JPEG image pages, explicit byte offsets, no PDF dependency.
function pdfBlob(pages){
 const enc=new TextEncoder(),chunks=[],offsets=[0];let length=0;
 const add=value=>{const bytes=typeof value==='string'?enc.encode(value):value;chunks.push(bytes);length+=bytes.length};
 const object=(id,value)=>{offsets[id]=length;add(id+' 0 obj\n');add(value);add('\nendobj\n')};
 add('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');object(1,'<< /Type /Catalog /Pages 2 0 R >>');
 object(2,'<< /Type /Pages /Count '+pages.length+' /Kids ['+pages.map((_,i)=>(3+i*3)+' 0 R').join(' ')+'] >>');
 pages.forEach((page,i)=>{
  const id=3+i*3,w=794,h=Math.min(547,page.height/page.width*w),y=595-24-h;
  object(id,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /XObject << /Im '+(id+1)+' 0 R >> >> /Contents '+(id+2)+' 0 R >>');
  offsets[id+1]=length;add((id+1)+' 0 obj\n<< /Type /XObject /Subtype /Image /Width '+page.width+' /Height '+page.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+page.bytes.length+' >>\nstream\n');add(page.bytes);add('\nendstream\nendobj\n');
  const content='q '+w+' 0 0 '+h.toFixed(3)+' 24 '+y.toFixed(3)+' cm /Im Do Q\n';object(id+2,'<< /Length '+enc.encode(content).length+' >>\nstream\n'+content+'endstream');
 });
 const xref=length,count=3+pages.length*3;add('xref\n0 '+count+'\n0000000000 65535 f \n');for(let i=1;i<count;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
 add('trailer\n<< /Size '+count+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n');return new Blob(chunks,{type:'application/pdf'});
}
function close(){const s=session;if(!s)return;session=null;s.cancelled=true;s.overlay.remove();document.body.style.overflow=s.overflow;if(s.focus?.isConnected)s.focus.focus()}
function hint(s,message){if(session===s)s.status.textContent=message}
function ink(canvas){const ctx=canvas.getContext('2d'),pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;for(let i=0;i<pixels.length;i+=4)if(pixels[i]<230||pixels[i+1]<230||pixels[i+2]<230)return true;return false}
async function generate(s){
 if(s.busy)return;s.busy=true;s.download.disabled=true;s.retry.hidden=true;
 const pages=[];let host=null;
 try{
  const render=await engine();if(session!==s)return;
  // Same-origin visible layout; rasterize small page DOMs, never one enormous table canvas.
  host=document.createElement('iframe');host.setAttribute('aria-hidden','true');host.style.cssText='position:fixed;left:0;top:0;width:1056px;height:740px;border:0;z-index:-1;pointer-events:none';document.body.appendChild(host);
  const doc=host.contentDocument;doc.open();doc.write('<!doctype html><html lang="'+s.language+'" dir="'+(s.language==='fa'?'rtl':'ltr')+'"><head><meta charset="utf-8"><style>'+css+'body{padding:0}.pdf-page{width:'+WIDTH+'px;padding:8px;background:#fff}</style></head><body><main class="pdf-page"></main></body></html>');doc.close();
  await Promise.race([doc.fonts?.ready||Promise.resolve(),new Promise(resolve=>setTimeout(resolve,2000))]);
  const page=doc.querySelector('main'),template=doc.createElement('template');template.innerHTML=s.markup;
  // Flatten sections/attempts into ordered blocks. Tables split at actual row boundaries;
  // exceptionally tall rows/paragraphs flow onto image pages without dropping pixels.
  const units=[];
  function walk(node){
   if(node.nodeType!==1){if(node.textContent.trim())units.push({node});return}
   if(node.tagName==='TABLE'){const rows=[...node.querySelectorAll('tbody>tr')];if(rows.length){for(const row of rows)units.push({table:node,row});return}}
   if(['SECTION','ARTICLE','OL','UL'].includes(node.tagName)||node.classList.contains('nh7r490-report')||node.classList.contains('panel-card')||node.classList.contains('nh7r491-print-surface')){for(const child of node.childNodes)walk(child);return}
   units.push({node});
  }
  [...template.content.childNodes].forEach(walk);
  let tableSource=null,table=null;
  async function capture(){
   if(!page.childNodes.length)return;
   const height=Math.max(1,page.scrollHeight);
   for(let y=0;y<height;y+=HEIGHT){
    if(session!==s)throw Error('cancelled');
    hint(s,copy('در حال ساخت PDF؛ صفحه ','Generating PDF; page ','Izrada PDF-a; stranica ',s.language)+(pages.length+1));
    const canvas=await render(page,{backgroundColor:'#fff',scale:1.25,width:WIDTH,height:Math.min(HEIGHT,height-y),y,scrollX:0,scrollY:0,windowWidth:1056,windowHeight:740,logging:false,useCORS:false,allowTaint:false});
    if(!ink(canvas))throw Error('Blank PDF page');
    const raw=atob(canvas.toDataURL('image/jpeg',0.92).split(',')[1]);pages.push({width:canvas.width,height:canvas.height,bytes:Uint8Array.from(raw,c=>c.charCodeAt(0))});canvas.width=canvas.height=1;
    await new Promise(resolve=>setTimeout(resolve,0));
   }
   page.replaceChildren();tableSource=table=null;
  }
  for(const unit of units){
   if(session!==s)throw Error('cancelled');
   let added;
   if(unit.table){
    if(tableSource!==unit.table){tableSource=unit.table;table=unit.table.cloneNode(false);const head=unit.table.querySelector('thead');if(head)table.appendChild(head.cloneNode(true));table.appendChild(doc.createElement('tbody'));page.appendChild(table)}
    added=unit.row.cloneNode(true);table.querySelector('tbody').appendChild(added);
   }else{tableSource=table=null;added=unit.node.cloneNode(true);page.appendChild(added)}
   if(page.scrollHeight>HEIGHT&&page.textContent.trim()!==added.textContent.trim()){
    added.remove();if(table&&!table.querySelector('tbody').childNodes.length)table.remove();await capture();
    if(unit.table){tableSource=unit.table;table=unit.table.cloneNode(false);const head=unit.table.querySelector('thead');if(head)table.appendChild(head.cloneNode(true));table.appendChild(doc.createElement('tbody'));table.querySelector('tbody').appendChild(added);page.appendChild(table)}else page.appendChild(added);
   }
  }
  await capture();if(session!==s)return;if(!pages.length)throw Error('Empty PDF');
  s.blob=pdfBlob(pages);s.file=new File([s.blob],s.filename,{type:'application/pdf'});s.download.disabled=false;
  hint(s,copy('PDF آماده است؛ ','PDF ready; ','PDF je spreman; ',s.language)+pages.length+' '+copy('صفحه','pages','stranica',s.language));
 }catch(e){if(session===s){hint(s,copy('ساخت PDF ناموفق بود. چاپ همچنان در دسترس است. ','PDF failed. Print remains available. ','Izrada PDF-a nije uspjela. Ispis je i dalje dostupan. ',s.language)+e.message);s.retry.hidden=false}}
 finally{host?.remove();s.busy=false}
}
function save(s){
 if(!s.file)return;
 const apple=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 let shareable=false;try{shareable=apple&&typeof navigator.share==='function'&&(!navigator.canShare||navigator.canShare({files:[s.file]}))}catch(_){}
 if(shareable){
  // File is already prepared; call share synchronously in the download click gesture.
  const failed=e=>{if(e.name!=='AbortError'){hint(s,copy('اشتراک‌گذاری در دسترس نیست؛ از دانلود فایل استفاده کنید.','Sharing unavailable; use the file download.','Dijeljenje nije dostupno; preuzmite datoteku.',s.language));s.direct.hidden=false}};
  try{Promise.resolve(navigator.share({files:[s.file],title:s.title})).catch(failed)}catch(e){failed(e)}return;
 }
 directDownload(s);
}
function directDownload(s){if(!s.blob)return;const url=URL.createObjectURL(s.blob),a=document.createElement('a');a.href=url;a.download=s.filename;a.rel='noopener';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),120000)}
function open(kind){
 const data=snapshot(kind);if(!data)return;close();
 const overlay=document.createElement('div');overlay.id='nh7ReportExport119';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','nh7ReportTitle119');overlay.lang=data.language;overlay.dir=data.language==='fa'?'rtl':'ltr';
 overlay.style.cssText='position:fixed;inset:0;z-index:2147483646;background:#fff;display:flex;flex-direction:column;color:#102033';
 const t=(fa,en,hr)=>copy(fa,en,hr,data.language);
 overlay.innerHTML='<header style="flex:none;padding:12px;padding-top:max(12px,env(safe-area-inset-top));border-bottom:1px solid #ccc;background:white"><strong id="nh7ReportTitle119">'+esc(data.title)+'</strong><div class="nh7-report-controls119"><button data-close>'+esc(t('بستن / بازگشت','Close / Back','Zatvori / Natrag'))+'</button><button data-print>'+esc(t('چاپ','Print','Ispis'))+'</button><button data-pdf disabled>'+esc(t('دانلود PDF','Download PDF','Preuzmi PDF'))+'</button><button data-csv>CSV</button><button data-direct hidden>'+esc(t('دانلود مستقیم','Direct download','Izravno preuzimanje'))+'</button><button data-retry hidden>'+esc(t('تلاش دوباره','Retry','Pokušaj ponovno'))+'</button></div><small role="status" aria-live="polite"></small></header><iframe title="'+esc(t('پیش‌نمایش گزارش','Report preview','Pregled izvještaja'))+'" style="width:100%;flex:1;min-height:0;border:0"></iframe>';
 const style=document.createElement('style');style.textContent='#nh7ReportExport119 .nh7-report-controls119{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}#nh7ReportExport119 button{font:inherit;padding:10px;border:1px solid #aaa;border-radius:8px;background:#f2f8f7;color:#102033}#nh7ReportExport119 button[hidden]{display:none}#nh7ReportExport119 button:disabled{opacity:.5}';overlay.appendChild(style);
 const s={...data,overlay,focus:document.activeElement,overflow:document.body.style.overflow,status:overlay.querySelector('[role=status]'),download:overlay.querySelector('[data-pdf]'),retry:overlay.querySelector('[data-retry]'),direct:overlay.querySelector('[data-direct]'),filename:'New-Hope-7-'+kind+'-report-'+new Date().toISOString().slice(0,10)+'.pdf'};session=s;document.body.appendChild(overlay);document.body.style.overflow='hidden';
 const frame=overlay.querySelector('iframe'),doc=frame.contentDocument;doc.open();doc.write('<!doctype html><html lang="'+data.language+'" dir="'+overlay.dir+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(data.title)+'</title><style>'+css+'</style></head><body>'+data.markup+'</body></html>');doc.close();
 overlay.querySelector('[data-close]').onclick=close;
 overlay.querySelector('[data-print]').onclick=()=>{try{frame.contentWindow.focus();frame.contentWindow.print()}catch(e){hint(s,t('چاپ باز نشد؛ دانلود PDF را امتحان کنید.','Print did not open; try Download PDF.','Ispis nije otvoren; pokušajte preuzeti PDF.'))}};
 s.download.onclick=()=>save(s);s.direct.onclick=()=>directDownload(s);s.retry.onclick=()=>generate(s);
 overlay.querySelector('[data-csv]').onclick=()=>data.csv?.();overlay.querySelector('[data-close]').focus();
 overlay.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close()}if(event.key==='Tab'){const buttons=[...overlay.querySelectorAll('button:not([disabled]):not([hidden])')],first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}});
 // Escape from the inner document also returns to the original report modal.
 doc.addEventListener('keydown',e=>{if(e.key==='Escape')close()});generate(s);
}
function patch(){
 if(typeof window.nh7StudentAcademicGroupPdfActionV547==='function')window.nh7StudentAcademicGroupPdfActionV547=()=>open('group');
 if(typeof window.nh7PrintStudentReportPdfV496==='function')window.nh7PrintStudentReportPdfV496=()=>open('individual');
 if(typeof window.nh7DownloadStudentReportPdfV496==='function')window.nh7DownloadStudentReportPdfV496=()=>open('individual');
 window.NH7_ADMIN_REPORT_PRINT_VERSION=VERSION;
}
window.addEventListener('keydown',event=>{if(session&&event.key==='Escape'){event.stopImmediatePropagation();event.preventDefault();close()}},true);
patch();let tries=0;const timer=setInterval(()=>{patch();if(++tries>80)clearInterval(timer)},250);
window.NH7AdminReportPrintV117={VERSION,patch,printGroup:()=>open('group'),printIndividual:()=>open('individual'),pdfBlob,close};
})();
