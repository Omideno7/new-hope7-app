/* New Hope 7 Admin v4.1.6 — secure admin push binding + admin runtime helpers. */
(()=>{'use strict';
if(window.__NH7_ADMIN_PUSH_OWNER_V400__)return;window.__NH7_ADMIN_PUSH_OWNER_V400__=true;
const VERSION='4.1.6-admin-push-owner';
let syncing=false,lastSync=0;
function adminReady(){try{return !!(typeof token!=='undefined'&&token&&typeof nh7AdminAccessReady!=='undefined'&&nh7AdminAccessReady===true)}catch(_){return false}}
function note(message,type='success'){try{if(typeof setMessage==='function')setMessage(message,type)}catch(_){} }
function loadHelper(src,id,version='4.1.6'){try{const old=document.getElementById(id);if(old&&old.dataset.nh7Version===version)return;if(old)old.remove();const s=document.createElement('script');s.id=id;s.dataset.nh7Version=version;s.defer=true;s.src=src+(src.includes('?')?'&':'?')+'v='+encodeURIComponent(version);document.head.appendChild(s)}catch(e){console.warn('[NH7 helper load]',src,e)}}
function loadRuntimeHelpers(){loadHelper('js/nh7-admin-global-stability-v414.js','nh7AdminGlobalStabilityV414','4.1.4');loadHelper('js/nh7-admin-user-notes-v414.js','nh7AdminUserNotesV414','4.1.5');loadHelper('js/nh7-admin-message-center-v416.js','nh7AdminMessageCenterV416','4.1.6-wave4')}
async function bindAdminPush(forcePrompt=false){
  if(!adminReady())return false;
  window.NH7_PUSH_ACCOUNT_REBIND?.();
  if(forcePrompt)note((typeof lang!=='undefined'&&lang==='fa')?'مجوز دستگاه بررسی شد؛ دریافت واقعی نیاز به اتصال سرور و آزمون دستگاه دارد.':(typeof lang!=='undefined'&&lang==='hr')?'Provjerena je dozvola uređaja; dostava zahtijeva poslužiteljsko povezivanje i test uređaja.':'Device permission checked; delivery requires server binding and device testing.','success');
  return true;
}
function unbindAdminPush(){queueMicrotask(()=>window.NH7_PUSH_ACCOUNT_REBIND?.())}
function install(){
  loadRuntimeHelpers();
  try{
    if(typeof enableAlerts==='function'&&!enableAlerts.__nh7AdminPushV400){const original=enableAlerts;const wrapped=async function(){let out;try{out=await original.apply(this,arguments)}finally{await bindAdminPush(true)}return out};wrapped.__nh7AdminPushV400=true;enableAlerts=window.enableAlerts=wrapped}
    if(typeof loadAll==='function'&&!loadAll.__nh7AdminPushV400){const original=loadAll;const wrapped=async function(){const out=await original.apply(this,arguments);setTimeout(()=>bindAdminPush(false),100);return out};wrapped.__nh7AdminPushV400=true;loadAll=window.loadAll=wrapped}
    if(typeof logout==='function'&&!logout.__nh7AdminPushV400){const original=logout;const wrapped=function(){unbindAdminPush();return original.apply(this,arguments)};wrapped.__nh7AdminPushV400=true;logout=window.logout=wrapped}
    if(adminReady())bindAdminPush(false);
    return true;
  }catch(error){console.warn('[NH7 admin push install]',error);return false}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.addEventListener('nh7-admin-access-wave3',()=>{install();bindAdminPush(false)});
['focus','pageshow'].forEach(ev=>window.addEventListener(ev,()=>{install();bindAdminPush(false)}));
window.NH7_ADMIN_PUSH_OWNER_VERSION=VERSION;
})();
