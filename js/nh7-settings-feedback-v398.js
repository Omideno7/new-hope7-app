/* New Hope 7 — Settings action feedback + complete offline cleanup v3.9.8 */
(()=>{'use strict';
if(window.__NH7_SETTINGS_FEEDBACK_V398__)return;
window.__NH7_SETTINGS_FEEDBACK_V398__=true;

const DB_NAME='nh7-offline-audio-v397';
const DB_STORE='media';
const LS_PREFIXES=['nh7_audio_media_v397:','nh7_audio_media_v396:','nh7_offline_media_'];
const NATIVE_DIRS=['offline_audio_v397','offline_audio_v396','offline_media'];
let patchTimer=0,lastMessage='',lastType='',lastAt=0;

const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return['fa','en','hr'].includes(v)?v:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function plugin(name){return window.Capacitor?.Plugins?.[name]||window.Capacitor?.[name]||null}
function isNative(){try{return!!(window.Capacitor?.isNativePlatform?.()||['ios','android'].includes(window.Capacitor?.getPlatform?.()))}catch(_){return false}}

function settingsRoot(){const clear=document.getElementById('clearOfflineMedia');return clear?.closest('section,.card')||document.getElementById('view')}
function ensureStatus(){
  const root=settingsRoot();if(!root)return null;
  let node=root.querySelector('[data-v398-settings-status]');
  if(!node){node=document.createElement('div');node.dataset.v398SettingsStatus='1';node.className='nh7-settings398-status';node.setAttribute('role','status');node.setAttribute('aria-live','polite');const anchor=document.getElementById('settingsLang')||root.firstElementChild;anchor?.insertAdjacentElement('afterend',node)}
  if(lastMessage&&Date.now()-lastAt<15000){node.textContent=lastMessage;node.className='nh7-settings398-status'+(lastType?' is-'+lastType:'');node.hidden=false}else node.hidden=true;
  return node;
}
function status(message,type='busy',persistMs=8000){
  lastMessage=message;lastType=type;lastAt=Date.now();
  const node=ensureStatus();if(node){node.textContent=message;node.className='nh7-settings398-status'+(type?' is-'+type:'');node.hidden=false}
  if(persistMs>0)setTimeout(()=>{if(Date.now()-lastAt>=persistMs){const current=document.querySelector('[data-v398-settings-status]');if(current)current.hidden=true}},persistMs+20);
}
function setBusy(button,busy,label=''){
  if(!button)return;
  if(busy){if(!button.dataset.v398Original)button.dataset.v398Original=button.textContent||'';button.disabled=true;if(label)button.textContent=label;button.classList.add('is-v398-busy')}
  else{button.disabled=false;if(button.dataset.v398Original){button.textContent=button.dataset.v398Original;delete button.dataset.v398Original}button.classList.remove('is-v398-busy')}
}

function openDbExisting(){return new Promise((resolve,reject)=>{if(!('indexedDB'in window)){resolve(null);return}let created=false;const request=indexedDB.open(DB_NAME);request.onupgradeneeded=()=>{created=true};request.onsuccess=()=>{const db=request.result;if(created){db.close();indexedDB.deleteDatabase(DB_NAME);resolve(null)}else resolve(db)};request.onerror=()=>reject(request.error||new Error('IndexedDB open failed'))})}
async function countDb(){try{const db=await openDbExisting();if(!db||!db.objectStoreNames.contains(DB_STORE)){db?.close();return 0}return await new Promise(resolve=>{const tx=db.transaction(DB_STORE,'readonly'),req=tx.objectStore(DB_STORE).count();req.onsuccess=()=>resolve(Number(req.result||0));req.onerror=()=>resolve(0);tx.oncomplete=()=>db.close();tx.onabort=()=>{db.close();resolve(0)}})}catch(_){return 0}}
async function clearDb(){
  try{const db=await openDbExisting();if(db&&db.objectStoreNames.contains(DB_STORE)){await new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).clear();tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});db.close()}}
  catch(error){console.warn('[NH7 settings v398] IndexedDB clear',error)}
  await new Promise(resolve=>{if(!('indexedDB'in window)){resolve();return}const request=indexedDB.deleteDatabase(DB_NAME),timer=setTimeout(resolve,1200);request.onsuccess=request.onerror=request.onblocked=()=>{clearTimeout(timer);resolve()}});
}
async function clearCaches(){
  if(!('caches'in window))return 0;let removed=0;
  try{for(const key of await caches.keys()){if(/^nh7-/i.test(key)&&/(audio|media)/i.test(key)&&!/(core|shell)/i.test(key)){if(await caches.delete(key))removed++}}}catch(error){console.warn('[NH7 settings v398] cache clear',error)}
  return removed;
}
function clearLocalMetadata(){let removed=0;const keys=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key&&LS_PREFIXES.some(prefix=>key.startsWith(prefix)))keys.push(key)}for(const key of keys){localStorage.removeItem(key);removed++}return removed}
async function clearNative(){
  if(!isNative())return 0;const Filesystem=plugin('Filesystem');if(!Filesystem)return 0;let removed=0;
  for(const path of NATIVE_DIRS){try{await Filesystem.rmdir({directory:'DATA',path,recursive:true});removed++}catch(_){} }
  return removed;
}
async function tellLegacyWorker(){
  if(!('serviceWorker'in navigator))return;
  try{const registration=await Promise.race([navigator.serviceWorker.ready,sleep(800).then(()=>null)]),target=navigator.serviceWorker.controller||registration?.active||registration?.waiting;if(!target)return;await new Promise(resolve=>{const channel=new MessageChannel(),timer=setTimeout(resolve,900);channel.port1.onmessage=()=>{clearTimeout(timer);resolve()};target.postMessage({type:'CLEAR_MEDIA'},[channel.port2])})}catch(_){}
}
async function clearAllDownloads(button){
  if(!confirm(L('همه فایل‌های صوتی و PDF دانلودشده از این دستگاه پاک شوند؟','Clear all downloaded audio and PDF files from this device?','Obrisati sve preuzete audio i PDF datoteke s uređaja?')))return;
  setBusy(button,true,L('در حال پاک‌کردن…','Clearing…','Brisanje…'));status(L('در حال پاک‌کردن فایل‌های دانلودشده…','Clearing downloaded files…','Brisanje preuzetih datoteka…'),'busy',0);
  const beforeDb=await countDb();
  try{
    try{await window.NH7_AUDIO_SIGNED_V397?.clearAll?.()}catch(error){console.warn('[NH7 settings v398] audio API clear',error)}
    await clearDb();const cacheCount=await clearCaches(),metaCount=clearLocalMetadata(),nativeCount=await clearNative();await tellLegacyWorker();
    document.querySelectorAll('[data-v397-download],[data-v396-download],[data-offline-download]').forEach(node=>{node.dataset.offlineCached='0';node.classList.remove('is-downloaded-v397','is-downloaded-v396');node.textContent=L('دانلود برای آفلاین','Download offline','Preuzmi offline')});
    const total=beforeDb+metaCount+nativeCount;
    status(total||cacheCount?L(`فایل‌های دانلودشده پاک شدند ✓ (${Math.max(total,cacheCount)} مورد)`,`Downloaded files were cleared ✓ (${Math.max(total,cacheCount)} items)`,`Preuzete datoteke su obrisane ✓ (${Math.max(total,cacheCount)} stavki)`):L('فایل دانلودشده‌ای برای پاک‌کردن پیدا نشد.','No downloaded files were found.','Nije pronađena nijedna preuzeta datoteka.'),'ok',10000);
  }catch(error){console.error('[NH7 settings v398] clear failed',error);status(L('پاک‌کردن کامل نشد؛ دوباره تلاش کنید.','Cleanup did not finish; try again.','Brisanje nije dovršeno; pokušajte ponovno.'),'error',10000)}finally{setBusy(button,false)}
}

