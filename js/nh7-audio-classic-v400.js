/* New Hope 7 — classic signed audio player v4.0.0
 *
 * One authoritative player for both School lessons and sermon messages.
 * Keeps the approved classic School-player appearance while retaining:
 * signed private-media access, playback speed, seek, persistent progress,
 * School listening telemetry, sermon analytics, download progress and offline use.
 */
(()=>{'use strict';
if(window.__NH7_AUDIO_CLASSIC_V400__)return;
window.__NH7_AUDIO_CLASSIC_V400__=true;

const SB='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION_KEY='nh7_user_session_v170';
const DB_NAME='nh7-offline-audio-v397';
const DB_STORE='media';
const DB_VERSION=1;
const META_PREFIX='nh7_audio_media_v397:';
const LEGACY_META='nh7_audio_media_v396:';
const NATIVE_DIR='offline_audio_v397';
const SPEEDS=[0.75,1,1.25,1.5,2];

const signed=new Map();
const derived=new Map();
const localUrls=new Map();
let audio=null,current=null,currentPanel=null,patchTimer=0,prewarmBusy=false;
let listenedPending=0,lastWall=0,lastPosition=0,trackTimer=0,sessionId='';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return['fa','en','hr'].includes(v)?v:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const fmt=value=>{const sec=Math.max(0,Number(value)||0),h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=Math.floor(sec%60);return h?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${m}:${String(s).padStart(2,'0')}`};

function readSession(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}}
function jwtExpiry(token){try{const p=String(token||'').split('.')[1]||'',n=p.replace(/-/g,'+').replace(/_/g,'/'),j=JSON.parse(atob(n.padEnd(Math.ceil(n.length/4)*4,'=')));return Number(j.exp||0)*1000}catch(_){return 0}}
async function accessToken(){
  try{await window.NH7_SCHOOL_MEDIA_REFRESH?.(false)}catch(_){}
  let session=readSession();
  if(session?.access_token&&jwtExpiry(session.access_token)>Date.now()+90000)return String(session.access_token);
  if(session?.refresh_token){
    try{
      const response=await fetch(`${SB}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token}),cache:'no-store'});
      const text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch(_){}
      if(response.ok&&data?.access_token){localStorage.setItem(SESSION_KEY,JSON.stringify(data));session=data}
    }catch(_){}
  }
  return String(session?.access_token||'');
}
function accountEmail(){const s=readSession();return String(s?.user?.email||localStorage.getItem('nh7_manual_email')||'').trim().toLowerCase()}
function deviceId(){let id=localStorage.getItem('nh7_device_id');if(!id){id='dev_'+(crypto.randomUUID?.()||Date.now()+'_'+Math.random().toString(36).slice(2));localStorage.setItem('nh7_device_id',id)}return id}
function isNative(){try{return!!(window.Capacitor?.isNativePlatform?.()||['ios','android'].includes(window.Capacitor?.getPlatform?.()))}catch(_){return false}}
function plugin(name){return window.Capacitor?.Plugins?.[name]||window.Capacitor?.[name]||null}

function mediaId(item){return String(item?.id||item?.analytics_id||'')}
function isSchool(item){const id=mediaId(item);return id.startsWith('school-')||String(item?.analytics_type||'')==='school'||String(item?.audio_url||'').startsWith('nh7-private://school/')}
function isSermon(item){const id=mediaId(item);return !isSchool(item)&&/^[0-9a-f-]{36}$/i.test(id)}
function supported(item){return!!item&&(isSchool(item)||isSermon(item))}
function lessonCode(item){return String(item?.analytics_id||mediaId(item)).replace(/^school-/,'')}
function titleFor(item){return String(item?.['title_'+lang()]||item?.title_fa||item?.title_en||item?.title_hr||item?.title||L('فایل صوتی','Audio','Audio'))}
function durationFor(item){const exact=Number(item?.duration_seconds||0);return exact>0?exact:Math.max(0,Math.round(Number(item?.duration_minutes||0)*60))}
function progressKey(item){return'nh7_sermon_progress_'+mediaId(item)}
function readProgress(item){try{return JSON.parse(localStorage.getItem(progressKey(item))||'{}')}catch(_){return{}}}
function saveProgress(item,completed=false){if(!audio||!item)return;try{localStorage.setItem(progressKey(item),JSON.stringify({time:completed?0:Number(audio.currentTime||0),duration:Number.isFinite(audio.duration)?Number(audio.duration||0):durationFor(item),completed:!!completed,updatedAt:new Date().toISOString()}))}catch(_){}}

