/* New Hope 7 — account gate for all sermon/audio content v3.1.6 */
(()=>{'use strict';
const VERSION='3.1.6-audio-auth-gate',SESSION='nh7_user_session_v170',LOGOUT='nh7_explicit_logout';
const lang=()=>{const l=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return['fa','en','hr'].includes(l)?l:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function session(){try{return JSON.parse(localStorage.getItem(SESSION)||'null')}catch(_){return null}}
function logged(){const s=session();return localStorage.getItem(LOGOUT)!=='1'&&!!(s?.access_token&&s?.user?.email)}
function clearPrivateAudio(){try{sessionStorage.removeItem('nh7_school_audio_signed_v270')}catch(_){}try{document.querySelectorAll('audio').forEach(a=>{a.pause();a.removeAttribute('src');a.load?.()})}catch(_){}try{window.__sermonMap={}}catch(_){}}
function gate(){const view=document.getElementById('view');if(!view)return;clearPrivateAudio();view.innerHTML=`<section class="card nh7-audio-login-gate"><div style="font-size:2.4rem">🔐🎧</div><h2>${esc(L('ورود برای دسترسی به پیام‌های صوتی','Sign in to access audio messages','Prijavite se za pristup audio porukama'))}</h2><p>${esc(L('برای مشاهده و پخش فایل‌های صوتی باید وارد حساب کاربری خود شوید. اگر هنوز حساب ندارید، ابتدا ثبت‌نام کنید.','Sign in to your account to view and play audio. Create an account first if you have not registered.','Za prikaz i reprodukciju audio sadržaja prijavite se u račun ili se prvo registrirajte.'))}</p><div class="button-row"><button class="primary-btn wide-btn" data-go="account">${esc(L('ورود به حساب کاربری','Sign in to account','Prijava u račun'))}</button><button class="secondary-btn wide-btn" data-go="school" data-params='{"form":true}'>${esc(L('ثبت‌نام جدید','New registration','Nova registracija'))}</button></div></section>`}
function audioTarget(target){return target?.closest?.('[data-go="audio"],[data-route="audio"],[data-sermon-play]')||null}
document.addEventListener('click',event=>{const target=audioTarget(event.target);if(!target||logged())return;event.preventDefault();event.stopImmediatePropagation();try{history.pushState({},'','#audio-login-required')}catch(_){}gate()},true);
function check(){const route=decodeURIComponent(String(location.hash||'').replace(/^#/,'').split(':')[0]||'');if((route==='audio'||route==='audio-login-required')&&!logged())gate();if(!logged())clearPrivateAudio()}
window.addEventListener('hashchange',()=>setTimeout(check,0));window.addEventListener('popstate',()=>setTimeout(check,0));window.addEventListener('storage',event=>{if([SESSION,LOGOUT].includes(event.key||''))setTimeout(check,0)});
setTimeout(check,250);setTimeout(check,1200);
window.NH7_PROTECTED_AUDIO_GATE_VERSION=VERSION;
})();
