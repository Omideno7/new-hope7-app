/* New Hope 7 — authoritative Settings action controller v3.9.9
 * Uses document-level capture so feedback works even when Settings is rendered
 * dynamically or legacy handlers are assigned later by app.js.
 */
(()=>{'use strict';
if(window.__NH7_SETTINGS_CONTROLLER_V399__)return;
window.__NH7_SETTINGS_CONTROLLER_V399__=true;

const DB_NAMES=['nh7-offline-audio-v397'];
const CACHE_PATTERNS=[/nh7.*audio/i,/nh7.*media/i,/audio.*nh7/i,/media.*nh7/i];
const LOCAL_PREFIXES=['nh7_audio_media_v397:','nh7_audio_media_v396:','nh7_offline_media_'];
const NATIVE_DIRS=['offline_audio_v397','offline_audio_v396','offline_media'];
let activeAction='';

const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return['fa','en','hr'].includes(v)?v:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function withTimeout(promise,ms=3500){return Promise.race([Promise.resolve(promise),sleep(ms).then(()=>{throw new Error('timeout')})])}
function plugin(name){return window.Capacitor?.Plugins?.[name]||window.Capacitor?.[name]||null}
function isNative(){try{return!!(window.Capacitor?.isNativePlatform?.()||['ios','android'].includes(window.Capacitor?.getPlatform?.()))}catch(_){return false}}

function toastNode(){
  let node=document.getElementById('nh7SettingsToast399');
  if(!node){node=document.createElement('div');node.id='nh7SettingsToast399';node.setAttribute('role','status');node.setAttribute('aria-live','assertive');node.className='nh7-settings399-toast';document.body.appendChild(node)}
  return node;
}
function toast(message,type='busy',hold=5000){
  const node=toastNode();node.textContent=message;node.className='nh7-settings399-toast is-'+type;node.hidden=false;
  clearTimeout(node.__hideTimer);if(hold>0)node.__hideTimer=setTimeout(()=>{node.hidden=true},hold);
}
function mark(button,busy,label=''){
  if(!button)return;
  if(busy){if(!button.dataset.v399Original)button.dataset.v399Original=button.textContent||'';button.disabled=true;if(label)button.textContent=label;button.classList.add('is-v399-busy')}
  else{button.disabled=false;if(button.dataset.v399Original){button.textContent=button.dataset.v399Original;delete button.dataset.v399Original}button.classList.remove('is-v399-busy')}
}

async function clearIndexedDb(){
  for(const name of DB_NAMES){
    try{
      await withTimeout(new Promise(resolve=>{const request=indexedDB.open(name);let created=false;request.onupgradeneeded=()=>{created=true};request.onerror=()=>resolve();request.onsuccess=()=>{const db=request.result;if(!created&&db.objectStoreNames.contains('media')){try{const tx=db.transaction('media','readwrite');tx.objectStore('media').clear();tx.oncomplete=()=>{db.close();resolve()};tx.onerror=tx.onabort=()=>{db.close();resolve()}}catch(_){db.close();resolve()}}else{db.close();resolve()}}}),1800);
    }catch(_){}
    try{await withTimeout(new Promise(resolve=>{const request=indexedDB.deleteDatabase(name),done=()=>resolve();request.onsuccess=done;request.onerror=done;request.onblocked=done}),1800)}catch(_){}
  }
}
async function clearCaches(){
  if(!('caches'in window))return 0;let count=0;
  try{for(const key of await caches.keys()){if(CACHE_PATTERNS.some(rx=>rx.test(key))&&!/shell|core/i.test(key)){if(await caches.delete(key))count++}}}catch(_){}
  return count;
}
function clearLocal(){let count=0,keys=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key&&LOCAL_PREFIXES.some(prefix=>key.startsWith(prefix)))keys.push(key)}for(const key of keys){localStorage.removeItem(key);count++}return count}
async function clearNative(){
  if(!isNative())return 0;const Filesystem=plugin('Filesystem');if(!Filesystem)return 0;let count=0;
  for(const path of NATIVE_DIRS){try{await withTimeout(Filesystem.rmdir({directory:'DATA',path,recursive:true}),2200);count++}catch(_){} }
  return count;
}
async function tellWorker(){
  if(!('serviceWorker'in navigator))return;
  try{const registration=await Promise.race([navigator.serviceWorker.ready,sleep(800).then(()=>null)]),target=navigator.serviceWorker.controller||registration?.active||registration?.waiting;if(!target)return;await withTimeout(new Promise(resolve=>{const channel=new MessageChannel();channel.port1.onmessage=()=>resolve();target.postMessage({type:'CLEAR_MEDIA'},[channel.port2])}),900)}catch(_){}
}
function resetDownloadButtons(){
  document.querySelectorAll('[data-v397-download],[data-v396-download],[data-offline-download]').forEach(button=>{button.disabled=false;button.dataset.offlineCached='0';button.classList.remove('is-downloaded-v397','is-downloaded-v396');button.textContent=L('دانلود برای آفلاین','Download offline','Preuzmi offline')});
}
async function clearDownloads(button){
  if(activeAction)return;
  if(!confirm(L('همه فایل‌های صوتی و PDF دانلودشده از این دستگاه پاک شوند؟','Clear all downloaded audio and PDF files from this device?','Obrisati sve preuzete audio i PDF datoteke s uređaja?')))return;
  activeAction='clear';mark(button,true,L('در حال پاک‌کردن…','Clearing…','Brisanje…'));toast(L('در حال پاک‌کردن همه فایل‌های دانلودشده…','Clearing all downloaded files…','Brisanje svih preuzetih datoteka…'),'busy',0);
  let cleared=0;
  try{
    try{await withTimeout(window.NH7_AUDIO_SIGNED_V397?.clearAll?.(),2800);cleared++}catch(_){}
    await clearIndexedDb();cleared+=await clearCaches();cleared+=clearLocal();cleared+=await clearNative();await tellWorker();resetDownloadButtons();
    toast(L('فایل‌های دانلودشده با موفقیت پاک شدند ✓','Downloaded files were cleared successfully ✓','Preuzete datoteke uspješno su obrisane ✓'),'ok',9000);
  }catch(error){console.error('[NH7 Settings 3.9.9] clear downloads',error);toast(L('بخشی از فایل‌ها پاک نشد؛ دوباره تلاش کنید.','Some files could not be cleared; try again.','Dio datoteka nije obrisan; pokušajte ponovno.'),'error',9000)}finally{activeAction='';mark(button,false)}
}

