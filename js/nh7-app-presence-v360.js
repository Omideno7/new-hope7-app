/* New Hope 7 v3.6.0 — authenticated foreground presence tracking. */
(()=>{'use strict';if(window.__NH7_APP_PRESENCE_V360__)return;window.__NH7_APP_PRESENCE_V360__=true;
const URL='https://gpzcwffxnddhaeaogdyo.supabase.co',KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37',SESSION='nh7_user_session_v170';let disabled=false,lastTick=Date.now(),busy=false;
function session(){try{return JSON.parse(localStorage.getItem(SESSION)||'null')}catch(_){return null}}
async function beat(seconds){const token=String(session()?.access_token||'');if(disabled||busy||!token||document.hidden||!navigator.onLine)return;busy=true;try{const r=await fetch(URL+'/rest/v1/rpc/nh7_track_app_presence_v360',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({p_seconds:Math.max(1,Math.min(90,Math.round(seconds||60)))})});if(r.status===404){disabled=true;return}if(!r.ok&&r.status!==401)console.warn('[NH7 presence]',await r.text())}catch(_){}finally{busy=false}}
function tick(){const now=Date.now(),delta=Math.min(90,Math.max(0,(now-lastTick)/1000));lastTick=now;if(delta>=20)beat(delta)}
setInterval(tick,60000);document.addEventListener('visibilitychange',()=>{if(document.hidden)tick();else lastTick=Date.now()});window.addEventListener('pagehide',tick);window.addEventListener('focus',()=>{lastTick=Date.now()});window.NH7_APP_PRESENCE_VERSION='3.6.0';
})();
