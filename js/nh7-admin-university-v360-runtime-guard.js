/* New Hope 7 v3.6.0 — classic-script bindings required by legacy inline handlers. */
var selected=null;
var certDraft={_rowId:''};
(()=>{'use strict';
function patch(){const clear=document.querySelector('.nh7-v360-toolbar .btn.ghost');if(clear&&!clear.dataset.v360Fixed){clear.dataset.v360Fixed='1';clear.onclick=()=>{try{studentSearch='';studentFilter='all'}catch(_){}window.nh7V360CloseQuick?.()}}new MutationObserver(()=>requestAnimationFrame(patch)).observe(document.documentElement,{childList:true,subtree:true});setTimeout(patch,300);window.NH7_ADMIN_UNIVERSITY_GUARD_VERSION='3.6.0';
})();
