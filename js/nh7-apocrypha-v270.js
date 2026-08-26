/* New Hope 7 Wave 1A — cautious Apocrypha bootstrap v4.0.1
 * Loads only the approved 19-book reader modules. The 8.8 MB translation asset
 * remains lazy and is fetched only when Apocrypha is opened.
 */
(()=>{'use strict';
if(window.__NH7_APOCRYPHA_WAVE1A_V401__)return;
window.__NH7_APOCRYPHA_WAVE1A_V401__=true;
const VERSION='4.0.1-wave1a-apocrypha';
const BUILD='wave1a-401';
const SCRIPTS=[
  'js/nh7-apocrypha-preview-v240.js',
  'js/nh7-apocrypha-reader-flow-v244.js',
  'js/nh7-reader-ux-v251.js',
  'js/nh7-saved-verses-chapter-v252.js',
  'js/nh7-apocrypha-inline-v392.js',
  'js/nh7-apocrypha-actions-v393.js',
  'js/nh7-apocrypha-saved-nav-v394.js'
];
let ready=false,loading=null,pendingLaunch=null;
function addScript(src){return new Promise((resolve,reject)=>{const existing=document.querySelector(`script[data-nh7-wave1a="${src}"]`);if(existing){if(existing.dataset.loaded==='1')resolve();else{existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',()=>reject(new Error('Load failed: '+src)),{once:true})}return}const script=document.createElement('script');script.src=src+'?v='+BUILD;script.async=false;script.dataset.nh7Wave1a=src;script.onload=()=>{script.dataset.loaded='1';resolve()};script.onerror=()=>reject(new Error('Load failed: '+src));document.head.appendChild(script)})}
async function loadAll(){if(ready)return true;if(loading)return loading;loading=(async()=>{for(const src of SCRIPTS)await addScript(src);ready=true;window.NH7_APOCRYPHA_WAVE1A_VERSION=VERSION;window.dispatchEvent(new CustomEvent('nh7:apocrypha-wave1a-ready',{detail:{version:VERSION}}));return true})().catch(error=>{loading=null;console.error('[NH7 Wave1A Apocrypha]',error);throw error});return loading}
function showError(error){const view=document.getElementById('view');if(!view)return;const language=localStorage.getItem('nh7_lang')||'en';const title=language==='fa'?'اپوکریفا باز نشد':language==='hr'?'Apokrifi se nisu otvorili':'Apocrypha could not be opened';view.innerHTML=`<section class="card"><h2>${title}</h2><div class="notice"><p>${String(error?.message||error||'Load failed')}</p><button type="button" class="primary-btn" data-nh7-wave1a-retry>Retry</button></div></section>`}
window.addEventListener('click',event=>{const launch=event.target.closest?.('[data-go="apocrypha"]');if(!launch||ready)return;event.preventDefault();event.stopImmediatePropagation();pendingLaunch=launch;loadAll().then(()=>{const target=pendingLaunch;pendingLaunch=null;setTimeout(()=>target?.click(),0)}).catch(showError)},true);
document.addEventListener('click',event=>{if(!event.target.closest?.('[data-nh7-wave1a-retry]'))return;event.preventDefault();loadAll().then(()=>document.querySelector('[data-go="apocrypha"]')?.click()).catch(showError)},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>loadAll().catch(console.warn),{once:true});else loadAll().catch(console.warn);
})();