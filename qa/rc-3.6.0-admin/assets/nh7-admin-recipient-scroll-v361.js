/* New Hope 7 Admin QA v3.6.1 — iOS-safe selected-recipient scrolling. */
(()=>{'use strict';
if(window.__NH7_ADMIN_RECIPIENT_SCROLL_V361__)return;
window.__NH7_ADMIN_RECIPIENT_SCROLL_V361__=true;
const isIOS=/iPad|iPhone|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
let savedScrollTop=0,currentHost=null,patchTimer=0;
const language=()=>document.documentElement.lang==='fa'?'fa':document.documentElement.lang==='hr'?'hr':'en';
const text=(fa,en,hr)=>language()==='fa'?fa:language()==='hr'?hr:en;
function addHint(host){
  if(document.getElementById('nh7V361RecipientScrollHint'))return;
  const hint=document.createElement('div');
  hint.id='nh7V361RecipientScrollHint';
  hint.className='nh7-v361-recipient-scroll-hint';
  hint.innerHTML=`<span>${text('برای دیدن همه نام‌ها، داخل همین کادر بالا و پایین بکشید.','Swipe inside this box to see all names.','Pomičite unutar ovog okvira za sva imena.')}</span><span><button type="button" data-v361-top>${text('ابتدا','Top','Vrh')}</button> <button type="button" data-v361-bottom>${text('انتها','Bottom','Dno')}</button></span>`;
  hint.querySelector('[data-v361-top]').addEventListener('click',()=>host.scrollTo({top:0,behavior:'smooth'}));
  hint.querySelector('[data-v361-bottom]').addEventListener('click',()=>host.scrollTo({top:host.scrollHeight,behavior:'smooth'}));
  host.insertAdjacentElement('beforebegin',hint);
}
function enable(host){
  if(!host)return;
  currentHost=host;
  if(host.dataset.nh7RecipientScrollV361==='1')return;
  host.dataset.nh7RecipientScrollV361='1';
  host.tabIndex=0;
  host.setAttribute('role','group');
  host.setAttribute('aria-label',text('فهرست مخاطبان قابل پیمایش','Scrollable recipient list','Pomični popis primatelja'));
  host.addEventListener('scroll',()=>{savedScrollTop=host.scrollTop},{passive:true});
  host.addEventListener('wheel',event=>event.stopPropagation(),{passive:true});
  host.addEventListener('keydown',event=>{
    const step=Math.max(120,Math.round(host.clientHeight*.75));
    if(event.key==='PageDown'){host.scrollBy({top:step,behavior:'smooth'});event.preventDefault()}
    else if(event.key==='PageUp'){host.scrollBy({top:-step,behavior:'smooth'});event.preventDefault()}
    else if(event.key==='Home'){host.scrollTo({top:0,behavior:'smooth'});event.preventDefault()}
    else if(event.key==='End'){host.scrollTo({top:host.scrollHeight,behavior:'smooth'});event.preventDefault()}
  });
  if(isIOS){
    let startY=0,startTop=0,dragging=false;
    host.addEventListener('touchstart',event=>{
      if(event.touches.length!==1)return;
      startY=event.touches[0].clientY;
      startTop=host.scrollTop;
      dragging=false;
    },{passive:true});
    host.addEventListener('touchmove',event=>{
      if(event.touches.length!==1)return;
      const delta=startY-event.touches[0].clientY;
      if(Math.abs(delta)<4)return;
      dragging=true;
      const max=Math.max(0,host.scrollHeight-host.clientHeight);
      const next=Math.max(0,Math.min(max,startTop+delta));
      host.scrollTop=next;
      event.stopPropagation();
      if(event.cancelable)event.preventDefault();
    },{passive:false});
    host.addEventListener('touchend',()=>{if(dragging)savedScrollTop=host.scrollTop},{passive:true});
  }
  addHint(host);
  requestAnimationFrame(()=>{
    const max=Math.max(0,host.scrollHeight-host.clientHeight);
    if(savedScrollTop>0&&max>0)host.scrollTop=Math.min(savedScrollTop,max);
  });
}
function patch(){
  const host=document.getElementById('nh7V360Recipients');
  if(!host){currentHost=null;return}
  enable(host);
  addHint(host);
  document.documentElement.style.overflowY='auto';
  document.body.style.overflowY='auto';
  document.body.style.touchAction='pan-y';
}
function schedule(){clearTimeout(patchTimer);patchTimer=setTimeout(patch,20)}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
window.addEventListener('pageshow',schedule);
setInterval(patch,900);
setTimeout(patch,80);
window.NH7_ADMIN_RECIPIENT_SCROLL_VERSION='3.6.1-recipient-scroll';
})();