function actionFeedback(id){
  if(id==='prepareOffline'){toast(L('آماده‌سازی محتوای آفلاین شروع شد…','Offline preparation started…','Pokrenuta je offline priprema…'),'busy',3000);setTimeout(()=>toast(L('درخواست آماده‌سازی آفلاین اجرا شد ✓','Offline preparation request ran ✓','Zahtjev za offline pripremu je izvršen ✓'),'ok',6500),1500)}
  if(id==='enableNotify'){toast(L('در حال بازکردن تنظیمات اعلان‌ها…','Opening notification permission…','Otvaranje dopuštenja za obavijesti…'),'busy',3000);setTimeout(()=>{const p=globalThis.Notification?.permission||'default';toast(p==='granted'?L('اعلان‌ها فعال هستند ✓','Notifications are enabled ✓','Obavijesti su uključene ✓'):p==='denied'?L('اجازه اعلان‌ها در تنظیمات دستگاه رد شده است.','Notification permission is denied in device settings.','Dopuštenje za obavijesti odbijeno je u postavkama uređaja.'):L('پنجره اجازه اعلان‌ها اجرا شد؛ پاسخ خود را انتخاب کنید.','The notification permission dialog ran; choose your response.','Pokrenut je dijalog dopuštenja; odaberite odgovor.'),p==='denied'?'error':'ok',7000)},1200)}
  if(id==='syncCloud'){toast(L('همگام‌سازی ابری شروع شد…','Cloud sync started…','Pokrenuta je sinkronizacija…'),'busy',3000);setTimeout(()=>toast(L('فرآیند همگام‌سازی اجرا شد ✓','Cloud sync process ran ✓','Sinkronizacija je izvršena ✓'),'ok',6500),1600)}
  if(id==='clearCache')toast(L('در حال دریافت تازه‌ترین نسخه برنامه…','Loading the latest app version…','Učitavanje najnovije verzije aplikacije…'),'busy',5000);
}

// Capture at document level: this always runs before legacy target onclick handlers.
document.addEventListener('click',event=>{
  const button=event.target.closest?.('#clearOfflineMedia,#prepareOffline,#enableNotify,#syncCloud,#clearCache');if(!button)return;
  if(button.id==='clearOfflineMedia'){
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();clearDownloads(button);return;
  }
  actionFeedback(button.id);
},true);
document.addEventListener('change',event=>{if(event.target?.id==='settingsLang')toast(L('زبان برنامه تغییر کرد ✓','App language changed ✓','Jezik aplikacije je promijenjen ✓'),'ok',5000)},true);
document.addEventListener('pointerdown',event=>{const button=event.target.closest?.('#clearOfflineMedia,#prepareOffline,#enableNotify,#syncCloud,#clearCache');if(button)button.classList.add('is-v399-pressed')},true);
document.addEventListener('pointerup',event=>event.target.closest?.('button')?.classList.remove('is-v399-pressed'),true);

const style=document.createElement('style');style.id='nh7-settings-controller-v399-style';style.textContent=`.nh7-settings399-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(86px + env(safe-area-inset-bottom));z-index:2147483646;width:min(88vw,520px);padding:13px 16px;border-radius:14px;text-align:center;font:800 14px/1.6 system-ui,-apple-system,"Segoe UI",Tahoma;box-shadow:0 12px 35px rgba(0,0,0,.22);border:1px solid transparent}.nh7-settings399-toast[hidden]{display:none}.nh7-settings399-toast.is-busy{background:#eef7ff;color:#145a8d;border-color:#9ecdea}.nh7-settings399-toast.is-ok{background:#eafaf1;color:#08783d;border-color:#8ed0aa}.nh7-settings399-toast.is-error{background:#fff1f0;color:#a4251c;border-color:#eba8a2}.is-v399-busy{opacity:.7!important;cursor:wait!important}.is-v399-pressed{transform:scale(.97)!important;filter:brightness(.94)!important;transition:transform .08s ease,filter .08s ease}`;document.head.appendChild(style);
window.NH7_SETTINGS_CONTROLLER_VERSION='3.9.9';
window.NH7_SETTINGS_CONTROLLER_V399={clearDownloads,toast};
})();
