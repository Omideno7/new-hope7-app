try { importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js'); } catch (e) { console.warn('OneSignal SW unavailable', e); }
const CACHE = 'omideno7-v1.8.0-dynamic-school-phase1';
const APP_SHELL = [
  './','./index.html','./admin.html','./css/styles.css','./js/app.js','./manifest.json','./admin-manifest.json','./assets/logo.png','./assets/admin-icon-192.png','./assets/admin-icon-512.png','./assets/admin-apple-touch-icon.png',
  './data/app/opening_messages_365.json','./data/church/church_config.json','./data/church/about.json',
  './data/audio/messages.json','./data/daily/daily_word_365.json','./data/daily/faith_proclamations_365.json','./data/daily/daily_juice_365.json','./data/gratitude/gratitude_plan_30_days.json','./data/salvation/need_salvation.json','./data/school/school_content.json','./data/bible/plans/reading_plans_1yr_2yr.json','./offline/index.html'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  event.respondWith((async()=>{
    const cache = await caches.open(CACHE);
    const cached = await cache.match(event.request);
    try {
      const response = await fetch(event.request);
      if (response && response.ok && url.origin === location.origin) cache.put(event.request, response.clone());
      return response;
    } catch (e) {
      return cached || cache.match('./offline/index.html');
    }
  })());
});
