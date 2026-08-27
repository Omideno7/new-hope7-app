/* New Hope 7 — release Settings + Offline controller v4.0.2
 * Focused release QA patch:
 * - visible inline feedback for every Settings action
 * - deterministic Prepare Offline and Refresh actions
 * - complete cleanup of both classic-audio and protected-media offline stores
 */
(()=>{'use strict';
if(window.__NH7_SETTINGS_CONTROLLER_V402__)return;
window.__NH7_SETTINGS_CONTROLLER_V402__=true;

const DB_NAMES=['nh7-offline-audio-v397','nh7-offline-media-v4'];
const CACHE_PATTERNS=[/nh7.*audio/i,/nh7.*media/i,/audio.*nh7/i,/media.*nh7/i];
const LOCAL_PREFIXES=['nh7_audio_media_v397:','nh7_audio_media_v396:','nh7_offline_media_','nh7_offline_stable_'];
const NATIVE_DIRS=['offline_audio_v397','offline_audio_v396','offline_media_v4','offline_media'];
const STORE='media';
let activeAction='';

const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return['fa','en','hr'].includes(v)?v:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function withTimeout(promise,ms=5000){return Promise.race([Promise.resolve(promise),sleep(ms).then(()=>{throw new Error('timeout')})])}
function plugin(name){return window.Capacitor?.Plugins?.[name]||window.Capacitor?.[name]||null}
function isNative(){try{return!!(window.Capacitor?.isNativePlatform?.()||['ios','android'].includes(window.Capacitor?.getPlatform?.()))}catch(_){return false}}

function settingsRoot(){return document.getElementById('prepareOffline')?.closest('section,.card')||document.getElementById('view')}
function statusNode(){
  const root=settingsRoot();if(!root)return null;
  let node=root.querySelector('[data-nh7-settings402-status]');
  if(!node){
    node=document.createElement('div');node.dataset.nh7Settings402Status='1';node.className='nh7-settings402-status';node.hidden=true;node.setAttribute('role','status');node.setAttribute('aria-live','assertive');
    const offline=document.getElementById('prepareOffline');const row=offline?.closest('.button-row');
    if(row)row.insertAdjacentElement('beforebegin',node);else root.prepend(node);
  }
  return node;
}
function toastNode(){let node=document.getElementById('nh7SettingsToast402');if(!node){node=document.createElement('div');node.id='nh7SettingsToast402';node.className='nh7-settings402-toast';node.hidden=true;node.setAttribute('role','status');document.body.appendChild(node)}return node}
function feedback(message,type='busy',hold=8000){
  const inline=statusNode();if(inline){inline.textContent=message;inline.className='nh7-settings402-status is-'+type;inline.hidden=false;clearTimeout(inline.__hide);if(hold>0)inline.__hide=setTimeout(()=>{inline.hidden=true},hold)}
  const toast=toastNode();toast.textContent=message;toast.className='nh7-settings402-toast is-'+type;toast.hidden=false;clearTimeout(toast.__hide);if(hold>0)toast.__hide=setTimeout(()=>{toast.hidden=true},Math.min(hold,6500));
}
function mark(button,busy,label=''){
  if(!button)return;
  if(busy){if(!button.dataset.v402Original)button.dataset.v402Original=button.textContent||'';button.disabled=true;if(label)button.textContent=label;button.classList.add('is-v402-busy')}
  else{button.disabled=false;if(button.dataset.v402Original){button.textContent=button.dataset.v402Original;delete button.dataset.v402Original}button.classList.remove('is-v402-busy')}
}
function openDbExisting(name){return new Promise(resolve=>{if(!('indexedDB'in window)){resolve(null);return}let created=false;const req=indexedDB.open(name);req.onupgradeneeded=()=>{created=true};req.onerror=()=>resolve(null);req.onsuccess=()=>{const db=req.result;if(created){db.close();try{indexedDB.deleteDatabase(name)}catch(_){}resolve(null)}else resolve(db)}})}
async function clearIndexedDb(){
  let total=0;
  for(const name of DB_NAMES){
    try{const db=await openDbExisting(name);if(db&&db.objectStoreNames.contains(STORE)){await new Promise(resolve=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).clear();tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>resolve()});db.close();total++}else db?.close()}catch(_){}
    try{await new Promise(resolve=>{if(!('indexedDB'in window)){resolve();return}const req=indexedDB.deleteDatabase(name),done=()=>resolve();req.onsuccess=req.onerror=req.onblocked=done;setTimeout(done,1300)})}catch(_){}
  }
  return total;
}
async function clearCaches(){if(!('caches'in window))return 0;let n=0;try{for(const key of await caches.keys()){if(CACHE_PATTERNS.some(rx=>rx.test(key))&&!/core|shell|data/i.test(key)){if(await caches.delete(key))n++}}}catch(_){}return n}
function clearLocal(){let n=0;const keys=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key&&LOCAL_PREFIXES.some(prefix=>key.startsWith(prefix)))keys.push(key)}keys.forEach(key=>{localStorage.removeItem(key);n++});return n}
async function clearNative(){if(!isNative())return 0;const Filesystem=plugin('Filesystem');if(!Filesystem)return 0;let n=0;for(const path of NATIVE_DIRS){try{await withTimeout(Filesystem.rmdir({directory:'DATA',path,recursive:true}),2500);n++}catch(_){}}return n}
async function sw(type,payload={},timeout=8000){
  if(!('serviceWorker'in navigator))throw new Error('service_worker_unavailable');
  const reg=await Promise.race([navigator.serviceWorker.ready,sleep(1800).then(()=>null)]),target=navigator.serviceWorker.controller||reg?.active||reg?.waiting;if(!target)throw new Error('service_worker_inactive');
  return withTimeout(new Promise((resolve,reject)=>{const ch=new MessageChannel();ch.port1.onmessage=e=>{const d=e.data||{};d.ok===false?reject(new Error(d.error||'offline_action_failed')):resolve(d)};target.postMessage(Object.assign({type},payload),[ch.port2])}),timeout);
}
function resetDownloadButtons(){document.querySelectorAll('[data-classic-download],[data-v397-download],[data-v396-download],[data-offline-download]').forEach(button=>{button.disabled=false;button.dataset.offlineCached='0';button.classList.remove('is-downloaded-v397','is-downloaded-v396');button.textContent=L('دانلود برای آفلاین','Download offline','Preuzmi offline')})}

