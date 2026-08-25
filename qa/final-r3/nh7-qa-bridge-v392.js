/* New Hope 7 Final QA R3.2 v3.9.2 — fast content bridge.
 * - One premerged fresh Apocrypha asset instead of hundreds of overlay requests.
 * - One authenticated sermon catalogue RPC instead of two fragile RLS queries.
 * - Existing School assignment/exam/audio and recovery safeguards remain active.
 */
(()=>{'use strict';
if(window.__NH7_QA_BRIDGE_V392__)return;window.__NH7_QA_BRIDGE_V392__=true;
const SB='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION_KEY='nh7_user_session_v170';
const ASSET_BASE=String(window.NH7_QA_ASSET_BASE_V392||'https://raw.githack.com/Omideno7/new-hope7-app/qa/final-integration-20260825-r3/').replace(/\/?$/,'/');
const APO_MERGED=ASSET_BASE+'qa/final-r3/data/apocrypha-19-merged-v392.json?v=3920';
const nativeFetch=window.fetch.bind(window),audioTotals=new Map();
let sermonCache={key:'',promise:null,data:null};
const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return['fa','en','hr'].includes(v)?v:'en'};
function rawUrl(input){try{return typeof input==='string'?input:(input instanceof URL?input.href:input?.url||'')}catch(_){return''}}
function inputHeaders(input,init={}){const h=new Headers(input instanceof Request?input.headers:undefined);new Headers(init?.headers||{}).forEach((v,k)=>h.set(k,v));return h}
function cloneInit(input,init={}){return Object.assign({},init,{headers:inputHeaders(input,init)})}
function parseBody(init={}){try{return typeof init.body==='string'?JSON.parse(init.body):init.body||{}}catch(_){return{}}}
function replaceRpc(url,name){return url.replace(/\/rest\/v1\/rpc\/[^?]+/,`/rest/v1/rpc/${name}`)}
function authHeaders(input,init={}){const h=inputHeaders(input,init);h.set('apikey',KEY);h.set('Content-Type','application/json');return h}
function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}}
function bearer(input,init={}){const h=inputHeaders(input,init),raw=String(h.get('authorization')||'');if(/^Bearer\s+/i.test(raw))return raw;const token=String(session()?.access_token||'');return token?'Bearer '+token:''}
function jsonResponse(value,status=200){return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}
function sermonError(code,message,status=403){const e=new Error(message||code||'sermon_catalog_failed');e.code=code||'sermon_catalog_failed';e.status=status;return e}
function setSermonError(error){const detail={code:String(error?.code||'sermon_catalog_failed'),message:String(error?.message||error||''),status:Number(error?.status||0)};window.__NH7_SERMON_ARCHIVE_ERROR__=detail;window.__NH7_SERMON_ARCHIVE_FALLBACK_BLOCKED__={at:Date.now(),reason:detail.code};window.dispatchEvent(new CustomEvent('nh7:sermon-archive-error',{detail}))}
async function sermonCatalogue(input,init={}){
  const authorization=bearer(input,init),key=authorization;
  if(!authorization||authorization==='Bearer '+KEY)throw sermonError('login_required','Sign in is required',401);
  if(sermonCache.key===key&&sermonCache.data)return sermonCache.data;
  if(sermonCache.key===key&&sermonCache.promise)return sermonCache.promise;
  sermonCache={key,promise:null,data:null};
  sermonCache.promise=(async()=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort('sermon_timeout'),12000);
    try{
      const response=await nativeFetch(`${SB}/rest/v1/rpc/nh7_sermon_catalog_v392`,{method:'POST',headers:{apikey:KEY,Authorization:authorization,'Content-Type':'application/json'},body:'{}',cache:'no-store',signal:controller.signal});
      const text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch(_){data={message:text}}
      if(!response.ok)throw sermonError(data?.code||'sermon_catalog_http',data?.message||data?.error||text||response.statusText,response.status);
      if(Array.isArray(data))data=data[0]||{};
      if(data?.allowed!==true){const code=String(data?.code||'sermon_access_denied');throw sermonError(code,code,code==='login_required'?401:403)}
      data.categories=Array.isArray(data.categories)?data.categories:[];data.sermons=Array.isArray(data.sermons)?data.sermons:[];
      sermonCache.data=data;window.__NH7_SERMON_ARCHIVE_LIVE__={count:data.sermons.length,categories:data.categories.length,at:Date.now(),source:'nh7_sermon_catalog_v392'};delete window.__NH7_SERMON_ARCHIVE_ERROR__;delete window.__NH7_SERMON_ARCHIVE_FALLBACK_BLOCKED__;window.dispatchEvent(new CustomEvent('nh7:sermon-archive-live',{detail:window.__NH7_SERMON_ARCHIVE_LIVE__}));return data;
    }catch(error){if(error?.name==='AbortError')throw sermonError('sermon_timeout','The sermon archive took too long to respond',408);throw error}
    finally{clearTimeout(timer)}
  })().catch(error=>{sermonCache.promise=null;setSermonError(error);throw error});
  return sermonCache.promise;
}
async function recoveryAllowed(email){const r=await nativeFetch(`${SB}/rest/v1/rpc/nh7_recovery_eligibility_v380`,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({p_email:String(email||'').trim().toLowerCase()}),cache:'no-store'});if(!r.ok)return false;const x=await r.json().catch(()=>({}));return x?.allowed===true}
async function mirrorSchoolAudio(input,init,body){
  if(String(body?.p_media_type||'')!=='school'||!body?.p_media_id)return;
  const lesson=String(body.p_media_id),total=Math.max(0,Number(body.p_delta_seconds||0)),prev=audioTotals.get(lesson)||0,delta=Math.max(0,Math.min(20,Math.round(total-prev)));audioTotals.set(lesson,Math.max(prev,total));
  const ended=/ended|complete|completed|finish/i.test(String(body.p_event||''));
  const payload={p_lesson_code:lesson,p_position_seconds:Math.max(0,Math.round(Number(body.p_position_seconds||0))),p_duration_seconds:Math.max(0,Math.round(Number(body.p_duration_seconds||0))),p_delta_seconds:delta,p_ended:ended};
  nativeFetch(`${SB}/rest/v1/rpc/nh7_school_record_audio_v380`,{method:'POST',headers:authHeaders(input,init),body:JSON.stringify(payload),cache:'no-store'}).catch(e=>console.warn('[NH7 R3.2 audio mirror]',e));
}
window.fetch=async function nh7QaBridgeFetch(input,init={}){
  const raw=rawUrl(input);let url;try{url=new URL(raw,location.href)}catch(_){return nativeFetch(input,init)}const path=url.pathname;
  if(/\/data\/apocrypha\/runtime\/apocrypha-browser-19\.preview\.json$/.test(path))return nativeFetch(APO_MERGED,{cache:'force-cache'});
  if(path.endsWith('/rest/v1/sermon_categories')){
    try{const data=await sermonCatalogue(input,init);return jsonResponse(data.categories)}catch(error){return jsonResponse({code:error.code||'sermon_catalog_failed',message:error.message||String(error)},Number(error.status||403))}
  }
  if(path.endsWith('/rest/v1/sermons')){
    try{const data=await sermonCatalogue(input,init);return jsonResponse(data.sermons)}catch(error){return jsonResponse({code:error.code||'sermon_catalog_failed',message:error.message||String(error)},Number(error.status||403))}
  }
  if(/\/data\/audio\/messages\.json$/.test(path)){
    window.__NH7_SERMON_ARCHIVE_FALLBACK_BLOCKED__={at:Date.now(),reason:window.__NH7_SERMON_ARCHIVE_ERROR__?.code||'legacy_archive_disabled'};
    window.dispatchEvent(new CustomEvent('nh7:sermon-archive-error',{detail:window.__NH7_SERMON_ARCHIVE_ERROR__||{code:'legacy_archive_disabled'}}));
    return jsonResponse({categories:[]});
  }
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
      if(!ok){const message=lang()==='fa'?'بازیابی رمز فقط برای حسابی فعال است که ثبت‌نام آن کامل و توسط ادمین تأیید شده باشد.':lang()==='hr'?'Obnova lozinke dostupna je samo za potpuno registriran i odobren račun.':'Password recovery is available only for a fully registered and admin-approved account.';return jsonResponse({code:'recovery_not_eligible',message},403)}
    }
  }
  return nativeFetch(input,init);
};
window.addEventListener('storage',event=>{if(event.key===SESSION_KEY)sermonCache={key:'',promise:null,data:null}});
setTimeout(()=>{const s=session();if(s?.access_token)sermonCatalogue('',{headers:{Authorization:'Bearer '+s.access_token}}).catch(()=>{})},650);
window.NH7_QA_BRIDGE_VERSION='3.9.2';window.NH7_APOCRYPHA_MERGED_URL=APO_MERGED;
})();
