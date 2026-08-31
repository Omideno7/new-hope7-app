/* New Hope 7 Android Push QA v4.2.0
   Native-only OneSignal Cordova bridge. No UI changes. No web/PWA behavior changes. */
(()=>{'use strict';
if(window.__NH7_ONESIGNAL_NATIVE_ANDROID_V420__)return;
window.__NH7_ONESIGNAL_NATIVE_ANDROID_V420__=true;

const VERSION='4.2.0-android-native-push-qa';
const APP_ID=String(window.NH7_ONESIGNAL_APP_ID||'86f4116a-707a-4959-aa3f-7c703f57bf7e');
const SESSION_KEY='nh7_user_session_v170';
const LOGOUT_KEY='nh7_explicit_logout';
let initialized=false;
let initializing=false;
let permissionRequested=false;
let lastUserId='';
let lastSignature='';

function isNativeAndroid(){
  try{
    const platform=window.Capacitor?.getPlatform?.();
    return platform==='android'||(!!window.cordova&&/android/i.test(navigator.userAgent||''));
  }catch(_){return false}
}
function plugin(){return window.plugins?.OneSignal||null}
function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}}
function loggedOut(){return localStorage.getItem(LOGOUT_KEY)==='1'}
function userId(){return loggedOut()?'':String(session()?.user?.id||'').trim()}
function language(){const value=String(localStorage.getItem('nh7_lang')||document.documentElement.lang||'en').toLowerCase();return value.startsWith('fa')?'fa':value.startsWith('hr')?'hr':'en'}
function deviceId(){return String(localStorage.getItem('nh7_device_id')||'').trim()}
function state(extra={}){
  const os=plugin();
  const sub=os?.User?.pushSubscription;
  const snapshot={
    version:VERSION,
    native:true,
    platform:'android',
    initialized,
    userId:userId()||null,
    permission:os?.Notifications?.permission??null,
    subscriptionId:sub?.id||null,
    tokenPresent:!!sub?.token,
    optedIn:sub?.optedIn===true,
    at:new Date().toISOString(),
    ...extra
  };
  window.NH7_NATIVE_PUSH_STATE=snapshot;
  try{localStorage.setItem('nh7_native_push_qa_v420',JSON.stringify(snapshot))}catch(_){}
  return snapshot;
}
async function applyIdentity(){
  const os=plugin();
  if(!initialized||!os)return false;
  const id=userId();
  try{
    if(id){
      if(id!==lastUserId&&typeof os.login==='function')await Promise.resolve(os.login(id));
      lastUserId=id;
      if(os.User?.addTags){
        const tags={app:'new_hope_7',account_linked:'true',platform:'android_native',qa_push:'v420',language:language()};
        const dev=deviceId();if(dev)tags.device_id=dev;
        await Promise.resolve(os.User.addTags(tags));
      }
      if(os.User?.setLanguage)await Promise.resolve(os.User.setLanguage(language()));
    }else if(lastUserId){
      if(typeof os.logout==='function')await Promise.resolve(os.logout());
      lastUserId='';
    }
    state({identityBound:!!id});
    return true;
  }catch(error){
    console.warn('[NH7 native push] identity bind failed',error);
    state({identityBound:false,error:String(error?.message||error)});
    return false;
  }
}
async function requestPermission(){
  const os=plugin();
  if(!initialized||!os||permissionRequested)return;
  permissionRequested=true;
  try{
    if(os.Notifications?.requestPermission)await Promise.resolve(os.Notifications.requestPermission(true));
    if(os.User?.pushSubscription?.optIn)await Promise.resolve(os.User.pushSubscription.optIn());
    state({permissionRequested:true});
  }catch(error){
    console.warn('[NH7 native push] permission request failed',error);
    state({permissionRequested:true,error:String(error?.message||error)});
  }
}
async function initialize(){
  if(!isNativeAndroid()||initialized||initializing)return false;
  const os=plugin();
  if(!os){state({initialized:false,reason:'onesignal_cordova_plugin_missing'});return false}
  initializing=true;
  try{
    if(typeof os.initialize!=='function')throw new Error('OneSignal Cordova initialize() is unavailable');
    await Promise.resolve(os.initialize(APP_ID));
    initialized=true;
    state({initialized:true});
    try{
      os.User?.pushSubscription?.addEventListener?.('change',()=>state({subscriptionChanged:true}));
      os.Notifications?.addEventListener?.('permissionChange',()=>state({permissionChanged:true}));
      os.Notifications?.addEventListener?.('click',event=>{
        state({notificationClicked:true});
        try{window.dispatchEvent(new CustomEvent('nh7:native-push-click',{detail:event||{}}))}catch(_){}
      });
    }catch(error){console.warn('[NH7 native push] listener setup failed',error)}
    await applyIdentity();
    await requestPermission();
    setTimeout(()=>state({ready:true}),1500);
    return true;
  }catch(error){
    console.error('[NH7 native push] initialize failed',error);
    state({initialized:false,error:String(error?.message||error)});
    return false;
  }finally{initializing=false}
}
function sync(){
  if(!isNativeAndroid())return;
  if(!initialized){initialize();return}
  const signature=[userId(),language(),deviceId(),loggedOut()?'1':'0'].join('|');
  if(signature!==lastSignature){lastSignature=signature;applyIdentity()}
  state({ready:true});
}

document.addEventListener('deviceready',()=>setTimeout(initialize,250),{once:true});
window.addEventListener('pageshow',()=>setTimeout(sync,250));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(sync,250)});
window.addEventListener('storage',event=>{if([SESSION_KEY,LOGOUT_KEY,'nh7_lang','nh7_device_id'].includes(event.key))sync()});
setTimeout(initialize,1200);
setInterval(sync,3000);
window.NH7_NATIVE_PUSH_QA_VERSION=VERSION;
})();
