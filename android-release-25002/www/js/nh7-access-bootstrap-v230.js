/* New Hope 7 v3.2.7 — protected content with offline-safe access cache */
(()=>{'use strict';
const VERSION='3.2.7-offline-access';
const SUPABASE_URL='https://gpzcwffxnddhaeaogdyo.supabase.co';
const PUBLISHABLE_KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION_KEY='nh7_user_session_v170';
const LOGOUT_KEY='nh7_explicit_logout';
const STATUS_CACHE_KEY='nh7_content_access_status_v230';
const STATUS_LOCAL_PREFIX='nh7_content_access_offline_';
const CATALOG_PREFIX='nh7_protected_catalog_v327_';
const STATUS_TTL=5*60*1000;
const originalFetch=window.fetch.bind(window);

function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}}
function token(){const s=session();return localStorage.getItem(LOGOUT_KEY)==='1'?'':String(s?.access_token||'')}
function userEmail(){return String(session()?.user?.email||'').trim().toLowerCase()}
function deviceId(){let id=localStorage.getItem('nh7_device_id');if(!id){id='dev_'+(crypto.randomUUID?.()||Date.now()+'_'+Math.random().toString(36).slice(2));localStorage.setItem('nh7_device_id',id)}return id}
function language(){return localStorage.getItem('nh7_lang')||'en'}
function hash(value){let h=2166136261;for(let i=0;i<String(value).length;i++){h^=String(value).charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)}
function statusLocalKey(){return STATUS_LOCAL_PREFIX+hash(userEmail()||'guest')}
function parse(value){try{return JSON.parse(value||'null')}catch(_){return null}}
function cachedStatus(allowStale=!navigator.onLine){
  const sessionValue=parse(sessionStorage.getItem(STATUS_CACHE_KEY));
  const localValue=parse(localStorage.getItem(statusLocalKey()));
  const value=sessionValue||localValue;
  if(!value)return null;
  if(!allowStale&&Date.now()-Number(value.checked_at||0)>=STATUS_TTL)return null;
  if(value.user_email&&userEmail()&&String(value.user_email).toLowerCase()!==userEmail())return null;
  return value;
}
function saveStatus(value){
  const out=Object.assign({authenticated:false,approved:false,checked_at:Date.now(),user_email:userEmail()},value||{});
  sessionStorage.setItem(STATUS_CACHE_KEY,JSON.stringify(out));
  if(out.authenticated&&userEmail())localStorage.setItem(statusLocalKey(),JSON.stringify(out));
  window.dispatchEvent(new CustomEvent('nh7-access-status',{detail:out}));
  return out;
}
function clearStatus(){sessionStorage.removeItem(STATUS_CACHE_KEY)}
function catalogKey(resource,query=''){return CATALOG_PREFIX+hash([userEmail(),resource,query].join('|'))}
function readCatalog(resource,query=''){const value=parse(localStorage.getItem(catalogKey(resource,query)));return value&&Array.isArray(value.items)?value:null}
function saveCatalog(resource,query,items){const value={items:Array.isArray(items)?items:[],saved_at:Date.now(),user_email:userEmail(),resource,query};try{localStorage.setItem(catalogKey(resource,query),JSON.stringify(value))}catch(_){ }return value}

async function edge(name,payload={},requireAuth=true){
  const accessToken=token();
  if(requireAuth&&!accessToken){const error=new Error('login_required');error.code='login_required';throw error}
  if(!navigator.onLine){const error=new Error('offline');error.code='offline';throw error}
  const headers={'apikey':PUBLISHABLE_KEY,'Content-Type':'application/json','x-device-id':deviceId(),'x-user-email':userEmail()};
  if(accessToken)headers.Authorization='Bearer '+accessToken;
  const response=await originalFetch(`${SUPABASE_URL}/functions/v1/${name}`,{method:'POST',headers,cache:'no-store',body:JSON.stringify(payload||{})});
  const text=await response.text();let data={};
  try{data=text?JSON.parse(text):{}}catch(_){data={error:text||response.statusText}}
  if(!response.ok){const error=new Error(data.error||data.message||response.statusText);error.code=data.code||'';error.status=response.status;throw error}
  return data;
}

