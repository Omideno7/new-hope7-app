/* New Hope 7 v2.4.0.242 — signed URL bridge for bundled message audio. */
(()=>{'use strict';
if(window.__NH7_MESSAGE_AUDIO_BRIDGE_V242__)return;window.__NH7_MESSAGE_AUDIO_BRIDGE_V242__=true;
const VERSION='2.4.0.242-message-audio-signed';
const PROJECT='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION_KEY='nh7_user_session_v170';
const nativeFetch=window.fetch.bind(window);
let cached=null,cachedFor='',cachedAt=0;
function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}}
function device(){let id=localStorage.getItem('nh7_device_id');if(!id){id='dev_'+(crypto.randomUUID?.()||Date.now()+'_'+Math.random().toString(36).slice(2));localStorage.setItem('nh7_device_id',id)}return id}
function pathFrom(value){const raw=String(value||'').trim();if(!raw)return'';try{const u=new URL(raw,location.href),m='/storage/v1/object/public/church-audio/';if(u.pathname.includes(m))return decodeURIComponent(u.pathname.split(m)[1]||'')}catch(_){}return raw.startsWith('messages/')?raw:''}
async function signPaths(paths){const s=session(),token=String(s?.access_token||''),uid=String(s?.user?.id||'');if(!token)return new Map();const key=uid+'|'+paths.join('|');if(cached&&cachedFor===key&&Date.now()-cachedAt<12*60*1000)return cached;const r=await nativeFetch(PROJECT+'/functions/v1/nh7-message-audio-access-v242',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({paths,device_id:device()}),cache:'no-store'});const text=await r.text();let data={};try{data=text?JSON.parse(text):{}}catch(_){data={error:text}}if(!r.ok)throw new Error(data?.error||data?.message||text||r.statusText);const map=new Map((data.items||[]).filter(x=>x?.path&&x?.signed_url).map(x=>[String(x.path),String(x.signed_url)]));cached=map;cachedFor=key;cachedAt=Date.now();return map}
function isMessagesRequest(input){try{const raw=typeof input==='string'?input:input instanceof URL?input.href:input?.url||'';return /(?:^|\/)data\/audio\/messages\.json(?:[?#]|$)/.test(new URL(raw,document.baseURI).pathname)}catch(_){return false}}
window.fetch=async function nh7MessageAudioFetch(input,init={}){if(!isMessagesRequest(input))return nativeFetch(input,init);const response=await nativeFetch(input,init);if(!response.ok)return response;try{const data=await response.clone().json(),items=(data?.categories||[]).flatMap(c=>Array.isArray(c.items)?c.items:[]),paths=[...new Set(items.map(i=>pathFrom(i.src)).filter(p=>p.startsWith('messages/')))];if(!paths.length)return response;const signed=await signPaths(paths);for(const item of items){const path=pathFrom(item.src),url=signed.get(path);if(url)item.src=url;}return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}catch(error){console.warn('NH7 message audio signing unavailable',error);return response}};
window.NH7_MESSAGE_AUDIO_BRIDGE_VERSION=VERSION;
})();