/* New Hope 7 v3.5.1 — canonical school/account registration.
   One full form, strict field validation, strong new-account passwords,
   full recovery metadata, and a guard against legacy/incomplete signups. */
(()=>{'use strict';
if(window.__NH7_CANONICAL_REGISTRATION_V351__)return;
window.__NH7_CANONICAL_REGISTRATION_V351__=true;

const VERSION='3.5.1-canonical-registration';
const SUPABASE='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION='nh7_user_session_v170';
const LOGOUT='nh7_explicit_logout';
const CONFIRM_REDIRECT='https://omideno7.github.io/new-hope7-app/reset-password.html';
const CANONICAL='3.5.1';
const priorFetch=window.fetch.bind(window);
let busy=false,patchTimer=0;

const REQUIRED=['firstName','lastName','birthDate','city','country','spiritualAge','churchMember','waterBaptism','salvationPrayer','eventsInterest','testimony','howFound','phone','email'];
const LABELS={
 fa:{firstName:'نام',lastName:'نام خانوادگی',birthDate:'تاریخ تولد',city:'شهر',country:'کشور',spiritualAge:'مدت زمان ایمان',churchMember:'عضویت کلیسا',churchName:'نام کلیسا',pastorName:'نام شبان',waterBaptism:'تعمید آب',salvationPrayer:'دعای نجات',eventsInterest:'علاقه‌مندی به سمینار/کنفرانس',testimony:'شهادت یا توضیح شما',howFound:'نحوه آشنایی با کلیسا',phone:'شماره تلفن',email:'ایمیل',password:'رمز عبور',confirmPassword:'تکرار رمز عبور'},
 en:{firstName:'First name',lastName:'Last name',birthDate:'Date of birth',city:'City',country:'Country',spiritualAge:'Spiritual age',churchMember:'Church membership',churchName:'Church name',pastorName:'Pastor name',waterBaptism:'Water baptism',salvationPrayer:'Salvation prayer',eventsInterest:'Seminar/conference interest',testimony:'Testimony',howFound:'How you found us',phone:'Phone number',email:'Email address',password:'Password',confirmPassword:'Confirm password'},
 hr:{firstName:'Ime',lastName:'Prezime',birthDate:'Datum rođenja',city:'Grad',country:'Država',spiritualAge:'Duhovna dob',churchMember:'Članstvo u crkvi',churchName:'Naziv crkve',pastorName:'Ime pastora',waterBaptism:'Krštenje u vodi',salvationPrayer:'Molitva spasenja',eventsInterest:'Interes za seminare/konferencije',testimony:'Svjedočanstvo',howFound:'Kako ste nas pronašli',phone:'Broj telefona',email:'E-mail',password:'Lozinka',confirmPassword:'Potvrda lozinke'}
};
const TYPO_DOMAINS={
 'gmil.com':'gmail.com','gmai.com':'gmail.com','gmal.com':'gmail.com','gmail.co':'gmail.com','gmail.con':'gmail.com','gmail.om':'gmail.com','gmail.cmo':'gmail.com','gmailcom':'gmail.com',
 'hotmial.com':'hotmail.com','hotmai.com':'hotmail.com','hotmail.con':'hotmail.com','hotmail.co':'hotmail.com','hotmailcom':'hotmail.com',
 'yaho.com':'yahoo.com','yahoo.con':'yahoo.com','yahoo.co':'yahoo.com','yahoocom':'yahoo.com',
 'outlok.com':'outlook.com','outloo.com':'outlook.com','outlook.con':'outlook.com','outlook.co':'outlook.com','outlookcom':'outlook.com'
};

function language(){const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return ['fa','en','hr'].includes(v)?v:'en'}
function L(fa,en,hr){return language()==='fa'?fa:language()==='hr'?hr:en}
function label(id){return LABELS[language()]?.[id]||LABELS.en[id]||id}
function E(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function parse(v,f=null){try{return JSON.parse(v||'')??f}catch(_){return f}}
function session(){return parse(localStorage.getItem(SESSION),null)}
function saveSession(s){if(s?.access_token){localStorage.setItem(SESSION,JSON.stringify(s));localStorage.removeItem(LOGOUT)}}
function deviceId(){let id=localStorage.getItem('nh7_device_id');if(!id){id='dev_'+(crypto.randomUUID?.()||Date.now()+'_'+Math.random().toString(36).slice(2));localStorage.setItem('nh7_device_id',id)}return id}
function hash(v){let h=2166136261;for(let i=0;i<String(v).length;i++){h^=String(v).charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)}
function read(id){return String(document.getElementById('reg_'+id)?.value||'').trim()}

function fieldError(id,message){
 const el=document.getElementById('reg_'+id);if(!el)return;
 const row=el.closest('.form-row')||el.parentElement;
 row?.classList.add('nh7-invalid-v351');
 let note=row?.querySelector('.nh7-field-error-v351');
 if(!note){note=document.createElement('small');note.className='nh7-field-error-v351';row?.appendChild(note)}
 note.textContent=message;
}
function clearField(id){const el=document.getElementById('reg_'+id),row=el?.closest('.form-row')||el?.parentElement;row?.classList.remove('nh7-invalid-v351');row?.querySelector('.nh7-field-error-v351')?.remove()}
function clearErrors(){document.querySelectorAll('.nh7-invalid-v351').forEach(x=>x.classList.remove('nh7-invalid-v351'));document.querySelectorAll('.nh7-field-error-v351').forEach(x=>x.remove());setStatus('')}
function focusField(id){const el=document.getElementById('reg_'+id);if(!el)return;try{el.focus({preventScroll:true})}catch(_){el.focus()}setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'center'}),30)}
function setStatus(message,type=''){const el=document.getElementById('registrationSubmitStatus');if(!el)return;el.textContent=message;el.classList.toggle('nh7-v351-error',type==='error');el.classList.toggle('nh7-v351-success',type==='success')}
function setButton(button,on,text=''){if(!button)return;button.disabled=on;button.dataset.submitting=on?'1':'0';button.classList.toggle('is-busy',on);if(text)button.textContent=text}

