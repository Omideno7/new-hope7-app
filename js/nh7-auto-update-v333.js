/* New Hope 7 v3.3.5 — semantic updates + never interrupt active School Audio */
(()=>{'use strict';
const BUILD='2.3.9.34';
const VERSION_URL='./version.json';
const WORKER='./service-worker.js';
const INSTALLED_KEY='nh7_current_app_build';
const PENDING_RELOAD='nh7_pending_reload_'+BUILD;
const PENDING_UPDATE='nh7_pending_update_'+BUILD;
const nativeRegister=navigator.serviceWorker?.register?.bind(navigator.serviceWorker);
function workerUrl(){return new URL(WORKER,document.baseURI||location.href).href}
function schoolAudioBusy(){return window.NH7_SCHOOL_AUDIO_ACTIVE===true}
function versionParts(value){return String(value||'').split('.').map(x=>Number.parseInt(x,10)||0)}
function compareVersions(a,b){const A=versionParts(a),B=versionParts(b),n=Math.max(A.length,B.length);for(let i=0;i<n;i++){const x=A[i]||0,y=B[i]||0;if(x>y)return 1;if(x<y)return-1}return 0}
if(nativeRegister){navigator.serviceWorker.register=function(_raw,options={}){return nativeRegister(workerUrl(),Object.assign({},options,{scope:'./',updateViaCache:'none'}))}}
async function registerLatestWorker(){if(!nativeRegister)return null;const registration=await nativeRegister(workerUrl(),{scope:'./',updateViaCache:'none'});try{await registration.update()}catch(_){}if(registration.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});return registration}
async function fetchLatest(){if(!navigator.onLine)return null;try{const response=await fetch(VERSION_URL+'?t='+Date.now(),{cache:'no-store',headers:{'Cache-Control':'no-cache, no-store, must-revalidate','Pragma':'no-cache'}});return response.ok?await response.json():null}catch(_){return null}}
function goLatest(latest){const guard='nh7_update_redirect_'+latest;if(sessionStorage.getItem(guard)==='1')return false;sessionStorage.setItem(guard,'1');sessionStorage.removeItem(PENDING_UPDATE);const target=new URL('./index.html',document.baseURI||location.href);target.searchParams.set('update',Date.now().toString());location.replace(target.href);return true}
async function moveToLatest(remote){const latest=String(remote?.app||'').trim();if(!latest||compareVersions(latest,BUILD)<=0)return false;if(schoolAudioBusy()){sessionStorage.setItem(PENDING_UPDATE,latest);return false}return goLatest(latest)}
async function boot(){try{const registration=await registerLatestWorker();if(!navigator.onLine)return registration;const remote=await fetchLatest();if(await moveToLatest(remote))return registration;localStorage.setItem(INSTALLED_KEY,BUILD);return registration}catch(error){console.warn('NH7 automatic update',error);return null}}
let checking=false;async function check(){if(checking||!navigator.onLine||schoolAudioBusy())return;checking=true;try{const remote=await fetchLatest();if(await moveToLatest(remote))return;const registration=await navigator.serviceWorker?.getRegistration?.('./');await registration?.update?.();if(registration?.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});localStorage.setItem(INSTALLED_KEY,BUILD)}catch(_){}finally{checking=false}}
function safeReload(){if(schoolAudioBusy()){sessionStorage.setItem(PENDING_RELOAD,'1');return}sessionStorage.removeItem(PENDING_RELOAD);location.reload()}
if(navigator.serviceWorker){navigator.serviceWorker.addEventListener('controllerchange',()=>{if(schoolAudioBusy()){sessionStorage.setItem(PENDING_RELOAD,'1');return}const guard='nh7_controller_reloaded_'+BUILD;if(sessionStorage.getItem(guard)==='1')return;sessionStorage.setItem(guard,'1');safeReload()})}
window.addEventListener('nh7-school-audio-idle',()=>{const latest=sessionStorage.getItem(PENDING_UPDATE);if(latest&&compareVersions(latest,BUILD)>0){goLatest(latest);return}if(sessionStorage.getItem(PENDING_RELOAD)==='1')safeReload()});
window.addEventListener('pageshow',()=>setTimeout(check,900));document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(check,650)});window.addEventListener('online',()=>setTimeout(()=>{boot();check()},500));
boot();window.NH7_AUTO_UPDATE_VERSION='3.3.5';
})();
