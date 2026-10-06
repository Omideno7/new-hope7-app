/* New Hope 7 v6.0.0 — Ministers Library client access hardening.
 * Client-side gate only; Supabase/RPC/Storage remain the authoritative security boundary.
 */
(()=>{'use strict';
if(window.__NH7_MINISTER_LIBRARY_ACCESS_V600__)return;
window.__NH7_MINISTER_LIBRARY_ACCESS_V600__=true;

const VERSION='6.0.0-minister-library-access';
const URL='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION_KEY='nh7_user_session_v170';
const TAB_KEY='nh7_library_tab';
const COLLECTION_CACHE_PREFIX='nh7_library_collections_cache_v327_';
const LEGACY_CATALOG_CACHE='nh7_library_catalog_cache_v1';
const LEGACY_MINISTER_CODE='nh7_minister_library_code';
const ACCESS_TTL=15000;

let access={checkedAt:0,allowed:false,admin:false,checking:false};
let redirecting=false;
let enforceTimer=0;

function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}}
function token(){return String(session()?.access_token||'')}
function headers(){return{apikey:KEY,Authorization:'Bearer '+token(),'Content-Type':'application/json'}}

function sanitizeCollectionCacheValue(raw){
  try{
    const value=JSON.parse(raw||'null');
    if(!value||typeof value!=='object')return null;
    if(Array.isArray(value.collections))value.collections=value.collections.filter(row=>String(row?.audience||'public')!=='ministers');
    if(Array.isArray(value.items))value.items=value.items.filter(row=>String(row?.access_kind||row?.audience||'public')!=='ministers');
    value.saved_at=Date.now();
    return JSON.stringify(value);
  }catch(_){return null}
}

function purgeRestrictedCache(){
  try{
    sessionStorage.removeItem(LEGACY_CATALOG_CACHE);
    sessionStorage.setItem(TAB_KEY,'public');
  }catch(_){}
  try{localStorage.removeItem(LEGACY_MINISTER_CODE)}catch(_){}
  try{
    const updates=[];
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      if(key&&key.startsWith(COLLECTION_CACHE_PREFIX))updates.push(key);
    }
    updates.forEach(key=>{
      const safe=sanitizeCollectionCacheValue(localStorage.getItem(key));
      if(safe)localStorage.setItem(key,safe);else localStorage.removeItem(key);
    });
  }catch(_){}
}

function ministerButtons(){return Array.from(document.querySelectorAll('[data-library-tab="ministers"]'))}
function publicButton(){return document.querySelector('[data-library-tab="public"]')}

function enforceDom(){
  clearTimeout(enforceTimer);
  enforceTimer=setTimeout(()=>{
    ministerButtons().forEach(btn=>{
      if(access.allowed){
        btn.hidden=false;
        btn.disabled=false;
        btn.removeAttribute('aria-hidden');
        btn.removeAttribute('aria-disabled');
        btn.dataset.nh7LibraryAuthorized='1';
      }else{
        btn.hidden=true;
        btn.disabled=true;
        btn.setAttribute('aria-hidden','true');
        btn.setAttribute('aria-disabled','true');
        btn.dataset.nh7LibraryAuthorized='0';
      }
    });

    let current='public';
    try{current=sessionStorage.getItem(TAB_KEY)||'public'}catch(_){}
    if(!access.allowed&&current==='ministers'){
      purgeRestrictedCache();
      ministerButtons().forEach(btn=>btn.classList.remove('active'));
      const pub=publicButton();
      pub?.classList.add('active');
      if(pub&&!redirecting){
        redirecting=true;
        setTimeout(()=>{try{pub.click()}finally{redirecting=false}},0);
      }
    }
  },0);
}

function deny(){
  access.allowed=false;
  access.admin=false;
  access.checkedAt=Date.now();
  purgeRestrictedCache();
  enforceDom();
  window.dispatchEvent(new CustomEvent('nh7-minister-library-access',{detail:{allowed:false,admin:false}}));
  return false;
}

async function refreshAccess(force=false){
  if(access.checking)return access.allowed;
  if(!token())return deny();
  if(!navigator.onLine)return deny();
  if(!force&&Date.now()-access.checkedAt<ACCESS_TTL){enforceDom();return access.allowed}

  access.checking=true;
  try{
    const response=await fetch(`${URL}/rest/v1/rpc/nh7_my_content_access_v251`,{
      method:'POST',headers:headers(),body:'{}',cache:'no-store'
    });
    if(!response.ok)throw new Error('access '+response.status);
    const raw=await response.json();
    const value=Array.isArray(raw)?(raw[0]||{}):(raw||{});
    access.admin=!!value.admin;
    access.allowed=!!(value.admin||value.library_any);
    access.checkedAt=Date.now();
    if(!access.allowed)purgeRestrictedCache();
    enforceDom();
    window.dispatchEvent(new CustomEvent('nh7-minister-library-access',{detail:{allowed:access.allowed,admin:access.admin}}));
    return access.allowed;
  }catch(error){
    console.warn('Ministers Library access check failed; default deny.',error);
    return deny();
  }finally{access.checking=false}
}

// Block the visible Ministers tab before app-level click handlers run.
document.addEventListener('click',event=>{
  const button=event.target?.closest?.('[data-library-tab="ministers"]');
  if(!button)return;
  if(access.allowed)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  purgeRestrictedCache();
  enforceDom();
  refreshAccess(true);
},true);

// The app rebuilds Library DOM frequently, so keep the gate applied to new nodes.
const observer=new MutationObserver(enforceDom);
observer.observe(document.documentElement,{childList:true,subtree:true});

// Revalidate when returning to the app/network so revocations take effect promptly.
addEventListener('focus',()=>refreshAccess(true),{passive:true});
addEventListener('online',()=>refreshAccess(true),{passive:true});
addEventListener('pageshow',()=>refreshAccess(true),{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshAccess(true)});
window.addEventListener('storage',event=>{
  if(event.key===SESSION_KEY){access.checkedAt=0;refreshAccess(true)}
});

window.NH7MinisterLibraryAccessV600={
  version:VERSION,
  refresh:()=>refreshAccess(true),
  canAccess:()=>!!access.allowed,
  isAdmin:()=>!!access.admin
};

// Default-deny immediately, then ask the server for the authenticated user's entitlement.
enforceDom();
setTimeout(()=>refreshAccess(true),60);
})();