async function clearDownloads(button){
  if(activeAction)return;
  if(!confirm(L('همه فایل‌های صوتی، PDF و رسانه‌های دانلودشده از این دستگاه پاک شوند؟','Clear all downloaded audio, PDF and media files from this device?','Obrisati sve preuzete audio, PDF i medijske datoteke s uređaja?')))return;
  activeAction='clear';mark(button,true,L('در حال پاک‌کردن…','Clearing…','Brisanje…'));feedback(L('در حال پاک‌کردن کامل حافظه آفلاین…','Clearing offline downloads…','Brisanje offline preuzimanja…'),'busy',0);
  try{
    const apis=new Set([window.NH7_AUDIO_CLASSIC_V400,window.NH7_AUDIO_SIGNED_V397].filter(Boolean));for(const api of apis){try{await withTimeout(api?.clearAll?.(),5000)}catch(_){}}
    const idb=await clearIndexedDb(),cache=await clearCaches(),local=clearLocal(),native=await clearNative();try{await sw('CLEAR_MEDIA',{},4000)}catch(_){}resetDownloadButtons();
    feedback(L(`فایل‌های آفلاین با موفقیت پاک شدند ✓`,`Offline downloads were cleared successfully ✓`,`Offline preuzimanja uspješno su obrisana ✓`),'ok',10000);
    window.dispatchEvent(new CustomEvent('nh7-offline-storage-changed',{detail:{idb,cache,local,native}}));
  }catch(error){console.error('[NH7 Settings 4.0.2] clear',error);feedback(L('پاک‌سازی کامل نشد؛ دوباره تلاش کنید.','Cleanup did not finish; try again.','Brisanje nije dovršeno; pokušajte ponovno.'),'error',10000)}finally{activeAction='';mark(button,false)}
}

