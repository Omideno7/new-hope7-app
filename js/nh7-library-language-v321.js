/* New Hope 7 v3.2.1 — request the in-app book edition matching the app language */
(()=>{'use strict';
const VERSION='3.2.1-library-language';
if(window.fetch?.__nh7LibraryLanguageV321)return;
const original=window.fetch.bind(window);
const wrapped=async function(input,init){
  try{
    const raw=typeof input==='string'?input:input?.url||'';
    if(raw.includes('/rest/v1/rpc/nh7_library_reader_access_v250')){
      const url=raw.replace('/nh7_library_reader_access_v250','/nh7_library_reader_access_v321');
      const next=Object.assign({},init||{});
      let body={};
      try{body=JSON.parse(String(next.body||'{}'))||{}}catch(_){body={}}
      const language=localStorage.getItem('nh7_lang')||document.documentElement.lang||'fa';
      body.p_language=['fa','en','hr'].includes(language)?language:'fa';
      next.body=JSON.stringify(body);
      return original(url,next);
    }
  }catch(error){console.warn('Library language routing',error)}
  return original(input,init);
};
wrapped.__nh7LibraryLanguageV321=true;
window.fetch=wrapped;
window.NH7_LIBRARY_LANGUAGE_VERSION=VERSION;
})();
