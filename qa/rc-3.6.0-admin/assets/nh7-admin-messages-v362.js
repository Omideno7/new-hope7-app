/* New Hope 7 Admin QA v3.6.2 — accessible recipients and explicit send workflow. */
(()=>{'use strict';
if(window.__NH7_ADMIN_MESSAGES_V362__)return;
window.__NH7_ADMIN_MESSAGES_V362__=true;
const VERSION='3.6.2-message-flow';
let patchTimer=0;
const lang=()=>{
  try{if(typeof window.lang==='string'&&['fa','en','hr'].includes(window.lang))return window.lang}catch(_){}
  const value=(document.documentElement.lang||localStorage.getItem('nh7_admin_lang')||'fa').toLowerCase();
  return value.startsWith('hr')?'hr':value.startsWith('en')?'en':'fa';
};
const T=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const EMAIL=value=>String(value||'').trim().toLowerCase();
function messagesVisible(){
  try{if(typeof activeTab!=='undefined'&&activeTab==='messages')return true}catch(_){}
  return !!document.querySelector('.nh7-v360-compose');
}
function authDirectory(){
  try{return typeof state!=='undefined'&&Array.isArray(state?.v360AuthDirectory)?state.v360AuthDirectory:[]}catch(_){return[]}
}
function emailFromRow(row){
  const extra=EMAIL(row?.dataset?.v360ExtraEmail);if(extra)return extra;
  const small=String(row?.querySelector('small')?.textContent||'');
  const match=small.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);if(match)return EMAIL(match[0]);
  const handler=String(row?.querySelector('input')?.getAttribute('onchange')||'');
  const encoded=handler.match(/ToggleRecipient\('([^']+)'/);if(encoded){try{return EMAIL(decodeURIComponent(encoded[1]))}catch(_){return EMAIL(encoded[1])}}
  return '';
}
function clearLegacyRecipientPatch(host){
  document.getElementById('nh7V361RecipientScrollHint')?.remove();
  if(!host)return;
  host.removeAttribute('tabindex');
  host.removeAttribute('role');
  host.removeAttribute('aria-label');
  delete host.dataset.nh7RecipientScrollV361;
  for(const property of ['height','maxHeight','minHeight','overflow','overflowY','touchAction','webkitOverflowScrolling','overscrollBehavior','position'])host.style.removeProperty(property.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()));
}
function decorateIds(host){
  if(!host)return;
  const directory=new Map(authDirectory().map(item=>[EMAIL(item?.email),String(item?.user_id||item?.id||'').trim()]));
  host.querySelectorAll('[data-v360-recipient-row]').forEach(row=>{
    const email=emailFromRow(row),id=directory.get(email)||'';
    let line=row.querySelector('.nh7-v362-recipient-id');
    if(!id){line?.remove();return}
    if(!line){line=document.createElement('small');line.className='nh7-v362-recipient-id';row.querySelector('span')?.appendChild(line)}
    const value='ID: '+id;if(line.textContent!==value)line.textContent=value;
  });
}
function selectedCount(host){return host?host.querySelectorAll('input[type="checkbox"]:checked').length:0}
function updateCount(host){
  const count=selectedCount(host);
  const line=document.getElementById('nh7V362SelectedCount');
  const value=count+' '+T('نفر انتخاب شده','selected','odabrano');
  if(line&&line.textContent!==value)line.textContent=value;
  const legacy=host?.nextElementSibling;
  if(legacy?.classList?.contains('muted')&&legacy.textContent!==value)legacy.textContent=value;
}
function setRows(host,checked,visibleOnly){
  if(!host)return;
  host.querySelectorAll('[data-v360-recipient-row]').forEach(row=>{
    if(visibleOnly&&getComputedStyle(row).display==='none')return;
    const box=row.querySelector('input[type="checkbox"]');
    if(!box||box.checked===checked)return;
    box.checked=checked;
    box.dispatchEvent(new Event('change',{bubbles:true}));
  });
  updateCount(host);
}
function recipientTools(host){
  if(!host)return;
  let tools=document.getElementById('nh7V362RecipientTools');
  if(!tools){
    tools=document.createElement('div');tools.id='nh7V362RecipientTools';tools.className='nh7-v362-recipient-tools';
    tools.innerHTML=`<button type="button" data-v362-select-visible>${T('انتخاب همه نتایج دیده‌شده','Select visible results','Odaberi vidljive')}</button><button type="button" data-v362-clear>${T('پاک‌کردن انتخاب‌ها','Clear selection','Očisti odabir')}</button><span id="nh7V362SelectedCount" class="nh7-v362-selected-count"></span>`;
    tools.querySelector('[data-v362-select-visible]').addEventListener('click',()=>setRows(host,true,true));
    tools.querySelector('[data-v362-clear]').addEventListener('click',()=>setRows(host,false,false));
    host.insertAdjacentElement('beforebegin',tools);
  }
  updateCount(host);
}
function addControlHelp(compose){
  if(!compose||document.getElementById('nh7V362ControlHelp'))return;
  const audience=compose.querySelector('.nh7-v360-audience');
  if(!audience)return;
  const help=document.createElement('div');help.id='nh7V362ControlHelp';help.className='nh7-v362-control-help';
  help.innerHTML=`
    <div><strong>${T('مخاطب پیام','Message audience','Primatelji')}</strong><p>${T('«همه کاربران» برای تمام نصب‌های ثبت‌شده، «همه دانشجویان» فقط برای دانشجویان، و «افراد انتخابی» برای نام‌ها یا ایمیل‌هایی است که خودت تیک می‌زنی.','All users targets registered app users; all students targets students; selected people sends only to checked names or emails.','Svi korisnici obuhvaća registrirane korisnike; svi studenti samo studente; odabrane osobe samo označene primatelje.')}</p></div>
    <div><strong>Push</strong><p>${T('اعلان کوتاه روی گوشی و صفحه قفل؛ فقط برای کاربرانی که اجازه اعلان داده‌اند.','A phone/lock-screen notification for users who enabled notifications.','Obavijest na telefonu/zaključanom zaslonu za korisnike koji su dopustili obavijesti.')}</p></div>
    <div><strong>${T('صندوق داخل اپ','In-app Inbox','Pretinac u aplikaciji')}</strong><p>${T('یک نسخه ماندگار داخل صندوق پیام اپ قرار می‌دهد تا کاربر بعداً هم آن را ببیند.','Keeps a persistent copy in the app inbox so the user can read it later.','Čuva trajnu kopiju u pretincu aplikacije za kasnije čitanje.')}</p></div>`;
  audience.insertAdjacentElement('afterend',help);
}
function addLanguageHelp(compose){
  if(!compose||document.getElementById('nh7V362LanguageNote'))return;
  const tabs=compose.querySelector('.nh7-v360-lang-tabs');if(!tabs)return;
  const buttons=tabs.querySelectorAll('button');
  if(buttons[0]&&buttons[0].textContent!=='FA · فارسی')buttons[0].textContent='FA · فارسی';
  if(buttons[1]&&buttons[1].textContent!=='EN · English')buttons[1].textContent='EN · English';
  if(buttons[2]&&buttons[2].textContent!=='HR · Hrvatski')buttons[2].textContent='HR · Hrvatski';
  const note=document.createElement('p');note.id='nh7V362LanguageNote';note.className='nh7-v362-language-note';
  note.textContent=T('این سه کلید زبان پیام‌اند، نه کلید ارسال. متن هر زبان را جدا بنویس؛ کاربر نسخه متناسب با زبان اپ خود را دریافت می‌کند.','These are language tabs, not send buttons. Write each language version separately; users receive the version matching their app language.','Ovo su kartice jezika, a ne gumbi za slanje. Napišite svaku jezičnu verziju; korisnik prima verziju prema jeziku aplikacije.');
  tabs.insertAdjacentElement('afterend',note);
}
function explainTemplates(compose){
  if(!compose)return;
  const actions=compose.querySelector('.nh7-v360-actions');if(!actions)return;
  const buttons=[...actions.querySelectorAll('button')];
  const update=buttons.find(button=>String(button.getAttribute('onclick')||'').includes('FillUpdateTemplate'));
  const meeting=buttons.find(button=>String(button.getAttribute('onclick')||'').includes('FillMeetingTemplate'));
  if(update&&!update.dataset.nh7V362Label){update.dataset.nh7V362Label='1';update.textContent='⬆ '+T('پرکردن الگوی اعلام آپدیت','Fill app-update template','Ispuni predložak ažuriranja');update.title=T('فقط عنوان و متن آماده را داخل فرم می‌گذارد؛ چیزی ارسال نمی‌کند.','Only fills the form with prepared text; it does not send anything.','Samo ispunjava obrazac pripremljenim tekstom; ništa ne šalje.')}
  if(meeting&&!meeting.dataset.nh7V362Label){meeting.dataset.nh7V362Label='1';meeting.textContent='📅 '+T('پرکردن الگوی دعوت جلسه','Fill meeting-invitation template','Ispuni predložak poziva');meeting.title=T('فقط متن دعوت جلسه را داخل فرم می‌گذارد؛ چیزی ارسال نمی‌کند.','Only fills the invitation text; it does not send anything.','Samo ispunjava tekst poziva; ništa ne šalje.')}
  if(!document.getElementById('nh7V362TemplateNote')){
    const note=document.createElement('small');note.id='nh7V362TemplateNote';note.className='nh7-v362-template-note';
    note.textContent=T('دو کلید «الگو» فقط متن پیشنهادی را پر می‌کنند. پس از بازبینی متن، دکمه سبز «ارسال پیام» را بزن.','The two template buttons only prefill suggested text. Review it, then press the green Send message button.','Dva gumba predloška samo unose predloženi tekst. Pregledajte ga, zatim pritisnite zeleni gumb Pošalji poruku.');
    actions.insertAdjacentElement('afterend',note);
  }
}
function makeSendExplicit(compose){
  if(!compose)return;
  const original=[...compose.querySelectorAll('button')].find(button=>String(button.getAttribute('onclick')||'').includes('nh7V360SendCampaign'));
  if(original&&!original.dataset.nh7V362Label){
    original.dataset.nh7V362Label='1';
    original.classList.add('nh7-v362-send-original');
    original.textContent='🚀 '+T('ارسال پیام','Send message','Pošalji poruku');
    original.title=T('در نسخه آزمایشی، محتوا بررسی می‌شود اما پیام واقعی ارسال نمی‌شود.','In QA, the content is validated but no real message is sent.','U QA verziji sadržaj se provjerava, ali se stvarna poruka ne šalje.');
  }
  if(!document.getElementById('nh7V362QaNote')){
    const note=document.createElement('div');note.id='nh7V362QaNote';note.className='nh7-v362-qa-note';
    note.textContent=T('نسخه تست: دکمه «ارسال پیام» فعلاً فقط فرم، مخاطبان و متن را کنترل می‌کند و هیچ پیام واقعی برای کاربران نمی‌فرستد.','QA build: Send message currently validates the form, recipients and text; it sends nothing to real users.','QA verzija: gumb Pošalji poruku trenutačno samo provjerava obrazac, primatelje i tekst; ništa se stvarno ne šalje.');
    const actions=compose.querySelector('.nh7-v360-actions');actions?.insertAdjacentElement('beforebegin',note);
  }
  let floating=document.getElementById('nh7V362FloatingSend');
  if(!floating){
    floating=document.createElement('button');floating.type='button';floating.id='nh7V362FloatingSend';
    floating.innerHTML=`<span>🚀 ${T('ارسال پیام','Send message','Pošalji poruku')}</span><small>${T('در QA بدون ارسال واقعی','QA: no real delivery','QA: bez stvarnog slanja')}</small>`;
    floating.addEventListener('click',()=>{
      const button=[...document.querySelectorAll('.nh7-v360-compose button')].find(x=>String(x.getAttribute('onclick')||'').includes('nh7V360SendCampaign'));
      if(button){button.scrollIntoView({block:'center',behavior:'smooth'});setTimeout(()=>button.click(),180)}
      else if(typeof window.nh7V360SendCampaign==='function')window.nh7V360SendCampaign();
    });
    document.body.appendChild(floating);
  }
}
function patch(){
  const visible=messagesVisible();
  document.body.classList.toggle('nh7-v362-messages-open',visible);
  const floating=document.getElementById('nh7V362FloatingSend');if(floating)floating.hidden=!visible;
  if(!visible)return;
  const compose=document.querySelector('.nh7-v360-compose');if(!compose)return;
  const host=document.getElementById('nh7V360Recipients');
  clearLegacyRecipientPatch(host);
  addControlHelp(compose);
  addLanguageHelp(compose);
  explainTemplates(compose);
  makeSendExplicit(compose);
  if(host){recipientTools(host);decorateIds(host);updateCount(host)}
}
function schedule(){clearTimeout(patchTimer);patchTimer=setTimeout(patch,30)}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('change',event=>{if(event.target?.closest?.('#nh7V360Recipients'))setTimeout(()=>updateCount(document.getElementById('nh7V360Recipients')),0)},true);
window.addEventListener('pageshow',schedule);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
setInterval(patch,1000);
setTimeout(patch,100);
window.NH7_ADMIN_MESSAGES_V362_VERSION=VERSION;
})();
