/* Separate from Reject/request deletion. Uses current Admin token/authority, never an email-only target. */
(()=>{'use strict';
let busy=false;const requestIds=new Map();
const language=()=>localStorage.getItem('nh7_admin_lang')||'en';
const L=(fa,en,hr)=>language()==='fa'?fa:language()==='hr'?hr:en;
function scan(){
 if(window.NH7_FULL_DELETE_WAVE65_ENABLED!==true)return;
 const authority=window.NH7AdminAuthorityWave3?.snapshot();if(!authority?.is_owner)return;
 document.querySelectorAll('button[onclick^="deleteRequest("]').forEach(requestDelete=>{
  if(requestDelete.parentElement.querySelector('[data-full-delete-wave65]'))return;
  const id=requestDelete.getAttribute('onclick').match(/deleteRequest\('([^']+)'\)/)?.[1],row=typeof state==='object'?state.registrations?.find(r=>String(r.id)===id):null;
  const uid=row?.user_id||row?.payload?.auth_user_id;if(!/^[0-9a-f-]{36}$/i.test(uid||''))return;
  const button=document.createElement('button');button.type='button';button.dataset.fullDeleteWave65=uid;button.className='danger-btn';button.textContent=L('حذف کامل حساب','Full account delete','Potpuno brisanje računa');requestDelete.insertAdjacentElement('afterend',button);
  button.onclick=async()=>{
   if(busy)return;const epoch=window.NH7AdminAuthorityWave3.snapshot().generation,access=typeof token==='string'?token:'',current=()=>!!access&&access===token&&epoch===window.NH7AdminAuthorityWave3.snapshot().generation;
   const email=String(row.payload?.email||row.email||'').trim().toLowerCase();if(!email)return;
   if(String(prompt(L('ایمیل هدف را وارد کنید:','Type target email:','Upišite e-mail ciljnog računa:'),'')||'').trim().toLowerCase()!==email||prompt('DELETE','')!=='DELETE'||!current())return;
   const requestId=requestIds.get(uid)||crypto.randomUUID();requestIds.set(uid,requestId);busy=true;button.disabled=true;
   try{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);let r;try{const response=await fetch(SUPABASE_URL+'/functions/v1/nh7-full-account-delete-wave65',{method:'POST',signal:controller.signal,cache:'no-store',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+access,'Content-Type':'application/json'},body:JSON.stringify({request_id:requestId,target_user_id:uid,confirmation_email:email,confirmation_phrase:'DELETE'})});r=await response.json();if(!response.ok)throw Error('delete_failed');}finally{clearTimeout(timer)}
    if(!current())return;if(r?.ok!==true||r?.stage!=='verified'||r?.target_user_id!==uid)throw Error('not_verified');
    await loadAll(true);
   }catch{if(current())alert(L('حذف کامل تأیید نشد. دوباره بررسی کنید.','Full deletion was not verified. Check again.','Potpuno brisanje nije potvrđeno. Provjerite ponovno.'));}finally{busy=false;button.disabled=false;}
  };
 });
}
new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});scan();
})();
