try { importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js'); } catch (e) { console.warn('OneSignal SW unavailable', e); }

const VERSION='v2.3.0-protected-content-bible-batch-admin';
const CORE_CACHE='nh7-core-'+VERSION;
const DATA_CACHE='nh7-data-'+VERSION;
const PUBLIC_API_CACHE='nh7-public-api-'+VERSION;
const MEDIA_CACHE='nh7-media-v2-protected';
const OFFLINE_PAGE='./offline/index.html';

const CORE_ASSETS=[
  './','./index.html','./admin.html','./certificate.html','./verify-document.html','./reset-password.html','./privacy.html','./css/styles.css','./css/v2.2.0.css','./css/v2.2.0-platform.css','./css/v2.2.1.css','./css/v2.2.2.css','./css/v2.2.3.css','./css/v2.2.4.css','./css/v2.2.5.css','./css/v2.3.0-access-bible.css','./css/admin-v2.3.0-student-profile.css','./js/app.js','./js/nh7-access-bootstrap-v230.js','./js/nh7-app-enhancements-v230.js','./js/admin-v2.2.0.js','./js/admin-v2.2.1.js','./js/admin-v2.2.2.js','./js/admin-v2.2.3.js','./js/admin-v2.2.4.js','./js/admin-v2.2.5-v230.js','./manifest.json','./admin-manifest.json',
  './assets/logo.png','./assets/admin-icon-192.png','./assets/admin-icon-512.png','./assets/admin-apple-touch-icon.png',
  './assets/about/beliefs_fa_source.jpeg','./assets/about/vision_fa_source.jpeg',
  './data/app/opening_messages_365.json','./data/church/church_config.json','./data/church/about.json',
  './data/daily/daily_word_365.json','./data/daily/faith_proclamations_365.json','./data/daily/daily_juice_365.json',
  './data/gratitude/gratitude_plan_30_days.json','./data/salvation/need_salvation.json','./data/school/school_content.json','./data/school/school_content.json','./data/school/foundation_exam_50_trilingual.json',
  './data/bible/plans/reading_plans_1yr_2yr.json','./data/bible/groups/bible_group_01_18.json','./data/bible/groups/bible_group_19_39.json','./data/bible/groups/bible_group_40_66.json',
  './offline/index.html'
];

async function cacheOne(cache,url){try{const req=new Request(url,{cache:'reload'});const res=await fetch(req);if(res.ok){await cache.put(req,res.clone());return true}}catch(e){console.warn('Offline cache miss',url,e)}return false}
async function cacheCore(){const cache=await caches.open(CORE_CACHE);const results=await Promise.all(CORE_ASSETS.map(x=>cacheOne(cache,x)));return results.filter(Boolean).length}

self.addEventListener('install',event=>{event.waitUntil(cacheCore().then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keep=new Set([CORE_CACHE,DATA_CACHE,PUBLIC_API_CACHE,MEDIA_CACHE]);const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('nh7-')||k.startsWith('omideno7-')).filter(k=>!keep.has(k)).map(k=>caches.delete(k)));await self.clients.claim()})())});

