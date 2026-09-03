/* New Hope 7 v4.2.3 — live dynamic sermon catalogue with offline fallback.
   Online category/sermon reads are network-first; stale cache is used only when offline
   or when the server is temporarily unavailable. Expired user sessions are refreshed once. */
(()=>{'use strict';
const VERSION='4.2.3-audio-live-catalogue';
const SUPABASE='https://gpzcwffxnddhaeaogdyo.supabase.co';
const PUBLISHABLE='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const CACHE='nh7-audio-route-v423';
const SESSION_KEY='nh7_user_session_v170';
const LOGOUT_KEY='nh7_explicit_logout';
const baseFetch=window.fetch.bind(window);
const pending=new Map();
let authRefresh=null;
function parse(value,fallback=null){try{return JSON.parse(value||'')??fallback}catch(_){return fallback}}
function session(){return parse(localStorage.getItem(SESSION_KEY),null)}
function saveSession(value){if(value?.access_token){localStorage.setItem(SESSION_KEY,JSON.stringify(value));localStorage.removeItem(LOGOUT_KEY);window.dispatchEvent(new CustomEvent('nh7-session-refreshed',{detail:{email:String(value?.user?.email||'').toLowerCase()}}));return true}return false}
function email(){return String(session()?.user?.email||localStorage.getItem('nh7_manual_email')||'').trim().toLowerCase()}
function signedIn(){return localStorage.getItem(LOGOUT_KEY)!=='1'&&!!session()?.access_token}
function schoolAccess(){return parse(localStorage.getItem('nh7_school_access'),{})||{}}
function locallyApproved(){
  if(!signedIn())return false;
  const row=schoolAccess(),status=String(row.status||'').toLowerCase();
  if(status==='approved'||row.approved===true||String(row.approvedBy||'').toLowerCase()==='admin')return true;
  const current=email(),candidates=[];
  try{candidates.push(parse(sessionStorage.getItem('nh7_content_access_status_v230'),null))}catch(_){}
  for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith('nh7_content_access_offline_'))candidates.push(parse(localStorage.getItem(key),null))}
  return candidates.some(value=>value?.approved===true&&(!value.user_email||!current||String(value.user_email).toLowerCase()===current));
}
function urlOf(input){try{return new URL(typeof input==='string'?input:input instanceof URL?input.href:input?.url||'',location.href)}catch(_){return null}}
function methodOf(input,init){return String(init?.method||(input instanceof Request?input.method:'GET')||'GET').toUpperCase()}
function bodyOf(input,init){if(typeof init?.body==='string')return init.body;if(input instanceof Request&&typeof input._bodyInit==='string')return input._bodyInit;return''}
function jsonBody(input,init){return parse(bodyOf(input,init),{})||{}}
function response(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-NH7-Audio-Live':'4.2.3'}})}
function hash(value){let h=2166136261;for(let i=0;i<String(value).length;i++){h^=String(value).charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)}
function cacheKey(kind,identity){return new Request(new URL(`__nh7_audio_route_v423__/${kind}-${hash((email()||'guest')+'|'+identity)}`,location.href).href)}
async function cached(key){try{return await (await caches.open(CACHE)).match(key)}catch(_){return null}}
async function save(key,value){if(!value?.ok)return;try{await (await caches.open(CACHE)).put(key,value.clone())}catch(error){console.warn('NH7 live audio cache save',error)}}
function timeoutFetch(input,init={},ms=10000){
  const controller=new AbortController();let cleanup=()=>{};
  if(init?.signal){const source=init.signal;if(source.aborted)controller.abort(source.reason);else{const forward=()=>controller.abort(source.reason);source.addEventListener('abort',forward,{once:true});cleanup=()=>source.removeEventListener('abort',forward)}}
  const timer=setTimeout(()=>controller.abort(new DOMException('Audio catalogue request timed out','TimeoutError')),ms);
  return baseFetch(input,Object.assign({},init,{signal:controller.signal,cache:'no-store'})).finally(()=>{clearTimeout(timer);cleanup()});
}
function currentHeaders(input,init={}){
  const headers=new Headers(input instanceof Request?input.headers:undefined);
  new Headers(init?.headers||{}).forEach((value,key)=>headers.set(key,value));
  headers.set('apikey',PUBLISHABLE);
  const access=String(session()?.access_token||'');
  if(access)headers.set('Authorization','Bearer '+access);else headers.delete('Authorization');
  return headers;
}
async function refreshSession(){
  if(authRefresh)return authRefresh;
  const current=session();if(!current?.refresh_token)return false;
  authRefresh=(async()=>{
    try{
      const result=await baseFetch(`${SUPABASE}/auth/v1/token?grant_type=refresh_token`,{method:'POST',cache:'no-store',headers:{apikey:PUBLISHABLE,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:current.refresh_token})});
      const text=await result.text();let data={};try{data=text?JSON.parse(text):{}}catch(_){data={}}
      if(!result.ok){if(result.status===400||result.status===401){localStorage.removeItem(SESSION_KEY);sessionStorage.removeItem('nh7_content_access_status_v230')}return false}
      return saveSession(data);
    }catch(error){console.warn('NH7 audio session refresh',error);return false}
  })().finally(()=>{authRefresh=null});
  return authRefresh;
}
async function freshRequest(input,init={},ms=10000){
  let requestInit=Object.assign({},init,{headers:currentHeaders(input,init),cache:'no-store'});
  let result=await timeoutFetch(input,requestInit,ms);
  if(result?.status===401&&await refreshSession()){
    requestInit=Object.assign({},init,{headers:currentHeaders(input,init),cache:'no-store'});
    result=await timeoutFetch(input,requestInit,ms);
  }
  return result;
}
function registrationResponse(){const local=schoolAccess(),user=email()||String(local.email||'').trim().toLowerCase();return response({found:true,approved:true,status:'approved',email:user,user_email:user,registration_id:local.cloudId||local.registration_id||local.id||'',payload:Object.assign({},local,{email:user,status:'approved'})})}
function statusResponse(){return response({authenticated:true,approved:true,user_email:email(),reason:'approved_local_cache',checked_at:Date.now()})}
function isRegistrationRpc(url){return url?.origin===SUPABASE&&/\/rest\/v1\/rpc\/(?:nh7_registration_access_v2|nh7_registration_status)$/.test(url.pathname)}
function isCategoryGet(url,method){return method==='GET'&&url?.origin===SUPABASE&&/\/rest\/v1\/sermon_categories$/.test(url.pathname)}
function isContentEdge(url,method){return method==='POST'&&url?.origin===SUPABASE&&url.pathname==='/functions/v1/nh7-content-access'}
async function networkFirst(key,input,init,{fallback,status=200,timeout=10000}={}){
  const hit=await cached(key);
  if(!navigator.onLine)return hit?hit.clone():response(fallback,status);
  try{
    const value=await freshRequest(input,init,timeout);
    if(value?.ok){await save(key,value);return value}
    if(value&&(value.status===401||value.status===403))return value;
    if(value&&value.status>=500&&hit)return hit.clone();
    return value;
  }catch(error){
    console.warn('NH7 live audio catalogue request',error);
    return hit?hit.clone():response(fallback,status);
  }
}
window.fetch=async function nh7AudioLiveFetch(input,init={}){
  const url=urlOf(input),method=methodOf(input,init);
  if(locallyApproved()&&isRegistrationRpc(url)){const payload=jsonBody(input,init);if(String(payload.p_type||'school').toLowerCase()==='school')return registrationResponse()}
  if(isCategoryGet(url,method)){
    const key=cacheKey('categories',url.pathname+'?'+url.searchParams.toString());
    return networkFirst(key,input,init,{fallback:[],status:200,timeout:10000});
  }
  if(isContentEdge(url,method)){
    const payload=jsonBody(input,init),action=String(payload.action||'');
    if(action==='status'){
      if(locallyApproved())return statusResponse();
      return networkFirst(cacheKey('status',email()),input,init,{fallback:{authenticated:signedIn(),approved:false,reason:'access_check_unavailable'},status:503,timeout:8000});
    }
    if(action==='catalog'&&String(payload.resource||'')==='sermons'){
      const identity=JSON.stringify({resource:'sermons',query:payload.query||'',language:payload.language||'',email:email()});
      return networkFirst(cacheKey('sermons',identity),input,init,{fallback:{items:[],user_email:email(),offline:!navigator.onLine},status:navigator.onLine?503:200,timeout:12000});
    }
  }
  return baseFetch(input,init);
};
function isAudioTrigger(target){const node=target?.closest?.('[data-go],[data-route]');return String(node?.dataset?.go||node?.dataset?.route||'')==='audio'}
function loadingView(){const root=document.getElementById('view');if(!root)return false;const text=String(root.textContent||'').trim().toLowerCase();return text==='...'||text==='loading...'||text==='در حال بارگذاری…'||text==='در حال بارگذاری...'}
document.addEventListener('click',event=>{
  if(!isAudioTrigger(event.target))return;
  const started=Date.now();
  setTimeout(()=>{
    if(Date.now()-started<12500||!loadingView())return;
    const root=document.getElementById('view');if(!root)return;
    const fa=(localStorage.getItem('nh7_lang')||'en')==='fa',hr=(localStorage.getItem('nh7_lang')||'en')==='hr';
    root.innerHTML=`<section class="card"><h2>🎧 ${fa?'پیام‌های صوتی':hr?'Audio poruke':'Audio Messages'}</h2><p>${fa?'دریافت فهرست صوتی طول کشید. دوباره تلاش کنید یا به بخش دیگری برگردید.':hr?'Učitavanje audio popisa traje predugo. Pokušajte ponovno ili se vratite.':'The audio list is taking too long to load. Try again or go back.'}</p><div class="button-row"><button class="primary-btn" data-nh7-audio-retry>${fa?'تلاش دوباره':hr?'Pokušaj ponovno':'Try again'}</button><button class="secondary-btn" data-nh7-audio-back>${fa?'بازگشت':hr?'Natrag':'Back'}</button></div></section>`;
    root.querySelector('[data-nh7-audio-retry]')?.addEventListener('click',()=>document.querySelector('[data-go="audio"]')?.click());
    root.querySelector('[data-nh7-audio-back]')?.addEventListener('click',()=>document.querySelector('[data-route="more"]')?.click());
  },13000);
},true);
window.NH7_AUDIO_ROUTE_STABILITY_VERSION=VERSION;
})();
