/* New Hope 7 v3.6.0 — classic-script bindings + mobile/QA safety guards. */
var selected=null;
var certDraft={_rowId:''};
(()=>{'use strict';
let searchWrapped=false,issueWrapped=false;
function stabilizeSearch(){
  if(searchWrapped||typeof window.nh7V360StudentSearch!=='function')return;
  window.nh7V360StudentSearch=function(value){
    const q=String(value||'').trim().toLowerCase();
    try{studentSearch=value}catch(_){}
    document.querySelectorAll('.nh7-v360-student-row').forEach(row=>{
      const hay=String(row.textContent||'').toLowerCase();
      row.style.display=!q||hay.includes(q)?'grid':'none';
    });
  };
  searchWrapped=true;
}
function protectQaIssue(){
  if(issueWrapped||!window.NH7_ADMIN_RC_V360||typeof window.nh7V360IssueCertificate!=='function')return;
  window.nh7V360IssueCertificate=function(){
    alert(document.documentElement.lang==='fa'?'QA: پیش‌نمایش مدرک فعال است، اما در نسخه آزمایشی هیچ مدرک رسمی صادر یا تغییر داده نمی‌شود.':document.documentElement.lang==='hr'?'QA: pregled potvrde je aktivan, ali se u testnoj verziji ne izdaje niti mijenja službena potvrda.':'QA: certificate preview is active, but no official certificate is issued or changed in the test build.');
  };
  issueWrapped=true;
}
function patch(){
  stabilizeSearch();protectQaIssue();
  const clear=document.querySelector('.nh7-v360-toolbar .btn.ghost');
  if(clear&&!clear.dataset.v360Fixed){
    clear.dataset.v360Fixed='1';
    clear.onclick=()=>{
      try{studentSearch='';studentFilter='all'}catch(_){}
      const input=document.getElementById('studentSearchInput');if(input)input.value='';
      document.querySelectorAll('.nh7-v360-student-row').forEach(row=>row.style.display='grid');
      window.nh7V360CloseQuick?.();
    };
  }
}
new MutationObserver(()=>requestAnimationFrame(patch)).observe(document.documentElement,{childList:true,subtree:true});
setInterval(patch,500);setTimeout(patch,100);window.NH7_ADMIN_UNIVERSITY_GUARD_VERSION='3.6.0';
})();