function emailCheck(raw){
 const email=String(raw||'').trim().toLowerCase();
 if(!email)return{ok:false,email,message:L('آدرس ایمیل را وارد کنید.','Enter your email address.','Unesite e-mail adresu.')};
 if(/\s/.test(email)||email.split('@').length!==2)return{ok:false,email,message:L('ایمیل نباید فاصله داشته باشد و فقط یک @ داشته باشد.','Email must not contain spaces and must contain one @ sign.','E-mail ne smije sadržavati razmake i mora imati jedan znak @.')};
 const [local,domain]=email.split('@');
 if(!local||!domain||local.startsWith('.')||local.endsWith('.')||local.includes('..')||domain.includes('..')||!domain.includes('.')||!/[.][a-z]{2,24}$/i.test(domain)||!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)||!/^[a-z0-9.-]+$/i.test(domain)||domain.startsWith('-')||domain.endsWith('-')||domain.split('.').some(x=>!x||x.startsWith('-')||x.endsWith('-'))){
   const target=TYPO_DOMAINS[domain];
   return{ok:false,email,suggestion:target?local+'@'+target:'',message:target?L(`این دامنه احتمالاً اشتباه تایپی است. آیا منظورتان ${local+'@'+target} است؟`,`This domain looks mistyped. Did you mean ${local+'@'+target}?`,`Domena izgleda pogrešno. Jeste li mislili ${local+'@'+target}?`):L('آدرس ایمیل معتبر نیست. نمونه صحیح: name@gmail.com','This email address is not valid. Example: name@gmail.com','E-mail nije valjan. Primjer: name@gmail.com')};
 }
 const target=TYPO_DOMAINS[domain];
 if(target)return{ok:false,email,suggestion:local+'@'+target,message:L(`آدرس ایمیل احتمالاً اشتباه است. آیا منظورتان ${local+'@'+target} است؟`,`This email looks mistyped. Did you mean ${local+'@'+target}?`,`E-mail izgleda pogrešno. Jeste li mislili ${local+'@'+target}?`)};
 return{ok:true,email};
}
function passwordRules(p){
 const s=String(p||'');
 return{length:s.length>=10,upper:/[A-Z]/.test(s),lower:/[a-z]/.test(s),digit:/\d/.test(s),symbol:/[^A-Za-z0-9\s]/.test(s),noSpace:!/\s/.test(s)};
}
function passwordOk(p){return Object.values(passwordRules(p)).every(Boolean)}
function passwordMessage(){return L('رمز باید حداقل ۱۰ کاراکتر و شامل حرف بزرگ انگلیسی، حرف کوچک انگلیسی، عدد و یک نشانه (مثل ! @ #) باشد و فاصله نداشته باشد.','Password must be at least 10 characters and include an uppercase letter, a lowercase letter, a number and a symbol (such as ! @ #), with no spaces.','Lozinka mora imati najmanje 10 znakova te veliko i malo slovo, broj i simbol (npr. ! @ #), bez razmaka.')}

