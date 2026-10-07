/* New Hope 7 Admin Testimony v5.6.5 loader — preserves approved core and layers v5.0.3 + v5.0.4 + v5.0.5 + v5.0.6 + v5.0.9 admin fixes. */
(()=>{'use strict';
if(window.__NH7_ADMIN_TESTIMONY_LOADER_V509__)return;
window.__NH7_ADMIN_TESTIMONY_LOADER_V509__=true;
function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.defer=true;s.onload=resolve;s.onerror=()=>reject(new Error('Failed to load '+src));document.head.appendChild(s)})}
load('js/nh7-admin-testimony-core-v565.js?v=5.6.5-core')
 .then(()=>load('js/nh7-admin-community-fixes-v503.js?v=5.0.3'))
 .then(()=>load('js/nh7-admin-community-storage-v504.js?v=5.0.4'))
 .then(()=>load('js/nh7-admin-testimony-runtime-fix-v505.js?v=5.0.5'))
 .then(()=>load('js/nh7-admin-testimony-playback-v506.js?v=5.0.6'))
 .then(()=>load('js/nh7-admin-storage-orphan-v509.js?v=5.0.9'))
 .catch(e=>{console.error('[NH7 admin testimony loader]',e);try{if(typeof setMessage==='function')setMessage(String(e?.message||e),'danger')}catch(_){}});
})();