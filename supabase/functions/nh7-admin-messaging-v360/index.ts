// New Hope 7 v3.6.0 — admin outbound messaging (Push + Inbox), isolated RC source.
// Deploy only after RC approval. Runtime must require JWT.
const APP_ID='86f4116a-707a-4959-aa3f-7c703f57bf7e';
const SUPABASE_URL=Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ONESIGNAL_KEY=Deno.env.get('ONESIGNAL_REST_API_KEY')!;
const APP_URL='https://omideno7.github.io/new-hope7-app/index.html';
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:CORS});
const clean=(v:unknown,n=20000)=>String(v??'').trim().slice(0,n);
type Lang='fa'|'en'|'hr';
type Recipient={user_id?:string,email?:string,language?:string};
type Copy={title_fa?:string,body_fa?:string,title_en?:string,body_en?:string,title_hr?:string,body_hr?:string};
function serviceHeaders(extra:Record<string,string>={}){return{apikey:SERVICE_KEY,Authorization:`Bearer ${SERVICE_KEY}`,'Content-Type':'application/json',...extra}}
async function service(path:string,init:RequestInit={}){const r=await fetch(SUPABASE_URL+path,{...init,headers:{...serviceHeaders(),...((init.headers||{}) as Record<string,string>)}}),text=await r.text();if(!r.ok)throw new Error(`Supabase ${r.status}: ${text}`);if(!text)return null;try{return JSON.parse(text)}catch{return text}}
async function isAdmin(jwt:string){const key=Deno.env.get('SUPABASE_ANON_KEY')||Deno.env.get('SUPABASE_PUBLISHABLE_KEY')||'';const r=await fetch(SUPABASE_URL+'/rest/v1/rpc/nh7_is_admin',{method:'POST',headers:{apikey:key,Authorization:`Bearer ${jwt}`,'Content-Type':'application/json'},body:'{}'});return r.ok&&(await r.json())===true}
function lang(v:unknown):Lang{const x=clean(v,5).toLowerCase();return x==='fa'||x==='hr'?x:'en'}
function text(c:Copy,l:Lang,field:'title'|'body'){return clean((c as any)[`${field}_${l}`]||(c as any)[`${field}_en`]||(c as any)[`${field}_fa`]||(c as any)[`${field}_hr`],field==='title'?300:12000)}
async function push(c:Copy,audience:'all'|'students'|'selected',userIds:string[],route:string){
  if(!ONESIGNAL_KEY)throw new Error('ONESIGNAL_REST_API_KEY is missing');
  const payload:any={app_id:APP_ID,target_channel:'push',headings:{en:text(c,'en','title'),fa:text(c,'fa','title'),hr:text(c,'hr','title')},contents:{en:text(c,'en','body'),fa:text(c,'fa','body'),hr:text(c,'hr','body')},url:APP_URL,data:{route:route||'home',nh7_campaign:'v360'}};
  if(audience==='all')payload.included_segments=['All'];
  else{if(!userIds.length)throw new Error('No account-linked push recipients');payload.include_aliases={external_id:userIds}}
  const r=await fetch('https://api.onesignal.com/notifications',{method:'POST',headers:{Authorization:`Key ${ONESIGNAL_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(payload)}),raw=await r.text();let out:any={};try{out=raw?JSON.parse(raw):{}}catch{out={raw}}if(!r.ok)throw new Error(`OneSignal ${r.status}: ${raw}`);return out
}
async function saveGlobalInbox(id:string,c:Copy){const rows=(['fa','en','hr'] as Lang[]).map(l=>({user_email:null,device_id:null,title:text(c,l,'title'),body:text(c,l,'body'),category:'admin_campaign',language:l,delivered_at:new Date().toISOString(),dedupe_key:`campaign:${id}:${l}`})).filter(x=>x.title&&x.body);if(rows.length)await service('/rest/v1/notification_inbox?on_conflict=dedupe_key',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify(rows)})}
async function saveSelectedInbox(id:string,c:Copy,recipients:Recipient[]){const rows=recipients.map((r,i)=>{const l=lang(r.language),email=clean(r.email,320).toLowerCase();return email?{user_email:email,device_id:null,title:text(c,l,'title'),body:text(c,l,'body'),category:'admin_campaign',language:l,delivered_at:new Date().toISOString(),dedupe_key:`campaign:${id}:${email}:${l}:${i}`} : null}).filter(Boolean);if(rows.length)await service('/rest/v1/notification_inbox?on_conflict=dedupe_key',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify(rows)})}
Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:CORS});if(req.method!=='POST')return json({ok:false,error:'Method not allowed'},405);
  try{
    const jwt=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'').trim();if(!jwt)return json({ok:false,code:'AUTH_REQUIRED',error:'Admin authentication required'},401);if(!await isAdmin(jwt))return json({ok:false,code:'ADMIN_REQUIRED',error:'Admin access required'},403);
    const p=await req.json().catch(()=>({})),audience=['all','students','selected'].includes(p?.audience)?p.audience:'all',channels=Array.isArray(p?.channels)?p.channels.map((x:any)=>clean(x,20)):['push','inbox'],route=clean(p?.target_route||'home',80),recipients=(Array.isArray(p?.recipients)?p.recipients:[]).slice(0,1000) as Recipient[],userIds=[...new Set(recipients.map(r=>clean(r.user_id,80)).filter(Boolean))],emails=[...new Set(recipients.map(r=>clean(r.email,320).toLowerCase()).filter(Boolean))],c:Copy={title_fa:clean(p?.title_fa,300),body_fa:clean(p?.body_fa),title_en:clean(p?.title_en,300),body_en:clean(p?.body_en),title_hr:clean(p?.title_hr,300),body_hr:clean(p?.body_hr)};
    if(!text(c,'en','title')||!text(c,'en','body'))return json({ok:false,code:'INVALID_COPY',error:'Title and body are required'},400);
    if(audience!=='all'&&!recipients.length)return json({ok:false,code:'NO_RECIPIENTS',error:'At least one account-linked recipient is required'},400);
    const initial=await service('/rest/v1/nh7_admin_campaigns_v360',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({audience,channels,title_fa:c.title_fa||'',body_fa:c.body_fa||'',title_en:c.title_en||'',body_en:c.body_en||'',title_hr:c.title_hr||'',body_hr:c.body_hr||'',target_user_ids:userIds,target_emails:emails,target_route:route,recipient_count:audience==='all'?0:recipients.length,status:'sending'})}),row=Array.isArray(initial)?initial[0]:initial,id=clean(row?.id,80);
    let oneSignalId='',errors:string[]=[];
    if(channels.includes('push'))try{const out=await push(c,audience,userIds,route);oneSignalId=clean(out?.id,320)}catch(e){errors.push(clean(e instanceof Error?e.message:e,1200))}
    if(channels.includes('inbox'))try{if(audience==='all')await saveGlobalInbox(id,c);else await saveSelectedInbox(id,c,recipients)}catch(e){errors.push(clean(e instanceof Error?e.message:e,1200))}
    const deliveredAny=Boolean(oneSignalId)||channels.includes('inbox');const status=errors.length?(deliveredAny?'partial':'failed'):'sent';
    await service(`/rest/v1/nh7_admin_campaigns_v360?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status,onesignal_id:oneSignalId,error_message:errors.join(' | '),sent_at:new Date().toISOString()})});
    return json({ok:status!=='failed',id,status,onesignal_id:oneSignalId,errors})
  }catch(e){return json({ok:false,error:clean(e instanceof Error?e.message:e,2000)},500)}
});