function validate(){
 clearErrors();
 const data={status:'pending',kind:'school',submittedAt:new Date().toISOString(),registrationVersion:CANONICAL};
 const errors=[];
 for(const id of REQUIRED){data[id]=read(id);if(!data[id])errors.push([id,L(`لطفاً «${label(id)}» را کامل کنید.`,`Please complete “${label(id)}”.`,`Ispunite polje „${label(id)}”.`)])}
 data.churchName=read('churchName');data.pastorName=read('pastorName');
 if(data.churchMember==='yes'){if(!data.churchName)errors.push(['churchName',L('نام کلیسا را وارد کنید.','Enter the church name.','Unesite naziv crkve.')]);if(!data.pastorName)errors.push(['pastorName',L('نام شبان را وارد کنید.','Enter the pastor name.','Unesite ime pastora.')])}
 if(data.firstName&&data.firstName.length<2)errors.push(['firstName',L('نام را کامل وارد کنید.','Enter your full first name.','Unesite puno ime.')]);
 if(data.lastName&&data.lastName.length<2)errors.push(['lastName',L('نام خانوادگی را کامل وارد کنید.','Enter your full last name.','Unesite puno prezime.')]);
 if(data.birthDate){const d=new Date(data.birthDate+'T00:00:00');if(!/^\d{4}-\d{2}-\d{2}$/.test(data.birthDate)||Number.isNaN(d.getTime()))errors.push(['birthDate',L('تاریخ تولد معتبر وارد کنید.','Enter a valid date of birth.','Unesite valjan datum rođenja.')]);else if(d>new Date())errors.push(['birthDate',L('تاریخ تولد نمی‌تواند در آینده باشد.','Date of birth cannot be in the future.','Datum rođenja ne može biti u budućnosti.')])}
 if(data.phone){const digits=data.phone.replace(/\D/g,'');if(digits.length<8||digits.length>16)errors.push(['phone',L('شماره تلفن باید بین ۸ تا ۱۶ رقم باشد. بهتر است کد کشور را هم وارد کنید.','Phone number must contain 8–16 digits. Include the country code when possible.','Broj telefona mora imati 8–16 znamenki. Po mogućnosti unesite pozivni broj države.')]);if(!/^[+0-9()\-\s]+$/.test(data.phone))errors.push(['phone',L('در شماره تلفن فقط عدد، +، فاصله، خط تیره و پرانتز مجاز است.','Use only digits, +, spaces, hyphens and parentheses in the phone number.','U broju telefona koristite samo znamenke, +, razmake, crtice i zagrade.')])}
 if(data.email){const ec=emailCheck(data.email);data.email=ec.email;if(!ec.ok)errors.push(['email',ec.message])}
 for(const id of ['churchMember','waterBaptism','salvationPrayer','eventsInterest'])if(data[id]&&!['yes','no'].includes(String(data[id]).toLowerCase()))errors.push([id,L('لطفاً یکی از گزینه‌های بله یا خیر را انتخاب کنید.','Please choose Yes or No.','Odaberite Da ili Ne.')]);
 const password=String(document.getElementById('reg_password')?.value||''),confirmPassword=String(document.getElementById('reg_confirmPassword')?.value||'');
 if(!password)errors.push(['password',L('رمز عبور را وارد کنید.','Enter a password.','Unesite lozinku.')]);else if(!passwordOk(password))errors.push(['password',passwordMessage()]);
 if(!confirmPassword)errors.push(['confirmPassword',L('رمز عبور را دوباره وارد کنید.','Confirm your password.','Potvrdite lozinku.')]);else if(password!==confirmPassword)errors.push(['confirmPassword',L('تکرار رمز عبور با رمز اصلی یکسان نیست.','Password confirmation does not match.','Potvrda lozinke nije ista kao lozinka.')]);
 const seen=new Set();for(const [id,msg] of errors){if(seen.has(id))continue;seen.add(id);fieldError(id,msg)}
 if(errors.length){setStatus(errors[0][1],'error');focusField(errors[0][0]);return{ok:false}}
 return{ok:true,data,password};
}

