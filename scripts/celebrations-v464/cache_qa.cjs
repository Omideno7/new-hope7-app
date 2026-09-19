const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),cp=require('child_process');
const BASE='2df1fabd295a0b2de2eaf1486e41c41242a4c52f';
const stores=new Map();
const caches={async keys(){return [...stores.keys()]},async delete(k){return stores.delete(k)},async open(k){if(!stores.has(k))stores.set(k,new Map());const store=stores.get(k);return{async put(r,v){store.set(r.url||String(r),v.clone())},async match(r){return store.get(r.url||String(r))?.clone()},async keys(){return [...store.keys()].map(x=>new Request(x))}}}};
const scope='https://qa.invalid/new-hope7-app/';let generation='old',requests=0;
function load(code){const listeners={};const self={registration:{scope},addEventListener(k,fn){(listeners[k]??=[]).push(fn)}};const context=vm.createContext({self,caches,Request,Response,URL,console,fetch:async url=>{requests++;return new Response(generation+':'+String(url),{status:200})}});vm.runInContext(code,context);return{listeners,context}}
async function lifecycle(worker,type){const tasks=[];for(const f of worker.listeners[type]||[])f({waitUntil(p){tasks.push(p)}});await Promise.all(tasks)}
(async()=>{
 const old=load(cp.execFileSync('git',['show',BASE+':sw-release-core-v403.js'],{encoding:'utf8'}));await lifecycle(old,'install');
 const keep=['nh7-offline-media-v4','nh7-audio-route-v423','nh7-personal-notes-fixture','nh7-data-stable-v329'];
 for(const k of keep)await(await caches.open(k)).put(new Request(scope+'__personal_sentinel'),new Response('KEEP '+k));
 generation='v464';const code=fs.readFileSync('sw-release-core-v403.js','utf8');assert(code.includes("'4.6.4-celebrations'"));const next=load(code);await lifecycle(next,'install');
 assert((await caches.keys()).includes('nh7-release-core-v457-theme-gallery'),'old release retained until activation');
 await lifecycle(next,'activate');assert(!(await caches.keys()).includes('nh7-release-core-v457-theme-gallery'));
 assert((await caches.keys()).includes('nh7-release-core-v464-celebrations'));
 for(const k of keep)assert.equal(await(await(await caches.open(k)).match(new Request(scope+'__personal_sentinel'))).text(),'KEEP '+k);
 for(const path of ['js/nh7-celebrations-v464.js','css/nh7-celebrations-v464.css','css/nh7-growth-v463.css','js/app.js','js/nh7-school-path-v351.js','js/nh7-audio-classic-v400.js','js/nh7-audio-route-stability-v423.js']){
  let response,stopped=false;const before=requests;
  for(const f of next.listeners.fetch||[])f({request:new Request(scope+path+'?v=4.6.4'),respondWith(p){response=p},stopImmediatePropagation(){stopped=true}});
  assert(stopped,path);assert.equal(await(await response).text(),'v464:'+scope+path);assert.equal(requests,before,'offline cache hit: '+path);
 }
 const idx=fs.readFileSync('index.html','utf8');assert(idx.includes('service-worker.js?v=4.6.4'));assert(idx.includes('js/app.js?v=4.6.4'));assert(idx.includes('js/nh7-celebrations-v464.js?v=4.6.4'));assert(!idx.includes('pvBirthday'));
 assert(fs.readFileSync('service-worker.js','utf8').includes('sw-release-core-v403.js?v=4.6.4'));
 fs.mkdirSync('qa-output',{recursive:true});fs.writeFileSync('qa-output/cache-report.json',JSON.stringify({passed:true,baseline:BASE,version:'4.6.4-celebrations',kept_caches:keep,offline_runtime_paths:8,simulated_asset_requests:requests,scope:'Actual release-core JavaScript in isolated cache environment; no network or native filesystem operations.'},null,2));console.log('PASS release upgrade: 4 sentinel caches preserved, 8 runtime cache routes verified.');
})().catch(e=>{console.error(e);process.exit(1)});
