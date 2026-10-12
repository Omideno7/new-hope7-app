/* New Hope 7 Admin v4.5.1 — resilient owner-session keepalive.
 * Scope: keep authenticated admin sessions alive across iOS background/resume.
 * Does not bypass server authorization or preserve revoked access.
 */
(()=>{'use strict';
if(window.__NH7_ADMIN_SESSION_KEEPALIVE_V451__)return;
window.__NH7_ADMIN_SESSION_KEEPALIVE_V451__=true;
const SB='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
let busy=false,lastRefresh=0;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const originalFetch=window.fetch.bind(window);
function retryable(url){url=String(url||'');return url.includes('/auth/v1/token?grant_type=refresh_token')||url.includes('/rest/v1/rpc/nh7_admin_my_access_v350')}
window.fetch=async function(input,init){const url=typeof input==='string'?input:input?.url||'';if(!retryable(url))return originalFetch(input,init);let last;for(let attempt=0;attempt<3;attempt++){try{const response=await originalFetch(input,init);if(response.status!==408&&response.status!==429&&response.status<500)return response;last=response}catch(error){last=error}if(attempt<2)await sleep(500*(attempt+1))}if(last instanceof Response)return last;throw last};
function jwtExp(value){try{const part=String(value||'').split('.')[1]||'',raw=part.replace(/-/g,'+').replace(/_/g,'/'),data=JSON.parse(atob(raw.padEnd(Math.ceil(raw.length/4)*4,'=')));return Number(data.exp||0)*1000}catch(_){return 0}}
async function refresh(force=false){if(busy)return false;const access=localStorage.getItem('nh7_admin_token')||'',rt=localStorage.getItem('nh7_admin_refresh_token')||'';if(!access||!rt)return false;const exp=jwtExp(access);if(!force&&exp>Date.now()+8*60*1000&&Date.now()-lastRefresh<20*60*1000)return true;busy=true;try{const response=await originalFetch(SB+'/auth/v1/token?grant_type=refresh_token',{method:'POST',cache:'no-store',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:rt})});if(!response.ok)return false;const data=await response.json();if(!data?.access_token)return false;const nextRefresh=data.refresh_token||rt;localStorage.setItem('nh7_admin_token',data.access_token);localStorage.setItem('nh7_admin_refresh_token',nextRefresh);try{if(typeof token==='string'&&token)token=data.access_token;if(typeof refreshToken==='string'&&refreshToken)refreshToken=nextRefresh}catch(_){}lastRefresh=Date.now();document.dispatchEvent(new CustomEvent('nh7:admin-session-refreshed'));return true}catch(_){return false}finally{busy=false}}
function resume(){if(document.hidden)return;refresh(true).then(ok=>{if(ok&&typeof loadAll==='function'&&typeof token==='string'&&token)setTimeout(()=>loadAll(true),150)}).catch(()=>{})}
setInterval(()=>{if(!document.hidden)refresh(false)},4*60*1000);
window.addEventListener('pageshow',resume);window.addEventListener('online',resume);document.addEventListener('visibilitychange',()=>{if(!document.hidden)resume()});
setTimeout(()=>refresh(false),1200);
window.NH7_ADMIN_SESSION_KEEPALIVE_VERSION='4.5.1';
})();
