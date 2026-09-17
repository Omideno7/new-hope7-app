/* New Hope 7 — isolated preview safety v1.0.0
 * Read production data where required for realistic QA, but never persist application writes.
 */
(()=>{'use strict';
if(window.__NH7_PREVIEW_SAFETY_V100__)return;window.__NH7_PREVIEW_SAFETY_V100__=true;
window.NH7_PRIVATE_PREVIEW=true;
window.NH7_SCHOOL_RULES_PREVIEW=true;
const SB='https://gpzcwffxnddhaeaogdyo.supabase.co';
const originalFetch=window.fetch.bind(window);
const blocked=[];
const READ_RPC=new Set([
  'nh7_registration_access_v2','nh7_registration_status','nh7_get_my_school_snapshot_v2110','nh7_school_exam_session_v340',
  'nh7_get_meeting_settings','nh7_audio_social_state_v1',
  'nh7_library_catalog_v396','nh7_library_reader_access_v250','nh7_library_reader_access_v321',
  'nh7_my_questions_v220','nh7_public_answered_questions_v340','nh7_public_answered_questions_i18n_v341'
]);
function rpcName(u){const m=u.pathname.match(/^\/rest\/v1\/rpc\/([^/]+)$/);return m?m[1]:''}
function isReadRpc(name){return READ_RPC.has(name)||/^nh7_get_/i.test(name)||/(?:_status|_catalog|_session|_state)$/i.test(name)||/^nh7_public_/i.test(name)}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-NH7-Preview':'shadow'}})}
function record(u,method,reason){blocked.push({path:u.pathname,method,reason,at:new Date().toISOString()});if(blocked.length>200)blocked.shift();try{window.dispatchEvent(new CustomEvent('nh7-preview-write-blocked',{detail:{path:u.pathname,method,reason}}))}catch(_){}}
function shadowFor(name){
  if(name==='nh7_submit_school_assignment')return {ok:true,qa_shadow:true,status:'submitted'};
  if(name==='nh7_school_progress_save_v340')return {ok:true,qa_shadow:true};
  if(name==='nh7_submit_school_exam_v340')return {ok:true,qa_shadow:true,passed:false,score_percent:0};
  return {ok:true,qa_shadow:true,message:'Preview only — production was not modified.'};
}
window.fetch=async function(input,init={}){
  const raw=typeof input==='string'||input instanceof URL?String(input):input?.url;
  let u;try{u=new URL(raw,location.href)}catch(_){return originalFetch(input,init)}
  const method=String(init.method||(input instanceof Request?input.method:'GET')||'GET').toUpperCase();
  if(u.origin!==SB)return originalFetch(input,init);
  if(method==='GET'||method==='HEAD')return originalFetch(input,{...init,cache:'no-store'});
  if(method==='POST'&&u.pathname==='/auth/v1/token'&&['password','refresh_token'].includes(u.searchParams.get('grant_type')||''))return originalFetch(input,{...init,cache:'no-store'});
  if(method==='POST'&&/^\/storage\/v1\/object\/sign\//.test(u.pathname))return originalFetch(input,{...init,cache:'no-store'});
  if(method==='POST'&&u.pathname==='/functions/v1/nh7-school-media-access')return originalFetch(input,{...init,cache:'no-store'});
  const rpc=rpcName(u);
  if(method==='POST'&&rpc&&isReadRpc(rpc))return originalFetch(input,{...init,cache:'no-store'});
  record(u,method,rpc?'RPC_'+rpc:'PRODUCTION_WRITE_BLOCKED');
  return json(rpc?shadowFor(rpc):{ok:true,qa_shadow:true,message:'Preview only — production was not modified.'});
};
try{if(navigator.sendBeacon)Object.defineProperty(navigator,'sendBeacon',{configurable:true,value:(raw)=>{try{const u=new URL(String(raw),location.href);record(u,'POST','BEACON_BLOCKED')}catch(_){}return false}})}catch(_){}
try{if(navigator.serviceWorker){navigator.serviceWorker.register=()=>Promise.reject(new Error('NH7_PREVIEW_SERVICE_WORKER_DISABLED'))}}catch(_){}
window.NH7_PREVIEW_SAFETY={blocked:()=>blocked.slice(),readOnly:true,version:'1.0.0'};
document.addEventListener('DOMContentLoaded',()=>{
  const b=document.createElement('aside');b.id='nh7PreviewSafetyBanner';b.setAttribute('role','status');b.innerHTML='<strong>NEW HOPE 7 · SCHOOL RULES PREVIEW</strong><span>Real content may be read for testing. Changes stay on this device; Production writes are blocked.</span>';
  Object.assign(b.style,{position:'sticky',top:'0',zIndex:'2147483647',display:'flex',flexDirection:'column',gap:'2px',padding:'8px 12px',background:'#10284a',color:'#fff',font:'700 12px/1.35 system-ui',textAlign:'center'});
  document.body.prepend(b);
});
})();
