// REVIEW ONLY. No startup, cron, network or Deno.serve side effect.
import '../../../js/nh7-notification-contract-wave4.js';
const C=(globalThis as any).NH7NotificationContractWave4;
export type Account={user_id:string,email:string,language:string,language_fallback?:boolean,subscriptions:string[],is_admin:boolean,approved:boolean,active:boolean,access?:any};
export type Store={
 accounts:()=>Promise<Account[]>; access:(uid:string)=>Promise<any>;
 savePreview:(id:string,actor:string,request:any,recipients:Account[])=>Promise<any>;
 preview:(id:string,actor:string,token:string)=>Promise<any>;
 claim:(key:string,payload:any)=>Promise<boolean>;
 status:(key:string)=>Promise<string>;
 authorize:(uid:string,type:string,subscription:string,language:string)=>Promise<boolean>;
 finish:(key:string,state:string,response:any)=>Promise<void>;
 inbox:(key:string,row:any)=>Promise<void>;
 provider:(payload:any)=>Promise<any>;
 campaign:(id:string,status:string,results:any[])=>Promise<void>;
 event:(type:string,id:string)=>Promise<{exists:boolean,revision:number}>;
};
const json=(v:any)=>C.canonical(v);
export function resolve(accounts:Account[],request:any):Account[]{
 const eligible=accounts.filter(a=>a.active&&a.approved&&!a.is_admin&&C.uuid(a.user_id)&&a.email);
 const unique=new Map(eligible.map(a=>[a.user_id,{...a,language:C.language(a.language),language_fallback:!C.languages.includes(a.language),subscriptions:[...new Set(a.subscriptions.filter(C.uuid))].sort()}]));
 if(!['all','segment','single'].includes(request.mode))throw Error('invalid_audience');
 if(request.mode==='segment'&&!C.languages.includes(request.segment))throw Error('invalid_language');
 const selected=request.recipients?.map((r:any)=>r.user_id)||[];
 if(request.mode==='single'&&(selected.length!==1||!unique.has(selected[0])))throw Error('recipient_unavailable');
 return [...unique.values()].filter(a=>request.mode==='all'||request.mode==='segment'&&a.language===request.segment||request.mode==='single'&&a.user_id===selected[0]).sort((a,b)=>a.user_id.localeCompare(b.user_id));
}
function channels(request:any){const out=[...new Set(request.channels)] as string[];if(!out.length||out.some(c=>!['push','inbox'].includes(c)))throw Error('invalid_channels');return out}
export async function preview(actor:string,request:any,store:Store){
 if(!(await store.access(actor))?.is_owner)throw Error('admin_required');
 if(!C.uuid(request.request_id))throw Error('invalid_request_id');
 channels(request);const intent=C.intent({version:4,route:request.target_route,params:{}});if(!intent)throw Error('invalid_route');
 const recipients=resolve(await store.accounts(),request);if(!recipients.length||recipients.length>2000)throw Error('audience_empty_or_over_limit');
 for(const l of new Set(recipients.map(a=>a.language)))if(!String(request['title_'+l]||'').trim()||!String(request['body_'+l]||'').trim())throw Error('missing_language_copy');
 return await store.savePreview(request.request_id,actor,request,recipients);
}
async function deliver(type:string,source:string,revision:number,a:Account,requested:string[],copy:any,intent:any,store:Store,actor?:string){
 const results:any[]=[];
 for(const channel of requested){const targets=channel==='inbox'?['account']:a.subscriptions;
  if(!targets.length)results.push({channel,state:'no_subscription',user_id:a.user_id});
  for(const subscription of targets){if(type==='campaign'&&!(await store.access(actor!))?.is_owner){results.push({channel,state:'revoked',user_id:a.user_id});continue}const key=C.deliveryKey(type,source,a.user_id,channel,revision,subscription),boundIntent={...intent,recipient_uid:a.user_id};
   if(!await store.claim(key,{type,source,revision,user_id:a.user_id,channel,subscription,language:a.language,intent:boundIntent})){results.push({channel,state:await store.status(key),key,duplicate:true});continue}
   // Claim is durable and atomic. NEVER release/delete unknown provider claims.
   let state='unknown',response:any={};
   try{
    const access=await store.access(a.user_id);
    if(!await store.authorize(a.user_id,type,subscription,a.language)||type!=='campaign'&&!C.permitted(type,access)){state='revoked';response={code:'permission_revoked'}}
    else if(channel==='inbox'){
     await store.inbox(key,{user_email:a.email,recipient_uid:a.user_id,title:copy.title,body:copy.body,language:a.language,category:type==='campaign'?'admin_campaign':'admin_event_'+type,intent:boundIntent,dedupe_key:key,delivered_at:new Date().toISOString()});state='recorded';response={inbox:true};
    }else{
     const id=await C.providerKey(key);
     response=await store.provider({user_id:a.user_id,include_subscription_ids:[subscription],idempotency_key:id,target_channel:'push',headings:{en:copy.title,[a.language]:copy.title},contents:{en:copy.body,[a.language]:copy.body},data:{nh7_intent:boundIntent},url:'https://omideno7.github.io/new-hope7-app/index.html?nh7_intent='+encodeURIComponent(json(boundIntent))});
     // Accepted is NOT delivered. 0 recipients/absent IDs are explicit failures.
     state=response?.id?(response.recipients===0?'no_subscription':'accepted'):'unknown';
    }
   }catch(error){response={code:'outcome_unknown'};state='unknown'}
   await store.finish(key,state,{id:response.id||null,recipients:response.recipients??null,code:response.code||null});results.push({channel,state,key});
  }
 }return results;
}
export async function execute(actor:string,id:string,token:string,store:Store){
 if(!(await store.access(actor))?.is_owner)throw Error('admin_required');
 const p=await store.preview(id,actor,token);if(!p||p.expired)throw Error('fresh_preview_required');
 const fresh=resolve(await store.accounts(),p.request);
 // Changed language, role, registration, device ownership or audience requires re-preview.
 if(json(fresh)!==json(p.recipients))throw Error('audience_changed');
 const results:any[]=[];
 for(const a of fresh){if(!(await store.access(actor))?.is_owner)throw Error('admin_revoked');const copy={title:p.request['title_'+a.language],body:p.request['body_'+a.language]};results.push(...await deliver('campaign',id,1,a,channels(p.request),copy,{version:4,route:p.request.target_route,params:{},event_id:id},store,actor))}
 const status=results.some(r=>r.state==='unknown')?'unknown':results.some(r=>['revoked','no_subscription'].includes(r.state))?'partial':'accepted';
 await store.campaign(id,status,results);return{ok:true,id,status,recipient_count:fresh.length,results,version:4};
}
export async function adminEvent(type:string,source:string,revision:number,store:Store){
 if(!Object.hasOwn(C.eventPermissions,type)||!C.uuid(source)||!Number.isInteger(revision)||revision<1)throw Error('invalid_event');
 const row=await store.event(type,source);if(!row.exists||row.revision!==revision)throw Error('source_missing_or_stale');
 const accounts=await store.accounts(),results:any[]=[];
 for(const a of accounts){if(!a.active||!C.uuid(a.user_id)||!C.permitted(type,await store.access(a.user_id)))continue;
  const normalized={...a,language:C.language(a.language),subscriptions:[...new Set(a.subscriptions.filter(C.uuid))]};
  // No private row contents are accepted by this API or serialized to lock screen.
  results.push(...await deliver(type,source,revision,normalized,['push','inbox'],C.eventCopy(type,a.language),{version:4,route:'admin',params:{section:type,id:source},event_id:await C.providerKey('event:'+type+':'+source+':'+revision)},store));
 }return results;
}