function packetComplete(packet,email=''){
 if(!packet||typeof packet!=='object')return false;
 if(REQUIRED.some(k=>!String(packet[k]||'').trim()))return false;
 if(String(packet.churchMember||'').toLowerCase()==='yes'&&(!String(packet.churchName||'').trim()||!String(packet.pastorName||'').trim()))return false;
 const ec=emailCheck(packet.email);if(!ec.ok)return false;
 if(email&&ec.email!==String(email).trim().toLowerCase())return false;
 const phone=String(packet.phone||'').replace(/\D/g,'');if(phone.length<8||phone.length>16)return false;
 return true;
}

/* Block legacy direct Auth signup calls from this app shell. A new account must carry
   the complete canonical school-registration packet in user metadata. */
window.fetch=async function(input,init={}){
 try{
   const url=typeof input==='string'?input:(input instanceof URL?input.href:input?.url||'');
   const method=String(init?.method||(input instanceof Request?input.method:'GET')||'GET').toUpperCase();
   if(method==='POST'&&String(url).startsWith(SUPABASE+'/auth/v1/signup')){
     let body=null;
     try{body=typeof init?.body==='string'?JSON.parse(init.body):init?.body}catch(_){}
     const email=String(body?.email||'').trim().toLowerCase();
     if(body?.data?.nh7_registration_version!==CANONICAL||!packetComplete(body?.data?.school_registration,email)){
       return new Response(JSON.stringify({code:'canonical_registration_required',message:'Complete the current New Hope 7 registration form before creating an account.'}),{status:422,statusText:'Unprocessable Entity',headers:{'Content-Type':'application/json'}});
     }
   }
 }catch(error){console.warn('Canonical signup guard',error)}
 return priorFetch(input,init);
};

function apiError(data,response,text){const e=new Error(data?.msg||data?.message||data?.error_description||data?.error||text||response.statusText||'Request failed');e.status=response.status;e.code=String(data?.code||data?.error_code||'');e.details=data;return e}
async function request(path,{method='POST',body,token='',timeout=22000}={}){
 const headers={apikey:KEY,'Content-Type':'application/json','x-device-id':deviceId()};if(token)headers.Authorization='Bearer '+token;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
 try{const options={method,headers,cache:'no-store',signal:controller.signal};if(body!==undefined)options.body=JSON.stringify(body);const response=await fetch(SUPABASE+path,options),text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch(_){data={message:text}}if(!response.ok)throw apiError(data,response,text);return data}
 catch(error){if(error?.name==='AbortError'){const e=new Error('request_timeout');e.code='request_timeout';throw e}if(error instanceof TypeError){const e=new Error('network_error');e.code='network_error';throw e}throw error}
 finally{clearTimeout(timer)}
}
function isDuplicate(error){const c=String(error?.code||'').toLowerCase(),m=String(error?.message||'').toLowerCase();return c==='user_already_exists'||c.includes('already')||m.includes('already registered')||m.includes('already exists')}
function isUnconfirmed(error){const c=String(error?.code||'').toLowerCase(),m=String(error?.message||'').toLowerCase();return c==='email_not_confirmed'||m.includes('email not confirmed')||m.includes('email_not_confirmed')}
function isInvalidCredentials(error){const c=String(error?.code||'').toLowerCase(),m=String(error?.message||'').toLowerCase();return c==='invalid_credentials'||m.includes('invalid login credentials')||m.includes('wrong password')||m.includes('invalid credentials')}
async function resend(email){try{await request('/auth/v1/resend?redirect_to='+encodeURIComponent(CONFIRM_REDIRECT),{body:{type:'signup',email},timeout:15000});return true}catch(_){return false}}
async function recover(email){try{await request('/auth/v1/recover?redirect_to='+encodeURIComponent(CONFIRM_REDIRECT),{body:{email},timeout:15000});return true}catch(_){return false}}

