/* New Hope 7 v4.0.2 — prevent repeated School registration while pending/approved. */
(()=>{'use strict';
if(window.__NH7_REGISTRATION_REPEAT_GUARD_V402__)return;
window.__NH7_REGISTRATION_REPEAT_GUARD_V402__=true;
const VERSION='4.0.2-registration-repeat-guard';
const SUPABASE='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION='nh7_user_session_v170';
const ACCESS='nh7_school_access';
let checking=false,lastCheck=0,lockInfo=null,timer=0;
const parse=(v,f=null)=>{try{return JSON.parse(v||'')??f}catch(_){return f}};
const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return ['fa','en','hr'].includes(v)?v:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
function deviceId(){let id=localStorage.getItem('nh7_device_id');if(!id){id='dev_'+(crypto.randomUUID?.()||Date.now()+'_'+Math.random().toString(36).slice(2));localStorage.setItem('nh7_device_id',id)}return id}
function session(){return parse(localStorage.getItem(SESSION),null)}
function localAccess(){return parse(localStorage.getItem(ACCESS),null)}
function currentEmail(){return String(session()?.user?.email||'').trim().toLowerCase()}
function formEmail(){return String(document.getElementById('reg_email')?.value||'').trim().toLowerCase()}
function lockable(status){return ['pending','approved'].includes(String(status||'').toLowerCase())}
function saveKnown(info,email=''){
  const old=localAccess()||{},status=String(info?.status||old.status||'pending').toLowerCase();
  const next=Object.assign({},old,{
    email:String(info?.email||email||old.email||'').trim().toLowerCase(),
    status,
    registration_id:info?.registration_id||old.registration_id||'',
    submitted:true,
    serverVerifiedAt:new Date().toISOString()
  });
  localStorage.setItem(ACCESS,JSON.stringify(next));
  return next;
}
async function serverStatus(email=''){
  const s=session(),headers={apikey:KEY,'Content-Type':'application/json','x-device-id':deviceId()};
  if(s?.access_token)headers.Authorization='Bearer '+s.access_token;
  const response=await fetch(SUPABASE+'/rest/v1/rpc/nh7_registration_status',{
    method:'POST',headers,cache:'no-store',
    body:JSON.stringify({p_type:'school',p_email:String(email||'').trim().toLowerCase(),p_device_id:deviceId()})
  });
  const text=await response.text();let data=null;try{data=text?JSON.parse(text):null}catch(_){}
  if(!response.ok)throw new Error(data?.message||text||('HTTP '+response.status));
  return Array.isArray(data)?data[0]||null:data;
}
function notice(){
  let n=document.getElementById('nh7RepeatRegistrationNoticeV402');
  if(n)return n;
  const button=document.querySelector('[data-submit-registration="school"]');if(!button)return null;
  n=document.createElement('div');n.id='nh7RepeatRegistrationNoticeV402';n.className='nh7-repeat-reg-notice-v402';
  button.parentElement?.insertBefore(n,button);
  return n;
}
function decorate(){
  const button=document.querySelector('[data-submit-registration="school"]');if(!button)return;
  if(!button.dataset.nh7OriginalLabelV402)button.dataset.nh7OriginalLabelV402=button.textContent||L('ثبت درخواست','Submit request','Pošalji zahtjev');
  const n=notice();
  if(lockInfo&&lockable(lockInfo.status)){
    button.disabled=true;button.dataset.nh7RepeatLockedV402='1';
    if(lockInfo.status==='approved'){
      button.textContent=L('قبلاً تأیید شده‌اید ✓','Already approved ✓','Već ste odobreni ✓');
      if(n)n.innerHTML='<strong>✅ '+L('ثبت‌نام شما قبلاً تأیید شده است.','Your registration is already approved.','Vaša registracija je već odobrena.')+'</strong><span>'+L('نیازی به ارسال درخواست تازه نیست.','There is no need to submit another request.','Nije potrebno slati novi zahtjev.')+'</span>';
    }else{
      button.textContent=L('در انتظار تأیید ادمین…','Waiting for admin approval…','Čeka odobrenje administratora…');
      if(n)n.innerHTML='<strong>⏳ '+L('درخواست شما قبلاً ثبت شده است.','Your request has already been submitted.','Vaš zahtjev je već poslan.')+'</strong><span>'+L('لطفاً منتظر بررسی ادمین بمانید؛ ارسال دوباره درخواست لازم نیست.','Please wait for admin review; you do not need to register again.','Pričekajte pregled administratora; nije potrebno ponovno se registrirati.')+'</span>';
    }
  }else{
    if(button.dataset.nh7RepeatLockedV402==='1'){
      button.dataset.nh7RepeatLockedV402='0';
      if(button.dataset.submitting!=='1')button.disabled=false;
      button.textContent=button.dataset.nh7OriginalLabelV402||L('ثبت درخواست','Submit request','Pošalji zahtjev');
    }
    if(n)n.remove();
  }
}
async function refresh(force=false){
  if(checking)return;
  const now=Date.now();if(!force&&now-lastCheck<7000){decorate();return}
  checking=true;lastCheck=now;
  const local=localAccess(),localStatus=String(local?.status||'').toLowerCase();
  if(lockable(localStatus))lockInfo={status:localStatus,email:local?.email||'',registration_id:local?.registration_id||''};
  decorate();
  try{
    const email=String(local?.email||currentEmail()||'').trim().toLowerCase();
    const info=await serverStatus(email);
    if(info?.found&&lockable(info.status)){
      const saved=saveKnown(info,email);lockInfo={status:saved.status,email:saved.email,registration_id:saved.registration_id};
    }else if(info?.found&&String(info.status||'').toLowerCase()==='rejected'){
      lockInfo=null;
      if(local&&localStatus==='pending')localStorage.setItem(ACCESS,JSON.stringify(Object.assign({},local,{status:'rejected',serverVerifiedAt:new Date().toISOString()})));
    }else if(info&&!info.found){
      if(localStatus==='pending'&&local?.serverVerifiedAt){
        localStorage.removeItem(ACCESS);lockInfo=null;
      }else if(!lockable(localStatus))lockInfo=null;
    }
  }catch(error){
    if(!lockable(localStatus))lockInfo=null;
    console.warn('[NH7 repeat registration guard]',error);
  }finally{checking=false;decorate()}
}
function schedule(force=false){clearTimeout(timer);timer=setTimeout(()=>refresh(force),force?40:180)}
document.addEventListener('input',e=>{if(e.target?.id==='reg_email')schedule(false)},true);
document.addEventListener('change',e=>{if(e.target?.id==='reg_email')schedule(false)},true);
new MutationObserver(()=>schedule(false)).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',()=>schedule(true));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(true)});
setInterval(()=>{if(document.querySelector('[data-submit-registration="school"]'))refresh(false)},5000);
const style=document.createElement('style');style.textContent=`
.nh7-repeat-reg-notice-v402{margin:10px 0 12px;padding:12px 14px;border:1px solid #bfe3dc;border-radius:15px;background:#effbf7;color:#173d38;line-height:1.65}
.nh7-repeat-reg-notice-v402 strong,.nh7-repeat-reg-notice-v402 span{display:block}.nh7-repeat-reg-notice-v402 span{margin-top:4px;color:#52606d;font-size:.84rem}
[data-submit-registration="school"][data-nh7-repeat-locked-v402="1"]{opacity:.68!important;cursor:not-allowed!important}
`;document.head.appendChild(style);
setTimeout(()=>refresh(true),180);
window.NH7_REGISTRATION_REPEAT_GUARD_VERSION=VERSION;
})();