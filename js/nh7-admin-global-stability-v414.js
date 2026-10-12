/* New Hope 7 Admin v4.1.4 — global form/scroll stability guard. */
(()=>{'use strict';
if(window.__NH7_ADMIN_GLOBAL_STABILITY_V414__)return;window.__NH7_ADMIN_GLOBAL_STABILITY_V414__=true;
let pending=false,internal=false,lastY=0,editing=false,wrapRender=null,wrapLoad=null,flushTimer=0;
const isField=el=>!!el?.matches?.('input:not([type="button"]):not([type="submit"]),textarea,select,[contenteditable="true"]');
const inAdmin=el=>!!el?.closest?.('.admin-shell,body');
function activeEditing(){const el=document.activeElement;return isField(el)&&inAdmin(el)}
function remember(){lastY=window.scrollY||0}
function restore(){const y=lastY;requestAnimationFrame(()=>requestAnimationFrame(()=>{if(internal)return;internal=true;try{window.scrollTo({top:y,left:window.scrollX,behavior:'auto'})}finally{requestAnimationFrame(()=>{internal=false})}}))}
function scheduleFlush(){clearTimeout(flushTimer);flushTimer=setTimeout(()=>{if(activeEditing())return;if(!pending)return;pending=false;try{if(typeof window.render==='function'){remember();window.render();restore()}}catch(e){console.warn('[NH7 stability flush]',e)}},550)}
function bind(){
  if(typeof window.render==='function'&&window.render!==wrapRender&&!window.render.__nh7GlobalStableV414){const old=window.render;const fn=function(...args){if(activeEditing()){pending=true;scheduleFlush();return null}remember();const out=old.apply(this,args);restore();return out};fn.__nh7GlobalStableV414=true;fn.__nh7Prev=old;window.render=fn;try{render=fn}catch(_){}wrapRender=fn}
  if(typeof window.loadAll==='function'&&window.loadAll!==wrapLoad&&!window.loadAll.__nh7GlobalStableV414){const old=window.loadAll;const fn=async function(...args){if(activeEditing()){pending=true;scheduleFlush();return null}remember();const out=await old.apply(this,args);restore();return out};fn.__nh7GlobalStableV414=true;fn.__nh7Prev=old;window.loadAll=fn;try{loadAll=fn}catch(_){}wrapLoad=fn}
}
document.addEventListener('focusin',e=>{if(isField(e.target)&&inAdmin(e.target)){editing=true;remember()}},true);
document.addEventListener('input',e=>{if(isField(e.target)&&inAdmin(e.target)){editing=true;remember()}},true);
document.addEventListener('focusout',e=>{if(isField(e.target)&&inAdmin(e.target)){editing=false;remember();scheduleFlush()}},true);
window.addEventListener('scroll',()=>{if(!internal)lastY=window.scrollY||0},{passive:true});
setInterval(bind,700);setTimeout(bind,50);window.NH7_ADMIN_GLOBAL_STABILITY_VERSION='4.1.4';
})();
