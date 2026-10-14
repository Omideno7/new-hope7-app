/* Current binding and reviewed executable pipeline; no live network/provider. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../js/nh7-notification-contract-wave4.js');
const ids=['12345678-1234-4234-8234-123456789abc','22345678-1234-4234-8234-123456789abc','32345678-1234-4234-8234-123456789abc','42345678-1234-4234-8234-123456789abc','52345678-1234-4234-8234-123456789abc'];
const evidence={binding:[],campaigns:[],events:[],network:'No live requests: injected Store/provider and fake Web/native SDK only'};
const tick=()=>new Promise(setImmediate);
function environment(native=false){
 const window=new EventTarget(),document=new EventTarget(),values=new Map(),calls=[],published=[];let external='',gate=null;
 class CE extends Event{constructor(type,options={}){super(type);this.detail=options.detail}}
 const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
 Object.assign(document,{documentElement:{lang:'en'},getElementById:()=>null,hidden:false});
 const O={login:async id=>{calls.push(['login',id]);if(gate)await gate.promise;external=id},logout:async()=>{calls.push(['logout']);external=''},User:{getExternalId:()=>external,setLanguage:async l=>calls.push(['language',l]),addTags:async tags=>calls.push(['tags',tags]),removeTag:async tag=>calls.push(['removeTag',tag]),PushSubscription:{id:ids[4],optedIn:true,addEventListener:()=>{}}},Notifications:{permission:true,addEventListener:()=>{}}};
 if(native){O.User.pushSubscription={getIdAsync:()=>ids[4],getOptedInAsync:()=>true,addEventListener:()=>{}};delete O.User.PushSubscription;window.plugins={OneSignal:O}}
 window.OneSignalDeferred=[];window.addEventListener('nh7-push-state-wave4',()=>published.push(window.NH7_PUSH_ACCOUNT_STATE?.userId));window.NH7NotificationContractWave4=C;
 const context=vm.createContext({window,document,localStorage:storage,navigator:{onLine:true},Intl,Date,atob,console,Event,CustomEvent:CE,AbortController,setTimeout,clearTimeout,setInterval:()=>{throw Error('No notification polling allowed')},queueMicrotask,fetch:()=>{throw Error('Backend gated; no request expected')}});
 vm.runInContext(fs.readFileSync('js/nh7-push-account-bind-v364.js','utf8'),context);
 function sign(id,language='fa'){storage.setItem('nh7_lang',language);storage.removeItem('nh7_explicit_logout');storage.setItem('nh7_user_session_v170',JSON.stringify({access_token:'e30.'+Buffer.from(JSON.stringify({sub:id,exp:4102444800})).toString('base64url')+'.fixture',user:{id}}));window.dispatchEvent(new Event('nh7-personal-owner-wave2'))}
 return {window,document,storage,calls,O,published,sign,attach:()=>window.OneSignalDeferred.forEach(fn=>fn(O)),hold:()=>{let resolve;gate={promise:new Promise(r=>resolve=r)};return ()=>{gate=null;resolve()}},external:()=>external};
}
async function settle(){for(let i=0;i<30;i++)await tick()}
async function binding(native){const e=environment(native);e.storage.setItem('nh7_sermon_notes_fixture','Existing note');e.sign(ids[0]);e.attach();await settle();assert.equal(e.external(),ids[0]);assert.equal(e.window.NH7_PUSH_ACCOUNT_STATE.subscriptionId,ids[4]);
 const stableStart=e.calls.length;for(let n=0;n<20;n++)e.window.dispatchEvent(new Event('pageshow'));await settle();assert.equal(e.calls.filter(c=>c[0]==='login').length,1);assert.equal(e.calls.filter(c=>c[0]==='language').length,1,'stable binding does not rewrite language');const stableCalls=e.calls.length-stableStart;
 const refreshed=JSON.parse(e.storage.getItem('nh7_user_session_v170'));refreshed.access_token+='-refreshed';e.storage.setItem('nh7_user_session_v170',JSON.stringify(refreshed));e.window.dispatchEvent(new Event('pageshow'));await settle();assert.equal(e.calls.filter(c=>c[0]==='login').length,1,'Same-UID token refresh does not recreate a subscription');
 const switchStart=e.calls.length;e.sign(ids[1],'en');await settle();const switchCalls=e.calls.slice(switchStart);e.sign(ids[2],'hr');await settle();assert.equal(e.external(),ids[2]);assert.equal(e.calls.filter(c=>c[0]==='language').at(-1)[1],'hr');
 evidence.binding.push({sdk:native?'native':'web',stable_lifecycle_events:20,stable_sdk_operations:stableCalls,stable_backend_requests:0,account_switch_sdk_operations:switchCalls.map(c=>c[0]),account_switch_backend_requests:0,backend_enabled:false});
 const release=e.hold();e.sign(ids[0]);await settle();e.sign(ids[1],'en');release();await settle();assert.equal(e.external(),ids[1]);assert.equal(e.window.NH7_PUSH_ACCOUNT_STATE.userId,ids[1]);assert.equal(e.calls.filter(c=>c[0]==='tags').at(-1)[1].language,'en');assert.ok(e.window.NH7PushBindingWave4.metrics().stale>0);
 e.storage.setItem('nh7_explicit_logout','1');e.window.dispatchEvent(new Event('nh7-personal-owner-wave2'));await settle();assert.equal(e.external(),'');assert.equal(e.window.NH7_PUSH_ACCOUNT_STATE.bound,false);assert.equal(e.storage.getItem('nh7_sermon_notes_fixture'),'Existing note');
 e.storage.removeItem('nh7_explicit_logout');e.storage.setItem('nh7_user_session_v170',JSON.stringify({user:{id:ids[0]}}));e.window.dispatchEvent(new Event('pageshow'));await settle();assert.equal(e.external(),'','UID without JWT must not bind');
 e.storage.setItem('nh7_user_session_v170',JSON.stringify({access_token:'e30.'+Buffer.from(JSON.stringify({sub:ids[0],exp:1})).toString('base64url')+'.fixture',user:{id:ids[0]}}));e.window.dispatchEvent(new Event('pageshow'));await settle();assert.equal(e.external(),'','Expired JWT cannot rebind');
 console.log('PASS',native?'Native getters':'Web','FA/EN/HR, stable binding, A→B delayed login repair, logout, unverified identity, preserved notes');
}
function storeFixture(){
 const accounts=ids.slice(0,3).map((user_id,n)=>({user_id,email:['fa','en','hr'][n]+'@example.invalid',language:['fa','en','hr'][n],subscriptions:[ids[n+1]],active:true,approved:true,is_admin:false}));
 const access=new Map([[ids[3],{is_admin:true,is_owner:true,permissions:[]}]]),previews=new Map(),ledger=new Map(),inbox=new Map(),pushes=[];let unknown=false;
 const store={accounts:async()=>structuredClone(accounts),access:async id=>access.get(id)||{is_admin:false,is_owner:false,permissions:[]},savePreview:async(id,actor,request,recipients)=>{previews.set(id,{actor,request,recipients});return{version:4,request_id:id,preview_token:ids[4],recipients}},preview:async(id,actor,token)=>{const p=previews.get(id);return p?.actor===actor&&token===ids[4]?p:null},claim:async(key,payload)=>{if(ledger.has(key))return false;ledger.set(key,{state:'unknown',payload});return true},status:async key=>ledger.get(key)?.state,authorize:async(uid,type,subscription,language)=>accounts.some(a=>a.user_id===uid&&a.active&&C.language(a.language)===language&&(type==='campaign'?a.approved&&!a.is_admin&&!access.get(uid)?.is_admin:C.permitted(type,access.get(uid)))&&(subscription==='account'||a.subscriptions.includes(subscription))),finish:async(key,state,response)=>ledger.set(key,{...ledger.get(key),state,response}),inbox:async(key,row)=>inbox.set(key,row),provider:async payload=>{pushes.push(payload);if(unknown)throw Error('timeout after acceptance');return{id:ids[4],recipients:1}},campaign:async()=>{},event:async()=>({exists:true,revision:1})};
 return{accounts,access,previews,ledger,inbox,pushes,store,setUnknown:()=>unknown=true};
}
(async()=>{await binding(false);await binding(true);const P=await import('../supabase/review/wave4-notifications-2/pipeline.ts');
 for(const route of ['javascript:alert(1)','https://evil.invalid','unknown'])assert.equal(C.intent({version:4,route,params:{}}),null);
 assert.equal(C.intent({version:4,route:'admin',params:{section:'prayer',id:'not-uuid'}}),null);assert.equal(C.intent({version:4,route:'plans',params:{tab:'spiritual',plan:'prayer-30',day:2,start:1}}),null);
 assert.equal(C.permitted('prayer',{is_admin:true,permissions:['registrations.view']}),false);assert.equal(C.permitted('registration',{is_admin:true,permissions:['registrations.view']}),true);
 let campaignExecutions=0;
 for(const mode of ['all','segment-fa','segment-en','segment-hr','single'])for(const channels of [['push'],['inbox'],['push','inbox']]){
  const f=storeFixture(),request={request_id:ids[4],mode:mode.startsWith('segment')?'segment':mode,segment:mode.split('-')[1],channels,target_route:'home',recipients:[{user_id:ids[0],email:'spoof@evil.invalid',language:'hr'}]};for(const l of ['fa','en','hr']){request['title_'+l]=l+' title';request['body_'+l]=l+' body'}
  await assert.rejects(()=>P.preview(ids[2],request,f.store),/admin_required/);await P.preview(ids[3],request,f.store);await Promise.all([P.execute(ids[3],ids[4],ids[4],f.store),P.execute(ids[3],ids[4],ids[4],f.store)]);campaignExecutions++;
  const count=mode==='all'?3:1;assert.equal(f.pushes.length,channels.includes('push')?count:0);assert.equal(f.inbox.size,channels.includes('inbox')?count:0);
  evidence.campaigns.push({mode,channels,concurrent_execute_calls:2,provider_calls:f.pushes.length,inbox_rows:f.inbox.size,logical_claims:f.ledger.size});
  for(const row of f.inbox.values()){assert.equal(row.body,row.language+' body');assert.ok(row.user_email.endsWith('@example.invalid'))}
  for(const p of f.pushes){const a=f.accounts.find(a=>a.user_id===p.user_id);assert.equal(p.contents[a.language],a.language+' body');assert.equal(p.include_subscription_ids.length,1);assert.ok(C.uuid(p.idempotency_key))}
 }
 const f=storeFixture();f.accounts[2].language='unknown';assert.equal(P.resolve(f.accounts,{mode:'all'})[2].language,'en');assert.equal(P.resolve(f.accounts,{mode:'all'})[2].language_fallback,true);
 for(const type of ['registration','prayer','qa','assignment','testimony']){
  const e=storeFixture();e.accounts[0].is_admin=true;e.access.set(ids[0],{is_admin:true,is_owner:false,permissions:['registrations.view']});e.accounts.push({user_id:ids[3],email:'owner@example.invalid',language:'hr',subscriptions:[ids[4]],active:true,approved:false,is_admin:true});await P.adminEvent(type,ids[4],1,e.store);await P.adminEvent(type,ids[4],1,e.store);
  assert.equal(e.pushes.length,type==='registration'?2:1);assert.equal(e.inbox.size,type==='registration'?2:1);for(const p of e.pushes){assert.equal(p.contents[e.accounts.find(a=>a.user_id===p.user_id).language],C.eventCopy(type,e.accounts.find(a=>a.user_id===p.user_id).language).body);assert.ok(!JSON.stringify(p).includes('private'));assert.equal(p.data.nh7_intent.params.id,ids[4]);assert.equal(p.data.nh7_intent.params.section,type)}
  evidence.events.push({type,identical_trigger_calls:2,provider_calls:e.pushes.length,inbox_rows:e.inbox.size,logical_claims:e.ledger.size});
 }
 const u=storeFixture(),r={request_id:ids[4],mode:'single',channels:['push','inbox'],target_route:'home',recipients:[{user_id:ids[0]}],title_fa:'fa',body_fa:'fa'};await P.preview(ids[3],r,u.store);u.setUnknown();assert.equal((await P.execute(ids[3],ids[4],ids[4],u.store)).status,'unknown');assert.equal((await P.execute(ids[3],ids[4],ids[4],u.store)).status,'unknown');assert.equal(u.pushes.length,1,'Unknown provider outcome is never blindly resent');assert.equal(u.inbox.size,1);
 const change=storeFixture();await P.preview(ids[3],r,change.store);change.accounts[0].language='hr';await assert.rejects(()=>P.execute(ids[3],ids[4],ids[4],change.store),/audience_changed/);assert.equal(change.pushes.length,0);
 change.access.set(ids[3],{is_owner:false});await assert.rejects(()=>P.execute(ids[3],ids[4],ids[4],change.store),/admin_required/);
 const expired=storeFixture();await P.preview(ids[3],r,expired.store);expired.previews.get(ids[4]).expired=true;await assert.rejects(()=>P.execute(ids[3],ids[4],ids[4],expired.store),/fresh_preview_required/);assert.equal(expired.pushes.length,0);
 const multi=storeFixture();multi.accounts[0].subscriptions=[ids[1],ids[2],ids[1]];await P.preview(ids[3],r,multi.store);await P.execute(ids[3],ids[4],ids[4],multi.store);assert.equal(multi.pushes.length,2);assert.equal(multi.inbox.size,1,'Multiple devices share one account Inbox entry');
 const exclusions=storeFixture();exclusions.accounts[0].is_admin=true;exclusions.accounts[1].approved=false;assert.equal(P.resolve(exclusions.accounts,{mode:'all'}).length,1,'Server Admin and unapproved identities excluded from All');await assert.rejects(()=>P.preview(ids[3],{...r,recipients:[{user_id:ids[1]}]},exclusions.store),/recipient_unavailable/);
 const {handlers}=await import('../supabase/review/wave4-notifications-2/edge.ts');let gatewayCalls=0;
 const gateway=handlers({SUPABASE_URL:'https://fixture.invalid',SUPABASE_SERVICE_ROLE_KEY:'fixture-only',SUPABASE_ANON_KEY:'fixture-public',ONESIGNAL_APP_ID:ids[0],ONESIGNAL_IDENTITY_VERIFICATION_KEY:'fixture-only'},async url=>{gatewayCalls++;return new Response(JSON.stringify(String(url).includes('/auth/')?{id:ids[2]}:{is_owner:false}),{status:200})});
 assert.equal((await gateway.campaign(new Request('https://fixture.invalid',{method:'POST'}))).status,401);assert.equal(gatewayCalls,0);
 assert.equal((await gateway.campaign(new Request('https://fixture.invalid',{method:'POST',headers:{Authorization:'Bearer fixture'},body:'{}'}))).status,403);
 const count=gatewayCalls;assert.equal((await gateway.events(new Request('https://fixture.invalid',{method:'POST'}))).status,403);assert.equal(gatewayCalls,count,'Unauthorized worker cannot read event queue');
 const identityResponse=await gateway.binding(new Request('https://fixture.invalid',{method:'POST',headers:{Authorization:'Bearer fixture'},body:JSON.stringify({action:'identity',user_id:ids[0]})}));const token=await identityResponse.json();assert.equal(token.user_id,ids[2],'Identity JWT ignores submitted victim UID');assert.equal(JSON.parse(Buffer.from(token.identity_token.split('.')[1],'base64url')).identity.external_id,ids[2]);
 globalThis.Deno={env:{get:()=>''}};const scheduled=await import('../supabase/review/wave4-notifications-2/scheduled-sender.ts');
 const row={time_value:'02:30',days_of_week:[0]};assert.equal(scheduled.due(row,new Date('2026-10-25T00:30:00Z')),'2026-10-25');assert.equal(scheduled.due(row,new Date('2026-10-25T01:30:00Z')),'2026-10-25','Fall-back repeated hour has SAME Zagreb dedupe date');
 assert.equal(scheduled.due(row,new Date('2026-03-29T01:30:00Z')),null,'Spring-forward nonexistent local hour is not fabricated');
 assert.equal(scheduled.due({time_value:'19:55',days_of_week:[0]},new Date('2026-10-25T18:55:00Z')),'2026-10-25');assert.equal(scheduled.due(row,new Date('2026-10-26T01:30:00Z')),null,'Weekday filter retained');
 console.log('PASS real review Edge Auth/owner/worker gates, UID-signed identity token and current Zagreb DST/day-of-week schedule authority');
 console.log('PASS',campaignExecutions,'mode/channel combinations; selected spoof ignored, server language/fallback, five permission-safe events, concurrent idempotency, unknown outcome, revoked owner/changed audience, strict intent grammar');
 if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(evidence,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1});
