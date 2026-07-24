/* ============================================================
   New Hope 7 Admin v2.3.2 — stage 1 student profile scroll
   Dedicated inner scroll area; header and close button stay visible.
   No school, analytics, Audio Bible, library, document or data logic
   is changed by this patch.
   ============================================================ */
(()=>{'use strict';
const OPEN_CLASS='nh7-student-detail-open-v232';
let scheduled=false;

function important(el,name,value){
  if(el)el.style.setProperty(name,value,'important');
}

function clearPageLock(){
  const html=document.documentElement,body=document.body;
  html.classList.add(OPEN_CLASS);
  body.classList.add(OPEN_CLASS);
  /* Older v2.2.5 wrappers may add position:fixed to BODY. Neutralize
     that with inline !important values instead of deleting their classes. */
  important(html,'height','100%');
  important(html,'overflow','hidden');
  important(body,'position','static');
  important(body,'top','auto');
  important(body,'right','auto');
  important(body,'bottom','auto');
  important(body,'left','auto');
  important(body,'inset','auto');
  important(body,'width','auto');
  important(body,'height','auto');
  important(body,'overflow','hidden');
}

function releasePageLock(){
  const html=document.documentElement,body=document.body;
  html.classList.remove(OPEN_CLASS);
  body.classList.remove(OPEN_CLASS);
  for(const el of [html,body]){
    for(const p of ['height','overflow','position','top','right','bottom','left','inset','width']){
      el.style.removeProperty(p);
    }
  }
}

function prepareStudentProfileV232(){
  scheduled=false;
  const back=document.querySelector('.student-modal-backdrop');
  if(!back){releasePageLock();return;}
  clearPageLock();

  back.setAttribute('role','dialog');
  back.setAttribute('aria-modal','true');
  important(back,'position','fixed');
  important(back,'inset','0px');
  important(back,'display','flex');
  important(back,'align-items','stretch');
  important(back,'justify-content','center');
  important(back,'width','100%');
  important(back,'height','100dvh');
  important(back,'max-height','100dvh');
  important(back,'margin','0px');
  important(back,'padding','0px');
  important(back,'overflow','hidden');
  /* Do not use touch-action:none on an ancestor of the scroller.
     Safari intersects touch-action through the ancestor chain. */
  important(back,'touch-action','pan-y');
  important(back,'overscroll-behavior','contain');

  const modal=back.querySelector('.student-modal');
  if(!modal)return;
  const head=modal.querySelector(':scope > .student-modal-head')||modal.querySelector('.student-modal-head');
  let scroller=modal.querySelector(':scope > .nh7-student-modal-scroll-v232');

  if(!scroller){
    scroller=document.createElement('div');
    scroller.className='nh7-student-modal-scroll-v232';
    for(const node of Array.from(modal.childNodes)){
      if(node!==head)scroller.appendChild(node);
    }
    modal.appendChild(scroller);
  }else{
    for(const node of Array.from(modal.childNodes)){
      if(node!==head&&node!==scroller)scroller.appendChild(node);
    }
  }

  modal.setAttribute('tabindex','-1');
  important(modal,'position','relative');
  important(modal,'inset','auto');
  important(modal,'display','flex');
  important(modal,'flex-direction','column');
  important(modal,'width','100%');
  important(modal,'height','100dvh');
  important(modal,'min-height','0px');
  important(modal,'max-height','100dvh');
  important(modal,'margin','0px');
  important(modal,'padding','0px');
  important(modal,'overflow','hidden');
  important(modal,'touch-action','pan-y');

  if(head){
    important(head,'position','relative');
    important(head,'top','auto');
    important(head,'flex','0 0 auto');
    important(head,'margin','0px');
    important(head,'padding','calc(10px + env(safe-area-inset-top)) 14px 10px');
  }

  important(scroller,'display','block');
  important(scroller,'flex','1 1 0%');
  important(scroller,'height','0px');
  important(scroller,'min-height','0px');
  important(scroller,'max-height','none');
  important(scroller,'width','100%');
  important(scroller,'padding','0 14px calc(34px + env(safe-area-inset-bottom))');
  important(scroller,'overflow-y','scroll');
  important(scroller,'overflow-x','hidden');
  important(scroller,'-webkit-overflow-scrolling','touch');
  important(scroller,'overscroll-behavior-y','contain');
  important(scroller,'touch-action','pan-y');

  const close=modal.querySelector('.close-round,[data-nh7-close-student],[data-close-student]');
  if(close){
    close.type='button';
    close.setAttribute('aria-label','Close student profile');
  }

  if(!scroller.dataset.nh7V232Ready){
    scroller.dataset.nh7V232Ready='1';
    scroller.scrollTop=0;
  }
}

function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>requestAnimationFrame(prepareStudentProfileV232));
}

const previousRender=window.render;
if(typeof previousRender==='function'){
  window.render=function(...args){
    const out=previousRender.apply(this,args);
    schedule();
    setTimeout(prepareStudentProfileV232,60);
    setTimeout(prepareStudentProfileV232,180);
    return out;
  };
}

const observer=new MutationObserver(schedule);
observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
window.addEventListener('resize',schedule,{passive:true});
window.addEventListener('orientationchange',()=>setTimeout(prepareStudentProfileV232,180),{passive:true});
schedule();
window.NH7_ADMIN_VERSION='2.3.2-stage1';
})();
