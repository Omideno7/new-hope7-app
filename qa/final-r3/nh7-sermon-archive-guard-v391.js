/* New Hope 7 Final QA R3 v3.9.1
 * The old bundled v1 sermon archive is never shown. Approved signed-in users
 * see the complete current cloud archive; otherwise a clear sign-in message is shown.
 */
(()=>{'use strict';
if(window.__NH7_SERMON_ARCHIVE_GUARD_V391__)return;
window.__NH7_SERMON_ARCHIVE_GUARD_V391__=true;
const SESSION_KEY='nh7_user_session_v170';
const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return['fa','en','hr'].includes(v)?v:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}}
function goThroughMore(route){
  const more=document.querySelector('.nav-item[data-route="more"]');
  if(more){more.click();setTimeout(()=>{const target=document.querySelector(`[data-go="${CSS.escape(route)}"]`);if(target)target.click();else{location.hash='#'+route;location.reload()}},160);return}
  location.hash='#'+route;location.reload();
}
function renderBlocked(){
  const marker=window.__NH7_SERMON_ARCHIVE_FALLBACK_BLOCKED__,view=document.getElementById('view');
  if(!marker||!view||view.dataset.nh7SermonBlocked==='391')return;
  if(document.querySelector('.sermon-list')||window.__NH7_SERMON_ARCHIVE_LIVE__?.count)return;
  const logged=!!session()?.access_token;
  view.dataset.nh7SermonBlocked='391';
  view.innerHTML=`<section class="card nh7-sermon-live-required391">
    <h2>${L('پیام‌های صوتی و موعظات','Audio sermons','Audio propovijedi')}</h2>
    <div class="notice"><strong>${L('آرشیو قدیمی غیرفعال شده است.','The old archive has been disabled.','Stara arhiva je isključena.')}</strong><p>${L('این نسخه فقط آرشیو کامل و جدیدی را نمایش می‌دهد که از پنل ادمین بارگذاری شده است.','This build shows only the complete current archive uploaded from the admin panel.','Ova verzija prikazuje samo potpunu aktualnu arhivu učitanu iz administratorskog panela.')}</p></div>
    <p>${logged?L('جلسهٔ ورود یا وضعیت تأیید حساب شما نیاز به تازه‌سازی دارد. یک‌بار دوباره وارد حساب شوید و سپس این بخش را باز کنید.','Your sign-in session or approval status needs to be refreshed. Sign in again, then reopen this section.','Vašu prijavu ili status odobrenja treba osvježiti. Ponovno se prijavite i otvorite ovaj odjeljak.'):L('برای مشاهدهٔ آرشیو کامل موعظات، با حسابی وارد شوید که ثبت‌نام مدرسهٔ آن کامل و توسط ادمین تأیید شده باشد.','To view the complete sermon archive, sign in with an account whose School registration is complete and admin-approved.','Za prikaz potpune arhive propovijedi prijavite se računom s potpunom i odobrenom registracijom za školu.')}</p>
    <div class="button-row"><button type="button" class="primary-btn" id="nh7SermonAccount391">${L('ورود / تازه‌سازی حساب','Sign in / refresh account','Prijava / osvježi račun')}</button><button type="button" class="secondary-btn" id="nh7SermonRetry391">${L('تلاش دوباره','Try again','Pokušaj ponovno')}</button></div>
  </section>`;
  document.getElementById('nh7SermonAccount391')?.addEventListener('click',()=>goThroughMore('account'));
  document.getElementById('nh7SermonRetry391')?.addEventListener('click',()=>goThroughMore('audio'));
}
function mountLiveBadge(){
  const live=window.__NH7_SERMON_ARCHIVE_LIVE__,view=document.getElementById('view');
  if(!live?.count||!view||!view.querySelector('.sermon-list')||view.querySelector('#nh7SermonLiveBadge391'))return;
  view.dataset.nh7SermonBlocked='';
  const badge=document.createElement('div');badge.id='nh7SermonLiveBadge391';badge.className='notice nh7-sermon-live-badge391';badge.innerHTML=`<strong>✓ ${L('آرشیو جدید پنل ادمین','Current admin archive','Aktualna administratorska arhiva')}</strong><span>${L(`${live.count} موعظه منتشرشده`,`${live.count} published sermons`,`${live.count} objavljenih propovijedi`)}</span>`;
  const card=view.querySelector('.card');card?.insertBefore(badge,card.querySelector('.sermon-list')||card.firstChild);
}
function patch(){if(window.__NH7_SERMON_ARCHIVE_FALLBACK_BLOCKED__)renderBlocked();else mountLiveBadge()}
let timer=0;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(patch,45)}).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('nh7:sermon-archive-live',()=>setTimeout(mountLiveBadge,50));
const style=document.createElement('style');style.textContent='.nh7-sermon-live-required391 p{line-height:1.8}.nh7-sermon-live-badge391{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:12px;background:#ecfdf3;color:#08783d}.nh7-sermon-live-badge391 span{font-size:.84rem}';document.head.appendChild(style);
setTimeout(patch,450);window.NH7_SERMON_ARCHIVE_GUARD_VERSION='3.9.1';
})();
