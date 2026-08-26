/* New Hope 7 Final QA R3.4 v3.9.4 — persistent offline catalogues.
 * Keeps the last successful sermon, School and library catalogue so the UI can
 * still open while offline; protected media itself must be downloaded first.
 */
(()=>{'use strict';
if(window.__NH7_CONTENT_OFFLINE_V394__)return;window.__NH7_CONTENT_OFFLINE_V394__=true;
const nativeFetch=window.fetch.bind(window),PREFIX='nh7_offline_json_v394:';
function raw(input){try{return typeof input==='string'?input:(input instanceof URL?input.href:input?.url||'')}catch(_){return''}}
function keyFor(url){const path=url.pathname.toLowerCase();if(path.endsWith('/rest/v1/sermon_categories'))return'sermon_categories';if(path.endsWith('/rest/v1/sermons'))return'sermons';if(path.endsWith('/rest/v1/school_lessons'))return'school_lessons';if(/\/rest\/v1\/rpc\/nh7_library_catalog_v372$/.test(path))return'library_catalog';return''}
function save(key,value){try{localStorage.setItem(PREFIX+key,JSON.stringify({at:new Date().toISOString(),value}))}catch(_){ }}
function load(key){try{return JSON.parse(localStorage.getItem(PREFIX+key)||'null')?.value??null}catch(_){return null}}
function json(value){return new Response(JSON.stringify(value),{status:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-NH7-Offline':'1'}})}
window.fetch=async function nh7OfflineCatalogueFetch(input,init={}){let url;try{url=new URL(raw(input),location.href)}catch(_){return nativeFetch(input,init)}const key=keyFor(url);if(!key)return nativeFetch(input,init);try{const response=await nativeFetch(input,init);if(response.ok){const clone=response.clone();clone.json().then(value=>save(key,value)).catch(()=>{});return response}const cached=load(key);return cached!==null?json(cached):response}catch(error){const cached=load(key);if(cached!==null)return json(cached);throw error}};
window.NH7_CONTENT_OFFLINE_VERSION='3.9.4';
})();
