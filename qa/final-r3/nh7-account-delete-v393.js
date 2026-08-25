/* New Hope 7 Final QA R3.3 v3.9.3 — secure self-service account deletion.
 * The user must re-enter the current password, type the account email and DELETE.
 * Backend deletion removes Auth and linked New Hope 7 data in one transaction.
 */
(()=>{'use strict';
if(window.__NH7_ACCOUNT_DELETE_V393__)return;
window.__NH7_ACCOUNT_DELETE_V393__=true;

const SUPABASE='https://gpzcwffxnddhaeaogdyo.supabase.co';
const APIKEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION_KEY='nh7_user_session_v170';
let modal=null,mountTimer=0;

const lang=()=>{const value=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return ['fa','en','hr'].includes(value)?value:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const E=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}}
function accountEmail(){return String(session()?.user?.email||'').trim().toLowerCase()}
function accountId(){return String(session()?.user?.id||'')}
function close(){modal?.remove();modal=null;document.body.classList.remove('nh7-account-delete-open-v393')}
function message(error){
  const raw=String(error?.message||error||'').toLowerCase();
  if(raw.includes('invalid login credentials')||raw.includes('invalid_credentials'))return L('رمز عبور درست نیست.','The password is incorrect.','Lozinka nije točna.');
  if(raw.includes('owner account')||raw.includes('admin accounts'))return L('حساب ادمین یا مالک را نمی‌توان از داخل اپ حذف کرد.','An administrator or owner account cannot be deleted inside the user app.','Administratorski ili vlasnički račun ne može se izbrisati iz korisničke aplikacije.');
  if(raw.includes('confirmation email'))return L('ایمیل تأیید با ایمیل حساب یکسان نیست.','The confirmation email does not match the account.','E-mail potvrde ne odgovara računu.');
  if(raw.includes('type delete'))return L('برای تأیید، کلمه DELETE را دقیق وارد کنید.','Type DELETE exactly to confirm.','Za potvrdu upišite točno DELETE.');
  if(raw.includes('sign in')||raw.includes('jwt')||raw.includes('session'))return L('جلسه ورود معتبر نیست. دوباره وارد حساب شوید.','Your sign-in session is not valid. Sign in again.','Sesija prijave nije valjana. Ponovno se prijavite.');
  return String(error?.message||error||L('حذف حساب انجام نشد.','Account deletion failed.','Brisanje računa nije uspjelo.'));
}
function modalHtml(email){return `<div class="nh7-account-delete-backdrop-v393" role="presentation"><section class="nh7-account-delete-dialog-v393" role="dialog" aria-modal="true" aria-labelledby="nh7DeleteTitle393"><header><div><h2 id="nh7DeleteTitle393">⚠️ ${E(L('حذف کامل حساب','Permanently delete account','Trajno izbriši račun'))}</h2><p>${E(L('این عمل قابل بازگشت نیست.','This action cannot be undone.','Ova radnja se ne može poništiti.'))}</p></div><button type="button" class="icon-btn" data-v393-close aria-label="${E(L('بستن','Close','Zatvori'))}">×</button></header><div class="nh7-delete-warning-v393"><strong>${E(L('با حذف حساب، موارد زیر نیز پاک می‌شوند:','Deleting the account also removes:','Brisanjem računa uklanja se i:'))}</strong><ul><li>${E(L('ثبت‌نام و وضعیت مدرسه','School registration and status','Registracija i status škole'))}</li><li>${E(L('پیشرفت درس‌ها، تکالیف، امتحان‌ها و مدارک','Lesson progress, assignments, exams and certificates','Napredak lekcija, zadaci, ispiti i potvrde'))}</li><li>${E(L('آیات ذخیره‌شده، یادداشت‌ها و پیشرفت پلن‌ها','Saved verses, notes and plan progress','Spremljeni redci, bilješke i napredak planova'))}</li><li>${E(L('پیام‌ها و دسترسی‌های اختصاصی محتوا و ویدیو','Messages and personal content/video access','Poruke i osobni pristupi sadržaju/videozapisima'))}</li></ul></div><label>${E(L('ایمیل حساب','Account email','E-mail računa'))}<input type="email" value="${E(email)}" readonly></label><label>${E(L('رمز عبور فعلی','Current password','Trenutna lozinka'))}<div class="nh7-delete-password-v393"><input id="nh7DeletePassword393" type="password" autocomplete="current-password" placeholder="${E(L('رمز عبور را وارد کنید','Enter your password','Unesite lozinku'))}"><button type="button" data-v393-eye aria-label="${E(L('نمایش رمز','Show password','Prikaži lozinku'))}">👁</button></div></label><label>${E(L('برای تأیید، ایمیل بالا را دوباره بنویسید','Retype the email above to confirm','Ponovno upišite gornji e-mail za potvrdu'))}<input id="nh7DeleteEmail393" type="email" inputmode="email" autocomplete="off" spellcheck="false"></label><label>${E(L('کلمه DELETE را دقیق وارد کنید','Type DELETE exactly','Upišite točno DELETE'))}<input id="nh7DeletePhrase393" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="DELETE"></label><label class="nh7-delete-check-v393"><input id="nh7DeleteUnderstand393" type="checkbox"><span>${E(L('می‌دانم که حساب و اطلاعات من برای همیشه حذف می‌شود.','I understand that my account and data will be permanently deleted.','Razumijem da će moj račun i podaci biti trajno izbrisani.'))}</span></label><div id="nh7DeleteStatus393" class="nh7-delete-status-v393" aria-live="polite"></div><div class="nh7-delete-actions-v393"><button type="button" class="secondary-btn" data-v393-close>${E(L('انصراف','Cancel','Odustani'))}</button><button type="button" class="danger-btn" id="nh7DeleteSubmit393">${E(L('حذف دائمی حساب','Permanently delete account','Trajno izbriši račun'))}</button></div></section></div>`}
function open(){
  const email=accountEmail();if(!email||!accountId()){alert(L('ابتدا وارد حساب کاربری شوید.','Sign in to your account first.','Najprije se prijavite u račun.'));return}
  close();modal=document.createElement('div');modal.className='nh7-account-delete-modal-v393';modal.innerHTML=modalHtml(email);document.body.appendChild(modal);document.body.classList.add('nh7-account-delete-open-v393');
  modal.querySelectorAll('[data-v393-close]').forEach(button=>button.addEventListener('click',close));
  modal.querySelector('[data-v393-eye]')?.addEventListener('click',event=>{const input=modal.querySelector('#nh7DeletePassword393');if(!input)return;input.type=input.type==='password'?'text':'password';event.currentTarget.textContent=input.type==='password'?'👁':'🙈'});
  modal.querySelector('#nh7DeleteSubmit393')?.addEventListener('click',submit);
  setTimeout(()=>modal?.querySelector('#nh7DeletePassword393')?.focus(),30);
}
async function reauthenticate(email,password){
  const response=await fetch(`${SUPABASE}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:APIKEY,'Content-Type':'application/json'},body:JSON.stringify({email,password}),cache:'no-store'});
  const text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch(_){data={message:text}}
  if(!response.ok||!data.access_token)throw new Error(data?.msg||data?.message||text||response.statusText);
  if(String(data?.user?.id||'')!==accountId()||String(data?.user?.email||'').trim().toLowerCase()!==email)throw new Error('Account identity mismatch');
  return data.access_token;
}
async function invokeDelete(access,email){
  const response=await fetch(`${SUPABASE}/rest/v1/rpc/nh7_delete_my_account_v393`,{method:'POST',headers:{apikey:APIKEY,Authorization:'Bearer '+access,'Content-Type':'application/json'},body:JSON.stringify({p_confirmation_email:email,p_confirmation_phrase:'DELETE'}),cache:'no-store'});
  const text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch(_){data={message:text}}
  if(!response.ok||data?.ok!==true)throw new Error(data?.message||data?.error||text||response.statusText);
  return data;
}
async function clearDeviceData(){
  const keepLang=localStorage.getItem('nh7_lang');
  const keys=[];for(let index=0;index<localStorage.length;index++){const key=localStorage.key(index);if(key?.startsWith('nh7_'))keys.push(key)}
  keys.forEach(key=>localStorage.removeItem(key));if(keepLang)localStorage.setItem('nh7_lang',keepLang);
  try{sessionStorage.clear()}catch(_){ }
  try{if('caches'in window){for(const key of await caches.keys())if(/nh7|new.?hope|omideno/i.test(key))await caches.delete(key)}}catch(_){ }
  try{if(indexedDB?.databases){for(const row of await indexedDB.databases())if(row?.name&&/nh7|new.?hope|omideno/i.test(row.name))indexedDB.deleteDatabase(row.name)}}catch(_){ }
  try{const filesystem=window.Capacitor?.Plugins?.Filesystem||window.Capacitor?.Filesystem;if(filesystem)await filesystem.rmdir({directory:'DATA',path:'offline_media',recursive:true})}catch(_){ }
}
async function submit(){
  if(!modal)return;const email=accountEmail(),password=String(modal.querySelector('#nh7DeletePassword393')?.value||''),typedEmail=String(modal.querySelector('#nh7DeleteEmail393')?.value||'').trim().toLowerCase(),phrase=String(modal.querySelector('#nh7DeletePhrase393')?.value||'').trim().toUpperCase(),understood=!!modal.querySelector('#nh7DeleteUnderstand393')?.checked,status=modal.querySelector('#nh7DeleteStatus393'),button=modal.querySelector('#nh7DeleteSubmit393');
  const fail=text=>{if(status){status.className='nh7-delete-status-v393 is-error';status.textContent=text}};
  if(!password){fail(L('رمز عبور فعلی را وارد کنید.','Enter your current password.','Unesite trenutnu lozinku.'));return}
  if(typedEmail!==email){fail(L('ایمیل تأیید با ایمیل حساب یکسان نیست.','The confirmation email does not match the account.','E-mail potvrde ne odgovara računu.'));return}
  if(phrase!=='DELETE'){fail(L('کلمه DELETE را دقیق وارد کنید.','Type DELETE exactly.','Upišite točno DELETE.'));return}
  if(!understood){fail(L('ابتدا تأیید کنید که حذف دائمی است.','Confirm that you understand the deletion is permanent.','Potvrdite da razumijete da je brisanje trajno.'));return}
  if(!confirm(L('آخرین تأیید: حساب و تمام اطلاعات مرتبط برای همیشه حذف شود؟','Final confirmation: permanently delete the account and all linked data?','Posljednja potvrda: trajno izbrisati račun i sve povezane podatke?')))return;
  button.disabled=true;button.textContent=L('در حال تأیید و حذف…','Verifying and deleting…','Provjera i brisanje…');if(status){status.className='nh7-delete-status-v393';status.textContent=L('ابتدا رمز عبور بررسی می‌شود…','Verifying your password first…','Najprije se provjerava lozinka…')}
  try{
    const access=await reauthenticate(email,password);if(status)status.textContent=L('رمز تأیید شد؛ اطلاعات حساب در حال حذف است…','Password verified; deleting account data…','Lozinka je potvrđena; podaci računa se brišu…');
    await invokeDelete(access,email);await clearDeviceData();
    alert(L('حساب و اطلاعات مرتبط با موفقیت حذف شد.','Your account and linked data were deleted successfully.','Vaš račun i povezani podaci uspješno su izbrisani.'));
    location.hash='';location.reload();
  }catch(error){console.error('[NH7 account deletion 3.9.3]',error);fail(message(error));button.disabled=false;button.textContent=L('حذف دائمی حساب','Permanently delete account','Trajno izbriši račun')}
}
function mount(){
  const logout=document.getElementById('logoutAccountBtn');if(!logout||document.querySelector('[data-v393-delete-zone]'))return;
  const current=session();if(!current?.access_token||!current?.user?.email)return;
  const zone=document.createElement('div');zone.dataset.v393DeleteZone='1';zone.className='nh7-delete-zone-v393';zone.innerHTML=`<h3>⚠️ ${E(L('حذف حساب','Delete account','Izbriši račun'))}</h3><p>${E(L('در صورت درخواست، می‌توانید حساب و تمام اطلاعات مرتبط را برای همیشه حذف کنید. این عمل قابل بازگشت نیست.','You may permanently delete your account and all linked data. This action cannot be undone.','Možete trajno izbrisati račun i sve povezane podatke. Ova radnja se ne može poništiti.'))}</p><button type="button" class="danger-btn" data-v393-open>${E(L('حذف کامل حساب','Permanently delete account','Trajno izbriši račun'))}</button>`;
  logout.insertAdjacentElement('afterend',zone);zone.querySelector('[data-v393-open]')?.addEventListener('click',open);
}
function style(){
  if(document.getElementById('nh7-account-delete-v393-style'))return;const sheet=document.createElement('style');sheet.id='nh7-account-delete-v393-style';sheet.textContent=`
  .nh7-delete-zone-v393{margin-top:18px;padding:15px;border:1px solid #f0b7b2;border-radius:16px;background:#fff6f5}.nh7-delete-zone-v393 h3{margin:0 0 7px;color:#a4251c}.nh7-delete-zone-v393 p{line-height:1.75;color:#6f3b37}.nh7-account-delete-open-v393{overflow:hidden}.nh7-account-delete-backdrop-v393{position:fixed;inset:0;z-index:2147483300;background:rgba(20,15,20,.68);backdrop-filter:blur(7px);padding:14px;overflow:auto;display:flex;align-items:flex-start;justify-content:center}.nh7-account-delete-dialog-v393{width:min(620px,100%);margin:auto;background:#fff;border-radius:22px;padding:18px;box-shadow:0 26px 100px rgba(0,0,0,.35);text-align:start}.nh7-account-delete-dialog-v393>header{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.nh7-account-delete-dialog-v393 h2{margin:0;color:#9d241c}.nh7-account-delete-dialog-v393 header p{margin:5px 0;color:#74524f}.nh7-account-delete-dialog-v393 label{display:grid;gap:6px;margin:12px 0;font-weight:800}.nh7-account-delete-dialog-v393 input[type="email"],.nh7-account-delete-dialog-v393 input[type="password"],.nh7-account-delete-dialog-v393 input[type="text"]{width:100%;box-sizing:border-box;border:1px solid #d7dfe6;border-radius:11px;padding:11px;font:inherit}.nh7-delete-warning-v393{margin:13px 0;padding:12px;border-radius:13px;background:#fff1ef;border:1px solid #efc0ba;color:#6f302b}.nh7-delete-warning-v393 ul{margin:8px 0 0;padding-inline-start:22px;line-height:1.75}.nh7-delete-password-v393{display:grid;grid-template-columns:1fr auto;gap:6px}.nh7-delete-password-v393 button{border:1px solid #d7dfe6;border-radius:10px;background:#fff;min-width:45px}.nh7-delete-check-v393{display:flex!important;grid-template-columns:none!important;align-items:flex-start;gap:8px!important;font-weight:600!important;line-height:1.65}.nh7-delete-check-v393 input{margin-top:5px}.nh7-delete-status-v393{min-height:24px;margin:9px 0;line-height:1.6}.nh7-delete-status-v393.is-error{color:#a4251c;background:#fff1ef;border-radius:10px;padding:8px}.nh7-delete-actions-v393{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:12px}@media(max-width:620px){.nh7-account-delete-backdrop-v393{padding:7px}.nh7-account-delete-dialog-v393{padding:14px;border-radius:17px}.nh7-delete-actions-v393 button{flex:1}}
  `;document.head.appendChild(sheet)
}
style();
const observer=new MutationObserver(()=>{clearTimeout(mountTimer);mountTimer=setTimeout(mount,35)});observer.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&modal)close()},true);setTimeout(mount,350);
window.NH7_ACCOUNT_DELETE_VERSION='3.9.3';
})();
