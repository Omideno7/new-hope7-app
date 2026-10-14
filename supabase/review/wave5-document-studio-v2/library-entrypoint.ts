// REVIEW ONLY full proposed entrypoint. Not a deployed function/config/workflow.
import {publishLibrary} from './library-publication.mjs';
const origins=new Set(['https://omideno7.github.io','http://localhost','https://localhost','capacitor://localhost']);
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin'),cors={'Access-Control-Allow-Origin':origin&&origins.has(origin)?origin:'https://omideno7.github.io','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Vary':'Origin'};
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});if(req.method!=='POST')return reply({ok:false},405);
 const url=Deno.env.get('SUPABASE_URL')||'',anon=Deno.env.get('SUPABASE_ANON_KEY')||'',service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'',jwt=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
 if(!jwt||!url||!anon||!service)return reply({ok:false,code:'unavailable'},401);
 const bounded=async(path:string,options:any,consume:(response:Response)=>Promise<any>)=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{const response=await fetch(url+path,{...options,signal:controller.signal});return await consume(response)}finally{clearTimeout(timer)}};
 const caller={apikey:anon,Authorization:'Bearer '+jwt,'Content-Type':'application/json'},server={apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json'};
 const rpc=async(name:string,body:any,internal=false)=>{return bounded('/rest/v1/rpc/'+name,{method:'POST',headers:internal?server:caller,body:JSON.stringify(body)},async response=>{if(!response.ok)throw Error('unavailable');return response.json()})};
 try{
  const auth=async()=>{return bounded('/auth/v1/user',{headers:caller},async response=>{if(!response.ok)throw Error('denied');return response.json()})};
  const access=()=>rpc('nh7_admin_my_access_v350',{});
  const result=await publishLibrary(await req.json(),{auth,access,
   store:{load:(id:string,uid:string,token:string)=>rpc('nh7_document_library_plan_v2',{p_id:id,p_uid:uid,p_prepare_token:token},true),claim:(id:string,hash:string)=>rpc('nh7_document_library_claim_v2',{p_id:id,p_hash:hash},true),status:(id:string)=>rpc('nh7_document_library_status_v2',{p_id:id},true),finish:(id:string,status:string)=>rpc('nh7_document_library_finish_v2',{p_id:id,p_status:status},true)},
   storage:{readOwned:async(bucket:string,path:string,uid:string)=>{if(bucket!=='nh7-library'||!await rpc('nh7_document_library_storage_owner_v2',{p_path:path,p_uid:uid},true))throw Error('denied');return bounded('/storage/v1/object/authenticated/nh7-library/'+path,{headers:caller},async response=>{if(!response.ok||!response.body)throw Error('unavailable');const reader=response.body.getReader(),chunks:Uint8Array[]=[];let length=0;try{while(true){const next=await reader.read();if(next.done)break;length+=next.value.byteLength;if(length>12000000){await reader.cancel();throw Error('file_limit')}chunks.push(next.value)}}finally{reader.releaseLock()}const out=new Uint8Array(length);let offset=0;for(const chunk of chunks){out.set(chunk,offset);offset+=chunk.byteLength}return out})}},
   currentLibrarySave:(name:string,body:any)=>rpc(name,body),sha256:async(bytes:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('')});return reply(result);
 }catch{return reply({ok:false,code:'publication_unavailable'},403)}
});
