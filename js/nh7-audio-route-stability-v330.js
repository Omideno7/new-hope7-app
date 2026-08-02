/* New Hope 7 v3.3.0 — non-blocking audio catalogue and approved-access recovery */
(()=>{'use strict';
const VERSION='3.3.0-audio-route-stability';
const SUPABASE='https://gpzcwffxnddhaeaogdyo.supabase.co';
const CACHE='nh7-audio-route-v330';
const SESSION_KEY='nh7_user_session_v170';
const LOGOUT_KEY='nh7_explicit_logout';
const baseFetch=window.fetch.bind(window);
const pending=new Map();
function parse(value,fallback=null){try{return JSON.parse(value||'')??fallback}catch(_){return fallback}}
function session(){return parse(localStorage.getItem(SESSION_KEY),null)}
function email(){return String(session()?.user?.email||localStorage.getItem('nh7_manual_email')||'').trim().toLowerCase()}
function signedIn(){return localStorage.getItem(LOGOUT_KEY)!=='1'&&!!session()?.access_token}
function schoolAccess(){return parse(localStorage.getItem('nh7_school_access'),{})||{}}
function locallyApproved(){const row=schoolAccess(),status=String(row.status||'').toLowerCase();return signedIn()&&(status==='approved'||row.approved===true||String(row.approvedBy||'').toLowerCase()==='admin')}
function urlOf(input){try{return new URL(typeof input==='string'?input:input instanceof URL?input.href:input?.url||'',location.href)}catch(_){return null}}
function methodOf(input,init){return String(init?.method||(input instanceof Request?input.method:'GET')||'GET').toUpperCase()}
function bodyOf(input,init){if(typeof init?.body==='string')return init.body;if(input instanceof Request&&typeof input._bodyInit==='string')return input._bodyInit;return''}
function jsonBody(input,init){return parse(bodyOf(input,init),{})||{}}
function response(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-NH7-Audio-Stability':'1'}})}
function hash(value){let h=2166136261;for(let i=0;i<String(value).length;i++){h^=String(value).charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)}
function cacheKey(kind,identity){return new Request(new URL(`__nh7_audio_route_v330__/${kind}-${hash((email()||'guest')+'|'+identity)}`,location.href).href)}
async function cached(key){try{return await (await caches.open(CACHE)).match(key)}catch(_){return null}}
async function save(key,value){if(!value?.ok)return;try{await (await caches.open(CACHE)).put(key,value.clone())}catch(error){console.warn('NH7 audio cache save',error)}}
function timeoutFetch(input,init={},ms=7500){
  const controller=new AbortController();let cleanup=()=>{};
  if(init?.signal){const source=init.signal;if(source.aborted)controller.abort(source.reason);else{const forward=()=>controller.abort(source.reason);source.addEventListener('abort',forward,{once:true});cleanup=()=>source.removeEventListener('abort',forward)}}
  const timer=setTimeout(()=>controller.abort(new DOMException('Audio request timed out','TimeoutError')),ms);
  return baseFetch(input,Object.assign({},init,{signal:controller.signal})).finally(()=>{clearTimeout(timer);cleanup()});
}
function registrationResponse(){const local=schoolAccess(),user=email()||String(local.email||'').trim().toLowerCase();return response({found:true,approved:true,status:'approved',email:user,user_email:user,registration_id:local.cloudId||local.registration_id||local.id||'',payload:Object.assign({},local,{email:user,status:'approved'})})}
function statusResponse(){return response({authenticated:true,approved:true,user_email:email(),reason:'approved_local_cache',checked_at:Date.now()})}
function isRegistrationRpc(url){return url?.origin===SUPABASE&&/\/rest\/v1\/rpc\/(?:nh7_registration_access_v2|nh7_registration_status)$/.test(url.pathname)}
function isCategoryGet(url,method){return method==='GET'&&url?.origin===SUPABASE&&/\/rest\/v1\/sermon_categories$/.test(url.pathname)}
function isContentEdge(url,method){return method==='POST'&&url?.origin===SUPABASE&&url.pathname==='/functions/v1/nh7-content-access'}
async function refresh(key,input,init,ms){
  const token=key.url;if(pending.has(token))return pending.get(token);
  const job=timeoutFetch(input,init,ms).then(async value=>{if(value?.ok)await save(key,value);return value}).finally(()=>pending.delete(token));pending.set(token,job);return job;
}
async function staleWhileRefresh(key,input,init,emptyFallback){
  const hit=await cached(key);
  if(hit){if(navigator.onLine)refresh(key,input,init,7000).catch(()=>{});return hit.clone()}
  if(!navigator.onLine)return response(emptyFallback,200);
  try{return await refresh(key,input,init,7000)}catch(error){console.warn('NH7 audio catalogue request',error);return response(emptyFallback,200)}
}
window.fetch=async function nh7AudioStableFetch(input,init={}){
  const url=urlOf(input),method=methodOf(input,init);
  if(locallyApproved()&&isRegistrationRpc(url))return registrationResponse();
  if(isCategoryGet(url,method)){
    const key=cacheKey('categories',url.pathname+'?'+url.searchParams.toString());
    return staleWhileRefresh(key,input,init,[]);
  }
  if(isContentEdge(url,method)){
    const payload=jsonBody(input,init),action=String(payload.action||'');
    if(action==='status'&&locallyApproved())return statusResponse();
    if(action==='catalog'&&String(payload.resource||'')==='sermons'){
      const identity=JSON.stringify({resource:'sermons',query:payload.query||'',language:payload.language||'',email:email()});
      const key=cacheKey('sermons',identity),hit=await cached(key);
      if(hit){if(navigator.onLine)refresh(key,input,init,7500).catch(()=>{});return hit.clone()}
      if(!navigator.onLine)return response({items:[],user_email:email(),offline:true},200);
      try{return await refresh(key,input,init,7500)}catch(error){console.warn('NH7 sermon catalogue request',error);return response({error:'audio_catalog_timeout',code:'audio_catalog_timeout'},503)}
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
    if(Date.now()-started<9500||!loadingView())return;
    const root=document.getElementById('view');if(!root)return;
    const fa=(localStorage.getItem('nh7_lang')||'en')==='fa',hr=(localStorage.getItem('nh7_lang')||'en')==='hr';
    root.innerHTML=`<section class="card"><h2>🎧 ${fa?'پیام‌های صوتی':hr?'Audio poruke':'Audio Messages'}</h2><p>${fa?'دریافت فهرست صوتی طول کشید. دوباره تلاش کنید یا به بخش دیگری برگردید.':hr?'Učitavanje audio popisa traje predugo. Pokušajte ponovno ili se vratite.':'The audio list is taking too long to load. Try again or go back.'}</p><div class="button-row"><button class="primary-btn" data-nh7-audio-retry>${fa?'تلاش دوباره':hr?'Pokušaj ponovno':'Try again'}</button><button class="secondary-btn" data-nh7-audio-back>${fa?'بازگشت':hr?'Natrag':'Back'}</button></div></section>`;
    root.querySelector('[data-nh7-audio-retry]')?.addEventListener('click',()=>document.querySelector('[data-go="audio"]')?.click());
    root.querySelector('[data-nh7-audio-back]')?.addEventListener('click',()=>document.querySelector('[data-route="more"]')?.click());
  },10000);
},true);
window.NH7_AUDIO_ROUTE_STABILITY_VERSION=VERSION;
})();