function deriveFromCard(card){
  if(!card)return null;
  const id=String(card.dataset.sermonCard||'');if(!id)return null;
  const mapped=window.__sermonMap?.[id];if(mapped){derived.set(id,mapped);return mapped}
  if(derived.has(id))return derived.get(id);
  const external=card.querySelector('[data-classic-download],[data-v397-download],[data-v396-download],[data-offline-download]');
  const raw=String(external?.dataset.classicOriginal||external?.dataset.v397Original||external?.dataset.v396Original||external?.dataset.offlineDownload||'');
  const title=String(card.querySelector('.sermon-card-copy strong, strong')?.textContent||'').trim();
  const school=card.classList.contains('school-audio-card')||id.startsWith('school-');
  const item={id,audio_url:raw,analytics_type:school?'school':'sermon',analytics_id:school?id.replace(/^school-/,''):id,title_fa:title,title_en:title,title_hr:title};
  if(!supported(item))return null;
  window.__sermonMap=window.__sermonMap||{};window.__sermonMap[id]=item;derived.set(id,item);return item;
}
function itemFromNode(node){return deriveFromCard(node?.closest?.('[data-sermon-card]'))}
function cardFor(item){return document.querySelector(`[data-sermon-card="${CSS.escape(mediaId(item))}"]`)}

function metaKey(item){return META_PREFIX+encodeURIComponent(mediaId(item))}
function legacyMetaKey(item){return LEGACY_META+encodeURIComponent(mediaId(item))}
function readMeta(item){try{return JSON.parse(localStorage.getItem(metaKey(item))||'null')}catch(_){return null}}
function saveMeta(item,value){localStorage.setItem(metaKey(item),JSON.stringify(Object.assign({id:mediaId(item),title:titleFor(item),updatedAt:new Date().toISOString()},value||{})))}
function removeMeta(item){localStorage.removeItem(metaKey(item));localStorage.removeItem(legacyMetaKey(item))}

function openDb(){return new Promise((resolve,reject)=>{if(!('indexedDB'in window)){reject(new Error('IndexedDB unavailable'));return}const request=indexedDB.open(DB_NAME,DB_VERSION);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE,{keyPath:'id'})};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('IndexedDB open failed'))})}
async function idbGet(id){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readonly'),req=tx.objectStore(DB_STORE).get(id);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close();tx.onabort=()=>{db.close();reject(tx.error)}})}
async function idbPut(record){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).put(record);tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>{db.close();reject(tx.error)};tx.onabort=()=>{db.close();reject(tx.error)}})}
async function idbDelete(id){const db=await openDb();return new Promise(resolve=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).delete(id);tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=tx.onabort=()=>{db.close();resolve(false)}})}
async function idbClear(){const db=await openDb();return new Promise(resolve=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).clear();tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=tx.onabort=()=>{db.close();resolve(false)}})}

async function edge(payload){
  const token=await accessToken();if(!token)throw Object.assign(new Error('login_required'),{code:'login_required'});
  const response=await fetch(`${SB}/functions/v1/nh7-school-media-access`,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+token,'Content-Type':'application/json','x-client-info':'nh7-classic-audio-v400'},body:JSON.stringify(Object.assign({device_id:deviceId()},payload)),cache:'no-store'});
  const text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch(_){data={error:text}}
  if(!response.ok||!data?.signed_url)throw Object.assign(new Error(data?.error||data?.message||text||`HTTP ${response.status}`),{code:data?.code||'',status:response.status});
  return data;
}
async function signedUrl(item,force=false){
  const id=mediaId(item),cached=signed.get(id);
  if(!force&&cached?.url&&cached.expires>Date.now()+60000)return cached.url;
  if(!force&&cached?.promise)return cached.promise;
  const promise=(async()=>{const data=isSchool(item)?await edge({kind:'audio',lesson_code:lessonCode(item)}):await edge({kind:'sermon',sermon_id:id});const value={url:String(data.signed_url),expires:Date.now()+Math.max(60,Number(data.expires_in||0)-60)*1000,mime:String(data.mime_type||'audio/mpeg')};signed.set(id,value);return value.url})();
  signed.set(id,{promise});try{return await promise}catch(error){signed.delete(id);throw error}
}

