/* New Hope 7 v3.6.0 — privacy-safe OneSignal identity binding via Auth UUID. */
(()=>{'use strict';
if(window.__NH7_PUSH_IDENTITY_V360__)return;window.__NH7_PUSH_IDENTITY_V360__=true;
const SESSION='nh7_user_session_v170';let last='';
function session(){try{return JSON.parse(localStorage.getItem(SESSION)||'null')}catch(_){return null}}
function uid(){return String(session()?.user?.id||'').trim()}
async function syncWeb(OneSignal){const id=uid();try{if(id){if(id!==last&&OneSignal?.login)await Promise.resolve(OneSignal.login(id));last=id;localStorage.setItem('nh7_push_external_id_v360',id)}else if(last){await Promise.resolve(OneSignal?.logout?.());last='';localStorage.removeItem('nh7_push_external_id_v360')}}catch(e){console.warn('[NH7 push identity web]',e)}}
async function syncNative(){const O=window.plugins?.OneSignal;if(!O)return;const id=uid();try{if(id){if(id!==last&&O.login)await Promise.resolve(O.login(id));last=id;localStorage.setItem('nh7_push_external_id_v360',id)}else if(last){await Promise.resolve(O.logout?.());last='';localStorage.removeItem('nh7_push_external_id_v360')}}catch(e){console.warn('[NH7 push identity native]',e)}}
window.OneSignalDeferred=window.OneSignalDeferred||[];window.OneSignalDeferred.push(syncWeb);
function resync(){window.OneSignalDeferred?.push?.(syncWeb);syncNative()}
window.addEventListener('storage',e=>{if(e.key===SESSION)resync()});window.addEventListener('focus',resync);window.addEventListener('pageshow',resync);document.addEventListener('deviceready',resync,{once:true});setInterval(resync,15000);setTimeout(resync,800);window.NH7_PUSH_IDENTITY_VERSION='3.6.0';
})();