async function existingAccount(email,password){
 try{
   const signed=await request('/auth/v1/token?grant_type=password',{body:{email,password}});
   if(signed?.access_token){saveSession(signed);return{session:signed,confirmationRequired:false}}
 }catch(error){
   if(isUnconfirmed(error)){const resent=await resend(email);return{session:null,confirmationRequired:true,confirmationResent:resent}}
   if(!isInvalidCredentials(error))throw error;
   const sent=await recover(email);const e=new Error('existing_account_password');e.code='existing_account_password';e.passwordResetSent=sent;throw e;
 }
 const e=new Error('existing_account_password');e.code='existing_account_password';throw e;
}
async function ensureAccount(data,password){
 const email=data.email,current=session();
 if(current?.access_token&&String(current?.user?.email||'').trim().toLowerCase()===email)return{session:current,confirmationRequired:false};
 const metadata={
   full_name:(data.firstName+' '+data.lastName).trim(),
   language:language(),
   nh7_registration_version:CANONICAL,
   school_registration:Object.assign({},data,{email,registrationVersion:CANONICAL})
 };
 try{
   const created=await request('/auth/v1/signup?redirect_to='+encodeURIComponent(CONFIRM_REDIRECT),{body:{email,password,data:metadata}});
   if(created?.access_token){saveSession(created);return{session:created,confirmationRequired:false}}
   if(Array.isArray(created?.user?.identities)&&created.user.identities.length===0)return existingAccount(email,password);
   return{session:null,confirmationRequired:true};
 }catch(error){if(!isDuplicate(error))throw error;return existingAccount(email,password)}
}
async function submitRpc(data,token=''){
 const payload=Object.assign({},data,{email:data.email,user_email:data.email,device_id:deviceId(),registrationVersion:CANONICAL});
 const rows=await request('/rest/v1/rpc/nh7_submit_registration_v3',{token,body:{p_type:'school',p_email:data.email,p_device_id:deviceId(),p_language:language(),p_payload:payload}});
 return Array.isArray(rows)?rows[0]||{}:rows||{};
}
function friendly(error){
 const code=String(error?.code||'').toLowerCase(),m=String(error?.message||''),status=Number(error?.status||0);
 if(code==='existing_account_password')return L('این ایمیل قبلاً حساب دارد اما رمز واردشده با حساب قبلی یکی نیست. لینک بازیابی رمز برایتان ارسال شد؛ ابتدا رمز را بازیابی کنید و سپس فرم را با همان ایمیل کامل کنید.','This email already has an account, but the password does not match. A password-reset link was sent; reset the password and then complete this form with the same email.','Ovaj e-mail već ima račun, ali lozinka nije ispravna. Poslana je poveznica za obnovu lozinke; obnovite lozinku i zatim dovršite obrazac s istim e-mailom.');
 if(code==='canonical_registration_required')return L('نسخهٔ قدیمی فرم ثبت‌نام دیگر قابل استفاده نیست. برنامه را تازه‌سازی کنید و فرم کامل جدید را باز کنید.','The old registration form can no longer create accounts. Refresh the app and use the current full form.','Stari obrazac više ne može stvarati račune. Osvježite aplikaciju i koristite novi puni obrazac.');
 if(!navigator.onLine||code==='network_error')return L('اینترنت در دسترس نیست. اتصال را بررسی کنید و دوباره تلاش کنید.','No internet connection. Check your connection and try again.','Nema internetske veze. Provjerite vezu i pokušajte ponovno.');
 if(code==='request_timeout')return L('پاسخ سرور طول کشید. اطلاعات فرم را نگه دارید و چند لحظه بعد دوباره تلاش کنید.','The server took too long. Keep the form data and try again in a moment.','Poslužitelj predugo odgovara. Sačuvajte podatke i pokušajte ponovno.');
 if(status===429||code.includes('rate'))return L('تعداد تلاش‌ها زیاد بوده است. چند دقیقه صبر کنید.','Too many attempts. Wait a few minutes and try again.','Previše pokušaja. Pričekajte nekoliko minuta.');
 const reg=m.match(/REG_(?:REQUIRED|OPTION_INVALID):([A-Za-z]+)/);if(reg){const id=reg[1];fieldError(id,L(`فیلد «${label(id)}» کامل یا معتبر نیست.`,`The “${label(id)}” field is incomplete or invalid.`,`Polje „${label(id)}” nije potpuno ili valjano.`));focusField(id);return L('یکی از فیلدهای فرم نیاز به اصلاح دارد.','One of the form fields needs correction.','Jedno polje obrasca treba ispraviti.')}
 if(m.includes('REG_EMAIL_TYPO:')){const suggested=m.split('REG_EMAIL_TYPO:')[1].split(/\s/)[0];return L(`دامنهٔ ایمیل اشتباه به نظر می‌رسد. دامنهٔ صحیح احتمالاً ${suggested} است.`,`The email domain looks mistyped. The likely domain is ${suggested}.`,`Domena e-maila izgleda pogrešno. Vjerojatna domena je ${suggested}.`)}
 if(m.includes('REG_EMAIL'))return L('آدرس ایمیل معتبر نیست یا با ایمیل فرم یکسان نیست.','The email address is invalid or does not match the form.','E-mail nije valjan ili se ne podudara s obrascem.');
 if(m.includes('REG_PHONE'))return L('شماره تلفن معتبر نیست.','The phone number is invalid.','Broj telefona nije valjan.');
 if(m.includes('REG_BIRTHDATE'))return L('تاریخ تولد معتبر نیست.','The date of birth is invalid.','Datum rođenja nije valjan.');
 if(status>=500)return L('سرویس ثبت‌نام موقتاً در دسترس نیست. چند دقیقه بعد دوباره تلاش کنید.','Registration service is temporarily unavailable. Try again in a few minutes.','Usluga registracije privremeno nije dostupna. Pokušajte ponovno za nekoliko minuta.');
 return L('ثبت‌نام انجام نشد. فیلدهای مشخص‌شده را بررسی کنید؛ اگر هیچ فیلدی قرمز نیست، چند لحظه بعد دوباره تلاش کنید.','Registration was not completed. Check the marked fields; if none are marked, try again in a moment.','Registracija nije dovršena. Provjerite označena polja; ako nijedno nije označeno, pokušajte ponovno.');
}
function successModal(account,status){
 document.querySelector('.nh7-registration-confirm-v351')?.remove();
 const pending=status!=='approved';
 const message=pending?(account?.confirmationRequired?L('درخواست کامل شما ثبت شد. اکنون ایمیل خود و Spam/Junk را بررسی و لینک تأیید حساب را باز کنید. سپس منتظر تأیید مدیر مدرسه بمانید.','Your complete request was submitted. Check your email and Spam/Junk, confirm the account, then wait for school administrator approval.','Vaš potpuni zahtjev je poslan. Provjerite e-mail i Spam/Junk, potvrdite račun i pričekajte odobrenje administratora.'):L('درخواست کامل شما ثبت شد و در انتظار بررسی مدیر مدرسه است.','Your complete request was submitted and is waiting for school administrator review.','Vaš potpuni zahtjev je poslan i čeka pregled administratora.')):L('ثبت‌نام شما قبلاً تأیید شده است و می‌توانید وارد مدرسه شوید.','Your registration is already approved and you can sign in to school.','Vaša registracija je već odobrena i možete se prijaviti u školu.');
 const modal=document.createElement('div');modal.className='nh7-registration-confirm-v351';modal.dir=language()==='fa'?'rtl':'ltr';modal.innerHTML=`<div><div class="nh7-v351-ok">✓</div><h2>${E(pending?L('درخواست کامل ثبت شد','Complete request submitted','Potpuni zahtjev je poslan'):L('دسترسی تأیید است','Access approved','Pristup odobren'))}</h2><p>${E(message)}</p><button type="button" class="primary-btn" data-v351-close>${E(L('باشه','OK','U redu'))}</button></div>`;document.body.appendChild(modal);modal.querySelector('[data-v351-close]').onclick=()=>{modal.remove();document.querySelector('[data-route="school"]')?.click()};
}

