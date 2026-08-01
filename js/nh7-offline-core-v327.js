/* New Hope 7 v3.2.7 — background preparation of the complete offline app shell */
(()=>{'use strict';
const VERSION='3.2.7-offline-core';
const BUILD='2.3.9.27';
let running=false;
function send(type,payload={}){return new Promise(async(resolve,reject)=>{if(!('serviceWorker'in navigator)){reject(new Error('Service worker unavailable'));return}let timer=0;try{const reg=await navigator.serviceWorker.ready,target=navigator.serviceWorker.controller||reg.active||reg.waiting;if(!target)throw new Error('Service worker inactive');const channel=new MessageChannel();timer=setTimeout(()=>reject(new Error('Offline core preparation timed out')),180000);channel.port1.onmessage=event=>{clearTimeout(timer);const data=event.data||{};data.ok===false?reject(new Error(data.error||'Offline preparation failed')):resolve(data)};target.postMessage(Object.assign({type},payload),[channel.port2])}catch(error){clearTimeout(timer);reject(error)}})}
async function prepare(){if(running||!navigator.onLine)return;running=true;try{const result=await send('CACHE_CORE');localStorage.setItem('nh7_offline_core_ready',JSON.stringify({build:BUILD,cached:Number(result?.cached||0),at:new Date().toISOString()}));try{await navigator.storage?.persist?.()}catch(_){}}catch(error){console.warn('Offline core preparation',error)}finally{running=false}}
window.addEventListener('online',()=>setTimeout(prepare,800));window.addEventListener('pageshow',()=>setTimeout(prepare,1800));navigator.serviceWorker?.addEventListener?.('controllerchange',()=>setTimeout(prepare,1200));setTimeout(prepare,2200);window.NH7_OFFLINE_CORE_VERSION=VERSION;
})();
