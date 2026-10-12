/* New Hope 7 Admin production extension loader v2.4.0.247.
   Loads the unchanged production analytics bundle, isolated listening correction, school workflow, then the mobile search stability patch. */
(()=>{'use strict';
const CORE='js/admin-v2.3.5-analytics-core-v237.js?v=2.3.9.40';
const LISTENING='js/nh7-admin-listening-analytics-v427.js?v=4.2.7';
const PATCH='js/nh7-admin-school-workflow-v246.js?v=2.4.0.246';
const SEARCH='js/admin-v2.3.9-request-search-focus-v336.js?v=3.3.8';
function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error('Failed to load '+src));document.head.appendChild(s)})}
load(CORE).then(()=>load(LISTENING)).then(()=>load(PATCH)).then(()=>load(SEARCH)).catch(err=>{console.error('[NH7 admin production loader]',err);const el=document.createElement('div');el.className='notice';el.textContent='Admin extension failed to load: '+err.message;document.getElementById('adminApp')?.prepend(el)});
})();