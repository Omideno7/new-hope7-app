/* Presentation only: current Web routes and profile remain authoritative. */
(()=>{'use strict';
const L=(fa,en,hr)=>localStorage.getItem('nh7_lang')==='fa'?fa:localStorage.getItem('nh7_lang')==='hr'?hr:en;
function sidebar(view,entries,label){
  if(!view||!entries.length||view.querySelector('.nh7-parity-split'))return;
  const split=document.createElement('div');split.className='nh7-parity-split';
  const aside=document.createElement('aside');aside.className='nh7-parity-sidebar';aside.setAttribute('aria-label',label);
  for(const item of entries){const button=document.createElement('button');button.type='button';button.className='secondary-btn';button.textContent=item.label;button.dataset.go=item.route;button.dataset.params=JSON.stringify(item.params);if(item.active)button.setAttribute('aria-current','page');aside.append(button)}
  const main=document.createElement('section');main.className='nh7-parity-content';while(view.firstChild)main.append(view.firstChild);
  split.append(aside,main);view.append(split);
}
let frame=0;
function nativePlatform(){
  try{return !!(window.Capacitor?.isNativePlatform?.()||['ios','android'].includes(window.Capacitor?.getPlatform?.())||window.cordova)}catch(_){return false}
}
function syncPlatform(){document.documentElement.classList.toggle('nh7-parity-native',nativePlatform())}
function measure(){
  frame=0;syncPlatform();const root=document.documentElement,header=document.querySelector('#appShell > .topbar'),nav=document.querySelector('#appShell > .bottom-nav');
  if(!header||!nav)return;
  for(const [key,node] of [['header',header],['nav',nav]]){const value=Math.ceil(node.getBoundingClientRect().height)+'px';if(root.style.getPropertyValue('--nh7-parity-'+key)!==value)root.style.setProperty('--nh7-parity-'+key,value)}
}
const schedule=()=>{if(!frame)frame=requestAnimationFrame(measure)};
let dialog=null,opener=null,zoom=1;
function close(){dialog?.close();opener?.focus();opener=null}
function setZoom(value){zoom=Math.max(1,Math.min(4,value));dialog.querySelector('img').style.transform=`scale(${zoom})`}
function openPhoto(target){
  const src=window.NH7ProfilePhotoV564?.read?.();if(!/^data:image\//.test(src||''))return;
  if(!dialog){
    dialog=document.createElement('dialog');dialog.className='nh7-parity-photo';dialog.innerHTML='<div class="nh7-parity-photo-controls"><button type="button" data-photo-close>×</button><button type="button" data-photo-out>−</button><button type="button" data-photo-reset>1×</button><button type="button" data-photo-in>+</button></div><div class="nh7-parity-photo-stage"><img draggable="false" alt=""></div>';
    document.body.append(dialog);
    dialog.querySelector('[data-photo-close]').onclick=close;dialog.querySelector('[data-photo-in]').onclick=()=>setZoom(zoom+.25);dialog.querySelector('[data-photo-out]').onclick=()=>setZoom(zoom-.25);dialog.querySelector('[data-photo-reset]').onclick=()=>setZoom(1);
    dialog.addEventListener('cancel',event=>{event.preventDefault();close()});
    dialog.addEventListener('click',event=>{if(event.target===dialog)close()});
  }
  opener=target;dialog.dir=localStorage.getItem('nh7_lang')==='fa'?'rtl':'ltr';
  dialog.setAttribute('aria-label',L('عکس پروفایل','Profile photo','Profilna fotografija'));
  const labels=[L('بستن','Close','Zatvori'),L('کوچک‌نمایی','Zoom out','Smanji'),L('اندازه اصلی','Reset zoom','Vrati povećanje'),L('بزرگ‌نمایی','Zoom in','Povećaj')];
  dialog.querySelectorAll('button').forEach((button,i)=>button.setAttribute('aria-label',labels[i]));
  const img=dialog.querySelector('img');img.src=src;img.alt=dialog.getAttribute('aria-label');setZoom(1);if(!dialog.open)dialog.showModal();
}
function enhancePhotos(){
  document.querySelectorAll('#nh7TopProfile564, #nh7HomeProfile564 .nh7-profile-avatar564, #nh7AccountProfile564 .nh7-profile-avatar564').forEach(node=>{
    if(!node.querySelector('img')){node.removeAttribute('role');node.removeAttribute('tabindex');return}
    node.setAttribute('role','button');node.tabIndex=0;node.setAttribute('aria-label',L('نمایش عکس پروفایل','View profile photo','Prikaži profilnu fotografiju'));
  });
  if(dialog?.open&&!window.NH7ProfilePhotoV564?.read?.())close();
}
function start(){
  syncPlatform();
  const header=document.querySelector('#appShell > .topbar'),nav=document.querySelector('#appShell > .bottom-nav');
  if(header&&nav){document.documentElement.classList.add('nh7-parity-chrome');const observer=new ResizeObserver(schedule);observer.observe(header);observer.observe(nav);schedule()}
  new MutationObserver(()=>{enhancePhotos();schedule()}).observe(document.body,{childList:true,subtree:true});enhancePhotos();
}
document.addEventListener('click',event=>{const target=event.target.closest?.('#nh7TopProfile564, #nh7HomeProfile564 .nh7-profile-avatar564, #nh7AccountProfile564 .nh7-profile-avatar564');if(target?.querySelector('img'))openPhoto(target)});
document.addEventListener('keydown',event=>{if(!['Enter',' '].includes(event.key))return;const target=event.target.closest?.('[role="button"]');if(target?.matches('#nh7TopProfile564,.nh7-profile-avatar564')){event.preventDefault();openPhoto(target)}});
window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);
window.NH7WebParityV573={sidebar,measure};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
