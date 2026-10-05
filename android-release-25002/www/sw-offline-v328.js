try{importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js')}catch(error){console.warn('OneSignal SW unavailable',error)}

const VERSION='v2.3.9.28-offline-shell';
const CORE_CACHE='nh7-core-'+VERSION;
const SHELL_CACHE='nh7-shell-stable';
const MEDIA_CACHE='nh7-media-v2-protected';
const READER_CACHE='nh7reader-offline-v327';
const DB_NAME='nh7-offline-media-v4';
const DB_STORE='media';
const STABLE_MEDIA_PATH='__nh7_offline_media_v3__';
const SHELL_URL='./index.html';
const APP_URL='./app-v239.html';
const CORE_ASSETS=[
  './','./index.html','./app-v239.html','./manifest.json','./version.json','./offline/index.html',
  './assets/logo.png','./css/styles.css','./css/v2.2.0.css','./css/v2.2.2.css','./css/v2.2.3.css','./css/v2.2.4.css','./css/v2.3.0-access-bible.css','./css/v2.3.4-my-notes.css','./css/nh7-book-reader-v280.css','./css/nh7-library-collections-v322.css','./css/nh7-secure-media-v270.css','./css/nh7-secure-media-watermark-v272.css','./css/nh7-apocrypha-v270.css',
  './js/nh7-offline-startup-v327.js','./js/nh7-auto-update-v325.js','./js/nh7-offline-core-v327.js','./js/nh7-access-bootstrap-v230.js','./js/nh7-offline-playback-bridge-v326.js','./js/nh7-offline-persistence-v323.js','./js/app.js','./js/nh7-app-enhancements-v230.js','./js/nh7-my-notes-v234.js','./js/nh7-book-reader-v281.js','./js/nh7-library-language-v321.js','./js/nh7-library-collections-v322.js','./js/nh7-school-media-session-v262.js','./js/nh7-secure-media-v270.js','./js/nh7-secure-media-fix-v271.js','./js/nh7-large-mov-native-fallback-v273.js','./js/nh7-secure-media-watermark-v272.js','./js/nh7-apocrypha-v270.js','./js/nh7-protected-audio-gate-v316.js',
  './data/app/opening_messages_365.json','./data/church/church_config.json','./data/church/about.json','./data/daily/daily_word_365.json','./data/daily/faith_proclamations_365.json','./data/daily/daily_juice_365.json','./data/gratitude/gratitude_plan_30_days.json','./data/salvation/need_salvation.json','./data/school/school_content.json','./data/school/foundation_exam_50_trilingual.json','./data/bible/plans/reading_plans_1yr_2yr.json','./data/bible/groups/bible_group_01_18.json','./data/bible/groups/bible_group_19_39.json','./data/bible/groups/bible_group_40_66.json'
];

async function cacheOne(cache,url){try{const request=new Request(url,{cache:'reload'});const response=await fetch(request,{cache:'no-store'});if(response.ok){await cache.put(new Request(url),response.clone());return true}}catch(error){console.warn('Offline cache miss',url,error)}return false}
async function cacheCore(){const core=await caches.open(CORE_CACHE);const results=await Promise.all(CORE_ASSETS.map(url=>cacheOne(core,url)));const shell=await caches.open(SHELL_CACHE);for(const url of [SHELL_URL,APP_URL]){const response=await core.match(url,{ignoreSearch:true})||await caches.match(url,{ignoreSearch:true});if(response)await shell.put(new Request(url),response.clone())}return results.filter(Boolean).length}
async function shellResponse(){const shell=await caches.open(SHELL_CACHE);return await shell.match(SHELL_URL,{ignoreSearch:true})||await caches.match(SHELL_URL,{ignoreSearch:true})||await caches.match(APP_URL,{ignoreSearch:true})}
async function refreshShell(){const response=await fetch(SHELL_URL,{cache:'no-store'});if(!response.ok)throw new Error('Shell HTTP '+response.status);const shell=await caches.open(SHELL_CACHE);await shell.put(new Request(SHELL_URL),response.clone());const core=await caches.open(CORE_CACHE);await core.put(new Request(SHELL_URL),response.clone());return response}
function sameOrigin(url){return url.origin===self.location.origin}
function appNavigation(url){const scopePath=new URL(self.registration.scope).pathname;const relative=url.pathname.startsWith(scopePath)?url.pathname.slice(scopePath.length):url.pathname;return relative===''||relative==='index.html'||relative==='app-v239.html'}
function stableHash(value){let hash=2166136261;for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619)}return(hash>>>0).toString(16)}
function canonicalMediaIdentity(raw){try{const url=new URL(String(raw||''),self.location.origin);let path=decodeURIComponent(url.pathname);path=path.replace(/\/storage\/v1\/object\/(?:sign|authenticated|public)\//,'/storage/v1/object/');return url.origin+path}catch(_){return String(raw||'').split(/[?#]/)[0]}}
function stableMediaKey(raw){const identity=canonicalMediaIdentity(raw);return new Request(new URL(`${STABLE_MEDIA_PATH}/${stableHash(identity)}-${identity.length}`,self.registration.scope).href)}
function openDb(){return new Promise((resolve,reject)=>{const request=indexedDB.open(DB_NAME,1);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE,{keyPath:'identity'})};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('IndexedDB failed'))})}
async function idbGet(identity){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readonly');const request=tx.objectStore(DB_STORE).get(identity);request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(request.error)})}
async function idbDelete(identity){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).delete(identity);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}
async function idbAll(){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readonly');const request=tx.objectStore(DB_STORE).getAll();request.onsuccess=()=>resolve(request.result||[]);request.onerror=()=>reject(request.error)})}
function blobResponse(blob,mime){return new Response(blob,{status:200,headers:{'Content-Type':mime||blob.type||'application/octet-stream','Content-Length':String(blob.size),'Accept-Ranges':'bytes','Cache-Control':'private, max-age=31536000'}})}
async function storedMedia(raw){const identity=canonicalMediaIdentity(raw);try{const row=await idbGet(identity);if(row?.blob?.size)return blobResponse(row.blob,row.mime)}catch(_){}const cache=await caches.open(MEDIA_CACHE);return await cache.match(stableMediaKey(raw))}
async function ranged(response,request){const value=request.headers.get('range');if(!value)return response;const blob=await response.blob();const match=/bytes=(\d+)-(\d*)/.exec(value);if(!match)return response;const start=Number(match[1]);const end=match[2]?Number(match[2]):blob.size-1;if(start>=blob.size)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${blob.size}`}});const finalEnd=Math.min(end,blob.size-1);const chunk=blob.slice(start,finalEnd+1);const headers=new Headers(response.headers);headers.set('Content-Range',`bytes ${start}-${finalEnd}/${blob.size}`);headers.set('Content-Length',String(chunk.size));headers.set('Accept-Ranges','bytes');return new Response(chunk,{status:206,statusText:'Partial Content',headers})}
function protectedMedia(url){return url.origin==='https://gpzcwffxnddhaeaogdyo.supabase.co'&&(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/(?:church-audio|nh7-library|nh7-school-media)/.test(url.pathname)||/\/functions\/v1\/(?:nh7-content-access|nh7-library-access|nh7-school-media-access)/.test(url.pathname))}
async function updateStatic(request){try{const response=await fetch(request);if(response.ok)await (await caches.open(CORE_CACHE)).put(request,response.clone());return response}catch(_){return null}}
async function updatePage(request){try{const response=await fetch(request,{cache:'no-store'});if(response.ok)await (await caches.open(CORE_CACHE)).put(request,response.clone());return response}catch(_){return null}}

self.addEventListener('install',event=>event.waitUntil(cacheCore().then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keep=new Set([CORE_CACHE,SHELL_CACHE,MEDIA_CACHE,READER_CACHE]);const keys=await caches.keys();await Promise.all(keys.filter(key=>(key.startsWith('nh7-core-')||key.startsWith('nh7-data-')||key.startsWith('nh7-public-api-')||key.startsWith('omideno7-'))&&!keep.has(key)).map(key=>caches.delete(key)));await self.clients.claim()})()));
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);
  if(request.mode==='navigate'&&sameOrigin(url)){
    if(appNavigation(url)){
      const update=refreshShell().catch(()=>null);event.waitUntil(update.then(()=>{}));
      event.respondWith((async()=>await shellResponse()||await update||await caches.match('./offline/index.html',{ignoreSearch:true}))());
    }else{
      const update=updatePage(request);event.waitUntil(update.then(()=>{}));
      event.respondWith((async()=>await caches.match(request,{ignoreSearch:true})||await update||await caches.match('./offline/index.html',{ignoreSearch:true}))());
    }
    return;
  }
  if(protectedMedia(url)){
    event.respondWith((async()=>{const local=await storedMedia(request.url);if(local)return ranged(local,request);return fetch(request,{cache:'no-store'})})());
    return;
  }
  if(sameOrigin(url)){
    const update=updateStatic(request);event.waitUntil(update.then(()=>{}));
    event.respondWith((async()=>await caches.match(request,{ignoreSearch:true})||await update||await caches.match('./offline/index.html',{ignoreSearch:true}))());
  }
});
async function removeMedia(raw){const identity=canonicalMediaIdentity(raw);try{await idbDelete(identity)}catch(_){}try{await (await caches.open(MEDIA_CACHE)).delete(stableMediaKey(raw))}catch(_){}return true}
self.addEventListener('message',event=>{const data=event.data||{};const port=event.ports?.[0];const reply=value=>port?.postMessage(value);event.waitUntil((async()=>{try{if(data.type==='SKIP_WAITING'){await self.skipWaiting();reply({ok:true});return}if(data.type==='CACHE_CORE'){reply({ok:true,cached:await cacheCore()});return}if(data.type==='MEDIA_STATUS'){reply({ok:true,cached:!!await storedMedia(data.url),identity:canonicalMediaIdentity(data.url)});return}if(data.type==='REMOVE_URL'){await removeMedia(data.url);reply({ok:true});return}if(data.type==='CLEAR_MEDIA'){await caches.delete(MEDIA_CACHE);for(const row of await idbAll())await idbDelete(row.identity);reply({ok:true});return}if(data.type==='OFFLINE_STATUS'){const rows=await idbAll();const bytes=rows.reduce((sum,row)=>sum+Number(row?.blob?.size||0),0);reply({ok:true,mediaCount:rows.filter(row=>row?.blob?.size).length,mediaBytes:bytes,coreCount:(await (await caches.open(CORE_CACHE)).keys()).length});return}reply({ok:false,error:'Unknown offline command'})}catch(error){reply({ok:false,error:error?.message||String(error)})})())});
