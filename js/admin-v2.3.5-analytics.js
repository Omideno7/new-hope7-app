/* New Hope 7 Admin RC extension loader v2.5.1.
   Loads the unchanged local analytics core first, then isolated school, video and Account-ID access extensions. */
(()=>{'use strict';
const CORE='js/admin-v2.3.5-analytics-core-v237.js?v=2.3.9.40';
const SCHOOL='js/nh7-admin-school-workflow-v246.js?v=2.4.0.246';
const VIDEO='js/admin-v2.3.9-video-final-v316.js?v=2.5.1';
const ACCESS='js/nh7-admin-content-access-v251.js?v=2.5.1';
function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error('Failed to load '+src));document.head.appendChild(s)})}
load(CORE).then(()=>load(SCHOOL)).then(()=>load(VIDEO)).then(()=>load(ACCESS)).catch(err=>{console.error('[NH7 admin RC loader]',err);const el=document.createElement('div');el.className='notice';el.textContent='Admin extension failed to load: '+err.message;document.getElementById('adminApp')?.prepend(el)});
})();
