/* New Hope 7 Final QA R3 v3.9.0 — bridge the approved RC UI to current secure backends. */
(()=>{'use strict';
if(window.__NH7_QA_BRIDGE_V390__)return;window.__NH7_QA_BRIDGE_V390__=true;
const SB='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const nativeFetch=window.fetch.bind(window),audioTotals=new Map();
const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return['fa','en','hr'].includes(v)?v:'en'};
function rawUrl(input){try{return typeof input==='string'?input:(input instanceof URL?input.href:input?.url||'')}catch(_){return''}}
function cloneInit(input,init={}){const h=new Headers(input instanceof Request?input.headers:undefined);new Headers(init?.headers||{}).forEach((v,k)=>h.set(k,v));return Object.assign({},init,{headers:h})}
function parseBody(init={}){try{return typeof init.body==='string'?JSON.parse(init.body):init.body||{}}catch(_){return{}}}
function replaceRpc(url,name){return url.replace(/\/rest\/v1\/rpc\/[^?]+/,`/rest/v1/rpc/${name}`)}
function authHeaders(input,init={}){const h=new Headers(input instanceof Request?input.headers:undefined);new Headers(init?.headers||{}).forEach((v,k)=>h.set(k,v));h.set('apikey',KEY);h.set('Content-Type','application/json');return h}
async function recoveryAllowed(email){const r=await nativeFetch(`${SB}/rest/v1/rpc/nh7_recovery_eligibility_v380`,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({p_email:String(email||'').trim().toLowerCase()}),cache:'no-store'});if(!r.ok)return false;const x=await r.json().catch(()=>({}));return x?.allowed===true}
async function mirrorSchoolAudio(input,init,body){
  if(String(body?.p_media_type||'')!=='school'||!body?.p_media_id)return;
  const lesson=String(body.p_media_id),total=Math.max(0,Number(body.p_delta_seconds||0)),prev=audioTotals.get(lesson)||0,delta=Math.max(0,Math.min(20,Math.round(total-prev)));audioTotals.set(lesson,Math.max(prev,total));
  const ended=/ended|complete|completed|finish/i.test(String(body.p_event||''));
  const payload={p_lesson_code:lesson,p_position_seconds:Math.max(0,Math.round(Number(body.p_position_seconds||0))),p_duration_seconds:Math.max(0,Math.round(Number(body.p_duration_seconds||0))),p_delta_seconds:delta,p_ended:ended};
  nativeFetch(`${SB}/rest/v1/rpc/nh7_school_record_audio_v380`,{method:'POST',headers:authHeaders(input,init),body:JSON.stringify(payload),cache:'no-store'}).catch(e=>console.warn('[NH7 R3 audio mirror]',e));
}
window.fetch=async function nh7QaBridgeFetch(input,init={}){
  const raw=rawUrl(input);let url;try{url=new URL(raw,location.href)}catch(_){return nativeFetch(input,init)}const path=url.pathname;
  let target='',bodyMapper=null;
  if(path.endsWith('/rest/v1/rpc/nh7_library_catalog_v341'))target='nh7_library_catalog_v372';
  else if(/\/rest\/v1\/rpc\/nh7_library_reader_access_v(?:250|260|321)$/.test(path)){target='nh7_library_reader_access_v372';bodyMapper=b=>({p_item_id:b.p_item_id,p_language:b.p_language||lang(),p_device_id:b.p_device_id||'',p_user_email:b.p_user_email||''});}
  else if(path.endsWith('/rest/v1/rpc/nh7_submit_school_assignment'))target='nh7_submit_school_assignment_v381';
  else if(path.endsWith('/rest/v1/rpc/nh7_school_exam_session_v340'))target='nh7_school_exam_session_v381';
  else if(path.endsWith('/rest/v1/rpc/nh7_submit_school_exam_v340'))target='nh7_submit_school_exam_v381';
  else if(path.endsWith('/rest/v1/rpc/nh7_school_gate_status_v373'))target='nh7_school_gate_status_v381';
  if(target){const next=cloneInit(input,init),body=parseBody(init);next.body=JSON.stringify(bodyMapper?bodyMapper(body):body);next.cache='no-store';return nativeFetch(replaceRpc(url.href,target),next)}
  if(/\/rest\/v1\/rpc\/nh7_track_audio_session_v22[12]$/.test(path)){const body=parseBody(init),res=await nativeFetch(input,init);mirrorSchoolAudio(input,init,body);return res}
  if(url.origin===SB&&path.endsWith('/auth/v1/recover')&&String(init?.method||'POST').toUpperCase()==='POST'){
    const body=parseBody(init),redirect=url.searchParams.get('redirect_to')||'';
    if(!/admin-reset-password\.html/i.test(redirect)){
      const email=String(body?.email||'').trim().toLowerCase(),ok=await recoveryAllowed(email).catch(()=>false);
      if(!ok){const message=lang()==='fa'?'بازیابی رمز فقط برای حسابی فعال است که ثبت‌نام آن کامل و توسط ادمین تأیید شده باشد.':lang()==='hr'?'Obnova lozinke dostupna je samo za potpuno registriran i odobren račun.':'Password recovery is available only for a fully registered and admin-approved account.';return new Response(JSON.stringify({code:'recovery_not_eligible',message}),{status:403,headers:{'Content-Type':'application/json'}})}
    }
  }
  return nativeFetch(input,init);
};
window.NH7_QA_BRIDGE_VERSION='3.9.0';
})();
