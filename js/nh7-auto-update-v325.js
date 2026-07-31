/* New Hope 7 v3.2.6 — automatic build and service-worker updates */
(()=>{'use strict';
const BUILD='2.3.9.26';
const VERSION_URL='./version.json';
const MEDIA_CACHE='nh7-media-v2-protected';
const INSTALLED_KEY='nh7_current_app_build';
const originalRegister=navigator.serviceWorker?.register?.bind(navigator.serviceWorker);

function clearProgramCaches(){
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
  const guard='nh7_update_redirect_'+latest;
  if(sessionStorage.getItem(guard)==='1')return false;
  sessionStorage.setItem(guard,'1');
  await clearProgramCaches();
  const target=new URL('./app-v239.html',location.href);
  target.searchParams.set('release','stable-'+latest);
  target.searchParams.set('update',Date.now().toString());
  location.replace(target.href);
  return true;
}
async function boot(){
  try{
    if(localStorage.getItem(INSTALLED_KEY)!==BUILD){
      await clearProgramCaches();
      localStorage.setItem(INSTALLED_KEY,BUILD);
    }
    await registerLatestWorker();
    const remote=await fetchLatest();
    await moveToLatest(remote);
  }catch(error){console.warn('NH7 automatic update',error)}
}
let checking=false;
async function check(){
  if(checking||!navigator.onLine)return;
  checking=true;
  try{
    const remote=await fetchLatest();
    if(await moveToLatest(remote))return;
    const reg=await navigator.serviceWorker?.getRegistration?.('./');
    await reg?.update?.();
    if(reg?.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});
  }catch(_){}finally{checking=false}
}
if(navigator.serviceWorker){
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    const guard='nh7_controller_reloaded_'+BUILD;
    if(sessionStorage.getItem(guard)==='1')return;
    sessionStorage.setItem(guard,'1');
    location.reload();
  });
}
window.addEventListener('pageshow',()=>setTimeout(check,300));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(check,200)});
window.addEventListener('online',()=>setTimeout(check,200));
boot();
window.NH7_AUTO_UPDATE_VERSION='3.2.6';
})();
