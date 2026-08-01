/* New Hope 7 v3.2.7 — non-blocking offline startup */
(()=>{'use strict';
const VERSION='3.2.7-offline-startup';
const nativeFetch=window.fetch.bind(window);
const REMOTE_TIMEOUT=4500;
function isRemote(input){
  try{const raw=typeof input==='string'?input:input instanceof URL?input.href:input?.url||'';return new URL(raw,location.href).origin!==location.origin}catch(_){return false}
}
function offlineError(){const error=new TypeError('Offline: remote request skipped');error.code='offline';return error}
function mergeSignal(init,timeout){
  if(init?.signal)return{init,timer:0};
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(new DOMException('Startup request timed out','TimeoutError')),timeout);
  return{init:Object.assign({},init||{},{signal:controller.signal}),timer};
}
window.fetch=async function nh7OfflineStartupFetch(input,init={}){
  if(!isRemote(input))return nativeFetch(input,init);
  if(!navigator.onLine)throw offlineError();
  const wrapped=mergeSignal(init,REMOTE_TIMEOUT);
  try{return await nativeFetch(input,wrapped.init)}finally{if(wrapped.timer)clearTimeout(wrapped.timer)}
};
window.NH7_OFFLINE_STARTUP_VERSION=VERSION;
})();