async function checkStatus(force=false){
  const hit=!force&&cachedStatus(!navigator.onLine);if(hit)return hit;
  if(!token())return saveStatus({authenticated:false,approved:false,reason:'login_required'});
  if(!navigator.onLine){
    const stale=cachedStatus(true);
    return stale||{authenticated:true,approved:false,offline:true,reason:'offline_not_verified',checked_at:Date.now(),user_email:userEmail()};
  }
  try{return saveStatus(await edge('nh7-content-access',{action:'status',language:language()},true))}
  catch(error){
    const stale=cachedStatus(true);
    if(stale)return Object.assign({},stale,{offline:error.code==='offline',reason:error.code||error.message});
    return saveStatus({authenticated:!!token(),approved:false,reason:error.code||error.message||'access_check_failed'});
  }
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
function jsonResponse(body,status=200,extra={}){return new Response(JSON.stringify(body),{status,headers:Object.assign({'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store'},extra)})}
async function protectedCatalog(url,resource){
  if(!token())return jsonResponse({message:'Registration and approved school access are required.',code:'login_required'},401);
  const query=url.searchParams.toString(),stored=readCatalog(resource,query);
  if(!navigator.onLine){
    if(stored)return jsonResponse(stored.items,200,{'X-NH7-Offline':'1'});
    return jsonResponse({message:'This catalogue has not been saved on this device.',code:'offline_not_cached'},503);
  }
  try{
    const data=await edge('nh7-content-access',{action:'catalog',resource,query,language:language()},true);
    const items=Array.isArray(data.items)?data.items:[];
    saveCatalog(resource,query,items);
    saveStatus({authenticated:true,approved:true,user_email:data.user_email||userEmail()});
    return jsonResponse(items);
  }catch(error){
    if(stored)return jsonResponse(stored.items,200,{'X-NH7-Offline':'1'});
    if(error.code!=='offline')saveStatus({authenticated:!!token(),approved:false,reason:error.code||error.message});
    return jsonResponse({message:error.message||'Access denied',code:error.code||'access_denied'},error.status||503);
  }
}

window.fetch=async function nh7ProtectedFetch(input,init={}){
  let requestUrl='';
  try{requestUrl=typeof input==='string'?input:(input instanceof URL?input.href:input.url)}catch(_){return originalFetch(input,init)}
  let url;try{url=new URL(requestUrl,location.href)}catch(_){return originalFetch(input,init)}
  const protectedTarget=protectedRest(url);
  const method=String(init?.method||(input instanceof Request?input.method:'GET')||'GET').toUpperCase();
  if(protectedTarget&&method==='GET')return protectedCatalog(url,protectedTarget.resource);
  if(url.origin===SUPABASE_URL&&/^\/functions\/v1\/(nh7-library-access|nh7-content-access)$/.test(url.pathname)){
    if(!navigator.onLine)throw Object.assign(new TypeError('Offline'),{code:'offline'});
    const headers=new Headers(input instanceof Request?input.headers:undefined);
    new Headers(init?.headers||{}).forEach((value,key)=>headers.set(key,value));
    headers.set('apikey',PUBLISHABLE_KEY);headers.set('x-device-id',deviceId());headers.set('x-user-email',userEmail());
    if(token())headers.set('Authorization','Bearer '+token());
    return originalFetch(input,Object.assign({},init,{headers,cache:'no-store'}));
  }
  return originalFetch(input,init);
};

window.addEventListener('storage',event=>{if(event.key===SESSION_KEY||event.key===LOGOUT_KEY)clearStatus()});
window.NH7AccessV230={VERSION,session,token,userEmail,deviceId,language,edge,checkStatus,cachedStatus,clearStatus,isApproved:()=>!!cachedStatus(true)?.approved};
checkStatus(false).catch(()=>{});
})();
