/* New Hope 7 v3.2.7 — multilingual in-app books with offline reader cache */
(()=>{'use strict';
const VERSION='3.2.7-library-reader-offline';
const CACHE='nh7reader-offline-v327';
const SESSION='nh7_user_session_v170';
if(window.fetch?.__nh7LibraryLanguageV327)return;
const original=window.fetch.bind(window);
function email(){try{return String(JSON.parse(localStorage.getItem(SESSION)||'null')?.user?.email||'').trim().toLowerCase()}catch(_){return''}}
function hash(value){let h=2166136261;for(let i=0;i<String(value).length;i++){h^=String(value).charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)}
function cacheRequest(body){const id=[email(),body?.p_item_id||'',body?.p_language||'fa'].join('|');return new Request(new URL(`__nh7_reader_cache_v327__/${hash(id)}`,location.href).href)}
async function cached(body){if(!('caches'in window))return null;try{return await (await caches.open(CACHE)).match(cacheRequest(body))}catch(_){return null}}
async function store(body,response){if(!('caches'in window)||!response?.ok)return;try{await (await caches.open(CACHE)).put(cacheRequest(body),response.clone())}catch(_){}}
const wrapped=async function(input,init={}){
  try{
    const raw=typeof input==='string'?input:input?.url||'';
    if(raw.includes('/rest/v1/rpc/nh7_library_reader_access_v250')||raw.includes('/rest/v1/rpc/nh7_library_reader_access_v321')){
      const url=raw.replace('/nh7_library_reader_access_v250','/nh7_library_reader_access_v321');
      const next=Object.assign({},init||{});let body={};
      try{body=JSON.parse(String(next.body||'{}'))||{}}catch(_){body={}}
      const language=localStorage.getItem('nh7_lang')||document.documentElement.lang||'fa';
      body.p_language=['fa','en','hr'].includes(language)?language:'fa';next.body=JSON.stringify(body);
      if(!navigator.onLine){const hit=await cached(body);if(hit)return hit.clone()}
      try{const response=await original(url,next);if(response.ok)await store(body,response);else{const hit=await cached(body);if(hit)return hit.clone()}return response}
      catch(error){const hit=await cached(body);if(hit)return hit.clone();throw error}
    }
  }catch(error){console.warn('Library language/offline routing',error);throw error}
  return original(input,init);
};
wrapped.__nh7LibraryLanguageV321=true;wrapped.__nh7LibraryLanguageV327=true;window.fetch=wrapped;window.NH7_LIBRARY_LANGUAGE_VERSION=VERSION;
})();
