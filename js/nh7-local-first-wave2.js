/* Personal-state coordination only. No authorization, schema or native database changes. */
(()=>{'use strict';
if(window.NH7LocalFirstWave2)return;
const raw=window.localStorage,SESSION='nh7_user_session_v170',PREFIX='nh7_lf2_',OUT=PREFIX+'out_',BASE=PREFIX+'base_',CONFLICT=PREFIX+'conflict_',VIEW=PREFIX+'view_';
const parse=(text,fallback=null)=>{try{return JSON.parse(text)??fallback}catch(_){return fallback}};
const enc=value=>encodeURIComponent(String(value));
const clone=value=>JSON.parse(JSON.stringify(value));
const nonce=()=>crypto.randomUUID?.()||Date.now()+'_'+Math.random().toString(16).slice(2);
let device=raw.getItem('nh7_device_id');if(!device){device='dev_'+nonce();raw.setItem('nh7_device_id',device)}
function identity(){let s=raw.getItem('nh7_explicit_logout')==='1'?{}:parse(raw.getItem(SESSION),{});if(!s?.access_token)s={};return{owner:s?.user?.id?'uid:'+s.user.id:'device:'+device,uid:String(s?.user?.id||''),email:String(s?.user?.email||'').trim().toLowerCase(),token:String(s?.access_token||'')}}
const same=who=>identity().owner===who.owner;
const sessionOwner=value=>{const s=parse(value,{});return s?.access_token&&s?.user?.id?'uid:'+s.user.id:'device:'+device};
let observedOwner=identity().owner;
function notifyOwner(){cachedKeys=null;const next=identity().owner;if(next===observedOwner)return;observedOwner=next;window.dispatchEvent(new Event('nh7-personal-owner-wave2'))}
// Values remain in their existing formats. Historical raw keys are never deleted/migrated.
// The overlay is a personal-state view, not a security boundary against device inspection.
const personal=key=>/^(nh7_note_|nh7_sermon_note_|nh7_sermon_progress_|nh7_apo_note_v242:|nh7_apo_highlight_|nh7_book_position_|nh7_bible_state_|nh7_gratitude_note_|nh7_my_note_meta_v234_|nh7_plan_|nh7_daily_done_)/.test(key)||['nh7_bookmarks','nh7_gratitude_completed','nh7_gratitude_start','nh7_gamification','nh7_audio_favorites_v500','nh7_saved_verse_text_v251'].includes(key);
const legacyOwnerKey=PREFIX+'legacy_owner';
if(!raw.getItem(legacyOwnerKey))raw.setItem(legacyOwnerKey,identity().owner);
const viewKey=(key,owner=identity().owner)=>VIEW+enc(owner)+'_'+enc(key);
let cachedKeys=null;
function visibleKeys(){if(cachedKeys)return cachedKeys;const keys=new Set(),owner=identity().owner,prefix=VIEW+enc(owner)+'_';for(let i=0;i<raw.length;i++){const k=raw.key(i);if(k.startsWith(prefix)){const key=decodeURIComponent(k.slice(prefix.length));if(parse(raw.getItem(k),{}).value!==null)keys.add(key)}else if(!k.startsWith(PREFIX)&&(!personal(k)||raw.getItem(legacyOwnerKey)===owner)){if(!personal(k)||raw.getItem(viewKey(k))===null)keys.add(k)}}return cachedKeys=[...keys]}
const facade={
 getItem(key){key=String(key);if(!personal(key))return raw.getItem(key);const overlay=raw.getItem(viewKey(key));if(overlay!==null)return parse(overlay,{}).value??null;return raw.getItem(legacyOwnerKey)===identity().owner?raw.getItem(key):null},
 setItem(key,value){cachedKeys=null;key=String(key);if(!personal(key)){const before=identity().owner;if(key===SESSION&&sessionOwner(value)!==before)window.dispatchEvent(new Event('nh7-personal-before-owner-wave2'));raw.setItem(key,String(value));if(key===SESSION||key==='nh7_explicit_logout')notifyOwner();return}raw.setItem(viewKey(key),JSON.stringify({value:String(value),updatedAt:new Date().toISOString()}))},
 removeItem(key){cachedKeys=null;key=String(key);if(!personal(key)){if(key===SESSION&&identity().uid)window.dispatchEvent(new Event('nh7-personal-before-owner-wave2'));raw.removeItem(key);if(key===SESSION||key==='nh7_explicit_logout')notifyOwner();return}raw.setItem(viewKey(key),JSON.stringify({value:null,updatedAt:new Date().toISOString()}))},
 key(index){return visibleKeys()[index]??null},get length(){return visibleKeys().length},
 clear(){throw new Error('Personal data must not be cleared by the sync coordinator')}
};
const storage=new Proxy(facade,{get(target,key){if(key in target){const value=target[key];return typeof value==='function'?value.bind(target):value}return target.getItem(key)},set(target,key,value){target.setItem(key,value);return true},ownKeys:()=>visibleKeys(),getOwnPropertyDescriptor:()=>({enumerable:true,configurable:true})});
Object.defineProperty(window,'localStorage',{configurable:true,get:()=>storage});
const writer=nonce();
let transport=null,flight=null,timer=0,allowBackground=false,leaseId=null;
function ownsLease(){const lease=parse(raw.getItem(PREFIX+'lease'));return !leaseId||lease?.id===leaseId&&lease.expires>Date.now()}
const tables=new Set(['user_notes','nh7_account_notes','user_progress','nh7_account_progress','saved_verses','nh7_account_saved_verses','spiritual_plan_progress','fasting_journeys','fasting_daily_logs']);
function describe(op){
 if(op.sync_key)return op.sync_key;
 const p=op.payload;if(op.type==='edge'&&op.name==='nh7-content-access')return 'edge:'+op.payload.batch_id;
 if(op.type==='upsert'&&tables.has(op.table)&&p&&!Array.isArray(p))return op.table+':'+(op.table==='spiritual_plan_progress'?[p.plan_id,p.day_number].join(':'):op.table==='fasting_daily_logs'?[p.journey_id,p.log_date].join(':'):p.note_key||p.progress_key||p.ref||p.id||'');
 if(op.type==='delete'&&/^(user_notes|nh7_account_notes|saved_verses|nh7_account_saved_verses)\?/.test(op.path||''))return op.path;
 return '';
}
function records(){const rows=[];for(let i=0;i<raw.length;i++){const key=raw.key(i);if(!key.startsWith(OUT))continue;const op=parse(raw.getItem(key));if(op)rows.push({...op,storageKey:key})}return rows.sort((a,b)=>a.order-b.order||a.storageKey.localeCompare(b.storageKey))}
const noteOp=op=>['user_notes','nh7_account_notes'].includes(op.table)||/^(user_notes|nh7_account_notes)\?/.test(op.path||'');
function baselineKey(op){return BASE+enc(op.owner)+'_'+enc(describe(op))}
function conflict(op,remote,reason){const key=CONFLICT+enc(op.owner)+'_'+enc(describe(op));const old=parse(raw.getItem(key),{versions:[]});const version={local:clone(op.payload??op.path),remote:clone(remote??null),reason,at:new Date().toISOString()};if(!old.versions.some(v=>JSON.stringify(v.local)===JSON.stringify(version.local)&&JSON.stringify(v.remote)===JSON.stringify(version.remote)))old.versions.push(version);raw.setItem(key,JSON.stringify({...old,key:op.local_key||describe(op),owner:op.owner,versions:old.versions}));const current=op.storageKey?parse(raw.getItem(op.storageKey)):null;if(current?.revision===op.revision)raw.setItem(op.storageKey,JSON.stringify({...current,blocked:true}));if(same(op))window.dispatchEvent(new Event('nh7-sync-conflict-wave2'))}
function enqueue(operation){
 const who=identity(),op=clone(operation),key=describe(op);
 const supported=op.type==='upsert'&&tables.has(op.table)||op.type==='delete'&&/^(user_notes|nh7_account_notes|saved_verses|nh7_account_saved_verses)\?/.test(op.path||'')||op.type==='edge'&&op.name==='nh7-content-access'&&op.payload?.action==='save_bible_batch';
 if(!key||!supported)throw new Error('Unsupported local-first operation');
 if(op.owner_email&&op.owner_email.toLowerCase()!==who.email)throw new Error('session_changed');
 const payloads=Array.isArray(op.payload)?op.payload:[op.payload];if(payloads.some(p=>p?.user_id&&p.user_id!==who.uid||p?.user_email&&p.user_email.toLowerCase()!==who.email))throw new Error('session_changed');
 const storageKey=OUT+enc(who.owner)+'_'+enc(key),previous=parse(raw.getItem(storageKey));
 const order=previous?.order||Math.max(Date.now(),Number(raw.getItem(PREFIX+'order')||0)+1);raw.setItem(PREFIX+'order',String(order));
 const value={...op,...who,writer,revision:nonce(),order,attempts:previous?.attempts||0,nextAt:previous?.nextAt||0,blocked:false};
 // The caller's JWT is never persisted; retries capture the current same-owner JWT.
 delete value.token;raw.setItem(storageKey,JSON.stringify(value));
 const savedTable=op.table||String(op.path||'').split('?')[0];
 if(['saved_verses','nh7_account_saved_verses'].includes(savedTable)){
  const ref=op.payload?.ref||new URLSearchParams(String(op.path||'').split('?')[1]).get('ref')?.replace(/^eq\./,'');
  if(ref)raw.setItem(PREFIX+'ref_'+enc(who.owner)+'_'+enc(ref),JSON.stringify({removed:op.type==='delete',at:new Date().toISOString()}));
 }
 if(op.type==='edge')for(const item of op.payload.items||[])if(item.verse_ref)raw.setItem(PREFIX+'ref_'+enc(who.owner)+'_'+enc(item.verse_ref),JSON.stringify({removed:!item.saved,at:new Date().toISOString()}));
 if(previous&&previous.writer!==writer&&JSON.stringify(previous.payload??previous.path)!==JSON.stringify(value.payload??value.path))conflict({...value,storageKey},previous.payload??previous.path,'concurrent_local_writer');raw.setItem('nh7_cloud_status','queued');schedule();return Promise.resolve(true);
}
function pending(){return records().filter(op=>same(op))}
function schedule(delay=750){clearTimeout(timer);timer=0;if(!transport||!navigator.onLine||document.hidden&&!allowBackground)return;const rows=pending().filter(op=>!op.blocked);if(!rows.length)return;const next=Math.min(...rows.map(op=>op.nextAt||0));timer=setTimeout(()=>{timer=0;flush().catch(error=>console.warn('Personal sync deferred',error))},Math.max(delay,next-Date.now()))}
function selector(op){const p=op.payload;return Object.entries(p).filter(([k])=>op.conflict?.split(',').includes(k)).map(([k,v])=>enc(k)+'=eq.'+enc(v)).join('&')}
async function checkedWrite(op,who){
 const options={headers:{Prefer:'resolution=merge-duplicates,return=representation'}};
 // Replacement snapshots/notes use an observed baseline and conditional update.
 // Without a known baseline, different existing text/state is quarantined.
 if(['user_notes','nh7_account_notes','user_progress','nh7_account_progress','spiritual_plan_progress','fasting_journeys','fasting_daily_logs'].includes(op.table)&&op.type==='upsert'){
  const fields=noteOp(op)?['content']:op.table.includes('progress')&&!op.table.startsWith('spiritual')?['value']:op.table==='spiritual_plan_progress'?['status','reflection','completed_at']:op.table==='fasting_daily_logs'?['completed','prayer_minutes','scripture_note','reflection']:['purpose','status','start_date','end_date','completed_at','fasting_type'];
  const value=row=>JSON.stringify(fields.map(field=>row?.[field]??null)),select=selector(op),path=op.table+'?'+select;
  const base=parse(raw.getItem(baselineKey(op)));
  if(!base){
   // Atomic create-if-absent cannot overwrite a pre-existing remote copy.
   const inserted=await transport(op.table+'?on_conflict='+enc(op.conflict),{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:JSON.stringify(op.payload)},who);
   if(!same(who))throw Error('session_changed');
   if(Array.isArray(inserted)&&inserted.length===1&&value(inserted[0])===value(op.payload)){raw.setItem(baselineKey(op),JSON.stringify(inserted[0]));return true}
   if(['user_notes','user_progress'].includes(op.table)){conflict(op,null,'legacy_device_owner_unverified');return false}
  }
  const rows=await transport(path+'&select=*',{method:'GET'},who);if(!same(who))throw Error('session_changed');
  if(!Array.isArray(rows))throw Error('Unverified personal-state response');
  const remote=rows[0];
  if(remote&&value(remote)===value(op.payload)){raw.setItem(baselineKey(op),JSON.stringify(remote));return true}
  if(remote&&(!base||value(base)!==value(remote)||base.updated_at!==remote.updated_at)){
   conflict(op,['user_notes','user_progress'].includes(op.table)?null:remote,'remote_changed_or_baseline_unknown');return false;
  }
  if(remote){
   if(!remote.updated_at){conflict(op,remote,'missing_remote_version');return false}
   const timestamp=Date.parse(remote.updated_at);if(!Number.isFinite(timestamp)){conflict(op,remote,'invalid_remote_version');return false}
   const payload={...op.payload,updated_at:new Date(Math.max(Date.now(),timestamp+1)).toISOString()};
   const result=await transport(path+'&updated_at=eq.'+enc(remote.updated_at),{method:'PATCH',...options,body:JSON.stringify(payload)},who);
   if(!Array.isArray(result)||result.length!==1||result[0].updated_at===remote.updated_at||value(result[0])!==value(op.payload)){conflict(op,remote,'conditional_update_not_confirmed');return false}
   raw.setItem(baselineKey(op),JSON.stringify(result[0]));
  }else{
   const result=await transport(op.table+'?on_conflict='+enc(op.conflict),{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:JSON.stringify(op.payload)},who);
   if(!Array.isArray(result)||result.length!==1){conflict(op,null,'concurrent_insert_or_unverified_response');return false}
   raw.setItem(baselineKey(op),JSON.stringify(result[0]));
  }
  return true;
 }
 if(op.type==='edge'){
  const items=op.payload.items||[];
  if(!items.length||items.length>250)throw Error('Invalid verse batch');
  const filter='('+items.map(item=>JSON.stringify(String(item.verse_key||''))).join(',')+')';
  const rows=await transport('nh7_account_verse_marks_v230?select=*&user_id=eq.'+enc(who.uid)+'&verse_key=in.'+enc(filter),{method:'GET'},who);
  if(!same(who))throw Error('session_changed');if(!Array.isArray(rows))throw Error('Unverified verse response');
  const value=row=>JSON.stringify([row?.note||'',!!row?.saved,row?.highlight_color||'']);
  for(const item of items){
   const remote=rows.find(row=>row.verse_key===item.verse_key),base=parse(raw.getItem(baselineKey({...op,sync_key:'versemark:'+item.verse_key})));
   if(remote&&value(remote)!==value(item)&&(!base||value(base)!==value(remote))){conflict(op,remote,'verse_remote_changed');return false}
  }
  const acknowledged=await transport(op.name,{method:'POST',body:JSON.stringify(op.payload)},who,true);
  if(acknowledged?.ok!==true||Number(acknowledged.saved)!==items.length||acknowledged.batch_id!==op.payload.batch_id)throw Error('Unconfirmed verse batch');
  for(const item of items)raw.setItem(baselineKey({...op,sync_key:'versemark:'+item.verse_key}),JSON.stringify(item));return true;
 }
 if(op.type==='delete'){
  // Deletion intent is explicit; if text changed on another device, preserve it.
  if(noteOp(op)){
   if(op.path.startsWith('user_notes?')&&!raw.getItem(baselineKey(op))){conflict(op,null,'legacy_device_delete_owner_unverified');return false}
   const rows=await transport(op.path+'&select=*',{method:'GET'},who);if(!same(who))throw Error('session_changed');
   if(!Array.isArray(rows))throw Error('Unverified note deletion response');const base=parse(raw.getItem(baselineKey(op))),remote=rows[0];
   if(remote&&(base?base.content!==remote.content||base.updated_at!==remote.updated_at:op.expected_content!==remote.content)){conflict(op,op.path.startsWith('user_notes?')?null:remote,'delete_conflict');return false}
   const version=remote?'&updated_at=eq.'+enc(remote.updated_at):'';
   const result=await transport(op.path+version,{method:'DELETE',headers:{Prefer:'return=representation'}},who);
   if(remote&&(!Array.isArray(result)||result.length!==1)){conflict(op,remote,'conditional_delete_not_confirmed');return false}
  }else await transport(op.path,{method:'DELETE'},who);
  return true;
 }
 if(!same(who))throw Error('session_changed');
 await transport(op.table+'?on_conflict='+enc(op.conflict||'device_id'),{method:'POST',...options,body:JSON.stringify(op.payload)},who);return true;
}
async function drain(){
 const who=identity(),attempted=new Set();
 while(navigator.onLine&&same(who)&&ownsLease()&&(!document.hidden||allowBackground)){
  const op=pending().find(row=>!row.blocked&&!attempted.has(row.storageKey)&&(!row.nextAt||row.nextAt<=Date.now()));if(!op)break;
  attempted.add(op.storageKey);const currentWho=identity();
  try{
   const ok=await checkedWrite(op,currentWho);
   const latest=parse(raw.getItem(op.storageKey));
   if(ok&&latest?.revision===op.revision)raw.removeItem(op.storageKey);
  }catch(error){
   const latest=parse(raw.getItem(op.storageKey));
   if(latest?.revision===op.revision){const attempts=op.attempts+1;raw.setItem(op.storageKey,JSON.stringify({...latest,attempts,nextAt:Date.now()+Math.min(300000,2000*2**Math.min(attempts-1,8))}))}
   // Stop after a transport failure: no rapid per-record outage retry storm.
   break;
  }
 }
 raw.setItem('nh7_cloud_status',pending().length?'queued':'synced');
}
async function lockedDrain(){
 if(navigator.locks?.request)return navigator.locks.request('nh7-personal-sync-wave2',{ifAvailable:true},lock=>lock?drain():undefined);
 // WebKit fallback: renewable short lease, checked before each transport by configure.
 const key=PREFIX+'lease',old=parse(raw.getItem(key));if(old&&old.expires>Date.now())return;
 const id=nonce();raw.setItem(key,JSON.stringify({id,expires:Date.now()+30000}));await new Promise(resolve=>setTimeout(resolve,20));
 if(parse(raw.getItem(key))?.id!==id)return;leaseId=id;
 const renew=setInterval(()=>{if(parse(raw.getItem(key))?.id===id)raw.setItem(key,JSON.stringify({id,expires:Date.now()+30000}))},5000);
 try{await drain()}finally{leaseId=null;clearInterval(renew);if(parse(raw.getItem(key))?.id===id)raw.removeItem(key)}
}
function flush(background=false){if(background)allowBackground=true;if(!transport||!navigator.onLine)return Promise.resolve();if(flight)return flight;clearTimeout(timer);timer=0;allowBackground=background;flight=lockedDrain().finally(()=>{flight=null;allowBackground=false;schedule()});return flight}
function configure(send){importLegacyMain();transport=(path,options,who,edge)=>{if(!same(who)||!ownsLease())throw Error('session_or_lease_changed');return send(path,options,who,edge)};schedule()}
function observe(table,key,row){
 const op={type:'upsert',table,payload:row,...(table==='nh7_account_verse_marks_v230'?{sync_key:'versemark:'+row.verse_key}:{}),conflict:table.endsWith('notes')?'user_email,note_key':'user_email,progress_key',owner:identity().owner};
 if(!pending().some(p=>describe(p)===describe(op)))raw.setItem(baselineKey(op),JSON.stringify(row));
}
function preserveRemote(key,local,row){
 const editing=pending().find(op=>op.local_key===key),known=editing?parse(raw.getItem(baselineKey(editing))):null;
 if(known&&known.updated_at===row.updated_at&&JSON.stringify(known.content??known.value)===JSON.stringify(row.content??row.value))return;
 const remote=row.content??row.value;
 const value=typeof remote==='string'?remote:JSON.stringify(remote);
 if(local!==null&&local!==value||local===null&&value){
  const op={owner:identity().owner,sync_key:'restore:'+key,local_key:key,payload:{content:local},revision:'restore'};
  conflict(op,row,'local_and_remote_preserved');
 }
}
function recordConflict(key,local,remote){conflict({owner:identity().owner,sync_key:key,local_key:key,payload:local,revision:'restore'},remote,'local_and_remote_preserved')}
const reads=new Map();
function readOnce(key,work){const who=identity(),id=who.owner+'|'+who.token+'|'+key;if(reads.has(id))return reads.get(id);const promise=Promise.resolve().then(work).finally(()=>{if(reads.get(id)===promise)reads.delete(id)});reads.set(id,promise);return promise}
function syncRef(ref,remove=false){
 const who=identity();if(!who.uid||!who.token)return Promise.resolve(false);
 return enqueue(remove?{type:'delete',sync_key:'nh7_account_saved_verses:'+ref,owner_email:who.email,path:'nh7_account_saved_verses?user_email=eq.'+enc(who.email)+'&ref=eq.'+enc(ref)}:{type:'upsert',table:'nh7_account_saved_verses',conflict:'user_email,ref',owner_email:who.email,payload:{user_email:who.email,ref,language:raw.getItem('nh7_lang')||'en',updated_at:new Date().toISOString()}});
}
function mergeRefs(local,remote){return [...new Set([...(Array.isArray(local)?local:[]),...remote])].filter(ref=>!parse(raw.getItem(PREFIX+'ref_'+enc(identity().owner)+'_'+enc(ref)),{}).removed)}
function allowRestore(key){return raw.getItem(viewKey(key))===null}
function conflicts(){const prefix=CONFLICT+enc(identity().owner)+'_',rows=[];for(let i=0;i<raw.length;i++){const key=raw.key(i);if(key.startsWith(prefix))rows.push(parse(raw.getItem(key)))}return rows.filter(Boolean)}
function legacyEligible(op){
 const who=identity(),email=String(op.owner_email||op.payload?.user_email||'').toLowerCase();
 if(op.owner_scope)return op.owner_scope===who.owner;
 if(op.owner_uid)return op.owner_uid===who.uid;if(email)return email===who.email;
 if(['user_notes','user_progress','saved_verses'].includes(op.table))return !who.uid&&op.payload?.device_id===device;
 if(noteOp(op)||op.table?.startsWith('nh7_account_'))return false;
 return raw.getItem(legacyOwnerKey)===who.owner;
}
function importLegacyMain(){
 const key='nh7_cloud_queue',rows=parse(raw.getItem(key));if(!Array.isArray(rows))return;
 for(const original of rows){
  if(!legacyEligible(original)||!describe(original))continue;
  const op={...original};
  if(op.type==='delete'){
   const table=op.path.split('?')[0],query=new URLSearchParams(op.path.split('?')[1]),note=query.get('note_key')?.replace(/^eq\./,''),ref=query.get('ref')?.replace(/^eq\./,'');
   if(note){op.sync_key=table+':'+note;op.local_key='nh7_'+note;storage.removeItem(op.local_key)}
   else if(ref)op.sync_key=table+':'+ref;
  }
  try{enqueue(op)}catch(_){continue}
  const latest=parse(raw.getItem(key));if(!Array.isArray(latest))continue;
  const index=latest.findIndex(row=>original.id?row.id===original.id:JSON.stringify(row)===JSON.stringify(original));
  if(index>=0){latest.splice(index,1);raw.setItem(key,JSON.stringify(latest))}
 }
}
// Legacy arrays are retained. Unidentified Bible/plan bodies are quarantined;
// these are not replayed with a new user's token or truncated to an arbitrary cap.
function importLegacyPlans(){const key='nh7_spiritual_plans_cloud_queue_v412',rows=parse(raw.getItem(key),[]);if(!Array.isArray(rows))return;const remaining=[];for(const op of rows){if(op.owner_email&&op.owner_email.toLowerCase()===identity().email){try{for(const payload of Array.isArray(op.payload)?op.payload:[op.payload])enqueue({...op,payload})}catch(_){remaining.push(op)}}else remaining.push(op)}if(remaining.length!==rows.length)raw.setItem(key,JSON.stringify(remaining))}
function checkpoint(key,value,force=false){
 const fingerprint=JSON.stringify([value.time,value.duration,!!value.completed]),snapshotKey=PREFIX+'position_'+enc(identity().owner)+'_'+enc(key);
 if(raw.getItem(snapshotKey)===fingerprint)return;
 const marker=PREFIX+'checkpoint_'+enc(identity().owner)+'_'+enc(key),last=Number(raw.getItem(marker)||0);
 if(!force&&Date.now()-last<60000)return;raw.setItem(marker,String(Date.now()));raw.setItem(snapshotKey,fingerprint);window.NH7_PERSONAL_SYNC_BRIDGE_WAVE2?.saveProgress(key,value);
}
window.NH7LocalFirstWave2={configure,enqueue,flush,legacySend:(path,options)=>transport(path,options,identity()),identity,isCurrent:same,allowRestore,readOnce,syncRef,mergeRefs,observe,preserveRemote,recordConflict,conflicts,pending,legacyEligible,checkpoint,importLegacyMain,importLegacyPlans,personal};
window.addEventListener('online',()=>{importLegacyMain();importLegacyPlans();schedule(100)});
document.addEventListener('visibilitychange',()=>{if(document.hidden)flush(true).catch(()=>{});else{importLegacyMain();importLegacyPlans();schedule(100)}});
window.addEventListener('pagehide',()=>flush(true).catch(()=>{}));
window.addEventListener('pageshow',()=>schedule(100));
window.addEventListener('focus',()=>schedule(100));
window.addEventListener('nh7-library-auth-change',()=>{importLegacyMain();importLegacyPlans();schedule(100);notifyOwner()});
window.addEventListener('storage',event=>{cachedKeys=null;if(event.key===SESSION){schedule(100);notifyOwner()}else if(event.key?.startsWith(OUT))schedule()});
})();
