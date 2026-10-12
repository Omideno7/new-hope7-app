/* New Hope 7 v3.3.1 — single-submit school registration and clear confirmation */
(()=>{'use strict';
const VERSION='3.3.1-school-registration';
const SUPABASE='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION='nh7_user_session_v170';
const LOGOUT='nh7_explicit_logout';
let busy=false;
const FIELDS=['firstName','lastName','birthDate','city','country','spiritualAge','churchMember','churchName','pastorName','waterBaptism','salvationPrayer','eventsInterest','testimony','howFound','phone','email'];
function language(){const value=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return['fa','en','hr'].includes(value)?value:'en'}
function L(fa,en,hr){return language()==='fa'?fa:language()==='hr'?hr:en}
function E(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function parse(value,fallback=null){try{return JSON.parse(value||'')??fallback}catch(_){return fallback}}
function session(){return parse(localStorage.getItem(SESSION),null)}
function deviceId(){let id=localStorage.getItem('nh7_device_id');if(!id){id='dev_'+(crypto.randomUUID?.()||Date.now()+'_'+Math.random().toString(36).slice(2));localStorage.setItem('nh7_device_id',id)}return id}
function hash(value){let h=2166136261;for(let i=0;i<String(value).length;i++){h^=String(value).charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)}
function read(id){return String(document.getElementById('reg_'+id)?.value||'').trim()}
function addStyle(){if(document.getElementById('nh7SchoolRegistrationStyleV331'))return;const style=document.createElement('style');style.id='nh7SchoolRegistrationStyleV331';style.textContent=`.nh7-registration-confirm-v331{position:fixed;inset:0;z-index:2147483400;background:rgba(8,27,43,.55);display:grid;place-items:center;padding:22px;backdrop-filter:blur(6px)}.nh7-registration-confirm-v331>div{width:min(440px,100%);background:#fff;border:1px solid #cde9e5;border-radius:24px;padding:24px;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.25)}.nh7-registration-confirm-v331 .icon{font-size:3rem}.nh7-registration-confirm-v331 h2{margin:8px 0}.nh7-registration-confirm-v331 p{line-height:1.9;color:#475467}.registration-submit-btn.is-busy{opacity:.7;pointer-events:none}`;document.head.appendChild(style)}
function setButton(button,status,busyState,text){if(button){button.disabled=busyState;button.dataset.submitting=busyState?'1':'0';button.classList.toggle('is-busy',busyState);button.textContent=text}if(status){status.textContent=text;status.classList.toggle('success',!busyState)}}
async function request(path,{method='POST',body={},token=''}={}){const headers={'apikey':KEY,'Content-Type':'application/json'};if(token)headers.Authorization='Bearer '+token;const response=await fetch(SUPABASE+path,{method,headers,cache:'no-store',body:JSON.stringify(body)});const text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch(_){data={message:text}}if(!response.ok){const error=new Error(data.msg||data.message||data.error_description||data.error||response.statusText);error.status=response.status;error.code=data.code||'';throw error}return data}
async function ensureAccount(email,password,fullName){
  let current=session();if(current?.access_token&&String(current?.user?.email||'').toLowerCase()===email)return current;
  try{
    const created=await request('/auth/v1/signup',{body:{email,password,data:{full_name:fullName,language:language()}}});
    if(created?.access_token){localStorage.setItem(SESSION,JSON.stringify(created));localStorage.removeItem(LOGOUT);return created}
    return created||null;
  }catch(error){
    const message=String(error.message||'').toLowerCase();
    if(!message.includes('already')&&!message.includes('registered')&&!message.includes('exists'))throw error;
    try{
      const signed=await request('/auth/v1/token?grant_type=password',{body:{email,password}});
      if(signed?.access_token){localStorage.setItem(SESSION,JSON.stringify(signed));localStorage.removeItem(LOGOUT);return signed}
    }catch(signError){
      const exists=new Error(L('این ایمیل قبلاً حساب دارد. با همان رمز قبلی از صفحهٔ ورود مدرسه وارد شوید.','This email already has an account. Sign in from the school login page with the existing password.','Ovaj email već ima račun. Prijavite se postojećom lozinkom.'));
      exists.code='existing_account';throw exists;
    }
  }
}
async function submitRpc(data,accessToken=''){
  const payload=Object.assign({},data,{device_id:deviceId()});
  const rows=await request('/rest/v1/rpc/nh7_submit_registration_v3',{token:accessToken,body:{p_type:'school',p_email:data.email,p_device_id:deviceId(),p_language:language(),p_payload:payload}});
  return Array.isArray(rows)?rows[0]||{}:rows||{};
}
function openSchoolLogin(){
  document.querySelector('.nh7-registration-confirm-v331')?.remove();
  if(typeof navigate==='function'){navigate('school',{login:true},true);return}
  const routeButton=document.querySelector('[data-route="school"]');
  if(routeButton){routeButton.click();setTimeout(()=>document.querySelector('[data-go="school"][data-params*="login"]')?.click(),80);return}
  location.hash='school';
}
function showConfirmation(message,status){
  document.querySelector('.nh7-registration-confirm-v331')?.remove();
  const modal=document.createElement('div');modal.className='nh7-registration-confirm-v331';modal.dir=language()==='fa'?'rtl':'ltr';
  modal.innerHTML=`<div><div class="icon">✅</div><h2>${E(status==='approved'?L('دسترسی شما تأیید است','Your access is approved','Vaš pristup je odobren'):L('درخواست ثبت شد','Request submitted','Zahtjev je poslan'))}</h2><p>${E(message)}</p><button type="button" class="primary-btn" data-nh7-school-return>${E(L('بازگشت به ورود مدرسه','Return to school login','Povratak na prijavu u školu'))}</button></div>`;
  document.body.appendChild(modal);
  modal.querySelector('[data-nh7-school-return]').onclick=openSchoolLogin;setTimeout(openSchoolLogin,2400);
}
async function submitSchool(button){
  if(busy||button?.dataset.submitting==='1')return;
  const status=document.getElementById('registrationSubmitStatus'),data={status:'pending',submittedAt:new Date().toISOString(),kind:'school'};
  for(const field of FIELDS){data[field]=read(field);if(!data[field]){alert(L('لطفاً همه فیلدهای ضروری را کامل کنید.','Please complete all required fields.','Ispunite sva obavezna polja.'));document.getElementById('reg_'+field)?.focus();return}}
  data.email=data.email.toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)){alert(L('ایمیل صحیح وارد کنید.','Enter a valid email address.','Unesite ispravnu email adresu.'));document.getElementById('reg_email')?.focus();return}
  const password=read('password'),confirmPassword=read('confirmPassword');
  if(password.length<6){alert(L('رمز عبور باید حداقل ۶ حرف باشد.','Password must be at least 6 characters.','Lozinka mora imati najmanje 6 znakova.'));return}
  if(password!==confirmPassword){alert(L('رمز عبور و تکرار آن یکسان نیستند.','Passwords do not match.','Lozinke se ne podudaraju.'));return}
  busy=true;setButton(button,status,true,L('در حال ثبت درخواست…','Submitting request…','Slanje zahtjeva…'));
  try{
    const fullName=(data.firstName+' '+data.lastName).trim(),account=await ensureAccount(data.email,password,fullName),result=await submitRpc(data,account?.access_token||session()?.access_token||'');
    const finalStatus=String(result?.status||'pending').toLowerCase();
    const local=Object.assign({},data,{status:finalStatus,cloudId:result?.registration_id||'',registration_id:result?.registration_id||'',submitted:true});
    localStorage.setItem('nh7_school_access',JSON.stringify(local));
    localStorage.setItem('nh7_manual_email',data.email);
    localStorage.setItem('nh7_user_profile',JSON.stringify({name:fullName,email:data.email,phone:data.phone||''}));
    localStorage.setItem('nh7_school_registration_once_'+hash(data.email),JSON.stringify({registration_id:result?.registration_id||'',status:finalStatus,at:new Date().toISOString()}));
    localStorage.removeItem(LOGOUT);
    const message=finalStatus==='approved'?L('ثبت‌نام شما قبلاً تأیید شده است و می‌توانید وارد مدرسه شوید.','Your registration is already approved. You can enter the school.','Vaša registracija je već odobrena.'):L('درخواست شما با موفقیت ثبت شد. لطفاً منتظر تأیید مدیر مدرسه بمانید.','Your request was submitted successfully. Please wait for school administrator approval.','Zahtjev je uspješno poslan. Pričekajte odobrenje administratora škole.');
    setButton(button,status,false,'✓ '+message);showConfirmation(message,finalStatus);
  }catch(error){
    console.warn('School registration',error);const message=error.code==='existing_account'?error.message:L('ثبت درخواست کامل نشد. اتصال اینترنت و اطلاعات ورود را بررسی کرده و دوباره تلاش کنید.','The request was not completed. Check your connection and account details, then try again.','Zahtjev nije dovršen. Provjerite vezu i podatke računa.');
    setButton(button,status,false,message);alert(message);
    if(error.code==='existing_account')setTimeout(openSchoolLogin,350);
  }finally{busy=false;if(button)button.dataset.submitting='0'}
}
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-submit-registration="school"]');if(!button)return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();submitSchool(button)},true);
addStyle();window.NH7_SCHOOL_REGISTRATION_VERSION=VERSION;
})();
