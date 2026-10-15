/* REVIEW ONLY, injectable server ports. Not an automatically deployed Edge entrypoint. */
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export async function emailHash(email){const bytes=new TextEncoder().encode(email.trim().toLowerCase());return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');}
export function createDeleteHandler(ports){
 // Ports are server-only: verifiedJWT, prepare, freezeWrites, listOwned, removeOwned, database, deleteAuth, verify, stage.
 // Actual Storage/Auth credentials exist only in server environment. No client-supplied object paths/actor are trusted.
 const inFlight=new Map();
 return async function handle(request){
  if(ports.enabled!==true)return Response.json({ok:false,code:'not_activated'},{status:503});
  if(request.method!=='POST')return Response.json({ok:false,code:'method'},{status:405});
  let input,actor;try{actor=await ports.verifiedJWT(request.headers.get('authorization'));input=await request.json();}catch{return Response.json({ok:false,code:'unauthorized'},{status:401});}
  if(!actor?.id||!actor.email_confirmed_at)return Response.json({ok:false,code:'unauthorized'},{status:401});
  if(!uuid(input.request_id)||!uuid(input.target_user_id)||input.confirmation_phrase!=='DELETE'||typeof input.confirmation_email!=='string')return Response.json({ok:false,code:'confirmation'},{status:400});
  const bound=JSON.stringify([actor.id,input.target_user_id,await emailHash(input.confirmation_email)]),key=input.request_id;
  if(inFlight.has(key)){const old=inFlight.get(key);if(old.bound!==bound)return Response.json({ok:false,code:'idempotency_target'},{status:409});return (await old.promise).clone();}
  const task=(async()=>{
   try{
    let job=await ports.prepare({p_request_id:key,p_actor_id:actor.id,p_target_user_id:input.target_user_id,p_email:input.confirmation_email.trim().toLowerCase(),p_email_hash:await emailHash(input.confirmation_email),p_phrase:'DELETE'});
    const target=job.target_id;if(target!==input.target_user_id||job.actor_id!==actor.id)throw Error('job_binding');
    return await runStages(ports,job);
   }catch{return Response.json({ok:false,code:'delete_incomplete',request_id:key},{status:409});}
  })();inFlight.set(key,{bound,promise:task});try{return (await task).clone();}finally{inFlight.delete(key);}
 };
}

async function runStages(ports,job){
 const target=job.target_id;
    if(job.stage==='verified')return Response.json({ok:true,stage:'verified',target_user_id:target,counts:job.counts});
    // Required server-side write fence before snapshots; cannot assume a ban invalidates all old access JWTs.
    // Activation MUST supply a proven all-domain UID write fence. Missing port blocks; never silently continue.
    await ports.freezeWrites(job);
    if(job.stage==='authorized'){
     const objects=await ports.listOwned(target);if(!Array.isArray(objects)||objects.length>10000)throw Error('storage_bound');
     for(let i=0;i<objects.length;i+=100){const batch=objects.slice(i,i+100);if(batch.some(o=>o.owner_id!==target||!o.bucket||!o.path))throw Error('storage_owner');await ports.removeOwned(batch);}
     if((await ports.listOwned(target)).length)throw Error('storage_remaining');job=await ports.stage(job.request_id,'storage');
    }
    if(job.stage==='storage')job=await ports.database(job.request_id);
    if(job.stage==='database'){await ports.deleteAuth(target);job=await ports.stage(job.request_id,'auth');}
    const verification=await ports.verify(job);if(verification.authRemaining||verification.activeRows||verification.ownedObjects||verification.unresolvedExceptions)throw Error('verification_remaining');
    job=await ports.stage(job.request_id,'verified');return Response.json({ok:true,stage:'verified',target_user_id:target,counts:job.counts});
}

/* Internal worker recovery after Auth deletion: only a server-authorized persisted job; no HTTP/body actor override. */
export async function resumeDeleteJob(ports,requestId){
 if(ports.enabled!==true||!uuid(requestId)||typeof ports.authorizeRecovery!=='function')throw Error('recovery_denied');
 const job=await ports.authorizeRecovery(requestId);if(job?.request_id!==requestId||!uuid(job.target_id))throw Error('recovery_job');
 return runStages(ports,job);
}
