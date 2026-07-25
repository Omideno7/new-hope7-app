/* ============================================================
   New Hope 7 Admin v2.3.6 — canonical student profile test
   - Does not move or wrap profile content
   - The modal itself is the only scroll container
   - Background stays locked
   - Close button bypasses all legacy close handlers
   - Existing student analytics rendering stays untouched
   ============================================================ */
(()=>{'use strict';
const LEGACY_BACKDROP='student-modal-backdrop';
const SAFE_BACKDROP='nh7-student-overlay-v236';
const SAFE_CLOSE='nh7-student-close-v236';
let savedScrollY=0;
let active=false;
let closing=false;

function important(el,name,value){if(el)el.style.setProperty(name,value,'important');}
function isProfileBackdrop(back){
  if(!back||back.id==='nh7EmailModal')return false;
  const modal=back.querySelector('.student-modal');
  return !!modal&&!modal.classList.contains('email-modal');
}
function findLegacyProfile(){
  return Array.from(document.querySelectorAll('.'+LEGACY_BACKDROP)).find(isProfileBackdrop)||null;
}
function clearLegacyLocks(){
  const body=document.body;
  body.classList.remove('nh7-student-lock-v226','nh7-student-modal-open','nh7-student-detail-open-v227','nh7-student-detail-open-v228');
  body.style.removeProperty('--nh7-lock-scroll-y');
}
function lockPage(){
  if(!active)savedScrollY=window.scrollY||document.documentElement.scrollTop||0;
  active=true;
  clearLegacyLocks();
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
  clearLegacyLocks();
  requestAnimationFrame(()=>window.scrollTo(0,savedScrollY));
}
function clearStudentSelection(){
  try{selectedStudentEmail=''}catch(_){ }
  try{Function("selectedStudentEmail='';")()}catch(_){ }
}
function closeProfile(event){
  if(event){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();}
  if(closing)return false;
  closing=true;
  clearStudentSelection();
  unlockPage();
  try{Function('render();')()}catch(error){
    try{if(typeof window.render==='function')window.render()}catch(inner){console.error('NH7 close student profile',inner)}
  }
  setTimeout(()=>{closing=false},250);
  return false;
}
function replaceCloseButton(modal){
  const old=modal.querySelector('.student-modal-head .close-round,[data-nh7-close-student],[data-close-student],.'+SAFE_CLOSE);
  if(!old)return;
  if(old.classList.contains(SAFE_CLOSE))return;
  const button=old.cloneNode(true);
  button.classList.remove('close-round');
  button.classList.add(SAFE_CLOSE);
  button.removeAttribute('onclick');
  button.removeAttribute('data-nh7-close-student');
  button.removeAttribute('data-close-student');
  button.type='button';
  button.setAttribute('aria-label','Close student profile');
  button.setAttribute('title','Close');
  important(button,'position','relative');
  important(button,'z-index','100');
  important(button,'display','grid');
  important(button,'place-items','center');
  important(button,'width','46px');
  important(button,'height','46px');
  important(button,'min-width','46px');
  important(button,'border','0');
  important(button,'border-radius','50%');
  important(button,'background','#b42318');
  important(button,'color','#fff');
  important(button,'font-size','26px');
  important(button,'line-height','1');
  important(button,'cursor','pointer');
  important(button,'pointer-events','auto');
  important(button,'touch-action','manipulation');
  button.onclick=closeProfile;
  button.ontouchend=closeProfile;
  old.replaceWith(button);
}
function installBoundaryGuard(modal){
  if(modal.dataset.nh7BoundaryGuardV236)return;
  modal.dataset.nh7BoundaryGuardV236='1';
  let lastY=0;
  modal.addEventListener('touchstart',event=>{
    lastY=event.touches?.[0]?.clientY||0;
    const max=Math.max(0,modal.scrollHeight-modal.clientHeight);
    if(max>0){
      if(modal.scrollTop<=0)modal.scrollTop=1;
      else if(modal.scrollTop>=max)modal.scrollTop=Math.max(1,max-1);
    }
  },{passive:true});
  modal.addEventListener('touchmove',event=>{
    const y=event.touches?.[0]?.clientY||lastY;
    const delta=y-lastY;
    lastY=y;
    const max=Math.max(0,modal.scrollHeight-modal.clientHeight);
    if(max<=0)return;
    const atTop=modal.scrollTop<=1;
    const atBottom=modal.scrollTop>=max-1;
    if((atTop&&delta>0)||(atBottom&&delta<0))event.preventDefault();
  },{passive:false});
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
  important(modal,'position','relative');
  important(modal,'inset','auto');
  important(modal,'display','block');
  important(modal,'width','min(980px,100%)');
  important(modal,'height','100dvh');
  important(modal,'min-height','0px');
  important(modal,'max-height','100dvh');
  important(modal,'margin','0 auto');
  important(modal,'padding','16px');
  important(modal,'overflow-y','auto');
  important(modal,'overflow-x','hidden');
  important(modal,'-webkit-overflow-scrolling','touch');
  important(modal,'overscroll-behavior-y','none');
  important(modal,'touch-action','pan-y');
  important(modal,'background','#f7fbfb');
  important(modal,'box-sizing','border-box');
  important(modal,'border-radius','0px');

  const head=modal.querySelector('.student-modal-head');
  if(head){
    important(head,'position','sticky');
    important(head,'top','-16px');
    important(head,'z-index','80');
    important(head,'margin','-16px -16px 12px');
    important(head,'padding','calc(10px + env(safe-area-inset-top)) 16px 10px');
    important(head,'background','rgba(247,251,251,.98)');
    important(head,'border-bottom','1px solid #d8ecea');
  }
  replaceCloseButton(modal);
  installBoundaryGuard(modal);
  if(!modal.dataset.nh7ReadyV236){
    modal.dataset.nh7ReadyV236='1';
    modal.scrollTop=0;
  }

  try{
    const email=String(selectedStudentEmail||'').trim().toLowerCase();
    if(email&&typeof window.nh7LoadStudentV223==='function'){
      state.studentActivityV223=state.studentActivityV223&&typeof state.studentActivityV223==='object'?state.studentActivityV223:{};
      if(!state.studentActivityV223[email])window.nh7LoadStudentV223(email,true).catch(console.warn);
    }
  }catch(error){console.warn('NH7 activity retry',error)}
}
const observer=new MutationObserver(()=>requestAnimationFrame(prepareProfile));
observer.observe(document.documentElement,{childList:true,subtree:true});
const beforeRender=window.render;
if(typeof beforeRender==='function'){
  window.render=function(...args){
    const out=beforeRender.apply(this,args);
    requestAnimationFrame(prepareProfile);
    return out;
  };
}
window.addEventListener('orientationchange',()=>setTimeout(prepareProfile,160),{passive:true});
requestAnimationFrame(prepareProfile);
window.NH7_ADMIN_VERSION='2.3.6-stage1';
})();
