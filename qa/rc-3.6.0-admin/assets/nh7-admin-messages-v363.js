/* New Hope 7 Admin QA v3.6.3 — searchable recipient picker; no long nested list. */
(()=>{'use strict';
if(window.__NH7_ADMIN_MESSAGES_V363__)return;
window.__NH7_ADMIN_MESSAGES_V363__=true;
const VERSION='3.6.3-search-add-recipients';
let patchTimer=0,query='',lastFingerprint='';
const selected=new Set();
const lang=()=>{
  try{if(typeof window.lang==='string'&&['fa','en','hr'].includes(window.lang))return window.lang}catch(_){}
  const value=(document.documentElement.lang||localStorage.getItem('nh7_admin_lang')||'fa').toLowerCase();
  return value.startsWith('hr')?'hr':value.startsWith('en')?'en':'fa';
};
const T=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const EMAIL=v=>String(v||'').trim().toLowerCase();
const ESC=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function messagesVisible(){
  try{if(typeof activeTab!=='undefined'&&activeTab==='messages')return true}catch(_){}
  return !!document.querySelector('.nh7-v360-compose');
}
function authRows(){
  try{return typeof state!=='undefined'&&Array.isArray(state?.v360AuthDirectory)?state.v360AuthDirectory:[]}catch(_){return[]}
}
function studentRows(){
  try{return typeof studentDirectory==='function'?(studentDirectory()||[]):[]}catch(_){return[]}
}
function emailFromDom(row){
  const extra=EMAIL(row?.dataset?.v360ExtraEmail);if(extra)return extra;
  const text=String(row?.textContent||'');
  const match=text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);if(match)return EMAIL(match[0]);
  const handler=String(row?.querySelector('input')?.getAttribute('onchange')||'');
  const encoded=handler.match(/ToggleRecipient\('([^']+)'/);if(encoded){try{return EMAIL(decodeURIComponent(encoded[1]))}catch(_){return EMAIL(encoded[1])}}
  return '';
}
function directory(host){
  const map=new Map();
  const put=(email,name='',id='',language='fa')=>{
    email=EMAIL(email);if(!email)return;
    const old=map.get(email)||{};
    map.set(email,{email,name:String(name||old.name||email).trim()||email,id:String(id||old.id||'').trim(),language:String(language||old.language||'fa')});
  };
  for(const row of authRows())put(row?.email,row?.name||row?.full_name,row?.user_id||row?.id,row?.language);
  for(const row of studentRows())put(row?.email,row?.name||row?.full_name,row?.user_id||row?.id,row?.registration?.language||row?.language);
  host?.querySelectorAll('[data-v360-recipient-row]').forEach(row=>{
    const email=emailFromDom(row);if(!email)return;
    const strong=String(row.querySelector('strong')?.textContent||'').trim();
    const id=String(row.querySelector('.nh7-v362-recipient-id')?.textContent||'').replace(/^ID:\s*/i,'').trim();
    put(email,strong,id,'fa');
    const box=row.querySelector('input[type="checkbox"]');if(box?.checked)selected.add(email);
  });
  return [...map.values()].sort((a,b)=>(a.name||a.email).localeCompare(b.name||b.email,undefined,{sensitivity:'base'}));
}
function hiddenBox(email){
  const host=document.getElementById('nh7V360Recipients');if(!host)return null;
  return [...host.querySelectorAll('[data-v360-recipient-row]')].find(row=>emailFromDom(row)===EMAIL(email))?.querySelector('input[type="checkbox"]')||null;
}
function toggle(email,on){
  email=EMAIL(email);if(!email)return;
  on?selected.add(email):selected.delete(email);
  const box=hiddenBox(email);if(box)box.checked=!!on;
  try{window.nh7V360ToggleRecipient?.(encodeURIComponent(email),!!on)}catch(error){console.warn('[NH7 v363] recipient sync',error)}
  renderPicker();
}
function resultText(person){return [person.name,person.email,person.id].filter(Boolean).join(' ').toLowerCase()}
function filtered(rows){
  const q=query.trim().toLowerCase();
  const list=q?rows.filter(row=>resultText(row).includes(q)):rows;
  return list.slice(0,q?16:10);
}
function selectedHtml(rows){
  const map=new Map(rows.map(x=>[x.email,x]));
  const items=[...selected].map(email=>map.get(email)||{email,name:email,id:''});
  if(!items.length)return `<div class="nh7-v363-empty">${ESC(T('هنوز کسی انتخاب نشده است.','No one selected yet.','Još nitko nije odabran.'))}</div>`;
  return items.map(person=>`<div class="nh7-v363-selected-row"><span><strong>${ESC(person.name||person.email)}</strong><small>${ESC(person.email)}${person.id?`<br><bdi>ID: ${ESC(person.id)}</bdi>`:''}</small></span><button type="button" data-v363-remove="${ESC(encodeURIComponent(person.email))}">✕ ${ESC(T('حذف','Remove','Ukloni'))}</button></div>`).join('');
}
function resultsHtml(rows){
  const list=filtered(rows);
  if(!list.length)return `<div class="nh7-v363-empty">${ESC(T('مخاطبی با این نام، ایمیل یا ID پیدا نشد.','No recipient matches this name, email or ID.','Nema primatelja s tim imenom, e-mailom ili ID-om.'))}</div>`;
  return list.map(person=>{
    const on=selected.has(person.email);
    return `<button type="button" class="nh7-v363-result ${on?'selected':''}" data-v363-toggle="${ESC(encodeURIComponent(person.email))}" data-v363-on="${on?'1':'0'}"><span><strong>${ESC(person.name||person.email)}</strong><small>${ESC(person.email)}${person.id?`<br><bdi>ID: ${ESC(person.id)}</bdi>`:''}</small></span><em>${on?'✓ '+ESC(T('انتخاب شد','Selected','Odabrano')):'+ '+ESC(T('انتخاب','Select','Odaberi'))}</em></button>`;
  }).join('');
}
function pickerShell(){
  const host=document.getElementById('nh7V360Recipients');if(!host)return null;
  let shell=document.getElementById('nh7V363Picker');
  if(!shell){
    shell=document.createElement('section');shell.id='nh7V363Picker';shell.className='nh7-v363-picker';
    shell.innerHTML=`
      <div class="nh7-v363-head"><div><strong>👥 ${T('انتخاب مخاطب','Select recipient','Odabir primatelja')}</strong><p>${T('نام، ایمیل یا Account ID را جست‌وجو کن و سپس «انتخاب» را بزن. دیگر فهرست بلند و اسکرول داخلی وجود ندارد.','Search by name, email or Account ID, then press Select. There is no long nested scrolling list.','Pretražite ime, e-mail ili Account ID i pritisnite Odaberi. Nema dugog unutarnjeg popisa.')}</p></div><span id="nh7V363Count"></span></div>
      <label class="nh7-v363-native"><span>${T('انتخاب سریع با منوی خود آیفون','Quick pick with the iPhone menu','Brzi odabir iz iPhone izbornika')}</span><select id="nh7V363NativeSelect"><option value="">${T('یک مخاطب را انتخاب کنید…','Choose a recipient…','Odaberite primatelja…')}</option></select></label>
      <label class="nh7-v363-search"><span>${T('جست‌وجو','Search','Pretraži')}</span><input id="nh7V363Search" autocomplete="off" inputmode="search" placeholder="${T('نام، ایمیل یا ID…','Name, email or ID…','Ime, e-mail ili ID…')}"></label>
      <div id="nh7V363Results" class="nh7-v363-results"></div>
      <div class="nh7-v363-selected-title"><strong>${T('افراد انتخاب‌شده','Selected recipients','Odabrani primatelji')}</strong><button type="button" id="nh7V363Clear">${T('پاک‌کردن همه','Clear all','Očisti sve')}</button></div>
      <div id="nh7V363Selected" class="nh7-v363-selected"></div>`;
    host.insertAdjacentElement('beforebegin',shell);
    shell.querySelector('#nh7V363Search').addEventListener('input',event=>{query=String(event.target.value||'');renderPicker(false)});
    shell.querySelector('#nh7V363NativeSelect').addEventListener('change',event=>{const email=EMAIL(event.target.value);if(email)toggle(email,true);event.target.value=''});
    shell.querySelector('#nh7V363Clear').addEventListener('click',()=>{for(const email of [...selected])toggle(email,false)});
    shell.addEventListener('click',event=>{
      const result=event.target.closest('[data-v363-toggle]');if(result){const email=decodeURIComponent(result.dataset.v363Toggle||'');toggle(email,result.dataset.v363On!=='1');return}
      const remove=event.target.closest('[data-v363-remove]');if(remove)toggle(decodeURIComponent(remove.dataset.v363Remove||''),false);
    });
  }
  host.hidden=true;host.style.display='none';
  const legacy=host.nextElementSibling;if(legacy?.classList?.contains('muted'))legacy.hidden=true;
  return shell;
}
function renderPicker(rebuildOptions=true){
  const host=document.getElementById('nh7V360Recipients'),shell=pickerShell();if(!host||!shell)return;
  const rows=directory(host);
  const fingerprint=rows.map(x=>x.email+'|'+x.id).join(';');
  if(rebuildOptions||fingerprint!==lastFingerprint){
    lastFingerprint=fingerprint;
    const select=shell.querySelector('#nh7V363NativeSelect');
    const first=select.options[0]?.outerHTML||`<option value="">${T('یک مخاطب را انتخاب کنید…','Choose a recipient…','Odaberite primatelja…')}</option>`;
    select.innerHTML=first+rows.map(person=>`<option value="${ESC(person.email)}">${ESC(person.name||person.email)} · ${ESC(person.email)}${person.id?' · ID '+ESC(person.id):''}</option>`).join('');
  }
  const input=shell.querySelector('#nh7V363Search');if(input&&input.value!==query)input.value=query;
  shell.querySelector('#nh7V363Results').innerHTML=resultsHtml(rows);
  shell.querySelector('#nh7V363Selected').innerHTML=selectedHtml(rows);
  shell.querySelector('#nh7V363Count').textContent=selected.size+' '+T('نفر انتخاب شده','selected','odabrano');
}
function relabelControls(compose){
  if(!compose)return;
  const audience=compose.querySelector('.nh7-v360-audience');
  if(audience&&!document.getElementById('nh7V363AudienceHelp')){
    const note=document.createElement('div');note.id='nh7V363AudienceHelp';note.className='nh7-v363-help';
    note.innerHTML=`<p><strong>${T('همه کاربران اپ','All app users','Svi korisnici')}</strong> — ${T('تمام کاربران ثبت‌شده اپ.','all registered app users.','svi registrirani korisnici.')}</p><p><strong>${T('همه دانشجویان','All students','Svi studenti')}</strong> — ${T('فقط اعضای مدرسه.','school members only.','samo članovi škole.')}</p><p><strong>${T('افراد انتخابی','Selected people','Odabrane osobe')}</strong> — ${T('فقط کسانی که از جست‌وجو اضافه می‌کنی.','only people you add through search.','samo osobe dodane pretragom.')}</p>`;
    audience.insertAdjacentElement('afterend',note);
  }
  const tabs=compose.querySelector('.nh7-v360-lang-tabs');
  if(tabs){const bs=tabs.querySelectorAll('button');if(bs[0])bs[0].textContent='FA · فارسی';if(bs[1])bs[1].textContent='EN · English';if(bs[2])bs[2].textContent='HR · Hrvatski';if(!document.getElementById('nh7V363LangHelp')){const p=document.createElement('p');p.id='nh7V363LangHelp';p.className='nh7-v363-note';p.textContent=T('این سه کلید فقط زبان متن پیام را عوض می‌کنند؛ دکمه ارسال نیستند.','These three buttons only switch the message language; they are not send buttons.','Ova tri gumba samo mijenjaju jezik poruke; nisu gumbi za slanje.');tabs.insertAdjacentElement('afterend',p)}}
  const actions=compose.querySelector('.nh7-v360-actions');
  const buttons=actions?[...actions.querySelectorAll('button')]:[];
  const send=buttons.find(b=>String(b.getAttribute('onclick')||'').includes('nh7V360SendCampaign'));
  const update=buttons.find(b=>String(b.getAttribute('onclick')||'').includes('FillUpdateTemplate'));
  const meeting=buttons.find(b=>String(b.getAttribute('onclick')||'').includes('FillMeetingTemplate'));
  if(send){send.classList.add('nh7-v363-send');send.textContent='🚀 '+T('ارسال پیام (آزمایشی)','Send message (QA)','Pošalji poruku (QA)')}
  if(update){update.textContent='⬆ '+T('پرکردن متن آمادهٔ آپدیت اپ','Fill app-update text','Ispuni tekst ažuriranja');update.title=T('فقط متن پیشنهادی را داخل فرم می‌گذارد و چیزی ارسال نمی‌کند.','Only fills suggested text; it sends nothing.','Samo ispunjava predloženi tekst; ništa ne šalje.')}
  if(meeting){meeting.textContent='📅 '+T('پرکردن متن آمادهٔ دعوت جلسه','Fill meeting-invitation text','Ispuni tekst poziva');meeting.title=T('فقط متن پیشنهادی دعوت را داخل فرم می‌گذارد و چیزی ارسال نمی‌کند.','Only fills suggested invitation text; it sends nothing.','Samo ispunjava predloženi poziv; ništa ne šalje.')}
  const grid=compose.querySelector('.grid2');
  if(grid&&!document.getElementById('nh7V363ChannelHelp')){const note=document.createElement('div');note.id='nh7V363ChannelHelp';note.className='nh7-v363-help';note.innerHTML=`<p><strong>🔔 Push</strong> — ${T('اعلان روی صفحه گوشی؛ فقط برای کسانی که اجازه اعلان داده‌اند.','phone notification for users who enabled notifications.','obavijest na telefonu za korisnike koji su je dopustili.')}</p><p><strong>📥 ${T('صندوق داخل اپ','In-app Inbox','Pretinac u aplikaciji')}</strong> — ${T('نسخهٔ ماندگار پیام داخل اپ.','a persistent copy inside the app.','trajna kopija unutar aplikacije.')}</p>`;grid.insertAdjacentElement('afterend',note)}
  if(actions&&!document.getElementById('nh7V363TemplateHelp')){const note=document.createElement('p');note.id='nh7V363TemplateHelp';note.className='nh7-v363-note';note.textContent=T('دو کلید «متن آماده» فقط فرم را پر می‌کنند. پس از بازبینی، دکمه سبز ارسال را بزن. در این نسخه تست، پیام واقعی ارسال نمی‌شود.','The two template buttons only prefill the form. Review it, then press the green send button. This QA build sends nothing to real users.','Dva gumba predloška samo ispunjavaju obrazac. Pregledajte ga i pritisnite zeleni gumb. QA verzija ne šalje stvarne poruke.');actions.insertAdjacentElement('afterend',note)}
  ensureFloatingSend(compose);
}
function ensureFloatingSend(compose){
  let button=document.getElementById('nh7V363FloatingSend');
  if(!button){button=document.createElement('button');button.type='button';button.id='nh7V363FloatingSend';button.innerHTML='🚀 '+T('ارسال پیام (آزمایشی)','Send message (QA)','Pošalji poruku (QA)');button.addEventListener('click',()=>{const send=[...document.querySelectorAll('.nh7-v360-compose button')].find(b=>String(b.getAttribute('onclick')||'').includes('nh7V360SendCampaign'));if(send)send.click();else window.nh7V360SendCampaign?.()});document.body.appendChild(button)}
  button.hidden=!messagesVisible();
}
function patch(){
  const visible=messagesVisible();document.body.classList.toggle('nh7-v363-messages',visible);
  const old=document.getElementById('nh7V362FloatingSend');if(old)old.remove();
  const oldPicker=document.getElementById('nh7V363Picker');if(!visible){oldPicker?.remove();const floating=document.getElementById('nh7V363FloatingSend');if(floating)floating.hidden=true;return}
  const compose=document.querySelector('.nh7-v360-compose');if(!compose)return;
  relabelControls(compose);
  const host=document.getElementById('nh7V360Recipients');
  if(host)renderPicker(false);
}
function schedule(){clearTimeout(patchTimer);patchTimer=setTimeout(patch,40)}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',schedule);document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
setInterval(patch,1000);setTimeout(patch,100);
window.NH7_ADMIN_MESSAGES_V363_VERSION=VERSION;
})();
