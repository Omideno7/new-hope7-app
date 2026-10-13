/* Focused runtime contracts, using real source and local fixtures only. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const load=(e,file)=>vm.runInContext(fs.readFileSync(file,'utf8'),e.ctx,{filename:file});
const tick=()=>new Promise(setImmediate);
function storage(){const s={};Object.defineProperties(s,{getItem:{value:k=>s[k]??null},setItem:{value:(k,v)=>{s[k]=String(v)}},removeItem:{value:k=>{delete s[k]}},key:{value:i=>Object.keys(s)[i]},length:{get:()=>Object.keys(s).length}});return s;}
function env(shared){
 const localStorage=shared||storage(),sessionStorage=storage(),window=new EventTarget(),document=new EventTarget(),timers=new Map();let now=1800000000000,serial=0;
 class Clock extends Date{constructor(...a){super(...(a.length?a:[now]))}static now(){return now}}
 class CE extends Event{constructor(type,init={}){super(type);this.detail=init.detail}}
 Object.assign(document,{hidden:false,documentElement:{lang:'en'},querySelector:()=>null,querySelectorAll:()=>[]});
 const calls=[];let responder=async()=>new Response(JSON.stringify({items:[{id:'public',audience:'public'}],collections:[]}));
 const fetch=(...a)=>{calls.push(a);return responder(...a)};
 Object.assign(window,{fetch});
 const ctx=vm.createContext({window,document,localStorage,sessionStorage,navigator:{onLine:true},location:{href:'http://localhost/'},URL,Headers,Request,Response,AbortController,Event,CustomEvent:CE,Date:Clock,console,crypto:globalThis.crypto,
  setTimeout:(fn,ms)=>{const id=++serial;timers.set(id,{fn,ms,at:now+ms});return id},clearTimeout:id=>timers.delete(id),setInterval:(fn,ms)=>{const id=++serial;timers.set(id,{fn,ms,at:now+ms,interval:true});return id},clearInterval:id=>timers.delete(id),fetch});
 return{ctx,window,document,localStorage,sessionStorage,calls,timers,response:fn=>{responder=fn},advance:ms=>{now+=ms;for(const [id,t] of [...timers])if(t.at<=now){timers.delete(id);t.fn()}},sign:(uid='one')=>localStorage.setItem('nh7_user_session_v170',JSON.stringify({access_token:'token-'+uid,user:{id:uid,email:uid+'@example.invalid'}}))};
}
async function library(){
 const e=env();e.sign();load(e,'js/nh7-performance-wave1.js');load(e,'js/nh7-library-security-v125.js');
 const api=e.window.NH7LibrarySecurityV125;
 await Promise.all(Array.from({length:20},()=>api.catalog()));assert.equal(e.calls.length,1);
 e.advance(40000);await api.catalog();assert.equal(e.calls.length,1,'35s must not defeat public 120s TTL');
 const reopened=env(e.localStorage);reopened.sign();load(reopened,'js/nh7-performance-wave1.js');load(reopened,'js/nh7-library-security-v125.js');await reopened.window.NH7LibrarySecurityV125.catalog();assert.equal(reopened.calls.length,0,'fresh public cache survives restart');
 const staleSnapshot=JSON.parse(e.localStorage.getItem('nh7_library_public_v125_one'));staleSnapshot.cache_version='previous-app';e.localStorage.setItem('nh7_library_public_v125_one',JSON.stringify(staleSnapshot));
 const updated=env(e.localStorage);updated.sign();load(updated,'js/nh7-performance-wave1.js');load(updated,'js/nh7-library-security-v125.js');await updated.window.NH7LibrarySecurityV125.catalog();assert.equal(updated.calls.length,1,'app/cache version mismatch must refresh online');
 e.advance(81000);await api.catalog();assert.equal(e.calls.length,2);
 await api.catalog(true);assert.equal(e.calls.length,3,'force refresh must reach server');
 e.ctx.navigator.onLine=false;await api.catalog();assert.equal(e.calls.length,3);assert.equal(api.publicItem('public').audience,'public');
 e.ctx.navigator.onLine=true;e.response(async()=>new Response(JSON.stringify({items:[{id:'minister',audience:'ministers'}],collections:[]})));
 await api.catalog(true);await api.catalog();assert.equal(e.calls.length,5,'restricted rows never use public TTL');
 assert(!e.localStorage.getItem('nh7_library_public_v125_one').includes('minister'));
 e.advance(35001);assert.equal(api.publicItem('minister'),null);
 e.response(async()=>new Response('{}',{status:403}));await api.catalog();assert.equal(e.localStorage.getItem('nh7_library_public_v125_one'),null);
 const held=[];e.response(()=>new Promise(r=>held.push(r)));const old=api.catalog(true);await tick();e.sign('two');const newer=api.catalog();await tick();held[1](new Response(JSON.stringify({items:[{id:'new-public',audience:'public'}],collections:[]})));await newer;
 held[0](new Response(JSON.stringify({items:[{id:'old-private',audience:'ministers'}],collections:[]})));assert.equal((await old).items.length,0);
 assert.equal(api.publicItem('new-public').id,'new-public');assert(!e.localStorage.getItem('nh7_library_public_v125_two').includes('old-private'));
 assert.equal(api.uid(),'two');
 console.log('PASS Library public TTL/restart/offline/force, restricted freshness/expiry/denial and UID switch');
}
async function sharing(){
 const e=env();e.sign();let release;e.response(()=>new Promise(r=>release=r));load(e,'js/nh7-performance-wave1.js');
 const url='https://gpzcwffxnddhaeaogdyo.supabase.co/auth/v1/user',options={headers:{Authorization:'Bearer one'}};
 const a=e.window.fetch(url,options),b=e.window.fetch(url,options);await tick();assert.equal(e.calls.length,1);release(new Response('{"id":"one"}'));assert.deepEqual(await (await a).json(),await (await b).json());
 e.response(async()=>new Response('{}'));await e.window.fetch(url,options);assert.equal(e.calls.length,2,'no completed auth response cache');
 await Promise.all([e.window.fetch(url,options),e.window.fetch(url,{headers:{Authorization:'Bearer two'}})]);assert.equal(e.calls.length,4,'different JWTs must not share');
 await Promise.all([e.window.fetch(url,{...options,signal:new AbortController().signal}),e.window.fetch(url,options)]);assert.equal(e.calls.length,6,'abortable caller stays independent');
 const writes='https://gpzcwffxnddhaeaogdyo.supabase.co/rest/v1/user_notes';await Promise.all([e.window.fetch(writes,{method:'POST',body:'{}'}),e.window.fetch(writes,{method:'POST',body:'{}'})]);assert.equal(e.calls.length,8,'writes must never coalesce');
 let count=0;const stop=e.window.NH7PerformanceWave1.visibleLoop(()=>count++,1000);assert(e.timers.size);e.document.hidden=true;e.document.dispatchEvent(new Event('visibilitychange'));assert.equal(e.timers.size,0);e.document.hidden=false;e.document.dispatchEvent(new Event('visibilitychange'));assert.equal(count,1);stop();assert.equal(e.timers.size,0);
 console.log('PASS in-flight read sharing, JWT/abort/write isolation, no auth TTL cache and background timer removal');
}
async function access(){
 const e=env();load(e,'js/nh7-access-bootstrap-v230.js');e.sign();e.response(async()=>new Response(JSON.stringify({authenticated:true,approved:true,user_email:'one@example.invalid'})));
 await Promise.all(Array.from({length:10},()=>e.window.NH7AccessV230.checkStatus(true)));assert.equal(e.calls.length,1);
 e.response(async()=>new Response('{}',{status:403}));assert.equal((await e.window.NH7AccessV230.checkStatus(true)).approved,false,'denial must replace stale approval');
 e.sign('two');assert.equal(e.window.NH7AccessV230.cachedStatus(true),null,'no cross-owner approval');
 console.log('PASS shared access check, denial invalidation and owner/token binding');
}
async function queue(){
 const e=env();let account='one@example.invalid',release,writes=[];
 e.ctx.authEmail=()=>account;e.ctx.cloudFetch=async(path,options)=>{writes.push({path,payload:JSON.parse(options.body||'{}')});if(writes.length===1)await new Promise(r=>release=r);};
 const source=fs.readFileSync('js/app.js','utf8');vm.runInContext(source.slice(source.indexOf('function enqueueCloud('),source.indexOf('function cloudStatusText(')),e.ctx);
 const op=text=>({type:'upsert',table:'nh7_account_notes',owner_email:account,conflict:'user_email,note_key',payload:{note_key:'note',content:text}});
 const first=e.ctx.saveCloud(op('first'));await tick();const second=e.ctx.saveCloud(op('second'));release();await Promise.all([first,second]);assert.deepEqual(writes.map(r=>r.payload.content),['first','second']);assert.equal(e.localStorage.getItem('nh7_cloud_queue'),'[]');
 e.localStorage.setItem('nh7_cloud_queue',JSON.stringify([{id:'other',...op('other'),owner_email:'two@example.invalid'},{id:'failed',...op('failed')}]));e.ctx.cloudFetch=async()=>{throw Error('offline fixture')};await e.ctx.syncCloudQueue();assert.equal(JSON.parse(e.localStorage.getItem('nh7_cloud_queue')).length,2);
 e.ctx.navigator.onLine=false;await e.ctx.saveCloud(op('offline'));assert.equal(JSON.parse(e.localStorage.getItem('nh7_cloud_queue')).length,3);
 e.ctx.navigator.onLine=true;account='two@example.invalid';e.ctx.cloudFetch=async()=>{};await e.ctx.syncCloudQueue();assert.deepEqual(JSON.parse(e.localStorage.getItem('nh7_cloud_queue')).map(x=>x.payload.content),['failed','offline']);
 e.localStorage.setItem('nh7_cloud_queue',JSON.stringify([op('legacy-one'),op('legacy-two')]));await e.ctx.syncCloudQueue();assert.equal(e.localStorage.getItem('nh7_cloud_queue'),'[]');
 console.log('PASS ordered queue drain, concurrent append, failed/offline/other-owner retention and legacy operations');
}
async function summaries(){
 const e=env();e.sign();load(e,'js/nh7-performance-wave1.js');const api=e.window.NH7PerformanceWave1;
 api.content('bible_chapter','JHN:3');api.content('bible_chapter','JHN:3');api.audio('session',{id:'sermon',duration_seconds:100},5);api.audio('session',{id:'sermon',duration_seconds:100},0,true);
 const rows=Object.values(api.summary());assert.equal(rows.find(x=>x.kind==='app').opens,1);assert.equal(rows.find(x=>x.kind.startsWith('audio')).seconds,5);assert(rows.find(x=>x.kind.startsWith('audio')).completed);assert.equal(e.calls.length,0);
 e.sign('two');api.audio('session',{id:'sermon'},5);assert.equal(Object.keys(api.summary()).length,0,'old audio session must not accrue to new owner');
 console.log('PASS bounded local daily/session analytics, completion, no network/raw-note capture, account isolation');
}
async function inbox(){
 const e=env();e.sign();Object.assign(e.document,{getElementById:()=>null,createElement:()=>({}),head:{appendChild:()=>{}}});e.ctx.MutationObserver=class{observe(){}};
 load(e,'js/nh7-performance-wave1.js');load(e,'js/nh7-inbox-badge-sync-v418.js');const api=e.window.NH7_INBOX_BADGE_SYNC;
 const held=[];e.response(()=>new Promise(resolve=>held.push(resolve)));const old=api.sync(true);await tick();e.sign('two');const newer=api.sync(true);await tick();
 held[1](new Response(JSON.stringify({messages:[{id:'new',title:'New owner',body:'',language:'en'}],receipts:[]})));await newer;
 held[0](new Response(JSON.stringify({messages:[{id:'old',title:'Old owner',body:'',language:'en'}],receipts:[]})));assert.equal((await old).stale,true);
 assert.deepEqual(JSON.parse(e.localStorage.getItem('nh7_inbox_messages')).map(x=>x.id),['new']);
 const count=e.calls.length;await api.sync(false);assert.equal(e.calls.length,count,'same owner/language reuses snapshot freshness');
 e.localStorage.setItem('nh7_lang','hr');e.response(async()=>new Response(JSON.stringify({messages:[],receipts:[]})));await api.sync(false);assert.equal(e.calls.length,count+1,'language change invalidates snapshot freshness');
 e.document.hidden=true;e.document.dispatchEvent(new Event('visibilitychange'));assert.equal([...e.timers.values()].filter(t=>t.interval).length,0);
 console.log('PASS Inbox old-owner response quarantine, owner/language freshness and background polling suspension');
}
async function registrationScope(){
 const e=env();e.sign();e.ctx.CLOUD_ENABLED=true;e.ctx.authSession=()=>JSON.parse(e.localStorage.getItem('nh7_user_session_v170'));e.ctx.authEmail=e.ctx.currentUserEmail=()=>e.ctx.authSession().user.email;e.ctx.deviceId=()=> 'fixture-device';e.ctx.cloudFetch=async()=>[];
 const source=fs.readFileSync('js/app.js','utf8'),start=source.indexOf('async function fetchLatestRegistration('),end=source.indexOf('function defaultMeetingSettings(',start);
 assert(end>start);vm.runInContext(source.slice(start,end),e.ctx);
 e.localStorage.setItem('nh7_school_access',JSON.stringify({email:'one@example.invalid',status:'approved',approvedBy:'admin'}));e.ctx.cloudRpc=async()=>[{found:true,status:'rejected',approved:false,payload:{email:'one@example.invalid'}}];
 assert.equal((await e.ctx.fetchLatestRegistration('school')).approvedBy,'','server denial must not inherit an old local admin-approved flag');
 const before=e.localStorage.getItem('nh7_school_access');let release;e.ctx.cloudRpc=()=>new Promise(r=>release=r);const pending=e.ctx.fetchLatestRegistration('school');await tick();e.sign('two');release([{found:true,status:'approved',payload:{email:'one@example.invalid'}}]);assert.equal(await pending,null);assert.equal(e.localStorage.getItem('nh7_school_access'),before,'old response cannot write after account switch');
 const cacheStart=source.indexOf('let nh7SchoolApprovalCacheV223='),cacheEnd=source.indexOf('function nh7RenderSchoolGateV223(',cacheStart);vm.runInContext(source.slice(cacheStart,cacheEnd),e.ctx);e.ctx.nh7WithTimeoutV470=p=>p;
 e.sign();e.localStorage.setItem('nh7_school_access',JSON.stringify({email:'one@example.invalid',status:'approved'}));e.ctx.fetchLatestRegistration=async()=>({status:'approved'});assert.equal(await e.ctx.nh7ApprovedSchoolAccessV223(),true);await tick();
 e.sign('two');e.ctx.fetchLatestRegistration=async()=>({status:'rejected'});assert.equal(await e.ctx.nh7ApprovedSchoolAccessV223(),false,'old owner UI approval cache/local row must not authorize the new owner');
 console.log('PASS registration read response fencing, explicit denial and identity-scoped School approval display cache; no progression changes');
}
module.exports={env,tick};
if(require.main===module)(async()=>{await sharing();await access();await queue();await summaries();await library();await inbox();await registrationScope()})().catch(e=>{console.error(e);process.exitCode=1});
