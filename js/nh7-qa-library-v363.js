/* New Hope 7 QA v3.6.3 — admin-only unpublished library preview. */
(()=>{'use strict';
if(!window.NH7_QA_LIBRARY_V363||window.__NH7_QA_LIBRARY_V363__)return;
window.__NH7_QA_LIBRARY_V363__=true;
const previousFetch=window.fetch.bind(window);
const QA_CATALOG='nh7_qa_library_catalog_v363';
const QA_READER='nh7_qa_library_reader_access_v363';
const lang=()=>{const v=String(localStorage.getItem('nh7_lang')||document.documentElement.lang||'en').toLowerCase();return ['fa','en','hr'].includes(v)?v:'en'};
function urlOf(input){try{return typeof input==='string'?input:(input instanceof URL?input.href:input?.url||'')}catch(_){return''}}
function cloneInit(input,init={}){const headers=new Headers(input instanceof Request?input.headers:undefined);new Headers(init?.headers||{}).forEach((v,k)=>headers.set(k,v));return Object.assign({},init,{headers})}
async function qaReader(input,init,url){
  let body={};try{body=typeof init?.body==='string'?JSON.parse(init.body):init?.body||{}}catch(_){}
  const item=body?.p_item_id;if(!item)return null;
  const qaUrl=url.replace(/nh7_library_reader_access_v250(?:\?.*)?$/,QA_READER);
  const qaInit=cloneInit(input,init);qaInit.method='POST';qaInit.body=JSON.stringify({p_item_id:item,p_language:lang()});qaInit.cache='no-store';
  const res=await previousFetch(qaUrl,qaInit);if(!res.ok)return null;
  try{const data=await res.clone().json();if(data?.allowed===true&&data?.qa===true)return res}catch(_){}
  return null;
}
window.fetch=async function nh7QaLibraryFetch(input,init={}){
  const raw=urlOf(input);let url;try{url=new URL(raw,location.href)}catch(_){return previousFetch(input,init)}
  if(url.pathname.endsWith('/rest/v1/rpc/nh7_library_catalog_v341')){
    const qaUrl=url.href.replace('nh7_library_catalog_v341',QA_CATALOG);
    const qaRes=await previousFetch(qaUrl,cloneInit(input,Object.assign({},init,{cache:'no-store'}))).catch(()=>null);
    if(qaRes?.ok)return qaRes;
  }
  if(url.pathname.endsWith('/rest/v1/rpc/nh7_library_reader_access_v250')){
    const qaRes=await qaReader(input,init,url.href).catch(()=>null);if(qaRes)return qaRes;
  }
  return previousFetch(input,init);
};
window.NH7_QA_LIBRARY_RUNTIME='3.6.3';
console.info('NH7 QA library v3.6.3 active');
})();