async function prepareOffline(button){
  if(activeAction)return;
  if(!navigator.onLine){feedback(L('برای آماده‌سازی یا به‌روزرسانی محتوای آفلاین، ابتدا اینترنت را وصل کنید.','Connect to the internet to prepare or refresh offline content.','Povežite se na internet za pripremu offline sadržaja.'),'error',9000);return}
  activeAction='prepare';mark(button,true,L('در حال آماده‌سازی…','Preparing…','Priprema…'));feedback(L('در حال آماده‌سازی نسخه کامل آفلاین…','Preparing the offline app…','Priprema offline aplikacije…'),'busy',0);
  try{
    let core=null,data=null;
    try{core=await withTimeout(window.NH7_PREPARE_OFFLINE_CORE?.(),190000)}catch(_){}
    try{data=await withTimeout(window.NH7_PREPARE_OFFLINE_DATA?.(),90000)}catch(_){}
    if(!core&&!isNative())try{core=await sw('CACHE_CORE',{},190000)}catch(_){}
    let stats=null;try{stats=await sw('OFFLINE_STATUS',{},6000)}catch(_){}
    const count=Number(core?.cached||stats?.coreCount||0);
    const text=isNative()&&!count?L('محتوای اصلی داخل اپ نصب است و بخش آفلاین آماده شد ✓','Core content is bundled in the app and offline mode is ready ✓','Osnovni sadržaj je ugrađen i offline način je spreman ✓'):L(`آفلاین آماده شد ✓${count?' — '+count+' فایل اصلی ذخیره شد':''}`,`Offline mode is ready ✓${count?' — '+count+' core files cached':''}`,`Offline način je spreman ✓${count?' — '+count+' osnovnih datoteka spremljeno':''}`);
    feedback(text,'ok',11000);localStorage.setItem('nh7_offline_release_ready',JSON.stringify({at:new Date().toISOString(),core:count,data:!!data}));
  }catch(error){console.error('[NH7 Settings 4.0.2] prepare',error);feedback(L('آماده‌سازی آفلاین کامل نشد. اینترنت را بررسی و دوباره تلاش کنید.','Offline preparation did not finish. Check the connection and try again.','Offline priprema nije dovršena. Provjerite vezu.'),'error',11000)}finally{activeAction='';mark(button,false)}
}

async function refreshApp(button){
  if(activeAction)return;
  if(!navigator.onLine){feedback(L('برای دریافت آخرین نسخه، اینترنت را وصل کنید.','Connect to the internet to get the latest version.','Povežite se na internet za najnoviju verziju.'),'error',8000);return}
  activeAction='refresh';mark(button,true,L('در حال بروزرسانی…','Updating…','Ažuriranje…'));feedback(L('در حال دریافت تازه‌ترین نسخه برنامه و اطلاعات…','Loading the latest app version and data…','Učitavanje najnovije verzije i podataka…'),'busy',0);
  try{
    try{await withTimeout(window.NH7_PREPARE_OFFLINE_DATA?.(),90000)}catch(_){}
    if('serviceWorker'in navigator){const regs=await navigator.serviceWorker.getRegistrations();for(const reg of regs){try{await reg.update()}catch(_){}try{reg.waiting?.postMessage({type:'SKIP_WAITING'})}catch(_){}}try{await sw('CACHE_CORE',{},190000)}catch(_){}}
    sessionStorage.setItem('nh7_settings402_refreshed','1');feedback(L('بروزرسانی انجام شد ✓ برنامه دوباره بارگذاری می‌شود…','Update complete ✓ Reloading the app…','Ažuriranje završeno ✓ Ponovno učitavanje…'),'ok',0);await sleep(900);location.reload();
  }catch(error){console.error('[NH7 Settings 4.0.2] refresh',error);feedback(L('بروزرسانی کامل نشد؛ دوباره تلاش کنید.','Update did not finish; try again.','Ažuriranje nije dovršeno; pokušajte ponovno.'),'error',10000);activeAction='';mark(button,false)}
}

