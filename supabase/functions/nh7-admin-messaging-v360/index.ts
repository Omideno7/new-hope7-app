// New Hope 7 v4.1.8 — admin outbound messaging (Push + Inbox).
// Admin UI is unchanged. ALL-user Push targets OneSignal's Subscribed Users
// and excludes the positive role=admin subscription segment.
const VERSION='4.1.8';
const APP_ID='86f4116a-707a-4959-aa3f-7c703f57bf7e';
const ADMIN_SEGMENT_NAME='NH7 Admin Devices v4.1.8';
const SUPABASE_URL=Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ONESIGNAL_KEY=Deno.env.get('ONESIGNAL_REST_API_KEY')!;
const APP_URL='https://omideno7.github.io/new-hope7-app/index.html';
const CORS={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store'
};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:CORS});
const clean=(value:unknown,max=20000)=>String(value??'').trim().slice(0,max);

type Lang='fa'|'en'|'hr';
type Recipient={user_id?:string;email?:string;language?:string};
type Copy={title_fa?:string;body_fa?:string;title_en?:string;body_en?:string;title_hr?:string;body_hr?:string};
type PushResult={id:string;recipients:number|null;segment?:string;raw:Record<string,unknown>};

class PushAudienceError extends Error{
  notificationId:string;
  recipients:number|null;
  constructor(message:string,notificationId='',recipients:number|null=null){super(message);this.name='PushAudienceError';this.notificationId=notificationId;this.recipients=recipients}
}

