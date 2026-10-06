/* New Hope 7 v5.5.4 — viewport-pinned app chrome measurements. */
(()=>{'use strict';
if(window.__NH7_FINALQA_V554__)return;window.__NH7_FINALQA_V554__=true;
let raf=0;
function sync(){
  cancelAnimationFrame(raf);
  raf=requestAnimationFrame(()=>{
    const root=document.documentElement;
    const header=document.querySelector('#appShell>.topbar');
    const nav=document.querySelector('.bottom-nav');
    if(header){
      const h=Math.ceil(header.getBoundingClientRect().height||0);
      if(h>0)root.style.setProperty('--nh7-fixed-header-h',h+'px');
    }
    if(nav){
      const r=nav.getBoundingClientRect();
      const phone=matchMedia('(max-width:767px)').matches ||
        (matchMedia('(orientation:landscape)').matches && innerHeight<=520 && innerWidth<=980);
      if(phone&&r.height>0)root.style.setProperty('--nh7-fixed-nav-h',Math.ceil(r.height)+'px');
      else root.style.removeProperty('--nh7-fixed-nav-h');
    }
  });
}
const ro=('ResizeObserver'in window)?new ResizeObserver(sync):null;
function watch(){
  const h=document.querySelector('#appShell>.topbar'),n=document.querySelector('.bottom-nav');
  try{if(ro){h&&ro.observe(h);n&&ro.observe(n)}}catch(_){}
  sync();
}
addEventListener('resize',sync,{passive:true});
addEventListener('orientationchange',()=>setTimeout(sync,80),{passive:true});
addEventListener('pageshow',sync,{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
new MutationObserver(sync).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','data-nh7-theme','data-nh7-studio']});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});else watch();
setTimeout(sync,120);setTimeout(sync,500);

/*
 * Batch 2 security bootstrap: keep the Ministers Library entitlement guard
 * isolated from the core Library implementation. The server remains the
 * authoritative authorization boundary; this script only hardens UI/cache.
 */
(function loadMinisterLibraryGuard(){
  if(window.__NH7_MINISTER_LIBRARY_GUARD_BOOTSTRAP__)return;
  window.__NH7_MINISTER_LIBRARY_GUARD_BOOTSTRAP__=true;
  const script=document.createElement('script');
  script.src='js/nh7-minister-library-access-v600.js?v=6.0.0';
  script.async=false;
  script.dataset.nh7MinisterLibraryGuard='1';
  document.head.appendChild(script);
})();
})();
