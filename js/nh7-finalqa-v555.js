/* New Hope 7 v5.5.5 — root-edge overscroll guard for iOS WKWebView.
   IMPORTANT: Android WebView must keep native vertical touch scrolling untouched. */
(()=>{'use strict';
if(window.__NH7_FINALQA_V555__)return;window.__NH7_FINALQA_V555__=true;

// This guard exists only to suppress iOS/WKWebView rubber-band gestures.
// Loading its document-level non-passive touchmove handler on Android can make
// the root scroller look as if it is already at both edges and freeze swiping.
const nativePlatform=window.Capacitor?.isNativePlatform?.()?window.Capacitor?.getPlatform?.():'web';
const isiOS=nativePlatform==='ios'||/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(!isiOS){window.__NH7_FINALQA_V555_SKIPPED__='non-ios';return;}

let lastY=0;

function rootScroller(){
  return document.scrollingElement || document.documentElement;
}

function isScrollable(el){
  if(!el || el===document.body || el===document.documentElement)return false;
  const style=getComputedStyle(el);
  const oy=style.overflowY;
  return (oy==='auto'||oy==='scroll') && el.scrollHeight>el.clientHeight+1;
}

function nestedCanMove(target, fingerDelta){
  let el=target instanceof Element ? target : target?.parentElement;
  while(el && el!==document.body && el!==document.documentElement){
    if(isScrollable(el)){
      if(fingerDelta>0 && el.scrollTop>0)return true;
      if(fingerDelta<0 && el.scrollTop+el.clientHeight<el.scrollHeight-1)return true;
    }
    el=el.parentElement;
  }
  return false;
}

document.addEventListener('touchstart',e=>{
  if(e.touches?.length===1)lastY=e.touches[0].clientY;
},{passive:true,capture:true});

document.addEventListener('touchmove',e=>{
  if(e.touches?.length!==1)return;
  const y=e.touches[0].clientY;
  const delta=y-lastY;
  lastY=y;
  if(!delta || nestedCanMove(e.target,delta))return;

  const scroller=rootScroller();
  const top=scroller.scrollTop<=0;
  const bottom=scroller.scrollTop+window.innerHeight>=scroller.scrollHeight-1;

  // Pulling down at the top or pulling up at the bottom is the iOS rubber-band gesture.
  if((top && delta>0)||(bottom && delta<0)){
    e.preventDefault();
  }
},{passive:false,capture:true});

window.addEventListener('pageshow',()=>{
  const s=rootScroller();
  if(s.scrollTop<0)s.scrollTop=0;
},{passive:true});
})();