function serviceHeaders(extra:Record<string,string>={}){
  return{apikey:SERVICE_KEY,Authorization:`Bearer ${SERVICE_KEY}`,'Content-Type':'application/json',...extra};
}
async function service(path:string,init:RequestInit={}){
  const response=await fetch(SUPABASE_URL+path,{...init,headers:{...serviceHeaders(),...((init.headers||{}) as Record<string,string>)}});
  const raw=await response.text();
  if(!response.ok)throw new Error(`Supabase ${response.status}: ${raw}`);
  if(!raw)return null;
  try{return JSON.parse(raw)}catch{return raw}
}
function publicKey(){return Deno.env.get('SUPABASE_ANON_KEY')||Deno.env.get('SUPABASE_PUBLISHABLE_KEY')||SERVICE_KEY}
async function adminIdentity(jwt:string){
  const key=publicKey();
  const userResponse=await fetch(SUPABASE_URL+'/auth/v1/user',{headers:{apikey:key,Authorization:`Bearer ${jwt}`}});
  if(!userResponse.ok)return null;
  const user=await userResponse.json();
  const roleResponse=await fetch(SUPABASE_URL+'/rest/v1/rpc/nh7_is_admin',{method:'POST',headers:{apikey:key,Authorization:`Bearer ${jwt}`,'Content-Type':'application/json'},body:'{}'});
  if(!roleResponse.ok||await roleResponse.json()!==true)return null;
  return{id:clean(user?.id,80),email:clean(user?.email,320).toLowerCase()};
}
function lang(value:unknown):Lang{const normalized=clean(value,5).toLowerCase();return normalized==='fa'||normalized==='hr'?normalized:'en'}
function text(copy:Copy,language:Lang,field:'title'|'body'){
  return clean((copy as Record<string,unknown>)[`${field}_${language}`]||(copy as Record<string,unknown>)[`${field}_en`]||(copy as Record<string,unknown>)[`${field}_fa`]||(copy as Record<string,unknown>)[`${field}_hr`],field==='title'?300:12000);
}
function oneSignalHeaders(){
  if(!ONESIGNAL_KEY)throw new Error('ONESIGNAL_REST_API_KEY is missing');
  return{Authorization:`Key ${ONESIGNAL_KEY}`,'Content-Type':'application/json; charset=utf-8'};
}
async function oneSignal(path:string,init:RequestInit={}){
  const response=await fetch('https://api.onesignal.com'+path,{...init,headers:{...oneSignalHeaders(),...((init.headers||{}) as Record<string,string>)}});
  const raw=await response.text();
  let out:Record<string,unknown>={};
  try{out=raw?JSON.parse(raw):{}}catch{out={raw}}
  if(!response.ok)throw new Error(`OneSignal ${response.status}: ${raw}`);
  return out;
}
async function listSegments(){
  const out=await oneSignal(`/apps/${APP_ID}/segments?offset=0&limit=300`,{method:'GET'});
  return Array.isArray(out?.segments)?out.segments as Array<Record<string,unknown>>:[];
}
function activeAdminSegment(rows:Array<Record<string,unknown>>){
  return rows.find(row=>clean(row?.name,128)===ADMIN_SEGMENT_NAME&&row?.is_active!==false)||null;
}
let adminSegmentPromise:Promise<string>|null=null;
async function ensureAdminSegment(){
  if(adminSegmentPromise)return adminSegmentPromise;
  adminSegmentPromise=(async()=>{
    const existing=activeAdminSegment(await listSegments());
    if(existing)return ADMIN_SEGMENT_NAME;
    try{
      const created=await oneSignal(`/apps/${APP_ID}/segments`,{
        method:'POST',
        body:JSON.stringify({
          name:ADMIN_SEGMENT_NAME,
          description:'OneSignal subscriptions tagged role=admin; excluded from church-user broadcasts.',
          filters:[{field:'tag',key:'role',relation:'=',value:'admin'}]
        })
      });
      if(created?.success!==true&&!clean(created?.id,80))throw new Error(`OneSignal segment was not created: ${JSON.stringify(created)}`);
      return ADMIN_SEGMENT_NAME;
    }catch(error){
      // A parallel cold start may have created the same segment first. Re-read before failing.
      const after=await listSegments().catch(()=>[]);
      if(activeAdminSegment(after))return ADMIN_SEGMENT_NAME;
      throw error;
    }
  })();
  try{return await adminSegmentPromise}catch(error){adminSegmentPromise=null;throw error}
}
async function push(copy:Copy,audience:'all'|'selected',userIds:string[],route:string,campaignId:string):Promise<PushResult>{
  const payload:Record<string,unknown>={
    app_id:APP_ID,
    target_channel:'push',
    headings:{en:text(copy,'en','title'),fa:text(copy,'fa','title'),hr:text(copy,'hr','title')},
    contents:{en:text(copy,'en','body'),fa:text(copy,'fa','body'),hr:text(copy,'hr','body')},
    url:APP_URL,
    data:{route:route||'home',nh7_campaign:'v418',nh7_campaign_id:campaignId},
    idempotency_key:campaignId
  };
  let segment='';
  if(audience==='all'){
    segment=await ensureAdminSegment();
    payload.included_segments=['Subscribed Users'];
    payload.excluded_segments=[segment];
  }else{
    if(!userIds.length)throw new Error('No account-linked push recipients');
    payload.include_aliases={external_id:userIds};
  }
  const out=await oneSignal('/notifications',{method:'POST',body:JSON.stringify(payload)});
  const notificationId=clean(out?.id,320);
  const hasRecipientCount=Object.prototype.hasOwnProperty.call(out,'recipients');
  const parsedRecipients=hasRecipientCount?Number(out?.recipients):null;
  const recipients=parsedRecipients!==null&&Number.isFinite(parsedRecipients)?Math.max(0,Math.trunc(parsedRecipients)):null;
  if(!notificationId)throw new PushAudienceError(`OneSignal did not create a notification: ${JSON.stringify(out)}`,'',recipients);
  if(recipients===0)throw new PushAudienceError('OneSignal audience resolved to 0 subscribed Push recipients.',notificationId,0);
  return{id:notificationId,recipients,segment:segment||undefined,raw:out};
}
async function approvedRecipients(){
  const rows=await service('/rest/v1/registrations?select=language,payload,status&status=eq.approved&limit=5000')||[];
  const map=new Map<string,Recipient>();
  for(const row of Array.isArray(rows)?rows:[]){
    const email=clean(row?.payload?.email,320).toLowerCase();
    if(!email)continue;
    map.set(email,{email,language:lang(row?.language||row?.payload?.language)});
  }
  return[...map.values()];
}
async function saveInboxRows(id:string,copy:Copy,recipients:Recipient[]){
  const rows=recipients.map(recipient=>{
    const language=lang(recipient.language),email=clean(recipient.email,320).toLowerCase();
    return email?{
      user_email:email,
      device_id:null,
      title:text(copy,language,'title'),
      body:text(copy,language,'body'),
      category:'admin_campaign',
      language,
      delivered_at:new Date().toISOString(),
      dedupe_key:`campaign:${id}:${email}:${language}`
    }:null;
  }).filter(Boolean);
  for(let index=0;index<rows.length;index+=500){
    const batch=rows.slice(index,index+500);
    await service('/rest/v1/notification_inbox?on_conflict=dedupe_key',{
      method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify(batch)
    });
  }
  return rows.length;
}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:CORS});
  if(req.method!=='POST')return json({ok:false,error:'Method not allowed'},405);
  try{
    const jwt=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'').trim();
    if(!jwt)return json({ok:false,code:'AUTH_REQUIRED',error:'Admin authentication required'},401);
    const admin=await adminIdentity(jwt);
    if(!admin)return json({ok:false,code:'ADMIN_REQUIRED',error:'Admin access required'},403);

    const payload=await req.json().catch(()=>({}));
    const audience=(payload?.audience==='selected'?'selected':'all') as 'all'|'selected';
    const channels=[...new Set((Array.isArray(payload?.channels)?payload.channels:[]).map((value:unknown)=>clean(value,20)).filter((value:string)=>value==='push'||value==='inbox'))];
    const route=clean(payload?.target_route||'home',80);
    let recipients=(Array.isArray(payload?.recipients)?payload.recipients:[]).slice(0,2000) as Recipient[];
    if(audience==='all'&&channels.includes('inbox'))recipients=await approvedRecipients();
    const userIds=[...new Set(recipients.map(recipient=>clean(recipient.user_id,80)).filter(Boolean))];
    const emails=[...new Set(recipients.map(recipient=>clean(recipient.email,320).toLowerCase()).filter(Boolean))];
    const copy:Copy={
      title_fa:clean(payload?.title_fa,300),body_fa:clean(payload?.body_fa),
      title_en:clean(payload?.title_en,300),body_en:clean(payload?.body_en),
      title_hr:clean(payload?.title_hr,300),body_hr:clean(payload?.body_hr)
    };
    if(!channels.length)return json({ok:false,code:'NO_CHANNEL',error:'Select Push and/or Inbox'},400);
    if(!text(copy,'en','title')||!text(copy,'en','body'))return json({ok:false,code:'INVALID_COPY',error:'Title and body are required'},400);
    if(audience==='selected'&&!recipients.length)return json({ok:false,code:'NO_RECIPIENTS',error:'At least one recipient is required'},400);

    const inserted=await service('/rest/v1/nh7_admin_campaigns_v360',{
      method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({
        audience,channels,title_fa:copy.title_fa||'',body_fa:copy.body_fa||'',
        title_en:copy.title_en||'',body_en:copy.body_en||'',title_hr:copy.title_hr||'',body_hr:copy.body_hr||'',
        target_user_ids:userIds,target_emails:emails,target_route:route,recipient_count:recipients.length,
        status:'sending',created_by:admin.id||null
      })
    });
    const row=Array.isArray(inserted)?inserted[0]:inserted;
    const id=clean(row?.id,80);
    if(!id)throw new Error('Campaign record was not created');

    let oneSignalId='',pushOk=false,inboxOk=false,inboxCount=0,pushRecipients:number|null=null,pushSegment='';
    const errors:string[]=[];
    if(channels.includes('push')){
      try{
        const result=await push(copy,audience,userIds,route,id);
        oneSignalId=result.id;
        pushRecipients=result.recipients;
        pushSegment=result.segment||'';
        pushOk=true;
      }catch(error){
        if(error instanceof PushAudienceError){oneSignalId=error.notificationId;pushRecipients=error.recipients}
        errors.push(clean(error instanceof Error?error.message:error,1200));
      }
    }
    if(channels.includes('inbox')){
      try{inboxCount=await saveInboxRows(id,copy,recipients);inboxOk=inboxCount>0}
      catch(error){errors.push(clean(error instanceof Error?error.message:error,1200))}
    }

    const requested=channels.length;
    const successes=(channels.includes('push')&&pushOk?1:0)+(channels.includes('inbox')&&inboxOk?1:0);
    const status=successes===requested?'sent':successes>0?'partial':'failed';
    const recipientCount=Math.max(audience==='selected'?recipients.length:0,inboxCount,pushRecipients??0);
    await service(`/rest/v1/nh7_admin_campaigns_v360?id=eq.${encodeURIComponent(id)}`,{
      method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({
        status,onesignal_id:oneSignalId,error_message:errors.join(' | '),recipient_count:recipientCount,sent_at:new Date().toISOString()
      })
    });
    return json({
      ok:status!=='failed',id,status,onesignal_id:oneSignalId,recipient_count:recipientCount,
      push_recipients:pushRecipients,inbox_rows:inboxCount,push_targeting:audience==='all'?'subscribed_users_minus_admin_segment':'external_id_aliases',
      admin_segment:pushSegment||undefined,version:VERSION,errors
    });
  }catch(error){
    return json({ok:false,error:clean(error instanceof Error?error.message:error,2000),version:VERSION},500);
  }
});
