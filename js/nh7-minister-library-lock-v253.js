/* New Hope 7 v2.5.3 — always-visible ministers library entry with Account-ID lock. */
(()=>{'use strict';
if(window.__NH7_MINISTER_LIBRARY_LOCK_V253__)return;window.__NH7_MINISTER_LIBRARY_LOCK_V253__=true;
const VERSION='2.5.3-minister-library-lock';
let timer=0;
const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return ['fa','en','hr'].includes(v)?v:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
function allowed(){try{return !!window.NH7ContentAccessV251?.canLibrary?.()}catch(_){return false}}
function style(){if(document.getElementById('nh7-v253-minister-lock-style'))return;const s=document.createElement('style');s.id='nh7-v253-minister-lock-style';s.textContent=`
.library-user-tabs [data-library-tab="ministers"].nh7-v253-minister-locked{display:inline-flex!important;visibility:visible!important;opacity:.82;border-style:dashed!important;position:relative}.library-user-tabs [data-library-tab="ministers"].nh7-v253-minister-locked::before{content:'🔒';margin-inline-end:6px}.library-user-tabs [data-library-tab="ministers"].nh7-v253-minister-open::before{content:'🔓';margin-inline-end:6px}.nh7-v253-lock-hint{margin:8px 0;padding:9px 11px;border:1px dashed #d7b86f;border-radius:12px;background:#fffaf0;color:#72530d;font-size:.84rem;line-height:1.6}`;document.head.appendChild(s)}
function patch(){style();const can=allowed();document.querySelectorAll('.library-user-tabs').forEach(tabs=>{const btn=tabs.querySelector('[data-library-tab="ministers"]');if(!btn)return;btn.hidden=false;btn.removeAttribute('hidden');btn.style.display='';btn.classList.toggle('nh7-v253-minister-locked',!can);btn.classList.toggle('nh7-v253-minister-open',can);btn.setAttribute('aria-disabled',can?'false':'true');btn.title=can?L('دسترسی این حساب فعال است.','This account has access.','Pristup je aktivan za ovaj račun.'):L('این بخش قفل است و فقط با اجازه ادمین باز می‌شود.','Locked. An administrator must grant access to this account.','Zaključano. Administrator mora odobriti pristup.');if(!can&&!tabs.parentElement?.querySelector('.nh7-v253-lock-hint')){const hint=document.createElement('div');hint.className='nh7-v253-lock-hint';hint.textContent=L('🔒 کتابخانه خادمین همیشه قابل مشاهده است، اما فقط حساب‌هایی که ادمین اجازه داده باشد می‌توانند وارد شوند.','🔒 The ministers library stays visible, but only accounts granted by an administrator can enter.','🔒 Knjižnica za služitelje ostaje vidljiva, ali mogu ući samo računi kojima je administrator odobrio pristup.');tabs.insertAdjacentElement('afterend',hint)}if(can)tabs.parentElement?.querySelector('.nh7-v253-lock-hint')?.remove()})}
function schedule(){clearTimeout(timer);timer=setTimeout(patch,20)}
window.addEventListener('nh7-content-access-v251',schedule);window.addEventListener('storage',e=>{if(e.key==='nh7_lang'||e.key==='nh7_user_session_v170')schedule()});
const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class']});
setInterval(patch,1200);setTimeout(patch,300);window.NH7_MINISTER_LIBRARY_LOCK_VERSION=VERSION;
})();

/* RC 2.6.0 bootstrap: rich public-library typography is isolated from the
   v2.5.3 ministers access logic above. Loading is idempotent and QA-only. */
(()=>{'use strict';
if(window.__NH7_LIBRARY_RICH_BOOTSTRAP_V260__)return;window.__NH7_LIBRARY_RICH_BOOTSTRAP_V260__=true;
const css='css/nh7-library-rich-reader-v260.css?v=2.6.0';
if(!document.querySelector(`link[href^="css/nh7-library-rich-reader-v260.css"]`)){const l=document.createElement('link');l.rel='stylesheet';l.href=css;document.head.appendChild(l)}
if(!document.querySelector(`script[src^="js/nh7-library-rich-reader-v260.js"]`)){const s=document.createElement('script');s.src='js/nh7-library-rich-reader-v260.js?v=2.6.0';s.defer=true;document.body.appendChild(s)}
})();
