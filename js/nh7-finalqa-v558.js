/* New Hope 7 v5.5.8 — measure exact mini-player dock position. */
(()=>{'use strict';
if(window.__NH7_MINI_DOCK_V558__)return;window.__NH7_MINI_DOCK_V558__=true;

let raf=0;
function syncMiniDock(){
  cancelAnimationFrame(raf);
  raf=requestAnimationFrame(()=>{
    const nav=document.querySelector('.bottom-nav');
    if(!nav)return;
    const r=nav.getBoundingClientRect();
    if(!r.height||r.top<=0)return;

    // Distance from viewport bottom to the visual top of the fixed navigation.
    // Add only a tiny 3px breathing gap so the mini player looks docked, not floating.
    const visualViewportHeight=window.visualViewport?.height || window.innerHeight;
    const viewportOffsetTop=window.visualViewport?.offsetTop || 0;
    const viewportBottom=viewportOffsetTop + visualViewportHeight;
    const dock=Math.max(0,Math.round(viewportBottom-r.top+3));
    document.documentElement.style.setProperty('--nh7-mini-dock-bottom',dock+'px');
  });
}

addEventListener('resize',syncMiniDock,{passive:true});
addEventListener('orientationchange',()=>setTimeout(syncMiniDock,100),{passive:true});
addEventListener('pageshow',syncMiniDock,{passive:true});
window.visualViewport?.addEventListener('resize',syncMiniDock,{passive:true});
window.visualViewport?.addEventListener('scroll',syncMiniDock,{passive:true});

const mo=new MutationObserver(syncMiniDock);
mo.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',syncMiniDock,{once:true});
}else{
  syncMiniDock();
}
setTimeout(syncMiniDock,120);
setTimeout(syncMiniDock,500);
})();