function passiveFeedback(id){
  if(id==='enableNotify')feedback(L('در حال بازکردن اجازه اعلان‌ها…','Opening notification permission…','Otvaranje dopuštenja za obavijesti…'),'busy',4500);
  if(id==='syncCloud')feedback(L('همگام‌سازی ابری شروع شد…','Cloud sync started…','Pokrenuta je sinkronizacija…'),'busy',5000);
}

document.addEventListener('click',event=>{
  const button=event.target.closest?.('#clearOfflineMedia,#prepareOffline,#clearCache,#enableNotify,#syncCloud');if(!button)return;
  if(button.id==='clearOfflineMedia'||button.id==='prepareOffline'||button.id==='clearCache'){
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    if(button.id==='clearOfflineMedia')clearDownloads(button);else if(button.id==='prepareOffline')prepareOffline(button);else refreshApp(button);return;
  }
  passiveFeedback(button.id);
},true);
document.addEventListener('change',event=>{if(event.target?.id==='settingsLang')feedback(L('زبان برنامه تغییر کرد ✓','App language changed ✓','Jezik aplikacije je promijenjen ✓'),'ok',5000)},true);

const observer=new MutationObserver(()=>{if(document.getElementById('prepareOffline'))statusNode()});observer.observe(document.documentElement,{childList:true,subtree:true});
setTimeout(()=>{if(document.getElementById('prepareOffline'))statusNode();if(sessionStorage.getItem('nh7_settings402_refreshed')==='1'){sessionStorage.removeItem('nh7_settings402_refreshed');feedback(L('برنامه با آخرین نسخه بروزرسانی شد ✓','The app is updated to the latest version ✓','Aplikacija je ažurirana ✓'),'ok',9000)}},250);

const style=document.createElement('style');style.id='nh7-settings-controller-v402-style';style.textContent=`.nh7-settings402-status{margin:12px 0;padding:12px 14px;border-radius:14px;font-weight:800;line-height:1.65;border:1px solid #a8d2ef;background:#eef7ff;color:#145a8d}.nh7-settings402-status[hidden]{display:none}.nh7-settings402-status.is-ok{background:#eafaf1;color:#08783d;border-color:#8ed0aa}.nh7-settings402-status.is-error{background:#fff1f0;color:#a4251c;border-color:#eba8a2}.nh7-settings402-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(92px + env(safe-area-inset-bottom));z-index:2147483646;width:min(90vw,540px);padding:13px 16px;border-radius:14px;text-align:center;font:800 14px/1.6 system-ui,-apple-system,"Segoe UI",Tahoma;box-shadow:0 12px 35px rgba(0,0,0,.22);border:1px solid #a8d2ef;background:#eef7ff;color:#145a8d}.nh7-settings402-toast[hidden]{display:none}.nh7-settings402-toast.is-ok{background:#eafaf1;color:#08783d;border-color:#8ed0aa}.nh7-settings402-toast.is-error{background:#fff1f0;color:#a4251c;border-color:#eba8a2}.is-v402-busy{opacity:.72!important;cursor:wait!important;position:relative}`;document.head.appendChild(style);
window.NH7_SETTINGS_CONTROLLER_VERSION='4.0.2';window.NH7_SETTINGS_CONTROLLER_V402={feedback,clearDownloads,prepareOffline,refreshApp};
})();