// Local worker lifecycle test: no deployment, remote fetches or user-data writes.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{const stores=new Map(),listeners={},fetched=[];let online=true;
const cacheApi={async open(name){if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);return{async put(k,v){store.set(k.url||k,v)},async match(k){return store.get(k.url||k)?.clone()},async keys(){return [...store.keys()].map(k=>new Request(k))}}},async keys(){return [...stores.keys()]},async delete(k){return stores.delete(k)},async match(k){for(const name of stores.keys()){const v=await(await this.open(name)).match(k);if(v)return v}}};
const scope='https://fixture.invalid/app/';
for(const name of ['nh7-release-core-obsolete','nh7-downloads-user','nh7-reader-user','nh7-release-data-v403'])await cacheApi.open(name);
const context=vm.createContext({URL,Request,Response,Set,Promise,console,caches:cacheApi,fetch:async(req,opt)=>{if(!online)throw Error('offline');const url=req.url||req;fetched.push({url,opt});return new Response(String(url).endsWith('index.html')?'CURRENT SHELL':'CURRENT ASSET')},self:{registration:{scope},location:{origin:'https://fixture.invalid'},addEventListener(type,fn){(listeners[type]??=[]).push(fn)}}});
for(const file of ['sw-navigation-fresh-v403.js','sw-release-core-v403.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
for(const type of ['install','activate'])for(const fn of listeners[type]){let work;fn({waitUntil(p){work=p}});await work}
assert.ok(!stores.has('nh7-release-core-obsolete'));for(const name of ['nh7-downloads-user','nh7-reader-user','nh7-release-data-v403'])assert.ok(stores.has(name),'preserve '+name);
async function request(url,mode){let work,stopped=false;for(const fn of listeners.fetch){fn({request:{method:'GET',mode,url},respondWith(p){work=p},stopImmediatePropagation(){stopped=true}});if(stopped)break}return(await work).text()}
assert.equal(await request(scope+'index.html','navigate'),'CURRENT SHELL');online=false;assert.equal(await request(scope+'index.html','navigate'),'CURRENT SHELL');assert.equal(await request(scope+'js/app.js','cors'),'CURRENT ASSET');assert.ok(fetched.every(x=>x.opt?.cache==='no-store'));
console.log('PASS worker install refreshes assets, activation drops obsolete executable cache only, navigation is network-first, current shell/runtime work offline; reader/download/data caches preserved');
})().catch(e=>{console.error(e);process.exitCode=1});
