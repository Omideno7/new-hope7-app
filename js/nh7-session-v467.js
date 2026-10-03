/* New Hope 7 v4.6.7 — bounded requests and one account-safe session refresh.
 * No profile/progress migration. Never clear a session because transport failed.
 */
(()=>{'use strict';
if(window.NH7_SESSION_V467)return;
const SB='https://gpzcwffxnddhaeaogdyo.supabase.co',KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SK='nh7_user_session_v170',LOGOUT='nh7_explicit_logout';
let flight=null,failedToken='',failedAt=0;
function read(){try{return JSON.parse(localStorage.getItem(SK)||'null')}catch(_){return null}}
function loggedOut(){try{return localStorage.getItem(LOGOUT)==='1'}catch(_){return true}}
function owner(s){return String(s?.user?.id||s?.user?.email||'')}
function expiry(s){try{const raw=s.access_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return Number(JSON.parse(atob(raw.padEnd(Math.ceil(raw.length/4)*4,'='))).exp||0)*1000}catch(_){return Number(s?.expires_at||0)*1000}}
function error(code,status=0){return Object.assign(new Error(code),{code,status})}
async function request(input,init={},options={}){
 const tries=options.retryRead===true?2:1,ms=options.timeoutMs||14000;
 for(let attempt=0;attempt<tries;attempt++){
  const control=new AbortController(),source=init.signal;
  let timeout=false,forward=()=>control.abort(source?.reason),timer;
  if(source?.aborted)throw source.reason||error('request_cancelled');
  source?.addEventListener('abort',forward,{once:true});
  const timed=new Promise((_,reject)=>{timer=setTimeout(()=>{timeout=true;control.abort();reject(error('request_timeout'))},ms)});
  try{return await Promise.race([window.fetch(input,{...init,signal:control.signal}),timed])}
  catch(e){if(source?.aborted)throw e;const network=e instanceof TypeError||/load failed|failed to fetch|networkerror/i.test(String(e?.message||''));if(attempt+1<tries&&network&&navigator.onLine){await new Promise(r=>setTimeout(r,250));continue}if(timeout)throw error('request_timeout');if(network)throw error('network_error');throw e}
  finally{clearTimeout(timer);source?.removeEventListener('abort',forward)}
 }
}
async function refresh(force=false,rejectedToken=''){
 if(loggedOut())return null;
 const initial=read();if(!initial?.access_token)return null;
 if(rejectedToken&&initial.access_token!==rejectedToken&&expiry(initial)>Date.now()+30000)return initial;
 if(!force&&expiry(initial)>Date.now()+90000)return initial;
 if(flight)return flight;
 if(!initial.refresh_token||!navigator.onLine)return null;
 if(initial.refresh_token===failedToken&&Date.now()-failedAt<10000)return null;
 const run=async()=>{
  const old=read();if(loggedOut()||!old||owner(old)!==owner(initial))return null;
  if(old.access_token!==initial.access_token&&expiry(old)>Date.now()+30000)return old;
  try{
   const r=await request(SB+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:old.refresh_token}),cache:'no-store'});
   const data=await r.json();
   if(!r.ok||!data?.access_token)throw error('session_refresh_failed',r.status);
   const now=read();if(loggedOut()||!now||owner(now)!==owner(old))return null;
   // Another tab/login may have replaced the token while this response travelled.
   if(now.access_token!==old.access_token||now.refresh_token!==old.refresh_token)return now;
   if(data.user&&owner(data)!==owner(old))return null;
   const merged={...old,...data,user:data.user||old.user};
   localStorage.setItem(SK,JSON.stringify(merged));failedToken='';failedAt=0;
   window.dispatchEvent(new CustomEvent('nh7-session-refreshed',{detail:{email:String(merged.user?.email||'').toLowerCase()}}));
   return merged;
  }catch(_){failedToken=old.refresh_token;failedAt=Date.now();return null}
 };
 flight=(async()=>{
  if(navigator.locks?.request){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),16000);try{return await navigator.locks.request('nh7-auth-refresh-v467',{signal:controller.signal},run)}catch(_){return null}finally{clearTimeout(timer)}}
  return run();
 })().finally(()=>{flight=null});
 return flight;
}
async function token(){
 if(loggedOut())throw error('login_required');
 let s=read();if(!s?.access_token)throw error('login_required');
 if(expiry(s)<Date.now()+60000){s=await refresh(false)||read();if(!s?.access_token||loggedOut())throw error('login_required');if(expiry(s)&&expiry(s)<=Date.now())throw error(navigator.onLine?'session_unavailable':'network_error')}
 return s.access_token;
}
window.NH7_SESSION_V467=Object.freeze({VERSION:'4.6.7',read,refresh,token,request});
})();
