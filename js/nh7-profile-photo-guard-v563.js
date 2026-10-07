/* New Hope 7 v5.6.5 — early runtime guards/bootstrap.
 * Preserves profile-photo legacy guards and snapshots the incoming URL before
 * the main router normalizes history, then loads the isolated Bible deep-link runtime.
 */
(()=>{'use strict';
window.__NH7_PROFILE_PHOTO_V561__=true;
window.__NH7_PROFILE_PHOTO_V563__=true;
if(!window.__NH7_INITIAL_URL_V565__)window.__NH7_INITIAL_URL_V565__=location.href;
if(!window.__NH7_BIBLE_DEEPLINK_LOADER_V565__){
  window.__NH7_BIBLE_DEEPLINK_LOADER_V565__=true;
  const s=document.createElement('script');
  s.src='js/nh7-bible-deeplink-v565.js?v=5.6.5';
  s.async=false;
  s.onerror=()=>console.warn('Bible deep-link runtime could not be loaded');
  document.head.appendChild(s);
}
})();
