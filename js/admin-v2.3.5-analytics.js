/* New Hope 7 Admin RC loader v2.4.0.246.
   Keeps the existing v2.4.0.241 analytics bundle pinned and then loads the isolated school workflow patch. */
(()=>{'use strict';
const ORIGINAL='https://cdn.jsdelivr.net/gh/Omideno7/new-hope7-app@ba3ffa2a009b27cded582542f9bd75da040875f9/js/admin-v2.3.5-analytics.js';
const PATCH='js/nh7-admin-school-workflow-v246.js?v=2.4.0.246';
function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error('Failed to load '+src));document.head.appendChild(s)})}
load(ORIGINAL).then(()=>load(PATCH)).catch(err=>{console.error('[NH7 admin RC loader]',err);const el=document.createElement('div');el.className='notice';el.textContent='Admin extension failed to load: '+err.message;document.getElementById('adminApp')?.prepend(el)});
})();
