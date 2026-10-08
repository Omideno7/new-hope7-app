/** Synthetic, read-only security matrix. No network/Production requests. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {libraryCatalog} from '../supabase/functions/nh7-content-access/library-catalog.mjs';
const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
const pub={id:'public',audience:'public',reader_available:true,title_en:'Public fixture',title_fa:'عمومی',title_hr:'Javno'};
const minister={id:'minister-scoped',audience:'ministers',reader_available:true,title_en:'Restricted synthetic fixture'};
const other={id:'minister-other',audience:'ministers',title_en:'Other synthetic fixture'};
const grantRows=token=>token==='minister'?[pub,minister]:token==='admin'?[pub,minister,other]:[pub];
let edgeCalls=[];
const edgeFetch=async(url,init)=>{
  edgeCalls.push({url,init});const token=init.headers.Authorization.replace('Bearer ','');
  if(url.endsWith('/auth/v1/user'))return Response.json(token==='anonymous'?{}:{id:'uid-'+token,email:'synthetic@example.invalid'},{status:token==='anonymous'?401:200});
  assert(url.endsWith('/rpc/nh7_library_catalog_v396'));assert.equal(init.cache,'no-store');
  return Response.json({items:grantRows(token),collections:[]});
};
for(const who of ['anonymous','normal','school','minister','revoked','admin']){
  const request=new Request('https://local.invalid',{headers:{Authorization:'Bearer '+who}});
  const result=await libraryCatalog(request,{query:'',user_email:'admin@example.invalid',role:'admin'},{supabaseUrl:'https://fixture.invalid',publishableKey:'synthetic-public-key',fetcher:edgeFetch});
  const data=await result.json();assert.equal(result.status,who==='anonymous'?401:200);
  assert.deepEqual(data.items||[],who==='anonymous'?[]:grantRows(who));
  assert.match(result.headers.get('cache-control'),/no-store/);
}
const filtered=await libraryCatalog(new Request('https://local.invalid',{headers:{Authorization:'Bearer school'}}),{query:'audience=eq.ministers'},{supabaseUrl:'https://fixture.invalid',publishableKey:'fixture',fetcher:edgeFetch});
assert.deepEqual((await filtered.json()).items,[]);
const failure=await libraryCatalog(new Request('https://local.invalid',{headers:{Authorization:'Bearer minister'}}),{},{supabaseUrl:'https://fixture.invalid',publishableKey:'fixture',fetcher:async()=>{throw new Error('timeout')}});
assert.equal(failure.status,503);
console.log('PASS Edge adapter: six principals, scoped grants, forged identity/role ignored, no service role, denial/timeout fail closed.');
function storage(){const value={};for(const [name,fn] of Object.entries({getItem:k=>Object.hasOwn(value,k)?value[k]:null,setItem:(k,v)=>{value[k]=String(v)},removeItem:k=>{delete value[k]}}))Object.defineProperty(value,name,{value:fn});Object.defineProperty(value,'length',{get:()=>Object.keys(value).length});Object.defineProperty(value,'key',{value:i=>Object.keys(value)[i]});return value}
class CustomEvent extends Event{constructor(type,options={}){super(type);this.detail=options.detail}}
const localStorage=storage(),sessionStorage=storage(),window=new EventTarget(),document=new EventTarget();
let phase='minister',networkStatus=200,pending=null,clock=Date.now();const intervals=[];
Object.assign(window,{URL});document.hidden=false;
const context={window,document,localStorage,sessionStorage,location:{href:'https://app.invalid/'},navigator:{onLine:true},CustomEvent,Event,URL,Headers,Request,Response,AbortController,console,Date:class extends Date{static now(){return clock}},setTimeout,clearTimeout,setInterval:fn=>{intervals.push(fn);return intervals.length}};
const setUser=(who)=>{localStorage.setItem('nh7_user_session_v170',JSON.stringify({access_token:who,user:{id:'uid-'+who,email:'same@example.invalid'}}));localStorage.removeItem('nh7_explicit_logout')};
window.fetch=async(url,init)=>{if(url.endsWith('/functions/v1/nh7-library-access'))return Response.json({signed_url:'https://gpzcwffxnddhaeaogdyo.supabase.co/storage/v1/object/sign/nh7-library/'+JSON.parse(init.body).item_id+'.pdf?token=fixture'});assert.equal(init.cache,'no-store');assert(url.endsWith('/rpc/nh7_library_catalog_v396'));const token=init.headers.Authorization.replace('Bearer ','');if(pending)return pending;return Response.json({items:phase==='revoked'?[pub]:grantRows(token),collections:[{id:'pub-collection',audience:'public'},{id:'minister-collection',audience:'ministers'}].filter(x=>x.audience==='public'||['minister','admin'].includes(token)&&phase!=='revoked')},{status:networkStatus})};
setUser('minister');sessionStorage.setItem('nh7_library_catalog_cache_v1',JSON.stringify({items:[minister]}));localStorage.setItem('nh7_library_collections_cache_v327_old',JSON.stringify({items:[minister]}));localStorage.setItem('nh7_protected_catalog_v327_old',JSON.stringify({resource:'library',items:[minister]}));localStorage.setItem('nh7_protected_catalog_v327_audio',JSON.stringify({resource:'sermons',items:[{id:'audio-preserve'}]}));localStorage.setItem('nh7_account_notes','preserve');
vm.createContext(context);vm.runInContext(read('js/nh7-library-security-v125.js'),context);
const api=window.NH7LibrarySecurityV125;
assert.equal(sessionStorage.getItem('nh7_library_catalog_cache_v1'),null);assert.equal(localStorage.getItem('nh7_protected_catalog_v327_old'),null);
let value=await api.catalog();assert.equal(value.items.length,2);assert(!JSON.stringify(sessionStorage).includes(minister.title_en));assert(!JSON.stringify(sessionStorage).includes('minister-collection'));
phase='revoked';value=await api.catalog();assert.deepEqual(value.items,[pub]);
phase='minister';networkStatus=403;value=await api.catalog();assert.equal(value.items.length,0);
networkStatus=200;value=await api.catalog();assert.equal(value.items.length,2);
context.navigator.onLine=false;window.dispatchEvent(new Event('offline'));value=await api.catalog();assert.equal(value.items.length,1);assert.equal(value.items[0].audience,'public');
setUser('normal');value=await api.catalog();assert.equal(value.items.length,0,'Another UID must not recover previous public snapshot');
context.navigator.onLine=true;value=await api.catalog();assert.equal(value.items.length,1);
setUser('minister');value=await api.catalog();localStorage.setItem('nh7_explicit_logout','1');window.dispatchEvent(new Event('nh7-library-auth-change'));value=await api.catalog();assert.equal(value.items.length,0);
setUser('minister');let resolve;pending=new Promise(r=>resolve=r);const loading=api.catalog();setUser('normal');api.sync();resolve(Response.json({items:[minister]}));value=await loading;assert.equal(value.items.length,0);pending=null;
setUser('minister');value=await api.catalog();let expired=false;window.addEventListener('nh7-library-security',e=>{if(e.detail.reason==='expired'){expired=true;assert.equal(e.detail.bundle.items.length,0)}});clock+=36000;intervals[0]();assert(expired);
assert.equal(localStorage.getItem('nh7_account_notes'),'preserve');assert(localStorage.getItem('nh7_protected_catalog_v327_audio').includes('audio-preserve'));
for(const who of ['normal','school','revoked','admin']){setUser(who);value=await api.catalog();assert.equal(value.items.length,grantRows(who).length)}
setUser('minister');phase='minister';await api.catalog();
const file=id=>'https://gpzcwffxnddhaeaogdyo.supabase.co/storage/v1/object/sign/nh7-library/'+id+'.pdf?token=fixture';
for(const item of [pub,minister])await window.fetch('https://gpzcwffxnddhaeaogdyo.supabase.co/functions/v1/nh7-library-access',{method:'POST',body:JSON.stringify({item_id:item.id})});
assert(api.fileAllowed(file(pub.id)));assert(!api.fileAllowed(file(minister.id)));assert(!api.fileAllowed(file('unknown')));assert(!api.fileAllowed(file(minister.id).replace('/object/sign/','/object/')));
context.navigator.onLine=false;assert(api.fileAllowed(file(pub.id)),'Verified public file retains offline permission');assert(!api.fileAllowed(file(minister.id)));
context.navigator.onLine=true;phase='revoked';await api.catalog();assert(api.fileAllowed(file(pub.id)));assert(!api.fileAllowed(file(minister.id)));
localStorage.setItem('nh7_explicit_logout','1');api.sync();assert(!api.fileAllowed(file(pub.id)));assert(!api.fileAllowed(file(minister.id)));setUser('minister');phase='minister';await api.catalog();
console.log('PASS Option B file identity: signed response + current UID/audience proof; public offline retained, Ministers/unknown/canonical bypass denied; revoke/logout safe.');
console.log('PASS actual client: UID binding, public-only snapshots, legacy purge, revoke, 403, offline, logout, identity race, freshness expiry; unrelated data preserved.');
// Run the shipped SW storedMedia function with a seeded lookup: Library must never consult it.
let cacheReads=0;const sw={URL,Request,Response,Headers,console,fetch:async()=>new Response('network'),self:{location:{origin:'https://app.invalid'},registration:{scope:'https://app.invalid/'},addEventListener(){},clients:{}},caches:{open:async()=>({match:async()=>{cacheReads++;return new Response('synthetic cached bytes')}})},indexedDB:{open(){throw new Error('no DB')}}};
vm.createContext(sw);vm.runInContext(read('sw-offline-v329.js'),sw);
const signed='https://gpzcwffxnddhaeaogdyo.supabase.co/storage/v1/object/sign/nh7-library/restricted.pdf?token=old';
assert.equal(await sw.storedMedia(signed),null);assert.equal(cacheReads,0);
assert(await sw.storedMedia(signed.replace('/nh7-library/','/church-audio/')));assert.equal(cacheReads,1);
// Execute the actual offline API; early Library guards must prevent any IDB/native/cache lookup.
const offlineWindow=new EventTarget();Object.assign(offlineWindow,{URL,Capacitor:{}});const offlineDoc=new EventTarget();Object.assign(offlineDoc,{documentElement:{lang:'en'},querySelectorAll:()=>[]});
const offline={...context,window:offlineWindow,document:offlineDoc,MutationObserver:class{observe(){}},requestAnimationFrame:()=>{},setTimeout:()=>0,setInterval:()=>0,localStorage:storage(),caches:{open:async()=>({keys:async()=>[]})}};
vm.createContext(offline);vm.runInContext(read('js/nh7-offline-persistence-v323.js'),offline);
assert.equal((await offlineWindow.NH7OfflineV325.status(signed)).cached,false);assert.equal(await offlineWindow.NH7OfflineV325.localPlayable(signed),'');await assert.rejects(offlineWindow.NH7OfflineV325.download(signed,'fixture'),/online verification/);
console.log('PASS actual worker/offline API: old Library bytes cannot be replayed; audio worker cache lookup preserved.');
// Execute the active language wrapper: unidentified legacy bodies stay quarantined, never replayed.
let removedReaderCache='',readerCalls=0;
window.fetch=async(url,init)=>{readerCalls++;assert(url.endsWith('nh7_library_reader_access_v321'));const body=JSON.parse(init.body);assert.deepEqual(body,{p_item_id:minister.id,p_code:'',p_device_id:'fixture-device',p_user_email:'fixture@example.invalid',p_language:'en'});assert.equal(init.cache,'no-store');return Response.json({allowed:false},{status:403})};
context.caches={delete:async name=>{removedReaderCache=name;return true},open:async()=>{throw new Error('Reader cache must not be opened')}};
window.caches=context.caches;context.document.documentElement={lang:'en'};
vm.runInContext(read('js/nh7-library-language-v321.js'),context);
assert.equal(removedReaderCache,'','Unidentified legacy text stays quarantined; fresh public caching requires online reopen');
const deniedReader=await window.fetch('https://gpzcwffxnddhaeaogdyo.supabase.co/rest/v1/rpc/nh7_library_reader_access_v250',{method:'POST',body:JSON.stringify({p_item_id:minister.id,p_code:'',p_device_id:'fixture-device',p_user_email:'fixture@example.invalid'})});
assert.equal(deniedReader.status,403);assert.equal(readerCalls,1);
context.navigator.onLine=false;
const offlineReader=await window.fetch('https://gpzcwffxnddhaeaogdyo.supabase.co/rest/v1/rpc/nh7_library_reader_access_v250',{method:'POST',body:JSON.stringify({p_item_id:minister.id,p_code:'',p_device_id:'fixture-device',p_user_email:'fixture@example.invalid'})});
assert.equal(offlineReader.status,403);assert.equal(readerCalls,1);
console.log('PASS active reader wrapper: unidentified legacy full-text cache quarantined; denial/offline never replay restricted text; verified v321 five-parameter/language wire contract retained (authorizes via v230/auth.uid, not v372 delegation).');
// The scope check prevents accidental changes to protected feature implementations.
const {execFileSync}=await import('node:child_process');
// Full local checkout can compare scope; shallow CI checkout may not have origin/main.
try{
 execFileSync('git',['rev-parse','--verify','origin/main'],{cwd:root,stdio:'ignore'});
 const changed=execFileSync('git',['diff','--name-only','origin/main'],{cwd:root}).toString().trim().split('\n');
 assert(!changed.some(path=>/^(js\/nh7-admin|js\/nh7-school|js\/nh7-audio|js\/nh7-media|js\/nh7-profile|supabase\/migrations)/.test(path)));
}catch(error){if(error.code==='ERR_ASSERTION')throw error;console.log('Scope diff unavailable in shallow checkout; local review scope check required.')}
const app=read('js/app.js');assert(app.includes("invokeEdgeFunction('nh7-library-access'"));assert(read('index.html').indexOf('nh7-library-security-v125.js')<read('index.html').indexOf('nh7-access-bootstrap-v230.js'));
console.log('PASS source scope and Library loader ordering.');
