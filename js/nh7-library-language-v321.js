/* Library language routing: live UID-scoped authorization, no persisted reader bodies (#125). */
(()=>{'use strict';
const VERSION='125-library-reader-fresh';
if(window.fetch?.__nh7LibraryLanguageV125)return;
const original=window.fetch.bind(window);
// This cache contained full reader text, keyed by email instead of UID/grant.
if('caches'in window)caches.delete('nh7reader-offline-v327').catch(()=>{});
const wrapped=async function(input,init={}){
  const raw=typeof input==='string'?input:input?.url||'';
  if(!/\/rest\/v1\/rpc\/nh7_library_reader_access_v(?:250|321)(?:$|\?)/.test(raw))return original(input,init);
  const next={...init,cache:'no-store'};
  let body={};try{body=JSON.parse(String(next.body||'{}'))||{}}catch(_){}
  const language=localStorage.getItem('nh7_lang')||document.documentElement.lang||'fa';
  body.p_language=['fa','en','hr'].includes(language)?language:'fa';next.body=JSON.stringify(body);
  const security=window.NH7LibrarySecurityV125,owner=security?.uid();
  const catalog=await security?.catalog();
  if(!owner||!navigator.onLine||owner!==security?.uid()||!catalog?.items.some(row=>String(row.id)===String(body.p_item_id)))return new Response(JSON.stringify({allowed:false,code:'content_access_required'}),{status:403,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store'}});
  // Preserve the deployed language-aware wire contract; v372 signature/alias must be verified before deployment.
  const response=await original(raw.replace('/nh7_library_reader_access_v250','/nh7_library_reader_access_v321'),next);
  if(!response.ok)security.invalidate('reader_denied');
  return response;
};
wrapped.__nh7LibraryLanguageV125=true;wrapped.__nh7LibraryLanguageV321=true;window.fetch=wrapped;window.NH7_LIBRARY_LANGUAGE_VERSION=VERSION;
})();
