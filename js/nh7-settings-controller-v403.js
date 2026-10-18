/* New Hope 7 — Settings actions v4.0.3
 * Persistent visible feedback + deterministic Offline/Refresh/Clear actions.
 */
(()=>{'use strict';
if(window.__NH7_SETTINGS_CONTROLLER_V403__)return;window.__NH7_SETTINGS_CONTROLLER_V403__=true;
const DB_NAMES=['nh7-offline-audio-v397','nh7-offline-media-v4'];
const LS_PREFIXES=['nh7_audio_media_v397:','nh7_audio_media_v396:','nh7_offline_media_','nh7_offline_stable_'];
const NATIVE_DIRS=['offline_audio_v397','offline_audio_v396','offline_media_v4','offline_media'];
let busy='';
const lang=()=>{const x=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return['fa','en','hr'].includes(x)?x:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const plugin=name=>window.Capacitor?.Plugins?.[name]||window.Capacitor?.[name]||null;
const native=()=>{try{return!!(window.Capacitor?.isNativePlatform?.()||['ios','android'].includes(window.Capacitor?.getPlatform?.()))}catch(_){return false}};
function timeout(p,ms){return Promise.race([Promise.resolve(p),sleep(ms).then(()=>{throw new Error('timeout')})])}
function root(){return document.getElementById('settingsLang')?.closest('.card')||document.getElementById('view')}
function statusNode(){return null}
function show(message,type='busy'){let t=document.getElementById('nh7SettingsToast403');if(!t){t=document.createElement('div');t.id='nh7SettingsToast403';t.className='nh7-settings403-toast';document.body.appendChild(t)}t.textContent=message;t.className='nh7-settings403-toast is-'+type;t.hidden=false;clearTimeout(t.__hide);t.__hide=setTimeout(()=>{t.hidden=true},6500)}
function mark(btn,on,text=''){if(!btn)return;if(on){btn.dataset.v403Old=btn.textContent||'';btn.disabled=true;if(text)btn.textContent=text;btn.classList.add('is-v403-busy')}else{btn.disabled=false;if(btn.dataset.v403Old){btn.textContent=btn.dataset.v403Old;delete btn.dataset.v403Old}btn.classList.remove('is-v403-busy')}}
async function sw(type,ms=10000){if(!('serviceWorker'in navigator))throw new Error('service_worker_unavailable');const reg=await Promise.race([navigator.serviceWorker.ready,sleep(2500).then(()=>null)]);const target=navigator.serviceWorker.controller||reg?.active||reg?.waiting;if(!target)throw new Error('service_worker_inactive');return timeout(new Promise((resolve,reject)=>{const ch=new MessageChannel();ch.port1.onmessage=e=>{const d=e.data||{};d.ok===false?reject(new Error(d.error||'offline_failed')):resolve(d)};target.postMessage({type},[ch.port2])}),ms)}
async function deleteDb(name){return new Promise(resolve=>{if(!('indexedDB'in window)){resolve(0);return}let opened=false;const req=indexedDB.open(name);req.onupgradeneeded=()=>{opened=true};req.onerror=()=>resolve(0);req.onsuccess=()=>{const db=req.result;const finish=()=>{try{db.close()}catch(_){}const del=indexedDB.deleteDatabase(name);del.onsuccess=del.onerror=del.onblocked=()=>resolve(1);setTimeout(()=>resolve(1),1200)};if(!opened&&db.objectStoreNames.contains('media')){try{const tx=db.transaction('media','readwrite');tx.objectStore('media').clear();tx.oncomplete=finish;tx.onerror=tx.onabort=finish}catch(_){finish()}}else finish()}})}

function localMediaStats(){
  const seen=new Set();let bytes=0;
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);if(!key||!LS_PREFIXES.some(prefix=>key.startsWith(prefix)))continue;
    try{
      const meta=JSON.parse(localStorage.getItem(key)||'null');
      if(!meta||typeof meta!=='object')continue;
      const identity=String(meta.url||meta.identity||meta.path||key);
      if(seen.has(identity))continue;seen.add(identity);
      bytes+=Math.max(0,Number(meta.bytes||meta.size||0)||0);
    }catch(_){}
  }
  return{mediaCount:seen.size,mediaBytes:bytes,coreCount:null};
}
function formatOfflineStats(stats){
  const count=Math.max(0,Number(stats?.mediaCount||0)||0),bytes=Math.max(0,Number(stats?.mediaBytes||0)||0),mb=(bytes/1048576).toFixed(1);
  const core=Number.isFinite(Number(stats?.coreCount))?Math.max(0,Number(stats.coreCount)||0):null;
  if(core!==null)return L(`محتوای اصلی: ${core} فایل • دانلودها: ${count} فایل (${mb} مگابایت)`,`Core content: ${core} files • Downloads: ${count} files (${mb} MB)`,`Osnovni sadržaj: ${core} datoteka • Preuzimanja: ${count} datoteka (${mb} MB)`);
  return L(`دانلودها: ${count} فایل (${mb} مگابایت) • محتوای اصلی اپ حفظ شده است.`,`Downloads: ${count} files (${mb} MB) • Core app content is kept.`,`Preuzimanja: ${count} datoteka (${mb} MB) • Osnovni sadržaj aplikacije je zadržan.`);
}
async function reconcileOfflineSummary(){
  if(window.NH7SettingsStorageBatch4)return window.NH7SettingsStorageBatch4.measure();
  let stats;
  if(native())stats=localMediaStats();
  else{const current=await sw('OFFLINE_STATUS',6000);stats={mediaCount:Number(current?.mediaCount||0),mediaBytes:Number(current?.mediaBytes||0),coreCount:Number(current?.coreCount||0)}}
  const node=document.getElementById('settingsOfflineSummary');if(node)node.textContent=formatOfflineStats(stats);
  return stats;
}
function resetDownloadButtons(){
  document.querySelectorAll('[data-classic-download],[data-v397-download],[data-v396-download],[data-offline-download]').forEach(b=>{
    b.disabled=false;b.dataset.offlineCached='0';b.textContent=L('دانلود برای آفلاین','Download offline','Preuzmi offline');
  });
}
async function clearOffline(btn){if(window.NH7SettingsBatch4)return window.NH7SettingsBatch4.action('cleanup');show(L('ابزار تنظیمات بارگذاری نشده؛ برنامه را دوباره باز کنید. هیچ داده‌ای پاک نشد.','Settings tools are unavailable. Reopen the app; no data was cleared.','Alati postavki nisu učitani. Ponovno otvorite aplikaciju; podaci nisu izbrisani.'),'error')}
async function prepareOffline(btn){if(window.NH7SettingsBatch4)return window.NH7SettingsBatch4.action('prepare');show(L('ابزار تنظیمات بارگذاری نشده؛ برنامه را دوباره باز کنید. هیچ داده‌ای پاک نشد.','Settings tools are unavailable. Reopen the app; no data was cleared.','Alati postavki nisu učitani. Ponovno otvorite aplikaciju; podaci nisu izbrisani.'),'error')}
async function refresh(btn){if(window.NH7SettingsBatch4)return window.NH7SettingsBatch4.action('refresh');show(L('ابزار تنظیمات بارگذاری نشده؛ برنامه را دوباره باز کنید. هیچ داده‌ای پاک نشد.','Settings tools are unavailable. Reopen the app; no data was cleared.','Alati postavki nisu učitani. Ponovno otvorite aplikaciju; podaci nisu izbrisani.'),'error')}
document.addEventListener('click',e=>{const b=e.target.closest?.('#prepareOffline,#clearOfflineMedia,#clearCache,#enableNotify,#syncCloud');if(!b)return;if(['prepareOffline','clearOfflineMedia','clearCache'].includes(b.id)){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(b.id==='prepareOffline')prepareOffline(b);else if(b.id==='clearOfflineMedia')clearOffline(b);else refresh(b);return}show(b.id==='enableNotify'?L('در حال بازکردن تنظیمات اعلان‌ها…','Opening notification settings…','Otvaranje postavki obavijesti…'):L('همگام‌سازی ابری شروع شد…','Cloud sync started…','Pokrenuta je sinkronizacija…'),'busy')},true);
document.addEventListener('change',e=>{if(e.target?.id==='settingsLang')show(L('زبان برنامه تغییر کرد ✓','App language changed ✓','Jezik aplikacije je promijenjen ✓'),'ok')},true);
const css=document.createElement('style');css.textContent=`.nh7-settings403-status{margin:12px 0;padding:13px 14px;border:2px solid #9ecdea;border-radius:14px;background:#eef7ff;color:#145a8d;display:flex;flex-direction:column;gap:4px}.nh7-settings403-status strong{font-size:12px;opacity:.72}.nh7-settings403-status span{font-weight:900}.nh7-settings403-status.is-ok{background:#eafaf1;color:#08783d;border-color:#78c99d}.nh7-settings403-status.is-error{background:#fff1f0;color:#a4251c;border-color:#e99b94}.nh7-settings403-toast{position:fixed;z-index:2147483646;left:50%;bottom:calc(92px + env(safe-area-inset-bottom));transform:translateX(-50%);width:min(92vw,540px);padding:13px 15px;border-radius:14px;text-align:center;font:900 14px/1.55 system-ui;background:#eef7ff;color:#145a8d;border:1px solid #9ecdea;box-shadow:0 14px 38px rgba(0,0,0,.24)}.nh7-settings403-toast.is-ok{background:#eafaf1;color:#08783d;border-color:#78c99d}.nh7-settings403-toast.is-error{background:#fff1f0;color:#a4251c;border-color:#e99b94}.is-v403-busy{opacity:.72!important;cursor:wait!important}`;document.head.appendChild(css);
window.NH7_SETTINGS_CONTROLLER_VERSION='4.0.3';window.NH7_SETTINGS_CONTROLLER_V403={prepareOffline,clearOffline,refresh,show,reconcileOfflineSummary};
})();