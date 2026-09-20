/* New Hope 7 v3.6.4 — bind OneSignal Web + Native subscriptions to authenticated account UUID.
 * Selected admin Push targets auth.users.id as OneSignal external_id.
 * No raw email is stored in OneSignal tags.
 */
(()=>{'use strict';
if(window.__NH7_PUSH_ACCOUNT_BIND_V364__)return;
window.__NH7_PUSH_ACCOUNT_BIND_V364__=true;

const VERSION='3.6.4-account-push-bind-native-verified';
const SESSION_KEY='nh7_user_session_v170';
const LOGOUT_KEY='nh7_explicit_logout';
let lastWebSignature='',lastNativeSignature='',webQueued=false;

function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}}
function deviceId(){return String(localStorage.getItem('nh7_device_id')||'').trim()}
function language(){const x=String(localStorage.getItem('nh7_lang')||document.documentElement.lang||'en').toLowerCase();return x.startsWith('fa')?'fa':x.startsWith('hr')?'hr':'en'}
function identity(){
  const s=session(),loggedOut=localStorage.getItem(LOGOUT_KEY)==='1';
  return {loggedOut,userId:!loggedOut?String(s?.user?.id||'').trim():'',device:deviceId(),lang:language()};
}
function webPermission(){try{return typeof Notification!=='undefined'?Notification.permission:'unsupported'}catch(_){return'unsupported'}}
function baseSignature(i=identity()){return [i.userId,i.loggedOut?'1':'0',i.device,i.lang].join('|')}
function tags(i=identity()){
  const out={app:'new_hope_7',account_linked:'true',language:i.lang,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'local'};
  if(i.device)out.device_id=i.device;
  return out;
}
function isNativeRuntime(){try{return !!(window.Capacitor?.isNativePlatform?.()||['ios','android'].includes(window.Capacitor?.getPlatform?.())||window.cordova)}catch(_){return !!window.cordova}}
function nativeOneSignal(){return window.plugins?.OneSignal||null}
function nativePushSubscription(O=nativeOneSignal()){return O?.User?.pushSubscription||O?.User?.PushSubscription||null}
async function nativeSubscriptionState(O=nativeOneSignal()){
  const sub=nativePushSubscription(O);
  let id=String(sub?.id||''),optedIn=sub?.optedIn===true;
  try{if(typeof sub?.getIdAsync==='function')id=String(await Promise.resolve(sub.getIdAsync())||id)}catch(_){}
  try{if(typeof sub?.getOptedInAsync==='function')optedIn=(await Promise.resolve(sub.getOptedInAsync()))===true}catch(_){}
  return{sub,id,optedIn};
}
async function nativeExternalId(O=nativeOneSignal()){
  try{
    if(typeof O?.User?.getExternalId==='function')return String(await Promise.resolve(O.User.getExternalId())||'').trim();
    return String(O?.User?.externalId||'').trim();
  }catch(_){return''}
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function confirmNativeExternalId(O,wanted){
  for(let n=0;n<8;n++){
    const current=await nativeExternalId(O);
    if(current===wanted)return current;
    if(n<7)await sleep(300);
  }
  return await nativeExternalId(O);
}

function queueWebBind(){
  const i=identity(),sig=baseSignature(i)+'|'+webPermission();
  if(sig===lastWebSignature||webQueued)return;
  lastWebSignature=sig;webQueued=true;
  window.OneSignalDeferred=window.OneSignalDeferred||[];
  window.OneSignalDeferred.push(async OneSignal=>{
    webQueued=false;
    try{
      const current=identity(),userId=current.userId;
      if(!userId){
        if(window.__NH7_ONESIGNAL_WEB_BOUND_USER_V364__&&OneSignal.logout)await Promise.resolve(OneSignal.logout());
        window.__NH7_ONESIGNAL_WEB_BOUND_USER_V364__='';
        window.NH7_PUSH_ACCOUNT_WEB_STATE={version:VERSION,bound:false,reason:current.loggedOut?'logged_out':'no_authenticated_account'};
        return;
      }
      if(typeof OneSignal.login!=='function')throw new Error('OneSignal Web login unavailable');
      await Promise.resolve(OneSignal.login(userId));
      window.__NH7_ONESIGNAL_WEB_BOUND_USER_V364__=userId;
      if(OneSignal.User?.addTags)await Promise.resolve(OneSignal.User.addTags(tags(current)));
      let optedIn=OneSignal.User?.PushSubscription?.optedIn===true;
      const permission=webPermission();
      if(permission==='granted'&&!optedIn&&OneSignal.User?.PushSubscription?.optIn){
        try{await Promise.resolve(OneSignal.User.PushSubscription.optIn());optedIn=OneSignal.User.PushSubscription.optedIn===true}
        catch(e){console.warn('[NH7 push] web optIn failed',e)}
      }
      window.NH7_PUSH_ACCOUNT_WEB_STATE={version:VERSION,bound:true,userId,permission,optedIn,subscriptionId:OneSignal.User?.PushSubscription?.id||null};
      window.NH7_PUSH_ACCOUNT_STATE=window.NH7_PUSH_ACCOUNT_WEB_STATE;
    }catch(error){
      webQueued=false;
      console.warn('[NH7 push] web account bind failed',error);
      window.NH7_PUSH_ACCOUNT_WEB_STATE={version:VERSION,bound:false,error:String(error?.message||error)};
      window.NH7_PUSH_ACCOUNT_STATE=window.NH7_PUSH_ACCOUNT_WEB_STATE;
    }
  });
}

async function queueNativeBind(force=false){
  const O=nativeOneSignal();
  if(!O)return false;
  if(window.__NH7_NATIVE_BIND_IN_FLIGHT_V364__)return false;
  const before=await nativeSubscriptionState(O),i=identity(),sig=baseSignature(i)+'|'+before.id;
  if(!force&&sig===lastNativeSignature)return true;
  window.__NH7_NATIVE_BIND_IN_FLIGHT_V364__=true;
  try{
    const externalBefore=await nativeExternalId(O);
    if(!i.userId){
      if(externalBefore&&typeof O.logout==='function'){
        await Promise.resolve(O.logout());
        await sleep(150);
      }
      window.__NH7_ONESIGNAL_NATIVE_BOUND_USER_V364__='';
      lastNativeSignature=sig;
      const externalAfter=await nativeExternalId(O);
      window.NH7_PUSH_ACCOUNT_NATIVE_STATE={
        version:VERSION,bound:false,reason:i.loggedOut?'logged_out':'no_authenticated_account',
        subscriptionId:before.id||null,externalId:externalAfter||null
      };
      window.NH7_PUSH_ACCOUNT_STATE=window.NH7_PUSH_ACCOUNT_NATIVE_STATE;
      return true;
    }
    if(typeof O.login!=='function')throw new Error('OneSignal Native login unavailable');
    if(externalBefore!==i.userId)await Promise.resolve(O.login(i.userId));
    const confirmedExternalId=await confirmNativeExternalId(O,i.userId);
    if(confirmedExternalId!==i.userId){
      lastNativeSignature='';
      throw new Error('OneSignal Native external ID was not confirmed');
    }
    window.__NH7_ONESIGNAL_NATIVE_BOUND_USER_V364__=i.userId;
    if(O.User?.addTags)await Promise.resolve(O.User.addTags(tags(i)));
    const permission=O.Notifications?.permission===true?'granted':O.Notifications?.permission===false?'default':'unknown';
    let current=await nativeSubscriptionState(O);
    if(permission==='granted'&&!current.optedIn&&current.sub?.optIn){
      try{await Promise.resolve(current.sub.optIn());current=await nativeSubscriptionState(O)}
      catch(e){console.warn('[NH7 push] native optIn failed',e)}
    }
    lastNativeSignature=baseSignature(i)+'|'+current.id;
    window.NH7_PUSH_ACCOUNT_NATIVE_STATE={
      version:VERSION,bound:true,userId:i.userId,externalId:confirmedExternalId,
      permission,optedIn:current.optedIn,subscriptionId:current.id||null,
      subscriptionReady:!!current.id
    };
    window.NH7_PUSH_ACCOUNT_STATE=window.NH7_PUSH_ACCOUNT_NATIVE_STATE;
    return true;
  }catch(error){
    console.warn('[NH7 push] native account bind failed',error);
    window.NH7_PUSH_ACCOUNT_NATIVE_STATE={
      version:VERSION,bound:false,error:String(error?.message||error),
      subscriptionId:before.id||null,externalId:(await nativeExternalId(O))||null
    };
    window.NH7_PUSH_ACCOUNT_STATE=window.NH7_PUSH_ACCOUNT_NATIVE_STATE;
    return false;
  }finally{
    window.__NH7_NATIVE_BIND_IN_FLIGHT_V364__=false;
  }
}
function queueBind(){if(isNativeRuntime())queueNativeBind(false);else queueWebBind()}
window.addEventListener('storage',event=>{if([SESSION_KEY,LOGOUT_KEY,'nh7_device_id','nh7_lang'].includes(event.key))queueBind()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)queueBind()});
window.addEventListener('pageshow',queueBind);
document.addEventListener('deviceready',()=>queueNativeBind(true),{once:true});
setInterval(queueBind,2500);
setTimeout(queueBind,250);
window.NH7_PUSH_ACCOUNT_REBIND=()=>{lastWebSignature='';lastNativeSignature='';queueBind()};
window.NH7_PUSH_ACCOUNT_BIND_VERSION=VERSION;
})();