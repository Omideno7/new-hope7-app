/* New Hope 7 admin 4.3.9: keyed, non-destructive rendering and assignment drafts.
 * Does not authorize users, change backend data, or suppress dynamic updates.
 */
(()=>{'use strict';
if(window.NH7AdminUI)return;
const VERSION='4.3.9',PREFIX='nh7_admin_assignment_draft_v439:',TTL=86400000;
let lastContext='',renderCount=0,action=false,composing=false,pending=null,writeTimer,networkInstalled=false;
const dirty=new WeakSet(),memory=new Map(),readInflight=new Map(),saving=new Map();
const label=(fa,en,hr)=>{const l=document.documentElement.lang;return l==='fa'?fa:l==='hr'?hr:en};
function owner(){try{const raw=localStorage.getItem('nh7_admin_token');if(!raw)return'';const b=raw.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return String(JSON.parse(atob(b)).sub||'')}catch(_){return''}}
function fieldKey(el){const m=String(el?.id||'').match(/^(?:v311|as|nh7_[a-z]+)_(score|feedback)_([a-f\d-]{36})$/i);return m?{kind:m[1],id:m[2]}:null}
function storeKey(id){const uid=owner();return uid?PREFIX+uid+':'+id:''}
function readDraft(id){const key=storeKey(id);if(!key)return null;if(memory.has(key))return memory.get(key);try{const d=JSON.parse(sessionStorage.getItem(key)||'null');if(d&&Number.isFinite(d.at)&&Date.now()-d.at<TTL&&typeof d.values==='object'){memory.set(key,d);return d}sessionStorage.removeItem(key)}catch(_){}return null}
function persist(){clearTimeout(writeTimer);for(const [key,d] of memory){try{sessionStorage.setItem(key,JSON.stringify(d))}catch(_){/* Memory protection remains available when session storage is full. */}}}
function record(el){dirty.add(el);const k=fieldKey(el);if(!k)return;const key=storeKey(k.id);if(!key)return;const d=readDraft(k.id)||{at:Date.now(),values:{}};d.at=Date.now();d.values[k.kind]=el.value;memory.set(key,d);clearTimeout(writeTimer);writeTimer=setTimeout(persist,100)}
function acknowledge(id,values){const key=storeKey(id),d=readDraft(id);if(!key||!d)return;for(const [k,v] of Object.entries(values)){if(d.values[k]===String(v))delete d.values[k]}if(!Object.keys(d.values).length){memory.delete(key);try{sessionStorage.removeItem(key)}catch(_){}}else{d.at=Date.now();persist()}}
function clearPrivateDrafts(){memory.clear();readInflight.clear();saving.clear();clearTimeout(writeTimer);try{for(let i=sessionStorage.length-1;i>=0;i--){const k=sessionStorage.key(i);if(k?.startsWith(PREFIX))sessionStorage.removeItem(k)}}catch(_){}}
function restoreDraft(el){const k=fieldKey(el),d=k&&readDraft(k.id);if(d&&Object.prototype.hasOwnProperty.call(d.values,k.kind)){el.value=String(d.values[k.kind]);dirty.add(el)}}
function sameType(a,b){return !!a&&a.nodeType===b.nodeType&&(a.nodeType!==1||(a.nodeName===b.nodeName&&a.getAttribute('type')===b.getAttribute('type')))}
function syncAttrs(a,b,preserve){for(const x of Array.from(a.attributes)){if(preserve&&a.tagName==='DETAILS'&&x.name==='open')continue;if(!b.hasAttribute(x.name))a.removeAttribute(x.name)}for(const x of Array.from(b.attributes)){if(preserve&&a.tagName==='DETAILS'&&x.name==='open')continue;if(a.getAttribute(x.name)!==x.value)a.setAttribute(x.name,x.value)}}
function patchNode(a,b,ctx){
 if(a.nodeType!==1){if(a.nodeValue!==b.nodeValue)a.nodeValue=b.nodeValue;return}
 const isField=/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName),keep=ctx.preserve&&(dirty.has(a)||document.activeElement===a)&&!action;
 const value=isField?a.value:null,checked=a.checked,oldDefault=a.defaultValue;
 if(a.isEqualNode(b)){if(isField)restoreDraft(a);return}
 syncAttrs(a,b,ctx.preserve);
 if(a.tagName==='TEXTAREA'){
   if(a.defaultValue!==b.defaultValue)a.defaultValue=b.defaultValue;
   a.value=keep?value:b.value;
 }else if(a.tagName==='INPUT'){
   if(a.type!=='file'){
     if(keep){a.value=value;if(/^(checkbox|radio)$/.test(a.type))a.checked=checked}
     else{a.value=b.value;a.checked=b.checked;dirty.delete(a)}
   }
 }else{
   patchChildren(a,b,ctx);
   if(a.tagName==='SELECT'){if(keep&&Array.from(a.options).some(o=>o.value===value))a.value=value;else a.value=b.value}
 }
 if(isField)restoreDraft(a);
}
function patchChildren(parent,next,ctx){
 let cursor=parent.firstChild;
 for(const incoming of Array.from(next.childNodes)){
   let node=null;
   if(incoming.nodeType===1&&incoming.id){const candidate=ctx.ids.get(incoming.id);if(candidate&&!ctx.used.has(candidate)&&sameType(candidate,incoming))node=candidate}
   else if(cursor&&!(cursor.nodeType===1&&cursor.id)&&sameType(cursor,incoming))node=cursor;
   if(!node)node=incoming.cloneNode(false);
   ctx.used.add(node);
   if(node!==cursor)parent.insertBefore(node,cursor);
   patchNode(node,incoming,ctx);
   cursor=node.nextSibling;
 }
 while(cursor){const following=cursor.nextSibling;cursor.remove();cursor=following}
}
function context(){try{return [typeof activeTab==='string'?activeTab:'login',document.documentElement.lang,typeof selectedStudentEmail==='string'?selectedStudentEmail:'',owner()].join('|')}catch(_){return'login'}}
function update(root,html){
 if(!root)return;
 if(composing&&root.contains(document.activeElement)){pending={root,html};return}
 const view=context(),preserve=lastContext===view;lastContext=view;
 const t=document.createElement('template');t.innerHTML=html;
 const focused=document.activeElement,selection=focused&&typeof focused.selectionStart==='number'?[focused.selectionStart,focused.selectionEnd,focused.selectionDirection]:null;
 const y=window.scrollY,x=window.scrollX;
 const scroll=preserve?Array.from(root.querySelectorAll('*')).filter(n=>n.scrollTop||n.scrollLeft).map(n=>[n,n.scrollTop,n.scrollLeft]):[];
 const ids=new Map();root.querySelectorAll('[id]').forEach(n=>{if(!ids.has(n.id))ids.set(n.id,n)});
 patchChildren(root,t.content,{ids,used:new Set(),preserve});
 root.querySelectorAll('input,textarea').forEach(restoreDraft);
 if(preserve){
   if(focused?.isConnected&&focused!==document.activeElement){try{focused.focus({preventScroll:true})}catch(_){}}
   if(focused?.isConnected&&selection){try{focused.setSelectionRange(...selection)}catch(_){}}
   for(const [n,top,left] of scroll){if(n.isConnected){if(n.scrollTop!==top)n.scrollTop=top;if(n.scrollLeft!==left)n.scrollLeft=left}}
   if(window.scrollY!==y||window.scrollX!==x)window.scrollTo(x,y);
 }
 renderCount++;
 document.dispatchEvent(new CustomEvent('nh7:admin-render',{detail:{version:VERSION,preserve}}));
}
function loading(value){const el=document.getElementById('adminApp');if(el)el.setAttribute('aria-busy',String(!!value));let n=document.getElementById('nh7AdminLoadStatus');if(!n){n=document.createElement('div');n.id='nh7AdminLoadStatus';n.setAttribute('role','status');n.style.cssText='position:fixed;bottom:10px;left:10px;z-index:180;background:#eef8f7;color:#0f766e;border:1px solid #cfe4e2;border-radius:10px;padding:7px 12px;font-size:13px;pointer-events:none';document.body.appendChild(n)}n.hidden=!value;n.textContent=label('در حال دریافت اطلاعات؛ پنل قابل استفاده است.','Loading data; the panel remains available.','Učitavanje podataka; panel je dostupan.')}
function installNetwork(){if(networkInstalled||typeof authFetch!=='function')return;networkInstalled=true;const original=authFetch;const wrapped=function(path,opt={}){
 const method=String(opt.method||'GET').toUpperCase();
 const read=method==='GET'||(method==='POST'&&/\/rpc\/nh7_admin_(?:registration_feed_v3|school_assignments_feed(?:_v\d+)?|auth_user_count|student_(?:profile|activity|school_profile)_v\d+)$/.test(path));
 const key=String(typeof token!=='undefined'?token:'')+'|'+method+'|'+path+'|'+String(opt.body||'');
 if(read&&readInflight.has(key))return readInflight.get(key);
 const p=Promise.resolve().then(()=>original(path,opt));
 if(read){readInflight.set(key,p);p.finally(()=>{if(readInflight.get(key)===p)readInflight.delete(key)}).catch(()=>{})}
 return p;
 };wrapped.__nh7UI439=true;authFetch=window.authFetch=wrapped}
function installReview(){
 if(typeof window.nh7ReviewAssignmentV311!=='function'||window.nh7ReviewAssignmentV311.__nh7UI439)return;
 // Preserve the existing server RPC (including its student notification and scoring behavior).
 const review=async(id,status)=>{
   if(saving.has(id))return saving.get(id);
   const field=document.getElementById('v311_feedback_'+id),scoreEl=document.getElementById('v311_score_'+id);
   const raw=String(scoreEl?.value??''),score=Number(raw),feedback=String(field?.value??'');
   if(!raw.trim()||!Number.isFinite(score)||!Number.isInteger(score)||score<0||score>100){alert(label('نمره باید یک عدد صحیح بین ۰ و ۱۰۰ باشد.','Enter a whole-number score from 0 to 100.','Unesite cijeli broj od 0 do 100.'));scoreEl?.focus();return}
   if(status==='needs_revision'&&!feedback.trim()){alert(label('برای درخواست اصلاح، توضیح بنویسید.','Write revision instructions.','Napišite upute za doradu.'));field?.focus();return}
   const submitted={score:raw,feedback};const uid=owner();
   const buttons=Array.from(field?.closest('article')?.querySelectorAll('button')||[]);buttons.forEach(b=>b.disabled=true);
   const task=(async()=>{try{
     const rawResult=await adminRpc('nh7_admin_review_assignment_v237',{p_id:id,p_status:status,p_score:score,p_feedback:feedback.trim()});
     if(owner()!==uid)return;
     let result=rawResult;while(Array.isArray(result)&&result.length===1)result=result[0];
     const updated=result?.assignment||{status,score_percent:score,admin_feedback:feedback.trim()};
     const row=(state.schoolAssignments||[]).find(a=>String(a.id)===String(id));if(row)Object.assign(row,updated);
     acknowledge(id,submitted);
     // A later keystroke during the save remains a draft and is never acknowledged away.
     if(field?.value===submitted.feedback){field.value=feedback.trim();field.defaultValue=feedback.trim();dirty.delete(field)}
     if(scoreEl?.value===submitted.score){scoreEl.defaultValue=raw;dirty.delete(scoreEl)}
     const selected=typeof selectedStudentEmail==='string'?selectedStudentEmail:'';
     await Promise.allSettled([window.nh7LoadAssignmentsV311?.(),selected?window.nh7LoadStudentV311?.(selected):Promise.resolve()]);
     if(typeof render==='function')render();
   }catch(error){alert(error?.message||String(error))}finally{saving.delete(id);buttons.forEach(b=>{if(b.isConnected)b.disabled=false})}})();
   saving.set(id,task);return task;
 };review.__nh7UI439=true;window.nh7ReviewAssignmentV311=review;
}
document.addEventListener('input',e=>{if(e.target.matches?.('input:not([type="password"]):not([type="file"]),textarea,select'))record(e.target)},true);
document.addEventListener('change',e=>{if(e.target.matches?.('input:not([type="password"]),textarea,select'))record(e.target)},true);
document.addEventListener('click',e=>{if(e.target.closest?.('button,a,[onclick]')){action=true;queueMicrotask(()=>{action=false})}},true);
document.addEventListener('compositionstart',()=>{composing=true},true);
document.addEventListener('compositionend',()=>{composing=false;const p=pending;pending=null;if(p)queueMicrotask(()=>update(p.root,p.html))},true);
window.addEventListener('pagehide',persist);
window.addEventListener('beforeunload',e=>{if(memory.size||Array.from(document.querySelectorAll('input[type="file"]')).some(i=>i.files?.length)){persist();e.preventDefault();e.returnValue=''}});
document.addEventListener('nh7:admin-render',()=>{installNetwork();installReview()});
window.NH7AdminUI={version:VERSION,update,loading,installNetwork,installReview,clearPrivateDrafts,hasDrafts:()=>memory.size>0,get renderCount(){return renderCount}};
})();
