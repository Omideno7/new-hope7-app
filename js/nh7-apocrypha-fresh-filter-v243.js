/* New Hope 7 v2.4.0.243 — remove legacy FA/HR text from the RC Apocrypha runtime. */
(()=>{'use strict';
if(window.__NH7_APOCRYPHA_FRESH_FILTER__)return;window.__NH7_APOCRYPHA_FRESH_FILTER__=true;
const nativeFetch=window.fetch.bind(window);
function target(input){try{const raw=typeof input==='string'?input:input instanceof URL?input.href:input?.url||'';return /data\/apocrypha\/runtime\/apocrypha-browser-19\.preview\.json(?:[?#]|$)/.test(new URL(raw,document.baseURI).href)}catch(_){return false}}
window.fetch=async function nh7ApocryphaFreshFetch(input,init={}){if(!target(input))return nativeFetch(input,init);const response=await nativeFetch(input,init);if(!response.ok)return response;try{const data=await response.clone().json();for(const book of data?.books||[])for(const chapter of book?.chapters||[])for(const verse of chapter?.verses||[]){if(String(verse.status_fa||'')!=='in_review')verse.text_fa=null;if(String(verse.status_hr||'')!=='in_review')verse.text_hr=null;}return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}catch(error){console.warn('NH7 Apocrypha fresh filter',error);return response}};
window.NH7_APOCRYPHA_FRESH_FILTER_VERSION='2.4.0.243';
})();