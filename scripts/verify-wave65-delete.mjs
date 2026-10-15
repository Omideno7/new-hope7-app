import assert from 'node:assert/strict';
import {createDeleteHandler,emailHash,resumeDeleteJob} from '../supabase/review/wave6_5-security-registration/delete-orchestrator.mjs';
import {reviewEdge} from '../supabase/review/wave6_5-security-registration/edge.mjs';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',J='33333333-3333-4333-8333-333333333333';
const input={request_id:J,target_user_id:A,confirmation_email:'a@example.test',confirmation_phrase:'DELETE'};
const req=(over={})=>new Request('http://fixture.invalid/delete',{method:'POST',headers:{authorization:'Bearer fixture'},body:JSON.stringify({...input,...over})});
const hash=await emailHash(' A@Example.Test ');assert.match(hash,/^[a-f0-9]{64}$/);assert.equal(hash,await emailHash('a@example.test'));
function fixture({objects=[],fail='',defer=false}={}){
 let job=null,deleted=false,freeze=false,newUser=false,calls=[],block,held=defer?new Promise(r=>block=r):Promise.resolve();
 const handler=createDeleteHandler({enabled:true,
  verifiedJWT:async()=>({id:A,email_confirmed_at:'2026-10-15T00:00:00Z'}),
  prepare:async p=>{calls.push('prepare');if(job&&(job.target_id!==p.p_target_user_id||job.actor_id!==p.p_actor_id||job.email_hash!==p.p_email_hash))throw Error('target');if(p.p_target_user_id!==A)throw Error('admin');job||={request_id:J,target_id:A,actor_id:A,stage:'authorized',counts:{fixture:4},email_hash:p.p_email_hash};return structuredClone(job);},
  freezeWrites:async()=>{calls.push('freeze');freeze=true;await held;},
  listOwned:async uid=>{assert.equal(uid,A);calls.push('list');return objects;},
  removeOwned:async batch=>{assert(freeze);calls.push('storage');if(fail==='storage')throw Error('provider');objects=objects.filter(o=>!batch.includes(o));},
  database:async()=>{assert.equal(objects.length,0);assert(freeze);calls.push('database');if(fail==='database')throw Error('db');job.stage='database';return structuredClone(job);},
  deleteAuth:async uid=>{assert.equal(uid,A);assert.equal(job.stage,'database');calls.push('auth');if(fail==='auth')throw Error('auth');deleted=true;},
  stage:async(id,stage)=>{assert.equal(id,J);calls.push(stage);job.stage=stage;return structuredClone(job);},
  verify:async()=>{calls.push('verify');if(fail==='verify')return{activeRows:1};assert(deleted);return{authRemaining:0,activeRows:0,ownedObjects:objects.length,unresolvedExceptions:0};},
 });return{handler,calls,release:()=>block?.(),fresh:()=>newUser=true,get job(){return job},get newUser(){return newUser}};
}
for(const objects of [[],[{owner_id:A,bucket:'avatars',path:'a/photo.jpg'}],Array.from({length:201},(_,i)=>({owner_id:A,bucket:'files',path:'a/'+i}))]){
 const f=fixture({objects});const r=await f.handler(req());assert.equal(r.status,200);assert.equal((await r.json()).stage,'verified');const before=f.calls.length;f.fresh();assert.equal((await f.handler(req())).status,200);assert(f.newUser);assert.deepEqual(f.calls.slice(before),['prepare']);assert.equal((await f.handler(req({target_user_id:B}))).status,409);assert(!JSON.stringify(f.job).includes('a@example.test'));
}
for(const fail of ['storage','database','auth','verify']){const f=fixture({fail,objects:[{owner_id:A,bucket:'files',path:'a/1'}]});assert.equal((await f.handler(req())).status,409);if(fail==='storage')assert(!f.calls.includes('database'));if(fail==='database')assert(!f.calls.includes('auth'));assert.notEqual(f.job.stage,'verified');}
const wrongOwner=fixture({objects:[{owner_id:B,bucket:'avatars',path:'b/photo'}]});assert.equal((await wrongOwner.handler(req())).status,409);assert(!wrongOwner.calls.includes('storage'));
const d=fixture({defer:true}),one=d.handler(req());while(!d.calls.includes('freeze'))await new Promise(r=>setTimeout(r,0));const two=d.handler(req());assert.equal((await d.handler(req({target_user_id:B}))).status,409);d.release();assert.equal((await one).status,200);assert.equal((await two).status,200);assert.equal(d.calls.filter(x=>x==='database').length,1);
let calls=0;const disabled=reviewEdge({url:'https://fixture.invalid',publishableKey:'public-fixture',serverCredential:'',fetchImpl:async()=>{calls++;throw Error('network forbidden')}});assert.equal((await disabled(req())).status,503);assert.equal(calls,0);
let recoveredAuth=0;const recovered=await resumeDeleteJob({enabled:true,authorizeRecovery:async()=>({request_id:J,target_id:A,actor_id:A,stage:'auth',counts:{fixture:4}}),freezeWrites:async()=>{},verify:async()=>({authRemaining:0,activeRows:0,ownedObjects:0,unresolvedExceptions:0}),stage:async(id,stage)=>{assert.equal(id,J);assert.equal(stage,'verified');recoveredAuth++;return {stage,counts:{fixture:4}}}},J);assert.equal(recovered.status,200);assert.equal(recoveredAuth,1);await assert.rejects(resumeDeleteJob({enabled:false},J));
console.log('PASS Wave65 staged Storage/API-before-DB/Auth, zero/201 objects, ownership negatives, each failure boundary, exact-UUID resume/no-retarget, parallel idempotency, minimal hash audit, disabled Edge zero provider calls');
