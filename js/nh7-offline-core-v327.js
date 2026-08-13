/* New Hope 7 v3.3.3 — one-time background preparation of the offline app shell */
(()=>{'use strict';
const VERSION='3.3.3-offline-core';
const BUILD='2.3.9.33';
const READY_KEY='nh7_offline_core_ready';
let running=false;
function parse(value,fallback=null){try{return JSON.parse(value||'')??fallback}catch(_){return fallback}}
function ready(){const row=parse(localStorage.getItem(READY_KEY),{});return row?.build===BUILD&&Number(row?.cached||0)>0}
function send(type,payload={}){return new Promise(async(resolve,reject)=>{if(!('serviceWorker'in navigator)){reject(new Error('Service worker unavailable'));return}let timer=0;try{const registration=await Promise.race([navigator.serviceWorker.ready,new Promise((_,r)=>setTimeout(()=>r(new Error('Service worker timeout')),7000))]);const target=navigator.serviceWorker.controller||registration.active||registration.waiting;if(!target)throw new Error('Service worker inactive');const channel=new MessageChannel();timer=setTimeout(()=>reject(new Error('Offline core preparation timed out')),180000);channel.port1.onmessage=event=>{clearTimeout(timer);const data=event.data||{};data.ok===false?reject(new Error(data.error||'Offline preparation failed')):resolve(data)};target.postMessage(Object.assign({type},payload),[channel.port2])}catch(error){clearTimeout(timer);reject(error)}})}
async function prepare(force=false){if(running||!navigator.onLine||(!force&&ready()))return null;running=true;try{const result=await send('CACHE_CORE');localStorage.setItem(READY_KEY,JSON.stringify({build:BUILD,cached:Number(result?.cached||0),at:new Date().toISOString()}));try{await navigator.storage?.persist?.()}catch(_){}return result}catch(error){console.warn('Offline core preparation',error);return null}finally{running=false}}
window.addEventListener('online',()=>{if(!ready())setTimeout(()=>prepare(false),30000)});
window.addEventListener('pageshow',()=>{if(!ready())setTimeout(()=>prepare(false),60000)});
navigator.serviceWorker?.addEventListener?.('controllerchange',()=>{if(!ready())setTimeout(()=>prepare(false),45000)});
setTimeout(()=>{if(!ready())prepare(false)},65000);
window.NH7_OFFLINE_CORE_VERSION=VERSION;
window.NH7_PREPARE_OFFLINE_CORE=()=>prepare(true);
})();
