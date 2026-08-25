/* New Hope 7 QA v3.8.1 — route current UI to the reviewed/secure backend paths. */
(()=>{'use strict';
if(window.__NH7_QA_BRIDGE_V381__)return;window.__NH7_QA_BRIDGE_V381__=true;
const SB='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const nativeFetch=window.fetch.bind(window);
const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return['fa','en','hr'].includes(v)?v:'en'};
function rawUrl(input){try{return typeof input==='string'?input:(input instanceof URL?input.href:input?.url||'')}catch(_){return''}}
function cloneInit(input,init={}){const h=new Headers(input instanceof Request?input.headers:undefined);new Headers(init?.headers||{}).forEach((v,k)=>h.set(k,v));return Object.assign({},init,{headers:h})}
function parseBody(init={}){try{return typeof init.body==='string'?JSON.parse(init.body):init.body||{}}catch(_){return{}}}
function replaceRpc(url,name){return url.replace(/\/rest\/v1\/rpc\/[^?]+/,`/rest/v1/rpc/${name}`)}
async function recoveryAllowed(email){
  const r=await nativeFetch(`${SB}/rest/v1/rpc/nh7_recovery_eligibility_v380`,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({p_email:String(email||'').trim().toLowerCase()}),cache:'no-store'});
  if(!r.ok)return false;const x=await r.json().catch(()=>({}));return x?.allowed===true;
}
window.fetch=async function nh7QaBridgeFetch(input,init={}){
  const raw=rawUrl(input);let url;try{url=new URL(raw,location.href)}catch(_){return nativeFetch(input,init)}
  const path=url.pathname;
  let target='',bodyMapper=null;
  if(path.endsWith('/rest/v1/rpc/nh7_library_catalog_v341'))target='nh7_library_catalog_v372';
  else if(/\/rest\/v1\/rpc\/nh7_library_reader_access_v(?:250|260|321)$/.test(path)){
    target='nh7_library_reader_access_v372';bodyMapper=b=>({p_item_id:b.p_item_id,p_language:b.p_language||lang(),p_device_id:b.p_device_id||'',p_user_email:b.p_user_email||''});
  }
  else if(path.endsWith('/rest/v1/rpc/nh7_submit_school_assignment'))target='nh7_submit_school_assignment_v381';
  else if(path.endsWith('/rest/v1/rpc/nh7_school_exam_session_v340'))target='nh7_school_exam_session_v381';
  else if(path.endsWith('/rest/v1/rpc/nh7_submit_school_exam_v340'))target='nh7_submit_school_exam_v381';
  else if(path.endsWith('/rest/v1/rpc/nh7_school_gate_status_v373'))target='nh7_school_gate_status_v381';
  if(target){
    const next=cloneInit(input,init),b=parseBody(init);next.body=JSON.stringify(bodyMapper?bodyMapper(b):b);next.cache='no-store';
    return nativeFetch(replaceRpc(url.href,target),next);
  }
  if(url.origin===SB&&path.endsWith('/auth/v1/recover')&&String(init?.method||'POST').toUpperCase()==='POST'){
    const b=parseBody(init),redirect=url.searchParams.get('redirect_to')||'';
    if(!/admin-reset-password\.html/i.test(redirect)){
      const email=String(b?.email||'').trim().toLowerCase();
      const ok=await recoveryAllowed(email).catch(()=>false);
      if(!ok){
        const msg=lang()==='fa'?'بازیابی رمز فقط برای حسابی فعال است که ثبت‌نام آن کامل و توسط ادمین تأیید شده باشد.':lang()==='hr'?'Obnova lozinke dostupna je samo za potpuno registriran i odobren račun.':'Password recovery is available only for a fully registered and admin-approved account.';
        return new Response(JSON.stringify({code:'recovery_not_eligible',message:msg}),{status:403,headers:{'Content-Type':'application/json'}});
      }
    }
  }
  return nativeFetch(input,init);
};
window.NH7_QA_BRIDGE_VERSION='3.8.1';
})();
