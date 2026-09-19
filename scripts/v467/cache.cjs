const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),cp=require('child_process');
const BASE='44dfd189832c4a6031562851765811f941e0efe4',scope='https://qa.invalid/new-hope7-app/';
const stores=new Map();let version='old',requests=0;
const caches={async keys(){return [...stores.keys()]},async delete(k){return stores.delete(k)},async open(k){if(!stores.has(k))stores.set(k,new Map());const s=stores.get(k);return{async put(k,v){s.set(k.url||String(k),v.clone())},async match(k){return s.get(k.url||String(k))?.clone()},async keys(){return [...s.keys()].map(x=>new Request(x))}}}};
function worker(code){const handlers={};vm.runInNewContext(code,{self:{registration:{scope},addEventListener(k,f){(handlers[k]??=[]).push(f)}},caches,Request,Response,URL,console,fetch:async u=>{requests++;return new Response(version+':'+String(u))}});return handlers}
async function event(w,type){const ps=[];for(const f of w[type]||[])f({waitUntil(p){ps.push(p)}});await Promise.all(ps)}
(async()=>{
 const old=worker(cp.execFileSync('git',['show',BASE+':sw-release-core-v403.js'],{encoding:'utf8'}));await event(old,'install');
 const protectedNames=['nh7-offline-media-v4','nh7-audio-route-v423','nh7-personal-notes-fixture','nh7-data-stable-v329'];
 for(const n of protectedNames)await(await caches.open(n)).put(new Request(scope+'sentinel'),new Response('KEEP '+n));
 version='v467';const next=worker(fs.readFileSync('sw-release-core-v403.js','utf8'));await event(next,'install');assert((await caches.keys()).includes('nh7-release-core-v466-school-guide'));await event(next,'activate');
 assert((await caches.keys()).includes('nh7-release-core-v467-school-audio'));
 for(const n of protectedNames)assert.equal(await(await(await caches.open(n)).match(new Request(scope+'sentinel'))).text(),'KEEP '+n);
 const paths=['js/app.js','js/nh7-session-v467.js','js/nh7-audio-classic-v400.js','js/nh7-audio-route-stability-v423.js','js/nh7-school-media-session-v262.js','js/nh7-school-path-v351.js','js/nh7-celebrations-v464.js','css/nh7-celebrations-v464.css','css/nh7-growth-v463.css'];
 for(const path of paths){let result,stop=false;const before=requests;for(const f of next.fetch||[])f({request:new Request(scope+path+'?v=4.6.7'),respondWith(p){result=p},stopImmediatePropagation(){stop=true}});assert(stop,path);assert.equal(await(await result).text(),'v467:'+scope+path);assert.equal(requests,before)}
 const idx=fs.readFileSync('index.html','utf8');assert(idx.indexOf('js/nh7-session-v467.js?')<idx.indexOf('js/nh7-security-core-v340.js?'));assert(idx.includes('js/app.js?v=4.6.7'));assert(idx.includes('service-worker.js?v=4.6.7'));
 for(const p of ['js/nh7-celebrations-v464.js','css/nh7-celebrations-v464.css','js/nh7-theme-studio-v453.js','js/nh7-security-core-v340.js','js/nh7-school-exam-v344.js','manifest.json','version.json'])assert.equal(fs.readFileSync(p,'utf8'),cp.execFileSync('git',['show',BASE+':'+p],{encoding:'utf8'}),p+' must be unchanged');
 fs.mkdirSync('qa-v467',{recursive:true});fs.writeFileSync('qa-v467/cache-report.json',JSON.stringify({passed:true,baseline:BASE,protected_cache_names:protectedNames,offline_paths:paths,scope:'Actual release-core JavaScript; isolated synthetic caches. No network or production data.'},null,2));console.log('PASS four protected cache stores, nine offline runtime paths and unchanged security/scoring/theme/calendar code.');
})().catch(e=>{console.error(e);process.exit(1)});