async function submitCanonical(button){
 if(busy||button?.dataset.submitting==='1')return;
 const checked=validate();if(!checked.ok)return;
 const {data,password}=checked;busy=true;
 const original=button.textContent;setButton(button,true,L('در حال بررسی و ثبت کامل…','Validating and submitting…','Provjera i slanje…'));setStatus(L('اطلاعات در حال اعتبارسنجی و ثبت امن است…','Your information is being validated and saved securely…','Podaci se provjeravaju i sigurno spremaju…'),'success');
 try{
   const account=await ensureAccount(data,password);
   const result=await submitRpc(data,account?.session?.access_token||session()?.access_token||'');
   const finalStatus=String(result?.status||'pending').toLowerCase(),fullName=(data.firstName+' '+data.lastName).trim();
   const local=Object.assign({},data,{status:finalStatus,cloudId:result?.registration_id||'',registration_id:result?.registration_id||'',submitted:true,registrationVersion:CANONICAL});
   localStorage.setItem('nh7_school_access',JSON.stringify(local));
   localStorage.setItem('nh7_manual_email',data.email);
   localStorage.setItem('nh7_user_profile',JSON.stringify({name:fullName,email:data.email,phone:data.phone||''}));
   localStorage.setItem('nh7_school_registration_once_'+hash(data.email),JSON.stringify({registration_id:result?.registration_id||'',status:finalStatus,version:CANONICAL,at:new Date().toISOString()}));
   localStorage.removeItem(LOGOUT);
   setStatus(L('درخواست کامل با موفقیت ثبت شد.','Complete request submitted successfully.','Potpuni zahtjev je uspješno poslan.'),'success');
   successModal(account,finalStatus);
   setButton(button,false,L('درخواست ثبت شد ✓','Request submitted ✓','Zahtjev je poslan ✓'));
 }catch(error){console.warn('[NH7 canonical registration]',error);const msg=friendly(error);setStatus(msg,'error');setButton(button,false,original||L('ثبت درخواست','Submit request','Pošalji zahtjev'))}
 finally{busy=false;if(button)button.dataset.submitting='0'}
}

