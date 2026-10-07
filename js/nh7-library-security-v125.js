/* Library-only authorization freshness. Persistent snapshots contain public metadata only. */
(()=>{'use strict';
const URL='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION='nh7_user_session_v170', CACHE='nh7_library_public_v125_', TTL=10*60*1000;
const fetchNetwork=window.fetch.bind(window);
let identity='',generation=0,bundle={items:[],collections:[]},checkedAt=0;
function session(){try{const s=JSON.parse(localStorage.getItem(SESSION)||'null');return s?.currentSession||s?.session||s}catch(_){return null}}
function uid(){const s=session();return localStorage.getItem('nh7_explicit_logout')==='1'||!s?.access_token?'':String(s.user?.id||'')}
function publicOnly(value){return{items:(value?.items||[]).filter(x=>x.audience==='public'),collections:(value?.collections||[]).filter(x=>x.audience==='public')}}
function emit(reason){window.dispatchEvent(new CustomEvent('nh7-library-security',{detail:{reason,uid:identity,bundle}}))}
function invalidate(reason='identity'){generation++;bundle={items:[],collections:[]};checkedAt=0;emit(reason)}
function sync(){const next=uid();if(next!==identity){identity=next;invalidate()}return identity}
function purgeLegacy(){for(const storage of [sessionStorage,localStorage]){for(const key of Object.keys(storage)){if(key==='nh7_library_catalog_cache_v1'||key.startsWith('nh7_library_collections_cache_v327_'))storage.removeItem(key);else if(key.startsWith('nh7_protected_catalog_v327_')){try{if(JSON.parse(storage.getItem(key))?.resource==='library')storage.removeItem(key)}catch(_){/* Unknown shared audio snapshots are not removed. */}}}}}
function readPublic(id){try{const v=JSON.parse(sessionStorage.getItem(CACHE+id)||'null');return v?.uid===id&&Date.now()-v.at<TTL?publicOnly(v):{items:[],collections:[]}}catch(_){return{items:[],collections:[]}}}
async function catalog(){
  const id=sync(),epoch=generation,accessToken=session()?.access_token;
  if(!id){invalidate('login_required');return bundle}
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try{
    if(!navigator.onLine)throw new Error('offline');
    const response=await fetchNetwork(URL+'/rest/v1/rpc/nh7_library_catalog_v396',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+accessToken,'Content-Type':'application/json'},body:'{}',cache:'no-store',signal:controller.signal});
    if(!response.ok)throw Object.assign(new Error('catalog_denied'),{status:response.status});
    const raw=await response.json(),value=Array.isArray(raw)?raw[0]:raw;
    if(value?.allowed===false)throw Object.assign(new Error('catalog_denied'),{status:403});
    if(sync()!==id||epoch!==generation)return{items:[],collections:[]};
    bundle={items:Array.isArray(value?.items)?value.items:[],collections:Array.isArray(value?.collections)?value.collections:[]};checkedAt=Date.now();
    try{sessionStorage.setItem(CACHE+id,JSON.stringify({uid:id,at:checkedAt,...publicOnly(bundle)}))}catch(_){}
    emit('verified');return bundle;
  }catch(error){
    if(sync()!==id||epoch!==generation)return{items:[],collections:[]};
    invalidate(error.status===401||error.status===403?'denied':'unverified');
    // Denial never resurrects any snapshot. Offline/transient fallback is public-only and UID-bound.
    if(error.status!==401&&error.status!==403){bundle=readPublic(id);emit('public_fallback')}
    return bundle;
  }finally{clearTimeout(timer)}
}
function libraryFile(raw){try{const u=new window.URL(raw,location.href);return u.origin===URL&&/^\/storage\/v1\/object\/(?:sign|authenticated|public)\/nh7-library\//.test(decodeURIComponent(u.pathname))}catch(_){return false}}
window.NH7LibrarySecurityV125={catalog,uid:()=>sync(),invalidate,sync,libraryFile};
purgeLegacy();sync();
window.addEventListener('storage',sync);window.addEventListener('nh7-library-auth-change',sync);
window.addEventListener('offline',()=>invalidate('offline'));
window.addEventListener('pageshow',()=>{sync();if(bundle.items.some(x=>x.audience!=='public'))catalog()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){sync();if(bundle.items.some(x=>x.audience!=='public'))catalog()}});
setInterval(()=>{sync();if(checkedAt&&Date.now()-checkedAt>35000)invalidate('expired')},1000);
setInterval(()=>{if(bundle.items.some(x=>x.audience!=='public'))catalog()},10000);
})();
