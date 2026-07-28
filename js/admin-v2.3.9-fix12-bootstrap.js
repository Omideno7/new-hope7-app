/* New Hope 7 Admin v3.1.2 — one-time feature bootstrap without observers/timers */
(()=>{'use strict';
const VERSION='3.1.2-bootstrap';
function mountLibrary(){if(typeof activeTab==='undefined'||activeTab!=='library')return;const panel=document.querySelector('[data-nh7-reader-v311]'),editor=document.getElementById('nh7_library_editor_v224');if(panel&&editor&&!editor.contains(panel)){const drop=editor.querySelector('.file-drop');if(drop)drop.insertAdjacentElement('afterend',panel);else editor.appendChild(panel)}}
try{if(typeof render==='function'&&!render.__nh7Fix12Bridge){const old=render;const wrapped=function(...args){const out=old.apply(this,args);requestAnimationFrame(mountLibrary);return out};wrapped.__nh7Fix12Bridge=true;render=wrapped}}catch(error){console.warn('Fix12 render bridge',error)}
try{if(typeof openStudentDashboard==='function')window.openStudentDashboard=openStudentDashboard;if(typeof renderStudentModal==='function')window.renderStudentModal=renderStudentModal}catch(error){console.warn('Fix12 student bridge',error)}
window.NH7_ADMIN_FIX12_BOOTSTRAP_VERSION=VERSION;
requestAnimationFrame(()=>{try{if(typeof render==='function')render();const requested=new URL(location.href).searchParams.get('tab');if(requested&&typeof activeTab!=='undefined'&&requested!==activeTab&&typeof setTab==='function')setTab(requested);mountLibrary()}catch(error){console.error('Fix12 initial render',error)}});
})();
