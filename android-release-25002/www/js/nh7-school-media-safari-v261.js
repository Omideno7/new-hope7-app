/* New Hope 7 — Safari subtitle and remote-playback guard v2.6.1 */
(()=>{'use strict';
function patch(video){
  if(!video||video.dataset.nh7SafariV261==='1')return;video.dataset.nh7SafariV261='1';
  const src=video.getAttribute('src')||'';if(src)video.removeAttribute('src');
  video.crossOrigin='anonymous';video.setAttribute('crossorigin','anonymous');video.setAttribute('x-webkit-airplay','deny');video.setAttribute('disableRemotePlayback','');video.disablePictureInPicture=true;
  if(src){video.setAttribute('src',src);try{video.load()}catch(_){}}
}
function scan(){document.querySelectorAll('.nh7-school-video-stage video').forEach(patch)}
const observer=new MutationObserver(()=>requestAnimationFrame(scan));observer.observe(document.documentElement,{childList:true,subtree:true});setInterval(scan,1700);setTimeout(scan,300);window.NH7_SCHOOL_MEDIA_SAFARI_VERSION='2.6.1';
})();