const fs=require('fs'),cp=require('child_process'),vm=require('vm'),assert=require('assert/strict');
const BASE='44dfd189832c4a6031562851765811f941e0efe4',scope='https://qa.invalid/new-hope7-app/',stores=new Map();let generation='old';
const caches={async keys(){return [...stores.keys()]},async delete(k){return stores.delete(k)},async open(k){if(!stores.has(k))stores.set(k,new Map());const s=stores.get(k);return {async put(k,r){s.set(k.url||String(k),r.clone())},async match(k){return s.get(k.url||String(k))?.clone()},async keys(){return [...s.keys()].map(k=>new Request(k))}}}};
function worker(code){const events={};vm.runInNewContext(code,{self:{registration:{scope},addEventListener(n,f){(events[n]??=[]).push(f)}},caches,URL,Request,Response,console,fetch:async url=>new Response(generation+':'+String(url))});return events}
async function lifecycle(w,name){const tasks=[];for(const f of w[name]||[])f({waitUntil(p){tasks.push(p)}});await Promise.all(tasks)}
(async()=>{
 const old=worker(cp.execFileSync('git',['show',BASE+':sw-release-core-v403.js'],{encoding:'utf8'}));await lifecycle(old,'install');
 const keep=['nh7-offline-media-v4','nh7-audio-route-v423','nh7-personal-notes-fixture','nh7-data-stable-v329'];
 for(const k of keep)await(await caches.open(k)).put(new Request(scope+'preserve'),new Response('UNCHANGED '+k));
 generation='v468';const next=worker(fs.readFileSync('sw-release-core-v403.js','utf8'));await lifecycle(next,'install');assert((await caches.keys()).includes('nh7-release-core-v466-school-guide'));await lifecycle(next,'activate');assert((await caches.keys()).includes('nh7-release-core-v468-school-drafts'));
 for(const k of keep)assert.equal(await(await(await caches.open(k)).match(new Request(scope+'preserve'))).text(),'UNCHANGED '+k);
 for(const path of ['js/app.js','js/nh7-school-drafts-v468.js']){let response,stopped=false;for(const f of next.fetch||[])f({request:new Request(scope+path+'?v=4.6.8'),respondWith(p){response=p},stopImmediatePropagation(){stopped=true}});assert(stopped);assert.equal(await(await response).text(),'v468:'+scope+path)}
 const app=fs.readFileSync('js/app.js','utf8'),idx=fs.readFileSync('index.html','utf8');assert(app.includes("'./nh7-school-drafts-v468.js?v=4.6.8'"));assert(idx.includes('js/app.js?v=4.6.8')&&idx.includes('service-worker.js?v=4.6.8'));assert(fs.readFileSync('service-worker.js','utf8').includes('sw-release-core-v403.js?v=4.6.8'));
 fs.mkdirSync('qa-drafts-v468',{recursive:true});fs.writeFileSync('qa-drafts-v468/cache-report.json',JSON.stringify({passed:true,protected_caches:keep,offline_paths:['js/app.js','js/nh7-school-drafts-v468.js'],scope:'Actual release-core in isolated synthetic cache; no user data or backend operation.'},null,2));console.log('PASS cache upgrade keeps four protected stores and serves versioned app and draft module.');
})().catch(e=>{console.error(e);process.exit(1)});