function errorText(error){
  const code=String(error?.code||error?.name||error?.message||error||'').toLowerCase();
  if(code.includes('login_required')||code.includes('invalid_session'))return L('جلسه ورود منقضی شده است؛ دوباره وارد حساب شوید.','Your sign-in session expired; sign in again.','Sesija je istekla; ponovno se prijavite.');
  if(code.includes('school_approval_required'))return L('این حساب هنوز ثبت‌نام کامل و تأییدشده ندارد.','This account does not yet have complete approved registration.','Ovaj račun još nema potpunu odobrenu registraciju.');
  if(code.includes('sermon_not_found')||code.includes('lesson_not_found'))return L('فایل صوتی در سرور پیدا نشد.','The audio file was not found on the server.','Audio datoteka nije pronađena.');
  if(code.includes('signed_url_failed')||code.includes('invalid_path'))return L('ساخت لینک امن فایل صوتی انجام نشد.','The secure audio link could not be created.','Nije moguće izraditi sigurnu audio poveznicu.');
  if(code.includes('notsupported')||code.includes('operation is not supported'))return L('نسخه آفلاین ناسازگار بود؛ دوباره دانلود کنید.','The offline copy was incompatible; download it again.','Offline kopija nije kompatibilna; preuzmite ponovno.');
  if(code.includes('network')||code.includes('failed to fetch')||code.includes('load failed'))return L('ارتباط با فایل صوتی برقرار نشد. اتصال اینترنت را بررسی کنید.','The audio file could not be reached. Check the connection.','Audio datoteka nije dostupna. Provjerite vezu.');
  return String(error?.message||error||L('پخش یا دانلود فایل صوتی انجام نشد.','Audio playback or download failed.','Reprodukcija ili preuzimanje nije uspjelo.'));
}

function createPanel(item,forceVisible=false){
  const card=cardFor(item);if(!card)return null;
  card.querySelectorAll('.nh7-audio397-player,.nh7-audio396-player,.nh7-school-native-v337').forEach(node=>node.remove());
  let panel=card.querySelector('[data-classic-player]');
  if(!panel){
    panel=document.createElement('div');panel.dataset.classicPlayer=mediaId(item);panel.className='nh7-classic-audio-v400';
    panel.innerHTML=`<p data-classic-status>${L('در حال آماده‌سازی فایل صوتی…','Preparing audio…','Priprema audio datoteke…')}</p><audio playsinline preload="metadata" hidden></audio><div class="nh7-classic-mainrow"><button type="button" class="nh7-classic-skip" data-classic-back aria-label="-15">↶15</button><button type="button" class="nh7-classic-play" data-classic-toggle disabled aria-label="Play">▶</button><button type="button" class="nh7-classic-skip" data-classic-forward aria-label="+30">30↷</button></div><div class="nh7-classic-timeline"><span data-classic-now>0:00</span><input data-classic-seek type="range" min="0" max="1000" value="0" aria-label="${L('موقعیت پخش','Playback position','Pozicija reprodukcije')}"><span data-classic-total>${fmt(durationFor(item))}</span></div><div class="nh7-classic-speedrow"><button type="button" data-classic-speed-down aria-label="${L('کاهش سرعت','Slower','Sporije')}">−</button><strong data-classic-rate>${L('سرعت','Speed','Brzina')} 1×</strong><button type="button" data-classic-speed-up aria-label="${L('افزایش سرعت','Faster','Brže')}">+</button></div><div class="button-row"><button type="button" class="secondary-btn" data-classic-download>${L('دانلود برای آفلاین','Download offline','Preuzmi offline')}</button></div>`;
    card.appendChild(panel);
  }
  if(forceVisible||isSchool(item))panel.hidden=false;
  return panel;
}
function panelFor(item){return cardFor(item)?.querySelector('[data-classic-player]')||null}
function setStatus(item,text,type=''){const panel=createPanel(item,true),node=panel?.querySelector('[data-classic-status]');if(!node)return;node.textContent=text||'';node.className=type?'is-'+type:''}
function nearestSpeed(value){let best=SPEEDS[0];for(const speed of SPEEDS)if(Math.abs(speed-value)<Math.abs(best-value))best=speed;return best}
function syncPanel(item){
  const panel=panelFor(item);if(!panel)return;
  const same=current&&mediaId(current)===mediaId(item),now=same?Number(audio?.currentTime||0):Number(readProgress(item).time||0),duration=same&&Number.isFinite(audio?.duration)?audio.duration:durationFor(item),rate=same?Number(audio?.playbackRate||1):Number(localStorage.getItem('nh7_sermon_speed')||1)||1;
  const play=panel.querySelector('[data-classic-toggle]'),seek=panel.querySelector('[data-classic-seek]');
  if(play){play.disabled=false;play.textContent=same&&!audio?.paused?'❚❚':'▶'}
  panel.querySelector('[data-classic-now]').textContent=fmt(now);
  panel.querySelector('[data-classic-total]').textContent=fmt(duration);
  if(seek)seek.value=duration>0?Math.round(now/duration*1000):0;
  panel.querySelector('[data-classic-rate]').textContent=`${L('سرعت','Speed','Brzina')} ${nearestSpeed(rate)}×`;
}
function showCurrentPanel(item){
  if(currentPanel&&currentPanel!==panelFor(item)&&!currentPanel.closest('.school-audio-card'))currentPanel.hidden=true;
  const panel=createPanel(item,true);if(panel){panel.hidden=false;currentPanel=panel}
}

