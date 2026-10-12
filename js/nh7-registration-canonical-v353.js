/* New Hope 7 v3.5.3 — canonical-only guided school registration.
   Only the full School/Account form may create a school request. */
(()=>{'use strict';
if(window.__NH7_CANONICAL_REGISTRATION_V353__)return;
window.__NH7_CANONICAL_REGISTRATION_V353__=true;

const VERSION='3.5.3-canonical-only';
const CANONICAL='3.5.3';
const SUPABASE='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION='nh7_user_session_v170';
const LOGOUT='nh7_explicit_logout';
const CONFIRM_REDIRECT='https://omideno7.github.io/new-hope7-app/reset-password.html';
const REQUIRED=['firstName','lastName','birthDate','city','country','spiritualAge','churchMember','waterBaptism','salvationPrayer','eventsInterest','testimony','howFound','phone','email'];
const BOOL_FIELDS=['churchMember','waterBaptism','salvationPrayer','eventsInterest'];
const TYPO_DOMAINS={
 'gmil.com':'gmail.com','gmai.com':'gmail.com','gmal.com':'gmail.com','gmail.co':'gmail.com','gmail.con':'gmail.com','gmail.om':'gmail.com','gmail.cmo':'gmail.com','gmailcom':'gmail.com',
 'hotmial.com':'hotmail.com','hotmai.com':'hotmail.com','hotmail.con':'hotmail.com','hotmail.co':'hotmail.com','hotmailcom':'hotmail.com',
 'yaho.com':'yahoo.com','yahoo.con':'yahoo.com','yahoo.co':'yahoo.com','yahoocom':'yahoo.com',
 'outlok.com':'outlook.com','outloo.com':'outlook.com','outlook.con':'outlook.com','outlook.co':'outlook.com','outlookcom':'outlook.com'
};
const LABELS={
 fa:{firstName:'نام',lastName:'نام خانوادگی',birthDate:'تاریخ تولد',city:'شهر',country:'کشور',spiritualAge:'مدت زمان ایمان',churchMember:'عضویت کلیسا',churchName:'نام کلیسا',pastorName:'نام شبان',waterBaptism:'تعمید آب',salvationPrayer:'دعای نجات',eventsInterest:'علاقه‌مندی به سمینار/کنفرانس',testimony:'شهادت یا توضیح شما',howFound:'نحوه آشنایی با کلیسا',phone:'شماره تلفن',email:'ایمیل',password:'رمز عبور',confirmPassword:'تکرار رمز عبور'},
 en:{firstName:'First name',lastName:'Last name',birthDate:'Date of birth',city:'City',country:'Country',spiritualAge:'Spiritual age',churchMember:'Church membership',churchName:'Church name',pastorName:'Pastor name',waterBaptism:'Water baptism',salvationPrayer:'Salvation prayer',eventsInterest:'Seminar/conference interest',testimony:'Testimony',howFound:'How you found us',phone:'Phone number',email:'Email address',password:'Password',confirmPassword:'Confirm password'},
 hr:{firstName:'Ime',lastName:'Prezime',birthDate:'Datum rođenja',city:'Grad',country:'Država',spiritualAge:'Duhovna dob',churchMember:'Članstvo u crkvi',churchName:'Naziv crkve',pastorName:'Ime pastora',waterBaptism:'Krštenje u vodi',salvationPrayer:'Molitva spasenja',eventsInterest:'Interes za seminare/konferencije',testimony:'Svjedočanstvo',howFound:'Kako ste nas pronašli',phone:'Broj telefona',email:'E-mail',password:'Lozinka',confirmPassword:'Potvrda lozinke'}
};
let busy=false,patchTimer=0,lastCompletionCheck=0,completionChecking=false;
const originalFetch=window.fetch.bind(window);

function language(){const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return['fa','en','hr'].includes(v)?v:'en'}
function L(fa,en,hr){return language()==='fa'?fa:language()==='hr'?hr:en}
function E(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function label(id){return LABELS[language()]?.[id]||LABELS.en[id]||id}
function parse(v,f=null){try{return JSON.parse(v||'')??f}catch(_){return f}}
function session(){return parse(localStorage.getItem(SESSION),null)}
function currentEmail(){return String(session()?.user?.email||'').trim().toLowerCase()}
function deviceId(){let id=localStorage.getItem('nh7_device_id');if(!id){id='dev_'+(crypto.randomUUID?.()||Date.now()+'_'+Math.random().toString(36).slice(2));localStorage.setItem('nh7_device_id',id)}return id}
function read(id){return String(document.getElementById('reg_'+id)?.value||'').trim()}
function setStatus(message,type=''){const el=document.getElementById('registrationSubmitStatus');if(!el)return;el.textContent=message;el.classList.toggle('nh7-v353-error',type==='error');el.classList.toggle('nh7-v353-success',type==='success')}
function fieldError(id,message){const el=document.getElementById('reg_'+id);if(!el)return;const row=el.closest('.form-row')||el.parentElement;row?.classList.add('nh7-invalid-v353');let note=row?.querySelector('.nh7-field-error-v353');if(!note){note=document.createElement('small');note.className='nh7-field-error-v353';row?.appendChild(note)}note.textContent=message}
function clearField(id){const el=document.getElementById('reg_'+id),row=el?.closest('.form-row')||el?.parentElement;row?.classList.remove('nh7-invalid-v353');row?.querySelector('.nh7-field-error-v353')?.remove()}
function clearErrors(){document.querySelectorAll('.nh7-invalid-v353').forEach(x=>x.classList.remove('nh7-invalid-v353'));document.querySelectorAll('.nh7-field-error-v353').forEach(x=>x.remove());setStatus('')}
function focusField(id){const el=document.getElementById('reg_'+id);if(!el)return;try{el.focus({preventScroll:true})}catch(_){el.focus()}setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'center'}),40)}
function setButton(button,on,text=''){if(!button)return;button.disabled=!!on;button.dataset.submitting=on?'1':'0';button.classList.toggle('is-busy',!!on);if(text)button.textContent=text}

