/* New Hope 7 v3.2.9 — stable service-worker registration and safe updates */
(()=>{'use strict';
const BUILD='2.3.9.29';
const VERSION_URL='./version.json';
const WORKER='./service-worker.js';
const INSTALLED_KEY='nh7_current_app_build';
const nativeRegister=navigator.serviceWorker?.register?.bind(navigator.serviceWorker);
function workerUrl(){return new URL(WORKER,document.baseURI||location.href).href}
if(nativeRegister){navigator.serviceWorker.register=function(_raw,options={}){return nativeRegister(workerUrl(),Object.assign({},options,{scope:'./',updateViaCache:'none'}))}}
async function registerLatestWorker(){if(!nativeRegister)return null;const registration=await nativeRegister(workerUrl(),{scope:'./',updateViaCache:'none'});try{await registration.update()}catch(_){}if(registration.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});return registration}
async function fetchLatest(){if(!navigator.onLine)return null;try{const response=await fetch(VERSION_URL+'?t='+Date.now(),{cache:'no-store',headers:{'Cache-Control':'no-cache, no-store, must-revalidate','Pragma':'no-cache'}});return response.ok?await response.json():null}catch(_){return null}}
async function moveToLatest(remote){const latest=String(remote?.app||'').trim();if(!latest||latest===BUILD)return false;const guard='nh7_update_redirect_'+latest;if(sessionStorage.getItem(guard)==='1')return false;sessionStorage.setItem(guard,'1');const target=new URL('./app-v239.html',document.baseURI||location.href);target.searchParams.set('update',Date.now().toString());location.replace(target.href);return true}
async function boot(){try{const registration=await registerLatestWorker();if(!navigator.onLine)return registration;const remote=await fetchLatest();if(await moveToLatest(remote))return registration;localStorage.setItem(INSTALLED_KEY,BUILD);return registration}catch(error){console.warn('NH7 automatic update',error);return null}}
let checking=false;async function check(){if(checking||!navigator.onLine)return;checking=true;try{const remote=await fetchLatest();if(await moveToLatest(remote))return;const registration=await navigator.serviceWorker?.getRegistration?.('./');await registration?.update?.();if(registration?.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});localStorage.setItem(INSTALLED_KEY,BUILD)}catch(_){}finally{checking=false}}
if(navigator.serviceWorker){navigator.serviceWorker.addEventListener('controllerchange',()=>{const guard='nh7_controller_reloaded_'+BUILD;if(sessionStorage.getItem(guard)==='1')return;sessionStorage.setItem(guard,'1');location.reload()})}
window.addEventListener('pageshow',()=>setTimeout(check,500));document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(check,350)});window.addEventListener('online',()=>setTimeout(()=>{boot();check()},300));boot();window.NH7_AUTO_UPDATE_VERSION='3.2.9';
})();
