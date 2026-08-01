try{importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js')}catch(error){console.warn('OneSignal SW unavailable',error)}

const VERSION='v2.3.9.29-offline-routes';
const CORE_CACHE='nh7-core-'+VERSION;
const SHELL_CACHE='nh7-shell-stable';
const DATA_CACHE='nh7-data-stable-v329';
const MEDIA_CACHE='nh7-media-v2-protected';
const READER_CACHE='nh7reader-offline-v327';
const DB_NAME='nh7-offline-media-v4';
const DB_STORE='media';
const STABLE_MEDIA_PATH='__nh7_offline_media_v3__';
const SHELL_URL='./index.html';
const APP_URL='./app-v239.html';
const OFFLINE_URL='./offline/index.html';
const CORE_ASSETS=[
  './','./index.html','./app-v239.html','./manifest.json','./version.json',OFFLINE_URL,
  './assets/logo.png','./css/styles.css','./css/v2.2.0.css','./css/v2.2.2.css','./css/v2.2.3.css','./css/v2.2.4.css','./css/v2.3.0-access-bible.css','./css/v2.3.4-my-notes.css','./css/nh7-book-reader-v280.css','./css/nh7-library-collections-v322.css','./css/nh7-secure-media-v270.css','./css/nh7-secure-media-watermark-v272.css','./css/nh7-apocrypha-v270.css',
  './js/nh7-offline-startup-v327.js','./js/nh7-auto-update-v325.js','./js/nh7-offline-core-v327.js','./js/nh7-offline-data-v329.js','./js/nh7-access-bootstrap-v230.js','./js/nh7-offline-playback-bridge-v326.js','./js/nh7-offline-persistence-v323.js','./js/app.js','./js/nh7-app-enhancements-v230.js','./js/nh7-my-notes-v234.js','./js/nh7-book-reader-v281.js','./js/nh7-library-language-v321.js','./js/nh7-library-collections-v322.js','./js/nh7-school-media-session-v262.js','./js/nh7-secure-media-v270.js','./js/nh7-secure-media-fix-v271.js','./js/nh7-large-mov-native-fallback-v273.js','./js/nh7-secure-media-watermark-v272.js','./js/nh7-apocrypha-v270.js','./js/nh7-protected-audio-gate-v316.js','./js/nh7-ui-stability-v329.js',
  './data/app/opening_messages_365.json','./data/church/church_config.json','./data/church/about.json','./data/daily/daily_word_365.json','./data/daily/faith_proclamations_365.json','./data/daily/daily_juice_365.json','./data/gratitude/gratitude_plan_30_days.json','./data/salvation/need_salvation.json','./data/school/school_content.json','./data/school/foundation_exam_50_trilingual.json','./data/bible/plans/reading_plans_1yr_2yr.json','./data/bible/groups/bible_group_01_18.json','./data/bible/groups/bible_group_19_39.json','./data/bible/groups/bible_group_40_66.json'
];
function canonicalRequest(raw){const url=new URL(typeof raw==='string'?raw:raw.url,self.location.origin);return new Request(url.origin+url.pathname,{method:'GET'})}
async function cacheOne(cache,url){try{const response=await fetch(url,{cache:'no-store'});if(response.ok){await cache.put(canonicalRequest(url),response.clone());return true}}catch(_){}return false}
async function cacheCore(){
  const core=await caches.open(CORE_CACHE),data=await caches.open(DATA_CACHE);let count=0;
  for(const url of CORE_ASSETS){const target=url.includes('/data/')||url.endsWith('.json')?data:core;if(await cacheOne(target,url))count++}
  const shell=await caches.open(SHELL_CACHE);
  for(const url of [SHELL_URL,APP_URL]){const response=await core.match(canonicalRequest(url))||await caches.match(url,{ignoreSearch:true});if(response)await shell.put(canonicalRequest(url),response.clone())}
  return count;
}
async function shellResponse(){const shell=await caches.open(SHELL_CACHE);return await shell.match(canonicalRequest(SHELL_URL))||await caches.match(SHELL_URL,{ignoreSearch:true})||await caches.match(APP_URL,{ignoreSearch:true})}
function scopeRelative(url){const scope=new URL(self.registration.scope).pathname;return url.pathname.startsWith(scope)?url.pathname.slice(scope.length):url.pathname}
function appNavigation(url){const rel=scopeRelative(url);return rel===''||rel==='index.html'||rel==='app-v239.html'}
function isData(url){return url.pathname.includes('/data/')||url.pathname.endsWith('.json')}
function isStatic(url){return /\.(?:js|css|png|jpe?g|webp|svg|ico|woff2?|ttf)$/i.test(url.pathname)}
function responseType(url){if(url.pathname.endsWith('.json'))return'application/json; charset=utf-8';if(url.pathname.endsWith('.js'))return'application/javascript; charset=utf-8';if(url.pathname.endsWith('.css'))return'text/css; charset=utf-8';return'text/plain; charset=utf-8'}
async function updateCache(request,cacheName){try{const response=await fetch(request,{cache:'no-store'});if(response.ok)await (await caches.open(cacheName)).put(canonicalRequest(request),response.clone());return response}catch(_){return null}}
function offlineDataResponse(url){return new Response(JSON.stringify({error:'offline_not_cached',path:url.pathname}),{status:503,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}
function unavailable(url){return new Response('',{status:504,headers:{'Content-Type':responseType(url),'Cache-Control':'no-store'}})}
function hash(value){let h=2166136261;for(let i=0;i<String(value).length;i++){h^=String(value).charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)}
function mediaIdentity(raw){try{const url=new URL(String(raw||''),self.location.origin);let path=decodeURIComponent(url.pathname);path=path.replace(/\/storage\/v1\/object\/(?:sign|authenticated|public)\//,'/storage/v1/object/');return url.origin+path}catch(_){return String(raw||'').split(/[?#]/)[0]}}
function mediaKey(raw){const id=mediaIdentity(raw);return new Request(new URL(`${STABLE_MEDIA_PATH}/${hash(id)}-${id.length}`,self.registration.scope).href)}
function openDb(){return new Promise((resolve,reject)=>{const request=indexedDB.open(DB_NAME,1);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE,{keyPath:'identity'})};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('IndexedDB failed'))})}
async function dbGet(identity){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readonly'),request=tx.objectStore(DB_STORE).get(identity);request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(request.error)})}
async function dbAll(){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readonly'),request=tx.objectStore(DB_STORE).getAll();request.onsuccess=()=>resolve(request.result||[]);request.onerror=()=>reject(request.error)})}
async function dbDelete(identity){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).delete(identity);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}
function blobResponse(blob,mime){return new Response(blob,{status:200,headers:{'Content-Type':mime||blob.type||'application/octet-stream','Content-Length':String(blob.size),'Accept-Ranges':'bytes','Cache-Control':'private, max-age=31536000'}})}
async function storedMedia(raw){try{const row=await dbGet(mediaIdentity(raw));if(row?.blob?.size)return blobResponse(row.blob,row.mime)}catch(_){}try{return await (await caches.open(MEDIA_CACHE)).match(mediaKey(raw))}catch(_){return null}}
async function rangeResponse(response,request){const range=request.headers.get('range');if(!range)return response;const blob=await response.blob(),match=/bytes=(\d+)-(\d*)/.exec(range);if(!match)return response;const start=Number(match[1]),end=match[2]?Number(match[2]):blob.size-1;if(start>=blob.size)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${blob.size}`}});const finalEnd=Math.min(end,blob.size-1),chunk=blob.slice(start,finalEnd+1),headers=new Headers(response.headers);headers.set('Content-Range',`bytes ${start}-${finalEnd}/${blob.size}`);headers.set('Content-Length',String(chunk.size));headers.set('Accept-Ranges','bytes');return new Response(chunk,{status:206,statusText:'Partial Content',headers})}
function protectedMedia(url){return url.origin==='https://gpzcwffxnddhaeaogdyo.supabase.co'&&(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/(?:church-audio|nh7-library|nh7-school-media)/.test(url.pathname)||/\/functions\/v1\/(?:nh7-content-access|nh7-library-access|nh7-school-media-access)/.test(url.pathname))}
self.addEventListener('install',event=>event.waitUntil(cacheCore().then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keep=new Set([CORE_CACHE,SHELL_CACHE,DATA_CACHE,MEDIA_CACHE,READER_CACHE]);const keys=await caches.keys();await Promise.all(keys.filter(key=>(key.startsWith('nh7-core-')||key.startsWith('nh7-public-api-')||key.startsWith('omideno7-'))&&!keep.has(key)).map(key=>caches.delete(key)));await self.clients.claim()})()));
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);
  if(request.mode==='navigate'&&url.origin===self.location.origin){
    if(appNavigation(url))event.respondWith((async()=>{const cached=await shellResponse();if(cached){event.waitUntil(updateCache(SHELL_URL,CORE_CACHE).then(async response=>{if(response)await (await caches.open(SHELL_CACHE)).put(canonicalRequest(SHELL_URL),response.clone())}));return cached}return await updateCache(SHELL_URL,CORE_CACHE)||await caches.match(OFFLINE_URL,{ignoreSearch:true})})());
    else event.respondWith((async()=>await caches.match(request,{ignoreSearch:true})||await updateCache(request,CORE_CACHE)||await caches.match(OFFLINE_URL,{ignoreSearch:true}))());
    return;
  }
  if(protectedMedia(url)){event.respondWith((async()=>{const local=await storedMedia(request.url);if(local)return rangeResponse(local,request);try{return await fetch(request,{cache:'no-store'})}catch(_){return new Response('',{status:503})}})());return}
  if(url.origin===self.location.origin&&(isData(url)||isStatic(url))){
    const cacheName=isData(url)?DATA_CACHE:CORE_CACHE;
    event.respondWith((async()=>{const cache=await caches.open(cacheName),key=canonicalRequest(request),cached=await cache.match(key)||await caches.match(request,{ignoreSearch:true});if(cached){event.waitUntil(updateCache(request,cacheName).then(()=>{}));return cached}const fresh=await updateCache(request,cacheName);if(fresh)return fresh;return isData(url)?offlineDataResponse(url):unavailable(url)})());
  }
});
async function clearMedia(){await caches.delete(MEDIA_CACHE);await caches.open(MEDIA_CACHE);try{for(const row of await dbAll())await dbDelete(row.identity)}catch(_){}return true}
async function mediaStats(){let rows=[];try{rows=await dbAll()}catch(_){}const bytes=rows.reduce((sum,row)=>sum+Number(row?.blob?.size||0),0),count=rows.filter(row=>row?.blob?.size).length;let coreCount=0;try{coreCount=(await (await caches.open(CORE_CACHE)).keys()).length+(await (await caches.open(DATA_CACHE)).keys()).length}catch(_){}return{mediaCount:count,mediaBytes:bytes,coreCount}}
self.addEventListener('message',event=>{const data=event.data||{},port=event.ports?.[0],reply=value=>port?.postMessage(value);event.waitUntil((async()=>{try{if(data.type==='SKIP_WAITING'){await self.skipWaiting();reply({ok:true});return}if(data.type==='CACHE_CORE'){reply({ok:true,cached:await cacheCore()});return}if(data.type==='MEDIA_STATUS'){reply({ok:true,cached:!!await storedMedia(data.url),identity:mediaIdentity(data.url)});return}if(data.type==='REMOVE_URL'){try{await dbDelete(mediaIdentity(data.url))}catch(_){}try{await (await caches.open(MEDIA_CACHE)).delete(mediaKey(data.url))}catch(_){}reply({ok:true});return}if(data.type==='CLEAR_MEDIA'){await clearMedia();reply({ok:true});return}if(data.type==='OFFLINE_STATUS'){reply(Object.assign({ok:true},await mediaStats()));return}reply({ok:false,error:'Unknown offline command'})}catch(error){reply({ok:false,error:error?.message||String(error)})})())});