function emailCheck(raw){
 const email=String(raw||'').trim().toLowerCase();
 if(!email)return{ok:false,email,message:L('آدرس ایمیل را وارد کنید.','Enter your email address.','Unesite e-mail adresu.')};
 if(/\s/.test(email)||email.split('@').length!==2)return{ok:false,email,message:L('ایمیل باید بدون فاصله و دارای یک @ باشد.','Email must contain no spaces and exactly one @ sign.','E-mail ne smije sadržavati razmake i mora imati jedan znak @.')};
 const [local,domain]=email.split('@');
 const typo=TYPO_DOMAINS[domain];
 if(typo)return{ok:false,email,suggestion:local+'@'+typo,message:L(`این آدرس احتمالاً اشتباه است. آیا منظورتان ${local+'@'+typo} است؟`,`This address looks mistyped. Did you mean ${local+'@'+typo}?`,`Adresa izgleda pogrešno. Jeste li mislili ${local+'@'+typo}?`)};
 if(!local||!domain||local.startsWith('.')||local.endsWith('.')||local.includes('..')||domain.includes('..')||!domain.includes('.')||!/[.][a-z]{2,24}$/i.test(domain)||!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)||!/^[a-z0-9.-]+$/i.test(domain)||domain.split('.').some(x=>!x||x.startsWith('-')||x.endsWith('-')))
   return{ok:false,email,message:L('آدرس ایمیل معتبر نیست. نمونه صحیح: name@gmail.com','This email address is not valid. Example: name@gmail.com','E-mail nije valjan. Primjer: name@gmail.com')};
 return{ok:true,email};
}
function passwordRules(p){const s=String(p||'');return{length:s.length>=10,upper:/[A-Z]/.test(s),lower:/[a-z]/.test(s),digit:/\d/.test(s),symbol:/[^A-Za-z0-9\s]/.test(s),noSpace:!(/\s/.test(s))}}
function passwordOk(p){return Object.values(passwordRules(p)).every(Boolean)}
function passwordMessage(){return L('رمز باید حداقل ۱۰ کاراکتر و شامل حرف بزرگ انگلیسی، حرف کوچک انگلیسی، عدد و یک نشانه مثل ! @ # باشد.','Password must be at least 10 characters and include uppercase, lowercase, a number and a symbol such as ! @ #.','Lozinka mora imati najmanje 10 znakova, veliko i malo slovo, broj i simbol poput ! @ #.')}
function packetComplete(packet,email=''){
 if(!packet||typeof packet!=='object')return false;
 if(REQUIRED.some(k=>!String(packet[k]||'').trim()))return false;
 if(String(packet.churchMember||'').toLowerCase()==='yes'&&(!String(packet.churchName||'').trim()||!String(packet.pastorName||'').trim()))return false;
 if(BOOL_FIELDS.some(k=>!['yes','no'].includes(String(packet[k]||'').toLowerCase())))return false;
 const ec=emailCheck(packet.email);if(!ec.ok)return false;
 if(email&&ec.email!==String(email).trim().toLowerCase())return false;
 const phone=String(packet.phone||'').replace(/\D/g,'');if(phone.length<8||phone.length>16)return false;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(packet.birthDate||'')))return false;
 return true;
}

