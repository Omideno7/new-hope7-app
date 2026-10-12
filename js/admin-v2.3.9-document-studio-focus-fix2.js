/* New Hope 7 Admin v2.3.9 — preserve certificate field focus after asynchronous studio remount */
(()=>{'use strict';
const VERSION='2.3.9-document-focus-fix2';
function isField(el){
  if(!el||!el.matches?.('input:not([type="range"]):not([type="color"]):not([type="file"]):not([type="checkbox"]),textarea'))return false;
  return !!el.closest('.certificate-admin-grid,.nh7-doc-studio-v239');
}
function selectorKey(el){return el?.id?{type:'id',value:el.id}:el?.dataset?.nh7Contact?{type:'contact',value:el.dataset.nh7Contact}:null}
function find(key){if(!key)return null;return key.type==='id'?document.getElementById(key.value):document.querySelector(`[data-nh7-contact="${CSS.escape(key.value)}"]`)}
function capture(){
  const active=document.activeElement;if(!isField(active))return null;
  const values=[];
  document.querySelectorAll('.certificate-admin-grid input[id],.certificate-admin-grid textarea[id],[data-nh7-contact]').forEach(el=>{const key=selectorKey(el);if(key)values.push([key,el.value])});
  let start=null,end=null;try{start=active.selectionStart;end=active.selectionEnd}catch(_){}
  return{key:selectorKey(active),values,start,end,x:window.scrollX,y:window.scrollY};
}
function restore(snapshot,attempt=0){
  if(!snapshot)return;
  for(const [key,value] of snapshot.values||[]){const el=find(key);if(el&&el.value!==value)el.value=value}
  const active=find(snapshot.key);
  if(!active&&attempt<8){setTimeout(()=>restore(snapshot,attempt+1),25);return}
  if(active){try{active.focus({preventScroll:true});if(snapshot.start!=null&&typeof active.setSelectionRange==='function')active.setSelectionRange(snapshot.start,snapshot.end)}catch(_){}}
  window.scrollTo(snapshot.x||0,snapshot.y||0);
}
if(typeof render==='function'&&!render.__nh7DocFocusFix2){
  const previous=render;
  const wrapped=function(...args){const snapshot=capture(),result=previous.apply(this,args);if(snapshot)requestAnimationFrame(()=>requestAnimationFrame(()=>restore(snapshot)));return result};
  wrapped.__nh7DocFocusFix2=true;render=wrapped;
}
window.NH7_ADMIN_DOCUMENT_FOCUS_FIX_VERSION=VERSION;
})();