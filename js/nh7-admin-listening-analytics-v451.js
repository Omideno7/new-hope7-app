/* New Hope 7 Admin v4.5.1 — exact per-student listening report routing.
 * Redirects legacy student activity/profile reads to the corrected server functions.
 */
(()=>{'use strict';
if(window.__NH7_ADMIN_LISTENING_ANALYTICS_V451__)return;
window.__NH7_ADMIN_LISTENING_ANALYTICS_V451__=true;
function install(){
  if(typeof adminRpc!=='function'||adminRpc.__nh7Listening451)return false;
  const previous=adminRpc;
  const wrapped=async function(name,payload={}){
    if(name==='nh7_admin_student_activity_v235'||name==='nh7_admin_student_activity_v427')return previous('nh7_admin_student_activity_v451',payload);
    if(name==='nh7_admin_student_profile_v238')return previous('nh7_admin_student_profile_v451',payload);
    return previous(name,payload);
  };
  wrapped.__nh7Listening451=true;wrapped.__nh7Previous=previous;
  adminRpc=window.adminRpc=wrapped;
  return true;
}
if(!install()){
  const timer=setInterval(()=>{if(install())clearInterval(timer)},100);
  setTimeout(()=>clearInterval(timer),10000);
}
document.addEventListener('nh7:admin-render',install);
window.NH7_ADMIN_LISTENING_ANALYTICS_VERSION='4.5.1';
})();
