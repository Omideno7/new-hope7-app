/* Actual-source deterministic persistence/reconciliation, no remote access. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {env,tick}=require('./verify-performance-wave1.cjs');
const source=fs.readFileSync('js/app.js','utf8');
function fixture(shared,uid='one'){
 const e=env(shared);e.sign(uid);e.window.localStorage=e.localStorage;e.ctx.navigator.locks={request:async(_,options,fn)=>fn({})};
 vm.runInContext(fs.readFileSync('js/nh7-local-first-wave2.js','utf8'),e.ctx);
 e.raw=e.localStorage;e.localStorage=e.ctx.localStorage=e.window.localStorage;e.api=e.window.NH7LocalFirstWave2;
 Object.assign(e.ctx,{URLSearchParams,state:{lang:'en'},deviceId:()=>e.raw.getItem('nh7_device_id'),authEmail:()=>e.api.identity().email,accountCloudEmail:()=>e.api.identity().email,isAccountLoggedIn:()=>!!e.api.identity().uid});
 vm.runInContext(source.slice(source.indexOf('function enqueueCloud('),source.indexOf('function cloudStatusText(')),e.ctx);
 vm.runInContext(source.slice(source.indexOf('function accountCloudEmail('),source.indexOf('function schoolSnapshotCacheKey(')),e.ctx);
 return e;
}
function backend(e,store=new Map()){
 let fail='',held=null;const calls=[];
 e.api.configure(async(path,opt,who)=>{
  assert(e.api.isCurrent(who));calls.push({path,method:opt.method,owner:who.owner});
  const u=new URL('https://fixture.invalid/'+path),table=u.pathname.slice(1),q=u.searchParams;
  if(table===fail)throw Error('Partial failure fixture');
  if(held){const release=held;held=null;await release()}
  const p=opt.body?JSON.parse(opt.body):{},matches=row=>[...q].every(([k,v])=>!v.startsWith('eq.')||String(row[k])===decodeURIComponent(v.slice(3)));
  const rows=store.get(table)||[],selected=rows.filter(matches);
  if(opt.method==='GET')return structuredClone(selected);
  if(opt.method==='DELETE'){store.set(table,rows.filter(row=>!matches(row)));return structuredClone(selected)}
  if(opt.method==='PATCH'){selected.forEach(row=>Object.assign(row,p));return structuredClone(selected)}
  const keys=(q.get('on_conflict')||'').split(',');let row=rows.find(r=>keys.every(k=>r[k]===p[k]));
  if(row&&opt.headers?.Prefer?.includes('ignore-duplicates'))return [];
  if(row)Object.assign(row,p);else{row=structuredClone(p);rows.push(row)}store.set(table,rows);return [structuredClone(row)];
 });
 return {calls,store,fail:table=>fail=table,hold:fn=>held=fn};
}
async function tests(){
 const e=fixture(),b=backend(e);e.ctx.navigator.onLine=false;
 for(let i=0;i<20;i++)await e.ctx.saveNoteCloud('note_test','offline-'+i);
 assert.equal(e.localStorage.getItem('nh7_note_test'),'offline-19');assert.equal(e.api.pending().length,2);assert.equal(b.calls.length,0);
 const restarted=fixture(e.raw),rb=backend(restarted,b.store);restarted.ctx.navigator.onLine=false;
 assert.equal(restarted.localStorage.getItem('nh7_note_test'),'offline-19');assert.equal(restarted.api.pending().length,2);
 restarted.ctx.navigator.onLine=true;await restarted.api.flush();assert.equal(restarted.api.pending().length,0);assert.equal(b.store.get('user_notes')[0].content,'offline-19');assert.equal(b.store.get('nh7_account_notes')[0].content,'offline-19');
 console.log('PASS offline edit -> offline restart -> reconnect: both backups, 20 edits coalesce to final state');
 await restarted.ctx.saveNoteCloud('note_test','latest');await restarted.api.flush();assert.equal(b.store.get('nh7_account_notes')[0].content,'latest');
 b.store.get('nh7_account_notes')[0].content='device B new text';b.store.get('nh7_account_notes')[0].updated_at='2099-01-01T00:00:00Z';
 await restarted.ctx.saveNoteCloud('note_test','A offline text');await restarted.api.flush();assert.equal(b.store.get('nh7_account_notes')[0].content,'device B new text');assert.equal(restarted.localStorage.getItem('nh7_note_test'),'A offline text');assert(restarted.api.conflicts().some(c=>JSON.stringify(c).includes('device B new text')));
 console.log('PASS differing cross-device notes: preserve both, block weaker overwrite');
 const d=fixture(),db=backend(d);await d.ctx.saveNoteCloud('note_delete','Delete only me');await d.api.flush();
 d.ctx.navigator.onLine=false;await d.ctx.deleteNoteCloudWave2('note_delete');assert.equal(d.localStorage.getItem('nh7_note_delete'),null);
 const dr=fixture(d.raw);backend(dr,db.store);assert.equal(dr.api.allowRestore('nh7_note_delete'),false);dr.ctx.navigator.onLine=true;await dr.api.flush();assert.equal(db.store.get('user_notes').length,0);assert.equal(db.store.get('nh7_account_notes').length,0);
 console.log('PASS explicit offline deletion survives restart and does not resurrect; both existing paths');
 const p=fixture(),pb=backend(p);for(let i=0;i<30;i++)await p.ctx.saveProgressCloud('nh7_sermon_progress_test',{time:i,duration:100});assert.equal(p.api.pending().length,2);await p.api.flush();assert.equal(pb.store.get('nh7_account_progress')[0].value.time,29);assert.equal(JSON.parse(p.localStorage.getItem('nh7_sermon_progress_test')).time,29);
 for(let i=0;i<6;i++){await p.ctx.saveVerseCloud('John 3:16');await p.ctx.deleteVerseCloud('John 3:16')};assert.equal(p.api.pending().length,2);await p.api.flush();assert.equal((pb.store.get('saved_verses')||[]).length,0);
 console.log('PASS rapid position/progress and save/remove coalescing, final-state retention');
 const f=fixture(),fb=backend(f);fb.fail('nh7_account_notes');await f.ctx.saveNoteCloud('note_partial','Keep both');await f.api.flush();assert.equal(f.api.pending().length,1);assert.equal(f.api.pending()[0].attempts,1);const calls=fb.calls.length;await f.api.flush();assert.equal(fb.calls.length,calls,'backoff respected');
 const fr=fixture(f.raw),frb=backend(fr,fb.store);fr.advance(2001);frb.fail('');await fr.api.flush();assert.equal(fr.api.pending().length,0);assert.equal(fb.store.get('nh7_account_notes')[0].content,'Keep both');await fr.api.flush();assert.equal(fr.api.pending().length,0);
 console.log('PASS partial success acknowledgement, bounded backoff, restart retry and duplicate flush');
 const a=fixture(),ab=backend(a);a.ctx.navigator.onLine=false;await a.ctx.saveNoteCloud('note_owner','User A');const count=a.api.pending().length;
 a.localStorage.setItem('nh7_user_session_v170',JSON.stringify({access_token:'token-two',user:{id:'two',email:'two@example.invalid'}}));assert.equal(a.localStorage.getItem('nh7_note_owner'),null);assert.equal(a.api.pending().length,0);a.ctx.navigator.onLine=true;await a.api.flush();assert.equal(ab.calls.length,0);
 a.localStorage.setItem('nh7_user_session_v170',JSON.stringify({access_token:'token-one',user:{id:'one',email:'one@example.invalid'}}));assert.equal(a.localStorage.getItem('nh7_note_owner'),'User A');assert.equal(a.api.pending().length,count);await a.api.flush();assert(ab.calls.every(c=>c.owner==='uid:one'));
 console.log('PASS account-switch storage/queue isolation, no clearing/backfill, same UID recovers edits');
 const fence=fixture(),fenced=backend(fence);let release;fenced.hold(()=>new Promise(r=>release=r));await fence.ctx.saveNoteCloud('note_fence','Original account');const flight=fence.api.flush();await tick();fence.localStorage.setItem('nh7_user_session_v170',JSON.stringify({access_token:'token-two',user:{id:'two',email:'two@example.invalid'}}));release();await flight;assert.equal(fenced.calls.length,1);assert(fenced.calls.every(c=>c.owner==='uid:one')); // In-flight create uses the old JWT; no second-account write.
 assert.equal(fence.localStorage.getItem('nh7_note_fence'),null);
 console.log('PASS account change during preflight cannot send old-owner write with new identity');
 const privacy=fixture(),privacyBackend=backend(privacy);await privacy.ctx.saveNoteCloud('note_same_device','Account A private');await privacy.api.flush();privacy.localStorage.setItem('nh7_user_session_v170',JSON.stringify({access_token:'two',user:{id:'two',email:'two@example.invalid'}}));await privacy.ctx.saveNoteCloud('note_same_device','Account B text');await privacy.api.flush();assert.equal(privacy.localStorage.getItem('nh7_note_same_device'),'Account B text');assert(!JSON.stringify(privacy.api.conflicts()).includes('Account A private'));assert(privacy.api.pending().some(op=>op.table==='user_notes'&&op.blocked));assert.equal(privacyBackend.store.get('nh7_account_notes').find(row=>row.user_email==='two@example.invalid').content,'Account B text');
 console.log('PASS device-bound legacy collision cannot expose another account text; secure account backup still succeeds');
 const revision=fixture(),revisionBackend=backend(revision);let resume;revisionBackend.hold(()=>new Promise(resolve=>resume=resolve));await revision.ctx.saveNoteCloud('note_revision','first');const draining=revision.api.flush();await tick();await revision.ctx.saveNoteCloud('note_revision','second');resume();await draining;assert(revision.api.pending().some(op=>op.payload.content==='second'));await revision.api.flush();assert(revisionBackend.store.get('user_notes').every(row=>row.content==='second'));assert(revisionBackend.store.get('nh7_account_notes').every(row=>row.content==='second'));
 console.log('PASS new edit during in-flight success cannot be acknowledged by older revision');
 const restores=fixture(),restoreBackend=backend(restores);await restores.ctx.saveNoteCloud('note_restore','Local text');await restores.api.flush();restores.ctx.navigator.onLine=false;await restores.ctx.deleteNoteCloudWave2('note_restore');restores.ctx.navigator.onLine=true;
 restores.ctx.cloudFetch=async path=>restoreBackend.store.get(path.split('?')[0])||[];await restores.ctx.restoreAccountCloudData(true);assert.equal(restores.localStorage.getItem('nh7_note_restore'),null,'actual restore respects local deletion');await restores.api.flush();assert.equal(restoreBackend.store.get('nh7_account_notes').length,0);
 await restores.ctx.deleteVerseCloud('John 3:16');assert.deepEqual(Array.from(restores.api.mergeRefs(['Existing'],['John 3:16','Other'])),['Existing','Other']);
 console.log('PASS real account restore cannot resurrect deletion; per-reference removes preserve unrelated cloud saves');
 const stale=fixture();let resolveNotes;stale.ctx.cloudFetch=path=>path.startsWith('nh7_account_notes?')?new Promise(resolve=>resolveNotes=resolve):Promise.resolve([]);const restoring=stale.ctx.restoreAccountCloudData(true);await tick();stale.localStorage.setItem('nh7_user_session_v170',JSON.stringify({user:{id:'two',email:'two@example.invalid'}}));resolveNotes([{note_key:'note_private',content:'Old account cloud',updated_at:'2026-10-13T00:00:00Z'}]);assert.equal(await restoring,false);assert.equal(stale.localStorage.getItem('nh7_note_private'),null);
 console.log('PASS delayed account restore does not apply old-account text after switching');
 const cap=env();cap.sign();vm.runInContext(fs.readFileSync('js/nh7-library-security-v125.js','utf8'),cap.ctx);await cap.window.NH7LibrarySecurityV125.catalog();const prior=cap.localStorage.getItem('nh7_library_public_v125_one');cap.response(async()=>new Response(JSON.stringify({items:Array.from({length:10001},(_,i)=>({id:'public-'+i,audience:'public'})),collections:[]})));assert.equal((await cap.window.NH7LibrarySecurityV125.catalog(true)).items.length,10001);assert.equal(cap.localStorage.getItem('nh7_library_public_v125_one'),prior);
 console.log('PASS oversized rebuildable snapshot is bounded without truncating online catalog or clearing old cache/files');
 const refresh=fixture();refresh.localStorage.setItem('nh7_user_session_v170',JSON.stringify({access_token:'old',refresh_token:'r',user:{id:'one',email:'one@example.invalid'}}));let deliver;refresh.ctx.authSession=()=>JSON.parse(refresh.localStorage.getItem('nh7_user_session_v170'));refresh.ctx.saveAuthSession=value=>value?refresh.localStorage.setItem('nh7_user_session_v170',JSON.stringify(value)):refresh.localStorage.removeItem('nh7_user_session_v170');refresh.ctx.authApi=()=>new Promise(resolve=>deliver=resolve);vm.runInContext(source.slice(source.indexOf('async function refreshUserSession('),source.indexOf('function authEmail(',source.indexOf('async function refreshUserSession('))),refresh.ctx);const refreshing=refresh.ctx.refreshUserSession();await tick();refresh.localStorage.setItem('nh7_user_session_v170',JSON.stringify({access_token:'new-user',user:{id:'two'}}));deliver({access_token:'stale-response',user:{id:'one'}});assert.equal(await refreshing,null);assert.equal(refresh.api.identity().uid,'two');
 console.log('PASS stale account refresh cannot replace the new session; server Auth protocol unchanged');
 const sharedReads=fixture();let readCount=0;sharedReads.ctx.cloudFetch=async()=>{readCount++;await tick();return []};await Promise.all(Array.from({length:20},()=>sharedReads.ctx.restoreAccountCloudData(true)));assert.equal(readCount,4);await sharedReads.ctx.restoreAccountCloudData(true);assert.equal(readCount,8,'force still refreshes after completed reads');
 console.log('PASS 20 reconnect account restores share four in-flight reads, with no completed-state/auth cache');
 const logs=fixture(),logsBackend=backend(logs);
 for(const date of ['2026-10-12','2026-10-13'])await logs.api.enqueue({type:'upsert',table:'fasting_daily_logs',conflict:'user_id,journey_id,log_date',payload:{user_id:'one',journey_id:'journey',log_date:date,reflection:date,updated_at:date+'T00:00:00Z'}});
 assert.equal(logs.api.pending().length,2);await logs.api.flush();assert.equal(logsBackend.store.get('fasting_daily_logs').length,2);
 console.log('PASS different spiritual/fasting composite keys never coalesce into each other');
 const batch=fixture();let edgeCalls=0;batch.api.configure(async(path,options)=>{if(options.method==='GET')return [];edgeCalls++;const payload=JSON.parse(options.body);assert.equal(payload.items.length,2);return{ok:true,saved:2,batch_id:payload.batch_id}});
 await batch.api.enqueue({type:'edge',name:'nh7-content-access',sync_key:'versebatch:test',payload:{action:'save_bible_batch',batch_id:'test',items:[{verse_key:'one',note:'A'},{verse_key:'two',note:'B'}]}});await batch.api.flush();assert.equal(edgeCalls,1);assert.equal(batch.api.pending().length,0);
 console.log('PASS multi-verse action retains one Edge batch; no per-verse write amplification');
 const legacy=fixture();legacy.raw.setItem('nh7_bible_batch_queue_v230',JSON.stringify([{items:[{note:'Legacy unidentified'}]}]));legacy.raw.setItem('nh7_spiritual_plans_cloud_queue_v412',JSON.stringify([{payload:{reflection:'Unidentified'},table:'spiritual_plan_progress'}]));legacy.api.importLegacyPlans();assert(legacy.raw.getItem('nh7_bible_batch_queue_v230').includes('Legacy unidentified'));assert(legacy.raw.getItem('nh7_spiritual_plans_cloud_queue_v412').includes('Unidentified'));
 legacy.raw.setItem('nh7_cloud_queue',JSON.stringify([{id:'owned-legacy',type:'upsert',table:'nh7_account_notes',conflict:'user_email,note_key',owner_email:'one@example.invalid',payload:{user_email:'one@example.invalid',note_key:'old',content:'Legacy queued',updated_at:'2026-10-13T00:00:00Z'}},{id:'unknown-device',type:'upsert',table:'user_notes',payload:{note_key:'unknown',content:'Keep private'}}]));
 legacy.api.importLegacyMain();assert.equal(legacy.api.pending().length,1);assert.equal(JSON.parse(legacy.raw.getItem('nh7_cloud_queue')).length,1);assert.equal(JSON.parse(legacy.raw.getItem('nh7_cloud_queue'))[0].id,'unknown-device');backend(legacy);await legacy.api.flush();assert.equal(legacy.api.pending().length,0);
 console.log('PASS owned legacy operations transfer durably; unidentified queues preserved/quarantined, no ownership guessing');
 const code=fs.readFileSync('js/nh7-local-first-wave2.js','utf8');let notifications=0;legacy.window.addEventListener('nh7-personal-owner-wave2',()=>notifications++);vm.runInContext(code,legacy.ctx);legacy.localStorage.setItem('nh7_user_session_v170',JSON.stringify({user:{id:'two'}}));assert.equal(notifications,1);
 console.log('PASS module duplicate load guard and deterministic owner notification');
}
module.exports={fixture,backend};if(require.main===module)tests().catch(e=>{console.error(e);process.exitCode=1});
