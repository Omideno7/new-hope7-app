/* New Hope 7 Admin v3.1.3 — guarantee visible video management entry */
(()=>{'use strict';
const VERSION='3.1.3-video-visible';
const L=(fa,en,hr)=>typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en;
function ensure(){
  try{
    const nav=document.querySelector('.tabs');
    if(nav&&!nav.querySelector('[data-nh7-video-direct]')){
      const button=document.createElement('button');
      button.type='button';
      button.className='tab';
      button.dataset.nh7VideoDirect='1';
      button.textContent='🎬 '+L('ویدیوها','Videos','Videozapisi');
      button.addEventListener('click',()=>{if(typeof setTab==='function')setTab('videos')});
      const audio=[...nav.querySelectorAll('.tab')].find(x=>String(x.getAttribute('onclick')||'').includes('schoolaudio')||String(x.textContent||'').includes('صوت مدرسه'));
      if(audio?.nextSibling)nav.insertBefore(button,audio.nextSibling);else nav.appendChild(button);
    }
    const direct=nav?.querySelector('[data-nh7-video-direct]');
    if(direct)direct.classList.toggle('active',typeof activeTab!=='undefined'&&activeTab==='videos');
    if(typeof activeTab!=='undefined'&&activeTab==='schoolaudio'){
      const host=document.querySelector('#adminContent,.admin-content,main')||document.querySelector('.admin-shell');
      if(host&&!document.querySelector('[data-nh7-video-shortcut]')){
        const card=document.createElement('section');
        card.className='panel-card';
        card.dataset.nh7VideoShortcut='1';
        card.innerHTML=`<div class="req-head"><div><h3>🎬 ${L('ویدیوها و رسانه‌های تصویری','Videos and visual media','Videozapisi i vizualni mediji')}</h3><p class="muted small">${L('آپلود ویدیو مستقل از صوت مدرسه است و در بخش ویدیوهای اپ نمایش داده می‌شود.','Video uploads are independent from School audio and appear in the app video portal.','Videozapisi su odvojeni od školskog audio sadržaja.')}</p></div><button type="button" class="btn primary" data-open-videos>${L('باز کردن مدیریت ویدیوها','Open video management','Otvori upravljanje videom')}</button></div>`;
        card.querySelector('[data-open-videos]')?.addEventListener('click',()=>{if(typeof setTab==='function')setTab('videos')});
        const panels=host.querySelectorAll('.panel-card');
        if(panels.length)panels[panels.length-1].insertAdjacentElement('afterend',card);else host.appendChild(card);
      }
    }else document.querySelector('[data-nh7-video-shortcut]')?.remove();
  }catch(error){console.warn('Video visibility bridge',error)}
}
if(typeof render==='function'&&!render.__nh7VideoVisibleV313){const old=render;const wrapped=function(...args){const out=old.apply(this,args);requestAnimationFrame(ensure);return out};wrapped.__nh7VideoVisibleV313=true;render=wrapped}
window.NH7_ADMIN_VIDEO_VISIBLE_VERSION=VERSION;
requestAnimationFrame(ensure);
})();
