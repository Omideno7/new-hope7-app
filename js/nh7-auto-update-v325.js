/* New Hope 7 v3.2.5 — automatic build and service-worker updates */
(()=>{'use strict';
const BUILD='2.3.9.25';
const VERSION_URL='./version.json';
const MEDIA_CACHE='nh7-media-v2-protected';
const RELOAD_GUARD='nh7_update_reload_'+BUILD;
const originalRegister=navigator.serviceWorker?.register?.bind(navigator.serviceWorker);

function preserveMediaAndClearProgramCaches(){
  if(!('caches' in window))return Promise.resolve();
  return caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==MEDIA_CACHE&&(key.startsWith('nh7-core-')||key.startsWith('nh7-data-')||key.startsWith('nh7-public-api-')||key.startsWith('omideno7-'))).map(key=>caches.delete(key))));
}
function versionedWorkerUrl(raw){
  const url=new URL(raw||'service-worker.js',location.href);
  if(url.pathname.endsWith('/service-worker.js')||url.pathname.endsWith('service-worker.js'))url.searchParams.set('build',BUILD);
  return url.href;
}
if(originalRegister){
  navigator.serviceWorker.register=function(raw,options={}){
    return originalRegister(versionedWorkerUrl(raw),Object.assign({},options,{updateViaCache:'none'}));
  };
}
async function registerLatestWorker(){
  if(!originalRegister)return null;
  const reg=await originalRegister(versionedWorkerUrl('./service-worker.js'),{scope:'./',updateViaCache:'none'});
  try{await reg.update()}catch(_){}
  if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});
  return reg;
}
async function fetchLatest(){
  try{
    const response=await fetch(VERSION_URL+'?t='+Date.now(),{cache:'no-store',headers:{'Cache-Control':'no-cache, no-store, must-revalidate','Pragma':'no-cache'}});
    if(!response.ok)return null;
    return await response.json();
  }catch(_){return null}
}
async function moveToLatest(remote){
  const latest=String(remote?.app||'').trim();
  if(!latest||latest===BUILD)return false;
  if(sessionStorage.getItem(RELOAD_GUARD)===latest)return false;
  sessionStorage.setItem(RELOAD_GUARD,latest);
  await preserveMediaAndClearProgramCaches();
  const target=new URL('./app-v239.html',location.href);
  target.searchParams.set('release','stable-'+latest);
  target.searchParams.set('update',Date.now().toString());
  location.replace(target.href);
  return true;
}
async function boot(){
  try{
    await preserveMediaAndClearProgramCaches();
    await registerLatestWorker();
    localStorage.setItem('nh7_current_app_build',BUILD);
    const remote=await fetchLatest();
    await moveToLatest(remote);
  }catch(error){console.warn('NH7 automatic update',error)}
}
let checking=false;
async function check(){if(checking||!navigator.onLine)return;checking=true;try{const remote=await fetchLatest();await moveToLatest(remote);const reg=await navigator.serviceWorker?.getRegistration?.('./');await reg?.update?.()}catch(_){}finally{checking=false}}
if(navigator.serviceWorker){
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(sessionStorage.getItem('nh7_controller_reloaded_'+BUILD)==='1')return;
    sessionStorage.setItem('nh7_controller_reloaded_'+BUILD,'1');
    location.reload();
  });
}
window.addEventListener('pageshow',()=>setTimeout(check,300));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(check,200)});
window.addEventListener('online',()=>setTimeout(check,200));
boot();
window.NH7_AUTO_UPDATE_VERSION='3.2.5';
})();
