/* ============================================================
   New Hope 7 Admin v2.3.5 — bounded student profile scroll + close
   - Locks the page behind the modal
   - Uses one dedicated inner scroll area
   - Prevents iOS scroll chaining / excessive bounce
   - Replaces the legacy close button with an isolated native button
   ============================================================ */
(()=>{'use strict';
const LEGACY_BACKDROP='student-modal-backdrop';
const SAFE_BACKDROP='nh7-student-overlay-v235';
const SCROLLER='nh7-student-scroll-v235';
const CLOSE='nh7-student-close-v235';
let savedScrollY=0;
let active=false;
let closing=false;

function important(el,name,value){if(el)el.style.setProperty(name,value,'important');}
function isProfileBackdrop(back){
  if(!back||back.id==='nh7EmailModal')return false;
  const modal=back.querySelector('.student-modal');
  if(!modal||modal.classList.contains('email-modal'))return false;
  try{return !!String(selectedStudentEmail||'').trim()}catch(_){return true}
}
function findLegacyProfile(){
  return Array.from(document.querySelectorAll('.'+LEGACY_BACKDROP)).find(isProfileBackdrop)||null;
}
function clearLegacyClasses(){
  document.body.classList.remove(
    'nh7-student-lock-v226',
    'nh7-student-modal-open',
    'nh7-student-detail-open-v227',
    'nh7-student-detail-open-v228'
  );
  document.body.style.removeProperty('--nh7-lock-scroll-y');
}
function lockPage(){
  if(!active)savedScrollY=window.scrollY||document.documentElement.scrollTop||0;
  active=true;
  clearLegacyClasses();
  const html=document.documentElement,body=document.body;
  important(html,'overflow','hidden');
  important(html,'height','100%');
  important(body,'position','fixed');
  important(body,'top',`${-savedScrollY}px`);
  important(body,'left','0px');
  important(body,'right','0px');
  important(body,'width','100%');
  important(body,'height','100%');
  important(body,'overflow','hidden');
}
function unlockPage(){
  if(!active)return;
  active=false;
  const html=document.documentElement,body=document.body;
  for(const p of ['overflow','height'])html.style.removeProperty(p);
  for(const p of ['position','top','left','right','width','height','overflow'])body.style.removeProperty(p);
  clearLegacyClasses();
  requestAnimationFrame(()=>window.scrollTo(0,savedScrollY));
}
function clearStudentSelectionFallback(){
  try{window.selectedStudentEmail=''}catch(_){}
  try{Function("try{selectedStudentEmail=''}catch(_){ }")()}catch(_){}
}
function closeProfileNow(event){
  if(event){
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }
  if(closing)return false;
  closing=true;

  const safe=document.querySelector('.'+SAFE_BACKDROP);
  if(safe)safe.remove();
  unlockPage();

  let handled=false;
  try{
    if(typeof window.closeStudentDashboard==='function'){
      window.closeStudentDashboard();
      handled=true;
    }
  }catch(error){console.warn('NH7 legacy close fallback',error)}

  if(!handled){
    clearStudentSelectionFallback();
    try{if(typeof window.render==='function')window.render()}catch(error){console.error('NH7 student close v2.3.5',error)}
  }

  setTimeout(()=>{closing=false},350);
  return false;
}
function replaceCloseButton(button){
  if(!button)return null;
  if(button.classList.contains(CLOSE))return button;

  /* Clone the control so all old inline/direct listeners are discarded. */
  const fresh=button.cloneNode(true);
  fresh.classList.remove('close-round');
  fresh.removeAttribute('data-nh7-close-student');
  fresh.removeAttribute('data-close-student');
  fresh.removeAttribute('onclick');
  fresh.classList.add(CLOSE);
  fresh.type='button';
  fresh.setAttribute('aria-label','Close student profile');
  fresh.setAttribute('title','Close');
  fresh.dataset.nh7CloseBound='1';

  important(fresh,'position','relative');
  important(fresh,'z-index','100');
  important(fresh,'display','grid');
  important(fresh,'place-items','center');
  important(fresh,'width','48px');
  important(fresh,'height','48px');
  important(fresh,'min-width','48px');
  important(fresh,'border','0');
  important(fresh,'border-radius','50%');
  important(fresh,'background','#b42318');
  important(fresh,'color','#fff');
  important(fresh,'font-size','27px');
  important(fresh,'line-height','1');
  important(fresh,'cursor','pointer');
  important(fresh,'pointer-events','auto');
  important(fresh,'touch-action','manipulation');
  important(fresh,'-webkit-appearance','none');
  important(fresh,'user-select','none');

  /* Native property handlers work reliably in iOS PWA/Safari. */
  fresh.onclick=closeProfileNow;
  fresh.ontouchend=closeProfileNow;
  fresh.addEventListener('pointerup',closeProfileNow,{capture:true});
  fresh.addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key===' ')closeProfileNow(event);
  },true);

  button.replaceWith(fresh);
  return fresh;
}
function nudgeScrollBoundary(scroller){
  if(scroller.scrollHeight<=scroller.clientHeight)return;
  if(scroller.scrollTop<=0)scroller.scrollTop=1;
  else if(scroller.scrollTop+scroller.clientHeight>=scroller.scrollHeight)scroller.scrollTop=scroller.scrollHeight-scroller.clientHeight-1;
}
function prepareProfile(){
  const back=findLegacyProfile();
  if(!back){
    if(!document.querySelector('.'+SAFE_BACKDROP))unlockPage();
    return;
  }
  lockPage();
  back.classList.remove(LEGACY_BACKDROP);
  back.classList.add(SAFE_BACKDROP);
  back.setAttribute('role','dialog');
  back.setAttribute('aria-modal','true');

  important(back,'position','fixed');
  important(back,'inset','0px');
  important(back,'z-index','2147483000');
  important(back,'display','flex');
  important(back,'align-items','stretch');
  important(back,'justify-content','center');
  important(back,'width','100%');
  important(back,'height','100dvh');
  important(back,'padding','0px');
  important(back,'margin','0px');
  important(back,'overflow','hidden');
  important(back,'touch-action','pan-y');
  important(back,'background','rgba(9,30,43,.55)');

  const modal=back.querySelector('.student-modal');
  if(!modal)return;
  const head=modal.querySelector(':scope > .student-modal-head')||modal.querySelector('.student-modal-head');
  let scroller=modal.querySelector(':scope > .'+SCROLLER);
  if(!scroller){
    scroller=document.createElement('div');
    scroller.className=SCROLLER;
    for(const node of Array.from(modal.childNodes)){
      if(node!==head)scroller.appendChild(node);
    }
    modal.appendChild(scroller);
  }

  important(modal,'position','relative');
  important(modal,'display','flex');
  important(modal,'flex-direction','column');
  important(modal,'width','min(980px,100%)');
  important(modal,'height','100dvh');
  important(modal,'min-height','0px');
  important(modal,'max-height','100dvh');
  important(modal,'margin','0 auto');
  important(modal,'padding','0px');
  important(modal,'overflow','hidden');
  important(modal,'background','#f7fbfb');
  important(modal,'border-radius','0px');

  if(head){
    important(head,'position','relative');
    important(head,'top','auto');
    important(head,'flex','0 0 auto');
    important(head,'margin','0px');
    important(head,'padding','calc(10px + env(safe-area-inset-top)) 14px 10px');
    important(head,'background','rgba(247,251,251,.98)');
    important(head,'border-bottom','1px solid #d8ecea');
  }

  important(scroller,'display','block');
  important(scroller,'flex','1 1 auto');
  important(scroller,'min-height','0px');
  important(scroller,'width','100%');
  important(scroller,'padding','0 16px calc(24px + env(safe-area-inset-bottom))');
  important(scroller,'overflow-y','auto');
  important(scroller,'overflow-x','hidden');
  important(scroller,'-webkit-overflow-scrolling','touch');
  important(scroller,'touch-action','pan-y');
  important(scroller,'overscroll-behavior-y','contain');
  important(scroller,'box-sizing','border-box');

  const close=modal.querySelector('.close-round,[data-nh7-close-student],[data-close-student],.'+CLOSE);
  replaceCloseButton(close);

  if(!scroller.dataset.nh7TouchGuard){
    scroller.dataset.nh7TouchGuard='1';
    scroller.addEventListener('touchstart',()=>nudgeScrollBoundary(scroller),{passive:true});
  }
  if(!back.dataset.nh7OutsideGuard){
    back.dataset.nh7OutsideGuard='1';
    back.addEventListener('touchmove',event=>{
      if(!event.target.closest?.('.'+SCROLLER))event.preventDefault();
    },{passive:false});
  }
  if(!scroller.dataset.nh7Ready){
    scroller.dataset.nh7Ready='1';
    scroller.scrollTop=0;
  }
}

const observer=new MutationObserver(()=>requestAnimationFrame(prepareProfile));
observer.observe(document.documentElement,{childList:true,subtree:true});
const beforeRender=window.render;
if(typeof beforeRender==='function'){
  window.render=function(...args){
    const out=beforeRender.apply(this,args);
    requestAnimationFrame(prepareProfile);
    setTimeout(prepareProfile,60);
    return out;
  };
}
window.addEventListener('resize',prepareProfile,{passive:true});
window.addEventListener('orientationchange',()=>setTimeout(prepareProfile,180),{passive:true});
requestAnimationFrame(prepareProfile);
window.NH7_ADMIN_VERSION='2.3.5-stage1';
})();
