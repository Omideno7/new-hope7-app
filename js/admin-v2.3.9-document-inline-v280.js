/* New Hope 7 Admin v2.8.0 — mount the complete Fix 4 studio inside Documents */
(()=>{'use strict';
const VERSION='2.8.0-document-inline';
const L=(fa,en,hr)=>typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en;
let scheduled=false,opening=false;
function removeDuplicateStudios(){document.querySelectorAll('.nh7-doc-studio-v239,.nh7-doc-clean-v270,.nh7-f4-card,.nh7-f4-fab').forEach(node=>node.remove())}
function introHtml(){return `<section class="nh7-doc-inline-intro-v280" data-nh7-doc-inline-intro><h2>🎨 ${L('مدارک — استودیوی کامل داخل همین صفحه','Documents — complete studio on this page','Dokumenti — cijeli studio na ovoj stranici')}</h2><p>${L('همان استودیوی کامل قبلی اکنون مستقیماً در تب مدارک قرار دارد. اطلاعات مدرک را در فرم‌های پایین وارد کنید، ظاهر را اینجا طراحی کنید و سپس طراحی را روی مدرک انتخاب‌شده ذخیره یا چاپ کنید.','The complete studio is now embedded directly in Documents. Enter document details below, design it here, then save the design to the selected record or print it.','Cijeli studio sada je ugrađen izravno u Dokumente.')}</p></section>`}
function ensureHost(){const grid=document.querySelector('.certificate-admin-grid');if(!grid)return null;let host=document.querySelector('.nh7-doc-inline-host-v280');if(!host){host=document.createElement('div');host.className='nh7-doc-inline-host-v280';host.innerHTML=introHtml();grid.parentElement?.insertBefore(host,grid)}else if(!host.querySelector('[data-nh7-doc-inline-intro]'))host.insertAdjacentHTML('afterbegin',introHtml());return host}
function placeOverlay(){if(opening)return;removeDuplicateStudios();let inCertificates=false;try{inCertificates=typeof activeTab!=='undefined'&&activeTab==='certificates'}catch(_){}
if(!inCertificates){const overlay=document.querySelector('.nh7-f4-overlay.nh7-f4-inline-v280');if(overlay){overlay.remove();document.body.classList.remove('nh7-f4-open')}return}
const host=ensureHost();if(!host)return;let overlay=document.querySelector('.nh7-f4-overlay');if(!overlay&&window.NH7DocumentStudioFix4?.open){opening=true;try{window.NH7DocumentStudioFix4.open()}catch(error){console.error('Inline document studio open',error)}finally{opening=false}overlay=document.querySelector('.nh7-f4-overlay')}
if(!overlay)return;overlay.classList.add('nh7-f4-inline-v280');if(overlay.parentElement!==host)host.appendChild(overlay);document.body.classList.remove('nh7-f4-open');overlay.querySelector('[data-f4-close]')?.setAttribute('aria-hidden','true');window.NH7DocumentStudioFix4?.apply?.()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;placeOverlay()})}
const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});
if(typeof render==='function'&&!render.__nh7DocumentInlineV280){const old=render;const wrapped=function(...args){const result=old.apply(this,args);schedule();return result};wrapped.__nh7DocumentInlineV280=true;render=wrapped}
document.addEventListener('click',event=>{if(event.target.closest?.('.tab'))setTimeout(schedule,0)},true);
setInterval(schedule,1600);setTimeout(schedule,350);
window.NH7_ADMIN_DOCUMENT_INLINE_VERSION=VERSION;
})();
