/* New Hope 7 v5.5.5 — root-edge overscroll guard for iOS WKWebView. */
(()=>{'use strict';
if(window.__NH7_FINALQA_V555__)return;window.__NH7_FINALQA_V555__=true;

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
