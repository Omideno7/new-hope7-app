/* New Hope 7 Admin RC extension loader v2.5.2.
   Waits for the stable Admin core, then loads school, video, Account-ID access and the persistent content hub. */
(()=>{'use strict';
const CORE='js/admin-v2.3.5-analytics-core-v237.js?v=2.3.9.40';
const SCHOOL='js/nh7-admin-school-workflow-v246.js?v=2.4.0.246';
const VIDEO='js/admin-v2.3.9-video-final-v316.js?v=2.5.2';
const ACCESS='js/nh7-admin-content-access-v251.js?v=2.5.2';
const STABILITY='js/nh7-admin-stability-v252.js?v=2.5.2';
function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error('Failed to load '+src));document.head.appendChild(s)})}
async function waitCore(timeout=20000){const start=Date.now();while(Date.now()-start<timeout){if(typeof window.render==='function'&&typeof window.setTab==='function'&&typeof window.tabsHtml==='function'&&typeof window.renderActivePanel==='function')return true;await new Promise(r=>setTimeout(r,100))}throw new Error('Admin core did not become ready in time')}
load(CORE).then(()=>load(SCHOOL)).then(()=>waitCore()).then(()=>load(VIDEO)).then(()=>load(ACCESS)).then(()=>load(STABILITY)).catch(err=>{console.error('[NH7 admin RC loader]',err);const el=document.createElement('div');el.className='notice';el.textContent='Admin extension failed to load: '+err.message;document.getElementById('adminApp')?.prepend(el)});
})();
