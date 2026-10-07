/* New Hope 7 Admin — School report native print fallback v1.2.0
 * Print-only UI hotfix after Issue #119.
 * Keeps PDF/CSV/report data untouched. Uses a top-level same-origin print window
 * because iOS/Safari can silently ignore iframe.contentWindow.print().
 */
(()=>{'use strict';
if(window.__NH7_ADMIN_PRINT_NATIVE_V120__)return;
window.__NH7_ADMIN_PRINT_NATIVE_V120__=true;
const VERSION='1.2.0';

const language=()=>{
  const v=String(document.documentElement.lang||'fa').toLowerCase();
  return v.startsWith('fa')?'fa':v.startsWith('hr')?'hr':'en';
};
const L=(fa,en,hr)=>language()==='fa'?fa:language()==='hr'?hr:en;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function setStatus(message){
  const el=document.querySelector('#nh7ReportExport119 [role="status"]');
  if(el)el.textContent=message;
}

function sourceFromPreview(){
  const overlay=document.getElementById('nh7ReportExport119');
  const frame=overlay?.querySelector('iframe');
  const doc=frame?.contentDocument;
  if(!overlay||!frame||!doc?.body)return null;
  const lang=String(overlay.lang||doc.documentElement.lang||language());
  const dir=String(overlay.dir||doc.documentElement.dir||(lang==='fa'?'rtl':'ltr'));
  const title=String(doc.title||document.getElementById('nh7ReportTitle119')?.textContent||'New Hope 7');
  const styles=[...doc.querySelectorAll('style')].map(s=>s.textContent||'').join('\n');
  return {overlay,frame,doc,lang,dir,title,styles,body:doc.body.innerHTML};
}

function buildPrintWindow(source){
  let win=null;
  try{win=window.open('about:blank','_blank')}catch(_){win=null}
  if(!win)return null;
  try{
    win.opener=null;
    const toolbarCss=`
      .nh7-native-print-toolbar{position:sticky;top:0;z-index:999999;display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:10px 12px;background:#fff;border-bottom:1px solid #d0d5dd;box-shadow:0 3px 12px rgba(16,24,40,.08);font-family:system-ui,-apple-system,"Segoe UI",Tahoma,Arial,sans-serif}
      .nh7-native-print-toolbar button{font:inherit;font-weight:700;padding:9px 14px;border:1px solid #98a2b3;border-radius:9px;background:#f8fafc;color:#102033;cursor:pointer}
      .nh7-native-print-toolbar .primary{background:#0f766e;color:#fff;border-color:#0f766e}
      .nh7-native-print-note{font-size:12px;color:#667085;margin-inline-start:auto}
      @media print{.nh7-native-print-toolbar{display:none!important}body{padding:0!important}}
    `;
    const printLabel=source.lang==='fa'?'چاپ':source.lang==='hr'?'Ispis':'Print';
    const closeLabel=source.lang==='fa'?'بستن':source.lang==='hr'?'Zatvori':'Close';
    const note=source.lang==='fa'?'اگر پنجرهٔ چاپ خودکار باز نشد، دوباره «چاپ» را بزنید.':source.lang==='hr'?'Ako se dijalog za ispis ne otvori automatski, ponovno dodirnite „Ispis”.':'If the print dialog does not open automatically, tap Print again.';
    const html='<!doctype html><html lang="'+esc(source.lang)+'" dir="'+esc(source.dir)+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>'+esc(source.title)+'</title><style>'+source.styles+'\n'+toolbarCss+'</style></head><body><div class="nh7-native-print-toolbar"><button type="button" data-nh7-close>'+esc(closeLabel)+'</button><button type="button" class="primary" data-nh7-print>'+esc(printLabel)+'</button><span class="nh7-native-print-note">'+esc(note)+'</span></div><main data-nh7-print-content>'+source.body+'</main></body></html>';
    win.document.open();win.document.write(html);win.document.close();
    const print=()=>{try{win.focus();win.print()}catch(e){console.warn('[NH7 native print]',e)}};
    win.document.querySelector('[data-nh7-close]')?.addEventListener('click',()=>win.close());
    win.document.querySelector('[data-nh7-print]')?.addEventListener('click',print);
    // Best effort automatic attempt. The visible Print button remains as a
    // direct top-level user gesture fallback for Safari/iOS/WebView.
    try{win.focus();win.print()}catch(_){/* visible fallback remains */}
    return win;
  }catch(e){
    console.warn('[NH7 native print window]',e);
    try{win.close()}catch(_){}
    return null;
  }
}

function handlePrint(event){
  const button=event.target?.closest?.('#nh7ReportExport119 [data-print]');
  if(!button)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const source=sourceFromPreview();
  if(!source){setStatus(L('پیش‌نمایش چاپ پیدا نشد.','Print preview was not found.','Pregled ispisa nije pronađen.'));return}
  const win=buildPrintWindow(source);
  if(win){
    setStatus(L('صفحهٔ چاپ باز شد. اگر پنجرهٔ چاپ ظاهر نشد، دکمهٔ «چاپ» داخل همان صفحه را بزنید.','Print page opened. If the print dialog did not appear, tap Print inside that page.','Otvorena je stranica za ispis. Ako se dijalog nije pojavio, dodirnite Ispis na toj stranici.'));
    return;
  }
  // Popup-blocked fallback: keep the working report preview intact and try
  // the existing same-origin frame once, while giving explicit feedback.
  try{
    source.frame.contentWindow?.focus();
    source.frame.contentWindow?.print();
    setStatus(L('مرورگر صفحهٔ جدید را مسدود کرد؛ تلاش مستقیم برای چاپ انجام شد. اگر باز نشد، اجازهٔ Pop-up را فعال کنید.','The browser blocked the print window; direct print was attempted. If nothing opens, allow pop-ups for this site.','Preglednik je blokirao prozor za ispis; pokušan je izravni ispis. Ako se ništa ne otvori, dopustite skočne prozore za ovu stranicu.'));
  }catch(e){
    setStatus(L('چاپ توسط مرورگر مسدود شد. اجازهٔ Pop-up را برای این سایت فعال کنید.','Printing was blocked by the browser. Allow pop-ups for this site.','Ispis je blokirao preglednik. Dopustite skočne prozore za ovu stranicu.'));
  }
}

document.addEventListener('click',handlePrint,true);
window.NH7AdminPrintNativeV120={VERSION,sourceFromPreview,buildPrintWindow};
})();
