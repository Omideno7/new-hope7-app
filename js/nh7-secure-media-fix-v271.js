/* New Hope 7 secure media v2.7.1 — fullscreen fallback return fix */
(()=>{'use strict';
window.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||!document.body.classList.contains('nh7-media-fullscreen-fallback'))return;
  event.preventDefault();event.stopImmediatePropagation();
  document.body.classList.remove('nh7-media-fullscreen-fallback');
  const button=document.querySelector('[data-media-fullscreen]');
  if(button){const l=localStorage.getItem('nh7_lang')||'en';button.textContent=l==='fa'?'⛶ تمام‌صفحه':l==='hr'?'⛶ Cijeli zaslon':'⛶ Fullscreen'}
},true);
window.NH7_SECURE_MEDIA_FIX_VERSION='2.7.1';
})();