/* Absolute client-side guard: no code path in the current app shell may create
   an Auth account unless it carries the complete canonical school packet. */
window.fetch=async function(input,init={}){
 try{
   const url=typeof input==='string'?input:(input instanceof URL?input.href:input?.url||'');
   const method=String(init?.method||(input instanceof Request?input.method:'GET')||'GET').toUpperCase();
   if(method==='POST'&&String(url).startsWith(SUPABASE+'/auth/v1/signup')){
     let body=null;try{body=typeof init?.body==='string'?JSON.parse(init.body):init?.body}catch(_){}
     const email=String(body?.email||'').trim().toLowerCase();
     if(body?.data?.nh7_registration_version!==CANONICAL||!packetComplete(body?.data?.school_registration,email)){
       return new Response(JSON.stringify({code:'canonical_registration_required',message:'Use the complete New Hope 7 school registration form.'}),{status:422,statusText:'Unprocessable Entity',headers:{'Content-Type':'application/json'}});
     }
   }
 }catch(error){console.warn('[NH7 v353 signup guard]',error)}
 return originalFetch(input,init);
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
function isInvalidCredentials(error){const c=String(error?.code||'').toLowerCase(),m=String(error?.message||'').toLowerCase();return c==='invalid_credentials'||m.includes('invalid login credentials')||m.includes('invalid credentials')||m.includes('wrong password')}
async function resend(email){try{await request('/auth/v1/resend?redirect_to='+encodeURIComponent(CONFIRM_REDIRECT),{body:{type:'signup',email},timeout:15000});return true}catch(_){return false}}
async function recover(email){try{await request('/auth/v1/recover?redirect_to='+encodeURIComponent(CONFIRM_REDIRECT),{body:{email},timeout:15000});return true}catch(_){return false}}
async function useExistingAccount(email,password){
 try{const signed=await request('/auth/v1/token?grant_type=password',{body:{email,password}});if(signed?.access_token){localStorage.setItem(SESSION,JSON.stringify(signed));localStorage.removeItem(LOGOUT);return{session:signed,confirmationRequired:false}}}
 catch(error){if(isUnconfirmed(error)){return{session:null,confirmationRequired:true,confirmationResent:await resend(email)}}if(!isInvalidCredentials(error))throw error}
 const sent=await recover(email);const e=new Error('existing_account_password');e.code='existing_account_password';e.passwordResetSent=sent;throw e;
}
async function ensureAccount(data,password){
 const email=data.email,current=session();
 if(current?.access_token&&currentEmail()===email)return{session:current,confirmationRequired:false};
 const metadata={full_name:(data.firstName+' '+data.lastName).trim(),language:language(),nh7_registration_version:CANONICAL,school_registration:Object.assign({},data,{email,registrationVersion:CANONICAL})};
 try{
   const created=await request('/auth/v1/signup?redirect_to='+encodeURIComponent(CONFIRM_REDIRECT),{body:{email,password,data:metadata}});
   if(created?.access_token){localStorage.setItem(SESSION,JSON.stringify(created));localStorage.removeItem(LOGOUT);return{session:created,confirmationRequired:false}}
   if(Array.isArray(created?.user?.identities)&&created.user.identities.length===0)return useExistingAccount(email,password);
   return{session:null,confirmationRequired:true};
 }catch(error){if(!isDuplicate(error))throw error;return useExistingAccount(email,password)}
}
async function submitRpc(data,token=''){
 const payload=Object.assign({},data,{status:'pending',kind:'school',device_id:deviceId(),registrationVersion:CANONICAL});
 const rows=await request('/rest/v1/rpc/nh7_submit_registration_v3',{token,body:{p_type:'school',p_email:data.email,p_device_id:deviceId(),p_language:language(),p_payload:payload}});
 return Array.isArray(rows)?rows[0]||{}:rows||{};
}

function validate(){
 clearErrors();const errors=[];const data={status:'pending',kind:'school',submittedAt:new Date().toISOString(),registrationVersion:CANONICAL};
 for(const id of REQUIRED){data[id]=read(id);if(!data[id])errors.push([id,L(`لطفاً «${label(id)}» را کامل کنید.`,`Please complete “${label(id)}”.`,`Ispunite polje „${label(id)}”.`)])}
 data.churchName=read('churchName');data.pastorName=read('pastorName');
 if(data.churchMember==='yes'){if(!data.churchName)errors.push(['churchName',L('نام کلیسا را وارد کنید.','Enter the church name.','Unesite naziv crkve.')]);if(!data.pastorName)errors.push(['pastorName',L('نام شبان را وارد کنید.','Enter the pastor name.','Unesite ime pastora.')])}
 if(data.birthDate){const d=new Date(data.birthDate+'T00:00:00');if(!/^\d{4}-\d{2}-\d{2}$/.test(data.birthDate)||Number.isNaN(d.getTime())||d>new Date())errors.push(['birthDate',L('تاریخ تولد معتبر و غیرآینده وارد کنید.','Enter a valid date of birth that is not in the future.','Unesite valjan datum rođenja koji nije u budućnosti.')])}
 if(data.phone){const digits=data.phone.replace(/\D/g,'');if(digits.length<8||digits.length>16||!/^\+?[0-9()\-\s]+$/.test(data.phone))errors.push(['phone',L('شماره تلفن معتبر را همراه با کد کشور وارد کنید.','Enter a valid phone number, preferably with country code.','Unesite valjan broj telefona, po mogućnosti s pozivnim brojem države.')])}
 if(data.email){const ec=emailCheck(data.email);data.email=ec.email;if(!ec.ok)errors.push(['email',ec.message])}
 for(const id of BOOL_FIELDS)if(data[id]&&!['yes','no'].includes(String(data[id]).toLowerCase()))errors.push([id,L('یکی از گزینه‌های بله یا خیر را انتخاب کنید.','Choose Yes or No.','Odaberite Da ili Ne.')]);
 const logged=currentEmail();if(logged&&data.email&&data.email!==logged)errors.push(['email',L('برای حسابی که اکنون وارد آن هستید باید از همان ایمیل استفاده کنید.','Use the same email as the account currently signed in.','Koristite isti e-mail kao račun na koji ste prijavljeni.')]);
 const password=String(document.getElementById('reg_password')?.value||''),confirm=String(document.getElementById('reg_confirmPassword')?.value||'');
 if(!logged){if(!password)errors.push(['password',L('رمز عبور را وارد کنید.','Enter a password.','Unesite lozinku.')]);else if(!passwordOk(password))errors.push(['password',passwordMessage()]);if(!confirm)errors.push(['confirmPassword',L('رمز عبور را دوباره وارد کنید.','Confirm your password.','Potvrdite lozinku.')]);else if(password!==confirm)errors.push(['confirmPassword',L('تکرار رمز با رمز اصلی یکسان نیست.','Password confirmation does not match.','Potvrda lozinke nije ista kao lozinka.')])}
 const seen=new Set();for(const [id,msg] of errors){if(seen.has(id))continue;seen.add(id);fieldError(id,msg)}
 if(errors.length){setStatus(errors[0][1],'error');focusField(errors[0][0]);return{ok:false}}
 return{ok:true,data,password};
}
function friendly(error){const code=String(error?.code||'').toLowerCase(),m=String(error?.message||''),status=Number(error?.status||0);if(code==='existing_account_password')return L('این ایمیل قبلاً حساب دارد. اگر رمز را به یاد ندارید، لینک بازیابی برایتان ارسال شد؛ بعد از ورود دوباره فرم کامل را ارسال کنید.','This email already has an account. If you do not remember the password, a reset link was sent; sign in and submit the full form.','Ovaj e-mail već ima račun. Ako se ne sjećate lozinke, poslana je poveznica za obnovu; prijavite se i pošaljite cijeli obrazac.');if(code==='canonical_registration_required')return L('ثبت‌نام از مسیر قدیمی متوقف شده است. لطفاً همین فرم کامل را پر کنید.','The old registration route is disabled. Please complete this full form.','Stari način registracije je onemogućen. Ispunite ovaj puni obrazac.');if(!navigator.onLine||code==='network_error')return L('اینترنت در دسترس نیست. اتصال را بررسی کنید.','No internet connection. Check your connection.','Nema internetske veze. Provjerite vezu.');if(code==='request_timeout')return L('پاسخ سرور طول کشید. چند لحظه بعد دوباره تلاش کنید.','The server took too long. Try again in a moment.','Poslužitelj predugo odgovara. Pokušajte ponovno.');const fm=m.match(/REG_(?:REQUIRED|OPTION_INVALID):([A-Za-z]+)/);if(fm){const id=fm[1];fieldError(id,L(`فیلد «${label(id)}» نیاز به اصلاح دارد.`,`The “${label(id)}” field needs correction.`,`Polje „${label(id)}” treba ispraviti.`));focusField(id);return L('یکی از فیلدهای فرم ناقص است.','One form field is incomplete.','Jedno polje obrasca nije potpuno.')}if(m.includes('REG_EMAIL_TYPO:'))return L('دامنه ایمیل اشتباه تایپ شده است. ایمیل را اصلاح کنید.','The email domain is mistyped. Correct the email.','Domena e-maila je pogrešno upisana. Ispravite e-mail.');if(m.includes('REG_EMAIL'))return L('آدرس ایمیل معتبر نیست.','The email address is invalid.','E-mail nije valjan.');if(m.includes('REG_PHONE'))return L('شماره تلفن معتبر نیست.','The phone number is invalid.','Broj telefona nije valjan.');if(m.includes('REG_BIRTHDATE'))return L('تاریخ تولد معتبر نیست.','The date of birth is invalid.','Datum rođenja nije valjan.');if(status>=500)return L('سرویس ثبت‌نام موقتاً در دسترس نیست.','Registration service is temporarily unavailable.','Usluga registracije privremeno nije dostupna.');return L('ثبت‌نام انجام نشد. فیلدهای مشخص‌شده را بررسی کنید.','Registration was not completed. Check the highlighted fields.','Registracija nije dovršena. Provjerite označena polja.')}
function successModal(account,status){document.querySelector('.nh7-registration-confirm-v353')?.remove();const modal=document.createElement('div');modal.className='nh7-registration-confirm-v353';modal.dir=language()==='fa'?'rtl':'ltr';modal.innerHTML=`<div><div class="nh7-v353-ok">✓</div><h2>${E(L('درخواست کامل ثبت شد','Complete request submitted','Potpuni zahtjev je poslan'))}</h2><p>${E(account?.confirmationRequired?L('اطلاعات کامل شما ثبت شد. ایمیل خود و Spam/Junk را بررسی و حساب را تأیید کنید؛ سپس منتظر تأیید مدیر مدرسه بمانید.','Your full information was submitted. Check your email and Spam/Junk, confirm the account, then wait for school approval.','Vaši potpuni podaci su poslani. Provjerite e-mail i Spam/Junk, potvrdite račun i pričekajte odobrenje škole.'):L('درخواست شما اکنون در پنل ادمین برای بررسی قرار دارد.','Your request is now in the admin panel for review.','Vaš zahtjev je sada u administratorskoj ploči na pregledu.'))}</p><button type="button" class="primary-btn" data-v353-close>${E(L('باشه','OK','U redu'))}</button></div>`;document.body.appendChild(modal);modal.querySelector('[data-v353-close]').onclick=()=>{modal.remove();document.querySelector('[data-route="school"]')?.click()}}
async function submitCanonical(button){if(busy||button?.dataset.submitting==='1')return;const checked=validate();if(!checked.ok)return;busy=true;const old=button.textContent;setButton(button,true,L('در حال بررسی و ارسال…','Validating and submitting…','Provjera i slanje…'));try{const account=await ensureAccount(checked.data,checked.password);const result=await submitRpc(checked.data,account?.session?.access_token||session()?.access_token||'');const finalStatus=String(result?.status||'pending').toLowerCase();if(!['pending','approved'].includes(finalStatus))throw new Error('REG_STATUS_INVALID');localStorage.setItem('nh7_school_access',JSON.stringify(Object.assign({},checked.data,{status:finalStatus,registration_id:result?.registration_id||'',submitted:true,registrationVersion:CANONICAL})));localStorage.setItem('nh7_manual_email',checked.data.email);localStorage.setItem('nh7_user_profile',JSON.stringify({name:(checked.data.firstName+' '+checked.data.lastName).trim(),email:checked.data.email,phone:checked.data.phone||''}));setStatus(L('درخواست کامل با موفقیت ثبت شد.','Complete request submitted successfully.','Potpuni zahtjev je uspješno poslan.'),'success');successModal(account,finalStatus);setButton(button,false,L('درخواست ثبت شد ✓','Request submitted ✓','Zahtjev je poslan ✓'))}catch(error){console.warn('[NH7 v353 registration]',error);setStatus(friendly(error),'error');setButton(button,false,old||L('ثبت درخواست','Submit request','Pošalji zahtjev'))}finally{busy=false;if(button)button.dataset.submitting='0'}}

function goCanonicalForm(){const school=document.querySelector('[data-route="school"]');school?.click();setTimeout(()=>{const reg=[...document.querySelectorAll('[data-go="school"]')].find(x=>String(x.dataset.params||'').includes('form'));reg?.click();setTimeout(decorateForm,80)},120)}
function instructionCard(){if(document.getElementById('nh7RegGuideV353')||!document.getElementById('reg_firstName'))return;const card=document.createElement('div');card.id='nh7RegGuideV353';card.className='nh7-reg-guide-v353';card.innerHTML=`<strong>✅ ${E(L('ثبت‌نام صحیح مدرسه','Correct school registration','Ispravna registracija za školu'))}</strong><p>${E(L('همه فیلدهای این فرم را کامل کنید. اگر ایمیل، شماره تلفن یا هر فیلدی اشتباه باشد، همان‌جا به شما گفته می‌شود چه چیزی را اصلاح کنید. تا فرم کامل و معتبر نباشد هیچ درخواستی برای مدیر ارسال نمی‌شود.','Complete every field in this form. If the email, phone or another field is wrong, the form will show exactly what to correct. Nothing is sent to the administrator until the form is complete and valid.','Ispunite sva polja. Ako je e-mail, telefon ili drugo polje pogrešno, obrazac će pokazati što treba ispraviti. Administrator ne dobiva ništa dok obrazac nije potpun i valjan.'))}</p>`;document.getElementById('reg_firstName').closest('.form-row')?.parentElement?.prepend(card)}
function passwordChecklist(){const p=document.getElementById('reg_password');if(!p)return;const logged=currentEmail();const row=p.closest('.form-row')||p.parentElement;const confirm=document.getElementById('reg_confirmPassword');if(logged){p.value='';p.disabled=true;p.placeholder=L('برای حساب واردشده نیاز نیست','Not required while signed in','Nije potrebno dok ste prijavljeni');if(confirm){confirm.value='';confirm.disabled=true;confirm.placeholder=p.placeholder}let note=document.getElementById('nh7SignedInRegNoteV353');if(!note){note=document.createElement('small');note.id='nh7SignedInRegNoteV353';note.className='nh7-field-hint-v353';note.textContent=L('شما وارد حساب خود هستید؛ نیازی به ساخت رمز تازه نیست.','You are signed in; no new password is required.','Prijavljeni ste; nova lozinka nije potrebna.');row?.appendChild(note)}return}p.disabled=false;if(confirm)confirm.disabled=false;p.minLength=10;p.autocomplete='new-password';let box=document.getElementById('nh7PasswordRulesV353');if(!box){box=document.createElement('div');box.id='nh7PasswordRulesV353';box.className='nh7-password-rules-v353';row?.insertAdjacentElement('afterend',box)}const r=passwordRules(p.value),item=(ok,text)=>`<span class="${ok?'ok':''}">${ok?'✓':'○'} ${E(text)}</span>`;box.innerHTML=item(r.length,L('حداقل ۱۰ کاراکتر','At least 10 characters','Najmanje 10 znakova'))+item(r.upper,L('یک حرف بزرگ A-Z','One uppercase A-Z','Jedno veliko A-Z'))+item(r.lower,L('یک حرف کوچک a-z','One lowercase a-z','Jedno malo a-z'))+item(r.digit,L('یک عدد','One number','Jedan broj'))+item(r.symbol,L('یک نشانه ! @ #','One symbol ! @ #','Jedan simbol ! @ #'))}
function decorateForm(){const email=document.getElementById('reg_email');if(!email)return;instructionCard();email.autocomplete='email';email.inputMode='email';email.autocapitalize='none';email.spellcheck=false;const logged=currentEmail();if(logged){email.value=logged;email.readOnly=true;email.classList.add('nh7-readonly-v353')}else{email.readOnly=false;email.classList.remove('nh7-readonly-v353')}const phone=document.getElementById('reg_phone');if(phone){phone.inputMode='tel';phone.autocomplete='tel'}const submit=document.querySelector('[data-submit-registration="school"]');if(submit){submit.dataset.nh7Canonical='353';submit.textContent=L('ارسال درخواست کامل','Submit complete request','Pošalji potpuni zahtjev')}passwordChecklist()}
function patchAccount(){const sign=document.getElementById('signInBtn');if(!sign||document.getElementById('nh7CanonicalRegisterV353'))return;const b=document.createElement('button');b.type='button';b.id='nh7CanonicalRegisterV353';b.className='secondary-btn wide-btn nh7-register-account-v353';b.textContent=L('ثبت‌نام مدرسه / تکمیل فرم','School registration / Complete form','Registracija škole / Dovrši obrazac');b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();goCanonicalForm()},true);sign.insertAdjacentElement('afterend',b);const note=document.createElement('p');note.className='muted nh7-register-note-v353';note.textContent=L('ثبت‌نام مدرسه فقط از فرم کامل رسمی انجام می‌شود.','School registration is accepted only through the official complete form.','Registracija škole prihvaća se samo kroz službeni potpuni obrazac.');b.insertAdjacentElement('afterend',note)}
async function checkSchoolCompletion(){if(completionChecking||Date.now()-lastCompletionCheck<12000||!currentEmail())return;const nav=document.querySelector('[data-route="school"]');if(!nav?.classList.contains('active'))return;completionChecking=true;lastCompletionCheck=Date.now();try{const rows=await request('/rest/v1/rpc/nh7_registration_status',{token:session()?.access_token||'',body:{p_type:'school',p_email:currentEmail(),p_device_id:deviceId()}});const info=Array.isArray(rows)?rows[0]:rows;if(info?.found)return;if(document.getElementById('nh7CompletionGuideV353'))return;const box=document.createElement('div');box.id='nh7CompletionGuideV353';box.className='nh7-completion-guide-v353';box.innerHTML=`<strong>⚠️ ${E(L('ثبت‌نام مدرسه هنوز کامل نشده است','School registration is not complete yet','Registracija škole još nije dovršena'))}</strong><p>${E(L('حساب شما وجود دارد، اما درخواست مدرسه ارسال نشده است. برای اینکه مدیر بتواند درخواست شما را ببیند، فرم کامل را تکمیل و ارسال کنید.','Your account exists, but no school request has been submitted. Complete and send the full form so the administrator can review it.','Vaš račun postoji, ali školski zahtjev nije poslan. Ispunite i pošaljite cijeli obrazac.'))}</p><button type="button" class="primary-btn">${E(L('تکمیل ثبت‌نام مدرسه','Complete school registration','Dovrši registraciju škole'))}</button>`;box.querySelector('button').onclick=goCanonicalForm;(document.getElementById('view')||document.body).prepend(box)}catch(error){console.warn('[NH7 v353 completion check]',error)}finally{completionChecking=false}}
function patch(){decorateForm();patchAccount();checkSchoolCompletion()}
function schedule(){clearTimeout(patchTimer);patchTimer=setTimeout(patch,35)}
function addStyle(){if(document.getElementById('nh7CanonicalRegistrationStyleV353'))return;const s=document.createElement('style');s.id='nh7CanonicalRegistrationStyleV353';s.textContent=`.form-row.nh7-invalid-v353 input,.form-row.nh7-invalid-v353 select,.form-row.nh7-invalid-v353 textarea{border-color:#d92d20!important;box-shadow:0 0 0 3px rgba(217,45,32,.11)!important}.nh7-field-error-v353{display:block;margin:6px 4px 0;color:#b42318;font-size:.82rem;font-weight:800;line-height:1.55}.nh7-field-hint-v353{display:block;margin:6px 4px 0;color:#52606d;font-size:.78rem;line-height:1.5}.registration-submit-status.nh7-v353-error{color:#b42318!important;font-weight:800}.registration-submit-status.nh7-v353-success{color:#08783d!important;font-weight:800}.nh7-reg-guide-v353,.nh7-completion-guide-v353{margin:10px 0 16px;padding:14px 15px;border:1px solid #bfe3dc;border-radius:17px;background:#effbf7;color:#173d38;line-height:1.75}.nh7-reg-guide-v353 p,.nh7-completion-guide-v353 p{margin:6px 0 0;color:#4b635f}.nh7-completion-guide-v353 button{margin-top:10px}.nh7-password-rules-v353{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px 10px;margin:7px 2px 14px;padding:10px 12px;border:1px solid #d7e8e5;border-radius:13px;background:#f8fbfb;font-size:.76rem;color:#667085}.nh7-password-rules-v353 span.ok{color:#08783d;font-weight:800}.nh7-readonly-v353{background:#f3f7f7!important;color:#52606d!important}.nh7-registration-confirm-v353{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;padding:20px;background:rgba(8,27,43,.58);backdrop-filter:blur(7px)}.nh7-registration-confirm-v353>div{width:min(480px,100%);background:#fff;border-radius:24px;padding:24px;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.28)}.nh7-registration-confirm-v353 p{white-space:pre-line;line-height:1.8}.nh7-v353-ok{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;margin:0 auto 10px;background:#e8f8ef;color:#08783d;font-size:34px;font-weight:900}.nh7-register-note-v353{text-align:center;font-size:.8rem}@media(max-width:480px){.nh7-password-rules-v353{grid-template-columns:1fr}}`;document.head.appendChild(s)}

document.addEventListener('click',event=>{const button=event.target.closest?.('[data-submit-registration="school"]');if(!button)return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();submitCanonical(button)},true);
document.addEventListener('input',event=>{const el=event.target;if(!el?.id?.startsWith('reg_'))return;clearField(el.id.replace(/^reg_/,''));if(el.id==='reg_password')passwordChecklist();if(el.id==='reg_email'&&el.value){const c=emailCheck(el.value);if(!c.ok)fieldError('email',c.message)}},true);
document.addEventListener('change',event=>{if(event.target?.id?.startsWith('reg_'))clearField(event.target.id.replace(/^reg_/,''))},true);
addStyle();new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('pageshow',()=>setTimeout(patch,200));document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(patch,150)});setInterval(patch,1800);setTimeout(patch,120);
window.NH7CanonicalRegistrationV353={VERSION,CANONICAL,goCanonicalForm,emailCheck,passwordRules,validate};
window.NH7_CANONICAL_REGISTRATION_VERSION=VERSION;
})();