function isLocalStatic(url){return url.origin===self.location.origin&&(url.pathname.includes('/data/')||url.pathname.includes('/assets/')||url.pathname.endsWith('.css')||url.pathname.endsWith('.js')||url.pathname.endsWith('.json')||url.pathname.endsWith('.png')||url.pathname.endsWith('.jpeg')||url.pathname.endsWith('.jpg')||url.pathname.endsWith('.webp'))}
function isPublicSupabase(url){if(!url.pathname.includes('/rest/v1/'))return false;return ['daily_content','school_courses','sermon_categories','notification_settings','meeting_settings','document_templates_v220'].some(t=>url.pathname.includes('/rest/v1/'+t))}
function isProtectedSupabase(url){return url.origin==='https://gpzcwffxnddhaeaogdyo.supabase.co'&&(
  /\/rest\/v1\/(sermons|audio_bible_books|audio_bible_books_v220|audio_bible_chapters|audio_bible_chapters_v220|nh7_library_items|nh7_library_items_v222|nh7_library_items_v224)/.test(url.pathname)
  || /\/functions\/v1\/(nh7-content-access|nh7-library-access)/.test(url.pathname)
  || /\/storage\/v1\/object\/(public|sign)\/(church-audio|nh7-library)/.test(url.pathname)
)}
function simpleKey(request){return new Request(request.url,{method:'GET'})}
async function networkFirst(request,cacheName,key=request){const cache=await caches.open(cacheName);try{const res=await fetch(request);if(res&&res.ok)await cache.put(key,res.clone());return res}catch(e){const hit=await cache.match(key);if(hit)return hit;throw e}}
async function staleWhileRevalidate(request,cacheName){const cache=await caches.open(cacheName);const hit=await cache.match(request);const update=fetch(request).then(res=>{if(res&&res.ok)cache.put(request,res.clone());return res}).catch(()=>null);return hit||await update||await caches.match(OFFLINE_PAGE)}
async function mediaFromCache(request){const cache=await caches.open(MEDIA_CACHE);const key=simpleKey(request);const full=await cache.match(key);if(!full)return null;const range=request.headers.get('range');if(!range)return full;const blob=await full.blob();const m=/bytes=(\d+)-(\d*)/.exec(range);if(!m)return full;const start=Number(m[1]);const end=m[2]?Number(m[2]):blob.size-1;if(start>=blob.size)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${blob.size}`}});const chunk=blob.slice(start,Math.min(end+1,blob.size));const headers=new Headers(full.headers);headers.set('Content-Range',`bytes ${start}-${Math.min(end,blob.size-1)}/${blob.size}`);headers.set('Content-Length',String(chunk.size));headers.set('Accept-Ranges','bytes');return new Response(chunk,{status:206,statusText:'Partial Content',headers})}

function nh7FindAdminPushData(value,depth=0){if(!value||depth>5)return null;if(typeof value==='object'&&value.nh7_admin_event)return value;if(typeof value==='object'){for(const v of Object.values(value)){const found=nh7FindAdminPushData(v,depth+1);if(found)return found}}return null}
self.addEventListener('push',event=>{try{const raw=event.data?event.data.json():null,data=nh7FindAdminPushData(raw);if(!data||!self.navigator?.setAppBadge)return;const n=Math.max(1,Number(data.unread_count)||1);event.waitUntil(self.navigator.setAppBadge(n))}catch(e){console.warn('NH7 admin badge push parse failed',e)}});

self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);
  if(req.mode==='navigate'){event.respondWith(networkFirst(req,CORE_CACHE).catch(()=>caches.match('./index.html').then(r=>r||caches.match(OFFLINE_PAGE))));return}
  event.respondWith((async()=>{
    const media=await mediaFromCache(req);if(media)return media;
    if(isProtectedSupabase(url))return fetch(req,{cache:'no-store'});
    if(isPublicSupabase(url)){const key=simpleKey(req);return networkFirst(req,PUBLIC_API_CACHE,key).catch(()=>caches.match(key))}
    if(isLocalStatic(url))return staleWhileRevalidate(req,DATA_CACHE);
    try{return await fetch(req)}catch(e){return (await caches.match(req))||(await caches.match(OFFLINE_PAGE))}
  })());
});

async function downloadUrl(url){const parsed=new URL(url);if(!isProtectedSupabase(parsed))throw new Error('Only protected signed media may be stored offline');const cache=await caches.open(MEDIA_CACHE);const key=new Request(url,{method:'GET'});const existing=await cache.match(key);if(existing){const b=await existing.clone().blob();return {bytes:b.size,already:true}}const res=await fetch(url,{cache:'no-store'});if(!res.ok)throw new Error('HTTP '+res.status);const clone=res.clone();const blob=await clone.blob();await cache.put(key,res);return {bytes:blob.size,already:false}}
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
