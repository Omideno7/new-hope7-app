/* New Hope 7 v4.0.1 — final school registration authority guard.
 * Guarantees the canonical handler owns School submit and verifies server state
 * before the success modal becomes actionable.
 */
(()=>{'use strict';
if(window.__NH7_REGISTRATION_FINAL_GUARD_V401__)return;
window.__NH7_REGISTRATION_FINAL_GUARD_V401__=true;
const VERSION='4.0.1-registration-final-guard';
const SUPABASE='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION='nh7_user_session_v170';
let verifyBusy=false,lastModal=null;
const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return['fa','en','hr'].includes(v)?v:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const parse=(v,f=null)=>{try{return JSON.parse(v||'')??f}catch(_){return f}};
function session(){return parse(localStorage.getItem(SESSION),null)}
function deviceId(){let id=localStorage.getItem('nh7_device_id');if(!id){id='dev_'+(crypto.randomUUID?.()||Date.now()+'_'+Math.random().toString(36).slice(2));localStorage.setItem('nh7_device_id',id)}return id}
function localRegistration(){return parse(localStorage.getItem('nh7_school_access'),null)}
function stripLegacy(){
  document.querySelectorAll('[data-submit-registration="school"]').forEach(button=>{
    button.dataset.nh7SubmitAuthority='canonical-v353';
    if(button.onclick)button.onclick=null;
  });
}
async function serverStatus(email){
  const s=session(),headers={apikey:KEY,'Content-Type':'application/json','x-device-id':deviceId()};
  if(s?.access_token)headers.Authorization='Bearer '+s.access_token;
  const r=await fetch(SUPABASE+'/rest/v1/rpc/nh7_registration_status',{method:'POST',headers,body:JSON.stringify({p_type:'school',p_email:String(email||'').trim().toLowerCase(),p_device_id:deviceId()}),cache:'no-store'});
  const text=await r.text();let data=null;try{data=text?JSON.parse(text):null}catch(_){data=null}
  if(!r.ok)throw new Error((data&&data.message)||text||('HTTP '+r.status));
  return Array.isArray(data)?data[0]||null:data;
}
function modalParts(modal){return{title:modal.querySelector('h2'),body:modal.querySelector('p'),button:modal.querySelector('[data-v353-close]')}}
async function verifySuccessModal(modal){
  if(!modal||modal===lastModal||verifyBusy)return;
  lastModal=modal;verifyBusy=true;
  const {title,body,button}=modalParts(modal),local=localRegistration(),email=String(local?.email||'').trim().toLowerCase();
  if(button){button.disabled=true;button.textContent=L('در حال تأیید با سرور…','Verifying with server…','Provjera sa serverom…')}
  if(title)title.textContent=L('در حال تأیید ثبت درخواست…','Verifying registration…','Provjera registracije…');
  if(body)body.textContent=L('چند لحظه صبر کنید؛ ثبت درخواست در سرور بررسی می‌شود.','Please wait while the server confirms your registration.','Pričekajte dok poslužitelj potvrdi registraciju.');
  try{
    if(!email)throw new Error('missing_registration_email');
    const info=await serverStatus(email);
    if(!info?.found)throw new Error('registration_not_found');
    const status=String(info.status||'pending').toLowerCase();
    const next=Object.assign({},local,{status,registration_id:info.registration_id||local?.registration_id||'',serverVerifiedAt:new Date().toISOString()});
    localStorage.setItem('nh7_school_access',JSON.stringify(next));
    if(status==='approved'){
      if(title)title.textContent=L('ثبت‌نام شما تأیید شده است','Your registration is approved','Vaša registracija je odobrena');
      if(body)body.textContent=L('این حساب از قبل در مدرسه تأیید شده است و نیازی به درخواست جدید ندارد.','This account is already approved for School and does not need a new request.','Ovaj račun je već odobren za Školu i ne treba novi zahtjev.');
    }else{
      if(title)title.textContent=L('درخواست کامل ثبت شد','Complete request submitted','Potpuni zahtjev je poslan');
      if(body)body.textContent=L('درخواست شما واقعاً در سرور ثبت شد و اکنون در انتظار تأیید مدیر مدرسه است.','Your request is confirmed on the server and is now waiting for school administrator approval.','Vaš je zahtjev potvrđen na poslužitelju i čeka odobrenje administratora škole.');
    }
    if(button){button.disabled=false;button.textContent=L('باشه','OK','U redu')}
  }catch(error){
    console.error('[NH7 registration final guard]',error);
    localStorage.removeItem('nh7_school_access');
    if(title)title.textContent=L('درخواست ثبت نشد','Registration was not submitted','Registracija nije poslana');
    if(body)body.textContent=L('سرور هیچ پرونده‌ای برای این ایمیل پیدا نکرد. لطفاً به فرم برگردید و دوباره ارسال کنید.','The server did not find a registration for this email. Return to the form and submit again.','Poslužitelj nije pronašao registraciju za ovaj e-mail. Vratite se na obrazac i pošaljite ponovno.');
    if(button){button.disabled=false;button.textContent=L('بازگشت به فرم','Return to form','Povratak na obrazac')}
  }finally{verifyBusy=false}
}
function scan(){stripLegacy();const modal=document.querySelector('.nh7-registration-confirm-v353');if(modal)verifySuccessModal(modal)}
// If canonical is ever missing, School submit is fail-closed instead of falling back to legacy code.
document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-submit-registration="school"]');if(!button)return;
  if(window.__NH7_CANONICAL_REGISTRATION_V353__)return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
  alert(L('ماژول امن ثبت‌نام هنوز بارگذاری نشده است. صفحه را تازه‌سازی کنید.','The secure registration module is not loaded yet. Refresh the page.','Sigurni modul registracije još nije učitan. Osvježite stranicu.'));
},true);
new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',()=>setTimeout(scan,80));
setInterval(stripLegacy,1200);setTimeout(scan,80);
window.NH7_REGISTRATION_FINAL_GUARD_VERSION=VERSION;
})();
