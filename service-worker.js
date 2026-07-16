try { importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js'); } catch (e) { console.warn('OneSignal SW unavailable', e); }

const VERSION='v2.1.5-admin-insights-certificates-1';
const CORE_CACHE='nh7-core-'+VERSION;
const DATA_CACHE='nh7-data-'+VERSION;
const PUBLIC_API_CACHE='nh7-public-api-'+VERSION;
const MEDIA_CACHE='nh7-media-v1';
const OFFLINE_PAGE='./offline/index.html';

const CORE_ASSETS=[
  './','./index.html','./admin.html','./privacy.html','./css/styles.css','./js/app.js','./manifest.json','./admin-manifest.json',
  './assets/logo.png','./assets/admin-icon-192.png','./assets/admin-icon-512.png','./assets/admin-apple-touch-icon.png',
  './assets/about/beliefs_fa_source.jpeg','./assets/about/vision_fa_source.jpeg',
  './data/app/opening_messages_365.json','./data/church/church_config.json','./data/church/about.json',
  './data/audio/messages.json','./data/daily/daily_word_365.json','./data/daily/faith_proclamations_365.json','./data/daily/daily_juice_365.json',
  './data/gratitude/gratitude_plan_30_days.json','./data/salvation/need_salvation.json','./data/school/school_content.json','./data/school/foundation_exam_50_trilingual.json',
  './data/bible/plans/reading_plans_1yr_2yr.json','./data/bible/groups/bible_group_01_18.json','./data/bible/groups/bible_group_19_39.json','./data/bible/groups/bible_group_40_66.json',
  './offline/index.html'
];

async function cacheOne(cache,url){try{const req=new Request(url,{cache:'reload'});const res=await fetch(req);if(res.ok){await cache.put(req,res.clone());return true}}catch(e){console.warn('Offline cache miss',url,e)}return false}
async function cacheCore(){const cache=await caches.open(CORE_CACHE);const results=await Promise.all(CORE_ASSETS.map(x=>cacheOne(cache,x)));return results.filter(Boolean).length}

self.addEventListener('install',event=>{event.waitUntil(cacheCore().then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keep=new Set([CORE_CACHE,DATA_CACHE,PUBLIC_API_CACHE,MEDIA_CACHE]);const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('nh7-')||k.startsWith('omideno7-')).filter(k=>!keep.has(k)).map(k=>caches.delete(k)));await self.clients.claim()})())});

function isLocalStatic(url){return url.origin===self.location.origin&&(url.pathname.includes('/data/')||url.pathname.includes('/assets/')||url.pathname.endsWith('.css')||url.pathname.endsWith('.js')||url.pathname.endsWith('.json')||url.pathname.endsWith('.png')||url.pathname.endsWith('.jpeg')||url.pathname.endsWith('.jpg')||url.pathname.endsWith('.webp'))}
function isPublicSupabase(url){if(!url.pathname.includes('/rest/v1/'))return false;return ['daily_content','school_lessons','school_courses','sermons','sermon_categories','notification_settings','meeting_settings'].some(t=>url.pathname.includes('/rest/v1/'+t))}
function simpleKey(request){return new Request(request.url,{method:'GET'})}
async function networkFirst(request,cacheName,key=request){const cache=await caches.open(cacheName);try{const res=await fetch(request);if(res&&res.ok)await cache.put(key,res.clone());return res}catch(e){const hit=await cache.match(key);if(hit)return hit;throw e}}
async function staleWhileRevalidate(request,cacheName){const cache=await caches.open(cacheName);const hit=await cache.match(request);const update=fetch(request).then(res=>{if(res&&res.ok)cache.put(request,res.clone());return res}).catch(()=>null);return hit||await update||await caches.match(OFFLINE_PAGE)}
async function mediaFromCache(request){const cache=await caches.open(MEDIA_CACHE);const key=simpleKey(request);const full=await cache.match(key);if(!full)return null;const range=request.headers.get('range');if(!range)return full;const blob=await full.blob();const m=/bytes=(\d+)-(\d*)/.exec(range);if(!m)return full;const start=Number(m[1]);const end=m[2]?Number(m[2]):blob.size-1;if(start>=blob.size)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${blob.size}`}});const chunk=blob.slice(start,Math.min(end+1,blob.size));const headers=new Headers(full.headers);headers.set('Content-Range',`bytes ${start}-${Math.min(end,blob.size-1)}/${blob.size}`);headers.set('Content-Length',String(chunk.size));headers.set('Accept-Ranges','bytes');return new Response(chunk,{status:206,statusText:'Partial Content',headers})}

self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);
  if(req.mode==='navigate'){event.respondWith(networkFirst(req,CORE_CACHE).catch(()=>caches.match('./index.html').then(r=>r||caches.match(OFFLINE_PAGE))));return}
  event.respondWith((async()=>{
    const media=await mediaFromCache(req);if(media)return media;
    if(isPublicSupabase(url)){const key=simpleKey(req);return networkFirst(req,PUBLIC_API_CACHE,key).catch(()=>caches.match(key))}
    if(isLocalStatic(url))return staleWhileRevalidate(req,DATA_CACHE);
    try{return await fetch(req)}catch(e){return (await caches.match(req))||(await caches.match(OFFLINE_PAGE))}
  })());
});

async function downloadUrl(url){const cache=await caches.open(MEDIA_CACHE);const key=new Request(url,{method:'GET'});const existing=await cache.match(key);if(existing){const b=await existing.clone().blob();return {bytes:b.size,already:true}}const res=await fetch(url,{cache:'no-store'});if(!res.ok)throw new Error('HTTP '+res.status);const clone=res.clone();const blob=await clone.blob();await cache.put(key,res);return {bytes:blob.size,already:false}}
async function mediaStats(){const cache=await caches.open(MEDIA_CACHE);const keys=await cache.keys();let bytes=0;for(const k of keys){const r=await cache.match(k);if(r){const b=await r.clone().blob();bytes+=b.size}}const core=await caches.open(CORE_CACHE);return {mediaCount:keys.length,mediaBytes:bytes,coreCount:(await core.keys()).length}}
self.addEventListener('message',event=>{const d=event.data||{},port=event.ports&&event.ports[0];const reply=x=>port&&port.postMessage(x);event.waitUntil((async()=>{try{
  if(d.type==='CACHE_CORE'){const cached=await cacheCore();reply({ok:true,cached});return}
  if(d.type==='DOWNLOAD_URL'){const r=await downloadUrl(d.url);reply(Object.assign({ok:true},r));return}
  if(d.type==='REMOVE_URL'){const cache=await caches.open(MEDIA_CACHE);await cache.delete(new Request(d.url,{method:'GET'}));reply({ok:true});return}
  if(d.type==='MEDIA_STATUS'){const cache=await caches.open(MEDIA_CACHE);const r=await cache.match(new Request(d.url,{method:'GET'}));reply({ok:true,cached:!!r});return}
  if(d.type==='CLEAR_MEDIA'){await caches.delete(MEDIA_CACHE);await caches.open(MEDIA_CACHE);reply({ok:true});return}
  if(d.type==='OFFLINE_STATUS'){reply(Object.assign({ok:true},await mediaStats()));return}
  reply({ok:false,error:'Unknown offline command'});
}catch(e){reply({ok:false,error:e.message||String(e)})}})())});
