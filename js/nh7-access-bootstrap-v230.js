/* New Hope 7 v2.3.0 — protected-content bootstrap
   Loads before app.js. It prevents direct REST catalogue access, injects the
   authenticated JWT into protected Edge Function calls, and exposes one
   shared access-status API for the UI enhancement layer. */
(()=>{'use strict';
const VERSION='2.3.0';
const SUPABASE_URL='https://gpzcwffxnddhaeaogdyo.supabase.co';
const PUBLISHABLE_KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION_KEY='nh7_user_session_v170';
const LOGOUT_KEY='nh7_explicit_logout';
const STATUS_CACHE_KEY='nh7_content_access_status_v230';
const STATUS_TTL=5*60*1000;
const originalFetch=window.fetch.bind(window);

function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}}
function token(){const s=session();return localStorage.getItem(LOGOUT_KEY)==='1'?'':String(s?.access_token||'')}
function userEmail(){return String(session()?.user?.email||'').trim().toLowerCase()}
function deviceId(){let id=localStorage.getItem('nh7_device_id');if(!id){id='dev_'+(crypto.randomUUID?.()||Date.now()+'_'+Math.random().toString(36).slice(2));localStorage.setItem('nh7_device_id',id)}return id}
function language(){return localStorage.getItem('nh7_lang')||'en'}
function cachedStatus(){try{const v=JSON.parse(sessionStorage.getItem(STATUS_CACHE_KEY)||'null');return v&&Date.now()-Number(v.checked_at||0)<STATUS_TTL?v:null}catch(_){return null}}
function saveStatus(v){const out=Object.assign({authenticated:false,approved:false,checked_at:Date.now()},v||{});sessionStorage.setItem(STATUS_CACHE_KEY,JSON.stringify(out));window.dispatchEvent(new CustomEvent('nh7-access-status',{detail:out}));return out}
function clearStatus(){sessionStorage.removeItem(STATUS_CACHE_KEY)}

async function edge(name,payload={},requireAuth=true){
  const accessToken=token();
  if(requireAuth&&!accessToken){const e=new Error('login_required');e.code='login_required';throw e}
  const headers={
    'apikey':PUBLISHABLE_KEY,
    'Content-Type':'application/json',
    'x-device-id':deviceId(),
    'x-user-email':userEmail()
  };
  if(accessToken)headers.Authorization='Bearer '+accessToken;
  const response=await originalFetch(`${SUPABASE_URL}/functions/v1/${name}`,{
    method:'POST',headers,cache:'no-store',body:JSON.stringify(payload||{})
  });
  const text=await response.text();let data={};
  try{data=text?JSON.parse(text):{}}catch(_){data={error:text||response.statusText}}
  if(!response.ok){const e=new Error(data.error||data.message||response.statusText);e.code=data.code||'';e.status=response.status;throw e}
  return data;
}

async function checkStatus(force=false){
  const hit=!force&&cachedStatus();if(hit)return hit;
  if(!token())return saveStatus({authenticated:false,approved:false,reason:'login_required'});
  try{return saveStatus(await edge('nh7-content-access',{action:'status',language:language()},true))}
  catch(error){return saveStatus({authenticated:!!token(),approved:false,reason:error.code||error.message||'access_check_failed'})}
}

const protectedTables=new Map([
  ['sermons','sermons'],
  ['audio_bible_books_v220','audio_bible_books'],
  ['audio_bible_chapters_v220','audio_bible_chapters'],
  ['nh7_library_items_v222','library'],
  ['nh7_library_items_v224','library']
]);
function protectedRest(url){
  if(url.origin!==SUPABASE_URL||!url.pathname.includes('/rest/v1/'))return null;
  const table=decodeURIComponent(url.pathname.split('/rest/v1/')[1]||'').split('/')[0];
  const resource=protectedTables.get(table);return resource?{table,resource}:null;
}
function jsonResponse(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}
async function protectedCatalog(url,resource){
  if(!token())return jsonResponse({message:'Registration and approved school access are required.',code:'login_required'},401);
  try{
    const data=await edge('nh7-content-access',{action:'catalog',resource,query:url.searchParams.toString(),language:language()},true);
    saveStatus({authenticated:true,approved:true,user_email:data.user_email||userEmail()});
    return jsonResponse(Array.isArray(data.items)?data.items:[]);
  }catch(error){
    saveStatus({authenticated:!!token(),approved:false,reason:error.code||error.message});
    return jsonResponse({message:error.message||'Access denied',code:error.code||'access_denied'},error.status||403);
  }
}

window.fetch=async function nh7ProtectedFetch(input,init={}){
  let requestUrl='';
  try{requestUrl=typeof input==='string'?input:(input instanceof URL?input.href:input.url)}catch(_){return originalFetch(input,init)}
  let url;try{url=new URL(requestUrl,location.href)}catch(_){return originalFetch(input,init)}

  const protectedTarget=protectedRest(url);
  const method=String(init?.method||(input instanceof Request?input.method:'GET')||'GET').toUpperCase();
  if(protectedTarget&&method==='GET')return protectedCatalog(url,protectedTarget.resource);

  /* Current app.js invokes Edge Functions without Authorization. Add the
     verified account JWT only for the two protected access functions. */
  if(url.origin===SUPABASE_URL&&/^\/functions\/v1\/(nh7-library-access|nh7-content-access)$/.test(url.pathname)){
    const headers=new Headers(input instanceof Request?input.headers:undefined);
    new Headers(init?.headers||{}).forEach((v,k)=>headers.set(k,v));
    headers.set('apikey',PUBLISHABLE_KEY);
    headers.set('x-device-id',deviceId());
    headers.set('x-user-email',userEmail());
    if(token())headers.set('Authorization','Bearer '+token());
    return originalFetch(input,Object.assign({},init,{headers,cache:'no-store'}));
  }
  return originalFetch(input,init);
};

window.addEventListener('storage',event=>{if(event.key===SESSION_KEY||event.key===LOGOUT_KEY)clearStatus()});
window.NH7AccessV230={VERSION,session,token,userEmail,deviceId,language,edge,checkStatus,cachedStatus,clearStatus,isApproved:()=>!!cachedStatus()?.approved};
checkStatus(false).catch(()=>{});
})();