function ensureAudio(){
  if(audio)return audio;
  audio=document.createElement('audio');audio.preload='metadata';audio.setAttribute('playsinline','');audio.setAttribute('webkit-playsinline','');audio.hidden=true;document.body.appendChild(audio);
  audio.addEventListener('loadedmetadata',()=>{if(!current)return;const saved=readProgress(current),position=Number(saved.time||0);if(position>5&&Number.isFinite(audio.duration)&&position<audio.duration-5)try{audio.currentTime=position}catch(_){}syncPanel(current)});
  audio.addEventListener('durationchange',()=>current&&syncPanel(current));
  audio.addEventListener('playing',()=>{if(!current)return;lastWall=Date.now();lastPosition=audio.currentTime;setStatus(current,L('در حال پخش','Playing','Reprodukcija'),'ok');syncPanel(current)});
  audio.addEventListener('waiting',()=>current&&setStatus(current,L('در حال دریافت فایل…','Buffering…','Učitavanje…'),'busy'));
  audio.addEventListener('timeupdate',()=>{if(!current)return;captureListen();saveProgress(current,false);syncPanel(current);scheduleTracking()});
  audio.addEventListener('pause',()=>{if(!current)return;captureListen();saveProgress(current,false);syncPanel(current);flushTracking(false,true)});
  audio.addEventListener('ended',()=>{if(!current)return;captureListen();saveProgress(current,true);setStatus(current,L('پخش کامل شد ✓','Completed ✓','Završeno ✓'),'ok');syncPanel(current);flushTracking(true,true)});
  audio.addEventListener('error',async()=>{if(!current)return;const id=mediaId(current),local=localUrls.get(id);if(local&&audio.src===local){await removeLocal(current);setStatus(current,L('نسخه آفلاین ناسازگار بود و پاک شد؛ دوباره دانلود کنید.','The offline copy was invalid and was removed; download it again.','Offline kopija nije valjana i uklonjena je; preuzmite ponovno.'),'error')}else setStatus(current,L('فایل صوتی باز نشد.','Audio could not be opened.','Audio se nije mogao otvoriti.'),'error');syncPanel(current)});
  return audio;
}

