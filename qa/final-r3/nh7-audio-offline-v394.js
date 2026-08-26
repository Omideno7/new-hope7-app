/* New Hope 7 Final QA R3.4 v3.9.4
 * Reliable sermon/School audio playback, progress downloads and offline media.
 * Runs before legacy document handlers (window capture) and therefore avoids
 * Safari's delayed loadedmetadata autoplay failure.
 */
(()=>{'use strict';
if(window.__NH7_AUDIO_OFFLINE_V394__)return;
window.__NH7_AUDIO_OFFLINE_V394__=true;

const SB='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION_KEY='nh7_user_session_v170';
const WEB_MEDIA_CACHE='nh7-media-downloads-v394';
const CORE_CACHE='nh7-core-runtime-v394';
const META_PREFIX='nh7_media_v394:';
const NATIVE_DIR='offline_media_v394';
const SILENT_WAV='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
const schoolSources=new Map();
const blobUrls=new Map();
let audio=null,current=null,saveTimer=0,trackTimer=0,lastWall=0,listenPending=0,seekCount=0,sessionId='',observerTimer=0;

const lang=()=>{const value=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return ['fa','en','hr'].includes(value)?value:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const E=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const fmt=value=>{let seconds=Math.max(0,Number(value)||0);const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60),s=Math.floor(seconds%60);return h?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${m}:${String(s).padStart(2,'0')}`};

function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}}
function token(){return String(session()?.access_token||'')}
function email(){return String(session()?.user?.email||localStorage.getItem('nh7_manual_email')||'').trim().toLowerCase()}
function device(){let id=localStorage.getItem('nh7_device_id');if(!id){id='dev_'+(crypto.randomUUID?.()||Date.now()+'_'+Math.random().toString(36).slice(2));localStorage.setItem('nh7_device_id',id)}return id}
function isNative(){try{return !!(window.Capacitor?.isNativePlatform?.()||['ios','android'].includes(window.Capacitor?.getPlatform?.()))}catch(_){return false}}
function plugin(name){return window.Capacitor?.Plugins?.[name]||window.Capacitor?.[name]||null}
function itemMap(){return Object.assign({},window.__sermonMap||{},window.__audioBibleMap||{})}
function itemFor(id){return itemMap()[String(id)]||null}
function title(item){return String(item?.['title_'+lang()]||item?.title_en||item?.title_fa||item?.title_hr||item?.title||L('فایل صوتی','Audio','Audio'))}
function isSchool(item){return String(item?.id||'').startsWith('school-')||String(item?.analytics_type||'')==='school'||String(item?.audio_url||'').startsWith('nh7-private://school/')}
function lessonCode(item){return String(item?.analytics_id||item?.id||'').replace(/^school-/,'')}
function mediaId(item){return String(item?.id||item?.analytics_id||item?.audio_url||'audio')}
function metaKey(itemOrId){return META_PREFIX+encodeURIComponent(typeof itemOrId==='string'?itemOrId:mediaId(itemOrId))}
function meta(itemOrId){try{return JSON.parse(localStorage.getItem(metaKey(itemOrId))||'null')}catch(_){return null}}
function writeMeta(itemOrId,value){localStorage.setItem(metaKey(itemOrId),JSON.stringify(Object.assign({id:typeof itemOrId==='string'?itemOrId:mediaId(itemOrId),updatedAt:new Date().toISOString()},value||{})))}
function removeMeta(itemOrId){localStorage.removeItem(metaKey(itemOrId))}
function stableCacheUrl(itemOrId){const id=typeof itemOrId==='string'?itemOrId:mediaId(itemOrId);return new URL(`./__nh7_media_v394__/${encodeURIComponent(id)}`,location.href).href}
function progressKey(item){return 'nh7_sermon_progress_'+mediaId(item)}
function progress(item){try{return JSON.parse(localStorage.getItem(progressKey(item))||'{}')}catch(_){return{}}}
function setProgress(item,value){try{localStorage.setItem(progressKey(item),JSON.stringify(Object.assign({},progress(item),value,{updatedAt:new Date().toISOString()})))}catch(_){}}
function authHeaders(){const access=token();return{apikey:KEY,Authorization:'Bearer '+access,'Content-Type':'application/json'}}
function errorText(error){
  const raw=String(error?.code||error?.message||error||'').toLowerCase();
  if(raw.includes('login_required')||raw.includes('invalid_session'))return L('ابتدا دوباره وارد حساب کاربری شوید.','Sign in to your account again.','Ponovno se prijavite u račun.');
  if(raw.includes('school_approval_required'))return L('دسترسی مدرسه این حساب هنوز تأیید نشده است.','This account does not have approved School access.','Pristup školi za ovaj račun nije odobren.');
  if(raw.includes('notallowed')||raw.includes('user gesture'))return L('فایل آماده است؛ یک‌بار دیگر روی پخش بزنید.','The file is ready; tap Play once more.','Datoteka je spremna; ponovno dodirnite Pokreni.');
  if(raw.includes('network')||raw.includes('failed to fetch')||raw.includes('load failed'))return L('ارتباط با فایل صوتی برقرار نشد. اینترنت را بررسی کنید یا نسخه دانلودشده را پخش کنید.','The audio file could not be reached. Check the connection or play the downloaded copy.','Audio datoteka nije dostupna. Provjerite vezu ili pokrenite preuzetu kopiju.');
  if(raw.includes('media_err_src_not_supported')||raw.includes('not supported'))return L('فرمت این فایل در این دستگاه پشتیبانی نمی‌شود.','This audio format is not supported on this device.','Ovaj audio format nije podržan na uređaju.');
  return String(error?.message||error||L('پخش فایل صوتی انجام نشد.','Audio playback failed.','Reprodukcija zvuka nije uspjela.'));
}
function cardFor(id){return document.querySelector(`[data-sermon-card="${CSS.escape(String(id))}"]`)}
function statusNode(item){
  const card=cardFor(mediaId(item));if(!card)return null;
  let node=card.querySelector('[data-v394-audio-status]');
  if(!node){node=document.createElement('div');node.dataset.v394AudioStatus='1';node.className='nh7-audio-status-v394';card.querySelector('.sermon-card-main')?.insertAdjacentElement('afterend',node)}
  return node;
}
function status(item,text,type=''){
  const node=statusNode(item);if(!node)return;
  node.className='nh7-audio-status-v394'+(type?' is-'+type:'');
  node.textContent=text||'';
  node.hidden=!text;
}
function syncUi(){
  document.querySelectorAll('[data-sermon-play]').forEach(button=>{
    const same=current&&String(button.dataset.sermonPlay)===mediaId(current);
    button.textContent=same&&!audio?.paused?'❚❚':`▶ ${same?L('ادامه','Continue','Nastavi'):L('پخش','Play','Pokreni')}`;
  });
  document.querySelectorAll('[data-inline-player]').forEach(panel=>{
    const same=current&&String(panel.dataset.inlinePlayer)===mediaId(current);
    panel.classList.toggle('hidden',!same);
    if(!same)return;
    const play=panel.querySelector('[data-inline-play]'),seek=panel.querySelector('[data-inline-seek]'),now=panel.querySelector('[data-inline-now]'),total=panel.querySelector('[data-inline-total]'),speed=panel.querySelector('[data-inline-speed]');
    if(play)play.textContent=audio?.paused?'▶':'❚❚';
    if(now)now.textContent=fmt(audio?.currentTime||0);
    const duration=(Number.isFinite(audio?.duration)&&audio.duration)||Number(current?.duration_seconds||0)||0;
    if(total)total.textContent=fmt(duration);
    if(seek)seek.value=duration?Math.round((audio.currentTime/duration)*1000):0;
    if(speed)speed.value=String(audio?.playbackRate||1);
  });
}
function ensureAudio(){
  if(audio)return audio;
  audio=new Audio();audio.preload='auto';audio.setAttribute('playsinline','');audio.setAttribute('webkit-playsinline','');
  audio.addEventListener('playing',()=>{if(current){status(current,L('در حال پخش','Playing','Reprodukcija'),'ok');lastWall=Date.now()}syncUi()});
  audio.addEventListener('waiting',()=>{if(current)status(current,L('در حال دریافت فایل…','Buffering…','Učitavanje…'),'busy')});
  audio.addEventListener('canplay',()=>{if(current&&audio.paused)status(current,L('آماده پخش','Ready to play','Spremno za reprodukciju'),'ok')});
  audio.addEventListener('pause',()=>{captureListen();flushTracking('pause',true);syncUi()});
  audio.addEventListener('seeking',()=>{seekCount++;syncUi()});
  audio.addEventListener('ratechange',syncUi);
  audio.addEventListener('timeupdate',()=>{
    captureListen();syncUi();
    if(current){setProgress(current,{time:audio.currentTime,duration:Number.isFinite(audio.duration)?audio.duration:Number(current.duration_seconds||0)});scheduleTracking()}
  });
  audio.addEventListener('ended',()=>{
    captureListen();
    if(current){setProgress(current,{time:0,duration:Number.isFinite(audio.duration)?audio.duration:Number(current.duration_seconds||0),completed:true});flushTracking('ended',true,true);status(current,L('پخش کامل شد ✓','Completed ✓','Završeno ✓'),'ok')}
    syncUi();
  });
  audio.addEventListener('error',()=>{
    if(!current)return;const code=audio.error?.code||'',message=code===4?'MEDIA_ERR_SRC_NOT_SUPPORTED':'audio_error_'+code;
    status(current,errorText(message),'error');syncUi();
  });
  return audio;
}
function captureListen(){
  if(!current||!audio||audio.paused)return;
  const now=Date.now(),last=lastWall||now,delta=Math.min(5,Math.max(0,(now-last)/1000));lastWall=now;
  if(delta>0&&delta<10)listenPending+=delta;
}
function scheduleTracking(){
  if(trackTimer||listenPending<12)return;
  trackTimer=setTimeout(()=>{trackTimer=0;flushTracking('progress',false)},200);
}
async function rpc(name,body){
  const access=token();if(!access)throw Object.assign(new Error('login_required'),{code:'login_required'});
  const response=await fetch(`${SB}/rest/v1/rpc/${name}`,{method:'POST',headers:authHeaders(),body:JSON.stringify(body||{}),cache:'no-store'});
  const text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch(_){data={message:text}}
  if(!response.ok)throw Object.assign(new Error(data?.message||data?.error||text||response.statusText),{status:response.status,code:data?.code||''});
  return data;
}
async function flushTracking(eventName='progress',force=false,ended=false){
  if(!current||!navigator.onLine)return;
  captureListen();const delta=Math.floor(listenPending);if(!force&&delta<12)return;listenPending=0;
  const duration=Math.round((Number.isFinite(audio?.duration)&&audio.duration)||Number(current.duration_seconds||0)||0),position=Math.round(audio?.currentTime||0);
  try{
    if(isSchool(current)){
      await rpc('nh7_school_record_audio_v380',{p_lesson_code:lessonCode(current),p_position_seconds:ended?duration:position,p_duration_seconds:duration,p_delta_seconds:delta,p_ended:!!ended});
    }
    await rpc('nh7_track_audio_session_v222',{
      p_session_id:sessionId||('aud394_'+Date.now()),p_device_id:device(),p_user_email:email(),p_media_type:isSchool(current)?'school':String(current.analytics_type||'sermon'),
      p_media_id:isSchool(current)?lessonCode(current):mediaId(current),p_title:title(current),p_topic:String(current.analytics_topic||current.category_name||''),
      p_source_group:String(current.analytics_source_group||current.category_id||''),p_language:lang(),p_duration_seconds:duration,p_position_seconds:position,
      p_delta_seconds:delta,p_event:eventName,p_playback_rate:Number(audio?.playbackRate||1),p_seek_count:seekCount,p_started_position_seconds:0
    }).catch(()=>{});
  }catch(error){console.warn('[NH7 audio tracking 3.9.4]',error)}
}
async function refreshSession(){
  const current=session();if(!current?.refresh_token)return current;
  try{if(window.NH7_SCHOOL_MEDIA_REFRESH)return await window.NH7_SCHOOL_MEDIA_REFRESH(false)}catch(_){}
  return current;
}
async function authorizeSchool(item){
  const id=mediaId(item),old=schoolSources.get(id);
  if(old?.url&&Number(old.expires||0)>Date.now()+60000)return old.url;
  if(old?.promise)return old.promise;
  const promise=(async()=>{
    await refreshSession();const access=token();if(!access)throw Object.assign(new Error('login_required'),{code:'login_required'});
    const response=await fetch(`${SB}/functions/v1/nh7-school-media-access`,{
      method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+access,'Content-Type':'application/json'},
      body:JSON.stringify({kind:'audio',lesson_code:lessonCode(item),device_id:device()}),cache:'no-store'
    });
    const text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch(_){data={error:text}}
    if(!response.ok||!data?.signed_url)throw Object.assign(new Error(data?.error||data?.message||text||response.statusText),{code:data?.code||'',status:response.status});
    schoolSources.set(id,{url:data.signed_url,expires:Date.now()+Math.max(60,Number(data.expires_in||0)-60)*1000});
    return data.signed_url;
  })();
  schoolSources.set(id,{promise});
  try{return await promise}catch(error){schoolSources.delete(id);throw error}
}
async function webCachedUrl(item){
  const m=meta(item);if(!m?.web)return'';
  try{
    const cache=await caches.open(WEB_MEDIA_CACHE),response=await cache.match(stableCacheUrl(item));
    if(!response){removeMeta(item);return''}
    const blob=await response.blob(),old=blobUrls.get(mediaId(item));if(old)URL.revokeObjectURL(old);
    const url=URL.createObjectURL(blob);blobUrls.set(mediaId(item),url);return url;
  }catch(_){return''}
}
async function nativeCachedUrl(item){
  const m=meta(item),Filesystem=plugin('Filesystem');if(!m?.native||!m?.path||!Filesystem)return'';
  try{await Filesystem.stat({directory:'DATA',path:m.path});const result=await Filesystem.getUri({directory:'DATA',path:m.path});return window.Capacitor?.convertFileSrc?window.Capacitor.convertFileSrc(result.uri):result.uri}catch(_){removeMeta(item);return''}
}
async function cachedUrl(item){return isNative()?nativeCachedUrl(item):webCachedUrl(item)}
function armGesture(){
  const player=ensureAudio();try{player.muted=true;player.src=SILENT_WAV;player.play().catch(()=>{})}catch(_){}
}
function beginCurrent(item){
  current=item;sessionId='aud394_'+(crypto.randomUUID?.()||Date.now()+'_'+Math.random().toString(36).slice(2));seekCount=0;listenPending=0;lastWall=Date.now();
}
function playResolved(item,url){
  const player=ensureAudio();beginCurrent(item);player.pause();player.muted=false;player.src=url;player.playbackRate=Number(localStorage.getItem('nh7_sermon_speed')||1)||1;
  const saved=progress(item),restore=()=>{player.removeEventListener('loadedmetadata',restore);if(Number(saved.time)>5&&(!player.duration||Number(saved.time)<player.duration-10)){try{player.currentTime=Number(saved.time)}catch(_){}}};
  player.addEventListener('loadedmetadata',restore);
  player.load();
  status(item,L('در حال شروع پخش…','Starting playback…','Pokretanje…'),'busy');
  const promise=player.play();
  if(promise?.catch)promise.catch(error=>{status(item,errorText(error),'error');syncUi()});
  syncUi();
}
async function handlePlay(item){
  if(!item)return;
  const player=ensureAudio();
  if(current&&mediaId(current)===mediaId(item)&&player.src!==SILENT_WAV){
    if(player.paused){const p=player.play();p?.catch?.(error=>status(item,errorText(error),'error'))}else player.pause();
    syncUi();return;
  }
  const m=meta(item);
  if(!navigator.onLine&&m){armGesture();const cached=await cachedUrl(item);if(cached){playResolved(item,cached);return}}
  if(!navigator.onLine){status(item,L('این فایل هنوز برای آفلاین دانلود نشده است.','This file has not been downloaded for offline use.','Datoteka nije preuzeta za offline korištenje.'),'error');return}
  if(!isSchool(item)&&/^https?:/i.test(String(item.audio_url||''))){playResolved(item,item.audio_url);return}
  const prepared=schoolSources.get(mediaId(item));
  if(isSchool(item)&&prepared?.url&&Number(prepared.expires||0)>Date.now()+60000){playResolved(item,prepared.url);return}
  armGesture();status(item,L('در حال آماده‌سازی لینک امن…','Preparing secure audio…','Priprema sigurnog zvuka…'),'busy');
  try{
    const cached=m?await cachedUrl(item):'';if(cached){playResolved(item,cached);return}
    const url=isSchool(item)?await authorizeSchool(item):String(item.audio_url||'');
    if(!url)throw new Error('audio_url_missing');
    playResolved(item,url);
  }catch(error){status(item,errorText(error),'error');syncUi()}
}
function safeName(item,url){
  const ext=(()=>{try{const path=new URL(url).pathname,m=path.match(/\.([a-z0-9]{2,6})$/i);return m?'.'+m[1].toLowerCase():'.mp3'}catch(_){return'.mp3'}})();
  return mediaId(item).replace(/[^a-z0-9._-]+/gi,'_').slice(0,90)+ext;
}
async function downloadNative(item,url,button){
  const Filesystem=plugin('Filesystem'),Transfer=plugin('FileTransfer');if(!Filesystem||!Transfer)throw new Error('Native file plugins unavailable');
  try{await Filesystem.mkdir({directory:'DATA',path:NATIVE_DIR,recursive:true})}catch(error){if(!String(error?.message||'').toLowerCase().includes('exist'))throw error}
  const path=`${NATIVE_DIR}/${safeName(item,url)}`,target=(await Filesystem.getUri({directory:'DATA',path})).uri;let handle=null;
  try{
    if(Transfer.addListener)handle=await Transfer.addListener('progress',event=>{
      if(event?.lengthComputable&&Number(event.contentLength)>0){const pct=Math.min(100,Math.round(Number(event.bytes||0)/Number(event.contentLength)*100));downloadState(button,item,pct)}
    });
    await Transfer.downloadFile({url,path:target,progress:true,connectTimeout:60000,readTimeout:300000});
    const stat=await Filesystem.stat({directory:'DATA',path});writeMeta(item,{native:true,path,bytes:Number(stat?.size||0),title:title(item),mime:'audio/*'});
  }finally{try{await handle?.remove?.()}catch(_){}}
}
async function downloadWeb(item,url,button){
  if(!('caches'in window))throw new Error('Cache Storage unavailable');
  const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw new Error('Download HTTP '+response.status);
  const total=Number(response.headers.get('content-length')||0),mime=response.headers.get('content-type')||'audio/mpeg',chunks=[];let received=0;
  if(response.body?.getReader){
    const reader=response.body.getReader();
    while(true){const part=await reader.read();if(part.done)break;chunks.push(part.value);received+=part.value.byteLength;if(total)downloadState(button,item,Math.min(99,Math.round(received/total*100)))}
  }else{const blob=await response.blob();chunks.push(new Uint8Array(await blob.arrayBuffer()));received=blob.size}
  const blob=new Blob(chunks,{type:mime}),cache=await caches.open(WEB_MEDIA_CACHE);
  await cache.put(stableCacheUrl(item),new Response(blob,{headers:{'Content-Type':mime,'Content-Length':String(blob.size),'X-NH7-Media-Id':mediaId(item)}}));
  writeMeta(item,{web:true,bytes:blob.size,title:title(item),mime,source_url:url});
}
function downloadState(button,item,percent){
  const text=percent>=100?L('دانلود شد ✓','Downloaded ✓','Preuzeto ✓'):L(`در حال دانلود ${percent}%`,`Downloading ${percent}%`,`Preuzimanje ${percent}%`);
  document.querySelectorAll(`[data-v394-media-id="${CSS.escape(mediaId(item))}"],[data-sermon-card="${CSS.escape(mediaId(item))}"] [data-offline-download]`).forEach(node=>{node.textContent=text;node.dataset.offlineCached=percent>=100?'1':'0';node.classList.toggle('is-downloaded-v394',percent>=100);node.disabled=percent<100});
  if(button){button.textContent=text;button.disabled=percent<100}
}
async function isDownloaded(item){
  const m=meta(item);if(!m)return false;
  if(isNative())return !!(await nativeCachedUrl(item));
  try{const cache=await caches.open(WEB_MEDIA_CACHE);return !!(await cache.match(stableCacheUrl(item)))}catch(_){return false}
}
async function removeDownload(item){
  if(isNative()){
    const m=meta(item),Filesystem=plugin('Filesystem');if(m?.path&&Filesystem)try{await Filesystem.deleteFile({directory:'DATA',path:m.path})}catch(_){}
  }else try{const cache=await caches.open(WEB_MEDIA_CACHE);await cache.delete(stableCacheUrl(item))}catch(_){}
  const old=blobUrls.get(mediaId(item));if(old){URL.revokeObjectURL(old);blobUrls.delete(mediaId(item))}
  removeMeta(item);await refreshDownloadButtons();
}
async function handleDownload(item,button){
  if(!item)return;
  if(await isDownloaded(item)){
    if(confirm(L('این فایل از حافظه آفلاین پاک شود؟','Remove this downloaded file?','Ukloniti preuzetu datoteku?')))await removeDownload(item);
    return;
  }
  if(!navigator.onLine){status(item,L('برای دانلود به اینترنت نیاز است.','Internet is required to download.','Za preuzimanje je potreban internet.'),'error');return}
  button.disabled=true;downloadState(button,item,0);
  try{
    const url=isSchool(item)?await authorizeSchool(item):String(item.audio_url||'');
    if(!url)throw new Error('audio_url_missing');
    if(isNative())await downloadNative(item,url,button);else await downloadWeb(item,url,button);
    downloadState(button,item,100);status(item,L('فایل برای استفاده آفلاین آماده شد ✓','The file is ready offline ✓','Datoteka je spremna offline ✓'),'ok');
  }catch(error){button.disabled=false;button.textContent=L('دانلود برای آفلاین','Download offline','Preuzmi offline');status(item,errorText(error),'error')}
}
function idFromNode(node){
  const card=node?.closest?.('[data-sermon-card]');if(card?.dataset.sermonCard)return String(card.dataset.sermonCard);
  const play=node?.closest?.('.sermon-card')?.querySelector?.('[data-sermon-play]');return String(play?.dataset.sermonPlay||'');
}
function ensureSchoolDownload(){
  document.querySelectorAll('.school-audio-card').forEach(card=>{
    const id=String(card.dataset.sermonCard||''),item=itemFor(id);if(!item)return;
    authorizeSchool(item).catch(()=>{});
    const actions=card.querySelector('.sermon-card-actions');if(!actions)return;
    actions.querySelectorAll('[data-offline-download]').forEach(old=>old.remove());
    if(!actions.querySelector('[data-v394-media-id]')){
      const button=document.createElement('button');button.type='button';button.className='secondary-btn compact-player-btn nh7-download-v394';button.dataset.v394MediaId=id;button.textContent=L('دانلود برای آفلاین','Download offline','Preuzmi offline');actions.appendChild(button)
    }
  });
}
async function refreshDownloadButtons(){
  const buttons=[...document.querySelectorAll('[data-v394-media-id]')];
  for(const button of buttons){const item=itemFor(button.dataset.v394MediaId);if(!item)continue;const yes=await isDownloaded(item);button.disabled=false;button.dataset.offlineCached=yes?'1':'0';button.classList.toggle('is-downloaded-v394',yes);button.textContent=yes?L('دانلود شد ✓','Downloaded ✓','Preuzeto ✓'):L('دانلود برای آفلاین','Download offline','Preuzmi offline')}
  for(const button of document.querySelectorAll('.sermon-card [data-offline-download]')){const item=itemFor(idFromNode(button));if(!item)continue;const yes=await isDownloaded(item);button.dataset.offlineCached=yes?'1':'0';button.classList.toggle('is-downloaded-v394',yes);button.textContent=yes?L('دانلود شد ✓','Downloaded ✓','Preuzeto ✓'):L('دانلود برای آفلاین','Download offline','Preuzmi offline')}
}
function patchCards(){
  ensureSchoolDownload();refreshDownloadButtons().catch(()=>{});
  if(current)syncUi();
}
function loadedCoreUrls(){
  const urls=new Set([location.href]);
  document.querySelectorAll('script[src],link[href],img[src]').forEach(node=>{try{urls.add(new URL(node.src||node.href,location.href).href)}catch(_){}});
  performance.getEntriesByType?.('resource')?.forEach(entry=>{if(/^https?:/i.test(entry.name))urls.add(entry.name)});
  const base=document.baseURI;
  [
    'data/daily/daily_word_365.json','data/daily/faith_proclamations_365.json','data/daily/daily_juice_365.json',
    'data/gratitude/gratitude_plan_30_days.json','data/salvation/need_salvation.json','data/church/about.json',
    'data/bible/plans/reading_plans_1yr_2yr.json','data/bible/groups/bible_group_01_18.json','data/bible/groups/bible_group_19_39.json','data/bible/groups/bible_group_40_66.json',
    'data/school/school_content.json','data/spiritual-plans/catalog.json',
    'data/spiritual-plans/prayer-30.json','data/spiritual-plans/grace-14.json','data/spiritual-plans/fasting-7.json',
    'data/spiritual-plans/obedience-10.json','data/spiritual-plans/salvation-10.json','data/spiritual-plans/mind-renewal-14.json'
  ].forEach(path=>{try{urls.add(new URL(path,base).href)}catch(_){}});
  if(window.NH7_APOCRYPHA_MERGED_URL)urls.add(window.NH7_APOCRYPHA_MERGED_URL);
  return [...urls].filter(url=>!url.includes('/auth/v1/')&&!url.includes('/rest/v1/')&&!url.includes('/functions/v1/'));
}
function settingsMessage(text,type=''){
  const view=document.getElementById('view');if(!view)return;
  let node=view.querySelector('[data-v394-settings-status]');
  if(!node){node=document.createElement('div');node.dataset.v394SettingsStatus='1';node.className='notice nh7-settings-status-v394';view.querySelector('.card')?.prepend(node)}
  node.className='notice nh7-settings-status-v394'+(type?' is-'+type:'');node.textContent=text;
}
async function cacheCore(button){
  const urls=loadedCoreUrls();button.disabled=true;
  try{
    const cache=await caches.open(CORE_CACHE);let done=0;
    for(const url of urls){
      try{const response=await fetch(url,{cache:'reload'});if(response.ok||response.type==='opaque')await cache.put(url,response.clone())}catch(_){}
      done++;const pct=Math.round(done/Math.max(1,urls.length)*100);button.textContent=L(`در حال آماده‌سازی ${pct}%`,`Preparing ${pct}%`,`Priprema ${pct}%`);settingsMessage(L(`در حال ذخیره محتوای اصلی: ${done} از ${urls.length}`,`Saving core content: ${done} of ${urls.length}`,`Spremanje osnovnog sadržaja: ${done} od ${urls.length}`),'busy')
    }
    localStorage.setItem('nh7_offline_core_ready_v394',new Date().toISOString());button.textContent=L('آفلاین آماده شد ✓','Offline ready ✓','Offline spremno ✓');settingsMessage(L('محتوای اصلی برای استفاده بدون اینترنت آماده شد ✓','Core content is ready for offline use ✓','Osnovni sadržaj spreman je za offline korištenje ✓'),'ok')
  }finally{button.disabled=false}
}
async function clearMedia(){
  if(isNative()){const Filesystem=plugin('Filesystem');if(Filesystem)try{await Filesystem.rmdir({directory:'DATA',path:NATIVE_DIR,recursive:true})}catch(_){}}
  else try{await caches.delete(WEB_MEDIA_CACHE)}catch(_){}
  const keys=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith(META_PREFIX))keys.push(key)}keys.forEach(key=>localStorage.removeItem(key));
  for(const url of blobUrls.values())URL.revokeObjectURL(url);blobUrls.clear();await refreshDownloadButtons();settingsMessage(L('فایل‌های دانلودشده پاک شدند.','Downloaded files were cleared.','Preuzete datoteke su izbrisane.'),'ok')
}
async function refreshApp(button){
  button.disabled=true;settingsMessage(L('در حال پاک‌کردن کش و دریافت نسخه تازه…','Clearing cache and loading the latest version…','Brisanje predmemorije i učitavanje nove verzije…'),'busy');
  try{await caches.delete(CORE_CACHE);const registrations=await navigator.serviceWorker?.getRegistrations?.()||[];await Promise.all(registrations.map(reg=>reg.update().catch(()=>{})))}catch(_){}
  location.reload();
}
function patchSettings(){
  const prepare=document.getElementById('prepareOffline'),clear=document.getElementById('clearOfflineMedia'),refresh=document.getElementById('clearCache');
  if(prepare&&!prepare.dataset.v394){prepare.dataset.v394='1';prepare.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();cacheCore(prepare).catch(error=>settingsMessage(errorText(error),'error'))},true)}
  if(clear&&!clear.dataset.v394){clear.dataset.v394='1';clear.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();if(confirm(L('همه فایل‌های صوتی دانلودشده پاک شوند؟','Clear all downloaded audio files?','Izbrisati sve preuzete audio datoteke?')))clearMedia()},true)}
  if(refresh&&!refresh.dataset.v394){refresh.dataset.v394='1';refresh.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();refreshApp(refresh)},true)}
  const account=document.getElementById('syncCloud');if(account&&!account.dataset.v394){account.dataset.v394='1';account.addEventListener('click',()=>settingsMessage(L('همگام‌سازی شروع شد؛ پس از پایان پیام تأیید نمایش داده می‌شود.','Synchronization started; a confirmation will appear when it finishes.','Sinkronizacija je pokrenuta; potvrda će se prikazati po završetku.'),'busy'),true)}
}
async function registerQaSw(){
  if(!('serviceWorker'in navigator)||location.hostname!=='raw.githack.com')return;
  try{const script=new URL('nh7-qa-sw-v394.js',location.href).href;await navigator.serviceWorker.register(script,{scope:new URL('./',location.href).pathname});await navigator.serviceWorker.ready}catch(error){console.warn('[NH7 QA service worker 3.9.4]',error)}
}
window.addEventListener('click',event=>{
  const play=event.target.closest?.('[data-sermon-play]');if(play){const item=itemFor(play.dataset.sermonPlay);if(item){event.preventDefault();event.stopImmediatePropagation();handlePlay(item);return}}
  const inline=event.target.closest?.('[data-inline-play]');if(inline){const id=inline.closest('[data-inline-player]')?.dataset.inlinePlayer,item=itemFor(id);if(item){event.preventDefault();event.stopImmediatePropagation();handlePlay(item);return}}
  const back=event.target.closest?.('[data-inline-back]');if(back&&audio){event.preventDefault();event.stopImmediatePropagation();audio.currentTime=Math.max(0,audio.currentTime-15);return}
  const forward=event.target.closest?.('[data-inline-forward]');if(forward&&audio){event.preventDefault();event.stopImmediatePropagation();audio.currentTime=Math.min(audio.duration||Infinity,audio.currentTime+30);return}
  const custom=event.target.closest?.('[data-v394-media-id]');if(custom){const item=itemFor(custom.dataset.v394MediaId);if(item){event.preventDefault();event.stopImmediatePropagation();handleDownload(item,custom);return}}
  const legacy=event.target.closest?.('.sermon-card [data-offline-download]');if(legacy){const item=itemFor(idFromNode(legacy));if(item){event.preventDefault();event.stopImmediatePropagation();handleDownload(item,legacy);return}}
},true);
window.addEventListener('input',event=>{const seek=event.target.closest?.('[data-inline-seek]');if(!seek||!audio||!Number.isFinite(audio.duration))return;event.stopImmediatePropagation();audio.currentTime=audio.duration*Number(seek.value||0)/1000},true);
window.addEventListener('change',event=>{const speed=event.target.closest?.('[data-inline-speed]');if(!speed||!audio)return;event.stopImmediatePropagation();audio.playbackRate=Number(speed.value||1);localStorage.setItem('nh7_sermon_speed',String(audio.playbackRate))},true);

const style=document.createElement('style');style.id='nh7-audio-offline-v394-style';style.textContent=`
.nh7-audio-status-v394{margin:7px 12px 10px;padding:8px 10px;border-radius:11px;background:#f3f7f8;color:#4b5563;font-size:.82rem}.nh7-audio-status-v394[hidden]{display:none}.nh7-audio-status-v394.is-ok{background:#ecfdf3;color:#08783d}.nh7-audio-status-v394.is-error{background:#fff1f0;color:#a4251c}.nh7-audio-status-v394.is-busy{background:#fff8e7;color:#805e00}.is-downloaded-v394{background:#e8f8ef!important;border-color:#74c69d!important;color:#08783d!important}.nh7-settings-status-v394.is-ok{background:#ecfdf3;color:#08783d}.nh7-settings-status-v394.is-error{background:#fff1f0;color:#a4251c}.nh7-settings-status-v394.is-busy{background:#fff8e7;color:#805e00}
`;document.head.appendChild(style);
new MutationObserver(()=>{clearTimeout(observerTimer);observerTimer=setTimeout(()=>{patchCards();patchSettings()},45)}).observe(document.documentElement,{childList:true,subtree:true});
registerQaSw();setTimeout(()=>{patchCards();patchSettings()},350);
window.addEventListener('online',()=>{patchCards();if(current&&audio?.paused)status(current,L('اینترنت وصل شد؛ برای ادامه روی پخش بزنید.','Connection restored; tap Play to continue.','Veza je vraćena; dodirnite Pokreni.'),'ok')});
window.NH7_AUDIO_OFFLINE_VERSION='3.9.4';
window.NH7_OFFLINE_MANAGER_V394={cacheCore,clearMedia,refreshDownloadButtons};
})();
