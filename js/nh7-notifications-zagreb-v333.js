/* New Hope 7 v3.3.3 — one Croatia-reference notification source; prevent duplicate local schedules */
(()=>{'use strict';
const VERSION='3.3.3-zagreb-notifications';
const BUILD='2.3.9.33';
const LEGACY_MIN=17000,LEGACY_MAX=19999;
const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return['fa','en','hr'].includes(v)?v:'en'};
const zone=()=>Intl.DateTimeFormat().resolvedOptions().timeZone||'local';
function nativePlugin(){return window.Capacitor?.Plugins?.LocalNotifications||window.Capacitor?.LocalNotifications||null}
async function cancelLegacyLocal(){const N=nativePlugin();if(!N?.getPending||!N?.cancel)return false;try{const rows=(await N.getPending())?.notifications||[],ours=rows.filter(x=>Number(x?.id)>=LEGACY_MIN&&Number(x?.id)<=LEGACY_MAX).map(x=>({id:Number(x.id)}));if(ours.length)await N.cancel({notifications:ours});localStorage.setItem('nh7_local_schedule_retired_v333',BUILD);return true}catch(error){console.warn('NH7 legacy local notification cleanup',error);return false}}
function patchNative(){const N=nativePlugin();if(!N||N.__nh7ZagrebV333)return !!N;N.__nh7ZagrebV333=true;const original=N.schedule?.bind(N);if(original){N.schedule=async options=>{const rows=Array.isArray(options?.notifications)?options.notifications:[];const keep=rows.filter(x=>!(Number(x?.id)>=LEGACY_MIN&&Number(x?.id)<=LEGACY_MAX));if(!keep.length)return{notifications:[]};return original(Object.assign({},options,{notifications:keep}))}}
cancelLegacyLocal();return true}
function tagOneSignal(){window.OneSignalDeferred=window.OneSignalDeferred||[];window.OneSignalDeferred.push(async OneSignal=>{try{const tags={app:'new_hope_7',language:lang(),timezone:zone(),notification_clock:'Europe/Zagreb',notification_source:'server_v333'};if(OneSignal.User?.addTags)await OneSignal.User.addTags(tags)}catch(error){console.warn('NH7 OneSignal tags',error)}})}
let attempts=0;const boot=()=>{attempts++;patchNative();if(attempts<40&&!nativePlugin())setTimeout(boot,250)};boot();tagOneSignal();
window.addEventListener('pageshow',()=>{patchNative();cancelLegacyLocal();tagOneSignal()});
window.addEventListener('online',()=>{patchNative();cancelLegacyLocal();tagOneSignal()});
window.addEventListener('storage',event=>{if(event.key==='nh7_lang')tagOneSignal()});
window.NH7_NOTIFICATIONS_ZAGREB_VERSION=VERSION;
})();
