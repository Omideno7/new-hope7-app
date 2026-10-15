/* REVIEW ONLY transport composition. No live listener, deployment config or automatically enabled handler. */
import {createDeleteHandler} from './delete-orchestrator.mjs';
export function reviewEdge({url,publishableKey,serverCredential,approvedPorts,fetchImpl=fetch,allowedOrigins=['https://omideno7.github.io','capacitor://localhost','http://localhost','https://localhost']}){
 // approvedPorts must bind reviewed deployed schema snapshot, write-fence, Storage inventory and final verification.
 // An incomplete census/immutable history policy blocks activation; no guessed service-table access fallback.
 async function request(path,{method='POST',body,token=serverCredential}={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{const r=await fetchImpl(url+path,{method,cache:'no-store',signal:controller.signal,headers:{apikey:publishableKey,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});if(!r.ok)throw Object.assign(Error('server_operation_failed'),{status:r.status});return r.status===204?null:await r.json();}finally{clearTimeout(timer)}
 }
 const rpc=(name,body)=>request('/rest/v1/rpc/'+name,{body});
 const handler=createDeleteHandler({enabled:approvedPorts?.activationApproved===true&&!!serverCredential,
  verifiedJWT:async authorization=>{const token=String(authorization||'').match(/^Bearer ([^\s]+)$/)?.[1];if(!token)throw Error('jwt');return request('/auth/v1/user',{method:'GET',token});},
  prepare:p=>rpc('nh7_full_delete_prepare_wave65',p),database:id=>rpc('nh7_full_delete_database_wave65',{p_request_id:id}),stage:(id,stage)=>rpc('nh7_full_delete_stage_wave65',{p_request_id:id,p_stage:stage}),
  freezeWrites:job=>approvedPorts.freezeWrites(job),listOwned:uid=>approvedPorts.listOwned(uid),verify:job=>approvedPorts.verify(job),
  removeOwned:async objects=>{const groups=Map.groupBy(objects,o=>o.bucket);for(const[bucket,rows]of groups)await request('/storage/v1/object/'+encodeURIComponent(bucket),{method:'DELETE',body:{prefixes:rows.map(o=>o.path)}});},
  deleteAuth:async uid=>{try{return await request('/auth/v1/admin/users/'+encodeURIComponent(uid),{method:'DELETE'})}catch(error){if(error.status!==404)throw error;try{await request('/auth/v1/admin/users/'+encodeURIComponent(uid),{method:'GET'});throw Error('auth_still_present')}catch(check){if(check.status!==404)throw check;}}},
 });
 return async request=>{const origin=request.headers.get('origin');if(origin&&!allowedOrigins.includes(origin))return Response.json({ok:false,code:'origin_denied'},{status:403});const headers={'Vary':'Origin','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'};if(origin)headers['Access-Control-Allow-Origin']=origin;if(request.method==='OPTIONS')return new Response(null,{status:204,headers});const result=await handler(request);const merged=new Headers(result.headers);for(const [key,value]of Object.entries(headers))merged.set(key,value);return new Response(result.body,{status:result.status,headers:merged});};
}
