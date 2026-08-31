/* New Hope 7 Admin v4.1.4 — secure admin push binding + admin runtime helpers. */
(()=>{'use strict';
if(window.__NH7_ADMIN_PUSH_OWNER_V400__)return;window.__NH7_ADMIN_PUSH_OWNER_V400__=true;
const VERSION='4.1.4-admin-push-owner';
let syncing=false,lastSync=0;
function adminReady(){try{return !!(typeof token!=='undefined'&&token&&typeof nh7AdminAccessReady!=='undefined'&&nh7AdminAccessReady===true)}catch(_){return false}}
function note(message,type='success'){try{if(typeof setMessage==='function')setMessage(message,type)}catch(_){} }
function loadHelper(src,id){try{if(document.getElementById(id))return;const s=document.createElement('script');s.id=id;s.defer=true;s.src=src+(src.includes('?')?'&':'?')+'v=4.1.4';document.head.appendChild(s)}catch(e){console.warn('[NH7 helper load]',src,e)}}
function loadRuntimeHelpers(){loadHelper('js/nh7-admin-global-stability-v414.js','nh7AdminGlobalStabilityV414');loadHelper('js/nh7-admin-user-notes-v414.js','nh7AdminUserNotesV414')}
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
        try{localStorage.setItem('nh7_admin_push_bound_v400',JSON.stringify({at:new Date().toISOString(),id:sub?.id||'',optedIn:!!sub?.optedIn,permission:typeof Notification!=='undefined'?Notification.permission:'unknown',standalone:!!(window.matchMedia?.('(display-mode: standalone)')?.matches||navigator.standalone)}))}catch(_){}
        if(forcePrompt){
          const standalone=!!(window.matchMedia?.('(display-mode: standalone)')?.matches||navigator.standalone);
          const msg=standalone
            ?((typeof lang!=='undefined'&&lang==='fa')?'اعلان‌های ادمین برای این دستگاه فعال شد و می‌تواند هنگام بسته بودن پنل هم دریافت شود.':(typeof lang!=='undefined'&&lang==='hr')?'Administratorske obavijesti su aktivirane za ovaj uređaj.':'Admin alerts are enabled for this device, including background delivery.')
            :((typeof lang!=='undefined'&&lang==='fa')?'اعلان‌ها فعال شدند. برای دریافت مطمئن در پس‌زمینه روی iPhone، پنل ادمین را به Home Screen اضافه کنید و از همان آیکن باز کنید.':(typeof lang!=='undefined'&&lang==='hr')?'Obavijesti su aktivirane. Za pouzdanu pozadinsku dostavu na iPhoneu dodajte admin panel na početni zaslon.':'Alerts are enabled. For reliable background delivery on iPhone, add the admin panel to the Home Screen and open it from that icon.');
          note(msg,'success');
        }
      }catch(error){console.warn('[NH7 admin push bind]',error);if(forcePrompt)note((typeof lang!=='undefined'&&lang==='fa')?'فعال‌سازی Push ادمین انجام نشد. اجازهٔ اعلان مرورگر را بررسی کنید.':'Admin push could not be enabled. Check browser notification permission.','danger')}
    });
    return true;
  }finally{syncing=false}
}
async function unbindAdminPush(){
  try{window.OneSignalDeferred=window.OneSignalDeferred||[];window.OneSignalDeferred.push(async OneSignal=>{try{await OneSignal.User.removeTag('role');await OneSignal.logout()}catch(_){}})}catch(_){}
}
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
let attempts=0;const timer=setInterval(()=>{attempts++;install();if(attempts>80)clearInterval(timer)},250);install();
['focus','pageshow'].forEach(ev=>window.addEventListener(ev,()=>{install();bindAdminPush(false)}));
window.NH7_ADMIN_PUSH_OWNER_VERSION=VERSION;
})();
