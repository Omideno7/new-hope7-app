/* New Hope 7 — use the shared, account-safe refresh coordinator. */
(()=>{'use strict';
const refresh=(force=false)=>window.NH7_SESSION_V467?.refresh(force)||Promise.resolve(null);
window.NH7_SCHOOL_MEDIA_REFRESH=refresh;
const check=()=>{if(!document.hidden&&navigator.onLine)refresh(false).catch(()=>{})};
document.addEventListener('visibilitychange',check);window.addEventListener('online',check);
setInterval(check,8*60*1000);setTimeout(check,250);
})();