function captureListen(){if(!current||!audio||audio.paused)return;const now=Date.now(),wall=Math.min(5,Math.max(0,(now-(lastWall||now))/1000)),position=Math.max(0,Number(audio.currentTime||0));lastWall=now;if(position>=lastPosition-0.5&&position-lastPosition<8&&wall>0)listenedPending+=wall;lastPosition=position}
function scheduleTracking(){if(trackTimer||listenedPending<12)return;trackTimer=setTimeout(()=>{trackTimer=0;flushTracking(false,false)},250)}
async function rpc(name,body){const token=await accessToken();if(!token)throw new Error('login_required');const response=await fetch(`${SB}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'});if(!response.ok)throw new Error(await response.text());return response.json().catch(()=>({}))}
async function flushTracking(ended=false,force=false){
  if(!current||!navigator.onLine)return;captureListen();const delta=Math.floor(listenedPending);if(!force&&delta<10)return;listenedPending=0;
  const duration=Math.round((Number.isFinite(audio?.duration)&&audio.duration)||durationFor(current)||0),position=Math.round(audio?.currentTime||0);
  try{
    if(isSchool(current))await rpc('nh7_school_record_audio_v380',{p_lesson_code:lessonCode(current),p_position_seconds:ended?duration:position,p_duration_seconds:duration,p_delta_seconds:delta,p_ended:!!ended});
    await rpc('nh7_track_audio_session_v222',{p_session_id:sessionId||('classic_'+Date.now()),p_device_id:deviceId(),p_user_email:accountEmail(),p_media_type:isSchool(current)?'school':'sermon',p_media_id:isSchool(current)?lessonCode(current):mediaId(current),p_title:titleFor(current),p_topic:String(current.analytics_topic||current.topic||''),p_source_group:String(current.analytics_source_group||current.category_id||''),p_language:lang(),p_duration_seconds:duration,p_position_seconds:position,p_delta_seconds:delta,p_event:ended?'ended':'progress',p_playback_rate:Number(audio?.playbackRate||1),p_seek_count:0,p_started_position_seconds:0}).catch(()=>{});
  }catch(error){console.warn('[NH7 classic audio tracking]',error)}
}

async function localUrl(item){
  const id=mediaId(item),existing=localUrls.get(id);if(existing)return existing;
  const meta=readMeta(item);if(isNative()){
    const Filesystem=plugin('Filesystem');if(!Filesystem||!meta?.path)return'';
    try{await Filesystem.stat({directory:'DATA',path:meta.path});const uri=(await Filesystem.getUri({directory:'DATA',path:meta.path})).uri,url=window.Capacitor?.convertFileSrc?window.Capacitor.convertFileSrc(uri):uri;localUrls.set(id,url);return url}catch(_){removeMeta(item);return''}
  }
  try{const row=await idbGet(id);if(!row?.blob)return'';const url=URL.createObjectURL(row.blob);localUrls.set(id,url);return url}catch(_){return''}
}
async function removeLocal(item){
  const id=mediaId(item),url=localUrls.get(id);if(url?.startsWith('blob:'))URL.revokeObjectURL(url);localUrls.delete(id);
  if(isNative()){const meta=readMeta(item),Filesystem=plugin('Filesystem');if(meta?.path&&Filesystem)try{await Filesystem.deleteFile({directory:'DATA',path:meta.path})}catch(_){} }
  else await idbDelete(id).catch(()=>{});
  removeMeta(item);updateDownloadButtons(item,false);
}
async function isDownloaded(item){if(isNative()){const meta=readMeta(item),Filesystem=plugin('Filesystem');if(!meta?.path||!Filesystem)return false;try{await Filesystem.stat({directory:'DATA',path:meta.path});return true}catch(_){removeMeta(item);return false}}try{return!!(await idbGet(mediaId(item)))?.blob}catch(_){return false}}

async function playItem(item){
  if(!supported(item))return;showCurrentPanel(item);const player=ensureAudio();
  if(current&&mediaId(current)===mediaId(item)&&player.src){if(player.paused){try{await player.play()}catch(error){setStatus(item,errorText(error),'error')}}else player.pause();syncPanel(item);return}
  const local=await localUrl(item);
  if(!local&&!navigator.onLine){setStatus(item,L('این فایل هنوز برای آفلاین دانلود نشده است.','This file has not been downloaded for offline use.','Datoteka nije preuzeta za offline rad.'),'error');return}
  try{
    setStatus(item,local?L('در حال بازکردن نسخه دانلودشده…','Opening downloaded copy…','Otvaranje preuzete kopije…'):L('در حال آماده‌سازی فایل صوتی…','Preparing audio…','Priprema audio datoteke…'),'busy');
    const url=local||await signedUrl(item);current=item;sessionId='classic_'+(crypto.randomUUID?.()||Date.now());listenedPending=0;lastWall=Date.now();lastPosition=0;
    player.pause();player.src=url;player.playbackRate=nearestSpeed(Number(localStorage.getItem('nh7_sermon_speed')||1)||1);player.load();syncPanel(item);
    try{await player.play()}catch(error){setStatus(item,L('فایل آماده است؛ دوباره روی Play بزنید.','The file is ready; tap Play again.','Datoteka je spremna; ponovno dodirnite Play.'),'busy')}
  }catch(error){setStatus(item,errorText(error)+(error?.status?` [${error.status}]`:''),'error')}
}

function downloadLabel(percent){return percent>=100?L('آفلاین آماده ✓','Offline ready ✓','Offline spremno ✓'):L(`در حال دانلود ${percent}%`,`Downloading ${percent}%`,`Preuzimanje ${percent}%`)}
function downloadButtons(item){const card=cardFor(item);return card?$$('[data-classic-download]',card):[]}
function updateDownloadButtons(item,downloaded,percent=null){for(const button of downloadButtons(item)){button.disabled=percent!==null&&percent<100;button.textContent=percent!==null?downloadLabel(percent):downloaded?downloadLabel(100):L('دانلود برای آفلاین','Download offline','Preuzmi offline');button.classList.toggle('is-downloaded-v400',!!downloaded);button.dataset.offlineCached=downloaded?'1':'0'}const external=cardFor(item)?.querySelector('[data-external-classic-download]');if(external){external.textContent=downloaded?downloadLabel(100):L('دانلود برای آفلاین','Download offline','Preuzmi offline');external.classList.toggle('is-downloaded-v400',!!downloaded)}}
function filename(item,url){let ext='.mp3';try{const match=new URL(url).pathname.match(/\.([a-z0-9]{2,6})$/i);if(match)ext='.'+match[1].toLowerCase()}catch(_){}return mediaId(item).replace(/[^a-z0-9._-]+/gi,'_').slice(0,90)+ext}
async function downloadWeb(item,url){
  const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw Object.assign(new Error(`HTTP ${response.status}`),{status:response.status});
  const total=Number(response.headers.get('content-length')||0),mime=response.headers.get('content-type')||'audio/mpeg',parts=[];let received=0;
  if(response.body?.getReader){const reader=response.body.getReader();while(true){const part=await reader.read();if(part.done)break;parts.push(part.value);received+=part.value.byteLength;if(total)updateDownloadButtons(item,false,Math.min(99,Math.round(received/total*100)))}}
  else{const blob=await response.blob();parts.push(new Uint8Array(await blob.arrayBuffer()));received=blob.size}
  const blob=new Blob(parts,{type:mime});if(blob.size<512)throw new Error('Downloaded file is incomplete');await idbPut({id:mediaId(item),blob,mime,bytes:blob.size,title:titleFor(item),updatedAt:Date.now()});saveMeta(item,{web:true,bytes:blob.size,mime});
}
async function downloadNative(item,url){
  const Filesystem=plugin('Filesystem'),Transfer=plugin('FileTransfer');if(!Filesystem||!Transfer)throw new Error('Native file plugins unavailable');
  try{await Filesystem.mkdir({directory:'DATA',path:NATIVE_DIR,recursive:true})}catch(error){if(!String(error?.message||'').toLowerCase().includes('exist'))throw error}
  const path=`${NATIVE_DIR}/${filename(item,url)}`,target=(await Filesystem.getUri({directory:'DATA',path})).uri;let listener=null;
  try{listener=await Transfer.addListener?.('progress',event=>{if(event?.lengthComputable&&Number(event.contentLength)>0)updateDownloadButtons(item,false,Math.min(99,Math.round(Number(event.bytes||0)/Number(event.contentLength)*100)))});await Transfer.downloadFile({url,path:target,progress:true,connectTimeout:60000,readTimeout:300000});const stat=await Filesystem.stat({directory:'DATA',path});if(Number(stat?.size||0)<512)throw new Error('Downloaded file is incomplete');saveMeta(item,{native:true,path,bytes:Number(stat.size||0)})}finally{try{await listener?.remove?.()}catch(_){}}
}
async function downloadItem(item){
  if(!supported(item))return;createPanel(item,true);
  if(await isDownloaded(item)){if(confirm(L('این فایل آفلاین پاک شود؟','Remove this offline file?','Ukloniti ovu offline datoteku?')))await removeLocal(item);return}
  if(!navigator.onLine){setStatus(item,L('برای دانلود به اینترنت نیاز است.','Internet is required to download.','Za preuzimanje je potreban internet.'),'error');return}
  updateDownloadButtons(item,false,0);setStatus(item,L('در حال دریافت فایل…','Downloading file…','Preuzimanje datoteke…'),'busy');
  try{const url=await signedUrl(item);if(isNative())await downloadNative(item,url);else await downloadWeb(item,url);updateDownloadButtons(item,true,100);setStatus(item,L('فایل برای استفاده آفلاین آماده شد ✓','The file is ready offline ✓','Datoteka je spremna offline ✓'),'ok')}
  catch(error){updateDownloadButtons(item,false);setStatus(item,errorText(error)+(error?.status?` [${error.status}]`:''),'error')}
}

async function refreshCard(item){const downloaded=await isDownloaded(item);updateDownloadButtons(item,downloaded);syncPanel(item)}
function ownCard(card){
  const item=deriveFromCard(card);if(!supported(item))return;
  card.dataset.classicAudioV400='1';
  card.querySelectorAll('.nh7-audio397-player,.nh7-audio396-player,.nh7-school-native-v337').forEach(node=>node.remove());
  card.querySelectorAll('.inline-sermon-player,[data-inline-player]').forEach(node=>node.style.setProperty('display','none','important'));
  card.querySelectorAll('[data-sermon-play]').forEach(button=>{button.onclick=null;button.dataset.classicPlay=mediaId(item)});
  card.querySelectorAll('[data-offline-download],[data-v397-download],[data-v396-download]').forEach(button=>{if(!button.dataset.classicOriginal)button.dataset.classicOriginal=String(button.dataset.v397Original||button.dataset.v396Original||button.dataset.offlineDownload||item.audio_url||'');button.onclick=null;button.dataset.externalClassicDownload=mediaId(item);button.removeAttribute('data-offline-download');button.removeAttribute('data-v397-download');button.removeAttribute('data-v396-download')});
  const panel=createPanel(item,isSchool(item));
  if(isSchool(item)){
    card.querySelectorAll('[data-sermon-play],[data-external-classic-download]').forEach(button=>button.style.setProperty('display','none','important'));
    signedUrl(item).then(()=>setStatus(item,L('فایل صوتی آماده است.','Audio is ready.','Audio je spreman.'),'ok')).catch(error=>setStatus(item,errorText(error),'error'));
  }
  refreshCard(item).catch(()=>{});
}
function patch(){document.querySelectorAll('[data-sermon-card]').forEach(ownCard)}
function prewarm(){if(prewarmBusy||!navigator.onLine)return;prewarmBusy=true;const items=$$('[data-sermon-card]').map(deriveFromCard).filter(supported).slice(0,20);(async()=>{try{for(let i=0;i<items.length;i+=4)await Promise.all(items.slice(i,i+4).map(item=>signedUrl(item).catch(()=>null)))}finally{prewarmBusy=false}})()}

function itemFromPanelNode(node){return deriveFromCard(node?.closest?.('[data-sermon-card]'))}
function intercept(event){
  const externalDownload=event.target.closest?.('[data-external-classic-download]');if(externalDownload){const item=itemFromNode(externalDownload);if(supported(item)){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();downloadItem(item);return true}}
  const externalPlay=event.target.closest?.('[data-classic-play],[data-sermon-play]');if(externalPlay){const item=itemFromNode(externalPlay);if(supported(item)){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();playItem(item);return true}}
  const toggle=event.target.closest?.('[data-classic-toggle]');if(toggle){const item=itemFromPanelNode(toggle);if(item){event.preventDefault();event.stopImmediatePropagation();if(current&&mediaId(current)===mediaId(item)&&audio?.src){if(audio.paused)audio.play().catch(error=>setStatus(item,errorText(error),'error'));else audio.pause()}else playItem(item)}return true}
  const back=event.target.closest?.('[data-classic-back]');if(back&&audio){event.preventDefault();event.stopImmediatePropagation();audio.currentTime=Math.max(0,audio.currentTime-15);current&&syncPanel(current);return true}
  const forward=event.target.closest?.('[data-classic-forward]');if(forward&&audio){event.preventDefault();event.stopImmediatePropagation();audio.currentTime=Math.min(audio.duration||Infinity,audio.currentTime+30);current&&syncPanel(current);return true}
  const speedDown=event.target.closest?.('[data-classic-speed-down]');if(speedDown&&audio){event.preventDefault();event.stopImmediatePropagation();const currentSpeed=nearestSpeed(audio.playbackRate||1),index=Math.max(0,SPEEDS.indexOf(currentSpeed)-1);audio.playbackRate=SPEEDS[index];localStorage.setItem('nh7_sermon_speed',String(audio.playbackRate));current&&syncPanel(current);return true}
  const speedUp=event.target.closest?.('[data-classic-speed-up]');if(speedUp&&audio){event.preventDefault();event.stopImmediatePropagation();const currentSpeed=nearestSpeed(audio.playbackRate||1),index=Math.min(SPEEDS.length-1,SPEEDS.indexOf(currentSpeed)+1);audio.playbackRate=SPEEDS[index];localStorage.setItem('nh7_sermon_speed',String(audio.playbackRate));current&&syncPanel(current);return true}
  const download=event.target.closest?.('[data-classic-download]');if(download){const item=itemFromPanelNode(download);if(item){event.preventDefault();event.stopImmediatePropagation();downloadItem(item)}return true}
  return false;
}
window.addEventListener('pointerdown',event=>{const node=event.target.closest?.('[data-classic-play],[data-sermon-play],[data-classic-toggle],[data-classic-download],[data-external-classic-download]'),item=node?.closest?.('[data-sermon-card]')?deriveFromCard(node.closest('[data-sermon-card]')):null;if(supported(item)){localUrl(item).catch(()=>{});signedUrl(item).catch(()=>{})}},true);
window.addEventListener('click',intercept,true);
window.addEventListener('input',event=>{const seek=event.target.closest?.('[data-classic-seek]');if(seek&&audio&&current&&Number.isFinite(audio.duration)&&audio.duration>0){event.stopImmediatePropagation();audio.currentTime=audio.duration*Number(seek.value||0)/1000;syncPanel(current)}},true);
window.addEventListener('online',()=>{patch();prewarm()});
window.addEventListener('beforeunload',()=>{for(const url of localUrls.values())if(url?.startsWith('blob:'))URL.revokeObjectURL(url)});

async function clearAll(){
  if(isNative()){const Filesystem=plugin('Filesystem');if(Filesystem)try{await Filesystem.rmdir({directory:'DATA',path:NATIVE_DIR,recursive:true})}catch(_){} }
  else await idbClear().catch(()=>{});
  for(const url of localUrls.values())if(url?.startsWith('blob:'))URL.revokeObjectURL(url);localUrls.clear();
  const keys=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith(META_PREFIX)||key?.startsWith(LEGACY_META))keys.push(key)}keys.forEach(key=>localStorage.removeItem(key));
  for(const item of derived.values())updateDownloadButtons(item,false);
}

const style=document.createElement('style');style.id='nh7-audio-classic-v400-style';style.textContent=`
[data-sermon-card].classic-audio-ready>.inline-sermon-player,[data-sermon-card]>.inline-sermon-player{display:none!important}.nh7-classic-audio-v400{margin-top:12px;padding:14px;border-top:1px solid var(--line,#d9e6f7);background:linear-gradient(180deg,#f7fcff,#fff);border-radius:16px}.nh7-classic-audio-v400[hidden]{display:none!important}.nh7-classic-audio-v400>audio{display:none!important}.nh7-classic-audio-v400>[data-classic-status]{margin:0 0 10px!important;font-size:.88rem!important;line-height:1.6!important;color:#4f6b80!important}.nh7-classic-audio-v400>[data-classic-status].is-ok{padding:9px 12px;border-radius:11px;background:#ecfdf3;color:#08783d!important}.nh7-classic-audio-v400>[data-classic-status].is-busy{padding:9px 12px;border-radius:11px;background:#eef7ff;color:#145a8d!important}.nh7-classic-audio-v400>[data-classic-status].is-error{padding:9px 12px;border-radius:11px;background:#fff1f0;color:#a4251c!important}.nh7-classic-mainrow{display:flex;align-items:center;justify-content:center;gap:12px}.nh7-classic-mainrow button{border:0;cursor:pointer}.nh7-classic-mainrow button:disabled{opacity:.42;cursor:default}.nh7-classic-play{width:58px;height:58px;border-radius:50%;background:linear-gradient(135deg,#0476d9,#13b5e8);color:#fff;font-size:21px;font-weight:900;box-shadow:0 8px 20px rgba(4,118,217,.24)}.nh7-classic-skip{width:48px;height:48px;border-radius:50%;background:#e9f6fd;color:#075985;font-size:.8rem;font-weight:900}.nh7-classic-timeline{display:grid;grid-template-columns:48px minmax(0,1fr) 48px;gap:8px;align-items:center;margin-top:12px}.nh7-classic-timeline span{font-size:.78rem;font-variant-numeric:tabular-nums;text-align:center;color:#4f6b80}.nh7-classic-timeline input{width:100%;padding:0;border:0}.nh7-classic-speedrow{display:flex;align-items:center;justify-content:center;gap:9px;margin-top:12px}.nh7-classic-speedrow button{width:42px;height:38px;border:1px solid var(--line,#d9e6f7);border-radius:12px;background:#eef8fd;color:#075985;font-size:20px;font-weight:900;cursor:pointer}.nh7-classic-speedrow strong{min-width:94px;text-align:center;font-size:.88rem;color:#062444}.nh7-classic-audio-v400 .button-row{justify-content:center;margin-top:12px!important}.is-downloaded-v400{background:#e8f8ef!important;border-color:#74c69d!important;color:#08783d!important}.school-audio-card>.sermon-card-actions{margin-bottom:0!important}@media(max-width:760px){.nh7-classic-audio-v400{padding:13px 11px}.nh7-classic-mainrow{gap:10px}}
`;document.head.appendChild(style);

new MutationObserver(()=>{clearTimeout(patchTimer);patchTimer=setTimeout(()=>{patch();prewarm()},40)}).observe(document.documentElement,{childList:true,subtree:true});
setTimeout(()=>{patch();prewarm()},250);

window.NH7_AUDIO_CLASSIC_VERSION='4.0.0';
window.NH7_AUDIO_SIGNED_VERSION='4.0.0-classic';
window.NH7_AUDIO_CLASSIC_V400={patch,prewarm,playItem,downloadItem,clearAll};
// Compatibility for the Settings cleanup controller introduced in 2.3.9.48.
window.NH7_AUDIO_SIGNED_V397=window.NH7_AUDIO_CLASSIC_V400;
})();
