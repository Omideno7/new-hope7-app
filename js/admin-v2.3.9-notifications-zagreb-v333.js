/* New Hope 7 Admin v3.3.3 — Croatia-reference schedules + real user broadcast */
(()=>{'use strict';
const VERSION='3.3.3-admin-zagreb-notifications';
const L=(fa,en,hr)=>typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en;
function note(){return L('⏰ تمام ساعت‌های این صفحه بر اساس ساعت کرواسی (Europe/Zagreb) هستند. کاربران در هر کشور همان اعلان را در لحظهٔ متناظرِ منطقهٔ زمانی خود دریافت می‌کنند.','⏰ Every time on this page is Croatia time (Europe/Zagreb). Users worldwide receive the same notification at the corresponding local instant.','⏰ Sva vremena na ovoj stranici su prema Hrvatskoj (Europe/Zagreb). Korisnici primaju obavijest u odgovarajućem lokalnom trenutku.')}
function decorate(){
  if(typeof activeTab!=='undefined'&&activeTab!=='notifications')return;
  document.querySelectorAll('[id^="ns_tz_"]').forEach(input=>{input.value='Europe/Zagreb';input.readOnly=true;input.setAttribute('aria-label','Europe/Zagreb');input.style.background='#f3f7f7';input.style.color='#475467'});
  const panel=[...document.querySelectorAll('.panel-card')].find(x=>x.querySelector('[id^="ns_time_"]'));if(panel&&!panel.querySelector('[data-nh7-zagreb-note-v333]')){const div=document.createElement('div');div.dataset.nh7ZagrebNoteV333='1';div.className='notice';div.innerHTML=`<strong>${note()}</strong>`;panel.querySelector('h3')?.insertAdjacentElement('afterend',div)}
  const send=[...document.querySelectorAll('.panel-card')].find(x=>x.querySelector('#bc_title_fa'));if(send&&!send.querySelector('[data-nh7-broadcast-note-v333]')){const div=document.createElement('div');div.dataset.nh7BroadcastNoteV333='1';div.className='notice';div.textContent=L('«ارسال اکنون» یک Push واقعی برای کاربران اپ می‌فرستد و همان پیام را در Inbox نیز ثبت می‌کند.','“Send now” sends a real push to app users and also records it in Inbox.','“Pošalji sada” šalje stvarnu push obavijest i sprema je u Inbox.');send.querySelector('h3')?.insertAdjacentElement('afterend',div)}
}
function ensureTimezone(key){const input=document.getElementById('ns_tz_'+key);if(input)input.value='Europe/Zagreb'}
function install(){
  if(typeof render!=='function'||typeof authFetch!=='function')return false;
  if(typeof saveSchedule==='function'&&!saveSchedule.__nh7ZagrebV333){const original=saveSchedule;const wrapped=async function(key){ensureTimezone(key);return original(key)};wrapped.__nh7ZagrebV333=true;saveSchedule=window.saveSchedule=wrapped}
  sendBroadcast=window.sendBroadcast=async function(){
    const read=id=>String(document.getElementById(id)?.value||'').trim();
    const titles={fa:read('bc_title_fa'),en:read('bc_title_en'),hr:read('bc_title_hr')},bodies={fa:read('bc_body_fa'),en:read('bc_body_en'),hr:read('bc_body_hr')};
    const fallbackTitle=titles.fa||titles.en||titles.hr,fallbackBody=bodies.fa||bodies.en||bodies.hr;if(!fallbackTitle||!fallbackBody){alert(L('عنوان و متن پیام را وارد کنید.','Enter a title and message.','Unesite naslov i poruku.'));return}
    const id=typeof uuid==='function'?uuid():(crypto.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2));
    const row={id,event_type:'user_broadcast',source_table:'admin_manual',source_id:id,title_fa:titles.fa||fallbackTitle,title_en:titles.en||fallbackTitle,title_hr:titles.hr||fallbackTitle,body_fa:bodies.fa||fallbackBody,body_en:bodies.en||fallbackBody,body_hr:bodies.hr||fallbackBody,status:'pending',attempt_count:0,last_error:''};
    try{await authFetch('/rest/v1/admin_notification_events',{method:'POST',body:JSON.stringify(row)});if(typeof setMessage==='function')setMessage(L('پیام در صف ارسال Push قرار گرفت و حداکثر تا حدود یک دقیقه ارسال می‌شود.','The push is queued and should be sent within about one minute.','Push je stavljen u red i bit će poslan za otprilike jednu minutu.'),'success');else alert(L('پیام در صف ارسال قرار گرفت.','Push queued.','Push je stavljen u red.'));['fa','en','hr'].forEach(l=>{const t=document.getElementById('bc_title_'+l),b=document.getElementById('bc_body_'+l);if(t)t.value='';if(b)b.value=''})}catch(error){alert(error?.message||String(error))}
  };
  const originalRender=render;render=window.render=function(...args){const out=originalRender.apply(this,args);requestAnimationFrame(decorate);return out};
  if(typeof setTab==='function'){const originalSetTab=setTab;setTab=window.setTab=function(tab){const out=originalSetTab.apply(this,arguments);if(tab==='notifications')requestAnimationFrame(decorate);return out}}
  requestAnimationFrame(decorate);window.NH7_ADMIN_NOTIFICATIONS_ZAGREB_VERSION=VERSION;return true
}
let tries=0;const boot=()=>{tries++;if(install())return;if(tries<80)setTimeout(boot,50)};boot();
})();
