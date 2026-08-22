/* New Hope 7 Admin production extension loader v2.4.0.246.
   Loads the unchanged production analytics bundle first, then the isolated school-assignment workflow patch. */
(()=>{'use strict';
const CORE='js/admin-v2.3.5-analytics-core-v237.js?v=2.3.9.40';
const PATCH='js/nh7-admin-school-workflow-v246.js?v=2.4.0.246';
function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error('Failed to load '+src));document.head.appendChild(s)})}
load(CORE).then(()=>load(PATCH)).catch(err=>{console.error('[NH7 admin school workflow loader]',err);const el=document.createElement('div');el.className='notice';el.textContent='Admin extension failed to load: '+err.message;document.getElementById('adminApp')?.prepend(el)});
})();