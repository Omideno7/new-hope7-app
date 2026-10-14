// REVIEW ONLY adapter for existing nh7-admin-messaging-v360 and event worker.
// Do not deploy this file; export handlers for isolated fixture testing.
import {execute,adminEvent,type Store} from './pipeline.ts';
const C=(globalThis as any).NH7NotificationContractWave4;
export function handlers(env:Record<string,string>,transport:typeof fetch=fetch){
 const url=env.SUPABASE_URL,serviceKey=env.SUPABASE_SERVICE_ROLE_KEY;
 const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Vary':'Origin'}});
 async function rpc(name:string,args:any,jwt=serviceKey){const r=await transport(url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:jwt===serviceKey?serviceKey:env.SUPABASE_ANON_KEY,Authorization:'Bearer '+jwt,'Content-Type':'application/json'},body:JSON.stringify(args)});if(!r.ok)throw Error('rpc_denied');return r.json()}
 const store:Store={
  accounts:()=>rpc('nh7_notification_accounts_wave4',{}),
  access:uid=>rpc('nh7_notification_access_wave4',{p_uid:uid}),
  savePreview:()=>{throw Error('use_authenticated_preview_rpc')},
  preview:(id,actor,token)=>rpc('nh7_notification_preview_load_wave4',{p_id:id,p_actor:actor,p_token:token}),
  claim:(key,payload)=>rpc('nh7_notification_claim_wave4',{p_key:key,p_payload:payload}),
  status:key=>rpc('nh7_notification_status_wave4',{p_key:key}),
  authorize:(uid,type,subscription,language)=>rpc('nh7_notification_authorize_wave4',{p_uid:uid,p_type:type,p_subscription:subscription,p_language:language}),
  finish:(key,state,result)=>rpc('nh7_notification_finish_wave4',{p_key:key,p_state:state,p_result:result}),
  inbox:(key,row)=>rpc('nh7_notification_inbox_wave4',{p_key:key,p_row:row}),
  campaign:(id,status,results)=>rpc('nh7_notification_campaign_finish_wave4',{p_id:id,p_status:status,p_results:results}),
  event:(type,id)=>rpc('nh7_notification_event_source_wave4',{p_type:type,p_id:id}),
  provider:async payload=>{if(!env.ONESIGNAL_REST_API_KEY||!env.ONESIGNAL_APP_ID)throw Error('provider_unconfigured');const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),15000);try{
 const ownership=await transport(`https://api.onesignal.com/apps/${env.ONESIGNAL_APP_ID}/users/by/external_id/${payload.user_id}`,{headers:{Authorization:'Key '+env.ONESIGNAL_REST_API_KEY},signal:ctrl.signal});if(!ownership.ok)throw Error('ownership_unverified');const current=await ownership.json();if(current.identity?.external_id!==payload.user_id||!current.subscriptions?.some((s:any)=>s.id===payload.include_subscription_ids[0]&&s.enabled!==false))throw Error('ownership_changed');
 const {user_id,...message}=payload;const r=await transport('https://api.onesignal.com/notifications',{method:'POST',headers:{Authorization:'Key '+env.ONESIGNAL_REST_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({app_id:env.ONESIGNAL_APP_ID,...message}),signal:ctrl.signal});if(!r.ok)throw Error('provider_unknown');return r.json()}finally{clearTimeout(timer)}}
 };
 async function campaign(req:Request){
  if(req.method==='OPTIONS')return response({ok:true});if(req.method!=='POST')return response({ok:false,code:'method_denied'},405);
  try{const jwt=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');if(!jwt)return response({ok:false,code:'auth_required'},401);
   const r=await transport(url+'/auth/v1/user',{headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:'Bearer '+jwt}});if(!r.ok)return response({ok:false,code:'auth_required'},401);const actor=await r.json();
   const role=await rpc('nh7_admin_my_access_v350',{},jwt);if(!role?.is_owner)return response({ok:false,code:'admin_required'},403);
   const p=await req.json();if(p.version!==4||!C.uuid(p.request_id)||!C.uuid(p.preview_token))return response({ok:false,code:'fresh_preview_required'},400);
   return response(await execute(actor.id,p.request_id,p.preview_token,store));
  }catch(_){return response({ok:false,code:'fresh_preview_or_history_required'},409)}
 }
 async function events(req:Request){
  if(req.method!=='POST'||!env.NH7_NOTIFICATION_EVENT_WORKER_SECRET||req.headers.get('x-nh7-event-secret')!==env.NH7_NOTIFICATION_EVENT_WORKER_SECRET)return response({ok:false,code:'denied'},403);
  try{const rows=await rpc('nh7_notification_pending_events_wave4',{}),results=[];
   for(const e of rows){try{const r=await adminEvent(e.event_type,e.wave4_source_id,e.wave4_revision,store);const state=r.some((x:any)=>x.state==='unknown')?'unknown':r.length?'accepted':'no_recipients';await rpc('nh7_notification_event_finish_wave4',{p_id:e.id,p_state:state});results.push({id:e.id,state})}catch(_){await rpc('nh7_notification_event_finish_wave4',{p_id:e.id,p_state:'unavailable'});results.push({id:e.id,state:'unavailable'})}}
   return response({ok:true,results})
  }catch(_){return response({ok:false,code:'event_unavailable'},409)}
 }
 async function binding(req:Request){
  if(req.method==='OPTIONS')return response({ok:true});if(req.method!=='POST')return response({ok:false},405);
  try{const jwt=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');if(!jwt)return response({ok:false},401);const auth=await transport(url+'/auth/v1/user',{headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:'Bearer '+jwt}});if(!auth.ok)return response({ok:false},401);const u=await auth.json(),p=await req.json();if(!C.uuid(u.id))return response({ok:false},401);
   if(p.action==='identity'){
    if(!env.ONESIGNAL_IDENTITY_VERIFICATION_KEY||!env.ONESIGNAL_APP_ID)return response({ok:false,code:'identity_verification_required'},503);
    const encode=(value:any)=>btoa(JSON.stringify(value)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
    const now=Math.floor(Date.now()/1000),input=encode({alg:'HS256',typ:'JWT'})+'.'+encode({iss:env.ONESIGNAL_APP_ID,iat:now,exp:now+300,identity:{external_id:u.id}});
    const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.ONESIGNAL_IDENTITY_VERIFICATION_KEY),{name:'HMAC',hash:'SHA-256'},false,['sign']);
    const signature=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(input))),encoded=btoa(String.fromCharCode(...signature)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
    return response({ok:true,user_id:u.id,identity_token:input+'.'+encoded});
   }
   if(!C.uuid(p.subscription_id)||typeof p.active!=='boolean')return response({ok:false},400);
   if(p.active){const r=await transport(`https://api.onesignal.com/apps/${env.ONESIGNAL_APP_ID}/users/by/external_id/${u.id}`,{headers:{Authorization:'Key '+env.ONESIGNAL_REST_API_KEY}});if(!r.ok)return response({ok:false},403);const current=await r.json();if(current.identity?.external_id!==u.id||!current.subscriptions?.some((s:any)=>s.id===p.subscription_id&&s.enabled!==false))return response({ok:false},403)}
   await rpc('nh7_notification_subscription_wave4',{p_uid:u.id,p_subscription:p.subscription_id,p_active:p.active});return response({ok:true})
  }catch(_){return response({ok:false,code:'binding_unverified'},409)}
 }
 return {campaign,events,binding};
}
