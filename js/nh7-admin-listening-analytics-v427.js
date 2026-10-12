/* New Hope 7 v4.2.7 — isolated Admin student listening analytics source fix.
   Scope: only redirects the per-student activity RPC to the corrected reporting function.
   School listening totals come from nh7_school_audio_progress_v380; all other analytics stay unchanged. */
(()=>{'use strict';
if(window.__NH7_ADMIN_LISTENING_ANALYTICS_V427__)return;
window.__NH7_ADMIN_LISTENING_ANALYTICS_V427__=true;
if(typeof adminRpc!=='function'){
  console.warn('[NH7 listening analytics v4.2.7] adminRpc is not ready');
  return;
}
const previousAdminRpc=adminRpc;
adminRpc=async function(name,payload={}){
  if(name==='nh7_admin_student_activity_v235'){
    return previousAdminRpc('nh7_admin_student_activity_v427',payload);
  }
  return previousAdminRpc(name,payload);
};
window.NH7_ADMIN_LISTENING_ANALYTICS_VERSION='4.2.7';
})();
