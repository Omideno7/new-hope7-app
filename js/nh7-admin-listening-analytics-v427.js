/* New Hope 7 v4.2.8 — isolated Admin student listening analytics accuracy fix.
   Scope: only redirects the per-student activity RPC to the cumulative School listening report.
   School progress remains capped for completion; actual listening time is cumulative. All other analytics stay unchanged. */
(()=>{'use strict';
if(window.__NH7_ADMIN_LISTENING_ANALYTICS_V428__)return;
window.__NH7_ADMIN_LISTENING_ANALYTICS_V428__=true;
if(typeof adminRpc!=='function'){
  console.warn('[NH7 listening analytics v4.2.8] adminRpc is not ready');
  return;
}
const previousAdminRpc=adminRpc;
adminRpc=async function(name,payload={}){
  if(name==='nh7_admin_student_activity_v235'){
    return previousAdminRpc('nh7_admin_student_activity_v428',payload);
  }
  return previousAdminRpc(name,payload);
};
window.NH7_ADMIN_LISTENING_ANALYTICS_VERSION='4.2.8';
})();
