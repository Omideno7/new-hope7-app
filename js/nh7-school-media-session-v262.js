/* New Hope 7 — keep authenticated school media sessions fresh v2.6.2 */
(()=>{'use strict';
const URL='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION_KEY='nh7_user_session_v170';let running=null;
function read(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}}
function expiry(token){try{const part=String(token||'').split('.')[1],json=JSON.parse(atob(part.replace(/-/g,'+').replace(/_/g,'/')));return Number(json.exp||0)*1000}catch(_){return 0}}
async function refresh(force=false){
  if(running)return running;const current=read();if(!current?.refresh_token)return null;if(!force&&expiry(current.access_token)>Date.now()+5*60*1000)return current;
  running=(async()=>{try{const response=await fetch(`${URL}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:current.refresh_token}),cache:'no-store'}),text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch(_){data={}}if(!response.ok||!data.access_token)throw new Error(data.message||text||response.statusText);localStorage.setItem(SESSION_KEY,JSON.stringify(data));return data}catch(error){console.warn('Secure school media session refresh',error);return null}finally{running=null}})();return running
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh(false)});window.addEventListener('online',()=>refresh(false));setInterval(()=>refresh(false),8*60*1000);setTimeout(()=>refresh(false),250);window.NH7_SCHOOL_MEDIA_REFRESH=refresh;
})();