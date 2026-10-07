/* New Hope 7 Admin — School report print/PDF reliability v1.1.7
 * Presentation-only hotfix for Issue #116 reports.
 * Opens a dedicated printable document from a direct user gesture, then invokes
 * the browser/native print sheet (Save as PDF remains a print destination).
 * No data writes, Supabase changes, School progression changes or CSV changes.
 */
(()=>{'use strict';
if(window.__NH7_ADMIN_REPORT_PRINT_V117__)return;
window.__NH7_ADMIN_REPORT_PRINT_V117__=true;
const VERSION='1.1.7';
const lang=()=>String(window.lang||document.documentElement.lang||'fa').toLowerCase().startsWith('fa')?'fa':String(window.lang||document.documentElement.lang||'en').toLowerCase().startsWith('hr')?'hr':'en';
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const printableCss=`
  @page{size:A4 landscape;margin:12mm}
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:#fff;color:#102033;font-family:system-ui,-apple-system,"Segoe UI",Tahoma,Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{padding:18px}
  .nh7-print-header{display:flex;justify-content:space-between;gap:18px;align-items:flex-end;border-bottom:2px solid #0f766e;padding-bottom:10px;margin-bottom:14px}
  .nh7-print-header h1{font-size:20px;margin:0}.nh7-print-header p{margin:4px 0 0;color:#667085;font-size:12px}.nh7-print-brand{font-weight:800;color:#0f766e;white-space:nowrap}
  .nh7r490-report{max-width:none!important;width:100%!important;margin:0!important;padding:0!important;overflow:visible!important}
  .nh7r490-report header{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;border-bottom:2px solid #0f766e;padding-bottom:12px;margin-bottom:14px}
  .nh7r490-report header img{width:64px!important;height:64px!important;object-fit:contain}.nh7r490-report section{overflow:visible!important;margin:18px 0}
  .nh7r490-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:14px 0}.nh7r490-summary div{border:1px solid #d8ecea;border-radius:10px;padding:8px}.nh7r490-summary b{display:block}.nh7r490-summary span{font-size:11px;color:#667085}
  table{width:100%!important;min-width:0!important;border-collapse:collapse!important;table-layout:fixed!important;font-size:11px!important}
  thead{display:table-header-group}tr{break-inside:avoid;page-break-inside:avoid}th,td{border:1px solid #dce8e7!important;padding:6px!important;text-align:start!important;vertical-align:top!important;overflow-wrap:anywhere!important;word-break:break-word!important;white-space:normal!important}th{background:#eef8f7!important;font-weight:800}
  small{color:#667085}.pill{border:1px solid #d8ecea;border-radius:999px;padding:2px 6px;display:inline-block}.notice{padding:8px;border-radius:8px;background:#fff7ed;color:#9a3412}.empty{color:#667085}.nh7r490-attempt{break-inside:avoid;border:1px solid #d8ecea;border-radius:10px;padding:10px;margin:8px 0}
  button,input,select,textarea,.nh7ac540-report-toolbar,.nh7r491-toolbar,.actions{display:none!important}
  @media print{body{padding:0}.nh7-print-header{break-after:avoid}.nh7r490-report section{break-inside:auto}}
`;
function cleanClone(source){
  const clone=source.cloneNode(true);
  clone.querySelectorAll('button,input,select,textarea,script,.nh7ac540-report-toolbar,.nh7r491-toolbar,.actions').forEach(el=>el.remove());
  clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  return clone.outerHTML;
}
function printablePage(markup,title,dir){
  return '<!doctype html><html lang="'+lang()+'" dir="'+dir+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+'</title><style>'+printableCss+'</style></head><body>'+markup+'</body></html>';
}
function invokePrint(target,onFail){
  let fired=false;
  const go=()=>{if(fired)return;fired=true;try{target.focus?.();target.print()}catch(e){onFail?.(e)}};
  try{if(target.document?.readyState==='complete')setTimeout(go,80);else target.addEventListener?.('load',()=>setTimeout(go,80),{once:true})}catch(_){setTimeout(go,120)}
  setTimeout(go,700);
}
function iframeFallback(page){
  try{
    const frame=document.createElement('iframe');
    frame.setAttribute('aria-hidden','true');
    Object.assign(frame.style,{position:'fixed',width:'1px',height:'1px',right:'0',bottom:'0',border:'0',opacity:'0',pointerEvents:'none'});
    document.body.appendChild(frame);
    const doc=frame.contentDocument||frame.contentWindow?.document;if(!doc)throw new Error('print frame unavailable');
    doc.open();doc.write(page);doc.close();
    setTimeout(()=>{try{frame.contentWindow?.focus();frame.contentWindow?.print()}catch(e){alert(L('پیش‌نمایش چاپ باز نشد. لطفاً مرورگر را به‌روز کن و دوباره تلاش کن.','Print preview could not be opened. Please update the browser and try again.','Pregled ispisa nije moguće otvoriti. Ažurirajte preglednik i pokušajte ponovno.'))}setTimeout(()=>frame.remove(),1500)},180);
    return true;
  }catch(e){console.warn('[NH7 report print fallback]',e);return false}
}
function openPrintPage(page){
  let popup=null;
  try{popup=window.open('about:blank','_blank')}catch(_){popup=null}
  if(!popup)return iframeFallback(page);
  try{
    popup.opener=null;
    popup.document.open();popup.document.write(page);popup.document.close();
    invokePrint(popup,()=>iframeFallback(page));
    return true;
  }catch(e){try{popup.close()}catch(_){};return iframeFallback(page)}
}
function groupMarkup(){
  const modal=document.getElementById('nh7AcademicGroupReportV546');if(!modal)return null;
  const heading=modal.querySelector('.nh7ac540-report-heading');
  const table=modal.querySelector('.nh7ac540-print-table');if(!table)return null;
  const title=(heading?.querySelector('strong')?.textContent||'New Hope 7 · School Report').trim();
  const meta=(heading?.querySelector('small')?.textContent||'').trim();
  const dir=modal.querySelector('.nh7ac540-report-dialog')?.getAttribute('dir')||document.body.dir||'ltr';
  const markup='<div class="nh7-print-header"><div><h1>'+esc(title)+'</h1><p>'+esc(meta)+'</p></div><div class="nh7-print-brand">NEW HOPE 7</div></div>'+cleanClone(table);
  return{markup,title,dir};
}
function individualMarkup(){
  const source=document.querySelector('#nh7ReportPreviewOverlay .nh7r491-print-surface .nh7r490-report')||document.querySelector('#nh7ReportOutput .nh7r490-report');
  if(!source)return null;
  const name=source.querySelector('h3')?.textContent?.trim()||L('گزارش دانشجو','Student Report','Izvještaj studenta');
  const title='New Hope 7 · '+name;
  const dir=source.getAttribute('dir')||source.closest('[dir]')?.getAttribute('dir')||document.body.dir||'ltr';
  return{markup:cleanClone(source),title,dir};
}
function printGroup(){
  const p=groupMarkup();if(!p){alert(L('گزارش برای چاپ پیدا نشد. ابتدا پیش‌نمایش گزارش را باز کن.','Printable report was not found. Open the report preview first.','Izvještaj za ispis nije pronađen. Najprije otvorite pregled izvještaja.'));return}
  openPrintPage(printablePage(p.markup,p.title,p.dir));
}
function printIndividual(){
  const p=individualMarkup();if(!p){alert(L('گزارش دانشجو برای چاپ پیدا نشد.','Student report was not found for printing.','Izvještaj studenta za ispis nije pronađen.'));return}
  openPrintPage(printablePage(p.markup,p.title,p.dir));
}
function patch(){
  let changed=false;
  if(typeof window.nh7StudentAcademicGroupPdfActionV547==='function'&&window.nh7StudentAcademicGroupPdfActionV547.__nh7Print117!==true){
    const f=()=>printGroup();f.__nh7Print117=true;window.nh7StudentAcademicGroupPdfActionV547=f;changed=true;
  }
  if(typeof window.nh7PrintStudentReportPdfV496==='function'&&window.nh7PrintStudentReportPdfV496.__nh7Print117!==true){
    const f=()=>printIndividual();f.__nh7Print117=true;window.nh7PrintStudentReportPdfV496=f;changed=true;
  }
  if(typeof window.nh7DownloadStudentReportPdfV496==='function'&&window.nh7DownloadStudentReportPdfV496.__nh7Print117!==true){
    const f=()=>printIndividual();f.__nh7Print117=true;window.nh7DownloadStudentReportPdfV496=f;changed=true;
  }
  if(changed)window.NH7_ADMIN_REPORT_PRINT_VERSION=VERSION;
  return changed;
}
patch();let tries=0;const timer=setInterval(()=>{patch();if(++tries>80)clearInterval(timer)},250);
window.NH7AdminReportPrintV117={VERSION,patch,printGroup,printIndividual};
})();
