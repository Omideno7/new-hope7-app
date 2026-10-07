/* Standalone same-origin Print page; no Admin, auth, data fetch or PDF engine. */
(()=>{'use strict';
const params=new URLSearchParams(location.hash.slice(1)),ticket=params.get('ticket');
let lang=['fa','en','hr'].includes(params.get('lang'))?params.get('lang'):'en',received=false;
const parent=window.opener,origin=location.origin;
const t=(fa,en,hr)=>lang==='fa'?fa:lang==='hr'?hr:en;
const print=document.getElementById('print121'),back=document.getElementById('back121'),status=document.getElementById('status121'),help=document.getElementById('help121');
function labels(){
 document.documentElement.lang=lang;document.documentElement.dir=lang==='fa'?'rtl':'ltr';
 document.getElementById('controls121').setAttribute('aria-label',t('کنترل‌های چاپ','Print controls','Kontrole ispisa'));
 print.textContent=t('چاپ','Print','Ispis');back.textContent=t('بستن / بازگشت به گزارش','Close / Back to report','Zatvori / Natrag na izvještaj');
 help.textContent=t('اگر برگهٔ چاپ باز نشد، به گزارش برگردید و PDF را دانلود کنید. فایل را در Files باز کنید و گزینهٔ Share و سپس Print را بزنید. در مرورگر داخل برنامه از «باز کردن در Safari» استفاده کنید.','If no print sheet opens, return to the report and download PDF. Open the file in Files, then Share → Print. In an in-app browser, use Open in Safari.','Ako se list za ispis ne otvori, vratite se na izvještaj i preuzmite PDF. Otvorite datoteku u aplikaciji Files, zatim Dijeli → Ispis. U pregledniku unutar aplikacije koristite Otvori u Safariju.');
}
labels();
const missing=()=>{status.textContent=t('گزارش دریافت نشد. به گزارش برگردید و دوباره «چاپ» را بزنید.','Report not received. Return to the report and tap Print again.','Izvještaj nije primljen. Vratite se na izvještaj i ponovno dodirnite Ispis.')};
status.textContent=t('در انتظار گزارش…','Waiting for report…','Čekanje izvještaja…');
const timeout=setTimeout(()=>{if(!received)missing()},15000);
window.addEventListener('message',async event=>{
 const data=event.data;
 if(received||event.origin!==origin||event.source!==parent||data?.type!=='nh7-print-report121'||data.ticket!==ticket)return;
 if(!['fa','en','hr'].includes(data.lang)||typeof data.body!=='string'||typeof data.styles!=='string')return;
 received=true;clearTimeout(timeout);lang=data.lang;labels();document.title=String(data.title||'New Hope 7');
 const report=document.getElementById('report121'),template=document.createElement('template');template.innerHTML=data.body;
 // Defense in depth: report snapshots are content, never executable controls.
 template.content.querySelectorAll('script,iframe,object,embed,form,button,input,select,textarea,link,base,meta').forEach(node=>node.remove());
 template.content.querySelectorAll('*').forEach(node=>{for(const attr of [...node.attributes])if(/^on/i.test(attr.name)||((attr.name==='href'||attr.name==='src')&&/^\s*javascript:/i.test(attr.value)))node.removeAttribute(attr.name)});
 const style=document.createElement('style');style.textContent=data.styles;document.head.prepend(style);report.appendChild(template.content);
 // Navigation receives no automatic print attempt. Enable after local layout/fonts/images.
 await Promise.race([Promise.all([document.fonts?.ready||Promise.resolve(),...[...report.querySelectorAll('img')].map(img=>img.decode?.().catch(()=>{})||Promise.resolve())]),new Promise(resolve=>setTimeout(resolve,2000))]);
 status.textContent=t('گزارش آماده است. برای چاپ، دکمهٔ «چاپ» را بزنید.','Report ready. Tap Print to open the print sheet.','Izvještaj je spreman. Dodirnite Ispis za otvaranje lista za ispis.');print.disabled=false;
 // The handoff is complete; do not leave an opener on the printable page.
 try{window.opener=null}catch(_){}
});
print.addEventListener('click',()=>{
 status.textContent=t('چاپ درخواست شد. اگر برگه‌ای باز نشد، از راهنمای PDF زیر استفاده کنید.','Print requested. If no sheet opens, use the PDF instructions below.','Ispis je zatražen. Ako se list ne otvori, slijedite upute za PDF ispod.');
 // This page's own trusted tap, in its own window realm; no await/timer/focus transfer.
 try{window.print()}catch(_){status.textContent=t('مرورگر چاپ را باز نکرد. از راهنمای PDF زیر استفاده کنید.','The browser did not open printing. Use the PDF instructions below.','Preglednik nije otvorio ispis. Slijedite upute za PDF ispod.')}
});
back.addEventListener('click',()=>{
 if(parent){try{parent.focus()}catch(_){}window.close()}
 else if(history.length>1)history.back();
 // Visible recovery if a host refuses window.close() or this page was opened directly.
 status.textContent=t('به زبانهٔ گزارش برگردید؛ این صفحه را می‌توانید ببندید.','Return to the report tab; you can close this page.','Vratite se na karticu izvještaja; možete zatvoriti ovu stranicu.');
});
if(parent&&/^[a-f0-9]{32}$/.test(ticket||''))parent.postMessage({type:'nh7-print-ready121',ticket},origin);
else{clearTimeout(timeout);missing()}
})();
