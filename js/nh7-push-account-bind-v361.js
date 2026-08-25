/* New Hope 7 v3.6.1 — bind OneSignal web subscriptions to authenticated account UUID.
   Uses OneSignal.login(external_id) and never stores raw email in OneSignal tags. */
(()=>{'use strict';
if(window.__NH7_PUSH_ACCOUNT_BIND_V361__)return;
window.__NH7_PUSH_ACCOUNT_BIND_V361__=true;
const VERSION='3.6.1-account-push-bind';
const SESSION_KEY='nh7_user_session_v170';
const LOGOUT_KEY='nh7_explicit_logout';
let lastSignature='',queued=false;
function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}}
function deviceId(){return String(localStorage.getItem('nh7_device_id')||'').trim()}
function language(){const x=String(localStorage.getItem('nh7_lang')||document.documentElement.lang||'en').toLowerCase();return x.startsWith('fa')?'fa':x.startsWith('hr')?'hr':'en'}
function signature(){const s=session(),loggedOut=localStorage.getItem(LOGOUT_KEY)==='1',id=!loggedOut?String(s?.user?.id||'').trim():'';let permission='unsupported';try{permission=typeof Notification!=='undefined'?Notification.permission:'unsupported'}catch(_){}return[id,loggedOut?'1':'0',deviceId(),language(),permission].join('|')}
function queueBind(){
  const sig=signature();if(sig===lastSignature||queued)return;lastSignature=sig;queued=true;
  window.OneSignalDeferred=window.OneSignalDeferred||[];
  window.OneSignalDeferred.push(async OneSignal=>{
    queued=false;
    try{
      const s=session(),loggedOut=localStorage.getItem(LOGOUT_KEY)==='1',userId=!loggedOut?String(s?.user?.id||'').trim():'';
      if(!userId){
        if(window.__NH7_ONESIGNAL_BOUND_USER_V361__&&OneSignal.logout)await OneSignal.logout();
        window.__NH7_ONESIGNAL_BOUND_USER_V361__='';
        window.NH7_PUSH_ACCOUNT_STATE={version:VERSION,bound:false,reason:loggedOut?'logged_out':'no_authenticated_account'};
        return;
      }
      if(OneSignal.login)await OneSignal.login(userId);
      window.__NH7_ONESIGNAL_BOUND_USER_V361__=userId;
      const tags={app:'new_hope_7',account_linked:'true',language:language(),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'local'};
      const dev=deviceId();if(dev)tags.device_id=dev;
      if(OneSignal.User?.addTags)await OneSignal.User.addTags(tags);
      let optedIn=OneSignal.User?.PushSubscription?.optedIn===true;
      let permission='default';try{permission=typeof Notification!=='undefined'?Notification.permission:'unsupported'}catch(_){}
      if(permission==='granted'&&!optedIn&&OneSignal.User?.PushSubscription?.optIn){try{await OneSignal.User.PushSubscription.optIn();optedIn=OneSignal.User.PushSubscription.optedIn===true}catch(e){console.warn('[NH7 push] optIn failed',e)}}
      window.NH7_PUSH_ACCOUNT_STATE={version:VERSION,bound:true,userId,permission,optedIn,subscriptionId:OneSignal.User?.PushSubscription?.id||null};
    }catch(error){queued=false;console.warn('[NH7 push] account bind failed',error);window.NH7_PUSH_ACCOUNT_STATE={version:VERSION,bound:false,error:String(error?.message||error)}}
  });
}
window.addEventListener('storage',event=>{if([SESSION_KEY,LOGOUT_KEY,'nh7_device_id','nh7_lang'].includes(event.key))queueBind()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)queueBind()});
window.addEventListener('pageshow',queueBind);
setInterval(queueBind,2500);
setTimeout(queueBind,250);
window.NH7_PUSH_ACCOUNT_BIND_VERSION=VERSION;
})();