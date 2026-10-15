/* Full-delete UI. Backend activation is separately reviewed; never fall back to partial/unknown purge. */
(()=>{'use strict';
if(window.__NH7_DELETE_ACCOUNT_V253__)return;window.__NH7_DELETE_ACCOUNT_V253__=true;
const SB='https://gpzcwffxnddhaeaogdyo.supabase.co',KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37',SESSION='nh7_user_session_v170';
let busy=false;
const lang=()=>localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
async function run(button){
 if(busy)return;const security=window.NH7SecurityWave65;
 if(!security||window.NH7_FULL_DELETE_WAVE65_ENABLED!==true){alert(security?.message('delete',lang())||L('حذف کامل حساب فعال نشده است.','Full account deletion is not activated.','Potpuno brisanje računa nije aktivirano.'));return;}
 const ticket=security.ticket();let session;try{const raw=JSON.parse(ticket.raw);session=raw?.currentSession||raw?.session||raw}catch{}
 const uid=session?.user?.id,email=String(session?.user?.email||'').trim().toLowerCase();if(!uid||!email||!session.access_token){alert(security.message('session',lang()));return;}
 if(!confirm(L('حذف دائمی و غیرقابل بازگشت حساب و داده‌های شخصی را درخواست می‌کنید؟','Request permanent, irreversible deletion of your account and personal data?','Tražiti trajno, nepovratno brisanje računa i osobnih podataka?')))return;
 if(String(prompt(L('ایمیل خود را وارد کنید:','Type your email:','Upišite svoj e-mail:'),'')||'').trim().toLowerCase()!==email)return;
 if(prompt(L('برای حذف دائمی DELETE بنویسید.','Type DELETE for permanent deletion.','Upišite DELETE za trajno brisanje.'),'')!=='DELETE')return;
 security.assert(ticket);busy=true;button.disabled=true;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
 try{
  // UUID and idempotency key remain fixed. No refresh/retry that can retarget a different account.
  const response=await fetch(SB+'/functions/v1/nh7-full-account-delete-wave65',{method:'POST',cache:'no-store',signal:controller.signal,headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({request_id:crypto.randomUUID(),target_user_id:uid,confirmation_email:email,confirmation_phrase:'DELETE'})});
  const result=await response.json();security.assert(ticket);
  if(!response.ok||result?.ok!==true||result?.stage!=='verified'||result?.target_user_id!==uid)throw Error('delete_not_verified');
  // Only the exact authenticated session is invalidated. Cached personal data is not blanket-cleared.
  localStorage.removeItem(SESSION);localStorage.setItem('nh7_explicit_logout','1');window.dispatchEvent(new Event('nh7-personal-before-owner-wave2'));
  alert(L('حذف حساب در سرور تأیید شد.','Server account deletion was verified.','Brisanje računa na poslužitelju je potvrđeno.'));location.reload();
 }catch(error){if(security.current(ticket))alert(security.message(error?.code==='session_changed'?'session':'failed',lang()));}
 finally{clearTimeout(timer);busy=false;button.disabled=false;}
}
window.NH7FullDeleteWave65=Object.freeze({run});
document.addEventListener('click',event=>{const button=event.target.closest?.('#nh7-v252-delete-account');if(!button)return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();run(button).catch(()=>{})},true);
window.NH7_DELETE_ACCOUNT_VERSION='wave6.5-review-gated';
})();
