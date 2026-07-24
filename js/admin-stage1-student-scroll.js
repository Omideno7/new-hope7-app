/* ============================================================
   New Hope 7 Admin v2.3.3 — isolated student profile scroll
   This patch detaches the profile overlay from the legacy modal class
   so older v2.2.5 / v2.2.7 / v2.2.8 observers and touch handlers can no
   longer fight over the same scroll container.
   ============================================================ */
(()=>{'use strict';
const LEGACY_BACKDROP='student-modal-backdrop';
const SAFE_BACKDROP='nh7-student-overlay-v233';
let savedScrollY=0;
let active=false;

function important(el,name,value){if(el)el.style.setProperty(name,value,'important');}

function neutralizeLegacyLocks(){
  const body=document.body;
  body.classList.remove(
    'nh7-student-lock-v226',
    'nh7-student-modal-open',
    'nh7-student-detail-open-v227',
    'nh7-student-detail-open-v228'
  );
  body.style.removeProperty('--nh7-lock-scroll-y');
  for(const p of ['position','top','right','bottom','left','inset','width','height'])body.style.removeProperty(p);
}

function restorePage(){
  if(!active)return;
  active=false;
  const body=document.body;
  body.style.removeProperty('overflow');
  body.style.removeProperty('overscroll-behavior');
  body.style.removeProperty('touch-action');
  neutralizeLegacyLocks();
  requestAnimationFrame(()=>window.scrollTo(0,savedScrollY));
}

function hijackStudentOverlay(){
  const old=document.querySelector('.'+LEGACY_BACKDROP);
  if(!old){
    if(!document.querySelector('.'+SAFE_BACKDROP))restorePage();
    return;
  }

  savedScrollY=window.scrollY||document.documentElement.scrollTop||0;
  active=true;
  neutralizeLegacyLocks();

  /* Critical fix: remove the exact class watched by the older patches.
     Their MutationObservers and touchmove blocker now see no student modal. */
  old.classList.remove(LEGACY_BACKDROP);
  old.classList.add(SAFE_BACKDROP);
  old.setAttribute('role','dialog');
  old.setAttribute('aria-modal','true');

  const body=document.body;
  important(body,'overflow','hidden');
  important(body,'overscroll-behavior','none');
  important(body,'touch-action','auto');

  important(old,'position','fixed');
  important(old,'inset','0px');
  important(old,'z-index','2147483000');
  important(old,'display','block');
  important(old,'width','100%');
  important(old,'height','100dvh');
  important(old,'max-height','100dvh');
  important(old,'margin','0px');
  important(old,'padding','0px');
  important(old,'overflow-y','auto');
  important(old,'overflow-x','hidden');
  important(old,'-webkit-overflow-scrolling','touch');
  important(old,'touch-action','pan-y');
  important(old,'overscroll-behavior-y','contain');
  important(old,'background','rgba(9,30,43,.55)');
  important(old,'backdrop-filter','blur(5px)');

  const modal=old.querySelector('.student-modal');
  if(!modal)return;
  important(modal,'position','relative');
  important(modal,'inset','auto');
  important(modal,'display','block');
  important(modal,'width','min(980px,100%)');
  important(modal,'height','auto');
  important(modal,'min-height','100dvh');
  important(modal,'max-height','none');
  important(modal,'margin','0 auto');
  important(modal,'padding','16px');
  important(modal,'overflow','visible');
  important(modal,'touch-action','pan-y');
  important(modal,'background','#f7fbfb');
  important(modal,'box-sizing','border-box');

  const head=modal.querySelector('.student-modal-head');
  if(head){
    important(head,'position','sticky');
    important(head,'top','0px');
    important(head,'z-index','20');
    important(head,'margin','-16px -16px 12px');
    important(head,'padding','calc(10px + env(safe-area-inset-top)) 16px 10px');
    important(head,'background','rgba(247,251,251,.98)');
  }

  const close=modal.querySelector('.close-round,[data-nh7-close-student],[data-close-student]');
  if(close){
    close.type='button';
    close.setAttribute('aria-label','Close student profile');
  }

  if(!old.dataset.nh7V233Ready){
    old.dataset.nh7V233Ready='1';
    old.scrollTop=0;
    requestAnimationFrame(()=>{old.scrollTop=0;});
  }
}

/* Observe only nodes being inserted or removed. We intentionally do not
   watch class/style mutations, which caused the prior feedback loop. */
const observer=new MutationObserver(()=>requestAnimationFrame(hijackStudentOverlay));
observer.observe(document.documentElement,{childList:true,subtree:true});

/* Re-apply after every legacy render without changing its data/UI logic. */
const beforeRender=window.render;
if(typeof beforeRender==='function'){
  window.render=function(...args){
    const out=beforeRender.apply(this,args);
    requestAnimationFrame(hijackStudentOverlay);
    setTimeout(hijackStudentOverlay,60);
    return out;
  };
}

window.addEventListener('resize',()=>{
  const safe=document.querySelector('.'+SAFE_BACKDROP);
  if(safe)important(safe,'height','100dvh');
},{passive:true});
window.addEventListener('orientationchange',()=>setTimeout(hijackStudentOverlay,180),{passive:true});
requestAnimationFrame(hijackStudentOverlay);
window.NH7_ADMIN_VERSION='2.3.3-stage1';
})();
