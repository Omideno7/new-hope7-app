/* New Hope 7 v2.3.9.35 — background-only updater; never reloads an active app */
(()=>{'use strict';
const BUILD='2.3.9.35',WORKER='./service-worker.js';
const nativeRegister=navigator.serviceWorker?.register?.bind(navigator.serviceWorker);
async function refreshWorker(){if(!nativeRegister)return null;try{const r=await nativeRegister(new URL(WORKER,document.baseURI||location.href).href,{scope:'./',updateViaCache:'none'});try{await r.update()}catch(_){}if(r.waiting)try{r.waiting.postMessage({type:'SKIP_WAITING'})}catch(_){}localStorage.setItem('nh7_current_app_build',BUILD);return r}catch(e){console.warn('NH7 background update',e);return null}}
if(navigator.serviceWorker){navigator.serviceWorker.addEventListener('controllerchange',()=>{localStorage.setItem('nh7_worker_changed_at',String(Date.now()))})}
window.addEventListener('pageshow',()=>setTimeout(refreshWorker,1200));window.addEventListener('online',()=>setTimeout(refreshWorker,800));setTimeout(refreshWorker,250);window.NH7_AUTO_UPDATE_VERSION='3.3.5-background-only';
})();
