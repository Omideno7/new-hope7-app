/* Exact-source, mock-backend cloud-write counts. No Production calls. */
const fs=require('node:fs'),vm=require('node:vm'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {env}=require('./verify-performance-wave1.cjs'),{fixture,backend}=require('./verify-local-first-wave2.cjs');
const base='d291592fff8b597e5ab5c8cce4bd1c137d2eab53';
async function measure(old){
 const e=old?env():fixture();let calls=[],store=new Map();
 if(old){e.sign();Object.assign(e.ctx,{state:{lang:'en'},deviceId:()=> 'fixture-device',authEmail:()=> 'one@example.invalid',isAccountLoggedIn:()=>true});e.ctx.cloudFetch=async(path,options)=>{calls.push({path,method:options.method});const url=new URL('https://fixture.invalid/'+path),table=url.pathname.slice(1),rows=store.get(table)||[],q=url.searchParams,p=JSON.parse(options.body||'{}');if(options.method==='DELETE'){store.set(table,rows.filter(row=>![...q].every(([k,v])=>String(row[k])===v.slice(3))));return []}const keys=(q.get('on_conflict')||'').split(',');const row=rows.find(row=>keys.every(k=>row[k]===p[k]));if(row)Object.assign(row,p);else rows.push(p);store.set(table,rows);return [p]};const app=cp.execFileSync('git',['show',base+':js/app.js'],{encoding:'utf8'});vm.runInContext(app.slice(app.indexOf('function enqueueCloud('),app.indexOf('function cloudStatusText(')),e.ctx);vm.runInContext(app.slice(app.indexOf('function accountCloudEmail('),app.indexOf('function nh7UnwrapCloudValueV544(')),e.ctx);
 }else{const b=backend(e);calls=b.calls;store=b.store;}
 for(let i=0;i<20;i++){e.localStorage.setItem('nh7_note_measure','Typing revision '+i);await e.ctx.saveNoteCloud('note_measure','Typing revision '+i);}
 // Actual classic player before Wave 2 persists positions locally without cloud backup.
 // Wave 2 adds the existing progress backup on <=60s/meaningful lifecycle checkpoints.
 for(let i=0;i<30;i++){const value={time:i,duration:100,completed:false,updatedAt:new Date().toISOString()};e.localStorage.setItem('nh7_sermon_progress_measure',JSON.stringify(value));if(!old)e.api.checkpoint('nh7_sermon_progress_measure',value,i===29)}
 for(let i=0;i<6;i++)await (i%2?e.ctx.deleteVerseCloud('John 3:16'):e.ctx.saveVerseCloud('John 3:16'));
 if(!old){e.document.hidden=true;await e.api.flush(true);e.document.hidden=false;await e.api.flush();await e.api.flush();assert.equal(e.api.pending().length,0);assert.equal(store.get('nh7_account_notes')[0].content,'Typing revision 19');assert.equal(store.get('nh7_account_progress')[0].value.time,29);assert.equal((store.get('nh7_account_saved_verses')||[]).length,0)}
 assert.equal(store.get('nh7_account_notes')[0].content,'Typing revision 19');assert.equal(e.localStorage.getItem('nh7_note_measure'),'Typing revision 19');
 const writes=calls.filter(c=>c.method!=='GET').length,requests=calls.length;
 const checkpointWrites=calls.filter(c=>c.method!=='GET'&&c.path.includes('progress')).length;
 const start=calls.length;for(let i=0;i<30;i++)await e.ctx.saveProgressCloud('nh7_plan_measure',{completed:[i]});if(!old)await e.api.flush();
 return{scenario_writes:writes,scenario_requests:requests,audio_checkpoint_writes:checkpointWrites,repeated_personal_progress_30_writes:calls.slice(start).filter(c=>c.method!=='GET').length,final_state_verified:true};
}
(async()=>{const result={baseline_sha:base,scenario:'20 explicit note edits, 30 actual-classic local position snapshots with Wave 2 lifecycle checkpoint, six Bible save/remove toggles, background/foreground plus duplicate retry',before:await measure(true),after:await measure(false),limitations:'Deterministic VM using actual app save/queue functions and actual coordinator checkpoint; current pre-Wave-2 classic positions are local-only. Not typing-event network telemetry or native billing/energy.'};assert(result.after.scenario_writes<result.before.scenario_writes);if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2))})().catch(e=>{console.error(e);process.exitCode=1});
