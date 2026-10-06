/* New Hope 7 v5.5.8 — precise mini-player dock + Android scroll compatibility. */
(()=>{'use strict';
if(window.__NH7_MINI_DOCK_V558__)return;window.__NH7_MINI_DOCK_V558__=true;

const isNativeAndroid=()=>{
  try{return !!window.Capacitor?.isNativePlatform?.() && window.Capacitor?.getPlatform?.()==='android'}catch(_){return false}
};

/*
  The iOS Final-QA styles intentionally disable root overscroll to suppress
  WKWebView rubber-banding. Some Samsung/Android System WebView builds handle
  root overscroll-behavior differently and can stop finger panning even though
  programmatic scrolling still works. Restore the Android browser default only
  on the native Android wrapper. Do not touch overflow/position because modal,
  reader and profile-crop flows legitimately use those for temporary locks.
*/
function ensureAndroidRootScroll(){
  if(!isNativeAndroid())return false;
  const root=document.documentElement,body=document.body;
  if(root.dataset.nh7AndroidScrollCompat==='1')return true;
  root.dataset.nh7NativeAndroid='1';
  root.style.setProperty('overscroll-behavior','auto','important');
  root.style.setProperty('overscroll-behavior-y','auto','important');
  if(body){
    body.style.setProperty('overscroll-behavior','auto','important');
    body.style.setProperty('overscroll-behavior-y','auto','important');
  }
  root.dataset.nh7AndroidScrollCompat='1';
  return true;
}

/*
  Amen is a fixed full-viewport dialog. The canonical app handler adds .hidden;
  this extra cleanup guarantees that after the user's Amen tap the invisible
  gate cannot remain in Android/Samsung hit-testing due to a compositor quirk.
*/
function cleanupAmenGate(){
  if(!isNativeAndroid())return;
  const gate=document.getElementById('amenGate');
  if(!gate)return;
  gate.classList.add('hidden');
  gate.setAttribute('aria-hidden','true');
  gate.style.setProperty('pointer-events','none','important');
  ensureAndroidRootScroll();
}

document.addEventListener('click',event=>{
  if(event.target?.closest?.('#amenButton'))setTimeout(cleanupAmenGate,0);
},true);

let raf=0;
function syncMiniDock(){
  ensureAndroidRootScroll();
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
    const value=dock+'px';
    if(document.documentElement.style.getPropertyValue('--nh7-mini-dock-bottom')!==value){
      document.documentElement.style.setProperty('--nh7-mini-dock-bottom',value);
    }
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
  document.addEventListener('DOMContentLoaded',()=>{ensureAndroidRootScroll();syncMiniDock()},{once:true});
}else{
  ensureAndroidRootScroll();
  syncMiniDock();
}
setTimeout(syncMiniDock,120);
setTimeout(syncMiniDock,500);
})();
