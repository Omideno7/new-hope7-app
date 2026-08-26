/* New Hope 7 Final QA R3.5 v3.9.5 */
'use strict';
const VERSION='3.9.5',SHELL='nh7-qa-shell-v395',CORE='nh7-core-v395',MEDIA='nh7-media-v395',KEEP=new Set([SHELL,CORE,MEDIA]);
self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(/^nh7-(?:qa-shell|core|media)(?:-runtime|-downloads)?-v39\d$/i.test(k)&&!KEEP.has(k))await caches.delete(k);await self.clients.claim()})()));
function sensitive(u){const p=u.pathname.toLowerCase();if(u.hostname.endsWith('.supabase.co')){if(p.includes('/auth/v1/')||p.includes('/rest/v1/')||p.includes('/functions/v1/'))return true;if(p.includes('/storage/v1/object/sign/')||p.includes('/storage/v1/object/authenticated/'))return true;if(u.searchParams.has('token'))return true}return false}
function ok(r){return r&&(r.ok||r.type==='opaque')}
async function put(c,req,res){if(ok(res))try{await(await caches.open(c)).put(req,res.clone())}catch(_){}return res}
async function any(req){let r=await caches.match(req,{ignoreVary:true});if(r)return r;if(req.mode==='navigate'){const u=new URL(req.url);r=await caches.match(u.origin+u.pathname,{ignoreSearch:true,ignoreVary:true})}return r}
async function nav(req){try{return await put(SHELL,req,await fetch(req,{cache:'no-store'}))}catch(e){const r=await any(req);if(r)return r;throw e}}
async function immutable(req){return await any(req)||put(CORE,req,await fetch(req))}
async function stale(req){const c=await any(req),n=fetch(req).then(r=>put(CORE,req,r)).catch(()=>null);return c||await n||Response.error()}
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);if(sensitive(u))return;if(u.pathname.includes('/__nh7_media_v395__/')){e.respondWith(caches.open(MEDIA).then(c=>c.match(req)).then(r=>r||new Response('Offline media not found',{status:404})));return}if(req.mode==='navigate'){e.respondWith(nav(req));return}const commit=/raw\.githack\.com$/i.test(u.hostname)&&/\/new-hope7-app\/[0-9a-f]{40}\//i.test(u.pathname);if(commit){e.respondWith(immutable(req));return}const staticType=['script','style','image','font','manifest','worker'].includes(req.destination)||/\.(?:js|css|json|png|jpe?g|webp|svg|ico|woff2?|ttf|html)$/i.test(u.pathname);if(staticType)e.respondWith(stale(req))});
self.addEventListener('message',e=>{const d=e.data||{},p=e.ports?.[0],reply=x=>{try{p?.postMessage(x)}catch(_){}};if(d.type==='NH7_QA_VERSION'){reply({ok:true,version:VERSION});return}if(d.type==='CLEAR_MEDIA')e.waitUntil(caches.delete(MEDIA).then(()=>reply({ok:true})).catch(x=>reply({ok:false,error:String(x)})))});
