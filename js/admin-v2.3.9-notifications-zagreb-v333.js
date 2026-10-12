/* New Hope 7 Admin v3.3.4 — dynamic Zagreb notification schedules + real push broadcasts */
(()=>{'use strict';
const VERSION='3.3.4-admin-dynamic-notifications';
const L=(fa,en,hr)=>typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en;
const DAY_LABELS=()=>[
  L('یکشنبه','Sun','Ned'),L('دوشنبه','Mon','Pon'),L('سه‌شنبه','Tue','Uto'),L('چهارشنبه','Wed','Sri'),L('پنجشنبه','Thu','Čet'),L('جمعه','Fri','Pet'),L('شنبه','Sat','Sub')
];
function note(){return L('⏰ همه ساعت‌ها بر اساس ساعت کرواسی (Europe/Zagreb) هستند. تغییر ساعت یا ساخت برنامهٔ جدید مستقیماً در Supabase ذخیره می‌شود و موتور اعلان مرکزی بدون نیاز به انتشار نسخهٔ جدید اپ آن را اجرا می‌کند.','⏰ All times use Croatia time (Europe/Zagreb). Time changes and new schedules are saved directly in Supabase and are picked up by the central notification engine without a new app release.','⏰ Sva vremena koriste hrvatsko vrijeme (Europe/Zagreb). Promjene vremena i novi rasporedi spremaju se izravno u Supabase i središnji sustav obavijesti ih preuzima bez nove verzije aplikacije.')}
function ensureTimezone(key){const input=document.getElementById('ns_tz_'+key);if(input)input.value='Europe/Zagreb'}
function scheduleRow(key){return Array.isArray(state?.schedules)?state.schedules.find(x=>String(x.key)===String(key)):null}
function dayInputsHtml(key,selected){const labels=DAY_LABELS(),set=new Set(Array.isArray(selected)?selected.map(Number):[0,1,2,3,4,5,6]);return '<div class="nh7-schedule-days-v334" data-key="'+String(key).replace(/"/g,'&quot;')+'"><div class="muted small" style="margin-bottom:6px">'+L('روزهای ارسال','Send days','Dani slanja')+'</div><div style="display:flex;flex-wrap:wrap;gap:7px">'+labels.map((label,i)=>'<label class="pill" style="cursor:pointer"><input type="checkbox" data-nh7-day="'+i+'" '+(set.has(i)?'checked':'')+'> '+label+'</label>').join('')+'</div></div>'}
function selectedDays(key){const box=document.querySelector('.nh7-schedule-days-v334[data-key="'+CSS.escape(String(key))+'"]');if(!box)return Array.isArray(scheduleRow(key)?.days_of_week)?scheduleRow(key).days_of_week.map(Number):[0,1,2,3,4,5,6];return [...box.querySelectorAll('[data-nh7-day]:checked')].map(x=>Number(x.dataset.nh7Day)).filter(Number.isInteger)}
function createDays(){return [...document.querySelectorAll('#nh7NewScheduleDaysV334 [data-nh7-new-day]:checked')].map(x=>Number(x.dataset.nh7NewDay)).filter(Number.isInteger)}
function read(id){return String(document.getElementById(id)?.value||'').trim()}
function createPanel(){
  if(document.getElementById('nh7NewScheduleV334'))return;
  const schedulePanel=[...document.querySelectorAll('.panel-card')].find(x=>x.querySelector('[id^="ns_time_"]'));if(!schedulePanel)return;
  const section=document.createElement('section');section.id='nh7NewScheduleV334';section.className='panel-card';
  section.innerHTML=`<h3>➕ ${L('ساخت اعلان زمان‌بندی‌شده جدید','Create new scheduled notification','Izradi novu zakazanu obavijest')}</h3>
  <p class="muted small">${L('این اعلان پس از ذخیره، مثل برنامه‌های اصلی به‌صورت خودکار توسط موتور مرکزی اجرا می‌شود.','After saving, this notification is handled automatically by the same central scheduler.','Nakon spremanja, ovu obavijest automatski obrađuje isti središnji raspored.')}</p>
  <div class="grid2"><label>${L('ساعت ارسال','Send time','Vrijeme slanja')}<input id="nh7NewScheduleTimeV334" type="time" value="09:00"></label><label>${L('منطقه زمانی','Timezone','Vremenska zona')}<input value="Europe/Zagreb" readonly style="background:#f3f7f7;color:#475467"></label></div>
  <div id="nh7NewScheduleDaysV334" style="margin:9px 0">${dayInputsHtml('__new__',[0,1,2,3,4,5,6]).replace(/data-nh7-day=/g,'data-nh7-new-day=')}</div>
  <div class="grid2"><input id="nh7NewTitleFaV334" placeholder="${L('عنوان فارسی','Persian title','Perzijski naslov')}"><input id="nh7NewTitleEnV334" placeholder="${L('عنوان انگلیسی','English title','Engleski naslov')}"><input id="nh7NewTitleHrV334" placeholder="${L('عنوان کرواتی','Croatian title','Hrvatski naslov')}"></div>
  <textarea id="nh7NewBodyFaV334" placeholder="${L('متن فارسی','Persian message','Perzijska poruka')}"></textarea><textarea id="nh7NewBodyEnV334" placeholder="${L('متن انگلیسی','English message','Engleska poruka')}"></textarea><textarea id="nh7NewBodyHrV334" placeholder="${L('متن کرواتی','Croatian message','Hrvatska poruka')}"></textarea>
  <label style="display:block;margin:8px 0"><input id="nh7NewActiveV334" type="checkbox" checked> ${L('فعال باشد','Active','Aktivno')}</label>
  <button class="btn primary" onclick="nh7CreateScheduleV334()">➕ ${L('ساخت و فعال‌سازی برنامه','Create schedule','Izradi raspored')}</button>`;
  schedulePanel.insertAdjacentElement('afterend',section)
}
function decorateScheduleCards(){
  document.querySelectorAll('[id^="ns_tz_"]').forEach(input=>{input.value='Europe/Zagreb';input.readOnly=true;input.setAttribute('aria-label','Europe/Zagreb');input.style.background='#f3f7f7';input.style.color='#475467'});
  document.querySelectorAll('[id^="ns_time_"]').forEach(time=>{const key=time.id.slice('ns_time_'.length),card=time.closest('.request-card');if(!card)return;let days=card.querySelector('.nh7-schedule-days-v334');if(!days){const row=scheduleRow(key),wrap=document.createElement('div');wrap.innerHTML=dayInputsHtml(key,row?.days_of_week);days=wrap.firstElementChild;const grid=time.closest('.grid2');(grid||card.querySelector('.req-head')||card).insertAdjacentElement('afterend',days)}if(String(key).startsWith('custom_')&&!card.querySelector('[data-nh7-delete-schedule-v334]')){const button=document.createElement('button');button.type='button';button.className='btn danger-btn';button.dataset.nh7DeleteScheduleV334='1';button.textContent='🗑 '+L('حذف این برنامه','Delete schedule','Izbriši raspored');button.onclick=()=>window.nh7DeleteScheduleV334(key);const save=[...card.querySelectorAll('button')].find(b=>String(b.getAttribute('onclick')||'').includes('saveSchedule'));(save||card).insertAdjacentElement('afterend',button)}})
}
function decorate(){
  if(typeof activeTab!=='undefined'&&activeTab!=='notifications')return;
  decorateScheduleCards();createPanel();
  const panel=[...document.querySelectorAll('.panel-card')].find(x=>x.querySelector('[id^="ns_time_"]'));if(panel&&!panel.querySelector('[data-nh7-zagreb-note-v333]')){const div=document.createElement('div');div.dataset.nh7ZagrebNoteV333='1';div.className='notice';div.innerHTML=`<strong>${note()}</strong>`;panel.querySelector('h3')?.insertAdjacentElement('afterend',div)}
  const send=[...document.querySelectorAll('.panel-card')].find(x=>x.querySelector('#bc_title_fa'));if(send&&!send.querySelector('[data-nh7-broadcast-note-v333]')){const div=document.createElement('div');div.dataset.nh7BroadcastNoteV333='1';div.className='notice';div.textContent=L('«ارسال اکنون» یک Push واقعی برای کاربران اپ می‌فرستد و همان پیام را در Inbox نیز ثبت می‌کند.','“Send now” sends a real push to app users and also records it in Inbox.','“Pošalji sada” šalje stvarnu push obavijest i sprema je u Inbox.');send.querySelector('h3')?.insertAdjacentElement('afterend',div)}
}
async function saveDynamicSchedule(key){
  ensureTimezone(key);const days=selectedDays(key);if(!days.length){alert(L('حداقل یک روز را انتخاب کنید.','Select at least one day.','Odaberite barem jedan dan.'));return}
  const data={time_value:document.getElementById('ns_time_'+key)?.value||'00:00',timezone_mode:'Europe/Zagreb',days_of_week:days,title_fa:document.getElementById('ns_title_fa_'+key)?.value||'',body_fa:document.getElementById('ns_body_fa_'+key)?.value||'',title_en:document.getElementById('ns_title_en_'+key)?.value||'',body_en:document.getElementById('ns_body_en_'+key)?.value||'',title_hr:document.getElementById('ns_title_hr_'+key)?.value||'',body_hr:document.getElementById('ns_body_hr_'+key)?.value||'',is_active:!!document.getElementById('ns_active_'+key)?.checked,updated_at:new Date().toISOString()};
  try{await authFetch('/rest/v1/notification_schedules?key=eq.'+encodeURIComponent(key),{method:'PATCH',body:JSON.stringify(data)});if(typeof setMessage==='function')setMessage(L('برنامه اعلان ذخیره شد.','Notification schedule saved.','Raspored obavijesti je spremljen.'),'success');await loadAll(true)}catch(error){alert(error?.message||String(error))}
}
async function createDynamicSchedule(){
  const time=read('nh7NewScheduleTimeV334'),days=createDays(),titles={fa:read('nh7NewTitleFaV334'),en:read('nh7NewTitleEnV334'),hr:read('nh7NewTitleHrV334')},bodies={fa:read('nh7NewBodyFaV334'),en:read('nh7NewBodyEnV334'),hr:read('nh7NewBodyHrV334')};
  if(!time){alert(L('ساعت ارسال را وارد کنید.','Enter a send time.','Unesite vrijeme slanja.'));return}if(!days.length){alert(L('حداقل یک روز را انتخاب کنید.','Select at least one day.','Odaberite barem jedan dan.'));return}
  const fallbackTitle=titles.fa||titles.en||titles.hr,fallbackBody=bodies.fa||bodies.en||bodies.hr;if(!fallbackTitle||!fallbackBody){alert(L('حداقل یک عنوان و یک متن وارد کنید.','Enter at least one title and one message.','Unesite barem jedan naslov i jednu poruku.'));return}
  const key='custom_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7),maxSort=Math.max(60,...(Array.isArray(state?.schedules)?state.schedules.map(x=>Number(x.sort_order)||0):[]));
  const row={key,time_value:time,timezone_mode:'Europe/Zagreb',days_of_week:days,title_fa:titles.fa||fallbackTitle,body_fa:bodies.fa||fallbackBody,title_en:titles.en||fallbackTitle,body_en:bodies.en||fallbackBody,title_hr:titles.hr||fallbackTitle,body_hr:bodies.hr||fallbackBody,target_route:'home',is_active:!!document.getElementById('nh7NewActiveV334')?.checked,sort_order:maxSort+10,updated_at:new Date().toISOString()};
  try{await authFetch('/rest/v1/notification_schedules',{method:'POST',body:JSON.stringify(row)});if(typeof setMessage==='function')setMessage(L('اعلان زمان‌بندی‌شده جدید ساخته شد و از این پس خودکار اجرا می‌شود.','New scheduled notification created and will run automatically.','Nova zakazana obavijest je izrađena i automatski će se izvršavati.'),'success');await loadAll(true)}catch(error){alert(error?.message||String(error))}
}
async function deleteDynamicSchedule(key){if(!String(key).startsWith('custom_'))return;if(!confirm(L('این برنامه اعلان حذف شود؟','Delete this notification schedule?','Izbrisati ovaj raspored obavijesti?')))return;try{await authFetch('/rest/v1/notification_schedules?key=eq.'+encodeURIComponent(key),{method:'DELETE'});if(typeof setMessage==='function')setMessage(L('برنامه حذف شد.','Schedule deleted.','Raspored je izbrisan.'),'success');await loadAll(true)}catch(error){alert(error?.message||String(error))}}
function install(){
  if(typeof render!=='function'||typeof authFetch!=='function')return false;
  saveSchedule=window.saveSchedule=saveDynamicSchedule;window.nh7CreateScheduleV334=createDynamicSchedule;window.nh7DeleteScheduleV334=deleteDynamicSchedule;
  sendBroadcast=window.sendBroadcast=async function(){
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
