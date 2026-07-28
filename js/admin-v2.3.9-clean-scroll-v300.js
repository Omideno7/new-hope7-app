/* New Hope 7 Admin v3.0.0 — clean scroll recovery runtime */
(()=>{'use strict';
const VERSION='3.0.0-clean-scroll';
let scrollBlockUntil=0,explicitUntil=0,touching=false;
const now=()=>Date.now();
const userIsScrolling=()=>touching||now()<scrollBlockUntil;
function unlock(){
  const body=document.body,html=document.documentElement;if(!body||!html)return;
  body.classList.remove('nh7-f4-open','nh7-v239-preview-open','nh7-student-modal-open','nh7-admin-upload-lock');
  for(const prop of ['position','inset','top','right','bottom','left','width','height','maxHeight','overflow','overflowY'])body.style[prop]='';
  for(const prop of ['position','height','maxHeight','overflow','overflowY'])html.style[prop]='';
}
function noteScroll(){scrollBlockUntil=now()+1100}
window.addEventListener('touchstart',()=>{touching=true;noteScroll();unlock()},{passive:true,capture:true});
window.addEventListener('touchmove',noteScroll,{passive:true,capture:true});
window.addEventListener('touchend',()=>{touching=false;noteScroll()},{passive:true,capture:true});
window.addEventListener('touchcancel',()=>{touching=false;noteScroll()},{passive:true,capture:true});
window.addEventListener('scroll',noteScroll,{passive:true,capture:true});
window.addEventListener('wheel',noteScroll,{passive:true,capture:true});
document.addEventListener('pointerdown',event=>{if(event.target.closest?.('button,a,.tab,input,textarea,select,summary'))explicitUntil=now()+1400},{capture:true,passive:true});
document.addEventListener('click',event=>{if(event.target.closest?.('button,a,.tab'))explicitUntil=now()+1400},true);
function explicitAction(){return now()<explicitUntil}
try{
  if(typeof refreshTimer!=='undefined'&&refreshTimer){clearInterval(refreshTimer);refreshTimer=null}
}catch(_){}
try{
  if(typeof render==='function'&&!render.__nh7CleanScrollV300){
    const original=render;
    const wrapped=function(...args){
      if(userIsScrolling()&&!explicitAction())return null;
      return original.apply(this,args);
    };
    wrapped.__nh7CleanScrollV300=true;wrapped.__nh7Original=original;render=wrapped;
  }
}catch(error){console.warn('Clean scroll render guard',error)}
try{
  if(typeof loadAll==='function'&&!loadAll.__nh7CleanScrollV300){
    const original=loadAll;
    const wrapped=async function(...args){
      if(userIsScrolling()&&!explicitAction())return null;
      return original.apply(this,args);
    };
    wrapped.__nh7CleanScrollV300=true;wrapped.__nh7Original=original;loadAll=wrapped;
  }
}catch(error){console.warn('Clean scroll load guard',error)}
unlock();
const bodyObserver=new MutationObserver(()=>unlock());
if(document.body)bodyObserver.observe(document.body,{attributes:true,attributeFilter:['class','style']});
let badge=document.querySelector('.nh7-clean-scroll-badge');
if(!badge){badge=document.createElement('div');badge.className='nh7-clean-scroll-badge';badge.textContent='FIX 10 CLEAN SCROLL';document.body.appendChild(badge)}
window.NH7_ADMIN_CLEAN_SCROLL_VERSION=VERSION;
})();
