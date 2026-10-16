import {normalize} from './model.mjs';
/* Current v350 authority and exact credential fences; no backend is enabled by file presence. */
export const base='https://gpzcwffxnddhaeaogdyo.supabase.co',key='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
export const calls={capabilities:'nh7_document_capabilities_v2',list:'nh7_document_admin_list_v2',recipients:'nh7_document_recipient_search_v2',save:'nh7_document_save_draft_v2',prepare:'nh7_document_prepare_v2',issue:'nh7_document_issue_v2',expire:'nh7_document_expire_v2',revoke:'nh7_document_revoke_v2',deliver:'nh7_document_deliver_v2',template:'nh7_document_save_template_v2',templates:'nh7_document_templates_v2',verify:'nh7_document_verify_v2',archive:'nh7_my_documents_v2',libraryPrepare:'nh7_document_library_prepare_v2',libraryPublish:'nh7_document_library_publish_v2'};
export const metrics={requests:0,local_writes:0,stale:0};
export function session(admin=false){try{return admin?{access_token:localStorage.getItem('nh7_admin_token')||''}:JSON.parse(localStorage.getItem('nh7_user_session_v170')||'null')}catch{return null}}
export function identity(mode='admin'){
 if(mode==='public')return{uid:'public',jwt:'',mode};
 if(mode==='user'&&localStorage.getItem('nh7_explicit_logout')==='1')return{uid:'',jwt:'',mode};
 const s=session(mode==='admin'),jwt=String(s?.access_token||'');let c={};try{c=JSON.parse(atob(jwt.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))}catch{}
 const valid=jwt&&c.sub&&Number.isFinite(c.exp)&&c.exp*1000>Date.now()&&(mode==='admin'||s?.user?.id===c.sub);
 let companion='';if(mode==='admin'){const u=session();companion=[u?.user?.id||'',u?.access_token||'',localStorage.getItem('nh7_explicit_logout')||''].join('|')}return{uid:valid?c.sub:'',jwt:valid?jwt:'',mode,companion};
}
export const owner=()=>identity().uid;
export const current=i=>{const n=identity(i.mode);return n.uid===i.uid&&n.jwt===i.jwt&&n.companion===i.companion};
export function fence(i){if(!current(i)){metrics.stale++;throw Error('sessionChanged')}}
let proof=null;
export function ownerProven(){return proof?.access?.is_owner===true&&current(proof.identity)}
export async function authorize(){const i=identity();if(!i.uid)throw Error('adminLogin');const access=await rpc('nh7_admin_my_access_v350');fence(i);if(!access?.is_owner)throw Error('adminLogin');proof={identity:i,access};return access}
export async function rpc(name,payload={},mode='admin'){
 const i=identity(mode);if(!i.uid)throw Error(mode==='admin'?'adminLogin':'login');
 if(Object.values(calls).includes(name)&&globalThis.NH7_DOCUMENT_STUDIO_V2_BACKEND_READY!==true)throw Error('disabled');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);metrics.requests++;
 try{const r=await fetch(base+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:key,'Content-Type':'application/json',...(mode==='public'?{}:{Authorization:'Bearer '+i.jwt})},body:JSON.stringify(payload),signal:controller.signal,cache:'no-store'});fence(i);const value=await r.json().catch(()=>null);fence(i);if(!r.ok)throw Error(r.status===409||value?.code==='40001'?'conflict':r.status===403?'denied':'serviceError');return value}
 finally{clearTimeout(timer)}
}
export function localKey(documentId){if(!ownerProven())throw Error('adminLogin');return 'nh7_document_studio_v2:'+owner()+':'+documentId}
export function localDrafts(){if(!ownerProven())return[];const prefix='nh7_document_studio_v2:'+owner()+':',rows=[];for(let n=0;n<localStorage.length;n++){const k=localStorage.key(n);if(!k?.startsWith(prefix))continue;try{const d=JSON.parse(localStorage.getItem(k));if(d?.design_schema_version===2&&d.status==='draft')rows.push(normalize(d))}catch{}}return rows.slice(0,100)}
export function saveLocal(d,ticket=identity()){fence(ticket);const k=localKey(d.id),value=JSON.stringify(d);if(localStorage.getItem(k)!==value){localStorage.setItem(k,value);metrics.local_writes++}}
export async function aiDraft(language,field,text,translation=false){
 const i=identity();if(!ownerProven()||!['fa','en','hr'].includes(language)||!['title','body'].includes(field))throw Error('denied');
 // Current server action draft is an explicit generic brief only; no recipient fields.
 if(!translation&&globalThis.NH7_DOCUMENT_STUDIO_V2_BACKEND_READY!==true)throw Error('aiUnavailable');if(/@|[0-9a-f]{8}-[0-9a-f-]{27,}/i.test(text))throw Error('privateContent');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);metrics.requests++;
 try{const r=await fetch(base+'/functions/v1/nh7-admin-ai-v490',{method:'POST',headers:{Authorization:'Bearer '+i.jwt,'Content-Type':'application/json'},body:JSON.stringify(translation?{action:'translate',kind:'document',source_language:'en',text:String(text).slice(0,4000)}:{action:'draft_document',language,field,brief:String(text).slice(0,4000)}),signal:controller.signal,cache:'no-store'});fence(i);const data=await r.json();fence(i);if(!r.ok||!data.ok)throw Error('aiUnavailable');const value=translation?data.translations?.[language]:data.draft;if(!value)throw Error('aiUnavailable');return String(value).slice(0,8000)}finally{clearTimeout(timer)}
}
