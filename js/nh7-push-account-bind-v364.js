/* v3.6.4 canonical account binding, Wave4 event-driven Web + Native fences.
 * One subscription per installation, auth.users.id external_id; no raw email tags.
 * Provider tags are presentation hints, never recipient authorization. */
(()=>{'use strict';
if(window.__NH7_PUSH_ACCOUNT_BIND_V364__)return;
window.__NH7_PUSH_ACCOUNT_BIND_V364__=true;
const VERSION='3.6.4-wave4-account-fenced',SESSION='nh7_user_session_v170',LOGOUT='nh7_explicit_logout';
let sdk=null,native=false,running=false,pending=false,lastApplied='',lastUid='',timer=0,queued=false,preferenceRequested=false,preferenceOwner='',registered=null;
const metrics={passes:0,logins:0,logouts:0,language_updates:0,stale:0};
const lang=()=>{const l=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return ['fa','en','hr'].includes(l)?l:'en'};
function claims(jwt){try{return JSON.parse(atob(jwt.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))}catch(_){return {}}}
function identity(){
 let s={};try{s=JSON.parse(localStorage.getItem(SESSION)||'{}')||{}}catch(_){}
 let jwt=String(s.access_token||''),uid=String(s.user?.id||''),role='user';
 if(document.getElementById('adminApp')){const a=window.NH7AdminAuthorityWave3?.snapshot?.()||{};try{jwt=a.is_admin&&typeof token==='string'?token:''}catch(_){jwt=''}uid=String(claims(jwt).sub||'');role=a.is_admin?'admin':'user'}
 else if(localStorage.getItem(LOGOUT)==='1'){jwt='';uid=''}
 const c=claims(jwt);if(!jwt||!uid||c.sub!==uid||!Number.isFinite(c.exp)||c.exp*1000<=Date.now()){jwt='';uid='';role='user'}
 return {uid,jwt,role,language:lang(),device:String(localStorage.getItem('nh7_device_id')||'')};
}
const getPermission=()=>native?(sdk?.Notifications?.permission===true?'granted':'default'):(typeof Notification==='undefined'?'unsupported':Notification.permission);
const signature=i=>[i.uid,i.role,i.language,i.device].join('|');
const current=i=>{const now=identity();return signature(i)===signature(now)&&i.jwt===now.jwt};
function fence(i){if(!current(i)){metrics.stale++;throw Error('identity_changed')}}
function publish(i,extra){if(!current(i))return;const state={version:VERSION,bound:!!i.uid,userId:i.uid||null,...extra};window.NH7_PUSH_ACCOUNT_STATE=state;window[native?'NH7_PUSH_ACCOUNT_NATIVE_STATE':'NH7_PUSH_ACCOUNT_WEB_STATE']=state;window.dispatchEvent(new CustomEvent('nh7-push-state-wave4',{detail:{bound:state.bound,reason:state.reason||'',permission:state.permission}}))}
const user=()=>sdk?.User;
const sub=()=>user()?.PushSubscription||user()?.pushSubscription;
async function external(){try{return String(await Promise.resolve(user()?.getExternalId?.()??user()?.externalId??lastUid)||'')}catch(_){return lastUid}}
async function register(i,id,active){
 if(window.NH7_NOTIFICATION_WAVE4_BACKEND_READY!==true||!i?.uid||!i.jwt||!window.NH7NotificationContractWave4?.uuid(id))return;
 const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),10000);
 try{const r=await fetch('https://gpzcwffxnddhaeaogdyo.supabase.co/functions/v1/nh7-notification-binding-wave4',{method:'POST',headers:{Authorization:'Bearer '+i.jwt,'Content-Type':'application/json'},body:JSON.stringify({subscription_id:id,active}),signal:ctrl.signal});if(r.ok&&active&&current(i))registered={identity:i,id}}
 catch(_){/* bounded, event-only retry; never bypass provider ownership verification */}finally{clearTimeout(timeout)}
}
async function subscriptionState(i){const s=sub();let id=String(s?.id||''),optedIn=s?.optedIn===true;if(s?.getIdAsync){id=String(await Promise.resolve(s.getIdAsync())||'');fence(i)}if(s?.getOptedInAsync){optedIn=await Promise.resolve(s.getOptedInAsync())===true;fence(i)}return {sub:s,id,optedIn}}
async function perform(i){
 metrics.passes++;const before=await subscriptionState(i);if(registered&&registered.identity.uid!==i.uid){const old=registered;registered=null;await register(old.identity,old.id,false);fence(i)}const optionalOn=localStorage.getItem('nh7_notifications_enabled_v252')!=='0';const expected=signature(i)+'|'+before.id+'|'+getPermission()+'|'+optionalOn;
 if(expected===lastApplied){if(registered?.identity.uid===i.uid)registered.identity=i;return;}
 if(!i.uid){
  if(sdk.logout){metrics.logouts++;await Promise.resolve(sdk.logout());fence(i)}
  lastUid='';lastApplied=expected;window.__NH7_ONESIGNAL_WEB_BOUND_USER_V364__='';window.__NH7_ONESIGNAL_NATIVE_BOUND_USER_V364__='';
  publish(i,{reason:localStorage.getItem(LOGOUT)==='1'?'logged_out':'no_authenticated_account'});return;
 }
 const old=await external();fence(i);
 if(old&&old!==i.uid&&sdk.logout){metrics.logouts++;await Promise.resolve(sdk.logout());fence(i);lastUid=''}
 if(old!==i.uid||lastUid!==i.uid){if(typeof sdk.login!=='function')throw Error('provider_login_unavailable');let identityToken;
 if(window.NH7_NOTIFICATION_WAVE4_BACKEND_READY===true){const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),10000);try{const r=await fetch('https://gpzcwffxnddhaeaogdyo.supabase.co/functions/v1/nh7-notification-binding-wave4',{method:'POST',headers:{Authorization:'Bearer '+i.jwt,'Content-Type':'application/json'},body:JSON.stringify({action:'identity'}),signal:ctrl.signal}),out=await r.json();fence(i);if(!r.ok||out.user_id!==i.uid||!out.identity_token)throw Error('provider_identity_unverified');identityToken=out.identity_token}finally{clearTimeout(timeout)}}
 metrics.logins++;await Promise.resolve(sdk.login(i.uid,identityToken));fence(i);lastUid=i.uid}
 if(native&&user()?.getExternalId){let verified=false;for(let n=0;n<8;n++){const got=await external();fence(i);if(got===i.uid){verified=true;break}if(n<7)await new Promise(r=>setTimeout(r,300));fence(i)}if(!verified)throw Error('external_id_unconfirmed')}
 if(user()?.setLanguage){await Promise.resolve(user().setLanguage(i.language));fence(i);metrics.language_updates++}
 // Remove inherited admin role before assigning hints for the current proven context.
 if(user()?.removeTag){await Promise.resolve(user().removeTag('role'));fence(i)}
 const tags={app:'new_hope_7',account_linked:'true',language:i.language,app_language:i.language,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'local',notification_clock:'Europe/Zagreb',notification_source:'server_v335',...(i.role==='admin'?{role:'admin'}:{}),...(i.device?{device_id:i.device}:{})};
 if(user()?.addTags){await Promise.resolve(user().addTags(tags));fence(i)}
 const permission=native?(sdk.Notifications?.permission===true?'granted':'default'):(typeof Notification==='undefined'?'unsupported':Notification.permission);
 const subscription=sub();if(optionalOn&&permission==='granted'&&!before.optedIn&&subscription?.optIn){await Promise.resolve(subscription.optIn());fence(i)}
 if(!optionalOn&&before.optedIn&&subscription?.optOut){await Promise.resolve(subscription.optOut());fence(i)}
 const after=await subscriptionState(i);lastApplied=signature(i)+'|'+after.id+'|'+permission+'|'+optionalOn;
 window[native?'__NH7_ONESIGNAL_NATIVE_BOUND_USER_V364__':'__NH7_ONESIGNAL_WEB_BOUND_USER_V364__']=i.uid;
 if(!optionalOn&&registered?.identity.uid===i.uid){const prior=registered;registered=null;await register(i,prior.id,false);fence(i)}
 if(optionalOn&&(!registered||registered.identity.uid!==i.uid||registered.id!==after.id)){await register(i,after.id,true);fence(i)}
 publish(i,{permission,optedIn:after.optedIn,subscriptionId:after.id||null,subscriptionReady:!!after.id});
}
async function drain(){
 if(running||!sdk)return;running=true;
 try{while(pending){pending=false;const i=identity();try{await perform(i)}catch(error){if(!current(i)){pending=true;continue}lastApplied='';publish(i,{bound:false,reason:String(error.message||'provider_unavailable')})}}}
 finally{running=false}
}
function request(){pending=true;clearTimeout(timer);timer=0;void drain()}
function languageChanged(){preferenceOwner=identity().uid;preferenceRequested=!!preferenceOwner;clearTimeout(timer);timer=setTimeout(()=>{timer=0;request();void syncPreference()},40)}
// Backend review gate. No speculative RPC/write on render or current Production.
let preferenceFlight=false,lastPreference='';
async function syncPreference(){
 if(!preferenceRequested||preferenceFlight||window.NH7_NOTIFICATION_WAVE4_BACKEND_READY!==true||!navigator.onLine)return;
 const i=identity(),stamp=i.uid+'|'+i.language;if(i.uid!==preferenceOwner){preferenceRequested=false;return}if(!i.uid||stamp===lastPreference)return;preferenceFlight=true;
 const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),10000);
 try{const r=await fetch('https://gpzcwffxnddhaeaogdyo.supabase.co/rest/v1/rpc/nh7_notification_preference_wave4',{method:'POST',headers:{apikey:'sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37',Authorization:'Bearer '+i.jwt,'Content-Type':'application/json'},body:JSON.stringify({p_language:i.language}),signal:ctrl.signal});if(r.ok&&current(i)){lastPreference=stamp;preferenceRequested=false}}
 catch(_){/* retry only on an actual later preference/online gesture */}finally{clearTimeout(timeout);preferenceFlight=false;if(!current(i)&&preferenceRequested)void syncPreference()}
}
function attach(O,isNative){if(sdk===O)return;sdk=O;native=isNative;lastApplied='';const subscription=sub();subscription?.addEventListener?.('change',request);O.Notifications?.addEventListener?.('permissionChange',request);request()}
function boot(){const O=window.plugins?.OneSignal;if(O){attach(O,true);return}if(window.Capacitor?.isNativePlatform?.()||window.cordova)return;if(queued)return;queued=true;window.OneSignalDeferred=window.OneSignalDeferred||[];window.OneSignalDeferred.push(O=>attach(O,false))}
['nh7-personal-owner-wave2','nh7-admin-clear-wave3','nh7-admin-access-wave3'].forEach(e=>window.addEventListener(e,request));
window.addEventListener('storage',e=>{if([SESSION,LOGOUT,'nh7_device_id','nh7_admin_token'].includes(e.key))request();if(e.key==='nh7_lang')languageChanged()});
window.addEventListener('pageshow',()=>{boot();request()});window.addEventListener('online',()=>{boot();request();void syncPreference()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){boot();request()}});
document.addEventListener('change',e=>{if(e.target?.id==='langSelect')languageChanged()});
document.addEventListener('deviceready',boot,{once:true});
async function requestPermission(){try{if(!sdk?.Notifications?.requestPermission)return 'unsupported';await Promise.resolve(sdk.Notifications.requestPermission(false));request();return getPermission()}catch(_){return 'unsupported'}}
function statusLabel(){const l=lang(),labels={fa:{granted:'مجاز',denied:'مسدود',default:'در انتظار مجوز',unsupported:'پشتیبانی نمی‌شود'},en:{granted:'allowed',denied:'blocked',default:'awaiting permission',unsupported:'unsupported'},hr:{granted:'dopušteno',denied:'blokirano',default:'čeka dozvolu',unsupported:'nije podržano'}},state=window.NH7_PUSH_ACCOUNT_STATE;return !state?.bound?(l==='fa'?'Push برای این حساب/دستگاه آماده نیست؛ Inbox همچنان در دسترس است.':l==='hr'?'Push nije spreman za ovaj račun/uređaj; ulazna pošta ostaje dostupna.':'Push is not ready for this account/device; Inbox remains available.'):(l==='fa'?'وضعیت Push دستگاه: '+(labels[l][state.permission]||labels[l].default)+'؛ دریافت واقعی نیاز به آزمون سرور و دستگاه دارد.':l==='hr'?'Push dozvola uređaja: '+(labels[l][state.permission]||labels[l].default)+'; dostava zahtijeva provjeru poslužitelja i uređaja.':'Device Push permission: '+(labels[l][state.permission]||labels[l].default)+'; delivery requires server/device verification.')}
document.addEventListener('click',e=>{if(native&&e.target?.closest?.('#quickNotify,#enableNotify'))void requestPermission()},true);
window.NH7_PUSH_ACCOUNT_REBIND=request;window.NH7_SYNC_PUSH_LANGUAGE=request;
window.NH7_PUSH_ACCOUNT_BIND_VERSION=VERSION;window.NH7PushBindingWave4=Object.freeze({identity,metrics:()=>({...metrics}),refresh:request,requestPermission,statusLabel});
boot();
})();