function goCanonicalForm(){
 const school=document.querySelector('[data-route="school"]');
 if(school){school.click();setTimeout(()=>{const reg=[...document.querySelectorAll('[data-go="school"]')].find(x=>String(x.dataset.params||'').includes('"form"')||String(x.dataset.params||'').includes('form'));if(reg)reg.click();},120)}
}
function passwordChecklist(){
 const p=document.getElementById('reg_password');if(!p)return;
 p.minLength=10;p.autocomplete='new-password';
 document.getElementById('reg_confirmPassword')?.setAttribute('autocomplete','new-password');
 let box=document.getElementById('nh7PasswordRulesV351');
 if(!box){box=document.createElement('div');box.id='nh7PasswordRulesV351';box.className='nh7-password-rules-v351';const row=p.closest('.form-row')||p.parentElement;row?.insertAdjacentElement('afterend',box)}
 const r=passwordRules(p.value),item=(ok,text)=>`<span class="${ok?'ok':''}">${ok?'✓':'○'} ${E(text)}</span>`;
 box.innerHTML=item(r.length,L('حداقل ۱۰ کاراکتر','At least 10 characters','Najmanje 10 znakova'))+item(r.upper,L('حداقل یک حرف بزرگ A-Z','One uppercase A-Z','Jedno veliko slovo A-Z'))+item(r.lower,L('حداقل یک حرف کوچک a-z','One lowercase a-z','Jedno malo slovo a-z'))+item(r.digit,L('حداقل یک عدد','One number','Jedan broj'))+item(r.symbol,L('حداقل یک نشانه ! @ # …','One symbol ! @ # …','Jedan simbol ! @ # …'))+item(r.noSpace,L('بدون فاصله','No spaces','Bez razmaka'));
}
function decorateForm(){
 const email=document.getElementById('reg_email');
 if(email){email.autocomplete='email';email.inputMode='email';email.autocapitalize='none';email.spellcheck=false;email.setAttribute('aria-describedby','nh7EmailHintV351');if(!document.getElementById('nh7EmailHintV351')){const hint=document.createElement('small');hint.id='nh7EmailHintV351';hint.className='nh7-field-hint-v351';hint.textContent=L('ایمیل را دقیق بررسی کنید؛ آدرس‌های اشتباه مثل @gmil.com پذیرفته نمی‌شوند.','Check the email carefully; mistyped domains such as @gmil.com are blocked.','Pažljivo provjerite e-mail; pogrešne domene poput @gmil.com nisu dopuštene.');(email.closest('.form-row')||email.parentElement)?.appendChild(hint)}}
 const phone=document.getElementById('reg_phone');if(phone){phone.inputMode='tel';phone.autocomplete='tel'}
 const submit=document.querySelector('[data-submit-registration="school"]');if(submit)submit.dataset.nh7Canonical='351';
 passwordChecklist();
}
function patchAccount(){
 const email=document.getElementById('accountEmail'),sign=document.getElementById('signInBtn');if(!email||!sign||document.getElementById('nh7CanonicalRegisterV351'))return;
 const b=document.createElement('button');b.type='button';b.id='nh7CanonicalRegisterV351';b.className='secondary-btn wide-btn nh7-register-account-v351';b.textContent=L('ایجاد حساب / ثبت‌نام مدرسه','Create account / School registration','Izradi račun / Registracija za školu');b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();goCanonicalForm()},true);sign.insertAdjacentElement('afterend',b);
 const note=document.createElement('p');note.className='muted nh7-register-note-v351';note.textContent=L('ثبت‌نام حساب و مدرسه از یک فرم کامل و یکسان انجام می‌شود.','Account and school registration use the same complete form.','Račun i školska registracija koriste isti potpuni obrazac.');b.insertAdjacentElement('afterend',note);
}
function patch(){decorateForm();patchAccount()}
function schedulePatch(){clearTimeout(patchTimer);patchTimer=setTimeout(patch,25)}

