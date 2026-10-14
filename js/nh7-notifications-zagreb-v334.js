/* New Hope 7 v3.3.5 — app-language synchronized OneSignal notifications */
(()=>{'use strict';
const VERSION='3.3.5-app-language-push';
const BUILD='2.3.9.35';
const APP_ID='86f4116a-707a-4959-aa3f-7c703f57bf7e';
const LEGACY_MIN=17000,LEGACY_MAX=19999;
const appLang=()=>{const v=String(localStorage.getItem('nh7_lang')||document.documentElement.lang||'en').toLowerCase().slice(0,2);return ['fa','en','hr'].includes(v)?v:'en'};
const zone=()=>Intl.DateTimeFormat().resolvedOptions().timeZone||'local';
let webSignal=null,nativeSignalRef=null,languageSyncTimer=null;
function localPlugin(){return window.Capacitor?.Plugins?.LocalNotifications||window.Capacitor?.LocalNotifications||null}
async function cancelLegacyLocal(){const N=localPlugin();if(!N?.getPending||!N?.cancel)return false;try{const rows=(await N.getPending())?.notifications||[],ours=rows.filter(x=>Number(x?.id)>=LEGACY_MIN&&Number(x?.id)<=LEGACY_MAX).map(x=>({id:Number(x.id)}));if(ours.length)await N.cancel({notifications:ours});localStorage.setItem('nh7_local_schedule_retired_v335',BUILD);return true}catch(error){console.warn('NH7 legacy local notification cleanup',error);return false}}
function patchLocal(){const N=localPlugin();if(!N||N.__nh7ZagrebV335)return !!N;N.__nh7ZagrebV335=true;const original=N.schedule?.bind(N);if(original){N.schedule=async options=>{const rows=Array.isArray(options?.notifications)?options.notifications:[];const keep=rows.filter(x=>!(Number(x?.id)>=LEGACY_MIN&&Number(x?.id)<=LEGACY_MAX));if(!keep.length)return{notifications:[]};return original(Object.assign({},options,{notifications:keep}))}}cancelLegacyLocal();return true}
// v364 is the sole account/language/permission owner. Keep legacy schedule retirement.
function syncSelectedLanguage(){window.NH7_SYNC_PUSH_LANGUAGE?.()}
function setupNative(){const O=nativeOneSignal();if(!O||O.__nh7V335)return;O.__nh7V335=true;try{O.initialize?.(APP_ID)}catch(error){console.warn('NH7 native OneSignal init',error)}window.NH7_PUSH_ACCOUNT_REBIND?.()}
function nativeOneSignal(){return window.plugins?.OneSignal||null}
let attempts=0;const boot=()=>{attempts++;patchLocal();if(attempts<40&&!localPlugin())setTimeout(boot,250)};boot();setupNative();
/* App language changes happen in the same document, so the browser `storage` event does not fire there. Listen to the actual language selector and re-sync OneSignal after app.js stores nh7_lang. */
document.addEventListener('change',event=>{if(event.target?.id==='langSelect')syncSelectedLanguage(20)},false);
window.addEventListener('pageshow',()=>{patchLocal();cancelLegacyLocal();syncSelectedLanguage(60);setupNative()});
window.addEventListener('online',()=>{patchLocal();cancelLegacyLocal();syncSelectedLanguage(60);setupNative()});
window.addEventListener('focus',()=>syncSelectedLanguage(80));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncSelectedLanguage(80)});
window.addEventListener('storage',event=>{if(event.key==='nh7_lang')syncSelectedLanguage(20)});
window.NH7_SYNC_PUSH_LANGUAGE=()=>syncSelectedLanguage(0);
window.NH7_NOTIFICATIONS_ZAGREB_VERSION=VERSION;
})();
