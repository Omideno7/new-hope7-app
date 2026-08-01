/* New Hope 7 v3.2.7 — safe automatic updates without breaking offline startup */
(()=>{'use strict';
const BUILD='2.3.9.27';
const VERSION_URL='./version.json';
const INSTALLED_KEY='nh7_current_app_build';
const originalRegister=navigator.serviceWorker?.register?.bind(navigator.serviceWorker);
function versionedWorkerUrl(raw){const url=new URL(raw||'service-worker.js',location.href);if(url.pathname.endsWith('/service-worker.js')||url.pathname.endsWith('service-worker.js'))url.searchParams.set('build',BUILD);return url.href}
if(originalRegister){navigator.serviceWorker.register=function(raw,options={}){return originalRegister(versionedWorkerUrl(raw),Object.assign({},options,{updateViaCache:'none'}))}}
async function registerLatestWorker(){if(!originalRegister||!navigator.onLine)return null;const reg=await originalRegister(versionedWorkerUrl('./service-worker.js'),{scope:'./',updateViaCache:'none'});try{await reg.update()}catch(_){}if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});return reg}
async function fetchLatest(){if(!navigator.onLine)return null;try{const response=await fetch(VERSION_URL+'?t='+Date.now(),{cache:'no-store',headers:{'Cache-Control':'no-cache, no-store, must-revalidate','Pragma':'no-cache'}});return response.ok?await response.json():null}catch(_){return null}}
async function moveToLatest(remote){const latest=String(remote?.app||'').trim();if(!latest||latest===BUILD)return false;const guard='nh7_update_redirect_'+latest;if(sessionStorage.getItem(guard)==='1')return false;sessionStorage.setItem(guard,'1');const target=new URL('./app-v239.html',location.href);target.searchParams.set('release','stable-'+latest);target.searchParams.set('update',Date.now().toString());location.replace(target.href);return true}
async function boot(){if(!navigator.onLine)return;try{await registerLatestWorker();const remote=await fetchLatest();if(await moveToLatest(remote))return;localStorage.setItem(INSTALLED_KEY,BUILD)}catch(error){console.warn('NH7 automatic update',error)}}
let checking=false;async function check(){if(checking||!navigator.onLine)return;checking=true;try{const remote=await fetchLatest();if(await moveToLatest(remote))return;const reg=await navigator.serviceWorker?.getRegistration?.('./');await reg?.update?.();if(reg?.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});localStorage.setItem(INSTALLED_KEY,BUILD)}catch(_){}finally{checking=false}}
if(navigator.serviceWorker){navigator.serviceWorker.addEventListener('controllerchange',()=>{const guard='nh7_controller_reloaded_'+BUILD;if(sessionStorage.getItem(guard)==='1')return;sessionStorage.setItem(guard,'1');location.reload()})}
window.addEventListener('pageshow',()=>setTimeout(check,300));document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(check,200)});window.addEventListener('online',()=>setTimeout(()=>{boot();check()},200));boot();window.NH7_AUTO_UPDATE_VERSION='3.2.7';
})();
