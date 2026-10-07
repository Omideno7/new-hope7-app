/* Issue #121: print-only, direct-tap top-level document. PDF/CSV stay in #119. */
(()=>{'use strict';
if(window.__NH7_ADMIN_PRINT_NATIVE_V120__)return;
window.__NH7_ADMIN_PRINT_NATIVE_V120__=true;
const VERSION='1.2.1', pending=new Map();
const text=(l,fa,en,hr)=>l==='fa'?fa:l==='hr'?hr:en;
function sourceFromPreview(){
 const overlay=document.getElementById('nh7ReportExport119'),frame=overlay?.querySelector('iframe'),doc=frame?.contentDocument;
 if(!doc?.body)return null;
 const lang=['fa','en','hr'].includes(overlay.lang)?overlay.lang:'en';
 return {overlay,lang,dir:lang==='fa'?'rtl':'ltr',title:doc.title||'New Hope 7',styles:[...doc.querySelectorAll('style')].map(s=>s.textContent).join('\n'),body:doc.body.innerHTML};
}
function guidance(source,message){
 // Separate from the PDF progress status: generation cannot erase print guidance.
 let panel=source.overlay.querySelector('[data-print-help121]');
 if(!panel){panel=document.createElement('div');panel.dataset.printHelp121='';panel.setAttribute('role','status');panel.setAttribute('aria-live','polite');panel.style.cssText='padding:8px;border:1px solid #0f766e;border-radius:8px;white-space:normal';source.overlay.querySelector('header').appendChild(panel)}
 panel.replaceChildren();const note=document.createElement('p');note.textContent=message;note.style.margin='0 0 6px';panel.appendChild(note);
 const fallback=document.createElement('p');fallback.textContent=text(source.lang,'اگر برگهٔ چاپ باز نشد: «دانلود PDF» را بزنید، فایل را در Files باز کنید و گزینهٔ Share و سپس Print را بزنید. در مرورگر داخل برنامه، صفحه را در Safari باز کنید.','If no print sheet opens: tap Download PDF, open the file in Files, then Share → Print. In an in-app browser, open the page in Safari.','Ako se list za ispis ne otvori: dodirnite Preuzmi PDF, otvorite datoteku u aplikaciji Files, zatim Dijeli → Ispis. U pregledniku unutar aplikacije otvorite stranicu u Safariju.');fallback.style.margin='0 0 6px';panel.appendChild(fallback);
 const retry=document.createElement('button');retry.type='button';retry.textContent=text(source.lang,'باز کردن صفحهٔ چاپ','Open print page','Otvori stranicu za ispis');retry.onclick=()=>buildPrintWindow(sourceFromPreview()||source);panel.appendChild(retry);
 const pdf=document.createElement('button');pdf.type='button';pdf.style.marginInlineStart='6px';pdf.textContent=text(source.lang,'رفتن به دانلود PDF','Go to Download PDF','Idi na preuzimanje PDF-a');pdf.onclick=()=>source.overlay.querySelector('[data-pdf]')?.focus();panel.appendChild(pdf);
}
function buildPrintWindow(source){
 if(!source?.body){if(source?.overlay)guidance(source,text(source.lang,'گزارش آماده نیست. پیش‌نمایش را ببندید و دوباره باز کنید.','The report is not ready. Close and reopen its preview.','Izvještaj nije spreman. Zatvorite i ponovno otvorite pregled.'));return null}
 const token=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
 const url=new URL('school-report-print.html',location.href);url.hash=new URLSearchParams({ticket:token,lang:source.lang}).toString();
 // Open a real same-origin page within THIS click. Never print during navigation.
 const entry={source,win:null,timer:null};pending.set(token,entry);
 try{entry.win=window.open(url.href,'_blank')}catch(_){}
 if(!entry.win){pending.delete(token);guidance(source,text(source.lang,'مرورگر صفحهٔ چاپ را باز نکرد. اجازهٔ پنجره‌های بازشو را بدهید و «باز کردن صفحهٔ چاپ» را بزنید، یا از راهنمای PDF زیر استفاده کنید.','The browser did not open the print page. Allow pop-ups and tap Open print page, or use the PDF instructions below.','Preglednik nije otvorio stranicu za ispis. Dopustite skočne prozore i dodirnite Otvori stranicu za ispis ili slijedite upute za PDF ispod.'));return null}
 guidance(source,text(source.lang,'در صفحهٔ جدید، دکمهٔ «چاپ» را بزنید. اگر برگهٔ چاپ باز نشد، راهنمای PDF زیر در دسترس است.','On the new page, tap its Print button. If no print sheet opens, the PDF instructions below remain available.','Na novoj stranici dodirnite njezin gumb Ispis. Ako se list za ispis ne otvori, dostupne su upute za PDF ispod.'));
 entry.timer=setTimeout(()=>{pending.delete(token);if(source.overlay.isConnected)guidance(source,text(source.lang,'اگر صفحهٔ چاپ آماده نشد، «باز کردن صفحهٔ چاپ» را دوباره بزنید یا از راهنمای PDF استفاده کنید.','If the print page did not become ready, tap Open print page again or use the PDF instructions.','Ako stranica za ispis nije spremna, ponovno dodirnite Otvori stranicu za ispis ili slijedite upute za PDF.'))},15000);
 return entry.win;
}
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.data?.type!=='nh7-print-ready121')return;
 const entry=pending.get(event.data.ticket);if(!entry||event.source!==entry.win)return;
 clearTimeout(entry.timer);pending.delete(event.data.ticket);
 const {lang,dir,title,styles,body}=entry.source;
 // Report content travels only in memory, never in URL, local/session storage or RPC.
 entry.win.postMessage({type:'nh7-print-report121',ticket:event.data.ticket,lang,dir,title,styles,body},location.origin);
});
document.addEventListener('click',event=>{
 const button=event.target?.closest?.('#nh7ReportExport119 [data-print]');if(!button)return;
 event.preventDefault();event.stopImmediatePropagation();
 const source=sourceFromPreview()||{overlay:button.closest('#nh7ReportExport119'),lang:button.closest('#nh7ReportExport119').lang};buildPrintWindow(source);
},true);
window.addEventListener('pagehide',()=>{for(const entry of pending.values())clearTimeout(entry.timer);pending.clear()});
window.NH7AdminPrintNativeV120={VERSION,sourceFromPreview,buildPrintWindow};
})();
