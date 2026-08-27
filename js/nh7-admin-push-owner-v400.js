/* New Hope 7 Admin v4.0.0 — securely bind the authenticated admin browser to OneSignal admin alerts. */
(()=>{'use strict';
if(window.__NH7_ADMIN_PUSH_OWNER_V400__)return;window.__NH7_ADMIN_PUSH_OWNER_V400__=true;
const VERSION='4.0.0-admin-push-owner';
let syncing=false,lastSync=0;
function adminReady(){try{return !!(typeof token!=='undefined'&&token&&typeof nh7AdminAccessReady!=='undefined'&&nh7AdminAccessReady===true)}catch(_){return false}}
function note(message,type='success'){try{if(typeof setMessage==='function')setMessage(message,type)}catch(_){} }
async function bindAdminPush(forcePrompt=false){
  if(syncing||!adminReady())return false;
  if(!forcePrompt&&Date.now()-lastSync<15000)return true;
  syncing=true;
  try{
    window.OneSignalDeferred=window.OneSignalDeferred||[];
    window.OneSignalDeferred.push(async OneSignal=>{
      try{
        await OneSignal.login('nh7-admin-owner');
        await OneSignal.User.addTags({app:'new_hope_7',role:'admin'});
        const sub=OneSignal.User.PushSubscription;
        if(forcePrompt||((typeof Notification==='undefined'||Notification.permission==='granted')&&!sub?.optedIn))await Promise.resolve(sub?.optIn?.());
        lastSync=Date.now();
        try{localStorage.setItem('nh7_admin_push_bound_v400',JSON.stringify({at:new Date().toISOString(),id:sub?.id||'',optedIn:!!sub?.optedIn}))}catch(_){}
        if(forcePrompt)note((typeof lang!=='undefined'&&lang==='fa')?'اعلان‌های درخواست جدید برای این دستگاه فعال شد.':(typeof lang!=='undefined'&&lang==='hr')?'Obavijesti o novim zahtjevima aktivirane su na ovom uređaju.':'New-request alerts are enabled on this device.','success');
      }catch(error){console.warn('[NH7 admin push bind]',error);if(forcePrompt)note((typeof lang!=='undefined'&&lang==='fa')?'فعال‌سازی Push ادمین انجام نشد. اجازهٔ اعلان مرورگر را بررسی کنید.':'Admin push could not be enabled. Check browser notification permission.','danger')}
    });
    return true;
  }finally{syncing=false}
}
async function unbindAdminPush(){
  try{window.OneSignalDeferred=window.OneSignalDeferred||[];window.OneSignalDeferred.push(async OneSignal=>{try{await OneSignal.User.removeTag('role');await OneSignal.logout()}catch(_){}})}catch(_){}
}
function install(){
  try{
    if(typeof enableAlerts==='function'&&!enableAlerts.__nh7AdminPushV400){const original=enableAlerts;const wrapped=async function(){let out;try{out=await original.apply(this,arguments)}finally{await bindAdminPush(true)}return out};wrapped.__nh7AdminPushV400=true;enableAlerts=window.enableAlerts=wrapped}
    if(typeof loadAll==='function'&&!loadAll.__nh7AdminPushV400){const original=loadAll;const wrapped=async function(){const out=await original.apply(this,arguments);setTimeout(()=>bindAdminPush(false),100);return out};wrapped.__nh7AdminPushV400=true;loadAll=window.loadAll=wrapped}
    if(typeof logout==='function'&&!logout.__nh7AdminPushV400){const original=logout;const wrapped=function(){unbindAdminPush();return original.apply(this,arguments)};wrapped.__nh7AdminPushV400=true;logout=window.logout=wrapped}
    if(adminReady())bindAdminPush(false);
    return true;
  }catch(error){console.warn('[NH7 admin push install]',error);return false}
}
let attempts=0;const timer=setInterval(()=>{attempts++;install();if(attempts>80)clearInterval(timer)},250);install();
['focus','pageshow'].forEach(ev=>window.addEventListener(ev,()=>{install();bindAdminPush(false)}));
window.NH7_ADMIN_PUSH_OWNER_VERSION=VERSION;
})();
