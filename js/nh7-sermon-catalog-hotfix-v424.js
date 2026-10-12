/* New Hope 7 v4.2.4 — isolated sermon catalogue performance + description UI.
   Scope: Audio Messages / Sermons only. No School, Bible, Plans, Inbox, Admin or Storage writes. */
(()=>{'use strict';
if(window.__NH7_SERMON_CATALOG_V424__)return;
window.__NH7_SERMON_CATALOG_V424__=true;
const SB='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION_KEY='nh7_user_session_v170';
const baseFetch=window.fetch.bind(window);
const parse=(v,f=null)=>{try{return JSON.parse(v||'')??f}catch(_){return f}};
const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return ['fa','en','hr'].includes(v)?v:'en'};
function session(){return parse(localStorage.getItem(SESSION_KEY),null)}
function urlOf(input){try{return new URL(typeof input==='string'?input:input instanceof URL?input.href:input?.url||'',location.href)}catch(_){return null}}
async function bodyOf(input,init){if(typeof init?.body==='string')return init.body;if(input instanceof Request){try{return await input.clone().text()}catch(_){}}return''}
function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-NH7-Sermon-Catalog':'4.2.4'}})}
async function isSermonCatalog(input,init,url){if(String(init?.method||(input instanceof Request?input.method:'GET')).toUpperCase()!=='POST')return false;if(url?.origin!==SB||url.pathname!=='/functions/v1/nh7-content-access')return false;const body=parse(await bodyOf(input,init),{});return body?.action==='catalog'&&body?.resource==='sermons'}
async function fastCatalog(){
 const s=session(),headers={apikey:KEY,'Cache-Control':'no-cache'};
 if(s?.access_token)headers.Authorization='Bearer '+s.access_token;
 const endpoint=SB+'/rest/v1/sermons?select=*&is_published=eq.true&order=sort_order.asc,published_at.desc';
 const r=await baseFetch(endpoint,{method:'GET',headers,cache:'no-store'});
 if(!r.ok)throw new Error('sermon_catalog_http_'+r.status);
 const items=await r.json();
 return json({items:Array.isArray(items)?items:[],approved:true,user_email:String(s?.user?.email||'').toLowerCase()});
}
window.fetch=async function nh7SermonCatalogFetch(input,init={}){
 const url=urlOf(input);
 try{if(await isSermonCatalog(input,init,url))return await fastCatalog()}catch(error){console.warn('[NH7 sermon catalogue fast path]',error)}
 return baseFetch(input,init);
};
function description(item){const l=lang();return String(item?.['description_'+l]||item?.description_fa||item?.description_en||item?.description_hr||'').trim()}
function decorate(){
 document.querySelectorAll('[data-sermon-card]').forEach(card=>{
  if(card.dataset.nh7DescriptionV424==='1')return;
  const id=String(card.dataset.sermonCard||''),item=window.__sermonMap?.[id],text=description(item);
  if(!text)return;
  const copy=card.querySelector('.sermon-card-copy')||card.querySelector('div');if(!copy)return;
  const p=document.createElement('p');p.className='muted small nh7-sermon-description-v424';p.textContent=text;p.style.whiteSpace='pre-wrap';p.style.lineHeight='1.75';p.style.margin='8px 0 0';copy.appendChild(p);card.dataset.nh7DescriptionV424='1';
 });
}
new MutationObserver(()=>queueMicrotask(decorate)).observe(document.documentElement,{subtree:true,childList:true});
document.addEventListener('click',()=>setTimeout(decorate,50),true);setTimeout(decorate,0);
window.NH7_SERMON_CATALOG_VERSION='4.2.4';
})();