function patch(){
  const clear=document.getElementById('clearOfflineMedia');if(!clear)return;
  ensureStatus();
  if(!clear.dataset.v398){clear.dataset.v398='1';clear.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();clearAllDownloads(clear)},true)}
  const prepare=document.getElementById('prepareOffline');if(prepare&&!prepare.dataset.v398){prepare.dataset.v398='1';prepare.addEventListener('click',()=>{status(L('آماده‌سازی آفلاین شروع شد…','Offline preparation started…','Pokrenuta je offline priprema…'),'busy',4500);setTimeout(()=>status(L('درخواست آماده‌سازی ارسال شد ✓','Offline preparation request was sent ✓','Zahtjev za offline pripremu je poslan ✓'),'ok',7000),1600)},true)}
  const notify=document.getElementById('enableNotify');if(notify&&!notify.dataset.v398){notify.dataset.v398='1';notify.addEventListener('click',()=>{status(L('در حال بررسی اجازه اعلان‌ها…','Checking notification permission…','Provjera dopuštenja za obavijesti…'),'busy',4000);setTimeout(()=>{const p=globalThis.Notification?.permission||'default';status(p==='granted'?L('اعلان‌ها فعال هستند ✓','Notifications are enabled ✓','Obavijesti su omogućene ✓'):p==='denied'?L('اجازه اعلان‌ها رد شده است.','Notification permission is denied.','Dopuštenje za obavijesti je odbijeno.'):L('درخواست اعلان‌ها اجرا شد؛ پاسخ پنجره سیستم را انتخاب کنید.','Notification request ran; choose an option in the system dialog.','Zahtjev za obavijesti je pokrenut; odaberite opciju u dijalogu.'),p==='denied'?'error':'ok',8000)},1200)},true)}
  const sync=document.getElementById('syncCloud');if(sync&&!sync.dataset.v398){sync.dataset.v398='1';sync.addEventListener('click',()=>{status(L('همگام‌سازی ابری شروع شد…','Cloud sync started…','Pokrenuta je sinkronizacija…'),'busy',4000);setTimeout(()=>status(L('فرآیند همگام‌سازی اجرا شد ✓','Cloud sync process ran ✓','Sinkronizacija je pokrenuta ✓'),'ok',7000),1700)},true)}
  const refresh=document.getElementById('clearCache');if(refresh&&!refresh.dataset.v398){refresh.dataset.v398='1';refresh.addEventListener('click',()=>status(L('در حال تازه‌سازی برنامه…','Refreshing the app…','Osvježavanje aplikacije…'),'busy',5000),true)}
  const language=document.getElementById('settingsLang');if(language&&!language.dataset.v398){language.dataset.v398='1';language.addEventListener('change',()=>status(L('زبان برنامه تغییر کرد ✓','App language changed ✓','Jezik aplikacije je promijenjen ✓'),'ok',5000),true)}
}

const style=document.createElement('style');style.id='nh7-settings-feedback-v398-style';style.textContent=`.nh7-settings398-status{margin:10px 0 14px;padding:11px 13px;border-radius:12px;background:#fff8e7;color:#765600;border:1px solid #edd893;font-weight:700;line-height:1.65}.nh7-settings398-status[hidden]{display:none}.nh7-settings398-status.is-ok{background:#ecfdf3;color:#08783d;border-color:#9ad9b5}.nh7-settings398-status.is-error{background:#fff1f0;color:#a4251c;border-color:#efb0aa}.nh7-settings398-status.is-busy{background:#eef7ff;color:#145a8d;border-color:#a8d2ef}.is-v398-busy{opacity:.72;cursor:wait}`;document.head.appendChild(style);
new MutationObserver(()=>{clearTimeout(patchTimer);patchTimer=setTimeout(patch,40)}).observe(document.documentElement,{childList:true,subtree:true});
setTimeout(patch,250);
window.NH7_SETTINGS_FEEDBACK_VERSION='3.9.8';
window.NH7_SETTINGS_FEEDBACK_V398={patch,clearAllDownloads};
})();
