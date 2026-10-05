/* New Hope 7 v3.4.8 — password recovery for web, PWA, and legacy native redirects */
(()=>{'use strict';
if(window.__NH7_AUTH_RECOVERY_V348__)return;
window.__NH7_AUTH_RECOVERY_V348__=true;

const VERSION='3.4.8-auth-recovery';
const SUPABASE='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const RESET_URL='https://omideno7.github.io/new-hope7-app/reset-password.html';
const APP_URL='https://omideno7.github.io/new-hope7-app/app-v239.html';
const SESSION='nh7_user_session_v170';
const LOGOUT='nh7_explicit_logout';
const SENSITIVE=['access_token','refresh_token','expires_at','expires_in','token_type','token_hash','type','error','error_code','error_description'];

function language(){const value=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return['fa','en','hr'].includes(value)?value:'en'}
function L(fa,en,hr){return language()==='fa'?fa:language()==='hr'?hr:en}
function E(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function deviceId(){let id=localStorage.getItem('nh7_device_id');if(!id){id='dev_'+(crypto.randomUUID?.()||Date.now()+'_'+Math.random().toString(36).slice(2));localStorage.setItem('nh7_device_id',id)}return id}
function validEmail(email){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email||'').trim())}
function redirectPath(path){return path+(path.includes('?')?'&':'?')+'redirect_to='+encodeURIComponent(RESET_URL)}

async function request(path,{method='POST',body,token='',timeout=18000}={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try{
    const headers={apikey:KEY,'Content-Type':'application/json','x-device-id':deviceId()};
    if(token)headers.Authorization='Bearer '+token;
    const options={method,headers,cache:'no-store',signal:controller.signal};
    if(body!==undefined)options.body=JSON.stringify(body);
    const response=await fetch(SUPABASE+path,options),raw=await response.text();let data={};
    try{data=raw?JSON.parse(raw):{}}catch(_){data={message:raw}}
    if(!response.ok){const error=new Error(data?.msg||data?.message||data?.error_description||data?.error||response.statusText);error.status=response.status;error.code=String(data?.code||data?.error_code||'');throw error}
    return data;
  }catch(error){
    if(error?.name==='AbortError'){const e=new Error('request_timeout');e.code='request_timeout';throw e}
    if(error instanceof TypeError){const e=new Error('network_error');e.code='network_error';throw e}
    throw error;
  }finally{clearTimeout(timer)}
}

function messageFor(error){
  const code=String(error?.code||'').toLowerCase(),status=Number(error?.status||0);
  if(!navigator.onLine||code==='network_error')return L('اینترنت در دسترس نیست. اتصال را بررسی و دوباره تلاش کنید.','No internet connection. Check your connection and try again.','Nema internetske veze. Provjerite vezu i pokušajte ponovno.');
  if(code==='request_timeout')return L('پاسخ سرور طول کشید. چند لحظه بعد دوباره تلاش کنید.','The server took too long to respond. Try again in a moment.','Poslužitelj predugo odgovara. Pokušajte ponovno za trenutak.');
  if(status===429||code.includes('rate'))return L('تعداد درخواست‌ها زیاد بوده است. چند دقیقه صبر کنید و دوباره تلاش کنید.','Too many requests. Wait a few minutes and try again.','Previše zahtjeva. Pričekajte nekoliko minuta i pokušajte ponovno.');
  if(status===401||status===403||code.includes('expired')||code.includes('otp'))return L('این لینک منقضی شده یا قبلاً استفاده شده است. یک لینک تازه درخواست کنید.','This link has expired or was already used. Request a new one.','Ova je poveznica istekla ili je već iskorištena. Zatražite novu.');
  if(status===422||code.includes('weak_password'))return L('یک رمز قوی‌تر با ترکیبی از حروف و عدد انتخاب کنید.','Choose a stronger password using a mix of letters and numbers.','Odaberite jaču lozinku s kombinacijom slova i brojeva.');
  return L('درخواست انجام نشد. چند لحظه بعد دوباره تلاش کنید.','The request could not be completed. Please try again in a moment.','Zahtjev nije dovršen. Pokušajte ponovno za trenutak.');
}
function permanentRecoveryError(error){const code=String(error?.code||'').toLowerCase(),status=Number(error?.status||0);return status===401||status===403||code==='missing_recovery_token'||code.includes('expired')||code.includes('otp_expired')||code.includes('bad_jwt')||code.includes('invalid_jwt')}

function setMsg(text,type='info'){const el=document.getElementById('resetMsg');if(!el)return;el.textContent=text;el.style.color=type==='error'?'#b42318':type==='success'?'#08783d':'';el.style.fontWeight=type==='error'||type==='success'?'700':''}
async function sendRecovery(email){localStorage.setItem('nh7_recovery_requested_at',String(Date.now()));return request(redirectPath('/auth/v1/recover'),{body:{email}})}
async function handleReset(button){
  const email=String(document.getElementById('resetEmail')?.value||document.getElementById('accountEmail')?.value||'').trim().toLowerCase();
  if(!email){setMsg(L('ابتدا ایمیل حساب را وارد کنید.','Enter your account email first.','Najprije unesite e-mail računa.'),'error');document.getElementById('resetEmail')?.focus();return}
  if(!validEmail(email)){setMsg(L('آدرس ایمیل معتبر وارد کنید.','Enter a valid email address.','Unesite valjanu e-mail adresu.'),'error');document.getElementById('resetEmail')?.focus();return}
  const old=button?.textContent||'';if(button){button.disabled=true;button.textContent=L('در حال ارسال…','Sending…','Slanje…')}
  try{await sendRecovery(email);setMsg(L('اگر این ایمیل در سیستم وجود داشته باشد، لینک بازیابی رمز ارسال شد. پوشه Spam/Junk را هم بررسی کنید.','If this email exists, a password reset link has been sent. Check Spam/Junk too.','Ako ovaj e-mail postoji, poveznica za obnovu lozinke je poslana. Provjerite i Spam/Junk.'),'success')}
  catch(error){console.warn('Password recovery',error);setMsg(messageFor(error),'error')}
  finally{if(button){button.disabled=false;button.textContent=old}}
}
async function handleResend(button){
  const email=String(document.getElementById('resetEmail')?.value||document.getElementById('accountEmail')?.value||'').trim().toLowerCase();
  if(!validEmail(email)){setMsg(L('برای ارسال دوباره تأیید حساب، یک ایمیل معتبر وارد کنید.','Enter a valid email to resend account confirmation.','Unesite valjan e-mail za ponovno slanje potvrde računa.'),'error');return}
  const old=button.textContent;button.disabled=true;button.textContent=L('در حال ارسال…','Sending…','Slanje…');
  try{await request(redirectPath('/auth/v1/resend'),{body:{type:'signup',email}});setMsg(L('اگر حساب هنوز تأیید نشده باشد، ایمیل تأیید دوباره ارسال شد. پوشه Spam/Junk را بررسی کنید.','If the account is still unconfirmed, the confirmation email has been resent. Check Spam/Junk.','Ako račun još nije potvrđen, e-mail za potvrdu je ponovno poslan. Provjerite Spam/Junk.'),'success')}
  catch(error){console.warn('Confirmation resend',error);setMsg(messageFor(error),'error')}
  finally{button.disabled=false;button.textContent=old}
}

function recoveryPayload(){
  const hash=new URLSearchParams(String(location.hash||'').replace(/^#/,'')),query=new URLSearchParams(location.search),get=key=>hash.get(key)||query.get(key)||'';
  const type=String(get('type')||'').toLowerCase(),error=get('error_description')||get('error')||'',errorCode=get('error_code')||'';
  const recentlyRequested=Date.now()-Number(localStorage.getItem('nh7_recovery_requested_at')||0)<2*60*60*1000;
  const likelyRecoveryError=!!error&&(recentlyRequested||/(recovery|password|otp_expired|expired|link)/i.test(error+' '+errorCode));
  const accessToken=get('access_token'),tokenHash=get('token_hash');
  // Never treat an explicit signup/invite/email-change callback as password recovery.
  if(type&&type!=='recovery')return null;
  if(!accessToken&&!tokenHash&&!likelyRecoveryError)return null;
  return{type:type||'recovery',accessToken,tokenHash,error,errorCode};
}
const initialRecovery=recoveryPayload();
if(initialRecovery){
  window.__NH7_PASSWORD_RECOVERY_ACTIVE__=true;
  try{const url=new URL(location.href);SENSITIVE.forEach(key=>url.searchParams.delete(key));url.hash='';history.replaceState(history.state||{},'',url.pathname+(url.searchParams.toString()?'?'+url.searchParams.toString():''))}catch(_){}
}

function addStyle(){if(document.getElementById('nh7AuthRecoveryStyleV348'))return;const style=document.createElement('style');style.id='nh7AuthRecoveryStyleV348';style.textContent=`
.nh7-auth-recovery-v348{position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;padding:20px;background:rgba(7,28,46,.72);backdrop-filter:blur(8px);overflow:auto}.nh7-auth-recovery-v348 *{box-sizing:border-box}
.nh7-auth-recovery-v348__card{width:min(520px,100%);background:#fff;border:1px solid #cde9e5;border-radius:26px;padding:24px;box-shadow:0 28px 90px rgba(0,0,0,.35);color:#102238;text-align:start}.nh7-auth-recovery-v348__logo{display:block;width:72px;height:72px;object-fit:contain;margin:0 auto 8px}.nh7-auth-recovery-v348 h2{text-align:center;margin:6px 0 14px}.nh7-auth-recovery-v348 p{line-height:1.8}
.nh7-auth-recovery-v348 input,.nh7-auth-recovery-v348 button{width:100%;font:inherit;border-radius:14px;padding:13px;margin-top:10px;border:1px solid #bddbd8;background:#fff}.nh7-auth-recovery-v348 button{cursor:pointer;font-weight:800}.nh7-auth-recovery-v348 button:disabled{opacity:.6;cursor:wait}.nh7-auth-recovery-v348 .nh7-primary{border:0;color:#fff;background:linear-gradient(90deg,#0d79b8,#15a66f)}
.nh7-auth-recovery-v348 .nh7-status{padding:12px;border-radius:14px;background:#eef8ff;border:1px solid #cfe5f8;white-space:pre-line}.nh7-auth-recovery-v348 .nh7-status.error{background:#fff1f1;border-color:#f4caca;color:#a02121}.nh7-auth-recovery-v348 .nh7-status.success{background:#effcf5;border-color:#c5ead4;color:#11633a}.nh7-auth-recovery-v348 .nh7-hidden{display:none!important}.nh7-auth-recovery-v348 .nh7-ltr{direction:ltr;text-align:left}`;document.head.appendChild(style)}
function modalStatus(modal,message,type='info'){const el=modal.querySelector('[data-nh7-recovery-status]');if(!el)return;el.textContent=message;el.className='nh7-status'+(type==='error'?' error':type==='success'?' success':'')}
function showFreshLink(modal){modal.querySelector('[data-nh7-recovery-resend]')?.classList.remove('nh7-hidden')}
async function sendFreshRecovery(modal){const email=String(modal.querySelector('[data-nh7-recovery-email]')?.value||'').trim().toLowerCase(),button=modal.querySelector('[data-nh7-recovery-send]');if(!validEmail(email)){modalStatus(modal,L('یک آدرس ایمیل معتبر وارد کنید.','Enter a valid email address.','Unesite valjanu e-mail adresu.'),'error');return}const old=button.textContent;button.disabled=true;button.textContent=L('در حال ارسال…','Sending…','Slanje…');try{await sendRecovery(email);modalStatus(modal,L('اگر این ایمیل در سیستم وجود داشته باشد، لینک جدید ارسال شد. پوشه Spam/Junk را هم بررسی کنید.','If this email exists, a new recovery link has been sent. Check Spam/Junk too.','Ako ovaj e-mail postoji, poslana je nova poveznica. Provjerite i Spam/Junk.'),'success')}catch(error){modalStatus(modal,messageFor(error),'error')}finally{button.disabled=false;button.textContent=old}}
async function recoveryAccessToken(payload){if(payload.accessToken)return payload.accessToken;if(!payload.tokenHash)return'';const data=await request('/auth/v1/verify',{body:{token_hash:payload.tokenHash,type:'recovery'}});payload.tokenHash='';payload.accessToken=data?.access_token||data?.session?.access_token||'';return payload.accessToken}
async function savePassword(modal,payload){
  const password=String(modal.querySelector('[data-nh7-recovery-password]')?.value||''),confirmPassword=String(modal.querySelector('[data-nh7-recovery-confirm]')?.value||''),button=modal.querySelector('[data-nh7-recovery-save]');
  if(password.length<6){modalStatus(modal,L('رمز عبور باید حداقل ۶ کاراکتر باشد.','Password must be at least 6 characters.','Lozinka mora imati najmanje 6 znakova.'),'error');return}
  if(password!==confirmPassword){modalStatus(modal,L('تکرار رمز عبور با رمز اصلی یکسان نیست.','Password confirmation does not match.','Potvrda lozinke nije ista kao lozinka.'),'error');return}
  const old=button.textContent;button.disabled=true;button.textContent=L('در حال ذخیره…','Saving…','Spremanje…');
  try{
    const token=await recoveryAccessToken(payload);if(!token){const e=new Error('missing_recovery_token');e.code='expired';throw e}
    await request('/auth/v1/user',{method:'PUT',token,body:{password}});request('/auth/v1/logout',{token}).catch(()=>{});
    localStorage.removeItem(SESSION);localStorage.setItem(LOGOUT,'1');localStorage.removeItem('nh7_recovery_requested_at');
    modal.querySelector('[data-nh7-recovery-password]').value='';modal.querySelector('[data-nh7-recovery-confirm]').value='';modal.querySelector('[data-nh7-recovery-form]')?.classList.add('nh7-hidden');modal.querySelector('[data-nh7-recovery-resend]')?.classList.add('nh7-hidden');modal.querySelector('[data-nh7-recovery-done]')?.classList.remove('nh7-hidden');
    modalStatus(modal,L('رمز عبور با موفقیت تغییر کرد. اکنون با ایمیل و رمز جدید وارد شوید.','Your password was updated. Sign in with your email and new password.','Lozinka je promijenjena. Prijavite se e-mailom i novom lozinkom.'),'success');
  }catch(error){console.warn('Password update',error);modalStatus(modal,messageFor(error),'error');if(permanentRecoveryError(error)){payload.accessToken='';payload.tokenHash='';showFreshLink(modal)}}
  finally{button.disabled=false;button.textContent=old}
}
function openInlineRecovery(payload){
  addStyle();document.getElementById('nh7AuthRecoveryModalV348')?.remove();
  const modal=document.createElement('div');modal.id='nh7AuthRecoveryModalV348';modal.className='nh7-auth-recovery-v348';modal.dir=language()==='fa'?'rtl':'ltr';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
  modal.innerHTML=`<section class="nh7-auth-recovery-v348__card"><img class="nh7-auth-recovery-v348__logo" src="assets/logo.png" alt="New Hope 7"><h2>${E(L('تعیین رمز عبور جدید','Set a new password','Postavite novu lozinku'))}</h2><p class="nh7-status" data-nh7-recovery-status></p><div class="nh7-hidden" data-nh7-recovery-form><input class="nh7-ltr" type="password" minlength="6" autocomplete="new-password" data-nh7-recovery-password placeholder="${E(L('رمز جدید','New password','Nova lozinka'))}"><input class="nh7-ltr" type="password" minlength="6" autocomplete="new-password" data-nh7-recovery-confirm placeholder="${E(L('تکرار رمز جدید','Confirm new password','Potvrdite novu lozinku'))}"><button type="button" class="nh7-primary" data-nh7-recovery-save>${E(L('ذخیره رمز جدید','Save new password','Spremi novu lozinku'))}</button></div><div class="nh7-hidden" data-nh7-recovery-resend><p>${E(L('یک لینک بازیابی تازه برای خودتان بفرستید.','Send yourself a fresh recovery link.','Pošaljite si novu poveznicu za obnovu.'))}</p><input class="nh7-ltr" type="email" autocomplete="email" data-nh7-recovery-email placeholder="${E(L('ایمیل حساب','Account email','E-mail računa'))}"><button type="button" data-nh7-recovery-send>${E(L('ارسال لینک جدید','Send a new link','Pošalji novu poveznicu'))}</button></div><button type="button" class="nh7-hidden" data-nh7-recovery-done>${E(L('بازگشت به صفحه ورود','Return to sign in','Povratak na prijavu'))}</button></section>`;
  document.body.appendChild(modal);modal.querySelector('[data-nh7-recovery-send]').onclick=()=>sendFreshRecovery(modal);modal.querySelector('[data-nh7-recovery-done]').onclick=()=>location.assign(APP_URL+'?recovered=1&v='+Date.now());
  if(payload.error||(!payload.accessToken&&!payload.tokenHash)){modalStatus(modal,L('این لینک معتبر نیست یا منقضی شده است. یک لینک تازه درخواست کنید.','This link is invalid or expired. Request a fresh one.','Poveznica nije valjana ili je istekla. Zatražite novu.'),'error');showFreshLink(modal);return}
  modalStatus(modal,L('رمز جدید را دو بار وارد کنید. لینک تنها هنگام ذخیره مصرف می‌شود.','Enter your new password twice. The link is used only when you save.','Unesite novu lozinku dva puta. Poveznica se koristi tek pri spremanju.'));modal.querySelector('[data-nh7-recovery-form]').classList.remove('nh7-hidden');modal.querySelector('[data-nh7-recovery-save]').onclick=()=>savePassword(modal,payload);modal.querySelector('[data-nh7-recovery-password]')?.focus();
}

function enhance(){const panel=document.getElementById('forgotPasswordPanel');if(!panel||panel.querySelector('#nh7ResendConfirmationV342'))return;const info=document.createElement('p');info.className='muted';info.textContent=L('اگر حساب را تازه ساخته‌اید ولی هنوز ایمیل را تأیید نکرده‌اید، ایمیل تأیید را دوباره دریافت کنید.','If you just created the account but have not confirmed the email, resend the confirmation email.','Ako ste upravo izradili račun, ali niste potvrdili e-mail, ponovno pošaljite potvrdu.');const button=document.createElement('button');button.type='button';button.id='nh7ResendConfirmationV342';button.className='secondary-btn';button.textContent=L('ارسال دوباره ایمیل تأیید حساب','Resend account confirmation email','Ponovno pošalji potvrdu računa');panel.append(info,button)}
document.addEventListener('click',event=>{const reset=event.target.closest?.('#resetPasswordBtn');if(reset){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();handleReset(reset);return}const resend=event.target.closest?.('#nh7ResendConfirmationV342');if(resend){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();handleResend(resend)}},true);
const observer=new MutationObserver(enhance);observer.observe(document.documentElement,{subtree:true,childList:true});enhance();
if(initialRecovery){const start=()=>openInlineRecovery(initialRecovery);if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true})}
window.NH7_AUTH_RECOVERY_VERSION=VERSION;
})();
