/* New Hope 7 — scope-safe network-first app shell v4.0.3
 * Imported before the legacy offline worker. It handles only main app navigations,
 * then stops propagation so old shared shell caches cannot serve another scope/build.
 */
'use strict';
const NH7_SHELL403_CACHE='nh7-shell-v403';
function nh7ScopeRelative403(url){const scope=new URL(self.registration.scope).pathname;return url.pathname.startsWith(scope)?url.pathname.slice(scope.length):url.pathname}
function nh7AppNav403(url){const rel=nh7ScopeRelative403(url);return rel===''||rel==='index.html'||rel==='app-v239.html'}
function nh7ShellKey403(path='./index.html'){const u=new URL(path,self.registration.scope);return new Request(u.origin+u.pathname,{method:'GET'})}
async function nh7StoreShell403(response){if(!response?.ok)return;try{await (await caches.open(NH7_SHELL403_CACHE)).put(nh7ShellKey403(),response.clone())}catch(_){}}
async function nh7FreshShell403(request){try{const response=await fetch(request,{cache:'no-store'});if(response?.ok){await nh7StoreShell403(response);return response}}catch(_){}try{const cached=await (await caches.open(NH7_SHELL403_CACHE)).match(nh7ShellKey403());if(cached)return cached}catch(_){}try{const fallback=await caches.match(new Request(new URL('./offline/index.html',self.registration.scope).href),{ignoreSearch:true});if(fallback)return fallback}catch(_){}return new Response('<!doctype html><meta charset="utf-8"><title>Offline</title><p>Offline content is not prepared yet.</p>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}})}
self.addEventListener('install',event=>{event.waitUntil((async()=>{try{const response=await fetch(new URL('./index.html',self.registration.scope).href,{cache:'no-store'});if(response.ok)await nh7StoreShell403(response)}catch(_){}})())});
self.addEventListener('activate',event=>event.waitUntil((async()=>{try{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('nh7-shell-v403-')).map(k=>caches.delete(k)))}catch(_){} })()));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||event.request.mode!=='navigate')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin||!nh7AppNav403(url))return;event.respondWith(nh7FreshShell403(event.request));event.stopImmediatePropagation();});