function addStyle(){
 if(document.getElementById('nh7CanonicalRegistrationStyleV351'))return;
 const s=document.createElement('style');s.id='nh7CanonicalRegistrationStyleV351';s.textContent=`
.form-row.nh7-invalid-v351 input,.form-row.nh7-invalid-v351 select,.form-row.nh7-invalid-v351 textarea{border-color:#d92d20!important;box-shadow:0 0 0 3px rgba(217,45,32,.11)!important}
.nh7-field-error-v351{display:block;margin:6px 4px 0;color:#b42318;font-size:.82rem;font-weight:800;line-height:1.55}.nh7-field-hint-v351{display:block;margin:6px 4px 0;color:#52606d;font-size:.78rem;line-height:1.5}
.registration-submit-status.nh7-v351-error{color:#b42318!important;font-weight:800}.registration-submit-status.nh7-v351-success{color:#08783d!important;font-weight:800}
.nh7-password-rules-v351{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px 10px;margin:7px 2px 14px;padding:10px 12px;border:1px solid #d7e8e5;border-radius:13px;background:#f8fbfb;font-size:.76rem;line-height:1.45;color:#667085}.nh7-password-rules-v351 span.ok{color:#08783d;font-weight:800}
.nh7-register-account-v351{margin-top:9px}.nh7-register-note-v351{text-align:center;font-size:.8rem}
.nh7-registration-confirm-v351{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;padding:20px;background:rgba(8,27,43,.58);backdrop-filter:blur(7px)}.nh7-registration-confirm-v351>div{width:min(480px,100%);background:#fff;border-radius:24px;padding:24px;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.28)}.nh7-registration-confirm-v351 p{white-space:pre-line;line-height:1.8}.nh7-v351-ok{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;margin:0 auto 10px;background:#e8f8ef;color:#08783d;font-size:34px;font-weight:900}
@media(max-width:480px){.nh7-password-rules-v351{grid-template-columns:1fr}}
`;document.head.appendChild(s);
}

document.addEventListener('click',event=>{
 const button=event.target.closest?.('[data-submit-registration="school"]');if(!button)return;
 event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();submitCanonical(button);
},true);
document.addEventListener('input',event=>{
 const el=event.target;if(!el?.id?.startsWith('reg_'))return;
 clearField(el.id.replace(/^reg_/,''));
 if(el.id==='reg_password')passwordChecklist();
 if(el.id==='reg_email'&&el.value){const c=emailCheck(el.value);if(!c.ok&&c.suggestion)fieldError('email',c.message)}
},true);
document.addEventListener('change',event=>{if(event.target?.id?.startsWith('reg_'))clearField(event.target.id.replace(/^reg_/,''))},true);

addStyle();
const observer=new MutationObserver(schedulePatch);observer.observe(document.documentElement,{childList:true,subtree:true});
setInterval(patch,1800);setTimeout(patch,120);
window.NH7CanonicalRegistrationV351={VERSION,CANONICAL,goCanonicalForm,emailCheck,passwordRules,validate};
window.NH7_CANONICAL_REGISTRATION_VERSION=VERSION;
})();