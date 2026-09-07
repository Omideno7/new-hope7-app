/* New Hope 7 Admin 4.4.7 — preserve scroll, open details and unsaved fields across background renders. */
(()=>{'use strict';
if(window.__NH7_ADMIN_FULL_STABILITY_V447__)return;window.__NH7_ADMIN_FULL_STABILITY_V447__=true;
const VERSION='4.4.7';
let lastInteraction=0,explicitUntil=0,pendingLoad=false,pendingTimer=0;
const fieldSelector='input:not([type="password"]):not([type="file"]),textarea,select,[contenteditable="true"]';
const busy=()=>Date.now()-lastInteraction<1800||!!document.activeElement?.matches?.(fieldSelector);
const mark=()=>{lastInteraction=Date.now()};
['input','change','focusin','touchstart','pointerdown','keydown'].forEach(type=>document.addEventListener(type,mark,true));
window.addEventListener('scroll',mark,{passive:true});
document.addEventListener('click',e=>{if(e.target.closest?.('button,a,[onclick]'))explicitUntil=Date.now()+400},true);
function requestId(node){const card=node?.closest?.('.request-card');if(!card)return'';if(card.dataset.nh7RecordId)return card.dataset.nh7RecordId;const raw=Array.from(card.querySelectorAll('[onclick]')).map(x=>x.getAttribute('onclick')||'').join(' ');return(raw.match(/[0-9a-f]{8}-[0-9a-f-]{27,}/i)||[])[0]||''}
function key(el,index){if(el.id)return'id:'+el.id;if(el.dataset?.nh7StableKey)return'key:'+el.dataset.nh7StableKey;const rid=requestId(el);if(rid){const role=el.matches('details')?'details':el.getAttribute('name')||el.getAttribute('placeholder')||el.tagName;return'req:'+rid+':'+role}const panel=el.closest?.('.panel-card');const p=panel?Array.from(document.querySelectorAll('.panel-card')).indexOf(panel):-1;return'path:'+p+':'+el.tagName+':'+(el.getAttribute('name')||'')+':'+index}
function snapshot(root){const y=window.scrollY,x=window.scrollX,active=document.activeElement;const values=new Map(),opens=new Set();let ai=null,sel=null;
 root?.querySelectorAll?.(fieldSelector).forEach((el,i)=>{if(el.matches('[readonly],[disabled]'))return;const k=key(el,i);values.set(k,el.isContentEditable?el.textContent:el.type==='checkbox'||el.type==='radio'?!!el.checked:el.value);if(el===active){ai=k;if(typeof el.selectionStart==='number')sel=[el.selectionStart,el.selectionEnd,el.selectionDirection]}});
 root?.querySelectorAll?.('details[open]').forEach((el,i)=>opens.add(key(el,i)));
 let anchor=null,offset=0;const candidates=[...(root?.querySelectorAll?.('.request-card[id],.request-card,.panel-card[id],[data-nh7-stable-key]')||[])];for(const el of candidates){const r=el.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight){anchor=el.id?('id:'+el.id):(requestId(el)?'reqcard:'+requestId(el):null);offset=r.top;break}}
 return{y,x,values,opens,ai,sel,anchor,offset};}
function restore(root,s){if(!root||!s)return;root.querySelectorAll(fieldSelector).forEach((el,i)=>{if(el.matches('[readonly],[disabled]'))return;const k=key(el,i);if(!s.values.has(k))return;const v=s.values.get(k);if(el.type==='checkbox'||el.type==='radio')el.checked=!!v;else if(el.isContentEditable)el.textContent=String(v??'');else el.value=String(v??'')});
 root.querySelectorAll('details').forEach((el,i)=>{const k=key(el,i);if(s.opens.has(k))el.open=true});
 let focus=null;root.querySelectorAll(fieldSelector).forEach((el,i)=>{if(key(el,i)===s.ai)focus=el});if(focus){try{focus.focus({preventScroll:true});if(s.sel&&typeof focus.setSelectionRange==='function')focus.setSelectionRange(...s.sel)}catch(_){}}
 requestAnimationFrame(()=>requestAnimationFrame(()=>{let done=false;if(s.anchor){let el=null;if(s.anchor.startsWith('id:'))el=document.getElementById(s.anchor.slice(3));else if(s.anchor.startsWith('reqcard:')){const id=s.anchor.slice(8);el=[...root.querySelectorAll('.request-card')].find(x=>requestId(x)===id)||null}if(el){const dy=el.getBoundingClientRect().top-s.offset;if(Math.abs(dy)>1)window.scrollBy(0,dy);done=true}}if(!done&&Math.abs(window.scrollY-s.y)>2)window.scrollTo(s.x,s.y)}))}
function installUpdate(){const ui=window.NH7AdminUI;if(!ui||typeof ui.update!=='function'||ui.update.__nh7Full447)return;const old=ui.update.bind(ui);const fn=function(root,html){const s=root?snapshot(root):null;const out=old(root,html);restore(root,s);return out};fn.__nh7Full447=true;ui.update=fn}
function installCards(){if(typeof window.renderRequestCard==='function'&&!window.renderRequestCard.__nh7Full447){const old=window.renderRequestCard;const fn=function(r){let html=old.apply(this,arguments);const id=String(r?.id||'').replace(/[^a-zA-Z0-9_-]/g,'');if(id){html=html.replace('<article class="request-card">','<article class="request-card" id="nh7-request-'+id+'" data-nh7-record-id="'+id+'">').replace('<details class="detail-box">','<details class="detail-box" id="nh7-request-details-'+id+'">')}return html};fn.__nh7Full447=true;window.renderRequestCard=fn;try{renderRequestCard=fn}catch(_){}}}
function installLoad(){if(typeof window.loadAll!=='function'||window.loadAll.__nh7Full447)return;const old=window.loadAll;const fn=function(...args){const explicit=Date.now()<explicitUntil;if(!explicit&&busy()){pendingLoad=true;clearTimeout(pendingTimer);pendingTimer=setTimeout(()=>{if(!busy()&&pendingLoad){pendingLoad=false;old.call(window,true)}},2100);return Promise.resolve(null)}return old.apply(this,args)};fn.__nh7Full447=true;window.loadAll=fn;try{loadAll=fn}catch(_){}}
function install(){installUpdate();installCards();installLoad();document.documentElement.dataset.nh7AdminStability=VERSION}
new MutationObserver(()=>install()).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('nh7:admin-render',install);window.addEventListener('pageshow',install);setTimeout(install,0);setTimeout(install,500);
window.NH7_ADMIN_FULL_STABILITY_VERSION=VERSION;
})();
